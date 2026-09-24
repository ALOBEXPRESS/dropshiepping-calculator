# Resumo Financeiro em Tempo Real

## Objetivo
Atualizar automaticamente o resumo financeiro geral (Total de Lucro, Total de Vendas e Despesas Estimadas) com base nos pedidos reais sincronizados do Bling, substituindo os valores fixos/calculados por dados reais.

## Implementação

### 1. Serviço de Estatísticas de Vendas

O serviço `salesStatsService.ts` foi atualizado para calcular o resumo financeiro real baseado nos pedidos do Bling.

#### Função `getGeneralFinancialSummary()`

```typescript
export async function getGeneralFinancialSummary(): Promise<GeneralFinancialSummary> {
  // 1. Buscar todos os pedidos sincronizados
  const { data: orders } = await supabase
    .from('bling_orders')
    .select('id, total_amount, commission_tax, shipping_cost, other_expenses')
    .eq('sync_status', 'synced');

  const totalSales = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, order) => 
    sum + (order.total_amount || 0), 0) || 0;

  // 2. Buscar todos os itens vendidos com informações de custo
  const { data: orderItems } = await supabase
    .from('bling_order_items')
    .select(`
      quantity,
      unit_value,
      total_value,
      product_id,
      product_bling_id,
      products (cost_price),
      products_bling (cost_price)
    `);

  // 3. Calcular custo total dos produtos vendidos
  let totalProductCost = 0;
  orderItems?.forEach(item => {
    const quantity = item.quantity || 0;
    let costPrice = 0;
    
    // Tentar pegar o custo do produto cadastrado ou do produto Bling
    if (item.products && item.products[0]) {
      costPrice = item.products[0].cost_price || 0;
    } else if (item.products_bling && item.products_bling[0]) {
      costPrice = item.products_bling[0].cost_price || 0;
    }
    
    totalProductCost += quantity * costPrice;
  });

  // 4. Calcular despesas totais
  const totalFees = orders?.reduce((sum, order) => 
    sum + (order.commission_tax || 0) + (order.shipping_cost || 0) + (order.other_expenses || 0), 0) || 0;
  
  const totalExpenses = totalFees + totalProductCost;

  // 5. Calcular lucro real
  const totalProfit = totalRevenue - totalExpenses;

  return {
    total_profit: totalProfit,
    total_sales: totalSales,
    estimated_expenses: totalExpenses
  };
}
```

### 2. Hook `useGeneralFinancialSummary`

O hook já existente em `useSalesStats.ts` busca o resumo financeiro e atualiza automaticamente a cada 30 segundos:

```typescript
export function useGeneralFinancialSummary() {
  const [summary, setSummary] = useState<GeneralFinancialSummary>({
    total_profit: 0,
    total_sales: 0,
    estimated_expenses: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const data = await getGeneralFinancialSummary();
      setSummary(data);
    };

    fetchSummary();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchSummary, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { summary, loading, error, refresh };
}
```

### 3. Integração no Componente DropshippingCalculator

#### Import do Hook
```typescript
import { useGeneralFinancialSummary } from '../hooks/useSalesStats';
```

#### Uso do Hook
```typescript
// Hook para buscar resumo financeiro real do Bling
const { summary: blingFinancialSummary, loading: blingFinancialLoading } = useGeneralFinancialSummary();
```

#### Atualização do `globalSummaryMetrics`
```typescript
const globalSummaryMetrics = useMemo(() => {
  // Usar dados reais do Bling se disponíveis
  const totalSales = blingFinancialSummary.total_sales;
  const totalProfit = blingFinancialSummary.total_profit;
  const totalExpenses = blingFinancialSummary.estimated_expenses;
  
  // Calcular taxa de inatividade do Enjoei (mantido do cálculo anterior)
  const enjoeiProducts = effectiveProducts.filter(p => p.marketplace === 'enjoei');
  // ... lógica de inatividade
  
  return { totalSales, totalProfit, totalExpenses, inactivityFee };
}, [effectiveProducts, blingFinancialSummary]);
```

## Como Funciona

### Fluxo de Dados

1. **Pedido Criado no Bling**
   - Webhook é disparado
   - Workflow n8n sincroniza o pedido para `bling_orders`
   - Itens do pedido são inseridos em `bling_order_items`

2. **Cálculo do Resumo Financeiro**
   - Hook `useGeneralFinancialSummary` chama `getGeneralFinancialSummary()`
   - Busca todos os pedidos com `sync_status = 'synced'`
   - Busca todos os itens vendidos com seus custos
   - Calcula:
     - **Total de Vendas**: Quantidade de pedidos
     - **Receita Total**: Soma de `total_amount` dos pedidos
     - **Custo dos Produtos**: Soma de `quantity * cost_price` dos itens
     - **Taxas**: Soma de `commission_tax + shipping_cost + other_expenses`
     - **Despesas Totais**: Custo dos produtos + Taxas
     - **Lucro Total**: Receita - Despesas

3. **Atualização Automática**
   - Hook atualiza os dados a cada 30 segundos
   - Componente re-renderiza com os novos valores
   - Resumo financeiro é atualizado automaticamente

### Cálculo do Lucro

```
Lucro = Receita Total - Despesas Totais

Onde:
- Receita Total = Soma de todos os total_amount dos pedidos
- Despesas Totais = Custo dos Produtos + Taxas
- Custo dos Produtos = Soma de (quantity × cost_price) de cada item
- Taxas = Soma de (commission_tax + shipping_cost + other_expenses) dos pedidos
```

### Relacionamento entre Tabelas

```
bling_orders (id, total_amount, commission_tax, shipping_cost, other_expenses)
    ↓
bling_order_items (order_id, quantity, product_id, product_bling_id)
    ↓
products (id, cost_price) ou products_bling (id, cost_price)
```

## Benefícios

1. **Dados Reais**: Substituição de valores fixos/estimados por dados reais do Bling
2. **Atualização Automática**: Resumo financeiro atualiza a cada 30 segundos
3. **Cálculo Preciso**: Considera custos reais dos produtos vendidos
4. **Visibilidade Financeira**: Acompanhamento em tempo real do desempenho do negócio
5. **Tomada de Decisão**: Dados precisos para decisões estratégicas

## Exibição no Resumo Financeiro

O resumo financeiro exibe:

- **Lucro**: Valor calculado com base na receita menos despesas reais
- **Total de Vendas**: Quantidade de pedidos sincronizados do Bling
- **Despesas Estimadas**: Soma dos custos dos produtos + taxas dos pedidos

## Atualização em Tempo Real

O resumo é atualizado:
- Automaticamente a cada 30 segundos
- Quando novos pedidos são sincronizados do Bling
- Quando o componente é montado/recarregado

## Arquivos Modificados

- `src/services/salesStatsService.ts` - Atualizado cálculo do resumo financeiro
- `src/hooks/useSalesStats.ts` - Hook já existente para buscar resumo
- `src/components/DropshippingCalculator.tsx` - Integração do hook no componente
- `docs/RESUMO_FINANCEIRO_TEMPO_REAL.md` - Documentação da feature

## Data
2025-02-22
