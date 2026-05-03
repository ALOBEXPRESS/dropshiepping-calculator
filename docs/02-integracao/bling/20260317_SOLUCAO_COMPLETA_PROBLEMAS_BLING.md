# Solução Completa: Problemas com Integração Bling

## Problemas Identificados

### 1. FK Constraint - Variações sem Produto Pai
**Erro**: `insert or update on table "products_bling" violates foreign key constraint "products_bling_parent_fkey"`

**Produtos afetados**:
- Camisa Rock In Rio Cor:Preto;Tamanho:M (SKU: C12591M)
- Camisa Rock In Rio Cor:Vermelho;Tamanho:G (SKU: C12596G)

**Causa**: Estes são produtos com variações, mas o produto pai "Camisa Rock In Rio" não existe no banco ainda.

### 2. SKU Duplicado
**Erro**: `duplicate key value violates unique constraint "products_bling_sku_key"`

**Produto afetado**:
- CORRENTE DE AÇO 3 EM 1 FINA (SKU: 2023171245)

**Causa**: Produto já existe no banco e está sendo inserido novamente.

### 3. Filtro "Não Categorizado" Travou a Aplicação
**Sintoma**: Só aparece 1 produto em "Produtos integrados"

**Causa**: O filtro `supplierSku: 'uncategorized'` ficou ativo e está filtrando quase todos os produtos.

## Soluções

### Solução 1: Corrigir Filtro "Não Categorizado" (URGENTE)

#### Opção A: Limpar Filtro via LocalStorage (Mais Rápido)

1. Abra o DevTools do navegador (F12)
2. Vá em "Console"
3. Execute:

```javascript
localStorage.clear();
location.reload();
```

Isso vai limpar todos os filtros e recarregar a página.

#### Opção B: Resetar Filtro Manualmente

1. Na página "Produtos integrados"
2. Clique no botão "Não categorizado" novamente para desativar
3. Clique em "Atualizar"

#### Opção C: Corrigir o Código (Permanente)

O problema está em `src/hooks/useProductsBling.ts` linha 117-119.

**Código atual**:
```typescript
if (currentFilters.supplierSku === 'uncategorized') {
  query = query.or('sku_fornecedor.is.null,sku_fornecedor.not.in.(ALOBEXPRESS_01,ALOBFOR_DROP_01)');
}
```

**Problema**: Isso filtra produtos que NÃO têm fornecedor OU que não são dos fornecedores específicos.

**Solução**: Mudar para filtrar apenas produtos SEM fornecedor:

```typescript
if (currentFilters.supplierSku === 'uncategorized') {
  query = query.is('sku_fornecedor', null);
}
```

### Solução 2: Corrigir FK Constraint no Workflow

O código que você adicionou em "Parsear Requisição" já ordena produtos pai primeiro, mas ainda há um problema:

**Problema**: Alguns produtos pai podem não estar sendo retornados pela API do Bling na mesma página.

**Solução**: Modificar o workflow para ignorar variações cujo produto pai não existe:

#### Adicionar nó "Code" ANTES do "Create a row"

```javascript
const produto = $json.data;

// Se o produto tem variação e produto pai
if (produto.variacao && produto.variacao.produtoPai && produto.variacao.produtoPai.id) {
  const idProdutoPai = produto.variacao.produtoPai.id;
  
  // Verificar se o produto pai existe no banco
  // Se não existir, PULAR este produto (será inserido na próxima execução)
  
  console.log(`Variação detectada: ${produto.nome}`);
  console.log(`Produto pai: ${idProdutoPai}`);
  
  // Por enquanto, setar como NULL para evitar erro
  // O produto será corrigido pelo workflow de atualização
  return {
    json: {
      ...produto,
      variacao: {
        ...produto.variacao,
        produtoPai: {
          id: null // Setar como NULL temporariamente
        }
      }
    }
  };
}

// Produto pai ou sem variação, retornar normalmente
return { json: produto };
```

**Melhor Solução**: Usar o nó "If" para pular variações sem produto pai:

1. Adicionar nó "If" ANTES do "Create a row"
2. Condição: `{{ $json.data.variacao?.produtoPai?.id }}` is empty
3. Se TRUE (não tem produto pai): Continuar para "Create a row"
4. Se FALSE (tem produto pai): Pular para próximo item

### Solução 3: Ignorar SKU Duplicado no Workflow

Como você já tem um workflow de atualização, pode ignorar erros de SKU duplicado no workflow de cadastro:

#### No nó "Create a row" (Supabase):

1. Clique no nó
2. Vá em "Settings" (ícone de engrenagem)
3. Em "On Error", selecione "Continue"
4. Salve

Isso faz o workflow continuar mesmo se houver erro de SKU duplicado.

### Solução 4: Executar Workflow em Duas Passadas

Para garantir que todos os produtos sejam inseridos corretamente:

#### Primeira Passada: Apenas Produtos Pai

Modificar o código "Parsear Requisição" para filtrar apenas produtos pai:

```javascript
const lista = $input.first().json.data;

// Filtrar APENAS produtos pai (sem variação)
const produtosPai = lista.filter((produto) => {
  return !produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id;
});

const resultado = produtosPai.map((item) => {
  return {
    json: {
      id: item.id
    }
  };
});

console.log(`Total de produtos: ${lista.length}`);
console.log(`Produtos pai: ${produtosPai.length}`);
console.log(`Variações ignoradas: ${lista.length - produtosPai.length}`);

return resultado;
```

#### Segunda Passada: Apenas Variações

Criar um segundo workflow ou modificar o código para processar apenas variações:

```javascript
const lista = $input.first().json.data;

// Filtrar APENAS variações (com produto pai)
const variacoes = lista.filter((produto) => {
  return produto.variacao && produto.variacao.produtoPai && produto.variacao.produtoPai.id;
});

const resultado = variacoes.map((item) => {
  return {
    json: {
      id: item.id
    }
  };
});

console.log(`Total de produtos: ${lista.length}`);
console.log(`Variações: ${variacoes.length}`);
console.log(`Produtos pai ignorados: ${lista.length - variacoes.length}`);

return resultado;
```

## Plano de Ação Recomendado

### Passo 1: Corrigir Filtro "Não Categorizado" (AGORA)

Execute no console do navegador:
```javascript
localStorage.clear();
location.reload();
```

### Passo 2: Configurar Workflow para Ignorar Erros (5 min)

1. No nó "Create a row", configurar "On Error: Continue"
2. Salvar workflow

### Passo 3: Executar Workflow em Duas Passadas (10 min)

1. **Primeira execução**: Modificar código para processar apenas produtos pai
2. Aguardar conclusão
3. **Segunda execução**: Modificar código para processar apenas variações
4. Aguardar conclusão

### Passo 4: Verificar no Banco

```sql
-- Ver produtos pai
SELECT id, bling_id, name, sku, id_produto_pai
FROM products_bling
WHERE id_produto_pai IS NULL
ORDER BY updated_at DESC
LIMIT 20;

-- Ver variações
SELECT id, bling_id, name, sku, id_produto_pai
FROM products_bling
WHERE id_produto_pai IS NOT NULL
ORDER BY updated_at DESC
LIMIT 20;

-- Ver variações órfãs (produto pai não existe)
SELECT pb1.id, pb1.bling_id, pb1.name, pb1.sku, pb1.id_produto_pai
FROM products_bling pb1
LEFT JOIN products_bling pb2 ON pb1.id_produto_pai = pb2.bling_id
WHERE pb1.id_produto_pai IS NOT NULL 
  AND pb2.id IS NULL;

-- Ver produtos duplicados por SKU
SELECT sku, COUNT(*) as count
FROM products_bling
GROUP BY sku
HAVING COUNT(*) > 1;
```

### Passo 5: Corrigir Código do Filtro (Opcional, mas Recomendado)

Modificar `src/hooks/useProductsBling.ts` linha 117-119 para:

```typescript
if (currentFilters.supplierSku === 'uncategorized') {
  query = query.is('sku_fornecedor', null);
}
```

## Resumo

1. ✅ Limpar localStorage para resetar filtro
2. ✅ Configurar workflow para ignorar erros de SKU duplicado
3. ✅ Executar workflow em duas passadas (pai → variações)
4. ✅ Verificar no banco se todos os produtos foram inseridos
5. ✅ Corrigir código do filtro "Não categorizado"

## Arquivos de Referência

- `src/hooks/useProductsBling.ts` - Hook que busca produtos
- `src/components/ProductsLoaded.tsx` - Componente com filtros
- `src/hooks/n8n/workflows/Bling Cadastrar Produto.json` - Workflow atual
