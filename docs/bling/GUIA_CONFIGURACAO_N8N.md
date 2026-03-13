# 🔧 Guia de Configuração n8n - Bling Integration

## 📥 Importar Workflow Simplificado

Use o arquivo: `src/hooks/n8n/Bling_Pedido_Venda_Simplificado.json`

---

## 🎯 Configuração de Cada Nó

### 1️⃣ Webhook Bling
- **Tipo:** Webhook
- **Método:** POST
- **Path:** `alobexpressmanager`
- **Response Mode:** Response Node

✅ Não precisa configurar nada, apenas ative o workflow para gerar a URL

---

### 2️⃣ Buscar Token
- **Operação:** `Get Many`
- **Tabela:** `bling_tokens`
- **Return All:** ✅ Sim

**Credenciais Supabase:**
- URL: `https://oensqhjnxwpcuanozske.supabase.co`
- Service Role Key: (pegar no painel do Supabase)

---

### 3️⃣ Buscar Detalhes do Pedido
- **Tipo:** HTTP Request
- **Método:** GET
- **URL:** 
```
https://www.bling.com.br/Api/v3/pedidos/vendas/{{ $('Webhook Bling').item.json.body.data.id }}
```

**Headers:**
- Nome: `Authorization`
- Valor: `Bearer {{ $('Buscar Token').item.json[0].access_token }}`

---

### 4️⃣ Criar Canal (se não existir)
- **Operação:** `Create a new row`
- **Tabela:** `sales_channels`

**Fields to Send:**

| Campo | Valor |
|-------|-------|
| `bling_store_id` | `{{ $('Buscar Detalhes do Pedido').item.json.data.loja.id }}` |
| `organization_id` | `e3274f4d-2627-4121-895d-b0e3a70b0ace` |
| `name` | `Loja {{ $('Buscar Detalhes do Pedido').item.json.data.loja.id }}` |
| `marketplace` | `Marketplace` |
| `account_type` | `CPF` |
| `account_holder` | `Sistema` |
| `is_active` | `true` |

**Options:**
- On Conflict: `ignore` (para não dar erro se já existir)

---

### 5️⃣ Buscar Canal
- **Operação:** `Get Many`
- **Tabela:** `sales_channels`

**Filters:**
- Campo: `bling_store_id`
- Condição: `equals`
- Valor: `{{ $('Buscar Detalhes do Pedido').item.json.data.loja.id }}`

---

### 6️⃣ Inserir Pedido
- **Operação:** `Create a new row`
- **Tabela:** `bling_orders`

**Fields to Send:**

| Campo | Valor |
|-------|-------|
| `organization_id` | `e3274f4d-2627-4121-895d-b0e3a70b0ace` |
| `bling_order_id` | `{{ $('Buscar Detalhes do Pedido').item.json.data.id }}` |
| `order_number` | `{{ $('Buscar Detalhes do Pedido').item.json.data.numero }}` |
| `marketplace_order_number` | `{{ $('Buscar Detalhes do Pedido').item.json.data.numeroLoja }}` |
| `sales_channel_id` | `{{ $('Buscar Canal').item.json[0].id }}` |
| `bling_store_id` | `{{ $('Buscar Detalhes do Pedido').item.json.data.loja.id }}` |
| `order_date` | `{{ $('Buscar Detalhes do Pedido').item.json.data.data }}` |
| `total_products` | `{{ $('Buscar Detalhes do Pedido').item.json.data.totalProdutos }}` |
| `total_amount` | `{{ $('Buscar Detalhes do Pedido').item.json.data.total }}` |
| `status_id` | `{{ $('Buscar Detalhes do Pedido').item.json.data.situacao.id }}` |
| `status_value` | `{{ $('Buscar Detalhes do Pedido').item.json.data.situacao.valor }}` |
| `contact_id` | `{{ $('Buscar Detalhes do Pedido').item.json.data.contato.id }}` |
| `contact_name` | `{{ $('Buscar Detalhes do Pedido').item.json.data.contato.nome }}` |
| `sync_status` | `synced` |
| `last_sync_at` | `{{ new Date().toISOString() }}` |

---

### 7️⃣ Log de Sucesso
- **Operação:** `Create a new row`
- **Tabela:** `bling_sync_logs`

**Fields to Send:**

| Campo | Valor |
|-------|-------|
| `organization_id` | `e3274f4d-2627-4121-895d-b0e3a70b0ace` |
| `event_type` | `{{ $('Webhook Bling').item.json.body.event }}` |
| `bling_order_id` | `{{ $('Webhook Bling').item.json.body.data.id }}` |
| `marketplace_order_number` | `{{ $('Webhook Bling').item.json.body.data.numeroLoja }}` |
| `bling_store_id` | `{{ $('Webhook Bling').item.json.body.data.loja.id }}` |
| `status` | `success` |

---

### 8️⃣ Responder Sucesso
- **Tipo:** Respond to Webhook
- **Respond With:** JSON
- **Response Body:**
```json
{
  "success": true,
  "orderId": "{{ $('Inserir Pedido').item.json.id }}"
}
```

---

### 9️⃣ Log de Erro (em caso de erro)
- **Operação:** `Create a new row`
- **Tabela:** `bling_sync_logs`

**Fields to Send:**

| Campo | Valor |
|-------|-------|
| `organization_id` | `e3274f4d-2627-4121-895d-b0e3a70b0ace` |
| `event_type` | `{{ $('Webhook Bling').item.json.body.event }}` |
| `bling_order_id` | `{{ $('Webhook Bling').item.json.body.data.id }}` |
| `status` | `error` |
| `error_message` | `{{ $json.error.message }}` |

**Settings:**
- Continue On Fail: ✅ Sim

---

### 🔟 Responder Erro
- **Tipo:** Respond to Webhook
- **Respond With:** JSON
- **Response Code:** 500
- **Response Body:**
```json
{
  "success": false,
  "error": "{{ $json.error.message }}"
}
```

---

## 🔗 Conectar os Nós

```
Webhook Bling 
  → Buscar Token 
    → Buscar Detalhes do Pedido 
      → Criar Canal (se não existir) 
        → Buscar Canal 
          → Inserir Pedido 
            → Log de Sucesso 
              → Responder Sucesso

Em caso de erro em qualquer nó:
  → Log de Erro 
    → Responder Erro
```

---

## 🔐 Credenciais Supabase

Para configurar as credenciais do Supabase no n8n:

1. Vá em **Credentials** no menu lateral
2. Clique em **Add Credential**
3. Procure por **Supabase**
4. Preencha:

**Host:**
```
https://oensqhjnxwpcuanozske.supabase.co
```

**Service Role Key:**
```
(Pegar no painel do Supabase em Settings → API → Service Role Key)
```

5. Clique em **Save**

---

## ✅ Checklist de Configuração

- [ ] Importar workflow simplificado
- [ ] Configurar credenciais Supabase
- [ ] Configurar cada nó com os campos corretos
- [ ] Conectar os nós na ordem correta
- [ ] Ativar o workflow
- [ ] Copiar URL do webhook
- [ ] Configurar webhook no Bling
- [ ] Testar com pedido real

---

## 🧪 Testar Workflow

### Teste Manual

1. No n8n, clique em **Execute Workflow**
2. Clique no nó **Webhook Bling**
3. Clique em **Listen for Test Event**
4. Envie um webhook de teste:

```bash
curl -X POST https://hookn8n.alobexpress.com.br/webhook/alobexpressmanager \
  -H "Content-Type: application/json" \
  -d @src/hooks/n8n/httprequestoutput.json
```

### Verificar Resultado

No Supabase, execute:

```sql
-- Ver pedidos sincronizados
SELECT * FROM bling_orders ORDER BY created_at DESC LIMIT 5;

-- Ver logs
SELECT * FROM bling_sync_logs ORDER BY processed_at DESC LIMIT 10;
```

---

## 🚨 Troubleshooting

### Erro: "Could not get parameter"
**Causa:** Campo não está mapeado corretamente
**Solução:** Verifique se o nome do nó anterior está correto na expressão

### Erro: "Row Level Security"
**Causa:** RLS está bloqueando a inserção
**Solução:** Use Service Role Key (não Anon Key)

### Erro: "Unique constraint violation"
**Causa:** Pedido já existe no banco
**Solução:** Adicione `On Conflict: ignore` ou use `Update` ao invés de `Create`

### Erro: "Token expirado"
**Causa:** Access token do Bling expirou
**Solução:** Implemente refresh token automático

---

## 📞 Suporte

Se tiver dúvidas, verifique:
- Logs do n8n (aba Executions)
- Logs do Supabase (tabela `bling_sync_logs`)
- Documentação do n8n: https://docs.n8n.io

---

**Desenvolvido por:** Jonatan Renan  
**Data:** 21 de Fevereiro de 2026  
**Versão:** 2.0 (Simplificado)

**Alob Express © 2026**
