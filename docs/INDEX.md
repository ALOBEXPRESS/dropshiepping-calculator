# 📚 Índice Geral da Documentação

**Última Atualização**: 2026-04-26

---

## 🗂️ Nova Estrutura Organizada

A documentação foi reorganizada em uma estrutura numerada e lógica para facilitar a navegação:

### 📁 01-setup
**Configuração inicial e infraestrutura**

- `aws-migration/` - Migração e configuração AWS
- `deploy/` - Guias e procedimentos de deploy
- `migrations/` - Scripts de migração do banco de dados
- `001-instalacao-code-review-graph-mcp.md` - Instalação do MCP

### 📁 02-integracao
**Integrações com sistemas externos**

- `bling/` - Integração completa com Bling ERP (78 arquivos)
  - Workflows N8N
  - Correções e melhorias
  - Guias de implementação
- `n8n/` - Workflows e automações N8N

### 📁 03-features
**Funcionalidades e implementações**

- `leads/` - Sistema de leads
- `vendas/` - Módulo de vendas
- `css-pack/` - Catálogo de estilos e componentes CSS
- `especificacoes/` - Especificações técnicas e requisitos
- `implementacoes/` - Documentação de implementações técnicas
- `features-historico/` - Histórico de features antigas
  - `affiliate-accordion/` - Accordion de afiliados ✅

### 📁 04-correcoes
**Correções e fixes aplicados**

- `historico/` - Histórico completo de correções (~120 arquivos)
  - Correções de bugs
  - Melhorias de UX
  - Fixes de produção

### 📁 05-analises
**Análises técnicas e diagnósticos**

- `historico/` - Análises de fluxo de dados e diagnósticos
  - `ui-ux/` - Análises de interface e experiência do usuário
  - Diagnósticos de problemas
  - Análises de performance

### 📁 06-guias
**Guias de uso e tutoriais**

- `procedimentos/` - Guias práticos e procedimentos
  - Guias de integração
  - Guias de validação
  - Instruções de correção

### 📁 arquivados
**Documentação histórica e obsoleta**

- `resumos/` - Resumos executivos antigos
- `indices/` - Índices antigos
- `geral/` - Documentação geral arquivada
- `outros/` - Documentação diversa
- `testes/` - Testes antigos
- Arquivos de implementação obsoletos

---

## 📄 Arquivos na Raiz

- **[README.md](./README.md)** - README principal do projeto
- **[INDEX.md](./INDEX.md)** - Este arquivo (índice geral)
- **[NAVEGACAO_RAPIDA.md](./NAVEGACAO_RAPIDA.md)** - Guia de navegação rápida
- **[ORGANIZACAO_COMPLETA.md](./ORGANIZACAO_COMPLETA.md)** - Documentação da organização

---

## 🎯 Documentação por Categoria

### 🚀 Começando

#### Para Novos Desenvolvedores
1. **Setup Inicial**: `01-setup/001-instalacao-code-review-graph-mcp.md`
2. **Deploy**: `01-setup/deploy/`
3. **Migrações**: `01-setup/migrations/`

#### Para Integrações
1. **Bling ERP**: `02-integracao/bling/`
2. **N8N Workflows**: `02-integracao/n8n/`

---

### 🆕 Funcionalidades Principais

#### Accordion de Afiliados
**Status**: ✅ Implementado (2026-04-25)  
**Localização**: `03-features/features-historico/affiliate-accordion/`

Permite associar pedidos a influenciadores/afiliados, criar novos influenciadores inline, e rastrear vendas por afiliado.

**Quick Start**:
1. Leia: `03-features/features-historico/affiliate-accordion/20260425_CHECKLIST_FINAL.md`
2. Execute: `01-setup/migrations/add_affiliate_id_to_orders.sql`
3. Use: `03-features/features-historico/affiliate-accordion/20260425_GUIA_VISUAL_AFILIADOS.md`

#### Sistema de Leads
**Localização**: `03-features/leads/`

#### Módulo de Vendas
**Localização**: `03-features/vendas/`

---

### 🔗 Integrações

#### Bling ERP
**Localização**: `02-integracao/bling/`  
**Status**: ✅ Ativo  
**Arquivos**: 78 documentos

Integração completa com Bling ERP para sincronização de pedidos, produtos e estoque.

#### N8N Workflows
**Localização**: `02-integracao/n8n/`

Automações e workflows de integração.

---

### 🎨 UI/UX

#### Análises de Interface
**Localização**: `05-analises/historico/ui-ux/`

Análises detalhadas de interface e experiência do usuário com screenshots e recomendações.

#### CSS Pack
**Localização**: `03-features/css-pack/`

Catálogo completo de estilos e componentes CSS.

---

### 🗄️ Banco de Dados

#### Migrações
**Localização**: `01-setup/migrations/`

Scripts SQL para evolução do schema do banco de dados.

**Última migração**: `add_affiliate_id_to_orders.sql` (2026-04-25)

---

### 🔧 Correções e Manutenção

#### Histórico de Correções
**Localização**: `04-correcoes/historico/`

Mais de 120 documentos de correções aplicadas, incluindo:
- Correções de bugs
- Melhorias de UX
- Fixes de produção
- Soluções de problemas

---

## 🔍 Busca Rápida por Tópico

### Afiliados
- `03-features/features-historico/affiliate-accordion/` - Documentação completa
- `01-setup/migrations/add_affiliate_id_to_orders.sql` - Migração

### Bling
- `02-integracao/bling/` - Integração Bling ERP (78 arquivos)

### Dashboard
- `05-analises/historico/` - Análises de dados
- `arquivados/dashboard-data-population-summary.md`

### Deploy
- `01-setup/deploy/` - Guias de deploy
- `01-setup/aws-migration/` - Migração AWS

### UI/UX
- `05-analises/historico/ui-ux/` - Análises de interface
- `03-features/css-pack/` - Catálogo de estilos

### Vendas
- `03-features/vendas/` - Módulo de vendas
- `03-features/features-historico/affiliate-accordion/` - Afiliados

### Correções
- `04-correcoes/historico/` - Histórico completo de correções

### Guias
- `06-guias/procedimentos/` - Guias práticos e procedimentos

---

## 📊 Estatísticas

### Por Categoria
- **01-setup**: ~5 arquivos + migrações
- **02-integracao**: ~80 arquivos (principalmente Bling)
- **03-features**: ~30 arquivos
- **04-correcoes**: ~120 arquivos
- **05-analises**: ~20 arquivos
- **06-guias**: ~15 arquivos
- **arquivados**: ~50 arquivos

### Total
- **Pastas principais**: 7 (6 numeradas + arquivados)
- **Arquivos**: ~320
- **Última reorganização**: 2026-04-26

---

## 🎯 Navegação Recomendada

### Por Perfil

#### 👨‍💼 Gestores
1. `03-features/features-historico/affiliate-accordion/20260425_RESUMO_EXECUTIVO.md`
2. `05-analises/historico/ui-ux/`
3. `03-features/especificacoes/`

#### 👨‍💻 Desenvolvedores
1. `01-setup/` - Configuração inicial
2. `02-integracao/` - Integrações
3. `03-features/` - Features e implementações
4. `06-guias/procedimentos/` - Guias práticos

#### 🧪 QA/Testes
1. `arquivados/testes/` - Testes históricos
2. `04-correcoes/historico/` - Correções aplicadas
3. `06-guias/procedimentos/` - Guias de validação

#### 🎨 Designers
1. `05-analises/historico/ui-ux/` - Análises de interface
2. `03-features/css-pack/` - Catálogo de estilos

---

## 📞 Suporte e Documentação Adicional

### Documentação por Tipo

#### Instalação e Setup
- `01-setup/001-instalacao-code-review-graph-mcp.md`
- `01-setup/deploy/`
- `01-setup/aws-migration/`

#### Integrações
- `02-integracao/bling/` - Bling ERP
- `02-integracao/n8n/` - N8N Workflows

#### Desenvolvimento
- `03-features/` - Features
- `06-guias/procedimentos/` - Guias práticos

#### Troubleshooting
- `04-correcoes/historico/` - Correções aplicadas
- `05-analises/historico/` - Análises e diagnósticos

---

## 🔄 Histórico de Mudanças

### 2026-04-26
- ✅ Reorganização completa da estrutura de pastas
- ✅ Criação de estrutura numerada (01-06)
- ✅ Consolidação de documentação arquivada
- ✅ Atualização do INDEX.md

### 2026-04-25
- ✅ Implementação do Accordion de Afiliados
- ✅ Migração do banco de dados para afiliados

---

**Última Atualização**: 2026-04-26  
**Versão do Índice**: 2.0.0  
**Estrutura**: Reorganizada e numerada
