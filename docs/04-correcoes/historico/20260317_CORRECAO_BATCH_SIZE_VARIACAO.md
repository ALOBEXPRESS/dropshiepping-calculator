# Correção: Batch Size para Processar Variações Sequencialmente

## Data
2026-03-05

## Problema

Erro ao cadastrar produtos com variações:
```
Key (id_produto_pai)=(16610437077) is not present in table "products_bling"
violates foreign key constraint "products_bling_parent_fkey"
```

### Causa Raiz

O nó `Loop Over Items` (splitInBatches) estava processando múltiplos itens em paralelo (batch padrão). Mesmo com o código de ordenação (pai → variações), o processamento paralelo fazia com que:

1. Produto pai começava a ser inserido
2. Variação começava a ser inserida ANTES do pai terminar
3. FK constraint falhava porque o pai ainda não existia

## Solução

Adicionar `batchSize: 1` no nó `Loop Over Items` para processar **um item por vez, sequencialmente**.

### Mudança Aplicada

**ANTES:**
```json
{
  "parameters": {
    "options": {}
  },
  "type": "n8n-nodes-base.splitInBatches",
  "name": "Loop Over Items"
}
```

**DEPOIS:**
```json
{
  "parameters": {
    "batchSize": 1,
    "options": {}
  },
  "type": "n8n-nodes-base.splitInBatches",
  "name": "Loop Over Items"
}
```

## Como Funciona Agora

1. **Parsear Requisição**: Ordena produtos (pai primeiro, variações depois)
2. **Split Out**: Separa em itens individuais
3. **Loop Over Items**: Processa **1 item por vez** (batchSize: 1)
4. **HTTP Obter Produtos1**: Busca detalhes do produto
5. **Upsert Produto**: Insere/atualiza no banco
6. **Wait**: Aguarda 1 segundo antes do próximo item
7. **Loop volta**: Processa próximo item

### Fluxo Sequencial Garantido

```
Produto Pai 1 → UPSERT → Wait → ✅
Produto Pai 2 → UPSERT → Wait → ✅
Variação 1 (pai já existe) → UPSERT → Wait → ✅
Variação 2 (pai já existe) → UPSERT → Wait → ✅
```

## Por Que Funciona?

- **batchSize: 1**: Garante processamento sequencial
- **Ordenação pai → variações**: Garante que pais sejam processados primeiro
- **Wait entre itens**: Dá tempo para o banco confirmar a inserção
- **UPSERT**: Evita erro de duplicate key

## Resultado Esperado

✅ Produtos pai: Inseridos sequencialmente  
✅ Variações: Inseridas APÓS o pai existir  
✅ Sem erro de FK constraint  
✅ Sem processamento paralelo  
✅ Cadastro em lote funcional (mais lento, mas confiável)

## Trade-off

- **Vantagem**: 100% confiável, sem erro de FK
- **Desvantagem**: Mais lento (1 produto por vez + wait de 1s)
- **Alternativa futura**: Implementar lógica de retry ou verificação de existência do pai

## Arquivos Modificados

- `src/hooks/n8n/workflows/Bling Cadastrar Produto.json`

## Próximos Passos

1. Importar workflow atualizado no N8N
2. Testar cadastro em lote com produtos pai + variações
3. Verificar que variações são inseridas após o pai
4. Confirmar que não há mais erro de FK constraint

---

**Status**: ✅ Implementado  
**Testado**: Pendente (aguardando teste do usuário)  
**Prioridade**: Alta  
**Impacto**: Resolve erro de FK constraint em variações
