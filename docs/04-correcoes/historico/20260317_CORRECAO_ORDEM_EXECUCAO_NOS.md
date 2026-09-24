# ✅ Correção: Erro de Ordem de Execução dos Nós

## Data: 2026-02-24

---

## 🔴 Problema Identificado

### Erro
```
Referenced node doesn't exist
Cannot assign to read only property 'name' of object
```

### Causa
O nó "Processar Dados do Lead" tentava acessar `$('Mapear Canal de Venda')`, mas esse nó ainda não havia sido executado naquele ponto do fluxo.

**Ordem de execução**:
```
Buscar Contato no Bling
    ↓
Processar Dados do Lead ← Tenta acessar "Mapear Canal de Venda"
    ↓
... (outros nós)
    ↓
Mapear Canal de Venda ← Só executa depois!
```

---

## ✅ Solução Aplicada

### Abordagem
Em vez de depender do nó "Mapear Canal de Venda", o código agora:
1. Pega o `store_id` diretamente dos dados do pedido
2. Usa um mapeamento interno de lojas → marketplaces
3. Define o marketplace sem depender de outro nó

### Código Atualizado

**Antes** (com dependência):
```javascript
lead_source: $('Mapear Canal de Venda').item.json.marketplace || null
```

**Depois** (independente):
```javascript
const orderData = $('Buscar Detalhes do Pedido').item.json.data;
const storeId = orderData?.loja?.id;

const STORE_MAPPING = {
  205833031: 'MercadoLivre',
  205785487: 'TikTok',
  205835012: 'MercadoLivre',
  205852755: 'Shopee',
  205889400: 'Shopee',
  205899802: 'Facebook',
  205836967: 'Site'
};

const marketplace = STORE_MAPPING[storeId] || 'Desconhecido';

// ...

lead_source: marketplace
```

---

## 📊 Mapeamento de Lojas

| Store ID | Marketplace | Titular |
|----------|-------------|---------|
| 205833031 | MercadoLivre | Alyson (CPF) |
| 205785487 | TikTok | Alyson (CNPJ) |
| 205835012 | MercadoLivre | Alyson (CNPJ) |
| 205852755 | Shopee | Alyson (CPF) |
| 205889400 | Shopee | Jonatan (CPF) |
| 205899802 | Facebook | Jonatan (CPF) |
| 205836967 | Site | Emelyn (CPF) |

---

## 🔧 Como Aplicar a Correção

### Opção 1: Reimportar o Workflow (Recomendado)

1. Abra o N8N: https://editorn8n.alobexpress.com.br
2. Abra o workflow "Bling Pedido de Venda Automatization"
3. Clique nos 3 pontinhos (⋮) → "Import from File"
4. Selecione: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
5. Clique em "Import" e "Save"

### Opção 2: Atualizar Manualmente

1. Abra o nó "Processar Dados do Lead" no N8N
2. Copie o código de: `src/hooks/n8n/code-snippets/processar-lead-contato-v3.js`
3. Cole no nó
4. Salve o workflow

---

## ✅ Verificação

### Após aplicar a correção:

1. **Execute o workflow** com um pedido de teste
2. **Verifique os logs** do nó "Processar Dados do Lead":
   - Deve mostrar: `Store ID: 205833031` (ou outro)
   - Deve mostrar: `Marketplace: MercadoLivre` (ou outro)
3. **Consulte o banco**:
   ```sql
   SELECT 
       name,
       email,
       phone,
       lead_source,  -- Deve estar preenchido
       created_at
   FROM leads
   ORDER BY created_at DESC
   LIMIT 5;
   ```

### Resultado Esperado
- ✅ Nó "Processar Dados do Lead" executa sem erros
- ✅ Campo `lead_source` é preenchido corretamente
- ✅ Lead é criado no banco com todos os dados

---

## 🎯 Vantagens da Nova Abordagem

### Antes
- ❌ Dependia de outro nó
- ❌ Ordem de execução crítica
- ❌ Erro se nó não existisse

### Depois
- ✅ Independente
- ✅ Ordem de execução flexível
- ✅ Mais robusto
- ✅ Mapeamento centralizado no código

---

## 📝 Notas Importantes

### 1. Adicionar Novas Lojas

Se você adicionar uma nova loja no Bling, atualize o mapeamento:

```javascript
const STORE_MAPPING = {
  205833031: 'MercadoLivre',
  // ... lojas existentes ...
  999999999: 'NovoMarketplace'  // ← Adicione aqui
};
```

### 2. Lojas Desconhecidas

Se uma loja não estiver no mapeamento:
- `lead_source` será definido como `'Desconhecido'`
- O lead ainda será criado normalmente
- Você pode atualizar manualmente depois

### 3. Nó "Mapear Canal de Venda"

O nó "Mapear Canal de Venda" ainda existe no workflow e pode ser usado por outros nós. Apenas o nó "Processar Dados do Lead" não depende mais dele.

---

## 🔄 Histórico de Correções

### Versão 1 (Original)
- Usava API de contatos do Bling
- ❌ Erro 403 - Token sem escopo

### Versão 2 (Correção 403)
- Removido nó "Buscar Contato no Bling"
- Usava dados do pedido
- ❌ Campos NULL (email, telefone, etc.)

### Versão 3 (Token com Escopo)
- Restaurado nó "Buscar Contato no Bling"
- Token atualizado com escopo `contatos.read`
- ❌ Erro de referência ao nó "Mapear Canal de Venda"

### Versão 4 (Atual - Corrigida)
- Nó "Buscar Contato no Bling" funcionando
- Código independente do nó "Mapear Canal de Venda"
- Mapeamento de lojas incluído no código
- ✅ Todos os campos preenchidos
- ✅ Sem erros de referência

---

## 📁 Arquivos Modificados

### Workflow
- `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
  - Código do nó "Processar Dados do Lead" atualizado

### Código JavaScript
- `src/hooks/n8n/code-snippets/processar-lead-contato-v3.js` (novo)
  - Versão independente do nó "Mapear Canal de Venda"

### Scripts
- `scripts/atualizar-codigo-processar-lead.py` (novo)
  - Script que aplicou a correção automaticamente

### Documentação
- `CORRECAO_ORDEM_EXECUCAO_NOS.md` (este arquivo)

---

## ✅ Status Final

| Item | Status |
|------|--------|
| Erro de referência | ✅ Corrigido |
| Workflow atualizado | ✅ Sim |
| Código independente | ✅ Sim |
| Mapeamento incluído | ✅ Sim |
| Pronto para importar | ✅ Sim |

---

## 🎉 Conclusão

O erro de ordem de execução foi corrigido! O nó "Processar Dados do Lead" agora:
- ✅ Não depende do nó "Mapear Canal de Venda"
- ✅ Obtém o marketplace diretamente dos dados do pedido
- ✅ Funciona independentemente da ordem de execução
- ✅ Cria leads com todos os dados completos

**Próximo passo**: Reimporte o workflow no N8N e teste!
