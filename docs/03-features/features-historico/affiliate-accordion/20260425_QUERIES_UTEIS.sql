-- ============================================
-- QUERIES ÚTEIS - ANÁLISE DE AFILIADOS
-- ============================================
-- Data: 2026-04-25
-- Descrição: Queries SQL para análise de vendas por afiliado
-- ============================================

-- ============================================
-- 1. RELATÓRIO GERAL DE AFILIADOS
-- ============================================
-- Mostra performance de todos os afiliados ativos
SELECT 
  i.name as influencer_name,
  i.instagram,
  i.tiktok,
  i.twitter,
  i.percentage as commission_rate,
  COUNT(o.id) as total_orders,
  COUNT(CASE WHEN o.is_free_sample THEN 1 END) as free_samples,
  COUNT(CASE WHEN NOT o.is_free_sample THEN 1 END) as paid_orders,
  COALESCE(SUM(o.total_amount), 0) as total_revenue,
  COALESCE(SUM(o.total_profit), 0) as total_profit,
  COALESCE(SUM(
    CASE 
      WHEN o.is_free_sample THEN 0
      ELSE (o.total_amount * i.percentage / 100)
    END
  ), 0) as total_commission,
  COALESCE(SUM(o.total_profit), 0) - COALESCE(SUM(
    CASE 
      WHEN o.is_free_sample THEN 0
      ELSE (o.total_amount * i.percentage / 100)
    END
  ), 0) as net_profit,
  ROUND(
    CASE 
      WHEN COUNT(CASE WHEN NOT o.is_free_sample THEN 1 END) > 0 
      THEN COALESCE(SUM(o.total_amount), 0)::numeric / COUNT(CASE WHEN NOT o.is_free_sample THEN 1 END)
      ELSE 0
    END, 
    2
  ) as avg_order_value
FROM influencers i
LEFT JOIN orders o ON o.affiliate_id = i.id
WHERE i.is_active = true
GROUP BY i.id, i.name, i.instagram, i.tiktok, i.twitter, i.percentage
ORDER BY total_revenue DESC;

-- ============================================
-- 2. VENDAS POR AFILIADO (ÚLTIMOS 30 DIAS)
-- ============================================
SELECT 
  i.name as influencer_name,
  o.order_number,
  o.order_date,
  o.customer_name,
  o.total_amount,
  o.total_profit,
  o.is_free_sample,
  CASE 
    WHEN o.is_free_sample THEN 0
    ELSE (o.total_amount * i.percentage / 100)
  END as commission_amount,
  m.name as marketplace
FROM orders o
JOIN influencers i ON o.affiliate_id = i.id
LEFT JOIN marketplaces m ON o.marketplace_id = m.id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY o.order_date DESC;

-- ============================================
-- 3. ROI DE AMOSTRAS GRÁTIS POR AFILIADO
-- ============================================
-- Calcula o retorno sobre investimento de cada amostra grátis
WITH free_samples AS (
  SELECT 
    i.id as influencer_id,
    i.name as influencer_name,
    o.id as sample_order_id,
    o.order_date as sample_date,
    o.total_amount as sample_cost
  FROM orders o
  JOIN influencers i ON o.affiliate_id = i.id
  WHERE o.is_free_sample = true
),
subsequent_sales AS (
  SELECT 
    fs.influencer_id,
    fs.influencer_name,
    fs.sample_order_id,
    fs.sample_date,
    fs.sample_cost,
    COUNT(o.id) as sales_count,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    COALESCE(SUM(o.total_profit), 0) as total_profit
  FROM free_samples fs
  LEFT JOIN orders o ON o.affiliate_id = fs.influencer_id 
    AND o.order_date >= fs.sample_date
    AND o.is_free_sample = false
  GROUP BY fs.influencer_id, fs.influencer_name, fs.sample_order_id, fs.sample_date, fs.sample_cost
)
SELECT 
  influencer_name,
  sample_date,
  sample_cost as investment,
  sales_count as sales_generated,
  total_revenue,
  total_profit,
  total_profit - sample_cost as net_result,
  ROUND(
    CASE 
      WHEN sample_cost > 0 
      THEN ((total_profit - sample_cost) / sample_cost * 100)
      ELSE 0
    END, 
    2
  ) as roi_percentage
FROM subsequent_sales
ORDER BY roi_percentage DESC;

-- ============================================
-- 4. COMISSÕES A PAGAR (MÊS ATUAL)
-- ============================================
-- Lista de comissões que devem ser pagas aos afiliados
SELECT 
  i.name as influencer_name,
  i.instagram,
  i.tiktok,
  i.percentage as commission_rate,
  COUNT(o.id) as orders_count,
  SUM(o.total_amount) as total_sales,
  SUM(
    CASE 
      WHEN o.is_free_sample THEN 0
      ELSE (o.total_amount * i.percentage / 100)
    END
  ) as commission_to_pay
FROM orders o
JOIN influencers i ON o.affiliate_id = i.id
WHERE DATE_TRUNC('month', o.order_date) = DATE_TRUNC('month', CURRENT_DATE)
  AND o.is_free_sample = false
GROUP BY i.id, i.name, i.instagram, i.tiktok, i.percentage
HAVING SUM(
  CASE 
    WHEN o.is_free_sample THEN 0
    ELSE (o.total_amount * i.percentage / 100)
  END
) > 0
ORDER BY commission_to_pay DESC;

-- ============================================
-- 5. PEDIDOS SEM AFILIADO (ÚLTIMOS 7 DIAS)
-- ============================================
-- Identifica pedidos que podem ter vindo de afiliado mas não foram marcados
SELECT 
  o.order_number,
  o.order_date,
  o.customer_name,
  o.total_amount,
  o.total_profit,
  m.name as marketplace,
  o.is_free_sample
FROM orders o
LEFT JOIN marketplaces m ON o.marketplace_id = m.id
WHERE o.affiliate_id IS NULL
  AND o.order_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY o.order_date DESC;

-- ============================================
-- 6. COMPARAÇÃO MENSAL DE AFILIADOS
-- ============================================
-- Compara performance mês a mês
SELECT 
  i.name as influencer_name,
  TO_CHAR(o.order_date, 'YYYY-MM') as month,
  COUNT(o.id) as orders,
  SUM(o.total_amount) as revenue,
  SUM(o.total_profit) as profit,
  SUM(
    CASE 
      WHEN o.is_free_sample THEN 0
      ELSE (o.total_amount * i.percentage / 100)
    END
  ) as commission
FROM orders o
JOIN influencers i ON o.affiliate_id = i.id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY i.id, i.name, TO_CHAR(o.order_date, 'YYYY-MM')
ORDER BY i.name, month DESC;

-- ============================================
-- 7. TOP 10 CLIENTES POR AFILIADO
-- ============================================
-- Identifica os melhores clientes de cada afiliado
SELECT 
  i.name as influencer_name,
  o.customer_name,
  COUNT(o.id) as orders_count,
  SUM(o.total_amount) as total_spent,
  SUM(o.total_profit) as total_profit,
  MAX(o.order_date) as last_order_date
FROM orders o
JOIN influencers i ON o.affiliate_id = i.id
WHERE o.is_free_sample = false
GROUP BY i.id, i.name, o.customer_name
HAVING COUNT(o.id) > 1
ORDER BY i.name, total_spent DESC
LIMIT 10;

-- ============================================
-- 8. TAXA DE CONVERSÃO DE AMOSTRAS GRÁTIS
-- ============================================
-- Calcula quantos % das amostras grátis geraram vendas
WITH samples AS (
  SELECT 
    i.id as influencer_id,
    i.name as influencer_name,
    COUNT(*) as samples_sent
  FROM orders o
  JOIN influencers i ON o.affiliate_id = i.id
  WHERE o.is_free_sample = true
  GROUP BY i.id, i.name
),
conversions AS (
  SELECT 
    i.id as influencer_id,
    COUNT(DISTINCT o.id) as sales_made
  FROM orders o
  JOIN influencers i ON o.affiliate_id = i.id
  WHERE o.is_free_sample = false
  GROUP BY i.id
)
SELECT 
  s.influencer_name,
  s.samples_sent,
  COALESCE(c.sales_made, 0) as sales_made,
  ROUND(
    CASE 
      WHEN s.samples_sent > 0 
      THEN (COALESCE(c.sales_made, 0)::numeric / s.samples_sent * 100)
      ELSE 0
    END, 
    2
  ) as conversion_rate
FROM samples s
LEFT JOIN conversions c ON s.influencer_id = c.influencer_id
ORDER BY conversion_rate DESC;

-- ============================================
-- 9. VENDAS POR MARKETPLACE E AFILIADO
-- ============================================
-- Identifica qual marketplace funciona melhor para cada afiliado
SELECT 
  i.name as influencer_name,
  m.name as marketplace,
  COUNT(o.id) as orders,
  SUM(o.total_amount) as revenue,
  SUM(o.total_profit) as profit,
  ROUND(AVG(o.total_amount), 2) as avg_order_value
FROM orders o
JOIN influencers i ON o.affiliate_id = i.id
LEFT JOIN marketplaces m ON o.marketplace_id = m.id
WHERE o.is_free_sample = false
GROUP BY i.id, i.name, m.id, m.name
ORDER BY i.name, revenue DESC;

-- ============================================
-- 10. HISTÓRICO COMPLETO DE UM AFILIADO
-- ============================================
-- Substitua 'Maria Silva' pelo nome do afiliado
SELECT 
  o.order_number,
  o.order_date,
  o.customer_name,
  o.total_amount,
  o.total_profit,
  o.is_free_sample,
  CASE 
    WHEN o.is_free_sample THEN 'Amostra Grátis'
    ELSE 'Venda'
  END as order_type,
  CASE 
    WHEN o.is_free_sample THEN 0
    ELSE (o.total_amount * i.percentage / 100)
  END as commission,
  m.name as marketplace
FROM orders o
JOIN influencers i ON o.affiliate_id = i.id
LEFT JOIN marketplaces m ON o.marketplace_id = m.id
WHERE i.name = 'Maria Silva'
ORDER BY o.order_date DESC;

-- ============================================
-- 11. AFILIADOS INATIVOS (SEM VENDAS EM 30 DIAS)
-- ============================================
SELECT 
  i.name as influencer_name,
  i.instagram,
  i.tiktok,
  MAX(o.order_date) as last_sale_date,
  CURRENT_DATE - MAX(o.order_date) as days_since_last_sale,
  COUNT(o.id) as total_orders_ever
FROM influencers i
LEFT JOIN orders o ON o.affiliate_id = i.id
WHERE i.is_active = true
GROUP BY i.id, i.name, i.instagram, i.tiktok
HAVING MAX(o.order_date) < CURRENT_DATE - INTERVAL '30 days'
  OR MAX(o.order_date) IS NULL
ORDER BY days_since_last_sale DESC NULLS FIRST;

-- ============================================
-- 12. RESUMO EXECUTIVO (DASHBOARD)
-- ============================================
-- Métricas gerais de afiliados
SELECT 
  COUNT(DISTINCT i.id) as total_affiliates,
  COUNT(DISTINCT CASE WHEN o.id IS NOT NULL THEN i.id END) as active_affiliates,
  COUNT(o.id) as total_orders,
  COUNT(CASE WHEN o.is_free_sample THEN 1 END) as free_samples,
  COUNT(CASE WHEN NOT o.is_free_sample THEN 1 END) as paid_orders,
  COALESCE(SUM(o.total_amount), 0) as total_revenue,
  COALESCE(SUM(o.total_profit), 0) as total_profit,
  COALESCE(SUM(
    CASE 
      WHEN o.is_free_sample THEN 0
      ELSE (o.total_amount * i.percentage / 100)
    END
  ), 0) as total_commissions,
  ROUND(
    CASE 
      WHEN COUNT(CASE WHEN NOT o.is_free_sample THEN 1 END) > 0 
      THEN COALESCE(SUM(o.total_amount), 0)::numeric / COUNT(CASE WHEN NOT o.is_free_sample THEN 1 END)
      ELSE 0
    END, 
    2
  ) as avg_order_value
FROM influencers i
LEFT JOIN orders o ON o.affiliate_id = i.id
WHERE i.is_active = true;

-- ============================================
-- 13. EXPORTAR RELATÓRIO PARA AFILIADO
-- ============================================
-- Use para enviar relatório mensal ao afiliado
-- Substitua 'Maria Silva' e ajuste as datas
SELECT 
  o.order_date as "Data",
  o.order_number as "Pedido",
  o.customer_name as "Cliente",
  o.total_amount as "Valor Venda",
  i.percentage as "Taxa %",
  CASE 
    WHEN o.is_free_sample THEN 0
    ELSE (o.total_amount * i.percentage / 100)
  END as "Comissão",
  CASE 
    WHEN o.is_free_sample THEN 'Amostra Grátis'
    ELSE 'Venda'
  END as "Tipo"
FROM orders o
JOIN influencers i ON o.affiliate_id = i.id
WHERE i.name = 'Maria Silva'
  AND o.order_date >= '2026-04-01'
  AND o.order_date < '2026-05-01'
ORDER BY o.order_date;

-- ============================================
-- 14. ANÁLISE DE SAZONALIDADE
-- ============================================
-- Identifica padrões de venda por dia da semana
SELECT 
  i.name as influencer_name,
  TO_CHAR(o.order_date, 'Day') as day_of_week,
  COUNT(o.id) as orders,
  SUM(o.total_amount) as revenue,
  ROUND(AVG(o.total_amount), 2) as avg_order_value
FROM orders o
JOIN influencers i ON o.affiliate_id = i.id
WHERE o.is_free_sample = false
  AND o.order_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY i.id, i.name, TO_CHAR(o.order_date, 'Day'), EXTRACT(DOW FROM o.order_date)
ORDER BY i.name, EXTRACT(DOW FROM o.order_date);

-- ============================================
-- 15. ATUALIZAR COMISSÃO DE UM AFILIADO
-- ============================================
-- Use quando precisar ajustar a taxa de comissão
-- Substitua 'Maria Silva' e o novo percentual
UPDATE influencers
SET percentage = 12.0
WHERE name = 'Maria Silva';

-- ============================================
-- 16. DESATIVAR AFILIADO
-- ============================================
-- Use quando um afiliado não estiver mais ativo
-- Substitua 'Maria Silva'
UPDATE influencers
SET is_active = false
WHERE name = 'Maria Silva';

-- ============================================
-- 17. REATIVAR AFILIADO
-- ============================================
-- Use para reativar um afiliado
-- Substitua 'Maria Silva'
UPDATE influencers
SET is_active = true
WHERE name = 'Maria Silva';

-- ============================================
-- NOTAS DE USO
-- ============================================
-- 1. Execute estas queries no Supabase SQL Editor
-- 2. Substitua os nomes de afiliados conforme necessário
-- 3. Ajuste os intervalos de datas conforme sua necessidade
-- 4. Use LIMIT para limitar resultados em queries grandes
-- 5. Adicione filtros de organization_id se necessário
-- ============================================
