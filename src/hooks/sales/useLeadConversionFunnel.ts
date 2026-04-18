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
        // Buscar todos os leads com contagem de pedidos processados (tabela orders)
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select(`
            id,
            total_orders,
            orders!lead_id (id)
          `)
          .eq('organization_id', organizationId);

        if (leadsError) throw leadsError;

        if (!leads || leads.length === 0) {
          setData({ stages: [], totalLeads: 0, conversionRate: 0 });
          return;
        }

        const totalLeads = leads.length;

        // Classificar cada lead segundo as regras de negócio:
        // - Novo Lead:    total_orders = 0 (nunca comprou)
        // - Recorrente:   total_orders > 1 E processed_count = 0 (comprou mais de uma vez, nenhuma processada)
        // - Convertido:   processed_count = 1 (exatamente 1 "Processar Lucro")
        // - Qualificado:  processed_count > 1 (mais de 1 "Processar Lucro")
        let novos = 0;
        let recorrentes = 0;
        let convertidos = 0;
        let qualificados = 0;

        for (const lead of leads) {
          const processedCount = Array.isArray(lead.orders) ? lead.orders.length : 0;
          const blingOrders = Number(lead.total_orders) || 0;

          if (processedCount > 1) {
            qualificados++;
          } else if (processedCount === 1) {
            convertidos++;
          } else if (blingOrders > 1) {
            // Comprou mais de uma vez no Bling mas nenhuma foi processada
            recorrentes++;
          } else {
            // total_orders = 0 ou 1 sem processamento = novo lead
            novos++;
          }
        }

        const stages: FunnelStage[] = [
          {
            stage: 'Novos Leads',
            count: novos,
            percentage: totalLeads > 0 ? (novos / totalLeads) * 100 : 0,
            color: 'from-blue-500 to-blue-600',
          },
          {
            stage: 'Recorrentes',
            count: recorrentes,
            percentage: totalLeads > 0 ? (recorrentes / totalLeads) * 100 : 0,
            color: 'from-indigo-500 to-indigo-600',
          },
          {
            stage: 'Convertidos',
            count: convertidos,
            percentage: totalLeads > 0 ? (convertidos / totalLeads) * 100 : 0,
            color: 'from-green-500 to-green-600',
          },
          {
            stage: 'Qualificados',
            count: qualificados,
            percentage: totalLeads > 0 ? (qualificados / totalLeads) * 100 : 0,
            color: 'from-emerald-500 to-emerald-600',
          },
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
  }, [organizationId, refreshTrigger]);

  return { data, loading, error };
};
