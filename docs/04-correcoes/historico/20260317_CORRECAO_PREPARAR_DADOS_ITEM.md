# Correção do Nó "Preparar dados do item"

## 🐛 Problema

O erro ocorre porque o código está tentando buscar o `order_id` dos nós "Inserir Pedido1" e "Atualizar Pedido1", mas esses nós não retornam o campo `id` diretamente.

## ✅ Solução

Substituir o código do nó "Preparar dados do item" pelo código corrigido abaixo:

```javascript
// Pegar dados do item atual do loop
const itemData = $('Buscar Detalhes do Pedido1').item.json.data.itens;
const currentIndex = $('Loop Over Items').item.json.$index || 0;
const item = itemData[currentIndex];

// Buscar o order_id da tabela bling_orders usando o bling_order_id
const blingOrderId = $('Buscar Detalhes do Pedido1').item.json.data.id;

// Pegar o order_id do nó "Pegar order_id"
let orderId = null;
try {
  const orderData = $('Pegar order_id').item.json;
  orderId = orderData.id;
} catch (e) {
  throw new Error(`Não foi possível encontrar o order_id para bling_order_id: ${blingOrderId}`);
}

// Buscar product_bling_id (pode ser null se não encontrado)
let productBlingId = null;
try {
  const productBlingData = $('Buscar Produto por SKU').item.json;
  productBlingId = productBlingData?.id || null;
} catch (e) {
  // Produto não encontrado no Bling
}

// Buscar product_id (pode ser null se não encontrado)
// Como você não tem um nó separado para buscar na tabela products,
// vamos deixar como null por enquanto
let productId = null;

// Calcular valores
const quantidade = parseFloat(item.quantidade) || 0;
const valor = parseFloat(item.valor) || 0;
const desconto = parseFloat(item.desconto) || 0;
const totalValue = (quantidade * valor) - desconto;

// Retornar dados formatados para inserção
return {
  json: {
    order_id: orderId,
    bling_item_id: item.produto?.id || 0,
    product_bling_id: productBlingId,
    product_id: productId,
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

## 📝 Explicação das Mudanças

1. **Buscar item do array**: Agora busca o item correto do array `itens` usando o índice do loop
2. **Usar nó "Pegar order_id"**: Busca o `order_id` do nó que já faz a query na tabela `bling_orders`
3. **Simplificar busca de produto**: Usa apenas o nó "Buscar Produto por SKU" que já existe

## 🔧 Próximos Passos

Depois de corrigir este nó, você precisa:

1. **Adicionar nó "Buscar Produto na Calculadora"** (opcional):
   - Tipo: Supabase - Get Many Rows
   - Tabela: `products`
   - Filtro: `sku` = `{{ $json.code }}`
   - Conectar após "Preparar dados do item"

2. **Corrigir nó "Atualiza no banco PATCH"**:
   - Os campos estão mapeados incorretamente
   - Deve usar os dados de `$('Preparar dados do item').item.json`

3. **Criar nó "Inserir Item do Pedido"**:
   - Tipo: Supabase - Insert
   - Tabela: `bling_order_items`
   - Usar dados de "Preparar dados do item"

## ⚠️ Importante

O nó "Atualiza no banco PATCH" está com mapeamento errado. Ele deveria inserir/atualizar na tabela `bling_order_items`, não fazer PATCH com dados de produto.

Vou criar o código correto para você na próxima mensagem.
