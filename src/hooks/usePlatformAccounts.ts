import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettings } from '@/contexts/SettingsContext';
import { PlatformAccountsService } from '@/services/platformAccountsService';
import type {
  PlatformAccountFormData,
  PlatformAccountFilters,
} from '@/types/platformAccounts';

const QUERY_KEY = 'platform_accounts';

/**
 * Hook para listagem de contas de plataforma da organização atual.
 * Mesmo padrão de useAdAccounts — TanStack Query + SettingsContext.
 */
export function usePlatformAccounts(filters?: PlatformAccountFilters) {
  const { organizationId } = useSettings();

  return useQuery({
    queryKey: [QUERY_KEY, organizationId, filters],
    queryFn: () => PlatformAccountsService.list(organizationId!, filters),
    enabled: !!organizationId,
    staleTime: 1000 * 60, // 1 min
  });
}

/**
 * Busca uma conta de plataforma por ID.
 */
export function usePlatformAccount(id: string | null | undefined) {
  const { organizationId } = useSettings();

  return useQuery({
    queryKey: [QUERY_KEY, organizationId, 'detail', id],
    queryFn: () => PlatformAccountsService.getById(organizationId!, id!),
    enabled: !!organizationId && !!id,
    staleTime: 1000 * 60,
  });
}

/**
 * Mutações: criar, atualizar, excluir conta de plataforma.
 */
export function usePlatformAccountMutations() {
  const { organizationId } = useSettings();
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY, organizationId] });

  const create = useMutation({
    mutationFn: ({
      data,
      userId,
    }: {
      data: PlatformAccountFormData;
      userId?: string | null;
    }) => PlatformAccountsService.create(organizationId!, data, userId),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PlatformAccountFormData>;
    }) => PlatformAccountsService.update(organizationId!, id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      PlatformAccountsService.delete(organizationId!, id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
