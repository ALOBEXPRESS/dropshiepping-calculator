# Integração de Vendas no Frontend - Resumo

## ✅ O que foi implementado

### 1. Serviço de Estatísticas de Vendas (`src/services/salesStatsService.ts`)
Criado serviço completo com as seguintes funções:

- `getProductSalesStats(productId)` - Estatísticas de vendas por produto
- `getGeneralFinancialSummary()` - Resumo financeiro geral (lucro, vendas, despesas)
- `getTopPriceProductsByMarketplace()` - Produtos com maior preço por marketplace
- `getTopProfitProductsByMarketplace()` - Produtos com maior lucro por marketplace
- `getProductCountByMarketplace()` - Total de produtos por marketplace

### 2. Hooks React (`src/hooks/useSalesStats.ts`)
Criados hooks customizados para facilitar o uso:

- `useProductSalesStats(productId)` - Hook para estatísticas de produto específico
- `useGeneralFinancialSummary()` - Hook para resumo financeiro geral
- `useTopProductsByMarketplace()` - Hook para top produtos
- `useProductCountByMarketplace()` - Hook para contagem por marketplace

Todos os hooks incluem:
- Auto-refresh a cada 30 segundos
- Estados de loading e error
- Função de refresh manual

### 3. Atualização do ProductCard
- ✅ Adicionado campo "Vendas" no card do produto
- ✅ Reorganizado layout (SKU agora ocupa 2 colunas)
- ✅ Vendas destacadas em verde (emerald-600)

## 📋 Próximos Passos

### Passo 1: Conectar os dados reais de vendas
Atualmente o campo "Vendas" está fixo em "0". Você precisa:

1. **Criar tabela `bling_order_items`** (se ainda não existe):
```sql
CREATE TABLE bling_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES bling_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  bling_product_id BIGINT,
  sku TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(10,2),
  total_price NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **Atualizar o workflow n8n** para salvar os itens do pedido na tabela `bling_order_items`

3. **Atualizar o ProductCard** para buscar vendas reais:
```typescript
// Adicionar no ProductCard.tsx
import { useProductSalesStats } from '@/hooks/useSalesStats';

// Dentro do componente:
const { stats } = useProductSalesStats(product.id);
const salesCount = stats?.total_sales || 0;

// No JSX, trocar:
<p className="truncate text-xs font-semibold text-emerald-600" title="0">
  0
</p>
// Por:
<p className="truncate text-xs font-semibold text-emerald-600" title={String(salesCount)}>
  {salesCount}
</p>
```

### Passo 2: Atualizar Resumo Financeiro Geral
No componente que mostra o resumo financeiro (imagem 3), adicionar:

```typescript
import { useGeneralFinancialSummary } from '@/hooks/useSalesStats';

const { summary, loading } = useGeneralFinancialSummary();

// Usar:
// summary.total_profit - Lucro total
// summary.total_sales - Total de vendas
// summary.estimated_expenses - Despesas estimadas
```

### Passo 3: Atualizar "Maior Preço/Lucro por Marketplace"
No componente que mostra os top produtos (imagem 4), adicionar:

```typescript
import { useTopProductsByMarketplace } from '@/hooks/useSalesStats';

const { topPriceProducts, topProfitProducts, loading } = useTopProductsByMarketplace(5);

// topPriceProducts - Array com top 5 produtos por preço
// topProfitProducts - Array com top 5 produtos por lucro
// Cada item tem: product_name, marketplace, price, profit, sales_count, image_url
```

### Passo 4: Atualizar "Total de Produtos por Marketplace"
```typescript
import { useProductCountByMarketplace } from '@/hooks/useSalesStats';

const { counts, loading } = useProductCountByMarketplace();

// counts - Array com { marketplace: string, count: number }
```

### Passo 5: Atualizar campo "VENDAS" no Marketing
No formulário de marketing (imagem 2), conectar com as vendas reais do produto.

## 🔄 Fluxo Completo de Dados

```
Bling → Webhook n8n → Supabase (bling_orders + bling_order_items)
                              ↓
                    salesStatsService.ts
                              ↓
                       useSalesStats.ts
                              ↓
                    Componentes React
```

## 🎯 Benefícios

1. **Dados em tempo real**: Auto-refresh a cada 30 segundos
2. **Performance**: Queries otimizadas no Supabase
3. **Reutilizável**: Hooks podem ser usados em qualquer componente
4. **Escalável**: Fácil adicionar novas métricas
5. **Type-safe**: TypeScript em todo o código

## 📝 Notas Importantes

- Os dados de vendas só aparecerão depois que você criar a tabela `bling_order_items`
- O workflow n8n precisa ser atualizado para salvar os itens do pedido
- Todos os hooks incluem tratamento de erro e loading states
- As queries são otimizadas para não sobrecarregar o banco

## 🚀 Como Testar

1. Crie um pedido no Bling
2. Aguarde o webhook processar
3. Verifique se o pedido apareceu em `bling_orders`
4. Os componentes devem atualizar automaticamente em até 30 segundos
5. Ou force um refresh manual usando a função `refresh()` dos hooks
