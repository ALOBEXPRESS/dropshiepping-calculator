# 🎯 TikTok Shop Webhook - Guia de Configuração

**Data:** 09/05/2026  
**Autor:** Sistema Kiro  
**Status:** ✅ Implementado

---

## 📋 Resumo

Webhook endpoint criado para receber eventos do TikTok Shop em tempo real.

## 📁 Arquivos Criados

```
api/
└── webhooks/
    ├── tiktok-shop.ts           # Handler principal do webhook
    ├── tiktok-shop.types.ts     # Tipos TypeScript
    └── README.md                # Documentação técnica
```

## 🌐 URLs do Webhook

### Produção (após deploy)
```
GET  https://seu-dominio.vercel.app/api/webhooks/tiktok-shop
POST https://seu-dominio.vercel.app/api/webhooks/tiktok-shop
```

### Local (desenvolvimento)
```
GET  http://localhost:5173/api/webhooks/tiktok-shop
POST http://localhost:5173/api/webhooks/tiktok-shop
```

## 🔧 Configuração Passo a Passo

### 1️⃣ Adicionar Variáveis de Ambiente

Edite o arquivo `.env` na raiz do projeto:

```bash
# TikTok Shop API
TIKTOK_SHOP_APP_KEY=seu_app_key_aqui
TIKTOK_SHOP_APP_SECRET=seu_app_secret_aqui
TIKTOK_SHOP_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

⚠️ **IMPORTANTE:** Nunca commite o arquivo `.env` no Git!

### 2️⃣ Obter Credenciais do TikTok Shop

1. Acesse: https://partner.tiktokshop.com/
2. Faça login com sua conta
3. Vá em **App Management** > **Your App**
4. Copie:
   - **App Key** → `TIKTOK_SHOP_APP_KEY`
   - **App Secret** → `TIKTOK_SHOP_APP_SECRET`

### 3️⃣ Configurar Webhook no TikTok Shop

1. No Partner Center, vá em **Webhooks**
2. Clique em **Add Webhook**
3. Cole a URL: `https://seu-dominio.vercel.app/api/webhooks/tiktok-shop`
4. Selecione os eventos que deseja receber:
   - ✅ Order Status Change
   - ✅ Order Cancel
   - ✅ Product Change
   - ✅ Inventory Update
   - (outros conforme necessário)
5. Copie o **Webhook Secret** gerado → `TIKTOK_SHOP_WEBHOOK_SECRET`
6. Clique em **Save**

### 4️⃣ Configurar no Vercel

**Opção A: Via Dashboard**
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** > **Environment Variables**
4. Adicione as 3 variáveis:
   - `TIKTOK_SHOP_APP_KEY`
   - `TIKTOK_SHOP_APP_SECRET`
   - `TIKTOK_SHOP_WEBHOOK_SECRET`
5. Clique em **Save**

**Opção B: Via CLI**
```bash
vercel env add TIKTOK_SHOP_APP_KEY
vercel env add TIKTOK_SHOP_APP_SECRET
vercel env add TIKTOK_SHOP_WEBHOOK_SECRET
```

### 5️⃣ Deploy

```bash
# Deploy para produção
vercel --prod

# Ou apenas
vercel
```

## 🧪 Como Testar

### Teste 1: Health Check (GET)

**No navegador, acesse:**
```
https://seu-dominio.vercel.app/api/webhooks/tiktok-shop
```

**Resposta esperada:**
```json
{
  "ok": true,
  "service": "tiktok-shop-webhook",
  "timestamp": "2026-05-09T18:30:00.000Z",
  "configured": {
    "appKey": true,
    "appSecret": true,
    "webhookSecret": true
  }
}
```

✅ Se `configured` mostrar `true` para todos, está configurado corretamente!

### Teste 2: Enviar Evento de Teste (POST)

**Via cURL:**
```bash
curl -X POST https://seu-dominio.vercel.app/api/webhooks/tiktok-shop \
  -H "Content-Type: application/json" \
  -H "Authorization: test-signature" \
  -d '{
    "timestamp": 1715280000,
    "type": "ORDER_STATUS_CHANGE",
    "shop_id": "test-shop-123",
    "data": {
      "order_id": "ORDER-123456",
      "order_status": "SHIPPED",
      "update_time": 1715280000
    }
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "received": true,
  "timestamp": "2026-05-09T18:30:00.000Z"
}
```

### Teste 3: Via TikTok Shop Partner Center

1. Acesse **App Management** > **Webhooks**
2. Encontre seu webhook configurado
3. Clique em **Test Webhook**
4. Selecione um tipo de evento (ex: `ORDER_STATUS_CHANGE`)
5. Clique em **Send Test**
6. Verifique se recebeu status 200 OK

### Teste 4: Verificar Logs

**Via Vercel Dashboard:**
1. Acesse seu projeto no Vercel
2. Vá em **Deployments**
3. Clique no deployment mais recente
4. Vá em **Functions** > **Logs**
5. Procure por:
   ```
   📥 TikTok Shop Webhook received
   📦 TikTok Shop Event
   ```

**Via CLI:**
```bash
vercel logs --follow
```

## 🔐 Segurança

### Validação de Assinatura

Por padrão, a validação está **desabilitada** para facilitar testes.

Para **ativar** a validação:

1. Abra `api/webhooks/tiktok-shop.ts`
2. Localize o bloco comentado:
```typescript
/*
if (!validateTikTokSignature(rawBody, authHeader)) {
  console.error('❌ Invalid webhook signature');
  return res.status(401).json({
    error: 'Invalid signature',
    message: 'Webhook signature validation failed',
  });
}
*/
```
3. Remova os comentários `/*` e `*/`
4. Faça commit e deploy

### Boas Práticas

✅ **Faça:**
- Sempre valide assinaturas em produção
- Use HTTPS (Vercel já fornece)
- Monitore os logs regularmente
- Responda rapidamente (< 5 segundos)
- Retorne 200 mesmo em erros internos

❌ **Não faça:**
- Expor `APP_SECRET` no frontend
- Processar eventos síncronos muito longos
- Retornar 4xx/5xx para erros internos (TikTok vai retentar)

## 📊 Eventos Suportados

| Evento | Descrição |
|--------|-----------|
| `ORDER_STATUS_CHANGE` | Status do pedido mudou |
| `ORDER_CANCEL` | Pedido cancelado |
| `ORDER_SHIPPED` | Pedido enviado |
| `ORDER_DELIVERED` | Pedido entregue |
| `PRODUCT_CHANGE` | Produto atualizado |
| `PRODUCT_DELETE` | Produto deletado |
| `INVENTORY_UPDATE` | Estoque atualizado |
| `RETURN_REQUEST` | Solicitação de devolução |
| `SHOP_AUTHORIZED` | Loja autorizada |
| `SHOP_DEAUTHORIZED` | Loja desautorizada |

## 🚀 Próximos Passos

- [ ] Testar endpoint GET no navegador
- [ ] Configurar variáveis no Vercel
- [ ] Registrar webhook no TikTok Shop
- [ ] Enviar evento de teste
- [ ] Verificar logs
- [ ] Implementar processamento por tipo de evento
- [ ] Ativar validação de assinatura
- [ ] Integrar com Supabase (salvar eventos)
- [ ] Adicionar fila de processamento (opcional)
- [ ] Configurar alertas de erro

## 📚 Referências

- [TikTok Shop API Docs](https://partner.tiktokshop.com/docv2)
- [Webhook Events](https://partner.tiktokshop.com/docv2/page/650a99f6715d622c03c1c0c7)
- [Vercel Functions](https://vercel.com/docs/functions/serverless-functions)

## 🆘 Troubleshooting

### Erro: "configured: false"
- Verifique se as variáveis estão no Vercel
- Faça redeploy após adicionar variáveis

### Erro: 401 Unauthorized
- Verifique se a validação de assinatura está ativa
- Confirme que o `WEBHOOK_SECRET` está correto

### Erro: Timeout
- Reduza o tempo de processamento
- Use processamento assíncrono (fila)

### Logs não aparecem
- Aguarde alguns segundos (delay normal)
- Verifique se está olhando o deployment correto
- Use `vercel logs --follow` para tempo real

---

**✅ Webhook criado com sucesso!**

Para testar agora, acesse no navegador:
```
https://seu-dominio.vercel.app/api/webhooks/tiktok-shop
```
