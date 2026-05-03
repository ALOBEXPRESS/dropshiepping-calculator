# Código Correto para Inserir Item do Pedido

## 🎯 Objetivo

Substituir o nó "Atualiza no banco PATCH" por um nó correto que insere os itens na tabela `bling_order_items`.

---

## 🔧 Opção 1: Usar Supabase Insert (Recomendado)

**Tipo**: `Supabase - Insert`

**Nome**: `Inserir Item do Pedido`

**Configuração**:
- **Table**: `bling_order_items`
- **Columns**:

| Field ID | Field Value |
|----------|-------------|
| `order_id` | `{{ $json.order_id }}` |
| `bling_item_id` | `{{ $json.bling_item_id }}` |
| `product_bling_id` | `{{ $json.product_bling_id }}` |
| `product_id` | `{{ $json.product_id }}` |
| `code` | `{{ $json.code }}` |
| `description` | `{{ $json.description }}` |
| `detailed_description` | `{{ $json.detailed_description }}` |
| `unit` | `{{ $json.unit }}` |
| `quantity` | `{{ $json.quantity }}` |
| `unit_value` | `{{ $json.unit_value }}` |
| `discount` | `{{ $json.discount }}` |
| `total_value` | `{{ $json.total_value }}` |
| `ipi_rate` | `{{ $json.ipi_rate }}` |
| `commission_base` | `{{ $json.commission_base }}` |
| `commission_rate` | `{{ $json.commission_rate }}` |
| `commission_value` | `{{ $json.commission_value }}` |
| `operation_nature_id` | `{{ $json.operation_nature_id }}` |

**Conexões**:
- Conectar SAÍDA do "Preparar dados do item" → ENTRADA deste nó
- Conectar SAÍDA deste nó → ENTRADA do "Loop Over Items" (para continuar o loop)

---

## 🔧 Opção 2: Usar HTTP Request (Se Supabase Insert não funcionar)

**Tipo**: `HTTP Request`

**Nome**: `Inserir Item do Pedido`

**Configuração**:
- **Method**: `POST`
- **URL**: `https://oensqhjnxwpcuanozske.supabase.co/rest/v1/bling_order_items`

**Headers**:
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg

Content-Type: application/json

Prefer: return=representation
```

**Body Parameters**:

| Name | Value |
|------|-------|
| `order_id` | `{{ $json.order_id }}` |
| `bling_item_id` | `{{ $json.bling_item_id }}` |
| `product_bling_id` | `{{ $json.product_bling_id }}` |
| `product_id` | `{{ $json.product_id }}` |
| `code` | `{{ $json.code }}` |
| `description` | `{{ $json.description }}` |
| `detailed_description` | `{{ $json.detailed_description }}` |
| `unit` | `{{ $json.unit }}` |
| `quantity` | `{{ $json.quantity }}` |
| `unit_value` | `{{ $json.unit_value }}` |
| `discount` | `{{ $json.discount }}` |
| `total_value` | `{{ $json.total_value }}` |
| `ipi_rate` | `{{ $json.ipi_rate }}` |
| `commission_base` | `{{ $json.commission_base }}` |
| `commission_rate` | `{{ $json.commission_rate }}` |
| `commission_value` | `{{ $json.commission_value }}` |
| `operation_nature_id` | `{{ $json.operation_nature_id }}` |

---

## 🗑️ O que Deletar

1. **Deletar nó "Atualiza no banco PATCH"** - Está com mapeamento errado
2. **Deletar nó "If1"** - Não é necessário
3. **Deletar nó "Cria no banco POST"** - Está criando produto, não item do pedido
4. **Deletar nó "Replace Me"** - Não faz nada

---

## 🔄 Fluxo Correto Final

```
Loop Over Items
      ↓
Pega mais dados do ID Produto
      ↓
Buscar Produto por SKU
      ↓
Preparar dados do item
      ↓
Inserir Item do Pedido
      ↓
Loop Over Items (volta para processar próximo item)
```

---

## 🧪 Como Testar

1. Salve o workflow
2. Crie ou clone um pedido no Bling
3. Aguarde o webhook processar
4. Execute esta query no Supabase:

```sql
SELECT 
  boi.*,
  bo.order_number,
  bo.marketplace_order_number,
  pb.name as product_name
FROM bling_order_items boi
JOIN bling_orders bo ON boi.order_id = bo.id
LEFT JOIN products_bling pb ON boi.product_bling_id = pb.id
ORDER BY boi.created_at DESC
LIMIT 10;
```

Se aparecerem os itens, está funcionando! 🎉

---

## 📊 Resultado Esperado

Você deve ver algo assim no Supabase:

| id | order_id | code | description | quantity | unit_value | total_value |
|----|----------|------|-------------|----------|------------|-------------|
| uuid | uuid | SKU123 | Produto X | 2 | 50.00 | 100.00 |
| uuid | uuid | SKU456 | Produto Y | 1 | 30.00 | 30.00 |

---

## 🚨 Troubleshooting

### Erro: "order_id is null"
- Verifique se o nó "Pegar order_id" está retornando dados
- Verifique se o pedido foi inserido/atualizado antes do loop

### Erro: "product_bling_id is null"
- Normal se o SKU não existir na tabela `products_bling`
- O campo aceita null

### Loop não continua
- Verifique se a saída do "Inserir Item do Pedido" está conectada de volta ao "Loop Over Items"

### Itens duplicados
- Verifique se o loop não está sendo executado múltiplas vezes
- Adicione um índice único em `(order_id, bling_item_id)` se necessário
