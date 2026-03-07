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
      if (!organizationId) {
        setAffiliates([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('affiliates')
          .select('*')
          .eq('organization_id', organizationId)
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
