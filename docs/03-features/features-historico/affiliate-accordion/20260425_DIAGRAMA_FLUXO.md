# Diagrama de Fluxo - Accordion de Afiliados

## 🎯 Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD DE VENDAS                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Gráfico de Relatório de Receitas             │  │
│  │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐                          │  │
│  │  │  │ │  │ │  │ │  │ │  │  ← Usuário clica aqui   │  │
│  │  │  │ │  │ │  │ │  │ │  │                          │  │
│  │  └──┘ └──┘ └──┘ └──┘ └──┘                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    Dialog abre
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              DIALOG DE DETALHES DO PEDIDO                   │
│                                                             │
│  📦 Pedido #12345                                          │
│  Cliente: João Silva                                        │
│  Marketplace: Shopee                                        │
│  Valor: R$ 150,00                                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 💰 Preço de venda          R$ 150,00               │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 📦 Custo do Produto       -R$ 80,00                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 🛒 Custo Marketplace      -R$ 30,00                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 👥 AFILIADOS ▼            ← NOVO ACCORDION         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 💵 Lucro Real: R$ 40,00                            │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Dados Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE ASSOCIAÇÃO                      │
└─────────────────────────────────────────────────────────────┘

1. USUÁRIO CLICA NO ACCORDION
   ↓
2. COMPONENTE CARREGA INFLUENCIADORES
   ↓
   ┌─────────────────────────────────────┐
   │  SELECT * FROM influencers          │
   │  WHERE organization_id = ?          │
   │  AND is_active = true               │
   └─────────────────────────────────────┘
   ↓
3. LISTA É EXIBIDA NO DROPDOWN
   ↓
4. USUÁRIO SELECIONA OU CRIA NOVO
   ↓
   ┌──────────────┬──────────────────────┐
   │ SELECIONAR   │  CRIAR NOVO          │
   └──────────────┴──────────────────────┘
         ↓                    ↓
         │                    │
         │         ┌──────────────────────┐
         │         │ INSERT INTO          │
         │         │ influencers          │
         │         │ VALUES (...)         │
         │         └──────────────────────┘
         │                    ↓
         │         ┌──────────────────────┐
         │         │ INSERT INTO          │
         │         │ influencer_          │
         │         │ marketplaces         │
         │         └──────────────────────┘
         │                    ↓
         └────────────┬───────┘
                      ↓
         ┌──────────────────────┐
         │ UPDATE orders        │
         │ SET affiliate_id = ? │
         │ WHERE id = ?         │
         └──────────────────────┘
                      ↓
         ┌──────────────────────┐
         │ Toast de Sucesso     │
         │ ✅ Afiliado          │
         │    associado!        │
         └──────────────────────┘
                      ↓
         ┌──────────────────────┐
         │ Callback             │
         │ onAffiliateChange()  │
         └──────────────────────┘
                      ↓
         ┌──────────────────────┐
         │ Estado Local         │
         │ Atualizado           │
         └──────────────────────┘
```

## 🗄️ Estrutura do Banco de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    TABELAS RELACIONADAS                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│      ORDERS          │
├──────────────────────┤
│ id (PK)              │
│ organization_id      │
│ order_number         │
│ customer_name        │
│ total_amount         │
│ total_profit         │
│ is_free_sample       │
│ affiliate_id (FK) ←──┼─────┐
│ marketplace_id (FK)  │     │
│ ...                  │     │
└──────────────────────┘     │
                             │
                             │
┌──────────────────────┐     │
│   INFLUENCERS        │     │
├──────────────────────┤     │
│ id (PK) ─────────────┼─────┘
│ organization_id      │
│ name                 │
│ instagram            │
│ tiktok               │
│ twitter              │
│ percentage           │
│ is_active            │
└──────────────────────┘
         │
         │ 1:N
         │
         ↓
┌──────────────────────┐
│ INFLUENCER_          │
│ MARKETPLACES         │
├──────────────────────┤
│ influencer_id (FK)   │
│ marketplace_id (FK)  │
└──────────────────────┘
         │
         │ N:1
         │
         ↓
┌──────────────────────┐
│   MARKETPLACES       │
├──────────────────────┤
│ id (PK)              │
│ name                 │
│ commission_rate      │
│ fixed_fee            │
│ ...                  │
└──────────────────────┘
```

## 🎨 Componentes React

```
┌─────────────────────────────────────────────────────────────┐
│              HIERARQUIA DE COMPONENTES                      │
└─────────────────────────────────────────────────────────────┘

RevenueReportChart
│
├── Chart (ApexCharts)
│   └── onClick → abre Dialog
│
└── Dialog (shadcn/ui)
    │
    ├── DialogContent
    │   │
    │   ├── Header (Pedido, Cliente, Marketplace)
    │   │
    │   ├── Accordion: Preço de venda
    │   │
    │   ├── Accordion: Custo do Produto
    │   │
    │   ├── Accordion: Custo Marketplace
    │   │
    │   ├── 🆕 AffiliateAccordion ← NOVO
    │   │   │
    │   │   ├── Header (clicável)
    │   │   │   ├── Users Icon
    │   │   │   ├── "AFILIADOS"
    │   │   │   ├── Nome atual (se houver)
    │   │   │   └── ChevronDown/Up
    │   │   │
    │   │   └── Content (quando expandido)
    │   │       │
    │   │       ├── Loading State
    │   │       │   └── Loader2 (spinner)
    │   │       │
    │   │       ├── Seletor Mode
    │   │       │   ├── Label + Botão "Novo"
    │   │       │   └── Select (shadcn/ui)
    │   │       │       ├── "Sem influenciador"
    │   │       │       └── Lista de influenciadores
    │   │       │
    │   │       └── Formulário Mode
    │   │           ├── Header + Botão "X"
    │   │           ├── Input: Nome *
    │   │           ├── Grid 3 cols:
    │   │           │   ├── Input: Instagram
    │   │           │   ├── Input: TikTok
    │   │           │   └── Input: Twitter
    │   │           ├── Input: Comissão % *
    │   │           ├── Mensagem de erro
    │   │           └── Button: Salvar e Associar
    │   │
    │   └── Lucro Real (seção final)
    │
    └── AlertDialog (confirmação de exclusão)
```

## 🔀 Estados do Componente

```
┌─────────────────────────────────────────────────────────────┐
│                  MÁQUINA DE ESTADOS                         │
└─────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │   FECHADO   │
                    └─────────────┘
                          │
                    Usuário clica
                          │
                          ↓
                    ┌─────────────┐
                    │ CARREGANDO  │
                    │   (spinner) │
                    └─────────────┘
                          │
                   Dados carregados
                          │
                          ↓
                    ┌─────────────┐
                    │   SELETOR   │ ←──────────┐
                    │   (aberto)  │            │
                    └─────────────┘            │
                          │                    │
                    ┌─────┴─────┐             │
                    │           │             │
            Clica "Novo"   Seleciona    Cancela
                    │        afiliado         │
                    ↓           │              │
            ┌─────────────┐    │              │
            │ FORMULÁRIO  │    │              │
            │   (criar)   │    │              │
            └─────────────┘    │              │
                    │           │              │
              Salva com    Salva seleção       │
               sucesso          │              │
                    │           │              │
                    └─────┬─────┘              │
                          │                    │
                          ↓                    │
                    ┌─────────────┐            │
                    │   SUCESSO   │            │
                    │   (toast)   │            │
                    └─────────────┘            │
                          │                    │
                          └────────────────────┘
```

## 📊 Fluxo de Análise de Dados

```
┌─────────────────────────────────────────────────────────────┐
│              PIPELINE DE ANÁLISE DE DADOS                   │
└─────────────────────────────────────────────────────────────┘

1. COLETA DE DADOS
   │
   ├── orders (pedidos)
   ├── influencers (afiliados)
   └── influencer_marketplaces (vínculos)
   │
   ↓
2. AGREGAÇÃO
   │
   ├── Total de vendas por afiliado
   ├── Comissões calculadas
   ├── ROI de amostras grátis
   └── Taxa de conversão
   │
   ↓
3. VISUALIZAÇÃO
   │
   ├── Relatórios SQL
   ├── Dashboards (futuro)
   └── Exportação para afiliados
   │
   ↓
4. AÇÃO
   │
   ├── Pagamento de comissões
   ├── Ajuste de taxas
   ├── Recrutamento de novos afiliados
   └── Otimização de campanhas
```

## 🔐 Fluxo de Segurança

```
┌─────────────────────────────────────────────────────────────┐
│                  CAMADAS DE SEGURANÇA                       │
└─────────────────────────────────────────────────────────────┘

1. FRONTEND (React)
   │
   ├── Validação de formulário
   │   ├── Nome obrigatório
   │   ├── Comissão 0-100
   │   └── Formato de redes sociais
   │
   └── Tratamento de erros
       ├── Try/catch
       ├── Mensagens amigáveis
       └── Feedback visual (toast)
   │
   ↓
2. SUPABASE CLIENT
   │
   ├── Autenticação JWT
   ├── Session management
   └── RPC calls
   │
   ↓
3. SUPABASE SERVER
   │
   ├── Row Level Security (RLS)
   │   ├── Filtro por organization_id
   │   ├── Permissões de leitura
   │   └── Permissões de escrita
   │
   ├── Foreign Keys
   │   ├── affiliate_id → influencers.id
   │   ├── marketplace_id → marketplaces.id
   │   └── organization_id → organizations.id
   │
   └── Constraints
       ├── NOT NULL em campos obrigatórios
       ├── CHECK em percentuais (0-100)
       └── UNIQUE em combinações
   │
   ↓
4. POSTGRESQL
   │
   ├── Transações ACID
   ├── Índices para performance
   └── Backup automático
```

## 🚀 Fluxo de Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                    PROCESSO DE DEPLOY                       │
└─────────────────────────────────────────────────────────────┘

1. DESENVOLVIMENTO
   │
   ├── Criar componente AffiliateAccordion
   ├── Integrar no RevenueReportChart
   ├── Testar localmente
   └── Documentar
   │
   ↓
2. MIGRAÇÃO DO BANCO
   │
   ├── Criar script SQL
   ├── Testar em ambiente de dev
   ├── Revisar mudanças
   └── Executar em produção
   │
   ↓
3. DEPLOY DO CÓDIGO
   │
   ├── Build do projeto
   ├── Testes automatizados
   ├── Deploy para staging
   └── Deploy para produção
   │
   ↓
4. VALIDAÇÃO
   │
   ├── Smoke tests
   ├── Testes de integração
   ├── Verificação de logs
   └── Monitoramento
   │
   ↓
5. TREINAMENTO
   │
   ├── Documentação para usuários
   ├── Guias visuais
   ├── Exemplos práticos
   └── Suporte inicial
```

## 📈 Métricas de Sucesso

```
┌─────────────────────────────────────────────────────────────┐
│                    KPIs DO SISTEMA                          │
└─────────────────────────────────────────────────────────────┘

ADOÇÃO
├── % de pedidos com afiliado associado
├── Número de afiliados ativos
└── Frequência de uso do accordion

PERFORMANCE
├── Tempo de carregamento do accordion
├── Tempo de resposta das queries
└── Taxa de erro nas operações

NEGÓCIO
├── Total de comissões pagas
├── ROI de amostras grátis
├── Vendas geradas por afiliados
└── Ticket médio por afiliado

QUALIDADE
├── Taxa de erro zero
├── Validações funcionando
└── Feedback positivo dos usuários
```

---

**Legenda**:
- `→` Fluxo de dados
- `↓` Sequência de passos
- `├──` Ramificação
- `└──` Fim de ramificação
- `(PK)` Primary Key
- `(FK)` Foreign Key
- `*` Campo obrigatório
