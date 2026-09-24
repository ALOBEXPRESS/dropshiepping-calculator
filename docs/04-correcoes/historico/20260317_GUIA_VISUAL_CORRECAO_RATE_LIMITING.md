# Guia Visual: Correção Rate Limiting Bling API

## Resumo da Correção

Adicionar verificação para pular busca de detalhes em eventos `order.deleted` e adicionar rate limiting nas requisições HTTP.

## Mudanças Necessárias

### 1. Adicionar Nó Condicional "É Evento Delete?"

**Localização**: Entre "Wait5" e "Buscar Detalhes do Pedido1"

**Tipo de Nó**: IF

**Configuração**:

```
Nome: É Evento Delete?

Conditions:
  - IF: {{ $('Preparar Dados1').item.json.event_type }}
  - Operation: equals
  - Value: order.deleted
```

**Screenshot da Configuração**:
```
┌─────────────────────────────────────┐
│ É Evento Delete?                    │
├─────────────────────────────────────┤
│ Conditions                          │
│                                     │
│ IF                                  │
│ {{ $('Preparar Dados1').item.json.  │
│    event_type }}                    │
│                                     │
│ Operation: equals                   │
│                                     │
│ Value: order.deleted                │
│                                     │
│ [Add Condition]                     │
└─────────────────────────────────────┘
```

### 2. Adicionar Nó "Processar Delete Direto"

**Localização**: Conectado ao output TRUE de "É Evento Delete?"

**Tipo de Nó**: Set

**Configuração**:

```
Nome: Processar Delete Direto

Assignments:
  1. skip_details = true (Boolean)
  2. event_type = {{ $('Preparar Dados1').item.json.event_type }} (String)
  3. bling_order_id = {{ $('Preparar Dados1').item.json.bling_order_id }} (Number)
  4. message = "Pedido deletado - detalhes não buscados para evitar rate limiting" (String)
```

**Screenshot da Configuração**:
```
┌─────────────────────────────────────┐
│ Processar Delete Direto             │
├─────────────────────────────────────┤
│ Assignments                         │
│                                     │
│ 1. Name: skip_details               │
│    Type: Boolean                    │
│    Value: true                      │
│                                     │
│ 2. Name: event_type                 │
│    Type: String                     │
│    Value: {{ $('Preparar Dados1')   │
│           .item.json.event_type }}  │
│                                     │
│ 3. Name: bling_order_id             │
│    Type: Number                     │
│    Value: {{ $('Preparar Dados1')   │
│           .item.json.bling_order_id}}│
│                                     │
│ 4. Name: message                    │
│    Type: String                     │
│    Value: "Pedido deletado..."      │
│                                     │
│ [Add Assignment]                    │
└─────────────────────────────────────┘
```

### 3. Modificar Nó "Buscar Detalhes do Pedido1"

**Localização**: Nó existente

**Modificação**: Adicionar Rate Limiting

**Configuração**:

```
Nome: Buscar Detalhes do Pedido1

URL: https://api.bling.com.br/Api/v3/pedidos/vendas/{{ $json.bling_order_id }}

Headers:
  - accept: application/json
  - Authorization: Bearer {{ $json.access_token }}

Options:
  ✓ Batching
    - Batch Size: 1
    - Batch Interval: 1000
  
  ✓ Timeout: 30000
```

**Screenshot da Configuração**:
```
┌─────────────────────────────────────┐
│ Buscar Detalhes do Pedido1          │
├─────────────────────────────────────┤
│ URL                                 │
│ https://api.bling.com.br/Api/v3/    │
│ pedidos/vendas/{{ $json.bling_      │
│ order_id }}                         │
│                                     │
│ Headers                             │
│ accept: application/json            │
│ Authorization: Bearer {{ $json.     │
│                access_token }}      │
│                                     │
│ Options ▼                           │
│                                     │
│ ☑ Batching                          │
│   Batch Size: 1                     │
│   Batch Interval: 1000              │
│                                     │
│ ☑ Timeout                           │
│   Value: 30000                      │
│                                     │
└─────────────────────────────────────┘
```

### 4. Reconectar os Nós

**Antes**:
```
┌─────────┐     ┌──────────────────────────┐     ┌──────────────┐
│  Wait5  │────▶│ Buscar Detalhes do       │────▶│ Detalhes OK? │
└─────────┘     │ Pedido1                  │     └──────────────┘
                └──────────────────────────┘
```

**Depois**:
```
┌─────────┐     ┌──────────────────┐
│  Wait5  │────▶│ É Evento Delete? │
└─────────┘     └────────┬─────────┘
                         │
                    ┌────┴────┐
                    │         │
                 FALSE       TRUE
                    │         │
                    ▼         ▼
    ┌──────────────────────────┐     ┌─────────────────────────┐
    │ Buscar Detalhes do       │     │ Processar Delete Direto │
    │ Pedido1                  │     └────────────┬────────────┘
    │ (com rate limiting)      │                  │
    └────────────┬─────────────┘                  │
                 │                                 │
                 ▼                                 │
    ┌──────────────┐                              │
    │ Detalhes OK? │                              │
    └──────┬───────┘                              │
           │                                       │
           ▼                                       │
    ┌──────────────────────┐                      │
    │ Validar Dados para   │                      │
    │ NF1                  │                      │
    └──────────┬───────────┘                      │
               │                                   │
               ▼                                   │
    ┌──────────────────────┐                      │
    │ Mapear Canal de      │                      │
    │ Venda1               │                      │
    └──────────┬───────────┘                      │
               │                                   │
               ▼                                   │
    ┌──────────────────────┐                      │
    │ Buscar Canal1        │                      │
    └──────────┬───────────┘                      │
               │                                   │
               ▼                                   │
    ┌──────────────────────┐                      │
    │ Wait4                │                      │
    └──────────┬───────────┘                      │
               │                                   │
               └───────────────┬───────────────────┘
                               ▼
                ┌──────────────────────────────┐
                │ Identificar Tipo de Evento1  │
                └──────────────────────────────┘
```

## Passo a Passo de Implementação

### Passo 1: Abrir o Workflow

1. Acesse o N8N: http://localhost:5678 (ou seu endereço)
2. Vá em "Workflows"
3. Abra "Bling Pedido de Venda Automatization"

### Passo 2: Adicionar Nó "É Evento Delete?"

1. Localize o nó "Wait5"
2. Clique na conexão entre "Wait5" e "Buscar Detalhes do Pedido1"
3. Clique no botão "+" que aparece
4. Busque por "IF" e selecione
5. Renomeie para "É Evento Delete?"
6. Configure a condição:
   - Campo: `{{ $('Preparar Dados1').item.json.event_type }}`
   - Operação: `equals`
   - Valor: `order.deleted`
7. Clique em "Execute Node" para testar

### Passo 3: Adicionar Nó "Processar Delete Direto"

1. Clique no output "true" do nó "É Evento Delete?"
2. Clique no botão "+"
3. Busque por "Set" e selecione
4. Renomeie para "Processar Delete Direto"
5. Adicione os 4 assignments conforme especificado acima
6. Clique em "Execute Node" para testar

### Passo 4: Modificar "Buscar Detalhes do Pedido1"

1. Clique no nó "Buscar Detalhes do Pedido1"
2. Role até "Options"
3. Clique em "Add Option"
4. Selecione "Batching"
5. Configure:
   - Batch Size: `1`
   - Batch Interval: `1000`
6. Clique em "Add Option" novamente
7. Selecione "Timeout"
8. Configure: `30000`
9. Clique em "Execute Node" para testar

### Passo 5: Reconectar os Nós

1. Desconecte "Wait5" de "Buscar Detalhes do Pedido1" (se ainda conectado)
2. Conecte "Wait5" → "É Evento Delete?"
3. Conecte "É Evento Delete?" (output FALSE) → "Buscar Detalhes do Pedido1"
4. Conecte "É Evento Delete?" (output TRUE) → "Processar Delete Direto"
5. Conecte "Processar Delete Direto" → "Identificar Tipo de Evento1"

### Passo 6: Salvar e Ativar

1. Clique em "Save" no canto superior direito
2. Verifique que o workflow está "Active"
3. Teste deletando um pedido no Bling

## Verificação da Implementação

### Checklist

- [ ] Nó "É Evento Delete?" criado e configurado
- [ ] Nó "Processar Delete Direto" criado e configurado
- [ ] Nó "Buscar Detalhes do Pedido1" modificado com rate limiting
- [ ] Conexões atualizadas conforme diagrama
- [ ] Workflow salvo
- [ ] Workflow ativo

### Teste 1: Delete de 1 Pedido

1. Vá no Bling
2. Delete 1 pedido
3. Volte no N8N
4. Vá em "Executions"
5. Verifique a última execução
6. Confirme que:
   - Nó "É Evento Delete?" executou
   - Output TRUE foi seguido
   - Nó "Processar Delete Direto" executou
   - Nó "Buscar Detalhes do Pedido1" NÃO executou
   - Sem erro 429

### Teste 2: Create de 1 Pedido

1. Vá no Bling
2. Crie 1 pedido novo (ou clone um existente)
3. Volte no N8N
4. Vá em "Executions"
5. Verifique a última execução
6. Confirme que:
   - Nó "É Evento Delete?" executou
   - Output FALSE foi seguido
   - Nó "Buscar Detalhes do Pedido1" executou
   - Nó "Processar Delete Direto" NÃO executou
   - Pedido inserido no banco

### Teste 3: Delete de Múltiplos Pedidos

1. Vá no Bling
2. Delete 3-5 pedidos simultaneamente
3. Volte no N8N
4. Vá em "Executions"
5. Verifique as últimas execuções
6. Confirme que:
   - Todas as execuções processaram sem erro
   - Nenhum erro 429 ocorreu
   - Todos os logs foram criados no Supabase

## Troubleshooting

### Erro: "Node 'Preparar Dados1' not found"

**Causa**: Nome do nó está diferente no workflow

**Solução**: Verifique o nome exato do nó e ajuste a referência

### Erro: "Cannot read property 'event_type' of undefined"

**Causa**: Dados não estão sendo passados corretamente

**Solução**: Verifique que "Preparar Dados1" está executando antes

### Erro: Ainda recebendo 429

**Causa**: Rate limiting muito agressivo ou muitos webhooks simultâneos

**Solução**: 
1. Aumente `batchInterval` para 2000ms ou 3000ms
2. Considere adicionar retry logic

### Nó "Processar Delete Direto" não executa

**Causa**: Conexão não está correta

**Solução**: Verifique que está conectado ao output TRUE de "É Evento Delete?"

## Monitoramento Pós-Implementação

### Query SQL para Verificar Logs

```sql
-- Verificar eventos processados nas últimas 24h
SELECT 
  event_type,
  bling_order_id,
  status,
  error_message,
  created_at
FROM bling_sync_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Verificar se ainda há erros 429
SELECT 
  COUNT(*) as total_erros_429,
  MAX(created_at) as ultimo_erro
FROM bling_sync_logs
WHERE (error_message LIKE '%429%' OR error_message LIKE '%rate limit%')
  AND created_at >= NOW() - INTERVAL '24 hours';

-- Verificar eventos de delete processados
SELECT 
  COUNT(*) as total_deletes,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as deletes_sucesso,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as deletes_erro
FROM bling_sync_logs
WHERE event_type = 'order.deleted'
  AND created_at >= NOW() - INTERVAL '24 hours';
```

### Métricas a Monitorar

1. **Taxa de Erro 429**: Deve ser 0% após implementação
2. **Tempo de Processamento**: Pode aumentar ligeiramente devido ao delay
3. **Taxa de Sucesso**: Deve ser 100% para eventos delete
4. **Volume de Webhooks**: Monitorar picos de volume

## Próximos Passos

Após implementação e testes bem-sucedidos:

1. Monitorar por 24-48 horas
2. Ajustar `batchInterval` se necessário
3. Considerar implementar retry logic para casos extremos
4. Documentar lições aprendidas

## Suporte

Se encontrar problemas durante a implementação:

1. Verifique os logs de execução no N8N
2. Verifique os logs no Supabase
3. Consulte a documentação completa em `SOLUCAO_RATE_LIMITING_BLING_API.md`
4. Reverta as mudanças se necessário (backup do workflow)

## Backup do Workflow

Antes de fazer as mudanças, faça backup:

1. Abra o workflow no N8N
2. Clique nos 3 pontos no canto superior direito
3. Selecione "Download"
4. Salve o arquivo JSON em local seguro
5. Nome sugerido: `Bling_Pedido_Venda_Backup_YYYY-MM-DD.json`
