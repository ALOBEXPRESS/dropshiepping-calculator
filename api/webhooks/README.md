# TikTok Shop Webhook

Webhook endpoint para receber eventos do TikTok Shop.

## 📍 Endpoints

### GET `/api/webhooks/tiktok-shop`
Health check e status da configuração.

**Resposta:**
```json
{
  "ok": true,
  "service": "tiktok-shop-webhook",
  "timestamp": "2026-05-09T...",
  "configured": {
    "appKey": true,
    "appSecret": true,
    "webhookSecret": true
  }
}
```

### POST `/api/webhooks/tiktok-shop`
Recebe eventos do TikTok Shop.

**Headers:**
- `Content-Type: application/json`
- `Authorization: <signature>` (para validação)

**Resposta:**
```json
{
  "success": true,
  "received": true,
  "timestamp": "2026-05-09T..."
}
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione no arquivo `.env` (ou nas configurações do Vercel):

```bash
TIKTOK_SHOP_APP_KEY=your_app_key_here
TIKTOK_SHOP_APP_SECRET=your_app_secret_here
TIKTOK_SHOP_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Obter Credenciais

1. Acesse o [TikTok Shop Partner Center](https://partner.tiktokshop.com/)
2. Vá em **App Management** > **Your App**
3. Copie o **App Key** e **App Secret**
4. Configure o **Webhook URL** para: `https://seu-dominio.vercel.app/api/webhooks/tiktok-shop`
5. Copie o **Webhook Secret** gerado

### 3. Configurar no Vercel

**Via Dashboard:**
1. Acesse seu projeto no Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione as 3 variáveis acima

**Via CLI:**
```bash
vercel env add TIKTOK_SHOP_APP_KEY
vercel env add TIKTOK_SHOP_APP_SECRET
vercel env add TIKTOK_SHOP_WEBHOOK_SECRET
```

## 🧪 Testes

### Teste Local (Health Check)

Após fazer deploy, acesse no navegador:
```
https://seu-dominio.vercel.app/api/webhooks/tiktok-shop
```

### Teste com cURL (POST)

```bash
curl -X POST https://seu-dominio.vercel.app/api/webhooks/tiktok-shop \
  -H "Content-Type: application/json" \
  -H "Authorization: test-signature" \
  -d '{
    "timestamp": 1234567890,
    "type": "ORDER_STATUS_CHANGE",
    "shop_id": "test-shop",
    "data": {
      "order_id": "123456",
      "order_status": "SHIPPED"
    }
  }'
```

### Teste no TikTok Shop Partner Center

1. Acesse **App Management** > **Webhooks**
2. Clique em **Test Webhook**
3. Selecione um tipo de evento
4. Clique em **Send Test**
5. Verifique os logs no Vercel

## 🔐 Validação de Assinatura

A validação de assinatura está **comentada** por padrão para facilitar testes iniciais.

Para ativar a validação:

1. Abra `api/webhooks/tiktok-shop.ts`
2. Descomente o bloco:
```typescript
if (!validateTikTokSignature(rawBody, authHeader)) {
  console.error('❌ Invalid webhook signature');
  return res.status(401).json({
    error: 'Invalid signature',
    message: 'Webhook signature validation failed',
  });
}
```

## 📊 Logs

Os eventos são logados no console do Vercel:

```
📥 TikTok Shop Webhook received: { timestamp, headers, bodyPreview }
📦 TikTok Shop Event: { full event data }
```

Para ver os logs:
```bash
vercel logs
```

Ou acesse o dashboard do Vercel > **Deployments** > **Functions** > **Logs**

## 🚀 Deploy

```bash
# Deploy para produção
vercel --prod

# Deploy para preview
vercel
```

## 📝 Próximos Passos

1. ✅ Testar o endpoint GET no navegador
2. ✅ Configurar as variáveis de ambiente no Vercel
3. ✅ Registrar a URL do webhook no TikTok Shop Partner Center
4. ✅ Enviar um evento de teste
5. ⬜ Implementar processamento específico por tipo de evento
6. ⬜ Ativar validação de assinatura
7. ⬜ Integrar com banco de dados (Supabase)
8. ⬜ Adicionar fila de processamento (se necessário)

## 🔗 Referências

- [TikTok Shop API Documentation](https://partner.tiktokshop.com/docv2)
- [Webhook Events Reference](https://partner.tiktokshop.com/docv2/page/650a99f6715d622c03c1c0c7)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
