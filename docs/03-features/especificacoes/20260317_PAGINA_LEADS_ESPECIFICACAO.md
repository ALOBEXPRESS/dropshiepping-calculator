# Especificação da Página de Leads

**Data**: 28 de Fevereiro de 2026  
**Status**: 📋 Em Planejamento

## Objetivo

Criar uma página dedicada para gerenciamento e visualização de leads (contatos/clientes potenciais), com dashboard analítico inspirado em CRM moderno, suportando modo claro e escuro.

## Referências de Design

### Inspiração Visual
- Dashboard CRM moderno com métricas de pipeline
- Segmentação de clientes por tipo (Mid Market, Small Business, Individual)
- Gráficos de crescimento e tendências
- Tabela de canais de aquisição com performance
- Visualização de leads por status (New, Contacted, Qualified, Inactive, Nego)

### Paleta de Cores

#### Modo Claro
- Background: `#FFFFFF`, `#F9FAFB`
- Texto: `#111827`, `#6B7280`
- Cards: `#FFFFFF` com sombra suave
- Accent: `#3B82F6` (azul), `#F59E0B` (laranja), `#EF4444` (vermelho)

#### Modo Escuro
- Background: `#1F2937`, `#111827`
- Texto: `#F9FAFB`, `#9CA3AF`
- Cards: `#374151` com borda sutil
- Accent: `#60A5FA` (azul), `#FBBF24` (laranja), `#F87171` (vermelho)

## Estrutura da Página

### 1. Header
- Título: "Leads Report"
- Filtros: Período (Este Mês, Últimos 3 Meses, Últimos 6 Meses, Este Ano)

### 2. Métricas Principais (Cards Superiores)

#### Card 1: Pipeline Value
- Valor total do pipeline de vendas
- Comparação com mês anterior (% de variação)
- Ícone: 💰

#### Card 2: Lead-to-Deal Rate
- Taxa de conversão de leads para vendas
- Comparação com mês anterior (% de variação)
- Ícone: 📊

#### Card 3: Contacted Leads
- Total de leads contatados
- Comparação com mês anterior (% de variação)
- Ícone: 📞

#### Card 4: Qualified Leads
- Total de leads qualificados
- Comparação com mês anterior (% de variação)
- Ícone: ✅

#### Card 5: Hot Leads
- Total de leads quentes (prontos para fechar)
- Comparação com mês anterior (% de variação)
- Ícone: 🔥

### 3. Seção de Receita (Sales Revenue)

#### Gráfico de Barras
- Receita mensal dos últimos 7 meses
- Comparação com dia anterior
- Indicadores de crescimento:
  - 3 meses: +25%
  - 6 meses: +25%
  - 1 ano: -12.5%

### 4. Segmentação de Clientes

#### Gráfico de Pizza
- **Mid Market**: ~50% (azul)
- **Small Business**: ~35% (laranja)
- **Individual**: ~15% (amarelo)
- Total de clientes exibido

### 5. Canais de Aquisição

#### Tabela de Performance
Colunas:
- Canal (Facebook, Twitter, Google, Instagram)
- Número de leads
- Variação vs mês anterior
- Indicador visual de crescimento/queda

Dados exemplo:
- Facebook: 2341 leads (+25%)
- Twitter: 1231 leads (-25%)
- Google: 1123 leads (-25%)
- Instagram: 125 leads (+25%)

Link: "Full reports" para relatório completo

### 6. Leads por Status

#### Gráfico de Barras Horizontais
- **New Leads**: 134 (azul)
- **Contacted**: 121 (laranja)
- **Qualified**: 133 (amarelo)
- **Inactive**: 153 (verde)
- **Nego**: 123 (roxo)

Total: 213 leads in pipeline

### 7. Web Views

#### Métricas de Visualização
- Total de visualizações: 701.34m
- Comparação com mês anterior: -12.5%
- Indicadores de crescimento:
  - 3 meses: +25%
  - 6 meses: +25%
  - 1 ano: -12.5%

#### Gráfico de Linha
- Tendência de visualizações ao longo do tempo
- Cor: laranja (#F59E0B)

### 8. Estatísticas de Clientes (Movido da Página de Vendas)

#### Gráfico de Rosca
- Distribuição de clientes por categoria
- Total de clientes no centro
- Legenda com porcentagens

### 9. Top Clientes (Movido da Página de Vendas)

#### Lista de Clientes
- Avatar/Inicial
- Nome completo
- Email
- Total gasto
- Número de pedidos
- Ordenado por valor total gasto

### 10. Tabela de Leads Recentes

#### Colunas
- Cliente (nome + email)
- Pedido (número)
- Itens (quantidade)
- Valor (R$)
- Status (badge colorido)
- Data

#### Funcionalidades
- Paginação (10 itens por página)
- Ordenação por colunas
- Filtros por status
- Busca por nome/email

## Componentes a Criar

### 1. `src/pages/Leads.tsx`
Página principal com layout em grid

### 2. `src/components/leads/LeadsMetricsCards.tsx`
Cards de métricas principais (Pipeline, Lead-to-Deal, etc.)

### 3. `src/components/leads/SalesRevenueChart.tsx`
Gráfico de barras de receita mensal

### 4. `src/components/leads/CustomerSegmentation.tsx`
Gráfico de pizza de segmentação

### 5. `src/components/leads/AcquisitionChannels.tsx`
Tabela de canais de aquisição

### 6. `src/components/leads/LeadsByStatus.tsx`
Gráfico de barras horizontais por status

### 7. `src/components/leads/WebViewsChart.tsx`
Métricas e gráfico de visualizações

### 8. `src/components/leads/LeadsTable.tsx`
Tabela de leads recentes com paginação

### 9. `src/hooks/useLeadsStats.ts`
Hook para buscar estatísticas de leads

## Dados do Banco

### Tabela: `leads`
```sql
SELECT 
  id,
  name,
  email,
  phone,
  lead_status,
  lead_source,
  total_orders,
  total_spent,
  first_order_date,
  last_order_date,
  marketplace_id,
  created_at
FROM leads
WHERE organization_id = ?
ORDER BY created_at DESC
```

### Métricas Calculadas
```sql
-- Pipeline Value
SELECT SUM(total_spent) FROM leads WHERE lead_status IN ('qualified', 'contacted')

-- Lead-to-Deal Rate
SELECT 
  (COUNT(*) FILTER (WHERE total_orders > 0) * 100.0 / COUNT(*)) as rate
FROM leads

-- Leads por Status
SELECT lead_status, COUNT(*) 
FROM leads 
GROUP BY lead_status

-- Leads por Canal
SELECT m.name, COUNT(l.id)
FROM leads l
JOIN marketplaces m ON l.marketplace_id = m.id
GROUP BY m.name
```

## Melhorias na Página de Vendas

### 1. Adicionar Paginação em "Produtos Mais Vendidos"
- 5 produtos por página
- Botões de navegação (anterior/próximo)
- Indicador de página atual

### 2. Remover Duplicações
- ❌ Remover seção "Estatísticas de Clientes" duplicada
- ❌ Remover seção "Pedidos Recentes" duplicada (já existe no topo)
- ✅ Manter apenas uma instância de cada componente

### 3. Corrigir Erro "Erro ao carregar clientes"
- Verificar query de clientes
- Adicionar tratamento de erro adequado
- Exibir mensagem amigável

## Roteamento

### Adicionar Rota
```typescript
// src/App.tsx
<Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
```

### Menu de Navegação
Adicionar item "Leads" no menu lateral:
- Ícone: 👥 ou 📊
- Label: "Leads"
- Path: "/leads"

## Responsividade

### Desktop (>1024px)
- Grid de 3 colunas para cards de métricas
- Gráficos lado a lado

### Tablet (768px - 1024px)
- Grid de 2 colunas para cards
- Gráficos empilhados

### Mobile (<768px)
- Grid de 1 coluna
- Gráficos em largura total
- Tabela com scroll horizontal

## Animações

### Entrada de Componentes
```typescript
gsap.from('.leads-card', {
  opacity: 0,
  y: 20,
  duration: 0.5,
  stagger: 0.1
});
```

### Hover em Cards
```css
.leads-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
```

## Acessibilidade

- Labels descritivos em todos os gráficos
- Contraste adequado (WCAG AA)
- Navegação por teclado
- Screen reader friendly
- Textos alternativos em ícones

## Performance

- Lazy loading de gráficos
- Memoização de cálculos pesados
- Debounce em filtros de busca
- Paginação server-side para tabelas grandes

## Testes

### Casos de Teste
1. ✅ Renderização correta de todos os componentes
2. ✅ Cálculo correto de métricas
3. ✅ Filtros funcionando
4. ✅ Paginação funcionando
5. ✅ Modo escuro/claro alternando corretamente
6. ✅ Responsividade em diferentes tamanhos de tela

## Próximos Passos

1. ✅ Criar documentação (este arquivo)
2. ⏳ Implementar componentes base
3. ⏳ Integrar com banco de dados
4. ⏳ Adicionar gráficos com Recharts
5. ⏳ Implementar filtros e paginação
6. ⏳ Adicionar animações GSAP
7. ⏳ Testar responsividade
8. ⏳ Corrigir duplicações na página de Vendas
9. ⏳ Adicionar paginação em Produtos Mais Vendidos

## Referências

- [Recharts Documentation](https://recharts.org/)
- [GSAP Animation](https://greensock.com/gsap/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
