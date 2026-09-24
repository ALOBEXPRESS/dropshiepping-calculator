# 📁 Estrutura da Documentação

**Última Atualização**: 2026-04-26

---

## 🎯 Visão Geral

A documentação foi reorganizada em uma estrutura numerada e hierárquica para facilitar a navegação e manutenção.

```
docs/
├── 01-setup/              # Configuração e infraestrutura
├── 02-integracao/         # Integrações externas
├── 03-features/           # Funcionalidades
├── 04-correcoes/          # Correções e fixes
├── 05-analises/           # Análises técnicas
├── 06-guias/              # Guias e tutoriais
├── arquivados/            # Documentação histórica
├── INDEX.md               # Índice geral
├── NAVEGACAO_RAPIDA.md    # Navegação rápida
├── ORGANIZACAO_COMPLETA.md
└── README.md
```

---

## 📂 Estrutura Detalhada

### 01-setup (Configuração Inicial)
```
01-setup/
├── 001-instalacao-code-review-graph-mcp.md
├── aws-migration/
│   └── 20260417_SETUP_GUIDE.md
├── deploy/
│   ├── 20260317_CHECKLIST_DEPLOY_PRODUCAO.md
│   ├── 20260317_RESUMO_CORRECAO_PRODUCAO.md
│   ├── 20260317_SETUP_SEGURO.md
│   ├── 20260317_VERIFICAR_VARIAVEIS_AMBIENTE_VERCEL.md
│   └── 20260417_DEPLOY.md
└── migrations/
    └── add_affiliate_id_to_orders.sql
```

**Conteúdo**: Configuração inicial, deploy, migrações de banco de dados, setup AWS

---

### 02-integracao (Integrações)
```
02-integracao/
├── bling/                 # 78 arquivos
│   ├── Workflows N8N
│   ├── Correções
│   ├── Implementações
│   └── Guias
└── n8n/                   # 7 arquivos
    ├── Workflows
    └── Integrações
```

**Conteúdo**: Integração com Bling ERP, workflows N8N, automações

---

### 03-features (Funcionalidades)
```
03-features/
├── css-pack/
│   └── 20260317_INDICE_DOCUMENTACAO_CSS_PACK.md
├── especificacoes/        # 5 arquivos
│   ├── Estratégias
│   └── Especificações técnicas
├── features-historico/
│   ├── affiliate-accordion/  # 12 arquivos
│   │   ├── README.md
│   │   ├── TASK_3_COMPLETE.md
│   │   ├── Checklists
│   │   ├── Guias
│   │   └── Queries SQL
│   └── auto-gender-classification.md
├── implementacoes/        # 26 arquivos
│   ├── Sprints
│   ├── Implementações técnicas
│   └── Checklists
├── leads/                 # 1 arquivo
│   └── Implementação marketplace
└── vendas/                # 7 arquivos
    ├── Dashboard
    ├── Processamento
    └── Melhorias visuais
```

**Conteúdo**: Features implementadas, especificações, implementações técnicas

---

### 04-correcoes (Correções)
```
04-correcoes/
└── historico/             # ~120 arquivos
    ├── Correções de bugs
    ├── Melhorias de UX
    ├── Fixes de produção
    ├── Soluções de problemas
    ├── Testes
    └── Debug guides
```

**Conteúdo**: Histórico completo de correções aplicadas no projeto

---

### 05-analises (Análises)
```
05-analises/
└── historico/             # 6 arquivos + ui-ux
    ├── 20260317_ANALISE_FLUXO_ATUAL.md
    ├── 20260317_ANALISE_FRONTEND_BANCO.md
    ├── 20260317_DIAGNOSTICO_LOOP_ITENS.md
    ├── 20260417_dashboard-current-state.md
    ├── 20260417_modal-current-state.md
    ├── 20260417_modal-full-snapshot.md
    └── ui-ux/             # 19 arquivos
        ├── Screenshots
        ├── Análises detalhadas
        ├── Recomendações
        └── Sprints
```

**Conteúdo**: Análises técnicas, diagnósticos, análises de UI/UX

---

### 06-guias (Guias)
```
06-guias/
└── procedimentos/         # 13 arquivos
    ├── Guias de deploy
    ├── Guias de integração
    ├── Guias de validação
    ├── Guias visuais
    └── Instruções de correção
```

**Conteúdo**: Guias práticos, tutoriais, procedimentos passo a passo

---

### arquivados (Histórico)
```
arquivados/
├── dashboard-data-population-summary.md
├── marketplace-filter-implementation-summary.md
├── geral/                 # 5 arquivos
│   ├── READMEs antigos
│   └── Documentação geral
├── indices/               # 2 arquivos
│   └── Índices antigos
├── outros/                # ~35 arquivos
│   ├── Correções diversas
│   ├── Melhorias UX
│   ├── Refatorações
│   └── dados-produtos/
├── resumos/               # ~35 arquivos
│   ├── Resumos de sessões
│   ├── Resumos de implementações
│   └── Resumos de correções
└── testes/                # 1 arquivo
    └── Testes antigos
```

**Conteúdo**: Documentação histórica e obsoleta

---

## 📊 Estatísticas

### Por Categoria
| Categoria | Arquivos | Descrição |
|-----------|----------|-----------|
| 01-setup | ~10 | Configuração e infraestrutura |
| 02-integracao | ~85 | Integrações (principalmente Bling) |
| 03-features | ~50 | Features e implementações |
| 04-correcoes | ~120 | Correções e fixes |
| 05-analises | ~25 | Análises técnicas e UI/UX |
| 06-guias | ~15 | Guias e procedimentos |
| arquivados | ~80 | Documentação histórica |
| **TOTAL** | **~385** | **Todos os arquivos** |

---

## 🎯 Navegação por Perfil

### 👨‍💼 Gestores
1. `03-features/especificacoes/` - Especificações de features
2. `05-analises/historico/ui-ux/` - Análises de interface
3. `03-features/features-historico/affiliate-accordion/20260425_RESUMO_EXECUTIVO.md`

### 👨‍💻 Desenvolvedores
1. `01-setup/` - Setup inicial
2. `02-integracao/` - Integrações
3. `03-features/` - Features
4. `06-guias/procedimentos/` - Guias práticos
5. `04-correcoes/historico/` - Referência de correções

### 🧪 QA/Testes
1. `06-guias/procedimentos/` - Guias de validação
2. `04-correcoes/historico/` - Correções aplicadas
3. `arquivados/testes/` - Testes históricos

### 🎨 Designers
1. `05-analises/historico/ui-ux/` - Análises de interface
2. `03-features/css-pack/` - Catálogo de estilos

---

## 🔍 Como Encontrar Documentação

### Por Tópico

#### Afiliados
- `03-features/features-historico/affiliate-accordion/`
- `01-setup/migrations/add_affiliate_id_to_orders.sql`

#### Bling ERP
- `02-integracao/bling/` (78 arquivos)

#### Dashboard
- `05-analises/historico/` - Análises
- `03-features/vendas/` - Implementações

#### Deploy
- `01-setup/deploy/`
- `01-setup/aws-migration/`

#### UI/UX
- `05-analises/historico/ui-ux/`
- `03-features/css-pack/`

#### Correções
- `04-correcoes/historico/` (120+ arquivos)

---

## 📝 Convenções de Nomenclatura

### Arquivos
- Formato: `YYYYMMDD_DESCRICAO.md`
- Exemplo: `20260417_SETUP_GUIDE.md`

### Pastas
- Numeradas: `01-setup`, `02-integracao`, etc.
- Descritivas: `historico`, `procedimentos`, etc.
- Sem espaços, usar hífen: `ui-ux`, `aws-migration`

---

## 🔄 Manutenção

### Adicionar Nova Documentação

1. **Setup/Configuração** → `01-setup/`
2. **Integração** → `02-integracao/[nome-integracao]/`
3. **Feature Nova** → `03-features/[nome-feature]/`
4. **Correção** → `04-correcoes/historico/`
5. **Análise** → `05-analises/historico/`
6. **Guia** → `06-guias/procedimentos/`

### Arquivar Documentação Obsoleta

Mover para `arquivados/[categoria]/`

---

## 📞 Referências Rápidas

### Documentos Principais
- **Índice Geral**: `INDEX.md`
- **Navegação Rápida**: `NAVEGACAO_RAPIDA.md`
- **Esta Estrutura**: `ESTRUTURA.md`
- **README Principal**: `README.md`

### Features Recentes
- **Accordion de Afiliados**: `03-features/features-historico/affiliate-accordion/README.md`

### Integrações Ativas
- **Bling ERP**: `02-integracao/bling/20260317_README_BLING_INTEGRATION.md`
- **N8N**: `02-integracao/n8n/`

---

**Última Atualização**: 2026-04-26  
**Versão**: 1.0.0  
**Reorganização**: Completa
