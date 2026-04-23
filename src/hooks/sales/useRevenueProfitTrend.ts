import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface TrendData {
  date: string;
  revenue: number;
  profit: number;
  avg_margin: number;
  orders_count: number;
}

export function useRevenueProfitTrend(organizationId: string, days: number = 30) {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('order_date, total_amount, total_profit, profit_margin')
          .eq('organization_id', organizationId)
          .eq('status', 'completed')
          .gte('order_date', startDate.toISOString());

        if (ordersError) throw ordersError;

        // Group by date
        interface GroupedTrend {
          date: string;
          revenue: number;
          profit: number;
          avg_margin: number;
          orders_count: number;
          margin_sum: number;
        }

        const grouped = ordersData.reduce((acc, order) => {
          const date = new Date(order.order_date).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = {
              date,
              revenue: 0,
              profit: 0,
              avg_margin: 0,
              orders_count: 0,
              margin_sum: 0
            };
          }
          acc[date].revenue += order.total_amount || 0;
          acc[date].profit += order.total_profit || 0;
          acc[date].margin_sum += order.profit_margin || 0;
          acc[date].orders_count += 1;
          return acc;
        }, {} as Record<string, GroupedTrend>);

        // Calculate averages and sort
        const result = Object.values(grouped).map((item: GroupedTrend) => ({
          date: item.date,
          revenue: item.revenue,
          profit: item.profit,
          avg_margin: item.orders_count > 0 ? item.margin_sum / item.orders_count : 0,
          orders_count: item.orders_count
        })).sort((a, b) => a.date.localeCompare(b.date));

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
  }, [organizationId, days]);

  return { data, loading, error };
}
