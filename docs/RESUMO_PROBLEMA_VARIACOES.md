# 📋 Resumo: Problema com Variações de Produtos

## 🔴 Problema

O workflow **"Bling Pedido de Venda Automatization"** está falhando ao processar pedidos com **variações de produtos** (ex: SKU `YEIZ_IDP294_004`).

### Erro Atual:
```
null value in column "bling_item_id" of relation "bling_order_items" 
violates not-null constraint
```

## 🔍 Causa Raiz

O workflow no n8n está **desatualizado** e não tem os nós necessários para buscar variações:

### O que está faltando:
1. ❌ **Nó "Buscar Variação por SKU2"** - Não existe no n8n
2. ❌ **Nó "Combinar Produtos e Variações2"** - Não existe no n8n
3. ❌ **Conexões corretas** entre os nós

### Por que isso acontece:
- O nó "Buscar Produto por SKU2" só busca na tabela `products`
- Variações estão na tabela `products_variations_bling`
- Quando não encontra o produto, o workflow falha

## ✅ Solução

### Arquivo Local vs n8n

| Item | Arquivo Local | n8n (Atual) |
|------|---------------|-------------|
| Buscar Produto por SKU2 | ✅ Existe | ✅ Existe |
| Buscar Variação por SKU2 | ✅ Existe | ❌ **FALTA** |
| Combinar Produtos e Variações2 | ✅ Existe | ❌ **FALTA** |
| Preparar dados do item2 | ✅ Código correto | ✅ Código correto |

### O que precisa ser feito:

**Opção 1: Atualização Manual (RECOMENDADO)**
- Criar os 2 nós faltantes no n8n
- Conectar corretamente
- Testar

**Opção 2: Importar o JSON Local**
- Importar o arquivo `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization (1).json`
- Substituir o workflow atual

**Opção 3: SQL UNION Query**
- Modificar o nó "Buscar Produto por SKU2" para usar UNION
- Buscar em ambas as tabelas com uma única query

## 📊 Estrutura de Dados

### Produtos Simples (tabela `products`)
```
products
├── id (UUID)
├── sku
├── name
├── marketplace ← TEM marketplace
└── price
```

### Variações (tabela `products_variations_bling`)
```
products_variations_bling
├── id (UUID)
├── sku
├── variacao_nome
├── product_bling_id (bigint)
├── sale_price
└── ❌ SEM marketplace
```

### Tabela de Itens do Pedido
```
bling_order_items
├── order_id (UUID)
├── bling_item_id (bigint) ← OBRIGATÓRIO
├── product_id (UUID) ← Para produtos simples
├── product_bling_id (bigint) ← Para variações
└── product_variation_id (UUID) ← Para variações
```

## 🎯 Lógica de Negócio

### Produtos Simples:
- ✅ Filtrados por marketplace
- ✅ Usa `product_id`
- ✅ `product_bling_id` e `product_variation_id` = NULL

### Variações:
- ✅ **NÃO** filtradas por marketplace (não têm esse campo)
- ✅ Usa `product_variation_id` e `product_bling_id`
- ✅ `product_id` = NULL

## 🧪 Testes Necessários

### Teste 1: Variação
- **SKU:** YEIZ_IDP294_004
- **Esperado:** Inserir com `product_variation_id` e `product_bling_id`

### Teste 2: Produto Simples
- **SKU:** YEIZ_IDP248
- **Esperado:** Inserir com `product_id`

## 📁 Arquivos Relacionados

- `PLANO_ACAO_SYNC_WORKFLOW.md` - Instruções detalhadas de como corrigir
- `CORRECAO_FINAL_VARIACOES.md` - Documentação técnica da solução
- `CORRECAO_CONEXOES_WORKFLOW.md` - Explicação do problema de sync
- `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization (1).json` - Workflow correto

## 🚀 Próximos Passos

1. **Leia:** `PLANO_ACAO_SYNC_WORKFLOW.md`
2. **Escolha:** Uma das 3 opções de correção
3. **Aplique:** As mudanças no n8n
4. **Teste:** Com os SKUs mencionados
5. **Valide:** Que não há mais erros de `bling_item_id` null

---

**Status:** 🔴 Aguardando correção manual no n8n  
**Prioridade:** 🔥 Alta (workflow está falhando)  
**Tempo Estimado:** 15-30 minutos (Opção 1) ou 5 minutos (Opção 2)
