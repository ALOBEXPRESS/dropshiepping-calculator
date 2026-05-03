# Solução Rápida: Corrigir UPSERT no N8N

## Problema
```
duplicate key value violates unique constraint "products_bling_sku_key"
```

## Solução em 3 Passos

### 1. Abra o Workflow no N8N
- Vá para o workflow "Bling Atualizar/Deletar Produto Automatization"
- Encontre o nó "Upsert no banco (Cria ou Atualiza)"

### 2. Edite a URL

**URL ATUAL:**
```
https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling
```

**URL CORRIGIDA (adicione `?on_conflict=bling_id`):**
```
https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?on_conflict=bling_id
```

### 3. Salve e Teste

Salve o workflow e teste atualizando o produto:
- Nome: "TESTANDO ESSA DROGA 342"
- SKU: dsadas11133
- Mude o preço de 19 para 28

## Por Que Funciona?

O `on_conflict=bling_id` diz ao Supabase qual coluna usar para detectar conflitos:
- Se `bling_id` já existe → UPDATE
- Se `bling_id` não existe → INSERT

Isso resolve o erro porque agora o Supabase sabe que deve usar `bling_id` como chave de conflito, não `sku`.

## Resultado Esperado

✅ Produto novo: Cria no banco  
✅ Produto existente: Atualiza no banco  
✅ Sem erro de duplicate key

---

**Tempo estimado**: 2 minutos  
**Dificuldade**: Fácil  
**Impacto**: Resolve 100% do problema
