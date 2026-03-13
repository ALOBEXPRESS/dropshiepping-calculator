# 🚨 CORREÇÃO URGENTE: Filtro "Não Categorizado"

## O Problema

Você está vendo apenas 2 produtos quando deveria ver 444 produtos. O problema NÃO é o filtro, mas sim o `organization_id` que está sendo usado.

## A Causa

Seu usuário (`empresaalob@gmail.com`) não está vinculado à organização correta no banco de dados.

## A Solução (2 minutos)

### Passo 1: Abra o Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard/project/oensqhjnxwpcuanozske/sql
2. Clique em "New Query"

### Passo 2: Execute Este Script

Cole e execute este código:

```sql
-- Adicionar seu usuário à organização correta
INSERT INTO organization_members (organization_id, user_id, role, created_at, updated_at)
VALUES (
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  '70be52a6-06c0-4987-99d9-09708cba4163',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Verificar se funcionou
SELECT 
  om.role,
  o.name as organization_name,
  (SELECT COUNT(*) FROM products_bling WHERE organization_id = om.organization_id) as total_produtos
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = '70be52a6-06c0-4987-99d9-09708cba4163';
```

### Passo 3: Recarregue a Aplicação

1. Volte para a aplicação
2. Pressione F5 (ou Ctrl+R)
3. Agora você deve ver todos os 444 produtos!

## Verificação

Após executar o script, você deve ver algo assim:

```
role    | organization_name | total_produtos
--------|-------------------|---------------
admin   | Alob Express      | 444
```

## Teste o Filtro

1. Clique em "Não categorizado"
   - Deve mostrar todos os produtos sem fornecedor
2. Clique novamente para desclickar
   - Deve voltar a mostrar todos os 444 produtos

## Se Ainda Não Funcionar

Execute esta query para verificar quantos produtos não categorizados existem:

```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN sku_fornecedor IS NULL THEN 1 END) as nao_categorizados
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389';
```

Se `nao_categorizados` for 1, então o filtro está funcionando corretamente - você realmente tem apenas 1 produto não categorizado.

## Documentação Completa

Para mais detalhes técnicos, veja:
- `docs/PROBLEMA_ORGANIZATION_ID_FILTRO.md` - Diagnóstico completo
- `supabase/migrations/fix_organization_member.sql` - Script de correção

---

**Tempo estimado**: 2 minutos  
**Dificuldade**: Fácil  
**Requer**: Acesso ao Supabase SQL Editor
