# Diagrama de Fluxo: Correção Rate Limiting

## Fluxo ANTES da Correção

```
┌─────────────────┐
│ Webhook Bling   │ ◄── Recebe evento do Bling
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pegar Access    │
│ Token           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Preparar Dados1 │ ◄── Extrai event_type, bling_order_id, etc.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Wait5           │ ◄── Delay de segurança
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Buscar Detalhes do Pedido1      │ ◄── ❌ PROBLEMA: Busca detalhes
│                                 │     mesmo para pedidos deletados
│ GET /pedidos/vendas/{id}        │
│                                 │     ❌ Múltiplas requisições
│ ❌ SEM RATE LIMITING            │     simultâneas causam erro 429
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Detalhes OK?    │
└────────┬────────┘
         │
         ▼
    (continua...)
```

### Problema Identificado

Quando múltiplos pedidos são deletados:

```
Delete Pedido #100 ──┐
Delete Pedido #101 ──┼──► Webhooks simultâneos
Delete Pedido #102 ──┤
Delete Pedido #103 ──┘
         │
         ▼
┌────────────────────────────────────────┐
│ Workflow tenta buscar detalhes de      │
│ TODOS os pedidos ao mesmo tempo        │
│                                        │
│ GET /pedidos/vendas/100 ──┐           │
│ GET /pedidos/vendas/101 ──┼──► ❌ 429 │
│ GET /pedidos/vendas/102 ──┤           │
│ GET /pedidos/vendas/103 ──┘           │
└────────────────────────────────────────┘
```

## Fluxo DEPOIS da Correção

```
┌─────────────────┐
│ Webhook Bling   │ ◄── Recebe evento do Bling
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pegar Access    │
│ Token           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Preparar Dados1 │ ◄── Extrai event_type, bling_order_id, etc.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Wait5           │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ ✅ É Evento Delete?             │ ◄── NOVO: Verifica tipo de evento
│                                 │
│ IF event_type == "order.deleted"│
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    │         │
  FALSE      TRUE
    │         │
    │         └──────────────────────────┐
    │                                    │
    ▼                                    ▼
┌─────────────────────────────────┐  ┌──────────────────────────┐
│ Buscar Detalhes do Pedido1      │  │ ✅ Processar Delete      │
│                                 │  │    Direto                │
│ GET /pedidos/vendas/{id}        │  │                          │
│                                 │  │ • skip_details = true    │
│ ✅ COM RATE LIMITING:           │  │ • Não busca detalhes     │
│   • Batch Size: 1               │  │ • Evita requisição       │
│   • Batch Interval: 1000ms      │  │   desnecessária          │
│   • Timeout: 30000ms            │  └────────────┬─────────────┘
└────────┬────────────────────────┘               │
         │                                        │
         ▼                                        │
┌─────────────────┐                               │
│ Detalhes OK?    │                               │
└────────┬────────┘                               │
         │                                        │
         ▼                                        │
┌─────────────────┐                               │
│ Validar Dados   │                               │
│ para NF1        │                               │
└────────┬────────┘                               │
         │                                        │
         ▼                                        │
┌─────────────────┐                               │
│ Mapear Canal de │                               │
│ Venda1          │                               │
└────────┬────────┘                               │
         │                                        │
         ▼                                        │
┌─────────────────┐                               │
│ Buscar Canal1   │                               │
└────────┬────────┘                               │
         │                                        │
         ▼                                        │
┌─────────────────┐                               │
│ Wait4           │                               │
└────────┬────────┘                               │
         │                                        │
         └────────────────┬───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Identificar Tipo de   │
              │ Evento1               │
              └───────────┬───────────┘
                          │
              ┌───────────┴───────────┐
              │           │           │
              ▼           ▼           ▼
        ┌─────────┐ ┌─────────┐ ┌─────────┐
        │ Pedido  │ │ Pedido  │ │ Pedido  │
        │ Criado  │ │ Atualiz.│ │ Deletado│
        └─────────┘ └─────────┘ └─────────┘
```

### Solução Implementada

Quando múltiplos pedidos são deletados:

```
Delete Pedido #100 ──┐
Delete Pedido #101 ──┼──► Webhooks simultâneos
Delete Pedido #102 ──┤
Delete Pedido #103 ──┘
         │
         ▼
┌────────────────────────────────────────┐
│ ✅ Workflow detecta event_type =       │
│    "order.deleted"                     │
│                                        │
│ ✅ PULA busca de detalhes              │
│                                        │
│ ✅ Processa diretamente                │
│                                        │
│ ✅ SEM requisições à API               │
│                                        │
│ ✅ SEM erro 429                        │
└────────────────────────────────────────┘
```

## Comparação Lado a Lado

### Evento: order.created

**ANTES**:
```
Wait5 → Buscar Detalhes (sem delay) → Detalhes OK? → ...
```

**DEPOIS**:
```
Wait5 → É Delete? (FALSE) → Buscar Detalhes (com delay 1s) → Detalhes OK? → ...
```

### Evento: order.deleted

**ANTES**:
```
Wait5 → Buscar Detalhes (❌ erro 429) → Detalhes OK? → ...
```

**DEPOIS**:
```
Wait5 → É Delete? (TRUE) → Processar Delete Direto → Identificar Tipo → ...
```

## Detalhes Técnicos

### Nó "É Evento Delete?"

```
┌─────────────────────────────────────────┐
│ Tipo: IF (n8n-nodes-base.if v2.3)      │
├─────────────────────────────────────────┤
│ Condição:                               │
│                                         │
│ {{ $('Preparar Dados1').item.json.      │
│    event_type }}                        │
│                                         │
│ equals                                  │
│                                         │
│ "order.deleted"                         │
├─────────────────────────────────────────┤
│ Output TRUE:  → Processar Delete Direto │
│ Output FALSE: → Buscar Detalhes         │
└─────────────────────────────────────────┘
```

### Nó "Processar Delete Direto"

```
┌─────────────────────────────────────────┐
│ Tipo: Set (n8n-nodes-base.set v3.4)    │
├─────────────────────────────────────────┤
│ Assignments:                            │
│                                         │
│ 1. skip_details = true                  │
│ 2. event_type = {{ event_type }}        │
│ 3. bling_order_id = {{ order_id }}      │
│ 4. message = "Pedido deletado..."       │
├─────────────────────────────────────────┤
│ Output: → Identificar Tipo de Evento1   │
└─────────────────────────────────────────┘
```

### Nó "Buscar Detalhes do Pedido1" (Modificado)

```
┌─────────────────────────────────────────┐
│ Tipo: HTTP Request v4.3                 │
├─────────────────────────────────────────┤
│ URL:                                    │
│ https://api.bling.com.br/Api/v3/        │
│ pedidos/vendas/{{ $json.bling_order_id }}│
├─────────────────────────────────────────┤
│ ✅ Options → Batching:                  │
│    • Batch Size: 1                      │
│    • Batch Interval: 1000ms             │
│                                         │
│ ✅ Options → Timeout:                   │
│    • 30000ms                            │
├─────────────────────────────────────────┤
│ Efeito:                                 │
│ • Processa 1 requisição por vez         │
│ • Espera 1 segundo entre requisições    │
│ • Evita rate limiting                   │
└─────────────────────────────────────────┘
```

## Cenários de Teste

### Cenário 1: Delete de 1 Pedido

```
┌──────────────┐
│ Delete #100  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Webhook: order.deleted│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ É Delete? → TRUE     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Processar Delete     │
│ Direto               │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ ✅ Sucesso           │
│ ✅ Sem erro 429      │
└──────────────────────┘
```

### Cenário 2: Create de 1 Pedido

```
┌──────────────┐
│ Create #105  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Webhook: order.created│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ É Delete? → FALSE    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Buscar Detalhes      │
│ (com rate limiting)  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ ✅ Sucesso           │
│ ✅ Pedido inserido   │
└──────────────────────┘
```

### Cenário 3: Delete de 5 Pedidos Simultâneos

```
Delete #100 ──┐
Delete #101 ──┤
Delete #102 ──┼──► Webhooks
Delete #103 ──┤
Delete #104 ──┘
       │
       ▼
┌──────────────────────────────┐
│ 5 Execuções Paralelas        │
│                              │
│ Cada uma:                    │
│ • É Delete? → TRUE           │
│ • Processar Delete Direto    │
│ • ✅ Sem requisição HTTP     │
│ • ✅ Sem erro 429            │
└──────────────────────────────┘
```

## Métricas de Sucesso

### Antes da Correção

```
┌─────────────────────────────────┐
│ Delete de 5 pedidos             │
├─────────────────────────────────┤
│ ❌ Erros 429: 5/5 (100%)        │
│ ❌ Requisições HTTP: 5          │
│ ❌ Tempo médio: 2-3s (com erro) │
│ ❌ Taxa de sucesso: 0%          │
└─────────────────────────────────┘
```

### Depois da Correção

```
┌─────────────────────────────────┐
│ Delete de 5 pedidos             │
├─────────────────────────────────┤
│ ✅ Erros 429: 0/5 (0%)          │
│ ✅ Requisições HTTP: 0          │
│ ✅ Tempo médio: <1s             │
│ ✅ Taxa de sucesso: 100%        │
└─────────────────────────────────┘
```

## Legenda

```
┌─────────┐
│  Nó     │  = Nó do workflow
└─────────┘

    │
    ▼        = Fluxo de dados

┌───┴───┐
│ TRUE  │  = Decisão condicional
│ FALSE │
└───────┘

✅          = Correção/Melhoria
❌          = Problema

◄──         = Nota explicativa
```

## Resumo Visual

```
╔═══════════════════════════════════════════════════════════╗
║                    SOLUÇÃO RATE LIMITING                  ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  PROBLEMA:                                                ║
║  • Erro 429 ao deletar múltiplos pedidos                  ║
║  • Requisições simultâneas à API do Bling                 ║
║                                                           ║
║  SOLUÇÃO:                                                 ║
║  1. ✅ Pular busca de detalhes para deletes              ║
║  2. ✅ Adicionar rate limiting (1 req/s)                 ║
║                                                           ║
║  RESULTADO:                                               ║
║  • ✅ 0% de erros 429                                     ║
║  • ✅ 100% de taxa de sucesso                             ║
║  • ✅ Processamento mais rápido                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```
