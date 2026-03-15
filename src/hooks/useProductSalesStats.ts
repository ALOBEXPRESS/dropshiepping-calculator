import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProductSalesStats {
  totalSales: number;
  totalQuantity: number;
  totalProfit: number;
  totalRevenue: number;
  totalCost: number;
}

export const useProductSalesStats = (productId?: string) => {
  const [stats, setStats] = useState<ProductSalesStats>({
    totalSales: 0,
    totalQuantity: 0,
    totalProfit: 0,
    totalRevenue: 0,
    totalCost: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!productId) {
        console.log('[useProductSalesStats] No productId provided');
        setStats({
          totalSales: 0,
          totalQuantity: 0,
          totalProfit: 0,
          totalRevenue: 0,
          totalCost: 0
        });
        setLoading(false);
        return;
      }

      console.log('[useProductSalesStats] Fetching stats for productId:', productId);
      setLoading(true);
      setError(null);

      try {
        // Buscar estatísticas de vendas do produto
        // Usar inner join para filtrar apenas pedidos não cancelados
        const { data, error: fetchError } = await supabase
          .from('order_items')
          .select(`
            quantity,
            total_price,
            profit,
            cost,
            orders!inner(
              status
            )
          `)
          .eq('product_id', productId)
          .neq('orders.status', 'cancelled');

        if (fetchError) throw fetchError;

        console.log('[useProductSalesStats] Raw data:', data);

        // Calcular estatísticas
        const totalSales = data?.length || 0;
        const totalQuantity = data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        const totalProfit = data?.reduce((sum, item) => sum + (Number(item.profit) || 0), 0) || 0;
        const totalRevenue = data?.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0) || 0;
        const totalCost = data?.reduce((sum, item) => sum + (Number(item.cost) || 0), 0) || 0;

        console.log('[useProductSalesStats] Calculated stats:', {
          totalSales,
          totalQuantity,
          totalProfit,
          totalRevenue,
          totalCost
        });

        setStats({
          totalSales,
          totalQuantity,
          totalProfit,
          totalRevenue,
          totalCost
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
