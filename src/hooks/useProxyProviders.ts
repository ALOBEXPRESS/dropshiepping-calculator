import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProxyProvidersService } from '@/services/proxyProvidersService';
import type { ProxyProviderFormData } from '@/types/proxyProviders';
import { useSettings } from '@/contexts/SettingsContext';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';

export function useProxyProviders() {
  const queryClient = useQueryClient();
  const { organizationId } = useSettings();
  const { userId } = useUser();

  const queryKey = ['proxy_providers', organizationId];
  const queryKeyWithStats = ['proxy_providers_with_stats', organizationId];

  // Lista básica para selects e comboboxes
  const listQuery = useQuery({
    queryKey,
    queryFn: () => ProxyProvidersService.list(organizationId || ''),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5, // 5 min
  });

  // Lista com estatísticas de contagem de proxies para a aba Provedores
  const listWithStatsQuery = useQuery({
    queryKey: queryKeyWithStats,
    queryFn: () => ProxyProvidersService.listWithStats(organizationId || ''),
    enabled: !!organizationId,
    staleTime: 1000 * 30, // 30s
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: queryKeyWithStats });
  };

  const createMutation = useMutation({
    mutationFn: (data: ProxyProviderFormData) =>
      ProxyProvidersService.create(organizationId || '', data, userId),
    onSuccess: (newProvider) => {
      toast.success(`Provedor "${newProvider.name}" cadastrado com sucesso!`);
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao cadastrar provedor');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProxyProviderFormData> }) =>
      ProxyProvidersService.update(organizationId || '', id, data),
    onSuccess: () => {
      toast.success('Provedor atualizado com sucesso!');
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao atualizar provedor');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ProxyProvidersService.delete(organizationId || '', id),
    onSuccess: () => {
      toast.success('Provedor removido com sucesso!');
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao excluir provedor');
    },
  });

  return {
    providers: listQuery.data ?? [],
    providersWithStats: listWithStatsQuery.data ?? [],
    isLoading: listQuery.isLoading || listWithStatsQuery.isLoading,
    error: listQuery.error || listWithStatsQuery.error,
    createProvider: createMutation.mutateAsync,
    updateProvider: updateMutation.mutateAsync,
    deleteProvider: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: invalidate,
  };
}
