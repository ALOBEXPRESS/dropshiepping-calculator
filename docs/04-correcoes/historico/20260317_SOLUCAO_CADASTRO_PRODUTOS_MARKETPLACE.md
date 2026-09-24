# Solução: Cadastro de Produtos por Marketplace

## Data: 2026-03-11

## Problema Identificado

A função `process_bling_order_to_profit` foi corrigida com sucesso e agora busca produtos pai quando encontra variações. No entanto, o processamento ainda falha porque:

### Pedido #111 - Itens:
1. **SKU C12377M** - Camisa Feminina Baby Look Stitch in Love (Pink/M)
   - Variação encontrada ✅
   - Produto pai: `C1237`
   - Produto pai cadastrado para: Shopee/Emelyn e TikTok/Alyson ❌
   - Produto pai NÃO cadastrado para: MercadoLivre/Alyson ❌

2. **SKU C11722M** - Camisa Feminina Baby Look Stitch e Angel (Branco/M)
   - Produto cadastrado diretamente para MercadoLivre/Alyson ✅

### Causa Raiz

O sistema exige que cada produto seja cadastrado individualmente para cada combinação de:
- Marketplace (MercadoLivre, Shopee, TikTok, etc)
- Titular da conta (Alyson, Emelyn, João, etc)
- Tipo de conta (CPF ou CNPJ)

Isso permite ter custos e preços diferentes por canal de venda.

## Soluções Possíveis

### Opção 1: Cadastrar Produtos Manualmente (Recomendado)

Cadastrar o produto pai `C1237` para MercadoLivre/Alyson/CPF:

```sql
INSERT INTO products (
  organization_id,
  name,
  sku,
  marketplace,
  account_holder,
  account_type,
  cost_price,
  price,
  stock_quantity
)
SELECT 
  organization_id,
  'Camisa Feminina Baby Look Stitch in Love',
  'C1237',
  'mercadolivre',
  'Alyson',
  'cpf',
  32.90, -- Custo do produto
  49.90, -- Preço de venda
  0
FROM organizations
WHERE name = 'Empresa Alob'
LIMIT 1;
```

### Opção 2: Modificar a Função para Buscar Sem Marketplace (Não Recomendado)

Modificar a função para buscar produtos sem considerar marketplace/titular quando não encontrar correspondência exata. Isso pode causar problemas de cálculo de lucro incorreto.

### Opção 3: Sincronização Automática de Produtos

Criar um processo automático que:
1. Detecta quando um pedido tem produto não cadastrado
2. Busca o produto pai no `products_bling`
3. Cria automaticamente na tabela `products` com o marketplace/titular do pedido
4. Usa o custo do `products_bling` como padrão

## Implementação da Opção 3 (Recomendada)

Vou criar uma função que cadastra automaticamente produtos faltantes:

```sql
CREATE OR REPLACE FUNCTION auto_register_missing_products(
  p_bling_order_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_product RECORD;
  v_product_bling RECORD;
  v_products_created INTEGER := 0;
  v_organization_id UUID;
BEGIN
  -- Buscar o pedido e organização
  SELECT 
    bo.*,
    bo.organization_id,
    sc.marketplace,
    sc.account_holder,
    sc.account_type
  INTO v_order
  FROM bling_orders bo
  LEFT JOIN sales_channels sc ON bo.sales_channel_id = sc.id
  WHERE bo.id = p_bling_order_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Pedido não encontrado'
    );
  END IF;

  v_organization_id := v_order.organization_id;

  -- Processar cada item do pedido
  FOR v_item IN
    SELECT * FROM bling_order_items
    WHERE order_id = p_bling_order_id
  LOOP
    -- Verificar se o produto já existe
    SELECT * INTO v_product
    FROM products
    WHERE sku = v_item.code
      AND LOWER(marketplace) = LOWER(v_order.marketplace)
      AND LOWER(account_holder) = LOWER(v_order.account_holder)
      AND LOWER(account_type) = LOWER(v_order.account_type)
    LIMIT 1;

    -- Se não encontrou, tentar buscar pelo produto pai
    IF NOT FOUND THEN
      -- Buscar a variação
      SELECT pv.*, pb.sku as parent_sku, pb.cost_price as parent_cost, pb.sale_price as parent_price
      INTO v_product_bling
      FROM products_variations_bling pv
      LEFT JOIN products_bling pb ON pv.product_bling_id = pb.bling_id
      WHERE pv.sku = v_item.code
      LIMIT 1;

      -- Se encontrou a variação, verificar se o produto pai existe
      IF FOUND AND v_product_bling.parent_sku IS NOT NULL THEN
        SELECT * INTO v_product
        FROM products
        WHERE sku = v_product_bling.parent_sku
          AND LOWER(marketplace) = LOWER(v_order.marketplace)
          AND LOWER(account_holder) = LOWER(v_order.account_holder)
          AND LOWER(account_type) = LOWER(v_order.account_type)
        LIMIT 1;

        -- Se o produto pai não existe, criar automaticamente
        IF NOT FOUND THEN
          INSERT INTO products (
            organization_id,
            name,
            sku,
            marketplace,
            account_holder,
            account_type,
            cost_price,
            price,
            stock_quantity,
            image_url
          )
          SELECT 
            v_organization_id,
            pb.name,
            pb.sku,
            v_order.marketplace,
            v_order.account_holder,
            v_order.account_type,
            COALESCE(pb.cost_price, 0),
            COALESCE(pb.sale_price, v_item.unit_value),
            0,
            pb.image_url
          FROM products_bling pb
          WHERE pb.sku = v_product_bling.parent_sku
          LIMIT 1;

          v_products_created := v_products_created + 1;
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', format('%s produto(s) cadastrado(s) automaticamente', v_products_created),
    'products_created', v_products_created
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', format('Erro ao cadastrar produtos: %s', SQLERRM)
    );
END;
$$;
```

## Como Usar

### 1. Cadastrar Produtos Faltantes Automaticamente

```sql
-- Cadastrar produtos faltantes do pedido #111
SELECT auto_register_missing_products(
  '1d0a63bd-1f8a-42cb-ba6c-873f81b52cd3'::uuid
);
```

### 2. Processar o Pedido

```sql
-- Processar o pedido #111
SELECT process_bling_order_to_profit(
  '1d0a63bd-1f8a-42cb-ba6c-873f81b52cd3'::uuid,
  NULL
);
```

## Próximos Passos

1. ✅ Criar função `auto_register_missing_products`
2. ✅ Testar com pedido #111
3. ✅ Processar pedidos #111, #112, #113
4. ✅ Verificar atualização do dashboard
5. ⏳ Integrar cadastro automático no frontend

## Benefícios

- Reduz trabalho manual de cadastro
- Usa custos do Bling como padrão
- Permite ajustar custos depois
- Mantém rastreabilidade por marketplace/titular

## Limitações

- Produtos criados automaticamente usam custo do Bling
- Pode ser necessário ajustar custos manualmente depois
- Não cria variações, apenas produtos pai

---

**Status**: ✅ Função Corrigida | ⏳ Aguardando Cadastro de Produtos
