# Resumo: Correção Rate Limiting Bling API

## Problema

Ao deletar múltiplos pedidos no Bling, o workflow recebe erro HTTP 429 (rate limit exceeded):

```
Error: Try spacing your requests out using the batching settings under 'Options'
Status: 429
Event: order.deleted
```

## Causa

O workflow tenta buscar detalhes de pedidos deletados, causando múltiplas requisições simultâneas à API do Bling que tem rate limiting.

## Solução

### 1. Pular Busca de Detalhes para Eventos Delete

Adicionar nó condicional que verifica se é evento `order.deleted` e pula a busca de detalhes (pedidos deletados não precisam de detalhes).

### 2. Adicionar Rate Limiting nas Requisições HTTP

Configurar batching no nó HTTP para processar 1 requisição por vez com delay de 1 segundo entre elas.

## Implementação Rápida

### Mudanças Necessárias

1. **Adicionar nó "É Evento Delete?"** (IF)
   - Condição: `event_type == "order.deleted"`
   - Entre "Wait5" e "Buscar Detalhes do Pedido1"

2. **Adicionar nó "Processar Delete Direto"** (Set)
   - Conectado ao output TRUE do IF
   - Prepara dados sem buscar detalhes

3. **Modificar "Buscar Detalhes do Pedido1"**
   - Adicionar Options → Batching:
     - Batch Size: 1
     - Batch Interval: 1000ms
   - Adicionar Options → Timeout: 30000ms

4. **Reconectar Fluxo**
   ```
   Wait5 → É Evento Delete?
            ├─ FALSE → Buscar Detalhes (com rate limiting)
            └─ TRUE → Processar Delete Direto
   ```

## Arquivos Criados

1. **`docs/SOLUCAO_RATE_LIMITING_BLING_API.md`**
   - Documentação técnica completa
   - Explicação detalhada da solução
   - Código JSON dos nós
   - Queries SQL para monitoramento

2. **`docs/GUIA_VISUAL_CORRECAO_RATE_LIMITING.md`**
   - Guia passo a passo com screenshots
   - Checklist de implementação
   - Testes de validação
   - Troubleshooting

3. **`docs/RESUMO_CORRECAO_RATE_LIMITING.md`** (este arquivo)
   - Resumo executivo
   - Quick reference

## Como Implementar

### Opção 1: Implementação Manual no N8N (Recomendado)

1. Abra o workflow no N8N
2. Siga o guia em `GUIA_VISUAL_CORRECAO_RATE_LIMITING.md`
3. Teste conforme descrito
4. Monitore por 24h

### Opção 2: Modificação do JSON

1. Faça backup do workflow atual
2. Edite o arquivo JSON seguindo `SOLUCAO_RATE_LIMITING_BLING_API.md`
3. Importe o workflow modificado no N8N
4. Teste e monitore

## Testes Obrigatórios

### ✅ Teste 1: Delete de 1 Pedido
- Delete 1 pedido no Bling
- Verifique que NÃO há erro 429
- Verifique que o nó "Processar Delete Direto" executou

### ✅ Teste 2: Create de 1 Pedido
- Crie 1 pedido no Bling
- Verifique que o fluxo normal funciona
- Verifique que o pedido foi inserido no banco

### ✅ Teste 3: Delete de Múltiplos Pedidos
- Delete 3-5 pedidos simultaneamente
- Verifique que NENHUM erro 429 ocorre
- Verifique logs no Supabase

## Monitoramento

### Query Rápida

```sql
-- Verificar se ainda há erros 429
SELECT COUNT(*) as erros_429
FROM bling_sync_logs
WHERE error_message LIKE '%429%'
  AND created_at >= NOW() - INTERVAL '24 hours';
```

**Resultado esperado**: 0 erros

## Benefícios

- ✅ Elimina erros 429 ao deletar pedidos
- ✅ Melhora performance (pula busca desnecessária)
- ✅ Adiciona proteção contra rate limiting
- ✅ Mantém funcionalidade completa para create/update

## Status Atual

⏳ **SOLUÇÃO DOCUMENTADA - AGUARDANDO IMPLEMENTAÇÃO**

## Próximos Passos

1. [ ] Fazer backup do workflow atual
2. [ ] Implementar mudanças no N8N
3. [ ] Executar testes 1, 2 e 3
4. [ ] Monitorar por 24-48 horas
5. [ ] Marcar como concluído

## Suporte

- Documentação completa: `docs/SOLUCAO_RATE_LIMITING_BLING_API.md`
- Guia visual: `docs/GUIA_VISUAL_CORRECAO_RATE_LIMITING.md`
- Logs: Supabase → `bling_sync_logs`

## Tempo Estimado

- Implementação: 15-20 minutos
- Testes: 10-15 minutos
- Total: ~30 minutos

## Risco

🟢 **BAIXO** - Mudanças isoladas, fácil de reverter se necessário
