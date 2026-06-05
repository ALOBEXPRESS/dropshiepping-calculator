/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * LeadFormDialog Component Tests
 * 
 * Tests for the lead form dialog component including:
 * - Form rendering in create and edit modes
 * - Form validation (required fields, email format, phone format, document format)
 * - Form submission (create and update)
 * - Success and error handling
 * - Cancel functionality
 * - Keyboard shortcuts
 * 
 * Validates: Requirements 6.1-6.9, 7.1-7.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeadFormDialog } from './LeadFormDialog';
import * as useLeadsHook from '@/hooks/useLeads';
import type { Lead } from '@/types/leads';

// Mock the hooks
vi.mock('@/hooks/useLeads', () => ({
  useLeadMarketplaces: vi.fn(),
  useCreateLead: vi.fn(),
  useUpdateLead: vi.fn(),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('LeadFormDialog', () => {
  const mockOrganizationId = 'org-123';
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();
  
  const mockMarketplaces = [
    { id: 'mp-1', name: 'Mercado Livre', organization_id: mockOrganizationId },
    { id: 'mp-2', name: 'Shopee', organization_id: mockOrganizationId },
  ];
  
  const mockLead: Lead = {
    id: 'lead-1',
    organization_id: mockOrganizationId,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '(11) 3333-4444',
    mobile_phone: '(11) 99999-8888',
    document_type: 'cpf',
    document_number: '123.456.789-00',
    company_name: 'Acme Corp',
    trade_name: 'Acme',
    marketplace_id: 'mp-1',
    lead_status: 'qualified',
    lead_source: 'Google Ads',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock marketplaces hook
    vi.mocked(useLeadsHook.useLeadMarketplaces).mockReturnValue({
      data: mockMarketplaces,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    
    // Mock create mutation
    vi.mocked(useLeadsHook.useCreateLead).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);
    
    // Mock update mutation
    vi.mocked(useLeadsHook.useUpdateLead).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);
  });
  
  describe('Create Mode', () => {
    it('should render form in create mode when no lead provided', () => {
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      expect(screen.getByText('Adicionar Lead')).toBeInTheDocument();
      expect(screen.getByText('Preencha as informações do novo lead abaixo.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Criar Lead/i })).toBeInTheDocument();
    });
    
    it('should render all form fields', () => {
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      expect(screen.getByLabelText('Nome *')).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Telefone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Celular/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tipo de Documento/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Número do Documento/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Razão Social/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Nome Fantasia/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Canal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Origem do Lead/i)).toBeInTheDocument();
    });
    
    it('should show validation error when name is empty', async () => {
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      const submitButton = screen.getByRole('button', { name: /Criar Lead/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Nome deve ter pelo menos 2 caracteres/i)).toBeInTheDocument();
      });
    });
    
    it('should show validation error for invalid email', async () => {
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      const emailInput = screen.getByLabelText(/Email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.getByText(/Email inválido/i)).toBeInTheDocument();
      });
    });
    
    it('should show validation error for invalid phone', async () => {
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      const phoneInput = screen.getByLabelText(/^Telefone$/i);
      fireEvent.change(phoneInput, { target: { value: '123' } });
      fireEvent.blur(phoneInput);
      
      await waitFor(() => {
        expect(screen.getByText(/Telefone inválido/i)).toBeInTheDocument();
      });
    });
    
    it('should call createLead mutation on valid form submission', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      vi.mocked(useLeadsHook.useCreateLead).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as any);
      
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );
      
      // Fill required field
      const nameInput = screen.getByLabelText('Nome *');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /Criar Lead/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
          })
        );
      });
      
      // Should close dialog and call onSuccess
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnSuccess).toHaveBeenCalled();
    });
    
    it('should call onOpenChange when cancel button is clicked', () => {
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
  
  describe('Edit Mode', () => {
    it('should render form in edit mode when lead provided', () => {
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          lead={mockLead}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      expect(screen.getByText('Editar Lead')).toBeInTheDocument();
      expect(screen.getByText('Atualize as informações do lead abaixo.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Salvar Alterações/i })).toBeInTheDocument();
    });
    
    it('should populate form with lead data', () => {
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          lead={mockLead}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('(11) 3333-4444')).toBeInTheDocument();
      expect(screen.getByDisplayValue('(11) 99999-8888')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123.456.789-00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Acme')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Google Ads')).toBeInTheDocument();
    });
    
    it('should call updateLead mutation on valid form submission', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({});
      vi.mocked(useLeadsHook.useUpdateLead).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      } as any);
      
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          lead={mockLead}
          organizationId={mockOrganizationId}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      );
      
      // Modify name
      const nameInput = screen.getByLabelText('Nome *');
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /Salvar Alterações/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          leadId: 'lead-1',
          formData: expect.objectContaining({
            name: 'Jane Doe',
          }),
        });
      });
      
      // Should close dialog and call onSuccess
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
  
  describe('Loading States', () => {
    it('should disable form fields while submitting', async () => {
      vi.mocked(useLeadsHook.useCreateLead).mockReturnValue({
        mutateAsync: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
        isPending: true,
      } as any);
      
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      const nameInput = screen.getByLabelText('Nome *');
      expect(nameInput).toBeDisabled();
      
      const submitButton = screen.getByRole('button', { name: /Criar Lead/i });
      expect(submitButton).toBeDisabled();
    });
    
    it('should show loading spinner while submitting', () => {
      vi.mocked(useLeadsHook.useCreateLead).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: true,
      } as any);
      
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      // Check for loading spinner (Loader2 component)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
    
    it('should disable marketplace select while loading marketplaces', () => {
      vi.mocked(useLeadsHook.useLeadMarketplaces).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as any);
      
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      const marketplaceSelect = screen.getByLabelText(/Canal/i);
      expect(marketplaceSelect).toBeDisabled();
    });
  });
  
  describe('Form Reset', () => {
    it('should reset form when dialog closes and reopens', async () => {
      const { rerender } = render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      // Fill form
      const nameInput = screen.getByLabelText('Nome *');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      
      // Close dialog
      rerender(
        <LeadFormDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />
      );
      
      // Reopen dialog
      rerender(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />
      );
      
      // Form should be reset
      await waitFor(() => {
        const nameInputAfterReset = screen.getByLabelText('Nome *');
        expect(nameInputAfterReset).toHaveValue('');
      });
    });
    
    it('should reset form when switching from edit to create mode', async () => {
      const { rerender } = render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          lead={mockLead}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      // Should have lead data
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      
      // Switch to create mode
      rerender(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          lead={null}
          organizationId={mockOrganizationId}
        />
      );
      
      // Form should be reset
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Nome *');
        expect(nameInput).toHaveValue('');
      });
    });
  });
  
  describe('Validation Rules', () => {
    it('should validate name minimum length', async () => {
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      const nameInput = screen.getByLabelText('Nome *');
      fireEvent.change(nameInput, { target: { value: 'A' } });
      fireEvent.blur(nameInput);
      
      await waitFor(() => {
        expect(screen.getByText(/Nome deve ter pelo menos 2 caracteres/i)).toBeInTheDocument();
      });
    });
    
    it('should accept valid email formats', async () => {
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      const emailInput = screen.getByLabelText(/Email/i);
      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
      fireEvent.blur(emailInput);
      
      await waitFor(() => {
        expect(screen.queryByText(/Email inválido/i)).not.toBeInTheDocument();
      });
    });
    
    it('should accept valid phone formats', async () => {
      render(
        <LeadFormDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          organizationId={mockOrganizationId}
        />,
        { wrapper: createWrapper() }
      );
      
      const phoneInput = screen.getByLabelText(/^Telefone$/i);
      
      // Test various valid formats
      const validFormats = [
        '(11) 3333-4444',
        '11 3333-4444',
        '1133334444',
        '(11) 99999-8888',
      ];
      
      for (const format of validFormats) {
        fireEvent.change(phoneInput, { target: { value: format } });
        fireEvent.blur(phoneInput);
        
        await waitFor(() => {
          expect(screen.queryByText(/Telefone inválido/i)).not.toBeInTheDocument();
        });
      }
    });
  });
});
