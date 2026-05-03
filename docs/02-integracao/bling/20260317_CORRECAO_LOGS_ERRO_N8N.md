# Correção dos Nós de Log de Erro no Workflow n8n

## 📋 Estrutura da Tabela `bling_sync_logs`

```sql
CREATE TABLE bling_sync_logs (
  id UUID PRIMARY KEY,
  organization_id UUID,
  event_type TEXT NOT NULL,
  bling_order_id BIGINT,
  marketplace_order_number TEXT,
  bling_store_id BIGINT,
  status TEXT NOT NULL, -- 'success', 'error', 'skipped'
  error_message TEXT,
  webhook_data JSONB,
  api_response JSONB,
  processed_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔧 Correções Necessárias

### ❌ Problema Atual

Todos os nós de erro estão tentando buscar dados de nós incorretos e usando campos que não existem (como `$json.error.status` e `$json.error.message`).

### ✅ Solução

Cada nó de erro deve capturar o erro do **nó anterior** usando a saída de erro do n8n.

---

## 📝 Correções por Nó

### 1️⃣ Registrar Log de Erro4 (Erro em "Buscar Detalhes do Pedido1")

**Conectado a**: Saída de ERRO do "Buscar Detalhes do Pedido1"

**Configuração Correta**:

```javascript
// Campos:
organization_id: e3274f4d-2627-4121-895d-b0e3a70b0ace
event_type: {{ $('Preparar Dados1').item.json.event_type }}
bling_order_id: {{ $('Preparar Dados1').item.json.bling_order_id }}
marketplace_order_number: {{ $('Preparar Dados1').item.json.marketplace_order_number }}
bling_store_id: {{ $('Preparar Dados1').item.json.bling_store_id }}
status: error
error_message: {{ $json.error?.message || $json.message || 'Erro ao buscar detalhes do pedido' }}
webhook_data: {{ $('Preparar Dados1').item.json.webhook_data }}
api_response: {{ JSON.stringify($json) }}
```

---

### 2️⃣ Registrar Log de Erro7 (Erro em "Enviar Email Resend API1")

**Conectado a**: Saída de ERRO do "Enviar Email Resend API1"

**Configuração Correta**:

```javascript
// Campos:
organization_id: e3274f4d-2627-4121-895d-b0e3a70b0ace
event_type: {{ $('Preparar Dados1').item.json.event_type }}
bling_order_id: {{ $('Buscar Detalhes do Pedido1').item.json.data.id }}
marketplace_order_number: {{ $('Buscar Detalhes do Pedido1').item.json.data.numeroLoja }}
bling_store_id: {{ $('Buscar Detalhes do Pedido1').item.json.data.loja.id }}
status: error
error_message: {{ $json.error?.message || $json.message || 'Erro ao enviar email de notificação' }}
webhook_data: {{ $('Preparar Dados1').item.json.webhook_data }}
api_response: {{ JSON.stringify($json) }}
```

---

### 3️⃣ Registrar Log de Erro5 (Erro em "Buscar Canal1")

**Conectado a**: Saída de ERRO do "Buscar Canal1"

**Configuração Correta**:

```javascript
// Campos:
organization_id: e3274f4d-2627-4121-895d-b0e3a70b0ace
event_type: {{ $('Preparar Dados1').item.json.event_type }}
bling_order_id: {{ $('Buscar Detalhes do Pedido1').item.json.data.id }}
marketplace_order_number: {{ $('Buscar Detalhes do Pedido1').item.json.data.numeroLoja }}
bling_store_id: {{ $('Mapear Canal de Venda1').item.json.bling_store_id }}
status: error
error_message: {{ $json.error?.message || $json.message || 'Erro ao buscar canal de venda' }}
webhook_data: {{ $('Preparar Dados1').item.json.webhook_data }}
api_response: {{ JSON.stringify($json) }}
```

---

### 4️⃣ Registrar Log de Erro5 (Erro em "Pegar order_id")

**Conectado a**: Saída de ERRO do "Pegar order_id"

**Configuração Correta**:

```javascript
// Campos:
organization_id: e3274f4d-2627-4121-895d-b0e3a70b0ace
event_type: {{ $('Preparar Dados1').item.json.event_type }}
bling_order_id: {{ $('Buscar Detalhes do Pedido1').item.json.data.id }}
marketplace_order_number: {{ $('Buscar Detalhes do Pedido1').item.json.data.numeroLoja }}
bling_store_id: {{ $('Buscar Detalhes do Pedido1').item.json.data.loja.id }}
status: error
error_message: {{ $json.error?.message || $json.message || 'Erro ao buscar order_id' }}
webhook_data: {{ $('Preparar Dados1').item.json.webhook_data }}
api_response: {{ JSON.stringify($json) }}
```

---

### 5️⃣ Registrar Log de Erro6 (Erro em "Inserir Pedido1")

**Conectado a**: Saída de ERRO do "Inserir Pedido1"

**Configuração Correta**:

```javascript
// Campos:
organization_id: e3274f4d-2627-4121-895d-b0e3a70b0ace
event_type: {{ $('Preparar Dados1').item.json.event_type }}
bling_order_id: {{ $('Buscar Detalhes do Pedido1').item.json.data.id }}
marketplace_order_number: {{ $('Buscar Detalhes do Pedido1').item.json.data.numeroLoja }}
bling_store_id: {{ $('Buscar Detalhes do Pedido1').item.json.data.loja.id }}
status: error
error_message: {{ $json.error?.message || $json.message || 'Erro ao inserir pedido' }}
webhook_data: {{ $('Preparar Dados1').item.json.webhook_data }}
api_response: {{ JSON.stringify($json) }}
```

---

### 6️⃣ NOVO: Registrar Log de Erro (Erro em "Pega mais dados do ID Produto")

**Tipo**: Supabase - Insert
**Nome**: `Registrar Log de Erro - Produto`
**Conectado a**: Saída de ERRO do "Pega mais dados do ID Produto"

**Configuração**:

```javascript
// Campos:
organization_id: e3274f4d-2627-4121-895d-b0e3a70b0ace
event_type: {{ $('Preparar Dados1').item.json.event_type }}
bling_order_id: {{ $('Buscar Detalhes do Pedido1').item.json.data.id }}
marketplace_order_number: {{ $('Buscar Detalhes do Pedido1').item.json.data.numeroLoja }}
bling_store_id: {{ $('Buscar Detalhes do Pedido1').item.json.data.loja.id }}
status: error
error_message: {{ $json.error?.message || $json.message || 'Erro ao buscar dados do produto no Bling' }}
webhook_data: {{ $('Preparar Dados1').item.json.webhook_data }}
api_response: {{ JSON.stringify($json) }}
```

**Ação após erro**: Continuar para o próximo item do loop (não parar o workflow)

---

### 7️⃣ NOVO: Registrar Log de Erro (Erro em "Inserir item do pedido")

**Tipo**: Supabase - Insert
**Nome**: `Registrar Log de Erro - Item`
**Conectado a**: Saída de ERRO do "Inserir item do pedido"

**Configuração**:

```javascript
// Campos:
organization_id: e3274f4d-2627-4121-895d-b0e3a70b0ace
event_type: {{ $('Preparar Dados1').item.json.event_type }}
bling_order_id: {{ $('Buscar Detalhes do Pedido1').item.json.data.id }}
marketplace_order_number: {{ $('Buscar Detalhes do Pedido1').item.json.data.numeroLoja }}
bling_store_id: {{ $('Buscar Detalhes do Pedido1').item.json.data.loja.id }}
status: error
error_message: {{ $json.error?.message || $json.message || 'Erro ao inserir item do pedido' }}
webhook_data: {{ JSON.stringify($('Preparar dados do item').item.json) }}
api_response: {{ JSON.stringify($json) }}
```

**Ação após erro**: Continuar para o próximo item do loop (não parar o workflow)

---

## 🔄 Fluxo Correto de Erros

```
Buscar Detalhes do Pedido1
  ├─ Sucesso → Validar Dados
  └─ Erro → Registrar Log de Erro4 → Identificar Tipo de Evento

Enviar Email Resend API1
  ├─ Sucesso → Mapear Canal
  └─ Erro → Registrar Log de Erro7 → Mapear Canal

Buscar Canal1
  ├─ Sucesso → Pegar order_id
  └─ Erro → Registrar Log de Erro5 → (Parar)

Pegar order_id
  ├─ Sucesso → Pedido Existe?
  └─ Erro → Registrar Log de Erro5 → (Parar)

Inserir Pedido1
  ├─ Sucesso → Loop Over Items
  └─ Erro → Registrar Log de Erro6 → Loop Over Items

Pega mais dados do ID Produto
  ├─ Sucesso → Buscar Produto por SKU
  └─ Erro → Registrar Log de Erro - Produto → Próximo item do loop

Inserir item do pedido
  ├─ Sucesso → Próximo item do loop
  └─ Erro → Registrar Log de Erro - Item → Próximo item do loop
```

---

## ⚙️ Configuração de "On Error" nos Nós

Para cada nó que pode dar erro, configure:

1. **Buscar Detalhes do Pedido1**: `On Error: Continue Error Output`
2. **Enviar Email Resend API1**: `On Error: Continue Error Output`
3. **Buscar Canal1**: `On Error: Continue Error Output`
4. **Pegar order_id**: `On Error: Continue Error Output`
5. **Inserir Pedido1**: `On Error: Continue Error Output`
6. **Pega mais dados do ID Produto**: `On Error: Continue Error Output`
7. **Inserir item do pedido**: `On Error: Continue Error Output`

---

## 🎯 Benefícios

1. **Rastreabilidade**: Cada erro é registrado com contexto completo
2. **Resiliência**: Erros em itens individuais não param o workflow
3. **Debug**: Logs detalhados facilitam identificar problemas
4. **Monitoramento**: Possível criar alertas baseados nos logs

---

## 🧪 Como Testar

1. Force um erro em cada nó (ex: token inválido, tabela inexistente)
2. Verifique se o log foi criado em `bling_sync_logs`
3. Verifique se o workflow continuou (quando apropriado)

```sql
-- Ver últimos erros
SELECT 
  event_type,
  bling_order_id,
  error_message,
  processed_at
FROM bling_sync_logs
WHERE status = 'error'
ORDER BY processed_at DESC
LIMIT 10;
```

---

## 📝 Resumo das Mudanças

- ✅ Corrigir 5 nós de log existentes
- ✅ Adicionar 2 novos nós de log (Produto e Item)
- ✅ Configurar "On Error" em 7 nós
- ✅ Garantir que erros não param o workflow desnecessariamente
