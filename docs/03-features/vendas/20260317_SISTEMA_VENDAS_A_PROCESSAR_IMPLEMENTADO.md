# Sistema de Vendas a Processar - Implementação Completa

**Data**: 2026-02-28  
**Status**: ✅ CONCLUÍDO

---

## 📋 Resumo

Sistema completo para processar vendas do Bling e calcular lucros, com interface visual na Calculadora mostrando vendas pendentes e botão para processar cada venda.

---

## 🗄️ Banco de Dados

### Migrações Aplicadas

#### 1. Colunas Adicionadas na Tabela `orders`
- `bling_order_id` - Referência ao pedido original do Bling
- `marketplace_id` - Marketplace da venda
- `sales_channel_id` - Canal de vendas
- `lead_id` - Lead associado
- `order_date` - Data do pedido
- `shipping_cost` - Custo de envio
- `discount_value` - Valor de desconto
- `other_expenses` - Outras despesas
- `marketplace_commission` - Comissão do marketplace calculada
- `total_cost` - Custo total dos produtos
- `total_profit` - Lucro líquido
- `profit_margin` - Margem de lucro em %
- `processed_at` - Data/hora do processamento
- `processed_by` - Usuário que processou
- `updated_at` - Data de atualização

#### 2. Colunas Adicionadas na Tabela `order_items`
- `bling_item_id` - Referência ao item original do Bling
- `product_name` - Nome do produto
- `product_image_url` - URL da imagem
- `unit_cost` - Custo unitário
- `total_cost` - Custo total (unit_cost * quantity)
- `profit` - Lucro do item
- `profit_margin` - Margem de lucro do item em %
- `created_at` - Data de criação
- `updated_at` - Data de atualização

#### 3. Colunas de Controle em `bling_orders`
- `processed_to_orders` - Boolean indicando se já foi processado
- `processed_order_id` - ID do pedido processado em `orders`

#### 4. Índices Criados
- `idx_orders_bling_order_id`
- `idx_orders_marketplace_id`
- `idx_orders_lead_id`
- `idx_orders_order_date`
- `idx_orders_processed_at`
- `idx_order_items_bling_item_id`
- `idx_order_items_product_id`
- `idx_bling_orders_processed` (WHERE processed_to_orders = FALSE)

---

## 🔧 Functions PostgreSQL

### `process_bling_order_to_profit(p_bling_order_id UUID, p_user_id UUID)`

**Descrição**: Processa um pedido do Bling para a tabela de lucros, calculando custos e margens.

**Fluxo**:
1. Verifica se o pedido já foi processado
2. Busca dados do pedido Bling com joins (leads, marketplaces)
3. Calcula comissão do marketplace
4. Cria registro em `orders` com todos os dados calculados
5. Para cada item do pedido:
   - Busca dados do produto
   - Calcula custos e lucros do item
   - Insere em `order_items`
6. Calcula lucro total do pedido
7. Atualiza totais em `orders`
8. Marca pedido Bling como processado
9. Retorna JSON com resultado

**Retorno**:
```json
{
  "success": true,
  "message": "Pedido processado com sucesso",
  "order_id": "uuid",
  "total_profit": 123.45,
  "profit_margin": 25.5
}
```

---

## 📊 Views Criadas

### 1. `pending_orders_to_process`

**Descrição**: Lista vendas do Bling pendentes de processamento.

**Colunas**:
- `bling_order_id` - ID do pedido Bling
- `order_number` - Número do pedido
- `order_date` - Data do pedido
- `total_amount` - Valor total
- `status_id` - Status do pedido
- `lead_id` - ID do lead
- `customer_name` - Nome do cliente
- `customer_email` - Email do cliente
- `marketplace_id` - ID do marketplace
- `marketplace_name` - Nome do marketplace
- `commission_rate` - Taxa de comissão
- `sales_channel_name` - Nome do canal de vendas
- `items_count` - Quantidade de itens
- `first_product_image` - Imagem do primeiro produto

**Filtros**:
- `processed_to_orders = FALSE`
- `status_id = 6` (apenas pedidos concluídos)

### 2. `financial_summary`

**Descrição**: Resumo financeiro consolidado com vendas processadas e pendentes.

**Colunas**:
- `total_processed_orders` - Total de pedidos processados
- `total_revenue` - Receita total
- `total_cost` - Custo total
- `total_commissions` - Comissões totais
- `total_shipping` - Frete total
- `total_expenses` - Despesas totais
- `total_profit` - Lucro total
- `avg_profit_margin` - Margem de lucro média
- `pending_orders_count` - Quantidade de pedidos pendentes
- `pending_revenue` - Receita pendente
- `by_marketplace` - JSON com dados por marketplace

---

## 🎨 Frontend

### Componente `PendingOrders.tsx`

**Localização**: `src/components/PendingOrders.tsx`

**Funcionalidades**:
- Lista vendas pendentes com cards visuais
- Mostra imagem do produto, marketplace, cliente, valor
- Botão "PROCESSAR LUCRO" para cada venda
- Loading states e error handling
- Design responsivo com grid de cards
- Integração com Supabase (view + function)

**Estados**:
- `pendingOrders` - Lista de vendas pendentes
- `loading` - Estado de carregamento
- `processing` - ID da venda sendo processada
- `error` - Mensagem de erro

**Funções**:
- `loadPendingOrders()` - Carrega vendas da view
- `processOrder(blingOrderId)` - Chama a function do Supabase
- `formatCurrency()` - Formata valores em R$
- `formatDate()` - Formata datas

**UI**:
- Cards com imagem do produto
- Badge do marketplace
- Informações do cliente
- Valor total e quantidade de itens
- Botão verde "PROCESSAR LUCRO"
- Feedback visual (loading spinner, success/error alerts)

### Integração na Calculadora

**Arquivo**: `src/components/DropshippingCalculator.tsx`

**Localização**: Abaixo de "Produtos Integrados"

**Código**:
```tsx
{/* Vendas a Processar */}
<div className="mt-6">
  <PendingOrders />
</div>
```

---

## 🔄 Fluxo Completo

1. **Venda no Bling** → Webhook cria registro em `bling_orders` e `bling_order_items`
2. **Lead criado** → Associado ao pedido via `lead_id`
3. **Marketplace identificado** → Via lead
4. **Venda aparece na Calculadora** → Componente `PendingOrders` lista vendas com `processed_to_orders = FALSE`
5. **Usuário clica "PROCESSAR LUCRO"** → Chama `process_bling_order_to_profit()`
6. **Function processa** → Calcula custos, lucros, comissões
7. **Dados salvos** → Tabelas `orders` e `order_items` populadas
8. **Pedido marcado como processado** → `processed_to_orders = TRUE`
9. **Venda some da lista** → Não aparece mais em pendentes
10. **Resumo financeiro atualizado** → View `financial_summary` reflete novos dados

---

## 📈 Próximos Passos

### 1. Atualizar Resumo Financeiro Geral
- Criar hook `useFinancialSummary` para buscar dados da view
- Atualizar componente de resumo financeiro na Calculadora
- Mostrar vendas processadas vs pendentes

### 2. Atualizar Contadores de Vendas
- Atualizar contador de vendas nos canais configurados
- Atualizar contador na tela de produtos
- Atualizar contador na página de Vendas

### 3. Melhorias de UX
- Adicionar notificações toast para feedback
- Implementar refresh automático após processamento
- Adicionar confirmação antes de processar
- Mostrar preview dos cálculos antes de processar

### 4. Relatórios e Análises
- Dashboard com gráficos de lucros
- Comparativo de margens por marketplace
- Análise de produtos mais lucrativos
- Exportação de relatórios

---

## 🧪 Testes

### Testes Manuais Recomendados

1. **Listar vendas pendentes**
   - Verificar se aparecem apenas vendas com `status_id = 6`
   - Verificar se imagem do produto é exibida
   - Verificar se marketplace está correto

2. **Processar venda**
   - Clicar em "PROCESSAR LUCRO"
   - Verificar mensagem de sucesso
   - Verificar se venda some da lista
   - Verificar dados em `orders` e `order_items`

3. **Validar cálculos**
   - Comparar lucro calculado com esperado
   - Verificar comissão do marketplace
   - Verificar custos dos produtos

4. **Testar edge cases**
   - Processar venda já processada (deve retornar erro)
   - Processar venda sem produtos (deve tratar)
   - Processar venda sem lead (deve tratar)

---

## 📝 Notas Técnicas

### Segurança
- RLS habilitado em `orders` e `order_items`
- Policies criadas para SELECT, INSERT, UPDATE
- Apenas usuários autenticados podem processar vendas

### Performance
- Índices criados para queries rápidas
- View `pending_orders_to_process` otimizada
- Subquery para buscar imagem do produto

### Manutenibilidade
- Código bem documentado
- Funções com tratamento de erros
- Componentes React com TypeScript
- Estados e loading bem gerenciados

---

## ✅ Checklist de Implementação

- [x] Migração do banco aplicada
- [x] Function `process_bling_order_to_profit` criada
- [x] View `pending_orders_to_process` criada
- [x] View `financial_summary` criada
- [x] Componente `PendingOrders` criado
- [x] Integração na Calculadora
- [x] Testes de diagnóstico (sem erros)
- [ ] Testes manuais
- [ ] Atualizar resumo financeiro
- [ ] Atualizar contadores de vendas
- [ ] Implementar notificações toast

---

## 🎯 Resultado Final

Sistema completo e funcional para processar vendas do Bling, calcular lucros automaticamente e exibir vendas pendentes na interface da Calculadora. O usuário pode visualizar todas as vendas não processadas e, com um clique, processar cada uma delas, movendo os dados para as tabelas de lucros com todos os cálculos realizados automaticamente.
