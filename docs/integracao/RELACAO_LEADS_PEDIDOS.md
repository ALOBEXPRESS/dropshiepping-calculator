# Relação entre Leads e Pedidos

## Implementação Concluída ✅

Foi criada uma relação entre a tabela `leads` e `bling_orders` através de uma chave estrangeira.

## Estrutura

### Coluna Adicionada
- **Tabela**: `bling_orders`
- **Coluna**: `lead_id` (UUID)
- **Tipo**: Foreign Key → `leads(id)`
- **Comportamento**: `ON DELETE SET NULL` (se o lead for deletado, o pedido não é deletado, apenas desvinculado)

### Índices Criados
1. `idx_bling_orders_lead_id` - Para consultas por lead
2. `idx_bling_orders_lead_date` - Para consultas por lead e data (otimizado para ordenação)

### Trigger Automático
Foi criado um trigger que atualiza automaticamente o `lead_id` quando:
- Um novo pedido é inserido com `contact_id`
- Um pedido existente tem seu `contact_id` atualizado

O trigger busca o lead correspondente baseado no `bling_contact_id` e associa automaticamente.

### View Consolidada
Foi criada a view `lead_orders_summary` que consolida:
- Dados do lead
- Contagem de pedidos
- Valor total dos pedidos
- Primeiro e último pedido
- Array com todos os pedidos do lead

## Como Usar

### 1. Consultar pedidos de um lead específico

```sql
SELECT 
    bo.id,
    bo.bling_order_id,
    bo.order_number,
    bo.order_date,
    bo.total_amount,
    bo.status_id
FROM bling_orders bo
WHERE bo.lead_id = 'UUID_DO_LEAD'
ORDER BY bo.order_date DESC;
```

### 2. Consultar lead com seus pedidos (usando a view)

```sql
SELECT * 
FROM lead_orders_summary
WHERE bling_contact_id = 17837649656;
```

### 3. Consultar leads com mais pedidos

```sql
SELECT 
    l.name,
    l.email,
    l.total_orders,
    l.total_spent,
    COUNT(bo.id) as pedidos_vinculados
FROM leads l
LEFT JOIN bling_orders bo ON bo.lead_id = l.id
GROUP BY l.id, l.name, l.email, l.total_orders, l.total_spent
ORDER BY pedidos_vinculados DESC;
```

### 4. Associar manualmente um pedido a um lead

```sql
UPDATE bling_orders
SET lead_id = 'UUID_DO_LEAD'
WHERE bling_order_id = 123456;
```

## Workflow N8N

O workflow atual já está preparado para funcionar com essa relação:

1. Quando um pedido é processado, o `contact_id` é salvo em `bling_orders`
2. O trigger automático busca o lead correspondente e associa
3. As estatísticas do lead são atualizadas (total_orders, total_spent, etc.)

## Benefícios

1. ✅ Relacionamento direto entre leads e pedidos
2. ✅ Consultas otimizadas com índices
3. ✅ Atualização automática via trigger
4. ✅ View consolidada para análises
5. ✅ Histórico completo de pedidos por lead
6. ✅ Facilita análises de comportamento de compra

## Verificação

Para verificar se está funcionando:

```sql
-- Ver leads com pedidos associados
SELECT 
    l.name,
    l.bling_contact_id,
    COUNT(bo.id) as total_pedidos,
    SUM(bo.total_amount) as valor_total
FROM leads l
LEFT JOIN bling_orders bo ON bo.lead_id = l.id
GROUP BY l.id, l.name, l.bling_contact_id
ORDER BY total_pedidos DESC;
```

## Arquivos Relacionados

- `supabase/migrations/20260227_add_lead_orders_relation.sql` - Migração aplicada
- `supabase/migrations/20260224_create_leads_table.sql` - Tabela de leads
