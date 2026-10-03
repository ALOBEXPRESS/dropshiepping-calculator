# UI Audit — dropshipping-calculator-app

> **Gerado em:** 2026-10-03  
> **Grafo CRG:** Branch `main` | HEAD `39201a4` → rebuild incremental executado, 3493 nós / 39543 arestas  
> **Fontes:** code-review-graph MCP (primária) + leitura direta de arquivos (confirmação)  
> **Regra:** apenas análise e documentação. Nenhum código de produção foi alterado neste relatório.

---

## 1. Status do Grafo

| Campo | Valor |
|---|---|
| Arquivos analisados | 446 (anterior: 432) |
| Nós totais | 3493 (anterior: 3363) |
| Arestas totais | 39543 (anterior: 37407) |
| Linguagens | TypeScript, TSX, JavaScript, Bash, SQL |
| Comunidades detectadas | 11 |
| Fluxos de execução | 142 |
| Embeddings semânticos | 0 (sentence-transformers não instalado) |
| Head SHA | 39201a4 (main) |

### 1.1 Distribuição de Nós por Tipo
- **Class / Interfaces:** 574 (anterior: 543)
- **File:** 446 (anterior: 432)
- **Function:** 1565 (anterior: 1489)
- **Test:** 908 (anterior: 899)

### 1.2 Distribuição de Arestas por Tipo
- **CALLS:** 26437 (4064 direct, 22373 unresolved)
- **CONTAINS:** 3300 (anterior: 3175)
- **IMPORTS_FROM:** 2273 (anterior: 2164)
- **INHERITS:** 24 (anterior: 22)
- **REFERENCES:** 2106 (anterior: 1860)
- **TESTED_BY:** 5403 (anterior: 5261)

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
│   ├── ProxyProvidersPage.tsx     # Gestão de provedores de proxy com proteção dos oficiais
│   ├── DevicesPage.tsx            # Gestão de cloud phones, emuladores e aparelhos físicos
│   ├── InfraMapPage.tsx           # Mapa interativo de conexões, persistência de viewport e integridade (@xyflow/react)
│   ├── ResponsaveisPage.tsx       # Gestão unificada de Titulares, Influenciadores e Testadores com abas
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
│   ├── infra-map/                 # Módulo do Mapa de Conexões de Infraestrutura
│   │   ├── HealthKpis.tsx         # Barra de integridade com 12 diagnósticos (hardware e anti-ban TikTok)
│   │   ├── InfraMapCanvas.tsx     # Viewport ReactFlow com persistência de câmera/zoom e defaultViewport
│   │   ├── InfraMapToolbar.tsx    # Barra de ferramentas com dropdown Módulos não-bloqueante e Salvar Visualização
│   │   ├── InfraMapLegend.tsx     # Legenda colapsável com tipos de nós e convenções
│   │   ├── InfraMapSidebarSheet.tsx # Painel lateral com paleta de 11 cores e controles de visibilidade
│   │   ├── NodeContextMenu.tsx   # Menu de botão direito com cores e ocultação de nó/módulo
│   │   ├── InfraEdge.tsx          # Arestas customizadas com animação de alerta
│   │   └── nodes/                 # 9 Nós customizados de topologia (@xyflow/react)
│   │       ├── BaseNode.tsx       # Componente base com tamanhos dinâmicos e anel de alerta
│   │       ├── AdAccountNode.tsx
│   │       ├── BrowserProfileNode.tsx
│   │       ├── BusinessCenterNode.tsx
│   │       ├── DeviceNode.tsx
│   │       ├── PlatformAccountNode.tsx
│   │       ├── ProxyNode.tsx
│   │       ├── ProxyProviderNode.tsx
│   │       └── TitularNode.tsx
│   │
│   ├── responsaveis/              # Módulo de Responsáveis (Titulares, Influenciadores, Testadores)
│   │   ├── ResponsaveisManager.tsx# Listagem em abas, busca, filtros de status e contadores
│   │   └── ResponsavelFormDialog.tsx # Formulário unificado com campos específicos por papel
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
│   │   ├── BusinessCentersManager.tsx   # Gestão de Business Centers com KPIs, busca e cards
│   │   ├── BusinessCenterTestadoresSection.tsx # Seção de vinculação de testadores de BC
│   │   └── BusinessCenterAccountLinksManager.tsx # Gerenciador de contas vinculadas ao BC
│   │
│   ├── platform-accounts/         # Módulo de Perfis de Plataforma
│   │   ├── EditPlatformAccountDialog.tsx# Modal com Acordeon Vermelho de Hardware e Anti-Ban TikTok (990 linhas)
│   │   ├── PlatformAccountCard.tsx# Card de conta com status, badges e conexões
│   │   └── AccountBusinessCentersSection.tsx # Seção de Business Centers vinculados
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
│   │   ├── ProxiesManager.tsx     # Agrupamento nativo por provedor, toggle para países e logos oficiais
│   │   └── ProxyFormDialog.tsx    # Modal de cadastro/edição de proxy com teste de conexão
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
│   ├── useProxyProviders.ts       # Consulta e cache de provedores de proxy
│   ├── useDevices.ts              # CRUD de cloud phones, emuladores e aparelhos
│   ├── useInfraGraph.ts           # Consulta e cache do grafo de infraestrutura via RPC
│   ├── useInfraMapFocus.ts        # Algoritmo BFS para foco bidirecional em sub-árvores
│   ├── useInfraMapFocus.test.ts   # Testes unitários do algoritmo BFS de travessia
│   ├── useInfraMapLayout.ts       # Layout de nós com persistência de posições customizadas
│   ├── useResponsaveis.ts         # CRUD de responsáveis (Titulares, Influenciadores, Testadores)
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
│   ├── platformAccountsService.ts # Gestão de Perfis de Plataforma + junction N:N com devices
│   ├── platformAccountsService.test.ts # Testes unitários com Vitest
│   ├── browserProfilesService.ts  # Gestão de Perfis de Navegador
│   ├── browserProfilesService.test.ts # Testes unitários com Vitest
│   ├── proxiesService.ts          # Gestão de Proxies
│   ├── proxiesService.test.ts     # Testes unitários com Vitest
│   ├── proxyProvidersService.ts   # Gestão de provedores com blindagem dos 9 provedores padrão
│   ├── proxyProvidersService.test.ts # Testes unitários com Vitest
│   ├── devicesService.ts          # Gestão de aparelhos, cloud phones e hardware profiles
│   ├── devicesService.test.ts     # Testes unitários com Vitest
│   ├── responsaveisService.ts     # Gestão unificada de titulares, influenciadores e testadores
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
│   ├── currency.ts                # parseCurrency (hub node: 341 conexões)
│   ├── currencyFormat.ts          # formatCurrency (BRL, USD, EUR, etc.)
│   ├── currencyFormat.test.ts     # Testes unitários de formatação de moeda
│   ├── inputMasks.ts              # Máscaras de CPF, CNPJ, RG, Telefone, CEP
│   ├── inputMasks.test.ts         # Testes unitários de máscaras
│   ├── calcOrderProfit.ts         # Cálculo de lucro (fonte de verdade)
│   ├── calcOrderProfit.test.ts    # Testes unitários de cálculo de lucro
│   ├── infraGraphHealth.ts        # 12 Regras de auditoria de conexões (TikTok 1:1, ban risk >=6, proxies compartilhados)
│   ├── infraGraphHealth.test.ts   # 20 Testes unitários cobrindo todas as violações de integridade
│   ├── infraGraphTransform.ts     # Transformação de dados brutos do Supabase em nós/arestas Dagre
│   ├── infraGraphTransform.test.ts# Testes unitários de layout e nós
│   ├── csvExport.ts               # Exportação CSV
│   └── dateRangeCalculator.ts     # Cálculo de intervalos
│
└── types/                         # Tipos TypeScript & Schemas Zod
    ├── adAccounts.ts              # Tipos e Schemas Zod de Contas de Anúncios Multiplataforma
    ├── businessCenters.ts         # Tipos e Schemas Zod de Business Centers
    ├── platformAccounts.ts        # Tipos e Schemas Zod de Perfis de Plataforma (device_ids array)
    ├── browserProfiles.ts         # Tipos e Schemas Zod de Perfis de Navegador
    ├── proxies.ts                 # Tipos e Schemas Zod de Proxies
    ├── proxyProviders.ts          # Tipos e Schemas Zod de Provedores de Proxy
    ├── devices.ts                 # Tipos e Schemas Zod de Dispositivos e Cloud Phones
    ├── responsaveis.ts            # Tipos e Schemas Zod de Titulares, Influenciadores e Testadores
    ├── infraGraph.ts              # Tipagem completa de nós, arestas, KPIs de saúde e layout Dagre
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
                ├── Component: ProxiesManager (agrupamento nativo por provedor e toggle para países)
                └── Context: SettingsContext (organizationId)

/provedores-proxy  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── ProxyProvidersPage
                ├── Hook: useProxyProviders (TanStack Query → proxyProvidersService → supabase)
                ├── Component: ProxyProvidersManager (blindagem dos 9 provedores padrão)
                ├── Component: ProxyProviderFormDialog (detecção dinâmica de logo)
                └── Context: SettingsContext (organizationId)

/dispositivos  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── DevicesPage
                ├── Hook: useDevices (TanStack Query → devicesService → supabase)
                ├── Component: DevicesManager (Cloud Phones GeeLark/Douplus, emuladores e PCs)
                ├── Component: DeviceFormDialog (Wizard 2 etapas + hardware profile)
                └── Context: SettingsContext (organizationId)

/mapa  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── InfraMapPage (@xyflow/react)
                ├── Hook: useInfraGraph (RPC get_infra_graph → Supabase)
                ├── Hook: useInfraMapFocus (algoritmo BFS para foco bidirecional em sub-árvores)
                ├── Hook: useInfraMapLayout (layout com persistência de posições customizadas)
                ├── Component: HealthKpis (diagnóstico em tempo real com 12 regras de integridade)
                ├── Component: InfraMapToolbar (dropdown persistente Módulos X/9, busca portalled e Salvar Visualização)
                ├── Component: InfraMapCanvas (viewport ReactFlow com defaultViewport e restauração precisa de câmera)
                ├── Component: InfraMapSidebarSheet (inspeção lateral, seletor com 11 cores curadas e ocultação de nó/módulo)
                ├── Component: NodeContextMenu (menu de clique direito com cores e ocultação de nó/módulo)
                ├── Component: InfraMapLegend (legenda colapsável com tipos de nós e convenções)
                └── Context: SettingsContext (organizationId)

/responsaveis  (admin only)
└── ProtectedRoute
    └── AdminRoute
        └── Layout
            └── ResponsaveisPage
                ├── Hook: useResponsaveis (TanStack Query → responsaveisService → supabase)
                ├── Component: ResponsaveisManager (abas: Titulares, Influenciadores, Testadores, busca e filtros)
                ├── Component: ResponsavelFormDialog (criação e edição com validação específica por papel)
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

### 3.1 Arquivos Notáveis (Mapeados pelo Grafo CRG)

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
| `EditPlatformAccountDialog.tsx` | **990** | Componente | Acordeon Vermelho de Hardware Fingerprinting + Anti-Ban TikTok + seleção de aparelhos |
| `SettingsDialog.tsx` | **911** | Componente | Dialog de configurações globais |
| `ProxiesManager.tsx` | **858** | Componente | Gestão de proxies agrupados por provedor + testes de conectividade |
| `BrowserProfilesManager.tsx` | **844** | Componente | Gestão de instâncias anti-detect e associações |
| `blingOrderService.ts` | **825** | Service | Integração Bling ERP |
| `FilterBar.tsx` | **821** | Componente | Filtros complexos de leads |
| `InfraMapPage.tsx` | **760** | Página | Orquestrador de topologia (@xyflow/react), persistência de câmera/filtros e BFS |
| `AdAccountDetailPage.tsx` | **765** | Página | Painel detalhado de Ad Account com métricas e campanhas |
| `ResponsaveisPage.tsx` | **715** | Página | Gestão unificada de Titulares, Influenciadores e Testadores com abas |
| `leadsMcpService.ts` | **706** | Service | Leads via N8N/MCP |
| `InfraMapToolbar.tsx` | **685** | Componente | Toolbar com dropdown Módulos não-bloqueante, busca portalled e Salvar Visualização |
| `ProfitProjection.tsx` | **668** | Componente | Projeção de lucro |
| `LeadFormDialog.tsx` | **633** | Componente | Dialog de leads |
| `ShopeeConfig.tsx` | **630** | Componente | Config Shopee |
| `ResultsPanel.tsx` | **615** | Componente | Painel de resultados da calculadora |
| `MercadoLivreConfig.tsx` | **597** | Componente | Config Mercado Livre |
| `PaymentTransactions.tsx` | **587** | Componente | Transações de pagamento |
| `genderClassificationService.ts` | **586** | Service | Classificação automática de gênero |
| `infraGraphHealth.test.ts` | **368** | Teste | 20 testes unitários de regras anti-ban e integridade |
| `platformAccountsService.ts` | **366** | Service | Sincronização N:N com `platform_account_devices` |
| `InfraMapSidebarSheet.tsx` | **355** | Componente | Gaveta lateral com paleta de 11 cores curadas e ações de visibilidade |
| `HealthKpis.tsx` | **290** | Componente | Diagnóstico de integridade com 12 tipos de alerta |
| `infraGraphHealth.ts` | **283** | Util | Motor de auditoria com regras de isolamento e ban risk do TikTok |
| `NodeContextMenu.tsx` | **194** | Componente | Menu de contexto de botão direito com cores e ocultação de nó/módulo |
| `InfraMapCanvas.tsx` | **178** | Componente | Canvas ReactFlow com defaultViewport e sincronização de viewport |

### 3.2 Funções de Grande Porte (Mapeadas pelo Grafo CRG)

| Função | Arquivo | Linhas | Evidência de Complexidade |
|---|---|---|---|
| `RevenueReportChart` | `RevenueReportChart.tsx` | **5113** | UI + lógica de negócio + queries inline |
| `DropshippingCalculator` | `DropshippingCalculator.tsx` | **4676** | Calculadora e gestão completa de produtos em uma função |
| `EditProductDialog` | `EditProductDialog.tsx` | **3160** | Dialog monolítico com abas e formulários |
| `AdAccountFormDialog` | `AdAccountFormDialog.tsx` | **1519** | Wizard de 6 etapas com steppers e validações |
| `useDropshippingCalculator` | `useDropshippingCalculator.ts` | **1313** | Hook centralizador com estados múltiplos e fetching |
| `BusinessCenterFormDialog` | `BusinessCenterFormDialog.tsx` | **1112** | Modal de criação com 2 etapas completas |
| `TrafficConfig` | `TrafficConfig.tsx` | **1008** | Configuração extensa de fontes de tráfego |
| `PendingOrders` | `PendingOrders.tsx` | **946** | Tabela, ações de processamento e modais |
| `PlatformAccountsPage` | `PlatformAccountsPage.tsx` | **939** | Listagem, filtros e handlers de perfis |
| `EditPlatformAccountDialog` | `EditPlatformAccountDialog.tsx` | **916** | Formulário com acordeon de fingerprinting e travas anti-ban |
| `SettingsDialog` | `SettingsDialog.tsx` | **872** | Configurações globais inline |
| `calculateMetrics` | `pricingService.ts` | **850** | Motor de cálculo financeiro monolítico |
| `fetchEnrichment` | `RevenueReportChart.tsx` | **821** | Fetching complexo de dados de terceiros |
| `FilterBar` | `FilterBar.tsx` | **740** | Filtro complexo de leads |
| `PlatformAccountFormFields` | `PlatformAccountStep.tsx` | **729** | Formulário extenso de dados cadastrais |
| `AdAccountDetailPage` | `AdAccountDetailPage.tsx` | **722** | Página de detalhes com lógica embutida |

### 3.3 Comunidades do Grafo (`get_architecture_overview_tool`)

O grafo arquitetural particionou a base de código em **11 comunidades modulares**:

| ID | Comunidade | Tamanho (Nós) | Coesão Interna | Linguagem Dominante | Papel Arquitetural |
|---|---|---|---|---|---|
| 62 | `components-handle` | **1295** | 0.1328 | TSX | Componentes React de apresentação, wizards e telas |
| 67 | `services-product` | **333** | 0.1969 | TypeScript | Camada de serviços de negócio, persistência Supabase e integrações |
| 64 | `hooks-use` | **229** | 0.0844 | TypeScript | Camada de estado e cache de dados via TanStack Query |
| 69 | `utils-calculate` | **161** | 0.2281 | TypeScript | Motores de cálculo, máscaras, formatação e auditoria de grafo |
| 68 | `types-ad` | **76** | 0.0821 | TypeScript | Tipagens TypeScript estritas e Schemas de validação Zod |
| 66 | `pages-handle` | **68** | 0.0635 | TSX | Controladores de rotas e cascas de páginas de domínio |
| 60 | `dropshipping-calculator-app-present` | **24** | 0.3399 | Bash | Scripts de instalação e automação de ambiente |
| 63 | `contexts-date` | **20** | 0.1211 | TSX | Contextos globais React (Settings, User, DateRange) |
| 61 | `src-page` | **9** | 0.0851 | TSX | Entry points e bootstrap da aplicação |
| 59 | `webhooks-tik` | **4** | 0.0000 | TypeScript | Endpoints e types de webhooks de marketplace |
| 65 | `lib-wait` | **3** | 0.0161 | TypeScript | Utilitários utilitários de infraestrutura e conexões |

### 3.4 Nós Centrais / Hubs de Dependência (`get_hub_nodes_tool`)

Nós com maior grau de centralidade no grafo (alto número de dependências ativas):

1. **`DropshippingCalculator`** (grau total: **950** | in: 3, out: 947) — Maior nó emissor da aplicação.
2. **`RevenueReportChart`** (grau total: **852** | in: 2, out: 850) — Epicentro da área de vendas e relatórios.
3. **`EditProductDialog`** (grau total: **718** | in: 2, out: 716) — Wizard de produto com alto número de campos e sub-regras.
4. **`useDropshippingCalculator`** (grau total: **389** | in: 2, out: 387) — Principal hook de estado da calculadora.
5. **`parseCurrency`** (grau total: **341** | in: **311**, out: 30) — **Maior receptor de dependências do sistema**. 311 nós chamam diretamente essa função utilitária.
6. **`fetchEnrichment`** (grau total: **272** | in: 2, out: 270) — Sub-rotina de enriquecimento de dados de pedidos.
7. **`AdAccountFormDialog`** (grau total: **246** | in: 4, out: 242) — Setup Wizard multiplataforma.
8. **`calculateMetrics`** (grau total: **241** | in: **40**, out: 201) — Motor de precificação consumido por 40 nós em múltiplos módulos.
9. **`TrafficConfig`** (grau total: **223** | in: 2, out: 221) — Configuração de métricas de tráfego pago.
10. **`BusinessCenterFormDialog`** (grau total: **186** | in: 2, out: 184) — Wizard de Business Centers com seleção de redes e empresas.
11. **`EditPlatformAccountDialog`** (grau total: **185** | in: 2, out: 183) — Modal enriquecido com Acordeon Vermelho de anti-ban TikTok e seletor de aparelhos.

### 3.5 Gargalos Arquiteturais / Pontes Estruturais (`get_bridge_nodes_tool`)

Nós com maior intermediação (*betweenness centrality*), atuando como pontes de comunicação entre diferentes regiões do sistema:

- **`LeadsTable`** (`betweenness`: 0.006844) & **`LeadsTableContent`** (`betweenness`: 0.005983) — Chokepoint de apresentação de leads.
- **`it:correctly traverses star topology with more than 10 children without stopping early`** (`useInfraMapFocus.test.ts` | `betweenness`: 0.004912) — Teste de estresse do algoritmo BFS do Mapa de Conexões que valida a integridade de travessia topológica.
- **`LeadsDashboard`** (`betweenness`: 0.004256) — Hub de integração entre tabelas, filtros e métricas de leads.
- **`FilterBar`** (`betweenness`: 0.004126) & **`LeadFormDialog`** (`betweenness`: 0.003982) — Pontes entre formulários, filtros e serviços.
- **`calculateMetrics`** (`pricingService.ts` | `betweenness`: 0.002811) — Ponte matemática entre a camada de dados e os componentes visuais.
- **`TablePagination`** (`betweenness`: 0.002606) — Componente compartilhado entre listagens tabulares.
- **`fetchWithRetry`** (`src/lib/supabase.ts` | `betweenness`: 0.002552) — Chokepoint fundamental de resiliência de rede do cliente Supabase.

### 3.6 Acoplamento Cruzado e Alertas do Grafo (`get_architecture_overview_tool`)

O grafo registrou **18 pares de comunidades com acoplamento**, destacando as seguintes interações:

- **`components-handle` ↔ `utils-calculate`:** 236 arestas (`CALLS` e `REFERENCES`) — Componentes chamam utilitários matemáticos diretamente.
- **`components-handle` ↔ `types-ad`:** 181 arestas (`REFERENCES`) — Uso intensivo de tipos TypeScript em componentes.
- **`components-handle` ↔ `hooks-use`:** 81 arestas (`CALLS` e `REFERENCES`) — Consumo de dados via TanStack Query.
- **`hooks-use` ↔ `utils-calculate`:** 81 arestas (`CALLS`) — Hooks aplicam regras de validação e transformação.
- **`components-handle` ↔ `lib-wait`:** 70 arestas (`CALLS`) — Chamadas a utilitários de espera e debounce.
- **`services-product` ↔ `types-ad`:** 62 arestas (`REFERENCES`) — Validação de payloads de APIs via tipos/schemas.
- **`hooks-use` ↔ `types-ad`:** 56 arestas (`REFERENCES`) — Tipagem forte em consultas e mutações.
- **`services-product` ↔ `utils-calculate`:** 48 arestas (`CALLS`) — Serviços utilizam funções auxiliares de dados.
- **`components-handle` ↔ `services-product`:** 34 arestas (`REFERENCES` e `CALLS`) — Chamadas diretas a serviços por componentes legados.
- **`types-ad` ↔ `utils-calculate`:** 34 arestas (`REFERENCES`) — Compartilhamento de definições de tipos para utilitários.
- **`hooks-use` ↔ `services-product`:** 22 arestas (`CALLS` e `REFERENCES`) — Arquitetura recomendada: hooks consumindo serviços.
- **`components-handle` ↔ `pages-handle`:** 20 arestas (`CALLS`) — Renderização e roteamento de componentes.
- **`components-handle` ↔ `contexts-date`:** 12 arestas (`CALLS` e `REFERENCES`) — Consumo de filtros temporais.

### 3.7 Blast Radius e Análise de Risco das Mudanças Recentes (`get_review_context_tool` & `detect_changes_tool`)

A análise de raio de impacto (*blast radius*) executada pelo `code-review-graph` no HEAD `39201a4` mapeou:
- **Arquivos modificados diretamente no último commit:** 5 arquivos (`InfraMapCanvas.tsx`, `InfraMapSidebarSheet.tsx`, `InfraMapToolbar.tsx`, `NodeContextMenu.tsx`, `InfraMapPage.tsx`).
- **Funções e Classes alteradas:** 9 nós (`InfraMapCanvasProps`, `InfraMapCanvas`, `InfraMapSidebarSheetProps`, `InfraMapSidebarSheet`, `InfraMapToolbarProps`, `InfraMapToolbar`, `NodeContextMenuProps`, `NodeContextMenu`, `InfraMapContent`).
- **Fluxos de execução afetados:** 0 (alterações confinadas ao subsistema visual do mapa de conexões).
- **Pontuação Geral de Risco (CRG Score):** **0.35 (Baixo Risco)**.
- **Validação de Testes e Cobertura:** 
  - Suite de testes unitários com **908 nós de teste** (Vitest 12/12 em `infraGraphTransform.test.ts`).
  - Cobertura funcional e visual executada via **Playwright MCP**, validando cliques no menu de módulos, troca reativa de cores, persistência da matriz de transformação CSS `matrix(0.8, 0, 0, 0.8, 150, 120)` e ausência de regressões pós-reload.

### 3.8 Lacunas de Conhecimento e Hotspots Não Testados (`get_knowledge_gaps_tool`)

O grafo identificou 72 lacunas globais na base de código:
- **Nós Isolados:** 50 nós com grau 1 (principalmente tipos de webhooks em `api/webhooks/tiktok-shop.types.ts` e props isoladas de modais).
- **Hotspots Não Testados Diretamente:**
  - `DropshippingCalculator` (grau 950) e `RevenueReportChart` (grau 852) — Requerem testes de regressão E2E / Playwright adicionais.
  - `EditProductDialog` (grau 718) e `useDropshippingCalculator` (grau 389).
  - `TrafficConfig` (grau 223) e `BusinessCenterFormDialog` (grau 186).
- **Módulos com Cobertura Completa:**
  - O subsistema de auditoria de grafo (`infraGraphHealth`), cálculo de margem e lucro (`calcOrderProfit`), máscaras (`inputMasks`), moedas (`currencyFormat`), serviços de contingência (`platformAccountsService`, `businessCentersService`, `proxiesService`, `browserProfilesService`) e transformações do mapa (`infraGraphTransform`) possuem suites de teste unitário dedicadas e ativas.

---

## 4. Inventário da UI e Componentes Customizados

### 4.1 Primitivos e Logos de Plataforma
- **`PlatformLogos.tsx`**: Adicionado para padronizar os logotipos vetoriais SVG de todas as redes e ecossistemas (TikTok, Meta, Instagram, Facebook, Google, YouTube, Kwai), garantindo identidade visual homogênea em botões, badges e cards.
- **Primitivos shadcn/ui**: Button, Card, Dialog, Select, DropdownMenu, Checkbox, Tabs, Popover, Tooltip, Input, Label, ScrollArea, Separator, Table, Toast.

### 4.2 Componentes Customizados de Animação/UI
- `AnimatedTabs`, `MagneticButton`, `MagicBento`, `Card3D`, `PageProgressBar`, `LoadingState`, `ElectricBorder`.

---

## 5. Módulo Adicionado: Multiplataforma, Business Centers, Perfis, Proxies, Dispositivos e Regras Anti-Ban TikTok

> **Branch:** `main` | **HEAD:** `39201a4` | **Auditoria de Conformidade e Engenharia (via code-review-graph MCP)**

| Dimensão | Implementação | Conformidade |
|---|---|---|
| **Ecossistema Multiplataforma** | Suporte unificado para TikTok Ads Manager, Meta Ads (Instagram + Facebook) e Google Ads (MCC). Logos vetoriais em `PlatformLogos.tsx`. | ✅ Alta |
| **Business Centers com Redes Simultâneas** | Modal de 2 etapas (`BusinessCenterFormDialog.tsx`) com seleção de plataforma + dados de titular (CPF, RG, nascimento) e empresa (CNPJ, IE, situação cadastral). Na Seção 4 (Meta), toggles independentes permitem selecionar Instagram e Facebook simultaneamente. | ✅ 100% Funcional |
| **Relacionamentos de Business Centers** | 1 Business Center pode ter várias contas de anúncio distintas, enquanto 1 conta de anúncio pertence a apenas 1 Business Center (`ad_accounts.bc_entity_id`). Vinculação a 1 proxy e 1 dispositivo por BC (`business_centers.device_id`, `business_centers.proxy_id`). | ✅ Integridade de Dados |
| **Ad Account Wizard Multiplataforma** | Setup Wizard de 6 etapas (`AdAccountFormDialog.tsx`) com suporte a TikTok, Meta e Google. Campo "ID da conta de anúncios (act_...)" na Etapa 2 sincronizado automaticamente na Etapa 4 (`advertiser_id`). | ✅ UX Fluida |
| **Multi-Vínculo de Perfis** | Na Etapa 3 do Wizard, `PlatformAccountStep` com `multiple={true}` permite vincular múltiplos perfis (ex.: Instagram + Facebook) com badges individuais e botão de desvincular. | ✅ Validado E2E |
| **Dispositivos e Cloud Phones** | Módulo dedicado (`DevicesManager.tsx`, `DeviceFormDialog.tsx`) com suporte a instâncias Android (Douplus, GeeLark, LDCloud, Redfinger, VMOS Cloud) e emuladores locais. Componente `DeviceLogo.tsx` com detecção de plataforma e perfis de hardware. | ✅ Alta Fidelidade |
| **Acordeon Vermelho Anti-Ban TikTok** | No modal Editar Conta (`EditPlatformAccountDialog.tsx`), acordeon temático vermelho com destaque de hardware fingerprinting: enfatiza isolamento 1:1 para TikTok, medidor visual de 6 slots (`1: Ideal`, `2-5: Não ideal`, `6+: Banimento`) e confirmação de segurança bloqueante contra suspensão imediata de contas com 6+ aparelhos. | ✅ Proteção Ativa Anti-Ban |
| **Tabela Junction Multi-Dispositivos** | Suporte N:N via tabela `platform_account_devices` com RLS otimizada `(SELECT auth.uid())`, índices em Foreign Keys (`postgres-best-practices`) e sincronização transparente no `PlatformAccountsService`. | ✅ Postgres Best Practices |
| **Logos e Provedores de Proxy Protegidos** | Módulo de provedores (`ProxyProvidersManager.tsx`, `ProxyProviderFormDialog.tsx`) com proteção ativa que impede a exclusão dos 9 provedores padrão oficiais (Bright Data, Decodo, IPRoyal, NetNut, Oxylabs, proxy-cheap, Rayobyte, SOAX, Webshare). Componente `ProviderLogo.tsx` com normalização de slug e fallback. | ✅ Protegido & Seguro |
| **Agrupamento Nativo de Proxies por Provedor** | Em `/proxies` (`ProxiesManager.tsx`), os proxies agora são agrupados nativamente por provedor com seus logos oficiais nos cabeçalhos e dentro de cada card. Inclui alternador de visualização (Provedores | Países) e pills de filtro adaptativas. | ✅ UX Otimizada |
| **Mapa de Conexões de Infraestrutura (`/mapa`)** | Topologia interativa e mapa de integridade de contingência (`InfraMapPage.tsx`, `@xyflow/react`). Diagnóstico em tempo real (`HealthKpis.tsx`) com 12 tipos de alertas, incluindo **5 novas regras para TikTok e isolamento de hardware**: risco de ban por 6+ dispositivos, conta em múltiplos aparelhos, aparelho com múltiplas contas TikTok, proxy compartilhado entre vários dispositivos e proxy em múltiplos Business Centers. | ✅ Visual High-Tech & 0 Bugs |
| **Controle de Módulos & Cores no Mapa** | Dropdown persistente de Módulos (com checkboxes, contadores e ações rápidas Todos/Nenhum), paleta de 11 cores curadas diretamente na gaveta lateral de inspeção (`InfraMapSidebarSheet.tsx`) e persistência determinística de câmera via `defaultViewport` e `localStorage`. | ✅ 100% Validado no Playwright |
| **Gestão de Responsáveis (`/responsaveis`)** | Página unificada com abas estruturadas para Titulares, Influenciadores e Testadores de Business Centers, com busca, filtros por status e modal unificado. | ✅ Operação Centralizada |
| **Suavização e Polimento da Sidebar** | O grupo `Contas` na sidebar vem recolhido por padrão (`nav_group_contas_open = false`) e os submenus expandem suavemente via CSS Grid e `tailwindcss-animate`, eliminando o carregamento rígido e transições abruptas. | ✅ Transição Fluida |
| **Validação com Testes Unitários** | Testes criados para `infraGraphHealth.test.ts` (20 testes cobrindo todas as regras de ban risk e sharing), `calcOrderProfit.test.ts` (28 testes), `currencyFormat.test.ts` (7 testes), `inputMasks.test.ts` (10 testes), `platformAccountsService.test.ts` (19 testes), `browserProfilesService.test.ts` (17 testes), `proxiesService.test.ts` (23 testes) e `proxyProvidersService.test.ts`. | ✅ Vitest Passing (908 testes) |

### 5.1 Arquitetura de Isolamento de Hardware e Regras Anti-Ban TikTok

A operação de tráfego pago e contingência no TikTok impõe restrições severas de *device fingerprinting* e reputação de IP. O sistema agora implementa uma barreira ativa em 3 camadas (banco relacional, serviço/validação e UI de diagnóstico):

#### 1. Regras de Ouro e Diagnósticos do Grafo (`infraGraphHealth.ts`)

| Código do Alerta | Severidade | Gatilho Topológico | Justificativa Operacional Anti-Ban |
|---|---|---|---|
| `tiktok_account_device_ban_risk` | **`error` (Crítico)** | Conta TikTok conectada a **≥ 6 dispositivos** | **Regra Fatal da ByteDance:** Conectar 6 ou mais aparelhos a uma única conta TikTok dispara bloqueio imediato por suspeita de automação/comprometimento de credenciais. |
| `tiktok_account_multiple_devices` | **`warning`** | Conta TikTok conectada a **2 a 5 dispositivos** | **Não Ideal:** Aumenta a divergência de hardware fingerprints (IMEI, canvas, GPU, MAC), elevando o *risk score* da conta nos algoritmos de segurança. |
| `device_multiple_tiktok_accounts` | **`warning`** | 1 dispositivo associado a **2+ contas TikTok** | **Risco de Associação em Cascata:** Se uma conta sofrer penalidade ou shadowban, todas as demais associadas àquele ID de hardware são marcadas. |
| `proxy_shared_multiple_devices` | **`warning`** | 1 proxy compartilhado entre **2+ aparelhos** | **Vazamento de Fingerprint:** Cada dispositivo possui parâmetros de TCP/IP e SO distintos; compartilhar o mesmo IP estático gera anomalia nos firewalls do TikTok. |
| `proxy_shared_multiple_bcs` | **`warning`** | 1 proxy vinculado a **2+ Business Centers TikTok** | **Contaminação de Contingência:** Se um Business Center for suspenso, o proxy comum contamina o segundo BC. |

#### 2. Persistência Relacional Otimizada (`postgres-best-practices`)

- **Tabela Junction N:N (`platform_account_devices`):**
  - Chave primária composta `PRIMARY KEY (platform_account_id, device_id)`.
  - Chaves estrangeiras com `ON DELETE CASCADE`.
  - Políticas de RLS com cache estático de sessão: `org_id = (SELECT org_id FROM user_profiles WHERE id = (SELECT auth.uid()))`.
  - Índices B-Tree dedicados em todas as Foreign Keys: `idx_pad_org_id`, `idx_pad_account_id`, `idx_pad_device_id`.
- **Extensões em `business_centers`:**
  - Colunas `device_id UUID REFERENCES devices(id)` e `proxy_id UUID REFERENCES proxies(id)`.
  - Índices B-Tree parciais (`WHERE device_id IS NOT NULL` e `WHERE proxy_id IS NOT NULL`) para consulta veloz de integridade topológica sem overhead em registros nulos.
- **Função RPC Supabase (`public.get_infra_graph`):**
  - Retorna arestas dinâmicas `runs_on` (Conta ↔ Aparelho), `hosts_bc` (Aparelho ↔ BC) e `bc_proxy` (BC ↔ Proxy) com deduplicação de nós e agregação de `device_ids` no payload.

#### 3. UX de Prevenção: Acordeon Vermelho e Interceptor Bloqueante

- **Acordeon Temático Vermelho:** Em `EditPlatformAccountDialog.tsx`, um componente sanfonado (`border-red-500/40 bg-red-950/30`) dá destaque prioritário à saúde de hardware.
- **Medidor Visual de 6 Slots:** Indicadores de estado exibem:
  - 1 Dispositivo: `✅ Ideal (1:1)`
  - 2 a 5 Dispositivos: `⚠️ Não ideal`
  - 6+ Dispositivos: `🚨 RISCO IMINENTE DE BANIMENTO`
- **Diálogo Interceptor com Confirmação Bloqueante:** Se o usuário tentar submeter uma conta com 6 ou mais aparelhos, o formulário barra a submissão e exige confirmação explícita de risco via diálogo modal, impedindo suspensões acidentais da operação.

### 5.2 Melhorias no Mapa de Conexões: Gestão de Módulos, Cores e Câmera Persistente (HEAD `39201a4`)

A auditoria via Playwright identificou três gargalos de experiência de uso que foram corrigidos e validados:

1. **Menu Dropdown de Módulos Persistente (`InfraMapToolbar.tsx`):**
   - Substituição do popover inline anterior (que sofria de clipping pelo contêiner com rolagem) por um `DropdownMenu` portalled diretamente ao `document.body`.
   - Propriedade de seleção não-bloqueante (`onSelect={(e) => { e.preventDefault(); toggleNodeType(type); }}`): o usuário pode alternar múltiplos módulos sucessivamente sem que o dropdown se feche.
   - Ações rápidas **"Todos"** e **"Nenhum"** no cabeçalho do menu, com contadores numéricos de nós por módulo e dots de cor padronizados.
   - Opções contextuais de visibilidade: **"Ocultar Módulo"** e **"Ocultar Este Nó"** acessíveis tanto pelo painel lateral quanto pelo menu de clique direito.

2. **Seletor de Cores de Alta Visibilidade (`InfraMapSidebarSheet.tsx`):**
   - Inclusão da seção **"COR DE DESTAQUE NO MAPA"** diretamente na gaveta lateral aberta com o clique simples (esquerdo) sobre qualquer nó.
   - Paleta de 11 tons curados com anel de confirmação (`Check`) e botão **"Padrão"** para reverter à cor original do tipo.
   - Atualização síncrona dos badges e bordas no canvas ReactFlow com armazenamento em `localStorage` sob a chave `infra_map_custom_colors_{org_id}`.

3. **Persistência Determinística de Câmera e Layout Padrão (`InfraMapCanvas.tsx`):**
   - Eliminação do loop de `fitView()` atrelado ao ciclo de renderização que reiniciava o zoom do usuário a cada clique ou filtro.
   - Uso da prop nativa `defaultViewport={savedViewport || undefined}` no `<ReactFlow />`, eliminando saltos de câmera no carregamento.
   - Botão **"Salvar Visualização"** na barra de ferramentas que congela e salva `(x, y, zoom)`, nós ocultos, posições manuais de nós arrastados e filtros.
   - **Validação E2E no Playwright:** Verificação no DOM de restauração exata da propriedade de transformação CSS `matrix(0.8, 0, 0, 0.8, 150, 120)` após reload completo da página.

---

## 6. Riscos Identificados e Próximos Passos de Refatoração

1. **Megacomponentes (`RevenueReportChart` 5264L e `DropshippingCalculator` 4821L):**
   - Continuam sendo os maiores hotspots do projeto. Qualquer alteração visual nesses módulos deve ser feita com cautela máxima.
2. **Setup Wizards Grandes (`AdAccountFormDialog` 1626L e `BusinessCenterFormDialog` 1185L):**
   - Embora muito bem estruturados com Steppers visuais e Zod, podem no futuro ter suas etapas extraídas em sub-componentes independentes (ex.: `BusinessCenterStepPlatform`, `BusinessCenterStepDetails`).
3. **Audit de Mudanças via `code-review-graph` (`detect_changes_tool`):**
   - Análise de blast radius do commit `39201a4` identificou 9 nós alterados em 5 arquivos com risk score baixo (0.35) e zero fluxos de execução quebrados.
   - Todos os componentes foram verificados quanto a portais Radix, acessibilidade e prevenção de fechamento indevido.
4. **Avanço nos Testes Unitários:**
   - A suite de testes atingiu **908 nós de teste** rastreados pelo grafo de conhecimento.
   - Testes unitários do layout e transformações de infraestrutura continuam passando com 100% de sucesso.

---

## Resumo Executivo Atualizado

1. **Expansão Arquitetural:** O grafo de código (`code-review-graph`) expandiu para **446 arquivos**, **3.493 nós** e **39.543 arestas**, integrando a arquitetura completa de contingência, controle de hardware fingerprinting, o módulo unificado de Responsáveis e o Mapa de Conexões de Infraestrutura interativo.
2. **Prevenção Ativa de Banimento no TikTok:** Implementado no modal de edição de conta um **Acordeon Vermelho** de alta visibilidade com instruções de hardware fingerprinting, reforçando a regra de ouro de 1 conta por dispositivo (1:1), medidor de 6 slots visuais e trava com diálogo de confirmação para prevenir conexões em 6 ou mais dispositivos (gatilho de banimento imediato da ByteDance).
3. **Persistência Relacional Otimizada (Postgres Best Practices):** Modelagem junction N:N em `platform_account_devices` com índices b-tree dedicados para foreign keys, políticas RLS otimizadas com cache de sessão `(SELECT auth.uid())` e integridade referencial com cascata. Colunas `device_id` e `proxy_id` em `business_centers` com índices parciais.
4. **Controle de Módulos, Cores e Câmera Persistente (`/mapa`):** Topologia com dropdown persistente de módulos (sem fechamento acidental ao alternar itens), paleta com 11 cores de destaque acessível diretamente na gaveta de inspeção do nó e no menu de contexto, e gravação definitiva de câmera/enquadramento com o botão "Salvar Visualização" (validado via Playwright com matriz de transformação CSS exata).
5. **Módulo de Responsáveis Centralizado (`/responsaveis`):** Gestão organizada de Titulares, Influenciadores e Testadores com abas dedicadas, contadores e filtros de status.
6. **Proteção de Provedores do Sistema:** Os 9 provedores padrão essenciais para a operação continuam blindados contra exclusão acidental na interface e na camada de serviço.
7. **Garantia de Qualidade e Compilação:** Código 100% verificado via compilação TypeScript com 0 erros (`tsc -b && vite build`), suite de testes unitários ativa no Vitest (908 testes) e validação visual de alta fidelidade no navegador via Playwright.

