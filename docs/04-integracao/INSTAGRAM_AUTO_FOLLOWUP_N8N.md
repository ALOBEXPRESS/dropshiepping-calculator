# Instagram Auto Follow-up - n8n Workflow

**Data:** 16/05/2026  
**Workflow:** Instagram Comment → Resposta + DM c/ Botões

---

## 📋 Fluxo

```
Webhook recebe comentário
    ↓
Filtra: post específico + palavra "auto" + não é própria conta
    ↓
Responde comentário: "Veja sua DM 📩"
    ↓
Aguarda 2s
    ↓
Envia DM texto: "Faaala Ninja, vi que você teve interesse..."
    ↓
Aguarda 3s
    ↓
Envia DM c/ botões: "Comprar Agora" + "Saiba Mais!"
    ↓
Retorna sucesso
```

## 🔧 Variáveis n8n

Configure em **Settings → Variables**:

```
FACEBOOK_ACCESS_TOKEN = seu_token_facebook_app
INSTAGRAM_ID = seu_instagram_business_id
INSTAGRAM_USERNAME = seu_username_instagram
EVOLUTION_BASE_URL = https://evolutionlxb.alobexpress.com.br
EVOLUTION_API_KEY = de5a6633da854e8fafe16e12a17d13eb113710fa1a320810d5c0a9a7f0c6a8ee
EVOLUTION_INSTANCE = nome_da_instancia
```

## 📥 Webhook Config

**URL Produção:**
```
https://hookn8n.alobexpress.com.br/webhook/alobexpress-followup-958
```

**Método:** POST

**Payload esperado (Instagram):**
```json
{
  "media_id": "17890986135472458",
  "comment_id": "123456789",
  "text": "Quero auto",
  "from": {
    "id": "instagram_user_id",
    "username": "usuario_instagram"
  }
}
```

## 🎯 Filtros Aplicados

1. **Post específico:** `media_id = 17890986135472458`
2. **Palavra-chave:** comentário contém "auto" (case-insensitive)
3. **Exclui própria conta:** `from.username ≠ INSTAGRAM_USERNAME`

## 📱 Mensagens

### Resposta no Comentário
```
Veja sua DM 📩
```

### DM - Texto inicial
```
Faaala Ninja, vi que você teve interesse no Automação na Prática
```

### DM - Botões
```
Escolha uma opção:
🛒 Comprar Agora
🎯 Saiba Mais!
```

## 🔗 APIs Usadas

### 1. Facebook Graph API (responder comentário)
```
POST https://graph.facebook.com/v18.0/{comment_id}/replies
Query params:
  - access_token
  - message
```

### 2. Evolution API (enviar DM)

**Texto:**
```
POST {EVOLUTION_BASE_URL}/message/sendText/{INSTANCE}
Headers:
  - apikey: {EVOLUTION_API_KEY}
Body:
  - number: instagram_user_id
  - text: mensagem
  - options: { delay: 1200 }
```

**Botões:**
```
POST {EVOLUTION_BASE_URL}/message/sendButtons/{INSTANCE}
Headers:
  - apikey: {EVOLUTION_API_KEY}
Body:
  - number: instagram_user_id
  - buttonMessage:
      text: "Escolha uma opção:"
      buttons: [...]
  - options: { delay: 1200 }
```

## 🧪 Teste Manual

### 1. Simular webhook Instagram

```bash
curl -X POST https://hookn8n.alobexpress.com.br/webhook/alobexpress-followup-958 \
  -H "Content-Type: application/json" \
  -d '{
    "media_id": "17890986135472458",
    "comment_id": "test_comment_123",
    "text": "Quero auto",
    "from": {
      "id": "test_user_id",
      "username": "test_user"
    }
  }'
```

### 2. Verificar execução n8n

Dashboard → Executions → ver logs

### 3. Conferir

- ✅ Comentário respondido no Instagram
- ✅ DM texto enviado
- ✅ DM botões enviado

## ⚠️ Troubleshooting

### Filtro não passa

**Causa:** Palavra "auto" não encontrada ou post errado

**Fix:** Verifica `media_id` e texto comentário (case-insensitive)

### Erro responder comentário

**Causa:** Token Facebook expirado ou sem permissão

**Fix:** Renova token, verifica scopes: `instagram_basic`, `instagram_manage_comments`

### Erro enviar DM

**Causa:** Evolution API key inválida ou instância offline

**Fix:** Testa Evolution API:
```bash
curl -X GET {EVOLUTION_BASE_URL}/instance/fetchInstances \
  -H "apikey: {EVOLUTION_API_KEY}"
```

### Botões não aparecem

**Causa:** WhatsApp não suporta botões (versão antiga) ou número inválido

**Fix:** Usa WhatsApp Business API oficial ou testa c/ outro número

## 🚀 Deploy

1. Importa workflow no n8n
2. Configura variáveis
3. Ativa workflow
4. Configura webhook Instagram → n8n URL
5. Testa c/ comentário real

## 📊 Métricas

Monitor no n8n:

- Taxa sucesso execuções
- Tempo médio resposta
- Erros por tipo (API, filtro, timeout)

## 🔐 Segurança

- ✅ Tokens em variáveis n8n (não hardcode)
- ✅ Webhook URL única (dificulta spam)
- ✅ Filtro exclui própria conta (evita loop)
- ⚠️ Considera rate limit Instagram (max 200 req/hora)

## 📝 Próximos Passos

- [ ] Adiciona validação signature Instagram webhook
- [ ] Salva leads em Supabase
- [ ] Adiciona analytics (conversão comentário → compra)
- [ ] Cria variações mensagem (A/B test)
- [ ] Adiciona fallback se Evolution API falhar

---

**Workflow criado!** Importa JSON no n8n e configura vars.
