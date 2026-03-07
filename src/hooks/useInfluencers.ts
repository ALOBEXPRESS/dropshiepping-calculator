import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface InfluencerDB {
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

export const useInfluencers = (organizationId?: string) => {
  const [influencers, setInfluencers] = useState<InfluencerDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfluencers = async () => {
      if (!organizationId) {
        setInfluencers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('influencers')
          .select('*')
          .eq('organization_id', organizationId)
          .order('name', { ascending: true });

        if (fetchError) throw fetchError;

        setInfluencers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar influencers');
        console.error('Error fetching influencers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInfluencers();
  }, [organizationId]);

  return { influencers, loading, error };
};
