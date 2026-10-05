import { useState, useEffect, useCallback } from 'react';
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

  const fetchStats = useCallback(async () => {
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
      // 1. Obter IDs do produto e variações
      const varIds: string[] = [];
      const { data: variations } = await supabase
        .from('products_variations_bling')
        .select('id')
        .eq('product_id', productId);

      if (variations && variations.length > 0) {
        variations.forEach((v) => {
          if (v.id) varIds.push(v.id);
        });
      }

      const productIds = [productId, ...varIds];

      // 2. Buscar vendas na tabela order_items (pedidos processados)
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          product_id,
          quantity,
          unit_price,
          total_price,
          unit_cost,
          total_cost,
          profit,
          orders (
            id,
            order_number,
            total_amount,
            total_cost,
            total_profit,
            status,
            bling_order_id
          )
        `)
        .in('product_id', productIds);

      if (itemsError) {
        console.warn('Erro ao buscar order_items:', itemsError);
      }

      const processedOrderIds = new Set<string>();
      const processedBlingOrderIds = new Set<string>();
      let totalQty = 0;
      let totalRev = 0;
      let totalProf = 0;
      let totalCst = 0;

      // Map to accumulate orders cost and profit without duplicate counts for orders with multiple items
      const orderMetricsMap = new Map<string, { orderCost: number; orderProfit: number; orderRevenue: number }>();

      if (orderItems && orderItems.length > 0) {
        orderItems.forEach((item) => {
          const order = (Array.isArray(item.orders) ? item.orders[0] : item.orders) as {
            id?: string;
            order_number?: string;
            total_amount?: number | string | null;
            total_cost?: number | string | null;
            total_profit?: number | string | null;
            status?: string | null;
            bling_order_id?: string | null;
          } | null;

          if (!order || order.status === 'cancelled') return;

          const ordId = order.id || item.order_id;
          processedOrderIds.add(ordId);
          if (order.bling_order_id) {
            processedBlingOrderIds.add(order.bling_order_id);
          }

          const qty = Number(item.quantity || 1);
          const price = Number(item.total_price || (qty * Number(item.unit_price || 0)));
          totalQty += qty;
          totalRev += price;

          if (!orderMetricsMap.has(ordId)) {
            orderMetricsMap.set(ordId, {
              orderCost: Number(order.total_cost || 0),
              orderProfit: Number(order.total_profit || 0),
              orderRevenue: Number(order.total_amount || 0),
            });
          }
        });

        // Somar custo e lucro reais dos pedidos processados
        orderMetricsMap.forEach((metrics) => {
          totalCst += metrics.orderCost;
          totalProf += metrics.orderProfit;
        });
      }

      // 3. Buscar pedidos pendentes (que ainda não foram processados para orders)
      const { data: pendingOrders, error: pendingError } = await supabase
        .from('pending_orders_to_process')
        .select('bling_order_id, first_product_id, items_count, total_amount, total_cost, estimated_profit');

      if (!pendingError && pendingOrders && pendingOrders.length > 0) {
        pendingOrders.forEach((po) => {
          if (
            po.first_product_id === productId &&
            !processedBlingOrderIds.has(po.bling_order_id) &&
            !processedOrderIds.has(po.bling_order_id)
          ) {
            processedOrderIds.add(po.bling_order_id);
            totalQty += Number(po.items_count || 1);
            totalRev += Number(po.total_amount || 0);
            totalCst += Number(po.total_cost || 0);
            totalProf += Number(po.estimated_profit || 0);
          }
        });
      }

      setStats({
        totalSales: processedOrderIds.size,
        totalQuantity: totalQty,
        totalProfit: totalProf,
        totalRevenue: totalRev,
        totalCost: totalCst
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      console.error('Error fetching product sales stats:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchStats();

    if (!productId) return;

    // Escutar mudanças em tempo real para atualizar conforme novos pedidos entram
    const channel = supabase
      .channel(`product-sales-stats-${productId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bling_orders' }, () => {
        fetchStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bling_order_items' }, () => {
        fetchStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};
