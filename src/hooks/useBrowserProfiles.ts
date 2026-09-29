import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BrowserProfilesService } from '@/services/browserProfilesService';
import type {
  BrowserProfile,
  BrowserProfileFormData,
  BrowserProfileFilters,
} from '@/types/browserProfiles';
import { useUser } from '@/contexts/UserContext';

export interface UseBrowserProfilesReturn {
  browserProfiles: BrowserProfile[];
  profiles: BrowserProfile[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  createBrowserProfile: (data: BrowserProfileFormData) => Promise<BrowserProfile>;
  createProfile: (data: BrowserProfileFormData) => Promise<BrowserProfile>;
  updateBrowserProfile: (
    id: string,
    data: Partial<BrowserProfileFormData>
  ) => Promise<BrowserProfile>;
  updateProfile: (
    id: string,
    data: Partial<BrowserProfileFormData>
  ) => Promise<BrowserProfile>;
  deleteBrowserProfile: (id: string) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useBrowserProfiles(
  organizationId: string | null,
  filters?: BrowserProfileFilters
): UseBrowserProfilesReturn {
  const queryClient = useQueryClient();
  const { userId } = useUser();
  const queryKey = ['browser_profiles', organizationId, filters];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => BrowserProfilesService.list(organizationId ?? '', filters),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['browser_profiles', organizationId] });
  };

  const createMutation = useMutation({
    mutationFn: (formData: BrowserProfileFormData) =>
      BrowserProfilesService.create(organizationId ?? '', formData, userId ?? undefined),
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data: updateData,
    }: {
      id: string;
      data: Partial<BrowserProfileFormData>;
    }) => BrowserProfilesService.update(organizationId ?? '', id, updateData),
    onSuccess: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      BrowserProfilesService.delete(organizationId ?? '', id),
    onSuccess: () => invalidate(),
  });

  const profileList = data ?? [];
  const createFn = (formData: BrowserProfileFormData) => createMutation.mutateAsync(formData);
  const updateFn = (id: string, updateData: Partial<BrowserProfileFormData>) =>
    updateMutation.mutateAsync({ id, data: updateData });
  const deleteFn = (id: string) => deleteMutation.mutateAsync(id);

  return {
    browserProfiles: profileList,
    profiles: profileList,
    isLoading,
    isError,
    error: (error as Error) ?? null,
    refetch,
    createBrowserProfile: createFn,
    createProfile: createFn,
    updateBrowserProfile: updateFn,
    updateProfile: updateFn,
    deleteBrowserProfile: deleteFn,
    deleteProfile: deleteFn,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
