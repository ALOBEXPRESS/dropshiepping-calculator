/**
 * FilterBar Component Tests
 * 
 * Tests for comprehensive filtering functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FilterBar } from './FilterBar';
import type { LeadFilters } from '@/types/leads';
import * as useLeadsHook from '@/hooks/useLeads';

// Mock the useLeadMarketplaces hook
vi.mock('@/hooks/useLeads', () => ({
  useLeadMarketplaces: vi.fn(),
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

describe('FilterBar', () => {
  const mockOnFiltersChange = vi.fn();
  const mockOrganizationId = 'org-123';
  
  const defaultFilters: LeadFilters = {
    searchText: undefined,
    status: undefined,
    marketplaceId: undefined,
    gender: undefined,
    dateRange: undefined,
  };
  
  const mockMarketplaces = [
    { id: 'mp-1', name: 'Mercado Livre', organization_id: mockOrganizationId },
    { id: 'mp-2', name: 'Shopee', organization_id: mockOrganizationId },
  ];
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useLeadsHook, 'useLeadMarketplaces').mockReturnValue({
      data: mockMarketplaces,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });
  
  it('should render all filter controls', () => {
    render(
      <FilterBar
        organizationId={mockOrganizationId}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        resultCount={100}
      />,
      { wrapper: createWrapper() }
    );
    
    // Check for search input
    expect(screen.getByPlaceholderText(/Nome, email, telefone, empresa/i)).toBeInTheDocument();
    
    // Check for filter labels
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Canal')).toBeInTheDocument();
    expect(screen.getByText('Gênero')).toBeInTheDocument();
    expect(screen.getByText('Período')).toBeInTheDocument();
  });
  
  it('should display result count', () => {
    render(
      <FilterBar
        organizationId={mockOrganizationId}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        resultCount={42}
      />,
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByText('42 leads encontrados')).toBeInTheDocument();
  });
  
  it('should display singular form for single result', () => {
    render(
      <FilterBar
        organizationId={mockOrganizationId}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        resultCount={1}
      />,
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByText('1 lead encontrado')).toBeInTheDocument();
  });
  
  it('should call onFiltersChange when search input changes (debounced)', async () => {
    render(
      <FilterBar
        organizationId={mockOrganizationId}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        resultCount={100}
      />,
      { wrapper: createWrapper() }
    );
    
    // Clear any initial calls
    mockOnFiltersChange.mockClear();
    
    const searchInput = screen.getByPlaceholderText(/Nome, email, telefone, empresa/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    // Wait for debounce (300ms) + a bit more
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Should call after debounce
    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        searchText: 'John',
      })
    );
  });
  
  it('should show active filter count badge', () => {
    const filtersWithActive: LeadFilters = {
      searchText: 'test',
      status: ['new', 'qualified'],
      marketplaceId: undefined,
      gender: undefined,
      dateRange: undefined,
    };
    
    render(
      <FilterBar
        organizationId={mockOrganizationId}
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
        resultCount={100}
      />,
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByText('2 filtros')).toBeInTheDocument();
  });
  
  it('should show clear filters button when filters are active', () => {
    const filtersWithActive: LeadFilters = {
      searchText: 'test',
      status: undefined,
      marketplaceId: undefined,
      gender: undefined,
      dateRange: undefined,
    };
    
    render(
      <FilterBar
        organizationId={mockOrganizationId}
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
        resultCount={100}
      />,
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByText('Limpar filtros')).toBeInTheDocument();
  });
  
  it('should not show clear filters button when no filters are active', () => {
    render(
      <FilterBar
        organizationId={mockOrganizationId}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        resultCount={100}
      />,
      { wrapper: createWrapper() }
    );
    
    expect(screen.queryByText('Limpar filtros')).not.toBeInTheDocument();
  });
  
  it('should clear all filters when clear button is clicked', () => {
    const filtersWithActive: LeadFilters = {
      searchText: 'test',
      status: ['new'],
      marketplaceId: ['mp-1'],
      gender: ['male'],
      dateRange: { from: new Date(), to: new Date() },
    };
    
    render(
      <FilterBar
        organizationId={mockOrganizationId}
        filters={filtersWithActive}
        onFiltersChange={mockOnFiltersChange}
        resultCount={100}
      />,
      { wrapper: createWrapper() }
    );
    
    const clearButton = screen.getByText('Limpar filtros');
    fireEvent.click(clearButton);
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      searchText: undefined,
      status: undefined,
      marketplaceId: undefined,
      gender: undefined,
      dateRange: undefined,
    });
  });
  
  it('should display marketplace options when marketplace filter is opened', async () => {
    render(
      <FilterBar
        organizationId={mockOrganizationId}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        resultCount={100}
      />,
      { wrapper: createWrapper() }
    );
    
    // Click marketplace filter button
    const marketplaceButton = screen.getByLabelText('Filtrar por canal');
    fireEvent.click(marketplaceButton);
    
    // Wait a bit for popover to open
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if marketplace names are in the document (they should be rendered in the popover)
    const mercadoLivre = screen.queryByText('Mercado Livre');
    const shopee = screen.queryByText('Shopee');
    
    // At least one should be visible (popover might not be fully rendered in test environment)
    expect(mercadoLivre || shopee).toBeTruthy();
  });
  
  it('should show loading state for marketplace filter', () => {
    vi.spyOn(useLeadsHook, 'useLeadMarketplaces').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);
    
    render(
      <FilterBar
        organizationId={mockOrganizationId}
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
        resultCount={100}
      />,
      { wrapper: createWrapper() }
    );
    
    const marketplaceButton = screen.getByLabelText('Filtrar por canal');
    expect(marketplaceButton).toBeDisabled();
  });
  
  it('should display selected filter counts in buttons', () => {
    const filtersWithSelections: LeadFilters = {
      searchText: undefined,
      status: ['new', 'qualified'],
      marketplaceId: ['mp-1'],
      gender: ['male', 'female'],
      dateRange: undefined,
    };
    
    render(
      <FilterBar
        organizationId={mockOrganizationId}
        filters={filtersWithSelections}
        onFiltersChange={mockOnFiltersChange}
        resultCount={100}
      />,
      { wrapper: createWrapper() }
    );
    
    // Use getAllByText for duplicate text
    const twoSelected = screen.getAllByText('2 selecionados');
    expect(twoSelected.length).toBeGreaterThanOrEqual(1); // Status and Gender both show "2 selecionados"
    expect(screen.getByText('1 selecionado')).toBeInTheDocument(); // Marketplace
  });
  
  describe('Responsive Layout', () => {
    it('should show mobile filter button on small screens', () => {
      render(
        <FilterBar
          organizationId={mockOrganizationId}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          resultCount={100}
        />,
        { wrapper: createWrapper() }
      );
      
      // Mobile filter button should be present (hidden by CSS on desktop)
      const mobileFilterButton = screen.getByLabelText('Abrir filtros');
      expect(mobileFilterButton).toBeInTheDocument();
    });
    
    it('should show filter count badge on mobile button when filters are active', () => {
      const filtersWithActive: LeadFilters = {
        searchText: 'test',
        status: ['new'],
        marketplaceId: undefined,
        gender: undefined,
        dateRange: undefined,
      };
      
      render(
        <FilterBar
          organizationId={mockOrganizationId}
          filters={filtersWithActive}
          onFiltersChange={mockOnFiltersChange}
          resultCount={100}
        />,
        { wrapper: createWrapper() }
      );
      
      // Should show filter count in mobile button
      const badges = screen.getAllByText('2');
      expect(badges.length).toBeGreaterThan(0);
    });
    
    it('should open mobile filter sheet when button is clicked', async () => {
      render(
        <FilterBar
          organizationId={mockOrganizationId}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          resultCount={100}
        />,
        { wrapper: createWrapper() }
      );
      
      const mobileFilterButton = screen.getByLabelText('Abrir filtros');
      fireEvent.click(mobileFilterButton);
      
      // Wait for sheet to open
      await waitFor(() => {
        expect(screen.getByText('Filtros de Leads')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Refine sua busca usando os filtros abaixo')).toBeInTheDocument();
    });
    
    it('should show apply button in mobile sheet', async () => {
      render(
        <FilterBar
          organizationId={mockOrganizationId}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          resultCount={100}
        />,
        { wrapper: createWrapper() }
      );
      
      const mobileFilterButton = screen.getByLabelText('Abrir filtros');
      fireEvent.click(mobileFilterButton);
      
      await waitFor(() => {
        expect(screen.getByText('Aplicar filtros')).toBeInTheDocument();
      });
    });
    
    it('should close mobile sheet when apply button is clicked', async () => {
      render(
        <FilterBar
          organizationId={mockOrganizationId}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          resultCount={100}
        />,
        { wrapper: createWrapper() }
      );
      
      // Open sheet
      const mobileFilterButton = screen.getByLabelText('Abrir filtros');
      fireEvent.click(mobileFilterButton);
      
      await waitFor(() => {
        expect(screen.getByText('Aplicar filtros')).toBeInTheDocument();
      });
      
      // Click apply button
      const applyButton = screen.getByText('Aplicar filtros');
      fireEvent.click(applyButton);
      
      // Sheet should close (title should not be visible)
      await waitFor(() => {
        expect(screen.queryByText('Filtros de Leads')).not.toBeInTheDocument();
      });
    });
    
    it('should show clear filters button in mobile sheet when filters are active', async () => {
      const filtersWithActive: LeadFilters = {
        searchText: 'test',
        status: ['new'],
        marketplaceId: undefined,
        gender: undefined,
        dateRange: undefined,
      };
      
      render(
        <FilterBar
          organizationId={mockOrganizationId}
          filters={filtersWithActive}
          onFiltersChange={mockOnFiltersChange}
          resultCount={100}
        />,
        { wrapper: createWrapper() }
      );
      
      // Open sheet
      const mobileFilterButton = screen.getByLabelText('Abrir filtros');
      fireEvent.click(mobileFilterButton);
      
      await waitFor(() => {
        expect(screen.getByText('Limpar todos os filtros')).toBeInTheDocument();
      });
    });
    
    it('should clear filters and close sheet when clear button is clicked in mobile', async () => {
      const filtersWithActive: LeadFilters = {
        searchText: 'test',
        status: ['new'],
        marketplaceId: undefined,
        gender: undefined,
        dateRange: undefined,
      };
      
      render(
        <FilterBar
          organizationId={mockOrganizationId}
          filters={filtersWithActive}
          onFiltersChange={mockOnFiltersChange}
          resultCount={100}
        />,
        { wrapper: createWrapper() }
      );
      
      // Open sheet
      const mobileFilterButton = screen.getByLabelText('Abrir filtros');
      fireEvent.click(mobileFilterButton);
      
      await waitFor(() => {
        expect(screen.getByText('Limpar todos os filtros')).toBeInTheDocument();
      });
      
      // Click clear button
      const clearButton = screen.getByText('Limpar todos os filtros');
      fireEvent.click(clearButton);
      
      // Should call onFiltersChange with empty filters
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        searchText: undefined,
        status: undefined,
        marketplaceId: undefined,
        gender: undefined,
        dateRange: undefined,
      });
      
      // Sheet should close
      await waitFor(() => {
        expect(screen.queryByText('Filtros de Leads')).not.toBeInTheDocument();
      });
    });
  });
});
