# Adição: Estatísticas de Vendas na Projeção de Lucros

**Data**: 28 de fevereiro de 2026  
**Status**: ✅ Concluído

## Objetivo

Adicionar campos "Total de vendas" e "Total de lucro" na seção de Projeção de Lucros, exibindo dados reais de vendas do produto vindos do banco de dados.

## Implementação

### 1. Hook Criado: `useProductSalesStats`

**Arquivo**: `src/hooks/useProductSalesStats.ts`

Hook customizado que busca estatísticas de vendas de um produto específico do banco de dados.

```typescript
export interface ProductSalesStats {
  totalSales: number;        // Número de pedidos
  totalQuantity: number;     // Quantidade total vendida
  totalProfit: number;       // Lucro total
  totalRevenue: number;      // Receita total
}
```

**Funcionalidades**:
- Busca dados da tabela `order_items` relacionados ao produto
- Filtra pedidos cancelados (status != 'cancelled')
- Calcula automaticamente:
  - Total de pedidos (totalSales)
  - Quantidade total vendida (totalQuantity)
  - Lucro total acumulado (totalProfit)
  - Receita total (totalRevenue)
- Retorna loading state e error handling

**Query SQL Utilizada**:
```sql
SELECT 
  quantity,
  total_price,
  profit,
  order:orders!inner(status)
FROM order_items
WHERE product_id = ?
AND order.status != 'cancelled'
```

### 2. Componente Atualizado: `ProfitProjection`

**Arquivo**: `src/components/calculator/ProfitProjection.tsx`

Adicionados dois cards acima das projeções de vendas (50 UN, 100 UN, etc.):

```tsx
{/* Estatísticas Reais de Vendas */}
<div className="grid grid-cols-2 gap-4 mb-6">
  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
    <p className="text-xs font-bold opacity-70 mb-2 uppercase text-white">Total de vendas</p>
    <p className="text-2xl font-bold text-white">{salesStats.totalQuantity}</p>
    <p className="text-xs opacity-70 mt-1 text-white">{salesStats.totalSales} {salesStats.totalSales === 1 ? 'pedido' : 'pedidos'}</p>
  </div>
  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
    <p className="text-xs font-bold opacity-70 mb-2 uppercase text-white">Total de lucro</p>
    <p className="text-2xl font-bold text-white">R$ {formatCompactCurrency(salesStats.totalProfit)}</p>
    <p className="text-xs opacity-70 mt-1 text-white">Receita: R$ {formatCompactCurrency(salesStats.totalRevenue)}</p>
  </div>
</div>
```

**Estrutura Visual**:

```
┌─────────────────────────────────────────────────────┐
│  PROJEÇÃO DE LUCROS                                 │
├─────────────────────────────────────────────────────┤
│  [Imagem do Produto]  [Dados do Produto]            │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │ Total de vendas      │  │ Total de lucro       │ │
│  │ 0                    │  │ R$ 0,00              │ │
│  │ 0 pedidos            │  │ Receita: R$ 0,00     │ │
│  └──────────────────────┘  └──────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  [VENDER 50 UN]  [VENDER 100 UN]  [VENDER 200 UN]   │
│  [VENDER 300 UN] [VENDER 400 UN]  [VENDER 500 UN]   │
└─────────────────────────────────────────────────────┘
```

## Campos Exibidos

### Card 1: Total de vendas
- **Título**: "Total de vendas"
- **Valor principal**: Quantidade total vendida (totalQuantity)
- **Valor secundário**: Número de pedidos (ex: "5 pedidos")

### Card 2: Total de lucro
- **Título**: "Total de lucro"
- **Valor principal**: Lucro total acumulado (totalProfit)
- **Valor secundário**: Receita total (ex: "Receita: R$ 1.500,00")

## Estrutura do Banco de Dados

### Tabela `order_items`

Relaciona pedidos com produtos e armazena informações de vendas:

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  unit_cost NUMERIC,
  total_cost NUMERIC,
  profit NUMERIC,
  profit_margin NUMERIC,
  product_name TEXT,
  product_image_url TEXT,
  bling_item_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Tabela `orders`

Armazena informações dos pedidos:

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  organization_id UUID,
  customer_id UUID,
  order_number TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL,  -- 'pending', 'completed', 'cancelled', etc.
  marketplace_id UUID,
  sales_channel_id UUID,
  lead_id UUID,
  order_date DATE,
  shipping_cost NUMERIC,
  discount_value NUMERIC,
  other_expenses NUMERIC,
  marketplace_commission NUMERIC,
  total_cost NUMERIC,
  total_profit NUMERIC,
  profit_margin NUMERIC,
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Lógica de Cálculo

### Total de Vendas (totalQuantity)
```typescript
const totalQuantity = data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
```

### Total de Pedidos (totalSales)
```typescript
const totalSales = data?.length || 0;
```

### Total de Lucro (totalProfit)
```typescript
const totalProfit = data?.reduce((sum, item) => sum + (Number(item.profit) || 0), 0) || 0;
```

### Total de Receita (totalRevenue)
```typescript
const totalRevenue = data?.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0) || 0;
```

## Comportamento

### Produto Sem Vendas
```
┌──────────────────────┐  ┌──────────────────────┐
│ Total de vendas      │  │ Total de lucro       │
│ 0                    │  │ R$ 0,00              │
│ 0 pedidos            │  │ Receita: R$ 0,00     │
└──────────────────────┘  └──────────────────────┘
```

### Produto Com Vendas
```
┌──────────────────────┐  ┌──────────────────────┐
│ Total de vendas      │  │ Total de lucro       │
│ 150                  │  │ R$ 1.500,00          │
│ 25 pedidos           │  │ Receita: R$ 3.000,00 │
└──────────────────────┘  └──────────────────────┘
```

## Filtros Aplicados

### Pedidos Cancelados
Pedidos com status 'cancelled' são excluídos do cálculo:

```typescript
.neq('order.status', 'cancelled')
```

### Produto Específico
Apenas itens relacionados ao produto atual são considerados:

```typescript
.eq('product_id', productId)
```

## Performance

### Otimizações
- ✅ Query única para buscar todos os dados necessários
- ✅ Cálculos realizados no frontend (reduce)
- ✅ Cache automático do React (useEffect com dependência de productId)
- ✅ Loading state para evitar renderizações desnecessárias

### Impacto
- Query leve (apenas campos necessários)
- Sem joins complexos
- Índices existentes em `product_id` e `order_id`

## Estados do Hook

### Loading
```typescript
const { stats, loading, error } = useProductSalesStats(productId);

if (loading) {
  // Exibe valores zerados enquanto carrega
}
```

### Error
```typescript
if (error) {
  console.error('Error fetching product sales stats:', error);
  // Exibe valores zerados em caso de erro
}
```

### Success
```typescript
// Exibe estatísticas reais do banco de dados
<p>{salesStats.totalQuantity}</p>
<p>R$ {formatCompactCurrency(salesStats.totalProfit)}</p>
```

## Integração com MCP Supabase

O hook utiliza o cliente Supabase configurado no projeto:

```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('order_items')
  .select(`
    quantity,
    total_price,
    profit,
    order:orders!inner(status)
  `)
  .eq('product_id', productId)
  .neq('order.status', 'cancelled');
```

## Testes Realizados

### Cenário 1: Produto Sem Vendas
1. ✅ Produto recém-criado
2. ✅ Exibe "0" em total de vendas
3. ✅ Exibe "R$ 0,00" em total de lucro
4. ✅ Exibe "0 pedidos"
5. ✅ Exibe "Receita: R$ 0,00"

### Cenário 2: Produto Com Vendas
1. ✅ Produto com pedidos processados
2. ✅ Exibe quantidade total vendida
3. ✅ Exibe lucro total acumulado
4. ✅ Exibe número de pedidos
5. ✅ Exibe receita total

### Cenário 3: Pedidos Cancelados
1. ✅ Pedidos cancelados são excluídos
2. ✅ Estatísticas refletem apenas pedidos válidos

## Arquivos Criados/Modificados

### Criados
- `src/hooks/useProductSalesStats.ts` (hook customizado)
- `docs/ADICAO_ESTATISTICAS_VENDAS_PROJECAO.md` (documentação)

### Modificados
- `src/components/calculator/ProfitProjection.tsx`
  - Adicionado import do hook
  - Adicionado uso do hook
  - Adicionados cards de estatísticas

## Build

```bash
npm run build
# ✅ Build executado com sucesso em 18.37s
```

## Observações

- Estatísticas são atualizadas automaticamente quando o produto muda
- Valores são formatados com `formatCompactCurrency` para melhor legibilidade
- Cards têm design consistente com o restante da interface
- Funciona mesmo quando não há vendas (exibe 0)
- Pedidos cancelados são automaticamente excluídos

## Próximos Passos (Opcional)

### Melhorias Futuras
1. Adicionar gráfico de vendas ao longo do tempo
2. Adicionar comparação com período anterior
3. Adicionar filtro por período (último mês, últimos 3 meses, etc.)
4. Adicionar breakdown por marketplace
5. Adicionar taxa de conversão (vendas / visualizações)

## Conclusão

A funcionalidade foi implementada com sucesso, exibindo estatísticas reais de vendas do produto diretamente do banco de dados. Os campos "Total de vendas" e "Total de lucro" agora aparecem acima das projeções de vendas, fornecendo contexto valioso sobre o desempenho real do produto.
