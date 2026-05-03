# 🔧 Solução: "Buscar Produto por SKU" Retornando Vazio

## 🎯 Problema Identificado

O nó "Buscar Produto por SKU" está retornando vazio mesmo com o produto existindo no banco.

### Dados Confirmados:
- **SKU:** YEIZ_IDP248
- **Existe no banco:** ✅ SIM (3 registros)
  - ID: `02e6240d-02d0-4b40-9f8a-a0c495f6c878` - MercadoLivre - R$ 42,90
  - ID: `cf02365e-831d-49fd-bd49-b6aade63ff98` - MercadoLivre - R$ 46,90
  - ID: `2bf6dd07-4ea9-4ffe-83f6-ebf318e76a5b` - **Shopee** - R$ 47,20 ← **Este é o correto**
- **Store ID do pedido:** 206002038 = Shopee
- **Marketplace esperado:** shopee

## 🔍 Causa Raiz

O nó "Buscar Produto por SKU" no n8n está configurado como:
```
Operation: Get All
Table: products
Filters: sku = {{ $json.codigo }}
```

**Problema:** O nó está configurado corretamente, MAS o `$json.codigo` pode estar:
1. Vazio ou undefined
2. Com formato incorreto
3. Não sendo passado corretamente do nó anterior

## ✅ Solução

### Opção 1: Verificar o Nó "Preparar Itens do pedido"

O nó "Preparar Itens do pedido" deve estar retornando o campo `codigo` corretamente.

**Verificar:**
1. Abra o workflow no n8n
2. Execute manualmente
3. Clique no nó "Preparar Itens do pedido"
4. Verifique se o output tem o campo `codigo` com valor `YEIZ_IDP248`

**Se o campo estiver vazio ou com nome diferente:**
- Ajuste o código do nó "Preparar Itens do pedido" para garantir que `codigo` seja retornado

### Opção 2: Usar SQL Query Direta (RECOMENDADO)

Mudar o nó "Buscar Produto por SKU" para usar uma query SQL direta:

1. **Abra o nó "Buscar Produto por SKU"**
2. **Mude a configuração:**
   - Operation: `Execute Query`
   - Query:
   ```sql
   SELECT 
     id,
     sku,
     name,
     marketplace,
     price,
     'simple' as product_type,
     null::bigint as product_bling_id,
     null as variacao_nome
   FROM products
   WHERE sku = '{{ $json.codigo }}'
   
   UNION ALL
   
   SELECT 
     id,
     sku,
     variacao_nome as name,
     null as marketplace,
     sale_price as price,
     'variation' as product_type,
     product_bling_id,
     variacao_nome
   FROM products_variations_bling
   WHERE sku = '{{ $json.codigo }}'
   ```

**Vantagens:**
- ✅ Busca em ambas as tabelas (products E products_variations_bling)
- ✅ Retorna o campo `product_type` para identificar o tipo
- ✅ Funciona para produtos simples E variações
- ✅ Não precisa do nó "Combinar Produtos e Variações2"

### Opção 3: Debug do Campo `codigo`

Se as opções acima não funcionarem, adicione um nó de debug:

1. **Adicione um nó "Code" entre "Preparar Itens do pedido" e "Buscar Produto por SKU"**
2. **Código:**
   ```javascript
   console.log('=== DEBUG CODIGO ===');
   console.log('Input completo:', JSON.stringify($input.item.json, null, 2));
   console.log('Campo codigo:', $input.item.json.codigo);
   console.log('Tipo:', typeof $input.item.json.codigo);
   console.log('===================');
   
   return $input.all();
   ```
3. **Execute o workflow**
4. **Verifique os logs** para ver o que está sendo passado

## 🧪 Teste Rápido no Supabase

Para confirmar que o produto existe:

```sql
SELECT id, sku, marketplace, price, name 
FROM products 
WHERE sku = 'YEIZ_IDP248' 
ORDER BY marketplace;
```

**Resultado esperado:** 3 linhas (2 MercadoLivre, 1 Shopee)

## 📋 Checklist de Verificação

- [ ] Verificar se "Preparar Itens do pedido" retorna o campo `codigo`
- [ ] Verificar se o valor de `codigo` é `YEIZ_IDP248`
- [ ] Verificar se o nó "Buscar Produto por SKU" está usando o filtro correto
- [ ] Testar com SQL Query direta (Opção 2)
- [ ] Verificar logs do n8n para erros
- [ ] Confirmar que o produto existe no banco (query acima)

## 🎯 Próximos Passos

1. **Implementar Opção 2** (SQL Query direta) - É a solução mais robusta
2. **Remover o nó "Combinar Produtos e Variações2"** - Não será mais necessário
3. **Atualizar o nó "Preparar dados do item"** - Já está preparado para receber `product_type`
4. **Testar com o pedido real**

---

**Data:** 2026-05-03  
**Status:** 🔧 Solução proposta  
**Próxima ação:** Implementar Opção 2 (SQL Query direta)
