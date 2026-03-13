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
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total_amount, total_cost, total_profit, profit_margin, marketplace_commission, shipping_cost, other_expenses')
          .eq('organization_id', organizationId)
          .eq('status', 'completed');

        if (ordersError) throw ordersError;

        if (orders && orders.length > 0) {
          const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
          const totalCost = orders.reduce((sum, o) => sum + (Number(o.total_cost) || 0), 0);
          const totalProfit = orders.reduce((sum, o) => sum + (Number(o.total_profit) || 0), 0);
          const totalCommissions = orders.reduce((sum, o) => sum + (Number(o.marketplace_commission) || 0), 0);
          const totalShipping = orders.reduce((sum, o) => sum + (Number(o.shipping_cost) || 0), 0);
          const totalExpenses = orders.reduce((sum, o) => sum + (Number(o.other_expenses) || 0), 0);
          
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
