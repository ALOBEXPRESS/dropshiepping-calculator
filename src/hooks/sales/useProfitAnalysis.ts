import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ProfitAnalysis {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  totalCommissions: number;
  totalShipping: number;
  totalExpenses: number;
  costPercentage: number;
  commissionPercentage: number;
  profitPercentage: number;
}

interface RevenueReportItem {
  revenue: number;
  cost: number;
  profit: number;
}

export const useProfitAnalysis = (organizationId: string, refreshTrigger?: number) => {
  const [data, setData] = useState<ProfitAnalysis>({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMargin: 0,
    totalCommissions: 0,
    totalShipping: 0,
    totalExpenses: 0,
    costPercentage: 0,
    commissionPercentage: 0,
    profitPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfitAnalysis = async () => {
      if (!organizationId) return;

      setLoading(true);
      setError(null);

      try {
        // Usar get_revenue_report para obter dados com custos dinâmicos
        const { data: revenueData, error: revenueError } = await supabase
          .rpc('get_revenue_report', { org_id: organizationId });

        if (revenueError) throw revenueError;

        if (revenueData && revenueData.length > 0) {
          // Somar todos os valores do revenue report
          const totalRevenue = revenueData.reduce((sum: number, item: RevenueReportItem) => sum + (Number(item.revenue) || 0), 0);
          const totalCost = revenueData.reduce((sum: number, item: RevenueReportItem) => sum + (Number(item.cost) || 0), 0);
          const totalProfit = revenueData.reduce((sum: number, item: RevenueReportItem) => sum + (Number(item.profit) || 0), 0);
          
          // Buscar comissões, frete e outras despesas da tabela orders
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('marketplace_commission, shipping_cost, other_expenses')
            .eq('organization_id', organizationId);

          if (ordersError) throw ordersError;

          const totalCommissions = ordersData?.reduce((sum, o) => sum + (Number(o.marketplace_commission) || 0), 0) || 0;
          const totalShipping = ordersData?.reduce((sum, o) => sum + (Number(o.shipping_cost) || 0), 0) || 0;
          const totalExpenses = ordersData?.reduce((sum, o) => sum + (Number(o.other_expenses) || 0), 0) || 0;
          
          const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
          const costPercentage = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;
          const commissionPercentage = totalRevenue > 0 ? (totalCommissions / totalRevenue) * 100 : 0;
          const profitPercentage = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

          setData({
            totalRevenue,
            totalCost,
            totalProfit,
            profitMargin,
            totalCommissions,
            totalShipping,
            totalExpenses,
            costPercentage,
            commissionPercentage,
            profitPercentage,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar análise de lucro');
        console.error('Error fetching profit analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfitAnalysis();
  }, [organizationId, refreshTrigger]);

  return { data, loading, error };
};
