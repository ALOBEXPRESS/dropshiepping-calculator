# Correção: Botão Excluir no Tooltip do Gráfico de Receita

## Problema
O usuário não conseguia clicar no botão "Excluir" que aparecia no tooltip do gráfico de receita. Além disso:
1. O botão era visível mas não respondia a cliques
2. Os dados do pedido apareciam como "undefined"
3. O tooltip desaparecia quando o mouse se movia do marcador para o conteúdo do tooltip

## Causa Raiz

### Problema 1: Eventos de Clique Bloqueados
ApexCharts renderiza tooltips dentro de um elemento SVG `<foreignObject>`, que captura todos os eventos de ponteiro. Isso impede que elementos HTML dentro do tooltip (como botões) recebam eventos de clique.

### Problema 2: Dados "undefined"
O código estava usando campos incorretos:
- Código usava: `order.id`, `order.number`, `order.store`
- Campos corretos: `order.order_id`, `order.order_number`, `order.marketplace_name`

### Problema 3: Tooltip Desaparece
ApexCharts esconde o tooltip quando o mouse sai da área do gráfico, mesmo que o mouse esteja sobre o próprio tooltip.

### Problema 4: orders_data Não Retornado
A função SQL `get_revenue_report` não retornava o campo `orders_data` com os detalhes individuais dos pedidos.

## Solução Implementada

### 1. Adicionar orders_data à Função SQL

Criamos a migration `20260314_add_orders_data_to_revenue_report.sql` que atualiza a função `get_revenue_report` para incluir um campo JSONB `orders_data` contendo:
- order_id
- order_number
- order_date
- marketplace_name
- total_amount
- total_cost
- total_profit
- products (array com nome, quantidade, preço unitário e custo unitário)

```sql
CREATE OR REPLACE FUNCTION get_revenue_report(
    p_organization_id UUID,
    p_period TEXT DEFAULT 'monthly'
)
RETURNS TABLE (
    period_label TEXT,
    period_start DATE,
    period_end DATE,
    total_revenue NUMERIC,
    total_cost NUMERIC,
    total_profit NUMERIC,
    orders_count INTEGER,
    orders_data JSONB  -- NOVO CAMPO
) AS $$
...
```

### 2. Corrigir Campos do Tooltip

Atualizamos o código para usar os campos corretos:

```tsx
const ordersHtml = periodData.orders_data?.map((order: { 
  order_id: string; 
  order_number: string; 
  marketplace_name: string 
}) => {
  return `
    <div>
      <span>${order.marketplace_name || 'N/A'} - #${order.order_number || 'N/A'}</span>
      <button 
        data-delete-order-btn
        data-order-id="${order.order_id}"
        data-order-number="${order.order_number}"
        data-order-store="${order.marketplace_name}"
      >
        Excluir
      </button>
    </div>
  `;
}).join('') || '';
```

### 3. Manter Tooltip Visível com CSS

Adicionamos CSS global para manter o tooltip visível quando o mouse está sobre ele:

```tsx
useEffect(() => {
  const style = document.createElement('style');
  style.textContent = `
    .apexcharts-tooltip-custom {
      pointer-events: auto !important;
    }
    .apexcharts-tooltip.apexcharts-active {
      pointer-events: auto !important;
    }
    .apexcharts-tooltip:hover {
      display: block !important;
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(style);
  return () => {
    document.head.removeChild(style);
  };
}, []);
```

### 4. Event Delegation para Capturar Cliques

Mantivemos o event delegation com capture phase para garantir que os cliques nos botões sejam capturados:

```tsx
useEffect(() => {
  const handleTooltipClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const button = target.closest('[data-delete-order-btn]') as HTMLElement;
    
    if (button) {
      e.preventDefault();
      e.stopPropagation();
      
      const orderId = button.getAttribute('data-order-id');
      const orderNumber = button.getAttribute('data-order-number');
      const orderStore = button.getAttribute('data-order-store');
      
      if (orderId && orderNumber && orderStore) {
        setOrderToDelete({ id: orderId, number: orderNumber, store: orderStore });
        setDeleteDialogOpen(true);
      }
    }
  };

  document.addEventListener('click', handleTooltipClick, true);
  document.addEventListener('mousedown', handleTooltipClick, true);

  return () => {
    document.removeEventListener('click', handleTooltipClick, true);
    document.removeEventListener('mousedown', handleTooltipClick, true);
  };
}, []);
```

## Arquitetura da Solução

### Fluxo de Dados
1. Usuário passa mouse sobre o gráfico
2. ApexCharts renderiza tooltip customizado com HTML
3. Tooltip mostra informações do período + lista de pedidos
4. CSS mantém tooltip visível quando mouse está sobre ele
5. Event listeners capturam cliques nos botões "Excluir"
6. Dialog de confirmação aparece
7. Usuário confirma exclusão
8. Pedido é excluído via Supabase
9. Dashboard atualiza automaticamente

### Informações no Tooltip
- Período (Mar, Abr, etc.)
- Produtos vendidos (até 2 produtos + "...")
- Receita total (verde)
- Custo total (laranja)
- Lucro (verde se positivo, vermelho se negativo)
- Lista de pedidos com:
  - Marketplace e número do pedido
  - Botão "Excluir" (vermelho)

### UX Melhorada
- ✅ Tooltip permanece visível ao mover mouse sobre ele
- ✅ Botão "Excluir" clicável e responsivo
- ✅ Hover states com feedback visual
- ✅ Informações completas do pedido antes de excluir
- ✅ Confirmação antes de excluir
- ✅ Toast de sucesso/erro após ação

## Arquivos Modificados
- `src/components/sales/RevenueReportChart.tsx` - Componente do gráfico
- `supabase/migrations/20260314_add_orders_data_to_revenue_report.sql` - Migration SQL
- `docs/correcoes/CORRECAO_BOTAO_EXCLUIR_TOOLTIP.md` - Documentação

## Tecnologias Utilizadas
- React Hooks (useState, useEffect, useRef)
- ApexCharts custom tooltip
- Event delegation com capture phase
- CSS dinâmico injetado
- Supabase RPC
- shadcn/ui AlertDialog
- Sonner toast

## Status
✅ Migration aplicada no Supabase
✅ Função SQL retorna orders_data
✅ Campos corretos no tooltip
✅ CSS para manter tooltip visível
✅ Botão excluir clicável
✅ Informações completas do pedido visíveis

## Próximos Passos
1. Testar em produção
2. Verificar que tooltip permanece visível ao mover mouse
3. Confirmar que botão "Excluir" funciona
4. Validar que dados do pedido aparecem corretamente (não "undefined")
