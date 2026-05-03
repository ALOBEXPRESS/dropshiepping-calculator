# Correção - Vendas: Imagem e Gráfico

**Data:** 1 de Março de 2026  
**Problemas Identificados:** 3  
**Status:** 🔧 Em Correção

---

## 🐛 Problemas Identificados

### 1. Imagem do Produto Não Aparece em Vendas Pendentes

**Sintoma:**
- Ao chegar um novo pedido de venda, a imagem do produto não é exibida
- Apenas o ícone de pacote (Package) é mostrado

**Causa Raiz:**
A view `pending_orders_to_process` busca a imagem do produto, mas:
1. A query usa `products.image_url` que pode estar NULL
2. Não há fallback para buscar de `products_bling.image_url`
3. A relação entre `bling_order_items` e `products` pode não estar correta

**Localização:**
- View: `pending_orders_to_process` (linha 6 da view)
- Componente: `src/components/PendingOrders.tsx` (linha 234-254)

---

### 2. Gráfico Não Mostra Dados Após Processar

**Sintoma:**
- Após clicar em "PROCESSAR LUCRO", o gráfico continua vazio
- Não aparecem informações de receita e custo

**Causa Raiz:**
A function `get_revenue_report` **NÃO EXISTE** no banco de dados!
- Hook: `src/hooks/sales/useRevenueReport.ts` chama `supabase.rpc('get_revenue_report')`
- Componente: `src/components/sales/RevenueReportChart.tsx` usa o hook
- Resultado: Erro silencioso, gráfico vazio

**Localização:**
- Hook: `src/hooks/sales/useRevenueReport.ts` (linha 16)
- Componente: `src/components/sales/RevenueReportChart.tsx` (linha 11)
- Function SQL: **AUSENTE**

---

### 3. Custo do Produto Não Atualizado

**Sintoma:**
- O custo do produto (R$ 21,90) não aparece nas projeções
- "Total de Vendas" e "Total de Custos" não são atualizados

**Causa Raiz:**
A function `process_bling_order_to_profit` busca `products.cost_price`, mas:
1. O custo pode estar desatualizado na tabela `products`
2. O custo correto está em `products_bling.cost_price`
3. Não há sincronização entre as duas tabelas

**Localização:**
- Function: `process_bling_order_to_profit` (linha 150 da migration)
- Tabela: `products` vs `products_bling`

---

## 🔧 Soluções Propostas

### Solução 1: Corrigir View de Vendas Pendentes

**Objetivo:** Buscar imagem do produto corretamente

**Alterações:**
1. Modificar subquery para buscar de `products_bling` primeiro
2. Fazer fallback para `products.image_url` se não encontrar
3. Usar COALESCE para garantir que sempre tente ambas as fontes

**SQL:**
```sql
-- Buscar primeira imagem de produto (priorizar products_bling)
(
    SELECT COALESCE(pb.image_url, p.image_url)
    FROM bling_order_items boi2
    LEFT JOIN products p ON p.id = boi2.product_id
    LEFT JOIN products_bling pb ON pb.code = p.sku
    WHERE boi2.order_id = bo.id 
        AND (pb.image_url IS NOT NULL OR p.image_url IS NOT NULL)
    ORDER BY 
        CASE WHEN pb.image_url IS NOT NULL THEN 1 ELSE 2 END
    LIMIT 1
) as first_product_image
```

---

### Solução 2: Criar Function get_revenue_report

**Objetivo:** Criar a function que o frontend está chamando

**Funcionalidade:**
- Buscar dados de `orders` processados
- Agrupar por período (daily, weekly, monthly, yearly)
- Calcular receita total e custo total
- Retornar dados formatados para o gráfico

**SQL:**
```sql
CREATE OR REPLACE FUNCTION get_revenue_report(
    p_organization_id UUID,
    p_period TEXT DEFAULT 'monthly'
)
RETURNS TABLE (
    period_label TEXT,
    period_start DATE,
    period_end DATE,
    total_revenue NUMERIC,
    total_cost NUMERIC,
    total_profit NUMERIC,
    orders_count INTEGER
) AS $
DECLARE
    v_date_trunc TEXT;
    v_date_format TEXT;
BEGIN
    -- Determinar agrupamento baseado no período
    CASE p_period
        WHEN 'daily' THEN
            v_date_trunc := 'day';
            v_date_format := 'DD/MM';
        WHEN 'weekly' THEN
            v_date_trunc := 'week';
            v_date_format := 'DD/MM';
        WHEN 'yearly' THEN
            v_date_trunc := 'year';
            v_date_format := 'YYYY';
        ELSE -- monthly
            v_date_trunc := 'month';
            v_date_format := 'Mon';
    END CASE;
    
    RETURN QUERY
    SELECT 
        TO_CHAR(DATE_TRUNC(v_date_trunc, o.order_date), v_date_format) as period_label,
        DATE_TRUNC(v_date_trunc, o.order_date)::DATE as period_start,
        (DATE_TRUNC(v_date_trunc, o.order_date) + 
            CASE v_date_trunc
                WHEN 'day' THEN INTERVAL '1 day'
                WHEN 'week' THEN INTERVAL '1 week'
                WHEN 'month' THEN INTERVAL '1 month'
                WHEN 'year' THEN INTERVAL '1 year'
            END - INTERVAL '1 day')::DATE as period_end,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(SUM(o.total_cost), 0) as total_cost,
        COALESCE(SUM(o.total_profit), 0) as total_profit,
        COUNT(o.id)::INTEGER as orders_count
    FROM orders o
    WHERE o.organization_id = p_organization_id
        AND o.processed_at IS NOT NULL
        AND o.order_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC(v_date_trunc, o.order_date)
    ORDER BY period_start DESC;
END;
$ LANGUAGE plpgsql;
```

---

### Solução 3: Corrigir Busca de Custo do Produto

**Objetivo:** Buscar custo correto de `products_bling`

**Alterações na Function process_bling_order_to_profit:**

**Antes:**
```sql
SELECT 
    id,
    name,
    image_url,
    cost_price,
    price
INTO v_product
FROM products
WHERE id = v_item.product_id;
```

**Depois:**
```sql
SELECT 
    p.id,
    p.name,
    COALESCE(pb.image_url, p.image_url) as image_url,
    COALESCE(pb.cost_price, p.cost_price, 0) as cost_price,
    COALESCE(pb.price, p.price, 0) as price
INTO v_product
FROM products p
LEFT JOIN products_bling pb ON pb.code = p.sku
WHERE p.id = v_item.product_id;
```

**Benefícios:**
1. Prioriza dados de `products_bling` (mais atualizados)
2. Faz fallback para `products` se não encontrar
3. Garante que sempre há um valor (0 como padrão)

---

## 📋 Checklist de Implementação

### Passo 1: Criar Migration
- [ ] Criar arquivo `supabase/migrations/20260301_fix_sales_image_chart.sql`
- [ ] Adicionar correção da view `pending_orders_to_process`
- [ ] Adicionar function `get_revenue_report`
- [ ] Adicionar correção da function `process_bling_order_to_profit`

### Passo 2: Testar Localmente
- [ ] Executar migration no Supabase local
- [ ] Verificar se view retorna imagens
- [ ] Testar function `get_revenue_report` com diferentes períodos
- [ ] Processar um pedido de teste

### Passo 3: Validar Frontend
- [ ] Verificar se imagem aparece em vendas pendentes
- [ ] Processar um pedido e verificar gráfico
- [ ] Validar que custos estão corretos
- [ ] Testar diferentes períodos no gráfico

### Passo 4: Deploy
- [ ] Aplicar migration em produção
- [ ] Monitorar logs de erro
- [ ] Validar com dados reais

---

## 🎯 Impacto Esperado

### Antes
- ❌ Imagem não aparece
- ❌ Gráfico vazio após processar
- ❌ Custos incorretos

### Depois
- ✅ Imagem do produto exibida corretamente
- ✅ Gráfico atualizado automaticamente
- ✅ Custos precisos de `products_bling`

---

## 📊 Dados de Teste

### Produto Exemplo
```
SKU: 2023165366
Nome: Relógio Feminino Elegance
Custo: R$ 21,90
Preço: R$ 39,90
Imagem: products_bling.image_url
```

### Pedido Exemplo
```
Pedido #89
Data: 28/02/2026
Cliente: Jonatan Renan Vitoriano Da Silva
Email: jonatan_rvs@hotmail.com
Marketplace: MERCADO LIVRE
Valor Total: R$ 74,80
Itens: 2
```

---

## 🔗 Arquivos Relacionados

### Backend (SQL)
- `supabase/migrations/20260228_add_orders_processing_system.sql` (existente)
- `supabase/migrations/20260301_fix_sales_image_chart.sql` (novo)

### Frontend
- `src/components/PendingOrders.tsx`
- `src/components/sales/RevenueReportChart.tsx`
- `src/hooks/sales/useRevenueReport.ts`
- `src/pages/Sales.tsx`

### Documentação
- `docs/SISTEMA_VENDAS_A_PROCESSAR_IMPLEMENTADO.md`
- `docs/PAGINA_VENDAS_IMPLEMENTADA.md`
- `docs/CORRECAO_VENDAS_IMAGEM_GRAFICO.md` (este arquivo)

---

## 🚀 Próximos Passos

1. **Criar migration completa** com todas as correções
2. **Testar localmente** com dados reais
3. **Validar no frontend** que tudo funciona
4. **Documentar** resultados e aprendizados

---

**Última Atualização:** 1 de Março de 2026  
**Autor:** Kiro AI Assistant  
**Status:** 🔧 Aguardando Implementação
