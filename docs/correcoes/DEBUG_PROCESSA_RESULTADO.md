# Debug: Nó "Processa Resultado" com Logs

## 🐛 Problema Identificado

O nó "Processa Resultado" não estava detectando corretamente quando um produto existe no banco, fazendo o workflow sempre tentar criar (POST) ao invés de atualizar (PATCH).

## 🔍 Causa Raiz

O Supabase retorna a resposta em formatos diferentes dependendo do resultado:

### Quando produto EXISTE:
```json
{
  "json": [
    {
      "id": "uuid",
      "sku": "teste32972",
      "bling_id": 16611344717
    }
  ]
}
```

### Quando produto NÃO EXISTE:
```json
{
  "json": []
}
```

O código anterior não estava verificando corretamente se o array estava vazio ou tinha dados.

## ✅ Correção Aplicada

### Código Atualizado
Adicionado logs de debug e lógica melhorada para detectar:
1. Array vazio `[]` → Produto NÃO existe
2. Array com dados `[{...}]` → Produto EXISTE
3. Objeto com dados `{...}` → Produto EXISTE (caso raro)

### Logs Adicionados
```javascript
console.log('=== DEBUG Processa Resultado ===');
console.log('verificacaoItems length:', verificacaoItems.length);
console.log('verificacaoItems:', JSON.stringify(verificacaoItems, null, 2));
console.log('firstItem type:', typeof firstItem);
console.log('firstItem isArray:', Array.isArray(firstItem));
console.log('firstItem:', JSON.stringify(firstItem, null, 2));
```

## 🧪 Como Testar com Logs

### Passo 1: Reimportar Workflow
```
src/hooks/n8n/workflows/Bling Atualizar_Deletar Produto Automatization (COM_DETECCAO).json
```

### Passo 2: Criar Produto Novo
1. Crie um produto novo no Bling (ex: SKU `teste_debug_001`)
2. No N8N, veja os logs do nó "Processa Resultado"
3. **Esperado**: 
   ```
   CASO 2: Array vazio - produto NÃO existe
   exists: false
   ```

### Passo 3: Atualizar Produto Existente
1. Altere o preço do produto `teste_debug_001`
2. Salve no Bling
3. No N8N, veja os logs do nó "Processa Resultado"
4. **Esperado**:
   ```
   CASO 3: Array com items - produto EXISTE
   exists: true
   existingProduct: { id: "...", sku: "teste_debug_001", ... }
   ```

## 📊 Casos de Teste

### Caso 1: Produto Novo (Primeira Criação)
```
Webhook → ... → Verifica se produto existe → []
                ↓
        Processa Resultado → exists: false
                ↓
        Tem mudanças? → TRUE
                ↓
        Produto existe? → FALSE
                ↓
        Cria no banco POST ✅
```

### Caso 2: Produto Existente (Atualização)
```
Webhook → ... → Verifica se produto existe → [{id: "...", sku: "..."}]
                ↓
        Processa Resultado → exists: true
                ↓
        Tem mudanças? → TRUE
                ↓
        Produto existe? → TRUE
                ↓
        Atualiza no banco PATCH ✅
```

### Caso 3: Produto Existente (Sem Mudanças)
```
Webhook → ... → Verifica se produto existe → [{id: "...", sku: "..."}]
                ↓
        Processa Resultado → exists: true
                ↓
        Detecta Mudanças → hasChanges: false
                ↓
        Tem mudanças? → FALSE
                ↓
        Log - Sem Mudanças ✅
```

## 🔍 Como Ver os Logs no N8N

### Opção 1: Console do Navegador
1. Abra o N8N no navegador
2. Pressione F12 (DevTools)
3. Vá para a aba "Console"
4. Execute o workflow
5. Veja os logs `=== DEBUG Processa Resultado ===`

### Opção 2: Logs do N8N
1. No N8N, clique na execução
2. Clique no nó "Processa Resultado"
3. Veja o output JSON
4. Verifique o campo `exists`

### Opção 3: Logs do Servidor N8N
```bash
# Se estiver rodando N8N via Docker
docker logs -f n8n

# Se estiver rodando N8N via npm
# Veja o terminal onde o N8N está rodando
```

## 🎯 O Que Verificar

### No Nó "Verifica se produto existe"
**Output esperado quando produto EXISTE:**
```json
[
  {
    "id": "uuid",
    "sku": "teste32972",
    "bling_id": 16611344717,
    "name": "teste32972"
  }
]
```

**Output esperado quando produto NÃO EXISTE:**
```json
[]
```

### No Nó "Processa Resultado"
**Output esperado quando produto EXISTE:**
```json
{
  "exists": true,
  "productData": { ... },
  "existingProduct": {
    "id": "uuid",
    "sku": "teste32972",
    "bling_id": 16611344717
  }
}
```

**Output esperado quando produto NÃO EXISTE:**
```json
{
  "exists": false,
  "productData": { ... }
}
```

### No Nó "Produto existe?"
- Se `exists: true` → Vai para TRUE (Atualiza PATCH)
- Se `exists: false` → Vai para FALSE (Cria POST)

## 🐛 Troubleshooting

### Problema: Sempre vai para FALSE (criar)
**Sintoma**: Erro "duplicate key" mesmo com produto existente

**Verificar**:
1. Logs do nó "Verifica se produto existe"
   - Está retornando array vazio `[]`?
   - Está retornando array com dados `[{...}]`?

2. Logs do nó "Processa Resultado"
   - Qual caso está sendo executado? (CASO 1, 2, 3, 4 ou 5)
   - O valor de `exists` está correto?

3. Verificar no banco:
   ```bash
   curl "https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?bling_id=eq.SEU_BLING_ID"
   ```

**Possíveis causas**:
- Produto não existe no banco (verificar com curl)
- `bling_id` está diferente (produto foi recriado no Bling)
- Consulta está usando campo errado

### Problema: Sempre vai para TRUE (atualizar)
**Sintoma**: Tenta fazer PATCH em produto que não existe

**Verificar**:
1. Produto realmente existe no banco?
2. O `bling_id` está correto?
3. Logs mostram `exists: true`?

## 📝 Próximos Passos

1. ✅ Reimportar workflow com logs
2. ✅ Testar criação de produto novo
3. ✅ Testar atualização de produto existente
4. ✅ Verificar logs no console
5. ✅ Confirmar que `exists` está correto
6. ✅ Remover logs de debug após confirmar funcionamento (opcional)

## 🎉 Resultado Esperado

Após a correção:
- ✅ Produtos novos são criados (POST)
- ✅ Produtos existentes são atualizados (PATCH)
- ✅ Sem erros de "duplicate key"
- ✅ Logs mostram claramente qual caso está sendo executado

---

**Data**: 03/03/2026
**Versão**: 1.2 (com logs de debug)
**Status**: ✅ Pronto para teste
