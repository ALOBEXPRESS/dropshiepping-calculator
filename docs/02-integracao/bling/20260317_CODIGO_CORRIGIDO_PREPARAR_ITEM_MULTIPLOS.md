# Código Corrigido - Preparar dados do item1

## Problema Identificado

O nó "Preparar dados do item1" estava processando apenas **1 item** por vez usando `$input.item.json`, quando deveria processar **TODOS** os itens que vêm do nó "Buscar Produto por SKU1".

## Solução

Usar `$input.all()` para pegar todos os produtos e criar um array com todos os itens preparados.

## Código JavaScript Corrigido

Cole este código no nó **"Preparar dados do item1"** (tipo: Code):

```javascript
try {
  // CORREÇÃO: Processar TODOS os produtos que vêm do nó anterior
  const allProductsFromDB = $input.all();
  console.log('=== DEBUG ===');
  console.log('Total de produtos do banco:', allProductsFromDB.length);

  const todosItens = $('Preparar Itens do pedido').all();
  console.log('Total de itens do pedido:', todosItens.length);
  console.log('SKUs dos itens do pedido:', todosItens.map(item => item.json.codigo));

  // Buscar o order_id (UUID) - pode vir de INSERT ou UPDATE
  let orderId = null;

  try {
    if ($('Inserir Pedido').isExecuted) {
      orderId = $('Inserir Pedido').item.json.id;
    }
  } catch (e) {
    console.log('Inserir Pedido não executado');
  }

  try {
    if (!orderId && $('Atualizar Pedido').isExecuted) {
      orderId = $('Atualizar Pedido').item.json.id;
    }
  } catch (e) {
    console.log('Atualizar Pedido não executado');
  }

  if (!orderId) {
    console.error('ERRO: order_id não encontrado');
    return [];
  }

  // Processar CADA produto e criar um item para inserir
  const itemsToInsert = [];

  for (const productNode of allProductsFromDB) {
    const productFromDB = productNode.json;
    const productSKU = productFromDB.sku;

    console.log('Processando SKU:', productSKU);

    // Buscar o item do pedido que tem esse SKU
    const itemDoPedido = todosItens.find(item => item.json.codigo === productSKU)?.json;

    if (!itemDoPedido) {
      console.error('ERRO: Item não encontrado para SKU:', productSKU);
      continue; // Pula para o próximo produto
    }

    const productBlingId = productFromDB?.id || null;

    const quantidade = parseFloat(itemDoPedido.quantidade) || 0;
    const valor = parseFloat(itemDoPedido.valor) || 0;
    const desconto = parseFloat(itemDoPedido.desconto) || 0;
    const totalValue = (quantidade * valor) - desconto;

    console.log('Valores calculados para', productSKU, ':', {
      quantidade,
      valor,
      desconto,
      totalValue
    });

    itemsToInsert.push({
      json: {
        order_id: orderId,
        bling_item_id: parseInt(itemDoPedido.id) || 0,
        product_bling_id: productBlingId,
        product_id: null,
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
  return [];
}
```

## Como Aplicar a Correção

1. Abra o workflow no n8n
2. Clique no nó **"Preparar dados do item1"**
3. Substitua todo o código JavaScript pelo código acima
4. Salve o workflow
5. Teste com um pedido que tenha múltiplos itens

## Resultado Esperado

Após a correção, os logs devem mostrar:

```
=== DEBUG ===
Total de produtos do banco: 2
Total de itens do pedido: 2
SKUs dos itens do pedido: ["C11722P", "C12409GG"]
Processando SKU: C11722P
Valores calculados para C11722P: { quantidade: 1, valor: 39.9, desconto: 0, totalValue: 39.9 }
Processando SKU: C12409GG
Valores calculados para C12409GG: { quantidade: 1, valor: 49.9, desconto: 0, totalValue: 49.9 }
Total de itens preparados: 2
=============
```

E na tabela `bling_order_items` devem ser inseridos **2 registros** (um para cada produto).

## Diferença Principal

**ANTES (errado):**
```javascript
const productFromDB = $input.item.json; // Pega apenas 1 item
```

**DEPOIS (correto):**
```javascript
const allProductsFromDB = $input.all(); // Pega TODOS os itens
for (const productNode of allProductsFromDB) {
  // Processa cada produto
}
```
