# 🔄 N8N: Cadastro Automático de Variações de Produtos

## ✅ STATUS: WORKFLOW DE PEDIDOS CORRIGIDO

O workflow "Bling Pedido de Venda Automatization" foi modificado com sucesso para buscar automaticamente todas as variações de produtos.

## Modificações Realizadas no Workflow de Pedidos

### Nó "Buscar Produto por SKU1"

**ANTES:**
```json
{
  "operation": "getAll",
  "tableId": "products_bling",
  "limit": 1,  // ❌ Limitava a 1 resultado
  "filters": {
    "conditions": [
      {
        "keyName": "sku",
        "condition": "eq",
        "keyValue": "={{ $json.data.codigo }}"
      }
    ]
  }
}
```

**DEPOIS (✅ CORRIGIDO):**
```json
{
  "operation": "getAll",
  "tableId": "products_bling",
  // ✅ Sem limit - retorna todos os resultados
  "filters": {
    "conditions": [
      {
        "keyName": "sku",
        "condition": "eq",
        "keyValue": "={{ $json.data.codigo }}"
      },
      {
        "keyName": "id_produto_pai",  // ✅ Nova condição
        "condition": "eq",
        "keyValue": "={{ $json.data.id }}"
      }
    ]
  },
  "options": {
    "queryName": "or"  // ✅ Filtro OR (Any Filter)
  }
}
```

## Como Funciona Agora

1. Quando um pedido é recebido, o sistema busca o produto pelo SKU
2. A busca usa filtro OR: `sku = X OR id_produto_pai = X`
3. Isso retorna:
   - O produto pai (se o SKU for do pai)
   - OU todas as variações (se o SKU for de uma variação)
4. O nó "Preparar dados do item1" já está preparado para processar múltiplos produtos
5. Cada produto/variação é inserido como um item do pedido

## Exemplo Real (Pedido #94)

### Estrutura no Bling
```
Produto Pai: Relógio Feminino Elegance (SKU: 2023165366, ID: 16605084772)
├── Variação 1: Relógio Feminino Elegance Cor:Dourado e Branco (SKU: 363061, id_produto_pai: 16605084772)
├── Variação 2: Relógio Feminino Elegance Cor:Preto e Prata (SKU: 363062, id_produto_pai: 16605084772)
└── Variação 3: Relógio Feminino Elegance Cor:Azul e Branco (SKU: 363063, id_produto_pai: 16605084772)
```

### Fluxo de Busca

**Cenário 1: Pedido vende o produto pai (SKU 2023165366)**
```sql
SELECT * FROM products_bling 
WHERE sku = '2023165366' OR id_produto_pai = 16605084772
-- Retorna: produto pai + 3 variações (4 registros)
```

**Cenário 2: Pedido vende uma variação (SKU 363061)**
```sql
SELECT * FROM products_bling 
WHERE sku = '363061' OR id_produto_pai = 16605084773
-- Retorna: apenas a variação vendida (1 registro)
```

## Validação do Workflow

Execute o script de validação para verificar se o workflow está correto:

```bash
python scripts/corrigir-workflow-n8n.py
```

Saída esperada:
```
✅ Estrutura está correta!
  - Limit: não definido (sem limite)
  - Condições: 2
    1. sku eq ={{ $json.data.codigo }}
    2. id_produto_pai eq ={{ $json.data.id }}
  - Query Name (OR): or
```

## Importação no N8N

Para importar o workflow no N8N:

1. Abra o N8N
2. Vá em "Workflows" > "Import from File"
3. Selecione: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
4. Clique em "Import"

**Se der erro "Could not find property option":**
- ✅ Verifique se o arquivo JSON está válido (use o script de validação)
- ✅ A estrutura deve usar `options.queryName: "or"` (não `combinator: "or"`)
- ✅ Não deve haver campos extras ou inválidos
- ✅ Execute o script de validação antes de importar

## ⚠️ Próximo Problema: Cadastro Manual de Produtos

O workflow de pedidos está correto, mas ainda existe um problema:

**Quando o usuário clica em "Preencher" na página de produtos:**
- ✅ O sistema cadastra o produto em `products_bling` (via workflow)
- ❌ O sistema NÃO cadastra as variações em `products` (tabela do frontend)

**Solução necessária:**

Modificar o workflow "Cadastrar_Atualizar_Deletar Produto" para:
1. Quando um produto é cadastrado, buscar todas as suas variações no Bling
2. Cadastrar automaticamente todas as variações encontradas em `products_bling`

## Scripts Disponíveis

- `scripts/corrigir-workflow-n8n.py` - Valida o workflow de pedidos ✅
- `scripts/modificar-workflow-variacoes.py` - Script para modificar workflows (corrigido)

## Estrutura da Tabela `products_bling`

```sql
-- Produto Pai
id: uuid
bling_id: 16605084772 (ID único do Bling)
sku: '2023165366'
name: 'Relógio Feminino Elegance'
variacao_nome: null
id_produto_pai: null

-- Variação 1
id: uuid
bling_id: 16605084773
sku: '363061'
name: 'Relógio Feminino Elegance Cor:Dourado e Branco'
variacao_nome: 'Cor:Dourado e Branco'
id_produto_pai: 16605084772 (aponta para o pai)

-- Variação 2
id: uuid
bling_id: 16605084774
sku: '363062'
name: 'Relógio Feminino Elegance Cor:Preto e Prata'
variacao_nome: 'Cor:Preto e Prata'
id_produto_pai: 16605084772
```

## Benefícios

1. ✅ Cadastro automático de todas as variações nos pedidos
2. ✅ Pedidos com variações serão processados corretamente
3. ✅ Não precisa cadastrar manualmente cada variação
4. ✅ Mantém consistência entre Bling e sistema
