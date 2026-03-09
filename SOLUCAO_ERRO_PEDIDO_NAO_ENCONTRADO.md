# Solução: Erro "Pedido não encontrado" ao processar lucro

## Problema
Ao clicar em "Processar Lucro" no pedido #94, aparece o erro:
```
Erro ao processar pedido:
null
```

E no console:
```
Error processing order: Error: Pedido não encontrado
```

## Causa IDENTIFICADA ✅
A function `process_bling_order_to_profit` do Supabase não conseguiu encontrar o produto correspondente na tabela `products`. 

**Análise do Pedido #94:**
- Item do pedido: SKU `363061` (variação "Relógio Feminino Elegance Cor:Dourado e Branco")
- Marketplace: MercadoLivre
- Titular da conta: Alyson (CPF)
- Valor: R$ 34,90

**Problema encontrado:**
1. ❌ O SKU `363061` (variação) NÃO existe na tabela `products`
2. ✅ O SKU `2023165366` (produto pai) existe na tabela `products`, mas com titular "Jonatan" (CPF)
3. ❌ A function está procurando pelo SKU `363061` que está no item do pedido, mas não encontra

**Por que isso acontece:**
- Quando você tem um produto com variações no Bling, cada variação tem seu próprio SKU
- O pedido #94 vendeu a variação SKU `363061`, não o produto pai `2023165366`
- A function `process_bling_order_to_profit` busca o produto pelo SKU exato do item do pedido
- Como a variação não está cadastrada na tabela `products`, a function retorna "Pedido não encontrado"

## Solução

### Passo 1: Cadastrar a variação do produto

Você precisa cadastrar a variação SKU `363061` na tabela `products`:

1. **Ir para a página inicial (Calculadora)**
2. **Clicar em "Produtos integrados"** (seção abaixo do formulário)
3. **Procurar pelo produto** usando o SKU `363061` ou nome "Relógio Feminino Elegance Cor:Dourado e Branco"
4. **Clicar em "Preencher"** para preencher o formulário com os dados do produto
5. **IMPORTANTE: Configurar corretamente**:
   - Marketplace: **Mercado Livre** (ou "mercadolivre")
   - Titular da conta: **Alyson**
   - Tipo de conta: **CPF**
   - Preço de custo: **R$ 21,90** (ou o custo correto)
   - Preço de venda: **R$ 34,90**
6. **Clicar em "Adicionar"** para cadastrar o produto

### Passo 2: Verificar o cadastro
Execute esta query no Supabase para confirmar:

```sql
SELECT 
  p.id,
  p.name,
  p.sku,
  p.marketplace,
  p.cost_price,
  p.price as selling_price,
  p.account_holder,
  p.account_type
FROM products p
WHERE p.sku = '363061';
```

Deve retornar:
- SKU: `363061`
- Nome: `Relógio Feminino Elegance Cor:Dourado e Branco`
- Marketplace: `mercadolivre`
- Titular: `Alyson`
- Tipo: `cpf`

### Passo 3: Processar o pedido novamente
Volte para a página de Vendas e clique em "Processar Lucro" novamente.

## Informações Técnicas Detalhadas

### Dados do Pedido #94
```
Pedido: #94
Data: 2026-03-07
Cliente: Jonatan Renan Vitoriano Da Silva
Valor Total: R$ 34,90
Canal de Venda: MercadoLivre (ID: 205833031)
Titular da Conta: Alyson (CPF)
```

### Item do Pedido
```
SKU: 363061
Nome: Relógio Feminino Elegance Cor:Dourado e Branco
Quantidade: 1
Preço Unitário: R$ 34,90
Preço Total: R$ 34,90
```

### Produtos Cadastrados
```
1. SKU 2023165366 (Produto Pai)
   - Nome: Relógio Feminino Elegance
   - Marketplace: mercadolivre
   - Titular: Jonatan (CPF)
   - Custo: R$ 21,90
   - Venda: R$ 44,90
   - Status: ✅ Cadastrado

2. SKU 363061 (Variação)
   - Nome: Relógio Feminino Elegance Cor:Dourado e Branco
   - Marketplace: -
   - Titular: -
   - Status: ❌ NÃO cadastrado na tabela products
   - Existe em: products_bling (mas sem custo definido)
```

### Por que a function falha?
A function `process_bling_order_to_profit` faz o seguinte:
1. Busca os itens do pedido na tabela `bling_order_items`
2. Para cada item, busca o produto correspondente na tabela `products` usando o SKU
3. Se não encontrar o produto, retorna erro "Pedido não encontrado"

No caso do pedido #94:
- A function busca pelo SKU `363061` (que está no item do pedido)
- Não encontra na tabela `products` (só existe o SKU `2023165366`)
- Retorna erro "Pedido não encontrado"

## Queries úteis para debug

```sql
-- 1. Ver o pedido #94 completo
SELECT 
  bo.id as bling_order_id,
  bo.order_number,
  bo.order_date,
  bo.total_amount,
  bo.contact_name as customer_name,
  sc.name as sales_channel_name,
  sc.marketplace,
  sc.account_holder,
  sc.account_type
FROM bling_orders bo
LEFT JOIN sales_channels sc ON bo.sales_channel_id = sc.id
WHERE bo.order_number = 94;

-- 2. Ver os itens do pedido #94
SELECT 
  boi.id,
  boi.code as sku,
  boi.description as product_name,
  boi.quantity,
  boi.unit_value as unit_price,
  boi.total_value as total_price
FROM bling_order_items boi
WHERE boi.order_id = (SELECT id FROM bling_orders WHERE order_number = 94);

-- 3. Verificar se a variação SKU 363061 está cadastrada
SELECT 
  p.id,
  p.name,
  p.sku,
  p.marketplace,
  p.cost_price,
  p.price as selling_price,
  p.account_holder,
  p.account_type
FROM products p
WHERE p.sku = '363061';

-- 4. Ver a variação no products_bling
SELECT 
  pb.id,
  pb.name,
  pb.sku,
  pb.cost_price,
  pb.sale_price,
  pb.variacao_nome,
  pb.id_produto_pai
FROM products_bling pb
WHERE pb.sku = '363061';

-- 5. Ver todos os produtos cadastrados para Mercado Livre
SELECT 
  p.id,
  p.name,
  p.sku,
  p.marketplace,
  p.cost_price,
  p.price as selling_price,
  p.account_holder,
  p.account_type
FROM products p
WHERE LOWER(p.marketplace) LIKE '%mercado%livre%'
ORDER BY p.updated_at DESC
LIMIT 20;
```

## Melhorias implementadas

1. **Cor do botão "Atualizar"**: Alterada de `#ff4b26` para `#fe2c55` (rosa/vermelho mais vibrante)
2. **Mensagem de erro melhorada**: Agora mostra instruções claras sobre o que verificar quando o erro ocorre
3. **Ordenação de produtos**: Produtos recentemente atualizados/cadastrados aparecem primeiro
4. **Documentação completa**: Este arquivo com análise detalhada do problema

## Lições Aprendidas

### Produtos com Variações
Quando um produto tem variações no Bling:
- Cada variação tem seu próprio SKU único
- Os pedidos referenciam o SKU da variação, não do produto pai
- Você precisa cadastrar CADA VARIAÇÃO separadamente na tabela `products`
- Não basta cadastrar apenas o produto pai

### Matching de Produtos
A function `process_bling_order_to_profit` faz matching por:
1. SKU exato (deve ser idêntico)
2. Marketplace (deve corresponder ao canal de venda)
3. Titular da conta (deve corresponder ao titular do canal de venda)

### Boas Práticas
1. Sempre cadastre as variações que você vende, não apenas o produto pai
2. Verifique se o marketplace e titular estão corretos
3. Mantenha o preço de custo atualizado
4. Use as queries de debug para investigar problemas

## Próximos passos

Se você quiser automatizar o cadastro de produtos quando processar pedidos, podemos criar uma lógica que:
1. Verifica se o produto existe
2. Se não existir, busca na tabela `products_bling`
3. Cadastra automaticamente com dados padrão
4. Processa o pedido

Mas isso requer definir regras de negócio (qual fornecedor usar, qual titular, etc.).
