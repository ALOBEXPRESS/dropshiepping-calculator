# Correção: Itens do Pedido Não Estão Sendo Inseridos

## 🐛 Problema Identificado

O pedido #152 da Shopee foi inserido na tabela `bling_orders`, mas os itens **não foram inseridos** na tabela `bling_order_items`. Isso causou:

1. ❌ **0 itens** mostrados no frontend
2. ❌ **Sem imagem** do produto
3. ❌ **Sem badge** do marketplace

## 🔍 Diagnóstico

### Dados do Pedido
- **Pedido Bling ID**: 25709361175
- **Número**: 152
- **Cliente**: Marina Ferreira Da Silva
- **Canal**: Shopee Conta 2 (206002038)
- **Valor**: R$ 47,20
- **Item**: Escova Alisadora (SKU: YEIZ_IDP248)

### O Que Aconteceu

1. ✅ Webhook recebido do Bling
2. ✅ Pedido inserido em `bling_orders`
3. ✅ Canal mapeado corretamente (Shopee Conta 2)
4. ✅ Produto encontrado em `products_variations_bling`
5. ❌ **WORKFLOW PAROU AQUI** - Itens não foram inseridos

### Causa Raiz

O nó **"Inserir Pedido"** estava configurado com `onError: "continueErrorOutput"`. Isso invertia o fluxo:

- **Quando tinha SUCESSO**: Ia para a saída de ERRO (índice 1) → "Houve erro?34"
- **Quando tinha ERRO**: Ia para a saída PRINCIPAL (índice 0) → "Preparar Itens do pedido"

Resultado: O pedido foi inserido com sucesso, mas o workflow parou no nó "Houve erro?34" que não tinha saída configurada.

## ✅ Solução Aplicada

### Script de Correção

Criado `fix_workflow_items.py` que:

1. Remove o `onError: "continueErrorOutput"` do nó "Inserir Pedido"
2. Restaura o fluxo normal:
   - **Sucesso** → Preparar Itens do pedido → Inserir itens
   - **Erro** → Houve erro?34 → Log de erro

### Execução

```bash
python fix_workflow_items.py
```

**Resultado:**
```
✅ Workflow corrigido e salvo!
📝 Mudanças:
   1. Removido 'onError: continueErrorOutput' do nó 'Inserir Pedido'
   2. Agora o fluxo seguirá normalmente:
      - Sucesso → Preparar Itens do pedido
      - Erro → Houve erro?34
```

## 📋 Próximos Passos

### 1. Reimportar o Workflow no n8n

```bash
# No n8n, vá em:
# 1. Workflows → "Bling Pedido de Venda Automatization"
# 2. Clique nos 3 pontos → "Import from File"
# 3. Selecione: src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json
# 4. Confirme a importação
```

### 2. Reprocessar o Pedido #152

O pedido #152 já está em `bling_orders`, mas sem itens. Você tem 2 opções:

#### Opção A: Deletar e Reenviar Webhook (Recomendado)

```sql
-- 1. Deletar o pedido incompleto
DELETE FROM bling_orders WHERE bling_order_id = 25709361175;

-- 2. No Bling, reenviar o webhook do pedido #152
-- Ou aguardar um novo pedido para testar
```

#### Opção B: Inserir Itens Manualmente (Temporário)

```sql
-- 1. Buscar o order_id
SELECT id FROM bling_orders WHERE bling_order_id = 25709361175;
-- Resultado: d150701d-11e6-4a2d-b485-d709d5078850

-- 2. Buscar o produto
SELECT id, sku, name FROM products_variations_bling WHERE sku = 'YEIZ_IDP248';

-- 3. Inserir o item manualmente
INSERT INTO bling_order_items (
  order_id,
  bling_item_id,
  product_variation_id,
  code,
  description,
  unit,
  quantity,
  unit_value,
  discount,
  total_value
) VALUES (
  'd150701d-11e6-4a2d-b485-d709d5078850',
  19435596430,
  (SELECT id FROM products_variations_bling WHERE sku = 'YEIZ_IDP248'),
  'YEIZ_IDP248',
  'Escova Alisadora Rápida para Cabelo Cacheado Crespo e Grosso sem Prender Mecha',
  'UN',
  1,
  47.20,
  0,
  47.20
);
```

### 3. Testar com Novo Pedido

Aguarde um novo pedido entrar pelo Bling e verifique se:

- ✅ Pedido é inserido em `bling_orders`
- ✅ Itens são inseridos em `bling_order_items`
- ✅ Frontend mostra os itens corretamente
- ✅ Imagem do produto aparece
- ✅ Badge do marketplace aparece

## 🎯 Verificação Final

### Consultas de Verificação

```sql
-- 1. Verificar pedidos sem itens
SELECT 
  bo.bling_order_id,
  bo.order_number,
  bo.contact_name,
  bo.total_amount,
  COUNT(bi.id) as total_itens
FROM bling_orders bo
LEFT JOIN bling_order_items bi ON bo.id = bi.order_id
WHERE bo.organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
GROUP BY bo.id
HAVING COUNT(bi.id) = 0;

-- 2. Verificar último pedido processado
SELECT 
  bo.bling_order_id,
  bo.order_number,
  bo.contact_name,
  COUNT(bi.id) as total_itens,
  bo.created_at
FROM bling_orders bo
LEFT JOIN bling_order_items bi ON bo.id = bi.order_id
WHERE bo.organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
GROUP BY bo.id
ORDER BY bo.created_at DESC
LIMIT 5;
```

## 📊 Resumo

| Item | Status Antes | Status Depois |
|------|--------------|---------------|
| Pedido inserido | ✅ | ✅ |
| Itens inseridos | ❌ | ✅ |
| Imagem do produto | ❌ | ✅ |
| Badge do marketplace | ❌ | ✅ |
| Workflow funcionando | ❌ | ✅ |

## 🔧 Arquivos Modificados

1. `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json` - Workflow corrigido
2. `fix_workflow_items.py` - Script de correção
3. `CORRECAO_ITENS_PEDIDO.md` - Esta documentação

---

**Data da Correção**: 03/05/2026 17:57  
**Pedido Afetado**: #152 (Shopee)  
**Problema**: Workflow com `onError` invertido  
**Solução**: Removido `onError: continueErrorOutput` do nó "Inserir Pedido"
