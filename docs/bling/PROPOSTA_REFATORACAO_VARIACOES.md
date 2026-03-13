# Proposta: Refatoração da Estrutura de Variações

## Problema Atual

A tabela `products_bling` armazena tanto produtos pai quanto variações na mesma tabela usando self-referencing (id_produto_pai → bling_id). Isso causa:

1. **Tabela muito larga**: 39 colunas, muitas irrelevantes para variações
2. **Queries complexas**: Precisa filtrar `WHERE id_produto_pai IS NULL` para produtos pai
3. **Índices ineficientes**: Índices incluem variações desnecessariamente
4. **Confusão semântica**: Campos como `variacao_nome` só fazem sentido para variações

## Estrutura Proposta

### Tabela: `products_bling` (Apenas Produtos Pai)
```sql
CREATE TABLE products_bling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  bling_id bigint UNIQUE NOT NULL,
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  
  -- Dados comerciais
  cost_price numeric,
  sale_price numeric,
  stock_quantity integer,
  
  -- Imagens (produto pai)
  image_url1 text,
  image_url2 text,
  image_url3 text,
  image_url4 text,
  image_url5 text,
  image_url6 text,
  image_url7 text,
  image_url8 text,
  image_url9 text,
  image_url10 text,
  video_url text,
  
  -- Dados físicos
  peso numeric,
  largura numeric,
  altura numeric,
  profundidade numeric,
  unidade_medida text,
  
  -- Dados fiscais
  ncm text,
  ean text,
  id_categoria text,
  id_fornecedor text,
  sku_fornecedor text,
  grupo_produto_id text,
  
  -- Outros
  descricao text,
  itens_por_caixa integer,
  localizacao text,
  situacao text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices otimizados
CREATE INDEX idx_products_bling_org ON products_bling(organization_id);
CREATE INDEX idx_products_bling_sku ON products_bling(sku);
CREATE INDEX idx_products_bling_updated ON products_bling(updated_at DESC);
```

### Tabela: `products_variations_bling` (Apenas Variações)
```sql
CREATE TABLE products_variations_bling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  
  -- Relacionamento com produto pai
  product_id uuid NOT NULL REFERENCES products_bling(id) ON DELETE CASCADE,
  product_bling_id bigint NOT NULL REFERENCES products_bling(bling_id),
  
  -- Dados da variação no Bling
  bling_id bigint UNIQUE NOT NULL,
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  variacao_nome text NOT NULL, -- Ex: "Cor:Dourado e Branco"
  
  -- Dados comerciais (podem diferir do pai)
  cost_price numeric,
  sale_price numeric,
  stock_quantity integer,
  
  -- Imagens específicas da variação (opcional)
  image_url1 text,
  image_url2 text,
  image_url3 text,
  
  -- Dados físicos (podem diferir do pai)
  peso numeric,
  largura numeric,
  altura numeric,
  profundidade numeric,
  
  -- Dados fiscais (podem diferir do pai)
  ean text,
  sku_fornecedor text,
  
  -- Status
  situacao text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices otimizados
CREATE INDEX idx_variations_product ON products_variations_bling(product_id);
CREATE INDEX idx_variations_product_bling ON products_variations_bling(product_bling_id);
CREATE INDEX idx_variations_sku ON products_variations_bling(sku);
CREATE INDEX idx_variations_org ON products_variations_bling(organization_id);
```

## Vantagens da Nova Estrutura

### 1. Separação de Responsabilidades
- `products_bling`: Apenas produtos pai (188 registros)
- `products_variations_bling`: Apenas variações (~1000+ registros)

### 2. Queries Mais Eficientes
```sql
-- Buscar apenas produtos pai (SEM filtro WHERE)
SELECT * FROM products_bling;

-- Buscar produto com variações (JOIN simples)
SELECT 
  p.*,
  v.sku as variation_sku,
  v.variacao_nome,
  v.stock_quantity as variation_stock
FROM products_bling p
LEFT JOIN products_variations_bling v ON v.product_id = p.id
WHERE p.sku = '2023165366';
```

### 3. Índices Menores e Mais Rápidos
- Índices em `products_bling` não incluem variações
- Índices em `products_variations_bling` são específicos

### 4. Integridade Referencial
- `ON DELETE CASCADE`: Deletar produto pai remove variações automaticamente
- Impossível ter variação órfã

### 5. Escalabilidade
- Produtos pai crescem devagar (~200)
- Variações crescem rápido (~1000+)
- Tabelas separadas = melhor performance

## Migração

### Passo 1: Criar Nova Tabela
```sql
-- Criar tabela de variações
CREATE TABLE products_variations_bling (
  -- ... estrutura acima
);
```

### Passo 2: Migrar Dados Existentes
```sql
-- Migrar variações para nova tabela
INSERT INTO products_variations_bling (
  organization_id,
  product_id,
  product_bling_id,
  bling_id,
  sku,
  name,
  variacao_nome,
  cost_price,
  sale_price,
  stock_quantity,
  image_url1,
  image_url2,
  image_url3,
  peso,
  largura,
  altura,
  profundidade,
  ean,
  sku_fornecedor,
  situacao,
  created_at,
  updated_at
)
SELECT 
  v.organization_id,
  p.id as product_id,
  v.id_produto_pai as product_bling_id,
  v.bling_id,
  v.sku,
  v.name,
  v.variacao_nome,
  v.cost_price,
  v.sale_price,
  v.stock_quantity,
  v.image_url1,
  v.image_url2,
  v.image_url3,
  v.peso,
  v.largura,
  v.altura,
  v.profundidade,
  v.ean,
  v.sku_fornecedor,
  v.situacao,
  v.created_at,
  v.updated_at
FROM products_bling v
INNER JOIN products_bling p ON p.bling_id = v.id_produto_pai
WHERE v.id_produto_pai IS NOT NULL;
```

### Passo 3: Remover Variações da Tabela Original
```sql
-- Deletar variações (manter apenas produtos pai)
DELETE FROM products_bling
WHERE id_produto_pai IS NOT NULL;
```

### Passo 4: Remover Coluna id_produto_pai
```sql
-- Remover coluna desnecessária
ALTER TABLE products_bling DROP COLUMN id_produto_pai;
ALTER TABLE products_bling DROP COLUMN variacao_nome;
```

## Impacto no Código

### Workflow N8N
- Modificar nó "Cadastrar Variação no Banco" para usar `products_variations_bling`
- Adicionar `product_id` (buscar pelo `product_bling_id`)

### Function `process_bling_order_to_profit`
```sql
-- ANTES
SELECT * FROM products_bling WHERE sku = $1;

-- DEPOIS (buscar em ambas as tabelas)
SELECT * FROM products_bling WHERE sku = $1
UNION ALL
SELECT * FROM products_variations_bling WHERE sku = $1;
```

### Frontend (ProductService)
```typescript
// Buscar produto com variações
const { data: product } = await supabase
  .from('products_bling')
  .select(`
    *,
    variations:products_variations_bling(*)
  `)
  .eq('sku', sku)
  .single();
```

## Decisão

**RECOMENDAÇÃO**: Implementar a refatoração

**Quando**: Após validar que o workflow atual está funcionando corretamente

**Prioridade**: MÉDIA (não é urgente, mas melhora significativamente a estrutura)

## Alternativa: Manter Estrutura Atual

Se preferir manter a estrutura atual (self-referencing), pelo menos adicione:

1. **Índice parcial** para produtos pai:
```sql
CREATE INDEX idx_products_pai ON products_bling(bling_id) 
WHERE id_produto_pai IS NULL;
```

2. **Índice para variações**:
```sql
CREATE INDEX idx_products_variacoes ON products_bling(id_produto_pai) 
WHERE id_produto_pai IS NOT NULL;
```

3. **View** para simplificar queries:
```sql
CREATE VIEW products_pai AS
SELECT * FROM products_bling WHERE id_produto_pai IS NULL;

CREATE VIEW products_variacoes AS
SELECT * FROM products_bling WHERE id_produto_pai IS NOT NULL;
```
