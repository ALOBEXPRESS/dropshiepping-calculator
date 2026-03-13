# Tabelas de Influenciadores e Afiliados - Implementação Completa

## Status: ✅ CONCLUÍDO

## Resumo
Criadas tabelas normalizadas para influenciadores e afiliados com relação many-to-many com marketplaces. View `leads_by_marketplace` corrigida para exibir valores arredondados.

## Estrutura do Banco de Dados

### 1. Tabela `influencers`
```sql
- id (UUID, PK)
- organization_id (UUID, FK → organizations)
- name (VARCHAR 255)
- instagram (VARCHAR 255)
- tiktok (VARCHAR 255)
- twitter (VARCHAR 255)
- percentage (DECIMAL 5,2) - 0 a 100
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 2. Tabela `affiliates`
```sql
- id (UUID, PK)
- organization_id (UUID, FK → organizations)
- name (VARCHAR 255)
- instagram (VARCHAR 255)
- tiktok (VARCHAR 255)
- twitter (VARCHAR 255)
- percentage (DECIMAL 5,2) - 0 a 100
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 3. Tabela `influencer_marketplaces` (Relação Many-to-Many)
```sql
- id (UUID, PK)
- influencer_id (UUID, FK → influencers)
- marketplace_id (UUID, FK → marketplaces)
- created_at (TIMESTAMP)
- UNIQUE (influencer_id, marketplace_id)
```

### 4. Tabela `affiliate_marketplaces` (Relação Many-to-Many)
```sql
- id (UUID, PK)
- affiliate_id (UUID, FK → affiliates)
- marketplace_id (UUID, FK → marketplaces)
- created_at (TIMESTAMP)
- UNIQUE (affiliate_id, marketplace_id)
```

## Dados Inseridos

### Influenciadores

#### 1. João
- Instagram: @joaoinfluenceralob
- TikTok: @joãoinfluenceralob
- X (Twitter): @joaoinfluenceralob
- Marketplaces: Mercado Livre, TikTok, Shopee
- Porcentagem: 10%

#### 2. Emelyn
- Instagram: @emelyninfluenceralob
- TikTok: @emelyninfluenceralob
- X (Twitter): @emelynifluenceralob
- Marketplaces: Mercado Livre, TikTok, Shopee
- Porcentagem: 10%

#### 3. Brenda
- Instagram: @brendainfluenceralob
- TikTok: @brendainfluenceralob
- X (Twitter): @brendainfluenceralob
- Marketplaces: Mercado Livre, TikTok, Shopee
- Porcentagem: 10%

### Afiliados

#### 1. João
- Instagram: @joaovendasalob
- TikTok: @joãovendasalob
- X (Twitter): @joaovendasalob
- Marketplaces: Mercado Livre, TikTok, Shopee
- Porcentagem: 10%

#### 2. Emelyn
- Instagram: @emelynnvendasalob
- TikTok: @emelyvendaseralob
- X (Twitter): @emelyvendasalob
- Marketplaces: Mercado Livre, TikTok, Shopee
- Porcentagem: 10%

#### 3. Jonatan
- Instagram: @jonatannvendasalob
- TikTok: @jonatanvendaseralob
- X (Twitter): @jonatanvendasalob
- Marketplaces: Mercado Livre, TikTok, Shopee
- Porcentagem: 10%

## Correção da View `leads_by_marketplace`

### Problema
O campo `avg_order_value` estava exibindo valores com muitas casas decimais (ex: 74.800000000000000).

### Solução
Aplicado `ROUND(..., 2)` para arredondar para 2 casas decimais.

### Resultado
```
avg_order_value: 74.80 ✅
```

## Recursos Implementados

### Índices
- ✅ Por organization_id (ambas as tabelas)
- ✅ Por name (ambas as tabelas)
- ✅ Por is_active (ambas as tabelas)
- ✅ Por influencer_id e marketplace_id (tabelas de relação)
- ✅ Por affiliate_id e marketplace_id (tabelas de relação)

### Triggers
- ✅ Auto-atualização de `updated_at` em influencers
- ✅ Auto-atualização de `updated_at` em affiliates

### RLS (Row Level Security)
- ✅ Policies para SELECT, INSERT, UPDATE, DELETE
- ✅ Acesso apenas para usuários autenticados
- ✅ Aplicado em todas as 4 tabelas

### Constraints
- ✅ Porcentagem entre 0 e 100
- ✅ UNIQUE para evitar duplicatas na relação many-to-many
- ✅ CASCADE DELETE para manter integridade referencial

## Consultas Úteis

### Listar influenciadores com seus marketplaces
```sql
SELECT 
    i.name,
    i.instagram,
    i.percentage,
    STRING_AGG(m.name, ', ' ORDER BY m.name) as marketplaces
FROM influencers i
LEFT JOIN influencer_marketplaces im ON im.influencer_id = i.id
LEFT JOIN marketplaces m ON m.id = im.marketplace_id
WHERE i.is_active = true
GROUP BY i.id, i.name, i.instagram, i.percentage
ORDER BY i.name;
```

### Listar afiliados com seus marketplaces
```sql
SELECT 
    a.name,
    a.instagram,
    a.percentage,
    STRING_AGG(m.name, ', ' ORDER BY m.name) as marketplaces
FROM affiliates a
LEFT JOIN affiliate_marketplaces am ON am.affiliate_id = a.id
LEFT JOIN marketplaces m ON m.id = am.marketplace_id
WHERE a.is_active = true
GROUP BY a.id, a.name, a.instagram, a.percentage
ORDER BY a.name;
```

### Buscar influenciadores por marketplace
```sql
SELECT i.*
FROM influencers i
INNER JOIN influencer_marketplaces im ON im.influencer_id = i.id
INNER JOIN marketplaces m ON m.id = im.marketplace_id
WHERE m.name = 'Mercado Livre'
  AND i.is_active = true;
```

## Próximos Passos

### 1. Criar Serviços TypeScript
- `src/services/influencerService.ts`
- `src/services/affiliateService.ts`

### 2. Atualizar Componentes
- Substituir campos manuais por dropdowns de seleção
- Implementar em `TrafficConfig.tsx`
- Implementar em `EditProductDialog.tsx`

### 3. Funcionalidades
- Seleção múltipla de influenciadores/afiliados
- Filtro por marketplace
- Exibição de porcentagem pré-definida
- Possibilidade de override de porcentagem por produto

## Arquivos Criados

- `supabase/migrations/20260228_create_influencers_affiliates_tables.sql`
- `TABELAS_INFLUENCERS_AFFILIATES_CRIADAS.md` (este arquivo)

## Benefícios

1. ✅ Dados normalizados e centralizados
2. ✅ Fácil manutenção (um lugar para atualizar)
3. ✅ Relação many-to-many permite flexibilidade
4. ✅ Porcentagens pré-definidas evitam erros
5. ✅ Filtro por marketplace automático
6. ✅ Histórico e auditoria com timestamps
7. ✅ Segurança com RLS
8. ✅ Performance com índices otimizados
