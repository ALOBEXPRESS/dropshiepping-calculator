# Solução: Detecção de Mudanças Reais em Produtos

## Problema
O webhook do Bling está sendo disparado mesmo quando não há mudanças reais no produto, causando atualizações desnecessárias no banco de dados.

## Causa Raiz
O Bling dispara webhooks para qualquer interação com o produto, incluindo:
- Visualizações
- Edições que não alteram dados
- Mudanças em campos não relevantes
- Atualizações automáticas do sistema

## Solução Implementada

### 1. Código de Detecção de Mudanças
Criado arquivo: `src/hooks/n8n/code-snippets/detectar-mudancas-produto.js`

Este código:
- Compara dados atuais do banco com dados vindos do Bling
- Verifica 22 campos críticos do produto
- Compara arrays de imagens (até 10 imagens)
- Trata valores nulos/vazios como equivalentes
- Retorna apenas se houver mudanças reais

### 2. Campos Monitorados

#### Campos Básicos
- `name` (nome)
- `sku` (código)
- `stock_quantity` (estoque)
- `cost_price` (preço de custo)
- `sale_price` (preço de venda)
- `situacao` (status)

#### Dimensões e Peso
- `peso` (peso bruto)
- `largura`, `altura`, `profundidade`

#### Informações Adicionais
- `descricao` (descrição curta)
- `ean` (código de barras)
- `ncm` (classificação fiscal)
- `localizacao` (localização no estoque)
- `itens_por_caixa`

#### Relacionamentos
- `id_categoria`
- `id_fornecedor`
- `grupo_produto_id`
- `id_produto_pai` (para variações)
- `sku_fornecedor`

#### Mídia
- `video_url`
- `image_url1` até `image_url10` (comparação de array)

#### Variações
- `variacao_nome`

### 3. Como Integrar no Workflow N8N

#### Passo 1: Adicionar Nó de Código
Após o nó "Processa Resultado" e antes do nó "Produto existe?":

1. Adicione um novo nó **Code**
2. Nome: "Detecta Mudanças"
3. Cole o código de `detectar-mudancas-produto.js`

#### Passo 2: Adicionar Nó IF
Após "Detecta Mudanças":

1. Adicione um nó **IF**
2. Nome: "Tem mudanças?"
3. Condição: `{{ $json.hasChanges }}` equals `true`

#### Passo 3: Reconectar Fluxo

**Fluxo Antigo:**
```
Processa Resultado → Produto existe? → Atualiza/Cria
```

**Fluxo Novo:**
```
Processa Resultado → Detecta Mudanças → Tem mudanças?
                                            ├─ TRUE → Produto existe? → Atualiza/Cria
                                            └─ FALSE → [Fim - Sem ação]
```

#### Passo 4: Adicionar Logging (Opcional)
Para o branch FALSE do "Tem mudanças?", adicione um nó de log:

```javascript
// Nó: Log - Sem Mudanças
return [{
  json: {
    message: 'Webhook ignorado - sem mudanças',
    productId: $json.productId,
    productName: $json.productName,
    reason: $json.reason,
    timestamp: new Date().toISOString()
  }
}];
```

### 4. Estrutura do JSON de Retorno

#### Quando NÃO há mudanças:
```json
{
  "hasChanges": false,
  "reason": "Nenhuma mudança detectada",
  "productData": { ... },
  "productId": "14970370224",
  "productName": "Nome do Produto"
}
```

#### Quando HÁ mudanças:
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
  "productData": { ... },
  "productId": "14970370224",
  "productName": "Nome do Produto"
}
```

## Benefícios

1. **Reduz Carga no Banco**: Evita UPDATEs desnecessários
2. **Melhora Performance**: Menos processamento no N8N
3. **Logs Mais Limpos**: Apenas mudanças reais são registradas
4. **Preserva Variações**: Mantém suporte para produtos com variações
5. **Detecta Mudanças Reais**: Identifica quando dados realmente mudam

## Casos de Uso Suportados

### ✅ Produto com Variações
- Detecta mudanças em `variacao_nome`
- Detecta mudanças em `id_produto_pai`
- Atualiza apenas quando variação muda

### ✅ Adição/Remoção de Imagens
- Compara quantidade de imagens
- Compara URLs de cada imagem
- Detecta mudanças na ordem

### ✅ Atualização de Preços
- Detecta mudança em `cost_price`
- Detecta mudança em `sale_price`
- Compara valores numéricos corretamente

### ✅ Mudança de Estoque
- Detecta mudança em `stock_quantity`
- Detecta mudança em `localizacao`

### ✅ Mudança de Status
- Detecta mudança em `situacao`
- Suporta exclusão (situacao = 'E')

## Monitoramento

Para monitorar a eficácia da solução:

1. **Webhooks Recebidos**: Total de webhooks do Bling
2. **Webhooks Ignorados**: Webhooks sem mudanças detectadas
3. **Webhooks Processados**: Webhooks com mudanças reais
4. **Taxa de Redução**: (Ignorados / Recebidos) × 100%

Exemplo esperado:
- Webhooks Recebidos: 100
- Webhooks Ignorados: 70-80
- Webhooks Processados: 20-30
- Taxa de Redução: 70-80%

## Próximos Passos

1. Implementar o código no workflow N8N
2. Testar com produtos reais
3. Monitorar logs por 24-48h
4. Ajustar campos monitorados se necessário
5. Adicionar métricas de performance

## Notas Importantes

- O código mantém TODAS as configurações atuais do webhook
- Não remove suporte para variações
- Não remove suporte para múltiplas imagens
- Apenas adiciona uma camada de validação antes do UPDATE
- O fluxo de DELETE permanece inalterado (situacao = 'E')
