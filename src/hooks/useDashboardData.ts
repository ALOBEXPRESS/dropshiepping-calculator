/**
 * useDashboardData Hook
 * 
 * Custom React Query hook for fetching dashboard KPI data.
 * Provides automatic caching, loading states, error handling, and refetching.
 * 
 * Features:
 * - Automatic caching with 5-minute stale time
 * - Refetch on window focus when data is stale
 * - Single retry on failure
 * - Type-safe return values
 * - Error logging for debugging
 * 
 * @example
 * const { data, isLoading, isError, error, refetch } = useDashboardData('week');
 * 
 * if (isLoading) return <LoadingSkeleton />;
 * if (isError) return <ErrorState error={error} onRetry={refetch} />;
 * 
 * return <KPICards data={data} />;
 */

import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '../services/dashboardService';
import type { TimePeriod, DashboardKPIData } from '../types/dashboard';

/**
 * Return type for useDashboardData hook
 */
export interface UseDashboardDataReturn {
  /** Dashboard KPI data (undefined while loading or on error) */
  data: DashboardKPIData | undefined;
  /** True while data is being fetched */
  isLoading: boolean;
  /** True if the query encountered an error */
  isError: boolean;
  /** Error object if query failed, null otherwise */
  error: Error | null;
  /** Function to manually refetch the data */
  refetch: () => void;
}

/**
 * Custom hook for fetching dashboard data with React Query
 * Now supports marketplace filtering
 * 
 * @param period - The time period to fetch data for
 * @param marketplaceId - Optional marketplace ID to filter by
 * @returns Object containing data, loading state, error state, error object, and refetch function
 */
export function useDashboardData(
  period: TimePeriod,
  marketplaceId?: string | null
): UseDashboardDataReturn {
  const { data, isLoading, isError, error, refetch } = useQuery({
    // Query key includes period and marketplace to ensure cache invalidation
    queryKey: ['dashboard', period, marketplaceId || 'all'],
    
    queryFn: async () => {
      try {
        return await DashboardService.fetchDashboardData(period, marketplaceId);
      } catch (err) {
        console.error('[useDashboardData] Query failed:', {
          period,
          marketplaceId: marketplaceId || 'all',
          error: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        throw err;
      }
    },
  });

  return {
    data,
    isLoading,
    isError,
    error: error as Error | null,
    refetch: () => {
      console.log('[useDashboardData] Manual refetch triggered:', { period, marketplaceId: marketplaceId || 'all' });
      refetch();
    }
  };
}
