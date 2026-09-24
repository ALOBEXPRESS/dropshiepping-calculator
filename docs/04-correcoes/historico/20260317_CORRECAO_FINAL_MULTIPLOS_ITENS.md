# Correção Final: Processar Múltiplos Itens

## Problema

O código está usando `$('Preparar Itens do pedido').item.json`, que sempre pega o PRIMEIRO item do array, não o item correspondente à execução atual.

Quando o n8n processa múltiplos itens, cada nó é executado uma vez para cada item. Precisamos pegar o item CORRETO para cada execução.

## Solução

O n8n mantém o índice do item atual em `$input.item.json` de cada nó. Precisamos usar esse índice para buscar o item correto do nó "Preparar Itens do pedido".

### Código Corrigido

Abra o nó "Preparar dados do item1" e substitua TODO o código por este:

```javascript
// SOLUÇÃO: Usar $input para pegar o item atual da execução
// O n8n processa cada item do array separadamente
// Precisamos pegar o item que corresponde a esta execução

// Pegar o índice do item atual
const currentIndex = $input.itemIndex;

// Pegar todos os itens do pedido
const todosItens = $('Preparar Itens do pedido').all();

// Pegar o item correspondente ao índice atual
const itemDoPedido = todosItens[currentIndex].json;

// Debug: ver o que está chegando
console.log('Índice atual:', currentIndex);
console.log('Item do pedido:', JSON.stringify(itemDoPedido, null, 2));

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
let productBlingId = null;
try {
  const productBlingData = $input.item.json; // Este vem do nó atual
  productBlingId = productBlingData?.id || null;
} catch (e) {
  console.log('Produto não encontrado no banco:', e.message);
}

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

## Mudança Principal

**ANTES (errado):**
```javascript
const itemDoPedido = $('Preparar Itens do pedido').item.json;
// Sempre pega o primeiro item
```

**DEPOIS (correto):**
```javascript
const currentIndex = $input.itemIndex;
const todosItens = $('Preparar Itens do pedido').all();
const itemDoPedido = todosItens[currentIndex].json;
// Pega o item correspondente ao índice atual
```

## Como Funciona

Quando o n8n processa múltiplos itens:
1. Execução 1: `$input.itemIndex = 0` → pega `todosItens[0]` (primeiro produto)
2. Execução 2: `$input.itemIndex = 1` → pega `todosItens[1]` (segundo produto)

Assim cada execução processa o item correto!

## Teste

Após aplicar a correção:

1. Execute o workflow com um pedido de 2 produtos
2. Clique no nó "Preparar dados do item1"
3. Deve mostrar "2 items" no topo
4. Clique no nó "Inserir item do pedido1"
5. Deve mostrar "2 items" no topo
6. Verifique no banco:
   ```sql
   SELECT * FROM bling_order_items 
   WHERE order_id = '50e76fd4-691e-4a14-8dd5-c906653ce34d'
   ORDER BY created_at;
   ```
7. Deve retornar 2 registros:
   - Camisa Feminina Baby Look Lindinha (quantity: 1, unit_value: 47)
   - Camisa Feminina Baby Look Stitch Sitting (quantity: 1, unit_value: 49.9)

Pronto! Agora vai funcionar para todos os itens do pedido! 🎉
