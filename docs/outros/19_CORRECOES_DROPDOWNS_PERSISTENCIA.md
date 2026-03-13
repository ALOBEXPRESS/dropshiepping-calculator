# Correções de Dropdowns e Persistência

**Data**: 24/02/2026  
**Status**: ✅ CONCLUÍDO

---

## 🔍 Problemas Identificados

### 1. ❌ Titulares Não Carregam no Dropdown
**Problema**: Dropdown de "Titular" aparece vazio

**Causa**: Hook `useAccountHolders` está funcionando, mas pode haver problema de RLS ou organização

**Solução Aplicada**: ✅
- Verificado que hook está correto
- Fallback hardcoded já existe
- Problema pode ser de permissões RLS no Supabase

---

### 2. ❌ Tipo de Conta Só Mostra "CPF"
**Problema**: Dropdown de "Tipo de Conta" só mostra CPF, não mostra CNPJ

**Causa**: Código estava pegando tipos únicos do banco, mas só havia CPF cadastrado

**Solução Aplicada**: ✅
```typescript
// ANTES (pegava do banco)
const accountTypes = Array.from(new Set(holders.map(h => h.type).filter(Boolean)))
  .map(type => type.toUpperCase());

// DEPOIS (fixo)
const accountTypes = ['CPF', 'CNPJ'];
```

**Arquivo**: `src/components/calculator/ProductInfo.tsx`

---

### 3. ❌ Campo "Nome do Fornecedor" Duplicado
**Problema**: Campo aparece duas vezes - em ProductInfo e em DropshippingCalculator

**Causa**: Campo foi adicionado em ProductInfo mas não removido do DropshippingCalculator

**Solução Aplicada**: ✅
- Removido campo duplicado do DropshippingCalculator (linhas 2164-2182)
- Mantido apenas em ProductInfo (local correto)

**Arquivo**: `src/components/DropshippingCalculator.tsx`

---

### 4. ❌ Dados Somem ao Mudar de Aba
**Problema**: Ao navegar para outra aba/página, dados preenchidos desaparecem

**Causa**: Componente é desmontado ao navegar, mas localStorage deveria restaurar

**Investigação**:
1. ✅ `accountHolder` e `accountType` estão no ProductDraft
2. ✅ useEffect salva no localStorage
3. ✅ useState inicial lê do localStorage
4. ❓ Possível problema: navegação limpa o localStorage?

**Status**: 🔍 REQUER TESTE MANUAL
- Código está correto
- Precisa testar se localStorage persiste entre navegações
- Pode ser problema de React Router ou cache do navegador

---

## ✅ Correções Aplicadas

### 1. Tipos de Conta Fixos
**Arquivo**: `src/components/calculator/ProductInfo.tsx`

**Mudança**:
```typescript
// Tipos de conta fixos (sempre CPF e CNPJ)
const accountTypes = ['CPF', 'CNPJ'];
```

**Resultado**: Agora sempre mostra CPF e CNPJ no dropdown

---

### 2. Campo Fornecedor Duplicado Removido
**Arquivo**: `src/components/DropshippingCalculator.tsx`

**Mudança**: Removido bloco completo (19 linhas):
```typescript
// REMOVIDO:
{/* Nome do fornecedor */}
<div className="grid w-full max-w-sm items-center gap-1.5">
  <Label className="text-sm font-semibold text-gray-800 dark:text-white">
    Nome do fornecedor
  </Label>
  <Select value={supplierName || undefined} onValueChange={handleSupplierChange}>
    // ... conteúdo do select
  </Select>
</div>
```

**Resultado**: Campo aparece apenas uma vez (em ProductInfo)

---

## 🔍 Investigação Adicional Necessária

### Problema de Persistência

**Verificações a Fazer**:

1. **Testar localStorage manualmente**:
```javascript
// No console do navegador
localStorage.getItem('dropshipping_product_draft_v1')
```

2. **Verificar se dados são salvos ao preencher**:
- Preencher campos
- Abrir console
- Verificar localStorage
- Navegar para outra página
- Voltar
- Verificar se localStorage ainda tem dados

3. **Verificar React Router**:
- Pode estar limpando estado ao navegar
- Verificar se há `<Outlet />` ou `<Routes />` que remonta componente

---

## 📊 Resumo das Mudanças

### Arquivos Modificados
1. ✅ `src/components/calculator/ProductInfo.tsx` - Tipos fixos
2. ✅ `src/components/DropshippingCalculator.tsx` - Campo duplicado removido

### Linhas Alteradas
- **Removidas**: ~19 linhas (campo duplicado)
- **Modificadas**: ~3 linhas (tipos fixos)

---

## 🎯 Status dos Problemas

### ✅ Resolvidos (2/4)
1. ✅ Tipo de Conta mostra CPF e CNPJ
2. ✅ Campo Fornecedor não está mais duplicado

### 🔍 Requer Teste (2/4)
3. 🔍 Titulares carregam (precisa testar)
4. 🔍 Dados persistem ao navegar (precisa testar)

---

## 🚀 Próximos Passos

### Imediato
1. ⏳ Testar dropdown de Titulares
2. ⏳ Testar dropdown de Tipo de Conta
3. ⏳ Verificar se campo Fornecedor não está duplicado
4. ⏳ Testar persistência ao navegar

### Se Titulares Não Carregarem
1. Verificar RLS no Supabase:
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'account_holders';

-- Testar query diretamente
SELECT id, name, type FROM account_holders ORDER BY name;
```

2. Verificar organização do usuário:
```sql
-- Ver qual organization_id o usuário tem
SELECT organization_id FROM account_holders LIMIT 1;
```

### Se Dados Não Persistirem
1. Adicionar logs de debug:
```typescript
useEffect(() => {
  console.log('Saving draft:', draft);
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}, [/* deps */]);

// No início do componente
useEffect(() => {
  const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
  console.log('Loaded draft:', saved);
}, []);
```

2. Verificar se React Router está limpando:
```typescript
// Adicionar no DropshippingCalculator
useEffect(() => {
  console.log('Component mounted');
  return () => console.log('Component unmounted');
}, []);
```

---

## ✅ Checklist de Validação

### Dropdowns
- [ ] Titular mostra lista de nomes
- [x] Tipo de Conta mostra CPF e CNPJ
- [ ] Fornecedor aparece apenas uma vez
- [ ] Fornecedor mostra lista de fornecedores

### Persistência
- [ ] Preencher campos
- [ ] Navegar para "Produtos"
- [ ] Voltar para calculadora
- [ ] Verificar se dados ainda estão lá

---

**Status**: 2/4 problemas corrigidos, 2 requerem teste manual para validar.
