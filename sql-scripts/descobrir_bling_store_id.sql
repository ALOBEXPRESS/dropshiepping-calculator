-- Script para descobrir o bling_store_id do pedido problemático
-- Execute no Supabase para identificar qual loja precisa ser adicionada

-- 1. Ver todos os pedidos com sales_channel_id NULL
SELECT 
  id,
  bling_order_id,
  order_number,
  marketplace_order_number,
  bling_store_id,
  order_date,
  total_amount,
  status_value,
  contact_name,
  created_at
FROM bling_orders
WHERE sales_channel_id IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- 2. Ver os logs de erro/warning relacionados ao canal
SELECT 
  id,
  created_at,
  event_type,
  bling_order_id,
  marketplace_order_number,
  bling_store_id,
  status,
  error_message,
  webhook_data::json->'data'->'loja' as loja_info
FROM bling_sync_logs
WHERE (
  error_message LIKE '%Canal%'
  OR error_message LIKE '%canal%'
  OR status = 'warning'
)
ORDER BY created_at DESC
LIMIT 20;

-- 3. Ver o pedido específico que você mencionou (com SKU ups_afi_58254463910-Arleatório)
-- Primeiro, vamos buscar nos itens do pedido
SELECT 
  oi.id,
  oi.order_id,
  oi.code as sku,
  oi.description,
  bo.bling_order_id,
  bo.order_number,
  bo.marketplace_order_number,
  bo.bling_store_id,
  bo.order_date,
  bo.contact_name
FROM bling_order_items oi
JOIN bling_orders bo ON oi.order_id = bo.id
WHERE oi.code LIKE '%ups_afi%'
   OR oi.code LIKE '%58254463910%'
ORDER BY bo.created_at DESC;

-- 4. Ver o pedido que você editou (com SKU YEIZ_IDP248)
SELECT 
  oi.id,
  oi.order_id,
  oi.code as sku,
  oi.description,
  bo.bling_order_id,
  bo.order_number,
  bo.marketplace_order_number,
  bo.bling_store_id,
  bo.order_date,
  bo.contact_name,
  bo.sales_channel_id
FROM bling_order_items oi
JOIN bling_orders bo ON oi.order_id = bo.id
WHERE oi.code = 'YEIZ_IDP248'
ORDER BY bo.created_at DESC
LIMIT 5;

-- 5. Ver todos os bling_store_id únicos que não têm canal mapeado
SELECT DISTINCT
  bo.bling_store_id,
  COUNT(*) as total_pedidos,
  MIN(bo.order_date) as primeiro_pedido,
  MAX(bo.order_date) as ultimo_pedido,
  SUM(bo.total_amount) as valor_total,
  STRING_AGG(DISTINCT bo.contact_name, ', ') as clientes_exemplo
FROM bling_orders bo
WHERE bo.sales_channel_id IS NULL
GROUP BY bo.bling_store_id
ORDER BY total_pedidos DESC;

-- 6. Ver os canais que JÁ ESTÃO mapeados (para comparação)
SELECT 
  id,
  bling_store_id,
  name,
  marketplace,
  account_type,
  account_holder,
  is_active,
  created_at
FROM sales_channels
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
ORDER BY bling_store_id;

-- 7. Ver o raw_data do pedido problemático (contém todas as informações do Bling)
SELECT 
  bling_order_id,
  order_number,
  marketplace_order_number,
  bling_store_id,
  raw_data::json->'loja' as loja_completa,
  raw_data::json->'itens' as itens_completos
FROM bling_orders
WHERE sales_channel_id IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- 8. QUERY FINAL: Descobrir qual loja precisa ser adicionada
-- Esta query mostra TUDO que você precisa saber
SELECT 
  bo.bling_store_id,
  bo.raw_data::json->'loja'->>'id' as loja_id,
  bo.raw_data::json->'loja'->>'nome' as loja_nome,
  COUNT(DISTINCT bo.id) as total_pedidos,
  COUNT(DISTINCT oi.id) as total_itens,
  MIN(bo.order_date) as primeiro_pedido,
  MAX(bo.order_date) as ultimo_pedido,
  SUM(bo.total_amount) as valor_total,
  STRING_AGG(DISTINCT oi.code, ', ') as skus_exemplo
FROM bling_orders bo
LEFT JOIN bling_order_items oi ON oi.order_id = bo.id
WHERE bo.sales_channel_id IS NULL
GROUP BY 
  bo.bling_store_id,
  bo.raw_data::json->'loja'->>'id',
  bo.raw_data::json->'loja'->>'nome'
ORDER BY total_pedidos DESC;

-- 9. BONUS: Ver o webhook_data do último erro
-- Isso mostra EXATAMENTE o que o Bling enviou
SELECT 
  created_at,
  bling_store_id,
  webhook_data::json->'data'->'loja' as loja_do_webhook,
  webhook_data::json->'data'->'itens' as itens_do_webhook,
  error_message
FROM bling_sync_logs
WHERE status IN ('error', 'warning')
  AND webhook_data IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
