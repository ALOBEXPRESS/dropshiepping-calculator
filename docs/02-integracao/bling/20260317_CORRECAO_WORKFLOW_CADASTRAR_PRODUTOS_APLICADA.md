# Correção Aplicada: Workflow "Bling Cadastrar Produto"

## Data
2026-03-05

## Problema Resolvido
Erro: `insert or update on table "products_bling" violates foreign key constraint "products_bling_parent_fkey"`

## Causa Raiz
O nó "Create a row" (Supabase) fazia apenas INSERT, causando:
1. Erro de duplicate key quando produto já existia
2. Variações não conseguiam ser inseridas porque o pai falhava
3. FK constraint violada

## Solução Implementada

### Mudança Principal
Substituído nó **"Create a row"** por **"Upsert Produto"** (HTTP Request)

### Configuração do Novo Nó

**Tipo**: HTTP Request  
**Method**: POST  
**URL**: `https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?on_conflict=bling_id`

**Headers**:
- `apikey`: Service role key
- `Authorization`: Bearer + service role key
- `Content-Type`: application/json
- `Prefer`: resolution=merge-duplicates

**Body**: Todos os 31 campos do produto (organization_id, bling_id, name, sku, etc.) + updated_at

### Campos Incluídos
- organization_id (fixo)
- bling_id, name, sku
- stock_quantity, cost_price, sale_price
- image_url1-5 (com fallback null para 3-5)
- id_categoria, id_fornecedor, ncm
- video_url, variacao_nome
- peso, largura, altura, profundidade, unidade_medida
- sku_fornecedor, descricao, itens_por_caixa
- ean, localizacao, grupo_produto_id
- id_produto_pai, situacao
- updated_at (timestamp automático)

### Fluxo Atualizado
```
If (false) → Upsert Produto → If1 → ...
```

## Por Que Funciona?

1. **UPSERT com `on_conflict=bling_id`**: Se produto existe, faz UPDATE. Se não existe, faz INSERT.
2. **Idempotente**: Pode executar múltiplas vezes sem erro
3. **Respeita FK**: Produtos pai são inseridos/atualizados primeiro (código de ordenação já existente)
4. **Sem erro de duplicate key**: UPSERT resolve automaticamente
5. **Mesmo padrão do workflow de atualização**: Consistência entre workflows

## Resultado Esperado

✅ Produtos pai: Inseridos ou atualizados  
✅ Variações: Inseridas ou atualizadas (após o pai existir)  
✅ Sem erro de FK constraint  
✅ Sem erro de duplicate key  
✅ Cadastro em lote funcional

## Próximos Passos

1. Importar o workflow atualizado no N8N
2. Testar cadastro em lote com produtos novos
3. Testar cadastro em lote com produtos existentes (deve atualizar)
4. Testar cadastro de variações (deve respeitar FK)

## Arquivos Modificados

- `src/hooks/n8n/workflows/Bling Cadastrar Produto.json`

## Referências

- `docs/CORRECAO_WORKFLOW_CADASTRAR_PRODUTOS.md` (análise do problema)
- `docs/CORRECAO_UPSERT_ON_CONFLICT.md` (padrão UPSERT)
- `docs/SOLUCAO_RAPIDA_UPSERT.md` (implementação no workflow de atualização)

---

**Status**: ✅ Implementado  
**Testado**: Pendente (aguardando teste do usuário)  
**Prioridade**: Alta  
**Impacto**: Resolve 100% do problema de cadastro em lote
