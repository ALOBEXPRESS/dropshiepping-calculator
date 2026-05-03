# Correção do Fluxo de DELETE e Webhooks Duplicados

## Problemas Identificados

### 1. Erro no nó "Buscar Canal"
**Erro:** `An expression references this node, but the node is unexecuted`

**Causa:** O nó "Buscar Canal" estava tentando acessar `$('Mapear Canal de Venda').item.json.bling_store_id`, mas no fluxo de DELETE, o nó "Mapear Canal de Venda" não é executado.

**Solução:** Usar expressão condicional que verifica se o nó foi executado:

```javascript
{{ $if($('Mapear Canal de Venda').isExecuted, $('Mapear Canal de Venda').item.json.bling_store_id, $('Buscar Detalhes do Pedido').item.json.data.loja.id) }}
```

### 2. Webhooks Duplicados (DELETE + UPDATE)

**Problema:** Quando você deleta um pedido no Bling, ele envia **2 webhooks**:
1. `order.deleted` - Para notificar que o pedido foi deletado
2. `order.updated` - Para atualizar o status antes de deletar

**Comportamento Atual:**
- Uma requisição cai no switch de DELETE
- Outra requisição cai no switch de UPDATE

**Isso é NORMAL** e esperado pelo Bling. Você tem 3 opções:

## Opções de Solução

### Opção 1: Aceitar os 2 Webhooks (RECOMENDADO)

Deixar como está. O fluxo vai:
1. Processar o UPDATE (atualizar status do pedido)
2. Processar o DELETE (deletar o pedido e itens em cascata)

**Vantagens:**
- Mantém histórico completo
- Logs detalhados de todas as mudanças
- Não perde nenhuma informação

**Desvantagens:**
- 2 execuções do workflow por delete

### Opção 2: Ignorar UPDATE se DELETE Existe

Adicionar um nó de verificação antes do UPDATE que checa se existe um webhook de DELETE para o mesmo pedido nos últimos 5 segundos.

**Implementação:**
```javascript
// Nó: Verificar se tem DELETE pendente
const blingOrderId = $('Preparar Dados').item.json.bling_order_id;
const eventType = $('Preparar Dados').item.json.event_type;

// Se for UPDATE, verificar se tem DELETE recente
if (eventType === 'order.updated') {
  // Buscar no banco se tem um DELETE nos últimos 5 segundos
  // Se tiver, retornar false para ignorar o UPDATE
  return { json: { should_process: false } };
}

return { json: { should_process: true } };
```

### Opção 3: Soft Delete (Melhor para Auditoria)

Em vez de deletar o pedido, apenas marcar como deletado:

**Mudanças necessárias:**
1. Adicionar coluna `deleted_at` na tabela `bling_orders`
2. Mudar o nó "Deletar Pedido" para UPDATE:

```sql
UPDATE bling_orders 
SET deleted_at = NOW(), 
    sync_status = 'deleted'
WHERE bling_order_id = {{ $('Preparar Dados').item.json.bling_order_id }}
```

**Vantagens:**
- Mantém histórico completo
- Permite restaurar pedidos
- Melhor para auditoria e relatórios

## Correção Aplicada

### Nó: Buscar Canal

**ANTES:**
```json
{
  "keyName": "bling_store_id",
  "condition": "eq",
  "keyValue": "={{ $('Mapear Canal de Venda').item.json.bling_store_id }}"
}
```

**TENTATIVA 1 (FALHOU):**
```json
{
  "keyName": "bling_store_id",
  "condition": "eq",
  "keyValue": "={{ $if($('Mapear Canal de Venda').isExecuted, $('Mapear Canal de Venda').item.json.bling_store_id, $('Buscar Detalhes do Pedido').item.json.data.loja.id) }}"
}
```
**Problema:** No fluxo de UPDATE, retornava `undefined` porque o caminho estava errado.

**SOLUÇÃO FINAL (CORRETO):**
```json
{
  "keyName": "bling_store_id",
  "condition": "eq",
  "keyValue": "={{ $if($('Mapear Canal de Venda').isExecuted, $('Mapear Canal de Venda').item.json.bling_store_id, $('Preparar Dados').item.json.bling_store_id) }}"
}
```

**Por que funciona:**
- O nó "Preparar Dados" é executado ANTES do switch em todos os fluxos (CREATE, UPDATE, DELETE)
- Ele já tem o `bling_store_id` extraído do webhook
- É mais confiável que tentar acessar "Buscar Detalhes do Pedido"

## Como Aplicar

1. Abra o workflow no n8n
2. Clique no nó **"Buscar Canal"**
3. No campo **"Key Value"** do filtro `bling_store_id`, substitua a expressão pela nova
4. Salve o workflow

## Verificação do DELETE em Cascata

O DELETE deve funcionar automaticamente devido ao `ON DELETE CASCADE` na tabela `bling_order_items`:

```sql
-- Verificar se o CASCADE está configurado
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'bling_order_items'
  AND tc.constraint_type = 'FOREIGN KEY';
```

Se o `delete_rule` for `CASCADE`, quando você deletar um pedido da tabela `bling_orders`, todos os itens relacionados em `bling_order_items` serão deletados automaticamente.

## Logs Esperados

### Webhook DELETE
```
Event: order.deleted
Bling Order ID: 25137490604
Ação: Deletar pedido e itens em cascata
Status: success
```

### Webhook UPDATE (antes do DELETE)
```
Event: order.updated
Bling Order ID: 25137490604
Ação: Atualizar status do pedido
Status: success
```

## Recomendação Final

**Use a Opção 1** (aceitar os 2 webhooks) por enquanto. É a solução mais simples e confiável. Se você perceber que está causando problemas de performance ou logs duplicados demais, considere implementar a Opção 3 (Soft Delete).
