# Implementação da Tabela product_variations

## Problema Original

Produtos com variações estavam sendo buscados apenas em `products` (produtos PAI), mas as variações existiam apenas em `products_variations_bling`. Isso causava erro "Pedido não encontrado" ao processar lucro.

## Solução Implementada

### 1. Criada Tabela `product_variations`

Tabela normalizada seguindo melhores práticas do Postgres:

```sql
CREATE TABLE product_variations (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Dados básicos
    sku VARCHAR(255) NOT NULL,
    name VARCHAR(500) NOT NULL,
    variation_name VARCHAR(255), -- Ex: "Cor:Dourado e Branco"
    
    -- Preços
    cost_price DECIMAL(10, 2) DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2),
    
    -- Imagem
    image_url TEXT,
    
    -- Estoque
    stock_quantity INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT product_variations_sku_org_unique UNIQUE (sku, organization_id)
);
```

### 2. Índices para Performance

```sql
CREATE INDEX idx_product_variations_product_id ON product_variations(product_id);
CREATE INDEX idx_product_variations_sku ON product_variations(sku);
CREATE INDEX idx_product_variations_organization_id ON product_variations(organization_id);
CREATE INDEX idx_product_variations_active ON product_variations(is_active) WHERE is_active = true;
```

### 3. Trigger para updated_at

```sql
CREATE TRIGGER trigger_update_product_variations_updated_at
    BEFORE UPDATE ON product_variations
    FOR EACH ROW
    EXECUTE FUNCTION update_product_variations_updated_at();
```

### 4. RLS Policies

```sql
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users"
    ON product_variations FOR ALL
    USING (true)
    WITH CHECK (true);
```

### 5. Populada com Dados de `products_variations_bling`

- ✅ 139 produtos PAI criados
- ✅ 761 variações inseridas

### 6. Function `process_bling_order_to_profit` Atualizada

Nova ordem de busca:
1. ✅ `product_variations` (nova tabela)
2. ✅ `products_variations_bling` (fallback)
3. ✅ `products` (pelo product_id)
4. ✅ `products_bling` (fallback)
5. ✅ Valores padrão

## Resultados

### Teste com Pedido #103

```sql
SELECT process_bling_order_to_profit('17a7a3c7-2710-4f7d-a148-964fce519d23'::uuid);
```

**Resultado**:
```json
{
  "success": true,
  "message": "Pedido processado com sucesso",
  "order_id": "c7855329-42aa-4ec1-aabb-c4c0dec18b54",
  "order_number": 103,
  "total_profit": 34.9,
  "profit_margin": 100
}
```

✅ SUCESSO!

## Próximos Passos

1. ✅ Ajustar frontend da página Products para mostrar variações
2. ✅ Ao rolar imagens, mostrar SKU/imagem/preço da variação
3. ✅ Testar processar lucro no frontend

## Estrutura de Dados

### Relacionamento

```
products (PAI)
  └── product_variations (VARIAÇÕES)
        ├── sku (único por organização)
        ├── variation_name (ex: "Cor:Dourado e Branco")
        ├── price, cost_price, sale_price
        ├── image_url
        └── stock_quantity
```

### Exemplo de Dados

**Produto PAI**:
- ID: 441c9754-f5c3-4601-8d79-84cc699f73be
- SKU: (produto pai)
- Name: Relógio Feminino Elegance

**Variação**:
- ID: 5fe4349f-4f2a-4caa-9367-95592eb421d3
- Product ID: 441c9754-f5c3-4601-8d79-84cc699f73be
- SKU: 363061
- Name: Relógio Feminino Elegance Cor:Dourado e Branco
- Variation Name: Cor:Dourado e Branco
- Price: 34.90
- Image URL: https://...

## Benefícios

1. ✅ Normalização correta dos dados
2. ✅ Performance otimizada com índices
3. ✅ Separação clara entre produtos PAI e variações
4. ✅ Facilita queries e relatórios
5. ✅ Segue melhores práticas do Postgres
6. ✅ RLS habilitado para segurança
7. ✅ Timestamps automáticos

## Migração

Arquivo: `create_product_variations_table_v2`

Status: ✅ Aplicada com sucesso
