-- ============================================
-- SCRIPT: Excluir Pedidos de Teste
-- ============================================
-- Este script identifica e exclui pedidos de teste do banco de dados
-- ATENÇÃO: Execute com cuidado! Esta operação é irreversível.

-- ============================================
-- PASSO 1: IDENTIFICAR PEDIDOS DE TESTE
-- ============================================

-- Listar pedidos que parecem ser de teste (ajuste os critérios conforme necessário)
SELECT 
  bo.id,
  bo.order_number,
  bo.order_date,
  bo.contact_name as customer_name,
  bo.total_amount,
  sc.name as sales_channel_name,
  bo.created_at
FROM bling_orders bo
LEFT JOIN sales_channels sc ON bo.sales_channel_id = sc.id
WHERE 
  -- Critérios para identificar pedidos de teste:
  -- 1. Pedidos com números específicos conhecidos como teste
  bo.order_number IN (94) -- Adicione outros números de pedidos de teste aqui
  
  -- OU 2. Pedidos com nomes de clientes que indicam teste
  OR LOWER(bo.contact_name) LIKE '%teste%'
  OR LOWER(bo.contact_name) LIKE '%test%'
  
  -- OU 3. Pedidos com valores muito baixos ou suspeitos (opcional)
  -- OR bo.total_amount < 1.00
  
ORDER BY bo.created_at DESC;

-- ============================================
-- PASSO 2: CONTAR ITENS DOS PEDIDOS DE TESTE
-- ============================================

SELECT 
  COUNT(*) as total_items_to_delete
FROM bling_order_items boi
WHERE boi.order_id IN (
  SELECT bo.id
  FROM bling_orders bo
  WHERE 
    bo.order_number IN (94)
    OR LOWER(bo.contact_name) LIKE '%teste%'
    OR LOWER(bo.contact_name) LIKE '%test%'
);

-- ============================================
-- PASSO 3: EXCLUIR ITENS DOS PEDIDOS DE TESTE
-- ============================================
-- DESCOMENTE AS LINHAS ABAIXO PARA EXECUTAR A EXCLUSÃO

/*
DELETE FROM bling_order_items
WHERE order_id IN (
  SELECT bo.id
  FROM bling_orders bo
  WHERE 
    bo.order_number IN (94)
    OR LOWER(bo.contact_name) LIKE '%teste%'
    OR LOWER(bo.contact_name) LIKE '%test%'
);
*/

-- ============================================
-- PASSO 4: EXCLUIR OS PEDIDOS DE TESTE
-- ============================================
-- DESCOMENTE AS LINHAS ABAIXO PARA EXECUTAR A EXCLUSÃO

/*
DELETE FROM bling_orders
WHERE 
  order_number IN (94)
  OR LOWER(contact_name) LIKE '%teste%'
  OR LOWER(contact_name) LIKE '%test%';
*/

-- ============================================
-- PASSO 5: VERIFICAR EXCLUSÃO
-- ============================================
-- Execute após a exclusão para confirmar

/*
SELECT COUNT(*) as remaining_test_orders
FROM bling_orders bo
WHERE 
  bo.order_number IN (94)
  OR LOWER(bo.contact_name) LIKE '%teste%'
  OR LOWER(bo.contact_name) LIKE '%test%';
*/

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Revise os critérios de identificação no PASSO 1
-- 2. Execute primeiro os passos 1 e 2 para ver o que será excluído
-- 3. Só descomente os comandos DELETE depois de confirmar
-- 4. A exclusão é feita em ordem: primeiro itens, depois pedidos
-- 5. Considere fazer backup antes de executar
