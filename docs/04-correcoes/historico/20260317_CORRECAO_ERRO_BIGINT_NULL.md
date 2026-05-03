# Correção: Erro "invalid input syntax for type bigint: null"

## Problema
O nó "Salvar Estatísticas no Banco1" está retornando o erro:
```
Bad request - please check your parameters: invalid input syntax for type bigint: "null"
```

## Causa
O campo `bling_contact_id` (tipo `BIGINT` no banco) está recebendo a string `"null"` ao invés de um número válido.

## Solução

### 1. Atualizar o código do nó "Atualizar Estatísticas do Lead1"

Substitua o código atual por este (versão 3 com validação):

```javascript
// Nó: Atualizar Estatísticas do Lead - Versão 3 (Corrigida - Validação de tipos)
// Garante que bling_contact_id seja um número válido

try {
  console.log('=== ATUALIZAR ESTATÍSTICAS DO LEAD V3 ===');
  
  const orderData = $('Buscar Detalhes do Pedido').item.json.data;
  
  if (!orderData) {
    throw new Error('Dados do pedido não encontrados');
  }
  
  console.log('Order ID:', orderData.id);
  console.log('Order Total:', orderData.total);
  console.log('Order Date:', orderData.data);
  
  // Pegar bling_contact_id do nó "Processar Dados do Lead"
  const blingContactIdRaw = $('Processar Dados do Lead').item.json.bling_contact_id;
  
  // VALIDAR que bling_contact_id é um número válido
  const bling_contact_id = parseInt(blingContactIdRaw);
  
  if (!bling_contact_id || isNaN(bling_contact_id)) {
    throw new Error(`bling_contact_id inválido: ${blingContactIdRaw}`);
  }
  
  console.log('Bling Contact ID (validado):', bling_contact_id);
  
  // Tentar pegar dados do lead existente
  let leadData = null;
  
  try {
    leadData = $('Buscar Lead Existente').item.json;
  } catch (e) {
    console.log('Lead não encontrado no nó anterior, usando valores padrão');
  }
  
  // Se não encontrou dados do lead, usar valores padrão (lead novo)
  const currentTotalOrders = parseInt(leadData?.total_orders || 0);
  const currentTotalSpent = parseFloat(leadData?.total_spent || 0);
  const orderTotal = parseFloat(orderData.total || 0);
  const orderDate = orderData.data;
  
  const newTotalOrders = currentTotalOrders + 1;
  const newTotalSpent = currentTotalSpent + orderTotal;
  
  // Atualizar datas de primeiro e último pedido
  let firstOrderDate = leadData?.first_order_date;
  let lastOrderDate = leadData?.last_order_date;
  
  if (!firstOrderDate) {
    firstOrderDate = orderDate;
  } else {
    if (new Date(orderDate) < new Date(firstOrderDate)) {
      firstOrderDate = orderDate;
    }
  }
  
  if (!lastOrderDate) {
    lastOrderDate = orderDate;
  } else {
    if (new Date(orderDate) > new Date(lastOrderDate)) {
      lastOrderDate = orderDate;
    }
  }
  
  // Preparar dados de atualização
  const updateData = {
    bling_contact_id: bling_contact_id, // Garantido como número
    total_orders: newTotalOrders,
    total_spent: newTotalSpent,
    first_order_date: firstOrderDate,
    last_order_date: lastOrderDate,
    lead_status: 'customer',
    updated_at: new Date().toISOString()
  };
  
  console.log('Statistics updated:', updateData);
  
  return { json: updateData };
  
} catch (error) {
  console.error('ERRO ao atualizar estatísticas:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}
```

### 2. Corrigir o nó "Salvar Estatísticas no Banco1"

No N8N, abra o nó "Salvar Estatísticas no Banco1" e verifique:

#### Seção "Filters" (Match):
- Campo: `bling_contact_id`
- Operador: `equals`
- Valor: `={{ $json.bling_contact_id }}` ⚠️ **IMPORTANTE: Tem que começar com `=`**

#### Seção "Fields to Update":
Todos os campos devem começar com `=`:

- `total_orders` = `={{ $json.total_orders }}`
- `total_spent` = `={{ $json.total_spent }}`
- `first_order_date` = `={{ $json.first_order_date }}`
- `last_order_date` = `={{ $json.last_order_date }}`
- `lead_status` = `={{ $json.lead_status }}`
- `updated_at` = `={{ $json.updated_at }}`

### 3. Testar o workflow

1. Execute o workflow com um pedido de teste
2. Verifique os logs do nó "Atualizar Estatísticas do Lead1"
3. Confirme que `bling_contact_id` é um número válido
4. Verifique se o lead foi atualizado no banco:

```sql
SELECT 
  bling_contact_id,
  name,
  total_orders,
  total_spent,
  first_order_date,
  last_order_date,
  lead_status
FROM leads 
ORDER BY updated_at DESC 
LIMIT 5;
```

## Mudanças na Versão 3

1. ✅ Validação explícita de `bling_contact_id` como número
2. ✅ Conversão com `parseInt()` para garantir tipo correto
3. ✅ Erro claro se o ID for inválido
4. ✅ Log do ID validado para debug

## Próximos Passos

Após corrigir:
1. Deletar nós duplicados (com "1" no final)
2. Renomear os nós corretos removendo o "1"
3. Testar o fluxo completo
4. Verificar dados no banco
