# Plano de Implementação - Página Calculadora

**Data:** 28 de Fevereiro de 2026  
**Status:** 📋 PLANEJAMENTO  
**Prioridade:** Alta (Página principal do sistema)

---

## 🎯 Objetivos

1. Aplicar ElectricBorder nos cards principais
2. Melhorar hover dos cards de produtos
3. Adicionar loading states consistentes
4. Implementar toast notifications
5. Otimizar performance (460 produtos)

---

## 📊 Análise Visual Atual

### Elementos Principais
1. **Header:** Logo + Título + Botão "Resumo Financeiro Geral"
2. **Card Esquerdo:** "Dados do Produto" (formulário grande)
3. **Card Direito:** "Produtos integrados" (grid de produtos)
4. **Footer:** Collapsible "Taxas dos Marketplaces"

### Issues Identificados
- ❌ Cards sem efeitos visuais modernos
- ❌ Grid de produtos sem hover states
- ❌ Sem loading states visíveis
- ❌ Performance: 460 produtos sem virtualização

---

## 🎨 Efeitos a Implementar (Priorizado)

### FASE 1: Cards Principais (1-2 horas)

**1. ElectricBorder no Card "Dados do Produto"**
- **Prioridade:** Alta
- **Esforço:** Baixo
- **Impacto:** Alto
- **Implementação:**
```tsx
<ElectricBorder
  color="#fe2c55"
  speed={0.8}
  chaos={0.1}
  borderRadius={16}
>
  <Card>Dados do Produto</Card>
</ElectricBorder>
```

**2. ElectricBorder no Card "Produtos integrados"**
- **Prioridade:** Alta
- **Esforço:** Baixo
- **Impacto:** Alto
- **Implementação:** Igual ao anterior

**3. Botão "Resumo Financeiro Geral" com Luz Deslizante**
- **Prioridade:** Alta
- **Esforço:** Baixo
- **Impacto:** Médio
- **Já implementado no Login** - Reutilizar código

---

### FASE 2: Cards de Produtos (2-3 horas)

**4. Hover Interativo nos Cards de Produtos**
- **Prioridade:** Alta
- **Esforço:** Médio
- **Impacto:** Alto
- **Implementação:**
```tsx
<motion.div
  whileHover={{ 
    scale: 1.02,
    y: -4,
    boxShadow: '0 20px 25px -5px rgba(254, 44, 85, 0.1)'
  }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.2 }}
  className="cursor-pointer"
>
  <ProductCard />
</motion.div>
```

**5. Badge Bling com Animação**
- **Prioridade:** Média
- **Esforço:** Baixo
- **Impacto:** Médio
- **Implementação:**
```tsx
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  className="absolute top-2 right-2"
>
  <Badge>Bling</Badge>
</motion.div>
```

---

### FASE 3: Performance (3-4 horas)

**6. Virtualização de Lista (460 produtos)**
- **Prioridade:** CRÍTICA
- **Esforço:** Alto
- **Impacto:** CRÍTICO
- **Biblioteca:** @tanstack/react-virtual
- **Implementação:**
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const ProductGrid = ({ products }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      {virtualizer.getVirtualItems().map((virtualItem) => (
        <ProductCard 
          key={virtualItem.key}
          product={products[virtualItem.index]} 
        />
      ))}
    </div>
  );
};
```

---

### FASE 4: UX Essentials (1-2 horas)

**7. Loading States**
- **Prioridade:** Alta
- **Esforço:** Baixo
- **Impacto:** Alto
- **Implementação:**
```tsx
// Skeleton para cards
const ProductCardSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="bg-gray-200 h-48 rounded-lg" />
    <div className="bg-gray-200 h-4 w-3/4 rounded" />
    <div className="bg-gray-200 h-4 w-1/2 rounded" />
  </div>
);
```

**8. Toast Notifications**
- **Prioridade:** Alta
- **Esforço:** Baixo
- **Impacto:** Alto
- **Já configurado no App.tsx** - Adicionar chamadas

---

## 📅 Cronograma

### Semana 1 (Dias 1-2)
- [x] Login Premium (CONCLUÍDO)
- [ ] Calculadora - Fase 1 (Cards principais)
- [ ] Calculadora - Fase 2 (Hover produtos)

### Semana 1 (Dias 3-5)
- [ ] Calculadora - Fase 3 (Virtualização)
- [ ] Calculadora - Fase 4 (UX Essentials)
- [ ] Testes e ajustes

---

## 🚀 Implementação Imediata

Vou começar pela **Fase 1** aplicando ElectricBorder nos cards principais.

### Arquivos a Modificar
1. `src/components/DropshippingCalculator.tsx` (componente principal)
2. Ou componentes específicos dos cards se existirem

### Passos
1. Importar ElectricBorder
2. Envolver cards principais
3. Ajustar espaçamentos
4. Testar responsividade
5. Build e validação

---

## 📝 Notas Técnicas

### Performance Atual
- 460 produtos renderizados
- Sem virtualização
- Possível lag no scroll
- Alto uso de memória

### Performance Esperada (Após Fase 3)
- Apenas ~10-15 produtos renderizados por vez
- Scroll suave
- Uso de memória otimizado
- FPS constante 60fps

---

## ✅ Critérios de Sucesso

**Visual:**
- [ ] Cards principais com borda elétrica
- [ ] Hover suave nos cards de produtos
- [ ] Animações consistentes (200-300ms)

**Performance:**
- [ ] Scroll suave (60fps)
- [ ] Virtualização funcionando
- [ ] Build < 70s

**UX:**
- [ ] Loading states visíveis
- [ ] Toast notifications funcionando
- [ ] Feedback claro em todas as ações

---

**Status:** Pronto para iniciar Fase 1 🚀
