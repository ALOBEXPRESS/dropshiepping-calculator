# Correção: Erro ao Deletar Pedido no Workflow n8n

## Problema Identificado

Ao deletar um pedido no Bling, o workflow n8n apresentava o seguinte erro:

```
update or delete on table "bling_order_items" violates foreign key constraint 
"order_items_bling_item_id_fkey" on table "order_items"
```

## Causa Raiz

O erro ocorria devido à configuração da foreign key constraint entre as tabelas:

1. **Fluxo de deleção esperado:**
   - Workflow deleta registro em `bling_orders`
   - Postgres deleta automaticamente registros relacionados em `bling_order_items` (ON DELETE CASCADE)
   - Postgres deveria deletar registros relacionados em `order_items`

2. **Problema:**
   - A foreign key `order_items_bling_item_id_fkey` estava configurada com `ON DELETE NO ACTION`
   - Isso impedia a deleção em cascata, bloqueando a operação

## Estrutura das Tabelas

### Relações Identificadas

```
bling_orders (id)
    ↓ ON DELETE CASCADE
bling_order_items (id, order_id)
    ↓ ON DELETE NO ACTION (PROBLEMA!)
order_items (id, bling_item_id)
```

### Foreign Keys Antes da Correção

| Tabela | Coluna | Referencia | Delete Rule | Update Rule |
|--------|--------|------------|-------------|-------------|
| bling_order_items | order_id | bling_orders.id | CASCADE | NO ACTION |
| order_items | bling_item_id | bling_order_items.id | **NO ACTION** | NO ACTION |

## Solução Implementada

### Migration Criada

Arquivo: `supabase/migrations/20260301_fix_order_items_foreign_key_cascade.sql`

```sql
-- Remover a constraint existente
ALTER TABLE order_items 
DROP CONSTRAINT IF EXISTS order_items_bling_item_id_fkey;

-- Recriar a constraint com ON DELETE CASCADE
ALTER TABLE order_items
ADD CONSTRAINT order_items_bling_item_id_fkey 
FOREIGN KEY (bling_item_id) 
REFERENCES bling_order_items(id) 
ON DELETE CASCADE;
```

### Foreign Keys Após a Correção

| Tabela | Coluna | Referencia | Delete Rule | Update Rule |
|--------|--------|------------|-------------|-------------|
| bling_order_items | order_id | bling_orders.id | CASCADE | NO ACTION |
| order_items | bling_item_id | bling_order_items.id | **CASCADE** | NO ACTION |

## Fluxo de Deleção Corrigido

Agora, quando um pedido é deletado no Bling:

1. Workflow n8n recebe webhook `order.deleted`
2. Nó "Deletar Pedido" executa: `DELETE FROM bling_orders WHERE bling_order_id = X`
3. Postgres deleta automaticamente registros em `bling_order_items` (CASCADE)
4. Postgres deleta automaticamente registros em `order_items` (CASCADE)
5. Operação completa com sucesso ✅

## Verificação

Query para verificar a constraint:

```sql
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'order_items'
    AND kcu.column_name = 'bling_item_id';
```

Resultado esperado: `delete_rule = 'CASCADE'`

## Impacto

- ✅ Workflow n8n agora pode deletar pedidos sem erros
- ✅ Integridade referencial mantida
- ✅ Deleção em cascata automática
- ✅ Sem necessidade de modificar o workflow

## Arquivos Modificados

- `supabase/migrations/20260301_fix_order_items_foreign_key_cascade.sql` (criado)
- `docs/CORRECAO_ERRO_DELETE_PEDIDO.md` (criado)

## Data da Implementação

01/03/2026
