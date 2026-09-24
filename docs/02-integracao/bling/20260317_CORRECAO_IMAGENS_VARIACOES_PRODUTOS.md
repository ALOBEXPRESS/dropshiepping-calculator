# Correção: Imagens de Variações de Produtos

## Problema Identificado

Produtos com padrões de variação diferentes não estavam exibindo imagens ao navegar pelas variações:

### Produtos Afetados:
1. **BLS102030** (Bolsa Podlinda Anne)
   - Variações no formato: "Unico - Preto", "Unico - Pink", "Unico - Nude", "Unico - Branco"
   - Problema: Algoritmo não reconhecia "Unico" como tamanho

2. **2023596165** (Bolsa PodLinda Jéssica)
   - Variações no formato: "Preto", "Branco", "Pink" (apenas cor, sem tamanho)
   - Problema: Algoritmo exigia que AMBOS cor E tamanho existissem para fazer match

## Análise da Estrutura de Dados

### Produto BLS102030 no Banco:
```json
// products_bling (variações individuais)
{
  "sku": "BLS1020301",
  "variacao_nome": "Cor:Preto;Tamanho:Unico",
  "image_url1": "https://..."
}

// products (variações agregadas)
{
  "variations": [
    { "name": "Unico - Preto" },
    { "name": "Unico - Pink" }
  ]
}
```

### Produto 2023596165 no Banco:
```json
// products_bling (apenas produto pai, sem variações individuais)
{
  "sku": "2023596165",
  "variacao_nome": null,
  "image_url1": "https://..."
}

// products (variações criadas manualmente)
{
  "variations": [
    { "name": "Preto" },
    { "name": "Branco" },
    { "name": "Pink" }
  ]
}
```

## Solução Implementada

### 1. Reconhecimento de "Unico" como Tamanho
Adicionado "unico" ao regex de reconhecimento de tamanhos:
```typescript
if (/^(p|m|g|gg|xg|xxg|pp|pequeno|medio|grande|unico|\d+\/\d+)$/i.test(trimmed)) {
  size = trimmed;
}
```

### 2. Matching Flexível
Modificado o algoritmo de matching para suportar três cenários:

```typescript
const hasColorInBoth = parsed.color && blingParsed.color;
const hasSizeInBoth = parsed.size && blingParsed.size;

if (hasColorInBoth && hasSizeInBoth) {
  // Cenário 1: Ambos têm cor E tamanho - ambos devem corresponder
  return parsed.color === blingParsed.color && parsed.size === blingParsed.size;
} else if (hasColorInBoth && !hasSizeInBoth) {
  // Cenário 2: Apenas cor existe - match apenas por cor
  return parsed.color === blingParsed.color;
} else if (!hasColorInBoth && hasSizeInBoth) {
  // Cenário 3: Apenas tamanho existe - match apenas por tamanho
  return parsed.size === blingParsed.size;
}
```

## Resultados

### Produtos Corrigidos:
- ✅ **BLS102030**: Agora reconhece "Unico" como tamanho e faz match correto
- ✅ **2023596165**: Faz match por cor apenas quando tamanho não existe

### Produtos Mantidos (Compatibilidade):
- ✅ **C1172**: Continua funcionando (formato "P - Branco", "G - Preto")
- ✅ **C1314**: Continua funcionando (formato "P - Branco", "GG - Salmão")
- ✅ **S355**: Continua funcionando (formato "34/35 - Preto", "36/37 - Branco")

## Limitações Conhecidas

### Produto 2023596165 (Bolsa PodLinda Jéssica)
- Não possui variações individuais no `products_bling`
- Apenas o produto pai existe com `variacao_nome: null`
- **Comportamento atual**: Usa imagem do produto pai para todas as variações
- **Solução futura**: Permitir upload manual de imagens de variações ou criar registros no `products_bling`

## Arquivos Modificados

1. **src/services/productService.ts**
   - Função `enrichVariationsWithImages` (linhas ~586-750)
   - Função `parseVariationName` - adicionado "unico"
   - Lógica de matching flexível

## Como Testar Manualmente

1. Acesse http://localhost:5174/produtos
2. Localize o produto "Bolsa Podlinda Anne" (BLS102030)
3. Clique nas setas para navegar entre variações
4. Verifique que cada variação mostra uma imagem diferente:
   - Unico - Preto → Imagem preta
   - Unico - Branco → Imagem branca
   - Unico - Nude → Imagem nude

5. Localize o produto "Bolsa PodLinda Jéssica" (2023596165)
6. Clique nas setas para navegar entre variações
7. Verifique que as variações navegam sem erro (imagem permanece a mesma - comportamento esperado)

## Próximos Passos

1. ✅ Implementar matching flexível
2. ✅ Adicionar suporte para "Unico"
3. ⏳ Criar interface para upload manual de imagens de variações
4. ⏳ Implementar fallback para usar imagem do produto pai quando variação não tem imagem
5. ⏳ Adicionar logs de debug para identificar outros padrões de SKU não suportados

## Commit

```bash
git commit -m "fix: improve variation image matching to support color-only and flexible matching"
```

**Data**: 01/03/2026
**Autor**: Kiro AI Assistant
