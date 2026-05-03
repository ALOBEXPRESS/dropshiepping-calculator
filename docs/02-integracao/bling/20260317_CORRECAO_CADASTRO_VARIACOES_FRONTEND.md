# Correção: Cadastro de Variações no Frontend

## Problema Identificado

Quando um produto com variações é cadastrado através da tela "Produtos Integrados":
1. A variação específica é cadastrada como produto principal no card
2. O produto pai não aparece na capa do card
3. As informações das variações (imagens, SKU, preço, estoque, vendas) não são exibidas corretamente

## Comportamento Esperado

1. **Card do Produto**: Deve mostrar o produto PAI na capa
2. **Navegação de Variações**: Setas para navegar entre as variações
3. **Tela de Edição**: Deve mostrar todas as variações com suas informações:
   - Imagens de cada variação
   - SKU de cada variação
   - Preço de venda de cada variação
   - Estoque de cada variação
   - Total de vendas de cada variação

## Análise do Código Atual

### ProductCard.tsx (Produtos Integrados)
- ✅ Já exibe o produto pai corretamente
- ✅ Já tem navegação entre variações
- ✅ Já mostra informações da variação selecionada

### useProductsBling.ts
- ✅ Busca produtos pai da tabela `products_bling`
- ✅ Busca variações da tabela `products_variations_bling`
- ✅ Agrupa corretamente produtos pai com suas variações

### ProductsLoaded.tsx
- ✅ Agrupa produtos pai com variações
- ✅ Passa `product` (pai) e `variations` para o ProductCard

## Problema Real

O problema está no **cadastro** dos produtos na calculadora. Quando o usuário clica em "Preencher" ou "Cadastrado", o sistema está cadastrando apenas a variação selecionada, não o produto pai com todas as variações.

## Solução

### 1. Modificar a função `onFill` para cadastrar produto pai + variações

Localização: `src/components/DropshippingCalculator.tsx`

A função deve:
1. Verificar se é um produto com variações
2. Se sim, cadastrar o produto PAI primeiro
3. Depois cadastrar todas as variações vinculadas ao produto pai
4. Atualizar a tabela `products` com o produto pai
5. Criar registros na tabela de variações (se existir) para cada variação

### 2. Estrutura de Dados

```typescript
// Produto PAI
{
  id: 'uuid-produto-pai',
  name: 'Relógio Feminino Elegance',
  sku: '2023165366', // SKU do produto pai
  bling_product_id: 'id-do-bling',
  // ... outros campos
}

// Variações
[
  {
    id: 'uuid-variacao-1',
    parent_product_id: 'uuid-produto-pai',
    name: 'Relógio Feminino Elegance Cor:Dourado e Branco',
    sku: '363061',
    variation_name: 'Cor:Dourado e Branco',
    image_url: 'url-da-variacao',
    // ... outros campos
  },
  {
    id: 'uuid-variacao-2',
    parent_product_id: 'uuid-produto-pai',
    name: 'Relógio Feminino Elegance Cor:Preto',
    sku: '363062',
    variation_name: 'Cor:Preto',
    // ... outros campos
  }
]
```

### 3. Tela de Edição

A tela de edição deve:
1. Mostrar informações do produto pai no topo
2. Ter uma seção "Variações" com cards para cada variação
3. Cada card de variação deve mostrar:
   - Imagem da variação
   - Nome da variação
   - SKU
   - Preço de venda
   - Custo
   - Estoque
   - Total de vendas
4. Permitir editar cada variação individualmente

## Próximos Passos

1. ✅ Identificar onde está a função `onFill` no código
2. ⏳ Modificar `onFill` para cadastrar produto pai + variações
3. ⏳ Verificar/criar tabela de variações no banco
4. ⏳ Atualizar tela de edição para mostrar variações
5. ⏳ Testar fluxo completo de cadastro
