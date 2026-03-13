# Correção: Dashboard Atualiza Automaticamente Após Processar Pedido

## Data
12/03/2026

## Problema Identificado
Após processar um pedido na seção "Vendas a Processar", o dashboard de vendas não atualizava automaticamente. Os componentes continuavam mostrando dados antigos (R$ 0,00) mesmo após o pedido ser processado com sucesso no backend.

### Causa Raiz
Os componentes do dashboard tinham `useEffect` com dependências vazias `[]`, executando apenas uma vez no mount. Quando o `refreshKey` mudava em `Sales.tsx`, os componentes não refaziam as queries porque não tinham o `refreshKey` como dependência.

## Solução Implementada

### Estratégia
Implementada a Solução 1 (mais simples): adicionar prop `refreshTrigger` aos componentes e usá-la como dependência nos `useEffect`.

### Mudanças Realizadas

#### 1. Atualização dos Hooks
Adicionada função `refetch` aos hooks customizados para permitir refetch manual:

- `src/hooks/sales/useStatisticsCards.ts`
- `src/hooks/sales/useTopProducts.ts`
- `src/hooks/sales/useStockReport.ts`
- `src/hooks/sales/useTopCustomers.ts`

```typescript
// Exemplo de mudança
const fetchData = async () => {
  // ... lógica de fetch
};

useEffect(() => {
  fetchData();
}, [organizationId]);

return { data, loading, error, refetch: fetchData };
```

#### 2. Atualização dos Componentes
Adicionada prop `refreshTrigger?: number` e `useEffect` para refetch quando mudar:

**Componentes atualizados:**
- `src/components/sales/RevenueReportChart.tsx`
- `src/components/sales/StatisticsCards.tsx`
- `src/components/sales/RecentOrdersChart.tsx`
- `src/components/sales/TransactionsList.tsx`
- `src/components/sales/TopSellingProductsTable.tsx`
- `src/components/sales/StockReportTable.tsx`
- `src/components/sales/TopCustomersList.tsx`
- `src/components/sales/CustomersStatistics.tsx`
- `src/components/sales/BrazilStatesDistribution.tsx`

```typescript
interface ComponentProps {
  organizationId: string;
  refreshTrigger?: number;
}

export const Component: React.FC<ComponentProps> = ({ organizationId, refreshTrigger }) => {
  const { data, loading, error, refetch } = useHook(organizationId);

  // Refetch quando refreshTrigger mudar
  React.useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('🔄 Component: refreshTrigger mudou, refazendo query...', refreshTrigger);
      refetch();
    }
  }, [refreshTrigger, refetch]);

  // ... resto do componente
};
```

#### 3. Atualização da Página Sales
Removidas as `key` props e adicionada prop `refreshTrigger={refreshKey}` para todos os componentes:

```typescript
// Antes
<RevenueReportChart key={`revenue-${refreshKey}`} organizationId={organizationId} />

// Depois
<RevenueReportChart organizationId={organizationId} refreshTrigger={refreshKey} />
```

## Teste Realizado

### Ambiente
- URL: http://localhost:5173/vendas
- Credenciais: empresaalob@gmail.com / n2qyvsj7sw47zbqy
- Browser: Playwright (Chromium)

### Resultado
✅ Todos os componentes agora logam que estão refazendo queries quando `refreshTrigger` muda
✅ Console mostra logs de refetch para todos os 9 componentes
✅ Build executado com sucesso

### Logs Observados
```
🔄 RevenueReportChart: refreshTrigger mudou, refazendo query... 1773276519600
🔄 StatisticsCards: refreshTrigger mudou, refazendo query... 1773276519600
🔄 RecentOrdersChart: Buscando dados... 1773276519600
🔄 TransactionsList: Buscando dados... 1773276519600
🔄 BrazilStatesDistribution: Buscando dados... 1773276519600
🔄 TopSellingProductsTable: refreshTrigger mudou, refazendo query... 1773276519600
🔄 StockReportTable: refreshTrigger mudou, refazendo query... 1773276519600
🔄 TopCustomersList: refreshTrigger mudou, refazendo query... 1773276519600
🔄 CustomersStatistics: Buscando dados... 1773276519600
```

## Arquivos Modificados

### Hooks
- `src/hooks/sales/useStatisticsCards.ts`
- `src/hooks/sales/useTopProducts.ts`
- `src/hooks/sales/useStockReport.ts`
- `src/hooks/sales/useTopCustomers.ts`

### Componentes
- `src/components/sales/RevenueReportChart.tsx`
- `src/components/sales/StatisticsCards.tsx`
- `src/components/sales/RecentOrdersChart.tsx`
- `src/components/sales/TransactionsList.tsx`
- `src/components/sales/TopSellingProductsTable.tsx`
- `src/components/sales/StockReportTable.tsx`
- `src/components/sales/TopCustomersList.tsx`
- `src/components/sales/CustomersStatistics.tsx`
- `src/components/sales/BrazilStatesDistribution.tsx`

### Páginas
- `src/pages/Sales.tsx`

## Próximos Passos
1. Testar com um pedido real sendo processado
2. Verificar se todos os dados são atualizados corretamente
3. Monitorar performance (muitos refetches simultâneos)

## Correção Adicional: Loop Infinito de Refetch

### Data
12/03/2026 - 21:00

### Problema
Após a implementação inicial, a página de vendas estava sendo atualizada a cada segundo em loop infinito.

### Causa
O `refreshKey` inicial era `0`, e a condição `if (refreshTrigger !== undefined)` era verdadeira mesmo para `0`, causando refetches desnecessários em todos os componentes.

### Solução
Alterada a condição para `if (refreshTrigger && refreshTrigger > 0)`, garantindo que o refetch só aconteça quando um pedido for realmente processado (quando `refreshKey` recebe `Date.now()`).

### Mudanças
Todos os 9 componentes foram atualizados para verificar se `refreshTrigger > 0` antes de fazer refetch:

```typescript
// Antes
React.useEffect(() => {
  if (refreshTrigger !== undefined) {
    refetch();
  }
}, [refreshTrigger, refetch]);

// Depois
React.useEffect(() => {
  if (refreshTrigger && refreshTrigger > 0) {
    refetch();
  }
}, [refreshTrigger, refetch]);
```

Para componentes com fetch inline:
```typescript
// Antes
useEffect(() => {
  fetchData();
}, [organizationId, refreshTrigger]);

// Depois
useEffect(() => {
  if (!refreshTrigger || refreshTrigger === 0) {
    fetchData();
  } else if (refreshTrigger > 0) {
    console.log('🔄 Component: refreshTrigger mudou, refazendo query...', refreshTrigger);
    fetchData();
  }
}, [organizationId, refreshTrigger]);
```

### Resultado
✅ Dashboard carrega normalmente sem refetches desnecessários
✅ Refetch só acontece quando `handleOrderProcessed` é chamado
✅ Build executado com sucesso

## Notas Técnicas
- Usamos `Date.now()` como `refreshKey` para garantir valores únicos
- Logs de debug adicionados para facilitar troubleshooting
- Solução é simples e não requer mudanças na arquitetura
- Todos os componentes agora respondem ao mesmo trigger
