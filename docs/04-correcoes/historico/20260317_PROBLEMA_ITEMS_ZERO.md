# Problema: Pedidos com Items = 0

## Situação

Pedidos #96, #100, #101 foram inseridos com sucesso no banco, mas aparecem com "Items: 0" no frontend.

## Investigação

### 1. Verificação no Banco

```sql
SELECT 
  bo.id,
  bo.order_number,
  COUNT(boi.id) as items_count
FROM bling_orders bo
LEFT JOIN bling_order_items boi ON boi.order_id = bo.id
WHERE bo.order_number IN (96, 100, 101)
GROUP BY bo.id, bo.order_number;
```

**Resultado**: `items_count = 0` para todos os pedidos

### 2. Verificação do raw_data

O `raw_data` dos pedidos TEM os itens:

```json
"itens":[{
  "id":19231721103,
  "codigo":"363061",
  "unidade":"UN",
  "quantidade":1,
  "desconto":0,
  "valor":34.9,
  "descricao":"Relógio Feminino Elegance Cor:Dourado e Branco",
  "produto":{"id":16605084774}
}]
```

### 3. Verificação do Produto

Produto SKU 363061 EXISTE em `products_variations_bling`:
- ✅ id: 5fe4349f-4f2a-4caa-9367-95592eb421d3
- ✅ sku: 363061
- ✅ name: Relógio Feminino Elegance Cor:Dourado e Branco

## Causa Raiz Identificada

O workflow estava executando todos os nós corretamente:
1. ✅ "Preparar Itens do pedido1" - Funcionava e retornava itens
2. ✅ "Buscar Produto por SKU" - Encontrava a variação (TRUE branch)
3. ✅ "Preparar dados do item" - Preparava os dados
4. ❌ "Inserir item do pedido" - FALHAVA com erro de FK

**Erro**: `insert or update on table "bling_order_items" violates foreign key constraint "bling_order_items_product_bling_id_fkey"`

**Motivo**: 
- Nó "Preparar dados do item" estava colocando UUID da variação em `product_bling_id`
- Mas `product_bling_id` tem FK para `products_bling` (produtos PAI)
- Deveria usar `product_variation_id` que tem FK para `products_variations_bling`

## Estrutura da Tabela

```sql
-- bling_order_items
product_bling_id UUID → FK para products_bling.id (produtos PAI)
product_variation_id UUID → FK para products_variations_bling.id (variações)
```

## Solução Implementada

### 1. Modificado "Preparar dados do item"

Adicionada lógica para detectar se é variação ou produto PAI:

```javascript
// Detectar se é variação ou produto PAI
// Se tem product_bling_id, é variação (veio de products_variations_bling)
// Se não tem, é produto PAI (veio de products_bling)
const isVariation = !!productFromDB.product_bling_id;
const productBlingId = isVariation ? null : (productFromDB?.id || null);
const productVariationId = isVariation ? (productFromDB?.id || null) : null;

console.log('É variação?', isVariation);
console.log('product_bling_id:', productBlingId);
console.log('product_variation_id:', productVariationId);
```

**Lógica**:
- Se `productFromDB.product_bling_id` existe → É variação
  - `product_bling_id` = NULL
  - `product_variation_id` = UUID da variação
- Se `productFromDB.product_bling_id` NÃO existe → É produto PAI
  - `product_bling_id` = UUID do produto PAI
  - `product_variation_id` = NULL

### 2. Modificado "Inserir item do pedido"

Adicionado campo `product_variation_id`:

```json
{
  "fieldId": "product_variation_id",
  "fieldValue": "={{ $json.product_variation_id }}"
}
```

## Próximos Passos

1. ✅ Importar workflow atualizado no N8N
2. ✅ Testar com pedido novo (clonar venda)
3. ✅ Verificar se items são inseridos corretamente
4. ✅ Verificar se frontend mostra items > 0

## Status

✅ CORREÇÃO IMPLEMENTADA E TESTADA COM SUCESSO

O pedido #103 foi inserido corretamente com 1 item. O fluxo completo está funcional:
1. ✅ Webhook recebe pedido do Bling
2. ✅ "Preparar Itens do pedido1" extrai itens corretamente
3. ✅ "Buscar Produto por SKU" encontra variação
4. ✅ "Preparar dados do item" detecta variação e preenche `product_variation_id`
5. ✅ "Inserir item do pedido" insere com FK correto
6. ✅ Frontend mostra pedido com Items: 1

## Próximo Problema

Ao tentar processar o lucro do pedido #103, aparece erro "Pedido não encontrado".
Ver documentação: `docs/CORRECAO_PROCESSAR_LUCRO_VARIACOES.md`
