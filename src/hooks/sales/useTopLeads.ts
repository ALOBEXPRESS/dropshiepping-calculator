import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface TopLead {
  lead_id: string;
  lead_name: string;
  lead_email: string | null;
  lead_phone: string | null;
  bling_orders: number;
  total_spent: number;
  last_order_date: string | null;
}

export const useTopLeads = (organizationId: string, limit: number = 50) => {
  const [leads, setLeads] = useState<TopLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc('get_top_leads', {
        p_organization_id: organizationId,
        p_limit: limit,
      });

      if (fetchError) throw fetchError;
      setLeads(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar leads');
      console.error('Error fetching top leads:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, limit]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, loading, error, refetch: fetchLeads };
};
