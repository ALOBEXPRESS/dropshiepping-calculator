# Solução: Erro de Foreign Key em products_bling_parent_fkey

## Problema

Ao executar o workflow "Bling Cadastrar Produto" no n8n, você recebe o erro:

```
insert or update on table "products_bling" violates foreign key constraint "products_bling_parent_fkey"
```

## Causa Raiz

A tabela `products_bling` tem um auto-relacionamento hierárquico:

```sql
ALTER TABLE products_bling 
ADD CONSTRAINT products_bling_parent_fkey 
FOREIGN KEY (id_produto_pai) 
REFERENCES products_bling(bling_id) 
ON DELETE CASCADE;
```

Isso significa que:
- Produtos com variações (tamanhos, cores) têm um campo `id_produto_pai`
- Este campo referencia o `bling_id` do produto pai
- **O produto pai precisa existir ANTES de inserir a variação**

O erro ocorre quando:
1. O workflow busca produtos do Bling em ordem aleatória
2. Tenta inserir uma variação (ex: Camisa G) antes do produto pai (Camisa)
3. O banco rejeita porque o `id_produto_pai` não existe ainda

## Soluções

### Solução 1: Ordenar Produtos por Hierarquia (RECOMENDADA)

Modificar o workflow para processar produtos pai primeiro, depois variações.

**Passos:**

1. Substituir o nó "Parsear Requisição" por um nó "Code" com o código:

```javascript
// Arquivo: src/hooks/n8n/code-snippets/ordenar-produtos-por-hierarquia.js

const lista = $input.first().json.data;

// Separa produtos pai e variações
const produtosPai = [];
const variacoes = [];

lista.forEach((produto) => {
  if (!produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id) {
    produtosPai.push(produto);
  } else {
    variacoes.push(produto);
  }
});

// Concatena: primeiro produtos pai, depois variações
const produtosOrdenados = [...produtosPai, ...variacoes];

// Monta a lista de items com apenas os IDs na ordem correta
const resultado = produtosOrdenados.map((item) => {
  return {
    json: {
      id: item.id,
      isPai: !item.variacao || !item.variacao.produtoPai || !item.variacao.produtoPai.id,
      produtoPaiId: item.variacao?.produtoPai?.id || null
    }
  };
});

console.log(`Total: ${lista.length}, Pai: ${produtosPai.length}, Variações: ${variacoes.length}`);

return resultado;
```

**Vantagens:**
- Garante ordem correta de inserção
- Não perde dados de relacionamento
- Mantém integridade referencial

**Desvantagens:**
- Requer modificação do workflow

### Solução 2: Inserir com Fallback para NULL

Setar `id_produto_pai` como NULL quando o produto pai não existir ainda.

**Passos:**

1. Adicionar um nó "Code" ANTES do "Create a row" (Supabase)
2. Usar o código:

```javascript
// Arquivo: src/hooks/n8n/code-snippets/inserir-produto-com-fallback.js

const produto = $json.data;

// Se o produto tem variação e produto pai, usa o ID
// Caso contrário, seta como NULL para evitar erro de FK
let idProdutoPai = null;
if (produto.variacao && produto.variacao.produtoPai && produto.variacao.produtoPai.id) {
  idProdutoPai = produto.variacao.produtoPai.id;
}

// ... resto do código para preparar o objeto
```

**Vantagens:**
- Simples de implementar
- Não quebra o workflow

**Desvantagens:**
- Perde o relacionamento hierárquico temporariamente
- Requer um segundo workflow para corrigir os relacionamentos depois

### Solução 3: Executar Workflow em Duas Passadas

Executar o workflow duas vezes:
1. Primeira passada: Insere apenas produtos pai (filtrar `id_produto_pai IS NULL`)
2. Segunda passada: Insere variações (filtrar `id_produto_pai IS NOT NULL`)

**Passos:**

1. Duplicar o workflow
2. No primeiro workflow, adicionar filtro após "HTTP Obter Produtos":

```javascript
const lista = $input.first().json.data;
const produtosPai = lista.filter(p => !p.variacao?.produtoPai?.id);
return produtosPai.map(item => ({ json: { id: item.id } }));
```

3. No segundo workflow, adicionar filtro:

```javascript
const lista = $input.first().json.data;
const variacoes = lista.filter(p => p.variacao?.produtoPai?.id);
return variacoes.map(item => ({ json: { id: item.id } }));
```

4. Agendar workflows em sequência (primeiro workflow → aguardar 5 min → segundo workflow)

**Vantagens:**
- Garante que produtos pai existem antes de inserir variações
- Mantém integridade referencial

**Desvantagens:**
- Requer dois workflows
- Mais complexo de manter

## Solução Recomendada: Implementação Passo a Passo

### Modificar o Workflow Atual

1. **Substituir o nó "Parsear Requisição":**
   - Deletar o nó atual
   - Adicionar novo nó "Code"
   - Colar o código de `ordenar-produtos-por-hierarquia.js`

2. **Testar o workflow:**
   - Executar manualmente
   - Verificar logs: deve mostrar "Produtos pai: X, Variações: Y"
   - Confirmar que não há mais erros de FK

3. **Monitorar execução:**
   - Verificar se todos os produtos foram inseridos
   - Conferir se relacionamentos pai-filho estão corretos

### Verificar Dados no Banco

```sql
-- Ver produtos pai
SELECT id, bling_id, name, sku, id_produto_pai
FROM products_bling
WHERE id_produto_pai IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Ver variações
SELECT id, bling_id, name, sku, id_produto_pai
FROM products_bling
WHERE id_produto_pai IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Verificar se há variações órfãs (produto pai não existe)
SELECT pb1.id, pb1.bling_id, pb1.name, pb1.id_produto_pai
FROM products_bling pb1
LEFT JOIN products_bling pb2 ON pb1.id_produto_pai = pb2.bling_id
WHERE pb1.id_produto_pai IS NOT NULL 
  AND pb2.id IS NULL;
```

## Prevenção de Problemas Futuros

### 1. Adicionar Validação no Workflow

Antes de inserir, verificar se o produto pai existe:

```javascript
// Nó "Code" antes de "Create a row"
const produto = $json.data;
const idProdutoPai = produto.variacao?.produtoPai?.id;

if (idProdutoPai) {
  // Verificar se produto pai existe
  // Se não existir, setar como NULL ou pular este produto
}
```

### 2. Usar Upsert com Prefer Header

No nó HTTP Request para Supabase, usar:

```
Header: Prefer = resolution=merge-duplicates
```

Isso faz upsert (insert ou update) baseado em `bling_id`.

### 3. Adicionar Retry Logic

Se a inserção falhar por FK, adicionar o produto a uma fila para tentar novamente depois.

## Arquivos de Referência

- `src/hooks/n8n/code-snippets/ordenar-produtos-por-hierarquia.js` - Código para ordenar produtos
- `src/hooks/n8n/code-snippets/inserir-produto-com-fallback.js` - Código com fallback para NULL
- `supabase/migrations/20260223_add_critical_foreign_keys.sql` - Migration que criou a FK

## Resumo

O erro ocorre porque variações são inseridas antes dos produtos pai. A solução mais simples e eficaz é ordenar os produtos por hierarquia antes de processar, garantindo que produtos pai sejam inseridos primeiro.
