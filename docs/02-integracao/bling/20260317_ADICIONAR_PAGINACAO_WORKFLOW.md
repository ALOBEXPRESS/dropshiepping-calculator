# Adicionar Paginação ao Workflow Bling Cadastrar Produto

## Objetivo

Modificar o workflow para buscar TODAS as páginas de produtos do Bling (não apenas 100), processando produtos simples e variações.

## Solução

Substituir o nó "HTTP Obter Produtos" + "Parsear Requisição" por um único nó que busca todas as páginas.

## Passo a Passo no N8N

### 1. Deletar Nós Antigos

No workflow "Bling Cadastrar Produto", delete:
- ❌ "HTTP Obter Produtos" (nó HTTP Request)
- ❌ "Parsear Requisição" (nó Code)

### 2. Criar Novo Nó "Buscar Todas Páginas"

1. Adicione um nó **Code** após "Edit Fields"
2. Renomeie para **"Buscar Todas Páginas"**
3. Cole o código de `src/hooks/n8n/code-snippets/buscar-todas-paginas-bling.js`

### 3. Reconectar Fluxo

```
Edit Fields → Buscar Todas Páginas → Split Out → Loop Over Items → ...
```

### 4. Modificar "Split Out"

O nó "Split Out" precisa ser ajustado:
- **Field to Split Out**: `data` (ao invés de `id`)

### 5. Modificar "Parsear Requisição" (NOVO)

Adicione um nó **Code** após "Split Out" para extrair apenas os IDs:

```javascript
// Extrair apenas os IDs dos produtos
const produtos = $input.all();

const resultado = produtos.map((item) => {
  return {
    json: {
      id: item.json.id
    }
  };
});

return resultado;
```

## Fluxo Final

```
When clicking 'Execute workflow'
  ↓
Pegar Acess Token1
  ↓
Edit Fields
  ↓
Buscar Todas Páginas (NOVO - busca todas as páginas)
  ↓
Split Out (separa array em itens)
  ↓
Extrair IDs (NOVO - extrai apenas IDs)
  ↓
Loop Over Items (batchSize: 1)
  ↓
HTTP Obter Produtos1 (busca detalhes do produto)
  ↓
If (verifica erro HTTP)
  ↓
Upsert Produto
  ↓
If1 (verifica erro UPSERT)
  ↓
Wait (2s)
  ↓
Replace Me
  ↓
Loop Over Items (próximo produto)
```

## Como Funciona

1. **Buscar Todas Páginas**: Faz loop buscando página 1, 2, 3... até acabar
2. **Ordena**: Produtos pai primeiro, variações depois
3. **Split Out**: Separa o array em itens individuais
4. **Extrair IDs**: Extrai apenas os IDs para o loop
5. **Loop Over Items**: Processa 1 produto por vez (batchSize: 1)
6. **HTTP Obter Produtos1**: Busca detalhes completos do produto
7. **Upsert Produto**: Insere/atualiza no banco

## Benefícios

✅ Processa TODOS os produtos do Bling (não apenas 100)  
✅ Produtos pai inseridos antes das variações  
✅ Produtos simples e variações funcionam  
✅ Paginação automática  
✅ Logs detalhados (total de produtos, páginas, etc.)  

## Resultado Esperado

```
========================================
INICIANDO BUSCA DE TODAS AS PÁGINAS
========================================
📄 Buscando página 1...
✅ Página 1: 100 produtos
📄 Buscando página 2...
✅ Página 2: 100 produtos
📄 Buscando página 3...
✅ Página 3: 45 produtos
🏁 Última página alcançada
========================================
TOTAL DE PRODUTOS ENCONTRADOS: 245
========================================
📦 Produtos simples/pai: 200
🔗 Variações: 45
========================================
```

## Alternativa Simples (Sem Modificar Workflow)

Se não quiser modificar o workflow, você pode:

1. Executar o workflow múltiplas vezes
2. Modificar o nó "Edit Fields" para mudar a página:
   - Execução 1: `{ "pagina": 1 }`
   - Execução 2: `{ "pagina": 2 }`
   - Execução 3: `{ "pagina": 3 }`
   - etc.

Mas isso é manual e trabalhoso. A solução com paginação automática é melhor.

---

**Status**: Documentado  
**Próximo passo**: Implementar no N8N
