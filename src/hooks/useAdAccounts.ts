import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdAccountsService } from '@/services/adAccountsService';
import type {
  AdAccount,
  AdAccountWithStats,
  AdAccountFilters,
  AdAccountFormData,
  AdAccountStatus,
} from '@/types/adAccounts';
import { useUser } from '@/contexts/UserContext';

export interface UseAdAccountsReturn {
  accounts: AdAccountWithStats[];
  adAccounts: AdAccountWithStats[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  createAccount: (data: AdAccountFormData) => Promise<AdAccount>;
  updateAccount: (id: string, data: Partial<AdAccountFormData>) => Promise<AdAccount>;
  updateStatus: (id: string, status: AdAccountStatus) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useAdAccounts(
  organizationId: string | null,
  filters?: AdAccountFilters
): UseAdAccountsReturn {
  const queryClient = useQueryClient();
  const queryKey = [
    'ad_accounts',
    organizationId,
    filters?.search ?? '',
    filters?.status ?? 'all',
    filters?.platform ?? 'all',
  ];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => AdAccountsService.list(organizationId ?? '', filters),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ad_accounts', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['campaigns', organizationId] });
  };

  const createMutation = useMutation({
    mutationFn: (formData: AdAccountFormData) =>
      AdAccountsService.create(organizationId ?? '', formData, userId ?? undefined),
    onSuccess: () => {
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: updateData }: { id: string; data: Partial<AdAccountFormData> }) =>
      AdAccountsService.update(organizationId ?? '', id, updateData),
    onSuccess: () => {
      invalidate();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdAccountStatus }) =>
      AdAccountsService.updateStatus(organizationId ?? '', id, status),
    onSuccess: () => {
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => AdAccountsService.delete(organizationId ?? '', id),
    onSuccess: () => {
      invalidate();
    },
  });

  return {
    accounts: data ?? [],
    adAccounts: data ?? [],
    isLoading,
    isError,
    error: (error as Error) ?? null,
    refetch,
    createAccount: (formData) => createMutation.mutateAsync(formData),
    updateAccount: (id, updateData) => updateMutation.mutateAsync({ id, data: updateData }),
    updateStatus: (id, status) => statusMutation.mutateAsync({ id, status }),
    deleteAccount: (id) => deleteMutation.mutateAsync(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending || statusMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook para obter dados de uma conta específica
 */
export function useAdAccount(organizationId: string | null, accountId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['ad_account', organizationId, accountId];

  const query = useQuery({
    queryKey,
    queryFn: () => AdAccountsService.getById(organizationId ?? '', accountId ?? ''),
    enabled: !!organizationId && !!accountId,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['ad_accounts', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['campaigns', organizationId] });
  };

  return {
    ...query,
    account: query.data ?? null,
    invalidate,
  };
}
