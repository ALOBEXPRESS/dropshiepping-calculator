import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MarketplacePerformance {
  marketplace: string;
  marketplace_id: string;
  orders_count: number;
  revenue: number;
  profit: number;
  avg_margin: number;
}

interface RevenueReportItem {
  marketplace_id: string;
  marketplace: string;
  revenue: number;
  cost: number;
  profit: number;
}

export function useMarketplacePerformance(organizationId: string, refreshTrigger?: number) {
  const [data, setData] = useState<MarketplacePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Usar get_revenue_report para obter dados com custos dinâmicos
        const { data: revenueData, error: revenueError } = await supabase
          .rpc('get_revenue_report', { org_id: organizationId });

        if (revenueError) throw revenueError;

        // Agrupar por marketplace
        interface GroupedMarketplace {
          marketplace: string;
          marketplace_id: string;
          orders_count: number;
          revenue: number;
          profit: number;
          cost: number;
        }

        const grouped = revenueData.reduce((acc: Record<string, GroupedMarketplace>, item: RevenueReportItem) => {
          const key = item.marketplace_id || 'unknown';
          const name = item.marketplace || 'Sem marketplace';
          
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
          acc[key].revenue += Number(item.revenue) || 0;
          acc[key].profit += Number(item.profit) || 0;
          acc[key].cost += Number(item.cost) || 0;
          
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
    }

    if (organizationId) {
      fetchData();
    }
  }, [organizationId, refreshTrigger]);

  return { data, loading, error };
}
