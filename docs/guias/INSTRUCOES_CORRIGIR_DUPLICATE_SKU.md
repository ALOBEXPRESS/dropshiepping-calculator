# Instruções: Corrigir Erro de SKU Duplicado

## Problema
Erro: `duplicate key value violates unique constraint "products_bling_sku_key"`

Produto: CORRENTE DE AÇO 3 EM 1 FINA (SKU: 2023171245)

## Causa
O produto já existe no banco. O workflow está tentando fazer INSERT ao invés de UPDATE.

## Solução Rápida (10 minutos)

### Opção 1: Usar HTTP Request com UPSERT (RECOMENDADO)

#### Passo 1: Deletar o nó "Create a row"

1. Abra o workflow "Bling Cadastrar Produto"
2. Localize o nó "Create a row" (Supabase)
3. Clique com botão direito → Delete

#### Passo 2: Adicionar nó "HTTP Request"

1. Adicione novo nó "HTTP Request"
2. Configure:

**Request:**
- Method: `POST`
- URL: `https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling`

**Headers** (clique em "Add Header" para cada um):

| Name | Value |
|------|-------|
| apikey | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg` |
| Authorization | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg` |
| Content-Type | `application/json` |
| Prefer | `resolution=merge-duplicates` |

**Body:**
- Selecione "JSON"
- Cole o código abaixo:

```json
{
  "organization_id": "28b4b443-03fd-4a2d-b596-9dcaf142b389",
  "bling_id": "={{ $json.data.id }}",
  "name": "={{ $json.data.nome }}",
  "sku": "={{ $json.data.codigo }}",
  "stock_quantity": "={{ $json.data.estoque.saldoVirtualTotal }}",
  "cost_price": "={{ $json.data.fornecedor.precoCusto }}",
  "sale_price": "={{ $json.data.preco }}",
  "updated_at": "={{ new Date().toISOString() }}",
  "image_url1": "={{ $json.data.midia.imagens.externas[0]?.link ?? null }}",
  "image_url2": "={{ $json.data.midia.imagens.externas[1]?.link ?? null }}",
  "image_url3": "={{ $json.data.midia.imagens.externas[2]?.link ?? null }}",
  "image_url4": "={{ $json.data.midia.imagens.externas[3]?.link ?? null }}",
  "image_url5": "={{ $json.data.midia.imagens.externas[4]?.link ?? null }}",
  "image_url6": "={{ $json.data.midia.imagens.externas[5]?.link ?? null }}",
  "image_url7": "={{ $json.data.midia.imagens.externas[6]?.link ?? null }}",
  "image_url8": "={{ $json.data.midia.imagens.externas[7]?.link ?? null }}",
  "image_url9": "={{ $json.data.midia.imagens.externas[8]?.link ?? null }}",
  "image_url10": "={{ $json.data.midia.imagens.externas[9]?.link ?? null }}",
  "id_categoria": "={{ $json.data.categoria?.id ?? null }}",
  "id_fornecedor": "={{ $json.data.fornecedor?.id ?? null }}",
  "ncm": "={{ $json.data.tributacao?.ncm ?? null }}",
  "video_url": "={{ $json.data.midia?.video?.url ?? null }}",
  "variacao_nome": "={{ $json.data.variacao?.nome ?? null }}",
  "peso": "={{ $json.data.pesoBruto ?? null }}",
  "largura": "={{ $json.data.dimensoes?.largura ?? null }}",
  "altura": "={{ $json.data.dimensoes?.altura ?? null }}",
  "profundidade": "={{ $json.data.dimensoes?.profundidade ?? null }}",
  "unidade_medida": "={{ $json.data.dimensoes?.unidadeMedida ?? null }}",
  "sku_fornecedor": "={{ $json.data.fornecedor?.codigo ?? null }}",
  "descricao": "={{ $json.data.descricaoCurta ?? null }}",
  "itens_por_caixa": "={{ $json.data.itensPorCaixa ?? null }}",
  "ean": "={{ $json.data.gtin ?? null }}",
  "localizacao": "={{ $json.data.estoque?.localizacao ?? null }}",
  "grupo_produto_id": "={{ $json.data.tributacao?.grupoProduto?.id ?? null }}",
  "situacao": "={{ $json.data.situacao ?? null }}",
  "id_produto_pai": "={{ $json.data.variacao?.produtoPai?.id ?? null }}"
}
```

#### Passo 3: Conectar ao fluxo

1. Conecte o novo nó "HTTP Request" ao fluxo
2. Deve ficar: `HTTP Obter Produtos1` → `If` → `HTTP Request (novo)`

#### Passo 4: Salvar e testar

1. Salve o workflow
2. Execute manualmente
3. Verifique se não há mais erros de SKU duplicado

### Opção 2: Ignorar Erros (Mais Simples, Menos Ideal)

Se você não quiser modificar o workflow agora:

1. Clique no nó "Create a row"
2. Vá em "Settings" (ícone de engrenagem)
3. Em "On Error", selecione "Continue"
4. Salve

**Desvantagem**: Produtos existentes NÃO serão atualizados, apenas ignorados.

## O que o UPSERT faz?

O header `Prefer: resolution=merge-duplicates` faz:

- ✅ Se produto NÃO existe: INSERT (cria novo)
- ✅ Se produto JÁ existe: UPDATE (atualiza)

Isso resolve o problema de SKU duplicado!

## Verificar no Banco

Após executar, verifique se o produto foi atualizado:

```sql
SELECT id, bling_id, name, sku, updated_at
FROM products_bling
WHERE sku = '2023171245'
ORDER BY updated_at DESC;
```

Deve mostrar o produto com `updated_at` recente.

## Resumo

1. Deletar nó "Create a row"
2. Adicionar nó "HTTP Request" com header `Prefer: resolution=merge-duplicates`
3. Configurar body JSON com todos os campos
4. Salvar e testar

Isso vai fazer UPSERT automático e resolver o erro de SKU duplicado!

## Arquivos de Referência

- `docs/SOLUCAO_DUPLICATE_SKU_BLING.md` - Documentação completa
- `src/hooks/n8n/code-snippets/preparar-upsert-produto-bling.js` - Código alternativo
