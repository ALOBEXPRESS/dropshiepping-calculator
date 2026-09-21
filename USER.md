# USER

## Identidade

- **Nome:** Alyson Lucas _(também atende por Renan ou Jonatan)_
- **Como chamar:** Chefe
- **Função:** Fundador e CEO da Alob Express. Opera quase tudo ainda, enquanto constrói sistemas para se retirar do centro da operação.
- **Perfil técnico:** Forte em design, visão de produto e ferramentas digitais. Precisa de apoio em finanças, marketing e código.

---

## Empresa

- **Nome:** Alob Express
- **Setor:** E-commerce / Social Commerce / Moda e Beleza / Design Gráfico
- **Estágio:** Validação / Tração inicial — produto e canais definidos, buscando consistência de vendas e ROI.

**O que faz:**
Loja de e-commerce especializada em produtos virais que conecta tendências do TikTok a uma jornada de compra rápida, intuitiva e divertida. Faz curadoria de produtos com potencial de trend, vende via marketplaces e produz conteúdo UGC, GRWM e react com IA para impulsionar vendas. O cliente descobre o produto no feed e já comprou antes de pensar duas vezes.

**Nicho:** Social commerce de produtos virais com foco em moda, beleza e lifestyle, distribuídos via TikTok e marketplaces brasileiros.

**Cliente ideal:** Jovem de 18 a 35 anos, antenado em tendências do TikTok e Instagram. Compra por impulso mas exige confiança. Busca produto com estética atual, preço justo e entrega rápida.

### Canais Ativos

| Canal | Uso |
|---|---|
| TikTok Shop | Conteúdo UGC, GRWM, react com IA |
| Shopee | Marketplace |
| Mercado Livre | Marketplace |
| Instagram `@alobexpress` | Marca principal |
| Instagram `@achadinhoexpressrj` | Canal de achados |
| YouTube | Conteúdo de vídeo |

### Foco de Campanha Atual

- Moda e beleza
- Outono
- Copa do Mundo

---

## Sobre Este Projeto (dropshipping-calculator-app)

Aplicação **React 19 + TypeScript + Vite** voltada à operação interna da Alob Express. Não é uma calculadora simples — é o sistema de gestão operacional do negócio.

### Módulos / Rotas

| Rota | Módulo | Descrição |
|---|---|---|
| `/` | Calculadora | Precificação de produtos para marketplaces |
| `/dashboard` | Dashboard | KPIs e métricas de performance |
| `/produtos` | Produtos | Catálogo com margem, reputação e badge por marketplace |
| `/vendas` | Vendas | Histórico e estatísticas de vendas |
| `/leads` | Leads | Gestão de leads e funil |
| `/campanhas` | Campanhas | Gestão de campanhas de tráfego pago |
| `/login` | Auth | Login premium com autenticação via Supabase |

### Stack Técnica

- **Frontend:** React 19, TypeScript, Vite 7, TailwindCSS, Radix UI, Framer Motion, GSAP
- **Backend/DB:** Supabase (PostgreSQL, Auth, Realtime)
- **Gráficos:** Recharts, ApexCharts
- **Forms:** React Hook Form + Zod
- **Estado/Cache:** TanStack Query
- **Testes:** Vitest + Testing Library + Playwright
- **Deploy:** Vercel
- **Integrações:** Bling (ERP/NF-e), Mercado Livre Ads, TikTok Ads, Shopee Ads, Melhor Envio, MercadoPago

### Funcionalidades-Chave da Calculadora

- Precificação para Mercado Livre (com reputação e badge), Shopee, TikTok Shop, Enjoei
- Markup positivo e negativo; sugestão automática de preço por margem
- Análise de preço vs. concorrente (desconto/acréscimo aplicado)
- Integração com Bling — importação de produtos com categorias automáticas para ML
- Afiliados e influenciadores com dedução automática no lucro líquido
- Shopee Ads, Mercado Ads, TikTok Ads configuráveis por produto
- Variações de produto com estoque e preço manual por variação
- Tráfego orgânico com canais persistidos
- Upload e leitura de NF-e (XML)
- Dimensões, peso e unidade de medida por produto
- Suporte a cupons, campanhas e conjuntos de anúncios

### Estrutura de Pastas Relevante

```
src/
├── components/        # UI (DropshippingCalculator, Layout, NavigationBar, etc.)
│   ├── calculator/    # Subcomponentes da calculadora
│   └── ui/            # Componentes base reutilizáveis
├── hooks/             # React hooks (useDropshippingCalculator, useLeads, useCampaigns…)
├── services/          # Lógica de negócio (pricingService, productService, blingOrderService…)
│   └── calculators/   # Módulos de cálculo por marketplace
├── pages/             # Páginas de rota (Dashboard, Sales, Leads, CampaignsPage)
├── contexts/          # Contextos globais (SettingsContext, DateRangeContext)
└── types/             # Tipos TypeScript compartilhados
```

---

## Prioridades dos Próximos 90 Dias

1. Fazer no mínimo **R$ 2.000 de lucro líquido** em vendas
2. Expandir e começar a terceirizar o negócio (sair do centro da operação)
3. Acumular renda suficiente para sair do emprego CLT e planejar saída do Brasil

---

## Frustrações Atuais

1. Investimento alto no negócio sem retorno em vendas até agora
2. Emprego CLT consumindo energia (acorda cedo, transporte, liderança de equipe)
3. Ausência de processo comercial: sem vendas recorrentes, sem previsibilidade

---

## Metas

### 12 Meses

- Faturar **R$ 15.000/mês**
- Ter 10 vendedores trabalhando pelo negócio
- Ter 50 afiliados divulgando os produtos
- Tornar-se afiliado de produtos vencedores na gringa e anunciar para público internacional (ganhar em dólar)
- Ter armazém/galpão com capacidade para 10.000 produtos
- Ter fábrica própria com impressoras 3D produzindo 10 a 50 produtos em massa por mês

### 3 Anos

- Ficar rico com o negócio e terceirizar a operação por completo
- Fechar parcerias estratégicas e ser referência em social commerce
- Ser referência em vídeos feitos por IA
- Reduzir drasticamente custos com IA
- Ganhar em libra com TikTok Shop do Reino Unido
- Se mudar do Brasil
- Casar, ter filhos e dar estrutura sólida para a família

---

## Pontos Fortes

- Design (visual, estética, identidade de marca)
- Gestão de negócios e visão estratégica
- Tecnologia e ferramentas digitais

## Onde Precisa de Apoio

- **Finanças:** controle, fluxo de caixa, margem real, checkout
- **Marketing:** tráfego pago, estratégia de conteúdo, funil, posts, reels, emails
- **Código:** automações, site, integração entre plataformas, técnico

---

## Operação

| Campo | Valor |
|---|---|
| Horário de trabalho | Seg a sáb, 8h às 17h (pode se estender até 22h) |
| Mensagens fora do horário | Sim, para urgências |
| Formato preferido de resposta | **Bullets curtos e diretos, sem enrolação** |

---

## Assuntos que NUNCA Comenta

- Vida íntima e relacionamentos
- Fofoca de mercado ou de pessoas
- Política radicalista