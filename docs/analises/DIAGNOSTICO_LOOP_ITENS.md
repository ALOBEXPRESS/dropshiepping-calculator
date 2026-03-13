# Diagnóstico: Loop de Itens Não Está Inserindo na Tabela

## Problema Relatado
O workflow está inserindo o pedido na tabela `bling_orders`, mas não está inserindo os itens na tabela `bling_order_items`. O fluxo para no nó "Loop Over Items1".

## Verificação das Conexões

As conexões estão corretas no arquivo JSON:

1. ✅ "Inserir Pedido" → "Preparar Itens do pedido"
2. ✅ "Atualizar Pedido" → "Preparar Itens do pedido"
3. ✅ "Preparar Itens do pedido" → "Loop Over Items1"
4. ✅ "Loop Over Items1" → "Pega mais dados do ID Produto1" (para cada item)
5. ✅ "Pega mais dados do ID Produto1" → "Buscar Produto por SKU1"
6. ✅ "Buscar Produto por SKU1" → "Preparar dados do item1"
7. ✅ "Preparar dados do item1" → "Inserir item do pedido1"
8. ✅ "Inserir item do pedido1" → volta para "Loop Over Items1"

## Código Verificado

### Nó "Preparar Itens do pedido" ✅
```javascript
// Extrair array de itens do pedido
const orderData = $('Buscar Detalhes do Pedido').item.json.data;
const items = orderData.itens || [];

// Retornar cada item como um objeto separado
return items.map(item => ({
  json: {
    ...item,
    order_data: orderData // Manter referência ao pedido completo
  }
}));
```

### Nó "Pega mais dados do ID Produto1" ✅
URL: `https://api.bling.com.br/Api/v3/produtos/{{ $json.produto.id }}`
(Sem o `itens[0]` - correto!)

### Nó "Preparar dados do item1" ✅
```javascript
const item = $input.item.json;
```
(Sem usar array index - correto!)

## Possíveis Causas do Problema

### 1. Configuração do Loop Over Items1
O nó "Loop Over Items1" tem `batchSize: 1`, o que significa que processa um item por vez. Verifique:

**No n8n, abra o nó "Loop Over Items1" e verifique:**
- ✅ Batch Size deve estar em 1
- ✅ Reset deve estar DESLIGADO (toggle off)

### 2. Dados Não Estão Chegando ao Loop
O nó "Preparar Itens do pedido" pode não estar retornando dados.

**Para verificar:**
1. Execute o workflow com um pedido de teste
2. Clique no nó "Preparar Itens do pedido"
3. Verifique se a saída mostra múltiplos itens (um para cada produto do pedido)
4. Se mostrar apenas 1 item ou nenhum, o problema está aqui

**Exemplo de saída esperada:**
```json
[
  {
    "json": {
      "produto": { "id": 123 },
      "quantidade": 2,
      "order_data": { ... }
    }
  },
  {
    "json": {
      "produto": { "id": 456 },
      "quantidade": 1,
      "order_data": { ... }
    }
  }
]
```

### 3. Loop Não Está Iterando
O loop pode estar configurado incorretamente.

**Para verificar:**
1. Execute o workflow
2. Clique no nó "Loop Over Items1"
3. Verifique se ele mostra múltiplas execuções (uma para cada item)
4. Se mostrar apenas 1 execução, o loop não está iterando

### 4. Erro Silencioso no Fluxo
Pode haver um erro em algum nó intermediário que está sendo ignorado.

**Para verificar:**
1. Execute o workflow
2. Verifique cada nó após o "Loop Over Items1":
   - "Pega mais dados do ID Produto1"
   - "Buscar Produto por SKU1"
   - "Preparar dados do item1"
   - "Inserir item do pedido1"
3. Procure por ícones de erro (⚠️) ou saídas vazias

### 5. Pedido de Teste Não Tem Itens
O pedido usado para teste pode não ter itens.

**Para verificar:**
1. Clique no nó "Buscar Detalhes do Pedido"
2. Verifique se `data.itens` é um array com elementos
3. Se estiver vazio `[]`, o pedido não tem produtos

## Solução Passo a Passo

### Passo 1: Verificar Dados do Pedido
```
1. Execute o workflow com um pedido real
2. Clique em "Buscar Detalhes do Pedido"
3. Procure por "data.itens" na saída
4. Confirme que há pelo menos 1 item no array
```

### Passo 2: Verificar Saída do "Preparar Itens do pedido"
```
1. Clique no nó "Preparar Itens do pedido"
2. Verifique se a saída mostra múltiplos objetos
3. Cada objeto deve ter "produto.id" e "quantidade"
```

### Passo 3: Verificar Execução do Loop
```
1. Clique no nó "Loop Over Items1"
2. Verifique se há múltiplas execuções (ex: "1 of 3", "2 of 3", "3 of 3")
3. Se houver apenas 1 execução, o loop não está funcionando
```

### Passo 4: Verificar Inserção no Banco
```
1. Clique no nó "Inserir item do pedido1"
2. Verifique se há múltiplas execuções
3. Cada execução deve retornar um UUID (id do item inserido)
```

### Passo 5: Verificar no Banco de Dados
```sql
-- Verificar se os itens foram inseridos
SELECT * FROM bling_order_items 
WHERE order_id = 'UUID_DO_PEDIDO'
ORDER BY created_at DESC;
```

## Correção Alternativa: Remover o Loop

Se o loop continuar não funcionando, podemos usar uma abordagem diferente:

### Opção A: Usar Split In Batches
Substitua o "Loop Over Items1" por um nó "Split In Batches" com batch size 1.

### Opção B: Processar Todos os Itens de Uma Vez
Modifique o nó "Inserir item do pedido1" para aceitar múltiplos itens e usar um loop SQL.

## Teste Rápido

Execute este teste para confirmar o problema:

1. Crie um pedido de teste no Bling com 2 produtos
2. Dispare o webhook
3. Verifique quantos registros foram inseridos:
   ```sql
   SELECT COUNT(*) FROM bling_order_items 
   WHERE order_id = (
     SELECT id FROM bling_orders 
     ORDER BY created_at DESC 
     LIMIT 1
   );
   ```
4. Se retornar 0, o loop não está executando
5. Se retornar 1, o loop está executando apenas uma vez
6. Se retornar 2, está funcionando corretamente!

## Próximos Passos

1. Execute o teste rápido acima
2. Verifique cada passo da solução
3. Anote em qual passo o fluxo para
4. Me informe o resultado para eu ajudar com a correção específica
