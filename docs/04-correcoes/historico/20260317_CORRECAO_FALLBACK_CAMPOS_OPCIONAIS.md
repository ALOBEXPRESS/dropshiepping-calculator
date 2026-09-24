# Correção: Fallback para Campos Opcionais no Workflow

## Data
2026-03-05

## Problema

Erro ao cadastrar produtos com variações:
```
Key (id_produto_pai)=(16610437077) is not present in table "products_bling"
```

### Causa Raiz

Campos opcionais (como `variacao.produtoPai.id`, `fornecedor.id`, etc.) estavam sendo acessados sem fallback para `null`. Quando esses campos não existiam no JSON da API do Bling, o N8N:

1. Retornava `undefined`
2. Enviava string vazia ou valor inválido
3. Causava erro de FK constraint ou tipo de dado

## Solução

Adicionar **optional chaining** (`?.`) e **nullish coalescing** (`?? null`) em TODOS os campos opcionais.

### Campos Corrigidos

#### Campos de Variação
```javascript
// ANTES
"id_produto_pai": "={{ $json.data.variacao.produtoPai.id }}"
"variacao_nome": "={{ $json.data.variacao.nome }}"

// DEPOIS
"id_produto_pai": "={{ $json.data.variacao?.produtoPai?.id ?? null }}"
"variacao_nome": "={{ $json.data.variacao?.nome ?? null }}"
```

#### Campos de Fornecedor
```javascript
// ANTES
"id_fornecedor": "={{ $json.data.fornecedor.id }}"
"cost_price": "={{ $json.data.fornecedor.precoCusto }}"
"sku_fornecedor": "={{ $json.data.fornecedor.codigo }}"

// DEPOIS
"id_fornecedor": "={{ $json.data.fornecedor?.id ?? null }}"
"cost_price": "={{ $json.data.fornecedor?.precoCusto ?? null }}"
"sku_fornecedor": "={{ $json.data.fornecedor?.codigo ?? null }}"
```

#### Campos de Categoria
```javascript
// ANTES
"id_categoria": "={{ $json.data.categoria.id }}"

// DEPOIS
"id_categoria": "={{ $json.data.categoria?.id ?? null }}"
```

#### Campos de Tributação
```javascript
// ANTES
"ncm": "={{ $json.data.tributacao.ncm }}"
"grupo_produto_id": "={{ $json.data.tributacao.grupoProduto.id }}"

// DEPOIS
"ncm": "={{ $json.data.tributacao?.ncm ?? null }}"
"grupo_produto_id": "={{ $json.data.tributacao?.grupoProduto?.id ?? null }}"
```

#### Campos de Mídia
```javascript
// ANTES
"video_url": "={{ $json.data.midia.video.url }}"
"image_url1": "={{ $json.data.midia.imagens.externas[0].link }}"

// DEPOIS
"video_url": "={{ $json.data.midia?.video?.url ?? null }}"
"image_url1": "={{ $json.data.midia?.imagens?.externas?.[0]?.link ?? null }}"
```

#### Campos de Estoque
```javascript
// ANTES
"stock_quantity": "={{ $json.data.estoque.saldoVirtualTotal }}"
"localizacao": "={{ $json.data.estoque.localizacao }}"

// DEPOIS
"stock_quantity": "={{ $json.data.estoque?.saldoVirtualTotal ?? 0 }}"
"localizacao": "={{ $json.data.estoque?.localizacao ?? null }}"
```

#### Campos de Dimensões
```javascript
// ANTES
"largura": "={{ $json.data.dimensoes.largura }}"
"altura": "={{ $json.data.dimensoes.altura }}"
"profundidade": "={{ $json.data.dimensoes.profundidade }}"
"unidade_medida": "={{ $json.data.dimensoes.unidadeMedida }}"

// DEPOIS
"largura": "={{ $json.data.dimensoes?.largura ?? null }}"
"altura": "={{ $json.data.dimensoes?.altura ?? null }}"
"profundidade": "={{ $json.data.dimensoes?.profundidade ?? null }}"
"unidade_medida": "={{ $json.data.dimensoes?.unidadeMedida ?? null }}"
```

## Por Que Funciona?

1. **Optional Chaining (`?.`)**: Se o objeto não existe, retorna `undefined` ao invés de erro
2. **Nullish Coalescing (`?? null`)**: Se o valor é `undefined` ou `null`, usa `null`
3. **Banco aceita NULL**: Campos opcionais na tabela aceitam `NULL`
4. **Sem erro de tipo**: `null` é um valor válido, string vazia ou `undefined` não são

## Exemplo Prático

### Produto Pai (sem variação)
```json
{
  "variacao": null,  // Não tem variação
  "fornecedor": { "id": 123 }
}
```

**Resultado**:
- `id_produto_pai`: `null` ✅ (não é variação)
- `variacao_nome`: `null` ✅ (não tem nome de variação)
- `id_fornecedor`: `123` ✅ (tem fornecedor)

### Variação (com produto pai)
```json
{
  "variacao": {
    "nome": "Tamanho G",
    "produtoPai": { "id": 16610437077 }
  }
}
```

**Resultado**:
- `id_produto_pai`: `16610437077` ✅ (referencia o pai)
- `variacao_nome`: `"Tamanho G"` ✅ (tem nome)

## Resultado Esperado

✅ Produtos pai: Inseridos com campos opcionais como `null`  
✅ Variações: Inseridas com `id_produto_pai` correto  
✅ Sem erro de FK constraint  
✅ Sem erro de tipo de dado  
✅ Workflow robusto para qualquer estrutura de produto

## Arquivos Modificados

- `src/hooks/n8n/workflows/Bling Cadastrar Produto.json`

## Próximos Passos

1. Importar workflow atualizado no N8N
2. Testar cadastro de produtos pai (sem variação)
3. Testar cadastro de variações (com produto pai)
4. Verificar que campos opcionais são salvos como `null` quando não existem

---

**Status**: ✅ Implementado  
**Testado**: Pendente (aguardando teste do usuário)  
**Prioridade**: Alta  
**Impacto**: Resolve erro de FK constraint e campos opcionais
