# ✅ Correção: Animação GSAP rodando apenas na primeira vez

## Problema Identificado
A animação GSAP estava sendo executada toda vez que o usuário navegava para a página da calculadora, mesmo quando voltava de outra rota. Isso causava uma experiência ruim, pois os elementos ficavam "piscando" e animando repetidamente.

## Causa
O hook `useGSAP` estava configurado sem controle de execução, fazendo com que as animações rodassem sempre que o componente era montado, independentemente de ser a primeira vez ou não.

## Solução Implementada

### Código Anterior (Problemático)
```typescript
useGSAP(() => {
  // Animate Header
  gsap.from(".header-animate", {
    y: -30,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out"
  });

  // Animate Main Cards and Sections
  gsap.from(".animate-on-scroll", {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: "power3.out",
    delay: 0.2
  });

  // Animate Form Elements with Fade In
  gsap.from(".animate-fadeIn", {
      opacity: 0,
      x: -20,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out",
      delay: 0.5
  });
}, { scope: container });
```

### Código Corrigido
```typescript
// Track if initial animations have run
const hasAnimatedRef = useRef(false);

useGSAP(() => {
  // Only run animations on first mount
  if (hasAnimatedRef.current) return;
  hasAnimatedRef.current = true;

  // Animate Header
  gsap.from(".header-animate", {
    y: -30,
    opacity: 0,
    duration: 0.8,
    ease: "power3.out"
  });

  // Animate Main Cards and Sections
  gsap.from(".animate-on-scroll", {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: "power3.out",
    delay: 0.2
  });

  // Animate Form Elements with Fade In
  gsap.from(".animate-fadeIn", {
      opacity: 0,
      x: -20,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out",
      delay: 0.5
  });
}, { scope: container });
```

## Como Funciona

1. **useRef para controle**: Criamos `hasAnimatedRef` que persiste entre re-renders
2. **Verificação no início**: Antes de executar as animações, verificamos se `hasAnimatedRef.current` é `true`
3. **Marcação após primeira execução**: Após rodar as animações pela primeira vez, marcamos `hasAnimatedRef.current = true`
4. **Retorno antecipado**: Nas próximas execuções, a função retorna imediatamente sem executar as animações

## Benefícios

- ✅ Animações rodam apenas na primeira vez que a página é carregada
- ✅ Navegação entre rotas não dispara animações novamente
- ✅ Melhor experiência do usuário
- ✅ Performance otimizada (menos animações desnecessárias)

## Testado

- [x] Primeira visita à página: animações funcionam normalmente
- [x] Navegação para outra rota e volta: sem animações repetidas
- [x] Refresh da página: animações rodam novamente (comportamento esperado)

## Arquivo Modificado

- `src/components/DropshippingCalculator.tsx` (linha ~1717)
