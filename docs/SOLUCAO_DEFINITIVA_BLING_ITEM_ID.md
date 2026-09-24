# Solução Definitiva: bling_item_id NULL

## Problema Confirmado

O erro continua porque:

1. ❌ O workflow no n8n tem nós diferentes do arquivo (`Inserir item do pedido2` vs `Inserir item do pedido1`)
2. ❌ Isso significa que a importação não está sobrescrevendo o workflow antigo
3. ❌ O n8n pode estar usando uma versão em cache

## Solução: Deletar e Reimportar

### Passo 1: Deletar o Workflow Antigo

1. Abra o n8n
2. Vá em **Workflows**
3. Encontre "Bling Pedido de Venda Automatization"
4. Clique em **⋮** (três pontos)
5. Clique em **Delete**
6. Confirme a exclusão

### Passo 2: Importar o Workflow Novo

1. No n8n, clique em **+ Add workflow**
2. Clique em **⋮** (três pontos no canto superior direito)
3. Clique em **Import from File**
4. Selecione: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
5. **Salve** o workflow

### Passo 3: Reconfigurar o Webhook (se necessário)

1. Abra o nó "Webhook Bling"
2. Copie a URL do webhook
3. Verifique se é a mesma URL configurada no Bling
4. Se for diferente, atualize no Bling

## Alternativa: Corrigir Manualmente no n8n

Se não quiser deletar o workflow, corrija manualmente:

### 1. Abra o nó "Preparar dados do item1" (ou "Preparar dados do item2")

### 2. Substitua o código JavaScript por este:

```javascript
try {
  // CORREÇÃO: Processar TODOS os produtos que vêm do nó anterior
  const allProductsFromDB = $input.all();
  console.log('=== DEBUG PREPARAR DADOS DO ITEM ===');
  console.log('Total de produtos do banco:', allProductsFromDB.length);

  const todosItens = $('Preparar Itens do pedido').all();
  console.log('Total de itens do pedido:', todosItens.length);
  console.log('SKUs dos itens do pedido:', todosItens.map(item => item.json.codigo));

  // Buscar o order_id (UUID) - pode vir de INSERT ou UPDATE
  let orderId = null;

  try {
    if ($('Inserir Pedido').isExecuted) {
      orderId = $('Inserir Pedido').first().json.id;
      console.log('Order ID do INSERT:', orderId);
    }
  } catch (e) {
    console.log('Inserir Pedido não executado:', e.message);
  }

  try {
    if (!orderId && $('Atualizar Pedido').isExecuted) {
      orderId = $('Atualizar Pedido').first().json.id;
      console.log('Order ID do UPDATE:', orderId);
    }
  } catch (e) {
    console.log('Atualizar Pedido não executado:', e.message);
  }

  if (!orderId) {
    console.error('ERRO CRÍTICO: order_id não encontrado!');
    throw new Error('order_id não encontrado - pedido não foi inserido/atualizado');
  }

  // Processar CADA produto e criar um item para inserir
  const itemsToInsert = [];

  for (const productNode of allProductsFromDB) {
    const productFromDB = productNode.json;
    const productSKU = productFromDB.sku;

    console.log('Processando SKU:', productSKU);

    // Buscar o item do pedido que tem esse SKU
    const itemDoPedido = todosItens.find(item => item.json.codigo === productSKU)?.json;

    if (!itemDoPedido) {
      console.error('ERRO: Item não encontrado para SKU:', productSKU);
      continue;
    }

    console.log('Item do pedido encontrado:', itemDoPedido);

    // Detectar se é variação ou produto PAI
    const isVariation = !!productFromDB.product_bling_id;
    const productBlingId = isVariation ? null : (productFromDB?.id || null);
    const productVariationId = isVariation ? (productFromDB?.id || null) : null;
    
    console.log('É variação?', isVariation);
    console.log('product_bling_id:', productBlingId);
    console.log('product_variation_id:', productVariationId);
    
    // ===== CORREÇÃO PRINCIPAL: FALLBACK PARA bling_item_id =====
    let blingItemId = null;
    
    if (itemDoPedido.id) {
      // Caso ideal: usar o ID do Bling
      blingItemId = parseInt(itemDoPedido.id);
      console.log('✅ bling_item_id do Bling:', blingItemId);
    } else {
      // Fallback: gerar ID baseado no código do produto
      console.warn('⚠️ AVISO: item sem ID do Bling, gerando ID baseado no código:', itemDoPedido.codigo);
      
      // Hash simples do código
      const hashCode = itemDoPedido.codigo.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      blingItemId = Math.abs(hashCode);
      console.log('✅ bling_item_id gerado:', blingItemId);
    }

    console.log('bling_item_id final:', blingItemId, 'tipo:', typeof blingItemId);
    console.log('itemDoPedido.id original:', itemDoPedido.id);
    console.log('itemDoPedido.codigo:', itemDoPedido.codigo);

    if (!blingItemId || blingItemId === 0) {
      console.error('❌ ERRO: bling_item_id inválido para SKU:', productSKU);
      console.error('itemDoPedido completo:', JSON.stringify(itemDoPedido, null, 2));
      continue;
    }
    // ===== FIM DA CORREÇÃO =====

    const quantidade = parseFloat(itemDoPedido.quantidade) || 0;
    const valor = parseFloat(itemDoPedido.valor) || 0;
    const desconto = parseFloat(itemDoPedido.desconto) || 0;
    const totalValue = (quantidade * valor) - desconto;

    console.log('Valores calculados para', productSKU, ':', {
      quantidade,
      valor,
      desconto,
      totalValue
    });

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

  if (itemsToInsert.length === 0) {
    console.error('AVISO: Nenhum item foi preparado!');
  }

  return itemsToInsert;
} catch (error) {
  console.error('ERRO CAPTURADO:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}
```

### 3. Salve o workflow

### 4. Teste clonando uma venda no Bling

## Por Que o Erro Continua?

### Teoria 1: Cache do n8n
O n8n pode estar usando uma versão em cache do workflow. Deletar e reimportar resolve isso.

### Teoria 2: Workflow Diferente
O workflow no n8n tem nós com nomes diferentes (`Inserir item do pedido2` vs `Inserir item do pedido1`), indicando que é uma versão diferente.

### Teoria 3: Importação Parcial
A importação pode não estar sobrescrevendo todos os nós, apenas adicionando novos.

## Verificação

Após deletar e reimportar, verifique:

1. ✅ O nó se chama "Inserir item do pedido1" (não "2")
2. ✅ O nó "Preparar dados do item1" tem o código com fallback
3. ✅ Não há nós duplicados (sem "2" no final)

## Teste Final

1. Clone uma venda no Bling
2. Abra o nó "Preparar dados do item1" no n8n
3. Veja os logs - deve aparecer:

```
⚠️ AVISO: item sem ID do Bling, gerando ID baseado no código: YEIZ_IDP248
✅ bling_item_id gerado: 1234567890
```

4. Verifique na página de vendas:
   - ✅ Badge Shopee
   - ✅ **Itens: 1**
   - ✅ **Imagem do produto**

---

**IMPORTANTE**: Se o erro continuar após deletar e reimportar, o problema pode estar em outro lugar. Nesse caso, precisaremos investigar:
- A estrutura de dados que o Bling está retornando
- Se há algum middleware ou transformação antes do nó
- Se o campo `bling_item_id` está sendo sobrescrito em algum lugar
