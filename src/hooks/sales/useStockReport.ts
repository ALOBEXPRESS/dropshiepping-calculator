import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { StockReport } from '@/types/sales';

export const useStockReport = (organizationId: string) => {
  const [stock, setStock] = useState<StockReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStock = async () => {
      if (!organizationId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase.rpc('get_stock_report', {
          p_organization_id: organizationId,
        });

        if (fetchError) throw fetchError;
        setStock(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar estoque');
        console.error('Error fetching stock report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, [organizationId]);

  return { stock, loading, error };
};
