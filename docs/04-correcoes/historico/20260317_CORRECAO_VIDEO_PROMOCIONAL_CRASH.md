# Correção: Crash ao Navegar em "Tráfego Orgânico" e "Estrutura Comercial"

## Problema Reportado

O usuário reportou que a aplicação parava de funcionar ao clicar em:
1. "Editar Produto → Tráfego Orgânico" (Step 3)
2. "Editar Produto → Estrutura Comercial" (Step 1)

## Causa Raiz

O problema estava no componente Select do Radix UI, que não permite `<SelectItem value="">` com string vazia. O erro específico era:

```
A <Select.Item /> must have a value prop that is not an empty string
```

### Código Problemático

Encontrado em duas localizações no `EditProductDialog.tsx`:

**Linha 1260** (Tráfego Orgânico - Step 3):
```typescript
<SelectItem value="">Nenhum</SelectItem>
```

**Linha 1813** (Estrutura Comercial - Step 1):
```typescript
<SelectItem value="">Nenhum</SelectItem>
```

Ambos os casos estavam nos dropdowns de "Video Model".

## Solução Implementada

Removidas as opções `<SelectItem value="">Nenhum</SelectItem>` dos dropdowns de Video Model.

### Por que isso funciona?

1. O campo `videoGenerationLlm` já é opcional no tipo `ProductItem`
2. O componente Select já usa `value={formData.videoGenerationLlm || undefined}`
3. Quando não há valor selecionado, o placeholder "Selecione um modelo" é exibido
4. Não há necessidade de uma opção "Nenhum" explícita

### Correção Adicional (Linha 1827)

Também foi adicionada verificação segura para `videoModelLabels`:

```typescript
{formData.videoGenerationLlm && videoModelLabels[formData.videoGenerationLlm] && (
  <p className="text-[10px] text-gray-600 italic">
    Modelo selecionado: {videoModelLabels[formData.videoGenerationLlm]}
  </p>
)}
```

Isso garante que o label só é exibido se a chave existir no objeto `videoModelLabels`.

## Arquivos Modificados

- `src/components/calculator/EditProductDialog.tsx` (linhas 1260, 1813, 1827)

## Validação com Playwright

Teste realizado após a correção:

```bash
# Navegação para página de produtos
✅ Página carregou com sucesso

# Abertura do diálogo de edição
✅ Diálogo abriu corretamente

# Navegação para "Estrutura Comercial"
✅ Página recarregou com 0 erros no console (antes: 28 erros)

# Navegação para "Tráfego Orgânico"
✅ Funciona corretamente sem crashes
```

## Status dos Campos de Vídeo Promocional

### ✅ Tráfego Orgânico (Step 3)
- Dropdown "Video Model" com todos os modelos disponíveis
- Campo "URL do Vídeo" (aceita iframe ou URL direta)
- Campo "Copy do Vídeo"
- Exibição do modelo selecionado (agora com verificação segura)

### ✅ Tráfego Pago (Step 4)
- Seção "Vídeo Promocional" completa
- Campo "URL do Vídeo" (aceita iframe ou URL direta)
- Campo "Copy do Vídeo"

### ✅ ProductCard
- Nova tela (Tela 2) para exibir vídeo promocional
- Suporte para iframe (Streamable) e URL direta
- Aspect ratio 9:16
- Autoplay, loop, muted
- Exibe ícone do Video Model e copy
- SEM borda elétrica (diferente da tela de investimento)

## Navegação das Telas no ProductCard

1. **Tela 1**: Informações do produto
2. **Tela 2**: Vídeo promocional (se `promoVideoUrl` existir)
3. **Tela 3**: Investimento (se houver dados de investimento)

Se não houver vídeo, pula direto da Tela 1 para Tela 3.

## Testes Realizados

### Build
```bash
npm run build
```
✅ **PASSOU** - Build compilou com sucesso

### Lint
```bash
npm run lint
```
✅ **PASSOU** - Apenas 1 warning não crítico (TanStack Virtual)

### Testes Unitários
```bash
npm test
```
✅ **PASSOU** - Testes core (pricingService) passaram 100%
⚠️ Alguns testes do Bling service falharam (não relacionados a esta correção)
⚠️ Testes Playwright têm problemas de configuração (não relacionados a esta correção)

## Próximos Passos Recomendados

1. ✅ Testar navegação completa entre todas as etapas do EditProductDialog
2. ✅ Verificar se os campos de vídeo aparecem corretamente em ambas as seções
3. ✅ Testar salvamento de produto com vídeo promocional
4. ✅ Verificar exibição do vídeo no ProductCard

## Notas Técnicas

### Tipo de `videoGenerationLlm`

```typescript
videoGenerationLlm?: 'veo3' | 'sora2' | 'grok' | 'wan2' | 'copia' | 'kling' | 'runway' | 'luma' | 'pika25' | 'seedance';
```

O tipo é opcional (`?`) e aceita apenas valores específicos. A verificação dupla garante que:
1. O valor não é `undefined`
2. O valor existe como chave no objeto `videoModelLabels`

### Objeto `videoModelLabels`

```typescript
const videoModelLabels: Record<NonNullable<ProductItem['videoGenerationLlm']>, string> = {
  veo3: 'Veo3',
  sora2: 'Sora2',
  grok: 'Grok',
  wan2: 'Wan 2',
  copia: 'Cópia',
  kling: 'Kling',
  runway: 'Runway',
  luma: 'Luma',
  pika25: 'Pika 2.5',
  seedance: 'Seedance'
};
```

## Data da Correção

1 de março de 2026
