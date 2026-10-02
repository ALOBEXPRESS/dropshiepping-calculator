# TAREFA: Criar a view "Mapa de Conexões" no dropshipping-calculator-app

## 0. FERRAMENTAS E SKILLS (OBRIGATÓRIO USAR)

Antes de escrever qualquer código, carregue e siga:

- Skill `frontend-design` — direção estética intencional, tipografia, nada de visual genérico de template
- Skill `react-patterns` — composição, hooks customizados, memoização, evitar re-renders em grafos grandes
- Skill `postgres-best-practices` — índices em FKs, views/RPCs eficientes, RLS, sem N+1
- Skill `database-architect` — validar o modelo relacional e propor ajustes de schema se necessário
- MCP `supabase` — INSPECIONAR o schema real (`list_tables`, colunas, FKs, políticas RLS, índices) antes de assumir qualquer coisa. O schema abaixo já foi inspecionado, mas pode ter evoluído.
- MCP `shadcn-ui` — buscar e instalar componentes (sheet, badge, tooltip, toggle-group, command, popover, scroll-area, separator, skeleton, hover-card etc.) em vez de criar do zero

---

## 1. CONTEXTO DO PROJETO

Stack: React + TypeScript + Vite, Tailwind, shadcn/ui, TanStack Query, Zod, React Router, Supabase multi-tenant (RLS + `organizationId` vindo de `SettingsContext`). Framer-motion e GSAP já presentes.

Padrão atual: `Page (thin)` → `Manager component` → `hook (TanStack Query)` → `service` → `Supabase`. Tipos e schemas Zod em `src/types/`.

### Identidade Visual por Tipo de Nó (seguir exatamente)

| Tipo | Cor / Acento | Componente de Logo Existente |
|------|-------------|------------------------------|
| Proxy Providers | cinza neutro | `ProviderLogo.tsx` em `src/components/ui/` |
| Proxies | laranja `#FF4D00` | ícone escudo + bandeira país |
| Platform Accounts | ciano `#06B6D4` | `PlatformLogos.tsx` em `src/components/ui/` |
| Browser Profiles | ciano suave | badge da ferramenta (AdsPower, Multilogin etc.) |
| Devices | ciano / emerald | `DeviceLogo.tsx` em `src/components/ui/` |
| Business Centers | roxo `#7C3AED` | `PlatformLogos.tsx` |
| Ad Accounts | âmbar `#F59E0B` | `AdAccountStatusBadge.tsx` em `src/components/ad-accounts/` |
| Campaigns | verde `#22C55E` | ícone |
| Titulares | cinza prata | ícone pessoa |

Fonte mono nos IDs, seriais e `advertiser_id`. Tema dark premium (fundo `~#0f1014`).

### Estrutura da Sidebar (Layout.tsx — não quebrar)

A sidebar tem **3 grupos colapsáveis**:
1. **E-Commerce** (`nav_group_ecommerce_open`, default `true`) → Dashboard, Calculadora, Produtos, Leads
2. **Painel** (`nav_group_painel_open`, default `true`) → Vendas, Campanhas, Repasse
3. **Contas** (`nav_group_contas_open`, default **`false`**, recolhido) — subgrupo dentro do Painel, animado via CSS Grid + `tailwindcss-animate`
   - Itens existentes: Proxies (com subitem Provedores + Dispositivos + Perfis de Navegador), Business Centers, Conta, Conta de Anúncio

O novo item **"Mapa de Conexões"** vai **dentro do grupo Contas** (admin-only), após "Conta de Anúncio". A inserção deve respeitar a animação CSS Grid existente (`grid-rows-[0fr]/[1fr]` + `opacity`).

### Rotas existentes do módulo de infra (usar nos botões "Abrir no módulo")

```
/proxies               → ProxiesPage
/provedores            → ProxyProvidersPage
/dispositivos          → DevicesPage
/perfis-navegador      → BrowserProfilesPage
/business-centers      → BusinessCentersPage
/contas                → PlatformAccountsPage
/contas-anuncios       → AdAccountsPage
/contas-anuncios/:id   → AdAccountDetailPage
/campanhas             → CampaignsPage
```

---

## 2. SCHEMA REAL (inspecionado via MCP — confirmar antes de implementar)

### Cadeia de relacionamentos confirmada

```
proxy_providers ──1:N──► proxies (via proxies.provider_id)
proxies ──1:N──► platform_accounts (via platform_accounts.proxy_id)
proxies ──1:N──► devices (via devices.proxy_id)
platform_accounts ──1:N──► browser_profiles (via browser_profiles.platform_account_id)
platform_accounts ──N:1──► devices (via platform_accounts.device_id)
platform_accounts ──N:1──► titulares (via platform_accounts.titular_id)
platform_accounts ──N:1──► operadores (via platform_accounts.operador_id)
ad_accounts ──N:1──► business_centers (via ad_accounts.bc_entity_id)
ad_accounts ──N:1──► platform_accounts (via ad_accounts.platform_account_id — TikTok)
ad_accounts ──N:1──► platform_accounts (via ad_accounts.meta_instagram_account_id — Meta IG)
ad_accounts ──N:1──► platform_accounts (via ad_accounts.meta_facebook_account_id — Meta FB)
ad_accounts ──N:1──► titulares (via ad_accounts.titular_id)
business_centers ──N:1──► platform_accounts (via bc.meta_linked_account_id)
business_centers ──N:1──► platform_accounts (via bc.meta_instagram_account_id)
business_centers ──N:1──► platform_accounts (via bc.meta_facebook_account_id)
business_centers ──N:1──► titulares (via bc.titular_id)
campaigns ──N:1──► ad_accounts (via campaigns.ad_account_id, composite FK com organization_id)
```

### Colunas-chave por tabela

**proxies**: `id, organization_id, label, protocol, host, port, country, proxy_type (static_residential_isp|static_datacenter|static_mobile|rotating_mobile|rotating_residential), status (active|expired|banned|inactive), expires_at, provider_id, ip_version`
> ⚠️ `username` e `password` **NUNCA** aparecem no payload nem na UI. Exibir apenas `host:port` mascarado (ex: `***.***.*.**:3128`).

**proxy_providers**: `id, organization_id, name, website, notes`

**platform_accounts**: `id, organization_id, platform (tiktok|meta|google), country, name, holder_name, nickname, niche, signup_method, proxy_id, device_id, titular_id, operador_id, meta_account_type (instagram|facebook|threads)`

**browser_profiles**: `id, organization_id, platform_account_id, tool (adspower|multilogin|gologin|other), external_profile_id, name, status (active|archived)`
> Proxy derivado de `platform_accounts.proxy_id` — não há `proxy_id` direto em `browser_profiles`.

**devices**: `id, organization_id, device_type (emulator|cloud_phone|pc_windows|mobile), platform, label, proxy_id, operador_id, platform_metadata (jsonb)`

**business_centers**: `id, organization_id, platform (tiktok|meta|google), bc_id, name, business_type, country, meta_linked_account_id, meta_instagram_account_id, meta_facebook_account_id, titular_id`

**ad_accounts**: `id, organization_id, platform (tiktok|meta|google), name, advertiser_id, bc_entity_id, status (active|paused|disabled|archived), country, currency, billing_type, payment_status, platform_account_id, meta_instagram_account_id, meta_facebook_account_id, titular_id`
> `business_center_id` (TEXT) é campo legado — usar apenas `bc_entity_id` (UUID FK) para joins.

**campaigns**: `id, organization_id, marketplace, name, objective, budget_type, budget_amount, status, ad_account_id`

**titulares**: `id, organization_id, full_name, document_type, document_number`
> Exibir `full_name` e `document_type` apenas. `document_number` mascarado: `CPF ***.***.***-**`.

**operadores**: `id, organization_id, full_name, phone, role_title`

### Lacunas conhecidas

1. `browser_profiles` sem `proxy_id` direto — derivado via `platform_accounts.proxy_id`
2. `ad_accounts.business_center_id` (TEXT legado) coexiste com `bc_entity_id` (UUID FK real) — usar só `bc_entity_id`
3. `devices.proxy_id` independente: um device pode ter proxy diferente do proxy da conta vinculada
4. Composite FK em `campaigns`: `(ad_account_id, organization_id)` → `ad_accounts(id, organization_id)`

---

## 3. OBJETIVO

Nova página admin em `/mapa` (alias `/contas/mapa`) com item "Mapa de Conexões" dentro do grupo **Contas** da sidebar.

A página exibe mind map interativo da cadeia completa da infraestrutura de tráfego pago:

```
Proxy Provider → Proxy → Platform Account → Browser Profile / Device → Business Center → Ad Account → Campaigns
                                          ↘ Titular
```

Perguntas respondidas em 2 segundos:
- Qual proxy pertence a qual conta? E de qual provedor?
- Em que país está o proxy e em que país está a conta? (alerta de divergência)
- Qual titular é responsável por cada entidade?
- A conta está ligada a qual Business Center e a quais Ad Accounts?
- Qual perfil AdsPower ou device roda cada conta?
- O que está órfão, inconsistente ou com proxy expirado ativo?

---

## 4. FASE 1: DESCOBERTA (não codar ainda — PARE e aguarde aprovação)

1. Ler os services existentes: `proxiesService.ts`, `proxyProvidersService.ts`, `platformAccountsService.ts`, `browserProfilesService.ts`, `devicesService.ts`, `businessCentersService.ts`, `adAccountsService.ts` — e os tipos correspondentes em `src/types/`.

2. Ler `Layout.tsx` — entender exatamente onde e como inserir o item "Mapa de Conexões" no grupo Contas sem quebrar a animação CSS Grid existente.

3. Via MCP `supabase`: confirmar índices nas FKs críticas do grafo:
   - `proxies.provider_id`
   - `platform_accounts.proxy_id`
   - `platform_accounts.device_id`
   - `browser_profiles.platform_account_id`
   - `ad_accounts.bc_entity_id`
   - `campaigns.ad_account_id`

4. Entregar resumo: diagrama de relações confirmado, índices faltantes + proposta de migration (só aplicar após aprovação).

**PARE e aguarde aprovação antes de prosseguir.**

---

## 5. FASE 2: DADOS (aguardar Fase 1)

Criar RPC `get_infra_graph(p_organization_id uuid)` — uma fonte única, sem N+1.

```typescript
interface InfraGraphResponse {
  nodes: Array<{
    id: string;
    type: 'proxy_provider' | 'proxy' | 'platform_account' | 'browser_profile'
        | 'device' | 'business_center' | 'ad_account' | 'campaign' | 'titular';
    label: string;
    sublabel?: string;
    country?: string;
    status?: string;
    meta: Record<string, unknown>; // sem credenciais
  }>;
  edges: Array<{
    source: string;
    target: string;
    relation: string;
  }>;
}
```

Regras:
- `security_invoker = true` (respeitar RLS)
- Nunca expor: `proxies.username`, `proxies.password`, `titulares.document_number` completo
- Mascarar `host`: `***.***.*.**:3128`
- Migrations versionadas e reversíveis

Arquivos a criar:
- `src/hooks/useInfraGraph.ts` — TanStack Query, `staleTime: 5min`, `queryKey: ['infra-graph', organizationId]`
- `src/services/infraGraphService.ts`
- `src/types/infraGraph.ts` — tipos + schemas Zod

**PARE e aguarde aprovação antes de prosseguir.**

---

## 6. FASE 3: UI DO MIND MAP

Biblioteca: `@xyflow/react` (React Flow) + `elkjs` ou `dagre` para layout automático.

### Nós — um `React.memo` por tipo, reutilizando componentes existentes

| Componente | Reutiliza |
|-----------|-----------|
| `ProxyProviderNode` | `ProviderLogo` (`src/components/ui/ProviderLogo.tsx`) |
| `ProxyNode` | bandeira país, badge tipo/status |
| `PlatformAccountNode` | `PlatformLogos` (`src/components/ui/PlatformLogos.tsx`) |
| `BrowserProfileNode` | badge da ferramenta |
| `DeviceNode` | `DeviceLogo` (`src/components/ui/DeviceLogo.tsx`) |
| `BusinessCenterNode` | `PlatformLogos` |
| `AdAccountNode` | `AdAccountStatusBadge` (`src/components/ad-accounts/AdAccountStatusBadge.tsx`) |
| `CampaignNode` | colapsado por padrão — mostra contagem; expande ao clicar |
| `TitularNode` | ícone pessoa, `full_name`, `document_type` mascarado |

### Arestas
- Bezier suaves, cor por tipo de relação
- Animação de fluxo apenas nas arestas do nó em foco
- Tracejadas em vermelho para inconsistências (divergência de país, proxy compartilhado, expirado)

### Interações obrigatórias

1. **Modos de agrupamento** (toggle): Por Provedor | Por Plataforma | Por Business Center | Por Titular
2. **Modo Foco**: clicar num nó destaca cadeia completa (upstream + downstream), esmaece o resto, `fitView` animado
3. **Busca global** (shadcn Command): nome, serial, `advertiser_id`, host → centraliza no nó
4. **Filtros**: plataforma, país, status, proxy_type, business center — chips removíveis
5. **Expandir/colapsar** ramos de Campaign (clique no contador do nó AdAccount)
6. **Sheet lateral** (shadcn Sheet): detalhes completos + botão "Abrir no módulo" → rotas existentes
7. **HoverCard** com resumo rápido
8. **MiniMap**, Controls de zoom, "Reorganizar layout", "Exportar PNG"
9. **Legenda** fixa das cores e tipos
10. Atalhos: `/` abre busca, `Esc` limpa foco

---

## 7. PAINEL DE SAÚDE

KPIs no topo estilo `KPICard.tsx` (mesmo componente do Dashboard), alertas clicáveis que focam os nós envolvidos:

| Alerta | Regra |
|--------|-------|
| Proxies sem conta | `proxies` sem nenhum `platform_accounts.proxy_id` apontando |
| Contas sem proxy | `platform_accounts.proxy_id IS NULL` |
| Browser profiles sem conta | `browser_profiles.platform_account_id IS NULL` |
| Divergência de país | `proxies.country ≠ platform_accounts.country` → aresta tracejada vermelha + ⚠️ |
| Proxy compartilhado | mesmo `proxy_id` em 2+ `platform_accounts` com `proxy_type` dedicado |
| Ad Account sem Business Center | `ad_accounts.bc_entity_id IS NULL` |
| Proxy expirado ativo | `status = 'active' AND expires_at < now()` |

Funções puras e testáveis em `src/utils/infraGraphHealth.ts` + `src/utils/infraGraphHealth.test.ts` (Vitest).

---

## 8. ARQUITETURA DE ARQUIVOS

```
src/pages/InfraMapPage.tsx                          (thin wrapper)
src/components/infra-map/
  InfraMapCanvas.tsx
  InfraMapToolbar.tsx                               (busca, filtros, modos)
  InfraMapSidebarSheet.tsx
  InfraMapLegend.tsx
  HealthKpis.tsx
  nodes/
    ProxyProviderNode.tsx
    ProxyNode.tsx
    PlatformAccountNode.tsx
    BrowserProfileNode.tsx
    DeviceNode.tsx
    BusinessCenterNode.tsx
    AdAccountNode.tsx
    CampaignNode.tsx
    TitularNode.tsx
src/hooks/useInfraGraph.ts
src/hooks/useInfraMapLayout.ts
src/services/infraGraphService.ts
src/types/infraGraph.ts
src/utils/infraGraphHealth.ts
src/utils/infraGraphHealth.test.ts
```

Nenhum arquivo acima de ~400 linhas. Lógica fora dos componentes, componentes pequenos e compostos.

---

## 9. REGRAS E RESTRIÇÕES

- **NÃO** modificar: `RevenueReportChart.tsx`, `DropshippingCalculator.tsx`, `EditProductDialog.tsx`, `ProductCard.tsx`
- `Layout.tsx`: inserir apenas o novo item no grupo Contas, respeitando o padrão CSS Grid existente (`grid-rows-[0fr]/[1fr]` + `opacity`)
- `App.tsx`: adicionar apenas rota `/mapa` + alias `/contas/mapa`, protegidas por `ProtectedRoute + AdminRoute + Layout`
- **Somente leitura**: o mapa não edita dados — ações de edição ficam nos módulos existentes via "Abrir no módulo"
- Performance: `React.memo`, `onlyRenderVisibleElements`, nós colapsados por padrão, layout calculado fora da thread de render
- Acessibilidade: navegação por teclado, `aria-labels`, contraste AA dark, `prefers-reduced-motion`
- Responsivo: mobile → fallback lista/árvore expansível (shadcn Collapsible) com os mesmos dados
- Estados de loading (Skeleton), vazio (CTA para cadastrar proxy/conta) e erro (padrão `DashboardErrorState`)
- TypeScript sem `any`, 0 erros `tsc`, lint limpo
- Testes Vitest para service, health utils e transformação do grafo

---

## 10. CRITÉRIOS DE ACEITE

1. Clicar em qualquer proxy mostra: provedor, país, conta de plataforma, perfil AdsPower/device, Business Center, ad account, titular
2. Trocar modo de agrupamento reorganiza o mapa com animação suave
3. Alertas de saúde apontam corretamente casos órfãos e divergências de país
4. `proxies.username`, `proxies.password` e `titulares.document_number` completo **nunca aparecem** no payload nem na UI
5. `tsc` e `vitest` passam; rota só abre para admin
6. Item "Mapa de Conexões" aparece no grupo Contas da sidebar **sem quebrar** a animação CSS Grid existente
7. Botões "Abrir no módulo" navegam corretamente para as rotas existentes do módulo de infra
