# Problema: Dados Zerados na Página de Vendas

**Data**: 28 de fevereiro de 2026  
**Status**: 🔍 Investigação

## Problema Identificado

Na página de Vendas (Dashboard de Vendas), vários campos estão aparecendo com valores zerados ou com muitos zeros decimais:

### Tabela `orders`
- `marketplace_commission`: 0.00000000000000000000
- `total_cost`: 0.000
- `total_profit`: 74.800000000000000000
- `profit_margin`: 100.000000000000000000

### Tabela `financial_summary`
- `total_commissions`: 0.00000000000000000000
- `total_profit`: 74.800000000000000000

### Dashboard de Vendas
- Mensagem de erro: "Erro ao carregar dados"

## Causas Possíveis

### 1. Problema de Precisão Decimal no PostgreSQL

Os campos numéricos podem estar definidos com precisão excessiva (ex: `numeric(30,20)`), causando:
- Valores com muitos zeros decimais
- Problemas de arredondamento
- Dificuldade de leitura

**Solução**: Ajustar precisão dos campos para valores razoáveis (ex: `numeric(10,2)` para valores monetários)

### 2. Dados Não Calculados

Os campos podem não estar sendo calculados corretamente ao criar/atualizar pedidos:
- `marketplace_commission` não está sendo calculado
- `total_cost` não está sendo calculado
- Valores estão sendo salvos como 0

**Solução**: Verificar e corrigir a lógica de cálculo ao salvar pedidos

### 3. Erro no Serviço de Estatísticas

O serviço `salesStatsService.ts` pode estar falhando ao buscar dados:
- Query SQL incorreta
- Tabelas não existem
- Permissões RLS bloqueando acesso

**Solução**: Verificar logs e corrigir queries

## Investigação Necessária

### 1. Verificar Schema das Tabelas

```sql
-- Verificar estrutura da tabela orders
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN ('marketplace_commission', 'total_cost', 'total_profit', 'profit_margin');

-- Verificar estrutura da tabela financial_summary
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'financial_summary';
```

### 2. Verificar Dados Existentes

```sql
-- Ver dados da tabela orders
SELECT 
  id,
  marketplace_commission,
  total_cost,
  total_profit,
  profit_margin,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- Ver dados da tabela financial_summary
SELECT *
FROM financial_summary
ORDER BY created_at DESC
LIMIT 10;
```

### 3. Verificar Logs de Erro

Verificar console do navegador e logs do Supabase para identificar erros específicos.

## Soluções Propostas

### Solução 1: Ajustar Precisão Decimal

Criar migração para ajustar precisão dos campos numéricos:

```sql
-- Migration: fix_numeric_precision.sql

-- Ajustar precisão na tabela orders
ALTER TABLE orders
  ALTER COLUMN marketplace_commission TYPE numeric(10,2),
  ALTER COLUMN total_cost TYPE numeric(10,2),
  ALTER COLUMN total_profit TYPE numeric(10,2),
  ALTER COLUMN profit_margin TYPE numeric(5,2);

-- Ajustar precisão na tabela financial_summary
ALTER TABLE financial_summary
  ALTER COLUMN total_revenue TYPE numeric(12,2),
  ALTER COLUMN total_cost TYPE numeric(12,2),
  ALTER COLUMN total_commissions TYPE numeric(12,2),
  ALTER COLUMN total_profit TYPE numeric(12,2),
  ALTER COLUMN avg_profit_margin TYPE numeric(5,2);

-- Atualizar valores existentes para remover zeros desnecessários
UPDATE orders
SET 
  marketplace_commission = ROUND(marketplace_commission::numeric, 2),
  total_cost = ROUND(total_cost::numeric, 2),
  total_profit = ROUND(total_profit::numeric, 2),
  profit_margin = ROUND(profit_margin::numeric, 2);

UPDATE financial_summary
SET 
  total_revenue = ROUND(total_revenue::numeric, 2),
  total_cost = ROUND(total_cost::numeric, 2),
  total_commissions = ROUND(total_commissions::numeric, 2),
  total_profit = ROUND(total_profit::numeric, 2),
  avg_profit_margin = ROUND(avg_profit_margin::numeric, 2);
```

### Solução 2: Corrigir Cálculos

Verificar onde os pedidos são criados e garantir que os cálculos estão corretos:

**Arquivo**: `src/services/orderService.ts` ou similar

```typescript
// Exemplo de cálculo correto
const marketplaceCommission = (totalAmount * commissionRate) / 100;
const totalCost = productCost + shippingCost + otherCosts;
const totalProfit = totalAmount - totalCost - marketplaceCommission;
const profitMargin = (totalProfit / totalAmount) * 100;
```

### Solução 3: Corrigir Serviço de Estatísticas

**Arquivo**: `src/services/salesStatsService.ts`

Adicionar tratamento de erros e logs:

```typescript
export async function getGeneralFinancialSummary(): Promise<GeneralFinancialSummary> {
  try {
    const { data, error } = await supabase
      .from('financial_summary')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Erro ao buscar resumo financeiro:', error);
      throw error;
    }

    if (!data) {
      console.warn('Nenhum dado encontrado em financial_summary');
      return {
        total_profit: 0,
        total_sales: 0,
        estimated_expenses: 0
      };
    }

    return {
      total_profit: Number(data.total_profit) || 0,
      total_sales: Number(data.total_sales) || 0,
      estimated_expenses: Number(data.estimated_expenses) || 0
    };
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    return {
      total_profit: 0,
      total_sales: 0,
      estimated_expenses: 0
    };
  }
}
```

## Próximos Passos

1. **Verificar schema das tabelas** usando queries SQL
2. **Identificar causa raiz** do problema (precisão decimal vs cálculos incorretos)
3. **Criar migração** para corrigir schema se necessário
4. **Corrigir lógica de cálculo** se necessário
5. **Adicionar logs** para facilitar debug futuro
6. **Testar** com dados reais

## Observações

- O problema afeta visualização de dados financeiros
- Pode impactar relatórios e análises
- Requer acesso ao banco de dados para correção
- Migração deve ser testada em ambiente de desenvolvimento primeiro

## Ferramentas Necessárias

- Acesso ao Supabase (MCP ou CLI)
- Permissões para executar migrações
- Acesso aos logs do banco de dados
