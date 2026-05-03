-- Script SQL para adicionar canais de venda faltantes
-- Execute este script no Supabase para adicionar os canais que estão faltando

-- Verificar canais existentes
SELECT bling_store_id, name, marketplace 
FROM sales_channels 
ORDER BY bling_store_id;

-- Adicionar canais faltantes (ajuste conforme necessário)
-- Exemplo: Se você descobrir que o pedido do Upseller veio de uma loja específica

-- Caso 1: Se for uma nova loja do MercadoLivre
INSERT INTO sales_channels (
  organization_id,
  bling_store_id,
  name,
  marketplace,
  account_type,
  account_holder,
  is_active
) VALUES (
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  999999999, -- SUBSTITUA pelo bling_store_id real
  'Upseller - MercadoLivre',
  'MercadoLivre',
  'CPF',
  'Alyson',
  true
)
ON CONFLICT (bling_store_id) DO NOTHING;

-- Caso 2: Se for uma nova loja da Shopee
INSERT INTO sales_channels (
  organization_id,
  bling_store_id,
  name,
  marketplace,
  account_type,
  account_holder,
  is_active
) VALUES (
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  999999998, -- SUBSTITUA pelo bling_store_id real
  'Upseller - Shopee',
  'Shopee',
  'CPF',
  'Alyson',
  true
)
ON CONFLICT (bling_store_id) DO NOTHING;

-- Caso 3: Se for uma nova loja do TikTok
INSERT INTO sales_channels (
  organization_id,
  bling_store_id,
  name,
  marketplace,
  account_type,
  account_holder,
  is_active
) VALUES (
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  999999997, -- SUBSTITUA pelo bling_store_id real
  'Upseller - TikTok',
  'TikTok',
  'CPF',
  'Alyson',
  true
)
ON CONFLICT (bling_store_id) DO NOTHING;

-- Query para encontrar pedidos com sales_channel_id NULL
-- Use isso para identificar quais canais precisam ser adicionados
SELECT 
  bling_store_id,
  COUNT(*) as total_pedidos,
  MIN(order_date) as primeiro_pedido,
  MAX(order_date) as ultimo_pedido
FROM bling_orders
WHERE sales_channel_id IS NULL
GROUP BY bling_store_id
ORDER BY total_pedidos DESC;

-- Query para ver os logs de warning de canais não encontrados
SELECT 
  created_at,
  bling_store_id,
  bling_order_id,
  marketplace_order_number,
  error_message
FROM bling_sync_logs
WHERE status = 'warning'
  AND error_message LIKE '%Canal de venda não encontrado%'
ORDER BY created_at DESC
LIMIT 50;
