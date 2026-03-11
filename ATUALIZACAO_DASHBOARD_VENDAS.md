# Atualização do Dashboard de Vendas

## Status Atual

✅ **Pedidos Processados com Sucesso:**
- Pedido #107 (09/03/2026): R$ 74,80 - Lucro R$ 35,92 (48,03%)
- Pedido #109 (11/03/2026): R$ 74,80 - Lucro R$ 35,92 (48,03%)
- Pedido #110 (11/03/2026): R$ 74,80 - Lucro R$ 35,92 (48,03%)

**Total Processado:**
- 3 pedidos
- Receita: R$ 224,40
- Custo: R$ 89,70
- Lucro: R$ 107,76
- Margem: 48,03%

## Problema Identificado

Os dados dos pedidos estão no banco de dados, mas não aparecem no dashboard porque:

1. **Filtros de Período**: Os componentes filtram por período (Este Mês, Mensal, etc.)
2. **Data Atual**: 11/03/2026
3. **Datas dos Pedidos**: 09/03 e 11/03/2026

Os componentes provavelmente estão usando filtros de data que não incluem os pedidos processados.

## Dados Verificados no Banco

### Tabela `orders`
```sql
SELECT 
  o.order_number,
  o.order_date,
  o.total_amount,
  o.total_profit,
  o.profit_margin,
  bo.contact_name as customer_name,
  sc.marketplace
FROM orders o
LEFT JOIN bling_orders bo ON o.bling_order_id = bo.id
LEFT JOIN sales_channels sc ON o.sales_channel_id = sc.id
ORDER BY o.order_date DESC;
```

Resultado:
- ✅ 3 pedidos cadastrados
- ✅ Valores corretos (total, custo, lucro, margem)
- ✅ Marketplace: MercadoLivre
- ✅ Cliente: Jonatan Renan Vitoriano Da Silva

### Tabela `order_items`
```sql
SELECT 
  oi.order_id,
  p.name as product_name,
  oi.quantity,
  oi.unit_price,
  oi.total_price,
  oi.profit
FROM order_items oi
JOIN products p ON oi.product_id = p.id;
```

Resultado:
- ✅ 6 itens cadastrados (2 por pedido)
- ✅ Produtos: Relógio Feminino Elegance e Camisa Stitch e Angel
- ✅ Product_id corrigido manualmente
- ✅ Valores corretos

## Correção Aplicada

### 1. Product_id nos Order_Items

O `product_id` estava NULL nos itens dos pedidos. Corrigi manualmente:

```sql
-- Atualizar product_id dos itens baseado no preço
UPDATE order_items oi
SET product_id = p.id
FROM products p
WHERE oi.product_id IS NULL
  AND oi.unit_price = 34.90
  AND p.sku = '363061'
  AND p.marketplace = 'mercadolivre'
  AND p.account_holder = 'Alyson';

UPDATE order_items oi
SET product_id = p.id
FROM products p
WHERE oi.product_id IS NULL
  AND oi.unit_price = 39.90
  AND p.sku = 'C11722M'
  AND p.marketplace = 'mercadolivre'
  AND p.account_holder = 'Alyson';
```

### 2. Atualização Automática do Dashboard

Implementado sistema de refresh automático em `src/pages/Sales.tsx`:

```typescript
const [refreshKey, setRefreshKey] = useState(0);

const handleOrderProcessed = () => {
  console.log('🔄 Pedido processado! Atualizando todos os componentes...');
  setRefreshKey(prev => prev + 1);
};

// Todos os componentes recebem key={`component-${refreshKey}`}
<RevenueReportChart key={`revenue-${refreshKey}`} organizationId={organizationId} />
<StatisticsCards key={`stats-${refreshKey}`} organizationId={organizationId} />
// ... etc
```

## Próximos Passos

### 1. Corrigir a Function `process_bling_order_to_profit`

A function não está salvando o `product_id` nos itens do pedido. Precisa ser corrigida para:

```sql
-- Ao inserir order_items, incluir product_id
INSERT INTO order_items (
  order_id,
  product_id,  -- ← ADICIONAR ESTE CAMPO
  quantity,
  unit_price,
  total_price,
  unit_cost,
  total_cost,
  profit
)
VALUES (
  v_order_id,
  v_product_id,  -- ← ADICIONAR ESTE VALOR
  item.quantity,
  item.unit_price,
  item.total_price,
  item.unit_cost,
  item.total_cost,
  item.profit
);
```

### 2. Verificar Filtros de Data nos Componentes

Os componentes que precisam ser verificados:

- `RevenueReportChart` - Gráfico de Receita
- `StatisticsCards` - Cards de Estatísticas
- `RecentOrdersChart` - Pedidos Recentes
- `TransactionsList` - Transações
- `CustomersStatistics` - Estatísticas de Clientes
- `BrazilStatesDistribution` - Distribuição por Estado
- `TopSellingProductsTable` - Produtos Mais Vendidos
- `TopCustomersList` - Top Clientes

Cada componente deve:
1. Buscar dados do período correto
2. Incluir os pedidos de 09/03 e 11/03/2026
3. Atualizar quando `refreshKey` mudar

### 3. Cadastrar Clientes

Os pedidos não têm `customer_id` porque os clientes não foram cadastrados. A function deveria:

1. Verificar se o cliente existe (por email ou nome)
2. Se não existir, criar o cliente
3. Associar o pedido ao cliente

### 4. Cadastrar Leads

Os pedidos não têm `lead_id`. A function deveria:

1. Criar um lead para cada pedido
2. Associar o lead ao pedido
3. Permitir rastreamento de origem da venda

## Queries Úteis para Debug

```sql
-- 1. Verificar pedidos processados
SELECT 
  o.order_number,
  o.order_date,
  o.total_amount,
  o.total_profit,
  o.profit_margin
FROM orders o
ORDER BY o.order_date DESC;

-- 2. Verificar itens dos pedidos
SELECT 
  o.order_number,
  p.name as product_name,
  oi.quantity,
  oi.unit_price,
  oi.profit
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
ORDER BY o.order_number;

-- 3. Verificar produtos mais vendidos
SELECT 
  p.name,
  COUNT(DISTINCT oi.order_id) as orders_count,
  SUM(oi.quantity) as total_sold,
  SUM(oi.total_price) as total_revenue,
  SUM(oi.profit) as total_profit
FROM order_items oi
JOIN products p ON oi.product_id = p.id
GROUP BY p.id, p.name
ORDER BY total_sold DESC;

-- 4. Verificar receita por período
SELECT 
  DATE_TRUNC('month', o.order_date) as month,
  COUNT(*) as orders_count,
  SUM(o.total_amount) as total_revenue,
  SUM(o.total_cost) as total_cost,
  SUM(o.total_profit) as total_profit
FROM orders o
GROUP BY DATE_TRUNC('month', o.order_date)
ORDER BY month DESC;
```

## Resumo

✅ **Implementado:**
- Atualização automática do dashboard após processar pedido
- Correção manual dos product_ids nos order_items
- Sistema de refresh com refreshKey

❌ **Pendente:**
- Corrigir function `process_bling_order_to_profit` para salvar product_id
- Verificar e ajustar filtros de data nos componentes
- Implementar cadastro automático de clientes
- Implementar cadastro automático de leads
- Testar se os dados aparecem corretamente no dashboard

## Arquivos Modificados

- `src/pages/Sales.tsx` - Adicionado sistema de refresh automático
- `ATUALIZACAO_DASHBOARD_VENDAS.md` - Este documento

---

**Data**: 2026-03-11  
**Status**: Em Progresso  
**Pedidos Processados**: 3 (#107, #109, #110)  
**Lucro Total**: R$ 107,76
