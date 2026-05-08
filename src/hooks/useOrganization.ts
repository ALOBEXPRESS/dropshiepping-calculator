/**
 * useOrganization Hook
 * 
 * Custom React Query hook for fetching organization data.
 * Used for getting organization name for CSV export filenames.
 * 
 * Requirements: 9.4
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch organization by ID
 */
async function fetchOrganization(organizationId: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, created_at, updated_at')
    .eq('id', organizationId)
    .single();

  if (error) {
    console.error('Error fetching organization:', error);
    return null;
  }

  return data;
}

/**
 * Hook for fetching organization data
 * 
 * @param organizationId - ID of the organization to fetch
 * @returns React Query result with organization data
 */
export function useOrganization(organizationId: string) {
  return useQuery({
    queryKey: ['organization', organizationId],
    queryFn: () => fetchOrganization(organizationId),
    staleTime: 30 * 60 * 1000, // 30 minutes - organization name rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour (formerly cacheTime)
    enabled: !!organizationId,
  });
}
