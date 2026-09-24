# Correção Final: Processar Todos os Itens Sem Parar

## Problema Identificado

O código atual está usando `throw error` quando encontra um problema. Isso faz o n8n parar de processar os itens restantes.

Quando temos 2 produtos e o segundo dá erro, o n8n para e só processa o primeiro item.

## Solução

Em vez de `throw error`, vamos retornar `null` para itens com erro. Isso permite que o n8n continue processando os outros itens.

## Código Corrigido

Abra o nó "Preparar dados do item1" e substitua TODO o código por este:

```javascript
try {
  // SOLUÇÃO SIMPLIFICADA: Buscar o item do pedido pelo código do produto
  const productFromDB = $input.item.json;
  const productSKU = productFromDB.sku;

  console.log('=== DEBUG ===');
  console.log('SKU do produto do banco:', productSKU);

  const todosItens = $('Preparar Itens do pedido').all();
  console.log('Total de itens do pedido:', todosItens.length);
  console.log('SKUs dos itens do pedido:', todosItens.map(item => item.json.codigo));

  // Buscar o item do pedido que tem esse SKU
  const itemDoPedido = todosItens.find(item => item.json.codigo === productSKU)?.json;

  console.log('Item encontrado:', itemDoPedido ? 'SIM' : 'NÃO');
  
  if (!itemDoPedido) {
    console.error('ERRO: Item não encontrado para SKU:', productSKU);
    // MUDANÇA: Retornar null em vez de throw error
    return { json: null };
  }

  console.log('=============');

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
    // MUDANÇA: Retornar null em vez de throw error
    return { json: null };
  }

  const productBlingId = productFromDB?.id || null;

  const quantidade = parseFloat(itemDoPedido.quantidade) || 0;
  const valor = parseFloat(itemDoPedido.valor) || 0;
  const desconto = parseFloat(itemDoPedido.desconto) || 0;
  const totalValue = (quantidade * valor) - desconto;

  console.log('Valores calculados:', {
    quantidade,
    valor,
    desconto,
    totalValue
  });

  return {
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
  };
} catch (error) {
  console.error('ERRO CAPTURADO:', error.message);
  console.error('Stack:', error.stack);
  // MUDANÇA: Retornar null em vez de throw error
  return { json: null };
}
```

## O Que Mudou?

Substituímos todas as ocorrências de:
```javascript
throw new Error('mensagem');
```

Por:
```javascript
return { json: null };
```

Isso faz com que:
1. O n8n continue processando os próximos itens
2. Itens com erro retornam `null` e não são inseridos no banco
3. Itens válidos são processados normalmente

## Próximo Passo: Filtrar Nulls

Após o nó "Preparar dados do item1", você precisa adicionar um nó "IF" para filtrar os itens `null`:

1. Adicione um nó "IF" após "Preparar dados do item1"
2. Configure a condição:
   - Campo: `{{ $json }}`
   - Operador: `is not equal to`
   - Valor: `null`
3. Conecte a saída "true" ao nó "Inserir item do pedido1"
4. A saída "false" pode ser conectada a um nó de log de erro (opcional)

## Teste

Após aplicar a correção:

1. Execute o workflow com um pedido de 2 produtos
2. Clique no nó "Preparar dados do item1"
3. Deve mostrar "2 items" no topo (incluindo possíveis nulls)
4. Clique no nó "IF" (se adicionado)
5. Deve mostrar apenas os itens válidos na saída "true"
6. Clique no nó "Inserir item do pedido1"
7. Deve mostrar "2 items" no topo (apenas os válidos)
8. Verifique no banco:
   ```sql
   SELECT 
     code,
     description,
     quantity,
     unit_value,
     total_value
   FROM bling_order_items 
   WHERE order_id = 'SEU_ORDER_ID'
   ORDER BY created_at;
   ```

Deve retornar 2 registros com os valores corretos! 🎉
