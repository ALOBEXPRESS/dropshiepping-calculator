# Análise de Relacionamentos do Banco de Dados

## Resumo Executivo

Esta análise identifica oportunidades de relacionamentos (Foreign Keys) no banco de dados, com foco especial nas tabelas `products_bling` e `products`.

**Status Atual**: 3 FKs existentes
**Oportunidades Identificadas**: 7 novos relacionamentos recomendados

---

## 1. Foreign Keys Existentes

### Tabela `products`
- ✅ `organization_id` → `organizations.id`
- ✅ `sales_channel_id` → `sales_channels.id`

### Tabela `products_bling`
- ✅ `organization_id` → `organizations.id`

---

## 2. Relacionamentos Recomendados

### 2.1 ALTA PRIORIDADE

#### A) `products.sku` ↔ `products_bling.sku` (Relacionamento Lógico)
**Status**: ✅ Relacionamento funcional já existe via JOIN
**Tipo**: Relacionamento lógico (não FK física)
**Evidência**: 
- 24 de 25 produtos em `products` têm match em `products_bling` via SKU
- Usado em `bling_order_items` para vincular pedidos

**Recomendação**: Manter como relacionamento lógico (não criar FK) porque:
- SKU não é chave primária em nenhuma tabela
- Permite flexibilidade para produtos sem correspondência no Bling
- Performance adequada com índices

**Ação**: Criar índices para otimizar JOINs

---

#### B) `products_bling.id_produto_pai` → `products_bling.bling_id`
**Status**: ⚠️ CRÍTICO - Relacionamento hierárquico sem FK
**Tipo**: Auto-relacionamento (variações de produto)
**Evidência**:
- Produtos variantes (tamanhos, cores) referenciam produto pai
- Exemplo: "C12332G" (tamanho G) → pai "C1233" (produto base)
- JOIN funciona: `id_produto_pai = bling_id` do produto pai

**Problema Atual**:
- Sem integridade referencial
- Possível deletar produto pai sem deletar variantes
- Dados órfãos se produto pai for removido

**Recomendação**: ✅ CRIAR FK com `ON DELETE CASCADE`

---

#### C) `products.marketplace_id` → `marketplaces.id`
**Status**: ❌ Campo `marketplace` é TEXT, deveria ser UUID FK
**Evidência**:
- `products.marketplace` armazena nomes: "mercadolivre", "shopee", "tiktok"
- `marketplaces` tem 7 registros com nomes: "Mercado Livre", "Shopee", "TikTok"
- **Problema**: Nomes não batem exatamente (case e formato diferentes)

**Impacto**:
- Sem integridade referencial
- Dados inconsistentes (lowercase vs proper case)
- Impossível JOIN direto

**Recomendação**: 
1. ✅ Adicionar coluna `marketplace_id UUID` em `products`
2. ✅ Migrar dados existentes (mapear nomes → IDs)
3. ✅ Criar FK `marketplace_id` → `marketplaces.id`
4. ⚠️ Deprecar coluna `marketplace` (manter por compatibilidade)

---

#### D) `products.supplier_id` → `suppliers.id`
**Status**: ❌ Campo `supplier_name` é TEXT, deveria ser UUID FK
**Evidência**:
- `products.supplier_name` armazena: "ALOBEXPRESS", "Dogama"
- `suppliers` tem 4 registros: "Fornecedor Teste E2E", "Dogama", "Dsers", "Tyr"
- Apenas "Dogama" tem match exato

**Impacto**:
- Sem integridade referencial
- Fornecedor "ALOBEXPRESS" não existe em `suppliers`
- Impossível rastrear comissões e dados do fornecedor

**Recomendação**:
1. ✅ Adicionar coluna `supplier_id UUID` em `products`
2. ✅ Migrar dados existentes (criar fornecedores faltantes)
3. ✅ Criar FK `supplier_id` → `suppliers.id`
4. ⚠️ Deprecar coluna `supplier_name` (manter por compatibilidade)

---

### 2.2 MÉDIA PRIORIDADE

#### E) `products_bling.id_fornecedor` → `suppliers` (Bling ID)
**Status**: ⚠️ Campo TEXT com IDs do Bling, não corresponde a `suppliers.id`
**Evidência**:
- `id_fornecedor` contém IDs do Bling: "754710083", "754710160", etc.
- `suppliers.id` são UUIDs do sistema local
- **Não há campo `bling_supplier_id` em `suppliers`**

**Problema**:
- IDs do Bling não mapeiam para tabela local
- Impossível relacionar fornecedores do Bling com sistema local

**Recomendação**:
1. ✅ Adicionar coluna `bling_supplier_id BIGINT` em `suppliers`
2. ✅ Popular com IDs do Bling via API
3. ✅ Converter `products_bling.id_fornecedor` para BIGINT
4. ✅ Criar FK `id_fornecedor` → `suppliers.bling_supplier_id`

---

#### F) `sales_channels.marketplace` → `marketplaces.id`
**Status**: ❌ Campo TEXT, deveria ser UUID FK
**Evidência**:
- `sales_channels.marketplace` armazena nomes de marketplaces
- Relacionamento lógico com `marketplaces` não formalizado

**Recomendação**:
1. ✅ Adicionar coluna `marketplace_id UUID` em `sales_channels`
2. ✅ Migrar dados existentes
3. ✅ Criar FK `marketplace_id` → `marketplaces.id`
4. ⚠️ Deprecar coluna `marketplace` (manter por compatibilidade)

---

### 2.3 BAIXA PRIORIDADE

#### G) `products_bling.id_categoria` e `grupo_produto_id`
**Status**: ⚠️ Campos TEXT com IDs do Bling, sem tabela local
**Evidência**:
- `id_categoria` contém IDs: "16605084740", "16605084739", etc.
- `grupo_produto_id` contém: "0" (maioria)
- **Não existe tabela `categories` ou `product_groups`**

**Recomendação**: 
- ⏸️ Aguardar necessidade de negócio
- Se necessário, criar tabelas `bling_categories` e `bling_product_groups`
- Sincronizar via API do Bling

---

## 3. Plano de Implementação

### Fase 1: Relacionamentos Críticos (IMEDIATO)
```sql
-- 1. Auto-relacionamento em products_bling
ALTER TABLE products_bling 
ADD CONSTRAINT products_bling_parent_fkey 
FOREIGN KEY (id_produto_pai) 
REFERENCES products_bling(bling_id) 
ON DELETE CASCADE;

-- 2. Índices para performance
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_bling_sku ON products_bling(sku);
CREATE INDEX idx_products_bling_parent ON products_bling(id_produto_pai);
```

### Fase 2: Normalização de Marketplaces (CURTO PRAZO)
```sql
-- 1. Adicionar coluna marketplace_id
ALTER TABLE products ADD COLUMN marketplace_id UUID;

-- 2. Migrar dados (mapear nomes → IDs)
UPDATE products SET marketplace_id = (
  SELECT id FROM marketplaces 
  WHERE LOWER(name) = LOWER(products.marketplace)
  OR (LOWER(name) = 'mercado livre' AND products.marketplace = 'mercadolivre')
);

-- 3. Criar FK
ALTER TABLE products 
ADD CONSTRAINT products_marketplace_fkey 
FOREIGN KEY (marketplace_id) 
REFERENCES marketplaces(id);
```

### Fase 3: Normalização de Suppliers (CURTO PRAZO)
```sql
-- 1. Criar fornecedores faltantes
INSERT INTO suppliers (name, organization_id)
SELECT DISTINCT supplier_name, organization_id
FROM products
WHERE supplier_name IS NOT NULL
  AND supplier_name NOT IN (SELECT name FROM suppliers);

-- 2. Adicionar coluna supplier_id
ALTER TABLE products ADD COLUMN supplier_id UUID;

-- 3. Migrar dados
UPDATE products SET supplier_id = (
  SELECT id FROM suppliers 
  WHERE suppliers.name = products.supplier_name
);

-- 4. Criar FK
ALTER TABLE products 
ADD CONSTRAINT products_supplier_fkey 
FOREIGN KEY (supplier_id) 
REFERENCES suppliers(id);
```

### Fase 4: Integração Bling Suppliers (MÉDIO PRAZO)
```sql
-- 1. Adicionar bling_supplier_id em suppliers
ALTER TABLE suppliers ADD COLUMN bling_supplier_id BIGINT UNIQUE;

-- 2. Popular via API do Bling (código backend necessário)

-- 3. Converter id_fornecedor para BIGINT
ALTER TABLE products_bling 
ALTER COLUMN id_fornecedor TYPE BIGINT USING id_fornecedor::BIGINT;

-- 4. Criar FK
ALTER TABLE products_bling 
ADD CONSTRAINT products_bling_supplier_fkey 
FOREIGN KEY (id_fornecedor) 
REFERENCES suppliers(bling_supplier_id);
```

### Fase 5: Sales Channels Marketplace (MÉDIO PRAZO)
```sql
-- Similar à Fase 2, aplicado em sales_channels
```

---

## 4. Benefícios Esperados

### Integridade de Dados
- ✅ Previne dados órfãos (variantes sem produto pai)
- ✅ Garante consistência de fornecedores e marketplaces
- ✅ Cascata de deleções automática

### Performance
- ✅ Índices otimizam JOINs frequentes
- ✅ Queries mais rápidas em relatórios

### Manutenibilidade
- ✅ Relacionamentos explícitos facilitam entendimento
- ✅ Migrações futuras mais seguras
- ✅ Documentação viva do schema

### Qualidade de Código
- ✅ Backend pode confiar em integridade referencial
- ✅ Menos validações manuais necessárias
- ✅ Queries mais simples e legíveis

---

## 5. Riscos e Mitigações

### Risco 1: Dados Órfãos Existentes
**Problema**: FK pode falhar se houver dados inconsistentes
**Mitigação**: 
- Executar queries de validação antes da migration
- Limpar dados órfãos ou criar registros faltantes

### Risco 2: Performance em Tabelas Grandes
**Problema**: Criar FK em tabela com 440 registros pode travar
**Mitigação**: 
- Executar em horário de baixo uso
- Criar índices ANTES das FKs

### Risco 3: Compatibilidade com Código Existente
**Problema**: Código pode usar campos TEXT antigos
**Mitigação**:
- Manter campos antigos por período de transição
- Atualizar código gradualmente
- Documentar deprecação

---

## 6. Queries de Validação

Execute antes de aplicar migrations:

```sql
-- Validar produtos órfãos (variantes sem pai)
SELECT COUNT(*) as orfaos
FROM products_bling pb1
LEFT JOIN products_bling pb2 ON pb1.id_produto_pai = pb2.bling_id
WHERE pb1.id_produto_pai IS NOT NULL AND pb2.id IS NULL;
-- Esperado: 0

-- Validar marketplaces sem match
SELECT DISTINCT marketplace
FROM products
WHERE marketplace IS NOT NULL
  AND marketplace NOT IN (
    SELECT LOWER(name) FROM marketplaces
  );
-- Esperado: apenas diferenças de case

-- Validar suppliers sem match
SELECT DISTINCT supplier_name
FROM products
WHERE supplier_name IS NOT NULL
  AND supplier_name NOT IN (
    SELECT name FROM suppliers
  );
-- Esperado: lista de fornecedores a criar
```

---

## 7. Próximos Passos

1. ✅ Revisar análise com equipe
2. ⏳ Executar queries de validação
3. ⏳ Aplicar Fase 1 (relacionamentos críticos)
4. ⏳ Testar em ambiente de desenvolvimento
5. ⏳ Aplicar Fase 2 e 3 (normalização)
6. ⏳ Atualizar código backend para usar novos campos
7. ⏳ Documentar mudanças para equipe

---

**Documento gerado em**: 2026-02-23
**Projeto**: oensqhjnxwpcuanozske (sa-east-1)
**Tabelas analisadas**: 34
**Relacionamentos identificados**: 7
