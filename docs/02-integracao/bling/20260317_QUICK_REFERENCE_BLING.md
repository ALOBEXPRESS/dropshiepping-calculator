# Quick Reference: Resolver Problemas Bling

## 🚨 Problema 1: Só Aparece 1 Produto

### Solução Rápida (30 segundos)

```javascript
// Cole no console do navegador (F12)
localStorage.clear();
location.reload();
```

---

## ⚙️ Problema 2: FK Constraint Error

### Erro
```
insert or update on table "products_bling" violates foreign key constraint "products_bling_parent_fkey"
```

### Solução: Executar em Duas Passadas

#### Passada 1: Produtos Pai

```javascript
// Nó "Parsear Requisição" - PRIMEIRA PASSADA
const lista = $input.first().json.data;
const produtosPai = [];
const variacoes = [];

lista.forEach((produto) => {
  if (!produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id) {
    produtosPai.push(produto);
  } else {
    variacoes.push(produto);
  }
});

const resultado = produtosPai.map((item) => ({ json: { id: item.id } }));

console.log(`Produtos pai: ${produtosPai.length}, Variações: ${variacoes.length}`);
return resultado;
```

#### Passada 2: Variações

```javascript
// Nó "Parsear Requisição" - SEGUNDA PASSADA
const lista = $input.first().json.data;
const produtosPai = [];
const variacoes = [];

lista.forEach((produto) => {
  if (!produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id) {
    produtosPai.push(produto);
  } else {
    variacoes.push(produto);
  }
});

const resultado = variacoes.map((item) => ({ json: { id: item.id } }));

console.log(`Produtos pai: ${produtosPai.length}, Variações: ${variacoes.length}`);
return resultado;
```

---

## 🔄 Problema 3: Duplicate SKU Error

### Erro
```
duplicate key value violates unique constraint "products_bling_sku_key"
```

### Solução: Configurar "On Error: Continue"

1. Nó "Create a row" → Settings (engrenagem)
2. "On Error" → **Continue**
3. Save

---

## ✅ Código Final (Após Resolver Tudo)

```javascript
// Nó "Parsear Requisição" - CÓDIGO FINAL
const lista = $input.first().json.data;
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
const resultado = produtosOrdenados.map((item) => ({ json: { id: item.id } }));

console.log(`Total: ${lista.length}, Pai: ${produtosPai.length}, Variações: ${variacoes.length}`);
return resultado;
```

---

## 🔍 Verificar no Banco

```sql
-- Total de produtos
SELECT COUNT(*) FROM products_bling 
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389';

-- Variações órfãs (deve ser 0)
SELECT pb1.sku, pb1.name, pb1.id_produto_pai
FROM products_bling pb1
LEFT JOIN products_bling pb2 ON pb1.id_produto_pai = pb2.bling_id
WHERE pb1.organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
  AND pb1.id_produto_pai IS NOT NULL 
  AND pb2.id IS NULL;
```

---

## 📋 Checklist

- [ ] Limpar localStorage (console do navegador)
- [ ] Configurar "On Error: Continue" no nó "Create a row"
- [ ] Executar workflow - Primeira passada (produtos pai)
- [ ] Executar workflow - Segunda passada (variações)
- [ ] Verificar no banco (variações órfãs = 0)
- [ ] Voltar código original melhorado

---

## 🆘 Comandos Úteis

### Resetar Filtro
```javascript
localStorage.clear(); location.reload();
```

### Ver Logs do Workflow (n8n)
```javascript
console.log(`Produtos pai: ${produtosPai.length}`);
console.log(`Variações: ${variacoes.length}`);
```

### Verificar Produtos no Banco
```sql
SELECT COUNT(*) as total, 
       COUNT(*) FILTER (WHERE id_produto_pai IS NULL) as pai,
       COUNT(*) FILTER (WHERE id_produto_pai IS NOT NULL) as variacoes
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389';
```

---

## 📚 Documentação Completa

- `docs/RESUMO_ACOES_URGENTES_BLING.md` - Passo a passo detalhado
- `docs/DIAGRAMA_FLUXO_BLING.md` - Diagramas visuais
- `docs/SOLUCAO_COMPLETA_PROBLEMAS_BLING.md` - Documentação técnica

---

**Última atualização**: 2026-03-01
