# Correções e Ajustes

Esta pasta contém documentação de correções e ajustes realizados no sistema.

## 📋 Índice de Correções

### 2026-05-08: Correção de Leads Duplicados

**Arquivo:** [20260508_CORRECAO_LEADS_DUPLICADOS.md](./20260508_CORRECAO_LEADS_DUPLICADOS.md)

**Problema:** Leads duplicados (ex: Marina Ferreira da Silva) estavam sendo contados múltiplas vezes nos gráficos de funil após clonagem de pedidos no Bling.

**Solução:**
- Script SQL para identificar leads duplicados
- Migração para consolidar leads duplicados
- Constraint para prevenir duplicação futura
- Documentação completa do processo

**Status:** ✅ Pronto para execução

**Impacto:**
- Funil de Gênero: Contagem correta de leads únicos
- Funil de Conversão: Contagem correta de leads recorrentes
- Estatísticas consolidadas por pessoa

---

### 2026-05-08: Correção Log Warning Canal

**Arquivo:** [20260508_CORRECAO_LOG_WARNING_CANAL.md](./20260508_CORRECAO_LOG_WARNING_CANAL.md)

**Problema:** Nó "Log Warning Canal" falhava ao tentar inserir log com status "warning", que não é permitido pela constraint da tabela `bling_sync_logs`.

**Solução:**
- Alterado status de "warning" para "skipped" no nó "Log Warning Canal"
- Script SQL para deletar pedido problemático (f7a5d8f7-abb7-4385-ba64-b6dc7c39e822)
- Documentação do fluxo de pedidos sem loja associada

**Status:** ✅ Corrigido

**Impacto:**
- Workflow não trava mais em pedidos sem loja associada
- Logs respeitam a constraint da tabela
- Pedidos manuais são processados corretamente

---

## 🔧 Como Usar Esta Pasta

1. **Antes de Executar**: Leia a documentação completa da correção
2. **Backup**: Sempre faça backup antes de executar migrações
3. **Teste**: Execute primeiro em ambiente de desenvolvimento
4. **Verificação**: Use scripts de verificação antes e depois
5. **Documentação**: Mantenha esta pasta atualizada com novas correções

## 📝 Template para Novas Correções

Ao adicionar uma nova correção, crie um arquivo seguindo o padrão:

```
YYYYMMDD_DESCRICAO_CORRECAO.md
```

Inclua:
- Data da correção
- Descrição do problema
- Solução implementada
- Passos para executar
- Resultado esperado
- Impacto no sistema
- Arquivos modificados/criados
