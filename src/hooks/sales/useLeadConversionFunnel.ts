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
        // Busca leads que foram criados no período OU que tiveram pedidos no período
        const query = supabase
          .from('leads')
          .select(`
            id,
            total_orders,
            created_at,
            orders!lead_id (id, order_date, processed_at)
          `)
          .eq('organization_id', organizationId);

        if (marketplaceId) {
          query.eq('marketplace_id', marketplaceId);
        }

        const { data: rawLeads, error: leadsError } = await query;

        if (leadsError) throw leadsError;

        // Agrupar pedidos por lead para evitar duplicação
        // Quando um lead tem múltiplos pedidos, o Supabase retorna múltiplas linhas
        const leadsMap = new Map();
        if (rawLeads) {
          for (const row of rawLeads) {
            if (!leadsMap.has(row.id)) {
              leadsMap.set(row.id, {
                id: row.id,
                total_orders: row.total_orders,
                created_at: row.created_at,
                orders: []
              });
            }
            // Adicionar pedidos ao array
            if (row.orders && Array.isArray(row.orders)) {
              const lead = leadsMap.get(row.id);
              lead.orders.push(...row.orders);
            }
          }
        }
        
        const allLeads = Array.from(leadsMap.values());

        // Filtrar leads baseado no período
        let leads = allLeads;
        if (startDate && allLeads) {
          leads = allLeads.filter(lead => {
            // Incluir se o lead foi criado no período
            const createdInPeriod = new Date(lead.created_at) >= startDate;
            
            // OU se teve algum pedido processado no período
            const hasOrderInPeriod = Array.isArray(lead.orders) && lead.orders.some((order: any) => {
              if (!order.order_date) return false;
              return new Date(order.order_date) >= startDate;
            });
            
            return createdInPeriod || hasOrderInPeriod;
          });
        }

        if (!leads || leads.length === 0) {
          setData({ stages: [], totalLeads: 0, conversionRate: 0 });
          return;
        }

        const totalLeads = leads.length;

        // Classificar cada lead segundo as regras de negócio:
        // - Novo Lead:    processed_count = 0 (nunca teve lucro processado)
        // - Recorrente:   total_orders > 2 E processed_count = 0 (mais de 2 pedidos, nenhum processado)
        // - Convertido:   processed_count >= 1 (teve lucro processado)
        // - Qualificado:  processed_count > 1 (teve lucro processado mais de uma vez)
        let novos = 0;
        let recorrentes = 0;
        let convertidos = 0;
        let qualificados = 0;

        for (const lead of leads) {
          const processedCount = Array.isArray(lead.orders) ? lead.orders.length : 0;
          const blingOrders = Number(lead.total_orders) || 0;

          if (processedCount > 1) {
            // Teve lucro processado mais de uma vez
            qualificados++;
          } else if (processedCount === 1) {
            // Teve lucro processado exatamente uma vez
            convertidos++;
          } else if (blingOrders > 2) {
            // Mais de 2 pedidos no Bling mas nenhum processado
            recorrentes++;
          } else {
            // Nenhum lucro processado (pode ter 0, 1 ou 2 pedidos no Bling)
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
  }, [organizationId, refreshTrigger, period, marketplaceId]);

  return { data, loading, error };
};
