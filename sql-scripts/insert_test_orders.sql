-- Script para inserir pedidos de teste no Supabase
-- Execute este SQL no SQL Editor do Supabase Dashboard

-- Inserir pedidos de teste em bling_orders
INSERT INTO bling_orders (
  bling_order_id,
  organization_id,
  order_number,
  bling_store_id,
  order_date,
  total_products,
  total_amount,
  status_id,
  status_value,
  contact_name,
  label_state,
  label_city,
  label_zip,
  label_neighborhood,
  sync_status,
  last_sync_at
) VALUES
-- Pedido 1: São Paulo
(999001, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1001, 205833031, CURRENT_DATE, 100.00, 150.00, 1, 150.00, 'Cliente Teste SP', 'SP', 'São Paulo', '01000-000', 'Centro', 'synced', NOW()),

-- Pedido 2: Rio de Janeiro
(999002, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1002, 205833031, CURRENT_DATE, 150.00, 200.00, 1, 200.00, 'Cliente Teste RJ', 'RJ', 'Rio de Janeiro', '20000-000', 'Centro', 'synced', NOW()),

-- Pedido 3: Minas Gerais
(999003, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1003, 205833031, CURRENT_DATE, 130.00, 180.00, 1, 180.00, 'Cliente Teste MG', 'MG', 'Belo Horizonte', '30000-000', 'Centro', 'synced', NOW()),

-- Pedido 4: São Paulo (Campinas)
(999004, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1004, 205833031, CURRENT_DATE, 170.00, 220.00, 1, 220.00, 'Cliente Teste SP2', 'SP', 'Campinas', '13000-000', 'Centro', 'synced', NOW()),

-- Pedido 5: Rio Grande do Sul
(999005, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1005, 205833031, CURRENT_DATE, 140.00, 190.00, 1, 190.00, 'Cliente Teste RS', 'RS', 'Porto Alegre', '90000-000', 'Centro', 'synced', NOW()),

-- Pedido 6: Paraná
(999006, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1006, 205833031, CURRENT_DATE, 120.00, 170.00, 1, 170.00, 'Cliente Teste PR', 'PR', 'Curitiba', '80000-000', 'Centro', 'synced', NOW()),

-- Pedido 7: Bahia
(999007, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1007, 205833031, CURRENT_DATE, 110.00, 160.00, 1, 160.00, 'Cliente Teste BA', 'BA', 'Salvador', '40000-000', 'Centro', 'synced', NOW()),

-- Pedido 8: Santa Catarina
(999008, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1008, 205833031, CURRENT_DATE, 125.00, 175.00, 1, 175.00, 'Cliente Teste SC', 'SC', 'Florianópolis', '88000-000', 'Centro', 'synced', NOW());

-- Verificar se os pedidos foram inseridos
SELECT 
  order_number,
  label_state,
  label_city,
  total_amount,
  created_at
FROM bling_orders
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
ORDER BY created_at DESC;

-- Contar pedidos por estado
SELECT 
  label_state,
  COUNT(*) as total_pedidos,
  SUM(total_amount) as receita_total
FROM bling_orders
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
  AND label_state IS NOT NULL
GROUP BY label_state
ORDER BY total_pedidos DESC;
