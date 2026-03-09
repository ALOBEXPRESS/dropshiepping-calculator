-- ============================================
-- DEBUG: Pedido #94 - "Pedido não encontrado"
-- ============================================

-- 1. VERIFICAR O PEDIDO #94
SELECT 
  bo.id as bling_order_id,
  bo.order_number,
  bo.order_date,
  bo.total_amount,
  bo.contact_name as customer_name,
  bo.bling_store_id,
  sc.name as sales_channel_name,
  sc.marketplace,
  sc.account_holder,
  sc.account_type
FROM bling_orders bo
LEFT JOIN sales_channels sc ON bo.sales_channel_id = sc.id
WHERE bo.order_number = 94;

-- Resultado:
-- order_number: 94
-- customer_name: Jonatan Renan Vitoriano Da Silva
-- sales_channel: MercadoLivre
-- account_holder: Alyson (CPF)
-- total_amount: R$ 34,90

-- ============================================

-- 2. VERIFICAR OS ITENS DO PEDIDO #94
SELECT 
  boi.id,
  boi.order_id,
  boi.code as sku,
  boi.description as product_name,
  boi.quantity,
  boi.unit_value as unit_price,
  boi.total_value as total_price
FROM bling_order_items boi
WHERE boi.order_id = (SELECT id FROM bling_orders WHERE order_number = 94);

-- Resultado:
-- sku: 363061 (VARIAÇÃO, não o produto pai!)
-- product_name: Relógio Feminino Elegance Cor:Dourado e Branco
-- quantity: 1
-- unit_price: R$ 34,90

-- ============================================

-- 3. VERIFICAR SE A VARIAÇÃO SKU 363061 EXISTE NA TABELA PRODUCTS
SELECT 
  p.id,
  p.name,
  p.sku,
  p.marketplace,
  p.cost_price,
  p.price as selling_price,
  p.account_holder,
  p.account_type
FROM products p
WHERE p.sku = '363061';

-- Resultado: VAZIO (❌ NÃO EXISTE)
-- Este é o problema! A function busca por SKU 363061 mas não encontra.

-- ============================================

-- 4. VERIFICAR O PRODUTO PAI SKU 2023165366
SELECT 
  p.id,
  p.name,
  p.sku,
  p.marketplace,
  p.cost_price,
  p.price as selling_price,
  p.account_holder,
  p.account_type
FROM products p
WHERE p.sku = '2023165366';

-- Resultado:
-- ✅ Existe 2 registros:
-- 1. marketplace: mercadolivre, titular: Jonatan (CPF), preço: R$ 44,90
-- 2. marketplace: tiktok, titular: Alyson (CNPJ), preço: R$ 39,90

-- ============================================

-- 5. VERIFICAR A VARIAÇÃO NO PRODUCTS_BLING
SELECT 
  pb.id,
  pb.name,
  pb.sku,
  pb.cost_price,
  pb.sale_price,
  pb.variacao_nome,
  pb.id_produto_pai
FROM products_bling pb
WHERE pb.sku = '363061' OR pb.sku = '2023165366';

-- Resultado:
-- SKU 363061: ✅ Existe no products_bling
--   - name: Relógio Feminino Elegance Cor:Dourado e Branco
--   - variacao_nome: Cor:Dourado e Branco
--   - cost_price: 0 (não definido)
--   - sale_price: R$ 34,90
--   - id_produto_pai: 16605084772
--
-- SKU 2023165366: ✅ Existe no products_bling
--   - name: Relógio Feminino Elegance
--   - variacao_nome: null (produto pai)
--   - cost_price: 0 (não definido)
--   - sale_price: R$ 34,90

-- ============================================

-- 6. VERIFICAR TODOS OS PRODUTOS PARA MERCADO LIVRE
SELECT 
  p.id,
  p.name,
  p.sku,
  p.marketplace,
  p.cost_price,
  p.price as selling_price,
  p.account_holder,
  p.account_type,
  p.updated_at
FROM products p
WHERE LOWER(p.marketplace) LIKE '%mercado%livre%'
ORDER BY p.updated_at DESC
LIMIT 10;

-- ============================================
-- CONCLUSÃO:
-- ============================================
-- 
-- PROBLEMA IDENTIFICADO:
-- O pedido #94 vendeu a VARIAÇÃO SKU 363061, mas esta variação
-- NÃO está cadastrada na tabela products.
-- 
-- A function process_bling_order_to_profit busca pelo SKU exato
-- do item do pedido (363061), não encontra, e retorna erro.
-- 
-- SOLUÇÃO:
-- Cadastrar a variação SKU 363061 na tabela products com:
-- - Marketplace: mercadolivre
-- - Titular: Alyson
-- - Tipo: CPF
-- - Custo: R$ 21,90 (ou o custo correto)
-- - Venda: R$ 34,90
-- 
-- ============================================
