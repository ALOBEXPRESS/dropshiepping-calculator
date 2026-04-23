import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RevenueData, PeriodFilter } from '@/types/sales';

export const useRevenueReport = (organizationId: string, period: PeriodFilter) => {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: result, error: fetchError } = await supabase.rpc('get_revenue_report', {
        p_organization_id: organizationId,
        p_period: period,
      });

      if (fetchError) throw fetchError;
      setData(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      console.error('Error fetching revenue report:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, period]);

  useEffect(() => {
    if (organizationId) { fetchData(); } else { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, period]);

  return { data, loading, error, refetch: fetchData };
};
