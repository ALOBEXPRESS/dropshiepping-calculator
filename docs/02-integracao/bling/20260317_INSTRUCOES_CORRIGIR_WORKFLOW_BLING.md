# Instruções: Corrigir Erro de FK no Workflow Bling

## Problema
Erro: `insert or update on table "products_bling" violates foreign key constraint "products_bling_parent_fkey"`

## Causa
O workflow tenta inserir variações de produtos antes dos produtos pai existirem no banco.

## Solução Rápida (5 minutos)

### Passo 1: Modificar o Nó "Parsear Requisição"

1. Abra o workflow "Bling Cadastrar Produto" no n8n
2. Localize o nó "Parsear Requisição" (após "HTTP Obter Produtos")
3. Clique no nó e substitua o código JavaScript por:

```javascript
// Pega a lista de produtos que veio do HTTP
const lista = $input.first().json.data;

// Separa produtos pai e variações
const produtosPai = [];
const variacoes = [];

lista.forEach((produto) => {
  // Se não tem produto pai, é um produto pai
  if (!produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id) {
    produtosPai.push(produto);
  } else {
    // Tem produto pai, é uma variação
    variacoes.push(produto);
  }
});

// Concatena: primeiro produtos pai, depois variações
const produtosOrdenados = [...produtosPai, ...variacoes];

// Monta a lista de items com apenas os IDs na ordem correta
const resultado = produtosOrdenados.map((item) => {
  return {
    json: {
      id: item.id
    }
  };
});

// Log para debug
console.log(`Total de produtos: ${lista.length}`);
console.log(`Produtos pai: ${produtosPai.length}`);
console.log(`Variações: ${variacoes.length}`);

// Retorna a lista ordenada
return resultado;
```

4. Salve o nó
5. Salve o workflow

### Passo 2: Testar

1. Execute o workflow manualmente (botão "Execute workflow")
2. Verifique os logs do nó "Parsear Requisição"
3. Deve mostrar algo como:
   ```
   Total de produtos: 100
   Produtos pai: 85
   Variações: 15
   ```
4. Verifique se não há mais erros de FK

### Passo 3: Verificar no Banco

Execute no Supabase SQL Editor:

```sql
-- Ver se há variações órfãs (produto pai não existe)
SELECT pb1.id, pb1.bling_id, pb1.name, pb1.id_produto_pai
FROM products_bling pb1
LEFT JOIN products_bling pb2 ON pb1.id_produto_pai = pb2.bling_id
WHERE pb1.id_produto_pai IS NOT NULL 
  AND pb2.id IS NULL;
```

Se retornar 0 linhas, está tudo certo!

## Solução Alternativa (Se a primeira não funcionar)

### Opção A: Setar id_produto_pai como NULL

Se ainda houver erros, adicione um nó "Code" ANTES do "Create a row":

```javascript
const produto = $json.data;

// Se o produto tem variação e produto pai, usa o ID
// Caso contrário, seta como NULL para evitar erro de FK
let idProdutoPai = null;
if (produto.variacao && produto.variacao.produtoPai && produto.variacao.produtoPai.id) {
  idProdutoPai = produto.variacao.produtoPai.id;
}

// Retorna o produto com id_produto_pai ajustado
return {
  json: {
    ...produto,
    id_produto_pai: idProdutoPai
  }
};
```

### Opção B: Desabilitar a Foreign Key Temporariamente

**⚠️ NÃO RECOMENDADO - Use apenas em último caso**

```sql
-- Desabilitar FK
ALTER TABLE products_bling 
DROP CONSTRAINT IF EXISTS products_bling_parent_fkey;

-- Executar o workflow

-- Recriar FK
ALTER TABLE products_bling 
ADD CONSTRAINT products_bling_parent_fkey 
FOREIGN KEY (id_produto_pai) 
REFERENCES products_bling(bling_id) 
ON DELETE CASCADE;
```

## Verificação Final

Após implementar a solução, verifique:

1. ✅ Workflow executa sem erros
2. ✅ Todos os produtos foram inseridos
3. ✅ Relacionamentos pai-filho estão corretos
4. ✅ Não há variações órfãs no banco

## Arquivos de Referência

- `docs/SOLUCAO_FK_PRODUCTS_BLING_PARENT.md` - Documentação completa
- `src/hooks/n8n/code-snippets/ordenar-produtos-por-hierarquia.js` - Código completo
- `src/hooks/n8n/code-snippets/inserir-produto-com-fallback.js` - Código alternativo

## Suporte

Se o problema persistir:
1. Verifique os logs do n8n para ver qual produto está falhando
2. Verifique se o `bling_id` do produto pai existe na tabela
3. Execute a query de verificação de variações órfãs
4. Consulte a documentação completa em `docs/SOLUCAO_FK_PRODUCTS_BLING_PARENT.md`
