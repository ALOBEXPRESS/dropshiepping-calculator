# Solução: Erro de SKU Duplicado no Workflow Bling

## Problema

Erro: `duplicate key value violates unique constraint "products_bling_sku_key"`

Exemplo: Produto "CORRENTE DE AÇO 3 EM 1 FINA" (SKU: 2023171245)

## Causa

A tabela `products_bling` tem uma constraint UNIQUE no campo `sku`:

```sql
ALTER TABLE products_bling 
ADD CONSTRAINT products_bling_sku_key 
UNIQUE (sku);
```

Quando o workflow tenta inserir um produto que já existe, o banco rejeita a operação.

## Por que isso acontece?

1. Você executou o workflow anteriormente e alguns produtos foram inseridos
2. Ao executar novamente, o workflow tenta inserir os mesmos produtos
3. O banco detecta SKU duplicado e rejeita

## Solução: Usar UPSERT (INSERT ou UPDATE)

### Opção 1: Usar HTTP Request com Prefer Header (RECOMENDADO)

No nó que faz a inserção no Supabase, você está usando o nó "Create a row" do Supabase. 

**Problema**: Este nó sempre faz INSERT, nunca UPDATE.

**Solução**: Substituir por HTTP Request com header `Prefer: resolution=merge-duplicates`

#### Passos:

1. **Deletar o nó "Create a row" (Supabase)**

2. **Adicionar novo nó "HTTP Request"** com as seguintes configurações:

**Request:**
- Method: `POST`
- URL: `https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling`

**Headers:**
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg

Content-Type: application/json

Prefer: resolution=merge-duplicates
```

**Body (JSON):**
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
  "image_url1": "={{ $json.data.midia.imagens.externas[0].link }}",
  "image_url2": "={{ $json.data.midia.imagens.externas[1].link }}",
  "image_url3": "={{ $json.data.midia.imagens.externas[2].link ?? null }}",
  "image_url4": "={{ $json.data.midia.imagens.externas[3].link ?? null }}",
  "image_url5": "={{ $json.data.midia.imagens.externas[4].link ?? null }}",
  "image_url6": "={{ $json.data.midia.imagens.externas[5].link ?? null }}",
  "image_url7": "={{ $json.data.midia.imagens.externas[6].link ?? null }}",
  "image_url8": "={{ $json.data.midia.imagens.externas[7].link ?? null }}",
  "image_url9": "={{ $json.data.midia.imagens.externas[8].link ?? null }}",
  "image_url10": "={{ $json.data.midia.imagens.externas[9].link ?? null }}",
  "id_categoria": "={{ $json.data.categoria.id }}",
  "id_fornecedor": "={{ $json.data.fornecedor.id }}",
  "ncm": "={{ $json.data.tributacao.ncm }}",
  "video_url": "={{ $json.data.midia.video.url }}",
  "variacao_nome": "={{ $json.data.variacao.nome }}",
  "peso": "={{ $json.data.pesoBruto }}",
  "largura": "={{ $json.data.dimensoes.largura }}",
  "altura": "={{ $json.data.dimensoes.altura }}",
  "profundidade": "={{ $json.data.dimensoes.profundidade }}",
  "unidade_medida": "={{ $json.data.dimensoes.unidadeMedida }}",
  "sku_fornecedor": "={{ $json.data.fornecedor.codigo }}",
  "descricao": "={{ $json.data.descricaoCurta }}",
  "itens_por_caixa": "={{ $json.data.itensPorCaixa }}",
  "ean": "={{ $json.data.gtin }}",
  "localizacao": "={{ $json.data.estoque.localizacao }}",
  "grupo_produto_id": "={{ $json.data.tributacao.grupoProduto.id }}",
  "situacao": "={{ $json.data.situacao }}",
  "id_produto_pai": "={{ $json.data.variacao.produtoPai.id }}"
}
```

**O que o header `Prefer: resolution=merge-duplicates` faz:**

- Se o produto NÃO existe (baseado em `bling_id` ou `sku`): faz INSERT
- Se o produto JÁ existe: faz UPDATE
- Isso é chamado de UPSERT (UPDATE + INSERT)

### Opção 2: Usar Nó "Code" para Verificar Antes de Inserir

Adicionar um nó "Code" ANTES do "Create a row" para verificar se o produto já existe:

```javascript
const produto = $json.data;
const sku = produto.codigo;

// Fazer query no Supabase para verificar se SKU existe
// Se existir, fazer UPDATE
// Se não existir, fazer INSERT

// Este código requer configuração adicional do Supabase no n8n
```

**Desvantagem**: Mais complexo e requer duas chamadas ao banco (SELECT + INSERT/UPDATE)

### Opção 3: Ignorar Erros de Duplicação

No nó "Create a row", configurar:

**On Error**: Continue Regular Output

Isso faz com que o workflow continue mesmo se houver erro de duplicação.

**Desvantagem**: Não atualiza produtos existentes, apenas ignora

## Solução Recomendada: Implementação Passo a Passo

### 1. Modificar o Workflow

1. Abra o workflow "Bling Cadastrar Produto"
2. Localize o nó "Create a row" (Supabase)
3. Clique com botão direito → Delete
4. Adicione novo nó "HTTP Request"
5. Configure conforme descrito acima
6. Conecte ao fluxo

### 2. Testar

1. Execute o workflow manualmente
2. Verifique se não há mais erros de SKU duplicado
3. Confirme que produtos existentes foram atualizados

### 3. Verificar no Banco

```sql
-- Ver produto específico
SELECT id, bling_id, name, sku, updated_at
FROM products_bling
WHERE sku = '2023171245';

-- Ver últimos produtos atualizados
SELECT id, bling_id, name, sku, updated_at
FROM products_bling
ORDER BY updated_at DESC
LIMIT 10;
```

## Como Funciona o UPSERT no Supabase

O Supabase usa o header `Prefer: resolution=merge-duplicates` para fazer UPSERT baseado em:

1. **Primary Key** (`id`)
2. **Unique Constraints** (`bling_id`, `sku`)

Quando você envia um POST com este header:
- Se `bling_id` ou `sku` já existe: UPDATE
- Se não existe: INSERT

## Alternativa: Usar ON CONFLICT no SQL

Se preferir usar SQL direto:

```sql
INSERT INTO products_bling (
  organization_id, bling_id, name, sku, stock_quantity, cost_price, sale_price, updated_at
) VALUES (
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  123456,
  'CORRENTE DE AÇO 3 EM 1 FINA',
  '2023171245',
  10,
  50.00,
  100.00,
  NOW()
)
ON CONFLICT (sku) 
DO UPDATE SET
  name = EXCLUDED.name,
  stock_quantity = EXCLUDED.stock_quantity,
  cost_price = EXCLUDED.cost_price,
  sale_price = EXCLUDED.sale_price,
  updated_at = EXCLUDED.updated_at;
```

## Resumo

O erro de SKU duplicado é **normal** quando você executa o workflow múltiplas vezes. A solução é usar UPSERT ao invés de INSERT puro, através do header `Prefer: resolution=merge-duplicates` no HTTP Request.

## Arquivos de Referência

- Workflow atual: `src/hooks/n8n/workflows/Bling Cadastrar Produto.json`
- Migration com constraints: `supabase/migrations/00000000_complete_database_schema.sql`
