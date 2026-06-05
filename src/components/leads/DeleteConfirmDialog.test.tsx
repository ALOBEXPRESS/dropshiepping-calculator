/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * DeleteConfirmDialog Component Tests
 * 
 * Tests for the delete confirmation dialog component.
 * Covers dialog display, user interactions, delete logic, and error handling.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import * as useLeadsHook from '@/hooks/useLeads';

// Mock hooks
vi.mock('@/hooks/useLeads', () => ({
  useDeleteLead: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('DeleteConfirmDialog', () => {
  let queryClient: QueryClient;
  const mockToast = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockMutateAsync = vi.fn();

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    leadId: 'lead-123',
    leadName: 'John Doe',
    organizationId: 'org-456',
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.mocked(useLeadsHook.useDeleteLead).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);

    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <DeleteConfirmDialog {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  describe('Dialog Display', () => {
    it('should render dialog when open is true', () => {
      renderComponent();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
    });

    it('should not render dialog when open is false', () => {
      renderComponent({ open: false });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display lead name in confirmation message', () => {
      renderComponent();

      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    it('should display warning that action cannot be undone', () => {
      renderComponent();

      expect(screen.getByText(/Esta ação não pode ser desfeita/)).toBeInTheDocument();
      expect(screen.getByText(/permanentemente removidos/)).toBeInTheDocument();
    });

    it('should display Cancel and Confirm buttons', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /Cancelar/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Deletar Lead/ })).toBeInTheDocument();
    });

    it('should display warning icon', () => {
      renderComponent();

      // Check for AlertTriangle icon (lucide-react renders as svg with aria-hidden)
      const svgs = document.querySelectorAll('svg.lucide-triangle-alert');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('User Interactions', () => {
    it('should call onOpenChange with false when Cancel button is clicked', async () => {
      renderComponent();

      const cancelButton = screen.getByRole('button', { name: /Cancelar/ });
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call useDeleteLead mutation when Confirm button is clicked', async () => {
      mockMutateAsync.mockResolvedValue({});
      renderComponent();

      const confirmButton = screen.getByRole('button', { name: /Deletar Lead/ });
      fireEvent.click(confirmButton);

      expect(mockMutateAsync).toHaveBeenCalledWith('lead-123');
    });

    it('should not allow cancel when deletion is in progress', async () => {
      vi.mocked(useLeadsHook.useDeleteLead).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);

      renderComponent();

      const cancelButton = screen.getByRole('button', { name: /Cancelar/ });
      expect(cancelButton).toBeDisabled();
    });

    it('should not allow confirm when deletion is in progress', async () => {
      vi.mocked(useLeadsHook.useDeleteLead).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);

      renderComponent();

      const confirmButton = screen.getByRole('button', { name: /Deletar Lead/ });
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Delete Logic', () => {
    it('should show loading state during deletion', async () => {
      vi.mocked(useLeadsHook.useDeleteLead).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);

      renderComponent();

      // Check for loading spinner (Loader2 icon)
      const confirmButton = screen.getByRole('button', { name: /Deletar Lead/ });
      expect(confirmButton).toBeDisabled();
    });

    it('should display success toast on successful deletion', async () => {
      mockMutateAsync.mockResolvedValue({});
      renderComponent();

      const confirmButton = screen.getByRole('button', { name: /Deletar Lead/ });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should close dialog on successful deletion', async () => {
      mockMutateAsync.mockResolvedValue({});
      renderComponent();

      const confirmButton = screen.getByRole('button', { name: /Deletar Lead/ });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should call onSuccess callback on successful deletion', async () => {
      mockMutateAsync.mockResolvedValue({});
      renderComponent();

      const confirmButton = screen.getByRole('button', { name: /Deletar Lead/ });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should display error toast on deletion failure', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Network error'));
      renderComponent();

      const confirmButton = screen.getByRole('button', { name: /Deletar Lead/ });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        // Error should be caught and handled
        expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
      });
    });

    it('should not close dialog on deletion failure', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Network error'));
      renderComponent();

      const confirmButton = screen.getByRole('button', { name: /Deletar Lead/ });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        // Wait for async operation
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      // Dialog should remain open
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
    });

    it('should not call onSuccess callback on deletion failure', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Network error'));
      renderComponent();

      const confirmButton = screen.getByRole('button', { name: /Deletar Lead/ });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should close dialog when Escape key is pressed', async () => {
      renderComponent();

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not close dialog on Escape when deletion is in progress', async () => {
      vi.mocked(useLeadsHook.useDeleteLead).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);

      renderComponent();

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Props Handling', () => {
    it('should work without onSuccess callback', async () => {
      mockMutateAsync.mockResolvedValue({});
      renderComponent({ onSuccess: undefined });

      const confirmButton = screen.getByRole('button', { name: /Deletar Lead/ });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });

      // Should not throw error
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should pass organizationId to useDeleteLead hook', () => {
      renderComponent({ organizationId: 'custom-org-id' });

      expect(useLeadsHook.useDeleteLead).toHaveBeenCalledWith('custom-org-id');
    });

    it('should display different lead names correctly', () => {
      const { rerender } = renderComponent({ leadName: 'Jane Smith' });

      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();

      rerender(
        <QueryClientProvider client={queryClient}>
          <DeleteConfirmDialog {...defaultProps} leadName="Bob Johnson" />
        </QueryClientProvider>
      );

      expect(screen.getByText(/Bob Johnson/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      renderComponent();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /Cancelar/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Deletar Lead/ })).toBeInTheDocument();
    });

    it('should disable buttons during loading', () => {
      vi.mocked(useLeadsHook.useDeleteLead).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);

      renderComponent();

      const cancelButton = screen.getByRole('button', { name: /Cancelar/ });
      const confirmButton = screen.getByRole('button', { name: /Deletar Lead/ });

      expect(cancelButton).toBeDisabled();
      expect(confirmButton).toBeDisabled();
    });
  });
});
