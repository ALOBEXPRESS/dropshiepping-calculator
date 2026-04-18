import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface GenderDistribution {
  male: number;
  female: number;
  unclassified: number;
  total: number;
  malePercent: number;
  femalePercent: number;
  unclassifiedPercent: number;
}

export function useGenderDistribution(
  organizationId: string,
  refreshTrigger?: number
): { data: GenderDistribution; loading: boolean; error: string | null } {
  const [data, setData] = useState<GenderDistribution>({
    male: 0,
    female: 0,
    unclassified: 0,
    total: 0,
    malePercent: 0,
    femalePercent: 0,
    unclassifiedPercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenderDistribution = async () => {
      if (!organizationId) return;

      setLoading(true);
      setError(null);

      try {
        // Call RPC function get_gender_distribution
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_gender_distribution', {
            p_organization_id: organizationId,
          });

        if (rpcError) throw rpcError;

        // Parse the JSON response from the RPC
        const counts = rpcData as {
          male: number;
          female: number;
          unclassified: number;
          total: number;
        };

        // Calculate percentages
        const total = counts.total || 0;
        const malePercent = total > 0 ? (counts.male / total) * 100 : 0;
        const femalePercent = total > 0 ? (counts.female / total) * 100 : 0;
        const unclassifiedPercent = total > 0 ? (counts.unclassified / total) * 100 : 0;

        setData({
          male: counts.male || 0,
          female: counts.female || 0,
          unclassified: counts.unclassified || 0,
          total,
          malePercent,
          femalePercent,
          unclassifiedPercent,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar distribuição de gênero');
        console.error('Error fetching gender distribution:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGenderDistribution();
  }, [organizationId, refreshTrigger]);

  return { data, loading, error };
}
