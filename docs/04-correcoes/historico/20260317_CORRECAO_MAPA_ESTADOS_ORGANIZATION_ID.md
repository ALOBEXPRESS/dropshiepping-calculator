# Correção: Mapa de Estados não Exibindo Dados

## Problema Identificado

O componente `BrazilStatesDistribution` na página de vendas não estava exibindo o mapa nem os pedidos associados devido a dois problemas:

### 1. View Inexistente
O componente tentava consultar a view `orders_with_location` que não existe no banco de dados:

```typescript
// ❌ ANTES - View que não existe
const { data: ordersData, error: fetchError } = await supabase
  .from('orders_with_location')
  .select('id, total_amount, label_state')
  .eq('organization_id', organizationId)
  .neq('status', 'cancelled');
```

### 2. Organization ID Incorreto
Conforme documentado em `INSTRUCOES_CORRIGIR_ORGANIZATION_ID.md`, os dados importados do Bling estão com `organization_id` errado:
- Frontend usa: `28b4b443-03fd-4a2d-b596-9dcaf142b389`
- Dados existentes têm: `e3274f4d-2627-4121-895d-b0e3a70b0ace`

## Solução Aplicada

### Correção da Query
Alterado para usar a tabela `bling_orders` diretamente, igual ao componente `BrazilMap.tsx` que já funcionava:

```typescript
// ✅ DEPOIS - Usando tabela bling_orders
const { data: ordersData, error: fetchError } = await supabase
  .from('bling_orders')
  .select('label_state')
  .eq('organization_id', organizationId)
  .not('label_state', 'is', null);
```

### Simplificação do Processamento
Removida a lógica de receita (que não estava sendo usada) e mantido apenas a contagem de pedidos:

```typescript
// Contar pedidos por estado
const stateCounts: Record<string, number> = {};
let totalOrders = 0;

(ordersData || []).forEach((order: { label_state?: string }) => {
  const state = order.label_state?.toUpperCase().trim();
  if (state && state.length === 2) {
    stateCounts[state] = (stateCounts[state] || 0) + 1;
    totalOrders++;
  }
});
```

## Próximos Passos

Para resolver completamente o problema do organization_id, é necessário:

1. **Corrigir a importação do Bling** para usar o organization_id correto
2. **Migrar dados existentes** para o organization_id correto
3. **Criar a view orders_with_location** (opcional, para futuras melhorias)

### Migração de Dados (SQL)

```sql
-- Verificar quantos pedidos estão com organization_id errado
SELECT COUNT(*) 
FROM bling_orders 
WHERE organization_id = 'e3274f4d-2627-4121-895d-b0e3a70b0ace';

-- Atualizar para o organization_id correto
UPDATE bling_orders
SET organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
WHERE organization_id = 'e3274f4d-2627-4121-895d-b0e3a70b0ace';

-- Verificar se há pedidos processados na tabela orders
UPDATE orders
SET organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
WHERE organization_id = 'e3274f4d-2627-4121-895d-b0e3a70b0ace';
```

## Arquivos Modificados

- `src/components/sales/BrazilStatesDistribution.tsx` - Corrigida query para usar `bling_orders`

## Resultado

Após a correção:
- ✅ Mapa do Brasil é exibido corretamente
- ✅ Estados com pedidos são coloridos conforme a quantidade
- ✅ Lista de estados mostra os top 10 com percentuais
- ✅ Clique no estado mostra detalhes
- ⚠️ Ainda depende da correção do organization_id para mostrar todos os dados

## Referências

- `docs/correcoes/INSTRUCOES_CORRIGIR_ORGANIZATION_ID.md` - Instruções para corrigir organization_id
- `src/components/sales/BrazilMap.tsx` - Componente de referência que já funcionava
