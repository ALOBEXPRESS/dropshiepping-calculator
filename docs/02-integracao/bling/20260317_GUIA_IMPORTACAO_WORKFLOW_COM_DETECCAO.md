# Guia de Importação: Workflow com Detecção de Mudanças

## 📦 Arquivo Gerado
`src/hooks/n8n/workflows/Bling Atualizar_Deletar Produto Automatization (COM_DETECCAO).json`

## 🎯 O que foi adicionado?

### Novos Nós

1. **Detecta Mudanças** (Code)
   - Compara dados do banco com dados do Bling
   - Verifica 22 campos críticos + arrays de imagens
   - Retorna `hasChanges: true/false`

2. **Tem mudanças?** (IF)
   - Verifica se `$json.hasChanges === true`
   - TRUE: Continua para atualização/criação
   - FALSE: Vai para log e ignora webhook

3. **Log - Sem Mudanças** (Code)
   - Registra webhooks ignorados
   - Útil para monitoramento e debug

### Novo Fluxo

```
Webhook → ... → Pega mais dados do ID Produto → Wait3 → Verifica se produto existe
                                                            ↓
                                                    Processa Resultado
                                                            ↓
                                                    Detecta Mudanças ← NOVO
                                                            ↓
                                                    Tem mudanças? ← NOVO
                                                    ↓           ↓
                                                  TRUE        FALSE
                                                    ↓           ↓
                                            Produto existe?   Log - Sem Mudanças ← NOVO
                                            ↓           ↓           ↓
                                        Atualiza    Cria      Replace Me
                                          ↓           ↓           ↓
                                        Replace Me  Replace Me  Loop Over Items
```

## 📥 Como Importar no N8N

### Opção 1: Importar Novo Workflow

1. Abra o N8N
2. Clique em **"+"** (Novo Workflow)
3. Clique nos **3 pontinhos** (⋮) no canto superior direito
4. Selecione **"Import from File"**
5. Escolha o arquivo:
   ```
   src/hooks/n8n/workflows/Bling Atualizar_Deletar Produto Automatization (COM_DETECCAO).json
   ```
6. Clique em **"Import"**
7. Salve o workflow

### Opção 2: Substituir Workflow Existente

1. Abra o workflow atual no N8N
2. Clique nos **3 pontinhos** (⋮)
3. Selecione **"Import from File"**
4. Escolha o arquivo COM_DETECCAO.json
5. Confirme a substituição
6. Salve o workflow

## 🧪 Como Testar

### Teste 1: Webhook SEM Mudanças

1. Abra um produto no Bling
2. Não faça nenhuma alteração
3. Clique em "Salvar"
4. No N8N, verifique a execução:
   - ✅ Deve passar por "Detecta Mudanças"
   - ✅ Deve ir para FALSE em "Tem mudanças?"
   - ✅ Deve executar "Log - Sem Mudanças"
   - ✅ NÃO deve executar UPDATE no banco

### Teste 2: Webhook COM Mudanças (Preço)

1. Abra um produto no Bling
2. Altere o preço de venda
3. Clique em "Salvar"
4. No N8N, verifique a execução:
   - ✅ Deve passar por "Detecta Mudanças"
   - ✅ Deve ir para TRUE em "Tem mudanças?"
   - ✅ Deve executar "Produto existe?"
   - ✅ Deve executar UPDATE no banco
   - ✅ Deve mostrar mudança detectada: `sale_price`

### Teste 3: Webhook COM Mudanças (Imagens)

1. Abra um produto no Bling
2. Adicione ou remova uma imagem
3. Clique em "Salvar"
4. No N8N, verifique a execução:
   - ✅ Deve detectar mudança em `images`
   - ✅ Deve executar UPDATE no banco

### Teste 4: Produto Novo

1. Crie um produto novo no Bling
2. No N8N, verifique a execução:
   - ✅ Deve passar por "Detecta Mudanças"
   - ✅ Deve ir para TRUE (produto não existe)
   - ✅ Deve executar "Produto existe?" → FALSE
   - ✅ Deve executar POST (criar no banco)

### Teste 5: Produto com Variações

1. Abra um produto com variações no Bling
2. Altere o nome de uma variação
3. Clique em "Salvar"
4. No N8N, verifique a execução:
   - ✅ Deve detectar mudança em `variacao_nome`
   - ✅ Deve executar UPDATE no banco

## 📊 Monitoramento

### Verificar Logs de Webhooks Ignorados

No N8N, veja as execuções do nó "Log - Sem Mudanças":

```json
{
  "message": "Webhook ignorado - sem mudanças detectadas",
  "productId": "14970370224",
  "productName": "Nome do Produto",
  "reason": "Nenhuma mudança detectada",
  "timestamp": "2026-03-03T15:30:00.000Z"
}
```

### Verificar Mudanças Detectadas

No nó "Detecta Mudanças", quando `hasChanges: true`:

```json
{
  "hasChanges": true,
  "reason": "3 mudança(s) detectada(s)",
  "changes": [
    {
      "field": "sale_price",
      "oldValue": "100.00",
      "newValue": "120.00"
    },
    {
      "field": "stock_quantity",
      "oldValue": 10,
      "newValue": 15
    },
    {
      "field": "images",
      "oldValue": "2 imagens",
      "newValue": "3 imagens"
    }
  ],
  "productId": "14970370224",
  "productName": "Nome do Produto"
}
```

### Métricas Esperadas (após 24h)

- **Webhooks Recebidos**: 100%
- **Webhooks Ignorados**: 70-80% (esperado)
- **Webhooks Processados**: 20-30% (esperado)
- **Taxa de Redução**: 70-80%

## 🔍 Debug

### Se o nó "Tem mudanças?" sempre vai para TRUE

1. Verifique o nó "Detecta Mudanças"
2. Veja o output: `$json.hasChanges`
3. Verifique se o código está correto
4. Teste manualmente com um produto conhecido

### Se o nó "Tem mudanças?" sempre vai para FALSE

1. Verifique se os dados do banco estão corretos
2. Verifique se o nó "Verifica se produto existe" retorna dados
3. Teste com um produto que você SABE que mudou

### Se aparecer erro "Cannot read property 'data' of undefined"

1. Verifique se o nó "Pega mais dados do ID Produto" executou
2. Verifique se o nó "Verifica se produto existe" executou
3. Verifique a ordem de execução dos nós

## 🎉 Benefícios Esperados

1. **Redução de 70-80% nos UPDATEs** desnecessários
2. **Menos carga no banco de dados**
3. **Logs mais limpos** (apenas mudanças reais)
4. **Melhor performance** do N8N
5. **Visibilidade** de quais campos estão mudando

## 🚨 Importante

- O workflow mantém TODAS as funcionalidades anteriores
- Suporte para variações está preservado
- Suporte para múltiplas imagens está preservado
- Apenas adiciona validação antes do UPDATE
- O fluxo de DELETE permanece inalterado

## 📝 Próximos Passos

1. ✅ Importar o workflow no N8N
2. ✅ Executar os 5 testes acima
3. ✅ Monitorar por 24-48h
4. ✅ Verificar taxa de redução
5. ✅ Ajustar campos monitorados se necessário

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do nó "Detecta Mudanças"
2. Verifique os logs do nó "Log - Sem Mudanças"
3. Compare com o workflow antigo (CORRIGIDO.json)
4. Consulte: `docs/SOLUCAO_DETECCAO_MUDANCAS_PRODUTO.md`
