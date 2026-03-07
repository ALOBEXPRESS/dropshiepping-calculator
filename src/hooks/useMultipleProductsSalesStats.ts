import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProductSalesCount {
  [productId: string]: number;
}

export const useMultipleProductsSalesStats = (productIds: string[]) => {
  const [salesCounts, setSalesCounts] = useState<ProductSalesCount>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!productIds || productIds.length === 0) {
        setSalesCounts({});
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Buscar contagem de vendas para todos os produtos de uma vez
        const { data, error: fetchError } = await supabase
          .from('order_items')
          .select(`
            product_id,
            quantity,
            order:orders!inner(
              status
            )
          `)
          .in('product_id', productIds)
          .neq('order.status', 'cancelled');

        if (fetchError) throw fetchError;

        // Agrupar por product_id e contar vendas
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
  }, [JSON.stringify(productIds)]); // eslint-disable-line react-hooks/exhaustive-deps

  return { salesCounts, loading, error };
};
