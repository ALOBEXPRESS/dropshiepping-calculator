import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { StatisticsData } from '@/types/sales';

export const useStatisticsCards = (organizationId: string) => {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!organizationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase.rpc('get_statistics_cards', {
        p_organization_id: organizationId,
      });

      if (fetchError) throw fetchError;
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) { fetchStats(); } else { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  return { stats, loading, error, refetch: fetchStats };
};
