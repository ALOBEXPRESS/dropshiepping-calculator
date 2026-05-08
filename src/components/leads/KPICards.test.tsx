/**
 * KPICards Component Tests
 * 
 * Tests for the KPICards component that displays lead KPI metrics.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 11.7
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KPICards } from './KPICards';
import * as useLeadsHook from '@/hooks/useLeads';

// Mock the useLeadKPIs hook
vi.mock('@/hooks/useLeads', () => ({
  useLeadKPIs: vi.fn(),
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('KPICards', () => {
  it('should display loading skeletons when data is loading', () => {
    vi.spyOn(useLeadsHook, 'useLeadKPIs').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(
      <KPICards organizationId="test-org-id" />,
      { wrapper: createWrapper() }
    );

    // Should show 4 loading skeletons
    const skeletons = screen.getAllByRole('status', { name: /loading kpi data/i });
    expect(skeletons).toHaveLength(4);
  });

  it('should display all four KPI cards with correct titles', () => {
    vi.spyOn(useLeadsHook, 'useLeadKPIs').mockReturnValue({
      data: {
        totalLeads: 100,
        newLeads: 25,
        qualifiedLeads: 40,
        lostLeads: 15,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <KPICards organizationId="test-org-id" />,
      { wrapper: createWrapper() }
    );

    // Check all four KPI titles are present
    expect(screen.getByText('Total de Leads')).toBeInTheDocument();
    expect(screen.getByText('Novos Leads')).toBeInTheDocument();
    expect(screen.getByText('Leads Qualificados')).toBeInTheDocument();
    expect(screen.getByText('Leads Perdidos')).toBeInTheDocument();
  });

  it('should display correct KPI values', () => {
    vi.spyOn(useLeadsHook, 'useLeadKPIs').mockReturnValue({
      data: {
        totalLeads: 100,
        newLeads: 25,
        qualifiedLeads: 40,
        lostLeads: 15,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <KPICards organizationId="test-org-id" />,
      { wrapper: createWrapper() }
    );

    // Check values are displayed (formatted as numbers with locale)
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should display zero values when data is not available', () => {
    vi.spyOn(useLeadsHook, 'useLeadKPIs').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <KPICards organizationId="test-org-id" />,
      { wrapper: createWrapper() }
    );

    // Should display 0 for all metrics when no data
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(4);
  });

  it('should render with responsive grid layout classes', () => {
    vi.spyOn(useLeadsHook, 'useLeadKPIs').mockReturnValue({
      data: {
        totalLeads: 100,
        newLeads: 25,
        qualifiedLeads: 40,
        lostLeads: 15,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = render(
      <KPICards organizationId="test-org-id" />,
      { wrapper: createWrapper() }
    );

    // Check for responsive grid classes
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1');
    expect(gridContainer).toHaveClass('md:grid-cols-2');
    expect(gridContainer).toHaveClass('lg:grid-cols-4');
  });

  it('should apply custom className when provided', () => {
    vi.spyOn(useLeadsHook, 'useLeadKPIs').mockReturnValue({
      data: {
        totalLeads: 100,
        newLeads: 25,
        qualifiedLeads: 40,
        lostLeads: 15,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = render(
      <KPICards organizationId="test-org-id" className="custom-class" />,
      { wrapper: createWrapper() }
    );

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('custom-class');
  });

  it('should pass filters to useLeadKPIs hook', () => {
    const mockUseLeadKPIs = vi.spyOn(useLeadsHook, 'useLeadKPIs').mockReturnValue({
      data: {
        totalLeads: 100,
        newLeads: 25,
        qualifiedLeads: 40,
        lostLeads: 15,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const filters = {
      status: ['qualified' as const],
      searchText: 'test',
    };

    render(
      <KPICards organizationId="test-org-id" filters={filters} />,
      { wrapper: createWrapper() }
    );

    // Verify hook was called with correct parameters
    expect(mockUseLeadKPIs).toHaveBeenCalledWith('test-org-id', filters);
  });
});
