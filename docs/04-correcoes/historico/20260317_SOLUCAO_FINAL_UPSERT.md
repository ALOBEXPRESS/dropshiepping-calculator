# Solução Final: UPSERT Pattern (Postgres Best Practice)

## 🎯 Problema Atual

O workflow está tentando decidir se deve fazer POST (criar) ou PATCH (atualizar), mas essa lógica está falhando porque:
1. Nó "Verifica se produto existe" pode falhar
2. Fallback com `$http` pode não estar disponível
3. Lógica complexa com múltiplos pontos de falha

## ✅ Solução: UPSERT (ON CONFLICT)

Segundo as **Postgres Best Practices**, a solução correta é usar **UPSERT** (INSERT ... ON CONFLICT ... DO UPDATE).

### Vantagens do UPSERT:
1. **Idempotente**: Pode executar múltiplas vezes com o mesmo resultado
2. **Atômico**: Operação única, sem race conditions
3. **Simples**: Não precisa verificar se existe antes
4. **Performático**: Uma query ao invés de duas (SELECT + INSERT/UPDATE)

### Como Funciona:
```sql
INSERT INTO products_bling (bling_id, sku, name, ...)
VALUES (123, 'ABC', 'Produto', ...)
ON CONFLICT (bling_id) 
DO UPDATE SET
  name = EXCLUDED.name,
  sku = EXCLUDED.sku,
  updated_at = NOW();
```

## 🔧 Implementação no N8N

### Opção 1: Usar Supabase UPSERT (Recomendado)

O Supabase já suporta UPSERT nativamente via header `Prefer: resolution=merge-duplicates`:

```javascript
// Nó HTTP Request
POST https://oensqhjnxwpcuanozske.supabase.co/rest/v1/products_bling

Headers:
- Prefer: resolution=merge-duplicates
- apikey: ...
- Authorization: Bearer ...

Body: {
  bling_id: 123,
  sku: "ABC",
  name: "Produto",
  ...
}
```

### Opção 2: SQL Direto

```sql
INSERT INTO products_bling (
  organization_id, bling_id, sku, name, ...
) VALUES (
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  {{ $json.data.id }},
  {{ $json.data.codigo }},
  {{ $json.data.nome }},
  ...
)
ON CONFLICT (bling_id) 
DO UPDATE SET
  name = EXCLUDED.name,
  sku = EXCLUDED.sku,
  sale_price = EXCLUDED.sale_price,
  updated_at = NOW();
```

## 📊 Fluxo Simplificado

### ANTES (Complexo e Frágil):
```
Webhook → Pega dados → Verifica se existe → Processa Resultado → Tem mudanças?
                                                                      ↓
                                                              Produto existe?
                                                              ↓           ↓
                                                          PATCH       POST
```

### DEPOIS (Simples e Robusto):
```
Webhook → Pega dados → Detecta Mudanças → Tem mudanças?
                                              ↓
                                          UPSERT
                                          (cria ou atualiza automaticamente)
```

## 🎯 Mudanças Necessárias

### 1. Remover Nós Desnecessários:
- ❌ "Verifica se produto existe"
- ❌ "Processa Resultado"
- ❌ "Produto existe?" (IF)

### 2. Manter Nós Essenciais:
- ✅ "Detecta Mudanças"
- ✅ "Tem mudanças?" (IF)

### 3. Modificar Nó de Persistência:
- Mudar de POST/PATCH para UPSERT
- Adicionar header `Prefer: resolution=merge-duplicates`

## 🔍 Por Que Isso Resolve?

1. **Não precisa verificar se existe**: UPSERT faz isso automaticamente
2. **Idempotente**: Pode executar múltiplas vezes sem erro
3. **Sem race conditions**: Operação atômica no banco
4. **Menos pontos de falha**: Menos nós = menos coisas para dar errado

## 📝 Implementação Passo a Passo

### Passo 1: Modificar Nó "Cria no banco POST"

Renomear para: "Upsert no banco"

Adicionar header:
```
Prefer: resolution=merge-duplicates
```

### Passo 2: Remover Nó "Atualiza no banco PATCH"

Não é mais necessário, UPSERT faz tudo.

### Passo 3: Reconectar Fluxo

```
Detecta Mudanças → Tem mudanças? → TRUE → Upsert no banco
                                 → FALSE → Log - Sem Mudanças
```

### Passo 4: Remover Nós de Verificação

- Deletar "Verifica se produto existe"
- Deletar "Processa Resultado"
- Deletar "Produto existe?"

## 🎉 Resultado Final

- ✅ Workflow mais simples (menos nós)
- ✅ Mais robusto (menos pontos de falha)
- ✅ Mais rápido (menos queries)
- ✅ Idempotente (pode executar múltiplas vezes)
- ✅ Sem erros de duplicate key
- ✅ Cria E atualiza automaticamente

## 🚀 Próximos Passos

1. Implementar UPSERT no workflow
2. Testar criação de produto novo
3. Testar atualização de produto existente
4. Remover nós desnecessários
5. Simplificar fluxo

---

**Padrão**: UPSERT (Postgres Best Practice)
**Complexidade**: Baixa
**Confiabilidade**: Alta
**Status**: Recomendado para implementação
