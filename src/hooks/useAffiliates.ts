import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AffiliateDB {
  id: string;
  organization_id: string;
  name: string;
  instagram: string | null;
  tiktok: string | null;
  twitter: string | null;
  percentage: number;
  created_at: string;
  updated_at: string;
}

export const useAffiliates = (organizationId?: string) => {
  const [affiliates, setAffiliates] = useState<AffiliateDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAffiliates = async () => {
      setLoading(true);
      setError(null);

      try {
        // Resolve the correct org: prefer the member's org over the context org
        let orgId = organizationId;

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: members } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1);
          if (members && members.length > 0) {
            orgId = members[0].organization_id;
          }
        }

        if (!orgId) {
          setAffiliates([]);
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('affiliates')
          .select('*')
          .eq('organization_id', orgId)
          .order('name', { ascending: true });

        if (fetchError) throw fetchError;
        setAffiliates(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar afiliados');
        console.error('Error fetching affiliates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliates();
  }, [organizationId]);

  return { affiliates, loading, error };
};
