-- Script para inserir itens nos pedidos #152 e #153
-- Execute este script no Supabase SQL Editor

-- ============================================
-- PEDIDO #152 (bling_order_id: 25709361175)
-- ============================================

-- Inserir item do pedido #152
INSERT INTO bling_order_items (
  order_id,
  bling_item_id,
  product_variation_id,
  code,
  description,
  unit,
  quantity,
  unit_value,
  discount,
  total_value
) VALUES (
  'd150701d-11e6-4a2d-b485-d709d5078850',
  19435596430,
  (SELECT id FROM products_variations_bling WHERE sku = 'YEIZ_IDP248'),
  'YEIZ_IDP248',
  'Escova Alisadora Rápida para Cabelo Cacheado Crespo e Grosso sem Prender Mecha',
  'UN',
  1,
  47.20,
  0,
  47.20
);

-- ============================================
-- PEDIDO #153 (bling_order_id: 25709414982)
-- ============================================

-- Inserir item do pedido #153
INSERT INTO bling_order_items (
  order_id,
  bling_item_id,
  product_variation_id,
  code,
  description,
  unit,
  quantity,
  unit_value,
  discount,
  total_value
) VALUES (
  'bd9b492b-8c81-45b8-adda-390f3051abac',
  19435596430,
  (SELECT id FROM products_variations_bling WHERE sku = 'YEIZ_IDP248'),
  'YEIZ_IDP248',
  'Escova Alisadora Rápida para Cabelo Cacheado Crespo e Grosso sem Prender Mecha',
  'UN',
  1,
  47.20,
  0,
  47.20
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se os itens foram inseridos
SELECT 
  bo.bling_order_id,
  bo.order_number,
  bo.contact_name,
  COUNT(bi.id) as total_itens,
  STRING_AGG(bi.code, ', ') as skus
FROM bling_orders bo
LEFT JOIN bling_order_items bi ON bo.id = bi.order_id
WHERE bo.bling_order_id IN (25709361175, 25709414982)
GROUP BY bo.id
ORDER BY bo.order_number;

-- Verificar detalhes dos itens
SELECT 
  bi.order_id,
  bo.order_number,
  bi.code,
  bi.description,
  bi.quantity,
  bi.unit_value,
  bi.total_value,
  pv.image_url1 as imagem_produto
FROM bling_order_items bi
JOIN bling_orders bo ON bi.order_id = bo.id
LEFT JOIN products_variations_bling pv ON bi.product_variation_id = pv.id
WHERE bo.bling_order_id IN (25709361175, 25709414982);
