import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { TopCustomer } from '@/types/sales';

export const useTopCustomers = (organizationId: string, limit: number = 50) => {
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (!organizationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase.rpc('get_top_customers', {
        p_organization_id: organizationId,
        p_limit: limit,
      });

      if (fetchError) throw fetchError;
      setCustomers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
      console.error('Error fetching top customers:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, limit]);

  useEffect(() => {
    if (organizationId) { fetchCustomers(); } else { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, limit]);

  return { customers, loading, error, refetch: fetchCustomers };
};
