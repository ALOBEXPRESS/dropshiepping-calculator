# Código Corrigido: Preparar dados do item1

## Estrutura Identificada

A saída do "Preparar Itens do pedido" tem esta estrutura:

```json
{
  "id": 19176058568,
  "codigo": "C1314AZULMARINHOP",
  "unidade": "UN",
  "quantidade": 1,
  "desconto": 0,
  "valor": 43,
  "aliquotaIPI": 0,
  "descricao": "Camisa Feminina Baby Look Tudo no Tempo Dele Cor:Azul Marinho;Tamanho:P",
  "descricaoDetalhada": "",
  "produto": {
    "id": 16605084591
  },
  "comissao": {
    "base": 43,
    "aliquota": 0,
    "valor": 0
  },
  "naturezaOperacao": {
    "id": 0
  },
  "order_data": {
    "id": 25139460137,
    "numero": 46,
    ...
  }
}
```

## Código Corrigido

Abra o nó "Preparar dados do item1" no n8n e substitua TODO o código por este:

```javascript
// Pegar dados do item atual
const item = $input.item.json;

// Debug: ver o que está chegando
console.log('Item recebido:', JSON.stringify(item, null, 2));

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
  const productBlingData = $('Buscar Produto por SKU1').item.json;
  productBlingId = productBlingData?.id || null;
} catch (e) {
  console.log('Produto não encontrado no banco:', e.message);
}

// Extrair valores do item
const quantidade = parseFloat(item.quantidade) || 0;
const valor = parseFloat(item.valor) || 0;
const desconto = parseFloat(item.desconto) || 0;
const totalValue = (quantidade * valor) - desconto;

// Log dos valores calculados
console.log('Valores calculados:', {
  quantidade,
  valor,
  desconto,
  totalValue
});

// Retornar dados formatados para inserção
return {
  json: {
    order_id: orderId,
    bling_item_id: parseInt(item.id) || 0,
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
    operation_nature_id: item.naturezaOperacao?.id || null
  }
};
```

## Mudanças Principais

1. **bling_item_id**: Mudei de `item.produto?.id` para `item.id` (o ID do item está no nível raiz, não dentro de produto)
2. **Logs de debug**: Adicionei console.log para facilitar o debug
3. **Try-catch**: Adicionei proteção para evitar erros quando nós não foram executados

## Teste

Após aplicar a correção:

1. Execute o workflow com um pedido de teste
2. Clique no nó "Preparar dados do item1"
3. Verifique se a saída mostra os valores corretos:
   ```json
   {
     "order_id": "86e17255-28b0-486a-b80b-afe87189c112",
     "bling_item_id": 19176058568,
     "quantity": 1,
     "unit_value": 43,
     "total_value": 43,
     "description": "Camisa Feminina Baby Look..."
   }
   ```
4. Verifique no banco de dados se os valores foram inseridos corretamente

## Verificação no Banco

```sql
SELECT 
  id,
  bling_item_id,
  code,
  description,
  quantity,
  unit_value,
  discount,
  total_value
FROM bling_order_items
WHERE order_id = '86e17255-28b0-486a-b80b-afe87189c112'
ORDER BY created_at DESC;
```

Deve retornar:
- bling_item_id: 19176058568
- code: C1314AZULMARINHOP
- description: Camisa Feminina Baby Look...
- quantity: 1
- unit_value: 43
- discount: 0
- total_value: 43
