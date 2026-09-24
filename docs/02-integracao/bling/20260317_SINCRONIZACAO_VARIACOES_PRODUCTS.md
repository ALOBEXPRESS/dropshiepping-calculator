# Sincronização de Variações entre Tabelas

## Problema Identificado

As variações dos produtos estavam armazenadas em dois locais:
1. **Tabela `product_variations`**: Dados normalizados com todos os campos (sku, image_url, stock_quantity, etc)
2. **Coluna `variations` da tabela `products`**: JSON com dados incompletos (faltando sku, imageUrl, etc)

Isso causava inconsistência no frontend, onde as variações não exibiam:
- SKU da variação
- URL da imagem da variação
- Estoque correto

## Solução Implementada

### Script SQL de Sincronização

Criado script que atualiza a coluna `variations` (JSON) da tabela `products` com os dados completos da tabela `product_variations`:

```sql
UPDATE products p
SET variations = (
  SELECT json_agg(
    json_build_object(
      'id', pv.id,
      'sku', pv.sku,
      'name', pv.variation_name,
      'variationType', CASE 
        WHEN pv.variation_name ~* '(tamanho|size|\d+/\d+|[PPMG]|PP|GG)' THEN 'size'
        ELSE 'color'
      END,
      'cost', REPLACE(pv.cost_price::text, '.', ','),
      'manualPrice', REPLACE(pv.price::text, '.', ','),
      'suggestedPrice', REPLACE(pv.sale_price::text, '.', ','),
      'stockQuantity', pv.stock_quantity::text,
      'imageUrl', pv.image_url,
      'margin', '0',
      'markup', '0',
      'netRevenue', '0'
    )
  )
  FROM product_variations pv
  WHERE pv.product_id = p.id
  AND pv.is_active = true
)
WHERE EXISTS (
  SELECT 1 FROM product_variations pv2 
  WHERE pv2.product_id = p.id
);
```

### Campos Sincronizados

- `id`: ID da variação
- `sku`: SKU completo da variação
- `name`: Nome da variação (variation_name)
- `variationType`: Detectado automaticamente (size ou color)
- `cost`: Custo formatado (vírgula como separador decimal)
- `manualPrice`: Preço de venda
- `suggestedPrice`: Preço sugerido
- `stockQuantity`: Quantidade em estoque
- `imageUrl`: URL da imagem da variação

### Resultados

- **62 produtos** foram atualizados com sucesso
- Todas as variações agora têm dados completos no JSON
- Frontend pode exibir SKU, imagem e estoque corretamente

## Comportamento no Frontend

Após a sincronização, ao selecionar uma variação na tela de edição:
1. ✅ SKU da variação é preenchido automaticamente
2. ✅ URL da imagem da variação é carregada
3. ✅ Estoque correto é exibido
4. ✅ Custo e preço de venda são preenchidos
5. ✅ Dimensões (se existirem) são carregadas

## Manutenção Futura

Para manter a sincronização automática, considere:

1. **Trigger no banco de dados**: Criar trigger que atualiza `products.variations` quando `product_variations` é modificado

2. **Atualização no N8N**: Modificar workflow para atualizar ambas as tabelas simultaneamente

3. **API de sincronização**: Criar endpoint que force sincronização quando necessário

## Data da Sincronização

- **Data**: 09/03/2026
- **Produtos Atualizados**: 62
- **Status**: ✅ Concluído com sucesso
