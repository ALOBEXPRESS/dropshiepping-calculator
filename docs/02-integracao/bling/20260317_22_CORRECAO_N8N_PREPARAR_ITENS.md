# Correção: Erro no Nó "Preparar Itens do pedido" - N8N Workflow

## Data: 2026-02-24

---

## Problema Reportado

**Erro**: `Cannot read properties of undefined (reading 'itens') [line 3]` no nó "Preparar Itens do pedido" do workflow N8N "Bling Pedido de Venda Automatization"

**Contexto**: O workflow estava funcionando perfeitamente antes das alterações no banco de dados, mas após as mudanças começou a apresentar este erro.

---

## Causa Raiz Identificada

O código JavaScript no nó "Preparar Itens do pedido" estava tentando acessar `$('Buscar Detalhes do Pedido').item.json.data.itens` sem validação adequada:

```javascript
// ❌ CÓDIGO PROBLEMÁTICO (linha 3)
const orderData = $('Buscar Detalhes do Pedido').item.json.data;
const items = orderData.itens || [];
```

**Problemas**:
1. Não verificava se o nó anterior executou com sucesso
2. Não verificava se `item.json` existe
3. Não verificava se `data` existe
4. Não tratava erros adequadamente
5. Se qualquer parte do caminho fosse `undefined`, o erro `Cannot read properties of undefined` seria lançado

---

## Solução Implementada

Reescrito o código com validação robusta e tratamento de erros:

```javascript
// ✅ CÓDIGO CORRIGIDO
try {
  // 1. Verificar se o nó anterior executou e tem dados
  const buscaDetalhes = $('Buscar Detalhes do Pedido');
  
  if (!buscaDetalhes || !buscaDetalhes.item || !buscaDetalhes.item.json) {
    console.error('ERRO: Nó "Buscar Detalhes do Pedido" não retornou dados');
    throw new Error('Nó "Buscar Detalhes do Pedido" não retornou dados válidos');
  }

  // 2. Tentar acessar os dados - pode estar em .data ou diretamente no .json
  const responseJson = buscaDetalhes.item.json;
  const orderData = responseJson.data || responseJson;
  
  console.log('=== DEBUG PREPARAR ITENS ===');
  console.log('Response JSON keys:', Object.keys(responseJson));
  console.log('Order Data keys:', Object.keys(orderData));
  
  // 3. Verificar se existe o campo itens
  if (!orderData.itens) {
    console.error('ERRO: Campo "itens" não encontrado nos dados do pedido');
    console.error('Campos disponíveis:', Object.keys(orderData));
    throw new Error('Campo "itens" não encontrado na resposta da API Bling');
  }

  const items = orderData.itens || [];
  
  // 4. Verificar se há itens
  if (!items || items.length === 0) {
    console.log('AVISO: Nenhum item encontrado no pedido');
    return [];
  }

  console.log('Total de itens encontrados:', items.length);
  console.log('SKUs dos itens:', items.map(item => item.codigo));
  console.log('=============');

  // 5. Retornar cada item como um objeto separado
  return items.map(item => ({
    json: {
      ...item,
      order_data: orderData
    }
  }));
} catch (error) {
  console.error('ERRO CAPTURADO em Preparar Itens do pedido:', error.message);
  console.error('Stack:', error.stack);
  throw error; // Re-lança o erro para o n8n tratar
}
```

---

## Melhorias Implementadas

### 1. Validação em Múltiplas Camadas
- ✅ Verifica se o nó anterior executou
- ✅ Verifica se `item` existe
- ✅ Verifica se `json` existe
- ✅ Verifica se `data` ou campos diretos existem
- ✅ Verifica se `itens` existe

### 2. Logs de Debug Detalhados
- `Response JSON keys` - mostra quais campos estão disponíveis na resposta
- `Order Data keys` - mostra quais campos estão no objeto de dados do pedido
- `Total de itens encontrados` - quantidade de itens processados
- `SKUs dos itens` - lista de SKUs para rastreamento

### 3. Tratamento de Erros Robusto
- Captura qualquer erro com `try/catch`
- Loga mensagem de erro e stack trace
- Re-lança o erro para o N8N tratar adequadamente
- Mensagens de erro descritivas para facilitar debug

### 4. Flexibilidade na Estrutura de Dados
- Suporta resposta com `data` (formato antigo): `response.data.itens`
- Suporta resposta direta (formato novo): `response.itens`
- Adapta-se automaticamente ao formato retornado pela API

---

## Como Testar

### 1. Importar o Workflow Atualizado
1. Abra o N8N
2. Vá para o workflow "Bling Pedido de Venda Automatization"
3. Reimporte o arquivo JSON atualizado ou atualize o nó manualmente

### 2. Testar com Webhook
1. Envie um webhook de teste para o endpoint configurado
2. Observe os logs do nó "Preparar Itens do pedido"
3. Verifique se aparecem os logs de debug:
   - `=== DEBUG PREPARAR ITENS ===`
   - `Response JSON keys: [...]`
   - `Order Data keys: [...]`
   - `Total de itens encontrados: X`
   - `SKUs dos itens: [...]`

### 3. Verificar Execução Bem-Sucedida
- ✅ O nó deve executar sem erros
- ✅ Os itens devem ser processados corretamente
- ✅ Os logs devem mostrar a estrutura de dados recebida
- ✅ O workflow deve continuar para os próximos nós

### 4. Testar Cenários de Erro
Para garantir que o tratamento de erros funciona:
- Teste com um pedido sem itens (deve retornar array vazio)
- Teste com resposta inválida da API (deve logar erro descritivo)
- Verifique os logs de erro no console do N8N

---

## Arquivo Modificado

- `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
  - Nó: "Preparar Itens do pedido" (ID: 6b6cfdf1-8e0a-4431-9624-9a9e22ba3dc8)
  - Posição: [-5840, 5120]

---

## Possíveis Causas do Problema Original

1. **Mudanças no Banco de Dados**: As alterações nas foreign keys e estrutura do banco podem ter afetado como os dados são retornados
2. **Formato de Resposta da API Bling**: A API pode ter mudado o formato de resposta
3. **Timeout ou Erro no Nó Anterior**: O nó "Buscar Detalhes do Pedido" pode ter falhado silenciosamente
4. **Dados Incompletos**: O pedido pode não ter itens ou a resposta pode estar incompleta

---

## Próximos Passos

1. ✅ Importar o workflow atualizado no N8N
2. ✅ Testar com um pedido real
3. ✅ Verificar os logs de debug no console do N8N
4. ✅ Confirmar que os itens são processados corretamente
5. ⚠️ Se ainda houver erros, compartilhar os logs do console do N8N

---

## Notas Técnicas

### Estrutura de Resposta da API Bling

A API Bling retorna pedidos no formato:
```json
{
  "data": {
    "id": 123456,
    "numero": "001",
    "itens": [
      {
        "id": 1,
        "codigo": "SKU123",
        "descricao": "Produto Teste",
        "quantidade": 1,
        "valor": 100.00
      }
    ]
  }
}
```

### Acesso Seguro em JavaScript

Sempre use validação em cadeia ao acessar propriedades aninhadas:
```javascript
// ❌ ERRADO - pode lançar erro
const items = response.data.itens;

// ✅ CORRETO - valida cada nível
const data = response?.data || response;
const items = data?.itens || [];
```

### Logs de Debug no N8N

O N8N captura `console.log()` e `console.error()` e exibe no painel de execução. Use logs generosamente para facilitar o debug.

---

## Status

✅ **CORRIGIDO** - Aguardando teste do usuário no N8N

