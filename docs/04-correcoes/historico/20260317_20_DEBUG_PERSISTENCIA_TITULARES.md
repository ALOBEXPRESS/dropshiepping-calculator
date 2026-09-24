# Debug: Persistência e Titulares - Sessão 20

## Data: 2026-02-24

## Problemas Reportados

1. **Titulares não aparecem no dropdown**
2. **Campo fornecedor duplicado abaixo de "Taxa de Gateway do Fornecedor"**
3. **Dados somem ao trocar de aba do navegador**

---

## Investigação e Soluções

### 1. Titulares não aparecem ✅ CORRIGIDO

**Problema**: Dropdown de "Titular" aparece vazio

**Causa Raiz Identificada**: 
- O `ReferenceService.getAccountHolders` não estava filtrando titulares sem tipo (`type IS NULL`)
- Isso fazia com que titulares de teste sem tipo fossem retornados, mas não apareciam no dropdown
- O filtro no componente `ProductInfo` excluía titulares sem tipo, mas o serviço não

**Solução Aplicada**:
1. ✅ Adicionados titulares João e Pedro no banco de dados via SQL
2. ✅ Modificado `src/services/referenceService.ts` para filtrar `.not('type', 'is', null)`
3. ✅ Adicionados logs de debug em múltiplos pontos:
   - `ReferenceService.getAccountHolders` - para ver o que vem do banco
   - `ProductInfo` - para ver o que é recebido e filtrado
4. ✅ Atualizado fallback no hook `useAccountHolders.ts` (não usado diretamente, mas mantido para consistência)

**Titulares Disponíveis no Banco**:
- Alyson (CPF) - ID: a11c3599-ed21-47c4-80de-0c6b130c5e8f
- Emelyn (CPF) - ID: 648dd4d0-7b27-4ab5-a20d-4f966a59dcf7
- João (CPF) - ID: e8f17878-5c1b-49ed-96dd-5aa5472660db
- Jonatan (CPF) - ID: f8834d5c-8a21-472d-a066-deed60a44907
- Pedro (CPF) - ID: a497b72a-23b3-495a-978b-7851dfdb8c45

**Arquivos Modificados**:
- `src/services/referenceService.ts` - Adicionado filtro `.not('type', 'is', null)` e logs
- `src/components/calculator/ProductInfo.tsx` - Adicionados logs de debug
- `src/hooks/useAccountHolders.ts` - Atualizado fallback (não usado diretamente)
- Banco de dados: tabela `account_holders` - Inseridos João e Pedro

**Como Testar**:
1. Abra o console do navegador (F12)
2. Recarregue a página
3. Observe os logs:
   - `[ReferenceService] getAccountHolders called with organizationId: ...`
   - `[ReferenceService] getAccountHolders result: ...`
   - `[ProductInfo] Render - accountHoldersList: ...`
   - `[ProductInfo] Filtered holders: ...`
4. Selecione "CPF" no campo "Tipo de Conta"
5. Clique no dropdown "Titular"
6. Deve aparecer: Alyson, Emelyn, João, Jonatan, Pedro

**Status**: ✅ Concluído - Aguardando teste do usuário com logs do console

---

### 2. Campo Fornecedor Duplicado ❌ NÃO É DUPLICADO

**Problema Reportado**: "O campo fornecedor acima e embaixo (abaixo de Taxa de Gateway do Fornecedor), gostaria que deixasse só o de cima"

**Investigação**:
- Procurado em `DropshippingCalculator.tsx` após linha 2094 ("Taxa de Gateway do Fornecedor")
- Encontrado apenas "Taxa do fornecedor" (linha 2167)
- **NÃO é um campo duplicado!**

**Esclarecimento**:
- **"Nome do fornecedor"** (em ProductInfo.tsx): Campo para selecionar qual fornecedor (Dogama, TYR, etc.)
- **"Taxa do fornecedor"** (em DropshippingCalculator.tsx, linha 2167): Campo para definir a taxa/comissão que o fornecedor cobra

**Estes são dois campos DIFERENTES e ambos são necessários:**
1. Nome do fornecedor = Quem é o fornecedor
2. Taxa do fornecedor = Quanto o fornecedor cobra de taxa

**Status**: Não é um bug, são campos diferentes com propósitos diferentes

---

### 3. Dados Somem ao Trocar de Aba ⚠️ EM INVESTIGAÇÃO PROFUNDA

**Problema**: Dados persistem ao navegar para página de produtos, mas somem ao trocar de aba/janela do navegador

**Comportamento Esperado**:
- ✅ Dados persistem ao navegar entre páginas (React Router)
- ❌ Dados somem ao trocar de aba/janela do navegador

**Investigação Realizada**:
1. ✅ Verificado que todos os campos estão no `ProductDraft` type
2. ✅ Verificado que `useEffect` salva no localStorage com todas as dependências
3. ✅ Verificado que `useState` inicial lê do localStorage
4. ✅ Adicionado `supplier_id` às dependências do useEffect
5. ✅ Adicionado logs detalhados de salvamento e carregamento
6. ✅ Adicionado monitoramento de eventos de visibilidade e foco da janela

**Debug Avançado Adicionado**:

Adicionei 4 tipos de logs para rastrear o problema:

1. **Logs de Carregamento** (ao iniciar):
   ```
   [Draft Load] No draft found in localStorage
   [Draft Load] Loaded from localStorage: ...
   [Draft Load] Error parsing draft, clearing localStorage
   ```

2. **Logs de Salvamento** (ao preencher campos):
   ```
   [Draft Save] Saving to localStorage: dropshipping_product_draft_v1 {...}
   ```

3. **Logs de Ciclo de Vida** (ao montar/desmontar componente):
   ```
   [Hook Lifecycle] Component mounted/updated
   [Hook Lifecycle] Current localStorage value: ...
   [Hook Lifecycle] Component unmounting
   ```

4. **Logs de Eventos de Janela** (ao trocar de aba):
   ```
   [Hook Lifecycle] Window blurred
   [Hook Lifecycle] localStorage on blur: ...
   [Hook Lifecycle] Visibility changed: hidden
   [Hook Lifecycle] Window focused
   [Hook Lifecycle] localStorage on focus: ...
   [Hook Lifecycle] Visibility changed: visible
   ```

**Como Testar (IMPORTANTE)**:

1. Abra o console do navegador (F12 → aba Console)
2. Recarregue a página
3. Observe o log `[Draft Load]` - deve mostrar dados carregados ou "No draft found"
4. Preencha alguns campos (Nome do Produto, SKU, Preço de Custo)
5. Observe logs `[Draft Save]` aparecendo a cada mudança
6. **TROQUE DE ABA** (vá para outra aba do navegador)
7. Observe logs `[Hook Lifecycle] Window blurred` e `Visibility changed: hidden`
8. **VOLTE PARA A ABA** da calculadora
9. Observe logs `[Hook Lifecycle] Window focused` e `Visibility changed: visible`
10. Verifique se os dados ainda estão nos campos
11. **TIRE SCREENSHOT DOS LOGS** e compartilhe

**Possíveis Causas Investigadas**:
- ❓ Navegador pode estar limpando localStorage ao trocar de aba (improvável, mas vamos verificar)
- ❓ Componente pode estar sendo desmontado e remontado incorretamente
- ❓ Pode haver algum listener de eventos (blur/focus) que limpa os dados
- ❓ React pode estar recriando o estado inicial ao invés de manter
- ❓ Algum código pode estar chamando `resetProductDraft` ao perder foco

**Arquivos Modificados**:
- `src/hooks/useDropshippingCalculator.ts` - Adicionado logs de debug e monitoramento de eventos

**Status**: ⚠️ Aguardando teste do usuário com logs detalhados do console

**PRÓXIMO PASSO CRÍTICO**: 
Precisamos dos logs do console para entender exatamente o que está acontecendo. Por favor, siga os passos acima e compartilhe os logs.

---

## Resumo das Mudanças

### Arquivos Modificados:
1. `src/hooks/useAccountHolders.ts` - Corrigido busca de titulares
2. `src/hooks/useDropshippingCalculator.ts` - Adicionado logs de debug para persistência

### Testes Necessários:
1. ✅ Verificar se titulares aparecem no dropdown
2. ✅ Confirmar que "Taxa do fornecedor" é diferente de "Nome do fornecedor"
3. ⚠️ Testar persistência ao trocar de aba e verificar logs do console

---

## Instruções para o Usuário

### Para testar Titulares:
1. Abra a calculadora
2. Selecione um "Tipo de Conta" (CPF ou CNPJ)
3. Clique no dropdown "Titular"
4. Verifique se aparecem: Alyson, Jonatan, Emelyn

### Para entender os campos de Fornecedor:
- **Nome do fornecedor** (no topo, em "Dados do Produto"): Selecione qual fornecedor você está usando
- **Taxa do fornecedor** (embaixo de "Taxa de Gateway do Fornecedor"): Defina a taxa/comissão que esse fornecedor cobra

### Para testar Persistência:
1. Abra o console do navegador (F12 → aba Console)
2. Preencha alguns campos na calculadora
3. Observe mensagens `[Draft Save]` no console
4. Troque de aba do navegador (vá para outra aba)
5. Volte para a aba da calculadora
6. Observe mensagem `[Draft Load]` no console
7. Verifique se os dados foram restaurados
8. Tire screenshot dos logs do console e compartilhe

---

## Próximos Passos

1. Aguardar feedback do usuário sobre titulares
2. Esclarecer diferença entre "Nome do fornecedor" e "Taxa do fornecedor"
3. Analisar logs do console para entender problema de persistência
4. Se necessário, investigar mais profundamente o ciclo de vida do componente
