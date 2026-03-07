# Checklist de Implementação - Calculadora (Home)

**Data de Início:** 28 de Fevereiro de 2026  
**Página:** `/` (Home - Calculadora)  
**Status:** 🚧 Em Progresso

---

## 📋 UX Essentials (CRÍTICO)

### 1. Virtualização de Lista (460 produtos)
- [x] Instalar @tanstack/react-virtual
- [x] Implementar virtualização no grid de produtos
- [x] Testar performance com 460+ produtos
- [x] Verificar scroll suave
- **Esforço:** Médio | **ROI:** Crítico
- **Status:** ✅ Concluído

### 2. Loading States Consistentes
- [x] Criar componente LoadingState universal
- [x] Implementar skeleton para cards de produtos
- [x] Adicionar loading em botões de ação
- [ ] Usar Suspense para componentes assíncronos
- **Esforço:** Baixo | **ROI:** Crítico
- **Status:** ✅ Concluído (GradientButton com loading no botão Adicionar)

### 3. Cursor Pointer em Cards Interativos
- [x] Adicionar cursor:pointer em todos os cards de produtos
- [x] Adicionar hover:shadow-lg
- [x] Implementar active:scale-[0.98]
- [x] Testar em todos os cards clicáveis
- **Esforço:** Baixo | **ROI:** Crítico
- **Status:** ✅ Concluído

### 4. Notificações Toast
- [x] Verificar se Sonner já está instalado
- [x] Implementar toast de sucesso
- [x] Implementar toast de erro
- [x] Implementar toast de loading
- [x] Adicionar ações em toasts (retry)
- **Esforço:** Médio | **ROI:** Crítico
- **Status:** ✅ Concluído

---

## 🎨 Alta Prioridade (CSS Pack Effects)

### 5. Card com Interação no Hover
- [x] Implementar com Framer Motion
- [x] Aplicar em cards de produtos
- [x] Adicionar whileHover scale e shadow
- [x] Testar performance
- **Esforço:** Baixo | **ROI:** Alto
- **Status:** ✅ Concluído

### 6. Botão com Luz Dinâmica
- [x] Aplicar em "RESUMO FINANCEIRO GERAL"
- [x] Implementar gradiente animado
- [x] Adicionar hover shadow
- **Esforço:** Médio | **ROI:** Alto
- **Status:** ✅ Concluído

### 7. Checkbox Interativo
- [x] Criar componente AnimatedCheckbox
- [x] Aplicar em filtros principais (ShopeeConfig, MercadoLivreConfig)
- [x] Adicionar animação de check
- [x] Testar acessibilidade
- **Esforço:** Baixo | **ROI:** Alto
- **Status:** ✅ Concluído

### 8. Fundo Desfocado (Efeito Vidro)
- [x] Aplicar em cards principais (Dados do Produto, Produtos adicionados)
- [x] Aplicar em CollapsibleSection (TrafficConfig, GatewayConfig)
- [x] Aplicar em ProductCard
- [x] Usar backdrop-blur-xl
- [x] Adicionar border glass
- [x] Testar em dark mode
- **Esforço:** Baixo | **ROI:** Médio
- **Status:** ✅ Concluído

---

## 📊 Média Prioridade

### 9. Barra de Progresso Degradê Animada
- [x] Criar componente ProgressBar
- [ ] Aplicar em loading states
- [ ] Adicionar gradiente animado
- **Esforço:** Baixo | **ROI:** Médio
- **Status:** 🚧 Em Progresso (componente criado)

### 10. Hover Dinâmico Vinculado ao Mouse
- [x] Implementar com useMotionValue
- [x] Criar componente DynamicHoverCard reutilizável
- [x] Adicionar efeito 3D sutil com intensidade configurável
- [x] Aplicar transformStyle: preserve-3d
- **Esforço:** Médio | **ROI:** Médio
- **Status:** ✅ Concluído

### 11. Abas com Container + Animação de Entrada
- [x] Usar Radix UI Tabs
- [x] Adicionar animação de transição com Framer Motion
- [x] Implementar indicador animado com layoutId
- [x] Criar componente AnimatedTabs reutilizável
- **Esforço:** Médio | **ROI:** Médio
- **Status:** ✅ Concluído

### 12. Conteúdo com Expansão Dinâmica
- [x] Usar Radix UI Collapsible
- [x] Aplicar em detalhes avançados
- [x] Adicionar animação slideDown/Up
- **Esforço:** Baixo | **ROI:** Médio
- **Status:** ✅ Concluído (componente ExpandableSection criado)

---

## ✅ Checklist de Qualidade

**Acessibilidade:**
- [x] Labels visíveis ou aria-label em todos os inputs
- [x] Dropdowns com navegação por teclado
- [x] Badges com contexto (aria-label)
- [x] Contraste adequado em todos os elementos (WCAG 2.1)
- [x] Modo dark com contraste adequado em todos os campos

**Performance:**
- [x] Virtualização implementada
- [x] Lazy loading de imagens
- [x] Debounce em inputs de busca (300ms)
- [x] Memoização de cálculos pesados com `useMemo`
- [x] Code splitting por rota com React.lazy e Suspense

**Interação:**
- [x] Cursor pointer em todos os cards
- [x] Loading states em operações assíncronas
- [x] Toast notifications para feedback
- [x] Hover states sem layout shift (usando transform)

**React Patterns:**
- [ ] Custom hooks para lógica reutilizável
- [ ] Context para estado global
- [ ] React Query para cache de dados
- [ ] Error boundaries por seção

---

## 📝 Notas de Implementação

### Correções de Bugs Críticos
- [x] **Shopee Ads sendo marcado incorretamente:** Removida lógica de `hasShopeeAdsData` que causava falso positivo. Agora respeita apenas a escolha explícita do usuário no checkbox `useShopeeAds`.
- [x] **Contraste Dark Mode - EditProductDialog:** Corrigido título "Tráfego Pago" com `dark:text-gray-200` para garantir contraste WCAG 2.1 AA.

### Melhorias de Performance
- [x] **Lazy Loading de Imagens:** Adicionado `loading="lazy"` em todas as imagens do ProductCard para melhorar performance inicial
- [x] **Virtualização de Lista:** Implementada com @tanstack/react-virtual para 460+ produtos
- [x] **Memoização de Cálculos:** Hook `useDropshippingCalculator` já utiliza `useMemo` para cálculos de `calculations` e `variationCalculations`, evitando recálculos desnecessários
- [x] **Code Splitting por Rota:** Implementado com React.lazy e Suspense em App.tsx. Cada rota carrega apenas o código necessário:
  - `/login` → LoginPremium (lazy)
  - `/` → DropshippingCalculator (lazy)
  - `/produtos` → DropshippingCalculator viewMode="products" (lazy)
  - `/vendas` → Sales (lazy)
- [x] **Hover Dinâmico:** Criado componente `DynamicHoverCard` com efeito 3D vinculado ao mouse usando Framer Motion. Uso:
```tsx
<DynamicHoverCard intensity={0.15}>
  <Card>...</Card>
</DynamicHoverCard>
```
- [x] **Sistema de Abas Animado:** Criado componente `AnimatedTabs` com Radix UI e Framer Motion. Uso:
```tsx
<AnimatedTabs
  tabs={[
    { value: 'dados', label: 'Dados', content: <DadosForm /> },
    { value: 'precos', label: 'Preços', content: <PrecosForm /> },
  ]}
  defaultValue="dados"
  onValueChange={(value) => console.log(value)}
/>
```

### Componentes Criados
- [x] `src/components/ui/LoadingState.tsx`
- [x] `src/components/ui/AnimatedCard.tsx`
- [x] `src/components/ui/GradientButton.tsx`
- [x] `src/components/ui/AnimatedCheckbox.tsx`
- [x] `src/components/ui/ProgressBar.tsx`
- [x] `src/components/ui/ExpandableSection.tsx`
- [x] `src/components/ui/DynamicHoverCard.tsx`
- [x] `src/components/ui/AnimatedTabs.tsx`

### Componentes Atualizados
- [x] `src/components/calculator/ProductCard.tsx` (cursor pointer + hover + lazy loading)
- [x] `src/components/calculator/MercadoLivreConfig.tsx` (contraste dark mode)
- [x] `src/components/calculator/ShopeeConfig.tsx` (contraste dark mode)
- [x] `src/components/calculator/AmazonConfig.tsx` (contraste dark mode)

### Hooks Criados
- [ ] `src/hooks/useVirtualizedList.ts`
- [ ] `src/hooks/useToast.ts` (se necessário)

---

**Última Atualização:** 28 de Fevereiro de 2026  
**Próximo Passo:** Aplicar AnimatedCheckbox nos filtros principais e implementar Item 8 (Fundo Desfocado)
