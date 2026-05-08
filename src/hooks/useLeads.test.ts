/**
 * Tests for useLeads hooks with optimistic updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useCreateLead, useUpdateLead, useDeleteLead } from './useLeads';
import { LeadsService } from '../services/leadsService';
import type { LeadFormData, Lead } from '../types/leads';

// Mock the LeadsService
vi.mock('../services/leadsService', () => ({
  LeadsService: {
    createLead: vi.fn(),
    updateLead: vi.fn(),
    deleteLead: vi.fn(),
  },
}));

describe('useLeads mutation hooks with optimistic updates', () => {
  let queryClient: QueryClient;
  const organizationId = 'test-org-123';

  beforeEach(() => {
    // Create a fresh QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  describe('useCreateLead', () => {
    it('should optimistically add lead to cache before server response', async () => {
      const formData: LeadFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(11) 98765-4321',
      };

      // Mock successful creation
      const createdLead: Lead = {
        id: 'real-id-123',
        organization_id: organizationId,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        cellphone: null,
        document_type: null,
        document_number: null,
        company: null,
        fantasy_name: null,
        marketplace_id: null,
        marketplace_name: undefined,
        lead_status: null,
        lead_source: null,
        gender: null,
        gender_probability: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_orders: 0,
        total_spent: 0,
        first_order_date: null,
        last_order_date: null,
      };

      vi.mocked(LeadsService.createLead).mockResolvedValue(createdLead);

      // Set up initial cache data
      queryClient.setQueryData(['leads', organizationId], {
        data: [],
        totalCount: 0,
      });

      const { result } = renderHook(() => useCreateLead(organizationId), { wrapper });

      // Trigger mutation
      result.current.mutate(formData);

      // Check optimistic update happened immediately
      await waitFor(() => {
        const cacheData = queryClient.getQueryData<{ data: Lead[]; totalCount: number }>([
          'leads',
          organizationId,
        ]);
        expect(cacheData?.data).toHaveLength(1);
        expect(cacheData?.data[0].name).toBe('John Doe');
        expect(cacheData?.data[0].id).toMatch(/^temp-/); // Temporary ID
        expect(cacheData?.totalCount).toBe(1);
      });

      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('should rollback optimistic update on error', async () => {
      const formData: LeadFormData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      // Mock failed creation
      vi.mocked(LeadsService.createLead).mockRejectedValue(new Error('Network error'));

      // Set up initial cache data
      const initialData = {
        data: [
          {
            id: 'existing-lead',
            name: 'Existing Lead',
          } as Lead,
        ],
        totalCount: 1,
      };
      queryClient.setQueryData(['leads', organizationId], initialData);

      const { result } = renderHook(() => useCreateLead(organizationId), { wrapper });

      // Trigger mutation
      result.current.mutate(formData);

      // Wait for mutation to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Check that cache was rolled back to original state
      const cacheData = queryClient.getQueryData<{ data: Lead[]; totalCount: number }>([
        'leads',
        organizationId,
      ]);
      expect(cacheData?.data).toHaveLength(1);
      expect(cacheData?.data[0].id).toBe('existing-lead');
      expect(cacheData?.totalCount).toBe(1);
    });
  });

  describe('useUpdateLead', () => {
    it('should optimistically update lead in cache before server response', async () => {
      const leadId = 'lead-123';
      const formData: LeadFormData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        lead_status: 'qualified',
      };

      // Mock successful update
      vi.mocked(LeadsService.updateLead).mockResolvedValue({
        id: leadId,
        name: formData.name,
        email: formData.email || null,
        lead_status: formData.lead_status || null,
      } as Lead);

      // Set up initial cache data
      const initialLead: Lead = {
        id: leadId,
        organization_id: organizationId,
        name: 'Original Name',
        email: 'original@example.com',
        phone: null,
        cellphone: null,
        document_type: null,
        document_number: null,
        company: null,
        fantasy_name: null,
        marketplace_id: null,
        marketplace_name: undefined,
        lead_status: 'new',
        lead_source: null,
        gender: null,
        gender_probability: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_orders: 0,
        total_spent: 0,
        first_order_date: null,
        last_order_date: null,
      };

      queryClient.setQueryData(['leads', organizationId], {
        data: [initialLead],
        totalCount: 1,
      });

      const { result } = renderHook(() => useUpdateLead(organizationId), { wrapper });

      // Trigger mutation
      result.current.mutate({ leadId, formData });

      // Check optimistic update happened immediately
      await waitFor(() => {
        const cacheData = queryClient.getQueryData<{ data: Lead[]; totalCount: number }>([
          'leads',
          organizationId,
        ]);
        expect(cacheData?.data[0].name).toBe('Updated Name');
        expect(cacheData?.data[0].email).toBe('updated@example.com');
        expect(cacheData?.data[0].lead_status).toBe('qualified');
      });

      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('should rollback optimistic update on error', async () => {
      const leadId = 'lead-123';
      const formData: LeadFormData = {
        name: 'Failed Update',
      };

      // Mock failed update
      vi.mocked(LeadsService.updateLead).mockRejectedValue(new Error('Update failed'));

      // Set up initial cache data
      const initialLead: Lead = {
        id: leadId,
        organization_id: organizationId,
        name: 'Original Name',
        email: 'original@example.com',
        phone: null,
        cellphone: null,
        document_type: null,
        document_number: null,
        company: null,
        fantasy_name: null,
        marketplace_id: null,
        marketplace_name: undefined,
        lead_status: 'new',
        lead_source: null,
        gender: null,
        gender_probability: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_orders: 0,
        total_spent: 0,
        first_order_date: null,
        last_order_date: null,
      };

      queryClient.setQueryData(['leads', organizationId], {
        data: [initialLead],
        totalCount: 1,
      });

      const { result } = renderHook(() => useUpdateLead(organizationId), { wrapper });

      // Trigger mutation
      result.current.mutate({ leadId, formData });

      // Wait for mutation to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Check that cache was rolled back to original state
      const cacheData = queryClient.getQueryData<{ data: Lead[]; totalCount: number }>([
        'leads',
        organizationId,
      ]);
      expect(cacheData?.data[0].name).toBe('Original Name');
      expect(cacheData?.data[0].email).toBe('original@example.com');
    });
  });

  describe('useDeleteLead', () => {
    it('should optimistically remove lead from cache before server response', async () => {
      const leadId = 'lead-to-delete';

      // Mock successful deletion
      vi.mocked(LeadsService.deleteLead).mockResolvedValue(undefined);

      // Set up initial cache data
      const leadToDelete: Lead = {
        id: leadId,
        organization_id: organizationId,
        name: 'Lead to Delete',
        email: 'delete@example.com',
        phone: null,
        cellphone: null,
        document_type: null,
        document_number: null,
        company: null,
        fantasy_name: null,
        marketplace_id: null,
        marketplace_name: undefined,
        lead_status: 'new',
        lead_source: null,
        gender: null,
        gender_probability: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_orders: 0,
        total_spent: 0,
        first_order_date: null,
        last_order_date: null,
      };

      const otherLead: Lead = {
        ...leadToDelete,
        id: 'other-lead',
        name: 'Other Lead',
      };

      queryClient.setQueryData(['leads', organizationId], {
        data: [leadToDelete, otherLead],
        totalCount: 2,
      });

      const { result } = renderHook(() => useDeleteLead(organizationId), { wrapper });

      // Trigger mutation
      result.current.mutate(leadId);

      // Check optimistic update happened immediately
      await waitFor(() => {
        const cacheData = queryClient.getQueryData<{ data: Lead[]; totalCount: number }>([
          'leads',
          organizationId,
        ]);
        expect(cacheData?.data).toHaveLength(1);
        expect(cacheData?.data[0].id).toBe('other-lead');
        expect(cacheData?.totalCount).toBe(1);
      });

      // Wait for mutation to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('should rollback optimistic delete on error', async () => {
      const leadId = 'lead-to-delete';

      // Mock failed deletion
      vi.mocked(LeadsService.deleteLead).mockRejectedValue(new Error('Delete failed'));

      // Set up initial cache data
      const leadToDelete: Lead = {
        id: leadId,
        organization_id: organizationId,
        name: 'Lead to Delete',
        email: 'delete@example.com',
        phone: null,
        cellphone: null,
        document_type: null,
        document_number: null,
        company: null,
        fantasy_name: null,
        marketplace_id: null,
        marketplace_name: undefined,
        lead_status: 'new',
        lead_source: null,
        gender: null,
        gender_probability: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_orders: 0,
        total_spent: 0,
        first_order_date: null,
        last_order_date: null,
      };

      queryClient.setQueryData(['leads', organizationId], {
        data: [leadToDelete],
        totalCount: 1,
      });

      const { result } = renderHook(() => useDeleteLead(organizationId), { wrapper });

      // Trigger mutation
      result.current.mutate(leadId);

      // Wait for mutation to fail
      await waitFor(() => expect(result.current.isError).toBe(true));

      // Check that cache was rolled back to original state
      const cacheData = queryClient.getQueryData<{ data: Lead[]; totalCount: number }>([
        'leads',
        organizationId,
      ]);
      expect(cacheData?.data).toHaveLength(1);
      expect(cacheData?.data[0].id).toBe(leadId);
      expect(cacheData?.totalCount).toBe(1);
    });
  });
});
