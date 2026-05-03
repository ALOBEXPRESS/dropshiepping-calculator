# Correção: Fluxo UPDATE não deletava itens antigos

## Problema Identificado

Quando você atualizava um pedido no Bling (adicionando ou removendo produtos), o workflow:
- ✅ Atualizava corretamente a tabela `bling_orders`
- ❌ **NÃO deletava** os itens antigos da tabela `bling_order_items`
- ❌ Apenas inseria os novos itens, causando duplicação

**Resultado:** A cada UPDATE, os itens eram duplicados na tabela `bling_order_items`.

## Causa Raiz

O fluxo de UPDATE estava conectado assim:

```
Atualizar Pedido → Preparar Itens do pedido → (loop) → Inserir item do pedido1
```

Não havia nenhum nó para deletar os itens antigos antes de inserir os novos.

## Solução Implementada

Adicionei o nó "Deletar Itens Antigos" entre "Atualizar Pedido" e "Preparar Itens do pedido":

### Novo Fluxo UPDATE:

```
Atualizar Pedido
    ↓
Deletar Itens Antigos (NOVO NÓ)
    ↓
Preparar Itens do pedido
    ↓
Loop pelos itens
    ↓
Inserir item do pedido1
```

### Configuração do Nó "Deletar Itens Antigos"

```json
{
  "name": "Deletar Itens Antigos",
  "type": "n8n-nodes-base.supabase",
  "operation": "delete",
  "tableId": "bling_order_items",
  "filters": {
    "conditions": [
      {
        "keyName": "order_id",
        "condition": "eq",
        "keyValue": "={{ $('Atualizar Pedido').item.json.id }}"
      }
    ]
  }
}
```

**O que faz:**
- Deleta TODOS os itens da tabela `bling_order_items` que pertencem ao pedido atualizado
- Usa o `order_id` (UUID) retornado pelo nó "Atualizar Pedido"
- Depois disso, o fluxo continua normalmente e insere os novos itens

## Fluxos Completos

### CREATE (não mudou):
```
Inserir Pedido
    ↓
Preparar Itens do pedido
    ↓
Loop pelos itens
    ↓
Inserir item do pedido1
```

### UPDATE (corrigido):
```
Atualizar Pedido
    ↓
Deletar Itens Antigos ← NOVO
    ↓
Preparar Itens do pedido
    ↓
Loop pelos itens
    ↓
Inserir item do pedido1
```

### DELETE (não mudou):
```
Get many rows1
    ↓
Deletar Pedido (bling_orders)
    ↓
Deletar Pedido  (bling_order_items) ← Já existia
    ↓
Registrar Log
```

## Teste

1. Crie um pedido com 2 produtos
2. Verifique que tem 2 registros em `bling_order_items`
3. Atualize o pedido no Bling (adicione 1 produto)
4. Verifique que tem 3 registros (não 5)
5. Atualize novamente (remova 1 produto)
6. Verifique que tem 2 registros (não 8)

## Arquivos Modificados

- `src/hooks/n8n/Bling Pedido de Venda Automatization (3).json`
  - Adicionado nó "Deletar Itens Antigos"
  - Atualizada conexão: "Atualizar Pedido" → "Deletar Itens Antigos" → "Preparar Itens do pedido"

## Observações

- O nó CREATE não precisa deletar itens porque é um pedido novo (não tem itens antigos)
- O nó DELETE já tinha um fluxo separado que deleta tanto o pedido quanto os itens
- Esta correção garante que a tabela `bling_order_items` sempre reflete o estado atual do pedido no Bling
