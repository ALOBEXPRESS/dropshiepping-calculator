# Diagrama de Fluxo: Workflow Bling

## Fluxo Atual (Com Problemas)

```
┌─────────────────────────────────────────────────────────────┐
│                    API Bling (100 produtos)                  │
│                                                              │
│  - 80 produtos pai                                           │
│  - 20 variações (algumas sem produto pai no banco)          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Parsear Requisição (código atual)               │
│                                                              │
│  Retorna todos os 100 produtos na ordem que vieram           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Loop Over Items                           │
│                                                              │
│  Processa 1 produto por vez                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              HTTP Obter Produtos (detalhes)                  │
│                                                              │
│  Busca detalhes do produto na API Bling                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Create a row (Supabase)                   │
│                                                              │
│  Tenta inserir no banco                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
            ┌───────────┐   ┌───────────────┐
            │  SUCESSO  │   │     ERRO      │
            └───────────┘   └───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  FK Constraint Error          │
                    │  (variação sem produto pai)   │
                    │                               │
                    │  OU                           │
                    │                               │
                    │  Duplicate SKU Error          │
                    │  (produto já existe)          │
                    └───────────────────────────────┘
```

## Problema Identificado

❌ **Variações podem ser processadas ANTES dos produtos pai**

Exemplo:
1. API retorna: [Produto A, Variação B (pai: Produto C), Produto C]
2. Workflow tenta inserir Variação B antes de Produto C existir
3. Banco rejeita: FK constraint error

## Solução: Duas Passadas

### Primeira Passada - Produtos Pai

```
┌─────────────────────────────────────────────────────────────┐
│                    API Bling (100 produtos)                  │
│                                                              │
│  - 80 produtos pai                                           │
│  - 20 variações                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Parsear Requisição (PRIMEIRA PASSADA)                │
│                                                              │
│  Filtra APENAS produtos pai (80 produtos)                    │
│  Ignora variações (20 produtos)                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Loop Over Items                           │
│                                                              │
│  Processa 80 produtos pai                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              HTTP Obter Produtos (detalhes)                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Create a row (Supabase)                   │
│                                                              │
│  Insere 80 produtos pai no banco                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ✅ SUCESSO!
            Todos os produtos pai inseridos
```

### Segunda Passada - Variações

```
┌─────────────────────────────────────────────────────────────┐
│                    API Bling (100 produtos)                  │
│                                                              │
│  - 80 produtos pai (já no banco)                             │
│  - 20 variações                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Parsear Requisição (SEGUNDA PASSADA)                 │
│                                                              │
│  Ignora produtos pai (80 produtos)                           │
│  Filtra APENAS variações (20 produtos)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Loop Over Items                           │
│                                                              │
│  Processa 20 variações                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              HTTP Obter Produtos (detalhes)                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Create a row (Supabase)                   │
│                                                              │
│  Insere 20 variações no banco                                │
│  (produtos pai já existem!)                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ✅ SUCESSO!
            Todas as variações inseridas
```

## Fluxo Final (Código Original Melhorado)

Depois que todos os produtos estiverem no banco, você pode voltar o código original:

```
┌─────────────────────────────────────────────────────────────┐
│                    API Bling (100 produtos)                  │
│                                                              │
│  - 80 produtos pai                                           │
│  - 20 variações                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         Parsear Requisição (CÓDIGO MELHORADO)                │
│                                                              │
│  1. Separa produtos pai e variações                          │
│  2. Ordena: [80 produtos pai, 20 variações]                  │
│  3. Retorna lista ordenada (100 produtos)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Loop Over Items                           │
│                                                              │
│  Processa 100 produtos na ordem correta                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              HTTP Obter Produtos (detalhes)                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Create a row (Supabase)                   │
│                    (On Error: Continue)                      │
│                                                              │
│  - Insere produtos pai primeiro                              │
│  - Depois insere variações                                   │
│  - Ignora SKUs duplicados                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ✅ SUCESSO!
        Todos os produtos inseridos corretamente
```

## Comparação: Antes vs Depois

### Antes (Com Problemas)

```
Ordem de processamento:
1. Produto A (pai) ✅
2. Variação B (pai: Produto C) ❌ ERRO! Produto C não existe
3. Produto C (pai) ✅
4. Variação D (pai: Produto A) ✅
```

### Depois (Código Melhorado)

```
Ordem de processamento:
1. Produto A (pai) ✅
2. Produto C (pai) ✅
3. Variação B (pai: Produto C) ✅ Produto C já existe!
4. Variação D (pai: Produto A) ✅ Produto A já existe!
```

## Configuração "On Error: Continue"

```
┌─────────────────────────────────────────────────────────────┐
│                    Create a row (Supabase)                   │
│                                                              │
│  Tenta inserir produto                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
            ┌───────────┐   ┌───────────────┐
            │  SUCESSO  │   │     ERRO      │
            │           │   │  (SKU duplic) │
            └─────┬─────┘   └───────┬───────┘
                  │                 │
                  │                 │
                  └────────┬────────┘
                           │
                           ▼
                  ✅ CONTINUA WORKFLOW
                  (não para no erro)
```

### Sem "On Error: Continue"

```
┌─────────────────────────────────────────────────────────────┐
│                    Create a row (Supabase)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
            ┌───────────┐   ┌───────────────┐
            │  SUCESSO  │   │     ERRO      │
            │           │   │  (SKU duplic) │
            └─────┬─────┘   └───────┬───────┘
                  │                 │
                  │                 ▼
                  │         ❌ WORKFLOW PARA
                  │         (não processa mais nada)
                  │
                  ▼
          ✅ CONTINUA
```

## Resumo Visual

### Problema

```
❌ Variação → Banco → ERRO (produto pai não existe)
```

### Solução Temporária (Duas Passadas)

```
✅ Passada 1: Produtos Pai → Banco → SUCESSO
✅ Passada 2: Variações → Banco → SUCESSO (pai já existe)
```

### Solução Permanente (Código Melhorado)

```
✅ Produtos Pai → Banco → SUCESSO
✅ Variações → Banco → SUCESSO (pai já existe)
(tudo em uma única execução)
```

---

**Última atualização**: 2026-03-01
