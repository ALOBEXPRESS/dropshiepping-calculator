# Correção Final: Erro no Loop de Itens

## Problema

Ao adicionar um novo produto em um pedido existente, o nó "Pega mais dados do ID Produto1" falha com erro:

```
[ERROR: Can't determine which item to use]
Paired item data for item from node 'Preparar Itens do pedido' is unavailable
```

## Causa

O nó está usando `.item` para acessar o access_token:
```javascript
{{ $('Pegar Access Token1').item.json.access_token }}
```

Quando o workflow está em um loop (processando múltiplos itens), o n8n não consegue fazer o "pairing" (emparelhamento) entre os itens do loop e o nó "Pegar Access Token1" que está fora do loop.

## Solução

Usar `.first()` em vez de `.item` para nós que estão fora do loop:

**ANTES (errado):**
```javascript
{{ $('Pegar Access Token1').item.json.access_token }}
```

**DEPOIS (correto):**
```javascript
{{ $('Pegar Access Token1').first().json.access_token }}
```

## Explicação

- `.item` → Tenta fazer pairing com o item atual do loop (falha se não conseguir)
- `.first()` → Pega o primeiro item do nó (sempre funciona)
- `.last()` → Pega o último item do nó
- `.all()[0]` → Pega o item no índice 0

Para nós que executam apenas 1 vez (como "Pegar Access Token1"), use `.first()` ou `.last()` quando acessar de dentro de um loop.

## Aplicação

1. **Reimporte o workflow** atualizado
2. **OU edite manualmente** o nó "Pega mais dados do ID Produto1":
   - Clique no nó
   - Vá em Headers → Authorization
   - Mude de `.item` para `.first()`

## Teste

1. Crie um pedido com 2 produtos
2. Edite o pedido e adicione um 3º produto
3. Salve
4. Verifique que o workflow processa sem erros
5. Confirme que a tabela `bling_order_items` tem 3 itens

## Outros Nós que Podem Ter o Mesmo Problema

Verifique se há outros nós dentro do loop que usam `.item` para acessar nós fora do loop:

```bash
# Procurar por .item no workflow
grep -n "\.item\." workflow.json
```

Nós comuns que precisam de `.first()`:
- Pegar Access Token
- Preparar Dados
- Buscar Canal
- Qualquer nó que execute 1 vez mas é acessado de dentro de um loop

## Regra Geral

**Dentro de um loop:**
- Use `.item` para nós que estão NO MESMO LOOP
- Use `.first()` ou `.last()` para nós FORA DO LOOP
- Use `$json` para o item atual do loop

**Fora de um loop:**
- Use `.item` normalmente
- Ou use `.first()` / `.last()` para ser mais explícito
