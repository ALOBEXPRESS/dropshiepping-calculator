# 🚨 AÇÕES URGENTES: Resolver Problemas Bling

## Status Atual

Você está enfrentando 3 problemas principais:

1. ✅ **Filtro "Não Categorizado" travado** - Só aparece 1 produto
2. ⚠️ **FK Constraint** - Variações sem produto pai (Camisa Rock In Rio)
3. ⚠️ **SKU Duplicado** - Produto já existe no banco (CORRENTE DE AÇO 3 EM 1 FINA)

## 🎯 AÇÃO 1: Resetar Filtro (FAÇA AGORA - 30 segundos)

### Execute no console do navegador:

1. Abra sua aplicação
2. Pressione `F12`
3. Vá em "Console"
4. Cole e execute:

```javascript
localStorage.clear();
location.reload();
```

✅ **Resultado esperado**: Todos os produtos devem aparecer novamente!

---

## 🎯 AÇÃO 2: Configurar Workflow (2 minutos)

### No n8n, nó "Create a row":

1. Abra o workflow "Bling Cadastrar Produto"
2. Clique no nó **"Create a row"** (Supabase)
3. Clique no ícone de **engrenagem** (Settings) no canto superior direito do nó
4. Em **"On Error"**, selecione **"Continue"**
5. Clique em **"Save"** para salvar o workflow

✅ **Resultado**: O workflow vai continuar mesmo com erros de SKU duplicado!

---

## 🎯 AÇÃO 3: Modificar Código "Parsear Requisição" (5 minutos)

### Primeira Passada - Processar APENAS Produtos Pai

1. No workflow "Bling Cadastrar Produto"
2. Clique no nó **"Parsear Requisição"**
3. **SUBSTITUA TODO O CÓDIGO** por este:

```javascript
// Pega a lista de produtos que veio do HTTP
const lista = $input.first().json.data;

// Separar produtos pai e variações
const produtosPai = [];
const variacoes = [];

lista.forEach((produto) => {
  // Se não tem variação OU não tem produto pai, é um produto pai
  if (!produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id) {
    produtosPai.push(produto);
  } else {
    // Se tem variação E tem produto pai, é uma variação
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

console.log(`========================================`);
console.log(`PRIMEIRA PASSADA - PRODUTOS PAI`);
console.log(`========================================`);
console.log(`Total de produtos na API: ${lista.length}`);
console.log(`Produtos pai (processando): ${produtosPai.length}`);
console.log(`Variações (ignorando): ${variacoes.length}`);
console.log(`========================================`);

return resultado;
```

4. Clique em **"Save"** para salvar o workflow
5. Clique em **"Execute workflow"** (botão no canto superior direito)
6. **AGUARDE** o workflow terminar (pode levar alguns minutos)

✅ **Resultado**: Todos os produtos pai serão inseridos no banco!

---

## 🎯 AÇÃO 4: Segunda Passada - Processar Variações (5 minutos)

### Depois que a primeira passada terminar:

1. No workflow "Bling Cadastrar Produto"
2. Clique no nó **"Parsear Requisição"** novamente
3. **SUBSTITUA TODO O CÓDIGO** por este:

```javascript
// Pega a lista de produtos que veio do HTTP
const lista = $input.first().json.data;

// Separar produtos pai e variações
const produtosPai = [];
const variacoes = [];

lista.forEach((produto) => {
  // Se não tem variação OU não tem produto pai, é um produto pai
  if (!produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id) {
    produtosPai.push(produto);
  } else {
    // Se tem variação E tem produto pai, é uma variação
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

console.log(`========================================`);
console.log(`SEGUNDA PASSADA - VARIAÇÕES`);
console.log(`========================================`);
console.log(`Total de produtos na API: ${lista.length}`);
console.log(`Produtos pai (ignorando): ${produtosPai.length}`);
console.log(`Variações (processando): ${variacoes.length}`);
console.log(`========================================`);

return resultado;
```

4. Clique em **"Save"** para salvar o workflow
5. Clique em **"Execute workflow"** novamente
6. **AGUARDE** o workflow terminar

✅ **Resultado**: Todas as variações serão inseridas no banco!

---

## 🎯 AÇÃO 5: Verificar no Banco (2 minutos)

### Execute no Supabase SQL Editor:

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

✅ **Resultado esperado**: A última query deve retornar **0 linhas** (sem variações órfãs)

---

## 🎯 AÇÃO 6: Voltar Código Original (1 minuto)

### Depois que tudo estiver funcionando:

1. No workflow "Bling Cadastrar Produto"
2. Clique no nó **"Parsear Requisição"**
3. **SUBSTITUA TODO O CÓDIGO** por este (código original melhorado):

```javascript
// Pega a lista de produtos que veio do HTTP
const lista = $input.first().json.data;

// Separar produtos pai e variações
const produtosPai = [];
const variacoes = [];

lista.forEach((produto) => {
  // Se não tem variação OU não tem produto pai, é um produto pai
  if (!produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id) {
    produtosPai.push(produto);
  } else {
    // Se tem variação E tem produto pai, é uma variação
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

console.log(`========================================`);
console.log(`PROCESSAMENTO COMPLETO`);
console.log(`========================================`);
console.log(`Total de produtos: ${lista.length}`);
console.log(`Produtos pai: ${produtosPai.length}`);
console.log(`Variações: ${variacoes.length}`);
console.log(`========================================`);

return resultado;
```

4. Clique em **"Save"** para salvar o workflow

✅ **Resultado**: O workflow vai processar tudo em uma única passada, na ordem correta!

---

## 📊 Resumo das Ações

| Ação | Tempo | Status |
|------|-------|--------|
| 1. Limpar localStorage | 30 seg | ⏳ Pendente |
| 2. Configurar "On Error: Continue" | 2 min | ⏳ Pendente |
| 3. Primeira passada (produtos pai) | 5 min | ⏳ Pendente |
| 4. Segunda passada (variações) | 5 min | ⏳ Pendente |
| 5. Verificar no banco | 2 min | ⏳ Pendente |
| 6. Voltar código original | 1 min | ⏳ Pendente |
| **TOTAL** | **~15 min** | |

---

## ❓ FAQ

### Por que preciso executar em duas passadas?

Porque algumas variações (como "Camisa Rock In Rio Cor:Preto;Tamanho:M") têm um produto pai que ainda não existe no banco. Se tentarmos inserir a variação antes do produto pai, o banco vai dar erro de FK constraint.

### O que acontece com produtos duplicados?

Com "On Error: Continue" configurado, o workflow vai ignorar erros de SKU duplicado e continuar processando os próximos produtos.

### Posso executar o workflow normalmente depois?

Sim! Depois de voltar o código original (Ação 6), o workflow vai processar tudo em uma única passada, sempre na ordem correta (pai → variações).

### E se eu tiver mais produtos no futuro?

O código original (Ação 6) já está preparado para processar novos produtos corretamente. Você só precisa executar o workflow normalmente.

---

## 📚 Documentação Completa

- `docs/ACOES_IMEDIATAS_BLING.md` - Instruções detalhadas
- `docs/SOLUCAO_COMPLETA_PROBLEMAS_BLING.md` - Documentação técnica
- `docs/RESETAR_FILTRO_PRODUTOS_INTEGRADOS.md` - Como resetar filtro
- `docs/SOLUCAO_FK_PRODUCTS_BLING_PARENT.md` - Detalhes sobre FK constraint

---

## 🆘 Precisa de Ajuda?

Se algo não funcionar:

1. Tire um print da tela
2. Copie a mensagem de erro completa
3. Execute as queries SQL acima e envie os resultados
4. Verifique o console do n8n para ver os logs

---

**Última atualização**: 2026-03-01
