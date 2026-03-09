import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCard } from '@/components/products-loaded/ProductCard';
import { BLING_PAGE_SIZE, useProductsBling, type BlingProductFilters, type BlingProductItem } from '@/hooks/useProductsBling';
import { useDebounce } from '@/hooks/useDebounce';

type ProductsLoadedProps = {
  organizationId?: string | null;
  onFill: (product: BlingProductItem, variations: BlingProductItem[]) => void;
  onUpdate?: (product: BlingProductItem, variations: BlingProductItem[]) => void;
  registeredBlingIds?: Set<string>;
  registeredSkus?: Set<string>;
};

export const ProductsLoaded = ({ organizationId, onFill, onUpdate, registeredBlingIds, registeredSkus }: ProductsLoadedProps) => {
  const location = useLocation();
  const normalizeSku = (value?: string | null) => (value ?? '').trim().toLowerCase();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  
  // Sync searchInput with URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get('q') || '';
    setSearchInput(urlSearch);
  }, [location.search]);
  
  const {
    items,
    filters,
    page,
    totalCount,
    isLoading,
    error,
    setPage,
    updateFilters,
    fetchProducts
  } = useProductsBling(organizationId);

  // Update filters when debounced search changes
  useEffect(() => {
    updateFilters({ name: debouncedSearch, sku: debouncedSearch });
    setPage(1); // Reset to page 1 when search changes
  }, [debouncedSearch, updateFilters, setPage]);

  const supplierOptions = useMemo(() => {
    const uniqueSuppliers = Array.from(new Set(items.map((item) => item.supplierSku).filter(Boolean)));
    const mapped = uniqueSuppliers.map((supplier) => ({
      value: supplier ?? 'all',
      label: supplier === 'ALOBFOR_DROP_01' ? 'Tyr' : (supplier === 'ALOBEXPRESS_01' ? 'Alob Express' : supplier ?? 'Fornecedor')
    }));
    return [{ value: 'all', label: 'Todos' }, { value: 'uncategorized', label: 'Não categorizado' }, ...mapped];
  }, [items]);

  const ticketOptions: { value: BlingProductFilters['ticket']; label: string }[] = useMemo(() => ([
    { value: 'all', label: 'Todos' },
    { value: 'low-ticket', label: 'Low-ticket' },
    { value: 'high-ticket', label: 'High-ticket' }
  ]), []);
  const handlePriceFilterChange = (key: 'minPrice' | 'maxPrice') => (event: ChangeEvent<HTMLInputElement>) => {
    const sanitized = event.target.value.replace(/[^\d.,]/g, '');
    updateFilters({ [key]: sanitized });
  };

  const groupedItems = useMemo(() => {
    const blingIdSet = new Set<number>();
    const baseMap = new Map<number, { base: BlingProductItem; variations: BlingProductItem[]; originalIndex: number }>();
    const variationsMap = new Map<number, BlingProductItem[]>();
    const standaloneItems: Array<{ base: BlingProductItem; variations: BlingProductItem[]; originalIndex: number }> = [];

    // First pass: identify all bling IDs
    items.forEach((item) => {
      if (item.blingId !== null) {
        blingIdSet.add(item.blingId);
      }
    });

    // Second pass: group products and variations
    items.forEach((item, index) => {
      const isVariation = (item.parentBlingId !== null)
        || (item.categoryId !== null && blingIdSet.has(item.categoryId) && item.categoryId !== item.blingId);
      
      if (isVariation) {
        const parentId = item.parentBlingId ?? item.categoryId;
        if (parentId !== null) {
          const list = variationsMap.get(parentId) ?? [];
          list.push(item);
          variationsMap.set(parentId, list);
          return;
        }
        standaloneItems.push({ base: item, variations: [], originalIndex: index });
        return;
      }

      if (item.blingId !== null) {
        // Only keep the first occurrence of each base product (maintains original order)
        if (!baseMap.has(item.blingId)) {
          baseMap.set(item.blingId, { base: item, variations: [], originalIndex: index });
        }
      } else {
        standaloneItems.push({ base: item, variations: [], originalIndex: index });
      }
    });

    // Attach variations to their base products and keep the base product's originalIndex
    // Since items are already sorted by created_at DESC, we want to maintain that order
    // If a variation is more recent than its base, the base should inherit that position
    baseMap.forEach((group, blingId) => {
      group.variations = variationsMap.get(blingId) ?? [];
      // Find the most recent product in the group (lowest index = most recent)
      const allIndices = [group.originalIndex, ...group.variations.map(v => {
        const vIndex = items.findIndex(item => item.id === v.id);
        return vIndex >= 0 ? vIndex : Number.MAX_SAFE_INTEGER;
      })];
      // Use the minimum index (most recent product) to position the entire group
      group.originalIndex = Math.min(...allIndices);
    });

    // Handle orphaned variations (variations without a base product)
    variationsMap.forEach((variations, parentId) => {
      if (!baseMap.has(parentId)) {
        variations.forEach((item) => {
          // Use the actual index from items array to maintain sort order
          const actualIndex = items.findIndex(i => i.id === item.id);
          standaloneItems.push({ base: item, variations: [], originalIndex: actualIndex >= 0 ? actualIndex : items.length });
        });
      }
    });

    // Combine and sort by original index to maintain created_at DESC order
    const allGroups = [...Array.from(baseMap.values()), ...standaloneItems];
    allGroups.sort((a, b) => a.originalIndex - b.originalIndex);

    const result = allGroups.map(({ base, variations }) => ({ base, variations }));

    return result;
  }, [items]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(groupedItems.length / BLING_PAGE_SIZE)),
    [groupedItems.length]
  );

  // Reset page to 1 if current page exceeds total pages
  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages, setPage]);

  const pagedGroups = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const from = (safePage - 1) * BLING_PAGE_SIZE;
    return groupedItems.slice(from, from + BLING_PAGE_SIZE);
  }, [groupedItems, page, totalPages]);

  useEffect(() => {
    void fetchProducts(page, filters);
  }, [fetchProducts, filters, page]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Produtos integrados</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            {totalCount} produto{totalCount === 1 ? '' : 's'} encontrado{totalCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2">
          {(filters.supplierSku !== 'all' || filters.name || filters.sku || filters.ticket !== 'all' || filters.minPrice || filters.maxPrice) && (
            <Button
              type="button"
              variant="outline"
              className="h-9 border-orange-200 bg-orange-50 text-xs font-semibold text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-200 dark:hover:bg-orange-900"
              onClick={() => {
                setSearchInput('');
                updateFilters({
                  supplierSku: 'all',
                  name: '',
                  sku: '',
                  ticket: 'all',
                  minPrice: '',
                  maxPrice: ''
                });
              }}
            >
              Limpar Filtros
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="h-9 border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => fetchProducts(page, filters)}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2 space-y-2">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nome ou SKU"
            className="h-9 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className={filters.supplierSku === 'uncategorized'
                ? 'h-9 border-[#fe2c55] bg-[#fe2c55] text-xs font-semibold text-white hover:bg-[#fe2c55]'
                : 'h-9 border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'}
              onClick={() => {
                const newValue = filters.supplierSku === 'uncategorized' ? 'all' : 'uncategorized';
                updateFilters({ supplierSku: newValue });
                setPage(1); // Reset to page 1 when toggling uncategorized filter
              }}
            >
              Não categorizado
            </Button>
            <div className="flex min-w-[220px] flex-1 items-center gap-2">
              <Input
                value={filters.minPrice}
                onChange={handlePriceFilterChange('minPrice')}
                placeholder="Preço mínimo"
                inputMode="decimal"
                className="h-9 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              />
              <Input
                value={filters.maxPrice}
                onChange={handlePriceFilterChange('maxPrice')}
                placeholder="Preço máximo"
                inputMode="decimal"
                className="h-9 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400"
              />
            </div>
          </div>
        </div>
        <div className="md:col-span-1">
          <Select
            value={filters.ticket}
            onValueChange={(value) => {
              updateFilters({ ticket: value as BlingProductFilters['ticket'] });
              setPage(1); // Reset to page 1 when changing ticket filter
            }}
          >
            <SelectTrigger className="h-9 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
              <SelectValue placeholder="Ticket médio" />
            </SelectTrigger>
            <SelectContent>
              {ticketOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-1 space-y-2">
          <Select
            value={filters.supplierSku}
            onValueChange={(value) => {
              updateFilters({ supplierSku: value });
              setPage(1); // Reset to page 1 when changing supplier filter
            }}
          >
            <SelectTrigger className="h-9 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
              <SelectValue placeholder="Fornecedor" />
            </SelectTrigger>
            <SelectContent>
              {supplierOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-end">
            <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-semibold uppercase text-gray-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              INTEGRAÇÃO BLING
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="aspect-[4/3] w-full bg-gray-100 dark:bg-zinc-800" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-zinc-800" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 rounded bg-gray-100 dark:bg-zinc-800" />
                <div className="h-12 rounded bg-gray-100 dark:bg-zinc-800" />
                <div className="h-12 rounded bg-gray-100 dark:bg-zinc-800" />
                <div className="h-12 rounded bg-gray-100 dark:bg-zinc-800" />
              </div>
              <div className="h-8 rounded bg-gray-100 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
        {!isLoading && items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Nenhum produto do Bling encontrado.
          </div>
        )}
        {!isLoading && pagedGroups.map((group) => {
          const baseSku = normalizeSku(group.base.sku);
          const hasRegisteredSku = Boolean(
            (baseSku && registeredSkus?.has(baseSku))
            || group.variations.some((variation) => {
              const variationSku = normalizeSku(variation.sku);
              return variationSku && registeredSkus?.has(variationSku);
            })
          );
          const isRegistered = Boolean(
            registeredBlingIds?.has(group.base.id)
            || group.variations.some((variation) => registeredBlingIds?.has(variation.id))
            || hasRegisteredSku
          );
          return (
          <ProductCard
            key={group.base.id}
            product={group.base}
            variations={group.variations}
            onFill={onFill}
            onUpdate={onUpdate}
            isRegistered={isRegistered}
          />
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            disabled={page === 1}
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-600 dark:text-zinc-400">
            Página {page} de {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            disabled={page === totalPages}
            onClick={() => setPage(Math.min(totalPages, page + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
