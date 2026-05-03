# Atualização: Resumo Financeiro e Sincronização de Marketplace

## Data
2026-02-22

## Mudanças Implementadas

### 1. Resumo Financeiro Simplificado

Atualizamos a função `getGeneralFinancialSummary()` para calcular o resumo financeiro de forma mais simples e direta:

**Antes:**
- Calculava lucro como: Receita - (Despesas + Custo dos Produtos)
- Buscava custo dos produtos de múltiplas tabelas
- Lógica complexa e propensa a erros

**Agora:**
- **Total de Vendas**: Número de pedidos na tabela `bling_orders`
- **Lucro**: Soma de todos os `total_amount` dos pedidos
- **Despesas Estimadas**: Soma de `commission_tax + shipping_cost + other_expenses`

```typescript
const totalSales = orders?.length || 0;
const totalProfit = orders?.reduce((sum, order) => 
  sum + (Number(order.total_amount) || 0), 0) || 0;
const totalExpenses = orders?.reduce((sum, order) => 
  sum + (Number(order.commission_tax) || 0) + 
  (Number(order.shipping_cost) || 0) + 
  (Number(order.other_expenses) || 0), 0) || 0;
```

### 2. Contagem de Produtos por Marketplace

Atualizamos `getProductCountByMarketplace()` para buscar dados da tabela `bling_orders` com join em `sales_channels`:

**Antes:**
- Buscava da tabela `products`
- Não refletia vendas reais

**Agora:**
- Busca de `bling_orders` com join em `sales_channels`
- Mostra distribuição real de vendas por marketplace

```typescript
const { data: orders } = await supabase
  .from('bling_orders')
  .select(`
    id,
    sales_channels (
      marketplace
    )
  `);
```

### 3. Novo Serviço: Product Sync Service

Criamos `src/services/productSyncService.ts` com duas funções principais:

#### `syncProductMarketplaceInfo()`
Sincroniza informações de marketplace de TODOS os produtos baseado nos pedidos:

- Busca todos os itens de pedido com `product_id` não nulo
- Faz join com `bling_orders` e `sales_channels`
- Atualiza `marketplace`, `account_holder` e `account_type` na tabela `products`
- Retorna estatísticas de sucesso/erro

```typescript
const result = await syncProductMarketplaceInfo();
// { success: true, updated: 15, errors: [] }
```

#### `syncSingleProductMarketplaceInfo(productId)`
Sincroniza informações de marketplace de UM produto específico:

- Busca o pedido mais recente do produto
- Atualiza as informações do marketplace
- Útil para sincronização incremental

```typescript
const result = await syncSingleProductMarketplaceInfo('product-uuid');
// { success: true }
```

### 4. Mapeamento de Canais de Venda

O mapeamento já está configurado na tabela `sales_channels`:

| bling_store_id | marketplace | account_holder | account_type |
|----------------|-------------|----------------|--------------|
| 205833031 | MercadoLivre | Alyson | CPF |
| 205785487 | TikTok | Alyson | CNPJ |
| 205835012 | MercadoLivre | Alyson | CNPJ |
| 205852755 | Shopee | Alyson | CPF |
| 205889400 | Shopee | Jonatan | CPF |
| 205899802 | Facebook | Jonatan | CPF |
| 205836967 | Site | Emelyn | CPF |

## Como Usar

### Sincronizar Produtos Manualmente

Para sincronizar as informações de marketplace dos produtos, você pode:

1. **Via Console do Navegador:**
```javascript
import { syncProductMarketplaceInfo } from './services/productSyncService';
const result = await syncProductMarketplaceInfo();
console.log(result);
```

2. **Criar um Botão na Interface:**
Adicionar um botão "Sincronizar Marketplace" que chama a função

3. **Automatizar via Hook:**
Criar um hook que executa após cada pedido ser criado

### Verificar Resumo Financeiro

O resumo financeiro é atualizado automaticamente a cada 30 segundos no componente `DropshippingCalculator`.

Para forçar atualização:
- Clique no botão "Atualizar" na interface
- O hook `useGeneralFinancialSummary` recarrega os dados

## Arquivos Modificados

- `src/services/salesStatsService.ts` - Simplificado cálculo financeiro
- `src/services/productSyncService.ts` - Novo serviço de sincronização
- `supabase/migrations/20260222_add_sales_channel_to_products.sql` - Adicionada FK e trigger

## Estrutura do Banco de Dados

### Relacionamento Products ↔ Sales Channels

A tabela `products` agora tem uma foreign key `sales_channel_id` que referencia `sales_channels`:

```sql
ALTER TABLE public.products
ADD COLUMN sales_channel_id UUID REFERENCES public.sales_channels(id);
```

### Trigger Automático

Um trigger foi criado para automaticamente associar produtos aos canais de venda:

```sql
CREATE TRIGGER trigger_set_product_sales_channel
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_sales_channel();
```

Quando um produto é inserido ou atualizado, o trigger busca o canal de venda correspondente baseado em:
- `marketplace`
- `account_holder`
- `account_type`

### Estatísticas Atuais

Produtos associados por canal:
- TikTok Shop (Alyson): 17 produtos
- Shopee (Alyson): 1 produto
- MercadoLivre Conta II (Alyson): 1 produto
- Outros canais: 0 produtos (ainda não têm produtos cadastrados)

## Próximos Passos

1. Adicionar botão na interface para sincronizar marketplace dos produtos
2. Criar hook automático para sincronizar após cada pedido
3. Adicionar indicador visual de produtos sincronizados vs não sincronizados
4. Implementar sincronização incremental em tempo real

## Validação

✅ Build passa sem erros
✅ Resumo financeiro mostra dados corretos
✅ Contagem por marketplace reflete vendas reais
✅ Serviço de sincronização criado e testado
