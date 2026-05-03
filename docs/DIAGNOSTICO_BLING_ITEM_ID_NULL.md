# Diagnóstico: bling_item_id NULL - Workflow Correto mas Erro Persiste

## 🔍 Situação Atual

✅ **Workflow no n8n TEM o código de fallback correto**
❌ **Erro continua acontecendo**: `null value in column "bling_item_id"`

## 🎯 Causa Raiz Identificada

O problema NÃO é a falta do código de fallback. O código está correto no nó "Preparar dados do item2":

```javascript
// Fallback: usar um hash do código como ID temporário
if (itemDoPedido.id) {
  blingItemId = parseInt(itemDoPedido.id);
} else {
  const hashCode = itemDoPedido.codigo.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  blingItemId = Math.abs(hashCode);
}
```

## 🐛 Possíveis Causas do Erro

### 1. **O item não tem `codigo` (SKU)**
Se `itemDoPedido.codigo` for `null` ou `undefined`, o hash vai falhar.

### 2. **O hash está gerando 0**
Se o código for vazio ou inválido, `Math.abs(hashCode)` pode retornar 0.

### 3. **O nó está sendo pulado**
O nó "Preparar dados do item2" pode não estar sendo executado para todos os itens.

### 4. **Erro no nó anterior**
O nó "Buscar Produto por SKU2" pode estar retornando vazio, fazendo o workflow pular o "Preparar dados do item2".

## 🔧 Solução: Adicionar Validação Extra

### Passo 1: Abrir o n8n

1. Acesse: https://hookn8n.alobexpress.com.br/
2. Abra o workflow "Bling Pedido de Venda Automatization"

### Passo 2: Editar o nó "Preparar dados do item2"

1. Clique no nó "Preparar dados do item2"
2. Substitua o código JavaScript por este (com validação extra):

```javascript
try {
  const allProductsFromDB = $input.all();
  console.log('=== DEBUG PREPARAR DADOS DO ITEM ===');
  console.log('Total de produtos do banco:', allProductsFromDB.length);

  const todosItens = $('Preparar Itens do pedido2').all();
  console.log('Total de itens do pedido:', todosItens.length);

  // Buscar o order_id (UUID)
  let orderId = null;

  try {
    if ($('Inserir Pedido2').isExecuted) {
      orderId = $('Inserir Pedido2').first().json.id;
    }
  } catch (e) {
    console.log('Inserir Pedido2 não executado');
  }

  try {
    if (!orderId && $('Atualizar Pedido2').isExecuted) {
      orderId = $('Atualizar Pedido2').first().json.id;
    }
  } catch (e) {
    console.log('Atualizar Pedido2 não executado');
  }

  if (!orderId) {
    throw new Error('order_id não encontrado');
  }

  const itemsToInsert = [];

  for (const productNode of allProductsFromDB) {
    const productFromDB = productNode.json;
    const productSKU = productFromDB.sku;

    console.log('Processando SKU:', productSKU);

    const itemDoPedido = todosItens.find(item => item.json.codigo === productSKU)?.json;

    if (!itemDoPedido) {
      console.error('ERRO: Item não encontrado para SKU:', productSKU);
      continue;
    }

    const isVariation = !!productFromDB.product_bling_id;
    const productBlingId = isVariation ? null : (productFromDB?.id || null);
    const productVariationId = isVariation ? (productFromDB?.id || null) : null;
    
    // ===== CORREÇÃO COM VALIDAÇÃO EXTRA =====
    let blingItemId = null;
    
    if (itemDoPedido.id) {
      blingItemId = parseInt(itemDoPedido.id);
      console.log('✅ bling_item_id do Bling:', blingItemId);
    } else {
      // Fallback: gerar ID baseado no código
      console.warn('⚠️ AVISO: item sem ID do Bling');
      console.warn('   - itemDoPedido.codigo:', itemDoPedido.codigo);
      console.warn('   - tipo:', typeof itemDoPedido.codigo);
      
      // VALIDAÇÃO: verificar se o código existe e não é vazio
      if (!itemDoPedido.codigo || itemDoPedido.codigo.trim() === '') {
        console.error('❌ ERRO CRÍTICO: código do produto está vazio!');
        console.error('   - itemDoPedido completo:', JSON.stringify(itemDoPedido, null, 2));
        
        // Usar um ID temporário baseado no timestamp + índice
        blingItemId = Date.now() + Math.floor(Math.random() * 1000);
        console.warn('⚠️ Usando ID temporário:', blingItemId);
      } else {
        // Hash do código
        const hashCode = itemDoPedido.codigo.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        blingItemId = Math.abs(hashCode);
        
        // VALIDAÇÃO: se o hash for 0, usar timestamp
        if (blingItemId === 0) {
          console.warn('⚠️ Hash gerou 0, usando timestamp');
          blingItemId = Date.now() + Math.floor(Math.random() * 1000);
        }
        
        console.log('✅ bling_item_id gerado:', blingItemId);
      }
    }

    console.log('bling_item_id final:', blingItemId, 'tipo:', typeof blingItemId);

    // VALIDAÇÃO FINAL: garantir que não é null, undefined ou 0
    if (!blingItemId || blingItemId === 0) {
      console.error('❌ ERRO: bling_item_id inválido após todas as tentativas');
      console.error('   - Usando ID de emergência baseado em timestamp');
      blingItemId = Date.now() + Math.floor(Math.random() * 1000);
    }
    // ===== FIM DA CORREÇÃO =====

    const quantidade = parseFloat(itemDoPedido.quantidade) || 0;
    const valor = parseFloat(itemDoPedido.valor) || 0;
    const desconto = parseFloat(itemDoPedido.desconto) || 0;
    const totalValue = (quantidade * valor) - desconto;

    itemsToInsert.push({
      json: {
        order_id: orderId,
        bling_item_id: blingItemId,
        product_bling_id: productBlingId,
        product_variation_id: productVariationId,
        product_id: null,
        code: itemDoPedido.codigo || null,
        description: itemDoPedido.descricao || 'Sem descrição',
        detailed_description: itemDoPedido.descricaoDetalhada || null,
        unit: itemDoPedido.unidade || 'UN',
        quantity: quantidade,
        unit_value: valor,
        discount: desconto,
        total_value: totalValue,
        ipi_rate: parseFloat(itemDoPedido.aliquotaIPI) || 0,
        commission_base: parseFloat(itemDoPedido.comissao?.base) || 0,
        commission_rate: parseFloat(itemDoPedido.comissao?.aliquota) || 0,
        commission_value: parseFloat(itemDoPedido.comissao?.valor) || 0,
        operation_nature_id: itemDoPedido.naturezaOperacao?.id || null
      }
    });
  }

  console.log('Total de itens preparados:', itemsToInsert.length);
  console.log('=============');

  return itemsToInsert;
} catch (error) {
  console.error('ERRO CAPTURADO:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}
```

### Passo 3: Salvar e Testar

1. Clique em **Save** no n8n
2. Clone uma venda no Bling
3. Verifique os logs no n8n (clique no nó "Preparar dados do item2" e veja a aba "Output")

## 📊 O Que Mudou?

### Validações Adicionadas:

1. ✅ **Verifica se o código existe e não é vazio**
2. ✅ **Se o hash gerar 0, usa timestamp**
3. ✅ **Validação final: se ainda for null/0, usa ID de emergência**
4. ✅ **Logs detalhados para debug**

### Fallback de Emergência:

Se tudo falhar, o código agora usa:
```javascript
blingItemId = Date.now() + Math.floor(Math.random() * 1000);
```

Isso garante que **SEMPRE** haverá um ID válido, mesmo em casos extremos.

## 🧪 Teste

Após salvar, clone uma venda no Bling e verifique:

1. **Logs no n8n** - deve aparecer:
   ```
   ✅ bling_item_id gerado: 1715012345678
   bling_item_id final: 1715012345678 tipo: number
   ```

2. **Página de vendas** - deve mostrar:
   - ✅ Badge Shopee
   - ✅ **Itens: 1** (ou mais)
   - ✅ **Imagem do produto**

## 🚨 Se o Erro Continuar

Se mesmo com essas validações o erro persistir, o problema está em outro lugar:

1. **O nó "Preparar dados do item2" não está sendo executado**
   - Verifique se o fluxo está passando por ele
   - Verifique se há erros nos nós anteriores

2. **O valor está sendo sobrescrito depois**
   - Verifique o nó "Inserir item do pedido2"
   - Verifique se há alguma transformação entre os nós

3. **Problema no banco de dados**
   - Verifique se a coluna `bling_item_id` aceita valores grandes (BIGINT)
   - Verifique se há triggers ou constraints no banco

## 📞 Próximos Passos

1. **Aplique a correção acima**
2. **Teste clonando uma venda**
3. **Me envie os logs do nó "Preparar dados do item2"**
4. **Me diga se o erro continua ou se foi resolvido**

---

**Data**: 2026-05-03
**Workflow ID**: HS7I2uyLhdySlzEC
**Nó Afetado**: Preparar dados do item2
