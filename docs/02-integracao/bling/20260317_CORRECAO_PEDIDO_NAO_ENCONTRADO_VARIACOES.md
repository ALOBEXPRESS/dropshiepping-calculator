# Correção: Pedido Não Encontrado (Variações)

## Problema

Ao processar o pedido #94 com a variação SKU 363061 (Relógio Feminino Elegance Cor:Dourado e Branco), o sistema retornava erro "Pedido não encontrado".

## Causa

A function `process_bling_order_to_profit` estava buscando produtos apenas em `products_bling` (produtos PAI), mas não em `products_variations_bling` (variações).

Quando um pedido continha uma variação, o sistema não encontrava o produto e retornava erro.

## Solução Implementada

Modifiquei a function `process_bling_order_to_profit` para buscar produtos na seguinte ordem:

### 1. Busca por product_id (se disponível)
```sql
SELECT 
    p.id,
    COALESCE(pb.name, p.name) as name,
    COALESCE(pb.image_url, p.image_url) as image_url,
    COALESCE(pb.cost_price, p.cost_price, 0) as cost_price,
    COALESCE(pb.sale_price, p.price, 0) as sale_price
INTO v_product
FROM products p
LEFT JOIN products_bling pb ON pb.sku = p.sku
WHERE p.id = v_item.product_id;
```

### 2. Busca por SKU em products_variations_bling (NOVO!)
```sql
SELECT 
    pv.product_id as id,
    pv.name,
    pv.image_url1 as image_url,
    COALESCE(pv.cost_price, 0) as cost_price,
    COALESCE(pv.sale_price, 0) as sale_price
INTO v_product
FROM products_variations_bling pv
WHERE pv.sku = v_item.code
LIMIT 1;
```

### 3. Busca por SKU em products_bling (fallback)
```sql
SELECT 
    p.id,
    COALESCE(pb.name, p.name, v_item.description) as name,
    COALESCE(pb.image_url, p.image_url) as image_url,
    COALESCE(pb.cost_price, p.cost_price, 0) as cost_price,
    COALESCE(pb.sale_price, p.price, v_item.unit_value) as sale_price
INTO v_product
FROM products_bling pb
LEFT JOIN products p ON p.sku = pb.sku
WHERE pb.sku = v_item.code
LIMIT 1;
```

### 4. Valores padrão (se não encontrar em nenhum lugar)
```sql
v_product.id := v_item.product_id;
v_product.name := v_item.description;
v_product.image_url := NULL;
v_product.cost_price := 0;
v_product.sale_price := v_item.unit_value;
```

## Ordem de Busca

1. ✅ Busca por `product_id` vinculado
2. ✅ Busca por SKU em `products_variations_bling` ← NOVO!
3. ✅ Busca por SKU em `products_bling`
4. ✅ Usa valores padrão do item

## Benefícios

1. ✅ Suporta pedidos com variações
2. ✅ Suporta pedidos com produtos PAI
3. ✅ Fallback para valores padrão se não encontrar
4. ✅ Mantém compatibilidade com código existente

## Teste

Para testar:

1. Processar o pedido #94 (SKU 363061 - variação)
2. Verificar que o pedido é processado com sucesso
3. Verificar que o custo e lucro são calculados corretamente
4. Verificar que a imagem e nome da variação aparecem

## Validação

Variação SKU 363061 existe em `products_variations_bling`:
```sql
SELECT * FROM products_variations_bling WHERE sku = '363061';
```

Resultado:
- ✅ id: 5fe4349f-4f2a-4caa-9367-95592eb421d3
- ✅ bling_id: 16605084774
- ✅ product_id: 441c9754-f5c3-4601-8d79-84cc699f73be
- ✅ sku: 363061
- ✅ name: Relógio Feminino Elegance Cor:Dourado e Branco
- ✅ sale_price: 34.9
- ✅ cost_price: 0

## Status

✅ Function atualizada
✅ Busca em variações implementada
✅ Ordem de busca otimizada
⏳ Aguardando teste do pedido #94

## Arquivo Modificado

- Function `process_bling_order_to_profit` no Supabase

## Próximos Passos

1. Testar processamento do pedido #94
2. Verificar se o lucro é calculado corretamente
3. Validar que a imagem e nome da variação aparecem
4. Testar com outros pedidos que contenham variações
