# Oportunidades de Dados para Dashboard de Vendas

## 📊 Visão Geral

Após processar o lucro, o sistema gera dados ricos em 6 tabelas principais que podem ser aproveitados para criar visualizações e análises poderosas no dashboard de vendas.

---

## 🗄️ Estrutura de Dados Disponíveis

### 1. **orders** - Pedidos Processados
Tabela principal com informações consolidadas de cada pedido.

**Campos Principais:**
- `total_amount`: Valor total do pedido (R$ 39,90)
- `total_cost`: Custo total (R$ 29,90)
- `total_profit`: Lucro total (R$ 7,87)
- `profit_margin`: Margem de lucro (19,71%)
- `marketplace_commission`: Comissão do marketplace (R$ 2,13)
- `shipping_cost`: Custo de envio
- `discount_value`: Valor de desconto
- `order_date`: Data do pedido
- `status`: Status (completed, pending, etc)
- `marketplace_id`: Marketplace de origem
- `sales_channel_id`: Canal de venda
- `lead_id`: Lead/cliente associado
- `customer_id`: Cliente associado

**Oportunidades:**
- ✅ Gráfico de evolução de receita vs lucro ao longo do tempo
- ✅ Análise de margem de lucro por período
- ✅ Comparação de performance entre marketplaces
- ✅ Análise de comissões pagas por marketplace
- ✅ Tracking de custos operacionais (frete, descontos)

---

### 2. **order_items** - Itens dos Pedidos
Detalhamento de cada produto vendido em cada pedido.

**Campos Principais:**
- `product_id`: Produto vendido
- `product_name`: Nome do produto (ex: "Camisa Feminina Baby Look Stitch e Angel Cor:Branco;Tamanho:M")
- `quantity`: Quantidade vendida (1)
- `unit_price`: Preço unitário (R$ 39,90)
- `total_price`: Preço total (R$ 39,90)
- `unit_cost`: Custo unitário (R$ 29,90)
- `total_cost`: Custo total (R$ 29,90)
- `profit`: Lucro do item (R$ 10,00)
- `profit_margin`: Margem de lucro (25,06%)
- `product_image_url`: URL da imagem

**Oportunidades:**
- ✅ Ranking de produtos mais lucrativos (não apenas mais vendidos)
- ✅ Análise de margem de lucro por produto
- ✅ Identificação de produtos com baixa margem
- ✅ Análise de mix de produtos (quantidade vs lucro)
- ✅ Produtos com melhor performance de lucro

---

### 3. **orders_with_location** - Pedidos com Localização
View que combina pedidos com dados de localização do cliente.

**Campos Principais:**
- `label_city`: Cidade (Rio de Janeiro)
- `label_state`: Estado (RJ)
- `label_zip`: CEP
- `label_address`: Endereço
- Todos os campos de `orders`

**Oportunidades:**
- ✅ Mapa de distribuição de vendas por estado (já implementado)
- ✅ Análise de concentração de vendas por região
- ✅ Identificação de regiões mais lucrativas
- ✅ Análise de custo de frete por região
- ✅ Heatmap de vendas no Brasil

---

### 4. **leads** - Leads/Clientes
Informações consolidadas sobre leads e clientes.

**Campos Principais:**
- `name`: Nome do lead (Jonatan Renan Vitoriano Da Silva)
- `email`: Email (jonatan_rvs@hotmail.com)
- `phone`: Telefone ((11) 98765-4321)
- `total_orders`: Total de pedidos (3)
- `total_spent`: Valor total gasto (R$ 224,40)
- `first_order_date`: Data do primeiro pedido
- `last_order_date`: Data do último pedido
- `lead_status`: Status (converted, new, contacted, etc)
- `lead_source`: Origem (Mercado Livre)
- `marketplace_id`: Marketplace de origem
- `address_city`: Cidade (São Paulo)
- `address_state`: Estado (SP)

**Oportunidades:**
- ✅ Análise de LTV (Lifetime Value) dos clientes
- ✅ Segmentação de clientes por valor gasto
- ✅ Análise de recência (últimos pedidos)
- ✅ Funil de conversão de leads
- ✅ Taxa de recompra
- ✅ Clientes mais valiosos (Top Customers)
- ✅ Análise de origem de leads por marketplace
- ✅ Distribuição geográfica de clientes

---

### 5. **lead_orders_summary** - Resumo de Pedidos por Lead
View agregada com estatísticas completas de cada lead.

**Campos Principais:**
- `lead_id`: ID do lead
- `lead_name`: Nome (Jonatan Renan Vitoriano Da Silva (jr20251119124537))
- `bling_contact_id`: ID no Bling (17837649656)
- `email`: Email
- `phone`: Telefone
- `marketplace`: Marketplace (Mercado Livre)
- `lead_total_orders`: Total de pedidos do lead (40)
- `lead_total_spent`: Total gasto pelo lead (R$ 2.813,58)
- `first_order_date`: Primeiro pedido (2026-02-27)
- `last_order_date`: Último pedido (2026-03-13)
- `orders_count`: Contagem de pedidos processados (1)
- `orders_total_amount`: Valor total dos pedidos (R$ 39,90)
- `orders`: Array JSON com detalhes de cada pedido

**Oportunidades:**
- ✅ Dashboard de Customer Lifetime Value (CLV)
- ✅ Análise de comportamento de compra
- ✅ Identificação de clientes VIP
- ✅ Análise de frequência de compra
- ✅ Segmentação RFM (Recency, Frequency, Monetary)
- ✅ Previsão de churn (clientes inativos)
- ✅ Análise de ticket médio por cliente
- ✅ Comparação de performance entre marketplaces

---

### 6. **financial_summary** - Resumo Financeiro Consolidado
View com métricas financeiras agregadas.

**Campos Principais:**
- `total_processed_orders`: Total de pedidos processados (1)
- `total_revenue`: Receita total (R$ 39,90)
- `total_cost`: Custo total (R$ 29,90)
- `total_commissions`: Comissões totais (R$ 2,13)
- `total_shipping`: Frete total (R$ 0,00)
- `total_expenses`: Outras despesas (R$ 0,00)
- `total_profit`: Lucro total (R$ 7,87)
- `avg_profit_margin`: Margem média (19,71%)
- `pending_orders_count`: Pedidos pendentes (0)
- `pending_revenue`: Receita pendente
- `by_marketplace`: Array JSON com breakdown por marketplace
  - `marketplace_id`: ID do marketplace
  - `marketplace_name`: Nome (Mercado Livre)
  - `orders_count`: Quantidade de pedidos (1)
  - `revenue`: Receita (R$ 39,90)
  - `profit`: Lucro (R$ 7,87)

**Oportunidades:**
- ✅ KPI Cards no Hero Section (já implementado parcialmente)
- ✅ Análise de rentabilidade geral
- ✅ Comparação de performance entre marketplaces
- ✅ Análise de estrutura de custos
- ✅ Tracking de comissões por marketplace
- ✅ Análise de eficiência operacional
- ✅ Dashboard executivo com métricas consolidadas

---

## 🎨 Componentes shadcn/ui Recomendados

### Para Visualizações de Dados

1. **Card** - Já usado para KPIs
   ```bash
   npx shadcn@latest add card
   ```

2. **Table** - Para listagens detalhadas
   ```bash
   npx shadcn@latest add table
   ```

3. **Badge** - Para status e categorias
   ```bash
   npx shadcn@latest add badge
   ```

4. **Tabs** - Para organizar diferentes análises (já implementado)
   ```bash
   npx shadcn@latest add tabs
   ```

5. **Select** - Para filtros e seleção
   ```bash
   npx shadcn@latest add select
   ```

6. **Dialog** - Para detalhes expandidos
   ```bash
   npx shadcn@latest add dialog
   ```

7. **Popover** - Para tooltips e informações adicionais
   ```bash
   npx shadcn@latest add popover
   ```

8. **Progress** - Para barras de progresso
   ```bash
   npx shadcn@latest add progress
   ```

9. **Separator** - Para divisões visuais
   ```bash
   npx shadcn@latest add separator
   ```

10. **Avatar** - Para representar clientes
    ```bash
    npx shadcn@latest add avatar
    ```

11. **Tooltip** - Para informações contextuais
    ```bash
    npx shadcn@latest add tooltip
    ```

12. **Calendar** - Para seleção de datas
    ```bash
    npx shadcn@latest add calendar
    ```

13. **Date Range Picker** - Para filtros de período
    ```bash
    npx shadcn@latest add date-range-picker
    ```

---

## 💡 Ideias de Componentes para Implementar

### 1. **Profit Analysis Card**
Componente que mostra análise de lucro com breakdown de custos.

**Dados:**
- `orders.total_profit`
- `orders.profit_margin`
- `orders.total_cost`
- `orders.marketplace_commission`
- `orders.shipping_cost`

**Componentes shadcn/ui:**
- Card
- Progress
- Badge
- Tooltip

**Visual:**
```
┌─────────────────────────────────────┐
│ 💰 Análise de Lucro                 │
├─────────────────────────────────────┤
│ Lucro Total: R$ 7,87                │
│ Margem: 19,71% ▼ -5%                │
│                                     │
│ Breakdown:                          │
│ ████████████░░░░░░░░ Custo (74,9%)  │
│ ██░░░░░░░░░░░░░░░░░░ Comissão (5,3%)│
│ ████░░░░░░░░░░░░░░░░ Lucro (19,7%)  │
└─────────────────────────────────────┘
```

---

### 2. **Top Profitable Products Table**
Tabela de produtos mais lucrativos (não apenas mais vendidos).

**Dados:**
- `order_items.product_name`
- `order_items.profit`
- `order_items.profit_margin`
- `order_items.quantity` (agregado)
- `order_items.total_price` (agregado)

**Componentes shadcn/ui:**
- Table
- Badge
- Avatar (imagem do produto)
- Progress

**Colunas:**
1. Ranking
2. Produto (imagem + nome)
3. Lucro Total
4. Margem (%)
5. Qtd Vendida
6. Receita Total

---

### 3. **Customer Lifetime Value Dashboard**
Dashboard completo de análise de clientes.

**Dados:**
- `lead_orders_summary.lead_total_spent`
- `lead_orders_summary.lead_total_orders`
- `lead_orders_summary.first_order_date`
- `lead_orders_summary.last_order_date`
- `leads.lead_status`

**Componentes shadcn/ui:**
- Card
- Table
- Badge
- Avatar
- Tabs
- Select (filtros)

**Seções:**
1. KPIs: CLV Médio, Taxa de Recompra, Ticket Médio
2. Segmentação RFM
3. Top Clientes VIP
4. Análise de Churn

---

### 4. **Marketplace Performance Comparison**
Comparação de performance entre marketplaces.

**Dados:**
- `financial_summary.by_marketplace`
- `orders.marketplace_id`
- `orders.total_profit`
- `orders.marketplace_commission`

**Componentes shadcn/ui:**
- Card
- Table
- Badge
- Progress
- Tabs

**Métricas:**
1. Receita por Marketplace
2. Lucro por Marketplace
3. Comissão Média
4. Margem de Lucro
5. Quantidade de Pedidos

---

### 5. **Geographic Sales Heatmap**
Mapa de calor de vendas por região (evolução do mapa atual).

**Dados:**
- `orders_with_location.label_state`
- `orders_with_location.label_city`
- `orders.total_amount`
- `orders.total_profit`

**Componentes shadcn/ui:**
- Card
- Tabs
- Badge
- Tooltip
- Select (filtros)

**Funcionalidades:**
1. Visualização por estado (já implementado)
2. Drill-down para cidades
3. Filtro por período
4. Métricas: Receita, Lucro, Quantidade

---

### 6. **Cost Structure Analysis**
Análise detalhada da estrutura de custos.

**Dados:**
- `orders.total_cost`
- `orders.marketplace_commission`
- `orders.shipping_cost`
- `orders.discount_value`
- `orders.other_expenses`

**Componentes shadcn/ui:**
- Card
- Progress
- Badge
- Tooltip

**Visual:**
```
┌─────────────────────────────────────┐
│ 📊 Estrutura de Custos              │
├─────────────────────────────────────┤
│ Receita Total: R$ 39,90             │
│                                     │
│ Custos:                             │
│ ████████████████████ Produto (74,9%)│
│ ██░░░░░░░░░░░░░░░░░░ Comissão (5,3%)│
│ ░░░░░░░░░░░░░░░░░░░░ Frete (0%)     │
│ ░░░░░░░░░░░░░░░░░░░░ Desconto (0%)  │
│                                     │
│ Lucro Líquido: R$ 7,87 (19,7%)     │
└─────────────────────────────────────┘
```

---

### 7. **Revenue vs Profit Trend Chart**
Gráfico de evolução de receita vs lucro ao longo do tempo.

**Dados:**
- `orders.order_date`
- `orders.total_amount`
- `orders.total_profit`

**Componentes shadcn/ui:**
- Card
- Select (período)
- Badge
- Tabs

**Funcionalidades:**
1. Visualização diária/semanal/mensal
2. Comparação com período anterior
3. Linha de tendência
4. Indicadores de crescimento

---

### 8. **Lead Conversion Funnel**
Funil de conversão de leads.

**Dados:**
- `leads.lead_status`
- `leads.total_orders`
- `leads.total_spent`

**Componentes shadcn/ui:**
- Card
- Progress
- Badge

**Estágios:**
1. Novos Leads
2. Contatados
3. Qualificados
4. Convertidos
5. Clientes Recorrentes

---

### 9. **Product Margin Alert**
Alerta de produtos com margem baixa.

**Dados:**
- `order_items.product_name`
- `order_items.profit_margin`
- `order_items.profit`

**Componentes shadcn/ui:**
- Card
- Table
- Badge (vermelho para margem baixa)
- Alert

**Critérios:**
- Margem < 15%: Alerta vermelho
- Margem 15-25%: Alerta amarelo
- Margem > 25%: Verde

---

### 10. **Customer Segmentation (RFM)**
Segmentação de clientes por Recência, Frequência e Valor Monetário.

**Dados:**
- `lead_orders_summary.last_order_date` (Recency)
- `lead_orders_summary.lead_total_orders` (Frequency)
- `lead_orders_summary.lead_total_spent` (Monetary)

**Componentes shadcn/ui:**
- Card
- Table
- Badge
- Tabs

**Segmentos:**
1. Champions (RFM alto)
2. Loyal Customers
3. At Risk
4. Lost Customers
5. New Customers

---

## 🚀 Priorização de Implementação

### Fase 1 - Análise de Lucro (Semana 1)
1. ✅ Profit Analysis Card
2. ✅ Top Profitable Products Table
3. ✅ Cost Structure Analysis

### Fase 2 - Análise de Clientes (Semana 2)
4. ✅ Customer Lifetime Value Dashboard
5. ✅ Customer Segmentation (RFM)
6. ✅ Lead Conversion Funnel

### Fase 3 - Análise de Performance (Semana 3)
7. ✅ Marketplace Performance Comparison
8. ✅ Revenue vs Profit Trend Chart
9. ✅ Product Margin Alert

### Fase 4 - Análise Geográfica (Semana 4)
10. ✅ Geographic Sales Heatmap (evolução)

---

## 📝 Queries SQL Úteis

### 1. Top 10 Produtos Mais Lucrativos
```sql
SELECT 
  oi.product_name,
  SUM(oi.profit) as total_profit,
  AVG(oi.profit_margin) as avg_margin,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.total_price) as total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.organization_id = 'YOUR_ORG_ID'
  AND o.status = 'completed'
GROUP BY oi.product_name
ORDER BY total_profit DESC
LIMIT 10;
```

### 2. Análise de Margem por Marketplace
```sql
SELECT 
  m.name as marketplace,
  COUNT(o.id) as orders_count,
  SUM(o.total_amount) as revenue,
  SUM(o.total_profit) as profit,
  AVG(o.profit_margin) as avg_margin,
  SUM(o.marketplace_commission) as total_commission
FROM orders o
JOIN marketplaces m ON o.marketplace_id = m.id
WHERE o.organization_id = 'YOUR_ORG_ID'
  AND o.status = 'completed'
GROUP BY m.name
ORDER BY profit DESC;
```

### 3. Clientes VIP (Top 10 por LTV)
```sql
SELECT 
  l.name,
  l.email,
  l.phone,
  l.total_orders,
  l.total_spent,
  l.first_order_date,
  l.last_order_date,
  l.lead_source
FROM leads l
WHERE l.organization_id = 'YOUR_ORG_ID'
  AND l.is_active = true
ORDER BY l.total_spent DESC
LIMIT 10;
```

### 4. Evolução de Receita vs Lucro (Últimos 30 dias)
```sql
SELECT 
  DATE(o.order_date) as date,
  SUM(o.total_amount) as revenue,
  SUM(o.total_profit) as profit,
  AVG(o.profit_margin) as avg_margin,
  COUNT(o.id) as orders_count
FROM orders o
WHERE o.organization_id = 'YOUR_ORG_ID'
  AND o.status = 'completed'
  AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(o.order_date)
ORDER BY date DESC;
```

### 5. Produtos com Margem Baixa (< 20%)
```sql
SELECT 
  oi.product_name,
  AVG(oi.profit_margin) as avg_margin,
  SUM(oi.profit) as total_profit,
  SUM(oi.quantity) as total_sold,
  SUM(oi.total_price) as total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.organization_id = 'YOUR_ORG_ID'
  AND o.status = 'completed'
GROUP BY oi.product_name
HAVING AVG(oi.profit_margin) < 20
ORDER BY total_revenue DESC;
```

---

## 🎯 Conclusão

Com os dados disponíveis nas 6 tabelas, você tem uma base sólida para criar um dashboard de vendas completo e profissional. A combinação de:

1. **Dados Financeiros** (orders, order_items, financial_summary)
2. **Dados de Clientes** (leads, lead_orders_summary)
3. **Dados Geográficos** (orders_with_location)

Permite criar análises poderosas que vão muito além de simples relatórios de vendas, incluindo:

- Análise de rentabilidade
- Segmentação de clientes
- Performance por marketplace
- Análise geográfica
- Previsões e tendências
- Alertas e recomendações

Use os componentes do shadcn/ui para criar interfaces elegantes e responsivas que tornem esses dados acionáveis para o usuário.
