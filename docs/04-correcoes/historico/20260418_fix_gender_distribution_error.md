# Correção: Erro ao carregar distribuição de gênero

**Data:** 2026-04-18  
**Tipo:** Database Migration  
**Status:** ✅ Resolvido

## Problema

A página de Leads exibia o erro "Erro ao carregar distribuição de gênero" porque as funções RPC do banco de dados não estavam criadas.

### Erros no Console

```
Failed to load resource: the server responded with a status of 404
https://oensqhjnxwpcuanozske.supabase.co/rest/v1/rpc/get_gender_distribution

Error fetching gender distribution: {
  code: PGRST202,
  message: Could not find the function public.get_gender_distribution(p_organization_id) in the schema cache
}
```

## Solução

Aplicadas as migrations de classificação de gênero no banco de dados Supabase:

### 1. Migration: `add_gender_classification_fields`

- Criado ENUM type `gender_type` ('male', 'female')
- Adicionadas colunas `gender` e `gender_probability` nas tabelas:
  - `public.leads`
  - `public.customers`
- Criados índices parciais para otimização:
  - `idx_leads_gender_org` - leads classificados
  - `idx_leads_unclassified` - leads não classificados
  - `idx_customers_gender_org` - customers classificados
  - `idx_customers_unclassified` - customers não classificados

### 2. Migration: `add_gender_classification_rpcs`

Criadas as funções RPC:

#### `get_gender_distribution(p_organization_id UUID)`
Retorna contagem de distribuição de gênero:
```json
{
  "male": 0,
  "female": 0,
  "unclassified": 14,
  "total": 14
}
```

#### `get_leads_with_gender(p_organization_id UUID, p_gender_filter gender_type)`
Retorna leads com classificação de gênero e estatísticas de pedidos:
- Suporta filtro opcional por gênero
- Inclui total de pedidos, valor gasto e última compra

## Resultado

✅ Funções RPC criadas com sucesso  
✅ Página de Leads carrega sem erros  
✅ Exibe mensagem apropriada: "Nenhuma classificação disponível ainda"  
✅ Filtro de gênero funcional  
✅ Pronto para executar classificação em lote

## Testes Realizados

```sql
-- Teste 1: Verificar distribuição
SELECT get_gender_distribution('28b4b443-03fd-4a2d-b596-9dcaf142b389'::uuid);
-- Resultado: {"male":0,"female":0,"unclassified":14,"total":14}

-- Teste 2: Listar leads com gênero
SELECT * FROM get_leads_with_gender('28b4b443-03fd-4a2d-b596-9dcaf142b389'::uuid) LIMIT 5;
-- Resultado: 5 leads retornados com gender=null (ainda não classificados)
```

## Próximos Passos

1. ✅ Migrations aplicadas
2. ⏳ Implementar botão de classificação em lote
3. ⏳ Integrar com API Genderize.io
4. ⏳ Testar classificação de leads reais

## Arquivos Relacionados

- `supabase/migrations/20260418_add_gender_classification_fields.sql`
- `supabase/migrations/20260418_add_gender_classification_rpcs.sql`
- `src/hooks/sales/useGenderDistribution.ts`
- `src/hooks/sales/useLeadsWithGender.ts`
- `src/components/sales/GenderDistributionChart.tsx`
- `src/components/sales/GenderFilterBar.tsx`
- `src/pages/Leads.tsx`

## Validações

- ✅ Requirements 1.1, 1.2, 1.3, 1.4, 1.5 (Database Schema)
- ✅ Requirements 8.1, 8.4, 9.2, 9.3 (RPC Functions)
- ✅ Frontend integrado e funcional
- ✅ Sem erros de console relacionados a gender classification
