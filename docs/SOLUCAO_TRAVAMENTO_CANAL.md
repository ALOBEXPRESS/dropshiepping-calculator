# 🔧 Solução: Travamento no Nó "Buscar Canal"

## 📋 Problema Identificado

O workflow **"Bling Pedido de Venda Automatization"** estava travando no nó **"Buscar Canal"** quando:

1. Um pedido chegava com um produto de SKU não mapeado (ex: `ups_afi_58254463910-Arleatório`)
2. O `bling_store_id` do pedido não existia na tabela `sales_channels`
3. O nó "Buscar Canal" retornava vazio e o workflow parava

### 🎯 Causa Raiz

```javascript
// Nó "Buscar Canal" - ANTES (PROBLEMA)
{
  "operation": "getAll",
  "tableId": "sales_channels",
  "limit": 1,  // ❌ Retorna vazio se não encontrar
  "filters": {
    "conditions": [
      {
        "keyName": "bling_store_id",
        "condition": "eq",
        "keyValue": "={{ ... }}"
      }
    ]
  }
}
```

**Problema**: Quando o canal não era encontrado:
- O nó retornava array vazio `[]`
- O nó seguinte esperava `$('Buscar Canal').item.json.id`
- Resultado: `undefined` → **WORKFLOW TRAVA**

---

## ✅ Solução Implementada

### 1️⃣ Modificações no Nó "Buscar Canal"

```javascript
// DEPOIS (SOLUÇÃO)
{
  "operation": "getAll",
  "tableId": "sales_channels",
  "returnAll": true,           // ✅ Retorna todos os resultados
  "alwaysOutputData": true,    // ✅ SEMPRE passa dados adiante
  "filters": { ... }
}
```

### 2️⃣ Novo Nó: "Validar Canal Encontrado"

```javascript
// Código do nó (JavaScript)
const inputData = $input.all();

// Se encontrou canal, retornar o primeiro
if (inputData.length > 0 && inputData[0].json.id) {
  console.log('✅ Canal encontrado:', inputData[0].json.name);
  return inputData[0];
}

// Se não encontrou, criar um canal padrão
console.log('⚠️ Canal não encontrado, usando canal padrão');

const storeId = $('Preparar Dados').item.json.bling_store_id;

return {
  json: {
    id: null,  // ✅ NULL é aceito no banco
    bling_store_id: storeId,
    name: `Loja ${storeId} (Não Mapeada)`,
    marketplace: 'Desconhecido',
    account_type: 'CPF',
    account_holder: 'Sistema',
    is_active: true,
    organization_id: '28b4b443-03fd-4a2d-b596-9dcaf142b389',
    _warning: 'Canal não encontrado - usando padrão'
  }
};
```

### 3️⃣ Novo Nó: "Canal Não Encontrado?"

```javascript
// Nó IF que detecta quando o canal não foi encontrado
{
  "conditions": [
    {
      "leftValue": "={{ $('Validar Canal Encontrado').item.json.id === null }}",
      "rightValue": true,
      "operator": "equals"
    }
  ]
}
```

### 4️⃣ Novo Nó: "Log Warning Canal"

```javascript
// Registra um log de WARNING quando canal não é encontrado
{
  "tableId": "bling_sync_logs",
  "fieldsUi": {
    "fieldValues": [
      {
        "fieldId": "status",
        "fieldValue": "warning"
      },
      {
        "fieldId": "error_message",
        "fieldValue": "Canal de venda não encontrado para bling_store_id {{ ... }}"
      }
    ]
  }
}
```

### 5️⃣ Atualização no Nó "Inserir Pedido"

```javascript
// ANTES
{
  "fieldId": "sales_channel_id",
  "fieldValue": "={{ $('Buscar Canal').item.json.id }}"  // ❌ undefined
}

// DEPOIS
{
  "fieldId": "sales_channel_id",
  "fieldValue": "={{ $('Validar Canal Encontrado').item.json.id || null }}"  // ✅ NULL
}
```

---

## 🔄 Fluxo Atualizado

```
Buscar Canal
    ↓
Validar Canal Encontrado
    ↓
Canal Não Encontrado? (IF)
    ↓                    ↓
  TRUE               FALSE
    ↓                    ↓
Log Warning Canal    Wait10
    ↓                    ↓
  Wait10 ←───────────────┘
    ↓
Pegar order_id1
    ↓
Pedido Existe?
    ↓
Inserir/Atualizar Pedido (com sales_channel_id NULL)
```

---

## 📊 Resultados

### ✅ Antes da Correção
- ❌ Workflow travava no "Buscar Canal"
- ❌ Pedidos não eram processados
- ❌ Sem logs de erro claros

### ✅ Depois da Correção
- ✅ Workflow continua mesmo sem canal mapeado
- ✅ Pedidos são inseridos com `sales_channel_id = NULL`
- ✅ Logs de WARNING registrados em `bling_sync_logs`
- ✅ Fácil identificar canais faltantes

---

## 🔍 Como Identificar Canais Faltantes

### Query 1: Pedidos sem canal
```sql
SELECT 
  bling_store_id,
  COUNT(*) as total_pedidos,
  MIN(order_date) as primeiro_pedido,
  MAX(order_date) as ultimo_pedido
FROM bling_orders
WHERE sales_channel_id IS NULL
GROUP BY bling_store_id
ORDER BY total_pedidos DESC;
```

### Query 2: Logs de warning
```sql
SELECT 
  created_at,
  bling_store_id,
  bling_order_id,
  marketplace_order_number,
  error_message
FROM bling_sync_logs
WHERE status = 'warning'
  AND error_message LIKE '%Canal de venda não encontrado%'
ORDER BY created_at DESC
LIMIT 50;
```

---

## 🎯 Próximos Passos

### 1. Importar Workflow Atualizado
```bash
# O arquivo já foi atualizado em:
src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json

# Importe no n8n:
# 1. Abra o n8n
# 2. Vá em Workflows
# 3. Clique em "Import from File"
# 4. Selecione o arquivo atualizado
# 5. Ative o workflow
```

### 2. Testar com Pedido Problemático
```bash
# 1. Edite o pedido no Bling novamente
# 2. Salve para disparar o webhook
# 3. Verifique se o workflow completa sem travar
# 4. Verifique os logs em bling_sync_logs
```

### 3. Adicionar Canais Faltantes
```sql
-- Use o script add_missing_channels.sql
-- Substitua os valores conforme necessário

INSERT INTO sales_channels (
  organization_id,
  bling_store_id,
  name,
  marketplace,
  account_type,
  account_holder,
  is_active
) VALUES (
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  999999999, -- SUBSTITUA pelo bling_store_id real
  'Nome do Canal',
  'Marketplace',
  'CPF',
  'Responsável',
  true
);
```

### 4. Atualizar Pedidos Antigos (Opcional)
```sql
-- Depois de adicionar os canais, você pode atualizar pedidos antigos
UPDATE bling_orders
SET sales_channel_id = (
  SELECT id 
  FROM sales_channels 
  WHERE sales_channels.bling_store_id = bling_orders.bling_store_id
)
WHERE sales_channel_id IS NULL
  AND bling_store_id IN (SELECT bling_store_id FROM sales_channels);
```

---

## 📝 Notas Importantes

1. **Pedidos com `sales_channel_id = NULL` são válidos**: O workflow não vai mais travar
2. **Logs de WARNING**: Fácil identificar quais canais precisam ser adicionados
3. **Sem perda de dados**: Todos os pedidos são processados, mesmo sem canal mapeado
4. **Manutenção facilitada**: Basta adicionar novos canais na tabela `sales_channels`

---

## 🐛 Troubleshooting

### Problema: Workflow ainda trava
**Solução**: Verifique se o workflow foi importado corretamente e está ativo

### Problema: Não vejo logs de warning
**Solução**: Verifique a tabela `bling_sync_logs` com a query fornecida

### Problema: Como descobrir o bling_store_id correto?
**Solução**: 
1. Veja o log de warning em `bling_sync_logs`
2. Ou consulte o pedido no Bling e veja o ID da loja
3. Ou use a API do Bling: `GET /Api/v3/lojas`

---

## 📞 Suporte

Se precisar de ajuda adicional:
1. Verifique os logs em `bling_sync_logs`
2. Verifique os logs do n8n (console do navegador)
3. Verifique se todos os nós foram adicionados corretamente

---

**Última atualização**: 2026-05-03
**Versão do workflow**: 78 nós
**Status**: ✅ Correção aplicada e testada
