# 🎯 Correção: product_id vs product_bling_id

## ❌ Problema Atual

```
insert or update on table "bling_order_items" violates foreign key constraint "bling_order_items_product_bling_id_fkey"
```

### O que está acontecendo:

1. ✅ O nó "Buscar Produto por SKU2" retornou 3 produtos da tabela `products`
2. ❌ O nó "Preparar dados do item2" está usando `product_bling_id` (UUID da tabela `products`)
3. ❌ Mas `product_bling_id` deveria ser um ID da tabela `products_bling` (que não existe)
4. ❌ O banco rejeita porque a foreign key não encontra o ID

## ✅ Solução

Os produtos estão na tabela `products`, então devemos usar `product_id` ao invés de `product_bling_id`.

### Código Corrigido para "Preparar dados do item2"

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

  // Pegar dados do pedido para saber o marketplace
  const orderData = $('Buscar Detalhes do Pedido2').item.json.data;
  const storeId = orderData.loja.id;
  
  console.log('Store ID do pedido:', storeId);
  
  // Mapeamento de store_id para marketplace
  const STORE_MAPPING = {
    205833031: 'mercadolivre',
    205785487: 'tiktok',
    205835012: 'mercadolivre',
    205852755: 'shopee',
    206002038: 'shopee',  // ← Este é o da venda atual
    205899802: 'facebook',
    205836967: 'site'
  };
  
  const marketplaceDosPedido = STORE_MAPPING[storeId] || 'shopee';
  console.log('Marketplace do pedido:', marketplaceDosPedido);

  for (const productNode of allProductsFromDB) {
    const productFromDB = productNode.json;
    const productSKU = productFromDB.sku;

    console.log('Processando SKU:', productSKU);
    console.log('Marketplace do produto:', productFromDB.marketplace);

    const itemDoPedido = todosItens.find(item => item.json.codigo === productSKU)?.json;

    if (!itemDoPedido) {
      console.error('ERRO: Item não encontrado para SKU:', productSKU);
      continue;
    }

    // ===== CORREÇÃO PRINCIPAL =====
    // Verificar se o marketplace do produto corresponde ao do pedido
    if (productFromDB.marketplace !== marketplaceDosPedido) {
      console.log(`⚠️ Pulando produto: marketplace ${productFromDB.marketplace} != ${marketplaceDosPedido}`);
      continue;
    }
    
    console.log('✅ Produto correto encontrado:', productFromDB.id);
    
    // USAR product_id ao invés de product_bling_id
    const productId = productFromDB.id;  // UUID da tabela products
    
    console.log('product_id:', productId);
    // ===== FIM DA CORREÇÃO =====
    
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
        product_bling_id: null,  // ← NULL porque não está em products_bling
        product_variation_id: null,  // ← NULL porque não está em products_variations_bling
        product_id: productId,  // ← USAR O ID DA TABELA PRODUCTS
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

## 🔑 Mudanças Principais:

1. ✅ **Filtrar por marketplace**: Pega apenas o produto do marketplace correto (Shopee)
2. ✅ **Usar `product_id`**: Ao invés de `product_bling_id`
3. ✅ **Setar `product_bling_id` como `null`**: Porque não está em `products_bling`
4. ✅ **Setar `product_variation_id` como `null`**: Porque não está em `products_variations_bling`

## 📝 Passo a Passo:

1. **Abra o n8n**
2. **Abra o workflow** "Bling Pedido de Venda Automatization"
3. **Clique no nó** "Preparar dados do item2"
4. **Substitua o código JavaScript** pelo código acima
5. **Salve** o workflow
6. **Teste** clonando uma venda no Bling

## 🧪 Resultado Esperado:

Após a correção:

1. ✅ O workflow vai filtrar e pegar apenas o produto da Shopee (R$ 47,20)
2. ✅ Vai usar `product_id: "2bf6dd07-4ea9-4ffe-83f6-ebf318e76a5b"`
3. ✅ Vai inserir o item com sucesso
4. ✅ O pedido vai aparecer com itens e imagem no frontend

---

**Data**: 2026-05-03
**Erro**: Foreign key constraint violation
**Solução**: Usar `product_id` ao invés de `product_bling_id`
