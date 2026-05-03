# Debug: Por Que "Produto existe?" Retorna FALSE?

## 🐛 Problema

Quando você atualiza um produto existente, o workflow:
- ✅ Detecta mudanças corretamente (nome e preço)
- ❌ Vai para FALSE em "Produto existe?" (deveria ser TRUE)
- ❌ Tenta criar (POST) ao invés de atualizar (PATCH)
- ❌ Erro: duplicate key constraint

## 🔍 Como Debugar

### Passo 1: Reimporte o Workflow com Logs Detalhados
```
src/hooks/n8n/workflows/Bling Atualizar_Deletar Produto Automatization (COM_DETECCAO).json
```

### Passo 2: Abra o Console do Navegador
1. Pressione **F12**
2. Vá para a aba **Console**
3. Limpe o console (ícone 🚫 ou Ctrl+L)

### Passo 3: Edite o Produto no Bling
1. Abra o produto "TESTANDO ESSA DROGA 0"
2. Altere o preço (ex: de 22 para 25)
3. Salve

### Passo 4: Veja os Logs no Console

Procure por:
```
=== DEBUG Processa Resultado ===
```

**Me diga o que aparece:**

#### Log 1: verificacaoItems
```
verificacaoItems length: ???
```
- Se for `0` → Problema: nó anterior não retornou dados
- Se for `1` ou mais → OK

#### Log 2: firstItem
```
firstItem type: ???
firstItem isArray: ???
firstItem length: ???
```
- Se `isArray: true` e `length: 0` → Array vazio (produto não existe)
- Se `isArray: true` e `length: 1+` → Array com dados (produto existe)
- Se `isArray: false` → Formato inesperado

#### Log 3: Qual CASO foi executado?
```
CASO 1: Sem items na verificação
CASO 2: Array vazio - produto NÃO existe
CASO 3: Array com items - produto EXISTE
CASO 4: Objeto com dados - produto EXISTE
CASO 5: Padrão - produto NÃO existe
```

### Passo 5: Verifique o Nó "Verifica se produto existe"

No N8N:
1. Clique na execução
2. Clique no nó "Verifica se produto existe"
3. Veja o **Output**

**Me diga o que aparece:**
- Array vazio `[]`?
- Array com dados `[{id: "...", sku: "...", bling_id: ...}]`?
- Erro?

## 🎯 Possíveis Causas

### Causa 1: Nó "Verifica se produto existe" retorna array vazio
**Sintoma**: Output do nó é `[]`

**Motivo**: Produto não está no banco OU consulta está errada

**Verificar**:
```bash
# Verificar se produto existe no banco
curl "https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?sku=eq.5454131244" \
  -H "apikey: SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY"
```

### Causa 2: Nó "Verifica se produto existe" dá erro
**Sintoma**: Nó mostra erro vermelho

**Motivo**: Timeout, erro de rede, ou RLS bloqueando

**Solução**: Com `alwaysOutputData: true`, deveria passar dados mesmo com erro

### Causa 3: Consulta usa bling_id errado
**Sintoma**: Consulta executa mas não encontra produto

**Verificar**: 
- Qual `bling_id` o webhook está enviando?
- Esse `bling_id` existe no banco?

### Causa 4: Formato de resposta inesperado
**Sintoma**: `firstItem` não é array

**Solução**: Logs vão mostrar o formato real

## 📊 Fluxo Esperado vs Real

### Fluxo ESPERADO (Atualização)
```
Verifica se produto existe → [{id: "...", sku: "5454131244", bling_id: ...}]
                ↓
Processa Resultado → CASO 3: Array com items
                ↓
exists: true ✅
                ↓
Produto existe? → TRUE ✅
                ↓
Atualiza no banco PATCH ✅
```

### Fluxo REAL (Problema)
```
Verifica se produto existe → ??? (precisamos ver logs)
                ↓
Processa Resultado → CASO ??? (precisamos ver logs)
                ↓
exists: false ❌
                ↓
Produto existe? → FALSE ❌
                ↓
Cria no banco POST ❌ → ERRO: duplicate key
```

## 🧪 Teste Adicional

### Verificar Manualmente no Banco

```bash
# 1. Verificar se produto existe
curl "https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?sku=eq.5454131244&select=id,sku,bling_id,name" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg"

# 2. Verificar qual bling_id o produto tem
# (use o resultado do comando acima)

# 3. Verificar se a consulta do workflow funciona
# (substitua BLING_ID pelo valor real)
curl "https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?bling_id=eq.BLING_ID" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQxMzI3MiwiZXhwIjoyMDgxOTg5MjcyfQ.yyp6TzvCGA3yl0SdPveR0y86cxRSeCyUTjQtBoJt5Bg"
```

## 📝 Informações Necessárias

Para resolver definitivamente, preciso que você me envie:

1. **Logs do console** (copie e cole):
   ```
   === DEBUG Processa Resultado ===
   verificacaoItems length: ???
   firstItem type: ???
   firstItem isArray: ???
   CASO ???: ...
   ```

2. **Output do nó "Verifica se produto existe"**:
   - É `[]` ou `[{...}]`?
   - Se for `[{...}]`, qual é o conteúdo?

3. **Resultado do curl** (verificar se produto existe):
   ```bash
   curl "https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling?sku=eq.5454131244&select=id,sku,bling_id"
   ```

Com essas informações, vou identificar exatamente onde está o problema e corrigir definitivamente!

---

**Status**: Aguardando logs de debug
**Próximo passo**: Executar teste e compartilhar logs
