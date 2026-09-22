/**
 * useDashboardData Hook
 *
 * Fetches the 5 KPI cards using the org's real organization_id
 * (resolved via SettingsContext, same pattern as Sales.tsx).
 */

import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '../services/dashboardService';
import type { TimePeriod, DashboardKPIData } from '../types/dashboard';

export interface UseDashboardDataReturn {
  data: DashboardKPIData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDashboardData(
  organizationId: string | null,
  period: TimePeriod,
  marketplaceId?: string | null
): UseDashboardDataReturn {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard', organizationId, period, marketplaceId ?? 'all'],
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,

    queryFn: async () => {
      return DashboardService.fetchDashboardData(organizationId!, period, marketplaceId);
    },
  });

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}
