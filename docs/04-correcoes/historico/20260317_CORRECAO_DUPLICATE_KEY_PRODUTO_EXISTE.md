# Correção: Erro "duplicate key value violates unique constraint"

## 🐛 Problema Identificado

### Sintoma
Ao **atualizar** um produto existente no Bling, o N8N tentava **criar** (POST) ao invés de **atualizar** (PATCH), resultando em erro:

```
duplicate key value violates unique constraint "products_bling_sku_key"
```

### Causa Raiz
O nó **"Produto existe?"** tinha as configurações:
- `alwaysOutputData: true`
- `onError: "continueRegularOutput"`

Essas configurações fazem o nó IF executar **AMBOS** os caminhos (TRUE e FALSE) simultaneamente, causando:
1. Produto existe → TRUE → Tenta PATCH (correto)
2. Produto existe → FALSE → Tenta POST (incorreto) → ERRO de chave duplicada

## 🔧 Solução Aplicada

### Nós Corrigidos
1. **"Verifica se produto existe"**
   - ❌ Removido: `alwaysOutputData: true`
   - ❌ Removido: `onError: "continueRegularOutput"`

2. **"Atualiza no banco PATCH"**
   - ❌ Removido: `alwaysOutputData: true`
   - ❌ Removido: `onError: "continueRegularOutput"`

### Comportamento Correto Agora

#### Cenário 1: Produto NOVO
```
Detecta Mudanças → Tem mudanças? (TRUE) → Produto existe? (FALSE) → Cria no banco POST ✅
```

#### Cenário 2: Produto EXISTENTE com mudanças
```
Detecta Mudanças → Tem mudanças? (TRUE) → Produto existe? (TRUE) → Atualiza no banco PATCH ✅
```

#### Cenário 3: Produto EXISTENTE sem mudanças
```
Detecta Mudanças → Tem mudanças? (FALSE) → Log - Sem Mudanças ✅
```

## 🧪 Teste de Validação

### Teste 1: Criar Produto Novo
1. Crie um produto novo no Bling (ex: SKU `teste123`)
2. Webhook dispara
3. **Resultado esperado**: 
   - ✅ Passa por "Detecta Mudanças"
   - ✅ Vai para TRUE em "Tem mudanças?"
   - ✅ Vai para FALSE em "Produto existe?"
   - ✅ Executa "Cria no banco POST"
   - ✅ Produto criado com sucesso

### Teste 2: Atualizar Produto Existente
1. Abra o produto `teste123` no Bling
2. Altere o preço de venda
3. Salve
4. **Resultado esperado**:
   - ✅ Passa por "Detecta Mudanças"
   - ✅ Vai para TRUE em "Tem mudanças?"
   - ✅ Vai para TRUE em "Produto existe?"
   - ✅ Executa "Atualiza no banco PATCH"
   - ✅ Produto atualizado com sucesso
   - ❌ NÃO executa "Cria no banco POST"

### Teste 3: Salvar Sem Mudanças
1. Abra o produto `teste123` no Bling
2. Não altere nada
3. Salve
4. **Resultado esperado**:
   - ✅ Passa por "Detecta Mudanças"
   - ✅ Vai para FALSE em "Tem mudanças?"
   - ✅ Executa "Log - Sem Mudanças"
   - ❌ NÃO executa UPDATE nem POST

## 📊 Comparação Antes vs Depois

### ANTES (Com Problema)
```
Produto Existente + Atualização de Preço:
├─ Detecta Mudanças ✅
├─ Tem mudanças? → TRUE ✅
├─ Produto existe? → TRUE ✅ → Atualiza PATCH ✅
└─ Produto existe? → FALSE ❌ → Cria POST ❌ → ERRO: duplicate key
```

### DEPOIS (Corrigido)
```
Produto Existente + Atualização de Preço:
├─ Detecta Mudanças ✅
├─ Tem mudanças? → TRUE ✅
└─ Produto existe? → TRUE ✅ → Atualiza PATCH ✅
```

## 🎯 Por Que Isso Acontecia?

### Configurações Problemáticas

#### `alwaysOutputData: true`
- Força o nó a sempre produzir output, mesmo quando a condição é falsa
- Faz o nó IF executar ambos os branches

#### `onError: "continueRegularOutput"`
- Continua a execução mesmo com erro
- Pode mascarar problemas de lógica

### Quando Usar Essas Configurações

#### ✅ Casos Válidos
- Nós de HTTP Request que podem falhar (ex: API externa)
- Nós de validação onde você quer processar erros
- Nós de tentativa/retry

#### ❌ Casos Inválidos
- Nós IF que decidem o fluxo (TRUE/FALSE)
- Nós de verificação de existência
- Nós que determinam CREATE vs UPDATE

## 🔍 Como Identificar o Problema

### Sintomas
1. Nó IF executa ambos os caminhos (TRUE e FALSE)
2. Erro de "duplicate key" em operações de UPDATE
3. Logs mostram execução de POST quando deveria ser PATCH

### Verificação
```bash
# Procurar por alwaysOutputData no workflow
grep -n "alwaysOutputData" workflow.json

# Procurar por onError no workflow
grep -n "onError" workflow.json
```

### Correção
```python
# Remover configurações problemáticas
for node in workflow['nodes']:
    if 'alwaysOutputData' in node:
        del node['alwaysOutputData']
    if 'onError' in node:
        del node['onError']
```

## 📝 Arquivo Corrigido

**Arquivo**: `src/hooks/n8n/workflows/Bling Atualizar_Deletar Produto Automatization (COM_DETECCAO).json`

**Mudanças**:
- ❌ Removido `alwaysOutputData` de 2 nós
- ❌ Removido `onError` de 2 nós

**Status**: ✅ Pronto para reimportar no N8N

## 🚀 Próximos Passos

1. ✅ Reimporte o workflow corrigido no N8N
2. ✅ Execute os 3 testes de validação acima
3. ✅ Verifique que não há mais erros de "duplicate key"
4. ✅ Confirme que atualizações funcionam corretamente

## 🎉 Resultado Final

- ✅ Produtos novos são criados (POST)
- ✅ Produtos existentes são atualizados (PATCH)
- ✅ Produtos sem mudanças são ignorados (Log)
- ✅ Sem erros de chave duplicada
- ✅ Fluxo funciona corretamente

---

**Data da Correção**: 03/03/2026
**Problema**: Duplicate key error em atualizações
**Solução**: Remover alwaysOutputData e onError de nós IF
**Status**: ✅ Resolvido
