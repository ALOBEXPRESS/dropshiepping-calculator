import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MarketplacePerformance {
  marketplace: string;
  orders_count: number;
  revenue: number;
  profit: number;
  avg_margin: number;
  total_commission: number;
}

export function useMarketplacePerformance(organizationId: string) {
  const [data, setData] = useState<MarketplacePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('marketplace_id, total_amount, total_profit, profit_margin, marketplace_commission')
          .eq('organization_id', organizationId)
          .eq('status', 'completed');

        if (ordersError) throw ordersError;

        // Group by marketplace_id
        interface GroupedMarketplace {
          marketplace: string;
          orders_count: number;
          revenue: number;
          profit: number;
          avg_margin: number;
          total_commission: number;
          margin_sum: number;
        }

        const grouped = ordersData.reduce((acc, order) => {
          const key = order.marketplace_id || 'unknown';
          if (!acc[key]) {
            acc[key] = {
              marketplace: key,
              orders_count: 0,
              revenue: 0,
              profit: 0,
              avg_margin: 0,
              total_commission: 0,
              margin_sum: 0
            };
          }
          acc[key].orders_count += 1;
          acc[key].revenue += order.total_amount || 0;
          acc[key].profit += order.total_profit || 0;
          acc[key].margin_sum += order.profit_margin || 0;
          acc[key].total_commission += order.marketplace_commission || 0;
          return acc;
        }, {} as Record<string, GroupedMarketplace>);

        // Calculate averages and format
        const result = Object.values(grouped).map((item: GroupedMarketplace) => ({
          marketplace: item.marketplace,
          orders_count: item.orders_count,
          revenue: item.revenue,
          profit: item.profit,
          avg_margin: item.orders_count > 0 ? item.margin_sum / item.orders_count : 0,
          total_commission: item.total_commission
        })).sort((a, b) => b.profit - a.profit);

        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      fetchData();
    }
  }, [organizationId]);

  return { data, loading, error };
}
