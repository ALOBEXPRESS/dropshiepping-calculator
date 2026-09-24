# 📥 Como Importar o Workflow Atualizado no N8N

## ✅ Workflow Atualizado com Sucesso!

O workflow foi atualizado automaticamente e agora contém:
- **66 nós** (58 originais + 8 novos de leads)
- **Conexões configuradas** entre todos os nós
- **Código JavaScript** completo nos nós Code

---

## 🚀 Passo a Passo para Importar

### Opção 1: Substituir o Workflow Existente (Recomendado)

1. **Abra o N8N**: https://editorn8n.alobexpress.com.br

2. **Abra o workflow atual**: "Bling Pedido de Venda Automatization"

3. **Faça backup** (opcional mas recomendado):
   - Clique nos 3 pontinhos (⋮) no canto superior direito
   - Clique em "Download"
   - Salve o arquivo como backup

4. **Importe o novo workflow**:
   - Clique nos 3 pontinhos (⋮) no canto superior direito
   - Clique em "Import from File"
   - Selecione o arquivo: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
   - Clique em "Import"

5. **Verifique as conexões**:
   - Role até encontrar o nó "Validar Dados para NF"
   - Verifique se os novos nós estão conectados:
     ```
     Validar Dados para NF
         ↓
     Buscar Contato no Bling
         ↓
     Processar Dados do Lead
         ↓
     Buscar Lead Existente
         ↓
     Lead Existe?
         ├─ TRUE → Atualizar Lead
         └─ FALSE → Criar Lead
         ↓ (merge)
     Atualizar Estatísticas do Lead
         ↓
     Salvar Estatísticas no Banco
     ```

6. **Salve o workflow**:
   - Clique em "Save" no canto superior direito

---

### Opção 2: Criar um Novo Workflow (Para Testes)

1. **Abra o N8N**: https://editorn8n.alobexpress.com.br

2. **Crie um novo workflow**:
   - Clique em "Add Workflow" no menu lateral

3. **Importe o arquivo**:
   - Clique nos 3 pontinhos (⋮) no canto superior direito
   - Clique em "Import from File"
   - Selecione o arquivo: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
   - Clique em "Import"

4. **Renomeie o workflow**:
   - Clique no nome do workflow no topo
   - Renomeie para: "Bling Pedido de Venda Automatization - COM LEADS"

5. **Salve o workflow**:
   - Clique em "Save"

---

## 🔍 Verificações Importantes

### 1. Credenciais do Supabase

Verifique se os nós de Supabase estão usando a credencial correta:
- Nó: "Buscar Lead Existente"
- Nó: "Atualizar Lead"
- Nó: "Criar Lead"
- Nó: "Salvar Estatísticas no Banco"

**Credencial esperada**: "Supabase account" (ID: EOF2mckcRi7gWhf0)

Se aparecer erro de credencial:
1. Clique no nó com erro
2. Clique em "Select Credential"
3. Selecione "Supabase account"
4. Salve

### 2. Código JavaScript

Verifique se os nós Code contêm o código correto:

**Nó "Processar Dados do Lead"**:
- Deve ter ~70 linhas de código
- Começa com: `try { console.log('=== PROCESSAR LEAD/CONTATO ===');`

**Nó "Atualizar Estatísticas do Lead"**:
- Deve ter ~60 linhas de código
- Começa com: `try { console.log('=== ATUALIZAR ESTATÍSTICAS DO LEAD ===');`

### 3. Conexões

Verifique visualmente se todas as conexões estão corretas:
- Cada nó deve ter uma linha conectando ao próximo
- O nó "Lead Existe?" deve ter 2 saídas (TRUE e FALSE)
- Ambas as saídas devem convergir em "Atualizar Estatísticas do Lead"

---

## 🧪 Testar o Workflow

### Teste Manual

1. **Ative o workflow**:
   - Toggle no canto superior direito deve estar em "Active"

2. **Execute manualmente**:
   - Clique em "Execute Workflow" no canto superior direito
   - Ou aguarde um pedido real chegar via webhook

3. **Verifique os logs**:
   - Clique em cada nó para ver os dados processados
   - Verifique se não há erros (ícone vermelho ❌)

### Verificar no Banco de Dados

Após executar o workflow, verifique se o lead foi criado:

```sql
-- No Supabase SQL Editor
SELECT 
    name, 
    email, 
    phone,
    document_type,
    document_number,
    total_orders,
    total_spent,
    lead_source,
    created_at
FROM leads
ORDER BY created_at DESC
LIMIT 5;
```

---

## 📊 Novos Nós Adicionados

| # | Nome do Nó | Tipo | Descrição |
|---|------------|------|-----------|
| 1 | Buscar Contato no Bling | HTTP Request | Busca dados completos do contato na API Bling |
| 2 | Processar Dados do Lead | Code (JavaScript) | Extrai e formata dados do contato |
| 3 | Buscar Lead Existente | Supabase (Get All) | Verifica se lead já existe no banco |
| 4 | Lead Existe? | IF | Decide se cria ou atualiza o lead |
| 5A | Atualizar Lead | Supabase (Update) | Atualiza lead existente |
| 5B | Criar Lead | Supabase (Insert) | Cria novo lead |
| 6 | Atualizar Estatísticas do Lead | Code (JavaScript) | Calcula estatísticas de compras |
| 7 | Salvar Estatísticas no Banco | Supabase (Update) | Salva estatísticas no banco |

---

## ⚠️ Possíveis Problemas e Soluções

### Problema 1: Credenciais do Supabase não encontradas

**Solução**:
1. Vá em "Credentials" no menu lateral do N8N
2. Verifique se existe uma credencial "Supabase account"
3. Se não existir, crie uma nova:
   - Name: Supabase account
   - Host: https://oensqhjnxwpcuanozske.supabase.co
   - Service Role Secret: [sua chave service_role]

### Problema 2: Nó "Buscar Contato no Bling" retorna erro 401

**Solução**:
- O token do Bling expirou
- Execute o nó "Schedule Refresh Token" manualmente
- Ou aguarde a renovação automática (a cada 5 horas)

### Problema 3: Erro "Campo não encontrado" no nó Code

**Solução**:
- Verifique se o nó anterior executou com sucesso
- Clique no nó anterior e veja os dados de saída
- Ajuste o código JavaScript se necessário

### Problema 4: Lead não é criado no banco

**Solução**:
1. Verifique se a migração foi aplicada:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'leads';
   ```

2. Verifique os logs do nó "Criar Lead"
3. Veja se há erros de validação (CPF/CNPJ inválido)

---

## 📁 Arquivos Relacionados

- **Workflow Atualizado**: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
- **Código JavaScript Nó 2**: `src/hooks/n8n/code-snippets/processar-lead-contato.js`
- **Código JavaScript Nó 6**: `src/hooks/n8n/code-snippets/atualizar-estatisticas-lead.js`
- **Migração SQL**: `supabase/migrations/20260224_create_leads_table.sql`
- **Documentação Técnica**: `docs/24_IMPLEMENTACAO_LEADS_N8N.md`
- **Guia Rápido**: `GUIA_RAPIDO_IMPLEMENTACAO_LEADS.md`

---

## ✅ Checklist Final

Antes de considerar a implementação completa, verifique:

- [ ] Workflow importado no N8N
- [ ] Credenciais do Supabase configuradas
- [ ] Conexões entre nós verificadas visualmente
- [ ] Workflow ativado (toggle "Active")
- [ ] Teste manual executado com sucesso
- [ ] Lead criado no banco de dados
- [ ] Estatísticas atualizadas corretamente
- [ ] Logs de erro não apresentam problemas

---

## 🎉 Pronto!

Agora seu workflow está completo e pronto para capturar leads automaticamente de cada pedido do Bling!

**O que acontece agora**:
1. Webhook recebe pedido do Bling
2. Sistema busca dados completos do contato
3. Verifica se contato já existe como lead
4. Cria ou atualiza o lead no banco
5. Atualiza estatísticas (total de pedidos, valor gasto)
6. Continua o fluxo normal do pedido

**Benefícios**:
- ✅ Base de leads centralizada
- ✅ Histórico completo de compras
- ✅ Segmentação por canal de venda
- ✅ Dados prontos para marketing
- ✅ Análise de comportamento de clientes
