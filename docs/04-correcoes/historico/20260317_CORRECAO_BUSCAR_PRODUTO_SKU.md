# Correção: Erro ao Buscar Produto por SKU

## Problema

Ao processar um pedido novo, o workflow retornava erro no nó "Buscar Produto por SKU":

```
Erro ao buscar produto por SKU
```

## Causa

O nó "Buscar Produto por SKU" estava tentando buscar em `products_bling` com dois filtros:

1. `sku = {{ $json.data.codigo }}`
2. `id_produto_pai = {{ $json.data.id }}` ← **COLUNA NÃO EXISTE!**

A coluna `id_produto_pai` NÃO EXISTE em `products_bling`. Essa coluna só existe em `products_variations_bling`.

## Estrutura Correta do Banco

```
products_bling (Produtos PAI)
├─ id (UUID)
├─ bling_id (bigint)
├─ sku (text)
├─ name (text)
└─ ... (outros campos)
   ❌ NÃO TEM: id_produto_pai

products_variations_bling (Variações)
├─ id (UUID)
├─ bling_id (bigint)
├─ product_id (UUID) → FK para products
├─ product_bling_id (UUID) → FK para products_bling
├─ sku (text)
├─ name (text)
├─ variacao_nome (text)
└─ ... (outros campos)
```

## Solução Implementada

Modificado o fluxo para buscar produtos na ordem correta:

### 1. Modificado Nó "Buscar Produto por SKU"

**ANTES**: Buscava em `products_bling` com filtro `id_produto_pai` (erro!)

**DEPOIS**: Busca em `products_variations_bling` apenas por SKU

```json
{
  "operation": "getAll",
  "tableId": "products_variations_bling",
  "filters": {
    "conditions": [
      {
        "keyName": "sku",
        "condition": "eq",
        "keyValue": "={{ $json.data.codigo }}"
      }
    ]
  }
}
```

### 2. Adicionado Nó "Encontrou Variação?" (IF)

Verifica se encontrou alguma variação:

```javascript
{{ $('Buscar Produto por SKU').all().length > 0 }}
```

- **SIM**: Usa a variação encontrada → vai para "Preparar dados do item"
- **NÃO**: Vai para "Buscar em Products Bling (Fallback)"

### 3. Adicionado Nó "Buscar em Products Bling (Fallback)"

Se não encontrou variação, busca em `products_bling` (produtos PAI):

```json
{
  "operation": "getAll",
  "tableId": "products_bling",
  "filters": {
    "conditions": [
      {
        "keyName": "sku",
        "condition": "eq",
        "keyValue": "={{ $('Pega mais dados do ID Produto').item.json.data.codigo }}"
      }
    ]
  }
}
```

## Fluxo Completo Atualizado

```
Pega mais dados do ID Produto
  ↓
Buscar Produto por SKU (products_variations_bling)
  ↓
Encontrou Variação? ← NOVO!
  ├─ SIM → Preparar dados do item
  └─ NÃO → Buscar em Products Bling (Fallback) ← NOVO!
             ↓
           Preparar dados do item
```

## Benefícios da Nova Solução

1. ✅ Busca PRIMEIRO em variações (mais comum em pedidos)
2. ✅ Fallback para produtos PAI se não encontrar variação
3. ✅ Remove filtro `id_produto_pai` que causava erro
4. ✅ Suporta tanto variações quanto produtos PAI
5. ✅ Mais eficiente (busca na tabela certa primeiro)

## Ordem de Busca

1. **products_variations_bling** (variações) - busca por SKU
2. **products_bling** (produtos PAI) - busca por SKU (fallback)

## Arquivos Modificados

1. `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
   - Modificado nó "Buscar Produto por SKU"
   - Adicionado nó "Encontrou Variação?"
   - Adicionado nó "Buscar em Products Bling (Fallback)"
   - Atualizadas conexões

## Scripts Criados

1. `scripts/fix-buscar-produto-sku.py` - Corrige o nó e adiciona fallback

## Teste

Para testar:

1. Importar o workflow atualizado no N8N
2. Criar um pedido novo no Bling com uma variação
3. Aguardar webhook disparar
4. Verificar execução no N8N:
   - Nó "Buscar Produto por SKU": Deve buscar em `products_variations_bling`
   - Nó "Encontrou Variação?": Deve ir para TRUE se encontrou
   - Nó "Preparar dados do item": Deve receber os dados corretos
5. Criar um pedido com produto PAI (sem variação)
6. Verificar que o fallback funciona:
   - Nó "Encontrou Variação?": Deve ir para FALSE
   - Nó "Buscar em Products Bling (Fallback)": Deve buscar em `products_bling`
   - Nó "Preparar dados do item": Deve receber os dados corretos

## Status

✅ Nó "Buscar Produto por SKU" corrigido
✅ Filtro `id_produto_pai` removido
✅ Busca em `products_variations_bling` implementada
✅ Fallback para `products_bling` adicionado
✅ Conexões atualizadas
✅ JSON validado
⏳ Aguardando importação e teste no N8N

## Próximos Passos

1. Importar workflow no N8N
2. Testar com pedido contendo variação
3. Testar com pedido contendo produto PAI
4. Verificar logs para confirmar sucesso
5. Validar dados no banco

## Nota Importante

Este erro estava acontecendo porque o workflow foi criado ANTES da refatoração que separou produtos PAI de variações. Agora o workflow está alinhado com a estrutura correta do banco de dados.
