# Correção do Workflow N8N - Remoção de Campos Inexistentes

## Problemas Identificados

O workflow estava tentando inserir campos na tabela `products_bling` que não existem nessa tabela.

**Erros originais:**
```
1. Could not find the 'id_produto_pai' column of 'products_bling' in the schema cache
2. Could not find the 'variacao_nome' column of 'products_bling' in the schema cache
```

## Estrutura Correta do Banco

### products_bling (Produtos PAI)
Armazena apenas produtos PAI (sem variações). Campos que NÃO existem:
- ❌ `id_produto_pai` - Produtos pai não têm referência a outro produto
- ❌ `variacao_nome` - Produtos pai não têm nome de variação

### products_variations_bling (Variações)
Armazena as variações dos produtos. Campos que EXISTEM:
- ✅ `product_id` (UUID) - FK para products_bling
- ✅ `product_bling_id` (bigint) - ID do produto pai no Bling
- ✅ `variacao_nome` - Nome da variação (ex: "Cor:Dourado e Branco")

## Correções Realizadas

### 1. Removido parâmetro `id_produto_pai` do nó "Upsert no banco (Cria ou Atualiza)"

**Antes:**
```json
{
  "name": "situacao",
  "value": "={{ $json.productData.data.situacao }}"
},
{
  "name": "id_produto_pai",
  "value": "={{ $json.productData.data.variacao.produtoPai.id }}"
}
```

**Depois:**
```json
{
  "name": "situacao",
  "value": "={{ $json.productData.data.situacao }}"
}
```

### 2. Removido parâmetro `variacao_nome` do nó "Upsert no banco (Cria ou Atualiza)"

**Antes:**
```json
{
  "name": "video_url",
  "value": "={{ $json.productData.data.midia.video.url }}"
},
{
  "name": "variacao_nome",
  "value": "={{ $json.productData.data.variacao.nome }}"
},
{
  "name": "peso",
  "value": "={{ $json.productData.data.pesoBruto }}"
}
```

**Depois:**
```json
{
  "name": "video_url",
  "value": "={{ $json.productData.data.midia.video.url }}"
},
{
  "name": "peso",
  "value": "={{ $json.productData.data.pesoBruto }}"
}
```

### 3. Removidos campos do array de comparação no nó "Detecta Mudanças"

**Antes:**
```javascript
const fieldsToCompare = [
  // ... outros campos
  { db: 'video_url', bling: 'midia.video.url' },
  { db: 'variacao_nome', bling: 'variacao.nome' },
  { db: 'id_categoria', bling: 'categoria.id' },
  // ... outros campos
  { db: 'grupo_produto_id', bling: 'tributacao.grupoProduto.id' },
  { db: 'id_produto_pai', bling: 'variacao.produtoPai.id' },
  { db: 'sku_fornecedor', bling: 'fornecedor.codigo' }
];
```

**Depois:**
```javascript
const fieldsToCompare = [
  // ... outros campos
  { db: 'video_url', bling: 'midia.video.url' },
  { db: 'id_categoria', bling: 'categoria.id' },
  // ... outros campos
  { db: 'grupo_produto_id', bling: 'tributacao.grupoProduto.id' },
  { db: 'sku_fornecedor', bling: 'fornecedor.codigo' }
];
```

## Validação

✅ JSON do workflow validado com sucesso usando `python -m json.tool`
✅ Estrutura do workflow mantida intacta
✅ Apenas as referências aos campos inexistentes foram removidas
✅ Campos removidos: `id_produto_pai` e `variacao_nome`

## Próximos Passos

1. Importar o workflow corrigido no N8N
2. Testar o cadastro/atualização de produtos PAI
3. Verificar se o workflow agora executa sem erros
4. Testar o cadastro de variações (que usa a tabela `products_variations_bling`)

## Arquivo Modificado

- `src/hooks/n8n/workflows/Bling Cadastrar_Atualizar_Deletar Produto Automatization.json`
