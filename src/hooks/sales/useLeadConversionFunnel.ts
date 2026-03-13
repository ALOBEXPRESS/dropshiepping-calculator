import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

interface LeadConversionFunnel {
  stages: FunnelStage[];
  totalLeads: number;
  conversionRate: number;
}

export const useLeadConversionFunnel = (organizationId: string, refreshTrigger?: number) => {
  const [data, setData] = useState<LeadConversionFunnel>({
    stages: [],
    totalLeads: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeadFunnel = async () => {
      if (!organizationId) return;

      setLoading(true);
      setError(null);

      try {
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('lead_status, total_orders')
          .eq('organization_id', organizationId);

        if (leadsError) throw leadsError;

        if (leads && leads.length > 0) {
          const totalLeads = leads.length;

          // Contar por status
          const statusCounts = {
            new: leads.filter(l => l.lead_status === 'new').length,
            contacted: leads.filter(l => l.lead_status === 'contacted').length,
            qualified: leads.filter(l => l.lead_status === 'qualified').length,
            converted: leads.filter(l => l.lead_status === 'converted' || (Number(l.total_orders) || 0) > 0).length,
            recurring: leads.filter(l => (Number(l.total_orders) || 0) > 1).length,
          };

          const stages: FunnelStage[] = [
            {
              stage: 'Novos Leads',
              count: statusCounts.new,
              percentage: totalLeads > 0 ? (statusCounts.new / totalLeads) * 100 : 0,
              color: 'from-blue-500 to-blue-600',
            },
            {
              stage: 'Contatados',
              count: statusCounts.contacted,
              percentage: totalLeads > 0 ? (statusCounts.contacted / totalLeads) * 100 : 0,
              color: 'from-indigo-500 to-indigo-600',
            },
            {
              stage: 'Qualificados',
              count: statusCounts.qualified,
              percentage: totalLeads > 0 ? (statusCounts.qualified / totalLeads) * 100 : 0,
              color: 'from-purple-500 to-purple-600',
            },
            {
              stage: 'Convertidos',
              count: statusCounts.converted,
              percentage: totalLeads > 0 ? (statusCounts.converted / totalLeads) * 100 : 0,
              color: 'from-green-500 to-green-600',
            },
            {
              stage: 'Recorrentes',
              count: statusCounts.recurring,
              percentage: totalLeads > 0 ? (statusCounts.recurring / totalLeads) * 100 : 0,
              color: 'from-emerald-500 to-emerald-600',
            },
          ];

          const conversionRate = totalLeads > 0 ? (statusCounts.converted / totalLeads) * 100 : 0;

          setData({
            stages,
            totalLeads,
            conversionRate,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar funil de conversão');
        console.error('Error fetching lead funnel:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadFunnel();
  }, [organizationId, refreshTrigger]);

  return { data, loading, error };
};
