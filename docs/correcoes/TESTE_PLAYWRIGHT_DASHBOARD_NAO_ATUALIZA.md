# Teste Playwright: Dashboard Não Atualiza Após Processar Pedido

## Data do Teste
2026-03-12 00:48

## Objetivo
Verificar se o dashboard de vendas atualiza automaticamente após clicar em "Processar Lucro".

## Cenário de Teste

### Estado Inicial
- 1 pedido pendente (Pedido #120)
- Valor: R$ 89,80
- Relatório de Receita: R$ 0,00 (Receita) / R$ 0,00 (Custo)
- Total de Pedidos: 0
- Total de Vendas: R$ 0

### Ação Executada
1. Navegou para `/vendas`
2. Capturou screenshot do estado inicial
3. Clicou no botão "PROCESSAR LUCRO"
4. Aguardou 2 segundos
5. Capturou screenshot do estado final

## Resultados

### ✅ O que funcionou

1. **Processamento do Pedido**
   - Pedido #120 foi processado com sucesso
   - Dados inseridos corretamente no banco:
     ```sql
     order_number: 120
     total_amount: 49.90
     total_cost: 0.00
     total_profit: 47.23
     profit_margin: 94.65%
     ```

2. **Callback Chain**
   - Console logs mostram que o fluxo funcionou:
     ```
     🔄 Processando pedido: 47ecaa01-5129-4f81-98aa-ad817e2dba14
     ✅ Resultado processado: {success: true, ...}
     🎉 Pedido processado com sucesso!
     📢 Notificando componente pai...
     ✅ Callback onOrderProcessed existe, chamando...
     🔄 Pedido processado! Atualizando todos os componentes...
     🔄 refreshKey anterior: 0
     🔄 Novo refreshKey: 1773276519600
     ```

3. **UI de Pedidos Pendentes**
   - Seção "Vendas a Processar" atualizou corretamente
   - Mostra "Tudo processado!" após o processamento

### ❌ O que NÃO funcionou

1. **Relatório de Receita**
   - Continuou mostrando R$ 0,00 para Receita
   - Continuou mostrando R$ 0,00 para Custo
   - **Esperado**: R$ 49,90 (Receita) / R$ 0,00 (Custo)

2. **Estatísticas**
   - Total de Pedidos: continuou em 0 (esperado: 1)
   - Total de Vendas: continuou em R$ 0 (esperado: R$ 49,90)

3. **Outros Componentes**
   - Pedidos Recentes: não atualizou
   - Transações: não atualizou
   - Produtos Mais Vendidos: não atualizou

## Análise Técnica

### Causa Raiz

O problema está na implementação do `refreshKey` nos componentes. Embora o `refreshKey` seja atualizado corretamente na página `Sales.tsx`, os componentes filhos não estão refazendo as queries quando o `key` muda.

### Código Atual

**Sales.tsx** (✅ Correto):
```typescript
const handleOrderProcessed = () => {
  console.log('🔄 Pedido processado! Atualizando todos os componentes...');
  const newKey = Date.now();
  setRefreshKey(newKey);
};

// Componentes com key
<RevenueReportChart key={`revenue-${refreshKey}`} organizationId={organizationId} />
<StatisticsCards key={`stats-${refreshKey}`} organizationId={organizationId} />
```

**RevenueReportChart.tsx** (⚠️ Problema):
```typescript
export const RevenueReportChart: React.FC<RevenueReportChartProps> = ({ organizationId }) => {
  const { data, loading, error, refetch } = useRevenueReport(organizationId, period);
  
  // Forçar refetch quando o componente é montado (quando key muda)
  React.useEffect(() => {
    refetch();
  }, []);  // ❌ Dependências vazias - só executa uma vez!
```

### Problema Identificado

O `useEffect` em `RevenueReportChart.tsx` tem dependências vazias `[]`, o que significa que só executa uma vez quando o componente é montado pela primeira vez. Quando o `key` muda e o componente é remontado, o `useEffect` deveria executar novamente, mas pode não estar funcionando como esperado.

## Soluções Propostas

### Solução 1: Adicionar refetch no useEffect com dependência do key

Passar o `refreshKey` como prop e usá-lo como dependência:

```typescript
// Sales.tsx
<RevenueReportChart 
  key={`revenue-${refreshKey}`} 
  organizationId={organizationId}
  refreshTrigger={refreshKey}  // Nova prop
/>

// RevenueReportChart.tsx
interface RevenueReportChartProps {
  organizationId: string;
  refreshTrigger?: number;  // Nova prop
}

export const RevenueReportChart: React.FC<RevenueReportChartProps> = ({ 
  organizationId, 
  refreshTrigger 
}) => {
  const { data, loading, error, refetch } = useRevenueReport(organizationId, period);
  
  React.useEffect(() => {
    refetch();
  }, [refreshTrigger, refetch]);  // ✅ Refetch quando refreshTrigger mudar
```

### Solução 2: Usar React Query com invalidação de cache

Substituir os hooks customizados por React Query e invalidar o cache quando o pedido for processado:

```typescript
// PendingOrders.tsx
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const processOrder = async (blingOrderId: string) => {
  // ... processar pedido
  
  if (result.success) {
    // Invalidar todas as queries relacionadas
    queryClient.invalidateQueries({ queryKey: ['revenue-report'] });
    queryClient.invalidateQueries({ queryKey: ['statistics'] });
    queryClient.invalidateQueries({ queryKey: ['recent-orders'] });
    
    onOrderProcessed?.();
  }
};
```

### Solução 3: Forçar remontagem completa com timestamp no key

Garantir que o componente seja completamente destruído e recriado:

```typescript
// Sales.tsx
const [mountKey, setMountKey] = useState(Date.now());

const handleOrderProcessed = () => {
  setMountKey(Date.now());  // Força remontagem completa
};

return (
  <div key={mountKey}>  {/* Key no container pai */}
    <RevenueReportChart organizationId={organizationId} />
    <StatisticsCards organizationId={organizationId} />
    {/* ... outros componentes */}
  </div>
);
```

## Recomendação

**Implementar Solução 1** por ser a mais simples e direta:
1. Adicionar prop `refreshTrigger` aos componentes
2. Usar `refreshTrigger` como dependência no `useEffect`
3. Garantir que `refetch()` seja chamado quando `refreshTrigger` mudar

## Próximos Passos

1. Implementar a solução escolhida
2. Testar novamente com Playwright
3. Verificar se todos os componentes atualizam corretamente
4. Documentar a solução final

## Screenshots

- `before-process-order.png`: Estado inicial com pedido pendente
- `after-process-order.png`: Estado após processar (mostra que não atualizou)

## Logs do Console

```
🔄 Processando pedido: 47ecaa01-5129-4f81-98aa-ad817e2dba14
🔄 Tipo do blingOrderId: string
🔄 blingOrderId é válido? true
📦 Resposta da RPC:
  - data: {success: true, message: Pedido processado com sucesso, order_id: 4aa28bdd-27d2-48e2-85b6-9107cab7472b, order_number: 120, items_processed: 1}
  - error: null
✅ Resultado processado: {success: true, ...}
  - success: true
  - message: Pedido processado com sucesso
🎉 Pedido processado com sucesso!
📢 Notificando componente pai...
✅ Callback onOrderProcessed existe, chamando...
🔄 Pedido processado! Atualizando todos os componentes...
🔄 refreshKey anterior: 0
🔄 Novo refreshKey: 1773276519600
```

## Conclusão

O sistema de callbacks e atualização de `refreshKey` está funcionando perfeitamente. O problema está na implementação dos componentes filhos que não estão refazendo as queries quando são remontados com um novo `key`. A solução requer adicionar uma prop `refreshTrigger` e usá-la como dependência nos `useEffect` dos componentes.
