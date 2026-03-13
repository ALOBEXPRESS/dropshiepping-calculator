# Paginação Implementada no Workflow Bling Cadastrar Produto

## Data
2026-03-05

## Objetivo

Modificar o workflow para buscar TODAS as páginas de produtos do Bling (não apenas 100), processando produtos simples e variações.

## Mudanças Implementadas

### 1. Nó "Buscar Todas Páginas" (NOVO)

Substituiu os nós:
- ❌ "HTTP Obter Produtos" (deletado)
- ❌ "Parsear Requisição" (deletado)
- ❌ "Edit Fields" (deletado)

Por um único nó **Code** que:
- Busca TODAS as páginas da API do Bling (loop automático)
- Processa 100 produtos por página
- Para quando retorna menos de 100 produtos (última página)
- Separa produtos pai e variações
- Ordena: produtos pai primeiro, variações depois
- Retorna apenas os IDs para o loop

### 2. Fluxo Simplificado

**ANTES:**
```
Pegar Acess Token1 → Edit Fields → HTTP Obter Produtos → Parsear Requisição → Split Out → Loop Over Items
```

**DEPOIS:**
```
Pegar Acess Token1 → Buscar Todas Páginas → Split Out → Loop Over Items
```

### 3. Como Funciona

1. **Buscar Todas Páginas**: 
   - Faz loop buscando página 1, 2, 3... até acabar
   - Cada página retorna até 100 produtos
   - Para quando retorna menos de 100 (última página)
   - Separa produtos pai e variações
   - Ordena: pai primeiro, variações depois
   - Retorna array de IDs

2. **Split Out**: 
   - Separa o array em itens individuais
   - Cada item contém apenas o ID do produto

3. **Loop Over Items**: 
   - Processa 1 produto por vez (batchSize: 1)
   - Garante que produtos pai sejam inseridos antes das variações

4. **HTTP Obter Produtos1**: 
   - Busca detalhes completos do produto por ID

5. **Upsert Produto**: 
   - Insere/atualiza no banco com UPSERT

## Código do Nó "Buscar Todas Páginas"

```javascript
const accessToken = $('Pegar Acess Token1').item.json.access_token;
const baseUrl = 'https://api.bling.com.br/Api/v3/produtos';

let todosOsProdutos = [];
let paginaAtual = 1;
let temMaisPaginas = true;

console.log('========================================');
console.log('INICIANDO BUSCA DE TODAS AS PÁGINAS');
console.log('========================================');

while (temMaisPaginas) {
  console.log(`📄 Buscando página ${paginaAtual}...`);
  
  const response = await this.helpers.httpRequest({
    method: 'GET',
    url: baseUrl,
    qs: {
      pagina: paginaAtual,
      limite: 100
    },
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Cookie': 'PHPSESSID=9if2u0ocn4qso91038ouc9k1f6'
    }
  });
  
  const produtosDaPagina = response.data || [];
  console.log(`✅ Página ${paginaAtual}: ${produtosDaPagina.length} produtos`);
  
  todosOsProdutos = todosOsProdutos.concat(produtosDaPagina);
  
  if (produtosDaPagina.length < 100) {
    temMaisPaginas = false;
    console.log('🏁 Última página alcançada');
  } else {
    paginaAtual++;
  }
}

console.log('========================================');
console.log(`TOTAL DE PRODUTOS ENCONTRADOS: ${todosOsProdutos.length}`);
console.log('========================================');

// Separar produtos pai e variações
const produtosPai = [];
const variacoes = [];

todosOsProdutos.forEach((produto) => {
  if (!produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id) {
    produtosPai.push(produto);
  } else {
    variacoes.push(produto);
  }
});

// Concatenar: primeiro produtos pai, depois variações
const produtosOrdenados = [...produtosPai, ...variacoes];

console.log(`📦 Produtos simples/pai: ${produtosPai.length}`);
console.log(`🔗 Variações: ${variacoes.length}`);
console.log('========================================');

// Monta uma lista de items contendo apenas os IDs
const resultado = produtosOrdenados.map((item) => {
  return {
    json: {
      id: item.id
    }
  };
});

return resultado;
```

## Benefícios

✅ Processa TODOS os produtos do Bling (não apenas 100)  
✅ Produtos pai inseridos antes das variações  
✅ Produtos simples e variações funcionam  
✅ Paginação automática  
✅ Logs detalhados (total de produtos, páginas, etc.)  
✅ Workflow mais simples (menos nós)  
✅ Mais eficiente (menos requisições HTTP)

## Resultado Esperado nos Logs

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

## Tempo de Processamento Estimado

- **Por produto**: ~3-4 segundos (HTTP + UPSERT + Wait)
- **100 produtos**: ~5-7 minutos
- **245 produtos**: ~12-16 minutos
- **500 produtos**: ~25-33 minutos

## Como Testar

1. Importar o workflow atualizado no N8N
2. Executar manualmente (botão "Execute workflow")
3. Verificar logs do nó "Buscar Todas Páginas"
4. Aguardar processamento completo
5. Verificar banco de dados: `SELECT COUNT(*) FROM products_bling`

## Próximos Passos

1. ✅ Workflow modificado
2. ⏳ Importar no N8N
3. ⏳ Testar com produtos reais
4. ⏳ Verificar se produtos pai e variações são inseridos corretamente
5. ⏳ Validar que não há mais erro de FK constraint

## Arquivos Modificados

- `src/hooks/n8n/workflows/Bling Cadastrar Produto.json`
- `docs/PAGINACAO_WORKFLOW_IMPLEMENTADA.md` (este arquivo)

---

**Status**: ✅ Implementado  
**Testado**: Pendente (aguardando teste do usuário)  
**Prioridade**: Alta  
**Impacto**: Resolve limitação de 100 produtos, processa TODOS os produtos do Bling
