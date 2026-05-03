# Correção do Workflow "Bling Atualizar/Deletar Produto Automatization"

## Problema Identificado

O workflow estava **atualizando produtos existentes** ao invés de **criar novos produtos** quando um produto novo era adicionado no Bling.

### Causa Raiz

O fluxo original executava o PATCH (atualização) PRIMEIRO, e só criava o produto (POST) se o PATCH retornasse 0 resultados. Isso causava problemas porque:

1. O PATCH era executado sem verificar se o produto existia
2. Se o PATCH falhasse ou retornasse algo, o produto não era criado
3. Não havia verificação prévia da existência do produto no banco

## Solução Implementada

### Fluxo Antigo (INCORRETO)
```
Pega mais dados → Wait2 → Atualiza PATCH → If3 (verifica resultado) → Cria POST (se 0 resultados)
```

### Fluxo Novo (CORRETO)
```
Pega mais dados → Wait2 → Verifica se existe → If (produto existe?)
                                                  ├─ SIM → Atualiza PATCH
                                                  └─ NÃO → Cria POST
```

### Mudanças Realizadas

1. **Adicionado nó "Verifica se produto existe"**
   - Faz um GET no Supabase para verificar se o `bling_id` já existe
   - Retorna array vazio se não existir, ou array com dados se existir

2. **Adicionado nó "Produto existe?"** (If)
   - Verifica se `$json.length === 0`
   - Se SIM (length = 0): produto NÃO existe → vai para POST (criar)
   - Se NÃO (length > 0): produto existe → vai para PATCH (atualizar)

3. **Removido nó "If3"**
   - Não é mais necessário verificar o resultado do PATCH
   - A decisão agora é feita ANTES da operação

4. **Removido nó "Wait"**
   - Não é mais necessário aguardar entre PATCH e POST

5. **Atualizado organization_id**
   - Alterado de `e3274f4d-2627-4121-895d-b0e3a70b0ace` para `28b4b443-03fd-4a2d-b596-9dcaf142b389`
   - Garante que os produtos sejam criados na organização correta

## Como Usar o Workflow Corrigido

1. Importe o arquivo `Bling Atualizar_Deletar Produto Automatization CORRIGIDO.json` no n8n
2. Substitua o workflow antigo pelo novo
3. Teste adicionando um produto novo no Bling
4. Verifique se o produto foi CRIADO (POST) e não ATUALIZADO (PATCH)

## Benefícios da Correção

✅ Produtos novos são criados corretamente
✅ Produtos existentes são atualizados corretamente
✅ Não há mais tentativas de PATCH em produtos inexistentes
✅ Fluxo mais claro e fácil de entender
✅ Menos requisições desnecessárias ao banco

## Teste Recomendado

1. Adicione um produto NOVO no Bling com SKU único
2. Aguarde o webhook disparar
3. Verifique no Supabase se o produto foi CRIADO (INSERT)
4. Atualize o mesmo produto no Bling
5. Aguarde o webhook disparar novamente
6. Verifique no Supabase se o produto foi ATUALIZADO (UPDATE)

---

**Data da Correção**: 2026-03-02
**Arquivo Corrigido**: `src/hooks/n8n/workflows/Bling Atualizar_Deletar Produto Automatization CORRIGIDO.json`
