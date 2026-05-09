/**
 * LeadsTable Component
 * 
 * Main container component for the leads management table.
 * Manages state for filters, sorting, pagination, and selected leads.
 * Integrates with useLeads and useLeadKPIs hooks for data fetching.
 * 
 * Requirements: 1.1, 1.6, 1.7, 10.1, 10.2, 10.3
 */

import React, { useState, lazy, Suspense } from 'react';
import { useLeads } from '@/hooks/useLeads';
import type {
  Lead,
  LeadFilters,
  SortConfig,
  PaginationConfig,
} from '@/types/leads';
import { DEFAULT_PAGE_SIZE } from './constants';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/LoadingState';
import { AlertCircle, Database, RefreshCw } from 'lucide-react';
import { KPICards } from './KPICards';
import { KPICardSkeleton } from '@/components/skeletons/KPICardSkeleton';
import { LeadsTableContent } from './LeadsTableContent';
import { TablePagination } from './TablePagination';
import { FilterBar } from './FilterBar';
import { Plus, Download } from 'lucide-react';
import { useCSVExport } from '@/hooks/useCSVExport';
import { useOrganization } from '@/hooks/useOrganization';
import { getErrorMessage } from '@/utils/errorMessages';

// Lazy load dialog components for better performance (Requirement 12.6)
const LeadFormDialog = lazy(() => import('./LeadFormDialog').then(module => ({ default: module.LeadFormDialog })));
const DeleteConfirmDialog = lazy(() => import('./DeleteConfirmDialog').then(module => ({ default: module.DeleteConfirmDialog })));

interface LeadsTableProps {
  organizationId: string;
  period?: {
    from: Date;
    to: Date;
  } | null;
  marketplaceId?: string | null;
  className?: string;
}

/**
 * LeadsTable - Main container component
 * 
 * Manages local state for:
 * - filters: Search text, status, marketplace, gender, date range
 * - sort: Column and direction
 * - pagination: Page number, page size, total count
 * - selectedLeads: Array of selected lead IDs
 * 
 * Integrates with:
 * - useLeads hook for fetching leads data
 * - useLeadKPIs hook for fetching KPI metrics
 * 
 * Handles:
 * - Loading states with skeleton loaders
 * - Error states with retry functionality
 * - Empty states when no leads found
 */
export default function LeadsTable({
  organizationId,
  period,
  marketplaceId,
  className,
}: LeadsTableProps) {
  // Local state for filters
  const [filters, setFilters] = useState<LeadFilters>({
    searchText: undefined,
    status: undefined,
    marketplaceId: marketplaceId ? [marketplaceId] : undefined,
    gender: undefined,
    dateRange: period || undefined,
  });

  // Local state for sorting
  const [sort, setSort] = useState<SortConfig>({
    column: 'created_at',
    direction: 'desc',
  });

  // Local state for pagination
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0,
  });

  // Local state for selected leads
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // Local state for dialogs
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<{ id: string; name: string } | null>(null);

  // CSV Export hook
  const { exportToCSV, isExporting } = useCSVExport();

  // Fetch organization data for CSV filename
  const { data: organization } = useOrganization(organizationId);

  // Sync external filters with internal state
  React.useEffect(() => {
    setFilters(prev => ({
      ...prev,
      marketplaceId: marketplaceId ? [marketplaceId] : undefined,
      dateRange: period || undefined,
    }));
  }, [period, marketplaceId]);

  // Fetch leads data using React Query hook
  const {
    data: leadsData,
    isLoading: isLoadingLeads,
    isError: isErrorLeads,
    error: leadsError,
    refetch: refetchLeads,
  } = useLeads(organizationId, filters, sort, pagination);

  // Track previous totalCount to avoid infinite loop
  const prevTotalCountRef = React.useRef<number | undefined>(undefined);

  // Update pagination total count when data changes
  // Also adjust current page if it's now out of bounds (e.g., after deleting last item on a page)
  React.useEffect(() => {
    if (leadsData?.totalCount !== undefined && leadsData.totalCount !== prevTotalCountRef.current) {
      prevTotalCountRef.current = leadsData.totalCount;
      
      const newTotalPages = Math.ceil(leadsData.totalCount / pagination.pageSize);
      const maxValidPage = Math.max(0, newTotalPages - 1);
      
      // If current page is now out of bounds, go to the last valid page
      const adjustedPage = pagination.page > maxValidPage ? maxValidPage : pagination.page;
      
      setPagination(prev => ({
        ...prev,
        totalCount: leadsData.totalCount,
        page: adjustedPage,
      }));
    }
  }, [leadsData?.totalCount, pagination.page, pagination.pageSize]);

  // Handlers for state updates
  const handleFiltersChange = (newFilters: LeadFilters) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleSortChange = (newSort: SortConfig) => {
    setSort(newSort);
  };

  const handlePaginationChange = (newPagination: Partial<PaginationConfig>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  };

  const handleSelectionChange = (leadIds: string[]) => {
    setSelectedLeads(leadIds);
  };

  const handleRetry = () => {
    refetchLeads();
  };

  // Loading state
  if (isLoadingLeads && !leadsData) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {/* KPI Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </div>

          {/* Table skeleton */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
            <LoadingState variant="list" count={5} />
          </div>
        </div>
      </div>
    );
  }

  // Error state (Requirements: 1.7)
  if (isErrorLeads) {
    const errorMessage = getErrorMessage(leadsError, 'fetch');
    
    return (
      <div className={className}>
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar leads</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (leadsData && leadsData.data.length === 0 && !filters.searchText) {
    return (
      <div className={className}>
        <EmptyState
          icon={Database}
          title="Nenhum lead encontrado"
          description="Você ainda não possui leads cadastrados. Comece adicionando seu primeiro lead."
          action={{
            label: 'Adicionar Lead',
            onClick: () => setIsAddLeadDialogOpen(true),
          }}
        />
      </div>
    );
  }

  // Empty state with filters applied
  if (leadsData && leadsData.data.length === 0 && filters.searchText) {
    return (
      <div className={className}>
        <EmptyState
          icon={Database}
          title="Nenhum resultado encontrado"
          description="Não encontramos leads que correspondam aos filtros aplicados. Tente ajustar os critérios de busca."
          action={{
            label: 'Limpar Filtros',
            onClick: () => {
              setFilters({
                searchText: undefined,
                status: undefined,
                marketplaceId: marketplaceId ? [marketplaceId] : undefined,
                gender: undefined,
                dateRange: period || undefined,
              });
            },
          }}
        />
      </div>
    );
  }

  // Placeholder handlers for CRUD operations (will be implemented in Phase 4)
  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
  };

  const handleDelete = (leadId: string) => {
    const lead = leadsData?.data.find(l => l.id === leadId);
    if (lead) {
      setDeletingLead({ id: lead.id, name: lead.name });
    }
  };

  const handleAddLead = () => {
    setIsAddLeadDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    // Dialogs will close automatically
    // React Query will refetch data automatically via invalidation
  };

  const handleExportCSV = async () => {
    if (!leadsData?.data || leadsData.data.length === 0) {
      return;
    }

    // Export all filtered leads with organization name in filename
    // Format: "leads-{organization_name}-{date}.csv" or "leads-{date}.csv" if name not available
    await exportToCSV(leadsData.data, organization?.name);
  };

  // Main content
  return (
    <div className={className} data-leads-table>
      <div className="space-y-6">
        {/* KPI Cards - Implemented in Task 6 */}
        <KPICards
          organizationId={organizationId}
          filters={filters}
        />

        {/* Table Header with Add Lead Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Leads</h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="gap-2 flex-1 sm:flex-initial"
              disabled={isExporting || !leadsData?.data || leadsData.data.length === 0}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Exportando...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar CSV</span>
                  <span className="sm:hidden">Exportar</span>
                </>
              )}
            </Button>
            <Button onClick={handleAddLead} className="gap-2 flex-1 sm:flex-initial">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Adicionar Lead</span>
              <span className="sm:hidden">Adicionar</span>
            </Button>
          </div>
        </div>

        {/* Filter Bar - Implemented in Task 11 */}
        <FilterBar
          organizationId={organizationId}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          resultCount={leadsData?.totalCount || 0}
        />

        {/* Table Content - Implemented in Task 7 */}
        <LeadsTableContent
          leads={leadsData?.data || []}
          isLoading={isLoadingLeads}
          sort={sort}
          onSortChange={handleSortChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          selectedLeads={selectedLeads}
          onSelectionChange={handleSelectionChange}
        />

        {/* Pagination - Implemented in Task 8 */}
        <TablePagination
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
        />
      </div>

      {/* Lead Form Dialog - Create Mode */}
      <Suspense fallback={<div className="sr-only">Carregando formulário...</div>}>
        <LeadFormDialog
          open={isAddLeadDialogOpen}
          onOpenChange={setIsAddLeadDialogOpen}
          lead={null}
          organizationId={organizationId}
          onSuccess={handleDialogSuccess}
        />
      </Suspense>

      {/* Lead Form Dialog - Edit Mode */}
      <Suspense fallback={<div className="sr-only">Carregando formulário...</div>}>
        <LeadFormDialog
          open={!!editingLead}
          onOpenChange={(open) => !open && setEditingLead(null)}
          lead={editingLead}
          organizationId={organizationId}
          onSuccess={handleDialogSuccess}
        />
      </Suspense>

      {/* Delete Confirmation Dialog */}
      {deletingLead && (
        <Suspense fallback={<div className="sr-only">Carregando diálogo...</div>}>
          <DeleteConfirmDialog
            open={!!deletingLead}
            onOpenChange={(open) => !open && setDeletingLead(null)}
            leadId={deletingLead.id}
            leadName={deletingLead.name}
            organizationId={organizationId}
            onSuccess={handleDialogSuccess}
          />
        </Suspense>
      )}
    </div>
  );
}
