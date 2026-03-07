import { supabase } from '../lib/supabase';

/**
 * Sincroniza informações de marketplace dos produtos baseado nos pedidos
 * Atualiza marketplace, account_holder e account_type dos produtos na tabela products
 * baseado nos canais de venda dos pedidos
 */
export async function syncProductMarketplaceInfo(): Promise<{
  success: boolean;
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let updated = 0;

  try {
    // Buscar todos os itens de pedido com informações do canal de venda
    const { data: orderItems, error: itemsError } = await supabase
      .from('bling_order_items')
      .select(`
        product_id,
        order_id,
        bling_orders (
          bling_store_id,
          sales_channels (
            marketplace,
            account_holder,
            account_type
          )
        )
      `)
      .not('product_id', 'is', null);

    if (itemsError) {
      errors.push(`Erro ao buscar itens de pedido: ${itemsError.message}`);
      return { success: false, updated: 0, errors };
    }

    if (!orderItems || orderItems.length === 0) {
      return { success: true, updated: 0, errors: [] };
    }

    // Agrupar por product_id e pegar o canal de venda mais recente
    const productMarketplaceMap = new Map<string, {
      marketplace: string;
      account_holder: string;
      account_type: string;
    }>();

    orderItems.forEach((item) => {
      if (!item.product_id) return;

      const order = Array.isArray(item.bling_orders) ? item.bling_orders[0] : item.bling_orders;
      if (!order) return;

      const salesChannel = Array.isArray(order.sales_channels) 
        ? order.sales_channels[0] 
        : order.sales_channels;
      
      if (!salesChannel) return;

      // Se o produto ainda não foi mapeado, adicionar
      if (!productMarketplaceMap.has(item.product_id)) {
        productMarketplaceMap.set(item.product_id, {
          marketplace: salesChannel.marketplace || 'Desconhecido',
          account_holder: salesChannel.account_holder || 'Sistema',
          account_type: salesChannel.account_type || 'CPF'
        });
      }
    });

    // Atualizar produtos em lote
    for (const [productId, info] of productMarketplaceMap.entries()) {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          marketplace: info.marketplace,
          account_holder: info.account_holder,
          account_type: info.account_type
        })
        .eq('id', productId);

      if (updateError) {
        errors.push(`Erro ao atualizar produto ${productId}: ${updateError.message}`);
      } else {
        updated++;
      }
    }

    return {
      success: errors.length === 0,
      updated,
      errors
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    errors.push(`Erro geral: ${errorMessage}`);
    return { success: false, updated: 0, errors };
  }
}

/**
 * Sincroniza informações de marketplace de um produto específico
 */
export async function syncSingleProductMarketplaceInfo(productId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Buscar o pedido mais recente deste produto
    const { data: orderItem, error: itemError } = await supabase
      .from('bling_order_items')
      .select(`
        product_id,
        bling_orders (
          bling_store_id,
          order_date,
          sales_channels (
            marketplace,
            account_holder,
            account_type
          )
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (itemError) {
      return { success: false, error: itemError.message };
    }

    if (!orderItem) {
      return { success: false, error: 'Nenhum pedido encontrado para este produto' };
    }

    const order = Array.isArray(orderItem.bling_orders) 
      ? orderItem.bling_orders[0] 
      : orderItem.bling_orders;
    
    if (!order) {
      return { success: false, error: 'Pedido não encontrado' };
    }

    const salesChannel = Array.isArray(order.sales_channels) 
      ? order.sales_channels[0] 
      : order.sales_channels;
    
    if (!salesChannel) {
      return { success: false, error: 'Canal de venda não encontrado' };
    }

    // Atualizar o produto
    const { error: updateError } = await supabase
      .from('products')
      .update({
        marketplace: salesChannel.marketplace || 'Desconhecido',
        account_holder: salesChannel.account_holder || 'Sistema',
        account_type: salesChannel.account_type || 'CPF'
      })
      .eq('id', productId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: errorMessage };
  }
}
