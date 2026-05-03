# Correção: Workflow "No fields - item(s) exist, but they're empty"

## Problema

Quando um produto novo é adicionado no Bling:
- Nó "Processa Resultado" retorna `{ exists: false }` corretamente
- Mas os nós "Cria no banco POST" e "Atualiza no banco PATCH" retornam "No fields - item(s) exist, but they're empty"
- Isso acontece porque os nós POST/PATCH estão referenciando `$('Pega mais dados do ID Produto').item.json.data` mas o contexto foi perdido após passar pelo nó "Processa Resultado"

## Causa Raiz

Os nós POST/PATCH precisam acessar os dados do nó "Pega mais dados do ID Produto", mas após passar pelo nó "Processa Resultado" (que é um nó Code/Function), o contexto original é perdido e apenas o output do nó Code é passado adiante.

## Solução

Modificar o nó "Processa Resultado" para passar os dados do produto junto com o resultado da verificação.

### Passo 1: Atualizar o código do nó "Processa Resultado"

Substitua o código atual por este (arquivo: `src/hooks/n8n/code-snippets/processa-resultado-com-dados.js`):

```javascript
// Código para nó Function no n8n
// Verifica se o produto existe E passa os dados do produto adiante

// Pega o resultado da consulta de verificação
const verificacaoItems = $input.all();

// Pega os dados do produto do nó anterior "Pega mais dados do ID Produto"
const produtoData = $('Pega mais dados do ID Produto').first().json;

// Se não houver items na verificação, produto não existe
if (!verificacaoItems || verificacaoItems.length === 0) {
  return [{
    json: {
      exists: false,
      productData: produtoData // Passa os dados do produto adiante
    }
  }];
}

// Pega o primeiro item da verificação
const firstItem = verificacaoItems[0].json;

// Se for um array vazio, produto não existe
if (Array.isArray(firstItem) && firstItem.length === 0) {
  return [{
    json: {
      exists: false,
      productData: produtoData // Passa os dados do produto adiante
    }
  }];
}

// Se for um array com items, produto existe
if (Array.isArray(firstItem) && firstItem.length > 0) {
  return [{
    json: {
      exists: true,
      productData: produtoData // Passa os dados do produto adiante
    }
  }];
}

// Se não for array mas tiver dados, produto existe
if (firstItem && Object.keys(firstItem).length > 0) {
  return [{
    json: {
      exists: true,
      productData: produtoData // Passa os dados do produto adiante
    }
  }];
}

// Caso padrão: produto não existe
return [{
  json: {
    exists: false,
    productData: produtoData // Passa os dados do produto adiante
  }
}];
```

### Passo 2: Atualizar os nós POST e PATCH

Agora os nós "Cria no banco POST" e "Atualiza no banco PATCH" devem referenciar os dados assim:

**ANTES:**
```
{{ $('Pega mais dados do ID Produto').item.json.data.id }}
```

**DEPOIS:**
```
{{ $json.productData.data.id }}
```

**Exemplo completo de um campo:**

```json
{
  "name": "bling_id",
  "value": "={{ $json.productData.data.id }}"
}
```

### Passo 3: Atualizar TODOS os campos dos nós POST e PATCH

Substitua TODAS as referências nos body parameters:

| Campo | Valor ANTIGO | Valor NOVO |
|-------|-------------|------------|
| bling_id | `$('Pega mais dados do ID Produto').item.json.data.id` | `$json.productData.data.id` |
| name | `$('Pega mais dados do ID Produto').item.json.data.nome` | `$json.productData.data.nome` |
| sku | `$('Pega mais dados do ID Produto').item.json.data.codigo` | `$json.productData.data.codigo` |
| stock_quantity | `$('Pega mais dados do ID Produto').item.json.data.estoque.saldoVirtualTotal` | `$json.productData.data.estoque.saldoVirtualTotal` |
| cost_price | `$('Pega mais dados do ID Produto').item.json.data.fornecedor.precoCusto` | `$json.productData.data.fornecedor.precoCusto` |
| sale_price | `$('Pega mais dados do ID Produto').item.json.data.preco` | `$json.productData.data.preco` |
| image_url1 | `$('Pega mais dados do ID Produto').item.json.data.midia.imagens.externas[0].link` | `$json.productData.data.midia.imagens.externas[0].link` |
| ... | (todos os outros campos) | (seguir o mesmo padrão) |

### Passo 4: Atualizar a URL do nó PATCH

**ANTES:**
```
https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?bling_id=eq.{{ $('Pega mais dados do ID Produto').item.json.data.id }}
```

**DEPOIS:**
```
https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?bling_id=eq.{{ $json.productData.data.id }}
```

## Teste

1. Adicione um produto NOVO no Bling com SKU único (ex: `teste123`)
2. Verifique no n8n:
   - ✅ Nó "Verifica se produto existe" retorna `[]` (array vazio)
   - ✅ Nó "Processa Resultado" retorna `{ exists: false, productData: {...} }`
   - ✅ Nó "Produto existe?" vai para FALSE
   - ✅ Nó "Cria no banco POST" executa com sucesso e insere o produto
3. Verifique no Supabase que o produto foi criado

## Alternativa Mais Simples

Se preferir não modificar o código, você pode usar a expressão `$node["Pega mais dados do ID Produto"].json.data` ao invés de `$('Pega mais dados do ID Produto').item.json.data` nos nós POST/PATCH. Isso pode funcionar dependendo da versão do n8n.

## Organization ID

**IMPORTANTE:** Certifique-se de que o `organization_id` nos nós POST e PATCH está correto:

```json
{
  "name": "organization_id",
  "value": "28b4b443-03fd-4a2d-b596-9dcaf142b389"
}
```

**NÃO USE:** `e3274f4d-2627-4121-895d-b0e3a70b0ace` (organização antiga)

---

**Data:** 2026-03-03
**Status:** Solução documentada, aguardando implementação pelo usuário
