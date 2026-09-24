# 🔧 Plano de Ação: Sincronizar Workflow n8n

## 🎯 Problema Identificado

O workflow no n8n está **desatualizado** em relação ao arquivo JSON local:

### ❌ O que está faltando no n8n:
1. **Nó "Buscar Variação por SKU2"** - Busca variações na tabela `products_variations_bling`
2. **Nó "Combinar Produtos e Variações2"** - Combina resultados de produtos simples e variações
3. **Conexões corretas** entre os nós

### ✅ O que existe no arquivo local:
- Arquivo: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization (1).json`
- Contém todos os nós necessários
- Contém a lógica correta para processar variações

## 🚀 Soluções Disponíveis

### Opção 1: Atualização Manual no n8n (RECOMENDADO)

Esta é a opção mais segura e permite validar cada passo:

#### Passo 1: Criar o nó "Buscar Variação por SKU2"

1. Abra o workflow no n8n
2. Localize o nó "Buscar Produto por SKU2"
3. Adicione um novo nó **Supabase** ao lado dele
4. Configure:
   - **Nome:** `Buscar Variação por SKU2`
   - **Operation:** `Get All`
   - **Table:** `products_variations_bling`
   - **Return All:** `true`
   - **Filters:**
     - Key: `sku`
     - Condition: `equals`
     - Value: `={{ $('Preparar Itens do pedido2').item.json.codigo }}`
   - **Always Output Data:** `true`

#### Passo 2: Criar o nó "Combinar Produtos e Variações2"

1. Adicione um novo nó **Code** após os dois nós de busca
2. Configure:
   - **Nome:** `Combinar Produtos e Variações2`
   - **Code:** (copie o código abaixo)

```javascript
// Combinar produtos simples e variações
try {
  console.log('=== COMBINAR PRODUTOS E VARIAÇÕES ===');
  
  const productsSimples = $('Buscar Produto por SKU2').all();
  const productsVariacoes = $('Buscar Variação por SKU2').all();
  
  console.log('Produtos simples:', productsSimples.length);
  console.log('Variações:', productsVariacoes.length);
  
  const allProducts = [];
  
  // Adicionar produtos simples com product_type
  for (const item of productsSimples) {
    allProducts.push({
      json: {
        ...item.json,
        product_type: 'simple',
        product_bling_id: null,
        variacao_nome: null
      }
    });
  }
  
  // Adicionar variações com product_type
  for (const item of productsVariacoes) {
    allProducts.push({
      json: {
        ...item.json,
        name: item.json.variacao_nome,
        marketplace: null,
        price: item.json.sale_price,
        product_type: 'variation'
      }
    });
  }
  
  console.log('Total combinado:', allProducts.length);
  
  if (allProducts.length === 0) {
    console.warn('⚠️ Nenhum produto encontrado');
    return [];
  }
  
  return allProducts;
  
} catch (error) {
  console.error('ERRO ao combinar produtos:', error.message);
  return [];
}
```

#### Passo 3: Atualizar Conexões

Conecte os nós na seguinte ordem:

```
Preparar Itens do pedido2
    ├─→ Buscar Produto por SKU2 ────┐
    │                                 ├─→ Combinar Produtos e Variações2 ─→ Preparar dados do item2
    └─→ Buscar Variação por SKU2 ────┘
```

**IMPORTANTE:** Remova a conexão antiga:
- ❌ `Buscar Produto por SKU2` → `Preparar dados do item2` (REMOVER)

#### Passo 4: Atualizar o nó "Preparar dados do item2"

O código deste nó já está correto no workflow ativo (ele lê de "Combinar Produtos e Variações2"), mas verifique se a linha que lê os dados está assim:

```javascript
const allProductsFromDB = $input.all();
```

### Opção 2: Importar o Workflow Atualizado

**⚠️ ATENÇÃO:** Esta opção vai **substituir completamente** o workflow atual.

1. Faça backup do workflow atual:
   - Abra o workflow no n8n
   - Clique em "..." → "Download"
   - Salve o arquivo como backup

2. Importe o novo workflow:
   - No n8n, vá em "Workflows"
   - Clique em "Import from File"
   - Selecione: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization (1).json`
   - **IMPORTANTE:** Marque a opção "Update existing workflow" se quiser manter o mesmo ID

3. Ative o workflow:
   - Abra o workflow importado
   - Clique em "Active" para ativar

### Opção 3: Usar SQL UNION (Alternativa Simples)

Se você preferir uma solução mais simples sem criar novos nós:

1. Abra o nó "Buscar Produto por SKU2"
2. Mude de "Get All" para "Execute Query"
3. Use esta query SQL:

```sql
SELECT 
  id,
  sku,
  name,
  marketplace,
  price,
  'simple' as product_type,
  null::bigint as product_bling_id,
  null as variacao_nome
FROM products
WHERE sku = '{{ $('Preparar Itens do pedido2').item.json.codigo }}'

UNION ALL

SELECT 
  id,
  sku,
  variacao_nome as name,
  null as marketplace,
  sale_price as price,
  'variation' as product_type,
  product_bling_id,
  variacao_nome
FROM products_variations_bling
WHERE sku = '{{ $('Preparar Itens do pedido2').item.json.codigo }}'
```

**Vantagem:** Não precisa criar novos nós
**Desvantagem:** Menos modular, mais difícil de debugar

## 🧪 Como Testar

Depois de aplicar qualquer uma das soluções:

### Teste 1: Variação (YEIZ_IDP294_004)
1. Clone uma venda no Bling com SKU `YEIZ_IDP294_004`
2. Verifique os logs:
   - "Buscar Variação por SKU2" (ou UNION query) deve retornar 1 item
   - "Combinar Produtos e Variações2" deve mostrar "Total combinado: 1"
   - "Preparar dados do item2" deve processar com `product_type: 'variation'`
   - "Inserir item do pedido2" deve inserir com:
     - `product_id`: NULL
     - `product_variation_id`: UUID
     - `product_bling_id`: bigint

### Teste 2: Produto Simples (YEIZ_IDP248)
1. Clone uma venda no Bling com SKU `YEIZ_IDP248`
2. Verifique que continua funcionando:
   - Deve inserir com `product_id`: UUID
   - `product_variation_id` e `product_bling_id`: NULL

## 📋 Checklist de Validação

- [ ] Nó "Buscar Variação por SKU2" criado (ou UNION query implementada)
- [ ] Nó "Combinar Produtos e Variações2" criado (se aplicável)
- [ ] Conexões atualizadas corretamente
- [ ] Workflow salvo e ativado
- [ ] Teste com variação (YEIZ_IDP294_004) passou
- [ ] Teste com produto simples (YEIZ_IDP248) passou
- [ ] Logs não mostram erros de `bling_item_id` null

## 🆘 Precisa de Ajuda?

Se encontrar problemas:

1. **Verifique os logs do n8n:**
   - Abra o workflow
   - Execute manualmente
   - Clique em cada nó para ver os dados

2. **Verifique as conexões:**
   - Certifique-se que "Preparar dados do item2" está lendo de "Combinar Produtos e Variações2"

3. **Verifique o código:**
   - O código do "Preparar dados do item2" deve ter a lógica de `product_type`

---

**Recomendação:** Use a **Opção 1 (Atualização Manual)** para ter mais controle e entender cada mudança.
