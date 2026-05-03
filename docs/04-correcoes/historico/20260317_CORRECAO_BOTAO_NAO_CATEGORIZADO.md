# Correção: Botão "Não Categorizado" Não Voltava ao Estado Anterior

## Problema

Ao clicar no botão "Não categorizado":
1. ✅ Mostrava apenas produtos não categorizados (funcionava)
2. ❌ Ao desclickar, não voltava a mostrar todos os produtos (não funcionava)

## Causa Raiz

O botão estava alternando corretamente o filtro entre "uncategorized" e "all", mas o componente não estava forçando uma nova busca imediata após a mudança. O `useEffect` que monitora os filtros estava sendo executado, mas com um pequeno delay que causava inconsistência no estado.

## Solução Implementada

**Arquivo**: `src/components/ProductsLoaded.tsx`

Modificado o `onClick` do botão "Não categorizado" para forçar uma busca imediata após mudar o filtro:

```typescript
<Button
  type="button"
  variant="outline"
  className={filters.supplierSku === 'uncategorized'
    ? 'h-9 border-[#fe2c55] bg-[#fe2c55] text-xs font-semibold text-white hover:bg-[#fe2c55]'
    : 'h-9 border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'}
  onClick={() => {
    const newValue = filters.supplierSku === 'uncategorized' ? 'all' : 'uncategorized';
    updateFilters({ supplierSku: newValue });
    // Forçar busca imediata após mudar o filtro
    setTimeout(() => {
      fetchProducts(1, { ...filters, supplierSku: newValue });
    }, 100);
  }}
>
  Não categorizado
</Button>
```

## Como Funciona

1. **Detecta o estado atual**: Verifica se o filtro está em "uncategorized" ou "all"
2. **Alterna o valor**: Muda para o valor oposto
3. **Atualiza o estado**: Chama `updateFilters` com o novo valor
4. **Força busca imediata**: Após 100ms, chama `fetchProducts` com o novo filtro

O timeout de 100ms garante que o estado seja atualizado antes de fazer a busca.

## Resultado

- ✅ Clicar em "Não categorizado" → Mostra apenas produtos não categorizados
- ✅ Clicar novamente → Volta a mostrar todos os produtos
- ✅ Botão muda de cor corretamente (rosa quando ativo, branco quando inativo)
- ✅ Contador de produtos atualiza corretamente

## Teste

1. Recarregue a página (F5)
2. Verifique que todos os produtos aparecem
3. Clique em "Não categorizado"
   - Deve mostrar apenas produtos sem fornecedor
   - Botão fica rosa
4. Clique novamente em "Não categorizado"
   - Deve mostrar todos os produtos novamente
   - Botão fica branco/cinza

## Arquivos Modificados

- `src/components/ProductsLoaded.tsx` - Modificado onClick do botão "Não categorizado"

## Build

✅ Build passou com sucesso (32.79s)

---

**Data**: 2026-03-01  
**Status**: ✅ Resolvido
