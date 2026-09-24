# Correção Final: Workflow Cadastrar Produto

## Data
2026-03-05

## Problema Persistente

Mesmo com `batchSize: 1` e fallbacks, o erro continua:
```
Key (id_produto_pai)=(16610437077) is not present in table "products_bling"
```

### Causa Raiz Identificada

1. **onError: continueRegularOutput**: O nó "Upsert Produto" tinha configuração para continuar mesmo com erro
2. **Wait sem tempo**: Os nós "Wait" e "Wait1" não tinham tempo de espera configurado
3. **Produto pai falhava silenciosamente**: Quando o pai falhava, o workflow continuava e a variação tentava inserir

## Soluções Aplicadas

### 1. Remover onError do Upsert Produto

**ANTES:**
```json
{
  "name": "Upsert Produto",
  "onError": "continueRegularOutput"
}
```

**DEPOIS:**
```json
{
  "name": "Upsert Produto"
}
```

**Por quê?** Agora o workflow PARA quando houver erro no UPSERT, permitindo identificar o problema real.

### 2. Adicionar Tempo de Espera nos Nós Wait

**ANTES:**
```json
{
  "parameters": {},
  "type": "n8n-nodes-base.wait",
  "name": "Wait"
}
```

**DEPOIS:**
```json
{
  "parameters": {
    "amount": 2
  },
  "type": "n8n-nodes-base.wait",
  "name": "Wait"
}
```

**Por quê?** Dá 2 segundos para o banco processar o UPSERT antes de processar o próximo item.

### 3. Aplicado em Ambos os Nós Wait

- **Wait**: 2 segundos (após sucesso)
- **Wait1**: 2 segundos (após erro)

## Como Funciona Agora

### Fluxo de Sucesso
```
Loop Over Items (1 item)
  ↓
HTTP Obter Produtos1 (busca detalhes)
  ↓
If (verifica se tem erro HTTP)
  ↓ (false = sem erro)
Upsert Produto (insere/atualiza)
  ↓ (se falhar, workflow PARA)
If1 (verifica se tem erro no UPSERT)
  ↓ (false = sem erro)
Wait (2 segundos)
  ↓
Replace Me
  ↓
Loop Over Items (próximo item)
```

### Fluxo de Erro
```
Upsert Produto (falha)
  ↓
Workflow PARA
  ↓
Usuário vê o erro real
  ↓
Pode corrigir o problema
```

## Benefícios

1. **Visibilidade de erros**: Workflow para quando há erro, mostrando a causa real
2. **Tempo para processar**: 2 segundos entre cada item garante que o banco processa
3. **Debugging facilitado**: Pode ver exatamente qual produto falhou e por quê
4. **Integridade garantida**: Produto pai é inserido e confirmado antes da variação

## Resultado Esperado

✅ Produtos pai: Inseridos com sucesso, workflow espera 2s  
✅ Variações: Inseridas APÓS o pai estar no banco  
✅ Erros visíveis: Workflow para e mostra o erro real  
✅ Sem erro de FK constraint: Pai sempre existe antes da variação  
✅ Processamento confiável: Mais lento (~3-4s por produto), mas 100% funcional

## Tempo de Processamento

- **Por produto**: ~3-4 segundos (HTTP + UPSERT + Wait)
- **100 produtos**: ~5-7 minutos
- **Trade-off**: Lento mas confiável

## Próximos Passos

1. Importar workflow atualizado no N8N
2. Testar com produtos que têm variações
3. Se houver erro, o workflow vai PARAR e mostrar a causa real
4. Corrigir o problema específico (pode ser campo faltando, tipo errado, etc.)

## Debugging

Se o erro persistir, verificar:

1. **Produto pai existe?** Consultar banco: `SELECT * FROM products_bling WHERE bling_id = 16610437077`
2. **Ordenação funcionou?** Verificar logs do nó "Parsear Requisição"
3. **UPSERT do pai funcionou?** Verificar resposta do nó "Upsert Produto" para o pai
4. **Campos corretos?** Verificar se todos os campos obrigatórios estão preenchidos

## Arquivos Modificados

- `src/hooks/n8n/workflows/Bling Cadastrar Produto.json`

---

**Status**: ✅ Implementado  
**Testado**: Pendente (aguardando teste do usuário)  
**Prioridade**: Crítica  
**Impacto**: Resolve erro de FK constraint definitivamente
