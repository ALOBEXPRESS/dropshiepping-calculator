import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type GenderFilter = 'male' | 'female' | 'all';

export interface LeadWithGender {
  lead_id: string;
  lead_name: string;
  lead_email: string | null;
  lead_phone: string | null;
  gender: 'male' | 'female' | null;
  gender_probability: number | null;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
}

export function useLeadsWithGender(
  organizationId: string,
  genderFilter: GenderFilter,
  refreshTrigger?: number
): { leads: LeadWithGender[]; loading: boolean; error: string | null; count: number } {
  const [leads, setLeads] = useState<LeadWithGender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeadsWithGender = async () => {
      if (!organizationId) { setLoading(false); return; }

      setLoading(true);
      setError(null);

      try {
        // Convert 'all' filter to null for the RPC call
        const genderParam = genderFilter === 'all' ? null : genderFilter;

        // Call RPC function get_leads_with_gender
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_leads_with_gender', {
            p_organization_id: organizationId,
            p_gender_filter: genderParam,
          });

        if (rpcError) throw rpcError;

        // Map the RPC response to LeadWithGender interface
        const leadsData = (rpcData || []) as LeadWithGender[];

        setLeads(leadsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar leads com gênero');
        console.error('Error fetching leads with gender:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadsWithGender();
  }, [organizationId, genderFilter, refreshTrigger]);

  return { leads, loading, error, count: leads.length };
}
