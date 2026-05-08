/**
 * useLeads Hook
 * 
 * Custom React Query hook for fetching leads with filters, sorting, and pagination.
 * Implements caching, automatic refetching, and optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeadsService } from '../services/leadsService';
import type {
  Lead,
  LeadFilters,
  SortConfig,
  PaginationConfig,
  LeadsQueryResponse,
  LeadKPIs,
  LeadFormData,
  Marketplace,
} from '../types/leads';
import { LEADS_CACHE_TIME, LEADS_STALE_TIME } from '../components/leads/constants';

/**
 * Hook for fetching leads with filters, sorting, and pagination
 * 
 * Includes retry logic for failed queries (Requirements: 1.7)
 */
export function useLeads(
  organizationId: string,
  filters: LeadFilters,
  sort: SortConfig,
  pagination: PaginationConfig
) {
  return useQuery({
    queryKey: ['leads', organizationId, filters, sort, pagination],
    queryFn: () => LeadsService.fetchLeads(organizationId, filters, sort, pagination),
    staleTime: LEADS_STALE_TIME,
    cacheTime: LEADS_CACHE_TIME,
    keepPreviousData: true, // For smooth pagination transitions
    enabled: !!organizationId,
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

/**
 * Hook for fetching lead KPI metrics
 * 
 * Includes retry logic for failed queries (Requirements: 1.7)
 */
export function useLeadKPIs(
  organizationId: string,
  filters?: LeadFilters
) {
  return useQuery({
    queryKey: ['lead-kpis', organizationId, filters],
    queryFn: () => LeadsService.fetchLeadKPIs(organizationId, filters),
    staleTime: LEADS_STALE_TIME,
    cacheTime: LEADS_CACHE_TIME,
    enabled: !!organizationId,
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

/**
 * Hook for creating a new lead
 */
export function useCreateLead(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: LeadFormData) => 
      LeadsService.createLead(organizationId, formData),
    onMutate: async (formData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['leads', organizationId]);

      // Snapshot previous value
      const previousLeads = queryClient.getQueriesData(['leads', organizationId]);

      // Create optimistic lead with temporary ID
      const optimisticLead: Lead = {
        id: `temp-${Date.now()}`,
        organization_id: organizationId,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        cellphone: formData.cellphone || null,
        document_type: formData.document_type || null,
        document_number: formData.document_number || null,
        company: formData.company || null,
        fantasy_name: formData.fantasy_name || null,
        marketplace_id: formData.marketplace_id || null,
        marketplace_name: undefined,
        lead_status: formData.lead_status || null,
        lead_source: formData.lead_source || null,
        gender: null,
        gender_probability: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_orders: 0,
        total_spent: 0,
        first_order_date: null,
        last_order_date: null,
      };

      // Optimistically add to cache
      queryClient.setQueriesData<LeadsQueryResponse>(
        ['leads', organizationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: [optimisticLead, ...old.data],
            totalCount: old.totalCount + 1,
          };
        }
      );

      return { previousLeads };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLeads) {
        context.previousLeads.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate KPIs on successful create
      queryClient.invalidateQueries(['lead-kpis', organizationId]);
    },
    onSettled: () => {
      // Always refetch after error or success to get real data from server
      queryClient.invalidateQueries(['leads', organizationId]);
    },
  });
}

/**
 * Hook for updating an existing lead
 */
export function useUpdateLead(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, formData }: { leadId: string; formData: LeadFormData }) =>
      LeadsService.updateLead(leadId, organizationId, formData),
    onMutate: async ({ leadId, formData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['leads', organizationId]);

      // Snapshot previous value
      const previousLeads = queryClient.getQueriesData(['leads', organizationId]);

      // Optimistically update to the new value
      queryClient.setQueriesData<LeadsQueryResponse>(
        ['leads', organizationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map(lead =>
              lead.id === leadId 
                ? { 
                    ...lead, 
                    ...formData,
                    updated_at: new Date().toISOString()
                  } 
                : lead
            ),
          };
        }
      );

      return { previousLeads };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLeads) {
        context.previousLeads.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate KPIs on successful update (status changes may affect KPIs)
      queryClient.invalidateQueries(['lead-kpis', organizationId]);
    },
    onSettled: () => {
      // Always refetch after error or success to get real data from server
      queryClient.invalidateQueries(['leads', organizationId]);
    },
  });
}

/**
 * Hook for deleting a lead
 */
export function useDeleteLead(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadId: string) =>
      LeadsService.deleteLead(leadId, organizationId),
    onMutate: async (leadId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['leads', organizationId]);

      // Snapshot previous value
      const previousLeads = queryClient.getQueriesData(['leads', organizationId]);

      // Optimistically remove from cache
      queryClient.setQueriesData<LeadsQueryResponse>(
        ['leads', organizationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter(lead => lead.id !== leadId),
            totalCount: old.totalCount - 1,
          };
        }
      );

      return { previousLeads };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLeads) {
        context.previousLeads.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate KPIs on successful delete
      queryClient.invalidateQueries(['lead-kpis', organizationId]);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries(['leads', organizationId]);
    },
  });
}

/**
 * Hook for fetching marketplaces (for filter dropdown)
 * 
 * Includes retry logic for failed queries (Requirements: 1.7)
 */
export function useLeadMarketplaces(organizationId: string) {
  return useQuery({
    queryKey: ['lead-marketplaces', organizationId],
    queryFn: () => LeadsService.fetchMarketplaces(organizationId),
    staleTime: 10 * 60 * 1000, // 10 minutes - marketplaces don't change often
    enabled: !!organizationId,
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}
