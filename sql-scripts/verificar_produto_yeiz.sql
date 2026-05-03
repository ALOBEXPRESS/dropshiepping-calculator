-- Verificar onde está o produto YEIZ_IDP248

-- 1. Buscar em products (onde DEVERIA estar)
SELECT 
  'products' as tabela,
  id,
  sku,
  name,
  price
FROM products 
WHERE sku = 'YEIZ_IDP248';

-- 2. Buscar em products_variations_bling (onde o workflow está buscando)
SELECT 
  'products_variations_bling' as tabela,
  id,
  sku,
  name,
  price
FROM products_variations_bling 
WHERE sku = 'YEIZ_IDP248';

-- 3. Buscar em products_bling
SELECT 
  'products_bling' as tabela,
  id,
  sku,
  name,
  price
FROM products_bling 
WHERE sku = 'YEIZ_IDP248';
