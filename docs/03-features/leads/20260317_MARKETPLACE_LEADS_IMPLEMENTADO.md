# Marketplace em Leads - Implementação Concluída ✅

## Resumo

Foi adicionada a coluna `marketplace_id` na tabela `leads` e na view `lead_orders_summary`, permitindo identificar de qual marketplace o lead veio.

## Estrutura Implementada

### 1. Coluna na Tabela Leads
- **Tabela**: `leads`
- **Coluna**: `marketplace_id` (UUID)
- **Tipo**: Foreign Key → `marketplaces(id)`
- **Comportamento**: `ON DELETE SET NULL`
- **Lógica**: Armazena o marketplace do primeiro pedido do lead

### 2. Relação através de Sales Channels
A relação funciona assim:
```
leads.marketplace_id → marketplaces.id
                          ↑
bling_orders.sales_channel_id → sales_channels.id → sales_channels.marketplace_id
```

### 3. Trigger Automático
Quando um novo pedido é inserido ou atualizado:
1. O sistema busca o `marketplace_id` através do `sales_channel_id`
2. Se o lead ainda não tem marketplace, ele é atualizado automaticamente
3. O marketplace do lead é sempre o do primeiro pedido

### 4. View Atualizada: `lead_orders_summary`
A view agora inclui:
- `marketplace_id` - ID do marketplace do lead
- `marketplace` - Nome do marketplace do lead
- Para cada pedido no array `orders`:
  - `sales_channel_id` - ID do canal de venda
  - `sales_channel_name` - Nome do canal de venda
  - `marketplace_id` - ID do marketplace do pedido
  - `marketplace_name` - Nome do marketplace do pedido

### 5. View de Análise: `leads_by_marketplace`
Nova view para análise de performance por marketplace:
- Total de leads por marketplace
- Total de pedidos
- Receita total
- Ticket médio
- Taxa de recompra

## Como Usar

### 1. Consultar leads por marketplace

```sql
SELECT 
    l.name,
    l.email,
    m.name as marketplace,
    l.total_orders,
    l.total_spent
FROM leads l
INNER JOIN marketplaces m ON m.id = l.marketplace_id
WHERE m.name = 'Mercado Livre'
ORDER BY l.total_spent DESC;
```

### 2. Usar a view consolidada

```sql
SELECT 
    lead_name,
    marketplace,
    lead_total_orders,
    lead_total_spent,
    orders_count
FROM lead_orders_summary
WHERE marketplace = 'Shopee'
ORDER BY lead_total_spent DESC;
```

### 3. Análise por marketplace

```sql
SELECT 
    marketplace,
    total_leads,
    total_orders,
    total_revenue,
    avg_order_value,
    repeat_rate_percentage
FROM leads_by_marketplace
ORDER BY total_revenue DESC;
```

### 4. Ver pedidos de diferentes marketplaces do mesmo lead

```sql
SELECT 
    lead_name,
    marketplace as lead_marketplace,
    orders
FROM lead_orders_summary
WHERE lead_id = 'UUID_DO_LEAD';
```

## Exemplo de Resultado

```json
{
  "lead_name": "Jonatan Renan Vitoriano Da Silva",
  "marketplace": "Mercado Livre",
  "lead_total_orders": 3,
  "lead_total_spent": 224.40,
  "orders": [
    {
      "order_id": "...",
      "order_date": "2026-02-27",
      "total_amount": 74.80,
      "marketplace_name": "Mercado Livre"
    }
  ]
}
```

## Workflow N8N

O workflow já está preparado:
1. Quando um pedido é processado, o `sales_channel_id` é salvo
2. O trigger busca o marketplace através do sales_channel
3. O lead é atualizado automaticamente com o marketplace

## Benefícios

1. ✅ Identificação da origem do lead
2. ✅ Análise de performance por marketplace
3. ✅ Segmentação de leads por canal
4. ✅ Cálculo de taxa de recompra por marketplace
5. ✅ Atualização automática via trigger
6. ✅ Histórico completo de pedidos com marketplace

## Arquivos Relacionados

- `supabase/migrations/20260227_add_marketplace_to_leads.sql` - Migração inicial
- `supabase/migrations/20260227_fix_marketplace_leads_relation.sql` - Correção para usar sales_channels
- `supabase/migrations/20260227_add_lead_orders_relation.sql` - Relação leads ↔ orders
- `supabase/migrations/20260224_create_leads_table.sql` - Tabela de leads

## Verificação

Para verificar se está funcionando:

```sql
-- Ver leads com marketplace
SELECT 
    l.name,
    m.name as marketplace,
    l.total_orders,
    l.total_spent
FROM leads l
LEFT JOIN marketplaces m ON m.id = l.marketplace_id
ORDER BY l.created_at DESC
LIMIT 10;
```

## Próximos Passos Sugeridos

1. Criar dashboard de análise por marketplace
2. Implementar segmentação de campanhas por marketplace
3. Calcular LTV (Lifetime Value) por marketplace
4. Criar alertas para leads de alto valor por marketplace
