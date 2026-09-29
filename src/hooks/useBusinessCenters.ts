import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BusinessCentersService } from '@/services/businessCentersService';
import type {
  BusinessCenterWithStats,
  BusinessCenterFormData,
  BusinessCenterFilters,
} from '@/types/businessCenters';
import { useUser } from '@/contexts/UserContext';

export interface UseBusinessCentersReturn {
  businessCenters: BusinessCenterWithStats[];
  centers: BusinessCenterWithStats[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  createBusinessCenter: (data: BusinessCenterFormData) => Promise<BusinessCenterWithStats>;
  createCenter: (data: BusinessCenterFormData) => Promise<BusinessCenterWithStats>;
  updateBusinessCenter: (
    id: string,
    data: Partial<BusinessCenterFormData>
  ) => Promise<BusinessCenterWithStats>;
  updateCenter: (
    id: string,
    data: Partial<BusinessCenterFormData>
  ) => Promise<BusinessCenterWithStats>;
  deleteBusinessCenter: (id: string) => Promise<void>;
  deleteCenter: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useBusinessCenters(
  organizationId: string | null,
  filters?: BusinessCenterFilters
): UseBusinessCentersReturn {
  const queryClient = useQueryClient();
  const { userId } = useUser();
  const queryKey = ['business_centers', organizationId, filters];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => BusinessCentersService.list(organizationId ?? '', filters),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['business_centers', organizationId] });
    // Invalida ad_accounts pois bc_entity_id pode ter mudado
    queryClient.invalidateQueries({ queryKey: ['ad_accounts', organizationId] });
  };

  const createMutation = useMutation({
    mutationFn: (formData: BusinessCenterFormData) =>
      BusinessCentersService.create(organizationId ?? '', formData, userId ?? undefined),
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data: updateData,
    }: {
      id: string;
      data: Partial<BusinessCenterFormData>;
    }) => BusinessCentersService.update(organizationId ?? '', id, updateData),
    onSuccess: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      BusinessCentersService.delete(organizationId ?? '', id),
    onSuccess: () => invalidate(),
  });

  const centerList = (data ?? []) as BusinessCenterWithStats[];
  const createFn = (formData: BusinessCenterFormData) =>
    createMutation.mutateAsync(formData) as Promise<BusinessCenterWithStats>;
  const updateFn = (id: string, updateData: Partial<BusinessCenterFormData>) =>
    updateMutation.mutateAsync({ id, data: updateData }) as Promise<BusinessCenterWithStats>;
  const deleteFn = (id: string) => deleteMutation.mutateAsync(id);

  return {
    businessCenters: centerList,
    centers: centerList,
    isLoading,
    isError,
    error: (error as Error) ?? null,
    refetch,
    createBusinessCenter: createFn,
    createCenter: createFn,
    updateBusinessCenter: updateFn,
    updateCenter: updateFn,
    deleteBusinessCenter: deleteFn,
    deleteCenter: deleteFn,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
