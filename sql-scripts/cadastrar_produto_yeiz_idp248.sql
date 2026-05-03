-- Cadastrar produto YEIZ_IDP248 no banco de dados
-- Execute este SQL no Supabase

-- 1. Verificar se o produto PAI existe em products_bling
SELECT * FROM products_bling WHERE bling_id = 16613337750;

-- Se NÃO existir, criar o produto PAI primeiro:
INSERT INTO products_bling (
  bling_id,
  name,
  sku,
  price,
  cost_price,
  is_active,
  organization_id,
  created_at,
  updated_at
) VALUES (
  16613337750,
  'Escova Alisadora Rápida para Cabelo Cacheado Crespo e Grosso sem Prender Mecha',
  'YEIZ_IDP248',
  47.20,
  0,
  true,
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  NOW(),
  NOW()
)
ON CONFLICT (bling_id) DO NOTHING;

-- 2. Criar a variação em products_variations_bling
INSERT INTO products_variations_bling (
  product_bling_id,
  sku,
  name,
  price,
  stock_quantity,
  is_active,
  created_at,
  updated_at
) VALUES (
  16613337750,
  'YEIZ_IDP248',
  'Escova Alisadora Rápida para Cabelo Cacheado Crespo e Grosso sem Prender Mecha',
  47.20,
  0,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (sku) DO NOTHING;

-- 3. Verificar se foi criado
SELECT * FROM products_variations_bling WHERE sku = 'YEIZ_IDP248';
