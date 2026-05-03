# Correção: Expressão bling_id não avaliada no workflow de produtos

## Problema
O nó "Atualiza no banco PATCH" estava enviando a string literal `"{{$json.data.id}}"` ao invés de avaliar a expressão, causando erro PostgreSQL:
```
"invalid input syntax for type bigint: \"{{$json.data.id}}\""
```

## Causa Raiz
1. A URL não tinha o prefixo `=` necessário para habilitar avaliação de expressões no n8n
2. Os parâmetros do body estavam usando `$json` ao invés de referenciar o nó "Pega mais dados do ID Produto"

## Solução Aplicada

### 1. Corrigida a URL no nó "Atualiza no banco PATCH"
**Antes:**
```json
"url": "https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?bling_id=eq.{{$json.data.id}}"
```

**Depois:**
```json
"url": "=https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?bling_id=eq.{{ $('Pega mais dados do ID Produto').item.json.data.id }}"
```

**Mudanças:**
- Adicionado prefixo `=` para habilitar avaliação de expressões
- Substituído `$json.data.id` por `$('Pega mais dados do ID Produto').item.json.data.id`
- Adicionados espaços ao redor da expressão para melhor legibilidade

### 2. Corrigidos todos os parâmetros do body
Todos os campos que usavam `$json.data.*` foram atualizados para usar `$('Pega mais dados do ID Produto').item.json.data.*`

**Exemplos:**
```json
// Antes
"name": "={{ $json.data.nome }}"
"sku": "={{ $json.data.codigo }}"
"stock_quantity": "={{ $json.data.estoque.saldoVirtualTotal }}"

// Depois
"name": "={{ $('Pega mais dados do ID Produto').item.json.data.nome }}"
"sku": "={{ $('Pega mais dados do ID Produto').item.json.data.codigo }}"
"stock_quantity": "={{ $('Pega mais dados do ID Produto').item.json.data.estoque.saldoVirtualTotal }}"
```

### 3. Corrigido também o nó "Cria no banco POST"
Aplicadas as mesmas correções para garantir consistência:
- Removido `=` extra e `\n` do campo `bling_id`
- Todos os campos agora referenciam corretamente o nó "Pega mais dados do ID Produto"

## Regra Importante do n8n
**Para que expressões sejam avaliadas em campos de URL do HTTP Request:**
- A URL DEVE começar com `=` (prefixo de expressão)
- Sem o `=`, o n8n trata o conteúdo como string literal

## Arquivos Modificados
- `src/hooks/n8n/workflows/Bling Cadastrar_Atualizar Produto Automatization (1).json`

## Próximos Passos
1. Testar o workflow atualizando um produto no Bling
2. Verificar se o `bling_id` é corretamente avaliado na URL
3. Confirmar que o produto é atualizado no banco sem erros
4. Verificar se a criação de novos produtos também funciona corretamente

## Data
2025-02-22
