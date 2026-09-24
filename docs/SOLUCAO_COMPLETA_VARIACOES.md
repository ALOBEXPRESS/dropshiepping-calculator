# 🎯 Solução Completa: Produtos Simples + Variações

## 📊 Status Atual

### ✅ Funcionando:
- Produto simples `YEIZ_IDP248` (Shopee) - Pedido #162 aparece com item e imagem

### ❌ Não Funcionando:
- Variação `YEIZ_IDP294_004` (Copo Térmico Roxo)
- Erro: `null value in column "bling_item_id"`
- Causa: Workflow só busca em `products`, mas variações estão em `products_variations_bling`

---

## 🔧 Solução: 2 Alterações no Workflow

### 1️⃣ Atualizar "Buscar Produto por SKU2" (Node ID: a364f200-a2b4-451d-9746-00daa96af367)

**Tipo:** Supabase Node  
**Operação:** Trocar por Postgres Node com query customizada

**Query SQL Atual:**
```sql
SELECT * FROM products WHERE sku = '{{ $json.codigo }}'
```

**Nova Query SQL (UNION):**
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

**Como Aplicar:**
1. Abrir workflow "Bling Pedido de Venda Automatization"
2. Encontrar nó "Buscar Produto por SKU2"
3. Trocar de "Supabase" para "Postgres" node
4. Colar a query acima
5. Configurar parâmetro: `$1` = `{{ $json.codigo }}`

---

### 2️⃣ Atualizar "Preparar dados do item2" (Node ID: ba9d90bd-49a1-4ceb-aacc-94fa0d3d0d4a)

**Tipo:** Code Node (JavaScript)  
**Mudança:** Adicionar lógica para detectar `product_type` e usar campo correto

**Código Completo Atualizado:**

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

---

## 📝 Resumo das Mudanças

### "Buscar Produto por SKU2":
- ✅ Busca em `products` (produtos simples)
- ✅ Busca em `products_variations_bling` (variações)
- ✅ Adiciona campo `product_type` para distinguir
- ✅ Retorna `marketplace` para produtos simples
- ✅ Retorna `product_bling_id` para variações

### "Preparar dados do item2":
- ✅ Detecta `product_type` do resultado
- ✅ Filtra por marketplace APENAS para produtos simples
- ✅ Usa `product_id` para produtos simples
- ✅ Usa `product_variation_id` para variações
- ✅ Mantém `product_bling_id` como NULL

---

## 🧪 Teste Esperado

### Cenário 1: Produto Simples (YEIZ_IDP248)
```
✅ Busca retorna 3 produtos (2 ML, 1 Shopee)
✅ Filtra e pega apenas Shopee
✅ Usa product_id: "2bf6dd07-4ea9-4ffe-83f6-ebf318e76a5b"
✅ Insere com sucesso
```

### Cenário 2: Variação (YEIZ_IDP294_004)
```
✅ Busca retorna 1 variação
✅ NÃO filtra por marketplace (variações não têm)
✅ Usa product_variation_id: "2a90a8ad-f61b-4b4e-909c-c3e9edacc50e"
✅ Insere com sucesso
```

### Cenário 3: Produto Não Existe (C1357PRETOM)
```
❌ Busca retorna vazio
⚠️ Log de erro
⚠️ Pula o item (não quebra o workflow)
```

---

## 🚀 Como Aplicar

1. Abrir n8n: https://hookn8n.alobexpress.com.br
2. Abrir workflow: "Bling Pedido de Venda Automatization"
3. Atualizar "Buscar Produto por SKU2" com a query UNION
4. Atualizar "Preparar dados do item2" com o código JavaScript
5. Salvar workflow (Ctrl+S)
6. Testar clonando uma venda no Bling

---

**Data**: 2026-05-03  
**Status**: Solução completa documentada  
**Próximo Passo**: Aplicar as mudanças no n8n
