-- Script para criar organization e associar ao usuário
-- Execute este SQL no Supabase SQL Editor

-- 1. Criar organization "Empresa Alob" com o ID correto
INSERT INTO organizations (
  id,
  name,
  slug,
  working_capital,
  emergency_reserve,
  capital_marketing,
  gross_investment,
  created_at,
  updated_at
) VALUES (
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  'Empresa Alob',
  'empresa-alob',
  0,
  0,
  0,
  0,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- 2. Verificar se o usuário existe (buscar pelo email)
-- Nota: Você precisa pegar o user_id da tabela auth.users
-- Como não temos acesso direto via SQL público, vamos criar um registro genérico

-- 3. Criar entrada em organization_members (se a tabela existir)
-- Substitua 'SEU_USER_ID_AQUI' pelo ID real do seu usuário
-- Você pode pegar isso fazendo login e verificando no console:
-- supabase.auth.getUser().then(({data}) => console.log(data.user.id))

-- INSERT INTO organization_members (
--   organization_id,
--   user_id,
--   role,
--   created_at
-- ) VALUES (
--   '28b4b443-03fd-4a2d-b596-9dcaf142b389',
--   'SEU_USER_ID_AQUI',
--   'owner',
--   NOW()
-- )
-- ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 4. Verificar se foi criado
SELECT * FROM organizations WHERE id = '28b4b443-03fd-4a2d-b596-9dcaf142b389';

-- 5. Inserir pedidos de teste com o organization_id correto
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
(999001, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1001, 205833031, CURRENT_DATE, 100.00, 150.00, 1, 150.00, 'Cliente SP', 'SP', 'São Paulo', '01000-000', 'Centro', 'synced', NOW()),
(999002, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1002, 205833031, CURRENT_DATE, 150.00, 200.00, 1, 200.00, 'Cliente RJ', 'RJ', 'Rio de Janeiro', '20000-000', 'Centro', 'synced', NOW()),
(999003, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1003, 205833031, CURRENT_DATE, 130.00, 180.00, 1, 180.00, 'Cliente MG', 'MG', 'Belo Horizonte', '30000-000', 'Centro', 'synced', NOW()),
(999004, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1004, 205833031, CURRENT_DATE, 170.00, 220.00, 1, 220.00, 'Cliente SP2', 'SP', 'Campinas', '13000-000', 'Centro', 'synced', NOW()),
(999005, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1005, 205833031, CURRENT_DATE, 140.00, 190.00, 1, 190.00, 'Cliente RS', 'RS', 'Porto Alegre', '90000-000', 'Centro', 'synced', NOW()),
(999006, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1006, 205833031, CURRENT_DATE, 120.00, 170.00, 1, 170.00, 'Cliente PR', 'PR', 'Curitiba', '80000-000', 'Centro', 'synced', NOW()),
(999007, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1007, 205833031, CURRENT_DATE, 110.00, 160.00, 1, 160.00, 'Cliente BA', 'BA', 'Salvador', '40000-000', 'Centro', 'synced', NOW()),
(999008, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1008, 205833031, CURRENT_DATE, 125.00, 175.00, 1, 175.00, 'Cliente SC', 'SC', 'Florianópolis', '88000-000', 'Centro', 'synced', NOW())
ON CONFLICT (bling_order_id) DO NOTHING;

-- 6. Verificar pedidos criados
SELECT 
  order_number,
  label_state,
  label_city,
  total_amount
FROM bling_orders
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
ORDER BY order_number;

-- 7. Contar por estado
SELECT 
  label_state,
  COUNT(*) as total,
  SUM(total_amount) as receita
FROM bling_orders
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
GROUP BY label_state
ORDER BY total DESC;
