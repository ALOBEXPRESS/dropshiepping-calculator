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

export const useLeadConversionFunnel = (
  organizationId: string, 
  refreshTrigger?: number,
  period: 'day' | 'week' | 'month' | 'year' | 'total' = 'total',
  marketplaceId?: string | null
) => {
  const [data, setData] = useState<LeadConversionFunnel>({
    stages: [],
    totalLeads: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeadFunnel = async () => {
      if (!organizationId) { setLoading(false); return; }

      setLoading(true);
      setError(null);

      try {
        // Calcular o intervalo de datas baseado no período
        const now = new Date();
        let startDate: Date | null = null;

        switch (period) {
          case 'day':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'month':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'year':
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'total':
          default:
            startDate = null; // Sem filtro de data
            break;
        }

        // Construir query com filtro de data se necessário
        const query = supabase
          .from('leads')
          .select('id, lead_status, created_at')
          .eq('organization_id', organizationId);

        if (marketplaceId) {
          query.eq('marketplace_id', marketplaceId);
        }

        if (startDate) {
          query.gte('created_at', startDate.toISOString());
        }

        const { data: leads, error: leadsError } = await query;

        if (leadsError) throw leadsError;

        if (!leads || leads.length === 0) {
          setData({ stages: [], totalLeads: 0, conversionRate: 0 });
          return;
        }

        const totalLeads = leads.length;

        // Count by lead_status from DB
        const counts: Record<string, number> = {};
        for (const lead of leads) {
          const s = lead.lead_status || 'new';
          counts[s] = (counts[s] || 0) + 1;
        }

        const novos = counts['new'] || 0;
        const recorrentes = counts['recurrent'] || 0;
        const convertidos = counts['converted'] || 0;
        const qualificados = counts['qualified'] || 0;
        const perdidos = counts['lost'] || 0;

        const stages: FunnelStage[] = [
          { stage: 'Novos Leads',  count: novos,       percentage: totalLeads > 0 ? (novos / totalLeads) * 100 : 0,       color: 'from-blue-500 to-blue-600' },
          { stage: 'Recorrentes',  count: recorrentes, percentage: totalLeads > 0 ? (recorrentes / totalLeads) * 100 : 0, color: 'from-indigo-500 to-indigo-600' },
          { stage: 'Convertidos',  count: convertidos, percentage: totalLeads > 0 ? (convertidos / totalLeads) * 100 : 0, color: 'from-green-500 to-green-600' },
          { stage: 'Qualificados', count: qualificados,percentage: totalLeads > 0 ? (qualificados / totalLeads) * 100 : 0,color: 'from-emerald-500 to-emerald-600' },
          { stage: 'Perdidos',     count: perdidos,    percentage: totalLeads > 0 ? (perdidos / totalLeads) * 100 : 0,    color: 'from-red-500 to-red-600' },
        ];

        // Taxa de conversão = leads com pelo menos 1 pedido processado / total
        const convertedOrQualified = convertidos + qualificados;
        const conversionRate = totalLeads > 0 ? (convertedOrQualified / totalLeads) * 100 : 0;

        setData({ stages, totalLeads, conversionRate });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar funil de conversão');
        console.error('Error fetching lead funnel:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadFunnel();
  }, [organizationId, refreshTrigger, period, marketplaceId]);

  return { data, loading, error };
};
