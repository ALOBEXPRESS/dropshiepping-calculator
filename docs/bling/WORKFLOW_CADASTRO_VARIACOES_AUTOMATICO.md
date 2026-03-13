# ✅ Workflow: Cadastro Automático de Variações de Produtos

## Problema Resolvido

Quando o usuário clica em "Preencher" na página de produtos, o sistema cadastrava apenas o produto pai em `products_bling`, mas não cadastrava as variações. Isso causava o erro "Pedido não encontrado" ao processar lucro de pedidos que venderam variações.

## Solução Implementada

Modificado o workflow "Cadastrar_Atualizar_Deletar Produto" para buscar e cadastrar automaticamente todas as variações quando um produto é cadastrado.

## Novos Nós Adicionados

### 1. Buscar Variações no Bling
- **Tipo**: HTTP Request
- **URL**: `https://api.bling.com.br/Api/v3/produtos?criterio=5&idProdutoPai={{ produto_id }}`
- **Função**: Busca todas as variações do produto na API do Bling
- **Parâmetros**:
  - `criterio=5`: Busca por produto pai
  - `idProdutoPai`: ID do produto cadastrado

### 2. Processar Variações
- **Tipo**: Code (JavaScript)
- **Função**: Verifica se o produto tem variações e prepara os dados
- **Lógica**:
  ```javascript
  // Se não houver variações, retorna hasVariations: false
  if (!response.data || response.data.length === 0) {
    return [{ hasVariations: false }];
  }
  
  // Se houver, retorna um item para cada variação
  return response.data.map(variation => ({
    hasVariations: true,
    variationData: variation,
    parentProductId: produto_pai_id
  }));
  ```

### 3. Buscar Detalhes da Variação
- **Tipo**: HTTP Request
- **URL**: `https://api.bling.com.br/Api/v3/produtos/{{ variation_id }}`
- **Função**: Busca os detalhes completos de cada variação
- **Retry**: 3 tentativas com 2s de intervalo

### 4. Cadastrar Variação no Banco
- **Tipo**: HTTP Request (Upsert)
- **URL**: `https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?on_conflict=bling_id`
- **Função**: Insere ou atualiza a variação em `products_bling`
- **Campos cadastrados**:
  - Dados básicos: `bling_id`, `name`, `sku`, `stock_quantity`
  - Preços: `cost_price`, `sale_price`
  - Imagens: `image_url1` até `image_url10`
  - Dimensões: `peso`, `largura`, `altura`, `profundidade`
  - Variação: `variacao_nome`, `id_produto_pai`
  - Outros: `ncm`, `ean`, `video_url`, etc.

## Fluxo Completo

```
1. Webhook recebe evento do Bling
2. Pega Access Token
3. Loop Over Items
4. Pega mais dados do ID Produto
5. Verifica se produto existe
6. Processa Resultado
7. Detecta Mudanças
8. Tem mudanças?
   ├─ SIM → Upsert no banco (Cria ou Atualiza)
   │         └─ Buscar Variações no Bling
   │            └─ Processar Variações
   │               └─ Para cada variação:
   │                  ├─ Buscar Detalhes da Variação
   │                  └─ Cadastrar Variação no Banco
   └─ NÃO → Log - Sem Mudanças
```

## Exemplo Real

### Produto Pai Cadastrado
```
Nome: Relógio Feminino Elegance
SKU: 2023165366
Bling ID: 16605084772
```

### Variações Cadastradas Automaticamente
```
1. Relógio Feminino Elegance Cor:Dourado e Branco
   SKU: 363061
   Bling ID: 16605084773
   id_produto_pai: 16605084772

2. Relógio Feminino Elegance Cor:Preto e Prata
   SKU: 363062
   Bling ID: 16605084774
   id_produto_pai: 16605084772

3. Relógio Feminino Elegance Cor:Azul e Branco
   SKU: 363063
   Bling ID: 16605084775
   id_produto_pai: 16605084772
```

## API do Bling

### Endpoint de Busca de Variações
```
GET https://api.bling.com.br/Api/v3/produtos?criterio=5&idProdutoPai={id}
```

**Parâmetros:**
- `criterio=5`: Busca por produto pai
- `idProdutoPai`: ID do produto pai no Bling

**Resposta:**
```json
{
  "data": [
    {
      "id": 16605084773,
      "codigo": "363061",
      "nome": "Relógio Feminino Elegance Cor:Dourado e Branco",
      "variacao": {
        "nome": "Cor:Dourado e Branco",
        "produtoPai": {
          "id": 16605084772
        }
      }
    }
  ]
}
```

### Endpoint de Detalhes do Produto
```
GET https://api.bling.com.br/Api/v3/produtos/{id}
```

**Resposta:** Dados completos do produto incluindo imagens, dimensões, preços, etc.

## Estrutura da Tabela `products_bling`

```sql
CREATE TABLE products_bling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  bling_id bigint UNIQUE,
  name text,
  sku text UNIQUE,
  stock_quantity integer,
  cost_price numeric,
  sale_price numeric,
  image_url1 text,
  image_url2 text,
  -- ... até image_url10
  variacao_nome text,
  id_produto_pai bigint,  -- FK para products_bling.bling_id
  peso numeric,
  largura numeric,
  altura numeric,
  profundidade numeric,
  -- ... outros campos
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT products_bling_parent_fkey 
    FOREIGN KEY (id_produto_pai) 
    REFERENCES products_bling(bling_id)
);
```

## Teste

Para testar se está funcionando:

1. Importe o workflow no N8N
2. Na página de produtos, clique em "Preencher" em um produto que tem variações
3. Verifique no Supabase se as variações foram cadastradas:

```sql
-- Buscar produto pai e suas variações
SELECT 
  bling_id,
  sku,
  name,
  variacao_nome,
  id_produto_pai
FROM products_bling
WHERE sku = '2023165366'  -- Produto pai
   OR id_produto_pai = (
     SELECT bling_id 
     FROM products_bling 
     WHERE sku = '2023165366'
   )
ORDER BY id_produto_pai NULLS FIRST, bling_id;
```

4. Crie um pedido de teste no Bling vendendo uma variação
5. Clique em "Processar Lucro" - não deve dar mais erro

## Benefícios

1. ✅ Cadastro automático de todas as variações
2. ✅ Pedidos com variações são processados corretamente
3. ✅ Não precisa cadastrar manualmente cada variação
4. ✅ Mantém consistência entre Bling e sistema
5. ✅ Resolve o erro "Pedido não encontrado"

## Arquivos Modificados

- ✅ `src/hooks/n8n/workflows/Bling Cadastrar_Atualizar_Deletar Produto Automatization.json`
- ✅ `scripts/add-variacoes-cadastro-workflow.py` (script de modificação)
- ✅ Backup criado em `scripts/output/backups/`

## Próximos Passos

1. Importar o workflow no N8N
2. Testar com um produto que tem variações
3. Verificar se as variações foram cadastradas
4. Testar o processamento de lucro de um pedido com variação
