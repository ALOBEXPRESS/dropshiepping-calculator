# UI Audit — dropshipping-calculator-app

> **Gerado em:** 2026-09-24  
> **Grafo CRG:** HEAD `1711d205` → rebuild incremental executado, 2159 nós / 28075 arestas  
> **Fontes:** code-review-graph MCP (primária) + leitura direta de arquivos (confirmação)  
> **Regra:** apenas análise e documentação. Nenhum código foi alterado.

---

## 1. Status do Grafo

| Campo | Valor |
|---|---|
| Arquivos analisados | 308 |
| Nós totais | 2159 |
| Arestas totais | 28075 |
| Linguagens | TypeScript, TSX, JavaScript, Bash |
| Comunidades detectadas | 16 |
| Fluxos de execução | 107 |
| Embeddings semânticos | 0 (sentence-transformers não instalado) |
| Head SHA | 1711d205 |

---

## 2. Mapa Completo do Projeto

### 2.1 Árvore de Diretórios (`src/`)

```
src/
├── App.tsx                        # Roteador raiz, providers globais
├── main.tsx                       # Entry point React
├── index.css                      # Tokens CSS / Tailwind base
├── App.css                        # Estilos globais complementares
├── vite-env.d.ts                  # Tipos Vite
│
├── pages/                         # Páginas (thin wrappers)
│   ├── Dashboard.tsx              # Página do dashboard financeiro
│   ├── Sales.tsx                  # Página de vendas/relatórios
│   ├── Leads.tsx                  # Página de leads (wrapper fino, 541 bytes)
│   ├── CampaignsPage.tsx          # Página de campanhas (807 linhas — NÃO é thin)
│   ├── ProfilePage.tsx            # Perfil do usuário
│   └── RepasePage.tsx             # Repasse financeiro
│
├── components/                    # Componentes (raiz e subdiretórios)
│   ├── DropshippingCalculator.tsx # MEGACOMPONENTE (4554 linhas)
│   ├── Layout.tsx                 # Layout principal com nav (17170 bytes)
│   ├── NavigationBar.tsx          # Barra de navegação (8912 bytes)
│   ├── ProtectedRoute.tsx         # Guard de autenticação
│   ├── AdminRoute.tsx             # Guard de admin (410 bytes)
│   ├── ThemeProvider.tsx          # Contexto de tema dark/light (1666 bytes)
│   ├── SettingsDialog.tsx         # Modal de configurações (911 linhas)
│   ├── PendingOrders.tsx          # Pedidos pendentes (1003 linhas)
│   ├── LoginPremium.tsx           # Tela de login (framer-motion)
│   ├── Login.tsx                  # Login simples alternativo
│   ├── KPICard.tsx                # Card de KPI (compartilhado, com testes)
│   ├── LeadsDashboard.tsx         # Dashboard de leads (bridge node)
│   ├── WeeklyConversionChart.tsx  # Gráfico de conversão semanal (recharts)
│   ├── LeadStatusChart.tsx        # Gráfico de status de leads (recharts)
│   ├── TimePeriodFilter.tsx       # Filtro de período reutilizável (com testes)
│   ├── MarketplaceFilter.tsx      # Filtro de marketplace
│   ├── ProductsLoaded.tsx         # Lista de produtos carregados (22041 bytes)
│   ├── NFeUploadModal.tsx         # Upload de NF-e (20912 bytes)
│   ├── DashboardErrorBoundary.tsx # Error boundary do dashboard (com testes)
│   ├── FreeSampleCard.tsx         # Card de amostra grátis
│   ├── FreeSampleLane.tsx         # Faixa de amostras
│   ├── PersonalPurchaseLane.tsx   # Faixa de compras pessoais
│   │
│   ├── calculator/                # Subcomponentes da calculadora
│   │   ├── EditProductDialog.tsx  # Dialog de edição (3348 linhas)
│   │   ├── ProductCard.tsx        # Card de produto (2898 linhas)
│   │   ├── ProfitProjection.tsx   # Projeção de lucro (668 linhas)
│   │   ├── TrafficConfig.tsx      # Config de tráfego (1101 linhas)
│   │   ├── ShopeeConfig.tsx       # Config Shopee (630 linhas)
│   │   ├── GatewayConfig.tsx      # Config de gateway de pagamento
│   │   ├── ResultsPanel.tsx       # Painel de resultados
│   │   ├── TikTokConfig.tsx       # Config TikTok Shop
│   │   ├── BulkEditModal.tsx      # Edição em lote
│   │   └── VirtualizedProductGrid.tsx # Grid virtualizado
│   │
│   ├── sales/                     # Componentes da área de vendas
│   │   ├── RevenueReportChart.tsx # MEGACOMPONENTE (4752 linhas, ApexCharts)
│   │   ├── HeroSection.tsx        # Hero da seção de vendas
│   │   ├── NovaEntradaDialog.tsx  # Dialog de nova entrada
│   │   ├── PaymentTransactions.tsx# Transações de pagamento
│   │   ├── StatisticsCards.tsx    # Cards de estatísticas
│   │   ├── MarketplacePerformanceCard.tsx
│   │   ├── TopProfitableProductsTable.tsx
│   │   ├── TopSellingProductsTable.tsx
│   │   ├── TopCustomersList.tsx
│   │   ├── RecentOrdersChart.tsx
│   │   ├── TransactionsList.tsx   # usa react-avatar
│   │   ├── GenderDistributionChart.tsx # Recharts - pizza
│   │   ├── GenderClassificationFunnel.tsx
│   │   ├── AffiliateCommissionChart.tsx # ApexCharts
│   │   ├── BrazilMap.tsx
│   │   └── CustomerLTVDashboard.tsx
│   │
│   ├── leads/                     # Componentes de leads
│   │   ├── LeadsTable.tsx         # Tabela de leads (bridge node #1)
│   │   ├── LeadsTableContent.tsx  # Conteúdo da tabela
│   │   ├── LeadFormDialog.tsx     # Dialog de criação/edição (633 linhas)
│   │   ├── FilterBar.tsx          # Filtros (821 linhas)
│   │   └── FilterIntegration.test.tsx
│   │
│   ├── campaigns/                 # Componentes de campanhas
│   │   ├── CampaignFormDialog.tsx
│   │   ├── AdSetSettingsStep.tsx
│   │   └── ProductLinkingStep.tsx
│   │
│   ├── ui/                        # Primitivos de UI (62 arquivos)
│   │   ├── [shadcn-ui primitivos] # button, card, dialog, select, tabs...
│   │   └── [customizados]         # AnimatedTabs, MagneticButton, CollapsibleSection...
│   │
│   └── skeletons/                 # Skeletons de loading
│
├── hooks/                         # Custom hooks
│   ├── useDropshippingCalculator.ts # Hook principal (1418 linhas)
│   ├── useLeads.ts                # CRUD de leads (TanStack Query)
│   ├── useCampaigns.ts            # CRUD de campanhas (TanStack Query)
│   ├── useMarketplaces.ts         # Marketplaces (TanStack Query)
│   ├── useDashboardData.ts        # Dados do dashboard (TanStack Query)
│   ├── useDashboardCharts.ts      # Gráficos do dashboard (TanStack Query)
│   ├── useProductsBling.ts        # Integração Bling
│   ├── useProductSalesStats.ts    # Stats de produtos
│   ├── useOrganization.ts         # Organização (TanStack Query)
│   ├── useSalesStats.ts           # Stats de vendas
│   ├── use-toast.ts               # Toast notifications
│   └── sales/
│       └── useHeroStats.ts        # KPIs hero section
│
├── services/                      # Camada de acesso a dados
│   ├── pricingService.ts          # Cálculo de preços (1128 linhas)
│   ├── productService.ts          # CRUD de produtos (2040 linhas)
│   ├── dashboardService.ts        # Serviço do dashboard (582 linhas)
│   ├── leadsService.ts            # CRUD de leads
│   ├── leadsMcpService.ts         # Leads via MCP/N8N (706 linhas)
│   ├── blingOrderService.ts       # Integração Bling pedidos (825 linhas)
│   ├── genderClassificationService.ts
│   ├── salesStatsService.ts
│   ├── melhorEnvioService.ts
│   ├── dashboardService.ts.backup # ⚠️ Arquivo backup commitado
│   └── calculators/               # Sub-calculadoras
│
├── contexts/                      # Contextos React
│   ├── SettingsContext.tsx        # Organização, capital (13 consumers)
│   ├── UserContext.tsx            # Dados do usuário logado
│   └── DateRangeContext.tsx       # Período de datas global
│
├── lib/
│   ├── supabase.ts                # Cliente Supabase + fetchWithRetry
│   └── react-query.ts             # QueryClient configurado
│
├── utils/
│   ├── currency.ts                # parseCurrency (260 callers!)
│   ├── calcOrderProfit.ts         # Cálculo de lucro (fonte de verdade)
│   ├── csvExport.ts               # Exportação CSV
│   └── dateRangeCalculator.ts     # Cálculo de intervalos
│
└── types/                         # Tipos TypeScript
    ├── calculator.ts
    ├── leads.ts
    └── pendingOrder.ts
```

### 2.2 Rotas do React Router

```
/login
└── (sem layout, sem proteção)
    └── LoginPremium
        ├── Hooks: framer-motion (animações)
        └── API: supabase.auth.signInWithPassword

/  (calculadora principal)
└── ProtectedRoute
    └── Layout
        └── DropshippingCalculator
            ├── Hook: useDropshippingCalculator (1418 linhas)
            ├── Service: pricingService.calculateMetrics
            ├── Service: productService (CRUD Supabase direto)
            ├── Context: SettingsContext
            └── Lib: gsap (animações)

/produtos
└── ProtectedRoute
    └── Layout
        └── DropshippingCalculator (viewMode="products")
            └── [mesmos deps da rota /]

/dashboard
└── ProtectedRoute
    └── Layout
        └── Dashboard
            ├── Hook: useDashboardData → dashboardService → supabase
            ├── Hook: useDashboardCharts → dashboardService → supabase
            ├── Context: SettingsContext (organizationId)
            ├── Context: DateRangeContext
            ├── Component: WeeklyConversionChart (recharts)
            └── Component: KPICard

/vendas  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── Sales
                ├── Component: RevenueReportChart (4752 linhas, ApexCharts)
                │   └── fetchEnrichment → supabase.orders (direto, 755 linhas)
                ├── Component: HeroSection → useHeroStats → supabase
                ├── Component: PendingOrders → supabase (direto, 1003 linhas)
                ├── Component: StatisticsCards
                ├── Context: SettingsContext
                └── Lib: gsap (animações de entrada)

/leads
└── ProtectedRoute
    └── Layout
        └── Leads (wrapper thin, 541 bytes)
            └── LeadsDashboard
                ├── Component: LeadsTable → LeadsTableContent
                ├── Component: FilterBar (821 linhas)
                ├── Component: LeadFormDialog
                └── Hook: useLeads (TanStack Query → leadsService → supabase) ✅

/campanhas  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── CampaignsPage (807 linhas — não é thin wrapper)
                ├── Hook: useCampaigns (TanStack Query) ✅
                ├── Component: CampaignFormDialog
                ├── Context: SettingsContext
                └── Lib: gsap

/profile
└── ProtectedRoute
    └── Layout
        └── ProfilePage

/repasse  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── RepasePage
                └── Context: SettingsContext
```

---

## 3. Tamanho, Complexidade e Acoplamento

### 3.1 Arquivos > 400 Linhas

| Arquivo | Linhas | Tipo | Múltiplas Responsabilidades |
|---|---|---|---|
| `RevenueReportChart.tsx` | **4752** | Componente | Chart + modais + cálculo de lucro + enrichment fetch + reembolso |
| `DropshippingCalculator.tsx` | **4554** | Componente | Calculadora + CRUD produtos + UI + animações |
| `EditProductDialog.tsx` | **3348** | Componente | Dialog multi-step com todos campos do produto |
| `ProductCard.tsx` | **2898** | Componente | Card de produto com cálculos inline |
| `productService.ts` | **2040** | Service | CRUD completo de produtos Supabase |
| `useDropshippingCalculator.ts` | **1418** | Hook | Estado + lógica + side effects + fetching |
| `pricingService.ts` | **1128** | Service | Motor de precificação (calculateMetrics: 866 linhas) |
| `TrafficConfig.tsx` | **1101** | Componente | Configuração de tráfego |
| `PendingOrders.tsx` | **1003** | Componente | Gestão de pedidos + fetching inline |
| `SettingsDialog.tsx` | **911** | Componente | Dialog de configurações globais |
| `blingOrderService.ts` | **825** | Service | Integração Bling ERP |
| `FilterBar.tsx` | **821** | Componente | Filtros complexos de leads |
| `CampaignsPage.tsx` | **807** | Página | Deveria ser thin wrapper |
| `leadsMcpService.ts` | **706** | Service | Leads via N8N/MCP |
| `ProfitProjection.tsx` | **668** | Componente | Projeção de lucro |
| `LeadFormDialog.tsx` | **633** | Componente | Dialog de leads |
| `ShopeeConfig.tsx` | **630** | Componente | Config Shopee |

### 3.2 Funções Muito Grandes (por grafo CRG)

| Função | Arquivo | Linhas | Evidência de Problema |
|---|---|---|---|
| `RevenueReportChart` | RevenueReportChart.tsx | **4659** | UI + lógica de negócio + fetching |
| `DropshippingCalculator` | DropshippingCalculator.tsx | **4410** | Feature completa em 1 função |
| `EditProductDialog` | EditProductDialog.tsx | **3160** | Dialog com todo formulário inline |
| `useDropshippingCalculator` | useDropshippingCalculator.ts | **1308** | Hook com estado + fetch + cálculo |
| `calculateMetrics` | pricingService.ts | **866** | Motor de cálculo monolítico |
| `fetchEnrichment` | RevenueReportChart.tsx | **755** | Fetch complexo dentro de componente |
| `TrafficConfig` | TrafficConfig.tsx | **1008** | Config UI grande |
| `PendingOrders` | PendingOrders.tsx | **944** | CRUD + UI juntos |
| `FilterBar` | FilterBar.tsx | **740** | 821-line filter UI |

### 3.3 Hotspots Arquiteturais (por grafo CRG)

#### `DropshippingCalculator.tsx` — Grau total: 956
- **In-degree:** 3 (App.tsx ×2, ProductsPage)
- **Out-degree:** 953 (importa/chama quase todos os subcomponentes da calculadora)
- **Evidência:** Hub node #1 no grafo. Out-degree de 953 confirmado pelo `get_hub_nodes_tool`.
- **Risco:** Qualquer mudança visual nos subcomponentes pode exigir atualização deste arquivo. Feature principal do produto.

#### `RevenueReportChart.tsx` — Grau total: 775
- **In-degree:** 2 (Sales.tsx)
- **Out-degree:** 773
- **Evidência:** Hub node #3 no grafo. Contém lógica de `calcOrderProfit` misturada com rendering.
- **Risco:** Lógica de negócio crítica (reembolso, lucro) encapsulada em componente de apresentação.

#### `parseCurrency` (currency.ts) — In-degree: 260
- **Evidência:** Hub node #9 confirmado. In-degree de 260 é o maior de qualquer função utilitária.
- **Risco:** Função chamada em 260 locais — qualquer mudança de comportamento tem blast radius global.

### 3.4 Bridge Nodes (Conectores Arquiteturais)

| Node | Betweenness | Papel |
|---|---|---|
| `LeadsTable` | 0.0090 | Conecta comunidade de leads com o resto da app |
| `LeadsTableContent` | 0.0047 | Sub-bridge interno de leads |
| `LeadsDashboard` | 0.0043 | Ponto de entrada da feature de leads |
| `FilterBar` | 0.0032 | Conecta UI de filtros com estado de leads |
| `LeadFormDialog` | 0.0029 | Conecta formulário com persistência |

---

## 4. Inventário da UI (`src/components/ui/`)

### 4.1 Primitivos shadcn/ui (via Radix)

| Componente | Arquivo | Customizado | Consumidores |
|---|---|---|---|
| `alert-dialog` | alert-dialog.tsx | Mínimo | Múltiplos |
| `alert` | alert.tsx | Não | Poucos |
| `avatar` | avatar.tsx | Não | `TransactionsList` |
| `badge` | badge.tsx | Não | Múltiplos |
| `button` | button.tsx | Não | Todos |
| `card` | card.tsx | Não | Todos |
| `chart` | chart.tsx | Não (Recharts wrapper) | Dashboard |
| `checkbox` | checkbox.tsx | Não | Forms |
| `dialog` | dialog.tsx | Não | Múltiplos |
| `dropdown-menu` | dropdown-menu.tsx | Não | NavigationBar, outros |
| `form` | form.tsx | Não | Forms |
| `input` | input.tsx | Não | Todos |
| `label` | label.tsx | Não | Forms |
| `pagination` | pagination.tsx | Não | Tabelas |
| `popover` | popover.tsx | Não | Filtros |
| `progress` | progress.tsx | Mínimo | Poucos |
| `scroll-area` | scroll-area.tsx | Não | Múltiplos |
| `select` | select.tsx | Não | Forms |
| `separator` | separator.tsx | Não | Layout |
| `sheet` | sheet.tsx | Não | NavigationBar mobile |
| `skeleton` | skeleton.tsx | Não | Skeletons dir |
| `table` | table.tsx | Não | Tabelas |
| `tabs` | tabs.tsx | Não | Calculadora, Vendas |
| `toast` + `toaster` | toast/toaster.tsx | Não | Globais (App) |
| `toggle` + `toggle-group` | toggle*.tsx | Não | Filtros |
| `tooltip` | tooltip.tsx | Não | Múltiplos |

### 4.2 Componentes Customizados de Animação/UI

| Componente | Biblioteca | Consumidores Estimados |
|---|---|---|
| `AnimatedTabs` | framer-motion | Poucos (decorativos) |
| `AutoplayTabs` | framer-motion | Poucos |
| `BounceAnimation` | framer-motion | Poucos |
| `Card3D` | framer-motion | Poucos |
| `CollapsibleSection` | gsap | Poucos |
| `DynamicHoverCard` | framer-motion | Poucos |
| `ElectricBorder` | CSS puro | Poucos |
| `electric-border` | CSS puro | Poucos (DUPLICATA) |
| `FloatingAnimation` | framer-motion | Poucos |
| `GradientButton` | CSS | Poucos |
| `InteractiveMetric` | framer-motion | Poucos |
| `LightBar` | CSS | Poucos |
| `LoadingState` | CSS | App.tsx, routes (Suspense fallback) |
| `MagneticButton` | framer-motion | Poucos |
| `magic-bento` | gsap | Poucos |
| `magnet` | JS nativo | Poucos |
| `PageProgressBar` | framer-motion | Poucos |
| `ProgressBar` | framer-motion | Poucos (DUPLICATA de `progress`) |
| `ScrollCardProgress` | framer-motion | Poucos |
| `SmoothScroll` | JS | Poucos |
| `Text3DHover` | framer-motion | Poucos |
| `date-range-picker` | shadcn | TimePeriodFilter |
| `empty-state` | CSS | Poucos |
| `glitch-text` | CSS | Poucos |
| `lightning` | Canvas/CSS | Poucos |

### 4.3 Duplicações Identificadas

**`ElectricBorder` duplicado:**
- `src/components/ui/ElectricBorder.tsx` (10305 bytes)
- `src/components/ui/electric-border.tsx` (11198 bytes)
- Evidência: ambos existem no mesmo diretório `ui/`, nomes diferem apenas em case e separador.

**`ProgressBar` vs `progress`:**
- `src/components/ui/ProgressBar.tsx` — framer-motion, 1465 bytes
- `src/components/ui/progress.tsx` — shadcn/Radix, 804 bytes
- Dois componentes para o mesmo conceito visual, implementações diferentes.

**`AnimatedTabs` vs `tabs`:**
- `src/components/ui/AnimatedTabs.tsx` — framer-motion, 2751 bytes
- `src/components/ui/tabs.tsx` — shadcn/Radix, 1877 bytes
- Mesmo padrão de sobreposição.

**`button-variants.ts` separado de `button.tsx`:**
- Variantes em arquivo separado pode causar inconsistência de manutenção se `button.tsx` for atualizado.

---

## 5. Design System e Estilização

### 5.1 Tokens CSS Definidos (index.css)

O projeto usa CSS Custom Properties via Tailwind + shadcn padrão:

```css
/* :root (light mode) */
--background, --foreground, --card, --card-foreground,
--popover, --popover-foreground, --primary, --primary-foreground,
--secondary, --secondary-foreground, --muted, --muted-foreground,
--accent, --accent-foreground, --destructive, --destructive-foreground,
--border, --input, --ring, --radius,
--chart-1 a --chart-5

/* .dark */
Versão dark de todos os 21 tokens acima
```

**Total de variáveis CSS:** ~21 tokens base + 21 dark = 42 valores declarados.

### 5.2 Inventário de Estilização

| Categoria | Qtde Arquivos | Avaliação | Exemplos |
|---|---|---|---|
| Classes `dark:` Tailwind | ~85 arquivos | Semi-consistente | `dark:bg-zinc-900`, `dark:text-white` |
| `style={{` inline | ~47 arquivos | Inconsistente | `style={{ color: '#22c55e' }}` |
| Cores hex hardcoded | Muitos | Não tokenizadas | `#22c55e`, `#ef4444`, `#0F172A`, `#E2E8F0` |
| `px` em style inline | Muitos | Poderia usar escala Tailwind | `width: '60px'`, `height: '200px'` |
| Font sizes Tailwind | Amplo | Consistente (tokens) | `text-xs`, `text-sm`, `text-2xl` |
| Border radius | Misturado | Semi-consistente | `rounded-lg`, `rounded-full`, `var(--radius)` |
| Shadows | Misturado | Inconsistente | `shadow-lg`, inline `box-shadow` |
| Breakpoints | Tailwind | Consistente | `sm:`, `md:`, `lg:`, `xl:`, `2xl:` |
| CSS Modules | Não usado | Ausente | — |
| CSS global | 563 linhas | Mix utilitários + tokens | Scrollbar, glitch, acessibilidade |

**Problema específico (evidência direta):** No `App.tsx` linhas 91-95:
```tsx
style: {
  background: 'white',
  color: '#0F172A',
  border: '1px solid #E2E8F0',
}
```
Esses valores ignoram os tokens `--background`, `--foreground`, `--border` definidos em `index.css`.

### 5.3 Dark Mode

| Aspecto | Status |
|---|---|
| Sistema | `ThemeProvider` injeta classe `dark` no `<html>` |
| Persistência | `localStorage` com chave `vite-ui-theme` |
| Default | `"dark"` (definido em App.tsx) |
| Cobertura | ~85 arquivos com `dark:` classes |
| Inconsistência | Estilos inline hardcoded não respondem ao tema |

---

## 6. Bibliotecas Duplicadas ou Sobrepostas

### 6.1 Gráficos: ApexCharts vs Recharts

| Biblioteca | Arquivos que Importam | Funcionalidade |
|---|---|---|
| `apexcharts` + `react-apexcharts` | `RevenueReportChart.tsx`, `AffiliateCommissionChart.tsx` | Gráficos de barras/área/linha (vendas) |
| `recharts` | `LeadStatusChart.tsx`, `WeeklyConversionChart.tsx`, `GenderDistributionChart.tsx`, `CustomersStatistics.tsx`, `recharts-example.tsx` | Gráficos pizza, scatter, barras (dashboard/leads) |

**Sobreposição:** Ambas resolvem visualização de dados. Nenhuma é claramente superior para todos os casos de uso do projeto. Consolidação é possível mas envolve reescrita de charts.

### 6.2 Animações: Framer Motion vs GSAP

| Biblioteca | Arquivos | Uso Principal |
|---|---|---|
| `framer-motion` | 11 arquivos (majoritariamente `src/components/ui/`) | Componentes UI decorativos, LoginPremium |
| `gsap` | 9 arquivos (`DropshippingCalculator`, `Sales`, `CampaignsPage`, `ProductCard`, `ProfitProjection`, `ResultsPanel`, `ProductInfo`, `CollapsibleSection`, `magic-bento`) | Animações de entrada e interações da calculadora |

**Sobreposição:** Ambas realizam animações mas em contextos diferentes. Coexistência tem impacto moderado no bundle.

### 6.3 Loading: react-spinners vs shadcn Skeleton vs react-loading-skeleton

| Biblioteca | Arquivos | Status |
|---|---|---|
| `react-spinners` | `DropshippingCalculator.tsx` (1 arquivo) | Ativo (`MoonLoader`) |
| `skeleton` (shadcn) | `src/components/skeletons/` | Ativo (vários componentes) |
| `react-loading-skeleton` | **Zero imports em `src/`** | **MORTA** — não utilizada |

### 6.4 Avatar: react-avatar vs Radix Avatar vs DiceBear

| Biblioteca | Arquivo | Status |
|---|---|---|
| `react-avatar` | `TransactionsList.tsx` | Ativo (1 arquivo) |
| `@radix-ui/react-avatar` (via `avatar.tsx`) | `src/components/ui/avatar.tsx` | Ativo (shadcn) |
| `@dicebear/core` + `@dicebear/collection` | **Zero imports em `src/`** | **MORTA** — não utilizada |

---

## 7. Data Fetching e Gerenciamento de Dados

### 7.1 Mecanismos Utilizados

| Mecanismo | Arquivos / Hooks | Padrão |
|---|---|---|
| **TanStack Query** | `useLeads`, `useMarketplaces`, `useDashboardData`, `useDashboardCharts`, `useCampaigns`, `useOrganization` | ✅ Recomendado |
| **Supabase direto** (useState + useEffect) | `useDropshippingCalculator`, `RevenueReportChart`, `PendingOrders`, `SettingsContext`, `dashboardService`, `productService` | ⚠️ Inconsistente |
| **Fetch nativo** | Services externos (Bling, MelhorEnvio) | Neutro |
| **React Context** | `SettingsContext`, `UserContext`, `DateRangeContext` | ✅ Para estado global leve |
| **useState local** | Amplo | Correto para estado de UI |

### 7.2 Fluxo por Tela

```
Dashboard
→ useDashboardData → dashboardService.getEnrichedOrders → supabase.orders
→ useDashboardCharts → dashboardService.getDashboardCharts → supabase
→ SettingsContext.organizationId (gate para todos os fetches)

Sales (/vendas)
→ RevenueReportChart → fetchEnrichment() → supabase.orders (DIRETO, 755 linhas)
→ HeroSection → useHeroStats → supabase.orders (direto)
→ PendingOrders → supabase.orders (direto, useState + useEffect)

Calculator (/)
→ useDropshippingCalculator → supabase.products (direto, 1308 linhas)
→ pricingService.calculateMetrics (síncrono, sem rede)

Leads (/leads)
→ useLeads → leadsService → supabase (via TanStack Query ✅)
→ useCampaigns → supabase (via TanStack Query ✅)
```

### 7.3 Problemas de Fetching Identificados

1. **`RevenueReportChart.tsx` faz fetching direto** com `useState` + `useEffect` (função `fetchEnrichment` de 755 linhas). Não usa TanStack Query — sem cache, sem invalidação automática, sem retry padronizado.

2. **`PendingOrders.tsx` faz fetching direto** — 1003 linhas incluindo fetch manual ao Supabase.

3. **`useDropshippingCalculator.ts` (1308 linhas)** mistura estado de formulário, lógica de cálculo, e fetching de dados em um único hook.

4. **`SettingsContext.tsx` faz fetch no mount** com Supabase direto (não via TanStack Query), mas é a fonte de `organizationId` consumida por 13 arquivos.

5. **Duas implementações paralelas para dados de pedidos:** `dashboardService` (Dashboard) e `fetchEnrichment` em `RevenueReportChart` (Vendas) — lógicas similares sem compartilhamento.

---

## 8. Dependências Suspeitas

### 8.1 `mercadopago` — em `dependencies`

| Campo | Valor |
|---|---|
| Versão | `^2.12.0` |
| Imports `from 'mercadopago'` em `src/` | **Zero** |
| Uso encontrado | String literal `"mercadopago"` em SelectItem, GatewayConfig, ProductCard |
| Caminho ao browser | Nenhum — nunca importado |
| Avaliação | **Dependência morta.** SDK não integrado. Está em `dependencies`. |

### 8.2 `@playwright/test` — em `dependencies` (deveria ser devDependency)

| Campo | Valor |
|---|---|
| Versão | `^1.57.0` |
| Imports em `src/` | **Zero** |
| Uso em testes | Não detectado em `src/tests/` ou `src/test/` |
| Compatibilidade browser | ❌ Node.js only |
| Avaliação | **Erro de categorização.** Deve estar em `devDependencies`. |

### 8.3 `react-loading-skeleton` — em `dependencies`

| Campo | Valor |
|---|---|
| Versão | `^3.5.0` |
| Imports em `src/` | **Zero** |
| Substituto em uso | `skeleton.tsx` (shadcn) |
| Avaliação | **Dependência morta.** |

### 8.4 `@dicebear/core` + `@dicebear/collection` — em `dependencies`

| Campo | Valor |
|---|---|
| Imports em `src/` | **Zero** |
| Avaliação | **Dependências mortas.** Planejadas para geração de avatares, nunca integradas. |

---

## 9. Blast Radius — Impacto das Alterações de UI

### `parseCurrency` (`src/utils/currency.ts`)

```
parseCurrency
├── consumidores diretos: 260 call sites (in-degree grafo)
├── páginas afetadas: todas (/, /dashboard, /vendas, /leads, /campanhas)
├── testes relacionados: não identificados
└── risco: CRÍTICO — qualquer mudança quebra toda exibição de moeda
```

### `SettingsContext` (`src/contexts/SettingsContext.tsx`)

```
SettingsContext (13 importadores confirmados pelo grafo)
├── EditProductDialog, DropshippingCalculator, Dashboard
├── LeadsDashboard, UserContext, CampaignsPage
├── useMarketplaces, App, Layout
├── PendingOrders, NFeUploadModal, RepasePage, Sales
└── risco: CRÍTICO — organizationId é gate para todos os fetches
```

### `DropshippingCalculator.tsx`

```
DropshippingCalculator
├── consumidores: App.tsx (rotas / e /produtos)
├── out-degree: 953 (hub node #1 no grafo)
├── subcomponentes: EditProductDialog, ProductCard, TrafficConfig,
│                  ShopeeConfig, GatewayConfig, ProfitProjection...
├── hooks: useDropshippingCalculator (1418 linhas)
├── serviços: productService, pricingService
└── risco: ALTO — feature principal do produto
```

### `RevenueReportChart.tsx`

```
RevenueReportChart
├── consumidores: Sales.tsx (1 arquivo)
├── out-degree: 773 (hub node #3)
├── contém: calcOrderProfit, lógica de reembolso, modais, ApexCharts
├── testes: zero identificados
└── risco: ALTO — lógica de negócio e UI misturadas
```

### `Layout.tsx`

```
Layout
├── consumidor direto: App.tsx (1 arquivo)
├── impacto indireto: TODAS as páginas autenticadas
├── imports: SettingsContext, NavigationBar, SettingsDialog
└── risco: MÉDIO-ALTO — container de toda a UI autenticada
```

### `calcOrderProfit` (`src/utils/calcOrderProfit.ts`)

```
calcOrderProfit
├── consumidores: RevenueReportChart, dashboardService, useHeroStats
├── fonte de verdade para lucro
├── testes: não identificados
└── risco: ALTO — bug afeta dashboard KPIs + gráfico receita + hero section
```

---

## 10. Testes e Cobertura

### 10.1 Testes Identificados

| Arquivo | Tipo | Área | Tamanho |
|---|---|---|---|
| `FilterIntegration.test.tsx` | Integração | Filtros de leads | 693 linhas |
| `LeadsTable.test.tsx` | Unitário | Tabela de leads | — |
| `useLeads.test.ts` | Unitário | Hook de leads | 12410 bytes |
| `pricingService.test.ts` | Unitário | Precificação | 8527 bytes |
| `pricingService.preservation.test.ts` | Preservação/Regressão | Precificação | 21604 bytes |
| `pricingService.bugfix.test.ts` | Bugfix | Precificação | 14296 bytes |
| `blingOrderService.test.ts` | Unitário | Integração Bling | 7093 bytes |
| `genderClassificationService.test.ts` | Unitário | Classificação gênero | — |
| `melhorEnvioService.test.ts` | Unitário | Envio | 12564 bytes |
| `NavigationBar.test.tsx` | Unitário | Navegação | 7456 bytes |
| `TimePeriodFilter.test.tsx` | Unitário | Filtro de período | 11612 bytes |
| `KPICard.test.tsx` | Unitário | Card de KPI | 3030 bytes |
| `WeeklyConversionChart.test.tsx` | Unitário | Gráfico conversão | 3463 bytes |
| `LeadStatusChart.test.tsx` | Unitário | Gráfico status | 3128 bytes |
| `LeadsDashboard.test.tsx` | Unitário | Dashboard leads | 8121 bytes |
| `DashboardErrorBoundary.test.tsx` | Unitário | Error boundary | 2793 bytes |
| `DashboardErrorState.test.tsx` | Unitário | Estado de erro | 2556 bytes |
| `EmptyDashboardState.test.tsx` | Unitário | Estado vazio | 1735 bytes |
| `recharts-verification.test.tsx` | Verificação | Recharts | 4192 bytes |
| `csvExport.test.ts` | Unitário | Exportação CSV | — |
| Framework | Vitest | `@testing-library/react` | — |

### 10.2 E2E / Playwright

- `@playwright/test` em `dependencies` — biblioteca presente
- **Nenhum arquivo de teste Playwright encontrado em `src/`**
- Diretório `.playwright-mcp/` ignorado pelo `.gitignore`
- **Cobertura E2E: zero ou inexistente no repositório**

### 10.3 Áreas COM Cobertura

✅ `pricingService.ts` — excelente cobertura (3 arquivos de teste, evidência de quebras anteriores)  
✅ `useLeads` / `leadsService` — bom (integração + unitário)  
✅ `TimePeriodFilter` — coberto (11612 bytes de testes)  
✅ `KPICard` — coberto  
✅ `blingOrderService` — coberto  
✅ `melhorEnvioService` — coberto  
✅ `NavigationBar` — coberto  

### 10.4 Áreas SEM Cobertura Aparente

❌ `RevenueReportChart.tsx` (4752 linhas) — zero testes  
❌ `DropshippingCalculator.tsx` (4554 linhas) — zero testes  
❌ `useDropshippingCalculator.ts` (1418 linhas) — zero testes  
❌ `dashboardService.ts` — zero testes  
❌ `parseCurrency` (260 callers) — zero testes unitários diretos  
❌ `calcOrderProfit.ts` — zero testes identificados  
❌ `SettingsContext.tsx` — zero testes  
❌ `ProtectedRoute.tsx` — zero testes  
❌ `PendingOrders.tsx` (1003 linhas) — zero testes  
❌ Fluxo de autenticação completo — zero testes  
❌ `productService.ts` (2040 linhas) — zero testes  

---

## 11. Visão Arquitetural

### 11.1 Comunidades Detectadas pelo Grafo

```
COMUNIDADES (16 total, por diretório dominante)
├── components-it:should    321 nós  tsx  ← maior, componentes gerais
├── services-it:deve        175 nós  ts   ← services + testes
├── sales-format            117 nós  tsx  ← components/sales
├── calculator-handle       114 nós  tsx  ← components/calculator
├── ui-handle                88 nós  tsx  ← components/ui
├── hooks-use                77 nós  ts   ← hooks/
├── test-test:should         53 nós  ts   ← testes isolados
├── sales-use                31 nós  ts   ← hooks/sales
├── utils-calculate          20 nós  ts   ← utils/
├── contexts-date            11 nós  tsx  ← contexts/
└── skeletons, lib, pages-leads, etc.
```

### 11.2 Mapa Arquitetural Real

```
UI LAYER
├── Pages (thin wrappers — exceto CampaignsPage 807L)
├── Feature components (MONOLÍTICOS)
│   ├── DropshippingCalculator (4554L) — hub #1, out-degree 953
│   ├── RevenueReportChart (4752L) — hub #3, out-degree 773
│   └── PendingOrders (1003L)
├── Layout (único, via App.tsx)
├── Shared components (KPICard, TimePeriodFilter, NavigationBar)
└── UI Primitives (shadcn 26 + customizados 36 = 62 arquivos)

DATA LAYER  (⚠️ INCONSISTENTE)
├── TanStack Query (Leads, Marketplaces, Dashboard, Campaigns hooks)
└── Supabase direto (Calculator, Sales, PendingOrders, SettingsContext)
    └── Services (productService, pricingService, dashboardService)

AUTH LAYER
├── ProtectedRoute (supabase.auth.getSession + onAuthStateChange)
├── AdminRoute (useUserRole → supabase)
└── SettingsContext (organizationId fetch no mount)

STATE LAYER
├── React Context (Settings, User, DateRange, Theme)
├── Local useState (prevalente nos megacomponentes)
├── TanStack Query (server state nos hooks modernos)
└── Nenhum Zustand/Redux/Jotai

TESTS
├── Vitest (unit + integration) — cobertura parcial
├── @testing-library/react
└── Playwright (instalado, não utilizado)
```

### 11.3 Cruzamentos Inesperados

1. **`UserContext` importa `SettingsContext`** — acoplamento entre contextos. Confirmado pelo grafo (`IMPORTS_FROM` edge).
2. **`RevenueReportChart` contém `calcOrderProfit` e lógica de reembolso** — lógica de negócio pura dentro de componente de apresentação.
3. **`CampaignsPage.tsx` (807 linhas)** não segue o padrão thin wrapper das demais páginas.
4. **Fluxo de autenticação duplicado:** `ProtectedRoute` chama `supabase.auth.getSession` E `SettingsContext` chama `supabase.auth.getUser` — dois fetches de auth por page load.

---

## 12. Riscos para uma Reforma Completa da UI

### Áreas de Alto Cuidado

#### 1. `parseCurrency` (`src/utils/currency.ts`)
- **Por que é sensível:** 260 call sites no codebase. Qualquer mudança de comportamento ou assinatura quebra toda exibição de moeda.
- **O que depende:** Todos os componentes que exibem valores monetários.
- **O que pode quebrar:** Valores incorretos em calculadora, dashboard, vendas, leads.

#### 2. `SettingsContext` (`src/contexts/SettingsContext.tsx`)
- **Por que é sensível:** `organizationId` é o gate para todos os fetches de dados. 13 importadores diretos confirmados pelo grafo.
- **O que depende:** EditProductDialog, DropshippingCalculator, Dashboard, LeadsDashboard, UserContext, CampaignsPage, useMarketplaces, App, Layout, PendingOrders, NFeUploadModal, RepasePage, Sales.
- **O que pode quebrar:** Toda a aplicação fica sem dados se o contexto falhar ou mudar de interface.

#### 3. `ProtectedRoute` (`src/components/ProtectedRoute.tsx`)
- **Por que é sensível:** Controla acesso a todas as rotas. Contém lógica de session timeout, limpeza de storage corrompido, E2E bypass com `VITE_E2E=true`.
- **O que depende:** Todas as rotas exceto `/login`.
- **O que pode quebrar:** Acesso indevido (se bypass falhar) ou bloqueio de usuários legítimos.

#### 4. `calcOrderProfit` (`src/utils/calcOrderProfit.ts`)
- **Por que é sensível:** Fonte de verdade para cálculo de lucro. Consumido por dashboard KPIs, gráfico de receita, e hero section de vendas.
- **O que pode quebrar:** Valores incorretos de lucro em todos os relatórios financeiros.

#### 5. `RevenueReportChart.tsx` (4752 linhas)
- **Por que é sensível:** Mistura lógica de reembolso, cálculo de lucro, e enrichment de dados com renderização de UI.
- **O que pode quebrar:** Reforma de UI pode inadvertidamente quebrar cálculos financeiros críticos.

#### 6. `DropshippingCalculator.tsx` (4554 linhas)
- **Por que é sensível:** Feature principal do produto. Out-degree de 953.
- **O que depende:** App.tsx (rotas / e /produtos).
- **O que pode quebrar:** A calculadora é a razão de existir do produto. Qualquer quebra tem impacto máximo no negócio.

#### 7. `Layout.tsx` + `NavigationBar.tsx`
- **Por que é sensível:** Container de todas as páginas autenticadas. Mudanças de estrutura afetam toda a UI.
- **O que pode quebrar:** Responsividade e navegação em toda a aplicação.

#### 8. `pricingService.ts` (`calculateMetrics`: 866 linhas)
- **Por que é sensível:** Motor de cálculo com 3 arquivos de testes de preservação — evidência de que já quebrou antes e foi necessário criar testes defensivos.
- **O que depende:** `useDropshippingCalculator`, `productService`.
- **O que pode quebrar:** Cálculos incorretos de preço, lucro e comissão para todos os produtos.

---

## 13. Problemas Encontrados

### Alto Impacto

---

**Problema:** Megacomponentes com mistura de responsabilidades (UI + lógica de negócio + fetching)  
**Evidência:** CRG confirma `RevenueReportChart` (4752L, hub #3, out-degree 773) e `DropshippingCalculator` (4554L, hub #1, out-degree 953). `fetchEnrichment` é uma função de 755 linhas dentro de um componente React.  
**Arquivos:** `src/components/sales/RevenueReportChart.tsx`, `src/components/DropshippingCalculator.tsx`  
**Dependências afetadas:** 2 rotas principais + toda seção de vendas  
**Impacto potencial:** Reforma de UI requer análise profunda para não quebrar cálculos financeiros  

---

**Problema:** Fetching de dados inconsistente — TanStack Query vs Supabase direto sem padrão claro  
**Evidência:** TanStack Query em `useLeads`, `useMarketplaces`, `useDashboardData`; Supabase direto em `RevenueReportChart`, `PendingOrders`, `useDropshippingCalculator`  
**Arquivos:** `RevenueReportChart.tsx`, `PendingOrders.tsx`, `useDropshippingCalculator.ts`, `SettingsContext.tsx`  
**Dependências afetadas:** Dados de vendas, pedidos, calculadora  
**Impacto potencial:** Sem cache padronizado, sem retry uniforme, possíveis race conditions  

---

**Problema:** `@playwright/test` em `dependencies` (deve estar em `devDependencies`)  
**Evidência:** `package.json` linha 20: `"@playwright/test": "^1.57.0"` em `dependencies`. Lib é Node.js-only, incompatível com browser.  
**Arquivos:** `package.json`  
**Dependências afetadas:** Bundle de produção  
**Impacto potencial:** Bundle maior, risco de erro em runtime no browser  

---

### Médio Impacto

---

**Problema:** `parseCurrency` com 260 callers sem testes unitários diretos identificados  
**Evidência:** CRG reporta in-degree de 260 para `parseCurrency`. Nenhum `currency.test.ts` encontrado.  
**Arquivos:** `src/utils/currency.ts`  
**Dependências afetadas:** Todos os componentes que exibem moeda  
**Impacto potencial:** Bug silencioso em formatação monetária afeta todo o app  

---

**Problema:** Dependências mortas no bundle de produção  
**Evidência:** Grep em `src/` não encontrou nenhum import de `mercadopago`, `react-loading-skeleton`, `@dicebear/core`, `@dicebear/collection`. Todos em `dependencies`.  
**Arquivos:** `package.json`  
**Impacto potencial:** Bundle desnecessariamente maior, manutenção de versões sem uso  

---

**Problema:** `ElectricBorder` duplicado em dois arquivos no mesmo diretório  
**Evidência:** `ElectricBorder.tsx` (10305 bytes) e `electric-border.tsx` (11198 bytes) coexistem em `src/components/ui/`.  
**Arquivos:** ambos acima  
**Impacto potencial:** Consumidores podem importar de fontes diferentes, causando inconsistência visual  

---

**Problema:** `CampaignsPage.tsx` com 807 linhas — viola padrão de thin wrapper para páginas  
**Evidência:** Arquivo em `pages/` com GSAP animations, lógica de formulário e UI inline. Comparar com `Leads.tsx` (541 bytes).  
**Arquivos:** `src/pages/CampaignsPage.tsx`  
**Impacto potencial:** Página difícil de testar e manter isoladamente  

---

**Problema:** `UserContext` importa `SettingsContext` — acoplamento entre contextos  
**Evidência:** Grafo confirma `IMPORTS_FROM` de `UserContext.tsx` para `SettingsContext.tsx` na linha 3.  
**Arquivos:** `src/contexts/UserContext.tsx`, `src/contexts/SettingsContext.tsx`  
**Impacto potencial:** Mudanças em SettingsContext podem ter efeitos colaterais inesperados em UserContext  

---

**Problema:** `dashboardService.ts.backup` commitado no repositório  
**Evidência:** Arquivo `src/services/dashboardService.ts.backup` existe no diretório de serviços.  
**Arquivos:** `src/services/dashboardService.ts.backup`  
**Impacto potencial:** Confusão sobre qual arquivo é o ativo; possível exposição de lógica antiga  

---

### Baixo Impacto

---

**Problema:** Cores hexadecimais hardcoded sem usar tokens CSS  
**Evidência:** `App.tsx` linhas 92-94 usa `background: 'white'`, `color: '#0F172A'`, `border: '1px solid #E2E8F0'` em vez dos tokens `--background`, `--foreground`, `--border`.  
**Arquivos:** `App.tsx`, múltiplos componentes  
**Impacto potencial:** Dark mode pode não funcionar para esses elementos  

---

**Problema:** Duas bibliotecas de gráficos (ApexCharts + Recharts)  
**Evidência:** Grep confirma ApexCharts em 2 arquivos, Recharts em 5 arquivos — coexistência no bundle.  
**Arquivos:** `RevenueReportChart.tsx`, `AffiliateCommissionChart.tsx` (Apex); `LeadStatusChart.tsx`, `WeeklyConversionChart.tsx` etc. (Recharts)  
**Impacto potencial:** Bundle maior, dois ecossistemas de API para manter  

---

**Problema:** Duplicação de componente `ProgressBar` — framer-motion vs shadcn  
**Evidência:** `ProgressBar.tsx` (framer-motion, 1465 bytes) e `progress.tsx` (shadcn, 804 bytes) coexistem em `components/ui/`.  
**Impacto potencial:** Inconsistência visual dependendo de qual é usado  

---

## 14. Plano de Refatoração em Fases

> ⚠️ **IMPORTANTE:** Este plano é apenas documental. Nenhuma fase deve ser executada sem aprovação explícita e revisão de cada etapa.

---

### FASE 1 — Fundação do Design System

**Objetivo:** Estabelecer tokens de design consistentes antes de qualquer mudança visual.

**Áreas:** `index.css`, `tailwind.config`, `src/components/ui/`, `App.tsx`

**Arquivos principais:**
- `src/index.css` — centralizar tokens adicionais (brand colors, spacing scale)
- `src/App.tsx` — substituir inline styles do Toaster por tokens CSS
- Auditar e padronizar uso de `dark:` em componentes sem alternância de tema

**Pré-requisitos:** Nenhum.

**Possíveis impactos:** Baixo — mudanças de tokens podem alterar aparência visual, mas sem lógica de negócio.

**Rollback:** Simples — reverter `index.css` e `App.tsx`.

**Risco técnico:** BAIXO.

---

### FASE 2 — Limpeza de Dependências

**Objetivo:** Remover dependências mortas e corrigir categorização de `@playwright/test`.

**Arquivos:** `package.json`

**Ações:**
- Mover `@playwright/test` para `devDependencies`
- Verificar e remover `react-loading-skeleton`, `@dicebear/core`, `@dicebear/collection`
- Verificar se `mercadopago` tem uso dinâmico não detectado por grep estático antes de remover

**Pré-requisitos:** Confirmação manual de zero uso dinâmico.

**Rollback:** `git revert` no package.json.

**Risco técnico:** BAIXO-MÉDIO. Remover libs requer confirmar zero usage dinâmico (imports por string, dynamic imports).

---

### FASE 3 — Consolidação dos Componentes UI

**Objetivo:** Eliminar duplicações em `src/components/ui/`.

**Arquivos:**
- `ElectricBorder.tsx` + `electric-border.tsx` → unificar em um
- `ProgressBar.tsx` + `progress.tsx` → decidir qual manter e migrar consumidores
- `AnimatedTabs.tsx` + `tabs.tsx` → definir estratégia de uso

**Pré-requisitos:** Fase 1 completa. Mapear todos os consumidores de cada componente duplicado com grep.

**Rollback:** Git revert nos arquivos removidos.

**Risco técnico:** MÉDIO. Componentes customizados podem ter comportamentos distintos apesar de nomes similares.

---

### FASE 4 — Padronização de Data Fetching

**Objetivo:** Migrar fetching direto ao Supabase para TanStack Query nos componentes principais.

**Arquivos:**
- `RevenueReportChart.tsx` — extrair `fetchEnrichment` para hook com TanStack Query
- `PendingOrders.tsx` — extrair fetching para hook dedicado
- `SettingsContext.tsx` — avaliar migração ou documentar como exceção justificada

**Pré-requisitos:** Entender completamente os dados consumidos. Fase 3 recomendada.

**Rollback:** Difícil após merge. Recomendado feature flag ou branch dedicado.

**Risco técnico:** ALTO. `fetchEnrichment` (755 linhas) mistura lógica de negócio — extração incorreta pode alterar comportamento de cálculo de lucro.

---

### FASE 5 — Refatoração de Componentes Grandes

**Objetivo:** Dividir megacomponentes em unidades menores e testáveis.

**Arquivos:**
- `RevenueReportChart.tsx` → separar: `useRevenueData`, `RefundModal`, `RevenueChart`, `MarketingCostModal`
- `DropshippingCalculator.tsx` → avaliar divisão em feature slices por modo de view
- `EditProductDialog.tsx` → dividir em seções/steps
- `CampaignsPage.tsx` → extrair lógica para componente dedicado, deixar página thin

**Pré-requisitos:** Fases 3 e 4 completas. Cobertura de testes mínima nos componentes alvo (ver Fase 6).

**Rollback:** Feature flags ou branches de longa duração. Rollback após deploy é arriscado.

**Risco técnico:** MUITO ALTO. `RevenueReportChart` mistura UI e cálculo financeiro — separação incorreta pode silenciosamente quebrar relatórios de lucro.

---

### FASE 6 — Testes e Validação

**Objetivo:** Expandir cobertura de testes, preferencialmente antes das Fases 4 e 5.

**Prioridades:**
1. `calcOrderProfit.ts` — testes unitários (fonte de verdade do lucro)
2. `parseCurrency` — testes unitários (260 callers, zero testes)
3. `dashboardService.ts` — testes unitários
4. `ProtectedRoute.tsx` — testes de autenticação
5. `RevenueReportChart.tsx` — testes de integração (após Fase 5)

**Pré-requisitos:** Idealmente antes das Fases 4 e 5.

**Rollback:** N/A — testes não afetam produção.

**Risco técnico:** MUITO BAIXO.

---

## Resumo Executivo

1. A arquitetura é funcional mas monolítica: dois megacomponentes (`RevenueReportChart` 4752L, `DropshippingCalculator` 4554L) concentram lógica de negócio, fetching e UI, com out-degrees de 773 e 953 respectivamente confirmados pelo grafo.
2. Principal hotspot: `DropshippingCalculator.tsx` (hub #1, grau total 956) e `RevenueReportChart.tsx` (hub #3, grau 775) — qualquer mudança nesses componentes propaga-se para centenas de dependências.
3. Principal problema de UI: ausência de design system coeso — cores hardcoded (`#0F172A`, `#E2E8F0`) coexistem com tokens CSS em `index.css`, especialmente nos estilos inline do `Toaster` em `App.tsx` e em múltiplos componentes de vendas.
4. Maior ponto de acoplamento: `SettingsContext.tsx` — `organizationId` é o gate para todos os fetches e é importado por 13 arquivos diretamente (confirmado pelo grafo), incluindo outros contextos, hooks e páginas.
5. Principal duplicação: duas bibliotecas de gráficos (ApexCharts em 2 arquivos, Recharts em 5) e dois componentes `ElectricBorder` no mesmo diretório `ui/`, além de `ProgressBar` duplicando `progress` shadcn.
6. Maior risco para reforma de UI: `RevenueReportChart.tsx` mistura lógica de cálculo de lucro/reembolso com renderização — refatorar a UI sem isolar a lógica financeira pode quebrar relatórios silenciosamente.
7. Principal problema de data fetching: inconsistência de padrão — TanStack Query adotado em hooks modernos mas `RevenueReportChart` e `PendingOrders` usam Supabase direto com `useState`/`useEffect`, sem cache nem retry padronizado.
8. Principal problema de dependências: `@playwright/test` em `dependencies` em vez de `devDependencies`; `mercadopago`, `react-loading-skeleton` e `@dicebear` instalados sem nenhum import ativo em `src/`.
9. Primeira fase sugerida: Fase 1 (Design System) — menor risco, não interfere com lógica de negócio, cria base consistente para todas as mudanças visuais subsequentes.
10. Próximo passo sugerido: adicionar testes unitários para `calcOrderProfit.ts` e `parseCurrency` (260 callers, zero testes) antes de qualquer reforma, criando rede de segurança mínima para os cálculos financeiros críticos.

