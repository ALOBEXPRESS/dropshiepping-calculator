/**
 * useMarketplaces Hook
 *
 * Fetches available marketplaces for the current user's organization.
 */

import { useQuery } from '@tanstack/react-query';
import { DashboardService } from '../services/dashboardService';
import { useSettings } from '@/contexts/SettingsContext';

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

export function useMarketplaces(): UseMarketplacesReturn {
  const { organizationId } = useSettings();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['marketplaces', organizationId],
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
    queryFn: () => DashboardService.fetchMarketplaces(organizationId!),
  });

  return {
    marketplaces: data ?? [],
    isLoading,
    isError,
    error: error as Error | null,
  };
}
