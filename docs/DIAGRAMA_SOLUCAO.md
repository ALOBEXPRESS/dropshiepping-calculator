# 🎨 Diagrama Visual da Solução

## 📊 Fluxo Atual (COM ERRO)

```
Pedido do Bling
    ↓
Preparar Itens do pedido2
    ↓
Buscar Produto por SKU2
    ↓
SELECT * FROM products WHERE sku = 'YEIZ_IDP294_004'
    ↓
❌ VAZIO (variação não está em products)
    ↓
Preparar dados do item2
    ↓
❌ ERRO: bling_item_id null
```

---

## ✅ Fluxo Corrigido (SEM ERRO)

```
Pedido do Bling
    ↓
Preparar Itens do pedido2
    ↓
Buscar Produto por SKU2 (UNION)
    ↓
┌─────────────────────────────────────────┐
│ SELECT ... FROM products                │
│ UNION ALL                               │
│ SELECT ... FROM products_variations_bling│
└─────────────────────────────────────────┘
    ↓
✅ Retorna produto com product_type
    ↓
Preparar dados do item2
    ↓
┌─────────────────────────────────────────┐
│ if (product_type === 'simple')          │
│   → Filtrar por marketplace             │
│   → Usar product_id                     │
│                                         │
│ if (product_type === 'variation')       │
│   → NÃO filtrar por marketplace         │
│   → Usar product_variation_id           │
└─────────────────────────────────────────┘
    ↓
✅ Inserir item do pedido2
    ↓
✅ Pedido completo no frontend
```

---

## 🗄️ Estrutura do Banco de Dados

```
┌─────────────────────────────────────────────────────────┐
│                    bling_order_items                    │
├─────────────────────────────────────────────────────────┤
│ order_id (UUID)                                         │
│ bling_item_id (bigint) ← OBRIGATÓRIO                   │
│ product_id (UUID) ────────────┐                        │
│ product_bling_id (UUID) ──────┼────┐                   │
│ product_variation_id (UUID) ──┼────┼───┐               │
└───────────────────────────────┼────┼───┼───────────────┘
                                │    │   │
                                ↓    │   │
                    ┌───────────────┐│   │
                    │   products    ││   │
                    ├───────────────┤│   │
                    │ id (UUID)     ││   │
                    │ sku           ││   │
                    │ marketplace ← ││   │ Tem marketplace!
                    │ price         ││   │
                    └───────────────┘│   │
                                     ↓   │
                         ┌──────────────┐│
                         │products_bling││
                         ├──────────────┤│
                         │ id (UUID)    ││
                         │ bling_id     ││
                         │ sku          ││
                         └──────────────┘│
                                         ↓
                    ┌────────────────────────────────┐
                    │ products_variations_bling      │
                    ├────────────────────────────────┤
                    │ id (UUID)                      │
                    │ sku                            │
                    │ product_bling_id (bigint) ←────┘
                    │ sale_price                     │
                    │ variacao_nome                  │
                    │ ❌ SEM marketplace!            │
                    └────────────────────────────────┘
```

---

## 🔄 Lógica de Decisão

```
┌─────────────────────────────────────────────────────────┐
│              Buscar Produto por SKU2                    │
│                                                         │
│  Input: SKU = "YEIZ_IDP248"                            │
│                                                         │
│  Query UNION:                                          │
│  ┌─────────────────────────────────────────────────┐  │
│  │ SELECT ... FROM products                        │  │
│  │ WHERE sku = 'YEIZ_IDP248'                       │  │
│  │ → Retorna 3 produtos (2 ML, 1 Shopee)          │  │
│  │   product_type = 'simple'                       │  │
│  │   marketplace = 'mercadolivre' ou 'shopee'      │  │
│  │                                                 │  │
│  │ UNION ALL                                       │  │
│  │                                                 │  │
│  │ SELECT ... FROM products_variations_bling       │  │
│  │ WHERE sku = 'YEIZ_IDP248'                       │  │
│  │ → Retorna 0 (não é variação)                    │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Output: 3 produtos com product_type = 'simple'        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│            Preparar dados do item2                      │
│                                                         │
│  Marketplace do pedido: 'shopee'                       │
│                                                         │
│  Loop pelos 3 produtos:                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Produto 1: ML (R$ 42.90)                        │  │
│  │ → product_type = 'simple'                       │  │
│  │ → marketplace = 'mercadolivre'                  │  │
│  │ → ❌ PULA (marketplace diferente)               │  │
│  │                                                 │  │
│  │ Produto 2: ML (R$ 46.90)                        │  │
│  │ → product_type = 'simple'                       │  │
│  │ → marketplace = 'mercadolivre'                  │  │
│  │ → ❌ PULA (marketplace diferente)               │  │
│  │                                                 │  │
│  │ Produto 3: Shopee (R$ 47.20)                    │  │
│  │ → product_type = 'simple'                       │  │
│  │ → marketplace = 'shopee'                        │  │
│  │ → ✅ USA ESTE!                                  │  │
│  │ → product_id = "2bf6dd07-..."                   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Output: 1 item preparado para inserir                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Exemplo com Variação

```
┌─────────────────────────────────────────────────────────┐
│              Buscar Produto por SKU2                    │
│                                                         │
│  Input: SKU = "YEIZ_IDP294_004"                        │
│                                                         │
│  Query UNION:                                          │
│  ┌─────────────────────────────────────────────────┐  │
│  │ SELECT ... FROM products                        │  │
│  │ WHERE sku = 'YEIZ_IDP294_004'                   │  │
│  │ → Retorna 0 (não está em products)              │  │
│  │                                                 │  │
│  │ UNION ALL                                       │  │
│  │                                                 │  │
│  │ SELECT ... FROM products_variations_bling       │  │
│  │ WHERE sku = 'YEIZ_IDP294_004'                   │  │
│  │ → Retorna 1 variação                            │  │
│  │   product_type = 'variation'                    │  │
│  │   product_bling_id = 16613337777                │  │
│  │   variacao_nome = 'Cor: Roxo'                   │  │
│  │   marketplace = null                            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Output: 1 variação com product_type = 'variation'     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│            Preparar dados do item2                      │
│                                                         │
│  Marketplace do pedido: 'shopee'                       │
│                                                         │
│  Loop pela 1 variação:                                 │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Variação: Copo Térmico Roxo (R$ 89.90)          │  │
│  │ → product_type = 'variation'                    │  │
│  │ → marketplace = null                            │  │
│  │ → ✅ NÃO FILTRA por marketplace                 │  │
│  │ → product_variation_id = "2a90a8ad-..."         │  │
│  │ → ✅ USA ESTE!                                  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Output: 1 item preparado para inserir                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Comparação: Antes vs Depois

### ANTES (Apenas products)

| SKU | Tabela | Encontrado? | Inserido? |
|-----|--------|-------------|-----------|
| YEIZ_IDP248 | products | ✅ Sim | ✅ Sim |
| YEIZ_IDP294_004 | products | ❌ Não | ❌ Não |

### DEPOIS (UNION products + variations)

| SKU | Tabela | Encontrado? | Inserido? |
|-----|--------|-------------|-----------|
| YEIZ_IDP248 | products | ✅ Sim | ✅ Sim |
| YEIZ_IDP294_004 | products_variations_bling | ✅ Sim | ✅ Sim |

---

**Data**: 2026-05-03  
**Tipo**: Diagrama Visual  
**Objetivo**: Facilitar entendimento da solução
