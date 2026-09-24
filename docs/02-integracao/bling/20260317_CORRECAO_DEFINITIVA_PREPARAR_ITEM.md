# Correção Definitiva: Preparar dados do item1

## Problema

Os dados do item do pedido estão em DOIS lugares diferentes:
1. **Nó "Preparar Itens do pedido"**: Tem quantidade, valor, desconto, descrição (dados do item no pedido)
2. **Nó "Pega mais dados do ID Produto1"**: Tem detalhes adicionais do produto da API do Bling

Precisamos combinar os dados desses dois nós.

## Solução Final

Abra o nó "Preparar dados do item1" e substitua TODO o código por este:

```javascript
// IMPORTANTE: Pegar dados do item do pedido do nó "Preparar Itens do pedido"
// Este nó tem os dados originais do item (quantidade, valor, desconto, etc.)
const itemDoPedido = $('Preparar Itens do pedido').item.json;

// Debug: ver o que está chegando
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
const item = $('Pega mais dados do ID Produto1').item.json.data;
```

**DEPOIS (correto):**
```javascript
const itemDoPedido = $('Preparar Itens do pedido').item.json;
```

## Por Que Isso Funciona?

O nó "Preparar Itens do pedido" extrai os itens do pedido e retorna cada um com esta estrutura:

```json
{
  "id": 19176058568,
  "codigo": "C1314AZULMARINHOP",
  "quantidade": 1,
  "valor": 43,
  "desconto": 0,
  "descricao": "Camisa Feminina Baby Look...",
  "produto": { "id": 16605084591 },
  "order_data": { ... }
}
```

Esses são os dados ORIGINAIS do item no pedido, que incluem quantidade, valor, desconto, etc.

## Teste

Após aplicar a correção:

1. Execute o workflow
2. Clique no nó "Preparar dados do item1"
3. Verifique se a saída mostra:
   ```json
   {
     "order_id": "dd132ee8-9322-41be-95fd-831195302a2e",
     "bling_item_id": 19176058568,
     "product_bling_id": "d4e8ce7e-fe44-4be3-a1ee-3b47792a5cd5",
     "code": "C1314AZULMARINHOP",
     "description": "Camisa Feminina Baby Look...",
     "quantity": 1,
     "unit_value": 43,
     "discount": 0,
     "total_value": 43
   }
   ```

4. Verifique no banco:
   ```sql
   SELECT * FROM bling_order_items 
   WHERE order_id = 'dd132ee8-9322-41be-95fd-831195302a2e';
   ```

Deve mostrar os valores corretos!
