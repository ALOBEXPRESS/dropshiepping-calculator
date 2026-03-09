/**
 * Serviço de Sincronização de Pedidos do Bling
 * 
 * Responsável por processar webhooks do Bling e sincronizar pedidos de venda
 * com o banco de dados, incluindo mapeamento de produtos e canais de venda.
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface BlingWebhookPayload {
  eventId: string;
  date: string;
  version: string;
  event: 'order.created' | 'order.updated' | 'order.deleted';
  companyId: string;
  data: {
    id: number;
    data: string;
    numero: number;
    numeroLoja: string;
    total: number;
    contato: { id: number };
    vendedor: { id: number };
    loja: { id: number };
    situacao: { id: number; valor: number };
  };
}

export interface BlingOrderDetail {
  data: {
    id: number;
    numero: number;
    numeroLoja: string;
    data: string;
    dataSaida: string;
    dataPrevista: string;
    totalProdutos: number;
    total: number;
    contato: {
      id: number;
      nome: string;
      tipoPessoa: 'F' | 'J';
      numeroDocumento: string;
    };
    situacao: {
      id: number;
      valor: number;
    };
    loja: {
      id: number;
      unidadeNegocio: { id: number };
    };
    numeroPedidoCompra: string;
    outrasDespesas: number;
    observacoes: string;
    observacoesInternas: string;
    desconto: {
      valor: number;
      unidade: 'REAL' | 'PERCENTUAL';
    };
    categoria: { id: number };
    notaFiscal: { id: number };
    tributacao: {
      totalICMS: number;
      totalIPI: number;
    };
    itens: Array<{
      id: number;
      codigo: string;
      unidade: string;
      quantidade: number;
      desconto: number;
      valor: number;
      aliquotaIPI: number;
      descricao: string;
      descricaoDetalhada: string;
      produto: { id: number };
      comissao: {
        base: number;
        aliquota: number;
        valor: number;
      };
      naturezaOperacao: { id: number };
    }>;
    parcelas: Array<{
      id: number;
      dataVencimento: string;
      valor: number;
      observacoes: string;
      caut: string;
      formaPagamento: { id: number };
    }>;
    transporte: {
      fretePorConta: number;
      frete: number;
      quantidadeVolumes: number;
      pesoBruto: number;
      prazoEntrega: number;
      contato: {
        id: number;
        nome: string;
      };
      etiqueta: {
        nome: string;
        endereco: string;
        numero: string;
        complemento: string;
        municipio: string;
        uf: string;
        cep: string;
        bairro: string;
        nomePais: string;
      };
      volumes: unknown[];
    };
    vendedor: { id: number };
    intermediador: {
      cnpj: string;
      nomeUsuario: string;
    };
    taxas: {
      taxaComissao: number;
      custoFrete: number;
      valorBase: number;
    };
  };
}

export interface SalesChannel {
  id: string;
  bling_store_id: number;
  name: string;
  marketplace: string;
  account_type: 'CPF' | 'CNPJ';
  account_holder: string;
}

// Mapeamento de IDs de loja para canais de venda
export const STORE_ID_MAPPING: Record<number, Omit<SalesChannel, 'id'>> = {
  205833031: {
    bling_store_id: 205833031,
    name: 'MercadoLivre',
    marketplace: 'MercadoLivre',
    account_type: 'CPF',
    account_holder: 'Alyson',
  },
  205785487: {
    bling_store_id: 205785487,
    name: 'TikTok Shop',
    marketplace: 'TikTok',
    account_type: 'CNPJ',
    account_holder: 'Alyson',
  },
  205835012: {
    bling_store_id: 205835012,
    name: 'MercadoLivre Conta II',
    marketplace: 'MercadoLivre',
    account_type: 'CNPJ',
    account_holder: 'Alyson',
  },
  205852755: {
    bling_store_id: 205852755,
    name: 'Shopee',
    marketplace: 'Shopee',
    account_type: 'CPF',
    account_holder: 'Alyson',
  },
  205889400: {
    bling_store_id: 205889400,
    name: 'Shopee Conta 2',
    marketplace: 'Shopee',
    account_type: 'CPF',
    account_holder: 'Jonatan',
  },
  205899802: {
    bling_store_id: 205899802,
    name: 'Facebook',
    marketplace: 'Facebook',
    account_type: 'CPF',
    account_holder: 'Jonatan',
  },
  205836967: {
    bling_store_id: 205836967,
    name: 'Site (Wordpress)',
    marketplace: 'Site',
    account_type: 'CPF',
    account_holder: 'Emelyn',
  },
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Busca o access token válido do Bling
 */
async function getBlingAccessToken(): Promise<string> {
  const { data, error } = await supabase
    .from('bling_tokens')
    .select('access_token, expires_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('Token do Bling não encontrado');
  }

  // Verificar se o token está expirado
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    throw new Error('Token do Bling expirado. Execute o refresh token no n8n.');
  }

  return data.access_token;
}

/**
 * Busca detalhes completos de um pedido na API do Bling
 */
async function fetchBlingOrderDetails(
  orderId: number,
  accessToken: string
): Promise<BlingOrderDetail> {
  const response = await fetch(
    `https://api.bling.com.br/Api/v3/pedidos/vendas/${orderId}`,
    {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Erro ao buscar pedido ${orderId}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Busca ou cria um canal de venda baseado no ID da loja
 */
async function getOrCreateSalesChannel(
  storeId: number,
  organizationId: string
): Promise<string> {
  // Buscar canal existente
  const { data: existing } = await supabase
    .from('sales_channels')
    .select('id')
    .eq('bling_store_id', storeId)
    .single();

  if (existing) {
    return existing.id;
  }

  // Criar novo canal se não existir
  const channelData = STORE_ID_MAPPING[storeId];
  if (!channelData) {
    throw new Error(`Canal de venda não mapeado para loja ID: ${storeId}`);
  }

  const { data: newChannel, error } = await supabase
    .from('sales_channels')
    .insert({
      ...channelData,
      organization_id: organizationId,
    })
    .select('id')
    .single();

  if (error || !newChannel) {
    throw new Error(`Erro ao criar canal de venda: ${error?.message}`);
  }

  return newChannel.id;
}

/**
 * Mapeia produto do Bling com produtos locais
 */
async function mapProductBlingToLocal(
  blingProductId: number,
  itemCode: string
): Promise<{ productBlingId: string | null; productId: string | null; productVariationId: string | null }> {
  // Buscar por ID do Bling em products_bling (produtos pai)
  let { data: productBling } = await supabase
    .from('products_bling')
    .select('id')
    .eq('bling_id', blingProductId)
    .single();

  // Se não encontrar por ID, buscar por SKU em products_bling
  if (!productBling && itemCode) {
    const { data } = await supabase
      .from('products_bling')
      .select('id')
      .eq('sku', itemCode)
      .single();
    productBling = data;
  }

  // Se encontrou em products_bling, retornar
  if (productBling) {
    // Buscar produto local vinculado
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('sku', itemCode)
      .single();

    return { 
      productBlingId: productBling.id, 
      productId: product?.id || null,
      productVariationId: null
    };
  }

  // Se não encontrou em products_bling, buscar em products_variations_bling
  let { data: productVariation } = await supabase
    .from('products_variations_bling')
    .select('id')
    .eq('bling_id', blingProductId)
    .single();

  // Se não encontrar por ID, buscar por SKU em variations
  if (!productVariation && itemCode) {
    const { data } = await supabase
      .from('products_variations_bling')
      .select('id')
      .eq('sku', itemCode)
      .single();
    productVariation = data;
  }

  if (!productVariation) {
    return { productBlingId: null, productId: null, productVariationId: null };
  }

  // Buscar produto local vinculado
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('sku', itemCode)
    .single();

  return {
    productBlingId: null,
    productId: product?.id || null,
    productVariationId: productVariation.id
  };
}

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Processa um webhook do Bling e sincroniza o pedido
 */
export async function processBlingWebhook(
  webhook: BlingWebhookPayload,
  organizationId: string
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const startTime = Date.now();
  
  try {
    console.log(`[Bling Webhook] Processando evento: ${webhook.event}`, {
      orderId: webhook.data.id,
      storeId: webhook.data.loja.id,
    });

    // Registrar log de sincronização
    const logId = await createSyncLog({
      organization_id: organizationId,
      event_type: webhook.event,
      bling_order_id: webhook.data.id,
      marketplace_order_number: webhook.data.numeroLoja,
      bling_store_id: webhook.data.loja.id,
      webhook_data: webhook as unknown as Record<string, unknown>,
      status: 'success',
    });

    // Buscar access token
    const accessToken = await getBlingAccessToken();

    // Buscar detalhes completos do pedido
    const orderDetails = await fetchBlingOrderDetails(webhook.data.id, accessToken);

    // Atualizar log com resposta da API
    await updateSyncLog(logId, { api_response: orderDetails as unknown as Record<string, unknown> });

    // Processar baseado no tipo de evento
    let orderId: string | undefined;

    switch (webhook.event) {
      case 'order.created':
        orderId = await createOrder(orderDetails, organizationId);
        break;
      case 'order.updated':
        orderId = await updateOrder(orderDetails, organizationId);
        break;
      case 'order.deleted':
        orderId = await deleteOrder(webhook.data.id);
        break;
    }

    const duration = Date.now() - startTime;
    console.log(`[Bling Webhook] Sucesso em ${duration}ms`, { orderId });

    return { success: true, orderId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Bling Webhook] Erro:', errorMessage);

    // Registrar erro no log
    await createSyncLog({
      organization_id: organizationId,
      event_type: webhook.event,
      bling_order_id: webhook.data.id,
      marketplace_order_number: webhook.data.numeroLoja,
      bling_store_id: webhook.data.loja.id,
      webhook_data: webhook as unknown as Record<string, unknown>,
      status: 'error',
      error_message: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Cria um novo pedido no banco de dados
 */
async function createOrder(
  orderDetails: BlingOrderDetail,
  organizationId: string
): Promise<string> {
  const order = orderDetails.data;

  // Buscar ou criar canal de venda
  const salesChannelId = await getOrCreateSalesChannel(order.loja.id, organizationId);

  // Inserir pedido
  const { data: newOrder, error: orderError } = await supabase
    .from('bling_orders')
    .insert({
      organization_id: organizationId,
      bling_order_id: order.id,
      order_number: order.numero,
      marketplace_order_number: order.numeroLoja,
      sales_channel_id: salesChannelId,
      bling_store_id: order.loja.id,
      order_date: order.data,
      shipping_date: order.dataSaida !== '0000-00-00' ? order.dataSaida : null,
      expected_date: order.dataPrevista !== '0000-00-00' ? order.dataPrevista : null,
      total_products: order.totalProdutos,
      total_amount: order.total,
      discount_value: order.desconto.valor,
      discount_unit: order.desconto.unidade,
      other_expenses: order.outrasDespesas,
      status_id: order.situacao.id,
      status_value: order.situacao.valor,
      contact_id: order.contato.id,
      contact_name: order.contato.nome,
      contact_type: order.contato.tipoPessoa,
      contact_document: order.contato.numeroDocumento,
      seller_id: order.vendedor.id,
      category_id: order.categoria.id,
      invoice_id: order.notaFiscal.id || null,
      total_icms: order.tributacao.totalICMS,
      total_ipi: order.tributacao.totalIPI,
      observations: order.observacoes,
      internal_observations: order.observacoesInternas,
      purchase_order_number: order.numeroPedidoCompra,
      intermediary_cnpj: order.intermediador.cnpj,
      intermediary_username: order.intermediador.nomeUsuario,
      commission_tax: order.taxas.taxaComissao,
      shipping_cost: order.taxas.custoFrete,
      base_value: order.taxas.valorBase,
      shipping_type: order.transporte.fretePorConta,
      shipping_value: order.transporte.frete,
      volumes_quantity: order.transporte.quantidadeVolumes,
      gross_weight: order.transporte.pesoBruto,
      delivery_days: order.transporte.prazoEntrega,
      label_name: order.transporte.etiqueta.nome,
      label_address: order.transporte.etiqueta.endereco,
      label_number: order.transporte.etiqueta.numero,
      label_complement: order.transporte.etiqueta.complemento,
      label_city: order.transporte.etiqueta.municipio,
      label_state: order.transporte.etiqueta.uf,
      label_zip: order.transporte.etiqueta.cep,
      label_neighborhood: order.transporte.etiqueta.bairro,
      label_country: order.transporte.etiqueta.nomePais,
      raw_data: orderDetails,
      sync_status: 'synced',
      last_sync_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (orderError || !newOrder) {
    throw new Error(`Erro ao criar pedido: ${orderError?.message}`);
  }

  // Inserir itens do pedido
  await createOrderItems(newOrder.id, order.itens);

  // Inserir parcelas
  await createOrderInstallments(newOrder.id, order.parcelas);

  // Atualizar contadores de vendas nos produtos
  await updateProductSalesCounters(order.itens, order.loja.id);

  return newOrder.id;
}

/**
 * Atualiza um pedido existente
 */
async function updateOrder(
  orderDetails: BlingOrderDetail,
  organizationId: string
): Promise<string> {
  const order = orderDetails.data;

  // Verificar se o pedido existe
  const { data: existing } = await supabase
    .from('bling_orders')
    .select('id')
    .eq('bling_order_id', order.id)
    .single();

  if (!existing) {
    // Se não existir, criar
    return createOrder(orderDetails, organizationId);
  }

  // Atualizar pedido
  const { error: updateError } = await supabase
    .from('bling_orders')
    .update({
      status_id: order.situacao.id,
      status_value: order.situacao.valor,
      total_amount: order.total,
      shipping_date: order.dataSaida !== '0000-00-00' ? order.dataSaida : null,
      raw_data: orderDetails,
      sync_status: 'synced',
      last_sync_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  if (updateError) {
    throw new Error(`Erro ao atualizar pedido: ${updateError.message}`);
  }

  return existing.id;
}

/**
 * Remove um pedido (soft delete)
 */
async function deleteOrder(blingOrderId: number): Promise<string> {
  const { data, error } = await supabase
    .from('bling_orders')
    .update({
      sync_status: 'error',
      sync_error: 'Pedido deletado no Bling',
    })
    .eq('bling_order_id', blingOrderId)
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Erro ao deletar pedido: ${error?.message}`);
  }

  return data.id;
}

/**
 * Cria itens do pedido
 */
async function createOrderItems(
  orderId: string,
  items: BlingOrderDetail['data']['itens']
): Promise<void> {
  const itemsToInsert = await Promise.all(
    items.map(async (item) => {
      const { productBlingId, productId, productVariationId } = await mapProductBlingToLocal(
        item.produto.id,
        item.codigo
      );

      return {
        order_id: orderId,
        bling_item_id: item.id,
        product_bling_id: productBlingId,
        product_variation_id: productVariationId,
        product_id: productId,
        code: item.codigo,
        description: item.descricao,
        detailed_description: item.descricaoDetalhada,
        unit: item.unidade,
        quantity: item.quantidade,
        unit_value: item.valor,
        discount: item.desconto,
        total_value: item.valor * item.quantidade - item.desconto,
        ipi_rate: item.aliquotaIPI,
        commission_base: item.comissao.base,
        commission_rate: item.comissao.aliquota,
        commission_value: item.comissao.valor,
        operation_nature_id: item.naturezaOperacao.id || null,
      };
    })
  );

  const { error } = await supabase.from('bling_order_items').insert(itemsToInsert);

  if (error) {
    throw new Error(`Erro ao criar itens do pedido: ${error.message}`);
  }
}

/**
 * Cria parcelas do pedido
 */
async function createOrderInstallments(
  orderId: string,
  installments: BlingOrderDetail['data']['parcelas']
): Promise<void> {
  const installmentsToInsert = installments.map((installment) => ({
    order_id: orderId,
    bling_installment_id: installment.id,
    due_date: installment.dataVencimento,
    value: installment.valor,
    observations: installment.observacoes,
    caut: installment.caut,
    payment_method_id: installment.formaPagamento.id,
  }));

  const { error } = await supabase
    .from('bling_order_installments')
    .insert(installmentsToInsert);

  if (error) {
    throw new Error(`Erro ao criar parcelas: ${error.message}`);
  }
}

/**
 * Atualiza contadores de vendas nos produtos
 */
async function updateProductSalesCounters(
  items: BlingOrderDetail['data']['itens'],
  storeId: number
): Promise<void> {
  const channelInfo = STORE_ID_MAPPING[storeId];
  if (!channelInfo) return;

  const marketplace = channelInfo.marketplace.toLowerCase();

  for (const item of items) {
    const { productId } = await mapProductBlingToLocal(item.produto.id, item.codigo);
    
    if (!productId) continue;

    // Buscar produto atual
    const { data: product } = await supabase
      .from('products')
      .select('mercado_ads_sales_quantity, shopee_sales_quantity, tiktok_ads_sales_quantity')
      .eq('id', productId)
      .single();

    if (!product) continue;

    // Atualizar contador baseado no marketplace
    const updates: Record<string, number> = {};
    
    if (marketplace === 'mercadolivre') {
      updates.mercado_ads_sales_quantity = ((product as Record<string, number>).mercado_ads_sales_quantity || 0) + item.quantidade;
    } else if (marketplace === 'shopee') {
      updates.shopee_sales_quantity = ((product as Record<string, number>).shopee_sales_quantity || 0) + item.quantidade;
    } else if (marketplace === 'tiktok') {
      updates.tiktok_ads_sales_quantity = ((product as Record<string, number>).tiktok_ads_sales_quantity || 0) + item.quantidade;
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('products')
        .update(updates)
        .eq('id', productId);
    }
  }
}

/**
 * Cria um log de sincronização
 */
async function createSyncLog(log: {
  organization_id: string;
  event_type: string;
  bling_order_id: number;
  marketplace_order_number: string;
  bling_store_id: number;
  webhook_data: Record<string, unknown>;
  status: 'success' | 'error' | 'skipped';
  error_message?: string;
  api_response?: Record<string, unknown>;
}): Promise<string> {
  const { data, error } = await supabase
    .from('bling_sync_logs')
    .insert(log)
    .select('id')
    .single();

  if (error || !data) {
    console.error('Erro ao criar log:', error);
    throw new Error('Erro ao criar log de sincronização');
  }

  return data.id;
}

/**
 * Atualiza um log de sincronização
 */
async function updateSyncLog(
  logId: string,
  updates: { api_response?: Record<string, unknown>; error_message?: string; status?: string }
): Promise<void> {
  await supabase.from('bling_sync_logs').update(updates).eq('id', logId);
}

// ============================================================================
// FUNÇÕES DE CONSULTA
// ============================================================================

/**
 * Busca pedidos por período
 */
export async function getOrdersByDateRange(
  organizationId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from('bling_orders')
    .select(`
      *,
      sales_channel:sales_channels(*),
      items:bling_order_items(*),
      installments:bling_order_installments(*)
    `)
    .eq('organization_id', organizationId)
    .gte('order_date', startDate)
    .lte('order_date', endDate)
    .order('order_date', { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar pedidos: ${error.message}`);
  }

  return data;
}

/**
 * Busca pedidos por canal de venda
 */
export async function getOrdersByChannel(
  organizationId: string,
  marketplace: string
) {
  const { data, error } = await supabase
    .from('bling_orders')
    .select(`
      *,
      sales_channel:sales_channels!inner(*)
    `)
    .eq('organization_id', organizationId)
    .eq('sales_channel.marketplace', marketplace)
    .order('order_date', { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar pedidos: ${error.message}`);
  }

  return data;
}

/**
 * Busca estatísticas de vendas por produto
 */
export async function getProductSalesStats(
  organizationId: string,
  productId: string
) {
  const { data, error } = await supabase
    .from('bling_order_items')
    .select(`
      quantity,
      total_value,
      order:bling_orders!inner(
        order_date,
        sales_channel:sales_channels(marketplace)
      )
    `)
    .eq('product_id', productId)
    .eq('order.organization_id', organizationId);

  if (error) {
    throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
  }

  return data;
}
