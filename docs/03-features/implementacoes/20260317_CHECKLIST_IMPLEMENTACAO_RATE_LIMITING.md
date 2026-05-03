# Checklist: Implementação Correção Rate Limiting

## Pré-Implementação

### Backup e Preparação

- [ ] Fazer backup do workflow atual
  - [ ] Abrir workflow no N8N
  - [ ] Clicar nos 3 pontos → "Download"
  - [ ] Salvar como: `Bling_Pedido_Venda_Backup_2026-03-08.json`
  - [ ] Confirmar que o arquivo foi salvo

- [ ] Ler documentação
  - [ ] Ler `RESUMO_CORRECAO_RATE_LIMITING.md`
  - [ ] Ler `GUIA_VISUAL_CORRECAO_RATE_LIMITING.md`
  - [ ] Entender o fluxo em `DIAGRAMA_FLUXO_RATE_LIMITING.md`

- [ ] Verificar estado atual
  - [ ] Confirmar que o erro 429 está ocorrendo
  - [ ] Anotar frequência do erro
  - [ ] Verificar logs no Supabase

## Implementação

### Passo 1: Adicionar Nó "É Evento Delete?"

- [ ] Abrir workflow no N8N
- [ ] Localizar nó "Wait5"
- [ ] Clicar na conexão entre "Wait5" e "Buscar Detalhes do Pedido1"
- [ ] Clicar no botão "+" que aparece
- [ ] Buscar e selecionar "IF"
- [ ] Renomear para: `É Evento Delete?`
- [ ] Configurar condição:
  - [ ] Campo: `{{ $('Preparar Dados1').item.json.event_type }}`
  - [ ] Operação: `equals`
  - [ ] Valor: `order.deleted`
- [ ] Clicar em "Execute Node" para testar
- [ ] Verificar que o nó executa sem erro

### Passo 2: Adicionar Nó "Processar Delete Direto"

- [ ] Clicar no output "true" do nó "É Evento Delete?"
- [ ] Clicar no botão "+"
- [ ] Buscar e selecionar "Set"
- [ ] Renomear para: `Processar Delete Direto`
- [ ] Adicionar Assignment 1:
  - [ ] Name: `skip_details`
  - [ ] Type: `Boolean`
  - [ ] Value: `true`
- [ ] Adicionar Assignment 2:
  - [ ] Name: `event_type`
  - [ ] Type: `String`
  - [ ] Value: `{{ $('Preparar Dados1').item.json.event_type }}`
- [ ] Adicionar Assignment 3:
  - [ ] Name: `bling_order_id`
  - [ ] Type: `Number`
  - [ ] Value: `{{ $('Preparar Dados1').item.json.bling_order_id }}`
- [ ] Adicionar Assignment 4:
  - [ ] Name: `message`
  - [ ] Type: `String`
  - [ ] Value: `Pedido deletado - detalhes não buscados para evitar rate limiting`
- [ ] Clicar em "Execute Node" para testar
- [ ] Verificar que o nó executa sem erro

### Passo 3: Modificar "Buscar Detalhes do Pedido1"

- [ ] Clicar no nó "Buscar Detalhes do Pedido1"
- [ ] Rolar até a seção "Options"
- [ ] Adicionar opção "Batching":
  - [ ] Clicar em "Add Option"
  - [ ] Selecionar "Batching"
  - [ ] Configurar Batch Size: `1`
  - [ ] Configurar Batch Interval: `1000`
- [ ] Adicionar opção "Timeout":
  - [ ] Clicar em "Add Option"
  - [ ] Selecionar "Timeout"
  - [ ] Configurar: `30000`
- [ ] Clicar em "Execute Node" para testar
- [ ] Verificar que o nó executa sem erro

### Passo 4: Reconectar os Nós

- [ ] Desconectar "Wait5" de "Buscar Detalhes do Pedido1" (se ainda conectado)
- [ ] Conectar "Wait5" → "É Evento Delete?"
- [ ] Conectar "É Evento Delete?" (output FALSE) → "Buscar Detalhes do Pedido1"
- [ ] Conectar "É Evento Delete?" (output TRUE) → "Processar Delete Direto"
- [ ] Conectar "Processar Delete Direto" → "Identificar Tipo de Evento1"
- [ ] Verificar visualmente que as conexões estão corretas

### Passo 5: Salvar e Ativar

- [ ] Clicar em "Save" no canto superior direito
- [ ] Aguardar confirmação de salvamento
- [ ] Verificar que o workflow está "Active" (toggle verde)
- [ ] Verificar que não há erros de validação

## Testes

### Teste 1: Delete de 1 Pedido

- [ ] Ir ao Bling
- [ ] Selecionar 1 pedido para deletar
- [ ] Anotar o número do pedido: `#______`
- [ ] Deletar o pedido
- [ ] Voltar ao N8N
- [ ] Ir em "Executions"
- [ ] Localizar a última execução
- [ ] Verificar que:
  - [ ] Nó "É Evento Delete?" executou
  - [ ] Output TRUE foi seguido
  - [ ] Nó "Processar Delete Direto" executou
  - [ ] Nó "Buscar Detalhes do Pedido1" NÃO executou
  - [ ] Sem erro 429
  - [ ] Status: Success
- [ ] Verificar log no Supabase:
  ```sql
  SELECT * FROM bling_sync_logs 
  WHERE event_type = 'order.deleted' 
  ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] Confirmar que `status = 'success'`

### Teste 2: Create de 1 Pedido

- [ ] Ir ao Bling
- [ ] Criar 1 pedido novo (ou clonar existente)
- [ ] Anotar o número do pedido: `#______`
- [ ] Voltar ao N8N
- [ ] Ir em "Executions"
- [ ] Localizar a última execução
- [ ] Verificar que:
  - [ ] Nó "É Evento Delete?" executou
  - [ ] Output FALSE foi seguido
  - [ ] Nó "Buscar Detalhes do Pedido1" executou
  - [ ] Nó "Processar Delete Direto" NÃO executou
  - [ ] Sem erro
  - [ ] Status: Success
- [ ] Verificar pedido no banco:
  ```sql
  SELECT * FROM bling_orders 
  WHERE order_number = ______ 
  LIMIT 1;
  ```
- [ ] Confirmar que o pedido foi inserido

### Teste 3: Delete de Múltiplos Pedidos

- [ ] Ir ao Bling
- [ ] Selecionar 3-5 pedidos para deletar
- [ ] Anotar os números: `#______, #______, #______, #______, #______`
- [ ] Deletar todos simultaneamente
- [ ] Voltar ao N8N
- [ ] Ir em "Executions"
- [ ] Verificar as últimas 3-5 execuções
- [ ] Para cada execução, verificar que:
  - [ ] Nó "É Evento Delete?" executou
  - [ ] Output TRUE foi seguido
  - [ ] Nó "Processar Delete Direto" executou
  - [ ] Sem erro 429
  - [ ] Status: Success
- [ ] Verificar logs no Supabase:
  ```sql
  SELECT 
    bling_order_id,
    status,
    error_message
  FROM bling_sync_logs 
  WHERE event_type = 'order.deleted' 
    AND created_at >= NOW() - INTERVAL '5 minutes'
  ORDER BY created_at DESC;
  ```
- [ ] Confirmar que TODOS têm `status = 'success'`
- [ ] Confirmar que NENHUM tem erro 429

### Teste 4: Update de 1 Pedido

- [ ] Ir ao Bling
- [ ] Editar 1 pedido existente (mudar observação, por exemplo)
- [ ] Anotar o número do pedido: `#______`
- [ ] Salvar as mudanças
- [ ] Voltar ao N8N
- [ ] Ir em "Executions"
- [ ] Localizar a última execução
- [ ] Verificar que:
  - [ ] Nó "É Evento Delete?" executou
  - [ ] Output FALSE foi seguido
  - [ ] Nó "Buscar Detalhes do Pedido1" executou
  - [ ] Sem erro
  - [ ] Status: Success

## Monitoramento Pós-Implementação

### Primeiras 24 Horas

- [ ] Hora 1: Verificar logs
  ```sql
  SELECT 
    event_type,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as sucesso,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as erro
  FROM bling_sync_logs
  WHERE created_at >= NOW() - INTERVAL '1 hour'
  GROUP BY event_type;
  ```
- [ ] Hora 4: Verificar logs novamente
- [ ] Hora 8: Verificar logs novamente
- [ ] Hora 24: Verificar logs e fazer análise completa

### Verificação de Erros 429

- [ ] Executar query:
  ```sql
  SELECT COUNT(*) as total_erros_429
  FROM bling_sync_logs
  WHERE (error_message LIKE '%429%' OR error_message LIKE '%rate limit%')
    AND created_at >= NOW() - INTERVAL '24 hours';
  ```
- [ ] Resultado esperado: `0`
- [ ] Se > 0, investigar e ajustar `batchInterval`

### Métricas de Performance

- [ ] Taxa de sucesso para deletes:
  ```sql
  SELECT 
    COUNT(*) as total_deletes,
    COUNT(CASE WHEN status = 'success' THEN 1 END) * 100.0 / COUNT(*) as taxa_sucesso
  FROM bling_sync_logs
  WHERE event_type = 'order.deleted'
    AND created_at >= NOW() - INTERVAL '24 hours';
  ```
- [ ] Resultado esperado: `100%`

- [ ] Tempo médio de processamento:
  ```sql
  SELECT 
    event_type,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as tempo_medio_segundos
  FROM bling_sync_logs
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY event_type;
  ```

## Troubleshooting

### Se Teste 1 Falhar

- [ ] Verificar que o nó "É Evento Delete?" está configurado corretamente
- [ ] Verificar que a condição é `equals` e não `contains`
- [ ] Verificar que o valor é exatamente `order.deleted`
- [ ] Verificar que a referência ao nó "Preparar Dados1" está correta

### Se Teste 2 Falhar

- [ ] Verificar que o output FALSE está conectado a "Buscar Detalhes do Pedido1"
- [ ] Verificar que o rate limiting foi adicionado corretamente
- [ ] Verificar logs de erro no N8N

### Se Teste 3 Falhar

- [ ] Verificar se algum erro 429 ainda ocorre
- [ ] Se sim, aumentar `batchInterval` para 2000ms
- [ ] Testar novamente

### Se Ainda Houver Erros 429

- [ ] Aumentar `batchInterval` para 2000ms
- [ ] Testar novamente
- [ ] Se persistir, aumentar para 3000ms
- [ ] Considerar adicionar retry logic

## Rollback (Se Necessário)

### Se Algo Der Errado

- [ ] Ir ao N8N
- [ ] Abrir o workflow
- [ ] Clicar nos 3 pontos → "Delete"
- [ ] Clicar nos 3 pontos → "Import from File"
- [ ] Selecionar o arquivo de backup
- [ ] Confirmar importação
- [ ] Ativar o workflow
- [ ] Verificar que está funcionando

## Documentação Final

### Após Implementação Bem-Sucedida

- [ ] Atualizar status em `RESUMO_CORRECAO_RATE_LIMITING.md`
- [ ] Documentar quaisquer ajustes feitos (ex: `batchInterval` diferente)
- [ ] Anotar data e hora da implementação
- [ ] Anotar resultados dos testes
- [ ] Arquivar backup do workflow antigo

### Comunicação

- [ ] Informar equipe sobre a mudança
- [ ] Explicar que deletes agora são mais rápidos
- [ ] Explicar que não haverá mais erros 429
- [ ] Compartilhar documentação

## Checklist de Conclusão

- [ ] Todos os testes passaram
- [ ] Monitoramento de 24h concluído
- [ ] Taxa de erro 429 = 0%
- [ ] Taxa de sucesso = 100%
- [ ] Documentação atualizada
- [ ] Equipe informada
- [ ] Backup arquivado
- [ ] Marcar tarefa como concluída

## Assinaturas

**Implementado por**: _____________________ Data: ___/___/______

**Testado por**: _____________________ Data: ___/___/______

**Aprovado por**: _____________________ Data: ___/___/______

## Notas Adicionais

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

## Status Final

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ✅ IMPLEMENTAÇÃO CONCLUÍDA                                 │
│                                                             │
│  Data: ___/___/______                                       │
│                                                             │
│  Resultados:                                                │
│  • Erros 429: ____%                                         │
│  • Taxa de sucesso: ____%                                   │
│  • Tempo médio: ___s                                        │
│                                                             │
│  Observações:                                               │
│  _________________________________________________________  │
│  _________________________________________________________  │
│  _________________________________________________________  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
