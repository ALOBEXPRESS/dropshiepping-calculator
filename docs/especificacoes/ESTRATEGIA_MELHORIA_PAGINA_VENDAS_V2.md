# Estratégia de Melhoria da Página de Vendas - V2

**Data Criação**: 2026-02-28  
**Última Atualização**: 2026-02-28  
**Referência**: WowDash eCommerce Dashboard (https://wowdash.wowtheme7.com/demo/index-3.html)  
**Screenshot**: `docs/wowdash-ecommerce-reference.png`  
**Status**: 🔄 EM PROGRESSO

---

## 🎯 Objetivo

Transformar a página de vendas atual em um dashboard completo e profissional inspirado no template WowDash, aproveitando:
- ✅ Sistema de processamento de vendas implementado
- ✅ Dados reais do Supabase (leads, orders, products, bling_orders)
- ✅ Cálculos automáticos de lucros e margens
- 🎨 Design moderno e responsivo
- 📊 Visualizações avançadas de dados

---

## ✅ O Que Já Foi Implementado

### 1. Sistema de Processamento de Vendas (NOVO!)
- ✅ Tabelas `orders` e `order_items` com cálculos de lucro
- ✅ Function `process_bling_order_to_profit()` para processar vendas
- ✅ View `pending_orders_to_process` para vendas pendentes
- ✅ View `financial_summary` para resumo financeiro
- ✅ Componente `PendingOrders` na Calculadora

### 2. Página de Vendas Atual
- ✅ 4 Metrics Cards (Receita, Lucro, Custo, Leads)
- ✅ 3 Charts (Total de Vendas, Visitantes, Crescimento)
- ✅ Transações Recentes (lista com dados reais)
- ✅ Produtos Mais Vendidos (lista com imagens)
- ✅ Tradução PT-BR completa
- ✅ Integração com Supabase

---

## 📊 Análise da Referência WowDash

### Componentes Identificados

#### 1. Revenue Report (Gráfico Principal)
**Características:**
- Gráfico de área com duas linhas (Earning vs Expense)
- Filtro de período (Yearly, Monthly, Weekly, Today)
- Valores totais destacados
- Eixo Y com escala formatada
- Cores: Verde para ganhos, Vermelho para despesas

**Dados Necessários:**
- `orders.total_amount` (receita)
- `orders.total_cost` (custo)
- Agrupado por período (dia/semana/mês/ano)


#### 2. Statistics Cards (4 Cards)
**Características:**
- Total Products (300, +200 this week)
- Total Customer (50,000, -5k this week)
- Total Orders (1500, +1k this week)
- Total Sales ($25,000,000, +$10k this week)
- Ícones coloridos com gradiente
- Indicador de mudança (positivo/negativo)

**Dados Necessários:**
- `COUNT(products)` com comparação semanal
- `COUNT(leads)` com comparação semanal
- `COUNT(orders)` com comparação semanal
- `SUM(orders.total_amount)` com comparação semanal

#### 3. Customers Statistics (Donut Chart)
**Características:**
- Gráfico de rosca com Male/Female
- Percentuais visuais (+30%, +25%)
- Filtro de período
- Cores: Azul e Rosa

**Dados Necessários:**
- `leads.gender` (se disponível) ou criar campo
- Agrupamento por gênero
- Comparação com período anterior

#### 4. Recent Orders (Tabela)
**Características:**
- Colunas: Users, Invoice, Items, Qty, Amount, Status
- Avatar do usuário
- Status com badges coloridos (Paid, Pending, Shipped, Canceled)
- Link "View All"

**Dados Necessários:**
- `orders` JOIN `leads`
- `order_items` para quantidade
- Status mapeado para badges

#### 5. Transactions (Timeline)
**Características:**
- Lista vertical com ícones de pagamento
- Nome do serviço (Paytm, PayPal, Stripe, Razorpay)
- Descrição da transação
- Valor com cor (verde positivo, vermelho negativo)
- Filtro "This Month"

**Dados Necessários:**
- `orders` com tipo de pagamento
- Descrição da transação
- Valores positivos/negativos


#### 6. Recent Orders Chart (Line Chart)
**Características:**
- Gráfico de linha simples
- Valor total destacado ($27,200)
- Indicador de crescimento (10% Increases)
- Meses no eixo X

**Dados Necessários:**
- `SUM(orders.total_amount)` por mês
- Comparação com mês anterior

#### 7. Distribution Maps (Mapa Mundial)
**Características:**
- Mapa interativo com países destacados
- Lista de países com flags
- Barra de progresso por país
- Percentual de usuários

**Dados Necessários:**
- `leads.address_country`
- Agrupamento por país
- Percentual calculado

#### 8. Top Customers (Lista)
**Características:**
- Avatar do cliente
- Nome e telefone
- Número de pedidos
- Link "View All"

**Dados Necessários:**
- `leads` ordenado por `total_orders DESC`
- LIMIT 6

#### 9. Top Selling Product (Tabela)
**Características:**
- Colunas: Items, Price, Discount, Sold, Total Orders
- Imagem do produto
- Nome e categoria
- Badge com número de pedidos

**Dados Necessários:**
- `products` JOIN `order_items`
- `COUNT(order_items)` como vendidos
- `SUM(order_items.quantity)` como quantidade
- Ordenado por vendas DESC

#### 10. Stock Report (Tabela)
**Características:**
- Colunas: Items, Price, Stock
- Barra de progresso visual
- Status: Out of Stock, Low Stock, High Stock
- Cores: Vermelho, Amarelo, Verde

**Dados Necessários:**
- `products.stock_quantity`
- Classificação por faixas:
  - 0 = Out of Stock (vermelho)
  - 1-20 = Low Stock (amarelo)
  - 21+ = High Stock (verde)


---

## 🗄️ Estrutura de Dados Atualizada

### Tabelas Disponíveis (Pós-Implementação)

#### 1. `orders` (NOVA - Vendas Processadas)
**Colunas Relevantes:**
- `id`, `organization_id`, `order_number`
- `bling_order_id` (referência ao Bling)
- `marketplace_id`, `sales_channel_id`, `lead_id`
- `order_date`, `total_amount`
- `shipping_cost`, `discount_value`, `other_expenses`
- `marketplace_commission` (calculado)
- `total_cost` (calculado)
- `total_profit` (calculado)
- `profit_margin` (calculado em %)
- `status` (completed, pending, cancelled, processing)
- `processed_at`, `processed_by`

**Uso:**
- ✅ Receita total real
- ✅ Lucro líquido calculado
- ✅ Margens de lucro
- ✅ Análise por marketplace
- ✅ Análise temporal

#### 2. `order_items` (NOVA - Itens Processados)
**Colunas Relevantes:**
- `id`, `order_id`, `product_id`
- `bling_item_id` (referência ao Bling)
- `product_name`, `product_image_url`
- `quantity`, `unit_price`, `total_price`
- `unit_cost`, `total_cost` (calculado)
- `profit` (calculado)
- `profit_margin` (calculado em %)

**Uso:**
- ✅ Produtos mais vendidos
- ✅ Análise de margens por produto
- ✅ Quantidade vendida
- ✅ Lucro por item

#### 3. `bling_orders` (Vendas do Bling)
**Colunas Relevantes:**
- `id`, `order_number`, `order_date`
- `total_amount`, `status_id`
- `lead_id`, `sales_channel_id`
- `processed_to_orders` (boolean)
- `processed_order_id` (referência)

**Uso:**
- ✅ Vendas pendentes de processamento
- ✅ Total de vendas (processadas + pendentes)

#### 4. `leads` (Clientes)
**Colunas Relevantes:**
- `id`, `name`, `email`, `phone`
- `total_orders`, `total_spent`
- `first_order_date`, `last_order_date`
- `address_city`, `address_state`, `address_country`
- `marketplace_id`

**Uso:**
- ✅ Top customers
- ✅ Distribuição geográfica
- ✅ Análise de clientes

#### 5. `products` (Produtos)
**Colunas Relevantes:**
- `id`, `name`, `image_url`
- `price`, `cost_price`
- `stock_quantity`
- `marketplace_id`, `supplier_id`

**Uso:**
- ✅ Stock report
- ✅ Catálogo de produtos
- ✅ Análise de estoque


#### 6. Views Criadas

##### `pending_orders_to_process`
**Retorna:**
- Vendas não processadas do Bling
- Informações do cliente e marketplace
- Imagem do primeiro produto
- Quantidade de itens

##### `financial_summary`
**Retorna:**
- Total de pedidos processados
- Receita, custo, lucro totais
- Comissões e despesas
- Margem de lucro média
- Vendas pendentes
- Dados por marketplace (JSON)

---

## 🎨 Layout Proposto (Grid System)

### Desktop (1920px+)
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Dashboard > Vendas                                   │
├─────────────────────────────────────────────────────────────┤
│ [Revenue Report - Full Width]                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Gráfico de Área (Receita vs Custo)                      │ │
│ │ Earning: $500M | Expense: $20k                          │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [4 Statistics Cards - Grid 4 cols]                          │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                        │
│ │ 300  │ │50,000│ │ 1500 │ │ $25M │                        │
│ │Prods │ │Clien │ │Order │ │Sales │                        │
│ └──────┘ └──────┘ └──────┘ └──────┘                        │
├─────────────────────────────────────────────────────────────┤
│ [Row 2 - Grid 2 cols]                                       │
│ ┌──────────────────────┐ ┌──────────────────────┐          │
│ │ Customers Statistics │ │ Recent Orders        │          │
│ │ (Donut Chart)        │ │ (Tabela)             │          │
│ └──────────────────────┘ └──────────────────────┘          │
├─────────────────────────────────────────────────────────────┤
│ [Row 3 - Grid 3 cols]                                       │
│ ┌────────┐ ┌────────┐ ┌────────┐                           │
│ │Transac │ │Recent  │ │Distrib │                           │
│ │tions   │ │Orders  │ │Maps    │                           │
│ │(List)  │ │(Chart) │ │(Map)   │                           │
│ └────────┘ └────────┘ └────────┘                           │
├─────────────────────────────────────────────────────────────┤
│ [Row 4 - Grid 3 cols]                                       │
│ ┌────────┐ ┌────────────────┐ ┌────────┐                   │
│ │Top     │ │Top Selling     │ │Stock   │                   │
│ │Custome │ │Product         │ │Report  │                   │
│ │rs      │ │(Tabela)        │ │(Tabela)│                   │
│ └────────┘ └────────────────┘ └────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)
- Stack vertical
- Cards full width
- Gráficos responsivos
- Tabelas com scroll horizontal


---

## 🔧 Queries SQL Otimizadas

### 1. Revenue Report (Receita vs Custo por Período)
```sql
CREATE OR REPLACE FUNCTION get_revenue_report(
    p_organization_id UUID,
    p_period TEXT DEFAULT 'monthly' -- 'daily', 'weekly', 'monthly', 'yearly'
)
RETURNS TABLE (
    period_label TEXT,
    total_revenue NUMERIC,
    total_cost NUMERIC,
    total_profit NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN p_period = 'daily' THEN TO_CHAR(order_date, 'DD/MM')
            WHEN p_period = 'weekly' THEN 'Week ' || TO_CHAR(order_date, 'WW')
            WHEN p_period = 'monthly' THEN TO_CHAR(order_date, 'Mon')
            WHEN p_period = 'yearly' THEN TO_CHAR(order_date, 'YYYY')
        END as period_label,
        SUM(total_amount) as total_revenue,
        SUM(total_cost) as total_cost,
        SUM(total_profit) as total_profit
    FROM orders
    WHERE organization_id = p_organization_id
        AND processed_at >= CASE 
            WHEN p_period = 'daily' THEN CURRENT_DATE - INTERVAL '30 days'
            WHEN p_period = 'weekly' THEN CURRENT_DATE - INTERVAL '12 weeks'
            WHEN p_period = 'monthly' THEN CURRENT_DATE - INTERVAL '12 months'
            WHEN p_period = 'yearly' THEN CURRENT_DATE - INTERVAL '5 years'
        END
    GROUP BY 
        CASE 
            WHEN p_period = 'daily' THEN DATE_TRUNC('day', order_date)
            WHEN p_period = 'weekly' THEN DATE_TRUNC('week', order_date)
            WHEN p_period = 'monthly' THEN DATE_TRUNC('month', order_date)
            WHEN p_period = 'yearly' THEN DATE_TRUNC('year', order_date)
        END,
        period_label
    ORDER BY 
        CASE 
            WHEN p_period = 'daily' THEN DATE_TRUNC('day', order_date)
            WHEN p_period = 'weekly' THEN DATE_TRUNC('week', order_date)
            WHEN p_period = 'monthly' THEN DATE_TRUNC('month', order_date)
            WHEN p_period = 'yearly' THEN DATE_TRUNC('year', order_date)
        END;
END;
$$ LANGUAGE plpgsql;
```

### 2. Statistics Cards com Comparação
```sql
CREATE OR REPLACE FUNCTION get_statistics_cards(
    p_organization_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'total_products', (
            SELECT COUNT(*) FROM products WHERE organization_id = p_organization_id
        ),
        'products_change', (
            SELECT COUNT(*) FROM products 
            WHERE organization_id = p_organization_id 
                AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        ),
        'total_customers', (
            SELECT COUNT(*) FROM leads WHERE organization_id = p_organization_id
        ),
        'customers_change', (
            SELECT COUNT(*) FROM leads 
            WHERE organization_id = p_organization_id 
                AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        ),
        'total_orders', (
            SELECT COUNT(*) FROM orders WHERE organization_id = p_organization_id
        ),
        'orders_change', (
            SELECT COUNT(*) FROM orders 
            WHERE organization_id = p_organization_id 
                AND order_date >= CURRENT_DATE - INTERVAL '7 days'
        ),
        'total_sales', (
            SELECT COALESCE(SUM(total_amount), 0) FROM orders 
            WHERE organization_id = p_organization_id
        ),
        'sales_change', (
            SELECT COALESCE(SUM(total_amount), 0) FROM orders 
            WHERE organization_id = p_organization_id 
                AND order_date >= CURRENT_DATE - INTERVAL '7 days'
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```


### 3. Top Selling Products
```sql
CREATE OR REPLACE FUNCTION get_top_selling_products(
    p_organization_id UUID,
    p_limit INT DEFAULT 5
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    product_image TEXT,
    category TEXT,
    price NUMERIC,
    discount NUMERIC,
    quantity_sold BIGINT,
    total_orders BIGINT,
    total_revenue NUMERIC,
    total_profit NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as product_id,
        p.name as product_name,
        p.image_url as product_image,
        m.name as category,
        p.price,
        0 as discount, -- Pode ser calculado se houver campo de desconto
        SUM(oi.quantity) as quantity_sold,
        COUNT(DISTINCT oi.order_id) as total_orders,
        SUM(oi.total_price) as total_revenue,
        SUM(oi.profit) as total_profit
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON o.id = oi.order_id
    LEFT JOIN marketplaces m ON m.id = p.marketplace_id
    WHERE p.organization_id = p_organization_id
        AND o.organization_id = p_organization_id
    GROUP BY p.id, p.name, p.image_url, m.name, p.price
    ORDER BY quantity_sold DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

### 4. Stock Report
```sql
CREATE OR REPLACE FUNCTION get_stock_report(
    p_organization_id UUID
)
RETURNS TABLE (
    product_name TEXT,
    price NUMERIC,
    stock_quantity INT,
    stock_status TEXT,
    stock_percentage INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name as product_name,
        p.price,
        p.stock_quantity,
        CASE 
            WHEN p.stock_quantity = 0 THEN 'Out of Stock'
            WHEN p.stock_quantity <= 20 THEN 'Low Stock'
            ELSE 'High Stock'
        END as stock_status,
        CASE 
            WHEN p.stock_quantity = 0 THEN 0
            WHEN p.stock_quantity <= 20 THEN (p.stock_quantity * 100 / 20)
            ELSE 100
        END as stock_percentage
    FROM products p
    WHERE p.organization_id = p_organization_id
    ORDER BY 
        CASE 
            WHEN p.stock_quantity = 0 THEN 1
            WHEN p.stock_quantity <= 20 THEN 2
            ELSE 3
        END,
        p.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql;
```

### 5. Top Customers
```sql
CREATE OR REPLACE FUNCTION get_top_customers(
    p_organization_id UUID,
    p_limit INT DEFAULT 6
)
RETURNS TABLE (
    customer_id UUID,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    total_orders BIGINT,
    total_spent NUMERIC,
    last_order_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id as customer_id,
        l.name as customer_name,
        l.email as customer_email,
        l.phone as customer_phone,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.order_date) as last_order_date
    FROM leads l
    LEFT JOIN orders o ON o.lead_id = l.id
    WHERE l.organization_id = p_organization_id
    GROUP BY l.id, l.name, l.email, l.phone
    ORDER BY total_orders DESC, total_spent DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```


### 6. Distribution by Country
```sql
CREATE OR REPLACE FUNCTION get_distribution_by_country(
    p_organization_id UUID
)
RETURNS TABLE (
    country TEXT,
    country_code TEXT,
    total_customers BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH country_stats AS (
        SELECT 
            COALESCE(address_country, 'Unknown') as country,
            COUNT(*) as customer_count
        FROM leads
        WHERE organization_id = p_organization_id
        GROUP BY address_country
    ),
    total_count AS (
        SELECT SUM(customer_count) as total FROM country_stats
    )
    SELECT 
        cs.country,
        CASE 
            WHEN cs.country = 'Brasil' THEN 'BR'
            WHEN cs.country = 'USA' THEN 'US'
            WHEN cs.country = 'Japan' THEN 'JP'
            WHEN cs.country = 'France' THEN 'FR'
            WHEN cs.country = 'Germany' THEN 'DE'
            ELSE 'XX'
        END as country_code,
        cs.customer_count as total_customers,
        ROUND((cs.customer_count::NUMERIC / tc.total * 100), 2) as percentage
    FROM country_stats cs
    CROSS JOIN total_count tc
    ORDER BY cs.customer_count DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## 📦 Componentes React a Criar

### 1. RevenueReportChart.tsx
**Props:**
- `organizationId: string`
- `period: 'daily' | 'weekly' | 'monthly' | 'yearly'`

**Funcionalidades:**
- Gráfico de área com Recharts
- Filtro de período
- Valores totais destacados
- Cores: Verde (receita), Vermelho (custo)

### 2. StatisticsCards.tsx
**Props:**
- `organizationId: string`

**Funcionalidades:**
- 4 cards em grid
- Ícones com gradiente
- Valores com animação
- Indicador de mudança (+/-)

### 3. CustomersStatistics.tsx
**Props:**
- `organizationId: string`
- `period: string`

**Funcionalidades:**
- Gráfico de rosca (Recharts)
- Filtro de período
- Percentuais visuais

### 4. RecentOrdersTable.tsx
**Props:**
- `organizationId: string`
- `limit: number`

**Funcionalidades:**
- Tabela com avatares
- Status badges coloridos
- Link "View All"

### 5. TransactionsList.tsx
**Props:**
- `organizationId: string`
- `period: string`

**Funcionalidades:**
- Lista vertical
- Ícones de pagamento
- Valores coloridos (+/-)

### 6. DistributionMap.tsx
**Props:**
- `organizationId: string`

**Funcionalidades:**
- Mapa interativo (react-simple-maps)
- Lista de países
- Barras de progresso

### 7. TopCustomersList.tsx
**Props:**
- `organizationId: string`
- `limit: number`

**Funcionalidades:**
- Cards com avatares
- Informações do cliente
- Número de pedidos

### 8. TopSellingProductsTable.tsx
**Props:**
- `organizationId: string`
- `limit: number`

**Funcionalidades:**
- Tabela com imagens
- Métricas de vendas
- Badge de pedidos

### 9. StockReportTable.tsx
**Props:**
- `organizationId: string`

**Funcionalidades:**
- Tabela com barras de progresso
- Status coloridos
- Alertas de estoque baixo


---

## 🎨 Design System

### Cores (Baseado no WowDash)

```typescript
const colors = {
  primary: {
    blue: '#487FFF',
    green: '#45B369',
    red: '#EF4A00',
    yellow: '#FFC861',
    purple: '#9B51E0',
  },
  status: {
    paid: '#45B369',
    pending: '#FFC861',
    shipped: '#487FFF',
    canceled: '#EF4A00',
  },
  stock: {
    outOfStock: '#EF4A00',
    lowStock: '#FFC861',
    highStock: '#45B369',
  },
  chart: {
    revenue: '#45B369',
    expense: '#EF4A00',
    profit: '#487FFF',
  },
  background: {
    light: '#FFFFFF',
    dark: '#1A1D1F',
    card: '#F8F9FA',
    cardDark: '#2C2F33',
  },
  text: {
    primary: '#1A1D1F',
    secondary: '#6F767E',
    light: '#FFFFFF',
  },
};
```

### Tipografia

```typescript
const typography = {
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-bold',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-semibold',
  h5: 'text-base font-semibold',
  h6: 'text-sm font-semibold',
  body: 'text-sm',
  caption: 'text-xs',
};
```

### Espaçamento

```typescript
const spacing = {
  section: 'mb-6',
  card: 'p-6',
  cardSmall: 'p-4',
  grid: 'gap-6',
  gridSmall: 'gap-4',
};
```

---

## 📊 Bibliotecas Necessárias

### Gráficos
```bash
npm install recharts
```
**Uso:**
- AreaChart (Revenue Report)
- PieChart/DonutChart (Customer Statistics)
- LineChart (Recent Orders)
- BarChart (se necessário)

### Mapas
```bash
npm install react-simple-maps
```
**Uso:**
- Mapa mundial interativo
- Destacar países com dados

### Ícones
```bash
npm install lucide-react
```
**Já instalado** - Usar ícones existentes

### Utilitários
```bash
npm install date-fns
```
**Uso:**
- Formatação de datas
- Cálculos de períodos

---

## 🚀 Plano de Implementação

### Fase 1: Preparação (2-3 horas) ✅ CONCLUÍDO
- [x] ✅ Criar functions SQL no Supabase
- [x] ✅ Testar queries com dados reais
- [x] ✅ Instalar bibliotecas necessárias (recharts, date-fns)
- [x] ✅ Criar estrutura de pastas

### Fase 2: Componentes Base (8-10 horas) ✅ CONCLUÍDO
- [x] ✅ RevenueReportChart
- [x] ✅ StatisticsCards
- [x] ✅ RecentOrdersTable
- [x] ✅ RecentOrdersChart

### Fase 3: Componentes Secundários (6-8 horas) ✅ CONCLUÍDO
- [x] ✅ TransactionsList
- [x] ✅ TopCustomersList
- [x] ✅ TopSellingProductsTable
- [x] ✅ StockReportTable

### Fase 4: Componentes Avançados (4-6 horas) ✅ CONCLUÍDO
- [x] ✅ CustomersStatistics (Donut Chart por marketplace)
- [ ] ⏸️ DistributionMap (Mapa mundial) - OPCIONAL

### Fase 5: Integração e Polimento (2-3 horas) ✅ CONCLUÍDO
- [x] ✅ Criar hooks customizados
- [x] ✅ Integrar componentes na página
- [x] ✅ Ajustar layout responsivo
- [x] ✅ Testar em diferentes resoluções
- [x] ✅ Loading states
- [x] ✅ Error handling
- [x] ✅ Build e testes finais

**Status Atual: 95% CONCLUÍDO**  
**Tempo Investido: ~7 horas**  
**Componentes Implementados: 9/10**  
**Build: ✅ Aprovado (27.48s, 0 erros)**


---

## 📁 Estrutura de Arquivos Proposta

```
src/
├── pages/
│   └── Sales.tsx (atualizar)
├── components/
│   └── sales/
│       ├── RevenueReportChart.tsx
│       ├── StatisticsCards.tsx
│       ├── CustomersStatistics.tsx
│       ├── RecentOrdersTable.tsx
│       ├── TransactionsList.tsx
│       ├── RecentOrdersChart.tsx
│       ├── DistributionMap.tsx
│       ├── TopCustomersList.tsx
│       ├── TopSellingProductsTable.tsx
│       └── StockReportTable.tsx
├── hooks/
│   └── sales/
│       ├── useRevenueReport.ts
│       ├── useStatisticsCards.ts
│       ├── useTopProducts.ts
│       ├── useTopCustomers.ts
│       ├── useStockReport.ts
│       └── useDistribution.ts
├── services/
│   └── salesService.ts
└── types/
    └── sales.ts
```

---

## 🔄 Hooks Customizados

### useRevenueReport.ts
```typescript
export const useRevenueReport = (
  organizationId: string,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
) => {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.rpc('get_revenue_report', {
          p_organization_id: organizationId,
          p_period: period,
        });
        if (error) throw error;
        setData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [organizationId, period]);

  return { data, loading, error };
};
```

### useStatisticsCards.ts
```typescript
export const useStatisticsCards = (organizationId: string) => {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase.rpc('get_statistics_cards', {
        p_organization_id: organizationId,
      });
      if (!error) setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, [organizationId]);

  return { stats, loading };
};
```

---

## 🎯 Melhorias Específicas vs Página Atual

### O Que Manter
- ✅ Header com título e filtro de período
- ✅ Metrics cards (expandir de 4 para mais métricas)
- ✅ Integração com Supabase
- ✅ Tradução PT-BR
- ✅ Dark mode support

### O Que Adicionar
- 🆕 Revenue Report com gráfico de área
- 🆕 Customer Statistics com donut chart
- 🆕 Distribution Map com países
- 🆕 Stock Report com alertas
- 🆕 Transactions timeline
- 🆕 Filtros avançados por período
- 🆕 Comparações com período anterior
- 🆕 Indicadores visuais de crescimento

### O Que Melhorar
- 📈 Gráficos mais sofisticados (área, donut)
- 🎨 Design mais moderno e profissional
- 📊 Mais densidade de informação
- 🔄 Loading states melhores
- 📱 Responsividade aprimorada
- ⚡ Performance otimizada

---

## 🧪 Testes Recomendados

### Testes de Integração
1. Verificar se todas as queries retornam dados
2. Testar filtros de período
3. Validar cálculos de lucro e margem
4. Testar com dados vazios

### Testes de UI
1. Verificar responsividade em mobile/tablet/desktop
2. Testar dark mode
3. Validar loading states
4. Testar error states

### Testes de Performance
1. Medir tempo de carregamento
2. Otimizar queries lentas
3. Implementar cache quando necessário
4. Lazy loading de componentes pesados

---

## 📝 Notas de Implementação

### Prioridades
1. **Alta**: Revenue Report, Statistics Cards, Recent Orders
2. **Média**: Top Products, Top Customers, Stock Report
3. **Baixa**: Distribution Map, Transactions, Customer Statistics

### Considerações
- Usar dados reais sempre que possível
- Implementar fallbacks para dados ausentes
- Manter consistência com design existente
- Documentar cada componente
- Criar storybook para componentes (opcional)

### Próximos Passos Imediatos
1. Aplicar as functions SQL no Supabase
2. Testar queries com dados reais
3. Instalar bibliotecas (recharts, react-simple-maps)
4. Criar primeiro componente (RevenueReportChart)
5. Iterar e expandir

---

## 🎉 Resultado Esperado

Uma página de vendas completa e profissional que:
- ✅ Mostra dados reais do sistema de processamento de vendas
- ✅ Oferece visualizações avançadas e intuitivas
- ✅ Permite análise detalhada de performance
- ✅ Mantém a identidade visual do projeto
- ✅ É responsiva e performática
- ✅ Inspira confiança e profissionalismo

**Referência Visual**: `docs/wowdash-ecommerce-reference.png`
