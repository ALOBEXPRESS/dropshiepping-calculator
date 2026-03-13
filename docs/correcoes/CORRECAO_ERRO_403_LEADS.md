# ✅ Correção: Erro 403 no Sistema de Leads

## Data: 2026-02-24

---

## 🔴 Problema Identificado

### Erro
```
403 - insufficient_scope
The request requires higher privileges than provided by the access token
```

### Causa
O token do Bling não tem permissão (scope) para acessar a API de contatos (`/Api/v3/contatos/{id}`). O token foi gerado com escopos limitados que não incluem acesso a dados de contatos.

### Nó Afetado
- **Buscar Contato no Bling** (HTTP Request)
- Tentava buscar dados completos do contato na API do Bling
- Retornava erro 403 e interrompia o fluxo

---

## ✅ Solução Aplicada

### Abordagem
Em vez de buscar dados do contato via API (que requer scope adicional), usamos os dados que já vêm no pedido:
- `orderData.contato` - Dados básicos do contato
- `orderData.transporte.etiqueta` - Endereço completo de entrega

### Mudanças Realizadas

#### 1. Nó Removido
- ❌ **Buscar Contato no Bling** (HTTP Request) - REMOVIDO

#### 2. Nó Atualizado
- ✅ **Processar Dados do Lead** (Code JavaScript) - CÓDIGO ATUALIZADO

#### 3. Conexões Ajustadas
```
ANTES:
Validar Dados para NF → Buscar Contato no Bling → Processar Dados do Lead

DEPOIS:
Validar Dados para NF → Processar Dados do Lead
```

---

## 📝 Novo Código do Nó "Processar Dados do Lead"

O código agora:
1. Pega dados do pedido (`$('Buscar Detalhes do Pedido').item.json.data`)
2. Extrai dados do contato (`orderData.contato`)
3. Extrai dados da etiqueta de transporte (`orderData.transporte.etiqueta`)
4. Combina tudo para criar o lead

### Dados Disponíveis

| Campo | Origem | Disponível? |
|-------|--------|-------------|
| ID do contato | `contato.id` | ✅ Sim |
| Nome | `contato.nome` ou `etiqueta.nome` | ✅ Sim |
| Tipo de pessoa | `contato.tipoPessoa` (F=CPF, J=CNPJ) | ✅ Sim |
| Documento | `contato.numeroDocumento` | ✅ Sim |
| Email | - | ❌ Não (null) |
| Telefone | - | ❌ Não (null) |
| Endereço | `etiqueta.*` (8 campos) | ✅ Sim |
| Razão Social | - | ❌ Não (null) |
| Nome Fantasia | - | ❌ Não (null) |

### Campos que ficam NULL
- `email` - Não vem no pedido
- `phone` - Não vem no pedido
- `mobile_phone` - Não vem no pedido
- `ie` - Não vem no pedido
- `rg` - Não vem no pedido
- `company_name` - Não vem no pedido
- `trade_name` - Não vem no pedido

**Nota**: Esses campos podem ser preenchidos posteriormente se você conseguir um token com scope de contatos ou se implementar uma atualização manual.

---

## 🔧 Como Aplicar a Correção

### Opção 1: Reimportar o Workflow (Recomendado)

1. Abra o N8N: https://editorn8n.alobexpress.com.br
2. Abra o workflow "Bling Pedido de Venda Automatization"
3. Clique nos 3 pontinhos (⋮) → "Import from File"
4. Selecione: `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
5. Clique em "Import" e depois "Save"

### Opção 2: Atualizar Manualmente

1. **Deletar o nó**: "Buscar Contato no Bling"
2. **Atualizar o nó**: "Processar Dados do Lead"
   - Copie o código de: `src/hooks/n8n/code-snippets/processar-lead-contato-v2.js`
   - Cole no nó "Processar Dados do Lead"
3. **Reconectar**: "Validar Dados para NF" → "Processar Dados do Lead"
4. **Salvar** o workflow

---

## ✅ Verificação

### Após aplicar a correção:

1. **Execute o workflow** com um pedido de teste
2. **Verifique os logs** do nó "Processar Dados do Lead"
3. **Consulte o banco**:
   ```sql
   SELECT 
       name, 
       document_type,
       document_number,
       address_city,
       address_state,
       lead_source,
       created_at
   FROM leads
   ORDER BY created_at DESC
   LIMIT 5;
   ```

### Resultado Esperado
- ✅ Nó "Processar Dados do Lead" executa sem erros
- ✅ Lead é criado no banco com dados básicos
- ✅ Endereço completo é preenchido (da etiqueta)
- ✅ Estatísticas são atualizadas corretamente

---

## 📊 Comparação: Antes vs Depois

### Antes (com API de Contatos)
| Campo | Preenchido? |
|-------|-------------|
| Nome | ✅ |
| Email | ✅ |
| Telefone | ✅ |
| Celular | ✅ |
| Documento | ✅ |
| Endereço | ✅ |
| Razão Social | ✅ |
| Nome Fantasia | ✅ |
| IE | ✅ |
| RG | ✅ |

**Problema**: ❌ Erro 403 - Token sem permissão

### Depois (com dados do pedido)
| Campo | Preenchido? |
|-------|-------------|
| Nome | ✅ |
| Email | ❌ (null) |
| Telefone | ❌ (null) |
| Celular | ❌ (null) |
| Documento | ✅ |
| Endereço | ✅ |
| Razão Social | ❌ (null) |
| Nome Fantasia | ❌ (null) |
| IE | ❌ (null) |
| RG | ❌ (null) |

**Vantagem**: ✅ Funciona sem erro 403

---

## 🎯 Dados Mais Importantes Preservados

Os dados essenciais para um sistema de leads estão disponíveis:

✅ **Identificação**
- ID do contato no Bling
- Nome completo

✅ **Documentação**
- Tipo de documento (CPF/CNPJ)
- Número do documento

✅ **Endereço Completo**
- Rua, número, complemento
- Bairro, cidade, estado
- CEP, país

✅ **Estatísticas**
- Total de pedidos
- Valor total gasto
- Datas de primeiro e último pedido

✅ **Origem**
- Canal de venda (marketplace)

---

## 💡 Melhorias Futuras (Opcional)

Se você quiser preencher os campos que ficaram NULL:

### Opção 1: Solicitar Novo Token com Scope de Contatos
1. Acesse o painel de desenvolvedor do Bling
2. Gere um novo token com scope: `contatos.read`
3. Atualize o token no N8N
4. Reative o nó "Buscar Contato no Bling"

### Opção 2: Atualização Manual via Dashboard
1. Crie uma tela no frontend para editar leads
2. Permita que usuários preencham email/telefone manualmente
3. Útil para leads importantes

### Opção 3: Integração com CRM
1. Integre com um CRM (RD Station, HubSpot, etc.)
2. Enriqueça dados dos leads automaticamente
3. Sincronize de volta para o banco

---

## 📁 Arquivos Modificados

### Workflow
- `src/hooks/n8n/workflows/Bling Pedido de Venda Automatization.json`
  - 66 nós → 65 nós (removido "Buscar Contato no Bling")
  - Código do "Processar Dados do Lead" atualizado

### Código JavaScript
- `src/hooks/n8n/code-snippets/processar-lead-contato-v2.js` (novo)
  - Versão corrigida que usa dados do pedido

### Scripts
- `scripts/fix-leads-workflow-403.py` (novo)
  - Script que aplicou a correção automaticamente

### Documentação
- `CORRECAO_ERRO_403_LEADS.md` (este arquivo)

---

## ✅ Status Final

| Item | Status |
|------|--------|
| Erro 403 | ✅ Corrigido |
| Workflow atualizado | ✅ Sim |
| Nó problemático removido | ✅ Sim |
| Código atualizado | ✅ Sim |
| Conexões ajustadas | ✅ Sim |
| Pronto para importar | ✅ Sim |

---

## 🎉 Conclusão

O erro 403 foi corrigido com sucesso! O sistema agora:
- ✅ Funciona sem precisar de scope adicional no token
- ✅ Usa dados que já estão disponíveis no pedido
- ✅ Cria leads com informações essenciais
- ✅ Mantém estatísticas atualizadas
- ✅ Identifica canal de origem

**Próximo passo**: Reimporte o workflow no N8N e teste!
