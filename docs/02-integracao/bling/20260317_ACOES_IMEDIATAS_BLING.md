# Ações Imediatas: Resolver Problemas Bling

## � Resumo dos Problemas

1. ✅ **Filtro travado** - Só aparece 1 produto (RESOLVIDO com localStorage.clear)
2. ⚠️ **FK Constraint** - Variações sem produto pai (Camisa Rock In Rio)
3. ⚠️ **SKU Duplicado** - Produto já existe (CORRENTE DE AÇO 3 EM 1 FINA)

---

## 🚨 AÇÃO 1: Resetar Filtro "Produtos Integrados" (URGENTE)

### Execute AGORA no console do navegador:

1. Abra sua aplicação
2. Pressione `F12`
3. Vá em "Console"
4. Cole e execute:

```javascript
localStorage.clear();
location.reload();
```

✅ **Resultado**: Todos os produtos devem aparecer novamente!

**Nota**: O código do filtro já foi corrigido em `src/hooks/useProductsBling.ts` (linha 117-119). Após limpar o localStorage, o problema não vai mais acontecer.

---

## ⚙️ Configurar Workflow para Ignorar Erros

### No n8n, nó "Create a row":

1. Clique no nó "Create a row" (Supabase)
2. Clique no ícone de engrenagem (Settings)
3. Em "On Error", selecione **"Continue"**
4. Salve o workflow

✅ Isso vai fazer o workflow continuar mesmo com erros de SKU duplicado!

---

## 📝 Modificar Código "Parsear Requisição" (Primeira Passada)

### Para processar apenas produtos PAI primeiro:

Substitua o código do nó "Parsear Requisição" por:

```javascript
const lista = $input.first().json.data;

// Separar produtos pai e variações
const produtosPai = [];
const variacoes = [];

lista.forEach((produto) => {
  if (!produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id) {
    produtosPai.push(produto);
  } else {
    variacoes.push(produto);
  }
});

// PRIMEIRA PASSADA: Processar APENAS produtos pai
const resultado = produtosPai.map((item) => {
  return {
    json: {
      id: item.id
    }
  };
});

console.log(`Total de produtos: ${lista.length}`);
console.log(`Produtos pai (processando): ${produtosPai.length}`);
console.log(`Variações (ignorando): ${variacoes.length}`);

return resultado;
```

### Execute o workflow

Aguarde terminar. Isso vai inserir todos os produtos pai.

---

## 📝 Modificar Código "Parsear Requisição" (Segunda Passada)

### Para processar variações depois:

Substitua o código do nó "Parsear Requisição" por:

```javascript
const lista = $input.first().json.data;

// Separar produtos pai e variações
const produtosPai = [];
const variacoes = [];

lista.forEach((produto) => {
  if (!produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id) {
    produtosPai.push(produto);
  } else {
    variacoes.push(produto);
  }
});

// SEGUNDA PASSADA: Processar APENAS variações
const resultado = variacoes.map((item) => {
  return {
    json: {
      id: item.id
    }
  };
});

console.log(`Total de produtos: ${lista.length}`);
console.log(`Produtos pai (ignorando): ${produtosPai.length}`);
console.log(`Variações (processando): ${variacoes.length}`);

return resultado;
```

### Execute o workflow novamente

Aguarde terminar. Isso vai inserir todas as variações.

---

## ✅ Verificar no Banco

Execute no Supabase SQL Editor:

```sql
-- Ver total de produtos
SELECT COUNT(*) as total
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389';

-- Ver produtos pai
SELECT COUNT(*) as produtos_pai
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
  AND id_produto_pai IS NULL;

-- Ver variações
SELECT COUNT(*) as variacoes
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
  AND id_produto_pai IS NOT NULL;

-- Ver variações órfãs (DEVE SER 0)
SELECT pb1.id, pb1.bling_id, pb1.name, pb1.sku, pb1.id_produto_pai
FROM products_bling pb1
LEFT JOIN products_bling pb2 ON pb1.id_produto_pai = pb2.bling_id
WHERE pb1.organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
  AND pb1.id_produto_pai IS NOT NULL 
  AND pb2.id IS NULL;
```

Se a última query retornar 0 linhas, está tudo certo! ✅

---

## 🔄 Voltar Código Original (Após Tudo Funcionar)

Depois que todos os produtos estiverem inseridos, volte o código "Parsear Requisição" para o original:

```javascript
const lista = $input.first().json.data;

// Separar produtos pai e variações
const produtosPai = [];
const variacoes = [];

lista.forEach((produto) => {
  if (!produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id) {
    produtosPai.push(produto);
  } else {
    variacoes.push(produto);
  }
});

// Concatenar: primeiro produtos pai, depois variações
const produtosOrdenados = [...produtosPai, ...variacoes];

const resultado = produtosOrdenados.map((item) => {
  return {
    json: {
      id: item.id
    }
  };
});

console.log(`Total de produtos: ${lista.length}`);
console.log(`Produtos pai: ${produtosPai.length}`);
console.log(`Variações: ${variacoes.length}`);

return resultado;
```

Isso vai processar tudo em uma única passada, na ordem correta.

---

## 📊 Resumo das Ações

1. ✅ **URGENTE**: Limpar localStorage (30 segundos)
2. ✅ Configurar "On Error: Continue" no workflow (1 minuto)
3. ✅ Executar workflow - Primeira passada (produtos pai) (5 minutos)
4. ✅ Executar workflow - Segunda passada (variações) (5 minutos)
5. ✅ Verificar no banco se tudo está correto (2 minutos)
6. ✅ Voltar código original do workflow (1 minuto)

**Tempo total**: ~15 minutos

---

## 📚 Documentação Completa

- `docs/RESETAR_FILTRO_PRODUTOS_INTEGRADOS.md` - Como resetar filtro
- `docs/SOLUCAO_COMPLETA_PROBLEMAS_BLING.md` - Documentação técnica completa
- `docs/SOLUCAO_FK_PRODUCTS_BLING_PARENT.md` - Detalhes sobre FK constraint
- `docs/SOLUCAO_DUPLICATE_SKU_BLING.md` - Detalhes sobre SKU duplicado
