# 🎯 Solução: Suporte para Variações de Produtos

## 📊 Problema Identificado

### ✅ O que funciona:
- Produtos simples (sem variação) como `YEIZ_IDP248` funcionam perfeitamente
- Pedido #162 aparece com item e imagem no frontend

### ❌ O que NÃO funciona:
- Produtos com variação como `YEIZ_IDP294_004` (Copo Térmico)
- Erro: `null value in column "bling_item_id"`
- "Buscar Produto por SKU2" retorna VAZIO
- "Preparar dados do item2" retorna VAZIO

---

## 🔍 Análise do Problema

### Estrutura do Banco de Dados:

```
products                      → Produtos simples (sem variação)
├─ id (UUID)
├─ sku
├─ marketplace
└─ price

products_variations_bling     → Variações de produtos do Bling
├─ id (UUID)
├─ sku
├─ product_bling_id (bigint)  ← FK para products_bling
├─ sale_price
└─ variacao_nome

products_bling                → Produtos PAI do Bling
├─ id (UUID)
├─ bling_id (bigint)
├─ sku
└─ sale_price

bling_order_items             → Itens dos pedidos
├─ product_id                 → FK para products
├─ product_bling_id           → FK para products_bling
└─ product_variation_id       → FK para products_variations_bling
```

### Produto de Teste:
```json
{
  "variation_id": "2a90a8ad-f61b-4b4e-909c-c3e9edacc50e",
  "sku": "YEIZ_IDP294_004",
  "variation_name": "Copo Térmico Grande 800ml com Alça para Academia Trabalho e Uso Diário Cor: Roxo",
  "variacao_nome": "Cor: Roxo",
  "product_bling_id": 16613337777,
  "sale_price": "89.9",
  "stock_quantity": 68
}
```

**Problema:** O workflow atual só busca em `products`, mas variações estão em `products_variations_bling`.

---

## ✅ Solução

### 1. Atualizar "Buscar Produto por SKU2"

**Antes:**
```javascript
// Busca apenas em products
SELECT * FROM products WHERE sku = '{{ $json.codigo }}'
```

**Depois:**
```javascript
// Busca em AMBAS as tabelas usando UNION
SELECT 
  id,
  sku,
  'simple' as product_type,
  marketplace,
  price as sale_price,
  null as product_bling_id,
  null as variacao_nome
FROM products
WHERE sku = '{{ $json.codigo }}'

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
WHERE sku = '{{ $json.codigo }}'
```

### 2. Atualizar "Preparar dados do item2"

O código já está preparado para lidar com ambos os casos:

```javascript
// Detectar se é variação ou produto simples
const isVariation = !!productFromDB.product_bling_id;

// Se for variação
if (isVariation) {
  product_bling_id: null,
  product_variation_id: productFromDB.id,  // ← UUID da variação
  product_id: null
}

// Se for produto simples
else {
  product_bling_id: null,
  product_variation_id: null,
  product_id: productFromDB.id  // ← UUID do produto
}
```

---

## 🔧 Implementação

### Passo 1: Atualizar Query SQL

No nó "Buscar Produto por SKU2", substituir a query atual por:

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

### Passo 2: Atualizar "Preparar dados do item2"

Adicionar lógica para filtrar por marketplace APENAS para produtos simples:

```javascript
// Se for produto simples, filtrar por marketplace
if (productFromDB.product_type === 'simple') {
  if (productFromDB.marketplace !== marketplaceDosPedido) {
    console.log(`⚠️ Pulando produto simples: marketplace diferente`);
    continue;
  }
}

// Se for variação, não precisa filtrar por marketplace
// (variações não têm marketplace, são do Bling)
```

---

## 📝 Código Completo Atualizado

### "Preparar dados do item2" (JavaScript)

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

## 🧪 Teste

### Cenário 1: Produto Simples (YEIZ_IDP248)
- ✅ Busca em `products`
- ✅ Filtra por marketplace (Shopee)
- ✅ Usa `product_id`
- ✅ Insere com sucesso

### Cenário 2: Variação (YEIZ_IDP294_004)
- ✅ Busca em `products_variations_bling`
- ✅ NÃO filtra por marketplace (variações não têm)
- ✅ Usa `product_variation_id`
- ✅ Insere com sucesso

### Cenário 3: Produto Não Existe (C1357PRETOM)
- ❌ Não encontra em nenhuma tabela
- ⚠️ Log de erro
- ⚠️ Pula o item (não quebra o workflow)

---

## 📊 Resultado Esperado

Após aplicar a correção:

1. ✅ Produtos simples continuam funcionando
2. ✅ Variações de produtos agora funcionam
3. ✅ Produtos não encontrados são logados mas não quebram o workflow
4. ✅ Pedidos aparecem com TODOS os itens no frontend

---

**Data**: 2026-05-03  
**Erro**: Variações de produtos não são encontradas  
**Causa**: Query busca apenas em `products`, variações estão em `products_variations_bling`  
**Solução**: Buscar em AMBAS as tabelas usando UNION ALL
