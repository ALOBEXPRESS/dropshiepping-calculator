# Guia Rápido: Debug de Produtos não Aparecem em Produção

## 🎯 Objetivo
Diagnosticar por que os produtos não aparecem na página `/produtos` em produção (Vercel).

## ✅ O que foi feito
Adicionei logs de debug estratégicos em 4 pontos críticos do código:

1. **useEffect que carrega produtos** - Para ver se está sendo chamado
2. **Função loadProducts** - Para ver se está executando
3. **ProductService.getAll** - Para ver se a query está funcionando
4. **Renderização da página** - Para ver o estado dos arrays de produtos

## 📋 Próximos Passos

### 1. Fazer commit e push
```bash
git add .
git commit -m "debug: adicionar logs para diagnosticar produtos não aparecem em /produtos"
git push
```

### 2. Aguardar deploy no Vercel
- O Vercel vai fazer o deploy automaticamente
- Aguarde a conclusão (geralmente 1-2 minutos)

### 3. Abrir a página de produtos em produção
1. Acesse: https://dropshiepping-calculator.vercel.app/produtos
2. Abra o DevTools (F12)
3. Vá para a aba "Console"
4. Recarregue a página (Ctrl+R ou F5)

### 4. Coletar os logs
Procure por logs que começam com `[DEBUG Products Page]` e `[DEBUG ProductService]`:

```
[DEBUG Products Page] useEffect triggered, organizationId: ...
[DEBUG Products Page] Calling loadProducts...
[DEBUG Products Page] loadProducts called, organizationId: ...
[DEBUG ProductService] getAll called with organizationId: ...
[DEBUG ProductService] Executing query...
[DEBUG ProductService] Query result: { dataLength: ..., error: ... }
[DEBUG Products Page] Products fetched: X products
[DEBUG Products Page] Rendering products page: { ... }
```

### 5. Compartilhar os logs comigo
Copie TODOS os logs que aparecem no console e me envie. Isso vai me ajudar a identificar exatamente onde está o problema.

## 🔍 O que estamos procurando

### Cenário 1: organizationId está undefined
```
[DEBUG Products Page] No organizationId, skipping loadProducts
```
**Solução**: Problema com autenticação ou contexto de organização

### Cenário 2: Query retorna 0 produtos
```
[DEBUG ProductService] Query result: { dataLength: 0, error: null }
```
**Solução**: Problema com filtro de organizationId ou dados não existem

### Cenário 3: Query retorna erro
```
[DEBUG ProductService] Query result: { dataLength: undefined, error: {...} }
```
**Solução**: Problema com RLS policy ou permissões

### Cenário 4: Produtos carregam mas não renderizam
```
[DEBUG Products Page] Products fetched: 5 products
[DEBUG Products Page] Rendering products page: {
  productsLength: 5,
  effectiveProductsLength: 5,
  filteredProductsLength: 0,  // <-- PROBLEMA AQUI
  pagedProductsLength: 0
}
```
**Solução**: Problema com filtros bloqueando todos os produtos

### Cenário 5: Produtos carregam e filtram mas não paginam
```
[DEBUG Products Page] Rendering products page: {
  productsLength: 5,
  effectiveProductsLength: 5,
  filteredProductsLength: 5,
  pagedProductsLength: 0  // <-- PROBLEMA AQUI
}
```
**Solução**: Problema com lógica de paginação

## 📝 Notas Importantes

- Os logs são temporários e serão removidos após identificar o problema
- Não afetam o funcionamento da aplicação
- Aparecem apenas no console do navegador
- Não são visíveis para usuários finais

## 🚀 Após identificar o problema

1. Vou aplicar a correção específica
2. Vou remover os logs de debug
3. Vou fazer novo deploy
4. Vamos testar novamente em produção

---

**Status Atual**: ⏳ Aguardando deploy e coleta de logs
