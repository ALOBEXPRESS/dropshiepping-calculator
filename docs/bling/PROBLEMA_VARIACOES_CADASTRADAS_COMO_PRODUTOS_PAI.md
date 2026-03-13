# Problema: Variações Sendo Cadastradas como Produtos PAI

## Problema Identificado

Quando você salva um produto com variações no Bling, o webhook está sendo disparado para CADA variação, e o workflow está cadastrando cada variação como um PRODUTO PAI na tabela `products_bling`, ao invés de cadastrá-las na tabela `products_variations_bling`.

## Evidência do Problema

Consultando o banco de dados:

```sql
SELECT name, COUNT(*) as count, array_agg(sku ORDER BY sku) as skus
FROM products_bling 
WHERE name LIKE '%Copo térmico 260ml%'
GROUP BY name;
```

Resultado:
- "Copo térmico 260ml com tampa" (SKU: YEIZ_COPO-TÉRMICO-260ML-C) - PRODUTO PAI ✅
- "Copo térmico 260ml com tampa Cor: Amarelo" (SKU: YEIZ_COPO-TÉRMICO-260ML-C_001) - VARIAÇÃO ❌
- "Copo térmico 260ml com tampa Cor: Azul" (SKU: YEIZ_COPO-TÉRMICO-260ML-C_002) - VARIAÇÃO ❌
- "Copo térmico 260ml com tampa Cor: Branco" (SKU: YEIZ_COPO-TÉRMICO-260ML-C_003) - VARIAÇÃO ❌
- ... e mais 4 variações

## Causa Raiz

O workflow tem a seguinte ordem de execução:

1. Webhook recebe notificação do Bling
2. Busca dados do produto
3. **Faz UPSERT em `products_bling`** ← PROBLEMA AQUI
4. Verifica se é produto pai ou variação
5. Se for produto pai, busca variações

O problema é que o UPSERT acontece ANTES da verificação se é produto pai ou variação. Isso significa que TODAS as variações estão sendo cadastradas como produtos pai.

## Estrutura Correta

### products_bling (Produtos PAI)
- Apenas produtos SEM `variacao.produtoPai.id`
- Exemplo: "Copo térmico 260ml com tampa" (SKU: YEIZ_COPO-TÉRMICO-260ML-C)

### products_variations_bling (Variações)
- Produtos COM `variacao.produtoPai.id`
- Exemplo: "Copo térmico 260ml com tampa Cor: Amarelo" (SKU: YEIZ_COPO-TÉRMICO-260ML-C_001)
- Campos adicionais:
  - `product_id` (UUID) - FK para products_bling
  - `product_bling_id` (bigint) - ID do produto pai no Bling
  - `variacao_nome` - Nome da variação

## Solução Necessária

O workflow precisa ser refatorado para:

1. Webhook recebe notificação do Bling
2. Busca dados do produto
3. **VERIFICAR SE É PRODUTO PAI OU VARIAÇÃO** ← MOVER PARA AQUI
4. Se for PRODUTO PAI:
   - Fazer UPSERT em `products_bling`
   - Buscar e cadastrar variações
5. Se for VARIAÇÃO:
   - Buscar o produto pai
   - Fazer UPSERT em `products_variations_bling`

## Impacto

- Frontend mostra variações como produtos separados
- Duplicação visual de produtos
- Confusão para o usuário
- Dados incorretos na tabela `products_bling`

## Próximos Passos

1. Refatorar o workflow para verificar se é variação ANTES do upsert
2. Criar nó separado para cadastrar variações em `products_variations_bling`
3. Limpar dados incorretos da tabela `products_bling` (remover variações)
4. Testar o fluxo completo
