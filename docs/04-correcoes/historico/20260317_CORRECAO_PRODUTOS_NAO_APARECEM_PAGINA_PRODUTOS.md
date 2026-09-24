# Correção: Produtos não aparecem na página /produtos em produção

## Problema
Na página `/produtos` (https://dropshiepping-calculator.vercel.app/produtos), os produtos não são renderizados, mesmo que:
- O ambiente local funciona perfeitamente
- Os dados são carregados com sucesso (logs mostram `[ReferenceService] getAccountHolders result: {data: Array(5), error: null}`)
- Não há erros no console

## Análise do Código

### Fluxo de Renderização
1. `App.tsx` define a rota `/produtos` que renderiza `<DropshippingCalculator viewMode="products" />`
2. No `DropshippingCalculator.tsx`:
   - `showOnlyProducts = viewMode === 'products'` (linha ~423)
   - Quando `showOnlyProducts === true`, renderiza apenas a seção de produtos (linhas 3489-3700)

### Lógica de Filtragem
```typescript
// Linha ~1131
const effectiveProducts = useMemo(
  () => [...products].sort((a, b) => getProductUpdatedTimestamp(b) - getProductUpdatedTimestamp(a)),
  [products]
);

// Linha ~1136
const shouldShowProductsLoading = isProductsLoading && effectiveProducts.length === 0;

// Linha ~1137
const filteredProducts = useMemo(() => {
  return effectiveProducts.filter((product) => {
    // Filtra por marketplace, supplier, holder, accountType, videoModel, stock, search
    // ...
  });
}, [effectiveProducts, productFilters, normalizedGlobalSearch]);

// Linha ~1200
const pagedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
```

### Condição de Renderização (linha ~3650)
```typescript
{shouldShowProductsLoading ? (
  <div className="text-sm text-gray-500">Carregando produtos...</div>
) : effectiveProducts.length === 0 ? (
  <div className="text-sm text-gray-500">Nenhum produto adicionado ainda.</div>
) : filteredProducts.length === 0 ? (
  <div className="text-sm text-gray-500">Nenhum produto encontrado com os filtros atuais.</div>
) : (
  <>
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {pagedProducts.map((product) => (
        <ProductCard ... />
      ))}
    </div>
  </>
)}
```

## Hipóteses

### Hipótese 1: `loadProducts()` não está sendo chamado
- O `useEffect` que chama `loadProducts()` depende de `organizationId`
- Em produção, pode haver um problema com a obtenção do `organizationId`

### Hipótese 2: Filtros estão bloqueando todos os produtos
- `productFilters` pode ter valores que filtram todos os produtos
- `normalizedGlobalSearch` pode estar com valor inválido

### Hipótese 3: Race condition no carregamento
- `isProductsLoading` pode estar travado em `true`
- `products` array pode estar vazio mesmo após o fetch

### Hipótese 4: Problema com RLS policies
- Mesmo após as correções anteriores, pode haver uma policy específica bloqueando em produção
- Diferença de comportamento entre localhost e Vercel

## Logs Observados
```
[Violation] Forced reflow while executing JavaScript took 35ms
[Violation] 'setTimeout' handler took 66ms
[ReferenceService] getAccountHolders result: {data: Array(5), error: null}
```

**Observação importante**: Não há logs de erro, o que sugere que:
- O fetch está funcionando
- Não há exceções sendo lançadas
- O problema é lógico, não de rede/permissão

## Próximos Passos

1. Adicionar logs de debug específicos para produção
2. Verificar o estado de `products`, `effectiveProducts`, `filteredProducts` e `pagedProducts`
3. Verificar o valor de `organizationId` em produção
4. Verificar se `loadProducts()` está sendo chamado
5. Verificar os valores de `productFilters` em produção

## Solução Proposta

Adicionar logs temporários para diagnosticar o problema em produção:

```typescript
// No useEffect que carrega produtos
useEffect(() => {
  console.log('[DEBUG] organizationId:', organizationId);
  console.log('[DEBUG] loadProducts will be called');
  if (!organizationId) return;
  const timeoutId = window.setTimeout(() => {
    void loadProducts();
  }, 0);
  return () => window.clearTimeout(timeoutId);
}, [organizationId, loadProducts]);

// No loadProducts
const loadProducts = useCallback(async () => {
  console.log('[DEBUG] loadProducts called');
  setIsProductsLoading(true);
  try {
    const list = await ProductService.getAll(organizationId ?? undefined);
    console.log('[DEBUG] Products loaded:', list.length);
    handleProductsResponse(list);
    // ...
  } catch (error: unknown) {
    console.error('[DEBUG] Error loading products:', error);
    // ...
  }
}, [organizationId, handleProductsResponse]);

// Antes da renderização
console.log('[DEBUG] Render state:', {
  showOnlyProducts,
  isProductsLoading,
  productsLength: products.length,
  effectiveProductsLength: effectiveProducts.length,
  filteredProductsLength: filteredProducts.length,
  pagedProductsLength: pagedProducts.length,
  shouldShowProductsLoading,
  currentPage,
  totalPages,
  productFilters
});
```

## Status
🔧 **Logs de debug adicionados** - Deploy necessário para coletar informações de produção

## Mudanças Implementadas

### 1. Logs no `useEffect` que carrega produtos
```typescript
useEffect(() => {
  console.log('[DEBUG Products Page] useEffect triggered, organizationId:', organizationId);
  if (!organizationId) {
    console.log('[DEBUG Products Page] No organizationId, skipping loadProducts');
    return;
  }
  const timeoutId = window.setTimeout(() => {
    console.log('[DEBUG Products Page] Calling loadProducts...');
    void loadProducts();
  }, 0);
  return () => window.clearTimeout(timeoutId);
}, [organizationId, loadProducts]);
```

### 2. Logs na função `loadProducts`
```typescript
const loadProducts = useCallback(async () => {
  console.log('[DEBUG Products Page] loadProducts called, organizationId:', organizationId);
  setIsProductsLoading(true);
  try {
    const list = await ProductService.getAll(organizationId ?? undefined);
    console.log('[DEBUG Products Page] Products fetched:', list.length, 'products');
    handleProductsResponse(list);
    // ...
  }
}, [organizationId, handleProductsResponse]);
```

### 3. Logs no `ProductService.getAll`
```typescript
async getAll(organizationId?: string): Promise<ProductItem[]> {
  console.log('[DEBUG ProductService] getAll called with organizationId:', organizationId);
  // ...
  console.log('[DEBUG ProductService] Executing query...');
  const { data, error } = await primary;
  console.log('[DEBUG ProductService] Query result:', { dataLength: data?.length, error });
  // ...
}
```

### 4. Logs na renderização da página de produtos
```typescript
{showOnlyProducts ? (
  <>
    {console.log('[DEBUG Products Page] Rendering products page:', {
      showOnlyProducts,
      isProductsLoading,
      productsLength: products.length,
      effectiveProductsLength: effectiveProducts.length,
      filteredProductsLength: filteredProducts.length,
      pagedProductsLength: pagedProducts.length,
      shouldShowProductsLoading,
      currentPage,
      totalPages,
      productFilters,
      organizationId
    })}
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ... */}
    </div>
  </>
) : null}
```

## Próximos Passos

1. ✅ Adicionar logs de debug
2. 🔄 Fazer deploy para produção
3. 🔍 Analisar logs no console do navegador em produção
4. 🔧 Aplicar correção baseada nos logs
5. 🧹 Remover logs de debug após correção

## Arquivos Modificados
- `src/components/DropshippingCalculator.tsx`
- `src/services/productService.ts`

