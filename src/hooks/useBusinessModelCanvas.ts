import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BusinessModelCanvasService } from '@/services/businessModelCanvasService';
import type {
  BusinessModelCanvas,
  BusinessModelCanvasSection,
  BmcSectionUpsertData,
  BmcSectionKey,
} from '@/types/businessModelCanvas';
import { useSettings } from '@/contexts/SettingsContext';

// ── Query keys ───────────────────────────────────────────────────────────────

const bmcKeys = {
  all: (orgId: string) => ['business_model_canvas', orgId] as const,
  byBC: (orgId: string, bcId: string) =>
    ['business_model_canvas', orgId, bcId] as const,
  section: (orgId: string, bcId: string, section: BmcSectionKey) =>
    ['business_model_canvas', orgId, bcId, section] as const,
};

// ── Hook principal: canvas completo de um BC ─────────────────────────────────

export function useBusinessModelCanvas(businessCenterId: string | null | undefined) {
  const { organizationId } = useSettings();

  return useQuery<BusinessModelCanvas>({
    queryKey: bmcKeys.byBC(organizationId ?? '', businessCenterId ?? ''),
    queryFn: () =>
      BusinessModelCanvasService.getByBusinessCenter(
        businessCenterId ?? '',
        organizationId ?? ''
      ),
    enabled: !!organizationId && !!businessCenterId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Hook para uma seção específica ───────────────────────────────────────────

export function useBMCSection(
  businessCenterId: string | null | undefined,
  section: BmcSectionKey | null | undefined
) {
  const { organizationId } = useSettings();

  return useQuery<BusinessModelCanvasSection | null>({
    queryKey: bmcKeys.section(
      organizationId ?? '',
      businessCenterId ?? '',
      section ?? 'parcerias'
    ),
    queryFn: () =>
      BusinessModelCanvasService.getSection(
        businessCenterId ?? '',
        organizationId ?? '',
        section ?? 'parcerias'
      ),
    enabled: !!organizationId && !!businessCenterId && !!section,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Mutation: upsert de seção ────────────────────────────────────────────────

export function useUpsertBMCSection() {
  const queryClient = useQueryClient();
  const { organizationId } = useSettings();

  return useMutation<BusinessModelCanvasSection, Error, BmcSectionUpsertData>({
    mutationFn: (data) =>
      BusinessModelCanvasService.upsertSection(organizationId ?? '', data),
    onSuccess: (_, variables) => {
      // Invalida canvas completo do BC
      queryClient.invalidateQueries({
        queryKey: bmcKeys.byBC(organizationId ?? '', variables.business_center_id),
      });
      // Invalida seção específica
      queryClient.invalidateQueries({
        queryKey: bmcKeys.section(
          organizationId ?? '',
          variables.business_center_id,
          variables.section
        ),
      });
    },
  });
}

// ── Mutation: delete de seção ────────────────────────────────────────────────

export function useDeleteBMCSection() {
  const queryClient = useQueryClient();
  const { organizationId } = useSettings();

  return useMutation<
    void,
    Error,
    { businessCenterId: string; section: BmcSectionKey }
  >({
    mutationFn: ({ businessCenterId, section }) =>
      BusinessModelCanvasService.deleteSection(
        businessCenterId,
        organizationId ?? '',
        section
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: bmcKeys.byBC(organizationId ?? '', variables.businessCenterId),
      });
      queryClient.invalidateQueries({
        queryKey: bmcKeys.section(
          organizationId ?? '',
          variables.businessCenterId,
          variables.section
        ),
      });
    },
  });
}
