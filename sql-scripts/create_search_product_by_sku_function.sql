-- ============================================================================
-- Função: search_product_by_sku
-- Descrição: Busca produtos por SKU nas tabelas products e product_variations
-- Autor: Kiro AI Assistant
-- Data: 2026-05-03
-- ============================================================================

-- Drop the old function if exists
DROP FUNCTION IF EXISTS search_product_by_sku(TEXT);

-- Create the corrected function that searches in products and product_variations
CREATE OR REPLACE FUNCTION search_product_by_sku(p_sku TEXT)
RETURNS TABLE (
  id UUID,
  sku TEXT,
  name TEXT,
  marketplace TEXT,
  price NUMERIC,
  product_type TEXT,
  product_id UUID,
  variation_name TEXT,
  organization_id UUID,
  cost_price NUMERIC,
  supplier_name TEXT,
  account_holder TEXT,
  account_type TEXT,
  image_url TEXT,
  operation_mode TEXT,
  gateway_method TEXT,
  gateway_bank TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Search in products table (simple products)
  SELECT 
    p.id,
    p.sku,
    p.name,
    p.marketplace,
    p.price,
    'simple'::TEXT as product_type,
    NULL::UUID as product_id,
    NULL::TEXT as variation_name,
    p.organization_id,
    p.cost_price,
    p.supplier_name,
    p.account_holder,
    p.account_type,
    p.image_url,
    p.operation_mode,
    p.gateway_method,
    p.gateway_bank
  FROM products p
  WHERE p.sku = p_sku

  UNION ALL

  -- Search in product_variations table
  SELECT 
    pv.id,
    pv.sku,
    pv.name as name,
    NULL::TEXT as marketplace,
    pv.price,
    'variation'::TEXT as product_type,
    pv.product_id,
    pv.variation_name,
    pv.organization_id,
    pv.cost_price,
    NULL::TEXT as supplier_name,
    NULL::TEXT as account_holder,
    NULL::TEXT as account_type,
    pv.image_url,
    NULL::TEXT as operation_mode,
    NULL::TEXT as gateway_method,
    NULL::TEXT as gateway_bank
  FROM product_variations pv
  WHERE pv.sku = p_sku;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_product_by_sku(TEXT) TO anon, authenticated;

-- ============================================================================
-- Teste da função
-- ============================================================================

-- Teste com SKU existente
SELECT * FROM search_product_by_sku('YEIZ_IDP248');

-- Resultado esperado: 3 produtos
-- - 2 produtos simples do MercadoLivre
-- - 1 produto simples da Shopee

-- ============================================================================
-- Uso no n8n via HTTP Request
-- ============================================================================

-- URL: https://oensqhjnxwpcuanozske.supabase.co/rest/v1/rpc/search_product_by_sku
-- Method: POST
-- Headers:
--   - apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
--   - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
--   - Content-Type: application/json
-- Body:
--   {
--     "p_sku": "{{ $json.codigo }}"
--   }

-- ============================================================================
-- Notas
-- ============================================================================

-- 1. A função busca em AMBAS as tabelas: products e product_variations
-- 2. O campo product_type indica se é 'simple' ou 'variation'
-- 3. Para variações, o campo product_id aponta para o produto pai
-- 4. Para produtos simples, product_id é NULL
-- 5. A função usa SECURITY DEFINER para executar com permissões do owner
-- 6. Permissões concedidas para anon e authenticated roles

-- ============================================================================
