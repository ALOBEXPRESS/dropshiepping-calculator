import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettings } from '@/contexts/SettingsContext';
import { BusinessCentersService } from '@/services/businessCentersService';
import type {
  RelationshipType,
  PermissionLevel,
  RelationshipStatus,
} from '@/types/businessCenters';
import { toast } from 'sonner';

export const BC_ACCOUNTS_QUERY_KEY = 'business_center_platform_accounts';

/**
 * Hook para listar contas de plataforma vinculadas a um Business Center específico (N:N).
 */
export function useBusinessCenterLinkedAccounts(businessCenterId?: string | null) {
  const { organizationId } = useSettings();

  return useQuery({
    queryKey: [BC_ACCOUNTS_QUERY_KEY, organizationId, 'bc', businessCenterId],
    queryFn: () =>
      BusinessCentersService.getLinkedAccounts(
        organizationId!,
        businessCenterId!
      ),
    enabled: !!organizationId && !!businessCenterId,
    staleTime: 1000 * 30, // 30s
  });
}

/**
 * Hook para listar Business Centers aos quais uma Conta de Plataforma está vinculada (N:N).
 */
export function useAccountLinkedBusinessCenters(platformAccountId?: string | null) {
  const { organizationId } = useSettings();

  return useQuery({
    queryKey: [BC_ACCOUNTS_QUERY_KEY, organizationId, 'account', platformAccountId],
    queryFn: () =>
      BusinessCentersService.getLinkedBusinessCentersForAccount(
        organizationId!,
        platformAccountId!
      ),
    enabled: !!organizationId && !!platformAccountId,
    staleTime: 1000 * 30,
  });
}

/**
 * Mutações para gerenciar vínculos N:N entre BCs e Contas de Plataforma.
 */
export function useBusinessCenterAccountMutations() {
  const { organizationId } = useSettings();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: [BC_ACCOUNTS_QUERY_KEY, organizationId],
    });
    queryClient.invalidateQueries({
      queryKey: ['business_centers', organizationId],
    });
    queryClient.invalidateQueries({
      queryKey: ['platform_accounts', organizationId],
    });
    queryClient.invalidateQueries({
      queryKey: ['infra_graph', organizationId],
    });
  };

  const linkMutation = useMutation({
    mutationFn: (data: {
      business_center_id: string;
      platform_account_id: string;
      relationship_type: RelationshipType;
      permission_level?: PermissionLevel;
      status?: RelationshipStatus;
      notes?: string | null;
      external_relation_id?: string | null;
    }) => BusinessCentersService.linkAccount(organizationId!, data),
    onSuccess: () => {
      invalidate();
      toast.success('Conta vinculada ao Business Center com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao vincular conta ao Business Center.');
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: ({
      business_center_id,
      platform_account_id,
    }: {
      business_center_id: string;
      platform_account_id: string;
    }) =>
      BusinessCentersService.unlinkAccount(
        organizationId!,
        business_center_id,
        platform_account_id
      ),
    onSuccess: () => {
      invalidate();
      toast.success('Vínculo removido com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao desvincular conta.');
    },
  });

  const updateRelationMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      business_center_id?: string;
      platform_account_id?: string;
      data: Partial<{
        relationship_type: RelationshipType;
        permission_level: PermissionLevel;
        status: RelationshipStatus;
        notes: string | null;
        external_relation_id: string | null;
      }>;
    }) =>
      BusinessCentersService.updateAccountRelation(organizationId!, id, data),
    onSuccess: () => {
      invalidate();
      toast.success('Relação atualizada com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao atualizar relação.');
    },
  });

  return {
    linkAccount: linkMutation.mutateAsync,
    isLinking: linkMutation.isPending,
    unlinkAccount: unlinkMutation.mutateAsync,
    isUnlinking: unlinkMutation.isPending,
    updateRelation: updateRelationMutation.mutateAsync,
    isUpdatingRelation: updateRelationMutation.isPending,
  };
}
