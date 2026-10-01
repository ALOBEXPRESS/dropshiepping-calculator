import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DevicesService } from '@/services/devicesService';
import type { DeviceFormData } from '@/types/devices';
import { useSettings } from '@/contexts/SettingsContext';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';

export function useDevices() {
  const queryClient = useQueryClient();
  const { organizationId } = useSettings();
  const { userId } = useUser();

  const queryKey = ['devices', organizationId];
  const queryKeyWithStats = ['devices_with_stats', organizationId];

  const listQuery = useQuery({
    queryKey,
    queryFn: () => DevicesService.list(organizationId || ''),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
  });

  const listWithStatsQuery = useQuery({
    queryKey: queryKeyWithStats,
    queryFn: () => DevicesService.listWithStats(organizationId || ''),
    enabled: !!organizationId,
    staleTime: 1000 * 30,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: queryKeyWithStats });
    queryClient.invalidateQueries({ queryKey: ['platform_accounts', organizationId] });
  };

  const createMutation = useMutation({
    mutationFn: (data: DeviceFormData) =>
      DevicesService.create(organizationId || '', data, userId),
    onSuccess: (newDevice) => {
      toast.success(`Dispositivo "${newDevice.label}" cadastrado com sucesso!`);
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao cadastrar dispositivo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DeviceFormData> }) =>
      DevicesService.update(organizationId || '', id, data),
    onSuccess: () => {
      toast.success('Dispositivo atualizado com sucesso!');
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao atualizar dispositivo');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DevicesService.delete(organizationId || '', id),
    onSuccess: () => {
      toast.success('Dispositivo removido com sucesso!');
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao excluir dispositivo');
    },
  });

  return {
    devices: listQuery.data ?? [],
    devicesWithStats: listWithStatsQuery.data ?? [],
    isLoading: listQuery.isLoading || listWithStatsQuery.isLoading,
    error: listQuery.error || listWithStatsQuery.error,
    createDevice: createMutation.mutateAsync,
    updateDevice: updateMutation.mutateAsync,
    deleteDevice: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: invalidate,
  };
}
