import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProxiesService } from '@/services/proxiesService';
import type { Proxy, ProxyFormData } from '@/types/proxies';
import { useSettings } from '@/contexts/SettingsContext';
import { useUser } from '@/contexts/UserContext';

export interface UseProxiesReturn {
  proxies: Proxy[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  createProxy: (data: ProxyFormData) => Promise<Proxy>;
  updateProxy: (id: string, data: Partial<ProxyFormData>) => Promise<Proxy>;
  deleteProxy: (id: string) => Promise<void>;
  linkProxy: (platformAccountId: string, proxyId: string | null) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isLinking: boolean;
}

export function useProxies(organizationId?: string | null): UseProxiesReturn {
  const { organizationId: contextOrgId } = useSettings();
  const effectiveOrgId = organizationId !== undefined ? organizationId : contextOrgId;
  const queryClient = useQueryClient();
  const { userId } = useUser();
  const queryKey = ['proxies', effectiveOrgId];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => ProxiesService.list(effectiveOrgId ?? ''),
    enabled: !!effectiveOrgId,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['proxies', effectiveOrgId] });
    // Invalida platform_accounts pois proxy_id pode ter mudado
    queryClient.invalidateQueries({ queryKey: ['platform_accounts', effectiveOrgId] });
  };

  const createMutation = useMutation({
    mutationFn: (formData: ProxyFormData) =>
      ProxiesService.create(effectiveOrgId ?? '', formData, userId ?? undefined),
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: updateData }: { id: string; data: Partial<ProxyFormData> }) =>
      ProxiesService.update(organizationId ?? '', id, updateData),
    onSuccess: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ProxiesService.delete(organizationId ?? '', id),
    onSuccess: () => invalidate(),
  });

  const linkMutation = useMutation({
    mutationFn: ({ platformAccountId, proxyId }: { platformAccountId: string; proxyId: string | null }) =>
      ProxiesService.linkToAccount(organizationId ?? '', platformAccountId, proxyId),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['platform_accounts', organizationId] });
    },
  });

  return {
    proxies: data ?? [],
    isLoading,
    isError,
    error: (error as Error) ?? null,
    refetch,
    createProxy: (formData) => createMutation.mutateAsync(formData),
    updateProxy: (id, updateData) => updateMutation.mutateAsync({ id, data: updateData }),
    deleteProxy: (id) => deleteMutation.mutateAsync(id),
    linkProxy: (platformAccountId, proxyId) =>
      linkMutation.mutateAsync({ platformAccountId, proxyId }),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLinking: linkMutation.isPending,
  };
}
