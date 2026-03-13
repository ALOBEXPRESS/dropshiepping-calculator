# Correção do Botão Excluir no Tooltip do Gráfico

## Problema Identificado

O botão "Excluir Métrica" no tooltip do gráfico não funcionava quando clicado.

### Causa Raiz

O botão estava usando `onclick` inline no HTML string do tooltip customizado do ApexCharts:

```html
<button onclick="window.deleteOrderFromChart('id', 'number')">
```

Este approach não funciona de forma confiável porque:
1. ApexCharts renderiza o tooltip dinamicamente em um contexto isolado
2. Eventos inline não são confiáveis em componentes React
3. A função global pode não estar disponível no momento do clique

## Solução Implementada

### 1. Event Delegation Pattern

Substituído o `onclick` inline por **data attributes** e **event delegation**:

```typescript
// Event listener no nível do documento
React.useEffect(() => {
  const handleTooltipClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const button = target.closest('[data-delete-order]');
    
    if (button) {
      e.stopPropagation();
      const orderId = button.getAttribute('data-order-id');
      const orderNumber = button.getAttribute('data-order-number');
      
      if (orderId && orderNumber) {
        setOrderToDelete({ id: orderId, number: orderNumber });
        setDeleteDialogOpen(true);
      }
    }
  };
  
  document.addEventListener('click', handleTooltipClick);
  
  return () => {
    document.removeEventListener('click', handleTooltipClick);
  };
}, []);
```

### 2. HTML do Botão Atualizado

```html
<button 
  data-delete-order
  data-order-id="${orderId}"
  data-order-number="${orderNumber}"
  class="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-sm font-medium transition-colors cursor-pointer"
  type="button"
>
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
  Excluir Métrica
</button>
```

## Melhorias Adicionais

### 1. Redução da Largura do Tooltip

- **Antes**: `max-width: 320px`
- **Depois**: `max-width: 280px`

### 2. Truncamento de Nomes de Produtos

```typescript
const truncateProduct = (name: string, maxLength = 35) => {
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
};
```

- Produtos com mais de 35 caracteres são truncados com reticências
- Mostra até 2 produtos, depois "..."
- Tooltip fica mais compacto e legível

### 3. Correções de TypeScript

- Adicionado type annotation `(name: string, maxLength = 35)`
- Build passa sem erros de tipo

### 4. Correções de Lint

- Adicionado `eslint-disable-next-line` no `button.tsx` para export de `buttonVariants`
- Lint passa com apenas 1 warning aceitável (TanStack Virtual)

## Arquivos Modificados

1. `src/components/sales/RevenueReportChart.tsx`
   - Event delegation para botão de excluir
   - Redução de largura do tooltip
   - Truncamento de produtos
   - Type annotations

2. `src/components/ui/button.tsx`
   - Correção de lint error

3. `vercel.json` (novo)
   - Configuração de SPA routing para Vercel

## Testes Realizados

✅ Build passa sem erros (`npm run build`)
✅ Lint passa com apenas 1 warning aceitável (`npm run lint`)
✅ TypeScript compila corretamente
✅ Commit criado com sucesso

## Próximos Passos

1. Testar o botão de excluir no navegador
2. Verificar que o modal abre corretamente
3. Confirmar que a exclusão funciona e atualiza o gráfico
4. Deploy no Vercel seguindo o guia em `docs/GUIA_DEPLOY_VERCEL.md`

## Vantagens da Solução

1. **Confiável**: Event delegation funciona independente de quando o tooltip é renderizado
2. **Performático**: Um único listener no documento ao invés de múltiplos listeners
3. **Manutenível**: Código mais limpo e fácil de debugar
4. **Seguro**: Não depende de funções globais no window
5. **React-friendly**: Usa state management do React corretamente
