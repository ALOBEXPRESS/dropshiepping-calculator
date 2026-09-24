# Debug: Atualização de Variações Não Funcionando

## Problema

Usuário alterou preços de variações no Bling:
- SKU `YEIZ_IDP323_001` (Cor: Cinza): R$ 65,00 → R$ 69,00
- SKU `YEIZ_IDP323_005` (Cor: Branco): R$ 65,00 → R$ 66,00

Mas o banco ainda mostra R$ 65,00 para ambos com `updated_at` de 2026-03-07.

## Estado Atual do Banco

```sql
bling_id: 16613337810, sku: YEIZ_IDP323_001, sale_price: 65, updated_at: 2026-03-07 16:35:58
bling_id: 16613337836, sku: YEIZ_IDP323_005, sale_price: 65, updated_at: 2026-03-07 16:35:47
```

## Análise do Workflow

### Nó "Processa Resultado1"

O código detecta variações e faz UPDATE:

```javascript
if (produtoData.data.variacao && produtoData.data.variacao.produtoPai && produtoData.data.variacao.produtoPai.id) {
  console.log('VARIAÇÃO DETECTADA: Atualizando em products_variations_bling');
  
  const updateData = {
    name: produtoData.data.nome,
    sku: produtoData.data.codigo,
    variacao_nome: produtoData.data.variacao.nome,
    sale_price: produtoData.data.preco || null,
    // ... outros campos
    updated_at: new Date().toISOString()
  };
  
  const response = await $http.request({
    method: 'PATCH',
    url: supabaseUrl,
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: updateData
  });
}
```

## Possíveis Causas

### 1. Webhook não está disparando
- Verificar se o webhook está configurado corretamente no Bling
- Verificar se o Bling está enviando eventos de atualização de variações

### 2. Workflow não foi importado corretamente
- Verificar se o workflow foi reimportado após as modificações
- Verificar se o workflow está ativo no N8N

### 3. Erro no código de UPDATE
- Verificar logs do N8N para ver se há erros
- Verificar se a URL do Supabase está correta
- Verificar se o `bling_id` está sendo usado corretamente no filtro

### 4. Problema com o filtro do UPDATE
- URL: `products_variations_bling?bling_id=eq.${blingId}`
- Verificar se o `blingId` está correto

## Análise do Código

O código de UPDATE está correto:

```javascript
const supabaseUrl = `https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_variations_bling?bling_id=eq.${blingId}`;

const response = await $http.request({
  method: 'PATCH',
  url: supabaseUrl,
  headers: {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: updateData
});
```

O filtro `bling_id=eq.${blingId}` está correto para o Supabase REST API.

## Diagnóstico Mais Provável

**O webhook do Bling NÃO está disparando para atualizações de variações.**

Motivos possíveis:
1. Webhook do Bling só dispara para produtos PAI, não para variações
2. Webhook não está configurado para evento de "atualização"
3. Webhook está configurado mas com filtros que excluem variações

## Próximos Passos

1. ✅ Verificar estado atual do banco (FEITO)
2. ✅ Analisar código do workflow (FEITO - código está correto)
3. ⏳ **CRÍTICO**: Verificar logs do N8N para ver se webhook disparou
4. ⏳ **CRÍTICO**: Verificar configuração do webhook no Bling
5. ⏳ Testar manualmente: salvar uma variação no Bling e verificar logs
6. ⏳ Se webhook não disparar, criar solução alternativa

## Teste Manual Sugerido

1. Abrir N8N e verificar execuções recentes do workflow
2. Filtrar por execuções que envolvem as variações:
   - `bling_id: 16613337810`
   - `bling_id: 16613337836`
3. Verificar logs:
   - "VARIAÇÃO DETECTADA: Atualizando em products_variations_bling"
   - "VARIAÇÃO ATUALIZADA COM SUCESSO"
   - Ou erros
4. Se não houver execuções, webhook não está disparando
5. Se houver execuções com erro, verificar mensagem de erro

## Solução Temporária

Se o webhook não estiver funcionando, podemos:
1. Criar um endpoint manual para atualizar variações
2. Criar um script que busca variações do Bling e atualiza o banco
3. Verificar configuração do webhook no Bling


## Como Verificar se o Webhook Está Disparando

### 1. Verificar Execuções no N8N

1. Abrir N8N: http://localhost:5678 (ou URL do seu N8N)
2. Ir em "Executions" (Execuções)
3. Filtrar pelo workflow "Bling Cadastrar/Atualizar/Deletar Produto Automatization"
4. Procurar por execuções recentes (hoje, 08/03/2026)
5. Verificar se há execuções quando você salvou as variações no Bling

### 2. Verificar Logs das Execuções

Se houver execuções, abrir e verificar:
- Nó "Webhook1": Ver o payload recebido do Bling
- Nó "Pega mais dados do ID Produto1": Ver os dados da variação
- Nó "Processa Resultado1": Ver os logs:
  - "VARIAÇÃO DETECTADA: Atualizando em products_variations_bling"
  - "ID da variação: 16613337810" (ou 16613337836)
  - "VARIAÇÃO ATUALIZADA COM SUCESSO"
  - Ou mensagens de erro

### 3. Verificar Configuração do Webhook no Bling

1. Abrir Bling: https://www.bling.com.br
2. Ir em Configurações > API > Webhooks
3. Verificar se há um webhook configurado
4. Verificar:
   - URL do webhook (deve apontar para o N8N)
   - Eventos configurados (deve incluir "produto.atualizado" ou similar)
   - Se está ativo
   - Se há filtros que excluem variações

### 4. Teste Manual

Para testar se o webhook funciona:

1. Abrir uma variação no Bling (ex: SKU YEIZ_IDP323_001)
2. Alterar o preço para um valor diferente (ex: R$ 70,00)
3. Salvar
4. Imediatamente ir no N8N e verificar se uma nova execução apareceu
5. Se aparecer, abrir e verificar os logs
6. Se NÃO aparecer, o webhook não está disparando

## Solução Alternativa (Se Webhook Não Funcionar)

Se o webhook do Bling não disparar para variações, podemos criar uma solução alternativa:

### Opção 1: Workflow Agendado

Criar um workflow que roda a cada X minutos e:
1. Busca todas as variações do Bling
2. Compara com o banco
3. Atualiza as que mudaram

### Opção 2: Endpoint Manual

Criar um endpoint no N8N que:
1. Recebe o `bling_id` da variação
2. Busca dados atualizados do Bling
3. Atualiza no banco

Você pode chamar esse endpoint manualmente ou via script.

### Opção 3: Modificar Webhook para Buscar Variações

Modificar o workflow para que quando um produto PAI for atualizado:
1. Buscar todas as variações dele no Bling
2. Atualizar todas as variações no banco

Isso garante que as variações sejam atualizadas mesmo que o webhook não dispare para elas.

## Teste Rápido: Atualizar Manualmente

Para testar se o código de UPDATE funciona, você pode executar este SQL no Supabase:

```sql
-- Simular uma atualização manual
UPDATE products_variations_bling
SET 
  sale_price = 69,
  updated_at = NOW()
WHERE bling_id = 16613337810;

UPDATE products_variations_bling
SET 
  sale_price = 66,
  updated_at = NOW()
WHERE bling_id = 16613337836;
```

Depois verificar no frontend se os preços foram atualizados.

Se funcionar, confirma que o problema é o webhook não disparando, não o código de UPDATE.
