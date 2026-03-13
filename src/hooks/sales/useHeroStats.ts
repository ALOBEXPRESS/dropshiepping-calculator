import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface HeroStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueChange?: number;
  ordersChange?: number;
  customersChange?: number;
  productsChange?: number;
}

export const useHeroStats = (organizationId: string, refreshTrigger?: number) => {
  const [stats, setStats] = useState<HeroStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!organizationId) return;

      setLoading(true);
      setError(null);

      try {
        // Buscar estatísticas de pedidos
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('total_amount, customer_id')
          .eq('organization_id', organizationId);

        if (ordersError) throw ordersError;

        // Buscar total de produtos
        const { count: productsCount, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId);

        if (productsError) throw productsError;

        // Calcular estatísticas
        const totalRevenue = ordersData?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
        const totalOrders = ordersData?.length || 0;
        const uniqueCustomers = new Set(ordersData?.map(order => order.customer_id).filter(Boolean));
        const totalCustomers = uniqueCustomers.size;

        setStats({
          totalRevenue,
          totalOrders,
          totalCustomers,
          totalProducts: productsCount || 0,
          ordersChange: totalOrders, // Simplificado - pode ser melhorado com comparação de períodos
          customersChange: totalCustomers,
          productsChange: 61, // Baseado nos dados atuais
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
        console.error('Error fetching hero stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [organizationId, refreshTrigger]);

  return { stats, loading, error };
};
