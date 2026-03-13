# 🎯 Guia Visual Passo a Passo: Resolver Problemas Bling

## 📋 Antes de Começar

**Tempo total**: ~15 minutos  
**Dificuldade**: Fácil  
**Pré-requisitos**: Acesso ao n8n e Supabase

---

## 🚀 PASSO 1: Resetar Filtro (30 segundos)

### 🎯 Objetivo
Fazer todos os produtos aparecerem novamente na aplicação.

### 📝 Instruções

1. **Abra sua aplicação** no navegador
2. **Pressione F12** (abre DevTools)
3. **Clique em "Console"** (aba no topo)
4. **Cole este código**:

```javascript
localStorage.clear();
location.reload();
```

5. **Pressione Enter**

### ✅ Como Saber se Funcionou

- A página vai recarregar automaticamente
- Deve mostrar "X produtos encontrados" (onde X > 1)
- Vários produtos devem aparecer na tela

### ❌ Se Não Funcionar

- Tente limpar o cache do navegador (Ctrl+Shift+Delete)
- Verifique se está na página "Produtos integrados"
- Tente em modo anônimo/privado

---

## ⚙️ PASSO 2: Configurar "On Error: Continue" (2 minutos)

### 🎯 Objetivo
Fazer o workflow continuar mesmo se houver erro de SKU duplicado.

### 📝 Instruções

1. **Abra o n8n** no navegador
2. **Abra o workflow** "Bling Cadastrar Produto"
3. **Localize o nó** "Create a row" (é um nó do Supabase)
4. **Clique no nó** para selecioná-lo
5. **Clique no ícone de engrenagem** ⚙️ (canto superior direito do nó)
6. **Procure "On Error"** na janela que abrir
7. **Selecione "Continue"** no dropdown
8. **Clique em "Save"** (botão no canto superior direito da tela)

### ✅ Como Saber se Funcionou

- O nó "Create a row" deve mostrar um ícone de engrenagem
- Ao clicar no nó e ver Settings, deve mostrar "On Error: Continue"

### 📸 Referência Visual

```
┌─────────────────────────────────┐
│     Create a row (Supabase)     │
│                                 │
│  ⚙️ Settings                    │
│                                 │
│  On Error: [Continue ▼]        │
│                                 │
│  [Save]                         │
└─────────────────────────────────┘
```

---

## 🔄 PASSO 3: Primeira Passada - Produtos Pai (5 minutos)

### 🎯 Objetivo
Inserir todos os produtos pai no banco.

### 📝 Instruções

1. **No workflow** "Bling Cadastrar Produto"
2. **Localize o nó** "Parsear Requisição" (é um nó Code/JavaScript)
3. **Clique no nó** para abrir o editor de código
4. **Selecione TODO o código** (Ctrl+A)
5. **Delete o código** (Delete ou Backspace)
6. **Cole este código**:

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

7. **Clique em "Save"** (botão no canto superior direito)
8. **Clique em "Execute workflow"** (botão no canto superior direito)
9. **AGUARDE** o workflow terminar (pode levar alguns minutos)

### ✅ Como Saber se Funcionou

- O workflow deve executar sem erros de FK constraint
- No console do n8n, deve mostrar:
  ```
  PRIMEIRA PASSADA - PRODUTOS PAI
  Produtos pai (processando): XX
  Variações (ignorando): YY
  ```
- Todos os produtos pai devem ser inseridos no banco

### 📊 Verificar no Banco (Opcional)

Execute no Supabase SQL Editor:

```sql
SELECT COUNT(*) as produtos_pai
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
  AND id_produto_pai IS NULL;
```

---

## 🔄 PASSO 4: Segunda Passada - Variações (5 minutos)

### 🎯 Objetivo
Inserir todas as variações no banco.

### 📝 Instruções

1. **No workflow** "Bling Cadastrar Produto"
2. **Clique no nó** "Parsear Requisição" novamente
3. **Selecione TODO o código** (Ctrl+A)
4. **Delete o código** (Delete ou Backspace)
5. **Cole este código**:

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

6. **Clique em "Save"**
7. **Clique em "Execute workflow"** novamente
8. **AGUARDE** o workflow terminar

### ✅ Como Saber se Funcionou

- O workflow deve executar sem erros de FK constraint
- No console do n8n, deve mostrar:
  ```
  SEGUNDA PASSADA - VARIAÇÕES
  Variações (processando): YY
  Produtos pai (ignorando): XX
  ```
- Todas as variações devem ser inseridas no banco

### 📊 Verificar no Banco (Opcional)

Execute no Supabase SQL Editor:

```sql
SELECT COUNT(*) as variacoes
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
  AND id_produto_pai IS NOT NULL;
```

---

## ✅ PASSO 5: Verificar Variações Órfãs (2 minutos)

### 🎯 Objetivo
Garantir que todas as variações têm um produto pai no banco.

### 📝 Instruções

1. **Abra o Supabase** no navegador
2. **Vá em "SQL Editor"**
3. **Cole esta query**:

```sql
SELECT 
  pb1.id, 
  pb1.bling_id, 
  pb1.name, 
  pb1.sku, 
  pb1.id_produto_pai
FROM products_bling pb1
LEFT JOIN products_bling pb2 ON pb1.id_produto_pai = pb2.bling_id
WHERE pb1.organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
  AND pb1.id_produto_pai IS NOT NULL 
  AND pb2.id IS NULL;
```

4. **Clique em "Run"**

### ✅ Como Saber se Funcionou

- A query deve retornar **0 linhas**
- Se retornar 0 linhas, significa que não há variações órfãs
- Todos os produtos foram inseridos corretamente!

### ❌ Se Retornar Linhas

- Anote os SKUs dos produtos órfãos
- Execute a segunda passada novamente
- Verifique se os produtos pai existem na API Bling

---

## 🎉 PASSO 6: Voltar Código Original (1 minuto)

### 🎯 Objetivo
Preparar o workflow para uso normal (processar tudo em uma única passada).

### 📝 Instruções

1. **No workflow** "Bling Cadastrar Produto"
2. **Clique no nó** "Parsear Requisição"
3. **Selecione TODO o código** (Ctrl+A)
4. **Delete o código**
5. **Cole este código**:

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

6. **Clique em "Save"**

### ✅ Como Saber se Funcionou

- O código foi salvo com sucesso
- Próximas execuções do workflow vão processar tudo em uma única passada
- Produtos pai sempre serão processados antes das variações

---

## 🎊 PARABÉNS! Você Terminou!

### ✅ O que Foi Feito

- ✅ Filtro "Não Categorizado" resetado
- ✅ Workflow configurado para ignorar SKUs duplicados
- ✅ Todos os produtos pai inseridos no banco
- ✅ Todas as variações inseridas no banco
- ✅ Código do workflow otimizado para uso futuro

### 🚀 Próximos Passos

1. **Teste a aplicação**
   - Abra "Produtos integrados"
   - Verifique se todos os produtos aparecem
   - Teste os filtros

2. **Teste o workflow**
   - Execute o workflow manualmente
   - Verifique se não há erros
   - Verifique os logs no console

3. **Monitore**
   - Verifique periodicamente se há variações órfãs
   - Monitore erros no Google Sheets (logs do workflow)
   - Verifique se novos produtos são inseridos corretamente

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    ANTES (Com Problemas)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ❌ Só aparece 1 produto na aplicação                        │
│  ❌ FK constraint error (variações sem produto pai)          │
│  ❌ Duplicate SKU error (produtos duplicados)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘

                            │
                            │ APLICAR SOLUÇÕES
                            ▼

┌─────────────────────────────────────────────────────────────┐
│                    DEPOIS (Resolvido)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ Todos os produtos aparecem na aplicação                  │
│  ✅ Produtos pai inseridos antes das variações               │
│  ✅ Workflow ignora SKUs duplicados                          │
│  ✅ Código otimizado para uso futuro                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🆘 Precisa de Ajuda?

### Documentação Completa

- `docs/RESUMO_ACOES_URGENTES_BLING.md` - Instruções detalhadas
- `docs/DIAGRAMA_FLUXO_BLING.md` - Diagramas visuais
- `docs/QUICK_REFERENCE_BLING.md` - Referência rápida
- `docs/CONTEXTO_COMPLETO_PROBLEMAS_BLING.md` - Contexto técnico

### Comandos Úteis

**Resetar filtro**:
```javascript
localStorage.clear(); location.reload();
```

**Verificar produtos no banco**:
```sql
SELECT COUNT(*) FROM products_bling 
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389';
```

**Verificar variações órfãs**:
```sql
SELECT pb1.sku, pb1.name
FROM products_bling pb1
LEFT JOIN products_bling pb2 ON pb1.id_produto_pai = pb2.bling_id
WHERE pb1.organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
  AND pb1.id_produto_pai IS NOT NULL 
  AND pb2.id IS NULL;
```

---

**Última atualização**: 2026-03-01  
**Versão**: 1.0  
**Autor**: Kiro AI Assistant
