# Correção: Adicionar Imagem no Relatório de Estoque

## Problema
O relatório de estoque não exibia a imagem do produto, mostrando apenas o nome, preço e quantidade.

## Solução Implementada

### 1. Atualizar Função SQL

Criamos a migration `20260314_add_stock_report_function.sql` que:
- Dropa a função existente `get_stock_report`
- Recria a função incluindo o campo `product_image`
- Prioriza a imagem de `products_bling` sobre `products` usando `COALESCE`

```sql
CREATE OR REPLACE FUNCTION get_stock_report(
    p_organization_id UUID
)
RETURNS TABLE (
    product_name TEXT,
    product_image TEXT,  -- NOVO CAMPO
    price NUMERIC,
    stock_quantity INT,
    stock_status TEXT,
    stock_percentage INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name as product_name,
        COALESCE(pb.image_url, p.image_url) as product_image,  -- Prioriza products_bling
        p.price,
        p.stock_quantity,
        ...
    FROM products p
    LEFT JOIN products_bling pb ON pb.code = p.sku
    WHERE p.organization_id = p_organization_id
    ...
END;
$$ LANGUAGE plpgsql;
```

### 2. Atualizar Type TypeScript

Adicionamos o campo `product_image` ao tipo `StockReport`:

```typescript
export interface StockReport {
  product_name: string;
  product_image: string;  // NOVO CAMPO
  price: number;
  stock_quantity: number;
  stock_status: 'Out of Stock' | 'Low Stock' | 'High Stock';
  stock_percentage: number;
}
```

### 3. Atualizar Componente

Modificamos `StockReportTable.tsx` para exibir a imagem do produto:

```tsx
<div className="flex-shrink-0">
  {item.product_image ? (
    <img
      src={item.product_image}
      alt={item.product_name}
      className="w-16 h-16 rounded-lg object-cover"
      onError={(e) => {
        // Fallback para ícone SVG se imagem falhar
      }}
    />
  ) : (
    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
      {/* Ícone SVG de imagem */}
    </div>
  )}
</div>
```

### Características da Solução

#### Priorização de Imagem
1. Tenta buscar de `products_bling.image_url` (mais atualizado)
2. Se não existir, usa `products.image_url`
3. Se nenhuma existir, mostra placeholder com gradiente azul

#### Fallback Elegante
- Se a imagem existir mas falhar ao carregar, substitui por ícone SVG
- Se não houver imagem, mostra ícone SVG com gradiente azul
- Ícone SVG é responsivo e se adapta ao tema dark/light

#### Layout
- Imagem: 64x64px (w-16 h-16)
- Bordas arredondadas (rounded-lg)
- Object-fit: cover (mantém proporção)
- Posicionamento: flex-shrink-0 (não encolhe)

## Arquivos Modificados
- `supabase/migrations/20260314_add_stock_report_function.sql` - Migration SQL
- `src/types/sales.ts` - Type StockReport
- `src/components/sales/StockReportTable.tsx` - Componente visual
- `docs/correcoes/CORRECAO_IMAGEM_RELATORIO_ESTOQUE.md` - Documentação

## Tecnologias Utilizadas
- PostgreSQL COALESCE para priorização
- LEFT JOIN para buscar imagem de products_bling
- React conditional rendering
- Tailwind CSS para estilização
- SVG inline para ícone placeholder

## Status
✅ Migration aplicada no Supabase
✅ Função SQL retorna product_image
✅ Type TypeScript atualizado
✅ Componente exibe imagem do produto
✅ Fallback elegante para produtos sem imagem

## Resultado Visual
- Cada item do relatório agora mostra:
  - Imagem do produto (64x64px) à esquerda
  - Nome do produto e preço no centro
  - Badge de status à direita
  - Barra de progresso de estoque abaixo
