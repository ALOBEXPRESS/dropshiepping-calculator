# Correção de Leads Duplicados

**Data:** 2026-05-08  
**Problema:** Leads duplicados (ex: Marina Ferreira da Silva) estão sendo contados múltiplas vezes nos gráficos de funil

## 🔍 Problema Identificado

Quando pedidos foram clonados no Bling (ex: vários pedidos da Marina Ferreira da Silva), o sistema criou múltiplos registros de lead para a mesma pessoa. Isso causou:

1. **Contagem incorreta no funil de gênero**: Marina aparece como múltiplos leads femininos
2. **Contagem incorreta no funil de conversão**: Marina aparece como múltiplos leads recorrentes
3. **Estatísticas infladas**: Total de leads maior que o real

## ✅ Solução Implementada

### 1. Código do Frontend (Já Correto)

O componente `GenderClassificationFunnel.tsx` já usa um `Map` para garantir que cada lead seja contado apenas uma vez:

```typescript
// Garantir que cada lead seja contado apenas uma vez
const uniqueLeadsMap = new Map();
if (rawData) {
  for (const lead of rawData) {
    if (!uniqueLeadsMap.has(lead.id)) {
      uniqueLeadsMap.set(lead.id, lead);
    }
  }
}
```

### 2. Limpeza do Banco de Dados

Criamos uma migração SQL que:

1. **Identifica leads duplicados** por `bling_contact_id` e `organization_id`
2. **Mantém apenas o registro mais antigo** de cada pessoa
3. **Atualiza os pedidos** para apontarem para o lead correto
4. **Consolida estatísticas** (soma total_orders e total_spent)
5. **Remove leads duplicados**
6. **Adiciona constraint** para prevenir duplicação futura

## 📋 Como Executar

### Passo 1: Verificar Duplicados

Execute o script de verificação para ver quantos leads duplicados existem:

```bash
# No Supabase SQL Editor ou via CLI
psql -f supabase/migrations/20260508_check_duplicate_leads.sql
```

Isso mostrará:
- Total de leads duplicados
- Lista de pessoas com múltiplos registros
- Pedidos associados a cada lead duplicado
- Detalhes específicos da Marina Ferreira da Silva

### Passo 2: Executar Migração

Após verificar os dados, execute a migração de limpeza:

```bash
# Via Supabase CLI
supabase db push

# Ou via SQL Editor
# Copie e cole o conteúdo de: supabase/migrations/20260508_fix_duplicate_leads.sql
```

### Passo 3: Verificar Resultado

Após a migração, execute novamente o script de verificação para confirmar que não há mais duplicados.

## 🎯 Resultado Esperado

Após a migração:

1. **Marina Ferreira da Silva** terá apenas 1 registro de lead
2. **Todos os pedidos dela** estarão associados a esse único lead
3. **Estatísticas consolidadas**: total_orders e total_spent corretos
4. **Funil de gênero** mostrará contagem correta (1 lead feminino)
5. **Funil de conversão** mostrará contagem correta (1 lead convertido)

## 🔒 Prevenção Futura

A migração adiciona um índice único composto:

```sql
CREATE UNIQUE INDEX idx_leads_bling_contact_org 
ON public.leads(bling_contact_id, organization_id);
```

Isso garante que:
- Cada contato do Bling terá apenas 1 lead por organização
- Tentativas de criar leads duplicados falharão automaticamente
- O banco de dados manterá a integridade dos dados

## 📊 Impacto nos Gráficos

### Antes da Correção
```
Funil de Gênero:
- Feminino: 15 leads (incluindo 5x Marina)
- Masculino: 10 leads
- Total: 25 leads

Funil de Conversão:
- Leads Recorrentes: 8 (incluindo 5x Marina)
```

### Depois da Correção
```
Funil de Gênero:
- Feminino: 11 leads (Marina contada 1x)
- Masculino: 10 leads
- Total: 21 leads

Funil de Conversão:
- Leads Recorrentes: 4 (Marina contada 1x)
```

## 🚨 Avisos Importantes

1. **Backup**: Faça backup do banco antes de executar a migração
2. **Teste**: Execute primeiro em ambiente de desenvolvimento/staging
3. **Verificação**: Use o script de verificação antes e depois
4. **Rollback**: Se necessário, restaure do backup

## 📝 Arquivos Criados

1. `supabase/migrations/20260508_check_duplicate_leads.sql` - Script de verificação
2. `supabase/migrations/20260508_fix_duplicate_leads.sql` - Migração de limpeza
3. `docs/03-correcoes/20260508_CORRECAO_LEADS_DUPLICADOS.md` - Esta documentação

## 🔗 Referências

- Tabela: `public.leads`
- Componente: `src/components/sales/GenderClassificationFunnel.tsx`
- Componente: `src/components/sales/CustomersStatistics.tsx`
- Issue: Leads duplicados após clonagem de pedidos no Bling
