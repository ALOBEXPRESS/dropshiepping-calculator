# Adição de Coluna "Total de Investimento" na Projeção de Lucros

## Resumo
Adicionada nova coluna "Total de investimento" na seção de estatísticas da projeção de lucros, mostrando o investimento total em tráfego pago e Marketplace Ads.

## Mudanças Realizadas

### 1. Nova Coluna de Investimento

**Arquivo**: `src/components/calculator/ProfitProjection.tsx`

**Mudanças**:
- Alterado grid de 2 colunas para 3 colunas
- Adicionada terceira coluna "Total de investimento"
- Cálculo automático somando:
  - Tráfego pago (`trafficCost`)
  - Mercado Livre Ads diário (`mercadoAdsDailyBudget`)
  - Shopee Ads diário (`shopeeDailyBudget`)
  - TikTok Ads diário (`tiktokDailyBudget`)

**Estrutura Visual**:
```
┌─────────────────┬─────────────────┬─────────────────────────┐
│ Total de vendas │ Total de lucro  │ Total de investimento   │
│ X unidades      │ R$ X.XXX,XX     │ R$ X.XXX,XX             │
│ X pedidos       │ Receita: R$ XX  │ Tráfego + Ads           │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Cálculo do Investimento Total

### Componentes do Investimento

1. **Tráfego Pago**
   - Valor de `investmentValue` ou `paidTraffic`
   - Apenas quando `trafficMode === 'paid'`

2. **Mercado Livre Ads**
   - Orçamento diário configurado
   - Apenas quando Mercado Ads está ativo

3. **Shopee Ads**
   - Orçamento diário configurado
   - Apenas quando Shopee Ads está ativo

4. **TikTok Ads**
   - Orçamento diário configurado
   - Apenas quando TikTok Ads está ativo

### Fórmula
```typescript
totalInvestment = trafficCost + mercadoAdsDailyBudget + shopeeDailyBudget + tiktokDailyBudget
```

## Design e UX

### Alinhamento Visual
- Grid de 3 colunas responsivo
- Alinhado com as projeções de vendas abaixo (50 UN, 100 UN, etc.)
- Mantém consistência visual com as outras duas colunas

### Estilo
- Mesmo background: `bg-white/10 rounded-xl p-4 backdrop-blur-sm`
- Título em uppercase: "TOTAL DE INVESTIMENTO"
- Valor em destaque: `text-2xl font-bold`
- Subtítulo explicativo: "Tráfego + Ads"

### Responsividade
- Desktop: 3 colunas lado a lado
- Mobile: Empilhamento vertical automático via grid

## Casos de Uso

### Cenário 1: Apenas Tráfego Orgânico
- Total de investimento: R$ 0,00
- Mostra que não há custos de marketing

### Cenário 2: Tráfego Pago Simples
- Total de investimento: R$ 500,00
- Apenas custo de tráfego pago

### Cenário 3: Tráfego + Mercado Ads
- Total de investimento: R$ 500,00 + R$ 50,00 = R$ 550,00
- Soma tráfego pago e orçamento diário do Mercado Ads

### Cenário 4: Múltiplos Ads
- Total de investimento: R$ 500,00 + R$ 50,00 + R$ 30,00 = R$ 580,00
- Soma todos os investimentos configurados

## Benefícios

1. **Visibilidade de Custos**
   - Usuário vê imediatamente quanto está investindo
   - Facilita análise de ROI

2. **Comparação Direta**
   - Total de investimento ao lado do total de lucro
   - Fácil calcular retorno sobre investimento

3. **Decisões Informadas**
   - Ajuda a decidir se vale a pena aumentar investimento
   - Mostra impacto de diferentes estratégias de marketing

## Observações sobre Distribuição por Estado

### Status Atual
- Componente implementado e funcionando corretamente
- Query busca dados de `bling_orders.label_state`
- Atualmente mostra "Nenhum dado de localização disponível"

### Motivo
- Pedidos existentes não têm `label_state` preenchido
- Campo está vazio na tabela `bling_orders`
- Quando houver pedidos com estado preenchido, funcionará automaticamente

### Exemplo de Dados Atuais
```sql
-- Pedido existente
label_state: "" (vazio)
label_city: "\t" (apenas tab)
contact_name: "Jonatan Renan Vitoriano Da Silva"
```

### Solução Futura
- Quando o Bling sincronizar pedidos com endereço completo
- Ou quando pedidos forem criados com dados de localização
- O componente automaticamente exibirá a distribuição

## Testes Realizados

- ✅ Build executado com sucesso
- ✅ TypeScript sem erros
- ✅ Grid responsivo funcionando
- ✅ Cálculo de investimento correto
- ✅ Alinhamento visual com projeções

## Commit
```bash
git add src/components/calculator/ProfitProjection.tsx docs/ADICAO_COLUNA_INVESTIMENTO_TOTAL.md
git commit -m "feat: adicionada coluna de investimento total na projeção de lucros"
```
