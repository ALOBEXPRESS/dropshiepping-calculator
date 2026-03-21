import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Batch IDs into chunks to avoid URL length limits (PostgREST IN clause)
async function batchInQuery<T>(
  table: string,
  column: string,
  ids: string[],
  selectCols: string,
  chunkSize = 50
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { data } = await supabase.from(table).select(selectCols).in(column, chunk).limit(1000);
    if (data) results.push(...(data as T[]));
  }
  return results;
}

export type BlingProductItem = {
  id: string;
  name: string;
  description: string;
  sku: string;
  salePrice: number | null;
  costPrice: number | null;
  stockQuantity: number | null;
  imageUrl: string;
  status: string | null;
  supplierSku: string | null;
  groupProductId: string | null;
  categoryId: number | null;
  blingId: number | null;
  parentBlingId: number | null;
  variationName: string | null;
  weight: number | null;
  width: number | null;
  height: number | null;
  depth: number | null;
  unitOfMeasure: string | null;
  marketplace: 'Bling';
  salesCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type BlingProductFilters = {
  name: string;
  sku: string;
  supplierSku: string;
  ticket: 'all' | 'low-ticket' | 'high-ticket';
  minPrice: string;
  maxPrice: string;
};

export const BLING_PAGE_SIZE = 9;

// Fetch sales counts for a list of items in parallel (by ID and by SKU)
async function fetchSalesCounts(
  ids: string[],
  skus: string[],
  idColumn: 'product_bling_id' | 'product_variation_id',
  skuToIdMap: Map<string, string>
): Promise<Map<string, number>> {
  const salesMap = new Map<string, number>();
  if (ids.length === 0 && skus.length === 0) return salesMap;

  type ByIdRow = Record<string, string | number>;
  const [byId, bySku] = await Promise.all([
    ids.length > 0
      ? batchInQuery<ByIdRow>(
          'bling_order_items', idColumn, ids, `${idColumn}, quantity`
        )
      : Promise.resolve([]),
    skus.length > 0
      ? batchInQuery<{ code: string; quantity: number; product_bling_id: string | null; product_variation_id: string | null }>(
          'bling_order_items', 'code', skus, 'code, quantity, product_bling_id, product_variation_id'
        )
      : Promise.resolve([])
  ]);

  for (const item of byId) {
    const key = item[idColumn] as string | undefined;
    if (key) salesMap.set(key, (salesMap.get(key) || 0) + ((item.quantity as number) || 0));
  }

  for (const item of bySku) {
    if (item.code) {
      const itemId = skuToIdMap.get(item.code);
      const alreadyCounted = idColumn === 'product_bling_id' ? item.product_bling_id : item.product_variation_id;
      if (itemId && !alreadyCounted) {
        salesMap.set(itemId, (salesMap.get(itemId) || 0) + (item.quantity || 0));
      }
    }
  }

  return salesMap;
}

export const useProductsBling = (organizationId?: string | null) => {
  const [allItems, setAllItems] = useState<BlingProductItem[]>([]);
  const [filters, setFilters] = useState<BlingProductFilters>({
    name: '',
    sku: '',
    supplierSku: 'all',
    ticket: 'all',
    minPrice: '',
    maxPrice: ''
  });
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // Track the current fetch so background variation loads don't overwrite newer fetches
  const fetchIdRef = useRef(0);
  const isAbortError = (err: unknown) =>
    (err instanceof DOMException && err.name === 'AbortError')
    || (err instanceof Error && err.name === 'AbortError');

  const parsePriceValue = (value: string) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const hasComma = trimmed.includes(',');
    const normalized = hasComma
      ? trimmed.replace(/\./g, '').replace(',', '.')
      : trimmed.replace(/,/g, '');
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  };
  const sanitizeDescription = (value?: string | null) => {
    if (!value) return '';
    const withBreaks = value
      .replace(/<\s*br\s*\/?>/gi, '\n')
      .replace(/<\/\s*p\s*>/gi, '\n')
      .replace(/<\s*p[^>]*>/gi, '');
    const withoutTags = withBreaks.replace(/<[^>]*>/g, '');
    const withoutEntities = withoutTags.replace(/&nbsp;/gi, ' ');
    return withoutEntities
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n');
  };

  const fetchProducts = useCallback(async (targetPage: number, currentFilters: BlingProductFilters) => {
    const fetchId = ++fetchIdRef.current;
    try {
      setIsLoading(true);
      setError('');
      setPage((prev) => (prev === targetPage ? prev : targetPage));

      const buildQuery = (withOrganization: boolean) => {
        let query = supabase
          .from('products_bling')
          .select('id,bling_id,name,descricao,sku,sale_price,cost_price,stock_quantity,image_url1,image_url,situacao,sku_fornecedor,grupo_produto_id,created_at,updated_at,id_categoria,peso,largura,altura,profundidade,unidade_medida', { count: 'exact' });

        if (withOrganization && organizationId) {
          query = query.eq('organization_id', organizationId);
        }
        
        // Busca unificada: se name e sku têm o mesmo valor, buscar por OR
        if (currentFilters.name && currentFilters.sku && currentFilters.name === currentFilters.sku) {
          query = query.or(`name.ilike.%${currentFilters.name}%,sku.ilike.%${currentFilters.sku}%`);
        } else {
          if (currentFilters.name) {
            query = query.ilike('name', `%${currentFilters.name}%`);
          }
          if (currentFilters.sku) {
            query = query.ilike('sku', `%${currentFilters.sku}%`);
          }
        }
        if (currentFilters.supplierSku && currentFilters.supplierSku !== 'all') {
          if (currentFilters.supplierSku === 'uncategorized') {
            query = query.or('sku_fornecedor.is.null,and(sku_fornecedor.not.eq.ALOBFOR_DROP_01,sku_fornecedor.not.eq.ALOBEXPRESS_01,sku_fornecedor.not.eq.ALOBFOR_DROP_02)');
          } else {
            query = query.eq('sku_fornecedor', currentFilters.supplierSku);
          }
        }
        if (currentFilters.ticket === 'low-ticket') {
          query = query.eq('grupo_produto_id', 770097);
        }
        if (currentFilters.ticket === 'high-ticket') {
          query = query.eq('grupo_produto_id', 770098);
        }
        const minPrice = parsePriceValue(currentFilters.minPrice);
        const maxPrice = parsePriceValue(currentFilters.maxPrice);
        if (minPrice !== null) {
          query = query.gte('sale_price', minPrice);
        }
        if (maxPrice !== null) {
          query = query.lte('sale_price', maxPrice);
        }

        return query;
      };

      const primary = await buildQuery(Boolean(organizationId));
      let data = primary.data;
      let queryError = primary.error;
      let count = primary.count;

      if (queryError && organizationId) {
        const fallback = await buildQuery(false);
        if (!fallback.error) {
          data = fallback.data;
          queryError = fallback.error;
          count = fallback.count;
        }
      }

      if (!queryError && organizationId && (count ?? 0) === 0) {
        const fallback = await buildQuery(false);
        if (!fallback.error) {
          data = fallback.data;
          queryError = fallback.error;
          count = fallback.count;
        }
      }

      if (queryError) {
        setAllItems([]);
        setTotalCount(0);
        setError('Não foi possível carregar os produtos do Bling.');
        setIsLoading(false);
        return;
      }

      const rows = data ?? [];
      const productIds = rows.map((row) => String(row.id));
      const productSkus = rows.map((row) => row.sku).filter(Boolean) as string[];

      // Build SKU→ID map for sales lookup
      const skuToIdMap = new Map<string, string>();
      rows.forEach((row) => { if (row.sku) skuToIdMap.set(row.sku, String(row.id)); });

      // Fetch products sales and variations in parallel
      // Variations use batchInQuery to avoid PostgREST URL length limits with many UUIDs
      const [salesCountMap, variationsData] = await Promise.all([
        fetchSalesCounts(productIds, productSkus, 'product_bling_id', skuToIdMap),
        productIds.length > 0
          ? batchInQuery<{
              id: string; product_id: string; bling_id: number | null;
              name: string | null; descricao: string | null; sku: string | null;
              sale_price: number | null; cost_price: number | null; stock_quantity: number | null;
              image_url1: string | null; situacao: string | null; sku_fornecedor: string | null;
              variacao_nome: string | null; created_at: string | null; updated_at: string | null;
              peso: number | null; largura: number | null; altura: number | null;
              profundidade: number | null; unidade_medida: string | null;
            }>(
              'products_variations_bling',
              'product_id',
              productIds,
              'id,product_id,bling_id,name,descricao,sku,sale_price,cost_price,stock_quantity,image_url1,situacao,sku_fornecedor,variacao_nome,created_at,updated_at,peso,largura,altura,profundidade,unidade_medida',
              50
            )
          : Promise.resolve([])
      ]);

      if (fetchId !== fetchIdRef.current) return; // Stale fetch, discard

      const mapped: BlingProductItem[] = rows.map((row) => ({
        id: String(row.id),
        name: row.name ?? '',
        description: sanitizeDescription(row.descricao),
        sku: row.sku ?? '',
        salePrice: row.sale_price ?? null,
        costPrice: row.cost_price ?? null,
        stockQuantity: row.stock_quantity ?? null,
        imageUrl: row.image_url1 || row.image_url || '',
        status: row.situacao ?? null,
        supplierSku: row.sku_fornecedor ?? null,
        groupProductId: row.grupo_produto_id ?? null,
        categoryId: row.id_categoria ?? null,
        blingId: row.bling_id ?? null,
        parentBlingId: null,
        variationName: null,
        weight: row.peso ?? null,
        width: row.largura ?? null,
        height: row.altura ?? null,
        depth: row.profundidade ?? null,
        unitOfMeasure: row.unidade_medida ?? null,
        marketplace: 'Bling',
        salesCount: salesCountMap.get(String(row.id)) || 0,
        createdAt: row.created_at ?? null,
        updatedAt: row.updated_at ?? null
      }));

      // variationsData already resolved from batchInQuery above

      // Map variations (without sales counts yet — those load in background)
      const variationsMapped: BlingProductItem[] = variationsData.map((row) => {
        const parentProduct = mapped.find(p => p.id === row.product_id);
        return {
          id: String(row.id),
          name: row.name ?? '',
          description: sanitizeDescription(row.descricao),
          sku: row.sku ?? '',
          salePrice: row.sale_price ?? null,
          costPrice: row.cost_price ?? null,
          stockQuantity: row.stock_quantity ?? null,
          imageUrl: row.image_url1 || '',
          status: row.situacao ?? null,
          supplierSku: row.sku_fornecedor ?? null,
          groupProductId: null,
          categoryId: parentProduct?.blingId ?? null,
          blingId: row.bling_id ?? null,
          parentBlingId: parentProduct?.blingId ?? null,
          variationName: row.variacao_nome ?? null,
          weight: row.peso ?? null,
          width: row.largura ?? null,
          height: row.altura ?? null,
          depth: row.profundidade ?? null,
          unitOfMeasure: row.unidade_medida ?? null,
          marketplace: 'Bling',
          salesCount: 0, // Will be updated in background
          createdAt: row.created_at ?? null,
          updatedAt: row.updated_at ?? null
        };
      });

      // Show products + variations immediately (sales for variations = 0 for now)
      const allProducts = [...mapped, ...variationsMapped];
      allProducts.sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt || '1970-01-01').getTime();
        const bDate = new Date(b.updatedAt || b.createdAt || '1970-01-01').getTime();
        return bDate - aDate;
      });

      setAllItems(allProducts);
      setTotalCount(mapped.length);
      setIsLoading(false);

      // Load variation sales counts in background (non-blocking)
      if (variationsData.length > 0) {
        const variationIds = variationsData.map(v => String(v.id));
        const variationSkus = variationsData.map(v => v.sku).filter(Boolean) as string[];
        const varSkuToIdMap = new Map<string, string>();
        variationsData.forEach((row) => { if (row.sku) varSkuToIdMap.set(row.sku, String(row.id)); });

        fetchSalesCounts(variationIds, variationSkus, 'product_variation_id', varSkuToIdMap).then((varSalesMap) => {
          if (fetchId !== fetchIdRef.current) return; // Stale, discard
          setAllItems((prev) =>
            prev.map((item) => {
              const count = varSalesMap.get(item.id);
              return count !== undefined ? { ...item, salesCount: count } : item;
            })
          );
        }).catch(() => { /* silent fail for background update */ });
      }

    } catch (err) {
      if (!isAbortError(err)) {
        setAllItems([]);
        setTotalCount(0);
        setError('Não foi possível carregar os produtos do Bling.');
      }
      setIsLoading(false);
    }
  }, [organizationId]);

  const updateFilters = useCallback((next: Partial<BlingProductFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  }, []);

  return {
    items: allItems,
    filters,
    page,
    totalCount,
    isLoading,
    error,
    setPage,
    updateFilters,
    fetchProducts
  };
};
