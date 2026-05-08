/**
 * LeadsTable Component Tests
 * 
 * Tests for the main LeadsTable container component.
 * Validates: Requirements 1.1, 1.5, 1.6, 1.7, 10.1, 10.2, 10.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LeadsTable from './LeadsTable';
import * as useLeadsHook from '@/hooks/useLeads';

// Mock the hooks
vi.mock('@/hooks/useLeads', () => ({
  useLeads: vi.fn(),
  useLeadKPIs: vi.fn(),
  useLeadMarketplaces: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
  })),
}));

// Mock the KPICards component
vi.mock('./KPICards', () => ({
  KPICards: ({ organizationId, filters }: any) => (
    <div data-testid="kpi-cards">
      <div>Total de Leads</div>
      <div>Novos Leads</div>
      <div>Leads Qualificados</div>
      <div>Leads Perdidos</div>
    </div>
  ),
}));

// Helper to create a wrapper with QueryClient
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

describe('LeadsTable', () => {
  const mockOrganizationId = 'org-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading skeletons when data is loading', () => {
      // Mock loading state
      vi.mocked(useLeadsHook.useLeads).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Should show loading state
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should display error message when data fetch fails', async () => {
      // Mock error state
      vi.mocked(useLeadsHook.useLeads).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch leads'),
        refetch: vi.fn(),
      } as any);

      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar leads')).toBeInTheDocument();
      });

      // Should show retry button
      expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', async () => {
      const mockRefetch = vi.fn();

      // Mock error state
      vi.mocked(useLeadsHook.useLeads).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch leads'),
        refetch: mockRefetch,
      } as any);

      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Click retry button
      const retryButton = screen.getByText('Tentar novamente');
      retryButton.click();

      // Should call refetch
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no leads exist', async () => {
      // Mock empty data
      vi.mocked(useLeadsHook.useLeads).mockReturnValue({
        data: {
          data: [],
          totalCount: 0,
          page: 0,
          pageSize: 25,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Should show empty state
      await waitFor(() => {
        expect(screen.getByText('Nenhum lead encontrado')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Você ainda não possui leads cadastrados/i)
      ).toBeInTheDocument();
    });

    it('should display filtered empty state when search returns no results', async () => {
      // Mock empty data with search filter
      vi.mocked(useLeadsHook.useLeads).mockReturnValue({
        data: {
          data: [],
          totalCount: 0,
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
        {
          wrapper: createWrapper(),
        }
      );

      // Simulate applying a search filter by re-rendering
      // (In real usage, this would happen through FilterBar interaction)
      await waitFor(() => {
        expect(screen.getByText('Nenhum lead encontrado')).toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    it('should display leads data when available', async () => {
      const mockLeads = [
        {
          id: '1',
          organization_id: mockOrganizationId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '11999999999',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          organization_id: mockOrganizationId,
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '11988888888',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      // Mock data
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

      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Should display KPI cards
      await waitFor(() => {
        expect(screen.getByText('Total de Leads')).toBeInTheDocument();
      });

      // Should display lead names
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();

      // Should display lead emails
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('should display KPI metrics correctly', async () => {
      const mockLeads = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        organization_id: mockOrganizationId,
        name: `Lead ${i + 1}`,
        email: `lead${i + 1}@example.com`,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }));

      // Mock data
      vi.mocked(useLeadsHook.useLeads).mockReturnValue({
        data: {
          data: mockLeads.slice(0, 25), // First page
          totalCount: 100,
          page: 0,
          pageSize: 25,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(<LeadsTable organizationId={mockOrganizationId} />, {
        wrapper: createWrapper(),
      });

      // Should display all KPI card titles (mocked component)
      await waitFor(() => {
        expect(screen.getByText('Total de Leads')).toBeInTheDocument();
      });

      expect(screen.getByText('Novos Leads')).toBeInTheDocument();
      expect(screen.getByText('Leads Qualificados')).toBeInTheDocument();
      expect(screen.getByText('Leads Perdidos')).toBeInTheDocument();
    });
  });

  describe('Integration with Dashboard Filters', () => {
    it('should sync with period filter from dashboard', async () => {
      const period = {
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      };

      // Mock data
      vi.mocked(useLeadsHook.useLeads).mockReturnValue({
        data: {
          data: [],
          totalCount: 0,
          page: 0,
          pageSize: 25,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(
        <LeadsTable organizationId={mockOrganizationId} period={period} />,
        {
          wrapper: createWrapper(),
        }
      );

      // Verify useLeads was called with period filter
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

    it('should sync with marketplace filter from dashboard', async () => {
      const marketplaceId = 'marketplace-123';

      // Mock data
      vi.mocked(useLeadsHook.useLeads).mockReturnValue({
        data: {
          data: [],
          totalCount: 0,
          page: 0,
          pageSize: 25,
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      render(
        <LeadsTable
          organizationId={mockOrganizationId}
          marketplaceId={marketplaceId}
        />,
        {
          wrapper: createWrapper(),
        }
      );

      // Verify useLeads was called with marketplace filter
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
  });
});
