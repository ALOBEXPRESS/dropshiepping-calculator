# ✅ Lucro Estimado no Card de Pedidos Pendentes

## 🎯 Objetivo

Exibir o **lucro estimado** no card de pedidos pendentes, calculando:
- **Valor Líquido**: Total - Comissão do Marketplace
- **Custo**: Preço de custo dos produtos
- **Lucro Estimado**: Valor Líquido - Custo

## 📊 Fórmula de Cálculo

```
Lucro Estimado = (Total - Comissão Marketplace) - Custo dos Produtos
```

### Exemplo Prático (Pedido #180):
- **Total**: R$ 47,20
- **Comissão Marketplace**: R$ 13,44 (28,47%)
- **Valor Líquido**: R$ 33,76
- **Custo do Produto**: R$ 24,00
- **Lucro Estimado**: R$ 9,76 ✅

## 🔧 Mudanças Implementadas

### 1. View `pending_orders_to_process` (Banco de Dados)

Adicionados 3 novos campos calculados:

```sql
-- Valor líquido a receber (total - comissão)
(bo.total_amount - COALESCE(bo.commission_tax, 0)) as net_revenue,

-- Custo total dos produtos
(
  SELECT COALESCE(SUM(
    boi.quantity * COALESCE(
      (SELECT cost_price FROM products WHERE id = boi.product_id),
      (SELECT cost_price FROM products_variations_bling WHERE id = boi.product_variation_id),
      0
    )
  ), 0)
  FROM bling_order_items boi
  WHERE boi.order_id = bo.id
) as total_cost,

-- Lucro estimado (valor líquido - custo)
(
  bo.total_amount - 
  COALESCE(bo.commission_tax, 0) - 
  [custo total dos produtos]
) as estimated_profit
```

### 2. Tipo TypeScript `PendingOrder`

Adicionados 3 novos campos:

```typescript
export interface PendingOrder {
  // ... campos existentes
  estimated_profit: number;  // NOVO
  net_revenue: number;       // NOVO
  total_cost: number;        // NOVO
}
```

### 3. Componente `PendingOrders.tsx`

Adicionada seção de lucro no card:

```tsx
{/* Lucro Estimado */}
<div className="pt-2 border-t border-gray-200 dark:border-zinc-700">
  <div className="flex items-center justify-between mb-1">
    <p className="text-xs text-gray-500 dark:text-gray-400">
      Valor Líquido
    </p>
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
      {formatCurrency(order.net_revenue)}
    </p>
  </div>
  <div className="flex items-center justify-between mb-1">
    <p className="text-xs text-gray-500 dark:text-gray-400">
      Custo
    </p>
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
      {formatCurrency(order.total_cost)}
    </p>
  </div>
  <div className="flex items-center justify-between pt-1 border-t border-dashed border-gray-300 dark:border-zinc-600">
    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
      Lucro Estimado
    </p>
    <p className={`text-base font-bold ${
      order.estimated_profit > 0 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-red-600 dark:text-red-400'
    }`}>
      {formatCurrency(order.estimated_profit)}
    </p>
  </div>
</div>
```

## 🎨 Visual do Card

```
┌─────────────────────────────────────┐
│  [Imagem do Produto]     [Badge]    │
├─────────────────────────────────────┤
│  Pedido #180          02/05/2026    │
│  Marina Ferreira Da Silva           │
├─────────────────────────────────────┤
│  Valor Total            Itens       │
│  R$ 47,20                 1         │
├─────────────────────────────────────┤
│  Valor Líquido      R$ 33,76        │
│  Custo              R$ 24,00        │
│  ─────────────────────────────      │
│  Lucro Estimado     R$ 9,76 ✅      │
├─────────────────────────────────────┤
│  Comissão: 28,47%                   │
├─────────────────────────────────────┤
│  [PROCESSAR LUCRO]  [🗑️]            │
└─────────────────────────────────────┘
```

## 📝 Observações

### ✅ O Que Está Incluído no Cálculo:
- Preço de custo dos produtos (da tabela `products` ou `products_variations_bling`)
- Comissão do marketplace (campo `commission_tax` da tabela `bling_orders`)

### ❌ O Que NÃO Está Incluído (conforme solicitado):
- Custo do fornecedor (não aplicável para fornecedor "Tyr")
- Custo de transação do gateway de pagamento
- Frete
- Outras despesas

### 🔍 Fornecedor "Tyr":
Como o fornecedor é "Tyr", não há:
- Custo adicional do fornecedor
- Taxa de transação do fornecedor
- O custo é apenas o `cost_price` do produto

## 🧪 Teste

Para testar, basta:
1. Acessar a página de vendas pendentes
2. Verificar que o card agora exibe:
   - Valor Líquido
   - Custo
   - Lucro Estimado (em verde se positivo, vermelho se negativo)

## 📊 Exemplo de Cálculo Completo

### Pedido #180 (Shopee):
```
Total do Pedido:        R$ 47,20
Comissão Shopee (28,47%): R$ 13,44
─────────────────────────────────
Valor Líquido:          R$ 33,76

Custo do Produto:       R$ 24,00
─────────────────────────────────
Lucro Estimado:         R$ 9,76 ✅
Margem de Lucro:        28,9%
```

---

**Data**: 2026-05-03  
**Status**: ✅ Implementado e testado  
**Arquivos Modificados**:
- `src/types/pendingOrder.ts`
- `src/components/PendingOrders.tsx`
- View `pending_orders_to_process` (Supabase)
