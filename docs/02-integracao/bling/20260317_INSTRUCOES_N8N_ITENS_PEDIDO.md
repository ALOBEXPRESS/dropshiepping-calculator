# Instruções para Adicionar Nós no Workflow n8n

## 📋 Visão Geral

Você precisa adicionar 5 novos nós no workflow para salvar os itens do pedido na tabela `bling_order_items`.

---

## 🔧 Nó 1: Loop Over Items (Iterar Itens do Pedido)

**Tipo**: `Loop Over Items`

**Posição**: Após os nós "Inserir Pedido" e "Atualizar Pedido"

**Configuração**:
- **Mode**: `Each Item in a List`
- **List**: `{{ $('Buscar Detalhes do Pedido').item.json.data.itens }}`

**Conexões**:
- Conectar SAÍDA do "Inserir Pedido" → ENTRADA do "Loop Over Items"
- Conectar SAÍDA do "Atualizar Pedido" → ENTRADA do "Loop Over Items"

---

## 🔧 Nó 2: Buscar Produto Bling por SKU

**Tipo**: `Supabase - Get Many Rows`

**Posição**: Após "Loop Over Items"

**Configuração**:
- **Table**: `products_bling`
- **Return All**: `false`
- **Limit**: `1`
- **Filters**:
  - **Column**: `sku`
  - **Operator**: `equals`
  - **Value**: `{{ $json.codigo }}`

**Conexões**:
- Conectar SAÍDA do "Loop Over Items" → ENTRADA deste nó

---

## 🔧 Nó 3: Buscar Produto por SKU

**Tipo**: `Supabase - Get Many Rows`

**Posição**: Após "Buscar Produto Bling por SKU"

**Configuração**:
- **Table**: `products`
- **Return All**: `false`
- **Limit**: `1`
- **Filters**:
  - **Column**: `sku`
  - **Operator**: `equals`
  - **Value**: `{{ $json.codigo }}`

**Conexões**:
- Conectar SAÍDA do "Buscar Produto Bling por SKU" → ENTRADA deste nó

---

## 🔧 Nó 4: Preparar Dados do Item

**Tipo**: `Code`

**Posição**: Após "Buscar Produto por SKU"

**Configuração**:
- **Mode**: `Run Once for Each Item`
- **Language**: `JavaScript`

**Código**:

```javascript
// Pegar dados do item atual do loop
const item = $('Loop Over Items').item.json;

// Pegar order_id do pedido inserido/atualizado
// Tenta pegar do "Inserir Pedido" primeiro, senão do "Atualizar Pedido"
let orderId = null;
try {
  orderId = $('Inserir Pedido').item.json.id;
} catch (e) {
  try {
    orderId = $('Atualizar Pedido').item.json.id;
  } catch (e2) {
    throw new Error('Não foi possível encontrar o order_id');
  }
}

// Buscar product_bling_id (pode ser null se não encontrado)
let productBlingId = null;
try {
  const productBlingData = $('Buscar Produto Bling por SKU').item.json;
  productBlingId = productBlingData?.id || null;
} catch (e) {
  // Produto não encontrado no Bling
}

// Buscar product_id (pode ser null se não encontrado)
let productId = null;
try {
  const productData = $('Buscar Produto por SKU').item.json;
  productId = productData?.id || null;
} catch (e) {
  // Produto não encontrado na calculadora
}

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

**Conexões**:
- Conectar SAÍDA do "Buscar Produto por SKU" → ENTRADA deste nó

---

## 🔧 Nó 5: Inserir Item do Pedido

**Tipo**: `Supabase - Insert`

**Posição**: Após "Preparar Dados do Item"

**Configuração**:
- **Table**: `bling_order_items`
- **Columns**:
  - `order_id` = `{{ $json.order_id }}`
  - `bling_item_id` = `{{ $json.bling_item_id }}`
  - `product_bling_id` = `{{ $json.product_bling_id }}`
  - `product_id` = `{{ $json.product_id }}`
  - `code` = `{{ $json.code }}`
  - `description` = `{{ $json.description }}`
  - `detailed_description` = `{{ $json.detailed_description }}`
  - `unit` = `{{ $json.unit }}`
  - `quantity` = `{{ $json.quantity }}`
  - `unit_value` = `{{ $json.unit_value }}`
  - `discount` = `{{ $json.discount }}`
  - `total_value` = `{{ $json.total_value }}`
  - `ipi_rate` = `{{ $json.ipi_rate }}`
  - `commission_base` = `{{ $json.commission_base }}`
  - `commission_rate` = `{{ $json.commission_rate }}`
  - `commission_value` = `{{ $json.commission_value }}`
  - `operation_nature_id` = `{{ $json.operation_nature_id }}`

**Conexões**:
- Conectar SAÍDA do "Preparar Dados do Item" → ENTRADA deste nó

---

## 🎯 Diagrama de Fluxo

```
[Inserir Pedido] ──┐
                   ├──→ [Loop Over Items]
[Atualizar Pedido] ┘         ↓
                    [Buscar Produto Bling por SKU]
                              ↓
                    [Buscar Produto por SKU]
                              ↓
                    [Preparar Dados do Item]
                              ↓
                    [Inserir Item do Pedido]
```

---

## ✅ Checklist de Implementação

- [ ] Adicionar nó "Loop Over Items"
- [ ] Adicionar nó "Buscar Produto Bling por SKU"
- [ ] Adicionar nó "Buscar Produto por SKU"
- [ ] Adicionar nó "Preparar Dados do Item"
- [ ] Adicionar nó "Inserir Item do Pedido"
- [ ] Conectar todos os nós corretamente
- [ ] Salvar o workflow
- [ ] Testar criando um pedido no Bling
- [ ] Verificar se os itens foram salvos em `bling_order_items`

---

## 🧪 Como Testar

1. Crie ou clone um pedido no Bling
2. Aguarde o webhook processar
3. Verifique no Supabase se:
   - O pedido foi criado em `bling_orders`
   - Os itens foram criados em `bling_order_items`
   - Os campos `product_bling_id` e `product_id` estão preenchidos (se o SKU existir)

4. Execute esta query no Supabase para verificar:

```sql
SELECT 
  boi.id,
  boi.code,
  boi.description,
  boi.quantity,
  boi.unit_value,
  boi.total_value,
  boi.product_bling_id,
  boi.product_id,
  bo.order_number,
  bo.marketplace_order_number
FROM bling_order_items boi
JOIN bling_orders bo ON boi.order_id = bo.id
ORDER BY boi.created_at DESC
LIMIT 10;
```

---

## 🚨 Possíveis Erros

### Erro: "order_id is null"
**Solução**: Verifique se os nós "Inserir Pedido" ou "Atualizar Pedido" estão retornando o campo `id`

### Erro: "Cannot read property 'json' of undefined"
**Solução**: Verifique se o nome dos nós está correto no código (case-sensitive)

### Erro: "Loop Over Items não itera"
**Solução**: Verifique se o caminho `$('Buscar Detalhes do Pedido').item.json.data.itens` está correto

### Itens não aparecem no banco
**Solução**: Verifique se o nó "Inserir Item do Pedido" está sendo executado (veja os logs do n8n)

---

## 📞 Suporte

Se tiver dúvidas ou erros, me avise e eu te ajudo a resolver!
