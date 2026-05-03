# Problema: Filtro "Não Categorizado" Mostra Apenas 1 Produto

## Diagnóstico Completo

### Problema Reportado
- Ao carregar a página: mostra apenas 2 produtos (deveria mostrar 444)
- Ao clicar em "Não categorizado": mostra apenas 1 produto
- Ao desclickar: volta a mostrar 2 produtos (deveria mostrar 444)

### Causa Raiz Identificada

O problema NÃO está no filtro "Não categorizado", mas sim no `organization_id` que está sendo usado para buscar os produtos.

#### 1. Usuário Atual
- **Email**: empresaalob@gmail.com
- **User ID**: 70be52a6-06c0-4987-99d9-09708cba4163
- **Organization ID esperado**: 28b4b443-03fd-4a2d-b596-9dcaf142b389 (onde estão os 444 produtos)

#### 2. Como o Sistema Busca o Organization ID

O arquivo `src/contexts/SettingsContext.tsx` busca o `organization_id` assim:

```typescript
// 1. Tenta buscar na tabela organization_members
const { data: members } = await supabase
  .from('organization_members')
  .select('organization_id')
  .eq('user_id', user.id)
  .limit(1);

if (members && members.length > 0) {
  orgId = members[0].organization_id;
}

// 2. Se não encontrar, busca a primeira organização (FALLBACK)
if (!orgId) {
  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  if (orgs && orgs.length > 0) orgId = orgs[0].id;
}
```

#### 3. O Que Está Acontecendo

1. O usuário `70be52a6-06c0-4987-99d9-09708cba4163` NÃO está na tabela `organization_members`
2. O sistema usa o fallback e busca a primeira organização da tabela
3. Essa primeira organização NÃO é a `28b4b443-03fd-4a2d-b596-9dcaf142b389`
4. O hook `useProductsBling` busca produtos com esse `organization_id` incorreto
5. Não encontra produtos, então usa o fallback (busca SEM filtrar por organização)
6. Retorna apenas 2 produtos que não têm `organization_id` ou pertencem a outra organização

#### 4. Por Que o Filtro "Não Categorizado" Mostra Apenas 1 Produto

Dos 2 produtos retornados, apenas 1 tem `sku_fornecedor IS NULL`, por isso o filtro funciona corretamente mas mostra apenas 1 produto.

## Solução

### Opção 1: Adicionar Usuário à Tabela organization_members (RECOMENDADO)

Execute no Supabase SQL Editor:

```sql
-- Verificar se o usuário já existe na tabela
SELECT * FROM organization_members 
WHERE user_id = '70be52a6-06c0-4987-99d9-09708cba4163';

-- Se não existir, inserir
INSERT INTO organization_members (organization_id, user_id, role)
VALUES (
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  '70be52a6-06c0-4987-99d9-09708cba4163',
  'admin'
)
ON CONFLICT (organization_id, user_id) DO NOTHING;
```

### Opção 2: Atualizar Produtos com Organization ID

Se os 444 produtos não têm `organization_id`, você pode atualizá-los:

```sql
-- Verificar quantos produtos não têm organization_id
SELECT COUNT(*) FROM products_bling WHERE organization_id IS NULL;

-- Atualizar todos os produtos sem organization_id
UPDATE products_bling 
SET organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
WHERE organization_id IS NULL;
```

### Opção 3: Remover Fallback do SettingsContext (NÃO RECOMENDADO)

Modificar `src/contexts/SettingsContext.tsx` para não usar fallback:

```typescript
// Remover este bloco:
if (!orgId) {
  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  if (orgs && orgs.length > 0) orgId = orgs[0].id;
}
```

## Verificação

Após aplicar a solução, execute estas queries para verificar:

```sql
-- 1. Verificar se o usuário está na tabela organization_members
SELECT om.*, o.name as organization_name
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = '70be52a6-06c0-4987-99d9-09708cba4163';

-- 2. Verificar quantos produtos existem na organização
SELECT COUNT(*) as total_produtos
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389';

-- 3. Verificar quantos produtos não categorizados existem
SELECT COUNT(*) as nao_categorizados
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
  AND sku_fornecedor IS NULL;

-- 4. Ver exemplos de produtos não categorizados
SELECT id, name, sku, sku_fornecedor, organization_id
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
  AND sku_fornecedor IS NULL
LIMIT 10;
```

## Resultado Esperado Após Correção

1. **Ao carregar a página**: Mostra 444 produtos (ou o total de produtos da organização)
2. **Ao clicar em "Não categorizado"**: Mostra todos os produtos com `sku_fornecedor IS NULL`
3. **Ao desclickar**: Volta a mostrar todos os 444 produtos

## Logs de Debug

Os logs no console mostram claramente o problema:

```
[LOG] [useProductsBling] Mostrando todos os produtos (sem filtro de fornecedor)
[LOG] [useProductsBling] Produtos retornados: 2
```

Deveria mostrar:

```
[LOG] [useProductsBling] Mostrando todos os produtos (sem filtro de fornecedor)
[LOG] [useProductsBling] Produtos retornados: 444
```

## Próximos Passos

1. **Execute a Opção 1** (adicionar usuário à tabela organization_members)
2. **Recarregue a aplicação** (F5)
3. **Verifique se mostra 444 produtos**
4. **Teste o filtro "Não categorizado"**
5. **Se ainda houver problemas**, execute as queries de verificação acima

---

**Data**: 2026-03-01  
**Status**: ⚠️ Aguardando correção no banco de dados  
**Usuário**: empresaalob@gmail.com (70be52a6-06c0-4987-99d9-09708cba4163)  
**Organization ID esperado**: 28b4b443-03fd-4a2d-b596-9dcaf142b389
