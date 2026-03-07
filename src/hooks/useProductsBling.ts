import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
    try {
      setIsLoading(true);
      setError('');
      setPage((prev) => (prev === targetPage ? prev : targetPage));

      const buildQuery = (withOrganization: boolean) => {
        let query = supabase
          .from('products_bling')
          .select('id,bling_id,id_produto_pai,variacao_nome,name,descricao,sku,sale_price,cost_price,stock_quantity,image_url1,image_url,situacao,sku_fornecedor,grupo_produto_id,created_at,updated_at,id_categoria,peso,largura,altura,profundidade,unidade_medida', { count: 'exact' });

        if (withOrganization && organizationId) {
          query = query.eq('organization_id', organizationId);
        }
        
        // Busca unificada: se name e sku têm o mesmo valor, buscar por OR
        if (currentFilters.name && currentFilters.sku && currentFilters.name === currentFilters.sku) {
          query = query.or(`name.ilike.%${currentFilters.name}%,sku.ilike.%${currentFilters.sku}%`);
        } else {
          // Busca separada (caso legado)
          if (currentFilters.name) {
            query = query.ilike('name', `%${currentFilters.name}%`);
          }
          if (currentFilters.sku) {
            query = query.ilike('sku', `%${currentFilters.sku}%`);
          }
        }
        if (currentFilters.supplierSku && currentFilters.supplierSku !== 'all') {
          if (currentFilters.supplierSku === 'uncategorized') {
            // Filtrar produtos não categorizados:
            // - sku_fornecedor IS NULL, OU
            // - sku_fornecedor NOT IN ('ALOBFOR_DROP_01', 'ALOBEXPRESS_01')
            query = query.or('sku_fornecedor.is.null,and(sku_fornecedor.not.eq.ALOBFOR_DROP_01,sku_fornecedor.not.eq.ALOBEXPRESS_01)');
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

        // We'll sort in JavaScript after fetching to handle NULL created_at properly
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

      // Buscar contagem de vendas para cada produto
      const productIds = (data ?? []).map((row) => row.id);
      const productSkus = (data ?? []).map((row) => row.sku).filter(Boolean);
      const salesCountMap = new Map<string, number>();

      if (productIds.length > 0 || productSkus.length > 0) {
        // Query by product_bling_id FK
        const { data: salesByIdData } = await supabase
          .from('bling_order_items')
          .select('product_bling_id, quantity')
          .in('product_bling_id', productIds);

        if (salesByIdData) {
          salesByIdData.forEach((item) => {
            if (item.product_bling_id) {
              const currentCount = salesCountMap.get(item.product_bling_id) || 0;
              salesCountMap.set(item.product_bling_id, currentCount + (item.quantity || 0));
            }
          });
        }

        // Query by code/SKU field as fallback (only for products not found by FK)
        if (productSkus.length > 0) {
          const { data: salesBySkuData } = await supabase
            .from('bling_order_items')
            .select('code, quantity, product_bling_id')
            .in('code', productSkus);

          if (salesBySkuData) {
            // Map SKU back to product ID
            const skuToIdMap = new Map<string, string>();
            (data ?? []).forEach((row) => {
              if (row.sku) {
                skuToIdMap.set(row.sku, String(row.id));
              }
            });

            salesBySkuData.forEach((item) => {
              if (item.code) {
                const productId = skuToIdMap.get(item.code);
                // Only count if not already counted by product_bling_id
                if (productId && !item.product_bling_id) {
                  const currentCount = salesCountMap.get(productId) || 0;
                  salesCountMap.set(productId, currentCount + (item.quantity || 0));
                }
              }
            });
          }
        }
      }

      const mapped: BlingProductItem[] = (data ?? []).map((row) => ({
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
        parentBlingId: row.id_produto_pai ?? null,
        variationName: row.variacao_nome ?? null,
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

      // Sort by created_at DESC (newest first), using updated_at as fallback for NULL created_at
      // Products with both NULL created_at and updated_at go to the end
      mapped.sort((a, b) => {
        const aDate = new Date(a.createdAt || a.updatedAt || '1970-01-01').getTime();
        const bDate = new Date(b.createdAt || b.updatedAt || '1970-01-01').getTime();
        return bDate - aDate; // DESC order (newest first)
      });
      
      setAllItems(mapped);
      setTotalCount(mapped.length);
      setIsLoading(false);
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
