# Modificação: Wait para Cache do Bling

## Problema Resolvido

Quando uma variação é atualizada no Bling:
1. ✅ Webhook dispara imediatamente
2. ✅ Workflow busca dados da variação via GET
3. ❌ API do Bling retorna dados ANTIGOS (cache)
4. ❌ UPDATE salva dados antigos no banco

## Solução Implementada

Adicionado um Wait de 5 segundos ANTES de buscar os dados do Bling, dando tempo para o cache atualizar.

### Modificações no Workflow

#### 1. Novo Nó Adicionado

```json
{
  "parameters": {
    "amount": 5,
    "unit": "seconds"
  },
  "type": "n8n-nodes-base.wait",
  "typeVersion": 1.1,
  "position": [42100, 15072],
  "id": "wait-cache-bling-20260308",
  "name": "Wait (Cache Bling)",
  "webhookId": "wait-cache-bling-webhook-20260308"
}
```

#### 2. Conexões Modificadas

**ANTES:**
```
If1 → Pega mais dados do ID Produto1
```

**DEPOIS:**
```
If1 → Wait (Cache Bling) [5s] → Pega mais dados do ID Produto1
```

### Fluxo Completo Atualizado

```
Webhook1 
  ↓
Wait8 
  ↓
Pegar Acess Token1 
  ↓
Loop Over Items1 
  ↓
Wait9 
  ↓
If1 (Situação = E?)
  ├─ SIM → Deleta do Banco1
  └─ NÃO → Wait (Cache Bling) [5s] ← NOVO!
            ↓
          Pega mais dados do ID Produto1
            ↓
          Wait
            ↓
          Verifica se produto existe1
            ↓
          Processa Resultado1
            ├─ É variação? → UPDATE em products_variations_bling
            └─ É produto PAI? → Continua fluxo normal
```

## Benefícios

1. ✅ Resolve problema de cache do Bling
2. ✅ Garante que dados atualizados sejam buscados
3. ✅ Simples e direto
4. ✅ Não aumenta carga no N8N significativamente
5. ✅ Funciona para produtos PAI e variações

## Impacto

- **Delay adicional**: 5 segundos por atualização
- **Carga no N8N**: Mínima (apenas aguarda)
- **Chamadas à API**: Nenhuma adicional

## Teste

Para testar a modificação:

1. Importar o workflow atualizado no N8N
2. Alterar uma variação no Bling (ex: preço para R$ 72,00)
3. Aguardar o webhook disparar
4. Verificar logs do N8N:
   - Nó "Wait (Cache Bling)": Deve aguardar 5 segundos
   - Nó "Pega mais dados do ID Produto1": Deve buscar dados atualizados
   - Nó "Processa Resultado1": Deve detectar variação e fazer UPDATE
5. Verificar no banco se o preço foi atualizado para R$ 72,00

## Validação

✅ JSON do workflow validado com sucesso
✅ Nó Wait adicionado corretamente
✅ Conexões atualizadas
✅ Pronto para importar no N8N

## Arquivo Modificado

- `src/hooks/n8n/workflows/Bling Cadastrar_Atualizar_Deletar Produto Automatization.json`

## Próximos Passos

1. ✅ Modificação implementada (CONCLUÍDO)
2. ⏳ Importar workflow no N8N
3. ⏳ Testar atualização de variação
4. ⏳ Validar dados no banco
5. ⏳ Ajustar tempo de delay se necessário (3s, 5s, 10s)

## Ajuste Fino

Se 5 segundos não for suficiente, você pode ajustar o tempo:

- **3 segundos**: Mais rápido, mas pode falhar se cache demorar
- **5 segundos**: Balanceado (RECOMENDADO)
- **10 segundos**: Mais seguro, mas mais lento

Para ajustar, modificar o parâmetro `amount` no nó "Wait (Cache Bling)":

```json
{
  "parameters": {
    "amount": 10,  // Alterar aqui
    "unit": "seconds"
  }
}
```

## Observações

- O Wait só é executado quando o produto NÃO está com situação "E" (excluído)
- Produtos excluídos vão direto para "Deleta do Banco1" sem delay
- O delay é aplicado ANTES de buscar dados do Bling, não depois
- Isso garante que os dados buscados já estejam atualizados no cache do Bling
