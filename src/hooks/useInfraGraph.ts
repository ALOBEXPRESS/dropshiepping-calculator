import { useQuery } from '@tanstack/react-query';
import { getInfraGraph } from '@/services/infraGraphService';
import type { InfraGraphResponse } from '@/types/infraGraph';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useInfraGraph(organizationId: string | null) {
  return useQuery<InfraGraphResponse, Error>({
    queryKey: ['infra-graph', organizationId],
    queryFn: () => getInfraGraph(organizationId!),
    enabled: !!organizationId,
    staleTime: STALE_TIME,
    retry: 2,
  });
}
