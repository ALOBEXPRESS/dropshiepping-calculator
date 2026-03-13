# Guia Rápido: Reimportar Workflow Corrigido

## 🎯 Problema Resolvido
Erro "duplicate key value violates unique constraint" ao atualizar produtos existentes.

## 📦 Arquivo Corrigido
`src/hooks/n8n/workflows/Bling Atualizar_Deletar Produto Automatization (COM_DETECCAO).json`

## 🚀 Como Reimportar (2 minutos)

### Opção 1: Substituir Workflow Existente (Recomendado)

1. Abra o N8N
2. Abra o workflow atual "Bling Atualizar/Deletar Produto Automatization"
3. Clique nos **3 pontinhos** (⋮) no canto superior direito
4. Selecione **"Import from File"**
5. Escolha o arquivo:
   ```
   src/hooks/n8n/workflows/Bling Atualizar_Deletar Produto Automatization (COM_DETECCAO).json
   ```
6. Confirme a substituição
7. **Salve** o workflow (Ctrl+S)
8. **Ative** o workflow se estiver desativado

### Opção 2: Criar Novo Workflow

1. Abra o N8N
2. Clique em **"+"** (Novo Workflow)
3. Clique nos **3 pontinhos** (⋮)
4. Selecione **"Import from File"**
5. Escolha o arquivo COM_DETECCAO.json
6. Salve com nome: "Bling Atualizar/Deletar Produto Automatization v2"
7. Desative o workflow antigo
8. Ative o novo workflow

## ✅ Teste Rápido (1 minuto)

### Teste 1: Atualizar Produto Existente
1. Abra o produto `teste32972` no Bling
2. Altere o preço de venda (ex: de 100 para 120)
3. Clique em "Salvar"
4. No N8N, verifique a execução:
   - ✅ Deve passar por "Detecta Mudanças"
   - ✅ Deve ir para TRUE em "Tem mudanças?"
   - ✅ Deve ir para TRUE em "Produto existe?"
   - ✅ Deve executar "Atualiza no banco PATCH"
   - ✅ **NÃO** deve executar "Cria no banco POST"
   - ✅ **NÃO** deve dar erro de duplicate key

### Resultado Esperado
```
✅ Produto atualizado com sucesso
✅ Sem erros
✅ Apenas 1 operação (PATCH)
```

## 🔍 Verificação de Sucesso

### No N8N
- ✅ Execução completa sem erros
- ✅ Apenas o nó "Atualiza no banco PATCH" executou
- ✅ O nó "Cria no banco POST" NÃO executou

### No Supabase
```sql
-- Verificar se o produto foi atualizado
SELECT sku, name, sale_price, updated_at 
FROM products_bling 
WHERE sku = 'teste32972'
ORDER BY updated_at DESC 
LIMIT 1;
```

**Resultado esperado**: Preço atualizado e `updated_at` recente

## 🐛 Se Ainda Der Erro

### Erro: "duplicate key"
**Causa**: Workflow antigo ainda está ativo
**Solução**: 
1. Desative o workflow antigo
2. Ative apenas o novo workflow
3. Teste novamente

### Erro: "Produto existe?" vai para FALSE
**Causa**: Produto não está no banco
**Solução**:
1. Verifique se o produto existe no banco
2. Se não existir, crie primeiro (adicione produto novo no Bling)
3. Depois teste a atualização

### Erro: "Tem mudanças?" vai para FALSE
**Causa**: Nenhuma mudança foi detectada
**Solução**:
1. Altere um campo significativo (preço, nome, estoque)
2. Salve no Bling
3. Teste novamente

## 📊 Comparação: Antes vs Depois

### ANTES (Com Erro)
```
Atualizar produto teste32972:
├─ Produto existe? → TRUE → Atualiza PATCH ✅
└─ Produto existe? → FALSE → Cria POST ❌ → ERRO: duplicate key
```

### DEPOIS (Corrigido)
```
Atualizar produto teste32972:
├─ Detecta Mudanças ✅
├─ Tem mudanças? → TRUE ✅
└─ Produto existe? → TRUE → Atualiza PATCH ✅
```

## 🎉 Benefícios da Correção

1. ✅ Atualizações funcionam corretamente
2. ✅ Sem erros de chave duplicada
3. ✅ Apenas 1 operação por webhook (PATCH ou POST, nunca ambos)
4. ✅ Detecção de mudanças funcionando
5. ✅ Logs limpos e úteis

## 📝 Próximos Passos

1. ✅ Reimportar workflow corrigido
2. ✅ Executar teste de atualização
3. ✅ Verificar que não há erros
4. ✅ Monitorar por 24h
5. ✅ Confirmar que tudo funciona

## 🆘 Suporte

Se encontrar problemas:
1. Verifique `docs/CORRECAO_DUPLICATE_KEY_PRODUTO_EXISTE.md`
2. Verifique logs do N8N
3. Confirme que apenas 1 workflow está ativo
4. Teste com produto novo primeiro, depois com atualização

---

**Tempo Total**: ~3 minutos (2 min importação + 1 min teste)
**Dificuldade**: Fácil
**Status**: ✅ Pronto para usar
