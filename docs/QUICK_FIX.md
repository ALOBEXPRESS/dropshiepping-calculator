# 🚀 Quick Fix: Produtos em Produção

## ⚡ Ação Imediata (3 passos)

### 1️⃣ Configurar Variáveis na Vercel

Acesse: https://vercel.com/empresaalobs-projects/dropshiepping-calculator/settings/environment-variables

Adicione estas 2 variáveis para **todos os ambientes**:

```
Nome: VITE_SUPABASE_URL
Valor: https://oensqhjnxwpcuanozske.supabase.co

Nome: VITE_SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTMyNzIsImV4cCI6MjA4MTk4OTI3Mn0.msBzSx-6KOSLP3YLALIy7vPM17fT1PV9uv8zJ_8LRZA
```

### 2️⃣ Fazer Redeploy

**Via Dashboard:**
- Vá em Deployments
- Clique nos 3 pontos do último deploy
- Clique em "Redeploy"

**OU via CLI:**
```bash
vercel --prod
```

### 3️⃣ Testar

1. Acesse: https://dropshiepping-calculator.vercel.app
2. Faça login
3. Verifique se produtos carregam

## ✅ O que foi corrigido

- ✅ Políticas RLS do Supabase atualizadas
- ✅ 8 tabelas agora permitem leitura pública:
  - `products`
  - `products_bling`
  - `bling_order_items`
  - `organizations`
  - `marketplaces`
  - `products_variations_bling`
  - `account_holders` ← NOVO
  - `suppliers` ← NOVO
- ✅ Escrita continua restrita a usuários autenticados
- ✅ Dados não são mais perdidos entre navegações

## 📖 Documentação Completa

Se precisar de mais detalhes:

- **Guia de variáveis:** `docs/deploy/VERIFICAR_VARIAVEIS_AMBIENTE_VERCEL.md`
- **Checklist completo:** `docs/deploy/CHECKLIST_DEPLOY_PRODUCAO.md`
- **Análise técnica:** `docs/correcoes/CORRECAO_PRODUTOS_NAO_CARREGAM_PRODUCAO.md`
- **Resumo executivo:** `docs/deploy/RESUMO_CORRECAO_PRODUCAO.md`

## 🐛 Problemas?

Execute o script de verificação:
```bash
bash scripts/verify-production.sh
```

---

**Tempo estimado:** 15 minutos  
**Última atualização:** 14/03/2026
