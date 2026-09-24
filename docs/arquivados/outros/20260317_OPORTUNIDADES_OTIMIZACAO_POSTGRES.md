# Oportunidades de Otimização - Postgres Best Practices

## 🔍 Análise Realizada

**Data**: 2026-02-23  
**Baseado em**: Supabase Postgres Best Practices  
**Tabelas Analisadas**: products, products_bling, sales_channels, bling_order_items, suppliers, marketplaces

---

## 📊 Descobertas

### 1. RLS Policies com Subqueries (CRÍTICO)
**Problema**: Todas as tabelas principais usam `EXISTS` subquery em RLS policies

**Exemplo Atual**:
```sql
-- Policy em products
CREATE POLICY "products_org_access" ON products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM organization_members m
    WHERE m.organization_id = products.organization_id
      AND m.user_id = auth.uid()
  )
);
```

**Impacto**:
- ❌ Subquery executada para CADA linha retornada
- ❌ Performance degrada com muitos produtos
- ❌ Sem cache de resultados

**Best Practice**: Usar JOIN ou função com cache

---

### 2. Índices Faltantes em Colunas de JOIN (ALTO)
**Problema**: Colunas usadas em JOINs sem índices

**Colunas Sem Índice**:
- `bling_order_items.product_bling_id` (FK para products_bling)
- `bling_order_items.product_id` (FK para products)
- `products.organization_id` (usado em RLS)
- `products_bling.organization_id` (usado em RLS)
- `sales_channels.organization_id` (usado em RLS)

**Impacto**:
- ❌ Full table scan em JOINs
- ❌ RLS policies lentas
- ❌ Queries de relatórios ineficientes

---

### 3. Colunas JSONB Sem Índices GIN (MÉDIO)
**Problema**: 5 colunas JSONB sem índices para queries

**Colunas JSONB**:
- `products.variations` (variações de produto)
- `products.influencers` (marketing de influenciadores)
- `products.affiliates` (marketing de afiliados)
- `products.organic_channel_links` (links de canais)
- `products.organic_channel_names` (nomes de canais)

**Impacto**:
- ❌ Queries em JSONB fazem full scan
- ❌ Filtros por campos JSONB lentos
- ❌ Impossível usar índices para `@>`, `?`, `?&` operators

---

### 4. Índices Maiores que Tabelas (MÉDIO)
**Problema**: Índices ocupam mais espaço que dados

**Estatísticas**:
| Tabela | Tamanho Dados | Tamanho Índices | Ratio |
|--------|---------------|-----------------|-------|
| products_bling | 312 kB | 536 kB | 1.7x |
| bling_orders | 104 kB | 240 kB | 2.3x |
| products | 112 kB | 136 kB | 1.2x |
| bling_order_items | 8 kB | 104 kB | 13x |

**Impacto**:
- ⚠️ Uso excessivo de disco
- ⚠️ Cache menos eficiente
- ⚠️ Possíveis índices duplicados ou desnecessários

---

### 5. Falta de Índices Compostos (MÉDIO)
**Problema**: Queries comuns usam múltiplas colunas sem índice composto

**Queries Comuns Identificadas**:
```sql
-- Query 1: Produtos por organização e marketplace
SELECT * FROM products 
WHERE organization_id = ? AND marketplace_id = ?;

-- Query 2: Produtos Bling por organização e SKU
SELECT * FROM products_bling 
WHERE organization_id = ? AND sku = ?;

-- Query 3: Itens de pedido por produto
SELECT * FROM bling_order_items 
WHERE product_id = ? AND order_id = ?;
```

**Impacto**:
- ❌ Índice usado apenas para primeira coluna
- ❌ Segunda coluna faz scan sequencial
- ❌ Performance subótima em queries multi-coluna

---

## 🎯 Recomendações Prioritizadas

### PRIORIDADE 1: Otimizar RLS Policies (CRÍTICO)

#### Solução 1: Criar Função com Cache
```sql
-- Função com cache para verificar acesso
CREATE OR REPLACE FUNCTION user_has_org_access(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Atualizar policy
CREATE POLICY "products_org_access" ON products
FOR ALL USING (user_has_org_access(organization_id));
```

**Benefício**: ~3-5x mais rápido em queries com múltiplas linhas

#### Solução 2: Índice para RLS
```sql
-- Índice composto para organization_members (usado em RLS)
CREATE INDEX idx_org_members_org_user 
ON organization_members(organization_id, user_id);
```

**Benefício**: Subquery em RLS usa índice ao invés de scan

---

### PRIORIDADE 2: Adicionar Índices em FKs (ALTO)

```sql
-- Índices para bling_order_items (JOINs frequentes)
CREATE INDEX idx_bling_order_items_product_bling_id 
ON bling_order_items(product_bling_id) 
WHERE product_bling_id IS NOT NULL;

CREATE INDEX idx_bling_order_items_product_id 
ON bling_order_items(product_id) 
WHERE product_id IS NOT NULL;

-- Índices para organization_id (usado em RLS)
CREATE INDEX idx_products_organization_id 
ON products(organization_id);

CREATE INDEX idx_products_bling_organization_id 
ON products_bling(organization_id);

CREATE INDEX idx_sales_channels_organization_id 
ON sales_channels(organization_id);
```

**Benefício**: JOINs e RLS até 10x mais rápidos

---

### PRIORIDADE 3: Índices GIN para JSONB (MÉDIO)

```sql
-- Índice GIN para variations (queries por atributos)
CREATE INDEX idx_products_variations_gin 
ON products USING GIN (variations);

-- Índice GIN para influencers (filtros por influenciador)
CREATE INDEX idx_products_influencers_gin 
ON products USING GIN (influencers);

-- Índice GIN para affiliates (filtros por afiliado)
CREATE INDEX idx_products_affiliates_gin 
ON products USING GIN (affiliates);
```

**Benefício**: Queries JSONB até 100x mais rápidas

**Uso**:
```sql
-- Buscar produtos com variação específica
SELECT * FROM products 
WHERE variations @> '{"color": "red"}';

-- Buscar produtos de influenciador específico
SELECT * FROM products 
WHERE influencers @> '[{"name": "João"}]';
```

---

### PRIORIDADE 4: Índices Compostos (MÉDIO)

```sql
-- Índice composto para queries comuns
CREATE INDEX idx_products_org_marketplace 
ON products(organization_id, marketplace_id) 
WHERE marketplace_id IS NOT NULL;

CREATE INDEX idx_products_bling_org_sku 
ON products_bling(organization_id, sku) 
WHERE sku IS NOT NULL;

CREATE INDEX idx_bling_order_items_product_order 
ON bling_order_items(product_id, order_id);
```

**Benefício**: Queries multi-coluna até 5x mais rápidas

---

### PRIORIDADE 5: Revisar Índices Existentes (BAIXO)

```sql
-- Analisar uso de índices
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0  -- Índices nunca usados
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Ação**: Remover índices não utilizados

---

## 📈 Impacto Estimado

### Performance
| Otimização | Ganho Estimado | Tabelas Afetadas |
|------------|----------------|------------------|
| RLS com função cache | 3-5x | Todas com RLS |
| Índices em FKs | 10x | bling_order_items |
| Índices GIN JSONB | 100x | products |
| Índices compostos | 5x | products, products_bling |

### Espaço em Disco
| Otimização | Impacto | Estimativa |
|------------|---------|------------|
| Índices novos | +200 kB | Aceitável |
| Remoção de índices não usados | -50 kB | Economia |
| Total | +150 kB | ~15% aumento |

---

## 🚀 Plano de Implementação

### Fase 1: Otimizações Críticas (Imediato)
1. Criar função `user_has_org_access` com cache
2. Atualizar RLS policies para usar função
3. Adicionar índices em `organization_id`
4. Adicionar índices em `bling_order_items` FKs

**Tempo Estimado**: 30 minutos  
**Ganho**: 5-10x em queries com RLS

---

### Fase 2: Índices JSONB (Curto Prazo)
1. Adicionar índices GIN em colunas JSONB
2. Testar queries com operadores JSONB
3. Documentar uso de índices GIN

**Tempo Estimado**: 15 minutos  
**Ganho**: 100x em queries JSONB

---

### Fase 3: Índices Compostos (Médio Prazo)
1. Identificar queries mais frequentes
2. Criar índices compostos
3. Monitorar uso com pg_stat_user_indexes

**Tempo Estimado**: 30 minutos  
**Ganho**: 5x em queries multi-coluna

---

### Fase 4: Limpeza (Longo Prazo)
1. Analisar índices não utilizados
2. Remover índices desnecessários
3. Otimizar tamanho de índices

**Tempo Estimado**: 1 hora  
**Ganho**: Economia de espaço e cache

---

## 🧪 Testes Recomendados

### Teste 1: Performance de RLS
```sql
-- ANTES
EXPLAIN ANALYZE
SELECT * FROM products WHERE organization_id = 'uuid-here';

-- DEPOIS (com função cache)
EXPLAIN ANALYZE
SELECT * FROM products WHERE organization_id = 'uuid-here';

-- Verificar: Execution time deve ser 3-5x menor
```

### Teste 2: JOINs com bling_order_items
```sql
-- ANTES
EXPLAIN ANALYZE
SELECT oi.*, p.name, pb.sku
FROM bling_order_items oi
JOIN products p ON oi.product_id = p.id
JOIN products_bling pb ON oi.product_bling_id = pb.id;

-- DEPOIS (com índices)
-- Verificar: Deve usar Index Scan ao invés de Seq Scan
```

### Teste 3: Queries JSONB
```sql
-- ANTES
EXPLAIN ANALYZE
SELECT * FROM products 
WHERE variations @> '{"color": "red"}';

-- DEPOIS (com índice GIN)
-- Verificar: Deve usar Bitmap Index Scan
```

---

## 📚 Referências

### Supabase Best Practices Aplicadas
1. **query-missing-indexes**: Adicionar índices em colunas de JOIN
2. **schema-partial-indexes**: Usar índices parciais com WHERE NOT NULL
3. **security-rls-performance**: Otimizar RLS policies com funções
4. **data-jsonb-indexing**: Usar índices GIN para JSONB
5. **schema-composite-indexes**: Criar índices compostos para queries comuns

### Documentação
- [Postgres Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [GIN Indexes for JSONB](https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING)
- [RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#performance)

---

## ✅ Checklist de Implementação

### Fase 1: Crítico
- [ ] Criar função `user_has_org_access`
- [ ] Atualizar RLS policies
- [ ] Adicionar índice em `organization_members`
- [ ] Adicionar índices em `organization_id`
- [ ] Adicionar índices em `bling_order_items` FKs
- [ ] Testar performance de RLS

### Fase 2: JSONB
- [ ] Adicionar índices GIN em JSONB
- [ ] Testar queries JSONB
- [ ] Documentar uso

### Fase 3: Compostos
- [ ] Criar índices compostos
- [ ] Monitorar uso
- [ ] Ajustar conforme necessário

### Fase 4: Limpeza
- [ ] Analisar índices não usados
- [ ] Remover índices desnecessários
- [ ] Documentar mudanças

---

**Status**: 📋 ANÁLISE COMPLETA  
**Próxima Ação**: Implementar Fase 1 (Otimizações Críticas)
