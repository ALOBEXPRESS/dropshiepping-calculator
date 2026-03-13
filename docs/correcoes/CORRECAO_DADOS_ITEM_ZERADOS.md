# Correção: Dados dos Itens Estão Zerados

## Problema
Os itens estão sendo inseridos na tabela `bling_order_items`, mas todos os valores estão zerados:
- quantity: 0
- unit_value: 0
- total_value: 0
- description: "Sem descrição"
- code: null

## Causa
O código do nó "Preparar dados do item1" está tentando acessar campos com nomes errados. A estrutura do item que vem do Bling usa nomes diferentes.

## Estrutura Esperada do Item do Bling

Quando você busca um pedido do Bling, cada item tem esta estrutura:

```json
{
  "produto": {
    "id": 123456789
  },
  "codigo": "SKU-123",
  "descricao": "Nome do Produto",
  "unidade": "UN",
  "quantidade": 2,
  "valor": 99.90,
  "desconto": 10.00,
  "aliquotaIPI": 0,
  "comissao": {
    "base": 0,
    "aliquota": 0,
    "valor": 0
  }
}
```

## Correção do Código

Abra o nó "Preparar dados do item1" e substitua o código por este:

```javascript
// Pegar dados do item atual
const item = $input.item.json;

// Buscar o order_id (UUID) - pode vir de INSERT ou UPDATE
let orderId = null;

// Tentar buscar do nó "Inserir Pedido" (quando é INSERT)
if ($('Inserir Pedido').isExecuted) {
  orderId = $('Inserir Pedido').item.json.id;
}

// Se não encontrou, tentar buscar do nó "Atualizar Pedido" (quando é UPDATE)
if (!orderId && $('Atualizar Pedido').isExecuted) {
  orderId = $('Atualizar Pedido').item.json.id;
}

if (!orderId) {
  throw new Error('order_id não encontrado. Verifique se o pedido foi inserido ou atualizado corretamente.');
}

// Buscar product_bling_id
let productBlingId = null;
try {
  const productBlingData = $('Buscar Produto por SKU1').item.json;
  productBlingId = productBlingData?.id || null;
} catch (e) {
  // Produto não encontrado
}

// CORREÇÃO: Usar os nomes corretos dos campos do Bling
const quantidade = parseFloat(item.quantidade) || 0;
const valor = parseFloat(item.valor) || 0;
const desconto = parseFloat(item.desconto) || 0;
const totalValue = (quantidade * valor) - desconto;

// Retornar dados formatados
return {
  json: {
    order_id: orderId,
    bling_item_id: item.produto?.id || 0,
    product_bling_id: productBlingId,
    product_id: null, // Será preenchido depois quando associarmos ao produto local
    code: item.codigo || null,
    description: item.descricao || 'Sem descrição',
    detailed_description: item.descricaoDetalhada || null,
    unit: item.unidade || 'UN',
    quantity: quantidade,
    unit_value: valor,
    discount: desconto,
    total_value: totalValue,
    ipi_rate: parseFloat(item.aliquotaIPI) || 0,
    commission_base: parseFloat(item.comissao?.base) || 0,
    commission_rate: parseFloat(item.comissao?.aliquota) || 0,
    commission_value: parseFloat(item.comissao?.valor) || 0,
    operation_nature_id: item.produto?.naturezaOperacao?.id || null
  }
};
```

## Verificação

O código acima já está correto! O problema deve ser que o item que está chegando não tem esses campos.

### Passo 1: Verificar a Saída do "Preparar Itens do pedido"

1. Execute o workflow
2. Clique no nó "Preparar Itens do pedido"
3. Copie a saída JSON completa de um dos itens
4. Me envie para eu ver a estrutura exata

### Passo 2: Verificar a Saída do "Pega mais dados do ID Produto1"

1. Clique no nó "Pega mais dados do ID Produto1"
2. Verifique se a resposta da API do Bling está vindo corretamente
3. Procure pelos campos: `quantidade`, `valor`, `descricao`

## Possíveis Causas

### Causa 1: Item Vem Dentro de "order_data"
Se o nó "Preparar Itens do pedido" está retornando:
```json
{
  "produto": { "id": 123 },
  "order_data": {
    "itens": [...]
  }
}
```

Então o código precisa acessar os dados de forma diferente.

### Causa 2: Estrutura Aninhada
Se o item real está dentro de outro objeto, como:
```json
{
  "item": {
    "produto": { "id": 123 },
    "quantidade": 2
  }
}
```

Então precisa ajustar para `const item = $input.item.json.item;`

## Solução Temporária: Debug

Adicione este código no início do nó "Preparar dados do item1" para ver o que está chegando:

```javascript
// DEBUG: Ver estrutura do item
console.log('=== ESTRUTURA DO ITEM ===');
console.log(JSON.stringify($input.item.json, null, 2));
console.log('=========================');

const item = $input.item.json;

// ... resto do código
```

Execute o workflow e veja o log no console do n8n para identificar a estrutura exata.

## Próximos Passos

1. Me envie a saída JSON do nó "Preparar Itens do pedido"
2. Vou ajustar o código do "Preparar dados do item1" com a estrutura correta
3. Teste novamente e confirme se os valores estão sendo inseridos corretamente
