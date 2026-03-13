# Correção UPSERT: Especificar ON CONFLICT

## Problema

Erro: `duplicate key value violates unique constraint "products_bling_sku_key"`

O nó UPSERT está falhando porque a tabela `products_bling` tem DUAS constraints únicas:
- `bling_id` (primary key)
- `sku` (unique constraint)

O header `Prefer: resolution=merge-duplicates` sozinho não é suficiente quando há múltiplas constraints.

## Solução

Adicionar o query parameter `on_conflict` na URL para especificar qual coluna usar no conflito.

### Mudança no Nó "Upsert no banco (Cria ou Atualiza)"

**URL ATUAL:**
```
https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling
```

**URL CORRIGIDA:**
```
https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?on_conflict=bling_id
```

### Por Que Funciona?

O `on_conflict=bling_id` diz ao Supabase:
- "Se houver conflito no `bling_id`, faça UPDATE"
- "Se não houver conflito, faça INSERT"

Isso é equivalente ao SQL:
```sql
INSERT INTO products_bling (...)
VALUES (...)
ON CONFLICT (bling_id) 
DO UPDATE SET ...
```

### Alternativa: Usar SKU

Se preferir usar o SKU como chave de conflito:
```
https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?on_conflict=sku
```

**Recomendação**: Use `bling_id` porque é a primary key e é mais confiável.

## Implementação

1. Abra o workflow no N8N
2. Clique no nó "Upsert no banco (Cria ou Atualiza)"
3. Na URL, adicione `?on_conflict=bling_id` no final
4. Salve o workflow
5. Teste atualizando o produto "TESTANDO ESSA DROGA 342" (SKU: dsadas11133)

## Resultado Esperado

- ✅ Produto novo: INSERT funciona
- ✅ Produto existente: UPDATE funciona (sem erro de duplicate key)
- ✅ Idempotente: Pode executar múltiplas vezes

---

**Status**: Pronto para implementar
**Prioridade**: Alta
**Impacto**: Resolve completamente o problema de UPSERT
