import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface MarketplacePerformance {
  marketplace: string;
  marketplace_id: string;
  orders_count: number;
  revenue: number;
  profit: number;
  avg_margin: number;
}

export function useMarketplacePerformance(organizationId: string, refreshTrigger?: number) {
  const [data, setData] = useState<MarketplacePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
      try {
        setLoading(true);
        
        // Usar get_revenue_report para obter dados com custos dinâmicos
        const { data: revenueData, error: revenueError } = await supabase
          .rpc('get_revenue_report', { 
            p_organization_id: organizationId,
            p_period: 'monthly'
          });

        if (revenueError) throw revenueError;

        if (!revenueData || revenueData.length === 0) {
          setData([]);
          return;
        }

        // Flatten orders_data from all periods
        interface OrderData {
          marketplace_id: string;
          marketplace: string;
          total_amount: number;
          total_cost: number;
          total_profit: number;
        }

        interface GroupedMarketplace {
          marketplace: string;
          marketplace_id: string;
          orders_count: number;
          revenue: number;
          profit: number;
          cost: number;
        }

        const allOrders: OrderData[] = [];
        interface PeriodData {
          orders_data?: OrderData[];
        }
        revenueData.forEach((period: PeriodData) => {
          if (period.orders_data && Array.isArray(period.orders_data)) {
            allOrders.push(...period.orders_data);
          }
        });

        // Agrupar por marketplace
        const grouped = allOrders.reduce((acc: Record<string, GroupedMarketplace>, order: OrderData) => {
          const key = order.marketplace_id || 'unknown';
          const name = order.marketplace || 'Sem marketplace';
          
          if (!acc[key]) {
            acc[key] = {
              marketplace: name,
              marketplace_id: key,
              orders_count: 0,
              revenue: 0,
              profit: 0,
              cost: 0,
            };
          }
          
          acc[key].orders_count += 1;
          acc[key].revenue += Number(order.total_amount) || 0;
          acc[key].profit += Number(order.total_profit) || 0;
          acc[key].cost += Number(order.total_cost) || 0;
          
          return acc;
        }, {});

        // Calcular margem média e formatar
        const result = (Object.values(grouped) as GroupedMarketplace[]).map((item) => ({
          marketplace: item.marketplace,
          marketplace_id: item.marketplace_id,
          orders_count: item.orders_count,
          revenue: item.revenue,
          profit: item.profit,
          avg_margin: item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0,
        })).sort((a, b) => b.profit - a.profit);

        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchData();
    }
  }, [organizationId, refreshTrigger, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
