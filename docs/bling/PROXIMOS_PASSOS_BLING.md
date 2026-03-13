# 🎯 Próximos Passos - Integração Bling

## ✅ O que já foi feito

1. **Migration aplicada com sucesso** (21/02/2026)
   - 5 tabelas criadas no Supabase
   - 7 canais de venda configurados
   - Índices e triggers funcionando

2. **Serviço TypeScript completo**
   - 700+ linhas de código
   - 17 testes (13 passando)
   - Funções de processamento, consulta e mapeamento

3. **Workflow n8n pronto**
   - Arquivo JSON completo
   - Fluxo de 7 etapas configurado

4. **Documentação completa**
   - README detalhado
   - Resumo executivo
   - Guias de troubleshooting

---

## 🚀 Próximo Passo: Importar Workflow no n8n

### 1. Acessar n8n

Acesse sua instância do n8n em: `https://hookn8n.alobexpress.com.br`

### 2. Importar Workflow

1. Clique em **Workflows** no menu lateral
2. Clique em **Import from File**
3. Selecione o arquivo: `src/hooks/n8n/Bling_Pedido_Venda_Complete.json`
4. Clique em **Import**

### 3. Configurar Credenciais Supabase

No workflow importado, você precisará configurar as credenciais do Supabase:

**Supabase URL:**
```
https://oensqhjnxwpcuanozske.supabase.co
```

**Service Role Key:**
Você encontra no painel do Supabase em:
- Settings → API → Service Role Key (secret)

### 4. Ativar o Workflow

1. Abra o workflow importado
2. Clique no botão **Active** no canto superior direito
3. Verifique se o status mudou para "Active"

### 5. Obter URL do Webhook

Após ativar, o n8n vai gerar uma URL de webhook. Copie essa URL, ela será algo como:

```
https://hookn8n.alobexpress.com.br/webhook/alobexpressmanager
```

---

## 🔗 Configurar Webhook no Bling

### 1. Acessar Painel do Bling

1. Acesse: https://www.bling.com.br
2. Faça login com suas credenciais
3. Vá em **Configurações** → **Integrações** → **Webhooks**

### 2. Criar Novo Webhook

1. Clique em **Novo Webhook**
2. Preencha os campos:

**Nome:** Alob Express Manager

**URL:** (cole a URL do webhook do n8n)
```
https://hookn8n.alobexpress.com.br/webhook/alobexpressmanager
```

**Eventos:**
- ✅ `order.created` - Pedido criado
- ✅ `order.updated` - Pedido atualizado
- ✅ `order.deleted` - Pedido deletado

**Método:** POST

**Formato:** JSON

3. Clique em **Salvar**

### 3. Testar Webhook

O Bling permite enviar um evento de teste. Clique em **Testar** para verificar se está funcionando.

---

## 🧪 Testar com Pedido Real

### Opção 1: Criar Pedido de Teste no Bling

1. Acesse o Bling
2. Vá em **Vendas** → **Pedidos de Venda**
3. Clique em **Novo Pedido**
4. Preencha os dados:
   - Cliente: Qualquer cliente de teste
   - Loja: Escolha uma das 7 lojas configuradas
   - Produto: Adicione um produto existente
   - Valor: Qualquer valor
5. Salve o pedido

### Opção 2: Enviar Webhook Manualmente

Use o arquivo de exemplo para testar:

```bash
curl -X POST https://hookn8n.alobexpress.com.br/webhook/alobexpressmanager \
  -H "Content-Type: application/json" \
  -d @src/hooks/n8n/httprequestoutput.json
```

### Verificar Sincronização

Após criar o pedido, verifique no Supabase:

```sql
-- Ver pedidos sincronizados
SELECT * FROM bling_orders ORDER BY created_at DESC LIMIT 5;

-- Ver logs de sincronização
SELECT * FROM bling_sync_logs ORDER BY processed_at DESC LIMIT 10;

-- Ver itens dos pedidos
SELECT * FROM bling_order_items ORDER BY created_at DESC LIMIT 10;
```

---

## 📊 Monitorar Sistema

### Dashboard de Monitoramento

Crie queries no Supabase para monitorar:

**Taxa de Sucesso:**
```sql
SELECT 
  status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM bling_sync_logs
WHERE DATE(processed_at) = CURRENT_DATE
GROUP BY status;
```

**Pedidos por Canal:**
```sql
SELECT 
  sc.marketplace,
  sc.account_holder,
  COUNT(bo.id) as total_orders,
  SUM(bo.total_amount) as total_revenue
FROM bling_orders bo
JOIN sales_channels sc ON bo.sales_channel_id = sc.id
WHERE bo.order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY sc.marketplace, sc.account_holder
ORDER BY total_revenue DESC;
```

**Últimos Erros:**
```sql
SELECT * FROM bling_sync_logs 
WHERE status = 'error' 
ORDER BY processed_at DESC 
LIMIT 10;
```

---

## 🎨 Integrar com Interface

### Exibir Vendas Reais nos Cards de Produtos

No componente do produto, adicione:

```typescript
import { getProductSalesStats } from '@/services/blingOrderService';

// Buscar estatísticas
const stats = await getProductSalesStats(organizationId, productId);

// Exibir no card
<div className="sales-stats">
  <p>Vendas MercadoLivre: {stats.mercadolivre_quantity}</p>
  <p>Vendas Shopee: {stats.shopee_quantity}</p>
  <p>Vendas TikTok: {stats.tiktok_quantity}</p>
</div>
```

### Criar Página de Pedidos

Crie uma nova página para visualizar pedidos:

```typescript
import { getOrdersByDateRange } from '@/services/blingOrderService';

// Buscar pedidos do mês
const orders = await getOrdersByDateRange(
  organizationId,
  '2026-02-01',
  '2026-02-28'
);

// Exibir em tabela
<table>
  <thead>
    <tr>
      <th>Pedido</th>
      <th>Data</th>
      <th>Canal</th>
      <th>Cliente</th>
      <th>Total</th>
    </tr>
  </thead>
  <tbody>
    {orders.map(order => (
      <tr key={order.id}>
        <td>{order.order_number}</td>
        <td>{order.order_date}</td>
        <td>{order.sales_channel.marketplace}</td>
        <td>{order.contact_name}</td>
        <td>R$ {order.total_amount}</td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## 🔍 Troubleshooting

### Problema: Webhook não está sendo recebido

**Verificar:**
1. URL do webhook está correta no Bling
2. Workflow está ativo no n8n
3. Firewall não está bloqueando requisições

**Solução:**
- Teste manualmente com curl
- Verifique logs do n8n
- Verifique logs do Bling

### Problema: Pedido não sincroniza

**Verificar:**
1. Token do Bling está válido
2. Canal de venda está mapeado
3. Produto existe no banco

**Solução:**
```sql
-- Ver logs de erro
SELECT * FROM bling_sync_logs 
WHERE status = 'error' 
ORDER BY processed_at DESC;
```

### Problema: Produto não mapeado

**Verificar:**
1. Produto existe em `products_bling`
2. SKU está correto
3. Produto está vinculado à organização

**Solução:**
```sql
-- Verificar produto
SELECT * FROM products_bling WHERE sku = 'ALOB0002';

-- Criar mapeamento se necessário
UPDATE products_bling 
SET organization_id = 'seu-org-id'
WHERE sku = 'ALOB0002';
```

---

## 📞 Suporte

**Arquivos de Referência:**
- `BLING_INTEGRATION_SUMMARY.md` - Resumo executivo
- `src/hooks/n8n/README_BLING_INTEGRATION.md` - Documentação completa
- `src/services/blingOrderService.ts` - Código do serviço
- `supabase/migrations/20260221_create_bling_orders_tables.sql` - Schema do banco

**Queries Úteis:**
- Ver todos os canais: `SELECT * FROM sales_channels;`
- Ver pedidos: `SELECT * FROM bling_orders ORDER BY created_at DESC;`
- Ver logs: `SELECT * FROM bling_sync_logs ORDER BY processed_at DESC;`

---

## ✨ Benefícios Após Implementação

1. **Automação Total** - Pedidos sincronizados automaticamente
2. **Visibilidade** - Veja vendas reais por canal
3. **Rastreabilidade** - Logs completos de todas as operações
4. **Integridade** - Validações e mapeamentos automáticos
5. **Escalabilidade** - Suporta múltiplos canais e organizações

---

**Desenvolvido por:** Jonatan Renan  
**Data:** 21 de Fevereiro de 2026  
**Status:** ✅ Pronto para Configuração  

**Alob Express © 2026 - Todos os direitos reservados**
