import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProductSalesStats {
  totalSales: number;
  totalQuantity: number;
  totalProfit: number;
  totalRevenue: number;
}

export const useProductSalesStats = (productId?: string) => {
  const [stats, setStats] = useState<ProductSalesStats>({
    totalSales: 0,
    totalQuantity: 0,
    totalProfit: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!productId) {
        setStats({
          totalSales: 0,
          totalQuantity: 0,
          totalProfit: 0,
          totalRevenue: 0
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Buscar estatísticas de vendas do produto
        const { data, error: fetchError } = await supabase
          .from('order_items')
          .select(`
            quantity,
            total_price,
            profit,
            order:orders!inner(
              status
            )
          `)
          .eq('product_id', productId)
          .neq('order.status', 'cancelled');

        if (fetchError) throw fetchError;

        // Calcular estatísticas
        const totalSales = data?.length || 0;
        const totalQuantity = data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        const totalProfit = data?.reduce((sum, item) => sum + (Number(item.profit) || 0), 0) || 0;
        const totalRevenue = data?.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0) || 0;

        setStats({
          totalSales,
          totalQuantity,
          totalProfit,
          totalRevenue
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
        console.error('Error fetching product sales stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [productId]);

  return { stats, loading, error };
};
