import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProductSalesCount {
  [productId: string]: number;
}

export const useMultipleProductsSalesStats = (productIds: string[]) => {
  const [salesCounts, setSalesCounts] = useState<ProductSalesCount>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Stable serialized key to avoid re-running on every render when array reference changes
  const productIdsKey = productIds.join(',');
  const productIdsKeyRef = useRef(productIdsKey);
  productIdsKeyRef.current = productIdsKey;

  useEffect(() => {
    const fetchStats = async () => {
      const ids = productIdsKeyRef.current ? productIdsKeyRef.current.split(',').filter(Boolean) : [];
      if (ids.length === 0) {
        setSalesCounts({});
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('order_items')
          .select(`
            product_id,
            quantity,
            order:orders!inner(
              status
            )
          `)
          .in('product_id', ids)
          .neq('order.status', 'cancelled');

        if (fetchError) throw fetchError;

        const counts: ProductSalesCount = {};
        data?.forEach((item) => {
          if (item.product_id) {
            counts[item.product_id] = (counts[item.product_id] || 0) + (item.quantity || 0);
          }
        });

        setSalesCounts(counts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
        console.error('Error fetching multiple products sales stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [productIdsKey]); // stable string dep — no complex expression, no missing deps

  return { salesCounts, loading, error };
};
