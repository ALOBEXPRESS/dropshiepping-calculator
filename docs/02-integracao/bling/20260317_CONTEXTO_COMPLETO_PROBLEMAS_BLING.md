# Contexto Completo: Problemas Bling e Soluções

## 📝 Histórico

### Problema Original
Usuário relatou 3 problemas simultâneos:

1. **Filtro "Não Categorizado" travado**
   - Sintoma: Só aparece 1 produto em "Produtos integrados"
   - Causa: Filtro `supplierSku: 'uncategorized'` ficou ativo no localStorage

2. **FK Constraint Error**
   - Erro: `insert or update on table "products_bling" violates foreign key constraint "products_bling_parent_fkey"`
   - Produtos afetados:
     - Camisa Rock In Rio Cor:Preto;Tamanho:M (SKU: C12591M)
     - Camisa Rock In Rio Cor:Vermelho;Tamanho:G (SKU: C12596G)
   - Causa: Workflow tentava inserir variações antes dos produtos pai existirem

3. **Duplicate SKU Error**
   - Erro: `duplicate key value violates unique constraint "products_bling_sku_key"`
   - Produto afetado: CORRENTE DE AÇO 3 EM 1 FINA (SKU: 2023171245)
   - Causa: Produto já existe no banco e workflow tentava inserir novamente

---

## 🔧 Correções Aplicadas

### 1. Correção do Filtro "Não Categorizado"

#### Arquivo: `src/hooks/useProductsBling.ts`

**Antes (linha 117-119)**:
```typescript
if (currentFilters.supplierSku === 'uncategorized') {
  query = query.or('sku_fornecedor.is.null,sku_fornecedor.not.in.(ALOBEXPRESS_01,ALOBFOR_DROP_01)');
}
```

**Problema**: Filtrava produtos que NÃO têm fornecedor OU que não são dos fornecedores específicos. Isso fazia quase todos os produtos serem filtrados.

**Depois (linha 117-119)**:
```typescript
if (currentFilters.supplierSku === 'uncategorized') {
  query = query.is('sku_fornecedor', null);
}
```

**Solução**: Agora filtra apenas produtos que realmente não têm fornecedor (sku_fornecedor IS NULL).

**Status**: ✅ Corrigido no código

**Ação do usuário**: Executar `localStorage.clear(); location.reload();` no console do navegador para limpar o filtro travado.

---

### 2. Solução para FK Constraint Error

#### Problema Técnico

A constraint `products_bling_parent_fkey` garante que:
- Se um produto tem `id_produto_pai` (é uma variação)
- Então deve existir um produto pai com `bling_id = id_produto_pai`

**Exemplo do erro**:
```
Produto: Camisa Rock In Rio Cor:Preto;Tamanho:M
SKU: C12591M
id_produto_pai: 12345678 (produto pai "Camisa Rock In Rio")

Erro: Produto pai com bling_id=12345678 não existe no banco!
```

#### Causa Raiz

O workflow "Bling Cadastrar Produto" processa produtos na ordem que vêm da API:

```javascript
// Código atual (problemático)
const lista = $input.first().json.data; // [Produto A, Variação B, Produto C, ...]
const resultado = lista.map((item) => ({ json: { id: item.id } }));
return resultado;
```

Se a API retornar:
1. Produto A (pai) ✅
2. Variação B (pai: Produto C) ❌ ERRO! Produto C não existe ainda
3. Produto C (pai) ✅

#### Solução Implementada

**Estratégia**: Processar produtos em duas passadas

**Primeira Passada - Produtos Pai**:
```javascript
const lista = $input.first().json.data;
const produtosPai = [];
const variacoes = [];

lista.forEach((produto) => {
  if (!produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id) {
    produtosPai.push(produto);
  } else {
    variacoes.push(produto);
  }
});

// Processar APENAS produtos pai
const resultado = produtosPai.map((item) => ({ json: { id: item.id } }));
return resultado;
```

**Segunda Passada - Variações**:
```javascript
const lista = $input.first().json.data;
const produtosPai = [];
const variacoes = [];

lista.forEach((produto) => {
  if (!produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id) {
    produtosPai.push(produto);
  } else {
    variacoes.push(produto);
  }
});

// Processar APENAS variações
const resultado = variacoes.map((item) => ({ json: { id: item.id } }));
return resultado;
```

**Código Final (após resolver tudo)**:
```javascript
const lista = $input.first().json.data;
const produtosPai = [];
const variacoes = [];

lista.forEach((produto) => {
  if (!produto.variacao || !produto.variacao.produtoPai || !produto.variacao.produtoPai.id) {
    produtosPai.push(produto);
  } else {
    variacoes.push(produto);
  }
});

// Concatenar: primeiro produtos pai, depois variações
const produtosOrdenados = [...produtosPai, ...variacoes];
const resultado = produtosOrdenados.map((item) => ({ json: { id: item.id } }));
return resultado;
```

**Status**: ⏳ Aguardando usuário executar as duas passadas

**Ação do usuário**:
1. Modificar código "Parsear Requisição" para primeira passada
2. Executar workflow (insere produtos pai)
3. Modificar código "Parsear Requisição" para segunda passada
4. Executar workflow (insere variações)
5. Voltar código original melhorado

---

### 3. Solução para Duplicate SKU Error

#### Problema Técnico

A constraint `products_bling_sku_key` garante que:
- Cada SKU deve ser único na tabela `products_bling`

**Exemplo do erro**:
```
Produto: CORRENTE DE AÇO 3 EM 1 FINA
SKU: 2023171245

Erro: Já existe um produto com SKU=2023171245 no banco!
```

#### Causa Raiz

O workflow "Bling Cadastrar Produto" tenta inserir produtos que já existem no banco.

**Contexto do usuário**:
- Usuário tem um workflow separado para atualização de produtos
- Workflow de cadastro deve apenas inserir produtos novos
- Não precisa de UPSERT (insert or update)

#### Solução Implementada

**Configuração no nó "Create a row"**:
1. Settings (engrenagem) → "On Error" → **Continue**

Isso faz o workflow:
- ✅ Continuar processando próximos produtos
- ✅ Ignorar erros de SKU duplicado
- ✅ Não parar o workflow inteiro

**Status**: ⏳ Aguardando usuário configurar "On Error: Continue"

**Ação do usuário**:
1. Abrir workflow "Bling Cadastrar Produto"
2. Clicar no nó "Create a row"
3. Settings → "On Error" → Continue
4. Save

---

## 📊 Arquitetura do Banco

### Tabela: `products_bling`

```sql
CREATE TABLE products_bling (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  bling_id INTEGER UNIQUE,
  id_produto_pai INTEGER, -- FK para bling_id (produto pai)
  sku VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  -- ... outros campos
  
  CONSTRAINT products_bling_parent_fkey 
    FOREIGN KEY (id_produto_pai) 
    REFERENCES products_bling(bling_id)
);
```

### Relação Pai-Filho

```
┌─────────────────────────────────────────┐
│         Produto Pai                      │
│  bling_id: 12345678                      │
│  id_produto_pai: NULL                    │
│  name: "Camisa Rock In Rio"             │
│  sku: "C12590"                           │
└─────────────────────────────────────────┘
                  │
                  │ FK: id_produto_pai → bling_id
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│  Variação 1   │   │  Variação 2   │
│ bling_id:     │   │ bling_id:     │
│   12345679    │   │   12345680    │
│ id_produto_   │   │ id_produto_   │
│   pai:        │   │   pai:        │
│   12345678    │   │   12345678    │
│ name:         │   │ name:         │
│   "...Preto;  │   │   "...Verm;   │
│    Tamanho:M" │   │    Tamanho:G" │
│ sku:          │   │ sku:          │
│   "C12591M"   │   │   "C12596G"   │
└───────────────┘   └───────────────┘
```

---

## 🔄 Fluxo do Workflow

### Workflow: "Bling Cadastrar Produto"

```
1. Schedule Trigger (a cada 5 horas)
   OU
   Manual Trigger (quando clicar "Execute workflow")
   │
   ▼
2. Pegar Refresh Token (Supabase)
   │
   ▼
3. HTTP Request (obter access_token)
   │
   ▼
4. Atualizar Token (Supabase)
   │
   ▼
5. HTTP Obter Produtos (API Bling - lista de 100 produtos)
   │
   ▼
6. Parsear Requisição (JavaScript - filtrar/ordenar)
   │
   ▼
7. Split Out (separar em items individuais)
   │
   ▼
8. Loop Over Items (processar 1 por vez)
   │
   ▼
9. HTTP Obter Produtos1 (API Bling - detalhes do produto)
   │
   ▼
10. If (verificar se tem erro)
    │
    ├─ TRUE (erro) → Append row in sheet (Google Sheets - log de erros)
    │
    └─ FALSE (sucesso) → Create a row (Supabase - inserir produto)
       │
       ▼
11. If1 (verificar se inserção teve erro)
    │
    ├─ TRUE (erro) → Append row in sheet1 (Google Sheets - log de erros)
    │
    └─ FALSE (sucesso) → Wait (aguardar próximo item)
       │
       ▼
12. Replace Me (voltar para Loop Over Items)
```

### Nós Importantes

1. **Parsear Requisição** (nó 6)
   - Tipo: Code (JavaScript)
   - Função: Filtrar e ordenar produtos
   - **ESTE É O NÓ QUE PRECISA SER MODIFICADO**

2. **Create a row** (nó 10)
   - Tipo: Supabase
   - Função: Inserir produto no banco
   - **CONFIGURAR "On Error: Continue"**

3. **HTTP Obter Produtos1** (nó 9)
   - Tipo: HTTP Request
   - Função: Buscar detalhes do produto na API Bling
   - **JÁ CONFIGURADO "On Error: Continue"**

---

## 📚 Documentação Criada

### Documentos Principais

1. **`docs/RESUMO_ACOES_URGENTES_BLING.md`**
   - Passo a passo detalhado com todos os códigos
   - Instruções claras para cada ação
   - Tempo estimado para cada etapa
   - FAQ com perguntas comuns

2. **`docs/DIAGRAMA_FLUXO_BLING.md`**
   - Diagramas visuais do fluxo do workflow
   - Comparação antes/depois
   - Explicação visual dos problemas e soluções

3. **`docs/QUICK_REFERENCE_BLING.md`**
   - Referência rápida com códigos prontos
   - Comandos úteis
   - Checklist de ações

4. **`docs/ACOES_IMEDIATAS_BLING.md`**
   - Instruções passo a passo
   - Códigos para copiar e colar
   - Queries SQL para verificação

5. **`docs/SOLUCAO_COMPLETA_PROBLEMAS_BLING.md`**
   - Documentação técnica completa
   - Análise detalhada de cada problema
   - Múltiplas soluções para cada caso

6. **`docs/RESETAR_FILTRO_PRODUTOS_INTEGRADOS.md`**
   - Como resetar filtro travado
   - Múltiplas opções de solução
   - Troubleshooting

7. **`docs/CONTEXTO_COMPLETO_PROBLEMAS_BLING.md`** (este arquivo)
   - Contexto completo de todos os problemas
   - Histórico de correções
   - Arquitetura do banco
   - Fluxo do workflow

### Documentos de Referência

- `docs/SOLUCAO_FK_PRODUCTS_BLING_PARENT.md` - Detalhes sobre FK constraint
- `docs/SOLUCAO_DUPLICATE_SKU_BLING.md` - Detalhes sobre SKU duplicado
- `docs/INSTRUCOES_CORRIGIR_WORKFLOW_BLING.md` - Instruções antigas (substituídas)
- `docs/INSTRUCOES_CORRIGIR_DUPLICATE_SKU.md` - Instruções antigas (substituídas)

---

## ✅ Checklist de Ações

### Ações Imediatas (Usuário)

- [ ] **URGENTE**: Limpar localStorage
  - Console: `localStorage.clear(); location.reload();`
  - Tempo: 30 segundos
  - Resultado: Todos os produtos aparecem

- [ ] Configurar "On Error: Continue"
  - Nó "Create a row" → Settings → On Error → Continue
  - Tempo: 2 minutos
  - Resultado: Workflow ignora erros de SKU duplicado

- [ ] Primeira passada - Produtos Pai
  - Modificar código "Parsear Requisição"
  - Executar workflow
  - Tempo: 5 minutos
  - Resultado: Todos os produtos pai inseridos

- [ ] Segunda passada - Variações
  - Modificar código "Parsear Requisição"
  - Executar workflow
  - Tempo: 5 minutos
  - Resultado: Todas as variações inseridas

- [ ] Verificar no banco
  - Executar queries SQL
  - Tempo: 2 minutos
  - Resultado: Variações órfãs = 0

- [ ] Voltar código original
  - Modificar código "Parsear Requisição"
  - Salvar workflow
  - Tempo: 1 minuto
  - Resultado: Workflow pronto para uso normal

### Ações Futuras (Opcional)

- [ ] Criar workflow de validação
  - Verificar variações órfãs periodicamente
  - Alertar se houver problemas

- [ ] Melhorar logging
  - Adicionar mais logs no workflow
  - Facilitar troubleshooting

- [ ] Documentar processo
  - Criar guia para novos produtos
  - Documentar estrutura de variações

---

## 🔍 Queries SQL Úteis

### Verificar Total de Produtos

```sql
SELECT COUNT(*) as total
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389';
```

### Verificar Produtos Pai vs Variações

```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE id_produto_pai IS NULL) as produtos_pai,
  COUNT(*) FILTER (WHERE id_produto_pai IS NOT NULL) as variacoes
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389';
```

### Verificar Variações Órfãs (DEVE SER 0)

```sql
SELECT 
  pb1.id, 
  pb1.bling_id, 
  pb1.name, 
  pb1.sku, 
  pb1.id_produto_pai
FROM products_bling pb1
LEFT JOIN products_bling pb2 ON pb1.id_produto_pai = pb2.bling_id
WHERE pb1.organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
  AND pb1.id_produto_pai IS NOT NULL 
  AND pb2.id IS NULL;
```

### Verificar Produtos Duplicados por SKU

```sql
SELECT 
  sku, 
  COUNT(*) as count,
  STRING_AGG(name, ' | ') as names
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
GROUP BY sku
HAVING COUNT(*) > 1;
```

### Ver Últimos Produtos Inseridos

```sql
SELECT 
  id,
  bling_id,
  name,
  sku,
  id_produto_pai,
  updated_at
FROM products_bling
WHERE organization_id = '28b4b443-03fd-4a2d-b596-9dcaf142b389'
ORDER BY updated_at DESC
LIMIT 20;
```

---

## 🆘 Troubleshooting

### Problema: Ainda aparece só 1 produto após limpar localStorage

**Possíveis causas**:
1. Cache do navegador não foi limpo
2. Problema de permissões RLS no Supabase
3. Filtro ainda ativo em outro lugar

**Soluções**:
1. Limpar cache completo do navegador (Ctrl+Shift+Delete)
2. Verificar RLS policies no Supabase
3. Verificar se há outros filtros ativos na interface

### Problema: Workflow continua dando FK constraint error

**Possíveis causas**:
1. Código "Parsear Requisição" não foi modificado corretamente
2. Produtos pai não foram inseridos ainda
3. API Bling retornou produtos em ordem diferente

**Soluções**:
1. Verificar se código foi copiado corretamente
2. Executar primeira passada novamente
3. Verificar logs do workflow no n8n

### Problema: Muitos produtos com SKU duplicado

**Possíveis causas**:
1. Workflow foi executado múltiplas vezes
2. Produtos foram importados de outra fonte
3. API Bling retornou produtos duplicados

**Soluções**:
1. Limpar produtos duplicados no banco
2. Configurar "On Error: Continue"
3. Verificar se API Bling está retornando dados corretos

---

## 📞 Suporte

Se precisar de ajuda:

1. Tire prints da tela
2. Copie mensagens de erro completas
3. Execute queries SQL e envie resultados
4. Verifique logs do n8n
5. Verifique console do navegador (F12)

---

**Última atualização**: 2026-03-01
**Autor**: Kiro AI Assistant
**Versão**: 1.0
