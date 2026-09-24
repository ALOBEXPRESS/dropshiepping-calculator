# Correção - Import Dinâmico ApexCharts

## Problema
Erro ao carregar a aplicação:
```
[plugin:vite:import-analysis] failed to resolve import "next/dynamic" from "src/components/sales/RecentOrdersChart.tsx"
```

## Causa
O código estava usando `dynamic` do Next.js para importar o ApexCharts:
```typescript
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
```

Mas este é um projeto Vite/React, não Next.js.

## Solução
Removido o import dinâmico e usado import direto:
```typescript
import Chart from 'react-apexcharts';
```

## Arquivos Corrigidos
- `src/components/sales/RecentOrdersChart.tsx`

## Resultado
✅ Build executado com sucesso
✅ Aplicação carregando sem erros
✅ Gráficos ApexCharts renderizando corretamente

## Commit
```bash
git add src/components/sales/RecentOrdersChart.tsx
git commit -m "fix: corrigido import dinâmico do ApexCharts (removido next/dynamic)"
```

**Status**: ✅ Correção aplicada
