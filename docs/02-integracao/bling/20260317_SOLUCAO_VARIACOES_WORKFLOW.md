# Solução: Corrigir Cadastro de Variações no Workflow

## Estratégia de Correção

### Problema Atual
O workflow está cadastrando variações como produtos PAI porque o fluxo é:
```
Webhook → Buscar Dados → Upsert products_bling → Verificar se é Pai
```

### Solução Proposta
Modificar o fluxo para:
```
Webhook → Buscar Dados → VERIFICAR SE É VARIAÇÃO → 
  ├─ Se VARIAÇÃO: Ignorar (será cadastrada pelo produto pai)
  └─ Se PAI: Continuar com upsert em products_bling
```

## Implementação

### 1. Adicionar Nó de Verificação Após "Pega mais dados do ID Produto1"

Criar um nó JavaScript que verifica se o produto é uma variação:

```javascript
// Verifica se o produto é uma VARIAÇÃO
const productData = $json.data;

// Se o produto TEM variacao.produtoPai.id, ele É uma variação
if (productData.variacao && productData.variacao.produtoPai && productData.variacao.produtoPai.id) {
  return [{
    json: {
      isVariation: true,
      isParentProduct: false,
      message: 'Produto é uma variação - será ignorado',
      productId: productData.id,
      productName: productData.nome,
      parentId: productData.variacao.produtoPai.id,
      productData: { data: productData }
    }
  }];
}

// Se chegou aqui, é um produto PAI
return [{
  json: {
    isVariation: false,
    isParentProduct: true,
    productId: productData.id,
    productName: productData.nome,
    productData: { data: productData }
  }
}];
```

### 2. Adicionar Nó IF para Filtrar Variações

Após o nó de verificação, adicionar um IF que:
- Se `isVariation === true`: Vai para um nó "Log - Variação Ignorada" e para
- Se `isVariation === false`: Continua com o fluxo normal (Verifica se produto existe1)

### 3. Fluxo Completo Corrigido

```
Webhook1
  ↓
Pegar Acess Token1
  ↓
Loop Over Items1
  ↓
Wait9
  ↓
Pega mais dados do ID Produto1
  ↓
[NOVO] Verificar se é Variação ← ADICIONAR AQUI
  ↓
[NOVO] É Variação? (IF) ← ADICIONAR AQUI
  ├─ TRUE → Log - Variação Ignorada → FIM
  └─ FALSE → Verifica se produto existe1
              ↓
              Wait
              ↓
              Processa Resultado1
              ↓
              Detecta Mudanças
              ↓
              Tem mudanças?
              ├─ TRUE → Upsert no banco (Cria ou Atualiza)
              └─ FALSE → Log - Sem Mudanças
```

## Benefícios

1. ✅ Variações não serão mais cadastradas como produtos PAI
2. ✅ Apenas produtos PAI serão cadastrados em `products_bling`
3. ✅ Variações serão cadastradas pelo nó que busca variações do produto pai
4. ✅ Frontend mostrará apenas produtos PAI, não variações duplicadas

## Limpeza de Dados

Após implementar a correção, será necessário limpar os dados incorretos:

```sql
-- Deletar variações que foram cadastradas incorretamente como produtos PAI
DELETE FROM products_bling 
WHERE sku LIKE '%_0%' -- Variações têm _001, _002, etc no SKU
  AND sku != 'YEIZ_COPO-TÉRMICO-260ML-C'; -- Manter apenas o produto PAI
```

## Próximos Passos

1. ✅ Documentar o problema
2. ⏳ Implementar a correção no workflow
3. ⏳ Testar com um produto que tem variações
4. ⏳ Limpar dados incorretos do banco
5. ⏳ Validar no frontend
