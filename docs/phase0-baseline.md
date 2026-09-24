# Fase 0 — Estado Inicial do Repositório (Baseline)

> Capturado em: 2026-09-24 · Branch: `redesign-ui` criado a partir de `main` (HEAD `68f7b04`)

---

## 1. TypeScript

```
npx tsc -b --noEmit → exit 0 (CLEAN)
```

Nenhum erro de tipo no baseline.

---

## 2. Testes de Caracterização (novos — Fase 0)

Criados especificamente como rede de segurança antes do redesign:

| Arquivo | Testes | Resultado |
|---|---|---|
| `src/utils/currency.test.ts` | 33 | ✅ 33/33 |
| `src/utils/calcOrderProfit.test.ts` | 19 | ✅ 19/19 |
| **Total** | **52** | **✅ 52/52** |

Esses testes **devem permanecer 100% verdes** durante todo o redesign.

---

## 3. Suite Vitest Completa — Falhas Pré-existentes

**Resultado baseline (antes de qualquer mudança visual):**
```
Test Files: 35 failed | 23 passed (58 total)
Tests:      142 failed | 459 passed | 1 skipped (602 total)
Duration:   ~73s
```

> ⚠️ Estas 35 falhas são **pré-existentes** — não foram introduzidas pelo redesign.
> O redesign NÃO deve piorar esse número. Idealmente melhora.

### Arquivos com falhas pré-existentes

| Arquivo de Teste | Motivo Principal |
|---|---|
| `src/utils/__tests__/transformDashboardData.test.tsx` | `TypeError: Cannot read properties of undefined (reading 'current')` em `transformDashboardData.tsx:31` |
| `src/utils/__tests__/dateRangeCalculator.test.ts` | `calculatePeriodRanges - total period` — período "all-time" incorreto |
| `src/services/__tests__/dashboardService.test.ts` | Mocks de supabase retornam mensagens de erro diferentes das esperadas nos testes |
| `src/hooks/__tests__/useDashboardData.test.tsx` | Dependências de supabase mock incorretas |
| `src/hooks/__tests__/useDashboardData.cache.test.tsx` | Cache invalidation — fetch não disparado |
| `src/components/__tests__/accessibility.test.tsx` | Home/End key nav em TimePeriodFilter; focus ring; contraste de botão ativo |
| `src/components/__tests__/LeadsDashboard.responsive.test.tsx` | KPI cards — layout de grid por viewport (jsdom não emula CSS grid) |
| `src/components/leads/DeleteConfirmDialog.test.tsx` | Interações de deleção/toast — mock de mutation |

### Testes que passavam antes do redesign (23 arquivos)
Esses devem **continuar passando** após cada fase:
- `src/utils/currency.test.ts` ← NOVO (52 novos testes)
- `src/utils/calcOrderProfit.test.ts` ← NOVO
- `src/services/pricingService.*.test.ts` (3 arquivos)
- `src/services/blingOrderService.test.ts`
- `src/services/melhorEnvioService.test.ts`
- `src/services/genderClassificationService.test.ts`
- `src/hooks/useLeads.test.ts`
- `src/components/KPICard.test.tsx`
- `src/components/NavigationBar.test.tsx`
- `src/components/TimePeriodFilter.test.tsx`
- `src/components/WeeklyConversionChart.test.tsx`
- `src/components/LeadStatusChart.test.tsx`
- `src/components/LeadsDashboard.test.tsx`
- `src/components/DashboardErrorBoundary.test.tsx`
- `src/components/DashboardErrorState.test.tsx`
- `src/components/EmptyDashboardState.test.tsx`
- `src/components/recharts-verification.test.tsx`
- `src/components/FilterIntegration.test.tsx`
- E demais (23 total antes dos 2 novos)

---

## 4. Playwright E2E

- Config: `playwright.config.ts` na raiz, `testDir: ./src/test`, `baseURL: http://localhost:4173`
- 12 specs existentes em `src/test/`
- `VITE_E2E=true` definido em `webServer.env`
- Novo spec: `src/test/baseline.spec.ts` — captura screenshots de todas as 7 rotas em 1440px e 3840px

Screenshots serão geradas em `test-results/baseline/` no primeiro run com servidor ativo.

---

## 5. Build

> Build não foi executado neste momento (requer servidor Vite prod).
> Será executado ao fim de cada fase conforme protocolo.

---

## 6. Dependências Suspeitas (confirmadas com grep)

| Pacote | Em `dependencies`? | Imports em `src/` | Ação planejada (Fase 1) |
|---|---|---|---|
| `@playwright/test` | ✅ (errado) | 0 diretos | Mover para `devDependencies` |
| `mercadopago` | ✅ | 0 (só string literal) | Remover após confirm. dinâmico |
| `react-loading-skeleton` | ✅ | 0 | Remover |
| `@dicebear/core` | ✅ | 0 | Remover |
| `@dicebear/collection` | ✅ | 0 | Remover |

---

## 7. Arquivos a Deletar

- `src/services/dashboardService.ts.backup` — arquivo backup commitado, sem referências

---

## 8. Zona Protegida — Confirmada

| Arquivo | Status |
|---|---|
| `src/utils/currency.ts` | 🔒 Intocável (260 callers, 33 testes novos) |
| `src/utils/calcOrderProfit.ts` | 🔒 Intocável (fonte de verdade lucro, 19 testes novos) |
| `src/services/*` | 🔒 Intocável |
| `src/contexts/*` | 🔒 Intocável |
| `src/types/*` | 🔒 Intocável |
| `ProtectedRoute.tsx` / `AdminRoute.tsx` | 🔒 Intocável |
| `fetchEnrichment` em `RevenueReportChart.tsx` | 🔒 Só markup/classes permitidas |
| `useDropshippingCalculator.ts` | 🔒 Só markup/classes permitidas |
