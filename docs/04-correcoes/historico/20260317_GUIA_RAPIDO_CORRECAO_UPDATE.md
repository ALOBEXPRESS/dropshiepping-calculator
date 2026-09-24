# Guia Rápido: Correção do Erro de UPDATE

## O que foi feito

Adicionei 2 novos nós no workflow para resolver o erro de UPDATE quando o pedido não existe:

1. **Nó "É CREATE?"** - Verifica se o evento é `order.created`
2. **Nó "Registrar UPDATE Ignorado"** - Registra um log quando UPDATE é ignorado

## Como aplicar

### Opção 1: Importar o workflow atualizado (RECOMENDADO)

1. Abra o n8n
2. Vá em **Workflows** → **Import from File**
3. Selecione o arquivo: `src/hooks/n8n/Bling Pedido de Venda Automatization (3).json`
4. Clique em **Import**
5. Ative o workflow

### Opção 2: Adicionar manualmente os nós

Se preferir adicionar manualmente:

#### 1. Adicionar nó "É CREATE?"

1. Clique no canvas entre "Pedido Existe?" (saída FALSE) e "Inserir Pedido"
2. Adicione um nó **IF**
3. Configure:
   - **Nome:** `É CREATE?`
   - **Condição:**
     - Campo: `{{ $('Preparar Dados').item.json.event_type }}`
     - Operador: `equals`
     - Valor: `order.created`

#### 2. Adicionar nó "Registrar UPDATE Ignorado"

1. Adicione um nó **Supabase**
2. Configure:
   - **Nome:** `Registrar UPDATE Ignorado`
   - **Operação:** Insert
   - **Tabela:** `bling_sync_logs`
   - **Campos:**
     - `organization_id`: `e3274f4d-2627-4121-895d-b0e3a70b0ace`
     - `event_type`: `{{ $('Preparar Dados').item.json.event_type }}`
     - `bling_order_id`: `{{ $('Preparar Dados').item.json.bling_order_id }}`
     - `marketplace_order_number`: `{{ $('Preparar Dados').item.json.marketplace_order_number }}`
     - `bling_store_id`: `{{ $('Preparar Dados').item.json.bling_store_id }}`
     - `status`: `skipped` (em vez de "ignored" - valores permitidos: success, error, skipped)
     - `error_message`: `UPDATE ignorado: pedido não existe no banco (provavelmente já foi deletado)`
     - `webhook_data`: `{{ $('Preparar Dados').item.json.webhook_data }}`

#### 3. Conectar os nós

1. **Desconectar:** "Pedido Existe?" (saída FALSE) → "Inserir Pedido"
2. **Conectar:** "Pedido Existe?" (saída FALSE) → "É CREATE?"
3. **Conectar:** "É CREATE?" (saída TRUE) → "Inserir Pedido"
4. **Conectar:** "É CREATE?" (saída FALSE) → "Registrar UPDATE Ignorado"

## Fluxo Final

```
Pedido Existe?
├─ TRUE (pedido existe)
│  └─ Atualizar Pedido → Preparar Itens do pedido → ...
│
└─ FALSE (pedido não existe)
   └─ É CREATE?
      ├─ TRUE (evento é order.created)
      │  └─ Inserir Pedido → Preparar Itens do pedido → ...
      │
      └─ FALSE (evento é order.updated)
         └─ Registrar UPDATE Ignorado → FIM
```

## O que acontece agora

Quando você deletar um pedido no Bling:

1. **Webhook DELETE** chega → Deleta o pedido do banco
2. **Webhook UPDATE** chega depois:
   - Busca o pedido no banco → **não encontra**
   - Verifica: "É CREATE?" → **NÃO**
   - Registra log: "UPDATE ignorado: pedido não existe"
   - **Para o fluxo** (não tenta inserir)

## Teste

1. Crie um pedido no Bling com 2 produtos
2. Aguarde sincronizar
3. Delete o pedido no Bling
4. Verifique os logs em `bling_sync_logs`:
   - Deve ter 1 registro com `status = 'success'` (DELETE)
   - Deve ter 1 registro com `status = 'skipped'` (UPDATE ignorado)
5. **Não deve ter mais erro de constraint violation**

## Resultado Esperado

✅ Pedidos com múltiplos itens funcionando
✅ DELETE funcionando com cascade
✅ UPDATE ignorado quando pedido não existe
✅ Sem erros de constraint violation
