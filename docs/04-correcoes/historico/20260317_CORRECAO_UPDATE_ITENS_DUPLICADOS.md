# Correção: Itens Duplicados no UPDATE

## Problema

Quando você atualiza um pedido no Bling, o workflow:
- ✅ Atualiza corretamente a tabela `bling_orders`
- ❌ Insere novos itens na tabela `bling_order_items` (duplicando)

**Resultado:** Itens duplicados a cada UPDATE.

## Causa

O fluxo de UPDATE usa o mesmo nó "Inserir item do pedido1" que o CREATE, sempre inserindo novos registros em vez de atualizar os existentes.

## Solução

Adicionar um nó que **deleta os itens antigos** antes de inserir os novos.

### Opção 1: Deletar e Reinserir (RECOMENDADO)

Adicionar um nó Supabase DELETE antes de "Preparar Itens do pedido":

**Nó: Deletar Itens Antigos**
- **Tipo:** Supabase
- **Operação:** Delete
- **Tabela:** `bling_order_items`
- **Filtro:**
  - Campo: `order_id`
  - Condição: `equals`
  - Valor: `{{ $('Inserir Pedido').isExecuted ? $('Inserir Pedido').item.json.id : $('Atualizar Pedido').item.json.id }}`

**Fluxo corrigido:**
```
Atualizar Pedido
→ Deletar Itens Antigos (novo nó)
→ Preparar Itens do pedido
→ Pega mais dados do ID Produto1
→ Buscar Produto por SKU1
→ Preparar dados do item1
→ Inserir item do pedido1
```

### Opção 2: Upsert (Mais Complexo)

Em vez de DELETE + INSERT, fazer UPSERT (UPDATE ou INSERT):

1. Verificar se o item já existe (por `bling_item_id`)
2. Se existe → UPDATE
3. Se não existe → INSERT

**Mais complexo** porque precisa adicionar lógica para cada item.

## Implementação no n8n

### Passo 1: Adicionar nó "Deletar Itens Antigos"

1. Adicione um nó **Supabase** após "Atualizar Pedido"
2. Configure:
   - **Nome:** `Deletar Itens Antigos`
   - **Operação:** Delete
   - **Tabela:** `bling_order_items`
   - **Filtros:**
     - **Key Name:** `order_id`
     - **Condition:** `equals`
     - **Key Value:** `{{ $('Atualizar Pedido').item.json.id }}`

### Passo 2: Conectar o fluxo

1. **Desconecte:** "Atualizar Pedido" → "Preparar Itens do pedido"
2. **Conecte:** "Atualizar Pedido" → "Deletar Itens Antigos"
3. **Conecte:** "Deletar Itens Antigos" → "Preparar Itens do pedido"

### Passo 3: Adicionar mesmo nó após "Inserir Pedido"

Como o CREATE também precisa processar itens, você tem 2 opções:

**Opção A:** Criar 2 nós "Deletar Itens Antigos" (um para cada fluxo)

**Opção B:** Unir os fluxos antes de "Preparar Itens do pedido":

```
Inserir Pedido ─┐
                ├─→ Deletar Itens Antigos → Preparar Itens do pedido
Atualizar Pedido ┘
```

Mas isso pode causar problemas porque o CREATE não tem itens antigos para deletar.

**Melhor:** Criar 2 nós separados:

```
Inserir Pedido → Preparar Itens do pedido (sem deletar)

Atualizar Pedido → Deletar Itens Antigos → Preparar Itens do pedido
```

## Código JSON do Nó

```json
{
  "parameters": {
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
  },
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "position": [-6800, 5100],
  "name": "Deletar Itens Antigos",
  "credentials": {
    "supabaseApi": {
      "id": "EOF2mckcRi7gWhf0",
      "name": "Supabase account"
    }
  }
}
```

## Alternativa: Usar ON CONFLICT no Banco

Se você quiser evitar duplicatas sem deletar, pode adicionar uma constraint UNIQUE na tabela:

```sql
-- Adicionar constraint única para evitar duplicatas
ALTER TABLE bling_order_items 
ADD CONSTRAINT bling_order_items_unique_item 
UNIQUE (order_id, bling_item_id);
```

Depois, no nó "Inserir item do pedido1", usar UPSERT:
- Se o item já existe (mesmo order_id + bling_item_id) → UPDATE
- Se não existe → INSERT

Mas isso requer mudar a operação do Supabase para "Upsert" em vez de "Insert".

## Recomendação

Use a **Opção 1** (Deletar e Reinserir) porque:
- ✅ Mais simples de implementar
- ✅ Garante que os itens estão sempre sincronizados
- ✅ Remove itens que foram deletados no Bling
- ✅ Funciona mesmo se a quantidade de itens mudar

## Teste

1. Crie um pedido com 2 produtos
2. Verifique que tem 2 registros em `bling_order_items`
3. Atualize o pedido no Bling (mude quantidade, preço, etc)
4. Verifique que ainda tem apenas 2 registros (não 4)
5. Delete 1 produto do pedido no Bling
6. Verifique que tem apenas 1 registro

## Fluxo Final

```
UPDATE:
Webhook → ... → Atualizar Pedido
                ↓
                Deletar Itens Antigos
                ↓
                Preparar Itens do pedido
                ↓
                Loop pelos itens
                ↓
                Inserir item do pedido1

CREATE:
Webhook → ... → Inserir Pedido
                ↓
                Preparar Itens do pedido
                ↓
                Loop pelos itens
                ↓
                Inserir item do pedido1
```
