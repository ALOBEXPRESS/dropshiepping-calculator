# Instruções para Corrigir o Workflow "Bling Atualizar/Deletar Produto"

## Problema

O nó "Produto existe?" está caindo em TRUE e FALSE ao mesmo tempo porque o resultado da consulta está vazio mas o n8n não consegue verificar o `length` corretamente.

## Solução

Substituir o nó "Produto existe?" (If) por um nó de **Code** (JavaScript) que faz a verificação corretamente.

## Passo a Passo

### 1. Adicionar nó Code após "Verifica se produto existe"

1. Clique no botão `+` após o nó "Verifica se produto existe"
2. Selecione **Code** → **Run Once for All Items**
3. Nomeie como: `Processa resultado da verificação`

### 2. Adicionar o código JavaScript

Cole o seguinte código no nó:

```javascript
// Verifica se o produto existe no banco de dados
const items = $input.all();

// Se não houver items, produto não existe
if (!items || items.length === 0) {
  return [{ json: { exists: false, count: 0, message: 'Nenhum item retornado' } }];
}

// Pega o primeiro item
const firstItem = items[0].json;

// Se for um array vazio, produto não existe
if (Array.isArray(firstItem) && firstItem.length === 0) {
  return [{ json: { exists: false, count: 0, message: 'Array vazio - produto não existe' } }];
}

// Se for um array com items, produto existe
if (Array.isArray(firstItem) && firstItem.length > 0) {
  return [{ json: { exists: true, count: firstItem.length, message: 'Produto encontrado' } }];
}

// Se não for array mas tiver dados, produto existe
if (firstItem && Object.keys(firstItem).length > 0) {
  return [{ json: { exists: true, count: 1, message: 'Produto encontrado (objeto)' } }];
}

// Caso padrão: produto não existe
return [{ json: { exists: false, count: 0, message: 'Nenhum dado encontrado' } }];
```

### 3. Substituir o nó "Produto existe?" (If)

1. **Delete** o nó "Produto existe?" (If)
2. Adicione um novo nó **If** após "Processa resultado da verificação"
3. Nomeie como: `Produto existe?`

### 4. Configurar o novo nó If

**Condições:**
- **Condition 1:**
  - Campo: `{{ $json.exists }}`
  - Operador: `is equal to`
  - Valor: `true`

**Saídas:**
- **TRUE** (saída superior): Conecte ao nó "Atualiza no banco PATCH1"
- **FALSE** (saída inferior): Conecte ao nó "Cria no banco POST1"

### 5. Fluxo Final

```
Pega mais dados do ID Produto1
    ↓
Wait2
    ↓
Verifica se produto existe (HTTP Request GET)
    ↓
Processa resultado da verificação (Code)
    ↓
Produto existe? (If)
    ├─ TRUE → Atualiza no banco PATCH1 → Replace Me1
    └─ FALSE → Cria no banco POST1 → Replace Me1
```

## Teste

1. Adicione um produto NOVO no Bling
2. Verifique no n8n:
   - Nó "Verifica se produto existe" deve retornar `[]` (array vazio)
   - Nó "Processa resultado" deve retornar `{ exists: false, count: 0 }`
   - Nó "Produto existe?" deve ir para FALSE
   - Nó "Cria no banco POST1" deve ser executado

3. Atualize o mesmo produto no Bling
4. Verifique no n8n:
   - Nó "Verifica se produto existe" deve retornar array com dados
   - Nó "Processa resultado" deve retornar `{ exists: true, count: 1 }`
   - Nó "Produto existe?" deve ir para TRUE
   - Nó "Atualiza no banco PATCH1" deve ser executado

## Alternativa Simples (Se preferir)

Se não quiser usar o nó Code, você pode usar um **Function** node com este código mais simples:

```javascript
// Pega todos os items
const items = $input.all();

// Verifica se há items e se o primeiro item é um array vazio
if (items && items.length > 0 && items[0].json) {
  const data = items[0].json;
  
  // Se for array, verifica o length
  if (Array.isArray(data)) {
    return data.length === 0 
      ? [{ json: { exists: false } }]
      : [{ json: { exists: true } }];
  }
}

// Padrão: não existe
return [{ json: { exists: false } }];
```

---

**Importante:** Sempre teste com um produto novo primeiro para garantir que o POST está funcionando!
