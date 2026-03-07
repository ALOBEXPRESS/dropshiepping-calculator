import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AccountHolder {
  id: string;
  name: string;
  type: string;
}

export const useAccountHolders = () => {
  const [holders, setHolders] = useState<AccountHolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHolders = async () => {
      try {
        console.log('[AccountHolders] Starting fetch...');
        setLoading(true);
        
        // Tentar buscar do banco sem filtro de organização
        const { data, error: fetchError } = await supabase
          .from('account_holders')
          .select('id, name, type')
          .not('type', 'is', null)  // Apenas titulares com tipo definido
          .order('name', { ascending: true });

        console.log('[AccountHolders] Fetch result:', { data, error: fetchError });

        if (fetchError) {
          console.error('[AccountHolders] Error fetching:', fetchError);
          throw fetchError;
        }

        if (data && data.length > 0) {
          console.log('[AccountHolders] Setting holders from database:', data);
          setHolders(data);
          setError(null);
        } else {
          // Fallback se não houver dados
          console.warn('[AccountHolders] No data found, using fallback');
          const fallbackHolders = [
            { id: '1', name: 'Alyson', type: 'CPF' },
            { id: '2', name: 'Emelyn', type: 'CPF' },
            { id: '3', name: 'João', type: 'CPF' },
            { id: '4', name: 'Jonatan', type: 'CPF' },
            { id: '5', name: 'Pedro', type: 'CPF' }
          ];
          console.log('[AccountHolders] Setting fallback holders:', fallbackHolders);
          setHolders(fallbackHolders);
        }
      } catch (err) {
        console.error('[AccountHolders] Catch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch account holders');
        // Fallback para valores hardcoded
        const fallbackHolders = [
          { id: '1', name: 'Alyson', type: 'CPF' },
          { id: '2', name: 'Emelyn', type: 'CPF' },
          { id: '3', name: 'João', type: 'CPF' },
          { id: '4', name: 'Jonatan', type: 'CPF' },
          { id: '5', name: 'Pedro', type: 'CPF' }
        ];
        console.log('[AccountHolders] Setting fallback holders after error:', fallbackHolders);
        setHolders(fallbackHolders);
      } finally {
        setLoading(false);
        console.log('[AccountHolders] Fetch complete, loading set to false');
      }
    };

    fetchHolders();
  }, []);

  return { holders, loading, error };
};
