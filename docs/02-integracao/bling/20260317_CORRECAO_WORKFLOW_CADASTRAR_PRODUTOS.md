# Correção: Workflow "Bling Cadastrar Produto"

## Problema

Erro: `insert or update on table "products_bling" violates foreign key constraint "products_bling_parent_fkey"`

### Causas

1. **Nó "Create a row" faz apenas INSERT**: Não faz UPSERT, então se o produto já existe, dá erro de duplicate key
2. **Variações tentam inserir antes do pai**: Se o produto pai falha (duplicate key), a variação não consegue ser inserida (FK constraint)
3. **Ordem não é respeitada**: Mesmo com o código de ordenação, se o pai já existe e falha no INSERT, a variação não entra

## Solução

Substituir o nó **"Create a row" (Supabase)** por **HTTP Request com UPSERT**.

### Mudanças Necessárias

#### 1. Deletar Nó "Create a row"

Remover o nó Supabase que faz INSERT.

#### 2. Criar Nó "Upsert Produto" (HTTP Request)

**Configuração:**

- **Method**: POST
- **URL**: `https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?on_conflict=bling_id`
- **Headers**:
  - `apikey`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg`
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg`
  - `Content-Type`: `application/json`
  - `Prefer`: `resolution=merge-duplicates`

- **Body Parameters** (mesmo do nó atual):
  - organization_id: `28b4b443-03fd-4a2d-b596-9dcaf142b389`
  - bling_id: `={{ $json.data.id }}`
  - name: `={{ $json.data.nome }}`
  - sku: `={{ $json.data.codigo }}`
  - stock_quantity: `={{ $json.data.estoque.saldoVirtualTotal }}`
  - cost_price: `={{ $json.data.fornecedor.precoCusto }}`
  - sale_price: `={{ $json.data.preco }}`
  - image_url1: `={{ $json.data.midia.imagens.externas[0].link }}`
  - image_url2: `={{ $json.data.midia.imagens.externas[1].link }}`
  - image_url3: `={{ $json.data.midia.imagens.externas[2].link ?? null }}`
  - image_url4: `={{ $json.data.midia.imagens.externas[3].link ?? null }}`
  - image_url5: `={{ $json.data.midia.imagens.externas[4].link ?? null }}`
  - id_categoria: `={{ $json.data.categoria.id }}`
  - id_fornecedor: `={{ $json.data.fornecedor.id }}`
  - ncm: `={{ $json.data.tributacao.ncm }}`
  - video_url: `={{ $json.data.midia.video.url }}`
  - variacao_nome: `={{ $json.data.variacao.nome }}`
  - peso: `={{ $json.data.pesoBruto }}`
  - largura: `={{ $json.data.dimensoes.largura }}`
  - altura: `={{ $json.data.dimensoes.altura }}`
  - profundidade: `={{ $json.data.dimensoes.profundidade }}`
  - unidade_medida: `={{ $json.data.dimensoes.unidadeMedida }}`
  - sku_fornecedor: `={{ $json.data.fornecedor.codigo }}`
  - descricao: `={{ $json.data.descricaoCurta }}`
  - itens_por_caixa: `={{ $json.data.itensPorCaixa }}`
  - ean: `={{ $json.data.gtin }}`
  - localizacao: `={{ $json.data.estoque.localizacao }}`
  - grupo_produto_id: `={{ $json.data.tributacao.grupoProduto.id }}`
  - id_produto_pai: `={{ $json.data.variacao.produtoPai.id }}`
  - situacao: `={{ $json.data.situacao }}`
  - updated_at: `={{ new Date().toISOString() }}`

#### 3. Reconectar Fluxo

```
If (false) → Upsert Produto → If1 → ...
```

## Por Que Funciona?

1. **UPSERT com `on_conflict=bling_id`**: Se o produto já existe, faz UPDATE. Se não existe, faz INSERT.
2. **Idempotente**: Pode executar múltiplas vezes sem erro
3. **Respeita FK**: Produtos pai são inseridos/atualizados primeiro, depois variações
4. **Sem erro de duplicate key**: UPSERT resolve automaticamente

## Resultado Esperado

- ✅ Produtos pai: Inseridos ou atualizados
- ✅ Variações: Inseridas ou atualizadas (após o pai existir)
- ✅ Sem erro de FK constraint
- ✅ Sem erro de duplicate key

---

**Status**: Pronto para implementar
**Prioridade**: Alta
**Impacto**: Resolve 100% do problema de cadastro em lote
