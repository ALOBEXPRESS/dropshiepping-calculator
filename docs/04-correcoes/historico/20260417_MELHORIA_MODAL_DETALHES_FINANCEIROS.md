# Melhoria Modal de Detalhes Financeiros - 17/04/2026

## 📋 Contexto

O usuário reportou que o tooltip do gráfico de receita não estava exibindo corretamente:
1. Nome do marketplace (Shopee)
2. Nome do produto e SKU
3. Separação clara entre "Custo do Produto" e "Custo Marketplace"
4. Necessidade de um botão "Detalhar" para ver informações completas

## ✅ Implementações Realizadas

### 1. **Reestruturação do Tooltip**

**Antes:**
- Exibia "Sem marketplace - #133"
- Não mostrava nome do cliente
- Não mostrava SKU do produto
- Todas as despesas misturadas
- Apenas botão "Excluir"

**Depois:**
- Exibe nome do cliente
- Mostra marketplace e número do pedido: "🏪 Shopee • Pedido #133"
- Mostra produto com SKU: "📦 Chinelo Killer Point Masculino (SKU: 10409983940-C)"
- Indica quantidade de produtos adicionais
- Dois botões: "Detalhar" (azul) e "Excluir" (vermelho)
- Mostra apenas o lucro no resumo

### 2. **Modal de Detalhes Completo**

Criado um modal (`Dialog`) que abre ao clicar em "Detalhar" com:

#### **Seção de Informações**
- Cliente
- Marketplace
- Produto principal + SKU
- Produtos adicionais (se houver)

#### **Preço de Venda**
- Valor total da venda em destaque

#### **Custo do Produto** (fundo vermelho)
Agrupa todas as despesas relacionadas ao fornecedor:
- ✅ Custo base do produto
- ✅ Taxa do fornecedor (% ou fixo)
- ✅ Gateway do fornecedor (% ou fixo)
- ✅ **Subtotal Custo Produto**

#### **Custo Marketplace** (fundo laranja)
Agrupa todas as despesas do marketplace:
- ✅ Comissão (com %)
- ✅ Taxa fixa
- ✅ Taxa de serviço
- ✅ Frete
- ✅ Outras despesas
- ✅ **Subtotal Custo Marketplace**

#### **Lucro Final**
- Lucro real calculado
- Margem de lucro em %

### 3. **Estrutura de Dados**

Criada interface `OrderDetail` para tipagem completa:

```typescript
interface OrderDetail {
  order_id: string;
  order_number: string;
  marketplace: string;
  customer_name?: string;
  product_name?: string;
  product_sku?: string;
  products?: { name: string; sku?: string }[];
  total_amount: number;
  total_cost: number;
  product_cost_price?: number;
  marketplace_commission: number;
  commission_rate: number;
  shipping_cost: number;
  other_expenses: number;
  supplier_fee_value?: string;
  supplier_fee_type?: string;
  supplier_gateway_fee_value?: string;
  supplier_gateway_fee_type?: string;
  total_profit: number;
}
```

### 4. **Event Handlers**

Adicionado handler para o botão "Detalhar":
- Captura clique no botão `[data-detail-order-btn]`
- Extrai dados do pedido do atributo `data-order-detail`
- Abre modal com informações completas

## 🎨 Melhorias de UX

1. **Tooltip mais limpo**: Apenas informações essenciais
2. **Hierarquia visual clara**: Cliente → Marketplace → Produto
3. **Cores semânticas**:
   - Verde: Receita/Lucro positivo
   - Vermelho: Custos/Lucro negativo
   - Azul: Ação de detalhar
   - Laranja: Custos do marketplace
4. **Responsividade**: Modal com scroll para muitos itens
5. **Acessibilidade**: Estrutura semântica com headers e seções

## 📊 Exemplo de Uso

### Tooltip (Vista Resumida)
```
Cliente não identificado
🏪 Shopee • Pedido #133
📦 Chinelo Killer Point Masculino (SKU: 10409983940-C)

Lucro: R$ 8,00

[Detalhar] [Excluir]
```

### Modal (Vista Detalhada)
```
Detalhes do Pedido #133

Cliente: Cliente não identificado
Marketplace: Shopee
Produto: Chinelo Killer Point Masculino
SKU: 10409983940-C

💰 Preço de venda: R$ 22,90

📦 Custo do Produto
  Custo base do produto: -R$ 14,90
  Taxa do fornecedor (6%): -R$ 0,89
  Gateway do fornecedor: -R$ 2,00
  ─────────────────────────────
  Subtotal Custo Produto: -R$ 17,79

🏪 Custo Marketplace (Shopee)
  Comissão (20%): -R$ 4,00
  Taxa fixa: -R$ 0,93
  ─────────────────────────────
  Subtotal Custo Marketplace: -R$ 4,93

Lucro Real: R$ 0,18
Margem: 0,79%
```

## 🔧 Arquivos Modificados

- `src/components/sales/RevenueReportChart.tsx`
  - Adicionado import do `Dialog`
  - Criada interface `OrderDetail`
  - Adicionado estado `detailDialogOpen` e `selectedOrder`
  - Modificado event handler para capturar clique em "Detalhar"
  - Reestruturado HTML do tooltip
  - Criado modal de detalhes completo

## ✨ Benefícios

1. **Clareza financeira**: Separação clara entre custos do produto e marketplace
2. **Rastreabilidade**: Nome do cliente, marketplace e SKU sempre visíveis
3. **Análise detalhada**: Modal permite análise profunda de cada pedido
4. **Múltiplos produtos**: Suporte para pedidos com vários produtos
5. **Manutenibilidade**: Código tipado e estruturado

## 🚀 Próximos Passos Sugeridos

1. Adicionar filtro por marketplace no gráfico
2. Exportar detalhes do pedido para PDF
3. Adicionar gráfico de pizza com distribuição de custos no modal
4. Implementar comparação entre pedidos
5. Adicionar histórico de alterações do pedido

## 📝 Notas Técnicas

- O modal usa `Dialog` do shadcn/ui para consistência
- Dados são passados via atributo `data-order-detail` serializado em JSON
- Cálculos de taxas consideram tipo (percent/fixed)
- Cores seguem o design system do projeto
- Responsivo e acessível por padrão
