/**
 * useDashboardCharts
 *
 * Fetches real data for the two dashboard charts:
 *  - Conversão (stacked bar chart): orders bucketed by day/month with revenue, fees, profit
 *  - Leads (bubble chart): processed orders categorised by profit status
 */

import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '@/services/dashboardService';
import type { TimePeriod, WeeklyConversionData, LeadStatusData } from '@/types/dashboard';

export interface DashboardChartsData {
  conversions: WeeklyConversionData[];
  leads: LeadStatusData[];
  mostProfitableDay: string;
}

export function useDashboardCharts(
  organizationId: string | null,
  period: TimePeriod,
  marketplaceId?: string | null
) {
  return useQuery<DashboardChartsData>({
    queryKey: ['dashboard-charts', organizationId, period, marketplaceId ?? 'all'],
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,

    queryFn: async () => {
      const orgId = organizationId!;

      const [conversions, leads] = await Promise.all([
        DashboardService.fetchConversionChartData(orgId, period, marketplaceId),
        DashboardService.fetchLeadsChartData(orgId, period, marketplaceId),
      ]);

      // Find the most profitable day/bucket label
      let mostProfitableDay = '—';
      if (conversions.length > 0) {
        const best = conversions.reduce((a, b) => (b.profit > a.profit ? b : a));
        mostProfitableDay = best.day;
      }

      return { conversions, leads, mostProfitableDay };
    },
  });
}
