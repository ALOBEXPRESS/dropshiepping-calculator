# Sprint 4 - Acessibilidade (WCAG 2.1 AA)

**Data:** 13 de março de 2026  
**Duração Estimada:** 3.25 dias (26h)  
**Status:** 🚧 Em Progresso

## 🎯 Objetivos

1. Adicionar labels ARIA em todos os componentes interativos
2. Implementar navegação por teclado completa
3. Melhorar contraste de cores para WCAG AA
4. Atingir Lighthouse Accessibility > 95

## 📋 Checklist de Implementação

### 1. Labels ARIA (12h)

#### Componentes Prioritários
- [x] HeroSection.tsx - KPI cards e botões ✅
- [x] ProfitAnalysisCard.tsx - Gráficos e alertas ✅
- [x] TopProfitableProductsTable.tsx - Cards de produtos ✅
- [x] CustomerLTVDashboard.tsx - Métricas e clientes VIP ✅
- [x] LeadConversionFunnel.tsx - Funil de conversão ✅
- [x] RevenueProfitTrendChart.tsx - Gráficos de tendência ✅
- [x] MarketplacePerformanceCard.tsx - Performance por marketplace ✅
- [ ] DateRangePicker.tsx - Seletor de período
- [ ] EmptyState.tsx - Estados vazios
- [ ] PendingOrders.tsx - Pedidos pendentes
- [ ] LowMarginProductsAlert.tsx - Alertas de margem baixa
- [ ] EnhancedGeographicSales.tsx - Vendas geográficas

#### Padrões ARIA a Implementar

**Botões:**
```typescript
<Button 
  onClick={handleClick}
  aria-label="Descrição clara da ação"
>
  <Icon aria-hidden="true" />
  Texto do botão
</Button>
```

**Cards/Artigos:**
```typescript
<div 
  role="article"
  aria-label="Título do card: valor principal"
>
  {/* conteúdo */}
</div>
```

**Badges de Status:**
```typescript
<Badge 
  aria-label="Status: descrição completa"
>
  <Icon aria-hidden="true" />
  Texto
</Badge>
```

**Gráficos:**
```typescript
<div 
  role="img"
  aria-label="Gráfico de barras mostrando: descrição dos dados"
>
  {/* visualização */}
</div>
```

**Inputs:**
```typescript
<input
  aria-label="Campo de busca"
  aria-describedby="search-help"
/>
<span id="search-help" className="sr-only">
  Digite para buscar produtos
</span>
```

### 2. Navegação por Teclado (10h)

#### Tab Order
- [x] Verificar ordem lógica de navegação ✅
- [x] Garantir que todos os elementos interativos são alcançáveis ✅
- [ ] Implementar skip links para navegação rápida

#### Focus Styles
- [x] CSS global de focus adicionado em src/index.css ✅
- [x] Focus visible implementado ✅
- [x] Suporte a prefers-reduced-motion ✅
```css
/* globals.css */
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  border-radius: 4px;
}

/* Remover outline padrão mas manter para teclado */
*:focus:not(:focus-visible) {
  outline: none;
}
```

#### Atalhos de Teclado
- [ ] `Ctrl/Cmd + K` - Busca global
- [ ] `Ctrl/Cmd + R` - Atualizar dashboard
- [ ] `Escape` - Fechar modais/dropdowns
- [ ] `Arrow keys` - Navegar em listas
- [ ] `Enter/Space` - Ativar botões

**Implementação:**
```typescript
useEffect(() => {
  const handleKeyboard = (e: KeyboardEvent) => {
    // Ctrl/Cmd + R - Refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      handleRefresh();
    }
    
    // Escape - Close modals
    if (e.key === 'Escape') {
      closeAllModals();
    }
  };
  
  window.addEventListener('keydown', handleKeyboard);
  return () => window.removeEventListener('keydown', handleKeyboard);
}, []);
```

### 3. Contraste de Cores (4h)

#### Verificações WCAG AA
- Texto normal: mínimo 4.5:1
- Texto grande (18pt+): mínimo 3:1
- Componentes UI: mínimo 3:1

#### Cores a Ajustar

**Badges:**
```typescript
// Antes (pode ter contraste baixo)
className="bg-blue-100 text-blue-700"

// Depois (WCAG AA compliant)
className="bg-blue-600 text-white" // Contraste 7:1
```

**Texto Secundário:**
```typescript
// Antes
className="text-gray-400"

// Depois
className="text-gray-600 dark:text-gray-300"
```

**Links:**
```typescript
// Adicionar underline para não depender só de cor
className="text-blue-600 underline hover:text-blue-800"
```

#### Paleta Acessível

```css
/* globals.css - Cores com contraste adequado */
:root {
  /* Primárias */
  --primary-600: #2563eb; /* Contraste 7:1 com branco */
  --primary-700: #1d4ed8; /* Contraste 10:1 com branco */
  
  /* Sucesso */
  --success-600: #16a34a; /* Contraste 4.5:1 com branco */
  --success-700: #15803d; /* Contraste 7:1 com branco */
  
  /* Erro */
  --error-600: #dc2626; /* Contraste 5:1 com branco */
  --error-700: #b91c1c; /* Contraste 7:1 com branco */
  
  /* Texto */
  --text-primary: #0f172a; /* Contraste 16:1 com branco */
  --text-secondary: #475569; /* Contraste 7:1 com branco */
  --text-tertiary: #64748b; /* Contraste 4.5:1 com branco */
}

.dark {
  --text-primary: #f8fafc; /* Contraste 16:1 com preto */
  --text-secondary: #cbd5e1; /* Contraste 10:1 com preto */
  --text-tertiary: #94a3b8; /* Contraste 7:1 com preto */
}
```

## 🛠️ Ferramentas de Teste

### 1. Lighthouse
```bash
# Rodar audit de acessibilidade
npm run build
npx lighthouse http://localhost:5173/vendas --only-categories=accessibility --view
```

### 2. axe DevTools
- Instalar extensão do Chrome
- Rodar análise automática
- Corrigir issues encontrados

### 3. Contrast Checker
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Verificar todas as combinações de cores

### 4. Teclado Manual
- Navegar toda a aplicação apenas com Tab
- Verificar se todos os elementos são alcançáveis
- Testar atalhos de teclado

### 5. Screen Reader
- NVDA (Windows): https://www.nvaccess.org/
- VoiceOver (Mac): Cmd + F5
- Testar navegação e anúncios

## 📊 Métricas de Sucesso

### Antes (Estimado)
- Lighthouse Accessibility: ~75
- Elementos sem ARIA: ~80%
- Contraste inadequado: ~30%
- Navegação por teclado: Parcial

### Meta (Após Sprint 4)
- Lighthouse Accessibility: > 95
- Elementos com ARIA: 100%
- Contraste WCAG AA: 100%
- Navegação por teclado: Completa

## 🎯 Priorização

### Alta Prioridade (Crítico)
1. Labels ARIA em botões principais
2. Focus styles visíveis
3. Contraste de texto principal
4. Tab order lógico

### Média Prioridade (Importante)
1. ARIA em cards e gráficos
2. Atalhos de teclado
3. Contraste de badges
4. Skip links

### Baixa Prioridade (Nice to have)
1. ARIA em elementos decorativos
2. Atalhos avançados
3. Animações respeitando prefers-reduced-motion

## 📝 Implementação Passo a Passo

### Passo 1: Audit Inicial
```bash
# Rodar Lighthouse
npm run build
npx lighthouse http://localhost:5173/vendas --only-categories=accessibility --output=json --output-path=./lighthouse-before.json
```

### Passo 2: Adicionar ARIA Labels
- Começar pelos componentes mais usados
- Testar com screen reader
- Documentar padrões

### Passo 3: Focus Styles
- Adicionar CSS global
- Testar navegação por teclado
- Ajustar conforme necessário

### Passo 4: Contraste
- Usar ferramenta de contraste
- Ajustar cores problemáticas
- Documentar paleta final

### Passo 5: Audit Final
```bash
# Rodar Lighthouse novamente
npx lighthouse http://localhost:5173/vendas --only-categories=accessibility --output=json --output-path=./lighthouse-after.json
```

### Passo 6: Comparar Resultados
```bash
# Comparar scores
node -e "
const before = require('./lighthouse-before.json');
const after = require('./lighthouse-after.json');
console.log('Before:', before.categories.accessibility.score * 100);
console.log('After:', after.categories.accessibility.score * 100);
console.log('Improvement:', (after.categories.accessibility.score - before.categories.accessibility.score) * 100);
"
```

## 🐛 Problemas Comuns

### 1. ARIA Overuse
**Problema:** Adicionar ARIA em tudo  
**Solução:** Usar HTML semântico primeiro, ARIA apenas quando necessário

### 2. Focus Trap
**Problema:** Usuário fica preso em modal  
**Solução:** Implementar focus trap correto com escape

### 3. Contraste em Hover
**Problema:** Cores mudam no hover e perdem contraste  
**Solução:** Testar estados hover também

### 4. Screen Reader Verboso
**Problema:** Muita informação anunciada  
**Solução:** Usar `aria-hidden="true"` em ícones decorativos

## 📚 Referências

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Lighthouse Accessibility](https://developer.chrome.com/docs/lighthouse/accessibility/)
- [axe DevTools](https://www.deque.com/axe/devtools/)

---

**Sprint 4 em Progresso! 🚧**  
Tornando o dashboard acessível para todos os usuários
