import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface CustomerLTV {
  totalCustomers: number;
  avgLifetimeValue: number;
  avgOrderValue: number;
  avgOrdersPerCustomer: number;
  repeatCustomerRate: number;
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalSpent: number;
    totalOrders: number;
    avgOrderValue: number;
    lastOrderDate: string;
  }>;
}

export const useCustomerLifetimeValue = (organizationId: string, refreshTrigger?: number) => {
  const [data, setData] = useState<CustomerLTV>({
    totalCustomers: 0,
    avgLifetimeValue: 0,
    avgOrderValue: 0,
    avgOrdersPerCustomer: 0,
    repeatCustomerRate: 0,
    topCustomers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerLTV = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError(null);

    try {
      // Buscar dados dos leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, name, email, total_orders, total_spent, last_order_date')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('total_spent', { ascending: false });

      if (leadsError) throw leadsError;

      if (leads && leads.length > 0) {
        const totalCustomers = leads.length;
        const totalSpent = leads.reduce((sum, l) => sum + (Number(l.total_spent) || 0), 0);
        const totalOrders = leads.reduce((sum, l) => sum + (Number(l.total_orders) || 0), 0);
        
        const avgLifetimeValue = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        const avgOrdersPerCustomer = totalCustomers > 0 ? totalOrders / totalCustomers : 0;
        
        // Taxa de clientes recorrentes (mais de 1 pedido)
        const repeatCustomers = leads.filter(l => (Number(l.total_orders) || 0) > 1).length;
        const repeatCustomerRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

        // Top 10 clientes
        const topCustomers = leads.slice(0, 10).map(lead => ({
          id: lead.id,
          name: lead.name,
          email: lead.email || '',
          totalSpent: Number(lead.total_spent) || 0,
          totalOrders: Number(lead.total_orders) || 0,
          avgOrderValue: (Number(lead.total_orders) || 0) > 0 
            ? (Number(lead.total_spent) || 0) / (Number(lead.total_orders) || 0) 
            : 0,
          lastOrderDate: lead.last_order_date || '',
        }));

        setData({
          totalCustomers,
          avgLifetimeValue,
          avgOrderValue,
          avgOrdersPerCustomer,
          repeatCustomerRate,
          topCustomers,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar LTV de clientes');
      console.error('Error fetching customer LTV:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) { fetchCustomerLTV(); } else { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, refreshTrigger]);

  return { data, loading, error, refetch: fetchCustomerLTV };
};
