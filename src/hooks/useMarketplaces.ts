/**
 * useMarketplaces Hook
 * 
 * Custom React Query hook for fetching available marketplaces.
 */

import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '../services/dashboardService';

export interface Marketplace {
  id: string;
  name: string;
}

export interface UseMarketplacesReturn {
  marketplaces: Marketplace[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Custom hook for fetching marketplaces list
 * 
 * @returns Object containing marketplaces array, loading state, and error state
 */
export function useMarketplaces(): UseMarketplacesReturn {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['marketplaces'],
    queryFn: () => DashboardService.fetchMarketplaces(),
    staleTime: 10 * 60 * 1000, // 10 minutes - marketplaces don't change often
  });

  return {
    marketplaces: data || [],
    isLoading,
    isError,
    error: error as Error | null,
  };
}
