# Resumo da Sessão: Workflows Bling Cadastrar Produto

## Data
2026-03-05

## Objetivo

Corrigir workflows N8N para cadastrar produtos do Bling no Supabase, incluindo produtos com variações.

## Problemas Resolvidos

### 1. Workflow "Bling Cadastrar Produto" (Página por Página)

**Problema**: Erro de FK constraint ao tentar cadastrar variações antes do produto pai existir.

**Causa**: Produto pai (ex: C1047) não existia no banco quando a variação (ex: C10473G) tentava ser inserida.

**Solução**: 
- ✅ Adicionado `batchSize: 1` no nó "Loop Over Items1"
- ✅ Adicionado `amount: 2` nos nós "Wait2" e "Wait3"
- ✅ Código de ordenação já estava correto (produtos pai primeiro, variações depois)

**Status**: ✅ Funcionando (mas limitado a 100 produtos por execução)

### 2. Workflow "Bling Cadastrar Produto Todas as Páginas"

**Problema**: Workflow original buscava apenas 100 produtos (página 1).

**Solução Implementada**:
- ✅ Criado nó "Buscar Todas Páginas" que busca TODAS as páginas da API do Bling
- ✅ Processa 100 produtos por página até acabar
- ✅ Ordena produtos pai primeiro, variações depois
- ✅ `batchSize: 1` para processamento sequencial
- ✅ `amount: 2` nos nós Wait (2 segundos entre produtos)
- ✅ UPSERT correto com `on_conflict=bling_id` e `Prefer: resolution=merge-duplicates`
- ✅ Fallbacks (`??`) em todos os campos opcionais

**Status**: ✅ Funcionando perfeitamente!

## Arquivos Criados/Modificados

### Workflows
- `src/hooks/n8n/workflows/Bling Cadastrar Produto Página por Página.json` (corrigido)
- `src/hooks/n8n/workflows/Bling Cadastrar Produto Todas as Páginas.json` (funcionando)
- `src/hooks/n8n/workflows/Bling Cadastrar Produto.json` (com paginação - não usado)

### Código
- `src/hooks/n8n/code-snippets/buscar-todas-paginas-bling.js` (paginação automática)
- `src/hooks/n8n/code-snippets/verificar-e-cadastrar-produto-pai.js` (solução alternativa)

### Documentação
- `docs/PAGINACAO_WORKFLOW_IMPLEMENTADA.md`
- `docs/SOLUCAO_PRODUTO_PAI_AUTOMATICO.md`
- `docs/RESUMO_SESSAO_WORKFLOWS_BLING.md` (este arquivo)

## Fluxo Final do Workflow "Todas as Páginas"

```
When clicking 'Execute workflow'
  ↓
Pegar Acess Token1
  ↓
Buscar Todas Páginas (busca TODAS as páginas do Bling)
  ↓
Split Out (separa array em itens)
  ↓
Loop Over Items (batchSize: 1 - processa 1 por vez)
  ↓
HTTP Obter Produtos1 (busca detalhes do produto)
  ↓
If (verifica erro HTTP)
  ↓ (false = sem erro)
Upsert Produto (cadastra/atualiza com UPSERT)
  ↓
If1 (verifica erro UPSERT)
  ↓ (false = sem erro)
Wait (2 segundos)
  ↓
Replace Me
  ↓
Loop Over Items (próximo produto)
```

## Características do Workflow Final

✅ Busca TODAS as páginas de produtos do Bling (não apenas 100)  
✅ Ordena produtos pai primeiro, variações depois  
✅ Processamento sequencial (1 produto por vez)  
✅ UPSERT correto (insere ou atualiza)  
✅ Fallbacks em todos os campos opcionais  
✅ Wait de 2 segundos entre produtos  
✅ Logs detalhados para debug  

## Tempo de Processamento Estimado

- **Por produto**: ~3-4 segundos (HTTP + UPSERT + Wait)
- **100 produtos**: ~5-7 minutos
- **500 produtos**: ~25-33 minutos
- **1000 produtos**: ~50-66 minutos

## Solução Alternativa (Não Implementada)

Criamos o código `verificar-e-cadastrar-produto-pai.js` que:
- Detecta se o produto é uma variação
- Verifica se o produto pai existe no banco
- Se não existir, busca na API do Bling e cadastra automaticamente
- Depois permite cadastrar a variação

**Quando usar**: Se o workflow "Todas as Páginas" ainda apresentar erro de FK constraint (raro, mas possível se pai e variação estiverem em páginas muito distantes).

## Validação

✅ Produto pai C1259 (bling_id 16610437077) existe no banco  
✅ 24 variações do produto C1259 cadastradas com sucesso  
✅ Produto pai C1047 NÃO existe (por isso a variação C10473G dava erro)  
✅ Workflow "Todas as Páginas" funcionou perfeitamente  

## Próximos Passos

1. ✅ Workflow "Todas as Páginas" está pronto para uso em produção
2. ⏳ Monitorar execuções para garantir que não há mais erros de FK constraint
3. ⏳ Se necessário, adicionar nó "Verificar Produto Pai" como camada extra de segurança

## Configurações Importantes

- **Organization ID**: `28b4b443-03fd-4a2d-b596-9dcaf142b389`
- **Supabase Project ID**: `oensqhjnxwpcuanozske`
- **Supabase URL**: `https://oensqhjnxwpcuanozske.supabase.co`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg`

---

**Status**: ✅ Concluído com sucesso  
**Workflow Recomendado**: "Bling Cadastrar Produto Todas as Páginas"  
**Resultado**: Funcionando perfeitamente! 🎉
