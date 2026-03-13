# Correções do Dashboard - Pendentes

## Status das Correções

### ✅ 1. Tooltip do Gráfico de Receita
- **Status**: CONCLUÍDO
- **Arquivo**: `src/components/sales/RevenueReportChart.tsx`
- **Alteração**: Ajustado posicionamento do tooltip para não sair da tela

### ✅ 2. Pedidos Recentes com Imagens
- **Status**: CONCLUÍDO
- **Arquivo**: `src/components/sales/RecentOrdersChart.tsx`
- **Alteração**: Substituído gráfico por lista com imagens dos produtos

### ⏳ 3. Avatares Aleatórios nas Transações
- **Status**: PENDENTE
- **Arquivo**: `src/components/sales/TransactionsList.tsx`
- **Ação**: Adicionar avatares coloridos aleatórios baseados nas iniciais

### ⏳ 4. Corrigir Relatório de Estoque
- **Status**: PENDENTE
- **Arquivo**: `src/components/sales/StockReportTable.tsx`
- **Ação**: Melhorar espaçamento e layout

### ⏳ 5. Produtos Mais Vendidos no Topo
- **Status**: PENDENTE
- **Arquivo**: `src/components/sales/TopSellingProductsTable.tsx`
- **Ação**: Ordenar por vendas (descendente) e mostrar número total

### ⏳ 6. Testar "Processar Lucro"
- **Status**: PENDENTE
- **Ação**: Verificar atualização automática em:
  - Dashboard de vendas
  - Página de produtos (número de vendas)
  - Resumo financeiro
  - Projeção de lucro

## Próximos Passos

1. Adicionar avatares aleatórios nas transações
2. Corrigir layout do relatório de estoque
3. Ordenar produtos mais vendidos
4. Testar processamento de lucro
5. Build e lint final
6. Teste com Playwright/PinchTab
