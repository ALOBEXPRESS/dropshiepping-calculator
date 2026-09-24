# Análise Final: Erro Duplicate Key

## 🔍 Situação Atual

### Produtos no Banco
Existem 2 produtos com o nome "teste32972":

1. **Produto 1**
   - ID: `3da69fd8-dc20-4071-acd4-6d953668ad27`
   - SKU: `98983h8k`
   - Bling ID: `16611344717`
   - Criado: 2026-03-03 15:25:51

2. **Produto 2**
   - ID: `a69c6e81-1f48-4ef8-a890-effd424d22ae`
   - SKU: `teste269720`
   - Bling ID: `16611353744`
   - Criado: 2026-03-03 15:45:53

## 🐛 Problema Identificado

### Cenário do Erro
1. Você edita um produto no Bling (ex: produto com bling_id `16611353744`)
2. Webhook dispara com esse `bling_id`
3. Nó "Verifica se produto existe" busca por `bling_id=16611353744`
4. **Produto EXISTE no banco** (SKU: `teste269720`)
5. Mas o workflow vai para FALSE (criar) ao invés de TRUE (atualizar)
6. Tenta fazer POST com SKU que já existe
7. **ERRO**: duplicate key constraint "products_bling_sku_key"

### Por Que Isso Acontece?

O nó "Processa Resultado" não está interpretando corretamente a resposta do Supabase.

**Resposta do Supabase quando produto EXISTE:**
```json
[
  {
    "id": "a69c6e81-1f48-4ef8-a890-effd424d22ae",
    "sku": "teste269720",
    "bling_id": 16611353744
  }
]
```

**Resposta do Supabase quando produto NÃO EXISTE:**
```json
[]
```

O código anterior não estava verificando corretamente se o array tinha dados ou estava vazio.

## ✅ Correção Aplicada

### Código Atualizado (com logs)
```javascript
// Pega o primeiro item da verificação
const firstItem = verificacaoItems[0].json;

console.log('=== DEBUG Processa Resultado ===');
console.log('firstItem type:', typeof firstItem);
console.log('firstItem isArray:', Array.isArray(firstItem));
console.log('firstItem:', JSON.stringify(firstItem, null, 2));

// Se for um array vazio, produto não existe
if (Array.isArray(firstItem) && firstItem.length === 0) {
  console.log('CASO 2: Array vazio - produto NÃO existe');
  return [{ json: { exists: false, productData: produtoData } }];
}

// Se for um array com items, produto existe
if (Array.isArray(firstItem) && firstItem.length > 0) {
  console.log('CASO 3: Array com items - produto EXISTE');
  return [{
    json: {
      exists: true,
      productData: produtoData,
      existingProduct: firstItem[0]
    }
  }];
}
```

## 🧪 Como Testar

### Teste 1: Verificar qual produto você está editando

No Bling, quando você abre o produto "teste32972", verifique:
- Qual é o SKU mostrado?
- É `98983h8k` ou `teste269720`?

### Teste 2: Verificar logs do N8N

1. Reimporte o workflow com logs:
   ```
   src/hooks/n8n/workflows/Bling Atualizar_Deletar Produto Automatization (COM_DETECCAO).json
   ```

2. Edite o produto no Bling (altere o preço)

3. No N8N, veja os logs do nó "Processa Resultado":
   - Abra o console do navegador (F12)
   - Procure por `=== DEBUG Processa Resultado ===`
   - Veja qual CASO está sendo executado

### Teste 3: Verificar resposta do nó "Verifica se produto existe"

1. No N8N, clique na execução
2. Clique no nó "Verifica se produto existe"
3. Veja o output JSON
4. **Esperado quando produto EXISTE:**
   ```json
   [
     {
       "id": "uuid",
       "sku": "teste269720",
       "bling_id": 16611353744
     }
   ]
   ```
5. **Esperado quando produto NÃO EXISTE:**
   ```json
   []
   ```

## 🎯 Diagnóstico

### Se o erro persistir, verifique:

#### 1. Qual bling_id o webhook está enviando?
```javascript
// No nó "Webhook", veja:
$('Webhook').item.json.body.data.id
```

#### 2. Esse bling_id existe no banco?
```bash
curl "https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?bling_id=eq.SEU_BLING_ID" \
  -H "apikey: SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY"
```

#### 3. O nó "Verifica se produto existe" está retornando dados?
- Se retornar `[]` → Produto não existe (correto ir para POST)
- Se retornar `[{...}]` → Produto existe (deve ir para PATCH)

#### 4. O nó "Processa Resultado" está interpretando corretamente?
- Veja os logs no console
- Verifique qual CASO está sendo executado
- Confirme que `exists` está correto

## 🔧 Possíveis Causas do Erro

### Causa 1: Produto foi recriado no Bling
- Você deletou e recriou o produto no Bling
- O novo produto tem um `bling_id` diferente
- O banco ainda tem o produto antigo com o SKU antigo
- **Solução**: Delete o produto antigo do banco ou use SKU diferente

### Causa 2: Webhook está enviando bling_id errado
- O webhook pode estar enviando o ID de uma variação
- Ou o ID do produto pai ao invés do produto filho
- **Solução**: Verifique o payload do webhook

### Causa 3: Nó "Processa Resultado" não está funcionando
- A lógica de detecção não está correta
- **Solução**: Veja os logs de debug

### Causa 4: RLS está bloqueando a consulta
- O service_role_key deveria bypassar RLS
- Mas pode haver alguma configuração incorreta
- **Solução**: Verifique as políticas RLS da tabela

## 📝 Próximos Passos

1. ✅ Reimportar workflow com logs de debug
2. ✅ Identificar qual produto você está editando (SKU?)
3. ✅ Verificar logs do console quando editar
4. ✅ Confirmar qual CASO está sendo executado
5. ✅ Verificar se `exists` está correto
6. ✅ Se ainda der erro, compartilhar os logs

## 🆘 Informações Necessárias

Para resolver definitivamente, preciso saber:

1. **Qual SKU você está editando no Bling?**
   - `98983h8k` ou `teste269720`?

2. **Qual bling_id o webhook está enviando?**
   - Veja no nó "Webhook" → `body.data.id`

3. **O que os logs mostram?**
   - Qual CASO está sendo executado?
   - O valor de `exists` é `true` ou `false`?

4. **O nó "Verifica se produto existe" retorna dados?**
   - Array vazio `[]` ou array com dados `[{...}]`?

Com essas informações, posso identificar exatamente onde está o problema e corrigir definitivamente.

---

**Status**: Aguardando informações dos logs de debug
**Próximo passo**: Testar com logs e compartilhar resultados
