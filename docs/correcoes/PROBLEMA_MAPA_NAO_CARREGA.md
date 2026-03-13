# Problema: Mapa de Distribuição por Estado Não Carrega

## Diagnóstico

Após investigação completa, identifiquei que:

### ✅ Componente Frontend Está Correto
- `BrazilStatesDistribution.tsx` foi corrigido para usar `bling_orders` ao invés da view inexistente
- Query está correta: `SELECT label_state FROM bling_orders WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'`

### ✅ Workflow N8N Foi Corrigido
- 18 ocorrências do `organization_id` errado foram substituídas
- Agora usa o ID correto: `28b4b443-03fd-4a2d-b596-9dcaf142b389`

### ❌ PROBLEMA REAL: Banco de Dados Vazio

**O banco de dados NÃO TEM NENHUM PEDIDO!**

```
Total de registros em bling_orders: 0
Total de pedidos em orders: 0
```

## Por Que Não Há Pedidos?

Existem 3 possibilidades:

### 1. Workflow N8N Não Está Ativo
- O workflow precisa estar ATIVO no N8N
- O webhook precisa estar configurado no Bling
- Verificar logs do N8N para ver se está recebendo webhooks

### 2. Pedidos Não Foram Importados
- Se você criou pedidos manualmente no sistema, eles não vão para `bling_orders`
- `bling_orders` é populado APENAS via webhook do Bling
- Pedidos manuais vão direto para `orders`

### 3. RLS (Row Level Security) Está Bloqueando
- Tentei criar pedidos de teste e recebi erro de RLS
- As políticas de segurança podem estar impedindo inserções

## Soluções

### Solução 1: Importar Pedidos do Bling (Recomendado)

1. **Ativar Workflow N8N**
   ```
   - Abrir N8N
   - Ir no workflow "Bling Pedido de Venda Automatization"
   - Clicar em "Active"
   ```

2. **Configurar Webhook no Bling**
   ```
   - Ir em Configurações > Webhooks no Bling
   - Adicionar webhook para "Pedido Criado"
   - URL: https://seu-n8n.com/webhook/alobexpressmanager
   ```

3. **Criar Pedido de Teste no Bling**
   - Criar um pedido manualmente no Bling
   - Verificar se o webhook dispara
   - Verificar se o pedido aparece em `bling_orders`

### Solução 2: Criar Pedidos de Teste Manualmente

Se você quer testar o mapa SEM importar do Bling, precisa:

1. **Desabilitar RLS Temporariamente** (APENAS PARA TESTE)
   ```sql
   ALTER TABLE bling_orders DISABLE ROW LEVEL SECURITY;
   ```

2. **Inserir Pedidos de Teste**
   ```sql
   INSERT INTO bling_orders (
     bling_order_id,
     organization_id,
     order_number,
     bling_store_id,
     order_date,
     total_amount,
     status_id,
     status_value,
     label_state,
     label_city
   ) VALUES
   (999001, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1001, 205833031, CURRENT_DATE, 150.00, 1, 150.00, 'SP', 'São Paulo'),
   (999002, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1002, 205833031, CURRENT_DATE, 200.00, 1, 200.00, 'RJ', 'Rio de Janeiro'),
   (999003, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1003, 205833031, CURRENT_DATE, 180.00, 1, 180.00, 'MG', 'Belo Horizonte'),
   (999004, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1004, 205833031, CURRENT_DATE, 220.00, 1, 220.00, 'SP', 'Campinas'),
   (999005, '28b4b443-03fd-4a2d-b596-9dcaf142b389', 1005, 205833031, CURRENT_DATE, 190.00, 1, 190.00, 'RS', 'Porto Alegre');
   ```

3. **Reabilitar RLS**
   ```sql
   ALTER TABLE bling_orders ENABLE ROW LEVEL SECURITY;
   ```

### Solução 3: Verificar Pedidos Existentes

Se você disse que criou um pedido, ele pode estar em `orders` ao invés de `bling_orders`:

```sql
-- Verificar pedidos em orders
SELECT id, order_number, organization_id, total_amount, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- Se houver pedidos, verificar se têm bling_order_id
SELECT o.id, o.order_number, o.bling_order_id, bo.label_state
FROM orders o
LEFT JOIN bling_orders bo ON bo.id = o.bling_order_id
WHERE o.organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
ORDER BY o.created_at DESC;
```

## Como o Mapa Funciona

O componente `BrazilStatesDistribution` faz esta query:

```typescript
const { data: ordersData } = await supabase
  .from('bling_orders')
  .select('label_state')
  .eq('organization_id', organizationId)
  .not('label_state', 'is', null);
```

Para o mapa aparecer, é OBRIGATÓRIO ter:
1. Registros na tabela `bling_orders`
2. Com `organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'`
3. Com `label_state` preenchido (ex: 'SP', 'RJ', 'MG')

## Próximos Passos

1. **Verificar se há pedidos no banco**
   ```bash
   python check_orders_simple.py
   ```

2. **Se não houver pedidos, escolher uma solução acima**

3. **Após ter pedidos, testar o mapa**
   ```bash
   python test_dashboard_map.py
   ```

4. **Validar no navegador**
   - Abrir http://localhost:5173/sales
   - Verificar se o mapa aparece
   - Verificar se os estados estão coloridos

## Arquivos Relacionados

- `src/components/sales/BrazilStatesDistribution.tsx` - Componente do mapa (✅ corrigido)
- `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json` - Workflow (✅ corrigido)
- `check_orders_simple.py` - Script para verificar pedidos
- `create_test_order.py` - Script para criar pedidos de teste (bloqueado por RLS)
- `test_dashboard_map.py` - Teste Playwright do mapa
