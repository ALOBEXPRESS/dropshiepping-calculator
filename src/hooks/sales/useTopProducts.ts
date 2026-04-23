import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { TopProduct } from '@/types/sales';

export const useTopProducts = (organizationId: string, limit: number = 5) => {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!organizationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase.rpc('get_top_selling_products', {
        p_organization_id: organizationId,
        p_limit: limit,
      });

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
      console.error('Error fetching top products:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, limit]);

  useEffect(() => {
    if (organizationId) { fetchProducts(); } else { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, limit]);

  return { products, loading, error, refetch: fetchProducts };
};
