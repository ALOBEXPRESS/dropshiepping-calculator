# Correção Simplificada: Processar Múltiplos Itens

## Solução Mais Simples

O problema é que estamos tentando acessar o item do nó "Preparar Itens do pedido", mas o n8n já está processando cada item separadamente. A solução é buscar o item pelos dados que já temos (o código do produto).

### Código Corrigido

Abra o nó "Preparar dados do item1" e substitua TODO o código por este:

```javascript
// SOLUÇÃO SIMPLIFICADA: Buscar o item do pedido pelo código do produto
// O produto do banco vem do nó "Buscar Produto por SKU1"
const productFromDB = $input.item.json;
const productSKU = productFromDB.sku;

// Buscar o item do pedido que tem esse SKU
const todosItens = $('Preparar Itens do pedido').all();
const itemDoPedido = todosItens.find(item => item.json.codigo === productSKU)?.json;

if (!itemDoPedido) {
  throw new Error(`Item do pedido não encontrado para o SKU: ${productSKU}`);
}

// Debug: ver o que está chegando
console.log('SKU:', productSKU);
console.log('Item do pedido encontrado:', JSON.stringify(itemDoPedido, null, 2));

// Buscar o order_id (UUID) - pode vir de INSERT ou UPDATE
let orderId = null;

// Tentar buscar do nó "Inserir Pedido" (quando é INSERT)
try {
  if ($('Inserir Pedido').isExecuted) {
    orderId = $('Inserir Pedido').item.json.id;
  }
} catch (e) {
  console.log('Inserir Pedido não executado');
}

// Se não encontrou, tentar buscar do nó "Atualizar Pedido" (quando é UPDATE)
try {
  if (!orderId && $('Atualizar Pedido').isExecuted) {
    orderId = $('Atualizar Pedido').item.json.id;
  }
} catch (e) {
  console.log('Atualizar Pedido não executado');
}

if (!orderId) {
  throw new Error('order_id não encontrado. Verifique se o pedido foi inserido ou atualizado corretamente.');
}

// Buscar product_bling_id do nó "Buscar Produto por SKU1"
const productBlingId = productFromDB?.id || null;

// Extrair valores do item do pedido
const quantidade = parseFloat(itemDoPedido.quantidade) || 0;
const valor = parseFloat(itemDoPedido.valor) || 0;
const desconto = parseFloat(itemDoPedido.desconto) || 0;
const totalValue = (quantidade * valor) - desconto;

// Log dos valores calculados
console.log('Valores calculados:', {
  quantidade,
  valor,
  desconto,
  totalValue,
  bling_item_id: itemDoPedido.id,
  codigo: itemDoPedido.codigo,
  descricao: itemDoPedido.descricao
});

// Retornar dados formatados para inserção
return {
  json: {
    order_id: orderId,
    bling_item_id: parseInt(itemDoPedido.id) || 0,
    product_bling_id: productBlingId,
    product_id: null, // Será preenchido depois quando associarmos ao produto local
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
```

## Como Funciona

Em vez de usar o índice, buscamos o item do pedido pelo SKU do produto:

1. Pegamos o SKU do produto do banco: `productFromDB.sku` (ex: "C12503G")
2. Buscamos nos itens do pedido qual tem esse SKU: `todosItens.find(item => item.json.codigo === productSKU)`
3. Usamos os dados desse item para preencher os valores

Assim, cada execução encontra o item correto pelo SKU, independente da ordem!

## Teste

Após aplicar a correção:

1. Execute o workflow com um pedido de 2 produtos
2. Clique no nó "Preparar dados do item1"
3. Deve mostrar "2 items" no topo
4. Verifique se ambos os itens têm valores corretos
5. Clique no nó "Inserir item do pedido1"
6. Deve mostrar "2 items" no topo
7. Verifique no banco:
   ```sql
   SELECT 
     code,
     description,
     quantity,
     unit_value,
     total_value
   FROM bling_order_items 
   WHERE order_id = '50e76fd4-691e-4a14-8dd5-c906653ce34d'
   ORDER BY created_at;
   ```

Deve retornar 2 registros com os valores corretos! 🎉
