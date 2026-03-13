# 🚀 Guia Rápido: Implementar Sistema de Leads

## ✅ Passo 1: Aplicar Migração no Supabase (2 minutos)

### Opção Mais Fácil - Via Dashboard:

1. Acesse: https://supabase.com/dashboard/project/oensqhjnxwpcuanozske/sql/new
2. Cole TODO o conteúdo do arquivo: `supabase/migrations/20260224_create_leads_table.sql`
3. Clique em **RUN** (canto inferior direito)
4. Aguarde aparecer "Success"

### Verificar se Funcionou:

Execute esta query:
```sql
SELECT * FROM leads LIMIT 1;
```

Se não der erro, funcionou! ✅

---

## ✅ Passo 2: Adicionar Nós no N8N (5 minutos)

### 2.1. Abrir o Workflow

1. Acesse seu N8N
2. Abra o workflow: **"Bling Pedido de Venda Automatization"**

### 2.2. Localizar Onde Inserir

Procure o nó chamado: **"Validar Dados para NF"**

Os novos nós devem ser inseridos **DEPOIS** deste nó.

### 2.3. Adicionar os 7 Novos Nós

Adicione os nós nesta ordem (copie as configurações de `src/hooks/n8n/novos-nos-leads.json`):

```
Validar Dados para NF (existente)
    ↓
1. Buscar Contato no Bling (HTTP Request) ← NOVO
    ↓
2. Processar Dados do Lead (Code) ← NOVO
    ↓
3. Buscar Lead Existente (Supabase Get All) ← NOVO
    ↓
4. Lead Existe? (IF) ← NOVO
    ├─ TRUE → 5A. Atualizar Lead (Supabase Update) ← NOVO
    └─ FALSE → 5B. Criar Lead (Supabase Insert) ← NOVO
    ↓ (merge ambas as saídas)
6. Atualizar Estatísticas do Lead (Code) ← NOVO
    ↓
7. Salvar Estatísticas no Banco (Supabase Update) ← NOVO
    ↓
Precisa Revisão? (existente - conecte aqui)
```

### 2.4. Configuração de Cada Nó

#### Nó 1: Buscar Contato no Bling
- **Tipo**: HTTP Request
- **Method**: GET
- **URL**: `https://api.bling.com.br/Api/v3/contatos/{{ $('Buscar Detalhes do Pedido').item.json.data.contato.id }}`
- **Headers**:
  - `Authorization`: `Bearer {{ $('Pegar Access Token1').first().json.access_token }}`
  - `Accept`: `application/json`
- **On Error**: Continue on Error Output

#### Nó 2: Processar Dados do Lead
- **Tipo**: Code (JavaScript)
- **Código**: Copie de `src/hooks/n8n/code-snippets/processar-lead-contato.js`

#### Nó 3: Buscar Lead Existente
- **Tipo**: Supabase (Get All)
- **Table**: `leads`
- **Limit**: 1
- **Filter**: `bling_contact_id` equals `{{ $json.bling_contact_id }}`
- **On Error**: Continue on Error Output
- **Always Output Data**: ✅ Ativado

#### Nó 4: Lead Existe?
- **Tipo**: IF
- **Condition**: `{{ $('Buscar Lead Existente').item.json.id !== undefined && $('Buscar Lead Existente').item.json.id !== null }}` equals `true`

#### Nó 5A: Atualizar Lead (saída TRUE)
- **Tipo**: Supabase (Update)
- **Table**: `leads`
- **Filter**: `bling_contact_id` equals `{{ $('Processar Dados do Lead').item.json.bling_contact_id }}`
- **Fields**: Ver arquivo `src/hooks/n8n/novos-nos-leads.json` para lista completa

#### Nó 5B: Criar Lead (saída FALSE)
- **Tipo**: Supabase (Insert)
- **Table**: `leads`
- **Fields**: Ver arquivo `src/hooks/n8n/novos-nos-leads.json` para lista completa

#### Nó 6: Atualizar Estatísticas do Lead
- **Tipo**: Code (JavaScript)
- **Código**: Copie de `src/hooks/n8n/code-snippets/atualizar-estatisticas-lead.js`

#### Nó 7: Salvar Estatísticas no Banco
- **Tipo**: Supabase (Update)
- **Table**: `leads`
- **Filter**: `bling_contact_id` equals `{{ $json.bling_contact_id }}`
- **Fields**:
  - `total_orders`: `{{ $json.total_orders }}`
  - `total_spent`: `{{ $json.total_spent }}`
  - `first_order_date`: `{{ $json.first_order_date }}`
  - `last_order_date`: `{{ $json.last_order_date }}`
  - `lead_status`: `customer`
  - `updated_at`: `{{ new Date().toISOString() }}`

### 2.5. Conectar os Nós

1. Conecte a saída de "Validar Dados para NF" → "Buscar Contato no Bling"
2. Conecte sequencialmente até "Lead Existe?"
3. Conecte TRUE → "Atualizar Lead"
4. Conecte FALSE → "Criar Lead"
5. Conecte ambos (Atualizar e Criar) → "Atualizar Estatísticas do Lead"
6. Continue até "Salvar Estatísticas no Banco"
7. Conecte a saída final → "Precisa Revisão?" (nó existente)

### 2.6. Salvar o Workflow

Clique em **Save** no canto superior direito do N8N.

---

## ✅ Passo 3: Testar (2 minutos)

1. Execute o workflow manualmente ou aguarde um pedido real
2. Verifique os logs de cada nó
3. Consulte a tabela `leads` no Supabase:

```sql
SELECT 
    name, 
    email, 
    total_orders, 
    total_spent, 
    lead_source,
    created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 Pronto!

Agora cada pedido que chegar vai:
- ✅ Buscar dados do contato no Bling
- ✅ Criar ou atualizar o lead no banco
- ✅ Atualizar estatísticas (total de pedidos, valor gasto)
- ✅ Identificar canal de origem

---

## 📊 Queries Úteis

### Ver todos os leads:
```sql
SELECT * FROM leads ORDER BY created_at DESC;
```

### Ver top 10 clientes:
```sql
SELECT name, email, total_orders, total_spent
FROM leads
WHERE total_orders > 0
ORDER BY total_spent DESC
LIMIT 10;
```

### Ver leads por canal:
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

## 🆘 Problemas?

### Erro ao criar tabela:
- Verifique se você está no projeto correto do Supabase
- Tente executar a migração novamente

### Nó não encontra dados:
- Verifique se o nó anterior executou com sucesso
- Veja os logs do nó no N8N

### Lead não é criado:
- Verifique se a migração foi aplicada
- Veja os logs do nó "Criar Lead"
- Verifique se o `organization_id` está correto

---

## 📁 Arquivos de Referência

- **Migração**: `supabase/migrations/20260224_create_leads_table.sql`
- **Nós JSON**: `src/hooks/n8n/novos-nos-leads.json`
- **Código Processar Lead**: `src/hooks/n8n/code-snippets/processar-lead-contato.js`
- **Código Estatísticas**: `src/hooks/n8n/code-snippets/atualizar-estatisticas-lead.js`
- **Documentação Completa**: `docs/24_IMPLEMENTACAO_LEADS_N8N.md`

