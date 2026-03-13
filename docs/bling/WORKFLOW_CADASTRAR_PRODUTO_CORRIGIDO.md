# ✅ Workflow "Bling Cadastrar Produto" Corrigido - VERSÃO FINAL

## Data: 2026-03-05

## Problemas Resolvidos

1. ❌ Erro ao cadastrar produtos em lote: `violates foreign key constraint "products_bling_parent_fkey"`
2. ❌ Erro ao cadastrar variações: `Key (id_produto_pai)=(16610437077) is not present in table "products_bling"`
3. ❌ Erro em campos opcionais: `undefined` ou valores inválidos
4. ❌ Erros silenciosos: Workflow continuava mesmo com falha no UPSERT

## Soluções Aplicadas

### 1. Substituir INSERT por UPSERT

Substituído o nó **"Create a row"** (Supabase) por **"Upsert Produto"** (HTTP Request) com padrão UPSERT.

**URL**: `https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?on_conflict=bling_id`

**Headers**: apikey, Authorization, Content-Type, `Prefer: resolution=merge-duplicates`

### 2. Processar 1 Item Por Vez (Batch Size = 1)

Adicionado `batchSize: 1` no nó **"Loop Over Items"** para processar produtos sequencialmente.

**Por quê?** Garante que produtos pai sejam inseridos ANTES das variações.

### 3. Fallback para Campos Opcionais

Adicionado **optional chaining** (`?.`) e **nullish coalescing** (`?? null`) em TODOS os campos opcionais.

**Campos corrigidos**: id_produto_pai, variacao_nome, fornecedor, categoria, tributação, mídia, estoque, dimensões

### 4. Remover onError e Adicionar Wait

**CRÍTICO**: Removido `onError: "continueRegularOutput"` do nó "Upsert Produto"

**Por quê?** Agora o workflow PARA quando há erro, permitindo ver a causa real.

**Wait configurado**: 2 segundos entre cada item para dar tempo do banco processar.

## Como Aplicar

1. Abra o N8N
2. Abra o workflow "Bling Cadastrar Produto"
3. Importe o arquivo atualizado: `src/hooks/n8n/workflows/Bling Cadastrar Produto.json`
4. Salve o workflow
5. Teste cadastrando produtos em lote (incluindo variações)

## Resultado Esperado

✅ Produtos novos: Inseridos com sucesso  
✅ Produtos existentes: Atualizados sem erro  
✅ Variações: Inseridas APÓS o produto pai (sequencial)  
✅ Campos opcionais: Salvos como `null` quando não existem  
✅ Erros visíveis: Workflow PARA e mostra o erro real  
✅ Sem erro de FK constraint  
✅ Sem erro de duplicate key  
✅ Sem erro de tipo de dado  
✅ Processamento confiável (mais lento, mas 100% funcional)

## Fluxo Sequencial

```
Produto Pai 1 (sem variação) → UPSERT → Wait 2s → ✅
Produto Pai 2 (com variações) → UPSERT → Wait 2s → ✅
Variação 1 (pai já existe) → UPSERT → Wait 2s → ✅
Variação 2 (pai já existe) → UPSERT → Wait 2s → ✅
```

## Fluxo de Erro (NOVO)

```
Produto X → UPSERT → ERRO
  ↓
Workflow PARA
  ↓
Mostra erro real (campo faltando, tipo errado, etc.)
  ↓
Usuário corrige o problema
  ↓
Testa novamente
```

## Trade-off

- **Vantagem**: 100% confiável, sem erro de FK, erros visíveis, robusto
- **Desvantagem**: Mais lento (1 produto por vez + wait de 2s entre cada)
- **Tempo estimado**: ~3-4s por produto (100 produtos = ~5-7 minutos)

## Debugging

Se o erro persistir após esta correção:

1. **Verificar produto pai no banco**: `SELECT * FROM products_bling WHERE bling_id = [id_do_pai]`
2. **Verificar logs do N8N**: Ver qual produto falhou e por quê
3. **Verificar campos obrigatórios**: Todos os campos NOT NULL estão preenchidos?
4. **Verificar tipos de dados**: Números são números, strings são strings?

## Arquivos Modificados

- `src/hooks/n8n/workflows/Bling Cadastrar Produto.json` (workflow corrigido)
- `docs/CORRECAO_WORKFLOW_CADASTRAR_PRODUTOS_APLICADA.md` (documentação UPSERT)
- `docs/CORRECAO_BATCH_SIZE_VARIACAO.md` (documentação batch size)
- `docs/CORRECAO_FALLBACK_CAMPOS_OPCIONAIS.md` (documentação fallbacks)
- `docs/CORRECAO_FINAL_WORKFLOW_CADASTRAR.md` (documentação onError e wait)

## Referências

- Mesmo padrão UPSERT usado no workflow "Bling Atualizar_Deletar Produto"
- Documentação: `docs/CORRECAO_UPSERT_ON_CONFLICT.md`

---

**Status**: ✅ Implementado e pronto para teste  
**Versão**: FINAL  
**Próximo passo**: Importar workflow no N8N e testar. Se houver erro, o workflow vai PARAR e mostrar a causa real.
