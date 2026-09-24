# Correção do Pedido #154 - Workflow n8n Corrigido

## Problema Identificado

O pedido #154 (bling_order_id: 25709455272) da Shopee foi criado **SEM ITENS** porque o workflow n8n ainda tinha configurações incorretas de `onError`.

## Status Atual

### ✅ Workflow Corrigido
- **Arquivo**: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
- **Correções Aplicadas**:
  - ✅ Removido `onError` de 23 nós (estava causando inversão do fluxo)
  - ✅ Adicionado `alwaysOutputData: true` em 8 nós críticos de busca

### ❌ Pedido #154 Sem Itens
- **Order Number**: 154
- **Bling Order ID**: 25709455272
- **Marketplace**: Shopee
- **Canal**: Shopee Conta 2
- **Items Count**: 0 (ZERO!)
- **Imagem**: null (porque não tem itens)
- **Badge Shopee**: Aparece corretamente (marketplace_name = "Shopee")

## Causa Raiz

O workflow tinha `onError: "continueRegularOutput"` em 23 nós, o que invertia o fluxo:
- ✅ Sucesso → Ia para saída de ERRO (índice 1)
- ❌ Erro → Ia para saída PRINCIPAL (índice 0)

Isso fazia o workflow parar quando deveria continuar, e continuar quando deveria parar.

## Solução Aplicada

### 1. Workflow Corrigido ✅

Executamos o script `fix_workflow_complete.py` que:

```python
# Removeu onError de TODOS os nós
if 'onError' in node:
    del node['onError']

# Adicionou alwaysOutputData nos nós de busca
nodes_need_always_output = [
    'Buscar Canal',
    'Buscar Produto por SKU1',
    'Buscar Produto por SKU2',
    'Buscar em Products Bling (Fallback)1',
    'Pegar order_id1',
    'Buscar Lead Existente1',
    'Buscar Contato no Bling1',
    'Buscar Detalhes do Pedido'
]
```

### 2. Nós Corrigidos

**23 nós tiveram `onError` removido**:
- Schedule Refresh Token
- Registrar Log de Sucesso1
- Registrar Log de Erro (vários)
- Deletar Pedido
- Get many rows1
- Deletar produto associado ao pedido
- Log Erro Buscar Detalhes1
- Log Warning Canal

**8 nós receberam `alwaysOutputData: true`**:
- Buscar Canal
- Buscar Produto por SKU1
- Buscar Produto por SKU2
- Buscar em Products Bling (Fallback)1
- Pegar order_id1
- Buscar Lead Existente1
- Buscar Contato no Bling1
- Buscar Detalhes do Pedido

## Próximos Passos

### 🔴 URGENTE: Reimportar Workflow no n8n

**O usuário DEVE reimportar o workflow corrigido no n8n:**

1. Abrir n8n
2. Ir em **Workflows**
3. Abrir o workflow "Bling Pedido de Venda Automatization"
4. Clicar em **⋮** (três pontos) → **Import from File**
5. Selecionar: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
6. Confirmar a importação
7. **Salvar** o workflow

### 📝 Inserir Itens do Pedido #154 Manualmente

Como o pedido #154 já foi criado sem itens, precisamos:

1. **Buscar os detalhes do pedido no Bling** (via API)
2. **Identificar o produto** pelo SKU
3. **Inserir os itens** na tabela `bling_order_items`

**OU**

Aguardar um novo pedido para testar o workflow corrigido.

## Verificação

Após reimportar o workflow, testar com um novo pedido:

```sql
-- Verificar se o novo pedido tem itens
SELECT 
  bo.bling_order_id,
  bo.order_number,
  COUNT(boi.id) as items_count,
  m.name as marketplace_name,
  sc.name as channel_name
FROM bling_orders bo
LEFT JOIN bling_order_items boi ON bo.id = boi.order_id
LEFT JOIN leads l ON bo.lead_id = l.id
LEFT JOIN marketplaces m ON l.marketplace_id = m.id
LEFT JOIN sales_channels sc ON bo.sales_channel_id = sc.id
WHERE bo.order_number >= 154
GROUP BY bo.bling_order_id, bo.order_number, m.name, sc.name
ORDER BY bo.order_number DESC;
```

## Resultado Esperado

Após reimportar o workflow corrigido:

✅ **Novos pedidos devem ter**:
- Itens inseridos automaticamente
- Imagem do produto (first_product_image)
- Badge do marketplace (Shopee, TikTok, etc)
- Contagem correta de itens

✅ **Frontend deve mostrar**:
- Imagem do produto
- Badge "Shopee" (ou outro marketplace)
- Número de itens
- Nome do produto

## Arquivos Modificados

- ✅ `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json` - Workflow corrigido
- ✅ `fix_workflow_complete.py` - Script de correção atualizado
- ✅ `CORRECAO_PEDIDO_154.md` - Esta documentação

## Histórico de Correções

1. **Pedidos #152 e #153** - Corrigidos manualmente (itens inseridos via SQL)
2. **Pedido #154** - Criado após "importação" do workflow, mas usuário importou versão antiga
3. **Workflow** - Corrigido completamente (23 nós com onError removido)

---

**Data**: 2026-05-03
**Status**: ✅ Workflow corrigido, aguardando reimportação pelo usuário
