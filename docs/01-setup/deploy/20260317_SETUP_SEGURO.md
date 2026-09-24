# 🔐 GUIA DE SETUP SEGURO

Este guia explica como configurar o projeto de forma segura, sem expor credenciais.

---

## 📋 PRÉ-REQUISITOS

- Node.js 18+ e pnpm instalados
- Conta Supabase ativa
- Conta N8N configurada
- Conta Bling (para integração)

---

## 🚀 SETUP INICIAL

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd dropshipping-calculator-app
```

### 2. Instale as Dependências

```bash
pnpm install
```

### 3. Configure as Variáveis de Ambiente

```bash
# Copie o template
cp .env.example .env

# Edite o arquivo .env com suas credenciais
# NUNCA commite este arquivo!
```

**Conteúdo do `.env`:**
```env
VITE_SUPABASE_URL=https://oensqhjnxwpcuanozske.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

**Onde encontrar as keys:**
1. Acesse: https://supabase.com/dashboard/project/oensqhjnxwpcuanozske/settings/api
2. Copie a `URL` e a `anon public` key
3. ⚠️ **NUNCA use a Service Role Key no frontend!**

---

## 🔧 CONFIGURAÇÃO DO N8N

### 1. Variáveis de Ambiente no N8N

Configure estas variáveis no N8N (Settings → Environment Variables):

```
SUPABASE_URL=https://oensqhjnxwpcuanozske.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
BLING_CLIENT_ID=seu_client_id_aqui
BLING_CLIENT_SECRET=seu_client_secret_aqui
```

### 2. Importar Workflows

Os workflows N8N estão documentados em `src/hooks/n8n/INSTRUCOES_N8N_BLING.md`.

**IMPORTANTE:** 
- ❌ Não commite os arquivos JSON dos workflows
- ✅ Use variáveis de ambiente do N8N
- ✅ Documente mudanças em Markdown

### 3. Configurar Credenciais no N8N

1. Acesse N8N → Credentials
2. Adicione credencial "Supabase API":
   - URL: `https://oensqhjnxwpcuanozske.supabase.co`
   - Service Role Key: (da variável de ambiente)
3. Adicione credencial "Bling OAuth2":
   - Client ID: (da variável de ambiente)
   - Client Secret: (da variável de ambiente)

---

## 🗄️ CONFIGURAÇÃO DO SUPABASE

### 1. Aplicar Migrações

```bash
# Se você tem acesso ao Supabase CLI
supabase db push

# Ou aplique manualmente via Dashboard:
# https://supabase.com/dashboard/project/oensqhjnxwpcuanozske/editor
```

### 2. Verificar RLS (Row Level Security)

Certifique-se de que RLS está habilitado em todas as tabelas:

```sql
-- Verificar RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 3. Configurar Políticas RLS

As políticas já estão nas migrações, mas verifique:
- `products`: Usuários autenticados podem ler/escrever seus próprios produtos
- `bling_orders`: Apenas leitura para usuários autenticados
- `leads`: Acesso baseado em organization_id

---

## 🔐 INTEGRAÇÃO BLING

### 1. Obter Credenciais OAuth

1. Acesse: https://developer.bling.com.br/
2. Crie uma aplicação
3. Copie Client ID e Client Secret
4. Configure Redirect URI: `http://localhost:5173/auth/callback`

### 2. Primeiro Acesso (Obter Tokens)

```bash
# Execute o workflow "Bling - Obter Token Inicial" no N8N
# Isso irá:
# 1. Redirecionar para autorização Bling
# 2. Obter access_token e refresh_token
# 3. Salvar na tabela bling_tokens
```

### 3. Refresh Automático

O workflow "Bling Atualizar Token" roda automaticamente a cada 5 horas.

---

## 🧪 TESTAR A APLICAÇÃO

### 1. Modo Desenvolvimento

```bash
pnpm dev
```

Acesse: http://localhost:5173

### 2. Build de Produção

```bash
pnpm build
pnpm preview
```

### 3. Executar Testes

```bash
# Testes unitários
pnpm test

# Testes E2E (Playwright)
pnpm test:e2e
```

---

## 📁 ESTRUTURA DE ARQUIVOS SENSÍVEIS

```
dropshipping-calculator-app/
├── .env                          # ❌ NUNCA COMMITAR (local only)
├── .env.example                  # ✅ Template seguro
├── .gitignore                    # ✅ Configurado corretamente
├── apikeyn8n.md                  # ❌ DELETAR (não deve existir)
├── secretsbling.md               # ❌ DELETAR (não deve existir)
├── .kiro/
│   ├── security/                 # ❌ NUNCA COMMITAR
│   │   └── apikeyPostman.txt     # ❌ DELETAR
│   └── steering/                 # ✅ Pode commitar
└── src/
    └── hooks/
        └── n8n/
            ├── workflows/        # ❌ NUNCA COMMITAR JSONs
            ├── code-snippets/    # ✅ Apenas código JS
            └── INSTRUCOES_N8N_BLING.md  # ✅ Documentação
```

---

## 🚨 CHECKLIST DE SEGURANÇA

Antes de fazer push para GitHub:

- [ ] Arquivo `.env` está no `.gitignore`
- [ ] Não existem arquivos `apikeyn8n.md`, `secretsbling.md`
- [ ] Workflows N8N não contêm credenciais hardcoded
- [ ] `.gitignore` está atualizado
- [ ] `.env.example` não contém valores reais
- [ ] Service Role Key não está no código
- [ ] Tokens Bling não estão no código
- [ ] Executei `git status` e verifiquei que nenhum arquivo sensível será commitado

---

## 🔄 ROTAÇÃO DE CREDENCIAIS

### Quando Rotacionar:

- ✅ A cada 90 dias (recomendado)
- ✅ Quando um membro da equipe sai
- ✅ Após suspeita de vazamento
- ✅ Após incidente de segurança

### Como Rotacionar:

#### Supabase Service Role Key:
1. Acesse: https://supabase.com/dashboard/project/oensqhjnxwpcuanozske/settings/api
2. Clique em "Generate new Service Role Key"
3. Atualize no N8N (variáveis de ambiente)
4. Teste workflows
5. Revogue a key antiga

#### Bling OAuth:
1. Acesse: https://developer.bling.com.br/
2. Gere novas credenciais
3. Atualize no N8N
4. Execute workflow "Obter Token Inicial"
5. Revogue credenciais antigas

#### N8N API Token:
1. Acesse N8N → Settings → API
2. Revogue token antigo
3. Gere novo token
4. Atualize onde necessário

---

## 📞 SUPORTE

Se você encontrar problemas de segurança:

1. **NÃO** abra issue pública no GitHub
2. Entre em contato diretamente com a equipe
3. Relate o problema de forma privada

---

## 📚 RECURSOS ADICIONAIS

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [N8N Security](https://docs.n8n.io/hosting/security/)
- [Bling API Documentation](https://developer.bling.com.br/docs)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Última atualização:** 07/03/2026  
**Mantido por:** Equipe de Desenvolvimento
