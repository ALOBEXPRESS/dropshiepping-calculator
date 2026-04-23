import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LowMarginProduct {
  product_name: string;
  avg_margin: number;
  total_profit: number;
  total_sold: number;
  total_revenue: number;
}

export function useLowMarginProducts(organizationId: string, marginThreshold: number = 20) {
  const [data, setData] = useState<LowMarginProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('product_name, profit_margin, profit, quantity, total_price, order_id')
          .order('product_name');

        if (itemsError) throw itemsError;

        // Get order IDs to filter by organization
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('status', 'completed');

        if (ordersError) throw ordersError;

        const orderIds = new Set(ordersData.map(o => o.id));
        
        // Filter items by organization orders
        const filteredItems = itemsData.filter(item => orderIds.has(item.order_id));

        // Group by product
        interface GroupedProduct {
          product_name: string;
          avg_margin: number;
          total_profit: number;
          total_sold: number;
          total_revenue: number;
          margin_sum: number;
          count: number;
        }

        const grouped = filteredItems.reduce((acc, item) => {
          const key = item.product_name;
          if (!acc[key]) {
            acc[key] = {
              product_name: key,
              avg_margin: 0,
              total_profit: 0,
              total_sold: 0,
              total_revenue: 0,
              margin_sum: 0,
              count: 0
            };
          }
          acc[key].margin_sum += item.profit_margin || 0;
          acc[key].total_profit += item.profit || 0;
          acc[key].total_sold += item.quantity || 0;
          acc[key].total_revenue += item.total_price || 0;
          acc[key].count += 1;
          return acc;
        }, {} as Record<string, GroupedProduct>);

        // Calculate averages and filter by threshold
        const result = Object.values(grouped)
          .map((item: GroupedProduct) => ({
            product_name: item.product_name,
            avg_margin: item.count > 0 ? item.margin_sum / item.count : 0,
            total_profit: item.total_profit,
            total_sold: item.total_sold,
            total_revenue: item.total_revenue
          }))
          .filter(item => item.avg_margin < marginThreshold)
          .sort((a, b) => a.avg_margin - b.avg_margin);

        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [organizationId, marginThreshold]);

  return { data, loading, error };
}
