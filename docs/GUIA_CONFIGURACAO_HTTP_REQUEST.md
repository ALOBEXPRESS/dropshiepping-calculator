# 🔧 Guia: Configurar HTTP Request para Buscar Produto por SKU

## 📋 Pré-requisito: Criar Função no Supabase

Antes de tudo, execute este SQL no Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION search_product_by_sku(p_sku TEXT)
RETURNS TABLE (
  id UUID,
  sku TEXT,
  name TEXT,
  marketplace TEXT,
  price NUMERIC,
  product_type TEXT,
  product_bling_id BIGINT,
  variacao_nome TEXT,
  organization_id UUID,
  cost_price NUMERIC,
  supplier_name TEXT,
  account_holder TEXT,
  account_type TEXT,
  image_url TEXT,
  operation_mode TEXT,
  gateway_method TEXT,
  gateway_bank TEXT
) AS $$
BEGIN
  RETURN QUERY
  
  SELECT 
    p.id, p.sku, p.name, p.marketplace, p.price,
    'simple'::TEXT as product_type,
    NULL::BIGINT as product_bling_id,
    NULL::TEXT as variacao_nome,
    p.organization_id, p.cost_price, p.supplier_name,
    p.account_holder, p.account_type, p.image_url,
    p.operation_mode, p.gateway_method, p.gateway_bank
  FROM products p
  WHERE p.sku = p_sku
  
  UNION ALL
  
  SELECT 
    pv.id, pv.sku, pv.variacao_nome as name,
    NULL::TEXT as marketplace, pv.sale_price as price,
    'variation'::TEXT as product_type,
    pv.product_bling_id, pv.variacao_nome,
    pv.organization_id, pv.cost_price, pv.supplier_name,
    pv.account_holder, pv.account_type, pv.image_url,
    pv.operation_mode, pv.gateway_method, pv.gateway_bank
  FROM products_variations_bling pv
  WHERE pv.sku = p_sku;
  
END;
$$ LANGUAGE plpgsql;
```

---

## 🔧 Configuração do Nó HTTP Request no n8n

### 1️⃣ Deletar Nó Antigo
- Clique no nó "Buscar Produto por SKU2" (Supabase)
- Delete o nó

### 2️⃣ Adicionar Novo Nó
- Clique no botão "+" para adicionar nó
- Busque por "HTTP Request"
- Adicione o nó

### 3️⃣ Configurar o Nó

#### **Aba Parameters:**

**Method:**
```
POST
```

**URL:**
```
https://YOUR_PROJECT_ID.supabase.co/rest/v1/rpc/search_product_by_sku
```
> ⚠️ Substitua `YOUR_PROJECT_ID` pelo ID do seu projeto Supabase

**Authentication:**
```
Predefined Credential Type
```
- Selecione: `Supabase API`
- Escolha sua credencial existente: `Supabase account`

**Send Query Parameters:** ❌ Desativado

**Send Headers:** ✅ Ativado
- **Header 1:**
  - Name: `Content-Type`
  - Value: `application/json`
- **Header 2:**
  - Name: `Prefer`
  - Value: `return=representation`

**Send Body:** ✅ Ativado

**Body Content Type:**
```
JSON
```

**Specify Body:**
```
Using JSON
```

**JSON:**
```json
{
  "p_sku": "={{ $json.codigo }}"
}
```

### 4️⃣ Configurações Adicionais

**Node Name:**
```
Buscar Produto por SKU2
```

**Always Output Data:** ✅ Ativado

**Retry On Fail:** ✅ Ativado
- Max Tries: `3`
- Wait Between Tries: `1000` ms

---

## 🧪 Testar a Configuração

### Teste 1: Executar Função Diretamente no Supabase

No SQL Editor do Supabase, execute:

```sql
SELECT * FROM search_product_by_sku('YEIZ_IDP248');
```

**Resultado esperado:** 3 linhas (produtos com SKU YEIZ_IDP248)

### Teste 2: Testar no n8n

1. Execute o nó "Preparar Itens do pedido"
2. Execute o nó "Buscar Produto por SKU2"
3. Verifique o output:
   - Deve retornar array com produtos
   - Cada produto deve ter os campos: `id`, `sku`, `name`, `marketplace`, `price`, `product_type`

---

## 🔍 Troubleshooting

### Erro: "function search_product_by_sku does not exist"
**Solução:** Execute o SQL de criação da função no Supabase

### Erro: "permission denied for function"
**Solução:** Execute no Supabase:
```sql
GRANT EXECUTE ON FUNCTION search_product_by_sku(TEXT) TO anon, authenticated;
```

### Erro: "column does not exist"
**Solução:** Verifique se as colunas na função correspondem às colunas reais das tabelas

### Nó retorna vazio
**Solução:** 
1. Verifique se `{{ $json.codigo }}` está sendo passado corretamente
2. Execute o nó "Preparar Itens do pedido" antes
3. Verifique se o SKU existe no banco

---

## ✅ Resultado Final

Após configurar corretamente:

```
Preparar Itens do pedido → Buscar Produto por SKU2 (HTTP Request)
                                    ↓
                          ✅ Retorna 3 produtos
                                    ↓
                          Preparar dados do item
                                    ↓
                          ✅ Filtra por marketplace
                                    ↓
                          Inserir item do pedido
                                    ↓
                          ✅ Sucesso!
```

---

**Data:** 2026-05-03  
**Status:** 📝 Guia de configuração  
**Próxima ação:** Seguir os passos acima
