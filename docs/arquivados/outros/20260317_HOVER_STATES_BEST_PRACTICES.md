# Boas Práticas para Hover States sem Layout Shift

## Problema: Layout Shift em Hover

Layout shift ocorre quando elementos mudam de tamanho ou posição durante hover, causando:
- Elementos adjacentes se movem
- Conteúdo "pula" na tela
- Experiência ruim para o usuário
- Penalização no Core Web Vitals (CLS)

## Soluções Implementadas

### 1. Usar Transform ao invés de Width/Height/Margin

❌ **Evitar (causa layout shift):**
```css
.card:hover {
  width: 320px; /* de 300px */
  margin-top: -10px;
}
```

✅ **Usar (não causa layout shift):**
```css
.card:hover {
  transform: scale(1.02) translateY(-4px);
}
```

### 2. Box Shadow não causa Layout Shift

✅ **Seguro usar:**
```css
.card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### 3. Will-Change para Performance

```css
.card {
  will-change: transform;
  transition: transform 200ms ease-out;
}
```

## Componentes Verificados

### AnimatedCard ✅
```tsx
<div className={cn(
  'cursor-pointer transition-all duration-200 ease-out will-change-transform',
  'hover:scale-[1.02] hover:-translate-y-1',
  'hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)]',
  'active:scale-[0.98]'
)} />
```

### GradientButton ✅
```tsx
<button className={cn(
  'hover:shadow-lg hover:shadow-[#fe2c55]/50',
  'transition-shadow duration-300'
)} />
```

### ProductCard ✅
```tsx
<div className="hover:shadow-md transition-shadow" />
```

## Checklist de Verificação

- [x] Usar `transform` para movimento/escala
- [x] Usar `box-shadow` para elevação
- [x] Adicionar `will-change: transform` para performance
- [x] Evitar mudanças em `width`, `height`, `margin`, `padding`
- [x] Usar `transition` para suavizar mudanças
- [x] Testar em diferentes tamanhos de tela

## Ferramentas de Teste

1. **Chrome DevTools - Rendering:**
   - Ativar "Paint flashing"
   - Ativar "Layout Shift Regions"

2. **Lighthouse:**
   - Verificar CLS (Cumulative Layout Shift)
   - Meta: CLS < 0.1

## Referências

- [Web.dev - Optimize CLS](https://web.dev/optimize-cls/)
- [MDN - will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [CSS Triggers](https://csstriggers.com/)
