# Exemplo de Uso - Accordion de Afiliados

## Cenário Real: Amostra Grátis para Influenciadora

### Contexto
Você enviou uma amostra grátis do seu produto para a influenciadora **Maria Silva** (@maria_silva no Instagram). Ela fez um post e algumas pessoas compraram através do link dela. Agora você quer:

1. Registrar que a amostra grátis foi para ela
2. Associar as vendas que vieram dela
3. Calcular a comissão dela

### Passo a Passo

#### 1. Registrar a Amostra Grátis

**Situação**: Você processou o pedido #12345 como amostra grátis

1. Vá para o **Dashboard de Vendas**
2. Clique na barra do gráfico de receitas referente ao pedido #12345
3. O dialog de detalhes abre
4. Role até o accordion **"AFILIADOS"**
5. Clique para expandir

**Primeira vez? Crie o influenciador:**

```
┌─────────────────────────────────────────────┐
│ 👥 AFILIADOS ▼                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Selecionar Influenciador    [+ Novo] ← │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

6. Clique em **"+ Novo"**
7. Preencha:
   - **Nome**: Maria Silva
   - **Instagram**: maria_silva
   - **TikTok**: maria_silva (se ela tiver)
   - **Comissão**: 10.5 (10.5% de comissão)
8. Clique em **"Salvar e Associar"**

**Resultado**:
```
✅ Influenciador "Maria Silva" criado com sucesso!
✅ Afiliado associado com sucesso!
```

Agora o pedido #12345 está associado à Maria Silva!

#### 2. Associar Vendas que Vieram Dela

**Situação**: Depois do post da Maria, você recebeu 3 pedidos:
- Pedido #12346 - Cliente: Ana Costa
- Pedido #12347 - Cliente: João Santos  
- Pedido #12348 - Cliente: Pedro Lima

Para cada pedido:

1. Clique na barra do gráfico referente ao pedido
2. Expanda o accordion **"AFILIADOS"**
3. Selecione **"Maria Silva @maria_silva"** no dropdown
4. Pronto! Associação salva automaticamente

```
┌─────────────────────────────────────────────┐
│ 👥 AFILIADOS ▼                              │
│ ┌─────────────────────────────────────────┐ │
│ │ ┌────────────────────────────────────┐  │ │
│ │ │ ○ Sem influenciador                │  │ │
│ │ │ ● Maria Silva @maria_silva         │ ← │ │
│ │ └────────────────────────────────────┘  │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

✅ Afiliado associado com sucesso!
```

#### 3. Verificar no Banco de Dados

Agora você pode consultar todas as vendas da Maria:

```sql
SELECT 
  o.order_number,
  o.order_date,
  o.customer_name,
  o.total_amount,
  o.total_profit,
  o.is_free_sample,
  i.name as affiliate_name,
  i.percentage as commission_rate,
  -- Calcular comissão
  CASE 
    WHEN o.is_free_sample THEN 0
    ELSE (o.total_amount * i.percentage / 100)
  END as commission_amount
FROM orders o
JOIN influencers i ON o.affiliate_id = i.id
WHERE i.name = 'Maria Silva'
ORDER BY o.order_date DESC;
```

**Resultado esperado**:
```
order_number | order_date | customer_name | total_amount | total_profit | is_free_sample | affiliate_name | commission_rate | commission_amount
-------------|------------|---------------|--------------|--------------|----------------|----------------|-----------------|------------------
12345        | 2026-04-20 | Maria Silva   | 150.00       | 0.00         | true           | Maria Silva    | 10.5            | 0.00
12346        | 2026-04-21 | Ana Costa     | 180.00       | 45.00        | false          | Maria Silva    | 10.5            | 18.90
12347        | 2026-04-22 | João Santos   | 200.00       | 60.00        | false          | Maria Silva    | 10.5            | 21.00
12348        | 2026-04-23 | Pedro Lima    | 150.00       | 40.00        | false          | Maria Silva    | 10.5            | 15.75
-------------|------------|---------------|--------------|--------------|----------------|----------------|-----------------|------------------
TOTAL        |            |               | 680.00       | 145.00       |                |                |                 | 55.65
```

**Análise**:
- 🎁 1 amostra grátis (R$ 150,00 - lucro zero)
- 💰 3 vendas geradas (R$ 530,00 em receita)
- 📈 R$ 145,00 em lucro total
- 💵 R$ 55,65 em comissão para Maria Silva (10.5%)
- 🎯 ROI: Investiu R$ 150 (amostra), gerou R$ 145 de lucro + R$ 55,65 de comissão = **Positivo!**

## Cenário 2: Múltiplos Influenciadores

### Contexto
Você tem 3 influenciadores ativos:
- Maria Silva (Instagram) - 10.5% comissão
- João Santos (TikTok) - 12% comissão
- Ana Costa (YouTube) - 15% comissão

### Como Gerenciar

#### Criar todos os influenciadores

1. Abra qualquer pedido
2. Expanda "AFILIADOS"
3. Crie cada um usando "+ Novo"

**Maria Silva**:
```
Nome: Maria Silva
Instagram: maria_silva
Comissão: 10.5
```

**João Santos**:
```
Nome: João Santos
TikTok: joao_santos
Comissão: 12
```

**Ana Costa**:
```
Nome: Ana Costa
Twitter: ana_costa_yt
Comissão: 15
```

#### Associar vendas

Agora, para cada venda, você seleciona de quem veio:

```
Pedido #12350 → Maria Silva (veio do Instagram)
Pedido #12351 → João Santos (veio do TikTok)
Pedido #12352 → Maria Silva (veio do Instagram)
Pedido #12353 → Ana Costa (veio do YouTube)
Pedido #12354 → Sem influenciador (venda orgânica)
```

#### Relatório de Performance

```sql
-- Vendas e comissões por influenciador
SELECT 
  i.name,
  i.instagram,
  i.tiktok,
  i.percentage as commission_rate,
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as total_revenue,
  SUM(o.total_profit) as total_profit,
  SUM(
    CASE 
      WHEN o.is_free_sample THEN 0
      ELSE (o.total_amount * i.percentage / 100)
    END
  ) as total_commission,
  -- Lucro líquido (lucro - comissão)
  SUM(o.total_profit) - SUM(
    CASE 
      WHEN o.is_free_sample THEN 0
      ELSE (o.total_amount * i.percentage / 100)
    END
  ) as net_profit
FROM influencers i
LEFT JOIN orders o ON o.affiliate_id = i.id
WHERE i.is_active = true
GROUP BY i.id, i.name, i.instagram, i.tiktok, i.percentage
ORDER BY total_revenue DESC;
```

**Resultado esperado**:
```
name         | instagram    | tiktok       | commission_rate | total_orders | total_revenue | total_profit | total_commission | net_profit
-------------|--------------|--------------|-----------------|--------------|---------------|--------------|------------------|------------
Maria Silva  | maria_silva  | NULL         | 10.5            | 8            | 1,200.00      | 320.00       | 126.00           | 194.00
João Santos  | NULL         | joao_santos  | 12.0            | 5            | 850.00        | 240.00       | 102.00           | 138.00
Ana Costa    | NULL         | NULL         | 15.0            | 3            | 600.00        | 180.00       | 90.00            | 90.00
```

**Insights**:
- 🥇 Maria Silva: Mais vendas (8), melhor ROI
- 🥈 João Santos: Boa performance no TikTok
- 🥉 Ana Costa: Menos vendas, mas comissão maior

## Cenário 3: Corrigir Associação Errada

### Contexto
Você associou o pedido #12355 à Maria Silva por engano, mas na verdade veio do João Santos.

### Como Corrigir

1. Abra o pedido #12355
2. Expanda "AFILIADOS"
3. Veja que está: **"AFILIADOS (Maria Silva)"**
4. Clique no dropdown
5. Selecione **"João Santos"**
6. Pronto! Associação atualizada

```
Antes:
┌─────────────────────────────────────────────┐
│ 👥 AFILIADOS (Maria Silva) ▼                │
└─────────────────────────────────────────────┘

Depois:
┌─────────────────────────────────────────────┐
│ 👥 AFILIADOS (João Santos) ▼                │
└─────────────────────────────────────────────┘

✅ Afiliado associado com sucesso!
```

## Cenário 4: Venda Orgânica (Sem Afiliado)

### Contexto
O pedido #12356 não veio de nenhum influenciador, foi uma venda orgânica.

### Como Marcar

1. Abra o pedido #12356
2. Expanda "AFILIADOS"
3. Selecione **"Sem influenciador"**

```
┌─────────────────────────────────────────────┐
│ 👥 AFILIADOS ▼                              │
│ ┌─────────────────────────────────────────┐ │
│ │ ● Sem influenciador                    │ │ ← Selecione
│ │ ○ Maria Silva @maria_silva             │ │
│ │ ○ João Santos @joao_santos             │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

✅ Afiliado removido
```

Agora o pedido não tem afiliado associado e não gerará comissão.

## Dicas Práticas

### 💡 Dica 1: Nomenclatura Consistente
Use sempre o mesmo padrão de nome:
- ✅ "Maria Silva" (nome completo)
- ❌ "maria", "Maria", "maria silva" (inconsistente)

### 💡 Dica 2: Preencha as Redes Sociais
Mesmo que seja opcional, preencha para facilitar identificação:
```
Nome: Maria Silva
Instagram: maria_silva ← Facilita identificar
```

### 💡 Dica 3: Comissão Padrão
Defina uma comissão padrão para todos (ex: 10.5%) e ajuste apenas para casos especiais.

### 💡 Dica 4: Associe Imediatamente
Assim que processar um pedido que veio de afiliado, associe imediatamente para não esquecer.

### 💡 Dica 5: Revise Periodicamente
Uma vez por semana, revise os pedidos sem afiliado para ver se algum deveria ter.

```sql
-- Pedidos sem afiliado nos últimos 7 dias
SELECT 
  order_number,
  order_date,
  customer_name,
  total_amount
FROM orders
WHERE affiliate_id IS NULL
  AND order_date >= CURRENT_DATE - INTERVAL '7 days'
  AND is_free_sample = false
ORDER BY order_date DESC;
```

## Benefícios Reais

### Para Você (Lojista)
- ✅ Rastreamento preciso de vendas por afiliado
- ✅ Cálculo automático de comissões
- ✅ Identificação de influenciadores mais efetivos
- ✅ ROI de amostras grátis
- ✅ Dados para negociar comissões

### Para os Influenciadores
- ✅ Transparência nas vendas
- ✅ Comissões justas e rastreáveis
- ✅ Motivação para promover mais
- ✅ Relatórios de performance

### Para o Negócio
- ✅ Crescimento através de marketing de influência
- ✅ Custo de aquisição de cliente (CAC) otimizado
- ✅ Diversificação de canais de venda
- ✅ Relacionamento com influenciadores

## Próximos Passos

Depois de usar por um tempo, você pode:

1. **Criar relatório mensal** de comissões
2. **Exportar dados** para enviar aos influenciadores
3. **Analisar ROI** de cada influenciador
4. **Ajustar comissões** baseado em performance
5. **Recrutar novos influenciadores** baseado em dados

---

**Pronto para começar?** Execute a migração e comece a rastrear suas vendas por afiliado! 🚀
