/**
 * Filter Integration Tests
 * 
 * Comprehensive tests for filter functionality including:
 * - Individual filter types
 * - Multiple filter combinations
 * - Debounced search
 * - Dashboard filter integration
 * - Filter counter updates
 * - Clear filters functionality
 * 
 * Validates: Requirements 3.1-3.8, 10.1-10.5, 12.2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeadsTable from './LeadsTable';
import * as useLeadsHook from '@/hooks/useLeads';

// Mock the hooks
vi.mock('@/hooks/useLeads', () => ({
  useLeads: vi.fn(),
  useLeadKPIs: vi.fn(() => ({
    data: {
      totalLeads: 100,
      newLeads: 25,
      qualifiedLeads: 30,
      lostLeads: 10,
    },
    isLoading: false,
    isError: false,
  })),
  useLeadMarketplaces: vi.fn(() => ({
    data: [
      { id: 'mp-1', name: 'Mercado Livre', organization_id: 'org-123' },
      { id: 'mp-2', name: 'Shopee', organization_id: 'org-123' },
    ],
    isLoading: false,
    isError: false,
  })),
}));

// Mock KPICards
vi.mock('./KPICards', () => ({
  KPICards: () => <div data-testid="kpi-cards">KPI Cards</div>,
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

describe('Filter Integration Tests', () => {
  const mockOrganizationId = 'org-123';
  
  const mockLeads = [
    {
      id: '1',
      organization_id: mockOrganizationId,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '11999999999',
      company: 'Acme Corp',
      marketplace_id: 'mp-1',
      marketplace_name: 'Mercado Livre',
      lead_status: 'new',
      gender: 'male',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    },
    {
      id: '2',
      organization_id: mockOrganizationId,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '11988888888',
      company: 'Tech Inc',
      marketplace_id: 'mp-2',
      marketplace_name: 'Shopee',
      lead_status: 'qualified',
      gender: 'female',
      created_at: '2024-01-20T00:00:00Z',
      updated_at: '2024-01-20T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    vi.mocked(useLeadsHook.useLeads).mockReturnValue({
      data: {
        data: mockLeads,
        totalCount: 2,
        page: 0,
        pageSize: 25,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);
  });

  describe('Individual Filter Types', () => {
    it('should filter by search text (debounced)', async () => {
      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Find search input
      const searchInput = screen.getByPlaceholderText(/Nome, email, telefone, empresa/i);
      
      // Type in search
      fireEvent.change(searchInput, { target: { value: 'John' } });

      // Wait for debounce (300ms) + a bit more
      await waitFor(
        () => {
          expect(useLeadsHook.useLeads).toHaveBeenCalledWith(
            mockOrganizationId,
            expect.objectContaining({
              searchText: 'John',
            }),
            expect.any(Object),
            expect.any(Object)
          );
        },
        { timeout: 500 }
      );
    });

    it('should filter by status', async () => {
      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Open status filter
      const statusButton = screen.getByLabelText('Filtrar por status');
      fireEvent.click(statusButton);

      // Wait for popover to open
      await waitFor(() => {
        const newCheckbox = screen.getByRole('checkbox', { name: /Novo/i });
        expect(newCheckbox).toBeInTheDocument();
      });

      // Select "new" status
      const newCheckbox = screen.getByRole('checkbox', { name: /Novo/i });
      fireEvent.click(newCheckbox);

      // Verify filter was applied
      await waitFor(() => {
        expect(useLeadsHook.useLeads).toHaveBeenCalledWith(
          mockOrganizationId,
          expect.objectContaining({
            status: expect.arrayContaining(['new']),
          }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should filter by marketplace', async () => {
      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Open marketplace filter
      const marketplaceButton = screen.getByLabelText('Filtrar por canal');
      fireEvent.click(marketplaceButton);

      // Wait for popover and select marketplace
      await waitFor(() => {
        const mlCheckbox = screen.getByRole('checkbox', { name: /Mercado Livre/i });
        expect(mlCheckbox).toBeInTheDocument();
      });

      const mlCheckbox = screen.getByRole('checkbox', { name: /Mercado Livre/i });
      fireEvent.click(mlCheckbox);

      // Verify filter was applied
      await waitFor(() => {
        expect(useLeadsHook.useLeads).toHaveBeenCalledWith(
          mockOrganizationId,
          expect.objectContaining({
            marketplaceId: expect.arrayContaining(['mp-1']),
          }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should filter by gender', async () => {
      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Open gender filter
      const genderButton = screen.getByLabelText('Filtrar por gênero');
      fireEvent.click(genderButton);

      // Wait for popover and select gender
      await waitFor(() => {
        const maleCheckbox = screen.getByRole('checkbox', { name: /Masculino/i });
        expect(maleCheckbox).toBeInTheDocument();
      });

      const maleCheckbox = screen.getByRole('checkbox', { name: /Masculino/i });
      fireEvent.click(maleCheckbox);

      // Verify filter was applied
      await waitFor(() => {
        expect(useLeadsHook.useLeads).toHaveBeenCalledWith(
          mockOrganizationId,
          expect.objectContaining({
            gender: expect.arrayContaining(['male']),
          }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should filter by date range using preset', async () => {
      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Open date filter
      const dateButton = screen.getByLabelText('Filtrar por período');
      fireEvent.click(dateButton);

      // Wait for popover and click preset
      await waitFor(() => {
        const last30DaysButton = screen.getByText('Últimos 30 dias');
        expect(last30DaysButton).toBeInTheDocument();
      });

      const last30DaysButton = screen.getByText('Últimos 30 dias');
      fireEvent.click(last30DaysButton);

      // Verify filter was applied with date range
      await waitFor(() => {
        expect(useLeadsHook.useLeads).toHaveBeenCalledWith(
          mockOrganizationId,
          expect.objectContaining({
            dateRange: expect.objectContaining({
              from: expect.any(Date),
              to: expect.any(Date),
            }),
          }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });
  });

  describe('Multiple Filter Combinations', () => {
    it('should apply multiple filters simultaneously', async () => {
      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Apply search filter
      const searchInput = screen.getByPlaceholderText(/Nome, email, telefone, empresa/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 400));

      // Apply status filter
      const statusButton = screen.getByLabelText('Filtrar por status');
      fireEvent.click(statusButton);

      await waitFor(() => {
        const newCheckbox = screen.getByRole('checkbox', { name: /Novo/i });
        fireEvent.click(newCheckbox);
      });

      // Verify both filters are applied
      await waitFor(() => {
        expect(useLeadsHook.useLeads).toHaveBeenCalledWith(
          mockOrganizationId,
          expect.objectContaining({
            searchText: 'John',
            status: expect.arrayContaining(['new']),
          }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should maintain filters when adding new ones', async () => {
      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Apply first filter (status)
      const statusButton = screen.getByLabelText('Filtrar por status');
      fireEvent.click(statusButton);

      await waitFor(() => {
        const newCheckbox = screen.getByRole('checkbox', { name: /Novo/i });
        fireEvent.click(newCheckbox);
      });

      // Apply second filter (marketplace)
      const marketplaceButton = screen.getByLabelText('Filtrar por canal');
      fireEvent.click(marketplaceButton);

      await waitFor(() => {
        const mlCheckbox = screen.getByRole('checkbox', { name: /Mercado Livre/i });
        fireEvent.click(mlCheckbox);
      });

      // Verify both filters are maintained
      await waitFor(() => {
        expect(useLeadsHook.useLeads).toHaveBeenCalledWith(
          mockOrganizationId,
          expect.objectContaining({
            status: expect.arrayContaining(['new']),
            marketplaceId: expect.arrayContaining(['mp-1']),
          }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });
  });

  describe('Filter Counter', () => {
    it('should display correct filter count', async () => {
      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Initially no filter count badge (only "Filtros" title)
      expect(screen.queryByText('1 filtro')).not.toBeInTheDocument();
      expect(screen.queryByText('2 filtros')).not.toBeInTheDocument();

      // Apply one filter
      const statusButton = screen.getByLabelText('Filtrar por status');
      fireEvent.click(statusButton);

      await waitFor(() => {
        const newCheckbox = screen.getByRole('checkbox', { name: /Novo/i });
        fireEvent.click(newCheckbox);
      });

      // Should show "1 filtro"
      await waitFor(() => {
        expect(screen.getByText('1 filtro')).toBeInTheDocument();
      });

      // Apply second filter
      const marketplaceButton = screen.getByLabelText('Filtrar por canal');
      fireEvent.click(marketplaceButton);

      await waitFor(() => {
        const mlCheckbox = screen.getByRole('checkbox', { name: /Mercado Livre/i });
        fireEvent.click(mlCheckbox);
      });

      // Should show "2 filtros"
      await waitFor(() => {
        expect(screen.getByText('2 filtros')).toBeInTheDocument();
      });
    });

    it('should update result count when filters change', async () => {
      // Start with 2 leads
      vi.mocked(useLeadsHook.useLeads).mockReturnValue({
        data: {
          data: mockLeads,
          totalCount: 2,
          page: 0,
          pageSize: 25,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { rerender } = render(
        <LeadsTable organizationId={mockOrganizationId} />,
        { wrapper: createWrapper() }
      );

      // Should show 2 leads
      await waitFor(() => {
        expect(screen.getByText('2 leads encontrados')).toBeInTheDocument();
      });

      // Apply filter that reduces results to 1
      vi.mocked(useLeadsHook.useLeads).mockReturnValue({
        data: {
          data: [mockLeads[0]],
          totalCount: 1,
          page: 0,
          pageSize: 25,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      rerender(<LeadsTable organizationId={mockOrganizationId} />);

      // Should show 1 lead
      await waitFor(() => {
        expect(screen.getByText('1 lead encontrado')).toBeInTheDocument();
      });
    });
  });

  describe('Clear Filters', () => {
    it('should clear all filters when clear button is clicked', async () => {
      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Apply multiple filters
      const searchInput = screen.getByPlaceholderText(/Nome, email, telefone, empresa/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await new Promise(resolve => setTimeout(resolve, 400));

      const statusButton = screen.getByLabelText('Filtrar por status');
      fireEvent.click(statusButton);

      await waitFor(() => {
        const newCheckbox = screen.getByRole('checkbox', { name: /Novo/i });
        fireEvent.click(newCheckbox);
      });

      // Wait for clear button to appear
      await waitFor(() => {
        expect(screen.getByText('Limpar filtros')).toBeInTheDocument();
      });

      // Click clear button
      const clearButton = screen.getByText('Limpar filtros');
      fireEvent.click(clearButton);

      // Verify filters are cleared
      await waitFor(() => {
        expect(useLeadsHook.useLeads).toHaveBeenCalledWith(
          mockOrganizationId,
          expect.objectContaining({
            searchText: undefined,
            status: undefined,
            marketplaceId: undefined,
            gender: undefined,
            dateRange: undefined,
          }),
          expect.any(Object),
          expect.any(Object)
        );
      });

      // Search input should be cleared
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Dashboard Filter Integration', () => {
    it('should integrate with period filter from dashboard', async () => {
      const period = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      };

      render(
        <LeadsTable organizationId={mockOrganizationId} period={period} />,
        { wrapper: createWrapper() }
      );

      // Verify period filter is applied
      await waitFor(() => {
        expect(useLeadsHook.useLeads).toHaveBeenCalledWith(
          mockOrganizationId,
          expect.objectContaining({
            dateRange: period,
          }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should integrate with marketplace filter from dashboard', async () => {
      const marketplaceId = 'mp-1';

      render(
        <LeadsTable
          organizationId={mockOrganizationId}
          marketplaceId={marketplaceId}
        />,
        { wrapper: createWrapper() }
      );

      // Verify marketplace filter is applied
      await waitFor(() => {
        expect(useLeadsHook.useLeads).toHaveBeenCalledWith(
          mockOrganizationId,
          expect.objectContaining({
            marketplaceId: [marketplaceId],
          }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should combine dashboard filters with table filters', async () => {
      const period = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      };
      const marketplaceId = 'mp-1';

      render(
        <LeadsTable
          organizationId={mockOrganizationId}
          period={period}
          marketplaceId={marketplaceId}
        />,
        { wrapper: createWrapper() }
      );

      // Apply additional table filter (status)
      const statusButton = screen.getByLabelText('Filtrar por status');
      fireEvent.click(statusButton);

      await waitFor(() => {
        const newCheckbox = screen.getByRole('checkbox', { name: /Novo/i });
        fireEvent.click(newCheckbox);
      });

      // Verify all filters are combined
      await waitFor(() => {
        expect(useLeadsHook.useLeads).toHaveBeenCalledWith(
          mockOrganizationId,
          expect.objectContaining({
            dateRange: period,
            marketplaceId: [marketplaceId],
            status: expect.arrayContaining(['new']),
          }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should preserve dashboard filters when clearing table filters', async () => {
      const period = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      };

      render(
        <LeadsTable organizationId={mockOrganizationId} period={period} />,
        { wrapper: createWrapper() }
      );

      // Apply table filter
      const statusButton = screen.getByLabelText('Filtrar por status');
      fireEvent.click(statusButton);

      await waitFor(() => {
        const newCheckbox = screen.getByRole('checkbox', { name: /Novo/i });
        fireEvent.click(newCheckbox);
      });

      // Clear filters
      await waitFor(() => {
        const clearButton = screen.getByText('Limpar filtros');
        fireEvent.click(clearButton);
      });

      // Dashboard filter should be preserved
      await waitFor(() => {
        expect(useLeadsHook.useLeads).toHaveBeenCalledWith(
          mockOrganizationId,
          expect.objectContaining({
            dateRange: period,
            status: undefined,
          }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });
  });

  describe('Debounced Search', () => {
    it('should debounce search input by 300ms', async () => {
      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      const searchInput = screen.getByPlaceholderText(/Nome, email, telefone, empresa/i);

      // Clear initial calls
      vi.mocked(useLeadsHook.useLeads).mockClear();

      // Type quickly
      fireEvent.change(searchInput, { target: { value: 'J' } });
      fireEvent.change(searchInput, { target: { value: 'Jo' } });
      fireEvent.change(searchInput, { target: { value: 'Joh' } });
      fireEvent.change(searchInput, { target: { value: 'John' } });

      // Wait for debounce (300ms) + a bit more
      await new Promise(resolve => setTimeout(resolve, 400));

      // Should call with final value
      await waitFor(() => {
        expect(useLeadsHook.useLeads).toHaveBeenCalledWith(
          mockOrganizationId,
          expect.objectContaining({
            searchText: 'John',
          }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should cancel previous debounce when typing continues', async () => {
      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      const searchInput = screen.getByPlaceholderText(/Nome, email, telefone, empresa/i);

      vi.mocked(useLeadsHook.useLeads).mockClear();

      // Type "John"
      fireEvent.change(searchInput, { target: { value: 'John' } });

      // Wait 200ms (not enough for debounce)
      await new Promise(resolve => setTimeout(resolve, 200));

      // Type more
      fireEvent.change(searchInput, { target: { value: 'John Doe' } });

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 400));

      // Should call once with final value
      await waitFor(() => {
        const calls = vi.mocked(useLeadsHook.useLeads).mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[1]).toMatchObject({
          searchText: 'John Doe',
        });
      });
    });
  });
});
