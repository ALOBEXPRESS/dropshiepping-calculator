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

      setLoading(true);
      setError(null);

      try {
        // Buscar estatísticas de vendas do produto
        // Primeiro buscar todos os order_items do produto
        const { data: orderItems, error: fetchError } = await supabase
          .from('order_items')
          .select(`
            quantity,
            total_price,
            profit,
            unit_cost,
            total_cost,
            order_id
          `)
          .eq('product_id', productId);

        if (fetchError) throw fetchError;

        if (!orderItems || orderItems.length === 0) {
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

        // Buscar os status dos pedidos
        const orderIds = orderItems.map(item => item.order_id);
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id, status')
          .in('id', orderIds);

        if (ordersError) throw ordersError;

        // Criar um map de order_id para status
        const orderStatusMap = new Map(orders?.map(o => [o.id, o.status]) || []);

        // Filtrar apenas order_items de pedidos não cancelados
        const validOrderItems = orderItems.filter(item => {
          const status = orderStatusMap.get(item.order_id);
          return status && status !== 'cancelled';
        });

        // Calcular estatísticas
        const totalSales = validOrderItems.length;
        const totalQuantity = validOrderItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const totalProfit = validOrderItems.reduce((sum, item) => sum + (Number(item.profit) || 0), 0);
        const totalRevenue = validOrderItems.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
        const totalCost = validOrderItems.reduce((sum, item) => sum + (Number(item.total_cost) || 0), 0);

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
