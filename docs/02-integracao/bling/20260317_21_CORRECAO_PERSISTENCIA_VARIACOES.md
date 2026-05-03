# Correção: Persistência de Dados e Layout de Variações - Sessão 21

## Data: 2026-02-24

---

## Problemas Corrigidos

### 1. ✅ Dados Resetam ao Trocar de Janela do Navegador

**Causa Raiz Identificada**: 
O listener de autenticação do Supabase estava resetando o draft quando recebia o evento `SIGNED_IN`. O Supabase dispara esse evento não apenas no login inicial, mas também ao renovar o token de autenticação, o que pode acontecer quando você troca de janela/aba do navegador.

**Código Problemático** (linha 345-348 do DropshippingCalculator.tsx):
```typescript
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN') {
    handleResetProductDraft(true); // ❌ Resetava ao renovar token!
  }
});
```

**Solução Implementada**:
Modificado o listener para **apenas** resetar o draft quando o usuário faz logout real (`SIGNED_OUT`), não em renovações de token:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[Auth Listener] Auth event:', event);
  
  // ✅ Apenas reseta em SIGNED_OUT (logout real)
  if (event === 'SIGNED_OUT') {
    console.log('[Auth Listener] User signed out, resetting draft');
    handleResetProductDraft(true);
  }
  // ✅ Não reseta em SIGNED_IN (pode ser renovação de token)
});
```

**Logs Adicionados**:
- `[Auth Listener] Setting up auth state change listener`
- `[Auth Listener] Auth event: SIGNED_IN/SIGNED_OUT/TOKEN_REFRESHED`
- `[Auth Listener] User signed out, resetting draft`
- `[Auth Listener] Cleaning up auth listener`

**Arquivo Modificado**:
- `src/components/DropshippingCalculator.tsx` (linhas 345-358)

---

### 2. ✅ Layout de Variações Quebrado com Muitas Variações

**Problema**: 
Quando um produto tinha muitas variações (10+), o overlay de precificação de lucro ficava sem scroll e as variações ficavam sobrepostas/cortadas.

**Causas Identificadas**:
1. O overlay tinha `absolute inset-0` sem `overflow-y-auto`
2. O grid de variações usava apenas 2 colunas (`md:grid-cols-2`)
3. Não havia limite de altura para o container de variações
4. Não mostrava a quantidade de variações no título

**Soluções Implementadas**:

1. **Adicionado scroll ao overlay** (linha 2405):
```typescript
// Antes:
<div className="absolute inset-0 z-20 profit-overlay-animate">

// Depois:
<div className="absolute inset-0 z-20 profit-overlay-animate overflow-y-auto">
```

2. **Melhorado grid de variações** (linha 2696):
```typescript
// Antes:
<div className="grid md:grid-cols-2 gap-4 animate-fadeIn">

// Depois:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn max-h-[600px] overflow-y-auto pr-2">
```

3. **Adicionado contador de variações no título** (linha 2695):
```typescript
// Antes:
<h3 className="text-lg font-bold text-white mb-3">Variações do Produto</h3>

// Depois:
<h3 className="text-lg font-bold text-white mb-3">Variações do Produto ({variationCalculations.length})</h3>
```

**Melhorias de Layout**:
- ✅ 1 coluna em mobile (`grid-cols-1`)
- ✅ 2 colunas em tablet (`md:grid-cols-2`)
- ✅ 3 colunas em desktop (`lg:grid-cols-3`)
- ✅ Altura máxima de 600px com scroll (`max-h-[600px] overflow-y-auto`)
- ✅ Padding à direita para não cortar scrollbar (`pr-2`)
- ✅ Contador de variações no título

**Arquivo Modificado**:
- `src/components/DropshippingCalculator.tsx` (linhas 2405, 2695-2696)

---

### 3. ✅ Arquivo vite.config.ts Recriado

**Problema**: O arquivo `vite.config.ts` foi deletado acidentalmente, causando erro no build.

**Solução**: Recriado o arquivo com a configuração correta:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
  },
})
```

**Arquivo Criado**:
- `vite.config.ts`

---

## Logs de Debug Implementados

### Logs de Autenticação
```
[Auth Listener] Setting up auth state change listener
[Auth Listener] Auth event: SIGNED_IN Session: exists
[Auth Listener] Auth event: TOKEN_REFRESHED Session: exists
[Auth Listener] Auth event: SIGNED_OUT Session: null
[Auth Listener] User signed out, resetting draft
[Auth Listener] Cleaning up auth listener
```

### Logs de Ciclo de Vida (já implementados anteriormente)
```
[Hook Lifecycle] Component mounted/updated
[Hook Lifecycle] Current localStorage value: {...}
[Hook Lifecycle] Window blurred
[Hook Lifecycle] localStorage on blur: {...}
[Hook Lifecycle] Visibility changed: hidden
[Hook Lifecycle] Window focused
[Hook Lifecycle] localStorage on focus: {...}
[Hook Lifecycle] Visibility changed: visible
```

### Logs de Draft (já implementados anteriormente)
```
[Draft Load] No draft found in localStorage
[Draft Load] Loaded from localStorage: {...}
[Draft Save] Saving to localStorage: {...}
```

---

## Como Testar

### Teste 1: Persistência ao Trocar de Janela

1. Abra o console do navegador (F12 → aba Console)
2. Recarregue a página
3. Preencha alguns campos (Nome, SKU, Preço de Custo)
4. Observe logs `[Draft Save]` aparecendo
5. **Troque de janela/aba** do navegador
6. Observe logs `[Auth Listener]` - deve mostrar `TOKEN_REFRESHED` ou nenhum evento
7. **Volte para a aba** da calculadora
8. ✅ **Os dados devem permanecer preenchidos**
9. Observe que **NÃO** aparece log de "resetting draft"

### Teste 2: Layout de Variações

1. Crie um produto com 10+ variações
2. Preencha o preço de custo
3. Observe o overlay de precificação de lucro
4. ✅ Deve aparecer scroll no overlay
5. ✅ Deve aparecer "Variações do Produto (X)" com o número de variações
6. ✅ Variações devem estar em grid responsivo (1/2/3 colunas)
7. ✅ Container de variações deve ter scroll se passar de 600px

### Teste 3: Logout Real

1. Faça logout da aplicação
2. Observe log `[Auth Listener] User signed out, resetting draft`
3. ✅ Os dados devem ser limpos
4. Faça login novamente
5. ✅ Deve começar com campos vazios

---

## Resumo das Mudanças

### Arquivos Modificados:
1. `src/components/DropshippingCalculator.tsx`
   - Corrigido listener de autenticação (linhas 345-358)
   - Adicionado scroll ao overlay (linha 2405)
   - Melhorado grid de variações (linhas 2695-2696)

2. `vite.config.ts`
   - Recriado arquivo de configuração

### Build:
- ✅ TypeScript: 0 erros
- ✅ ESLint: 0 erros
- ✅ Build: Sucesso

---

## Próximos Passos

1. ✅ Testar persistência ao trocar de janela
2. ✅ Testar layout com muitas variações
3. ✅ Verificar logs do console
4. ⚠️ Se ainda houver problemas, compartilhar logs do console

---

## Notas Técnicas

### Por que SIGNED_IN era problemático?

O Supabase dispara o evento `SIGNED_IN` em várias situações:
- Login inicial do usuário ✅ (correto resetar)
- Renovação automática de token 🔄 (NÃO deve resetar)
- Restauração de sessão ao recarregar página 🔄 (NÃO deve resetar)

Ao trocar de janela, o navegador pode pausar a aba, e quando você volta, o Supabase pode renovar o token e disparar `SIGNED_IN`, causando o reset indesejado.

### Solução Correta

Apenas resetar em `SIGNED_OUT`, que é disparado exclusivamente quando:
- Usuário faz logout manual
- Sessão expira completamente
- Token é revogado

Isso garante que os dados persistam durante navegação normal, mas sejam limpos quando o usuário realmente sai da aplicação.
