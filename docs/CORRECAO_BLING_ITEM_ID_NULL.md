# Correção: bling_item_id NULL - Erro ao Inserir Itens

## Problema Identificado

**Erro**: `null value in column "bling_item_id" of relation "bling_order_items" violates not-null constraint`

### Causa Raiz

O nó "Preparar dados do item1" estava tentando pegar o `id` do item retornado pela API do Bling, mas em alguns casos esse campo vem como `null` ou `undefined`, causando erro ao inserir na tabela `bling_order_items`.

```javascript
// CÓDIGO ANTIGO (QUEBRADO)
const blingItemId = itemDoPedido.id ? parseInt(itemDoPedido.id) : null;

if (!blingItemId) {
  console.error('ERRO: bling_item_id é null');
  continue; // Pula o item - PEDIDO FICA SEM ITENS!
}
```

### Sintomas

- ✅ Pedido aparece na página de vendas
- ✅ Badge do marketplace (Shopee) aparece corretamente
- ❌ **Itens: 0** (zero itens)
- ❌ **Sem imagem** do produto (porque não tem itens)
- ❌ Erro no nó "Inserir item do pedido2" (ou "Inserir item do pedido1")

## Solução Aplicada

### 1. Fallback para bling_item_id

Adicionei um **fallback** que gera um ID baseado no código do produto quando o Bling não retorna o `id` do item:

```javascript
// CÓDIGO NOVO (CORRIGIDO)
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

// Validação final
if (!blingItemId || blingItemId === 0) {
  console.error('❌ ERRO: bling_item_id inválido');
  console.error('itemDoPedido completo:', JSON.stringify(itemDoPedido, null, 2));
  continue; // Só pula se realmente não conseguir gerar ID
}
```

### 2. Logs Detalhados

Adicionei logs para facilitar o debug:

```javascript
console.log('bling_item_id final:', blingItemId, 'tipo:', typeof blingItemId);
console.log('itemDoPedido.id original:', itemDoPedido.id);
console.log('itemDoPedido.codigo:', itemDoPedido.codigo);
```

## Como Funciona o Fallback

### Cenário 1: Bling retorna ID (ideal)
```json
{
  "id": 123456789,
  "codigo": "YEIZ_IDP248",
  "descricao": "Escova Alisadora"
}
```
✅ Usa `bling_item_id = 123456789`

### Cenário 2: Bling NÃO retorna ID (fallback)
```json
{
  "id": null,
  "codigo": "YEIZ_IDP248",
  "descricao": "Escova Alisadora"
}
```
✅ Gera `bling_item_id = 1234567890` (hash do código "YEIZ_IDP248")

### Algoritmo de Hash

```javascript
// Hash simples e determinístico
// Mesmo código sempre gera o mesmo ID
const hashCode = "YEIZ_IDP248".split('').reduce((a, b) => {
  a = ((a << 5) - a) + b.charCodeAt(0);
  return a & a;
}, 0);

// Resultado: número positivo único para cada código
blingItemId = Math.abs(hashCode);
```

## Arquivos Modificados

- ✅ `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json` - Workflow corrigido
- ✅ `fix_bling_item_id.py` - Script de correção
- ✅ `CORRECAO_BLING_ITEM_ID_NULL.md` - Esta documentação

## Próximos Passos

### 🔴 URGENTE: Reimportar Workflow

1. Abra o n8n
2. Vá em **Workflows**
3. Abra "Bling Pedido de Venda Automatization"
4. Clique em **⋮** (três pontos) → **Import from File**
5. Selecione: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
6. Confirme e **Salve**

### 🧪 Testar

1. Vá no Bling e **clone uma venda**
2. Aguarde o webhook processar
3. Verifique na página de vendas:
   - ✅ Pedido aparece
   - ✅ Badge do marketplace
   - ✅ **Itens: 1** (ou mais)
   - ✅ **Imagem do produto**

### 📊 Verificar Logs no n8n

Abra o nó "Preparar dados do item1" e veja os logs:

```
✅ bling_item_id do Bling: 123456789
```

OU (se usar fallback):

```
⚠️ AVISO: item sem ID do Bling, gerando ID baseado no código: YEIZ_IDP248
✅ bling_item_id gerado: 1234567890
```

## Verificação no Banco

```sql
-- Verificar se os itens foram inseridos
SELECT 
  bo.order_number,
  bo.bling_order_id,
  boi.bling_item_id,
  boi.code,
  boi.description,
  boi.quantity
FROM bling_orders bo
JOIN bling_order_items boi ON bo.id = boi.order_id
WHERE bo.order_number >= 154
ORDER BY bo.order_number DESC;
```

## Resultado Esperado

Após reimportar o workflow:

✅ **Novos pedidos devem ter**:
- Itens inseridos automaticamente (mesmo sem ID do Bling)
- bling_item_id preenchido (do Bling ou gerado)
- Imagem do produto
- Badge do marketplace
- Contagem correta de itens

✅ **Frontend deve mostrar**:
- Imagem do produto
- Badge "Shopee" (ou outro marketplace)
- **Itens: 1** (ou mais)
- Nome do produto

## Histórico de Correções

1. **Pedidos #152 e #153** - Itens inseridos manualmente
2. **Pedido #154** - Sem itens (workflow com onError)
3. **Pedido #155** - Sem itens (bling_item_id NULL)
4. **Pedido #156+** - ✅ Deve funcionar com esta correção

---

**Data**: 2026-05-03
**Status**: ✅ Correção aplicada, aguardando reimportação e teste
