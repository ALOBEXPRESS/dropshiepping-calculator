# Solução: Cadastrar Produto Pai Automaticamente

## Data
2026-03-05

## Problema

Quando o workflow tenta cadastrar uma variação (ex: C10473G), o produto pai (ex: C1047) pode não existir no banco, causando erro:

```
Key (id_produto_pai)=(16610437077) is not present in table "products_bling"
```

## Causa Raiz

Mesmo com o código de ordenação (produtos pai primeiro, variações depois), a API do Bling pode retornar produtos em ordem diferente na mesma página. Exemplo:

- Página 1 pode ter: Variação C10473G (item 5) e Produto Pai C1047 (item 80)
- O código ordena corretamente, MAS se o produto pai não estiver na mesma página, a variação tenta ser inserida antes

## Solução: Nó "Verificar Produto Pai"

Adicionar um nó ANTES do "Upsert Produto1" que:

1. Verifica se o produto atual é uma variação
2. Se for, verifica se o produto pai existe no banco
3. Se o pai NÃO existir, busca na API do Bling e cadastra PRIMEIRO
4. Depois permite que a variação seja cadastrada

## Como Implementar no N8N

### 1. Adicionar Nó "Verificar Produto Pai"

**Posição**: Entre "If2" e "Upsert Produto1"

**Tipo**: Code

**Código**: Copiar de `src/hooks/n8n/code-snippets/verificar-e-cadastrar-produto-pai.js`

### 2. Reconectar Fluxo

**ANTES:**
```
If2 (false) → Upsert Produto1
```

**DEPOIS:**
```
If2 (false) → Verificar Produto Pai → Upsert Produto1
```

### 3. Fluxo Completo

```
Loop Over Items1 (1 item)
  ↓
HTTP Obter Produtos3 (busca detalhes)
  ↓
If2 (verifica erro HTTP)
  ↓ (false = sem erro)
Verificar Produto Pai (NOVO - verifica e cadastra pai se necessário)
  ↓
Upsert Produto1 (cadastra produto atual)
  ↓
If3 (verifica erro UPSERT)
  ↓ (false = sem erro)
Wait2 (2 segundos)
  ↓
Replace Me1
  ↓
Loop Over Items1 (próximo item)
```

## Como Funciona

### Produto Simples ou Pai

```javascript
Produto: Camiseta Básica (C1047)
↓
Verificar Produto Pai: "É produto simples - pode cadastrar direto"
↓
Upsert Produto1: Cadastra C1047
✅ Sucesso
```

### Variação com Pai Existente

```javascript
Produto: Camiseta Azul G (C10473G)
↓
Verificar Produto Pai: "É variação do pai 16610437077"
↓
Verificar Produto Pai: "Pai já existe no banco"
↓
Upsert Produto1: Cadastra C10473G
✅ Sucesso
```

### Variação SEM Pai (PROBLEMA)

```javascript
Produto: Camiseta Azul G (C10473G)
↓
Verificar Produto Pai: "É variação do pai 16610437077"
↓
Verificar Produto Pai: "Pai NÃO existe no banco"
↓
Verificar Produto Pai: "Buscando pai na API do Bling..."
↓
Verificar Produto Pai: "Cadastrando pai C1047 primeiro..."
✅ Pai cadastrado
↓
Upsert Produto1: Cadastra C10473G
✅ Sucesso
```

## Benefícios

✅ Funciona mesmo se produtos pai e variações estiverem em páginas diferentes  
✅ Não depende da ordenação da API do Bling  
✅ Cadastra produto pai automaticamente quando necessário  
✅ Evita erro de FK constraint  
✅ Transparente - não afeta produtos simples  
✅ Logs detalhados para debug  

## Logs Esperados

### Produto Simples
```
========================================
VERIFICANDO PRODUTO PAI
========================================
Produto atual: Camiseta Básica (C1047)
✅ Produto simples ou pai - pode cadastrar direto
```

### Variação com Pai Existente
```
========================================
VERIFICANDO PRODUTO PAI
========================================
Produto atual: Camiseta Azul G (C10473G)
🔗 É uma variação do produto pai ID: 16610437077
🔍 Verificando se produto pai existe no banco...
✅ Produto pai já existe no banco - pode cadastrar variação
```

### Variação SEM Pai (Cadastra Automaticamente)
```
========================================
VERIFICANDO PRODUTO PAI
========================================
Produto atual: Camiseta Azul G (C10473G)
🔗 É uma variação do produto pai ID: 16610437077
🔍 Verificando se produto pai existe no banco...
⚠️ Produto pai NÃO existe - buscando na API do Bling...
✅ Produto pai encontrado: Camiseta Básica (C1047)
📝 Cadastrando produto pai...
✅ Produto pai cadastrado com sucesso!
========================================
```

## Alternativa: Buscar Produto Pai Manualmente

Se não quiser adicionar o nó, você pode:

1. Buscar o produto pai na API do Bling: `https://api.bling.com.br/Api/v3/produtos/16610437077`
2. Cadastrar manualmente via SQL:

```sql
INSERT INTO products_bling (
  organization_id, bling_id, name, sku, sale_price, situacao, updated_at
) VALUES (
  '28b4b443-03fd-4a2d-b596-9dcaf142b389',
  16610437077,
  'Camiseta Masculina Básica Lisa Algodão Premium',
  'C1047',
  32.00,
  'Ativo',
  NOW()
) ON CONFLICT (bling_id) DO NOTHING;
```

3. Executar o workflow novamente

Mas isso é manual e trabalhoso. A solução automática é melhor.

## Arquivos

- Código: `src/hooks/n8n/code-snippets/verificar-e-cadastrar-produto-pai.js`
- Documentação: `docs/SOLUCAO_PRODUTO_PAI_AUTOMATICO.md` (este arquivo)

---

**Status**: ✅ Solução criada  
**Testado**: Pendente (aguardando implementação no N8N)  
**Prioridade**: Crítica  
**Impacto**: Resolve erro de FK constraint definitivamente para produtos com variações
