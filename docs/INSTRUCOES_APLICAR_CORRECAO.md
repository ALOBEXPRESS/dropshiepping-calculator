# 📋 Instruções: Como Aplicar a Correção no n8n

## 🎯 Objetivo
Fazer o workflow processar tanto **produtos simples** quanto **variações de produtos**.

---

## 🔧 Mudança 1: Atualizar "Buscar Produto por SKU2"

### Passo a Passo:

1. **Abrir n8n**: https://hookn8n.alobexpress.com.br
2. **Abrir workflow**: "Bling Pedido de Venda Automatization"
3. **Encontrar o nó**: "Buscar Produto por SKU2"
4. **Clicar no nó** para abrir as configurações

### Opção A: Trocar para Postgres Node (RECOMENDADO)

1. **Deletar** o nó atual "Buscar Produto por SKU2"
2. **Adicionar** um novo nó "Postgres"
3. **Configurar**:
   - **Credential**: Usar a mesma credencial do Supabase
   - **Operation**: Execute Query
   - **Query**:
   ```sql
   SELECT 
     id,
     sku,
     'simple' as product_type,
     marketplace,
     price as sale_price,
     null::bigint as product_bling_id,
     null as variacao_nome
   FROM products
   WHERE sku = $1

   UNION ALL

   SELECT 
     id,
     sku,
     'variation' as product_type,
     null as marketplace,
     sale_price::numeric as sale_price,
     product_bling_id,
     variacao_nome
   FROM products_variations_bling
   WHERE sku = $1
   ```
   - **Query Parameters**: `$1` = `{{ $json.codigo }}`

4. **Reconectar** as conexões:
   - Input: "Preparar Itens do pedido2"
   - Output TRUE: "Encontrou Variação?2"
   - Output FALSE: "Buscar em Products Bling (Fallback)2"

### Opção B: Usar Execute Query no Supabase Node

Se não conseguir usar Postgres node:

1. **Clicar** no nó "Buscar Produto por SKU2"
2. **Trocar Operation** para "Execute Query"
3. **Colar a query** acima
4. **Configurar parâmetros**

---

## 🔧 Mudança 2: Atualizar "Preparar dados do item2"

### Passo a Passo:

1. **Encontrar o nó**: "Preparar dados do item2"
2. **Clicar no nó** para abrir as configurações
3. **Substituir TODO o código JavaScript** pelo código abaixo:

```javascript
try {
  const allProductsFromDB = $input.all();
  console.log('=== DEBUG PREPARAR DADOS DO ITEM ===');
  console.log('Total de produtos do banco:', allProductsFromDB.length);

  const todosItens = $('Preparar Itens do pedido2').all();
  console.log('Total de itens do pedido:', todosItens.length);

  // Buscar o order_id (UUID)
  let orderId = null;

  try {
    if ($('Inserir Pedido2').isExecuted) {
      orderId = $('Inserir Pedido2').first().json.id;
    }
  } catch (e) {
    console.log('Inserir Pedido2 não executado');
  }

  try {
    if (!orderId && $('Atualizar Pedido2').isExecuted) {
      orderId = $('Atualizar Pedido2').first().json.id;
    }
  } catch (e) {
    console.log('Atualizar Pedido2 não executado');
  }

  if (!orderId) {
    throw new Error('order_id não encontrado');
  }

  const itemsToInsert = [];

  // Pegar marketplace do pedido
  const orderData = $('Buscar Detalhes do Pedido2').item.json.data;
  const storeId = orderData.loja.id;
  
  const STORE_MAPPING = {
    205833031: 'mercadolivre',
    205785487: 'tiktok',
    205835012: 'mercadolivre',
    205852755: 'shopee',
    206002038: 'shopee',
    205899802: 'facebook',
    205836967: 'site'
  };
  
  const marketplaceDosPedido = STORE_MAPPING[storeId] || 'shopee';
  console.log('Marketplace do pedido:', marketplaceDosPedido);

  for (const productNode of allProductsFromDB) {
    const productFromDB = productNode.json;
    const productSKU = productFromDB.sku;
    const productType = productFromDB.product_type;

    console.log('Processando SKU:', productSKU);
    console.log('Tipo de produto:', productType);

    const itemDoPedido = todosItens.find(item => item.json.codigo === productSKU)?.json;

    if (!itemDoPedido) {
      console.error('ERRO: Item não encontrado para SKU:', productSKU);
      continue;
    }

    // ===== FILTRAR POR MARKETPLACE (APENAS PRODUTOS SIMPLES) =====
    if (productType === 'simple') {
      if (productFromDB.marketplace !== marketplaceDosPedido) {
        console.log(`⚠️ Pulando produto simples: marketplace ${productFromDB.marketplace} != ${marketplaceDosPedido}`);
        continue;
      }
      console.log('✅ Produto simples correto encontrado:', productFromDB.id);
    } else if (productType === 'variation') {
      console.log('✅ Variação de produto encontrada:', productFromDB.id);
    }
    
    // Determinar qual campo usar
    let productId = null;
    let productBlingId = null;
    let productVariationId = null;
    
    if (productType === 'simple') {
      productId = productFromDB.id;
    } else if (productType === 'variation') {
      productVariationId = productFromDB.id;
    }
    
    console.log('product_id:', productId);
    console.log('product_variation_id:', productVariationId);
    
    let blingItemId = null;
    
    if (itemDoPedido.id) {
      blingItemId = parseInt(itemDoPedido.id);
      console.log('✅ bling_item_id do Bling:', blingItemId);
    } else {
      console.warn('⚠️ AVISO: item sem ID do Bling');
      
      if (!itemDoPedido.codigo || itemDoPedido.codigo.trim() === '') {
        blingItemId = Date.now() + Math.floor(Math.random() * 1000);
        console.warn('⚠️ Usando ID temporário:', blingItemId);
      } else {
        const hashCode = itemDoPedido.codigo.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        blingItemId = Math.abs(hashCode);
        
        if (blingItemId === 0) {
          blingItemId = Date.now() + Math.floor(Math.random() * 1000);
        }
        
        console.log('✅ bling_item_id gerado:', blingItemId);
      }
    }

    if (!blingItemId || blingItemId === 0) {
      blingItemId = Date.now() + Math.floor(Math.random() * 1000);
    }

    const quantidade = parseFloat(itemDoPedido.quantidade) || 0;
    const valor = parseFloat(itemDoPedido.valor) || 0;
    const desconto = parseFloat(itemDoPedido.desconto) || 0;
    const totalValue = (quantidade * valor) - desconto;

    itemsToInsert.push({
      json: {
        order_id: orderId,
        bling_item_id: blingItemId,
        product_bling_id: productBlingId,
        product_variation_id: productVariationId,
        product_id: productId,
        code: itemDoPedido.codigo || null,
        description: itemDoPedido.descricao || 'Sem descrição',
        detailed_description: itemDoPedido.descricaoDetalhada || null,
        unit: itemDoPedido.unidade || 'UN',
        quantity: quantidade,
        unit_value: valor,
        discount: desconto,
        total_value: totalValue,
        ipi_rate: parseFloat(itemDoPedido.aliquotaIPI) || 0,
        commission_base: parseFloat(itemDoPedido.comissao?.base) || 0,
        commission_rate: parseFloat(itemDoPedido.comissao?.aliquota) || 0,
        commission_value: parseFloat(itemDoPedido.comissao?.valor) || 0,
        operation_nature_id: itemDoPedido.naturezaOperacao?.id || null
      }
    });
  }

  console.log('Total de itens preparados:', itemsToInsert.length);
  console.log('=============');

  return itemsToInsert;
} catch (error) {
  console.error('ERRO CAPTURADO:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}
```

4. **Clicar em "Execute Node"** para testar
5. **Salvar** o workflow (Ctrl+S)

---

## ✅ Checklist de Verificação

Após aplicar as mudanças:

- [ ] Nó "Buscar Produto por SKU2" retorna campo `product_type`
- [ ] Nó "Preparar dados do item2" detecta `product_type`
- [ ] Produtos simples são filtrados por marketplace
- [ ] Variações NÃO são filtradas por marketplace
- [ ] Workflow salvo com sucesso

---

## 🧪 Como Testar

1. **Clonar uma venda no Bling** que tenha:
   - Produto simples (ex: YEIZ_IDP248)
   - Variação de produto (ex: YEIZ_IDP294_004)

2. **Verificar no frontend** se:
   - Pedido aparece com TODOS os itens
   - Imagens aparecem corretamente
   - Valores estão corretos

3. **Verificar logs do n8n**:
   - Buscar por "Tipo de produto: simple"
   - Buscar por "Tipo de produto: variation"
   - Verificar se não há erros de `bling_item_id null`

---

## 🆘 Troubleshooting

### Erro: "product_type is undefined"
- **Causa**: Query UNION não foi aplicada corretamente
- **Solução**: Verificar se o nó "Buscar Produto por SKU2" está usando a query UNION

### Erro: "bling_item_id null"
- **Causa**: Código JavaScript não foi atualizado
- **Solução**: Copiar novamente o código completo do "Preparar dados do item2"

### Produto não aparece no pedido
- **Causa**: Produto simples com marketplace errado
- **Solução**: Verificar logs para ver qual marketplace foi detectado

---

**Data**: 2026-05-03  
**Autor**: Kiro AI Assistant  
**Workflow**: Bling Pedido de Venda Automatization
