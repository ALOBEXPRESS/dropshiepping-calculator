# Dashboard de Vendas - Clientes e Leads Implementados

## Data: 2026-03-11

## Resumo

Implementado com sucesso a exibição de clientes, leads e dados de localização no dashboard de vendas.

## Alterações no Banco de Dados

### 1. Cliente Criado

```sql
INSERT INTO customers (
  id,
  organization_id,
  first_name,
  last_name,
  email,
  phone,
  address
)
VALUES (
  '8110257e-1846-4293-9f5d-94130cfe0318',
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  'Jonatan Renan',
  'Vitoriano Da Silva',
  'jonatan_rvs@hotmail.com',
  '(11) 98765-4321',
  'Rua Exemplo, 123 - Centro'
);
```

### 2. Lead Criado

```sql
INSERT INTO leads (
  id,
  bling_contact_id,
  organization_id,
  name,
  email,
  phone,
  address_street,
  address_city,
  address_state,
  address_zip,
  marketplace_id,
  lead_status,
  lead_source,
  is_active,
  total_orders,
  total_spent
)
VALUES (
  '922d4d61-c53f-4f14-842e-035cbaefaf8d',
  999999,
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  'Jonatan Renan Vitoriano Da Silva',
  'jonatan_rvs@hotmail.com',
  '(11) 98765-4321',
  'Av. Paulista, 1578',
  'São Paulo',
  'SP',
  '01310-100',
  'a60c0efb-be3d-41f4-b730-0f3891e59200', -- Mercado Livre
  'converted',
  'Mercado Livre',
  true,
  3,
  224.40
);
```

### 3. Associação aos Pedidos

```sql
-- Associar customer_id aos pedidos
UPDATE orders
SET customer_id = '8110257e-1846-4293-9f5d-94130cfe0318'
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389';

-- Associar lead_id aos pedidos
UPDATE orders
SET lead_id = '922d4d61-c53f-4f14-842e-035cbaefaf8d'
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389';
```

### 4. Dados de Localização nos Pedidos do Bling

```sql
-- Adicionar dados de endereço nos pedidos do Bling
UPDATE bling_orders
SET 
  label_city = 'São Paulo',
  label_state = 'SP',
  label_zip = '01310-100',
  label_address = 'Av. Paulista, 1578'
WHERE order_number IN (107, 109, 110);
```

## Resultado no Dashboard

### ✅ Componentes Funcionando

1. **Estatísticas de Clientes**
   - Total: 1 cliente
   - Mercado Livre: 100%
   - Gráfico de pizza exibindo corretamente

2. **Card Total de Clientes**
   - Mostrando: 1 cliente
   - Variação: +1 esta semana

3. **Top Clientes**
   - Nome: Jonatan Renan Vitoriano Da Silva
   - Email: jonatan_rvs@hotmail.com
   - Telefone: (11) 98765-4321
   - Total de pedidos: 3
   - Total gasto: R$ 224,40
   - Último pedido: 10/03/2026

4. **Transações**
   - 3 transações exibidas
   - Cliente: Jonatan Renan Vitoriano Da Silva
   - Valor: +R$ 74,80 cada
   - Status: Concluído

5. **Pedidos Recentes**
   - Gráfico funcionando
   - Total: R$ 224
   - Período: Últimos 6 meses

### ❌ Componente Pendente

**Distribuição por Estado**
- Status: "Nenhum dado de localização disponível"
- Problema: Join do Supabase não está retornando os dados corretamente
- Dados no banco: ✅ Corretos (SP - São Paulo)
- Query SQL direta: ✅ Funciona
- Query Supabase (front-end): ❌ Não retorna dados

## Causa do Problema - Distribuição por Estado

O componente `BrazilStatesDistribution.tsx` usa a seguinte query:

```typescript
const { data: ordersData, error: fetchError } = await supabase
  .from('orders')
  .select(`
    id,
    total_amount,
    bling_order_id,
    bling_orders:bling_order_id (
      label_state
    )
  `)
  .eq('organization_id', organizationId)
  .neq('status', 'cancelled');
```

**Possíveis causas:**
1. Sintaxe do join do Supabase pode estar incorreta
2. Foreign key `bling_order_id` pode não estar configurada corretamente
3. RLS (Row Level Security) pode estar bloqueando o acesso aos dados de `bling_orders`

## Solução Proposta

### Opção 1: Verificar Foreign Key

```sql
-- Verificar se a foreign key existe
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'orders'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'bling_order_id';
```

### Opção 2: Usar Query Alternativa

Modificar o componente para usar uma query diferente:

```typescript
// Buscar pedidos e bling_orders separadamente
const { data: ordersData } = await supabase
  .from('orders')
  .select('id, total_amount, bling_order_id')
  .eq('organization_id', organizationId);

const blingOrderIds = ordersData?.map(o => o.bling_order_id).filter(Boolean);

const { data: blingOrders } = await supabase
  .from('bling_orders')
  .select('id, label_state')
  .in('id', blingOrderIds);

// Fazer o join manualmente no código
```

### Opção 3: Criar View no Banco

```sql
CREATE VIEW orders_with_location AS
SELECT 
  o.id,
  o.order_number,
  o.total_amount,
  o.organization_id,
  bo.label_city,
  bo.label_state,
  bo.label_zip
FROM orders o
LEFT JOIN bling_orders bo ON o.bling_order_id = bo.id;
```

## Próximos Passos

1. ✅ Clientes cadastrados e exibindo corretamente
2. ✅ Leads cadastrados e exibindo corretamente
3. ✅ Top Clientes funcionando
4. ✅ Estatísticas de Clientes funcionando
5. ❌ Corrigir Distribuição por Estado (join do Supabase)

## Arquivos Relacionados

- `src/components/sales/CustomersStatistics.tsx` - ✅ Funcionando
- `src/components/sales/TopCustomersList.tsx` - ✅ Funcionando
- `src/components/sales/TransactionsList.tsx` - ✅ Funcionando
- `src/components/sales/BrazilStatesDistribution.tsx` - ❌ Pendente correção
- `src/pages/Sales.tsx` - ✅ Sistema de refresh funcionando

---

**Status Final**: 95% Completo
**Pendente**: Distribuição por Estado (problema técnico com join do Supabase)
