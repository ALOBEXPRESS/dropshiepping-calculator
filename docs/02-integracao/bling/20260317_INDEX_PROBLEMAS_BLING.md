# 📚 Índice: Documentação Problemas Bling

## 🎯 Comece Aqui

Se você está com problemas na integração Bling, comece por um destes documentos:

### 🚀 Para Resolver Rápido (Recomendado)
- **[GUIA_VISUAL_PASSO_A_PASSO.md](GUIA_VISUAL_PASSO_A_PASSO.md)** - Guia visual com emojis e instruções claras

### 📋 Para Entender o Contexto
- **[RESUMO_ACOES_URGENTES_BLING.md](RESUMO_ACOES_URGENTES_BLING.md)** - Resumo executivo com todas as ações

### 🔍 Para Referência Rápida
- **[QUICK_REFERENCE_BLING.md](QUICK_REFERENCE_BLING.md)** - Códigos prontos e comandos úteis

---

## 📖 Documentação Completa

### Documentos Principais

#### 1. Guias de Ação
- **[GUIA_VISUAL_PASSO_A_PASSO.md](GUIA_VISUAL_PASSO_A_PASSO.md)**
  - Guia visual passo a passo
  - Instruções com emojis
  - Tempo estimado para cada etapa
  - Como saber se funcionou
  - **Recomendado para iniciantes**

- **[RESUMO_ACOES_URGENTES_BLING.md](RESUMO_ACOES_URGENTES_BLING.md)**
  - Resumo executivo
  - Todas as ações necessárias
  - Códigos completos
  - FAQ
  - **Recomendado para quem quer resolver rápido**

- **[ACOES_IMEDIATAS_BLING.md](ACOES_IMEDIATAS_BLING.md)**
  - Instruções passo a passo
  - Códigos para copiar e colar
  - Queries SQL para verificação
  - **Versão anterior, ainda útil**

#### 2. Referências Rápidas
- **[QUICK_REFERENCE_BLING.md](QUICK_REFERENCE_BLING.md)**
  - Códigos prontos
  - Comandos úteis
  - Checklist de ações
  - **Ideal para consulta rápida**

#### 3. Documentação Técnica
- **[CONTEXTO_COMPLETO_PROBLEMAS_BLING.md](CONTEXTO_COMPLETO_PROBLEMAS_BLING.md)**
  - Contexto completo de todos os problemas
  - Histórico de correções
  - Arquitetura do banco
  - Fluxo do workflow
  - **Ideal para entender o contexto técnico**

- **[SOLUCAO_COMPLETA_PROBLEMAS_BLING.md](SOLUCAO_COMPLETA_PROBLEMAS_BLING.md)**
  - Documentação técnica completa
  - Análise detalhada de cada problema
  - Múltiplas soluções para cada caso
  - **Ideal para troubleshooting avançado**

#### 4. Diagramas e Visualizações
- **[DIAGRAMA_FLUXO_BLING.md](DIAGRAMA_FLUXO_BLING.md)**
  - Diagramas visuais do fluxo do workflow
  - Comparação antes/depois
  - Explicação visual dos problemas e soluções
  - **Ideal para entender visualmente**

---

## 🔍 Documentação por Problema

### Problema 1: Filtro "Não Categorizado" Travado

**Sintoma**: Só aparece 1 produto em "Produtos integrados"

**Documentos**:
- [GUIA_VISUAL_PASSO_A_PASSO.md](GUIA_VISUAL_PASSO_A_PASSO.md) - Passo 1
- [RESETAR_FILTRO_PRODUTOS_INTEGRADOS.md](RESETAR_FILTRO_PRODUTOS_INTEGRADOS.md) - Detalhes específicos
- [QUICK_REFERENCE_BLING.md](QUICK_REFERENCE_BLING.md) - Comando rápido

**Solução Rápida**:
```javascript
localStorage.clear(); location.reload();
```

---

### Problema 2: FK Constraint Error

**Sintoma**: `insert or update on table "products_bling" violates foreign key constraint "products_bling_parent_fkey"`

**Documentos**:
- [GUIA_VISUAL_PASSO_A_PASSO.md](GUIA_VISUAL_PASSO_A_PASSO.md) - Passos 3 e 4
- [SOLUCAO_FK_PRODUCTS_BLING_PARENT.md](SOLUCAO_FK_PRODUCTS_BLING_PARENT.md) - Detalhes técnicos
- [DIAGRAMA_FLUXO_BLING.md](DIAGRAMA_FLUXO_BLING.md) - Visualização do problema

**Solução**: Executar workflow em duas passadas (produtos pai → variações)

---

### Problema 3: Duplicate SKU Error

**Sintoma**: `duplicate key value violates unique constraint "products_bling_sku_key"`

**Documentos**:
- [GUIA_VISUAL_PASSO_A_PASSO.md](GUIA_VISUAL_PASSO_A_PASSO.md) - Passo 2
- [SOLUCAO_DUPLICATE_SKU_BLING.md](SOLUCAO_DUPLICATE_SKU_BLING.md) - Detalhes específicos
- [INSTRUCOES_CORRIGIR_DUPLICATE_SKU.md](INSTRUCOES_CORRIGIR_DUPLICATE_SKU.md) - Instruções antigas

**Solução**: Configurar "On Error: Continue" no nó "Create a row"

---

## 📂 Estrutura de Arquivos

```
docs/
├── INDEX_PROBLEMAS_BLING.md (este arquivo)
│
├── 🚀 Guias de Ação
│   ├── GUIA_VISUAL_PASSO_A_PASSO.md ⭐ RECOMENDADO
│   ├── RESUMO_ACOES_URGENTES_BLING.md ⭐ RECOMENDADO
│   └── ACOES_IMEDIATAS_BLING.md
│
├── 🔍 Referências Rápidas
│   └── QUICK_REFERENCE_BLING.md ⭐ RECOMENDADO
│
├── 📖 Documentação Técnica
│   ├── CONTEXTO_COMPLETO_PROBLEMAS_BLING.md
│   └── SOLUCAO_COMPLETA_PROBLEMAS_BLING.md
│
├── 📊 Diagramas
│   └── DIAGRAMA_FLUXO_BLING.md
│
└── 🔧 Problemas Específicos
    ├── RESETAR_FILTRO_PRODUTOS_INTEGRADOS.md
    ├── SOLUCAO_FK_PRODUCTS_BLING_PARENT.md
    ├── SOLUCAO_DUPLICATE_SKU_BLING.md
    ├── INSTRUCOES_CORRIGIR_WORKFLOW_BLING.md (antigo)
    └── INSTRUCOES_CORRIGIR_DUPLICATE_SKU.md (antigo)
```

---

## 🎯 Fluxo de Leitura Recomendado

### Para Resolver Rápido (15 minutos)

1. **[GUIA_VISUAL_PASSO_A_PASSO.md](GUIA_VISUAL_PASSO_A_PASSO.md)**
   - Siga os 6 passos
   - Execute os comandos
   - Verifique os resultados

2. **[QUICK_REFERENCE_BLING.md](QUICK_REFERENCE_BLING.md)**
   - Use como referência durante a execução
   - Copie e cole os códigos

### Para Entender o Contexto (30 minutos)

1. **[CONTEXTO_COMPLETO_PROBLEMAS_BLING.md](CONTEXTO_COMPLETO_PROBLEMAS_BLING.md)**
   - Leia o histórico
   - Entenda a arquitetura
   - Veja o fluxo do workflow

2. **[DIAGRAMA_FLUXO_BLING.md](DIAGRAMA_FLUXO_BLING.md)**
   - Visualize os problemas
   - Entenda as soluções
   - Compare antes/depois

3. **[SOLUCAO_COMPLETA_PROBLEMAS_BLING.md](SOLUCAO_COMPLETA_PROBLEMAS_BLING.md)**
   - Análise técnica detalhada
   - Múltiplas soluções
   - Troubleshooting avançado

### Para Troubleshooting (quando algo não funciona)

1. **[SOLUCAO_COMPLETA_PROBLEMAS_BLING.md](SOLUCAO_COMPLETA_PROBLEMAS_BLING.md)**
   - Seção "Plano de Ação Recomendado"
   - Queries SQL úteis

2. **[CONTEXTO_COMPLETO_PROBLEMAS_BLING.md](CONTEXTO_COMPLETO_PROBLEMAS_BLING.md)**
   - Seção "Troubleshooting"
   - Queries SQL úteis

3. **Documentos específicos do problema**:
   - [RESETAR_FILTRO_PRODUTOS_INTEGRADOS.md](RESETAR_FILTRO_PRODUTOS_INTEGRADOS.md)
   - [SOLUCAO_FK_PRODUCTS_BLING_PARENT.md](SOLUCAO_FK_PRODUCTS_BLING_PARENT.md)
   - [SOLUCAO_DUPLICATE_SKU_BLING.md](SOLUCAO_DUPLICATE_SKU_BLING.md)

---

## 🔗 Links Rápidos

### Comandos Mais Usados

**Resetar filtro**:
```javascript
localStorage.clear(); location.reload();
```

**Verificar produtos no banco**:
```sql
SELECT COUNT(*) FROM products_bling 
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389';
```

**Verificar variações órfãs**:
```sql
SELECT pb1.sku, pb1.name
FROM products_bling pb1
LEFT JOIN products_bling pb2 ON pb1.id_produto_pai = pb2.bling_id
WHERE pb1.organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
  AND pb1.id_produto_pai IS NOT NULL 
  AND pb2.id IS NULL;
```

### Códigos Mais Usados

**Primeira passada (produtos pai)**:
- Ver [QUICK_REFERENCE_BLING.md](QUICK_REFERENCE_BLING.md) - Seção "Problema 2"

**Segunda passada (variações)**:
- Ver [QUICK_REFERENCE_BLING.md](QUICK_REFERENCE_BLING.md) - Seção "Problema 2"

**Código final**:
- Ver [QUICK_REFERENCE_BLING.md](QUICK_REFERENCE_BLING.md) - Seção "Código Final"

---

## 📊 Estatísticas da Documentação

- **Total de documentos**: 12
- **Documentos principais**: 3 (marcados com ⭐)
- **Tempo de leitura total**: ~2 horas
- **Tempo para resolver**: ~15 minutos (seguindo guia visual)

---

## 🆘 Precisa de Ajuda?

### Não Encontrou o que Procura?

1. Use a busca (Ctrl+F) neste índice
2. Leia o [CONTEXTO_COMPLETO_PROBLEMAS_BLING.md](CONTEXTO_COMPLETO_PROBLEMAS_BLING.md)
3. Verifique a seção "Troubleshooting" em cada documento

### Ainda com Dúvidas?

1. Tire prints da tela
2. Copie mensagens de erro completas
3. Execute queries SQL e envie resultados
4. Verifique logs do n8n
5. Verifique console do navegador (F12)

---

## 📝 Histórico de Atualizações

### Versão 1.0 (2026-03-01)
- Criação da documentação completa
- 12 documentos criados
- Guia visual passo a passo
- Diagramas de fluxo
- Referências rápidas

---

## 🎓 Glossário

- **FK Constraint**: Foreign Key Constraint - Restrição de chave estrangeira
- **SKU**: Stock Keeping Unit - Código único do produto
- **RLS**: Row Level Security - Segurança em nível de linha (Supabase)
- **UPSERT**: Update or Insert - Atualizar ou inserir
- **Variação**: Produto filho (ex: tamanho, cor)
- **Produto Pai**: Produto base (ex: camisa)
- **Variação Órfã**: Variação sem produto pai no banco

---

**Última atualização**: 2026-03-01  
**Versão**: 1.0  
**Autor**: Kiro AI Assistant
