# UI Audit — dropshipping-calculator-app

> **Gerado em:** 2026-10-01  
> **Grafo CRG:** Branch `main` | HEAD `e7284d2` → rebuild incremental executado, 2905 nós / 32785 arestas  
> **Fontes:** code-review-graph MCP (primária) + leitura direta de arquivos (confirmação)  
> **Regra:** apenas análise e documentação. Nenhum código de produção foi alterado neste relatório.

---

## 1. Status do Grafo

| Campo | Valor |
|---|---|
| Arquivos analisados | 376 (anterior: 358) |
| Nós totais | 3016 (anterior: 2905) |
| Arestas totais | 33888 (anterior: 32785) |
| Linguagens | TypeScript, TSX, JavaScript, Bash, SQL |
| Comunidades detectadas | 11 |
| Fluxos de execução | 142 |
| Embeddings semânticos | 0 (sentence-transformers não instalado) |
| Head SHA | 3647de8 (main) |

### 1.1 Distribuição de Nós por Tipo
- **Class / Interfaces:** 497
- **File:** 376
- **Function:** 1419
- **Test:** 724

### 1.2 Distribuição de Arestas por Tipo
- **CALLS:** 23163 (3496 direct, 19667 unresolved)
- **CONTAINS:** 2897
- **IMPORTS_FROM:** 1868
- **INHERITS:** 20
- **REFERENCES:** 1567
- **TESTED_BY:** 4373

---

## 2. Mapa Completo do Projeto

### 2.1 Árvore de Diretórios (`src/`)

```
src/
├── App.tsx                        # Roteador raiz, providers globais, Toaster com tema
├── main.tsx                       # Entry point React
├── index.css                      # Tokens CSS / Tailwind base / Contrast rules
├── App.css                        # Estilos globais complementares
├── vite-env.d.ts                  # Tipos Vite
│
├── pages/                         # Páginas (thin wrappers e views de domínio)
│   ├── Dashboard.tsx              # Página do dashboard financeiro
│   ├── Sales.tsx                  # Página de vendas/relatórios
│   ├── Leads.tsx                  # Página de leads (wrapper fino, 541 bytes)
│   ├── CampaignsPage.tsx          # Página de campanhas vinculadas a contas de anúncios (1282 linhas)
│   ├── AdAccountsPage.tsx         # Listagem e gestão de Contas de Anúncios Multiplataforma
│   ├── AdAccountDetailPage.tsx    # Detalhes, visão geral, campanhas e config da conta (765 linhas)
│   ├── BusinessCentersPage.tsx    # Gestão de Business Centers (Meta, TikTok, Google)
│   ├── PlatformAccountsPage.tsx   # Gestão de perfis de plataforma (1065 linhas, TikTok direto)
│   ├── BrowserProfilesPage.tsx    # Gestão de perfis anti-detect
│   ├── ProxiesPage.tsx            # Gestão de proxies HTTP/SOCKS5
│   ├── ProfilePage.tsx            # Perfil do usuário
│   └── RepasePage.tsx             # Repasse financeiro
│
├── components/                    # Componentes (raiz e subdiretórios)
│   ├── DropshippingCalculator.tsx # MEGACOMPONENTE (4821 linhas)
│   ├── Layout.tsx                 # Layout principal com navegação estruturada e breadcrumbs
│   ├── NavigationBar.tsx          # Barra de navegação com submenus
│   ├── ProtectedRoute.tsx         # Guard de autenticação
│   ├── AdminRoute.tsx             # Guard de admin
│   ├── ThemeProvider.tsx          # Contexto de tema dark/light
│   ├── SettingsDialog.tsx         # Modal de configurações (911 linhas)
│   ├── PendingOrders.tsx          # Pedidos pendentes (1005 linhas)
│   ├── LoginPremium.tsx           # Tela de login (framer-motion + magic-bento)
│   ├── Login.tsx                  # Login simples alternativo
│   ├── KPICard.tsx                # Card de KPI (compartilhado, com testes)
│   ├── LeadsDashboard.tsx         # Dashboard de leads (bridge node)
│   ├── WeeklyConversionChart.tsx  # Gráfico de conversão semanal (recharts)
│   ├── LeadStatusChart.tsx        # Gráfico de status de leads (recharts)
│   ├── TimePeriodFilter.tsx       # Filtro de período reutilizável (com testes)
│   ├── MarketplaceFilter.tsx      # Filtro de marketplace
│   ├── ProductsLoaded.tsx         # Lista de produtos carregados
│   ├── NFeUploadModal.tsx         # Upload de NF-e
│   ├── DashboardErrorBoundary.tsx # Error boundary do dashboard (com testes)
│   ├── FreeSampleCard.tsx         # Card de amostra grátis
│   ├── FreeSampleLane.tsx         # Faixa de amostras
│   ├── PersonalPurchaseLane.tsx   # Faixa de compras pessoais
│   │
│   ├── ad-accounts/               # Módulo de Contas de Anúncios Multiplataforma
│   │   ├── AdAccountCard.tsx      # Card de conta com métricas, status e ações
│   │   ├── AdAccountFormDialog.tsx# Setup Wizard 6-step com seleção de rede, BC, multi-contas e IDs
│   │   ├── AdAccountStatusBadge.tsx # Badge semântico de status
│   │   ├── AdAccountSummaryCards.tsx # KPIs agregados (Total, Ativas, Investimento, Campanhas)
│   │   └── PlatformAccountStep.tsx# Seletor e formulário de perfil (multi-seleção e desvinculação)
│   │
│   ├── business-centers/          # Módulo de Business Centers
│   │   ├── BusinessCenterFormDialog.tsx # Modal 2-step (plataforma + titular, empresa, redes simultâneas)
│   │   └── BusinessCentersManager.tsx   # Gestão de Business Centers com KPIs, busca e cards
│   │
│   ├── platform-accounts/         # Módulo de Perfis de Plataforma
│   │   └── EditPlatformAccountDialog.tsx# Modal de edição de titular e dados de rede
│   │
│   ├── browser-profiles/          # Módulo de Perfis de Navegador Anti-Detect
│   │   └── BrowserProfilesManager.tsx   # Gerenciador de instâncias e proxies vinculados
│   │
│   ├── devices/                   # Módulo de Dispositivos e Cloud Phones
│   │   ├── DeviceFormDialog.tsx   # Wizard 2-step (tipo de ambiente, plataforma, hardware profile)
│   │   └── DevicesManager.tsx     # Gestão de Cloud Phones (Douplus, GeeLark), emuladores e PCs
│   │
│   ├── proxy-providers/           # Módulo de Provedores de Proxy Reutilizáveis
│   │   ├── ProxyProviderFormDialog.tsx # Modal de criação/edição com detecção de logo em tempo real
│   │   └── ProxyProvidersManager.tsx   # Gestão de provedores com proteção para os 9 padrão
│   │
│   ├── proxies/                   # Módulo de Proxies
│   │   └── ProxiesManager.tsx     # Agrupamento nativo por provedor, toggle para países e logos oficiais
│   │
│   ├── ui/                        # Componentes UI reutilizáveis do design system
│   │   ├── ProviderLogo.tsx       # Logo normalizado de provedores de proxy com fallback
│   │   ├── DeviceLogo.tsx         # Logo normalizado de plataformas de cloud phone com fallback
│   │   └── PlatformLogos.tsx      # Logos de plataformas sociais (Meta, TikTok, Google)
│   │
│   ├── calculator/                # Subcomponentes da calculadora
│   │   ├── EditProductDialog.tsx  # Dialog de edição (3348 linhas)
│   │   ├── ProductCard.tsx        # Card de produto (2898 linhas)
│   │   ├── ProfitProjection.tsx   # Projeção de lucro (668 linhas)
│   │   ├── TrafficConfig.tsx      # Config de tráfego (1101 linhas)
│   │   ├── ShopeeConfig.tsx       # Config Shopee (630 linhas)
│   │   ├── GatewayConfig.tsx      # Config de gateway de pagamento
│   │   ├── ResultsPanel.tsx       # Painel de resultados (615 linhas)
│   │   ├── TikTokConfig.tsx       # Config TikTok Shop
│   │   ├── BulkEditModal.tsx      # Edição em lote
│   │   └── VirtualizedProductGrid.tsx # Grid virtualizado
│   │
│   ├── sales/                     # Componentes da área de vendas
│   │   ├── RevenueReportChart.tsx # MEGACOMPONENTE (5264 linhas, ApexCharts)
│   │   ├── HeroSection.tsx        # Hero da seção de vendas
│   │   ├── NovaEntradaDialog.tsx  # Dialog de nova entrada
│   │   ├── PaymentTransactions.tsx# Transações de pagamento (587 linhas)
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
│   │   ├── CampaignFormDialog.tsx # Dialog com seletor obrigatório de Conta de Anúncios
│   │   ├── CampaignSettingsStep.tsx # Step com associação de Ad Account
│   │   ├── AdAccountPickerModal.tsx # Modal de seleção de Ad Account para campanhas
│   │   ├── AdSetSettingsStep.tsx
│   │   └── ProductLinkingStep.tsx
│   │
│   ├── ui/                        # Primitivos de UI
│   │   ├── PlatformLogos.tsx      # Logos vetoriais SVG oficiais (TikTok, Meta, Google, IG, FB)
│   │   ├── [shadcn-ui primitivos] # button, card, dialog, select, tabs...
│   │   └── [customizados]         # AnimatedTabs, MagneticButton, MagicBento...
│   │
│   └── skeletons/                 # Skeletons de loading
│
├── hooks/                         # Custom hooks (TanStack Query)
│   ├── useDropshippingCalculator.ts # Hook principal (1423 linhas)
│   ├── useAdAccounts.ts           # CRUD e filtros de Contas de Anúncios
│   ├── useBusinessCenters.ts      # CRUD e filtros de Business Centers
│   ├── usePlatformAccounts.ts     # CRUD de contas de rede social/plataforma
│   ├── useBrowserProfiles.ts      # CRUD de perfis de navegador
│   ├── useProxies.ts              # CRUD de proxies
│   ├── useCampaigns.ts            # CRUD de campanhas com filtro por ad_account_id
│   ├── useLeads.ts                # CRUD de leads
│   ├── useMarketplaces.ts         # Marketplaces
│   ├── useDashboardData.ts        # Dados do dashboard
│   ├── useDashboardCharts.ts      # Gráficos do dashboard
│   ├── useProductsBling.ts        # Integração Bling
│   ├── useProductSalesStats.ts    # Stats de produtos
│   ├── useOrganization.ts         # Organização
│   ├── useSalesStats.ts           # Stats de vendas
│   ├── use-toast.ts               # Toast notifications
│   └── sales/
│       └── useHeroStats.ts        # KPIs hero section
│
├── services/                      # Camada de acesso a dados (Supabase multi-tenant)
│   ├── adAccountsService.ts       # Gestão de Contas de Anúncios (RLS + multi-tenant)
│   ├── adAccountsService.test.ts  # Testes unitários com Vitest
│   ├── businessCentersService.ts  # Gestão de Business Centers (Meta, TikTok, Google)
│   ├── businessCentersService.test.ts # Testes unitários com Vitest
│   ├── platformAccountsService.ts # Gestão de Perfis de Plataforma
│   ├── platformAccountsService.test.ts # Testes unitários com Vitest
│   ├── browserProfilesService.ts  # Gestão de Perfis de Navegador
│   ├── browserProfilesService.test.ts # Testes unitários com Vitest
│   ├── proxiesService.ts          # Gestão de Proxies
│   ├── proxiesService.test.ts     # Testes unitários com Vitest
│   ├── pricingService.ts          # Cálculo de preços (1112 linhas)
│   ├── productService.ts          # CRUD de produtos (2040 linhas)
│   ├── dashboardService.ts        # Serviço do dashboard
│   ├── leadsService.ts            # CRUD de leads
│   ├── leadsMcpService.ts         # Leads via MCP/N8N (706 linhas)
│   ├── blingOrderService.ts       # Integração Bling pedidos (825 linhas)
│   ├── genderClassificationService.ts
│   ├── salesStatsService.ts
│   ├── melhorEnvioService.ts
│   └── calculators/               # Sub-calculadoras
│
├── contexts/                      # Contextos React
│   ├── SettingsContext.tsx        # Organização, capital
│   ├── UserContext.tsx            # Dados do usuário logado
│   └── DateRangeContext.tsx       # Período de datas global
│
├── constants/
│   └── niches.ts                  # Nichos padronizados de e-commerce
│
├── utils/
│   ├── currency.ts                # parseCurrency
│   ├── currencyFormat.ts          # formatCurrency (BRL, USD, EUR, etc.)
│   ├── currencyFormat.test.ts     # Testes unitários de formatação de moeda
│   ├── inputMasks.ts              # Máscaras de CPF, CNPJ, RG, Telefone, CEP
│   ├── inputMasks.test.ts         # Testes unitários de máscaras
│   ├── calcOrderProfit.ts         # Cálculo de lucro (fonte de verdade)
│   ├── calcOrderProfit.test.ts    # Testes unitários de cálculo de lucro
│   ├── csvExport.ts               # Exportação CSV
│   └── dateRangeCalculator.ts     # Cálculo de intervalos
│
└── types/                         # Tipos TypeScript & Schemas Zod
    ├── adAccounts.ts              # Tipos e Schemas Zod de Contas de Anúncios Multiplataforma
    ├── businessCenters.ts         # Tipos e Schemas Zod de Business Centers
    ├── platformAccounts.ts        # Tipos e Schemas Zod de Perfis de Plataforma
    ├── browserProfiles.ts         # Tipos e Schemas Zod de Perfis de Navegador
    ├── proxies.ts                 # Tipos e Schemas Zod de Proxies
    ├── campaigns.ts               # Tipos de campanhas estendidos com ad_account_id
    ├── calculator.ts
    ├── leads.ts
    └── pendingOrder.ts
```

---

### 2.2 Rotas do React Router

```
/login
└── (sem layout, sem proteção)
    └── LoginPremium
        ├── Hooks: framer-motion (animações), magic-bento
        └── API: supabase.auth.signInWithPassword

/  (calculadora principal)
└── ProtectedRoute
    └── Layout
        └── DropshippingCalculator
            ├── Hook: useDropshippingCalculator (1423 linhas)
            ├── Service: pricingService.calculateMetrics
            ├── Service: productService (CRUD Supabase direto)
            ├── Context: SettingsContext
            └── Lib: gsap (animações)

/produtos
└── ProtectedRoute
    └── Layout
        └── DropshippingCalculator (viewMode="products")

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

/business-centers  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── BusinessCentersPage
                ├── Hook: useBusinessCenters (TanStack Query → businessCentersService → supabase)
                ├── Component: BusinessCentersManager
                ├── Component: BusinessCenterFormDialog (Modal 2 etapas com suporte Meta IG+FB)
                └── Context: SettingsContext (organizationId)

/contas  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── PlatformAccountsPage (1065 linhas)
                ├── Hook: usePlatformAccounts (TanStack Query → platformAccountsService → supabase)
                ├── Component: PlatformAccountStep (Abertura direta do Perfil TikTok)
                ├── Component: EditPlatformAccountDialog
                └── Context: SettingsContext (organizationId)

/perfis-navegador  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── BrowserProfilesPage
                ├── Hook: useBrowserProfiles (TanStack Query → browserProfilesService → supabase)
                ├── Component: BrowserProfilesManager
                └── Context: SettingsContext (organizationId)

/proxies  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── ProxiesPage
                ├── Hook: useProxies (TanStack Query → proxiesService → supabase)
                ├── Component: ProxiesManager
                └── Context: SettingsContext (organizationId)

/contas-anuncios  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── AdAccountsPage
                ├── Hook: useAdAccounts (TanStack Query → adAccountsService → supabase)
                ├── Component: AdAccountSummaryCards
                ├── Component: AdAccountCard
                ├── Component: AdAccountFormDialog (Setup Wizard 6-step)
                └── Context: SettingsContext (organizationId)

/contas-anuncios/:id  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── AdAccountDetailPage (765 linhas)
                ├── Hook: useAdAccount, useAdAccountStats, useCampaigns
                ├── Component: AdAccountStatusBadge
                ├── Component: AdAccountFormDialog (edição)
                └── Context: SettingsContext (organizationId)

/campanhas  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── CampaignsPage (1282 linhas)
                ├── Hook: useCampaigns (TanStack Query, filtro por ad_account_id)
                ├── Hook: useAdAccounts (seletor de conta de contexto)
                ├── Component: CampaignFormDialog (vínculo obrigatório a Ad Account)
                ├── Component: AdAccountPickerModal
                ├── Context: SettingsContext
                └── Lib: gsap

/vendas  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── Sales
                ├── Component: RevenueReportChart (5264 linhas, ApexCharts)
                ├── Component: HeroSection → useHeroStats → supabase
                ├── Component: PendingOrders → supabase (direto, 1005 linhas)
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
                ├── Component: LeadFormDialog (633 linhas)
                └── Hook: useLeads (TanStack Query → leadsService → supabase)

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

### 3.1 Arquivos > 400 Linhas (Mapeados pelo Grafo CRG)

| Arquivo | Linhas | Tipo | Múltiplas Responsabilidades |
|---|---|---|---|
| `RevenueReportChart.tsx` | **5264** | Componente | Chart + modais + cálculo de lucro + enrichment fetch + reembolso |
| `DropshippingCalculator.tsx` | **4821** | Componente | Calculadora + CRUD produtos + UI + animações |
| `EditProductDialog.tsx` | **3348** | Componente | Dialog multi-step com todos campos do produto |
| `ProductCard.tsx` | **2898** | Componente | Card de produto com cálculos inline |
| `productService.ts` | **2040** | Service | CRUD completo de produtos Supabase |
| `AdAccountFormDialog.tsx` | **1626** | Componente | Wizard 6-step multiplataforma com validação Zod e multi-vínculo |
| `useDropshippingCalculator.ts` | **1423** | Hook | Estado + lógica + side effects + fetching |
| `PlatformAccountStep.tsx` | **1377** | Componente | Formulário de perfil + multi-picker + badges de desvinculação |
| `CampaignsPage.tsx` | **1282** | Página | Gestão de campanhas + seletor de Ad Account + modais |
| `BusinessCenterFormDialog.tsx` | **1185** | Componente | Modal 2 etapas com dados de titular, empresa e redes sociais |
| `pricingService.ts` | **1112** | Service | Motor de precificação (calculateMetrics: 850 linhas) |
| `TrafficConfig.tsx` | **1101** | Componente | Configuração de tráfego |
| `PlatformAccountsPage.tsx` | **1065** | Página | Listagem e gerenciamento de perfis com filtros e modais |
| `PendingOrders.tsx` | **1005** | Componente | Gestão de pedidos + fetching inline |
| `SettingsDialog.tsx` | **911** | Componente | Dialog de configurações globais |
| `ProxiesManager.tsx` | **858** | Componente | Gestão de proxies, testes de conectividade e status |
| `BrowserProfilesManager.tsx` | **844** | Componente | Gestão de instâncias anti-detect e associações |
| `blingOrderService.ts` | **825** | Service | Integração Bling ERP |
| `FilterBar.tsx` | **821** | Componente | Filtros complexos de leads |
| `AdAccountDetailPage.tsx` | **765** | Página | Painel detalhado de Ad Account com métricas e campanhas |
| `leadsMcpService.ts` | **706** | Service | Leads via N8N/MCP |
| `EditPlatformAccountDialog.tsx` | **681** | Componente | Formulário de edição de perfis de plataforma |
| `ProfitProjection.tsx` | **668** | Componente | Projeção de lucro |
| `LeadFormDialog.tsx` | **633** | Componente | Dialog de leads |
| `ShopeeConfig.tsx` | **630** | Componente | Config Shopee |
| `ResultsPanel.tsx` | **615** | Componente | Painel de resultados da calculadora |
| `MercadoLivreConfig.tsx` | **597** | Componente | Config Mercado Livre |
| `PaymentTransactions.tsx` | **587** | Componente | Transações de pagamento |
| `genderClassificationService.ts` | **586** | Service | Classificação automática de gênero |

### 3.2 Funções Muito Grandes (por grafo CRG)

| Função | Arquivo | Linhas | Evidência de Problema |
|---|---|---|---|
| `RevenueReportChart` | RevenueReportChart.tsx | **5165** | UI + lógica de negócio + fetching |
| `DropshippingCalculator` | DropshippingCalculator.tsx | **4676** | Feature completa em 1 função |
| `EditProductDialog` | EditProductDialog.tsx | **3160** | Dialog com todo formulário inline |
| `AdAccountFormDialog` | AdAccountFormDialog.tsx | **1516** | Setup Wizard completo de 6 etapas |
| `useDropshippingCalculator` | useDropshippingCalculator.ts | **1313** | Hook com estado + fetch + cálculo |
| `BusinessCenterFormDialog` | BusinessCenterFormDialog.tsx | **1112** | Modal de criação com 2 etapas completas |
| `TrafficConfig` | TrafficConfig.tsx | **1008** | Config UI extensa |
| `PendingOrders` | PendingOrders.tsx | **946** | CRUD + UI juntos |
| `PlatformAccountsPage` | PlatformAccountsPage.tsx | **939** | Listagem, filtros e handlers de perfis |
| `SettingsDialog` | SettingsDialog.tsx | **872** | Configurações globais inline |
| `calculateMetrics` | pricingService.ts | **850** | Motor de cálculo monolítico |
| `fetchEnrichment` | RevenueReportChart.tsx | **821** | Fetch complexo dentro de componente |
| `FilterBar` | FilterBar.tsx | **740** | Filtro complexo de leads |
| `PlatformAccountFormFields` | PlatformAccountStep.tsx | **729** | Formulário extenso de dados cadastrais |
| `AdAccountDetailPage` | AdAccountDetailPage.tsx | **722** | Página de detalhes com lógica embutida |

### 3.3 Comunidades do Grafo (Overview Arquitetural)

O `code-review-graph` identificou **11 comunidades** com acoplamento estrutural:
1. `components-handle` (1295 nós) — Núcleo dos componentes React e wizards
2. `services-product` (333 nós) — Camada de serviços de dados e integrações
3. `hooks-use` (229 nós) — Hooks do TanStack Query e handlers
4. `utils-calculate` (161 nós) — Funções utilitárias e algoritmos financeiros
5. `types-ad` (76 nós) — Schemas Zod e definições de tipos
6. `pages-handle` (68 nós) — Roteadores e páginas principais
7. `dropshipping-calculator-app-present` (24 nós)
8. `contexts-date` (20 nós) — Contextos React
9. `src-page` (9 nós)
10. `webhooks-tik` (4 nós)
11. `lib-wait` (3 nós)

**Principais Pontos de Acoplamento:**
- `components-handle` ↔ `utils-calculate`: 238 arestas (CALLS e REFERENCES)
- `components-handle` ↔ `types-ad`: 181 arestas
- `components-handle` ↔ `hooks-use`: 85 arestas
- `hooks-use` ↔ `utils-calculate`: 84 arestas
- `services-product` ↔ `types-ad`: 78 arestas

---

## 4. Inventário da UI e Componentes Customizados

### 4.1 Primitivos e Logos de Plataforma
- **`PlatformLogos.tsx`**: Adicionado para padronizar os logotipos vetoriais SVG de todas as redes e ecossistemas (TikTok, Meta, Instagram, Facebook, Google, YouTube, Kwai), garantindo identidade visual homogênea em botões, badges e cards.
- **Primitivos shadcn/ui**: Button, Card, Dialog, Select, DropdownMenu, Checkbox, Tabs, Popover, Tooltip, Input, Label, ScrollArea, Separator, Table, Toast.

### 4.2 Componentes Customizados de Animação/UI
- `AnimatedTabs`, `MagneticButton`, `MagicBento`, `Card3D`, `PageProgressBar`, `LoadingState`, `ElectricBorder`.

---

## 5. Módulo Adicionado: Multiplataforma, Business Centers, Perfis, Proxies e Dispositivos

> **Branch:** `main` | **HEAD:** `3647de8` | **Auditoria de Conformidade e Engenharia**

| Dimensão | Implementação | Conformidade |
|---|---|---|
| **Ecossistema Multiplataforma** | Suporte unificado para TikTok Ads Manager, Meta Ads (Instagram + Facebook) e Google Ads (MCC). Logos vetoriais em `PlatformLogos.tsx`. | ✅ Alta |
| **Business Centers com Redes Simultâneas** | Modal de 2 etapas (`BusinessCenterFormDialog.tsx`) com seleção de plataforma + dados de titular (CPF, RG, nascimento) e empresa (CNPJ, IE, situação cadastral). Na Seção 4 (Meta), toggles independentes permitem selecionar Instagram e Facebook simultaneamente. | ✅ 100% Funcional |
| **Ad Account Wizard Multiplataforma** | Setup Wizard de 6 etapas (`AdAccountFormDialog.tsx`) com suporte a TikTok, Meta e Google. Campo "ID da conta de anúncios (act_...)" na Etapa 2 sincronizado automaticamente na Etapa 4 (`advertiser_id`). | ✅ UX Fluida |
| **Multi-Vínculo de Perfis** | Na Etapa 3 do Wizard, `PlatformAccountStep` com `multiple={true}` permite vincular múltiplos perfis (ex.: Instagram + Facebook) com badges individuais e botão de desvincular. | ✅ Validado E2E |
| **Dispositivos e Cloud Phones** | Módulo dedicado (`DevicesManager.tsx`, `DeviceFormDialog.tsx`) com suporte a instâncias Android (Douplus, GeeLark, LDCloud, Redfinger, VMOS Cloud) e emuladores locais. Componente `DeviceLogo.tsx` com detecção de plataforma e perfis de hardware. | ✅ Alta Fidelidade |
| **Logos e Provedores de Proxy Protegidos** | Módulo de provedores (`ProxyProvidersManager.tsx`, `ProxyProviderFormDialog.tsx`) com proteção ativa que impede a exclusão dos 9 provedores padrão oficiais (Bright Data, Decodo, IPRoyal, NetNut, Oxylabs, proxy-cheap, Rayobyte, SOAX, Webshare). Componente `ProviderLogo.tsx` com normalização de slug e fallback. | ✅ Protegido & Seguro |
| **Agrupamento Nativo de Proxies por Provedor** | Em `/proxies` (`ProxiesManager.tsx`), os proxies agora são agrupados nativamente por provedor com seus logos oficiais nos cabeçalhos e dentro de cada card. Inclui alternador de visualização (Provedores | Países) e pills de filtro adaptativas. | ✅ UX Otimizada |
| **Suavização e Polimento da Sidebar** | O grupo `Contas` na sidebar agora vem recolhido por padrão (`nav_group_contas_open = false`) e os submenus expandem suavemente via CSS Grid e `tailwindcss-animate`, eliminando o carregamento rígido e transições abruptas. | ✅ Transição Fluida |
| **Validação com Testes Unitários** | Testes criados para `calcOrderProfit.test.ts` (28 testes), `currencyFormat.test.ts` (7 testes), `inputMasks.test.ts` (10 testes), `platformAccountsService.test.ts` (19 testes), `browserProfilesService.test.ts` (17 testes), `proxiesService.test.ts` (23 testes) e `proxyProvidersService.test.ts`. | ✅ Vitest Passing |

---

## 6. Riscos Identificados e Próximos Passos de Refatoração

1. **Megacomponentes (`RevenueReportChart` 5264L e `DropshippingCalculator` 4821L):**
   - Continuam sendo os maiores hotspots do projeto. Qualquer alteração visual nesses módulos deve ser feita com cautela máxima.
2. **Setup Wizards Grandes (`AdAccountFormDialog` 1626L e `BusinessCenterFormDialog` 1185L):**
   - Embora muito bem estruturados com Steppers visuais e Zod, podem no futuro ter suas etapas extraídas em sub-componentes independentes (ex.: `BusinessCenterStepPlatform`, `BusinessCenterStepDetails`).
3. **Avanço nos Testes Unitários:**
   - A base de testes cresceu substancialmente com a introdução de testes para utilitários críticos (`calcOrderProfit.ts` com 28 testes, `currencyFormat.ts` com 7 testes e `inputMasks.ts` com 10 testes).
   - Recomenda-se atualizar `businessCentersService.test.ts` e `adAccountsService.test.ts` para refletir as novas opções multiplataforma (Meta e Google).

---

## Resumo Executivo Atualizado

1. **Expansão Arquitetural:** O grafo de código (`code-review-graph`) expandiu para **376 arquivos**, **3.016 nós** e **33.888 arestas**, integrando a arquitetura completa de contingência (Contas de Anúncios Multiplataforma, Business Centers, Perfis de Navegador, Dispositivos/Cloud Phones, Provedores de Proxy e Proxies de Rede).
2. **Proteção de Provedores do Sistema:** Os 9 provedores padrão essenciais para a operação foram blindados contra exclusão acidental na interface e na camada de controle.
3. **Visualização por Provedor com Logos Oficiais:** A gestão de proxies adotou o agrupamento nativo por provedor, estampando seus logotipos em alta definição e permitindo alternância instantânea com a visão geográfica por país.
4. **Experiência de Navegação Suave (Sidebar):** O carregamento rígido da barra lateral foi substituído por uma transição fluida com animação de entrada e sanfona CSS Grid, mantendo o bloco de contas recolhido por padrão conforme diretriz de design.
5. **Garantia de Qualidade:** Código verificado via compilação TypeScript com 0 erros, testes E2E/visuais automatizados via Playwright e conformidade rastreada no grafo de arquitetura.
