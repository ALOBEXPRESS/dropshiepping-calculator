# 🚀 Guia Rápido: Corrigir Travamento do Workflow

## ⚡ Passos Rápidos (5 minutos)

### 1️⃣ Importar Workflow Corrigido no n8n

```bash
# O arquivo já foi corrigido automaticamente:
src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json
```

**No n8n:**
1. Abra o n8n no navegador
2. Vá em **Workflows**
3. Clique em **Import from File**
4. Selecione: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
5. Clique em **Save** e depois **Activate**

✅ **Pronto!** O workflow não vai mais travar.

---

### 2️⃣ Descobrir Qual Canal Está Faltando

**No Supabase SQL Editor:**

```sql
-- Cole esta query para descobrir qual loja precisa ser adicionada
SELECT 
  bo.bling_store_id,
  bo.raw_data::json->'loja'->>'nome' as loja_nome,
  COUNT(*) as total_pedidos,
  MIN(bo.order_date) as primeiro_pedido,
  MAX(bo.order_date) as ultimo_pedido
FROM bling_orders bo
WHERE bo.sales_channel_id IS NULL
GROUP BY 
  bo.bling_store_id,
  bo.raw_data::json->'loja'->>'nome'
ORDER BY total_pedidos DESC;
```

**Resultado esperado:**
```
bling_store_id | loja_nome              | total_pedidos | primeiro_pedido | ultimo_pedido
---------------|------------------------|---------------|-----------------|---------------
205999999      | Loja Upseller ML       | 5             | 2026-04-15      | 2026-05-03
```

---

### 3️⃣ Adicionar o Canal Faltante

**No Supabase SQL Editor:**

```sql
-- SUBSTITUA os valores conforme o resultado da query anterior
INSERT INTO sales_channels (
  organization_id,
  bling_store_id,
  name,
  marketplace,
  account_type,
  account_holder,
  is_active
) VALUES (
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  205999999,  -- ⚠️ SUBSTITUA pelo bling_store_id real
  'Loja Upseller ML',  -- ⚠️ SUBSTITUA pelo nome real
  'MercadoLivre',  -- ⚠️ SUBSTITUA pelo marketplace correto
  'CPF',
  'Alyson',
  true
)
ON CONFLICT (bling_store_id) DO NOTHING;
```

---

### 4️⃣ Atualizar Pedidos Antigos (Opcional)

```sql
-- Depois de adicionar o canal, você pode atualizar pedidos antigos
UPDATE bling_orders
SET sales_channel_id = (
  SELECT id 
  FROM sales_channels 
  WHERE sales_channels.bling_store_id = bling_orders.bling_store_id
)
WHERE sales_channel_id IS NULL
  AND bling_store_id IN (SELECT bling_store_id FROM sales_channels);
```

---

### 5️⃣ Testar

1. **Edite o pedido no Bling** (mude qualquer coisa e salve)
2. **Verifique se o workflow completou** sem travar
3. **Verifique os logs:**

```sql
SELECT 
  created_at,
  event_type,
  bling_order_id,
  status,
  error_message
FROM bling_sync_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 Resultado Final

### ✅ Antes
- ❌ Workflow travava no "Buscar Canal"
- ❌ Pedidos não eram processados

### ✅ Depois
- ✅ Workflow continua mesmo sem canal
- ✅ Pedidos são inseridos com `sales_channel_id = NULL`
- ✅ Logs de WARNING mostram quais canais faltam
- ✅ Fácil adicionar canais faltantes depois

---

## 📊 Queries Úteis

### Ver pedidos sem canal
```sql
SELECT 
  bling_order_id,
  order_number,
  bling_store_id,
  order_date,
  total_amount,
  contact_name
FROM bling_orders
WHERE sales_channel_id IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

### Ver logs de warning
```sql
SELECT 
  created_at,
  bling_store_id,
  bling_order_id,
  error_message
FROM bling_sync_logs
WHERE status = 'warning'
  AND error_message LIKE '%Canal%'
ORDER BY created_at DESC
LIMIT 20;
```

### Ver canais existentes
```sql
SELECT 
  bling_store_id,
  name,
  marketplace,
  account_holder
FROM sales_channels
ORDER BY bling_store_id;
```

---

## 🆘 Troubleshooting

### Problema: Workflow ainda trava
**Solução**: 
1. Verifique se importou o workflow corretamente
2. Verifique se o workflow está **ativo** (toggle verde)
3. Desative e ative novamente

### Problema: Não sei qual marketplace usar
**Solução**: Veja o nome da loja no Bling:
- Se tem "ML" ou "Livre" → `MercadoLivre`
- Se tem "Shopee" → `Shopee`
- Se tem "TikTok" → `TikTok`
- Se tem "Facebook" ou "Meta" → `Facebook`
- Se tem "Site" ou "Wordpress" → `Site`

### Problema: Não sei o bling_store_id
**Solução**: Use a query do passo 2 ou veja em `bling_sync_logs`

---

## 📞 Precisa de Ajuda?

1. ✅ Verifique `SOLUCAO_TRAVAMENTO_CANAL.md` (documentação completa)
2. ✅ Use `descobrir_bling_store_id.sql` (queries avançadas)
3. ✅ Use `add_missing_channels.sql` (templates SQL)

---

**Tempo estimado**: 5-10 minutos
**Dificuldade**: ⭐⭐☆☆☆ (Fácil)
**Status**: ✅ Testado e funcionando
