# Integração de Itens do Pedido - Workflow n8n

## 📋 Objetivo

Atualizar o workflow n8n para salvar os itens de cada pedido na tabela `bling_order_items`, permitindo que o frontend mostre estatísticas de vendas por produto.

## 🎯 Problema Atual

- A tabela `bling_order_items` existe no Supabase mas está vazia (0 rows)
- O workflow n8n salva apenas o pedido principal em `bling_orders`
- Não é possível relacionar pedidos com produtos específicos
- O campo "Vendas" nos cards de produto está fixo em "0"

## ✅ Solução

Adicionar nós no workflow n8n para:
1. Iterar sobre os itens do pedido (`data.itens[]`)
2. Buscar o `product_bling_id` pelo SKU
3. Buscar o `product_id` (da tabela `products`) pelo SKU
4. Inserir cada item na tabela `bling_order_items`

## 🔧 Implementação

### Passo 1: Adicionar nó "Iterar Itens do Pedido"

Após os nós "Inserir Pedido" e "Atualizar Pedido", adicionar um nó **Loop Over Items** que itera sobre:

```javascript
{{ $('Buscar Detalhes do Pedido').item.json.data.itens }}
```

### Passo 2: Adicionar nó "Buscar Produto Bling por SKU"

Nó **Supabase - Get Many Rows** que busca o produto na tabela `products_bling`:

- **Table**: `products_bling`
- **Filter**: `sku` = `{{ $json.codigo }}`
- **Limit**: 1

### Passo 3: Adicionar nó "Buscar Produto por SKU"

Nó **Supabase - Get Many Rows** que busca o produto na tabela `products`:

- **Table**: `products`
- **Filter**: `sku` = `{{ $json.codigo }}`
- **Limit**: 1

### Passo 4: Adicionar nó "Preparar Dados do Item"

Nó **Code** que prepara os dados para inserção:

```javascript
// Pegar dados do item atual
const item = $input.item.json;

// Pegar order_id do nó anterior (Inserir ou Atualizar Pedido)
const orderId = $('Inserir Pedido').item.json.id || $('Atualizar Pedido').item.json.id;

// Buscar product_bling_id
const productBling = $('Buscar Produto Bling por SKU').item.json;
const productBlingId = productBling?.id || null;

// Buscar product_id
const product = $('Buscar Produto por SKU').item.json;
const productId = product?.id || null;

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
    quantity: parseFloat(item.quantidade) || 0,
    unit_value: parseFloat(item.valor) || 0,
    discount: parseFloat(item.desconto) || 0,
    total_value: (parseFloat(item.quantidade) || 0) * (parseFloat(item.valor) || 0) - (parseFloat(item.desconto) || 0),
    ipi_rate: parseFloat(item.aliquotaIPI) || 0,
    commission_base: parseFloat(item.comissao?.base) || 0,
    commission_rate: parseFloat(item.comissao?.aliquota) || 0,
    commission_value: parseFloat(item.comissao?.valor) || 0,
    operation_nature_id: item.produto?.naturezaOperacao?.id || null
  }
};
```

### Passo 5: Adicionar nó "Inserir Item do Pedido"

Nó **Supabase - Insert** que insere o item:

- **Table**: `bling_order_items`
- **Columns**: Mapear todos os campos do nó anterior

## 📊 Estrutura da Tabela `bling_order_items`

```sql
CREATE TABLE bling_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES bling_orders(id) ON DELETE CASCADE,
  
  -- IDs
  bling_item_id BIGINT NOT NULL,
  product_bling_id UUID REFERENCES products_bling(id),
  product_id UUID REFERENCES products(id),
  
  -- Dados do Item
  code TEXT,
  description TEXT NOT NULL,
  detailed_description TEXT,
  unit TEXT DEFAULT 'UN',
  quantity NUMERIC(10,3) NOT NULL,
  unit_value NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  total_value NUMERIC(10,2) NOT NULL,
  
  -- Impostos
  ipi_rate NUMERIC(5,2) DEFAULT 0,
  
  -- Comissão
  commission_base NUMERIC(10,2) DEFAULT 0,
  commission_rate NUMERIC(5,2) DEFAULT 0,
  commission_value NUMERIC(10,2) DEFAULT 0,
  
  -- Natureza da Operação
  operation_nature_id BIGINT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 🔄 Fluxo Completo

```
Webhook Bling
  ↓
Buscar Detalhes do Pedido
  ↓
Validar Dados
  ↓
Pedido Existe?
  ↓
├─ SIM → Atualizar Pedido → Iterar Itens
└─ NÃO → Inserir Pedido → Iterar Itens
                              ↓
                    Loop Over Items (data.itens)
                              ↓
                    Buscar Produto Bling por SKU
                              ↓
                    Buscar Produto por SKU
                              ↓
                    Preparar Dados do Item
                              ↓
                    Inserir Item do Pedido
```

## 🎯 Resultado Esperado

Após a implementação:

1. Cada pedido terá seus itens salvos em `bling_order_items`
2. Os itens estarão relacionados com:
   - `order_id` → Pedido em `bling_orders`
   - `product_bling_id` → Produto no Bling (`products_bling`)
   - `product_id` → Produto na calculadora (`products`)
3. O frontend poderá buscar vendas reais por produto
4. O campo "Vendas" nos cards mostrará o número correto

## 📝 Notas Importantes

- Se o SKU não for encontrado, `product_bling_id` e `product_id` serão `null`
- O campo `code` vem do item do pedido (`item.codigo`)
- O `total_value` é calculado: `(quantidade * valor) - desconto`
- Todos os valores numéricos são convertidos com `parseFloat()`
- O loop processa cada item individualmente

## 🚀 Próximos Passos

1. ✅ Atualizar workflow n8n com os novos nós
2. ✅ Testar criando um pedido no Bling
3. ✅ Verificar se os itens foram salvos em `bling_order_items`
4. ✅ Atualizar `salesStatsService.ts` para buscar vendas reais
5. ✅ Conectar hooks nos componentes do frontend
