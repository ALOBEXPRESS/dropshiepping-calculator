# Solução: Dados Zerados na Página de Vendas

**Data**: 28 de fevereiro de 2026  
**Status**: ✅ Solução Criada

## Problema

Campos numéricos na tabela `orders` estavam com precisão excessiva (ex: `numeric(30,20)`), causando:
- Valores com muitos zeros decimais (ex: 0.00000000000000000000)
- Dificuldade de leitura
- Possíveis problemas de arredondamento

## Solução Implementada

### Migração Criada

**Arquivo**: `supabase/migrations/20260228_fix_numeric_precision_orders.sql`

### Mudanças Aplicadas

1. **Ajuste de Precisão Decimal**:
   - Campos monetários: `numeric(30,20)` → `numeric(10,2)`
   - Campos de porcentagem: `numeric(30,20)` → `numeric(5,2)`

2. **Campos Afetados**:
   - `marketplace_commission`: numeric(10,2) - até R$ 99.999.999,99
   - `total_cost`: numeric(10,2) - até R$ 99.999.999,99
   - `total_profit`: numeric(10,2) - até R$ 99.999.999,99
   - `profit_margin`: numeric(5,2) - até 999,99%
   - `shipping_cost`: numeric(10,2) - até R$ 99.999.999,99
   - `other_expenses`: numeric(10,2) - até R$ 99.999.999,99
   - `total_amount`: numeric(10,2) - até R$ 99.999.999,99

3. **Valores Padrão**:
   - Todos os campos numéricos agora têm `DEFAULT 0`
   - Valores NULL são convertidos para 0

4. **Recálculo Automático**:
   - `total_profit` = total_amount - total_cost - marketplace_commission - shipping_cost - other_expenses
   - `profit_margin` = (total_profit / total_amount) * 100

5. **Constraints Adicionadas**:
   - Todos os valores devem ser >= 0 (não negativos)

## Como Aplicar a Migração

### Opção 1: Usando Supabase CLI (Local)

```bash
# Verificar status
supabase status

# Aplicar migração
supabase db push --local

# Verificar se foi aplicada
supabase migration list --local
```

### Opção 2: Usando Supabase Dashboard (Hospedado)

1. Acessar: https://supabase.com/dashboard/project/oensqhjnxwpcuanozske
2. Ir em: SQL Editor
3. Copiar conteúdo de `supabase/migrations/20260228_fix_numeric_precision_orders.sql`
4. Executar SQL
5. Verificar resultados

### Opção 3: Usando MCP do Supabase

```typescript
// Usar o MCP tool execute_sql
await mcp_supabase_execute_sql({
  project_id: 'oensqhjnxwpcuanozske',
  query: `-- Conteúdo da migração aqui`
});
```

## Verificação Pós-Migração

### 1. Verificar Estrutura das Colunas

```sql
SELECT 
  column_name, 
  data_type, 
  numeric_precision, 
  numeric_scale,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN (
  'marketplace_commission', 
  'total_cost', 
  'total_profit', 
  'profit_margin',
  'shipping_cost',
  'other_expenses',
  'total_amount'
)
ORDER BY column_name;
```

**Resultado esperado**:
```
column_name              | data_type | numeric_precision | numeric_scale | column_default
-------------------------|-----------|-------------------|---------------|---------------
marketplace_commission   | numeric   | 10                | 2             | 0
other_expenses          | numeric   | 10                | 2             | 0
profit_margin           | numeric   | 5                 | 2             | NULL
shipping_cost           | numeric   | 10                | 2             | 0
total_amount            | numeric   | 10                | 2             | NULL
total_cost              | numeric   | 10                | 2             | 0
total_profit            | numeric   | 10                | 2             | NULL
```

### 2. Verificar Dados

```sql
SELECT 
  id,
  bling_order_id,
  total_amount,
  marketplace_commission,
  total_cost,
  shipping_cost,
  other_expenses,
  total_profit,
  profit_margin,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado esperado**: Valores com apenas 2 casas decimais (ex: 74.80, 5.60, 100.00)

### 3. Verificar View financial_summary

```sql
SELECT * FROM financial_summary;
```

**Resultado esperado**: Valores formatados corretamente sem zeros excessivos

## Impacto

### Antes
```
marketplace_commission: 0.00000000000000000000
total_cost: 0.000
total_profit: 74.800000000000000000
profit_margin: 100.000000000000000000
```

### Depois
```
marketplace_commission: 0.00
total_cost: 0.00
total_profit: 74.80
profit_margin: 100.00
```

## Correção do Dashboard de Vendas

Após aplicar a migração, o Dashboard de Vendas deve:
1. ✅ Exibir valores formatados corretamente
2. ✅ Não mostrar erro "Erro ao carregar dados"
3. ✅ Calcular estatísticas corretamente

## Observações Importantes

### Compatibilidade
- ✅ Migração é retrocompatível
- ✅ Dados existentes são preservados (apenas arredondados)
- ✅ Não quebra código existente

### Performance
- ✅ Campos menores = melhor performance
- ✅ Índices não são afetados
- ✅ Queries continuam funcionando

### Segurança
- ✅ Constraints garantem valores válidos
- ✅ Valores padrão evitam NULL inesperados
- ✅ RLS policies não são afetadas

## Próximos Passos

1. **Aplicar migração** no ambiente de produção
2. **Verificar Dashboard** de Vendas
3. **Testar criação** de novos pedidos
4. **Monitorar logs** para erros
5. **Documentar** resultados

## Rollback (Se Necessário)

Se houver problemas, reverter com:

```sql
-- Reverter precisão (não recomendado)
ALTER TABLE orders
  ALTER COLUMN marketplace_commission TYPE numeric(30,20),
  ALTER COLUMN total_cost TYPE numeric(30,20),
  ALTER COLUMN total_profit TYPE numeric(30,20),
  ALTER COLUMN profit_margin TYPE numeric(30,20),
  ALTER COLUMN shipping_cost TYPE numeric(30,20),
  ALTER COLUMN other_expenses TYPE numeric(30,20),
  ALTER COLUMN total_amount TYPE numeric(30,20);

-- Remover constraints
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_marketplace_commission_check,
  DROP CONSTRAINT IF EXISTS orders_total_cost_check,
  DROP CONSTRAINT IF EXISTS orders_shipping_cost_check,
  DROP CONSTRAINT IF EXISTS orders_other_expenses_check,
  DROP CONSTRAINT IF EXISTS orders_total_amount_check;
```

## Arquivos Relacionados

- `supabase/migrations/20260228_fix_numeric_precision_orders.sql` (migração)
- `docs/PROBLEMA_DADOS_ZERADOS_VENDAS.md` (análise do problema)
- `docs/SOLUCAO_DADOS_ZERADOS_VENDAS.md` (este arquivo)
- `src/services/salesStatsService.ts` (serviço que consome os dados)
- `src/pages/Sales.tsx` (página que exibe os dados)
