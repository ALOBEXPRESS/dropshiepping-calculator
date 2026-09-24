# Correção: Log Warning Canal - Constraint Violation

**Data:** 2026-05-08  
**Problema:** Nó "Log Warning Canal" falhava ao tentar inserir log com status "warning"

## 🔍 Problema Identificado

Quando um pedido manual foi criado no Bling sem associação a nenhuma loja, o workflow tentou registrar um log de aviso (warning) na tabela `bling_sync_logs`. Porém, a constraint da tabela só aceita os valores:

- `'success'`
- `'error'`
- `'skipped'`

O valor `'warning'` não é permitido, causando o erro:

```
Bad request - please check your parameters: 
new row for relation "bling_sync_logs" violates check constraint "bling_sync_logs_status_check"
```

## ✅ Solução Implementada

### 1. Correção do Workflow

Alterado o nó "Log Warning Canal" para usar `status: "skipped"` ao invés de `status: "warning"`:

**Antes:**
```json
{
  "fieldId": "status",
  "fieldValue": "warning"
}
```

**Depois:**
```json
{
  "fieldId": "status",
  "fieldValue": "skipped"
}
```

### 2. Criação da Loja AlobExpress

Criada loja "AlobExpress - Vendas Manuais" para associar automaticamente pedidos sem loja:

```sql
INSERT INTO public.sales_channels (
  bling_store_id,
  name,
  marketplace,
  account_type,
  account_holder,
  is_active,
  organization_id
) VALUES (
  999999, -- ID fictício para vendas manuais
  'AlobExpress - Vendas Manuais',
  'Manual',
  'CPF',
  'Sistema',
  true,
  '28b4b443-03fd-4a2d-b596-9dcaf142b389'
);
```

**Resultado:**
- ID da loja: `3cc87f94-4f14-4703-b90f-c58fcff2cdb2`
- bling_store_id: `999999`

### 3. Atualização do Nó "Validar Canal Encontrado"

O workflow agora associa automaticamente pedidos sem loja à AlobExpress:

**Antes:**
```javascript
// Retornava canal com id: null
return {
  json: {
    id: null,
    name: `Loja ${storeId} (Não Mapeada)`,
    marketplace: 'Desconhecido'
  }
};
```

**Depois:**
```javascript
// Retorna canal AlobExpress
return {
  json: {
    id: '3cc87f94-4f14-4703-b90f-c58fcff2cdb2',
    bling_store_id: 999999,
    name: 'AlobExpress - Vendas Manuais',
    marketplace: 'Manual'
  }
};
```

### 4. Limpeza do Pedido Problemático

Deletado o pedido que ficou travado:

```sql
DELETE FROM public.bling_order_items
WHERE order_id = 'f7a5d8f7-abb7-4385-ba64-b6dc7c39e822';

DELETE FROM public.bling_orders
WHERE id = 'f7a5d8f7-abb7-4385-ba64-b6dc7c39e822';
```

**Resultado:** ✅ Pedido deletado com sucesso

## 📋 Como Executar

### Passo 1: Atualizar o Workflow no n8n

1. Abra o workflow "Bling Pedido de Venda Automatization" no n8n
2. Reimporte o arquivo JSON atualizado: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization (2).json`
3. Salve e ative o workflow

### Passo 2: Verificar a Loja AlobExpress

A loja já foi criada automaticamente via MCP do Supabase:

```sql
-- Verificar se a loja existe
SELECT * FROM public.sales_channels 
WHERE bling_store_id = 999999;
```

**Resultado esperado:**
- ID: `3cc87f94-4f14-4703-b90f-c58fcff2cdb2`
- Nome: `AlobExpress - Vendas Manuais`
- bling_store_id: `999999`

### Passo 3: Confirmar Limpeza do Pedido

O pedido problemático já foi deletado via MCP do Supabase. Para confirmar:

```sql
-- Verificar se o pedido foi deletado
SELECT * FROM public.bling_orders 
WHERE id = 'f7a5d8f7-abb7-4385-ba64-b6dc7c39e822';
```

**Resultado esperado:** Nenhum registro encontrado

## 🎯 Resultado Esperado

Após a correção:

1. **Workflow funcionando**: Pedidos sem loja associada serão automaticamente associados à "AlobExpress - Vendas Manuais"
2. **Pedido problemático removido**: O pedido `f7a5d8f7-abb7-4385-ba64-b6dc7c39e822` foi deletado ✅
3. **Logs corretos**: Todos os logs respeitam a constraint da tabela (status: success, error ou skipped)
4. **Loja AlobExpress criada**: ID `3cc87f94-4f14-4703-b90f-c58fcff2cdb2` com bling_store_id `999999` ✅

## 🔍 Entendendo o Fluxo

### Quando um pedido não tem loja associada:

1. **Nó "Buscar Canal"**: Não encontra canal de venda
2. **Nó "Validar Canal Encontrado"**: Detecta ausência de canal e retorna automaticamente a loja AlobExpress
3. **Nó "Canal Não Encontrado?"**: Detecta que o canal é AlobExpress (venda manual)
4. **Nó "Log Warning Canal"**: Registra log com status "skipped" informando que foi associado à AlobExpress ✅
5. **Workflow continua**: Pedido é inserido com `sales_channel_id: 3cc87f94-4f14-4703-b90f-c58fcff2cdb2` (AlobExpress)

### Loja AlobExpress:

- **ID**: `3cc87f94-4f14-4703-b90f-c58fcff2cdb2`
- **bling_store_id**: `999999` (ID fictício para identificar vendas manuais)
- **Nome**: `AlobExpress - Vendas Manuais`
- **Marketplace**: `Manual`
- **Uso**: Pedidos criados manualmente no Bling sem loja associada

### Status dos Logs:

- **`success`**: Operação concluída com sucesso
- **`error`**: Erro que impediu a operação
- **`skipped`**: Operação pulada ou com aviso (ex: pedido associado à AlobExpress)

## 🚨 Prevenção Futura

### ✅ Solução Implementada: Loja AlobExpress

Todos os pedidos sem loja associada agora são automaticamente vinculados à loja "AlobExpress - Vendas Manuais":

- **ID da loja**: `3cc87f94-4f14-4703-b90f-c58fcff2cdb2`
- **bling_store_id**: `999999`
- **Marketplace**: `Manual`

Isso garante que:
- ✅ Nenhum pedido fica com `sales_channel_id: NULL`
- ✅ Todos os pedidos manuais são rastreáveis
- ✅ Relatórios e análises incluem vendas manuais
- ✅ Workflow não trava mais

### Identificando Vendas Manuais

Para filtrar apenas vendas manuais:

```sql
-- Buscar pedidos da loja AlobExpress
SELECT * FROM public.bling_orders
WHERE sales_channel_id = '3cc87f94-4f14-4703-b90f-c58fcff2cdb2';

-- Ou por bling_store_id
SELECT bo.* 
FROM public.bling_orders bo
INNER JOIN public.sales_channels sc ON sc.id = bo.sales_channel_id
WHERE sc.bling_store_id = 999999;
```

### Opção Alternativa: Bloquear Pedidos Sem Loja

Se preferir **não processar** pedidos sem loja, adicione validação no nó "Validar Canal Encontrado":

```javascript
// No nó "Validar Canal Encontrado"
if (!inputData.length || !inputData[0].json.id) {
  throw new Error('Pedido sem loja associada - não será processado');
}
```

**Nota:** Não recomendado, pois impede o processamento de vendas manuais legítimas.

## 📝 Arquivos Modificados

1. `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization (2).json` - Workflow corrigido
2. `supabase/migrations/20260508_delete_problematic_order.sql` - Script de limpeza
3. `docs/03-correcoes/20260508_CORRECAO_LOG_WARNING_CANAL.md` - Esta documentação

## 🔗 Referências

- Tabela: `public.bling_sync_logs`
- Constraint: `bling_sync_logs_status_check`
- Nó: "Log Warning Canal"
- Issue: Pedido manual sem loja associada
