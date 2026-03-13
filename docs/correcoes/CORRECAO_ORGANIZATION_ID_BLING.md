# Correção: Organization ID Incorreto nos Dados do Bling

## Data
12/03/2026 - 11:00

## Problema Identificado

Após processar um pedido do Bling, o dashboard não estava refletindo os dados das tabelas `orders` e `order_items`. A investigação revelou que o problema raiz era o `organization_id` incorreto em todos os dados importados do Bling.

### Sintomas

1. ✅ Pedido processado com sucesso (logs confirmam)
2. ✅ Dados inseridos no banco (`orders` e `order_items`)
3. ✅ Dashboard atualiza automaticamente (sem loops)
4. ❌ Dashboard mostra zeros ou dados incompletos
5. ❌ Produtos Mais Vendidos não mostra o produto vendido
6. ❌ Top Clientes não mostra pedidos do cliente

### Causa Raiz

Todos os dados importados do Bling estavam sendo associados ao `organization_id = e3274f4d-2627-4121-895d-b0e3a70b0ace`, mas o usuário logado pertence à organização `28b4b443-03fd-4a2d-b596-9dcaf142b389`.

**Tabelas afetadas:**
- `bling_orders` → `organization_id` errado
- `orders` → Herda `organization_id` do `bling_orders`
- `products` → `organization_id` errado
- `customers` → `organization_id` errado

**Impacto:**
- Todas as queries filtram por `organization_id` do usuário logado
- Como os dados têm `organization_id` diferente, não aparecem no dashboard
- Funções RPC (`get_top_selling_products`, `get_top_customers`, etc.) retornam zeros

## Solução Temporária Aplicada

Para o pedido de teste #122, foram atualizados manualmente os `organization_id`:

```sql
-- 1. Atualizar pedido
UPDATE orders 
SET organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
WHERE order_number = '122';

-- 2. Atualizar produto
UPDATE products 
SET organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
WHERE id = 'b0ca1d3f-c49d-4333-8868-0330baa62ed9';

-- 3. Atualizar bling_orders
UPDATE bling_orders 
SET organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
WHERE order_number = 122;

-- 4. Atualizar customer
UPDATE customers 
SET organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
WHERE id = '8e7a59ec-5e40-4b6e-8c83-0e9e4fce2071';
```

## Resultado Após Correção

### ✅ Funcionando Corretamente

1. **Relatório de Receita**: R$ 49,90 (Receita) e R$ 0,00 (Custo)
2. **Gráfico de Área**: Mostrando dados do pedido
3. **Estatísticas**:
   - Total de Produtos: 82 (+61 esta semana)
   - Total de Clientes: 1 (+1 esta semana)
   - Total de Pedidos: 1 (+1 esta semana)
   - Total de Vendas: R$ 50 (+R$ 50 esta semana)
4. **Pedidos Recentes**: Pedido #122 - Camisa Rock In Rio - R$ 49,90
5. **Transações**: Jonatan - +R$ 49,90 - Concluído
6. **Produtos Mais Vendidos**: 🥇 Camisa Rock In Rio - 1 vendido - 1 pedido - R$ 49,90

### ⚠️ Ainda com Problemas Menores

1. **Top Clientes**: Mostrando 0 pedidos (problema de clientes duplicados)
2. **Distribuição por Estado**: Sem dados de localização (pedido não tem endereço)

## Solução Definitiva Necessária

O problema precisa ser corrigido na origem, onde os dados do Bling são importados. Existem duas possíveis origens:

### 1. Webhook do Bling

Se os dados vêm via webhook, o webhook precisa:
- Identificar o `organization_id` correto baseado nas credenciais do Bling
- Associar todos os dados importados ao `organization_id` correto

### 2. Importação Manual/Automática

Se há um processo de importação, ele precisa:
- Receber o `organization_id` como parâmetro
- Garantir que todos os dados sejam associados ao `organization_id` correto

### Locais para Investigar

1. **Webhook Handler**: Procurar por endpoints que recebem dados do Bling
2. **Funções de Importação**: Procurar por funções que inserem dados do Bling
3. **N8N Workflows**: Se houver workflows do N8N, verificar se estão passando o `organization_id` correto

## Recomendações

### Curto Prazo

1. **Adicionar Validação**: Antes de processar pedidos, validar se o `organization_id` do `bling_orders` corresponde ao usuário logado
2. **Corrigir na Importação**: Identificar onde os dados do Bling são importados e corrigir o `organization_id`

### Médio Prazo

1. **Migração de Dados**: Criar script para corrigir `organization_id` de todos os dados existentes
2. **Constraint de Segurança**: Adicionar RLS (Row Level Security) para garantir que usuários só vejam dados da sua organização

### Longo Prazo

1. **Auditoria de Importação**: Adicionar logs para rastrear de onde vêm os dados e qual `organization_id` está sendo usado
2. **Testes Automatizados**: Criar testes para garantir que dados importados têm o `organization_id` correto

## Arquivos Relacionados

- `src/pages/Sales.tsx` - Dashboard de vendas
- `src/components/PendingOrders.tsx` - Processamento de pedidos
- `src/components/sales/*.tsx` - Componentes do dashboard
- `src/hooks/sales/*.ts` - Hooks de dados

## Screenshots

- `dashboard-apos-correcao-organization-id.png` - Dashboard após primeira correção
- `dashboard-final-funcionando.png` - Dashboard funcionando corretamente

## Teste Realizado

1. ✅ Servidor iniciado (`npm run dev`)
2. ✅ Login realizado (empresaalob@gmail.com)
3. ✅ Pedido #122 processado com sucesso
4. ✅ Dashboard atualizou automaticamente
5. ✅ Dados corretos exibidos após correção do `organization_id`
6. ✅ Build executado com sucesso (`npm run build`)

## Status

- ✅ **Solução temporária aplicada**: Pedido de teste funcionando
- ⚠️ **Solução definitiva pendente**: Corrigir importação na origem
- ✅ **Dashboard funcionando**: Atualização automática OK
- ✅ **Build OK**: Sem erros de compilação

---

**Próximos Passos:**
1. Identificar onde os dados do Bling são importados
2. Corrigir o `organization_id` na importação
3. Criar script de migração para dados existentes
4. Adicionar testes para prevenir regressão
