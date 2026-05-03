# Implementação: Sistema de Leads no N8N - Sessão 24

## Data: 2026-02-24

---

## Objetivo

Criar um sistema de gerenciamento de leads que:
1. Captura dados de contatos de cada pedido do Bling
2. Verifica se o contato já existe no banco
3. Cria novo lead ou atualiza existente
4. Mantém estatísticas de compras (total de pedidos, valor gasto, datas)

---

## 1. Estrutura do Banco de Dados

### Tabela: `leads`

```sql
CREATE TABLE public.leads (
    -- Identificação
    id UUID PRIMARY KEY,
    bling_contact_id BIGINT UNIQUE NOT NULL,
    organization_id UUID NOT NULL,
    
    -- Dados Pessoais
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile_phone VARCHAR(50),
    
    -- Documentos
    document_type VARCHAR(10), -- 'CPF' ou 'CNPJ'
    document_number VARCHAR(20),
    ie VARCHAR(50),
    rg VARCHAR(50),
    
    -- Endereço
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zip VARCHAR(10),
    address_country VARCHAR(100),
    
    -- Informações Comerciais
    company_name VARCHAR(255),
    trade_name VARCHAR(255),
    
    -- Dados do Bling (raw)
    bling_data JSONB,
    
    -- Estatísticas
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    first_order_date TIMESTAMP WITH TIME ZONE,
    last_order_date TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    lead_status VARCHAR(50) DEFAULT 'new',
    lead_source VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `bling_contact_id` | BIGINT | ID do contato no Bling (único) |
| `name` | VARCHAR | Nome do contato |
| `email` | VARCHAR | Email do contato |
| `document_type` | VARCHAR | CPF ou CNPJ |
| `document_number` | VARCHAR | Número do documento |
| `total_orders` | INTEGER | Total de pedidos realizados |
| `total_spent` | DECIMAL | Valor total gasto |
| `lead_status` | VARCHAR | Status: new, contacted, qualified, customer, inactive |
| `lead_source` | VARCHAR | Canal de origem (MercadoLivre, Shopee, etc.) |

---

## 2. Fluxo no N8N

### Visão Geral

```
Webhook Bling
    ↓
Buscar Detalhes do Pedido
    ↓
Buscar Contato no Bling ← NOVO
    ↓
Processar Dados do Lead ← NOVO
    ↓
Buscar Lead Existente ← NOVO
    ↓
[Lead Existe?] ← NOVO
    ├─ SIM → Atualizar Lead
    └─ NÃO → Criar Lead
    ↓
Atualizar Estatísticas ← NOVO
    ↓
Inserir Pedido (fluxo existente)
```

---

## 3. Nós a Adicionar no N8N

### Nó 1: Buscar Contato no Bling

**Tipo**: HTTP Request
**Posição**: Após "Buscar Detalhes do Pedido"

**Configuração**:
```json
{
  "method": "GET",
  "url": "=https://api.bling.com.br/Api/v3/contatos/{{ $('Buscar Detalhes do Pedido').item.json.data.contato.id }}",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "=Bearer {{ $('Pegar Access Token1').first().json.access_token }}"
      },
      {
        "name": "Accept",
        "value": "application/json"
      }
    ]
  },
  "options": {}
}
```

**Nome do Nó**: `Buscar Contato no Bling`

---

### Nó 2: Processar Dados do Lead

**Tipo**: Code (JavaScript)
**Posição**: Após "Buscar Contato no Bling"

**Código**: Ver arquivo `src/hooks/n8n/code-snippets/processar-lead-contato.js`

**Resumo do que faz**:
- Extrai dados do contato da API Bling
- Determina tipo de documento (CPF/CNPJ)
- Formata endereço
- Prepara objeto para inserção no banco

**Nome do Nó**: `Processar Dados do Lead`

---

### Nó 3: Buscar Lead Existente

**Tipo**: Supabase (Get All)
**Posição**: Após "Processar Dados do Lead"

**Configuração**:
```json
{
  "operation": "getAll",
  "tableId": "leads",
  "limit": 1,
  "filters": {
    "conditions": [
      {
        "keyName": "bling_contact_id",
        "condition": "eq",
        "keyValue": "={{ $json.bling_contact_id }}"
      }
    ]
  }
}
```

**Nome do Nó**: `Buscar Lead Existente`
**On Error**: Continue on Error Output

---

### Nó 4: Lead Existe?

**Tipo**: IF
**Posição**: Após "Buscar Lead Existente"

**Configuração**:
```json
{
  "conditions": {
    "options": {
      "caseSensitive": true,
      "leftValue": "",
      "typeValidation": "loose",
      "version": 3
    },
    "conditions": [
      {
        "leftValue": "={{ $('Buscar Lead Existente').item.json.id !== undefined && $('Buscar Lead Existente').item.json.id !== null }}",
        "rightValue": true,
        "operator": {
          "type": "boolean",
          "operation": "equals"
        }
      }
    ],
    "combinator": "and"
  }
}
```

**Nome do Nó**: `Lead Existe?`

---

### Nó 5A: Atualizar Lead (se existe)

**Tipo**: Supabase (Update)
**Posição**: Saída TRUE do "Lead Existe?"

**Configuração**:
```json
{
  "operation": "update",
  "tableId": "leads",
  "filters": {
    "conditions": [
      {
        "keyName": "bling_contact_id",
        "condition": "eq",
        "keyValue": "={{ $('Processar Dados do Lead').item.json.bling_contact_id }}"
      }
    ]
  },
  "fieldsUi": {
    "fieldValues": [
      {
        "fieldId": "name",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.name }}"
      },
      {
        "fieldId": "email",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.email }}"
      },
      {
        "fieldId": "phone",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.phone }}"
      },
      {
        "fieldId": "mobile_phone",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.mobile_phone }}"
      },
      {
        "fieldId": "document_type",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.document_type }}"
      },
      {
        "fieldId": "document_number",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.document_number }}"
      },
      {
        "fieldId": "address_street",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_street }}"
      },
      {
        "fieldId": "address_number",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_number }}"
      },
      {
        "fieldId": "address_complement",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_complement }}"
      },
      {
        "fieldId": "address_neighborhood",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_neighborhood }}"
      },
      {
        "fieldId": "address_city",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_city }}"
      },
      {
        "fieldId": "address_state",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_state }}"
      },
      {
        "fieldId": "address_zip",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_zip }}"
      },
      {
        "fieldId": "company_name",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.company_name }}"
      },
      {
        "fieldId": "trade_name",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.trade_name }}"
      },
      {
        "fieldId": "bling_data",
        "fieldValue": "={{ JSON.stringify($('Processar Dados do Lead').item.json.bling_data) }}"
      },
      {
        "fieldId": "is_active",
        "fieldValue": true
      },
      {
        "fieldId": "lead_status",
        "fieldValue": "customer"
      },
      {
        "fieldId": "updated_at",
        "fieldValue": "={{ new Date().toISOString() }}"
      }
    ]
  }
}
```

**Nome do Nó**: `Atualizar Lead`

---

### Nó 5B: Criar Lead (se não existe)

**Tipo**: Supabase (Insert)
**Posição**: Saída FALSE do "Lead Existe?"

**Configuração**:
```json
{
  "operation": "insert",
  "tableId": "leads",
  "fieldsUi": {
    "fieldValues": [
      {
        "fieldId": "bling_contact_id",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.bling_contact_id }}"
      },
      {
        "fieldId": "organization_id",
        "fieldValue": "e3274f4d-2627-4121-895d-b0e3a70b0ace"
      },
      {
        "fieldId": "name",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.name }}"
      },
      {
        "fieldId": "email",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.email }}"
      },
      {
        "fieldId": "phone",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.phone }}"
      },
      {
        "fieldId": "mobile_phone",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.mobile_phone }}"
      },
      {
        "fieldId": "document_type",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.document_type }}"
      },
      {
        "fieldId": "document_number",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.document_number }}"
      },
      {
        "fieldId": "ie",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.ie }}"
      },
      {
        "fieldId": "rg",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.rg }}"
      },
      {
        "fieldId": "address_street",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_street }}"
      },
      {
        "fieldId": "address_number",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_number }}"
      },
      {
        "fieldId": "address_complement",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_complement }}"
      },
      {
        "fieldId": "address_neighborhood",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_neighborhood }}"
      },
      {
        "fieldId": "address_city",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_city }}"
      },
      {
        "fieldId": "address_state",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_state }}"
      },
      {
        "fieldId": "address_zip",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_zip }}"
      },
      {
        "fieldId": "address_country",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.address_country }}"
      },
      {
        "fieldId": "company_name",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.company_name }}"
      },
      {
        "fieldId": "trade_name",
        "fieldValue": "={{ $('Processar Dados do Lead').item.json.trade_name }}"
      },
      {
        "fieldId": "bling_data",
        "fieldValue": "={{ JSON.stringify($('Processar Dados do Lead').item.json.bling_data) }}"
      },
      {
        "fieldId": "total_orders",
        "fieldValue": 0
      },
      {
        "fieldId": "total_spent",
        "fieldValue": 0
      },
      {
        "fieldId": "is_active",
        "fieldValue": true
      },
      {
        "fieldId": "lead_status",
        "fieldValue": "customer"
      },
      {
        "fieldId": "lead_source",
        "fieldValue": "={{ $('Mapear Canal de Venda').item.json.marketplace }}"
      }
    ]
  }
}
```

**Nome do Nó**: `Criar Lead`

---

### Nó 6: Atualizar Estatísticas do Lead

**Tipo**: Code (JavaScript)
**Posição**: Após "Atualizar Lead" e "Criar Lead" (merge)

**Código**: Ver arquivo `src/hooks/n8n/code-snippets/atualizar-estatisticas-lead.js`

**Nome do Nó**: `Atualizar Estatísticas do Lead`

---

### Nó 7: Salvar Estatísticas no Banco

**Tipo**: Supabase (Update)
**Posição**: Após "Atualizar Estatísticas do Lead"

**Configuração**:
```json
{
  "operation": "update",
  "tableId": "leads",
  "filters": {
    "conditions": [
      {
        "keyName": "bling_contact_id",
        "condition": "eq",
        "keyValue": "={{ $json.bling_contact_id }}"
      }
    ]
  },
  "fieldsUi": {
    "fieldValues": [
      {
        "fieldId": "total_orders",
        "fieldValue": "={{ $json.total_orders }}"
      },
      {
        "fieldId": "total_spent",
        "fieldValue": "={{ $json.total_spent }}"
      },
      {
        "fieldId": "first_order_date",
        "fieldValue": "={{ $json.first_order_date }}"
      },
      {
        "fieldId": "last_order_date",
        "fieldValue": "={{ $json.last_order_date }}"
      },
      {
        "fieldId": "lead_status",
        "fieldValue": "customer"
      },
      {
        "fieldId": "updated_at",
        "fieldValue": "={{ new Date().toISOString() }}"
      }
    ]
  }
}
```

**Nome do Nó**: `Salvar Estatísticas no Banco`

---

## 4. Passo a Passo de Implementação

### 4.1. Aplicar Migração do Banco

```bash
# No terminal, na pasta do projeto
cd supabase
supabase db push
```

Ou aplique manualmente via SQL Editor no Supabase Dashboard.

### 4.2. Adicionar Nós no N8N

1. Abra o workflow "Bling Pedido de Venda Automatization"
2. Localize o nó "Buscar Detalhes do Pedido"
3. Adicione os novos nós conforme a ordem acima
4. Conecte os nós seguindo o fluxo descrito

### 4.3. Posicionamento Recomendado

```
Buscar Detalhes do Pedido (existente)
    ↓
Buscar Contato no Bling (NOVO - posição: [-10000, 5440])
    ↓
Processar Dados do Lead (NOVO - posição: [-9800, 5440])
    ↓
Buscar Lead Existente (NOVO - posição: [-9600, 5440])
    ↓
Lead Existe? (NOVO - posição: [-9400, 5440])
    ├─ TRUE → Atualizar Lead (NOVO - posição: [-9200, 5360])
    └─ FALSE → Criar Lead (NOVO - posição: [-9200, 5520])
    ↓ (merge)
Atualizar Estatísticas do Lead (NOVO - posição: [-9000, 5440])
    ↓
Salvar Estatísticas no Banco (NOVO - posição: [-8800, 5440])
    ↓
Validar Dados para NF (existente)
```

### 4.4. Tratamento de Erros

Adicione nós de erro após cada nó crítico:

- **Buscar Contato no Bling**: Se falhar, registrar log e continuar
- **Buscar Lead Existente**: Continue on Error Output
- **Criar/Atualizar Lead**: Se falhar, registrar log mas não parar o fluxo

---

## 5. Testes

### 5.1. Teste de Criação de Lead

1. Envie um webhook de teste com um contato novo
2. Verifique se o lead foi criado na tabela `leads`
3. Confirme que os dados estão corretos

### 5.2. Teste de Atualização de Lead

1. Envie outro webhook com o mesmo contato
2. Verifique se o lead foi atualizado (não duplicado)
3. Confirme que as estatísticas foram atualizadas

### 5.3. Teste de Estatísticas

1. Envie múltiplos pedidos do mesmo contato
2. Verifique se `total_orders` e `total_spent` estão corretos
3. Confirme que `first_order_date` e `last_order_date` estão corretos

---

## 6. Queries Úteis

### Ver todos os leads
```sql
SELECT 
    id,
    bling_contact_id,
    name,
    email,
    document_type,
    document_number,
    total_orders,
    total_spent,
    lead_status,
    lead_source,
    created_at
FROM leads
ORDER BY created_at DESC;
```

### Ver leads com mais pedidos
```sql
SELECT 
    name,
    email,
    total_orders,
    total_spent,
    lead_source
FROM leads
WHERE total_orders > 0
ORDER BY total_orders DESC
LIMIT 10;
```

### Ver leads por canal
```sql
SELECT 
    lead_source,
    COUNT(*) as total_leads,
    SUM(total_orders) as total_orders,
    SUM(total_spent) as total_revenue
FROM leads
GROUP BY lead_source
ORDER BY total_revenue DESC;
```

---

## 7. Benefícios

✅ **Centralização de Dados**: Todos os contatos em um só lugar
✅ **Histórico Completo**: Rastreamento de todas as compras
✅ **Segmentação**: Filtrar por canal, valor gasto, frequência
✅ **Marketing**: Base para campanhas de email/remarketing
✅ **Análise**: Entender comportamento dos clientes
✅ **CRM Básico**: Gerenciar relacionamento com clientes

---

## 8. Próximos Passos (Opcional)

- [ ] Criar dashboard de leads no frontend
- [ ] Implementar tags/categorias para leads
- [ ] Adicionar notas/comentários sobre leads
- [ ] Integrar com ferramentas de email marketing
- [ ] Criar relatórios de LTV (Lifetime Value)
- [ ] Implementar score de leads
- [ ] Adicionar automações de follow-up

---

## Status

✅ **Migração do Banco**: Criada
✅ **Código JavaScript**: Criado
✅ **Documentação**: Completa
⏳ **Implementação no N8N**: Aguardando aplicação manual

