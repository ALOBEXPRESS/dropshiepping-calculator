# Correção: Erro "Pedido não encontrado"

## Data: 2026-03-11

## Problema

Ao clicar em "PROCESSAR LUCRO" nos pedidos #111, #112 e #113, aparece o erro:
```
❌ Erro ao processar pedido:
Pedido não encontrado
```

## Causa Raiz

A função `process_bling_order_to_profit` do Supabase busca produtos pelo SKU exato do item do pedido. Quando o pedido contém variações de produtos (ex: "Camisa Feminina Cor:Preto"), o SKU no item é da variação, não do produto pai.

**Exemplo:**
- Pedido #111 vendeu SKU `363061` (variação "Relógio Feminino Elegance Cor:Dourado e Branco")
- Na tabela `products` só existe o SKU `2023165366` (produto pai "Relógio Feminino Elegance")
- A função busca por `363061`, não encontra, e retorna erro

## Solução Implementada

Criei uma versão corrigida da função que:

1. **Primeiro**: Busca pelo SKU exato (variação ou produto pai)
2. **Se não encontrar**: Busca a variação no `products_bling`
3. **Se encontrar a variação**: Pega o `id_produto_pai`
4. **Busca o produto pai**: Usa o SKU do produto pai
5. **Usa o custo do produto pai**: Para calcular o lucro

### Fluxo de Busca

```
SKU do item (363061)
    ↓
Busca em products (SKU = 363061) → ❌ Não encontrou
    ↓
Busca em products_bling (SKU = 363061) → ✅ Encontrou variação
    ↓
Pega id_produto_pai (16605084772)
    ↓
Busca SKU do produto pai em products_bling → ✅ SKU 2023165366
    ↓
Busca em products (SKU = 2023165366) → ✅ Encontrou produto pai
    ↓
Usa cost_price do produto pai para calcular lucro
```

## Como Aplicar a Correção

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione o projeto: `oensqhjnxwpcuanozske`
3. Vá em **SQL Editor**
4. Copie e cole o conteúdo do arquivo `supabase/functions/fix-process-order.sql`
5. Clique em **Run** para executar

### Opção 2: Via Supabase CLI

```bash
# Navegar para a pasta do projeto
cd /d/workspace/no-code/dropshipping-calculator-app

# Aplicar a migração
supabase db push --file supabase/functions/fix-process-order.sql
```

### Opção 3: Via psql (Linha de Comando)

```bash
# Conectar ao banco
psql "postgresql://postgres:[PASSWORD]@db.oensqhjnxwpcuanozske.supabase.co:5432/postgres"

# Executar o arquivo
\i supabase/functions/fix-process-order.sql
```

## Verificação

Após aplicar a correção, teste o processamento:

1. Acesse http://localhost:5174/vendas
2. Clique em "PROCESSAR LUCRO" no pedido #111
3. Deve processar com sucesso e mostrar:
   - ✅ Pedido processado com sucesso
   - Itens processados: 2
   - Custo total: R$ XX,XX
   - Receita total: R$ 86,90
   - Comissão: R$ XX,XX
   - Lucro total: R$ XX,XX

## Queries de Debug

### Verificar se a função foi atualizada

```sql
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'process_bling_order_to_profit';
```

### Testar a função manualmente

```sql
-- Pegar o ID do pedido #111
SELECT id FROM bling_orders WHERE order_number = 111;

-- Executar a função
SELECT process_bling_order_to_profit(
  'ID_DO_PEDIDO_AQUI'::uuid,
  NULL
);
```

### Verificar produtos cadastrados

```sql
-- Ver produtos do Mercado Livre
SELECT 
  id,
  name,
  sku,
  marketplace,
  cost_price,
  price,
  account_holder,
  account_type
FROM products
WHERE LOWER(marketplace) LIKE '%mercado%livre%'
ORDER BY updated_at DESC
LIMIT 10;
```

### Verificar variações no products_bling

```sql
-- Ver variações e seus produtos pai
SELECT 
  pb.sku as variacao_sku,
  pb.name as variacao_nome,
  pb.id_produto_pai,
  pp.sku as produto_pai_sku,
  pp.name as produto_pai_nome
FROM products_bling pb
LEFT JOIN products_bling pp ON pb.id_produto_pai = pp.bling_product_id
WHERE pb.id_produto_pai IS NOT NULL
ORDER BY pb.updated_at DESC
LIMIT 10;
```

## Benefícios da Correção

1. ✅ **Não precisa cadastrar cada variação**: Basta ter o produto pai cadastrado
2. ✅ **Usa o custo do produto pai**: Simplifica a gestão de custos
3. ✅ **Fallback inteligente**: Tenta SKU exato primeiro, depois produto pai
4. ✅ **Mensagens de erro claras**: Indica exatamente qual SKU não foi encontrado
5. ✅ **Compatível com produtos sem variações**: Continua funcionando normalmente

## Limitações

- Se o produto pai também não estiver cadastrado, o erro persiste
- Assume que todas as variações têm o mesmo custo do produto pai
- Não suporta custos diferentes por variação (feature futura)

## Próximos Passos

### Curto Prazo
1. Aplicar a correção no Supabase
2. Testar com os 3 pedidos pendentes
3. Verificar se os lucros estão sendo calculados corretamente

### Médio Prazo
1. Criar interface para cadastrar custos por variação
2. Adicionar validação de produtos antes de processar pedidos
3. Implementar sugestão automática de produtos não cadastrados

### Longo Prazo
1. Sincronização automática de variações do Bling
2. Atualização automática de custos
3. Relatório de produtos sem custo definido

## Arquivos Relacionados

- `supabase/functions/fix-process-order.sql` - Função corrigida
- `debug-order-94.sql` - Análise detalhada do problema
- `SOLUCAO_ERRO_PEDIDO_NAO_ENCONTRADO.md` - Documentação anterior
- `src/components/PendingOrders.tsx` - Componente que chama a função

## Logs de Teste

### Antes da Correção
```
🔄 Processando pedido: 1d0a63bd-1f8a-42cb-ba...
📦 Resposta da RPC:
  - data: {success: false, message: Pedido não encontrado}
  - error: null
❌ Falha no processamento: Pedido não encontrado
```

### Depois da Correção (Esperado)
```
🔄 Processando pedido: 1d0a63bd-1f8a-42cb-ba...
📦 Resposta da RPC:
  - data: {
      success: true,
      message: Pedido processado com sucesso,
      order_number: 111,
      items_processed: 2,
      total_cost: 43.80,
      total_revenue: 86.90,
      commission: 10.43,
      total_profit: 32.67
    }
  - error: null
✅ Pedido processado com sucesso!
```

## Contato

Se houver problemas após aplicar a correção, verifique:
1. A função foi atualizada corretamente no Supabase
2. Os produtos pai estão cadastrados na tabela `products`
3. O marketplace e titular estão corretos
4. Os logs do console para mais detalhes

---

**Status**: ✅ Correção Implementada | ⏳ Aguardando Aplicação no Supabase
