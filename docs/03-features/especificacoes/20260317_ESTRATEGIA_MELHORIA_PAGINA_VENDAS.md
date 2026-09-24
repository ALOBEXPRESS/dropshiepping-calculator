# Estratégia de Melhoria da Página de Vendas
## Inspiração: WowDash Template

## 📊 Status: PLANEJAMENTO

---

## 1. Análise Comparativa

### Página Atual vs Referência

| Aspecto | Página Atual | Referência WowDash | Gap |
|---------|--------------|-------------------|-----|
| **Layout** | 4 cards + 3 gráficos + 2 listas | Grid complexo com múltiplas seções | Falta densidade de informação |
| **Gráficos** | Básicos (barras/linha) | Área charts, mapas, donut charts | Visualizações limitadas |
| **Dados Geográficos** | Não possui | Mapa de distribuição mundial | Ausente |
| **Clientes Top** | Lista simples | Cards com avatares e detalhes | Pouco visual |
| **Transações** | Lista básica | Timeline com ícones e cores | Pouco intuitivo |
| **Estatísticas** | 4 métricas principais | Múltiplas métricas com comparações | Limitado |
| **Produtos** | Lista com imagens | Tabela detalhada com métricas | Falta análise |
| **Estoque** | Não possui | Relatório dedicado | Ausente |

---

## 2. Estrutura de Dados Disponível

### Tabelas Principais Analisadas

#### 2.1 Products (Produtos)
**Campos Relevantes:**
- `name`, `description`, `price`, `cost_price`
- `stock_quantity` (para relatório de estoque)
- `image_url` (para visualização)
- `marketplace_id` (para análise por canal)
- `sales_channel_id` (para segmentação)
- `net_revenue`, `margin_status`

**Potencial:**
- Top Selling Products com margem de lucro
- Stock Report com alertas de estoque baixo
- Análise de performance por marketplace

#### 2.2 Leads (Clientes)
**Campos Relevantes:**
- `name`, `email`, `phone`
- `total_orders`, `total_spent`
- `first_order_date`, `last_order_date`
- `address_city`, `address_state`, `address_country`
- `marketplace_id`

**Potencial:**
- Top Customers com histórico de compras
- Distribution Maps (por cidade/estado/país)
- Customer Statistics (segmentação demográfica)
- Análise de recência e frequência

#### 2.3 Bling_Orders (Pedidos)
**Campos Relevantes:**
- `order_date`, `total_amount`, `status_id`
- `contact_name`, `contact_document`
- `label_city`, `label_state`, `label_country`
- `shipping_cost`, `discount_value`
- `lead_id`, `sales_channel_id`

**Potencial:**
- Recent Orders com timeline
- Revenue Report (ganhos vs despesas)
- Transactions com fluxo de caixa
- Análise temporal de vendas

#### 2.4 Bling_Order_Items (Itens de Pedidos)
**Campos Relevantes:**
- `product_id`, `quantity`, `unit_value`
- `total_value`, `discount`
- `commission_value`, `commission_rate`

**Potencial:**
- Análise de produtos mais vendidos
- Cálculo de comissões
- Ticket médio por produto

#### 2.5 Marketplaces
**Campos Relevantes:**
- `name`, `commission_rate`
- `has_monthly_fee`, `monthly_fee_value`

**Potencial:**
- Análise de performance por canal
- Cálculo de custos por marketplace
- Comparação de rentabilidade

#### 2.6 Sales_Channels (Canais de Venda)
**Campos Relevantes:**
- `name`, `marketplace`, `account_holder`
- `account_type`, `is_active`

**Potencial:**
- Segmentação por tipo de conta
- Análise de performance por titular
- Identificação de canais inativos

---

## 3. Componentes a Implementar

### 3.1 Revenue Report (Relatório de Receita)
**Inspiração:** Card grande no topo com gráfico de área

**Dados:**
```sql
SELECT 
    DATE_TRUNC('day', bo.order_date) as date,
    SUM(bo.total_amount) as revenue,
    SUM(bo.shipping_cost + bo.other_expenses) as expenses,
    SUM(bo.total_amount - bo.shipping_cost - bo.other_expenses) as profit
FROM bling_orders bo
WHERE bo.order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', bo.order_date)
ORDER BY date;
```

**Componente:**
- Card grande com gráfico de área (Recharts AreaChart)
- Legenda: Earning (verde) vs Expense (vermelho)
- Valor total destacado
- Comparação com período anterior

### 3.2 Customer Statistics (Estatísticas de Clientes)
**Inspiração:** Donut chart com segmentação

**Dados:**
```sql
-- Por gênero (se disponível) ou por tipo de documento
SELECT 
    CASE 
        WHEN l.document_type = 'CPF' THEN 'Pessoa Física'
        WHEN l.document_type = 'CNPJ' THEN 'Pessoa Jurídica'
        ELSE 'Não Informado'
    END as customer_type,
    COUNT(DISTINCT l.id) as total,
    SUM(l.total_spent) as total_spent
FROM leads l
GROUP BY customer_type;
```

**Componente:**
- Donut chart (Recharts PieChart)
- Cores distintas por segmento
- Percentuais e valores absolutos
- Tooltip com detalhes

### 3.3 Transactions Timeline
**Inspiração:** Lista vertical com ícones e cores

**Dados:**
```sql
SELECT 
    bo.id,
    bo.order_date,
    bo.total_amount,
    bo.status_id,
    l.name as customer_name,
    m.name as marketplace
FROM bling_orders bo
LEFT JOIN leads l ON l.id = bo.lead_id
LEFT JOIN marketplaces m ON m.id = l.marketplace_id
ORDER BY bo.order_date DESC
LIMIT 10;
```

**Componente:**
- Timeline vertical
- Ícones: ↑ (entrada) / ↓ (saída)
- Cores: Verde (positivo) / Vermelho (negativo)
- Valor e data formatados

### 3.4 Recent Orders
**Inspiração:** Tabela com status e ações

**Dados:**
```sql
SELECT 
    bo.order_number,
    bo.order_date,
    l.name as customer_name,
    bo.total_amount,
    bo.status_id,
    m.name as marketplace
FROM bling_orders bo
LEFT JOIN leads l ON l.id = bo.lead_id
LEFT JOIN marketplaces m ON m.id = l.marketplace_id
ORDER BY bo.order_date DESC
LIMIT 10;
```

**Componente:**
- Tabela responsiva
- Status com badges coloridos
- Ações: Ver detalhes, Editar
- Paginação

### 3.5 Distribution Maps
**Inspiração:** Mapa mundial com marcadores

**Dados:**
```sql
SELECT 
    l.address_country as country,
    l.address_state as state,
    l.address_city as city,
    COUNT(DISTINCT l.id) as total_customers,
    SUM(l.total_spent) as total_revenue
FROM leads l
WHERE l.address_country IS NOT NULL
GROUP BY l.address_country, l.address_state, l.address_city
ORDER BY total_revenue DESC;
```

**Componente:**
- Mapa interativo (react-simple-maps ou similar)
- Marcadores por país/estado
- Tooltip com estatísticas
- Lista lateral com top países

**Alternativa Simplificada:**
- Lista de países com barras de progresso
- Percentual de vendas por região
- Ícones de bandeiras

### 3.6 Top Customers
**Inspiração:** Cards com avatares e métricas

**Dados:**
```sql
SELECT 
    l.id,
    l.name,
    l.email,
    l.phone,
    l.total_orders,
    l.total_spent,
    l.address_city,
    l.address_state
FROM leads l
WHERE l.total_orders > 0
ORDER BY l.total_spent DESC
LIMIT 10;
```

**Componente:**
- Cards com avatar (inicial do nome)
- Nome e telefone mascarado
- Total de pedidos
- Badge de classificação (VIP, Regular, etc.)

### 3.7 Top Selling Products
**Inspiração:** Tabela detalhada com métricas

**Dados:**
```sql
SELECT 
    p.id,
    p.name,
    p.image_url,
    p.price,
    p.cost_price,
    COUNT(DISTINCT boi.order_id) as total_orders,
    SUM(boi.quantity) as total_sold,
    SUM(boi.total_value) as total_revenue,
    ROUND(((p.price - p.cost_price) / p.price * 100), 2) as margin_percent
FROM products p
INNER JOIN bling_order_items boi ON boi.product_id = p.id
GROUP BY p.id, p.name, p.image_url, p.price, p.cost_price
ORDER BY total_revenue DESC
LIMIT 10;
```

**Componente:**
- Tabela com colunas: Item, Price, Discount, Sold, Total Orders
- Imagem do produto (thumbnail)
- Badge de desconto (se aplicável)
- Barra de progresso para vendas
- Ordenação por coluna

### 3.8 Stock Report
**Inspiração:** Lista com status de estoque

**Dados:**
```sql
SELECT 
    p.id,
    p.name,
    p.image_url,
    p.price,
    p.stock_quantity,
    CASE 
        WHEN p.stock_quantity = 0 THEN 'Out of Stock'
        WHEN p.stock_quantity < 10 THEN 'Low Stock'
        WHEN p.stock_quantity < 50 THEN 'Medium Stock'
        ELSE 'High Stock'
    END as stock_status
FROM products p
ORDER BY p.stock_quantity ASC
LIMIT 10;
```

**Componente:**
- Lista com status colorido
- Barra de progresso de estoque
- Alertas visuais (vermelho, amarelo, verde)
- Ação rápida: Reabastecer

---

## 4. Arquitetura de Implementação

### 4.1 Estrutura de Pastas
```
src/
├── pages/
│   └── Sales.tsx (página principal)
├── components/
│   └── sales/
│       ├── RevenueReport.tsx
│       ├── CustomerStatistics.tsx
│       ├── TransactionsTimeline.tsx
│       ├── RecentOrders.tsx
│       ├── DistributionMaps.tsx
│       ├── TopCustomers.tsx
│       ├── TopSellingProducts.tsx
│       └── StockReport.tsx
├── hooks/
│   └── useSalesData.ts (hook centralizado)
├── services/
│   └── salesService.ts (queries do Supabase)
└── types/
    └── sales.ts (interfaces TypeScript)
```

### 4.2 Hook Centralizado
```typescript
// hooks/useSalesData.ts
export const useSalesData = (timeFilter: string) => {
  const [revenueData, setRevenueData] = useState([]);
  const [customersData, setCustomersData] = useState([]);
  const [transactionsData, setTransactionsData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [topCustomersData, setTopCustomersData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, [timeFilter]);

  const loadAllData = async () => {
    // Carregar todos os dados em paralelo
    await Promise.all([
      loadRevenueData(),
      loadCustomersData(),
      loadTransactionsData(),
      loadOrdersData(),
      loadDistributionData(),
      loadTopCustomersData(),
      loadTopProductsData(),
      loadStockData(),
    ]);
  };

  return {
    revenueData,
    customersData,
    transactionsData,
    ordersData,
    distributionData,
    topCustomersData,
    topProductsData,
    stockData,
    loading,
  };
};
```

### 4.3 Service Layer
```typescript
// services/salesService.ts
export const salesService = {
  async getRevenueReport(startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from('bling_orders')
      .select('order_date, total_amount, shipping_cost, other_expenses')
      .gte('order_date', startDate.toISOString())
      .lte('order_date', endDate.toISOString());
    
    return { data, error };
  },

  async getCustomerStatistics() {
    // Query para estatísticas de clientes
  },

  async getRecentTransactions(limit: number = 10) {
    // Query para transações recentes
  },

  // ... outros métodos
};
```

---

## 5. Bibliotecas Necessárias

### 5.1 Gráficos
```bash
npm install recharts
```
**Uso:** AreaChart, PieChart, BarChart, LineChart

### 5.2 Mapas (Opcional)
```bash
npm install react-simple-maps
```
**Uso:** Mapa mundial com marcadores

**Alternativa:** Usar lista com bandeiras (react-country-flag)

### 5.3 Ícones Adicionais
```bash
npm install @heroicons/react
```
**Uso:** Ícones para transações, status, etc.

### 5.4 Formatação
```bash
npm install date-fns
```
**Uso:** Formatação de datas e períodos

---

## 6. Layout Proposto

### 6.1 Grid Structure
```
┌─────────────────────────────────────────────────────────┐
│ Header: Visão Geral + Filtro de Período                │
├─────────────────────────────────────────────────────────┤
│ Revenue Report (Full Width)                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Earning: R$ XXX | Expense: R$ XXX | Chart          │ │
│ └─────────────────────────────────────────────────────┘ │
├──────────────────────────┬──────────────────────────────┤
│ Customer Statistics      │ Transactions Timeline        │
│ ┌──────────────────────┐ │ ┌──────────────────────────┐ │
│ │ Donut Chart          │ │ │ ↑ +R$ 800                │ │
│ │ PF: 60% | PJ: 40%    │ │ │ ↓ -R$ 300                │ │
│ └──────────────────────┘ │ │ ↑ +R$ 500                │ │
│                          │ └──────────────────────────┘ │
├──────────────────────────┴──────────────────────────────┤
│ Recent Orders (Full Width Table)                        │
├──────────────────────────┬──────────────────────────────┤
│ Distribution Maps        │ Top Customers                │
│ ┌──────────────────────┐ │ ┌──────────────────────────┐ │
│ │ Map or List          │ │ │ 1. João - 30 pedidos     │ │
│ │ BR: 80%              │ │ │ 2. Maria - 25 pedidos    │ │
│ │ US: 15%              │ │ │ 3. Pedro - 20 pedidos    │ │
│ └──────────────────────┘ │ └──────────────────────────┘ │
├──────────────────────────┴──────────────────────────────┤
│ Top Selling Products (Full Width Table)                 │
├──────────────────────────┬──────────────────────────────┤
│ Stock Report             │ (Espaço para expansão)       │
└──────────────────────────┴──────────────────────────────┘
```

### 6.2 Responsividade
- **Desktop (>1024px):** Grid 2 colunas
- **Tablet (768-1024px):** Grid 1-2 colunas adaptativo
- **Mobile (<768px):** Stack vertical

---

## 7. Fases de Implementação

### Fase 1: Fundação (Semana 1)
- [ ] Instalar bibliotecas necessárias
- [ ] Criar estrutura de pastas
- [ ] Implementar hook `useSalesData`
- [ ] Criar service layer `salesService`
- [ ] Definir interfaces TypeScript

### Fase 2: Componentes Principais (Semana 2)
- [ ] Revenue Report com gráfico de área
- [ ] Customer Statistics com donut chart
- [ ] Transactions Timeline
- [ ] Recent Orders table

### Fase 3: Componentes Secundários (Semana 3)
- [ ] Distribution Maps (ou lista alternativa)
- [ ] Top Customers cards
- [ ] Top Selling Products table
- [ ] Stock Report

### Fase 4: Refinamento (Semana 4)
- [ ] Otimização de queries
- [ ] Implementar cache de dados
- [ ] Adicionar loading states
- [ ] Implementar error handling
- [ ] Testes de responsividade
- [ ] Ajustes de UX/UI

### Fase 5: Features Avançadas (Opcional)
- [ ] Exportar relatórios (PDF/Excel)
- [ ] Filtros avançados
- [ ] Comparação de períodos
- [ ] Drill-down em métricas
- [ ] Notificações de alertas

---

## 8. Queries SQL Otimizadas

### 8.1 View: Sales Dashboard Summary
```sql
CREATE OR REPLACE VIEW sales_dashboard_summary AS
SELECT 
    -- Métricas gerais
    COUNT(DISTINCT bo.id) as total_orders,
    COUNT(DISTINCT l.id) as total_customers,
    SUM(bo.total_amount) as total_revenue,
    SUM(bo.shipping_cost + bo.other_expenses) as total_expenses,
    SUM(bo.total_amount - bo.shipping_cost - bo.other_expenses) as total_profit,
    AVG(bo.total_amount) as avg_order_value,
    
    -- Período
    DATE_TRUNC('month', CURRENT_DATE) as period
FROM bling_orders bo
LEFT JOIN leads l ON l.id = bo.lead_id
WHERE bo.order_date >= DATE_TRUNC('month', CURRENT_DATE);
```

### 8.2 Function: Get Revenue by Period
```sql
CREATE OR REPLACE FUNCTION get_revenue_by_period(
    start_date DATE,
    end_date DATE,
    interval_type TEXT DEFAULT 'day'
)
RETURNS TABLE (
    period TIMESTAMP WITH TIME ZONE,
    revenue NUMERIC,
    expenses NUMERIC,
    profit NUMERIC,
    orders_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC(interval_type, bo.order_date) as period,
        SUM(bo.total_amount) as revenue,
        SUM(bo.shipping_cost + COALESCE(bo.other_expenses, 0)) as expenses,
        SUM(bo.total_amount - bo.shipping_cost - COALESCE(bo.other_expenses, 0)) as profit,
        COUNT(DISTINCT bo.id) as orders_count
    FROM bling_orders bo
    WHERE bo.order_date >= start_date
        AND bo.order_date <= end_date
    GROUP BY DATE_TRUNC(interval_type, bo.order_date)
    ORDER BY period;
END;
$$ LANGUAGE plpgsql;
```

### 8.3 Function: Get Top Customers
```sql
CREATE OR REPLACE FUNCTION get_top_customers(
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    customer_id UUID,
    customer_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    total_orders INTEGER,
    total_spent NUMERIC,
    avg_order_value NUMERIC,
    last_order_date TIMESTAMP WITH TIME ZONE,
    customer_rank INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id as customer_id,
        l.name as customer_name,
        l.email,
        l.mobile_phone as phone,
        l.total_orders,
        l.total_spent,
        ROUND(l.total_spent / NULLIF(l.total_orders, 0), 2) as avg_order_value,
        l.last_order_date,
        ROW_NUMBER() OVER (ORDER BY l.total_spent DESC)::INTEGER as customer_rank
    FROM leads l
    WHERE l.total_orders > 0
    ORDER BY l.total_spent DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

### 8.4 Function: Get Stock Report
```sql
CREATE OR REPLACE FUNCTION get_stock_report()
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    image_url TEXT,
    price NUMERIC,
    stock_quantity INTEGER,
    stock_status TEXT,
    stock_value NUMERIC,
    last_sale_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as product_id,
        p.name as product_name,
        p.image_url,
        p.price,
        p.stock_quantity,
        CASE 
            WHEN p.stock_quantity = 0 THEN 'Esgotado'
            WHEN p.stock_quantity < 10 THEN 'Estoque Baixo'
            WHEN p.stock_quantity < 50 THEN 'Estoque Médio'
            ELSE 'Estoque Alto'
        END as stock_status,
        (p.stock_quantity * p.price) as stock_value,
        MAX(bo.order_date) as last_sale_date
    FROM products p
    LEFT JOIN bling_order_items boi ON boi.product_id = p.id
    LEFT JOIN bling_orders bo ON bo.id = boi.order_id
    GROUP BY p.id, p.name, p.image_url, p.price, p.stock_quantity
    ORDER BY p.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Melhorias de Performance

### 9.1 Índices Recomendados
```sql
-- Índice para queries de período
CREATE INDEX IF NOT EXISTS idx_bling_orders_order_date 
ON bling_orders(order_date DESC);

-- Índice para joins frequentes
CREATE INDEX IF NOT EXISTS idx_bling_orders_lead_id 
ON bling_orders(lead_id);

-- Índice para análise de produtos
CREATE INDEX IF NOT EXISTS idx_bling_order_items_product_id 
ON bling_order_items(product_id);

-- Índice para localização
CREATE INDEX IF NOT EXISTS idx_leads_location 
ON leads(address_country, address_state, address_city);
```

### 9.2 Cache Strategy
```typescript
// Implementar cache com React Query ou SWR
import { useQuery } from '@tanstack/react-query';

export const useSalesData = (timeFilter: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-data', timeFilter],
    queryFn: () => salesService.getAllData(timeFilter),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });

  return { data, isLoading, error };
};
```

---

## 10. Checklist de Implementação

### Design
- [ ] Definir paleta de cores consistente
- [ ] Criar componentes reutilizáveis
- [ ] Garantir responsividade
- [ ] Implementar dark mode
- [ ] Adicionar animações sutis

### Funcionalidade
- [ ] Filtros de período funcionais
- [ ] Dados em tempo real
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states

### Performance
- [ ] Lazy loading de componentes
- [ ] Otimização de queries
- [ ] Cache de dados
- [ ] Debounce em filtros
- [ ] Paginação onde necessário

### Acessibilidade
- [ ] Contraste adequado
- [ ] Navegação por teclado
- [ ] Screen reader support
- [ ] ARIA labels
- [ ] Focus management

### Testes
- [ ] Unit tests para hooks
- [ ] Integration tests para services
- [ ] E2E tests para fluxos principais
- [ ] Performance tests
- [ ] Accessibility tests

---

## 11. Estimativa de Esforço

| Fase | Componentes | Esforço | Prioridade |
|------|-------------|---------|------------|
| 1 | Fundação | 8h | Alta |
| 2 | Revenue Report | 6h | Alta |
| 2 | Customer Statistics | 4h | Média |
| 2 | Transactions Timeline | 3h | Média |
| 2 | Recent Orders | 5h | Alta |
| 3 | Distribution Maps | 8h | Baixa |
| 3 | Top Customers | 4h | Alta |
| 3 | Top Selling Products | 5h | Alta |
| 3 | Stock Report | 4h | Média |
| 4 | Refinamento | 12h | Alta |
| 5 | Features Avançadas | 16h | Baixa |
| **Total** | | **75h** | |

---

## 12. Próximos Passos Imediatos

1. **Revisar e aprovar esta estratégia**
2. **Instalar dependências necessárias**
   ```bash
   npm install recharts date-fns @tanstack/react-query
   ```
3. **Criar estrutura de pastas**
4. **Implementar queries SQL (functions e views)**
5. **Começar pela Fase 1: Fundação**

---

## 13. Referências

- **Design:** https://wowdash.wowtheme7.com/demo/index-3.html
- **Recharts:** https://recharts.org/
- **React Query:** https://tanstack.com/query/latest
- **Supabase Docs:** https://supabase.com/docs

---

## 14. Notas Finais

Esta estratégia foi criada com base na análise da sua estrutura de banco de dados atual e na inspiração do template WowDash. A implementação pode ser feita de forma incremental, priorizando os componentes de maior valor para o negócio.

**Recomendação:** Começar pelos componentes de Fase 2 (Revenue Report, Recent Orders) que trazem maior valor imediato, e depois expandir para os componentes mais complexos como Distribution Maps.

