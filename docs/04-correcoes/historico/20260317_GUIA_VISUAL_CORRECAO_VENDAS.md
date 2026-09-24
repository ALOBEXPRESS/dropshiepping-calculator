# Guia Visual - Correção de Vendas

**Entenda visualmente o que foi corrigido**

---

## 🖼️ Problema 1: Imagem do Produto

### Antes da Correção
```
┌─────────────────────────────────┐
│  Pedido #89                     │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │         📦                │  │
│  │    (ícone genérico)       │  │
│  │                           │  │
│  └───────────────────────────┘  │
│  MERCADO LIVRE                  │
│  R$ 74,80                       │
│  [PROCESSAR LUCRO]              │
└─────────────────────────────────┘
```

### Depois da Correção
```
┌─────────────────────────────────┐
│  Pedido #89                     │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │    🖼️ Relógio Feminino    │  │
│  │    (imagem real)          │  │
│  │                           │  │
│  └───────────────────────────┘  │
│  MERCADO LIVRE                  │
│  R$ 74,80                       │
│  [PROCESSAR LUCRO]              │
└─────────────────────────────────┘
```

### Como Funciona
```sql
-- Query da View
SELECT COALESCE(
    pb.image_url,      -- 1º: Tenta products_bling
    p.image_url        -- 2º: Fallback para products
) as first_product_image
FROM bling_order_items boi
LEFT JOIN products p ON p.id = boi.product_id
LEFT JOIN products_bling pb ON pb.code = p.sku
```

**Prioridade:**
1. `products_bling.image_url` (mais atualizado)
2. `products.image_url` (fallback)
3. NULL → Mostra ícone 📦

---

## 📊 Problema 2: Gráfico de Receita

### Antes da Correção
```
Relatório de Receita                    [Mensal ▼]

Receita          Custo
R$ 0             R$ 0

┌────────────────────────────────────────────┐
│                                            │
│         (gráfico vazio)                    │
│                                            │
│    Sem dados disponíveis                  │
│                                            │
└────────────────────────────────────────────┘
```

### Depois da Correção
```
Relatório de Receita                    [Mensal ▼]

Receita          Custo
R$ 150           R$ 0

┌────────────────────────────────────────────┐
│ R$ 80                                      │
│     ╱╲                                     │
│    ╱  ╲    ╱─── Receita (verde)           │
│   ╱    ╲  ╱                                │
│  ╱      ╲╱                                 │
│ ╱                                          │
│╱        ─── Custo (vermelho)               │
│ R$ 0                                       │
│ Feb    Chart                         Mar   │
└────────────────────────────────────────────┘
```

### Como Funciona
```sql
-- Function get_revenue_report
SELECT 
    TO_CHAR(DATE_TRUNC('month', o.order_date), 'Mon') as period_label,
    SUM(o.total_amount) as total_revenue,
    SUM(o.total_cost) as total_cost,
    SUM(o.total_profit) as total_profit
FROM orders o
WHERE o.processed_at IS NOT NULL
GROUP BY DATE_TRUNC('month', o.order_date)
ORDER BY period_start ASC;
```

**Períodos Suportados:**
- `daily` → Últimos 30 dias
- `weekly` → Últimas 12 semanas
- `monthly` → Últimos 12 meses
- `yearly` → Últimos 5 anos

---

## 💰 Problema 3: Custo do Produto

### Antes da Correção
```
Produto: Relógio Feminino Elegance
SKU: 2023165366

┌─────────────────────────────────┐
│ Preço de Venda:    R$ 39,90     │
│ Custo:             R$ 0,00 ❌   │
│ Lucro Estimado:    R$ 39,90     │
└─────────────────────────────────┘

Projeções:
┌──────┬──────┬──────┐
│ 50un │100un │200un │
│R$ 0  │R$ 0  │R$ 0  │ ❌
└──────┴──────┴──────┘
```

### Depois da Correção
```
Produto: Relógio Feminino Elegance
SKU: 2023165366

┌─────────────────────────────────┐
│ Preço de Venda:    R$ 39,90     │
│ Custo:             R$ 21,90 ✅  │
│ Lucro Estimado:    R$ 8,21      │
└─────────────────────────────────┘

Projeções:
┌──────────┬──────────┬──────────┐
│   50un   │  100un   │  200un   │
│ R$ 410,50│R$ 821,00 │R$1.642,00│ ✅
└──────────┴──────────┴──────────┘
```

### Como Funciona
```sql
-- Busca de Custo na Function
SELECT 
    COALESCE(
        pb.cost_price,    -- 1º: products_bling
        p.cost_price,     -- 2º: products
        0                 -- 3º: padrão
    ) as cost_price
FROM products p
LEFT JOIN products_bling pb ON pb.code = p.sku
WHERE p.id = v_item.product_id;
```

**Prioridade:**
1. `products_bling.cost_price` (R$ 21,90) ✅
2. `products.cost_price` (fallback)
3. `0` (padrão seguro)

---

## 🔄 Fluxo Completo de Processamento

### Passo a Passo

```
1. VENDA CHEGA DO BLING
   ↓
   ┌─────────────────────────────┐
   │ bling_orders                │
   │ - order_number: 89          │
   │ - total_amount: R$ 74,80    │
   │ - processed: FALSE          │
   └─────────────────────────────┘
   
2. APARECE EM VENDAS PENDENTES
   ↓
   ┌─────────────────────────────┐
   │ pending_orders_to_process   │
   │ (VIEW)                      │
   │ - Busca imagem ✅           │
   │ - Mostra card               │
   └─────────────────────────────┘
   
3. USUÁRIO CLICA "PROCESSAR LUCRO"
   ↓
   ┌─────────────────────────────┐
   │ process_bling_order_to_     │
   │ profit()                    │
   │ - Busca custo ✅            │
   │ - Calcula lucro             │
   │ - Cria em orders            │
   └─────────────────────────────┘
   
4. GRÁFICO É ATUALIZADO
   ↓
   ┌─────────────────────────────┐
   │ get_revenue_report()        │
   │ - Agrupa por período        │
   │ - Retorna dados ✅          │
   └─────────────────────────────┘
   
5. RESULTADO FINAL
   ↓
   ┌─────────────────────────────┐
   │ ✅ Imagem visível           │
   │ ✅ Gráfico atualizado       │
   │ ✅ Custos corretos          │
   └─────────────────────────────┘
```

---

## 📋 Tabelas Envolvidas

### Relacionamento
```
products_bling (fonte primária)
    ↓ (JOIN por SKU)
products
    ↓ (JOIN por product_id)
bling_order_items
    ↓ (JOIN por order_id)
bling_orders
    ↓ (processamento)
orders ← (dados finais)
    ↓
order_items
```

### Campos Importantes

**products_bling:**
- `code` (SKU)
- `image_url` ✅ (prioridade)
- `cost_price` ✅ (prioridade)
- `price`
- `name`

**products:**
- `sku` (link com products_bling)
- `image_url` (fallback)
- `cost_price` (fallback)
- `price`
- `name`

**orders:**
- `total_amount` (receita)
- `total_cost` ✅ (calculado)
- `total_profit` ✅ (calculado)
- `profit_margin` ✅ (calculado)
- `processed_at` (timestamp)

---

## 🎯 Exemplo Real

### Dados de Entrada
```
Pedido #89
├─ Cliente: Jonatan Renan
├─ Email: jonatan_rvs@hotmail.com
├─ Marketplace: MERCADO LIVRE (15% comissão)
├─ Data: 28/02/2026
└─ Itens:
   ├─ Item 1: Relógio Feminino
   │  ├─ SKU: 2023165366
   │  ├─ Quantidade: 2
   │  ├─ Preço Unit: R$ 39,90
   │  └─ Custo Unit: R$ 21,90 ✅
   └─ Total: R$ 74,80
```

### Cálculos
```
Receita Total:        R$ 74,80
Custo Total:          R$ 43,80  (2 × R$ 21,90)
Comissão ML (15%):    R$ 11,22  (R$ 74,80 × 15%)
Frete:                R$ 0,00
Outras Despesas:      R$ 0,00
─────────────────────────────────
Lucro Líquido:        R$ 19,78  ✅
Margem de Lucro:      26,44%    ✅
```

### Resultado no Gráfico
```
Fevereiro 2026:
├─ Receita: R$ 74,80
├─ Custo:   R$ 43,80
└─ Lucro:   R$ 19,78

Março 2026:
├─ Receita: R$ 0,00
├─ Custo:   R$ 0,00
└─ Lucro:   R$ 0,00
```

---

## ✅ Checklist de Validação

### Após Aplicar Migration

**1. Vendas Pendentes**
- [ ] Imagem do produto aparece
- [ ] Badge do marketplace correto
- [ ] Valor total correto
- [ ] Botão "PROCESSAR LUCRO" funciona

**2. Processamento**
- [ ] Modal de sucesso aparece
- [ ] Pedido some da lista de pendentes
- [ ] Dados salvos em `orders`
- [ ] Custos calculados corretamente

**3. Gráfico**
- [ ] Dados aparecem após processar
- [ ] Receita (verde) visível
- [ ] Custo (vermelho) visível
- [ ] Períodos funcionam (Diário, Semanal, Mensal, Anual)

**4. Dados**
- [ ] Custo de `products_bling` usado
- [ ] Imagem de `products_bling` usada
- [ ] Fallback para `products` funciona
- [ ] Valores padrão (0) quando NULL

---

## 🚀 Comandos Úteis

### Verificar Dados
```sql
-- Ver vendas pendentes
SELECT * FROM pending_orders_to_process;

-- Ver relatório de receita (mensal)
SELECT * FROM get_revenue_report(
    'seu-organization-id'::UUID,
    'monthly'
);

-- Ver pedidos processados
SELECT 
    order_number,
    total_amount,
    total_cost,
    total_profit,
    profit_margin
FROM orders
WHERE processed_at IS NOT NULL
ORDER BY order_date DESC;
```

### Testar Processamento
```sql
-- Processar pedido manualmente
SELECT process_bling_order_to_profit(
    'bling-order-id'::UUID,
    NULL
);
```

---

**Última Atualização:** 1 de Março de 2026  
**Autor:** Kiro AI Assistant  
**Tipo:** Guia Visual
