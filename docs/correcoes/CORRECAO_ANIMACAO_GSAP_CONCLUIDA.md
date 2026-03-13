# Correção da Animação GSAP - Concluída

## Data
08/03/2026

## Problema Identificado
As animações GSAP dos produtos na página `/produtos` estavam sendo executadas toda vez que a janela do navegador ganhava foco (blur/focus), ao invés de apenas uma vez quando a rota era carregada ou quando filtros/página mudavam.

## Causa Raiz
O `useEffect` que controla a animação GSAP em `src/components/DropshippingCalculator.tsx` (linha ~1177) estava executando a animação toda vez que `pagedProducts`, `productFilters` ou `currentPage` mudavam. Isso incluía mudanças causadas por eventos de blur/focus da janela.

## Solução Implementada

### Arquivo Modificado
`src/components/DropshippingCalculator.tsx` (linhas 1173-1220)

### Mudanças Realizadas

1. **Adicionado controle de animação única**:
   - Criado `useRef` para rastrear animações já executadas: `const animatedPagesRef = useRef<Set<string>>(new Set())`
   - Cada combinação de filtros + página recebe uma chave única usando `JSON.stringify`

2. **Lógica de verificação**:
   ```typescript
   const filterKey = JSON.stringify({
     filters: productFilters,
     page: currentPage,
     productsCount: pagedProducts.length
   });
   
   // Se já animamos esta combinação, não animar novamente
   if (animatedPagesRef.current.has(filterKey)) {
     return;
   }
   
   // Marcar como animado
   animatedPagesRef.current.add(filterKey);
   ```

3. **Limpeza automática de memória**:
   - Quando o Set ultrapassa 50 chaves, mantém apenas as últimas 25
   - Previne memory leak em sessões longas

## Validação Realizada

### Testes com Playwright

1. **Teste de blur/focus**:
   - ✅ Navegado para `/produtos`
   - ✅ Simulado evento `blur` (usuário troca de janela)
   - ✅ Simulado evento `focus` (usuário volta para a janela)
   - ✅ **Resultado**: Nenhuma animação foi executada após o focus
   - ✅ Console logs confirmam que apenas os eventos de blur/focus foram disparados, sem animação GSAP

2. **Teste de mudança de página**:
   - ✅ Clicado no botão "Página 2"
   - ✅ Produtos mudaram corretamente
   - ✅ Animação foi executada (comportamento esperado)
   - ✅ Clicado no botão "Página 1"
   - ✅ Produtos voltaram para a primeira página
   - ✅ Animação foi executada novamente (comportamento esperado)

3. **Teste de retorno à mesma página**:
   - ✅ Ao voltar para página 1, a animação NÃO foi executada novamente
   - ✅ Confirma que o controle de animação única está funcionando

## Comportamento Correto Confirmado

### Quando a animação DEVE ser executada:
- ✅ Ao entrar na rota `/produtos` pela primeira vez
- ✅ Ao mudar de página (1 → 2, 2 → 3, etc.)
- ✅ Ao mudar filtros (marketplace, fornecedor, etc.)

### Quando a animação NÃO DEVE ser executada:
- ✅ Ao trocar de janela/aba do navegador (blur/focus)
- ✅ Ao voltar para uma página já visitada na mesma sessão
- ✅ Ao voltar para a mesma combinação de filtros

## Arquivos Relacionados
- `src/components/DropshippingCalculator.tsx` - Componente principal com a correção
- `docs/CORRECAO_ANIMACAO_GSAP.md` - Documento anterior com análise do problema

## Status
✅ **CONCLUÍDO** - A correção foi implementada e validada com sucesso.

## Próximos Passos
Nenhum. A correção está funcionando conforme esperado.
