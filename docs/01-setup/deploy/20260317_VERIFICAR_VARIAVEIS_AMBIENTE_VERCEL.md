# Guia: Verificar e Configurar Variáveis de Ambiente na Vercel

## Variáveis Necessárias

Para que a aplicação funcione corretamente em produção, as seguintes variáveis de ambiente devem estar configuradas na Vercel:

```env
VITE_SUPABASE_URL=https://oensqhjnxwpcuanozske.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTMyNzIsImV4cCI6MjA4MTk4OTI3Mn0.msBzSx-6KOSLP3YLALIy7vPM17fT1PV9uv8zJ_8LRZA
```

## Como Configurar na Vercel

### Passo 1: Acessar o Projeto
1. Acesse https://vercel.com
2. Faça login com sua conta
3. Selecione o projeto `dropshiepping-calculator`

### Passo 2: Acessar Configurações
1. Clique em **Settings** no menu superior
2. No menu lateral, clique em **Environment Variables**

### Passo 3: Adicionar Variáveis
Para cada variável:

1. **Nome da Variável:** `VITE_SUPABASE_URL`
   - **Valor:** `https://oensqhjnxwpcuanozske.supabase.co`
   - **Ambientes:** Marque todos (Production, Preview, Development)
   - Clique em **Save**

2. **Nome da Variável:** `VITE_SUPABASE_ANON_KEY`
   - **Valor:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTMyNzIsImV4cCI6MjA4MTk4OTI3Mn0.msBzSx-6KOSLP3YLALIy7vPM17fT1PV9uv8zJ_8LRZA`
   - **Ambientes:** Marque todos (Production, Preview, Development)
   - Clique em **Save**

### Passo 4: Fazer Redeploy
Após adicionar as variáveis:

1. Vá para a aba **Deployments**
2. Clique nos três pontos (...) do último deployment
3. Selecione **Redeploy**
4. Confirme o redeploy

**OU**

Execute no terminal:
```bash
vercel --prod
```

## Verificação

Após o redeploy, verifique se tudo está funcionando:

### 1. Verificar Variáveis no Build Log
1. Acesse o deployment na Vercel
2. Clique em **View Function Logs** ou **Build Logs**
3. Procure por mensagens relacionadas ao Supabase
4. Não deve haver avisos sobre variáveis faltando

### 2. Testar Login
1. Acesse https://dropshiepping-calculator.vercel.app
2. Deve redirecionar para `/login`
3. Faça login com credenciais válidas
4. Deve redirecionar para a calculadora

### 3. Verificar Console do Navegador
1. Abra o DevTools (F12)
2. Vá para a aba Console
3. Não deve haver erros 403 do Supabase
4. Não deve haver avisos sobre variáveis de ambiente

### 4. Testar Carregamento de Produtos
1. Após fazer login, acesse a calculadora
2. Os produtos devem carregar na lista
3. Ao clicar em "Preencher", os dados devem ser carregados

## Problemas Comuns

### Erro: "Supabase credentials not found"
**Causa:** Variáveis de ambiente não configuradas ou com nomes incorretos

**Solução:**
- Verifique se os nomes estão exatamente como: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Certifique-se de que começam com `VITE_` (obrigatório para Vite)
- Faça um novo deploy após adicionar

### Erro 403 do Supabase
**Causa:** Chave anon incorreta ou expirada

**Solução:**
- Verifique se a chave está correta
- Acesse o Supabase Dashboard > Settings > API
- Copie a chave `anon` novamente
- Atualize na Vercel

### Login não funciona
**Causa:** Usuário não cadastrado ou sem acesso à organização

**Solução:**
1. Verifique se o usuário existe em `auth.users`
2. Verifique se há registro em `organization_members`
3. Se necessário, cadastre o usuário:

```sql
-- Verificar usuários
SELECT id, email FROM auth.users;

-- Verificar membros da organização
SELECT * FROM organization_members;

-- Adicionar usuário à organização (se necessário)
INSERT INTO organization_members (user_id, organization_id, role)
VALUES ('USER_ID_AQUI', 'ORG_ID_AQUI', 'admin');
```

## Segurança

### ⚠️ IMPORTANTE: Não Commitar Variáveis Sensíveis

O arquivo `.env` está no `.gitignore` e **NÃO DEVE** ser commitado ao Git.

**Arquivos seguros para commitar:**
- `.env.example` - Template sem valores reais
- Documentação com instruções

**Arquivos que NÃO devem ser commitados:**
- `.env` - Contém valores reais
- Qualquer arquivo com chaves ou tokens

### Rotação de Chaves

Se você suspeitar que a chave `anon` foi exposta:

1. Acesse Supabase Dashboard
2. Vá em Settings > API
3. Clique em "Reset" na chave anon
4. Copie a nova chave
5. Atualize na Vercel
6. Faça um novo deploy

## Comandos Úteis

### Verificar variáveis localmente
```bash
# Ver variáveis do ambiente local
cat .env

# Verificar se Vite está lendo as variáveis
npm run dev
# Abra o console e digite: import.meta.env
```

### Verificar variáveis na Vercel (CLI)
```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Login
vercel login

# Listar variáveis
vercel env ls

# Adicionar variável
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

## Checklist Final

Antes de considerar a configuração completa, verifique:

- [ ] Variáveis adicionadas na Vercel
- [ ] Ambientes corretos selecionados (Production, Preview, Development)
- [ ] Redeploy realizado
- [ ] Login funciona em produção
- [ ] Produtos carregam após login
- [ ] Sem erros no console do navegador
- [ ] Sem avisos sobre variáveis faltando

## Suporte

Se após seguir todos os passos ainda houver problemas:

1. Verifique os logs de build na Vercel
2. Verifique os logs de função (Function Logs)
3. Teste localmente com `npm run build && npm run preview`
4. Compare o comportamento local vs produção

## Data de Criação

14 de março de 2026
