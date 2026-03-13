# Solução: UPDATE de Pedido que Não Existe

## Problema

Quando você deleta um pedido no Bling, ele envia 2 webhooks:
1. `order.updated` - Atualiza status (ex: "Cancelado")
2. `order.deleted` - Deleta o pedido

Se o webhook de DELETE chegar primeiro e deletar o pedido, quando o webhook de UPDATE chegar depois, ele vai:
1. Buscar o pedido no banco → **não encontra**
2. Tentar INSERIR um novo pedido → **ERRO** porque `bling_order_id` está null

## Erro Atual

```
null value in column "bling_order_id" of relation "bling_orders" violates not-null constraint
```

## Solução: Adicionar Verificação de Evento

Adicionar um nó IF entre "Pedido Existe?" (saída FALSE) e "Inserir Pedido" que verifica:
- Se o evento é CREATE → Inserir Pedido
- Se o evento é UPDATE → Registrar log e parar (pedido já foi deletado)

### Passo a Passo no n8n

1. **Adicionar nó IF** após "Pedido Existe?" (saída FALSE):
   - Nome: `É CREATE ou UPDATE?`
   - Condição: `{{ $('Preparar Dados').item.json.event_type === 'order.created' }}`
   - Saída TRUE → Inserir Pedido
   - Saída FALSE → Novo nó de log

2. **Adicionar nó de Log** na saída FALSE do IF:
   - Nome: `Registrar UPDATE Ignorado`
   - Tipo: Supabase
   - Operação: Insert
   - Tabela: `bling_sync_logs`
   - Campos:
     ```json
     {
       "organization_id": "e3274f4d-2627-4121-895d-b0e3a70b0ace",
       "event_type": "{{ $('Preparar Dados').item.json.event_type }}",
       "bling_order_id": "{{ $('Preparar Dados').item.json.bling_order_id }}",
       "status": "ignored",
       "error_message": "UPDATE ignorado: pedido não existe no banco (provavelmente já foi deletado)"
     }
     ```

### Fluxo Corrigido

```
Pedido Existe?
├─ TRUE → Atualizar Pedido
└─ FALSE → É CREATE ou UPDATE?
           ├─ TRUE (CREATE) → Inserir Pedido
           └─ FALSE (UPDATE) → Registrar UPDATE Ignorado → Parar
```

## Alternativa Mais Simples (RECOMENDADA)

Em vez de adicionar um novo nó, você pode modificar a condição do "Pedido Existe?" para incluir uma verificação adicional:

### Modificar nó "Pedido Existe?"

**Condição Atual:**
```javascript
{{ $('Pegar order_id1').first().json.bling_order_id !== undefined && $('Pegar order_id1').first().json.bling_order_id !== null }}
```

**Nova Condição (adicionar OR):**
```javascript
{{ 
  ($('Pegar order_id1').first().json.bling_order_id !== undefined && 
   $('Pegar order_id1').first().json.bling_order_id !== null) ||
  $('Preparar Dados').item.json.event_type === 'order.updated'
}}
```

**Explicação:**
- Se o pedido existe → TRUE → Atualizar
- Se o pedido não existe MAS é UPDATE → TRUE → Atualizar (vai falhar silenciosamente ou você pode adicionar tratamento de erro)
- Se o pedido não existe E é CREATE → FALSE → Inserir

**Problema com essa abordagem:** O UPDATE vai tentar atualizar um pedido que não existe e vai falhar.

## Solução DEFINITIVA (Melhor)

Modificar o nó "Atualizar Pedido" para ter `continueOnFail: true` e adicionar um tratamento de erro que registra o log.

### Passo a Passo

1. **Modificar "Atualizar Pedido"**:
   - Ativar "Continue On Fail" nas configurações do nó
   - Isso faz com que, se o UPDATE falhar (pedido não existe), o fluxo continue

2. **Adicionar nó "Houve erro no UPDATE?"** após "Atualizar Pedido":
   - Tipo: IF
   - Condição: `{{ $json.error !== undefined }}`
   - Saída TRUE → Registrar log de UPDATE ignorado
   - Saída FALSE → Continuar normalmente (Preparar Itens do pedido)

## Implementação Recomendada

Use a **Solução 1** (adicionar nó IF) porque é mais clara e explícita. Vou fornecer o código JSON para você adicionar:

### Nó: É CREATE ou UPDATE?

```json
{
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict",
        "version": 3
      },
      "conditions": [
        {
          "id": "is-create",
          "leftValue": "={{ $('Preparar Dados').item.json.event_type }}",
          "rightValue": "order.created",
          "operator": {
            "type": "string",
            "operation": "equals"
          }
        }
      ],
      "combinator": "and"
    },
    "options": {}
  },
  "type": "n8n-nodes-base.if",
  "typeVersion": 2.3,
  "position": [-7200, 5200],
  "name": "É CREATE ou UPDATE?"
}
```

### Nó: Registrar UPDATE Ignorado

```json
{
  "parameters": {
    "tableId": "bling_sync_logs",
    "fieldsUi": {
      "fieldValues": [
        {
          "fieldId": "organization_id",
          "fieldValue": "e3274f4d-2627-4121-895d-b0e3a70b0ace"
        },
        {
          "fieldId": "event_type",
          "fieldValue": "={{ $('Preparar Dados').item.json.event_type }}"
        },
        {
          "fieldId": "bling_order_id",
          "fieldValue": "={{ $('Preparar Dados').item.json.bling_order_id }}"
        },
        {
          "fieldId": "marketplace_order_number",
          "fieldValue": "={{ $('Preparar Dados').item.json.marketplace_order_number }}"
        },
        {
          "fieldId": "bling_store_id",
          "fieldValue": "={{ $('Preparar Dados').item.json.bling_store_id }}"
        },
        {
          "fieldId": "status",
          "fieldValue": "ignored"
        },
        {
          "fieldId": "error_message",
          "fieldValue": "UPDATE ignorado: pedido não existe no banco (provavelmente já foi deletado)"
        },
        {
          "fieldId": "webhook_data",
          "fieldValue": "={{ $('Preparar Dados').item.json.webhook_data }}"
        }
      ]
    }
  },
  "type": "n8n-nodes-base.supabase",
  "typeVersion": 1,
  "position": [-7000, 5300],
  "name": "Registrar UPDATE Ignorado",
  "credentials": {
    "supabaseApi": {
      "id": "EOF2mckcRi7gWhf0",
      "name": "Supabase account"
    }
  }
}
```

### Conexões a Modificar

1. **Desconectar:** "Pedido Existe?" (saída FALSE) → "Inserir Pedido"
2. **Conectar:** "Pedido Existe?" (saída FALSE) → "É CREATE ou UPDATE?"
3. **Conectar:** "É CREATE ou UPDATE?" (saída TRUE) → "Inserir Pedido"
4. **Conectar:** "É CREATE ou UPDATE?" (saída FALSE) → "Registrar UPDATE Ignorado"

## Resultado Esperado

Após a correção, quando você deletar um pedido:
- Webhook DELETE → Deleta o pedido
- Webhook UPDATE → Verifica que o pedido não existe → Registra log "ignored" → Para o fluxo

Não haverá mais erro de constraint violation.
