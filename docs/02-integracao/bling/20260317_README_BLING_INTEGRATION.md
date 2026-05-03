# 🔄 Sistema de Integração de Pedidos Bling

Sistema completo de sincronização automática de pedidos de venda do Bling ERP com o banco de dados Supabase.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [API Reference](#api-reference)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este sistema automatiza a sincronização de pedidos de venda do Bling para o banco de dados, incluindo:

- ✅ Sincronização automática via webhooks
- ✅ Mapeamento de produtos Bling → Produtos locais
- ✅ Identificação automática de canais de venda
- ✅ Atualização de contadores de vendas por marketplace
- ✅ Logs completos de sincronização
- ✅ Tratamento de erros e retry automático
- ✅ Suporte a 7 canais de venda diferentes

### Canais de Venda Suportados

| ID Loja | Nome | Marketplace | Tipo Conta | Titular |
|---------|------|-------------|------------|---------|
| 205833031 | MercadoLivre | MercadoLivre | CPF | Alyson |
| 205785487 | TikTok Shop | TikTok | CNPJ | Alyson |
| 205835012 | MercadoLivre Conta II | MercadoLivre | CNPJ | Alyson |
| 205852755 | Shopee | Shopee | CPF | Alyson |
| 205889400 | Shopee Conta 2 | Shopee | CPF | Jonatan |
| 205899802 | Facebook | Facebook | CPF | Jonatan |
| 205836967 | Site (Wordpress) | Site | CPF | Emelyn |

---

## 🏗️ Arquitetura

### Fluxo de Dados

```
┌─────────────┐
│   Bling     │
│   Webhook   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     n8n     │
│  Workflow   │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│  Supabase   │◄────►│ TypeScript   │
│  Database   │      │   Service    │
└─────────────┘      └──────────────┘
```

### Componentes

1. **Webhook Bling** → Recebe eventos de pedidos
2. **n8n Workflow** → Processa e transforma dados
3. **TypeScript Service** → Lógica de negócio e validações
4. **Supabase** → Persistência e queries

### Tabelas do Banco de Dados

```sql
sales_channels          -- Canais de venda (lojas)
bling_orders            -- Pedidos principais
bling_order_items       -- Itens dos pedidos
bling_order_installments -- Parcelas
bling_sync_logs         -- Logs de sincronização
```

---

## 🚀 Instalação

### 1. Executar Migration

```bash
# Aplicar migration no Supabase
supabase db push
```

Ou execute manualmente o arquivo:
```bash
psql -h db.oensqhjnxwpcuanozske.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/20260221_create_bling_orders_tables.sql
```

### 2. Importar Workflow n8n

1. Acesse seu n8n
2. Vá em **Workflows** → **Import from File**
3. Selecione `src/hooks/n8n/Bling_Pedido_Venda_Complete.json`
4. Ative o workflow

### 3. Configurar Credenciais

No n8n, configure:
- **Supabase API**: URL e Service Role Key
- **Bling OAuth**: Client ID e Client Secret

---

## ⚙️ Configuração

### 1. Webhook do Bling

Configure o webhook no Bling para apontar para:
```
https://hookn8n.alobexpress.com.br/webhook/alobexpressmanager
```

Eventos a monitorar:
- `order.created`
- `order.updated`
- `order.deleted`

### 2. Tokens do Bling

O sistema gerencia automaticamente os tokens OAuth2:

- **Access Token**: Renovado automaticamente a cada 5 horas
- **Refresh Token**: Armazenado no banco de dados
- **Expires At**: Calculado automaticamente

### 3. Variáveis de Ambiente

Não são necessárias variáveis de ambiente. Tudo é gerenciado pelo Supabase.

---

## 📖 Uso

### Processamento Automático

O sistema funciona automaticamente quando:

1. Um pedido é criado no Bling
2. Um pedido é atualizado no Bling
3. Um pedido é deletado no Bling

### Uso Programático

```typescript
import { processBlingWebhook } from '@/services/blingOrderService';

// Processar webhook manualmente
const result = await processBlingWebhook(webhookPayload, organizationId);

if (result.success) {
  console.log('Pedido sincronizado:', result.orderId);
} else {
  console.error('Erro:', result.error);
}
```

### Consultas

```typescript
import {
  getOrdersByDateRange,
  getOrdersByChannel,
  getProductSalesStats,
} from '@/services/blingOrderService';

// Buscar pedidos por período
const orders = await getOrdersByDateRange(
  organizationId,
  '2026-02-01',
  '2026-02-28'
);

// Buscar pedidos por canal
const mlOrders = await getOrdersByChannel(organizationId, 'MercadoLivre');

// Estatísticas de vendas de um produto
const stats = await getProductSalesStats(organizationId, productId);
```

---

## 📚 API Reference

### `processBlingWebhook(webhook, organizationId)`

Processa um webhook do Bling e sincroniza o pedido.

**Parâmetros:**
- `webhook: BlingWebhookPayload` - Payload do webhook
- `organizationId: string` - UUID da organização

**Retorna:**
```typescript
{
  success: boolean;
  orderId?: string;
  error?: string;
}
```

### `getOrdersByDateRange(organizationId, startDate, endDate)`

Busca pedidos por período.

**Parâmetros:**
- `organizationId: string` - UUID da organização
- `startDate: string` - Data inicial (YYYY-MM-DD)
- `endDate: string` - Data final (YYYY-MM-DD)

**Retorna:** Array de pedidos com itens e parcelas

### `getOrdersByChannel(organizationId, marketplace)`

Busca pedidos por canal de venda.

**Parâmetros:**
- `organizationId: string` - UUID da organização
- `marketplace: string` - Nome do marketplace

**Retorna:** Array de pedidos do canal especificado

### `getProductSalesStats(organizationId, productId)`

Busca estatísticas de vendas de um produto.

**Parâmetros:**
- `organizationId: string` - UUID da organização
- `productId: string` - UUID do produto

**Retorna:** Estatísticas de vendas por canal

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm run test

# Apenas testes do serviço de pedidos
npm run test blingOrderService

# Com coverage
npm run test -- --coverage
```

### Testes Incluídos

- ✅ Mapeamento de canais de venda
- ✅ Processamento de webhooks
- ✅ Validação de dados
- ✅ Mapeamento de produtos
- ✅ Atualização de contadores
- ✅ Tratamento de erros

### Teste Manual

Use o arquivo `httprequestoutput.json` como exemplo:

```bash
curl -X POST https://hookn8n.alobexpress.com.br/webhook/alobexpressmanager \
  -H "Content-Type: application/json" \
  -d @src/hooks/n8n/httprequestoutput.json
```

---

## 🔧 Troubleshooting

### Problema: Token Expirado

**Sintoma:** Erro "Token do Bling expirado"

**Solução:**
1. Verifique a tabela `bling_tokens`
2. Execute manualmente o workflow de refresh token
3. Verifique se o `expires_at` está correto

```sql
SELECT * FROM bling_tokens ORDER BY updated_at DESC LIMIT 1;
```

### Problema: Pedido Não Sincronizado

**Sintoma:** Webhook recebido mas pedido não aparece no banco

**Solução:**
1. Verifique os logs de sincronização:
```sql
SELECT * FROM bling_sync_logs 
WHERE bling_order_id = 25134184137 
ORDER BY processed_at DESC;
```

2. Verifique o status:
```sql
SELECT sync_status, sync_error 
FROM bling_orders 
WHERE bling_order_id = 25134184137;
```

3. Reprocesse manualmente se necessário

### Problema: Produto Não Mapeado

**Sintoma:** `product_id` é NULL nos itens

**Solução:**
1. Verifique se o produto existe no `products_bling`:
```sql
SELECT * FROM products_bling WHERE sku = 'ALOB0002';
```

2. Verifique se existe no `products`:
```sql
SELECT * FROM products WHERE sku = 'ALOB0002';
```

3. Crie o mapeamento se necessário

### Problema: Canal de Venda Não Identificado

**Sintoma:** Erro "Canal de venda não mapeado"

**Solução:**
1. Verifique o ID da loja no webhook
2. Adicione o mapeamento em `STORE_ID_MAPPING`
3. Insira na tabela `sales_channels`

```sql
INSERT INTO sales_channels (bling_store_id, name, marketplace, account_type, account_holder, organization_id)
VALUES (205999999, 'Nova Loja', 'Marketplace', 'CPF', 'Titular', 'org-id');
```

---

## 📊 Monitoramento

### Queries Úteis

**Pedidos sincronizados hoje:**
```sql
SELECT COUNT(*) FROM bling_orders 
WHERE DATE(created_at) = CURRENT_DATE;
```

**Taxa de sucesso de sincronização:**
```sql
SELECT 
  status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM bling_sync_logs
WHERE DATE(processed_at) = CURRENT_DATE
GROUP BY status;
```

**Vendas por canal (últimos 30 dias):**
```sql
SELECT 
  sc.marketplace,
  COUNT(bo.id) as total_orders,
  SUM(bo.total_amount) as total_revenue
FROM bling_orders bo
JOIN sales_channels sc ON bo.sales_channel_id = sc.id
WHERE bo.order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY sc.marketplace
ORDER BY total_revenue DESC;
```

**Produtos mais vendidos:**
```sql
SELECT 
  p.name,
  SUM(boi.quantity) as total_quantity,
  SUM(boi.total_value) as total_revenue
FROM bling_order_items boi
JOIN products p ON boi.product_id = p.id
JOIN bling_orders bo ON boi.order_id = bo.id
WHERE bo.order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.name
ORDER BY total_quantity DESC
LIMIT 10;
```

---

## 🔐 Segurança

- ✅ Tokens armazenados criptografados no Supabase
- ✅ Webhook com validação de assinatura (X-Bling-Signature-256)
- ✅ RLS (Row Level Security) habilitado em todas as tabelas
- ✅ Logs de auditoria completos
- ✅ Acesso via Service Role Key apenas no n8n

---

## 📝 Changelog

### v1.0.0 (2026-02-21)
- ✨ Sistema completo de sincronização de pedidos
- ✨ Suporte a 7 canais de venda
- ✨ Mapeamento automático de produtos
- ✨ Atualização de contadores de vendas
- ✨ Logs completos de sincronização
- ✨ Testes unitários e de integração

---

## 🤝 Contribuindo

Para contribuir com melhorias:

1. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
2. Faça suas alterações
3. Execute os testes: `npm run test`
4. Commit: `git commit -m "feat: adiciona nova funcionalidade"`
5. Push: `git push origin feature/nova-funcionalidade`
6. Abra um Pull Request

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique os logs de sincronização no banco
2. Consulte este README
3. Entre em contato com o time de desenvolvimento

---

**Desenvolvido por:** Jonatan Renan  
**Alob Express © 2026 - Todos os direitos reservados**
