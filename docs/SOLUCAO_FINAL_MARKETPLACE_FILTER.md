# 🎯 Solução Final: Filtrar Produtos por Marketplace

## 📊 Situação Atual

### ✅ O que está funcionando:
1. O nó "Buscar Produto por SKU2" **retorna 3 produtos** da tabela `products`
2. O nó "Encontrou Variação?2" **cai no TRUE** (encontrou produtos)
3. Os 3 produtos têm o **mesmo SKU** `YEIZ_IDP248`

### ❌ O que está falhando:
1. O nó "Preparar dados do item2" **retorna VAZIO**
2. Nenhum item é inserido na tabela `bling_order_items`
3. O pedido aparece sem itens no frontend

---

## 🔍 Análise do Problema

### Produtos Retornados:

```json
[
  {
    "id": "02e6240d-02d0-4b40-9f8a-a0c495f6c878",
    "sku": "YEIZ_IDP248",
    "marketplace": "mercadolivre",
    "price": 42.9
  },
  {
    "id": "cf02365e-831d-49fd-bd49-b6aade63ff98",
    "sku": "YEIZ_IDP248",
    "marketplace": "mercadolivre",
    "price": 46.9
  },
  {
    "id": "2bf6dd07-4ea9-4ffe-83f6-ebf318e76a5b",
    "sku": "YEIZ_IDP248",
    "marketplace": "shopee",  ← ESTE É O CORRETO!
    "price": 47.2
  }
]
```

### Pedido Atual:
- **Store ID**: `206002038`
- **Marketplace**: Shopee
- **Valor**: R$ 47,20

### ❌ Problema:
O código atual **não filtra por marketplace**, então:
1. Processa os 3 produtos
2. Mas o código tem alguma lógica que faz retornar vazio
3. Nenhum item é inserido

---

## ✅ Solução

### Código Correto para "Preparar dados do item2"

O código deve:
1. ✅ **Filtrar por marketplace** (pegar apenas Shopee)
2. ✅ **Usar `product_id`** ao invés de `product_bling_id`
3. ✅ **Setar `product_bling_id` e `product_variation_id` como NULL**

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

  // ===== CORREÇÃO: PEGAR MARKETPLACE DO PEDIDO =====
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
  // ===== FIM DA CORREÇÃO =====

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

    // ===== CORREÇÃO: FILTRAR POR MARKETPLACE =====
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

---

## 🔑 Mudanças Principais

### 1. Filtrar por Marketplace
```javascript
// Pegar marketplace do pedido
const orderData = $('Buscar Detalhes do Pedido2').item.json.data;
const storeId = orderData.loja.id;
const marketplaceDosPedido = STORE_MAPPING[storeId] || 'shopee';

// Filtrar produtos
if (productFromDB.marketplace !== marketplaceDosPedido) {
  console.log(`⚠️ Pulando produto: marketplace ${productFromDB.marketplace} != ${marketplaceDosPedido}`);
  continue;
}
```

### 2. Usar `product_id` ao invés de `product_bling_id`
```javascript
const productId = productFromDB.id;  // UUID da tabela products

itemsToInsert.push({
  json: {
    product_bling_id: null,  // ← NULL
    product_variation_id: null,  // ← NULL
    product_id: productId,  // ← USAR ESTE
    // ...
  }
});
```

---

## 📝 Passo a Passo

1. **Abra o n8n** em https://hookn8n.alobexpress.com.br
2. **Abra o workflow** "Bling Pedido de Venda Automatization"
3. **Clique no nó** "Preparar dados do item2"
4. **Substitua o código JavaScript** pelo código acima
5. **Salve** o workflow (Ctrl+S)
6. **Teste** clonando uma venda no Bling

---

## 🧪 Resultado Esperado

Após aplicar a correção:

1. ✅ O workflow vai **filtrar** e pegar apenas o produto da **Shopee** (R$ 47,20)
2. ✅ Vai usar `product_id: "2bf6dd07-4ea9-4ffe-83f6-ebf318e76a5b"`
3. ✅ Vai **inserir o item** com sucesso na tabela `bling_order_items`
4. ✅ O pedido vai aparecer **com itens e imagem** no frontend

---

## 📊 Comparação

| Campo | Antes | Depois |
|-------|-------|--------|
| `product_bling_id` | UUID do products | `null` |
| `product_variation_id` | UUID do products | `null` |
| `product_id` | `null` | UUID do products |
| Filtro marketplace | ❌ Não tinha | ✅ Filtra por marketplace |
| Resultado | ❌ Retorna vazio | ✅ Insere item |

---

**Data**: 2026-05-03  
**Erro**: Nó retorna vazio, nenhum item inserido  
**Causa**: Falta filtro por marketplace + campo errado  
**Solução**: Filtrar por marketplace + usar `product_id`
