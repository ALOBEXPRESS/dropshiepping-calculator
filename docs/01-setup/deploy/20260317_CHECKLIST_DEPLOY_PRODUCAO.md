# Checklist: Deploy em Produção (Vercel)

## ✅ Pré-requisitos

Antes de fazer o deploy, certifique-se de que:

- [ ] Código está commitado no Git
- [ ] Todas as alterações foram testadas localmente
- [ ] Build local funciona sem erros (`npm run build`)
- [ ] Arquivo `.env` existe localmente (mas NÃO está no Git)

## 🔧 Configuração na Vercel

### 1. Variáveis de Ambiente

Acesse: https://vercel.com/empresaalobs-projects/dropshiepping-calculator/settings/environment-variables

Adicione as seguintes variáveis para **todos os ambientes** (Production, Preview, Development):

- [ ] `VITE_SUPABASE_URL`
  - Valor: `https://oensqhjnxwpcuanozske.supabase.co`
  
- [ ] `VITE_SUPABASE_ANON_KEY`
  - Valor: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTMyNzIsImV4cCI6MjA4MTk4OTI3Mn0.msBzSx-6KOSLP3YLALIy7vPM17fT1PV9uv8zJ_8LRZA`

### 2. Configurações do Projeto

Verifique em Settings > General:

- [ ] Framework Preset: **Vite**
- [ ] Build Command: `npm run build` ou `vite build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`
- [ ] Node.js Version: **18.x** ou superior

## 🚀 Deploy

### Opção A: Via Vercel Dashboard

1. [ ] Acesse a aba **Deployments**
2. [ ] Clique nos três pontos (...) do último deployment
3. [ ] Selecione **Redeploy**
4. [ ] Aguarde o build completar (2-5 minutos)

### Opção B: Via Git Push

1. [ ] Commit suas alterações: `git add . && git commit -m "fix: correção de produção"`
2. [ ] Push para o repositório: `git push origin main`
3. [ ] Vercel fará o deploy automaticamente

### Opção C: Via Vercel CLI

```bash
# Instalar CLI (se necessário)
npm i -g vercel

# Login
vercel login

# Deploy para produção
vercel --prod
```

## 🧪 Testes Pós-Deploy

### 1. Verificar Build

- [ ] Build completou sem erros
- [ ] Não há avisos sobre variáveis faltando
- [ ] Tempo de build foi razoável (< 5 minutos)

### 2. Testar Acesso ao Site

Acesse: https://dropshiepping-calculator.vercel.app

- [ ] Site carrega sem erros
- [ ] Redireciona para `/login`
- [ ] Página de login aparece corretamente

### 3. Testar Autenticação

- [ ] Fazer login com credenciais válidas
- [ ] Login é bem-sucedido
- [ ] Redireciona para a calculadora (`/`)
- [ ] Não há erros no console do navegador (F12)

### 4. Testar Funcionalidades

#### Calculadora
- [ ] Produtos aparecem na lista "Produtos integrados"
- [ ] Botão "Preencher" funciona
- [ ] Dados do produto são carregados corretamente
- [ ] Cálculos funcionam

#### Página de Produtos
- [ ] Acesse `/produtos`
- [ ] Lista de produtos carrega
- [ ] Filtros funcionam
- [ ] Busca funciona

#### Página de Vendas
- [ ] Acesse `/vendas`
- [ ] Dashboard carrega
- [ ] Gráficos aparecem
- [ ] Dados são exibidos

#### Página de Leads
- [ ] Acesse `/leads`
- [ ] Lista de leads carrega
- [ ] Filtros funcionam

### 5. Verificar Console do Navegador

Abra DevTools (F12) > Console:

- [ ] Sem erros 403 do Supabase
- [ ] Sem avisos sobre variáveis de ambiente
- [ ] Sem erros de CORS
- [ ] Sem erros de autenticação

### 6. Verificar Network

Abra DevTools (F12) > Network:

- [ ] Requisições para Supabase retornam 200
- [ ] Não há requisições falhando (4xx, 5xx)
- [ ] Tempo de resposta é aceitável (< 2s)

## 🐛 Troubleshooting

### Problema: "Supabase credentials not found"

**Solução:**
1. Verifique se as variáveis estão na Vercel
2. Certifique-se de que começam com `VITE_`
3. Faça um novo deploy

### Problema: Erro 403 do Supabase

**Solução:**
1. Verifique se a chave `VITE_SUPABASE_ANON_KEY` está correta
2. Verifique se as políticas RLS foram aplicadas
3. Execute as migrações do Supabase

### Problema: Login não funciona

**Solução:**
1. Verifique se o usuário existe em `auth.users`
2. Verifique se há registro em `organization_members`
3. Teste localmente primeiro

### Problema: Produtos não carregam

**Solução:**
1. Verifique se as políticas RLS foram aplicadas
2. Verifique se há produtos na tabela `products`
3. Verifique o console do navegador para erros

## 📊 Monitoramento

### Logs da Vercel

Acesse: https://vercel.com/empresaalobs-projects/dropshiepping-calculator

- [ ] Verificar **Function Logs** para erros em tempo real
- [ ] Verificar **Build Logs** para problemas de build
- [ ] Configurar alertas para erros críticos

### Analytics

- [ ] Verificar tempo de carregamento
- [ ] Verificar taxa de erro
- [ ] Monitorar uso de recursos

## 🔄 Rollback (Se Necessário)

Se algo der errado:

1. [ ] Acesse Deployments na Vercel
2. [ ] Encontre o último deployment funcional
3. [ ] Clique em **Promote to Production**
4. [ ] Investigue o problema antes de tentar novamente

## 📝 Documentação

Após deploy bem-sucedido:

- [ ] Atualizar `CHANGELOG.md` com as mudanças
- [ ] Documentar problemas encontrados
- [ ] Atualizar versão no `package.json`
- [ ] Criar tag no Git: `git tag v0.8.1 && git push --tags`

## ✅ Checklist Final

Antes de considerar o deploy completo:

- [ ] Todas as variáveis configuradas
- [ ] Deploy realizado com sucesso
- [ ] Todos os testes passaram
- [ ] Sem erros no console
- [ ] Funcionalidades principais testadas
- [ ] Documentação atualizada
- [ ] Equipe notificada

## 🎉 Deploy Completo!

Se todos os itens acima estão marcados, o deploy está completo e a aplicação está funcionando em produção!

---

**Última atualização:** 14 de março de 2026
**Versão:** 0.8.0
