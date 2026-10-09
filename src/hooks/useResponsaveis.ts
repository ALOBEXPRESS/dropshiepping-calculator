import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettings } from '@/contexts/SettingsContext';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import {
  TestadoresService,
  TitularesService,
  InfluenciadoresService,
  TitularSubscriptionsService,
} from '@/services/responsaveisService';
import type {
  TestadorFormData,
  TitularFormData,
  InfluenciadorFormData,
  TitularSubscriptionFormData,
} from '@/types/responsaveis';

// ── useTestadores ────────────────────────────────────────────────────────────

export function useTestadores() {
  const queryClient = useQueryClient();
  const { organizationId } = useSettings();
  const { userId } = useUser();

  const queryKey = ['testadores', organizationId];

  const listQuery = useQuery({
    queryKey,
    queryFn: () => TestadoresService.list(organizationId || ''),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['business_centers', organizationId] });
  };

  const createMutation = useMutation({
    mutationFn: (data: TestadorFormData) =>
      TestadoresService.create(organizationId || '', data, userId ?? undefined),
    onSuccess: (t) => {
      toast.success(`Testador "${t.full_name}" cadastrado com sucesso!`);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao cadastrar testador'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TestadorFormData> }) =>
      TestadoresService.update(organizationId || '', id, data),
    onSuccess: () => {
      toast.success('Testador atualizado com sucesso!');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao atualizar testador'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => TestadoresService.delete(organizationId || '', id),
    onSuccess: () => {
      toast.success('Testador removido com sucesso!');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao excluir testador'),
  });

  return {
    testadores: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createTestador: createMutation.mutateAsync,
    updateTestador: updateMutation.mutateAsync,
    deleteTestador: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: invalidate,
  };
}

// ── useTitulares ─────────────────────────────────────────────────────────────

export function useTitulares() {
  const queryClient = useQueryClient();
  const { organizationId } = useSettings();
  const { userId } = useUser();

  const queryKey = ['titulares', organizationId];

  const listQuery = useQuery({
    queryKey,
    queryFn: () => TitularesService.list(organizationId || ''),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['business_centers', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['platform_accounts', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['ad_accounts', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['influenciadores', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['titular_subscriptions', organizationId] });
  };

  const createMutation = useMutation({
    mutationFn: (data: TitularFormData) =>
      TitularesService.create(organizationId || '', data, userId ?? undefined),
    onSuccess: (t) => {
      toast.success(`Titular "${t.full_name}" cadastrado com sucesso!`);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao cadastrar titular'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TitularFormData> }) =>
      TitularesService.update(organizationId || '', id, data),
    onSuccess: () => {
      toast.success('Titular atualizado com sucesso!');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao atualizar titular'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => TitularesService.delete(organizationId || '', id),
    onSuccess: () => {
      toast.success('Titular removido com sucesso!');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao excluir titular'),
  });

  return {
    titulares: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createTitular: createMutation.mutateAsync,
    updateTitular: updateMutation.mutateAsync,
    deleteTitular: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: invalidate,
  };
}

// ── useTitularSubscriptions ──────────────────────────────────────────────────

export function useTitularSubscriptions(titularId?: string) {
  const queryClient = useQueryClient();
  const { organizationId } = useSettings();
  const { userId } = useUser();

  const queryKey = ['titular_subscriptions', organizationId, titularId];

  const listQuery = useQuery({
    queryKey,
    queryFn: () => TitularSubscriptionsService.list(organizationId || '', titularId),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['titular_subscriptions', organizationId] });
    queryClient.invalidateQueries({ queryKey: ['titulares', organizationId] });
  };

  const createMutation = useMutation({
    mutationFn: ({ titularId: targetTitularId, data }: { titularId?: string; data: TitularSubscriptionFormData }) => {
      const finalTitularId = targetTitularId || titularId;
      if (!finalTitularId) throw new Error('Titular não selecionado');
      return TitularSubscriptionsService.create(organizationId || '', finalTitularId, data, userId ?? undefined);
    },
    onSuccess: (sub) => {
      toast.success(`Assinatura "${sub.name}" vinculada com sucesso!`);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao vincular assinatura'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TitularSubscriptionFormData> }) =>
      TitularSubscriptionsService.update(organizationId || '', id, data),
    onSuccess: () => {
      toast.success('Assinatura atualizada com sucesso!');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao atualizar assinatura'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => TitularSubscriptionsService.delete(organizationId || '', id),
    onSuccess: () => {
      toast.success('Assinatura removida com sucesso!');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao excluir assinatura'),
  });

  return {
    subscriptions: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createSubscription: createMutation.mutateAsync,
    updateSubscription: updateMutation.mutateAsync,
    deleteSubscription: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: invalidate,
  };
}

// ── useInfluenciadores ───────────────────────────────────────────────────────

export function useInfluenciadores() {
  const queryClient = useQueryClient();
  const { organizationId } = useSettings();

  const queryKey = ['influenciadores', organizationId];

  const listQuery = useQuery({
    queryKey,
    queryFn: () => InfluenciadoresService.list(organizationId || ''),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: (data: InfluenciadorFormData) =>
      InfluenciadoresService.create(organizationId || '', data),
    onSuccess: (i) => {
      toast.success(`Influenciador "${i.name}" cadastrado com sucesso!`);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao cadastrar influenciador'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InfluenciadorFormData> }) =>
      InfluenciadoresService.update(organizationId || '', id, data),
    onSuccess: () => {
      toast.success('Influenciador atualizado com sucesso!');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao atualizar influenciador'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => InfluenciadoresService.delete(organizationId || '', id),
    onSuccess: () => {
      toast.success('Influenciador removido com sucesso!');
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao excluir influenciador'),
  });

  return {
    influenciadores: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    createInfluenciador: createMutation.mutateAsync,
    updateInfluenciador: updateMutation.mutateAsync,
    deleteInfluenciador: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: invalidate,
  };
}
