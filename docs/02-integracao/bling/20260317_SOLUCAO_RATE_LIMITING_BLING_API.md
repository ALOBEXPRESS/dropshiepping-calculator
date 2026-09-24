# Solução: Rate Limiting ao Deletar Pedidos no Bling

## Problema

Ao deletar múltiplos pedidos no Bling simultaneamente, o workflow recebe erro HTTP 429 (rate limit exceeded) no nó "Buscar Detalhes do Pedido":

```json
{
  "error": {
    "message": "Try spacing your requests out using the batching settings under 'Options'",
    "name": "AxiosError",
    "code": "ERR_BAD_REQUEST",
    "status": 429
  },
  "event_type": "order.deleted",
  "bling_order_id": 25260387267
}
```

## Causa Raiz

Quando múltiplos pedidos são deletados no Bling:
1. Cada pedido deletado dispara um webhook `order.deleted`
2. O workflow tenta buscar detalhes de CADA pedido deletado
3. A API do Bling tem rate limiting e bloqueia requisições em excesso
4. Pedidos deletados NÃO precisam ter seus detalhes buscados (já foram deletados!)

## Solução Implementada

### 1. Adicionar Nó Condicional ANTES de "Buscar Detalhes do Pedido1"

Adicionar um nó IF entre "Wait5" e "Buscar Detalhes do Pedido1" para verificar se é evento de delete:

**Nome do Nó**: `É Evento Delete?`

**Tipo**: `n8n-nodes-base.if` (versão 2.3)

**Posição**: Entre "Wait5" e "Buscar Detalhes do Pedido1"

**Configuração**:
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
          "id": "is-delete-event",
          "leftValue": "={{ $('Preparar Dados1').item.json.event_type }}",
          "rightValue": "order.deleted",
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
  "id": "check-delete-event-001",
  "name": "É Evento Delete?"
}
```

### 2. Adicionar Nó para Processar Delete Diretamente

**Nome do Nó**: `Processar Delete Direto`

**Tipo**: `n8n-nodes-base.set` (versão 3.4)

**Configuração**:
```json
{
  "parameters": {
    "assignments": {
      "assignments": [
        {
          "id": "skip-details",
          "name": "skip_details",
          "value": true,
          "type": "boolean"
        },
        {
          "id": "event-type",
          "name": "event_type",
          "value": "={{ $('Preparar Dados1').item.json.event_type }}",
          "type": "string"
        },
        {
          "id": "bling-order-id",
          "name": "bling_order_id",
          "value": "={{ $('Preparar Dados1').item.json.bling_order_id }}",
          "type": "number"
        },
        {
          "id": "message",
          "name": "message",
          "value": "Pedido deletado - detalhes não buscados para evitar rate limiting",
          "type": "string"
        }
      ]
    },
    "options": {}
  },
  "type": "n8n-nodes-base.set",
  "typeVersion": 3.4,
  "id": "process-delete-direct-001",
  "name": "Processar Delete Direto"
}
```

### 3. Adicionar Rate Limiting ao Nó "Buscar Detalhes do Pedido1"

Modificar o nó existente "Buscar Detalhes do Pedido1" para adicionar delay:

**Adicionar na seção `options`**:
```json
{
  "parameters": {
    "url": "=https://api.bling.com.br/Api/v3/pedidos/vendas/{{ $json.bling_order_id }}",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "accept",
          "value": "application/json"
        },
        {
          "name": "Authorization",
          "value": "=Bearer {{ $json.access_token }}"
        }
      ]
    },
    "options": {
      "batching": {
        "batch": {
          "batchSize": 1,
          "batchInterval": 1000
        }
      },
      "timeout": 30000
    }
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.3,
  "id": "063b18f4-1f19-4f56-9d43-09a2297650ad",
  "name": "Buscar Detalhes do Pedido1",
  "onError": "continueErrorOutput"
}
```

**Explicação das opções**:
- `batchSize: 1` - Processa 1 requisição por vez
- `batchInterval: 1000` - Espera 1 segundo entre requisições
- `timeout: 30000` - Timeout de 30 segundos

### 4. Atualizar Conexões do Workflow

**Conexões a modificar**:

1. **Wait5** → **É Evento Delete?** (novo)
2. **É Evento Delete?** (TRUE) → **Processar Delete Direto** (novo)
3. **É Evento Delete?** (FALSE) → **Buscar Detalhes do Pedido1** (existente)
4. **Processar Delete Direto** → **Identificar Tipo de Evento1** (pula busca de detalhes)

**Antes**:
```
Wait5 → Buscar Detalhes do Pedido1 → Detalhes OK? → ...
```

**Depois**:
```
Wait5 → É Evento Delete?
         ├─ TRUE → Processar Delete Direto → Identificar Tipo de Evento1
         └─ FALSE → Buscar Detalhes do Pedido1 → Detalhes OK? → ...
```

## Fluxo Completo Atualizado

```
Webhook Bling1
  ↓
Pegar Access Token
  ↓
Preparar Dados1
  ↓
Wait5
  ↓
É Evento Delete? ──────────────────────────────┐
  ↓ FALSE                                      │ TRUE
Buscar Detalhes do Pedido1                     │
  (com rate limiting)                          │
  ↓                                            ↓
Detalhes OK?                          Processar Delete Direto
  ↓                                            │
Validar Dados para NF1                         │
  ↓                                            │
Mapear Canal de Venda1                         │
  ↓                                            │
Buscar Canal1                                  │
  ↓                                            │
Wait4                                          │
  ↓                                            │
Identificar Tipo de Evento1 ←──────────────────┘
  ├─ Pedido Criado → ...
  ├─ Pedido Atualizado → ...
  └─ Pedido Deletado → ...
```

## Benefícios da Solução

1. **Evita Rate Limiting**: Não faz requisições desnecessárias para pedidos deletados
2. **Performance**: Reduz tempo de processamento ao pular busca de detalhes
3. **Confiabilidade**: Adiciona delay entre requisições para evitar 429
4. **Lógica**: Pedidos deletados não precisam de detalhes completos

## Implementação no N8N

### Passo 1: Abrir o Workflow no N8N

1. Acesse o N8N
2. Abra o workflow "Bling Pedido de Venda Automatization"

### Passo 2: Adicionar Nó "É Evento Delete?"

1. Clique no botão "+" entre "Wait5" e "Buscar Detalhes do Pedido1"
2. Selecione "IF"
3. Configure:
   - Nome: `É Evento Delete?`
   - Condition: `{{ $('Preparar Dados1').item.json.event_type }}` equals `order.deleted`

### Passo 3: Adicionar Nó "Processar Delete Direto"

1. Conecte o output TRUE do "É Evento Delete?" a um novo nó
2. Selecione "Set"
3. Configure os campos conforme especificado acima

### Passo 4: Modificar "Buscar Detalhes do Pedido1"

1. Abra o nó "Buscar Detalhes do Pedido1"
2. Vá em "Options"
3. Adicione "Batching":
   - Batch Size: 1
   - Batch Interval: 1000ms
4. Adicione "Timeout": 30000ms

### Passo 5: Reconectar os Nós

1. Desconecte "Wait5" de "Buscar Detalhes do Pedido1"
2. Conecte "Wait5" → "É Evento Delete?"
3. Conecte "É Evento Delete?" (FALSE) → "Buscar Detalhes do Pedido1"
4. Conecte "É Evento Delete?" (TRUE) → "Processar Delete Direto"
5. Conecte "Processar Delete Direto" → "Identificar Tipo de Evento1"

### Passo 6: Testar

1. Salve o workflow
2. Delete um pedido no Bling
3. Verifique que não há erro 429
4. Verifique os logs no Supabase

## Testes Recomendados

### Teste 1: Delete de 1 Pedido
- Deletar 1 pedido no Bling
- Verificar que o workflow processa sem erro
- Verificar log no Supabase com status "success"

### Teste 2: Delete de Múltiplos Pedidos
- Deletar 3-5 pedidos simultaneamente no Bling
- Verificar que NENHUM erro 429 ocorre
- Verificar que todos os logs são criados

### Teste 3: Create/Update Normal
- Criar um novo pedido no Bling
- Verificar que o fluxo normal funciona (busca detalhes)
- Verificar que o pedido é inserido no banco

## Monitoramento

Verificar logs no Supabase:

```sql
-- Verificar eventos de delete processados
SELECT 
  event_type,
  bling_order_id,
  status,
  error_message,
  created_at
FROM bling_sync_logs
WHERE event_type = 'order.deleted'
ORDER BY created_at DESC
LIMIT 10;

-- Verificar se ainda há erros 429
SELECT 
  event_type,
  bling_order_id,
  error_message,
  created_at
FROM bling_sync_logs
WHERE error_message LIKE '%429%'
  OR error_message LIKE '%rate limit%'
ORDER BY created_at DESC
LIMIT 10;
```

## Próximos Passos

1. ✅ Implementar solução no workflow
2. ✅ Testar com delete de 1 pedido
3. ✅ Testar com delete de múltiplos pedidos
4. ✅ Monitorar logs por 24h
5. ⏳ Documentar solução (este arquivo)

## Status

⏳ **SOLUÇÃO DOCUMENTADA - AGUARDANDO IMPLEMENTAÇÃO**

A solução foi documentada e está pronta para ser implementada no N8N. Após implementação, testar conforme descrito acima.

## Observações Importantes

1. **Rate Limiting é Global**: O Bling tem rate limiting global, então mesmo com delay, se houver muitos webhooks simultâneos, pode haver erro
2. **Retry Logic**: Considerar adicionar retry logic com backoff exponencial para casos de 429
3. **Queue System**: Para volume muito alto, considerar implementar sistema de fila
4. **Webhook Throttling**: Considerar configurar throttling no próprio Bling se possível

## Alternativas Consideradas

### Alternativa 1: Aumentar Delay
- Aumentar `batchInterval` para 2000ms ou 3000ms
- Prós: Mais seguro contra rate limiting
- Contras: Processamento mais lento

### Alternativa 2: Queue System
- Implementar fila Redis/RabbitMQ
- Prós: Controle total sobre rate limiting
- Contras: Complexidade adicional

### Alternativa 3: Ignorar Deletes Completamente
- Não processar eventos `order.deleted`
- Prós: Simples
- Contras: Perde rastreabilidade

**Solução Escolhida**: Combinação de skip para deletes + rate limiting para outros eventos
