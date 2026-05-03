# Problema: localhost vs 127.0.0.1

**Data**: 23/02/2026  
**Status**: 🔍 IDENTIFICADO

---

## 🔍 Problema Identificado

### Comportamento Observado

**Funciona em `127.0.0.1:5173`**:
- ✅ Produtos carregam normalmente
- ✅ Imagens aparecem
- ✅ Integração com Bling funciona
- ✅ Autenticação funciona

**NÃO funciona em `localhost:5173`**:
- ❌ "Não produtos encontrados"
- ❌ Produtos não carregam
- ❌ Possível erro de autenticação
- ❌ Sessão não persiste

---

## 🎯 Causa Raiz

### 1. Configuração do Vite
O servidor Vite está configurado para rodar APENAS em `127.0.0.1`:

```typescript
// vite.config.ts
server: {
  port: 5173,
  host: '127.0.0.1',  // ⚠️ PROBLEMA AQUI
  // ...
}
```

```json
// package.json
"dev": "node --max-http-header-size=1000000 node_modules/vite/bin/vite.js --port 5173 --host 127.0.0.1"
```

### 2. Cookies de Sessão do Supabase
O Supabase armazena tokens de autenticação em cookies que são vinculados ao domínio:
- Cookie criado em `127.0.0.1` → Não é enviado para `localhost`
- Cookie criado em `localhost` → Não é enviado para `127.0.0.1`

### 3. Same-Origin Policy
Navegadores tratam `localhost` e `127.0.0.1` como **origens diferentes**:
- `http://localhost:5173` ≠ `http://127.0.0.1:5173`
- Cookies, localStorage e sessionStorage são isolados

---

## 🔧 Soluções

### Solução 1: Usar Sempre 127.0.0.1 (Atual) ✅
**Prós**:
- Já está funcionando
- Sem mudanças necessárias
- Mais previsível

**Contras**:
- Menos intuitivo (usuários esperam `localhost`)
- Pode causar confusão

**Recomendação**: Documentar claramente que deve usar `127.0.0.1`

---

### Solução 2: Mudar para localhost (Recomendado) ⭐
**Mudanças Necessárias**:

#### 2.1 Atualizar vite.config.ts
```typescript
server: {
  port: 5173,
  host: 'localhost',  // ✅ MUDANÇA AQUI
  cors: true,
  strictPort: false,
  allowedHosts: ['localhost', '127.0.0.1', 'calc.local', 'app.local'],
}
```

#### 2.2 Atualizar package.json
```json
"dev": "node --max-http-header-size=1000000 node_modules/vite/bin/vite.js --port 5173 --host localhost"
```

#### 2.3 Limpar Cookies Antigos
Após a mudança, usuários precisam:
1. Limpar cookies do navegador
2. Fazer logout/login novamente
3. Usar `localhost:5173` ao invés de `127.0.0.1:5173`

**Prós**:
- Mais intuitivo
- Padrão da indústria
- Melhor para desenvolvimento

**Contras**:
- Requer limpeza de cookies
- Pode causar confusão temporária

---

### Solução 3: Aceitar Ambos (Mais Complexo) 🔧
**Mudanças Necessárias**:

#### 3.1 Atualizar vite.config.ts
```typescript
server: {
  port: 5173,
  host: '0.0.0.0',  // ✅ Aceita todas as interfaces
  cors: true,
  strictPort: false,
  allowedHosts: ['localhost', '127.0.0.1', 'calc.local', 'app.local'],
}
```

#### 3.2 Configurar Supabase para Múltiplas Origens
No Supabase Dashboard → Authentication → URL Configuration:
- Adicionar `http://localhost:5173` em Site URL
- Adicionar `http://127.0.0.1:5173` em Redirect URLs

#### 3.3 Atualizar Supabase Client
```typescript
// src/lib/supabase.ts
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    global: { fetch: fetchWithRetry },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: window.localStorage,  // Usar localStorage ao invés de cookies
    }
  }
);
```

**Prós**:
- Funciona em ambos
- Flexível
- Melhor para testes

**Contras**:
- Mais complexo
- Pode ter problemas de segurança em produção
- Requer configuração no Supabase

---

## 📝 Recomendação Final

### Para Desenvolvimento Local
**Usar Solução 2** (Mudar para localhost):
1. Mais intuitivo
2. Padrão da indústria
3. Fácil de implementar

### Para Produção
Não afeta, pois usa domínio real (ex: `app.alobexpress.com`)

---

## 🚀 Implementação Recomendada

### Passo 1: Atualizar Configurações
```bash
# 1. Atualizar vite.config.ts
# 2. Atualizar package.json
# 3. Commit das mudanças
```

### Passo 2: Comunicar Mudança
Avisar equipe:
- Usar `localhost:5173` ao invés de `127.0.0.1:5173`
- Limpar cookies do navegador
- Fazer logout/login novamente

### Passo 3: Atualizar Documentação
- README.md
- Guias de desenvolvimento
- Scripts de inicialização

---

## 🔍 Como Verificar se Está Funcionando

### Teste 1: Acessar localhost
```
http://localhost:5173
```
- ✅ Deve carregar produtos
- ✅ Deve mostrar imagens
- ✅ Deve manter sessão

### Teste 2: Acessar 127.0.0.1
```
http://127.0.0.1:5173
```
- ⚠️ Pode não funcionar (esperado após mudança)
- Redirecionar para `localhost:5173`

### Teste 3: Verificar Cookies
Abrir DevTools → Application → Cookies:
- ✅ Deve ter cookies do Supabase
- ✅ Domain deve ser `localhost`

---

## 📊 Comparação de Soluções

| Aspecto | Solução 1 (127.0.0.1) | Solução 2 (localhost) | Solução 3 (0.0.0.0) |
|---------|----------------------|----------------------|---------------------|
| Facilidade | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Intuitividade | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Segurança | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Flexibilidade | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Recomendado | ❌ | ✅ | ⚠️ |

---

## 🎯 Decisão

**Recomendação**: Implementar **Solução 2** (Mudar para localhost)

**Motivos**:
1. Mais intuitivo para desenvolvedores
2. Padrão da indústria
3. Fácil de implementar
4. Melhor experiência de desenvolvimento

**Próximos Passos**:
1. Atualizar `vite.config.ts`
2. Atualizar `package.json`
3. Comunicar mudança para equipe
4. Atualizar documentação

---

**Status**: Problema identificado, solução recomendada, aguardando implementação.
