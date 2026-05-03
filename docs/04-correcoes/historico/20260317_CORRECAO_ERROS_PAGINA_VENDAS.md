# Correção de Erros na Página de Vendas

## Resumo
Corrigidos 3 erros críticos na página de Vendas que impediam o carregamento correto dos dados.

## Problemas Identificados

### 1. BrazilStatesDistribution - Erro PGRST201
**Erro**: "Could not embed because more than one relationship was found for 'orders' and 'bling_orders'"

**Causa**: Ambiguidade no relacionamento entre as tabelas `orders` e `bling_orders`. O Supabase encontrou múltiplas foreign keys e não sabia qual usar.

**Solução**: Especificar explicitamente a foreign key no JOIN usando a sintaxe `bling_orders:bling_order_id`.

**Arquivo**: `src/components/sales/BrazilStatesDistribution.tsx`

**Mudança**:
```typescript
// ANTES (ambíguo)
bling_orders!inner (
  label_state
)

// DEPOIS (específico)
bling_orders:bling_order_id (
  label_state
)
```

### 2. get_revenue_report - Erro 42702
**Erro**: "column reference 'total_cost' is ambiguous"

**Causa**: A coluna `total_cost` aparecia sem alias de tabela, causando ambiguidade no contexto da função.

**Solução**: Adicionar alias `o` para a tabela `orders` e prefixar todas as colunas com o alias.

**Função SQL**: `public.get_revenue_report`

**Mudança**:
```sql
-- ANTES
FROM orders
WHERE organization_id = p_organization_id
SUM(total_cost) as total_cost

-- DEPOIS
FROM orders o
WHERE o.organization_id = p_organization_id
SUM(o.total_cost) as total_cost
```

### 3. get_top_customers - Erro 42804
**Erro**: "Returned type character varying(255) does not match expected type text in column 2"

**Causa**: A função retornava `text` mas a coluna `email` na tabela `leads` é `varchar(255)`, causando incompatibilidade de tipos.

**Solução**: Fazer cast explícito de `varchar` para `text` usando `::text`.

**Função SQL**: `public.get_top_customers`

**Mudança**:
```sql
-- ANTES
l.name as customer_name,
l.email as customer_email,
l.phone as customer_phone,

-- DEPOIS
l.name::text as customer_name,
l.email::text as customer_email,
l.phone::text as customer_phone,
```

## Testes Realizados

### Teste com Playwright
- ✅ Navegação para página de Vendas
- ✅ Carregamento completo sem erros
- ✅ Console limpo (0 erros)
- ✅ Todos os componentes renderizados corretamente

### Componentes Verificados
- ✅ Relatório de Receita (RevenueReportChart)
- ✅ Estatísticas de Vendas (StatisticsCards)
- ✅ Pedidos Recentes (RecentOrdersChart)
- ✅ Transações (TransactionsList)
- ✅ Distribuição por Estado (BrazilStatesDistribution)
- ✅ Produtos Mais Vendidos (TopSellingProductsTable)
- ✅ Relatório de Estoque (StockReportTable)
- ✅ Estatísticas de Clientes (CustomersStatistics)
- ✅ Top Clientes (TopCustomersList)

## Estado Atual

### Distribuição por Estado
- Componente funcionando corretamente
- Mostra "Nenhum dado de localização disponível"
- Motivo: Pedidos não têm `label_state` preenchido
- Quando houver dados, funcionará automaticamente

### Dados Exibidos
- Total de Produtos: 23
- Total de Clientes: 1
- Total de Pedidos: 1
- Total de Vendas: R$ 75
- Receita: R$ 75
- Custo: R$ 0

## Arquivos Modificados

1. `src/components/sales/BrazilStatesDistribution.tsx`
   - Especificado foreign key no JOIN

2. Funções SQL (via MCP Supabase):
   - `public.get_revenue_report` - Adicionado alias de tabela
   - `public.get_top_customers` - Adicionado cast para text

## Observações

- Todas as correções foram aplicadas diretamente no banco de dados via MCP Supabase
- Não é necessário criar migrações pois as funções já foram atualizadas
- Build executado com sucesso
- Página de Vendas totalmente funcional

## Commit
```bash
git add src/components/sales/BrazilStatesDistribution.tsx docs/CORRECAO_ERROS_PAGINA_VENDAS.md
git commit -m "fix: corrigidos erros na página de vendas (distribuição por estado, revenue report e top customers)"
```
