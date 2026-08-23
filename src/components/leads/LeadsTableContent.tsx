/**
 * LeadsTableContent Component
 * 
 * Displays leads data in a virtualized table with sorting and selection.
 * Uses @tanstack/react-virtual for performance with large datasets.
 * Automatically switches to mobile card layout on small screens.
 * 
 * Requirements: 1.4, 4.1-4.5, 9.2, 11.1, 11.2, 11.3, 11.4, 11.5, 12.1
 */

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LeadsMobileList } from './LeadsMobileList';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
} from 'lucide-react';
import type { Lead, SortConfig } from '@/types/leads';
import { LEAD_TABLE_COLUMNS, VIRTUALIZATION_THRESHOLD } from './constants';
import {
  formatDate,
  formatPhoneNumber,
  getStatusColor,
  getStatusLabel,
  getStatusIcon,
} from './utils';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { LeadProductBadge } from './LeadProductBadge';

interface LeadsTableContentProps {
  leads: Lead[];
  isLoading: boolean;
  sort: SortConfig;
  onSortChange: (sort: SortConfig) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  selectedLeads: string[];
  onSelectionChange: (leadIds: string[]) => void;
  organizationId?: string;
}

/**
 * LeadsTableContent - Virtualized table component with responsive mobile layout
 * 
 * Features:
 * - Virtualization for performance with 100+ rows
 * - Sortable column headers with visual indicators
 * - Row selection with checkboxes
 * - Formatted data display (dates, status badges, phone numbers)
 * - Action buttons (edit/delete) for each row
 * - Automatic switch to card layout on mobile (< 768px)
 */
export function LeadsTableContent({
  leads,
  isLoading,
  sort,
  onSortChange,
  onEdit,
  onDelete,
  selectedLeads,
  onSelectionChange,
  organizationId,
}: LeadsTableContentProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Track screen size for responsive layout (Requirement 11.1, 11.2)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine if virtualization should be enabled (Requirement 12.7 - Memoized)
  const shouldVirtualize = useMemo(() => {
    return leads.length > VIRTUALIZATION_THRESHOLD;
  }, [leads.length]);

  // Set up virtualizer for large datasets
  const rowVirtualizer = useVirtualizer({
    count: leads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height in pixels
    overscan: 5, // Render 5 extra rows above/below viewport
    enabled: shouldVirtualize,
  });

  // Keyboard navigation support (Requirement 11.4)
  useKeyboardNavigation({
    itemCount: leads.length,
    onItemSelect: (index) => {
      const lead = leads[index];
      handleSelectRow(lead.id);
    },
    onItemEdit: (index) => {
      const lead = leads[index];
      onEdit(lead);
    },
    enabled: leads.length > 0,
  });

  // Calculate if all leads are selected (Requirement 12.7 - Memoized)
  const allSelected = useMemo(() => {
    return leads.length > 0 && selectedLeads.length === leads.length;
  }, [leads.length, selectedLeads.length]);

  // Calculate if some (but not all) leads are selected (Requirement 12.7 - Memoized)
  const someSelected = useMemo(() => {
    return selectedLeads.length > 0 && selectedLeads.length < leads.length;
  }, [leads.length, selectedLeads.length]);

  /**
   * Handle "select all" checkbox toggle (Requirement 12.7 - Memoized callback)
   */
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(leads.map(lead => lead.id));
    }
  }, [allSelected, leads, onSelectionChange]);

  /**
   * Handle individual row selection (Requirement 12.7 - Memoized callback)
   */
  const handleSelectRow = useCallback((leadId: string) => {
    if (selectedLeads.includes(leadId)) {
      onSelectionChange(selectedLeads.filter(id => id !== leadId));
    } else {
      onSelectionChange([...selectedLeads, leadId]);
    }
  }, [selectedLeads, onSelectionChange]);

  /**
   * Handle column sort (Requirement 12.7 - Memoized callback)
   */
  const handleSort = useCallback((columnKey: string) => {
    if (sort.column === columnKey) {
      // Toggle direction if same column
      onSortChange({
        column: columnKey,
        direction: sort.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      // Default to ascending for new column
      onSortChange({
        column: columnKey,
        direction: 'asc',
      });
    }
  }, [sort, onSortChange]);

  /**
   * Render sort indicator icon (Requirement 12.7 - Memoized callback)
   */
  const renderSortIcon = useCallback((columnKey: string) => {
    if (sort.column !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sort.direction === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  }, [sort]);

  /**
   * Render table header (Requirement 12.7 - Memoized)
   */
  const renderTableHeader = useMemo(() => (
    <TableHeader>
      <TableRow role="row">
        {LEAD_TABLE_COLUMNS.map((column) => {
          if (column.key === 'select') {
            return (
              <TableHead
                key={column.key}
                role="columnheader"
                style={{ width: column.width }}
                className={`text-${column.align || 'left'}`}
                aria-label="Seleção"
              >
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos os leads"
                  className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                />
              </TableHead>
            );
          }

          if (column.key === 'index') {
            return (
              <TableHead
                key={column.key}
                role="columnheader"
                style={{ width: column.width }}
                className={`text-${column.align || 'left'}`}
              >
                {column.label}
              </TableHead>
            );
          }

          if (column.key === 'actions') {
            return (
              <TableHead
                key={column.key}
                role="columnheader"
                style={{ width: column.width }}
                className={`text-${column.align || 'left'}`}
              >
                {column.label}
              </TableHead>
            );
          }

          // Sortable columns
          return (
            <TableHead
              key={column.key}
              role="columnheader"
              style={{ width: column.width }}
              className={`text-${column.align || 'left'}`}
              aria-sort={
                sort.column === column.key
                  ? sort.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              {column.sortable ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort(column.key)}
                  className="-ml-3 h-8 data-[state=open]:bg-accent"
                  aria-label={`Ordenar por ${column.label}${
                    sort.column === column.key
                      ? `, atualmente ordenado ${
                          sort.direction === 'asc' ? 'crescente' : 'decrescente'
                        }`
                      : ''
                  }`}
                >
                  {column.label}
                  {renderSortIcon(column.key)}
                </Button>
              ) : (
                column.label
              )}
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
  ), [allSelected, someSelected, sort, handleSelectAll, handleSort, renderSortIcon]);

  /**
   * Render a single table row (Requirement 12.7 - Memoized callback)
   */
  const renderTableRow = useCallback((lead: Lead, index: number) => {
    const isSelected = selectedLeads.includes(lead.id);

    return (
      <TableRow
        key={lead.id}
        role="row"
        data-state={isSelected ? 'selected' : undefined}
        data-row-index={index}
        aria-selected={isSelected}
        tabIndex={0}
        className="hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        onKeyDown={(e) => {
          // Enter key to edit
          if (e.key === 'Enter') {
            e.preventDefault();
            onEdit(lead);
          }
          // Space key to toggle selection
          if (e.key === ' ') {
            e.preventDefault();
            handleSelectRow(lead.id);
          }
        }}
      >
        {/* Checkbox column */}
        <TableCell role="cell" className="text-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleSelectRow(lead.id)}
            aria-label={`Selecionar ${lead.name}`}
            tabIndex={-1}
          />
        </TableCell>

        {/* Index column */}
        <TableCell role="cell" className="text-center font-medium text-muted-foreground">
          {index + 1}
        </TableCell>

        {/* Name column */}
        <TableCell role="cell" className="font-medium">{lead.name}</TableCell>

        {/* Email column */}
        <TableCell role="cell" className="text-muted-foreground">
          {lead.email || '-'}
        </TableCell>

        {/* Phone column */}
        <TableCell role="cell" className="text-muted-foreground">
          {formatPhoneNumber(lead.phone || lead.mobile_phone)}
        </TableCell>

        {/* Company column */}
        <TableCell role="cell" className="text-muted-foreground">
          {lead.company_name || lead.trade_name || '-'}
        </TableCell>

        {/* Marketplace/Canal column */}
        <TableCell role="cell">
          {lead.marketplace_name ? (
            <span className="inline-flex items-center gap-2">
              {lead.marketplace_name}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* Produto column */}
        <TableCell role="cell">
          {organizationId ? (
            <LeadProductBadge leadName={lead.name} organizationId={organizationId} />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Status column */}
        <TableCell role="cell">
          {lead.lead_status ? (
            <Badge className={`${getStatusColor(lead.lead_status)} inline-flex items-center gap-1.5`} aria-label={`Status: ${getStatusLabel(lead.lead_status)}`}>
              {(() => {
                const StatusIcon = getStatusIcon(lead.lead_status);
                return <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />;
              })()}
              {getStatusLabel(lead.lead_status)}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* Created at column */}
        <TableCell role="cell" className="text-muted-foreground">
          {formatDate(lead.created_at)}
        </TableCell>

        {/* Actions column */}
        <TableCell role="cell" className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(lead)}
              aria-label={`Editar ${lead.name}`}
              tabIndex={-1}
              className="h-8 w-8 p-0 focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(lead.id)}
              aria-label={`Deletar ${lead.name}`}
              tabIndex={-1}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive focus:ring-2 focus:ring-destructive focus:ring-offset-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }, [selectedLeads, onEdit, onDelete, handleSelectRow]);

  /**
   * Render table body with or without virtualization
   */
  const renderTableBody = () => {
    if (shouldVirtualize) {
      const virtualItems = rowVirtualizer.getVirtualItems();

      return (
        <TableBody>
          {/* Spacer for virtual scroll positioning */}
          <tr style={{ height: `${virtualItems[0]?.start ?? 0}px` }} aria-hidden="true" />
          
          {virtualItems.map((virtualRow) => {
            const lead = leads[virtualRow.index];
            return renderTableRow(lead, virtualRow.index);
          })}
          
          {/* Spacer for remaining virtual height */}
          <tr 
            style={{ 
              height: `${
                rowVirtualizer.getTotalSize() - 
                (virtualItems[virtualItems.length - 1]?.end ?? 0)
              }px` 
            }} 
            aria-hidden="true" 
          />
        </TableBody>
      );
    }

    // Non-virtualized rendering for small datasets
    return (
      <TableBody>
        {leads.map((lead, index) => renderTableRow(lead, index))}
      </TableBody>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-zinc-800">
        <div className="p-8 text-center text-muted-foreground">
          Carregando leads...
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-zinc-800">
        <div className="p-8 text-center text-muted-foreground">
          Nenhum lead encontrado
        </div>
      </div>
    );
  }

  // Render mobile card layout on small screens (Requirement 11.1, 11.2)
  if (isMobile) {
    return (
      <LeadsMobileList
        leads={leads}
        isLoading={isLoading}
        onEdit={onEdit}
        onDelete={onDelete}
        selectedLeads={selectedLeads}
        onSelectionChange={onSelectionChange}
      />
    );
  }

  // Render desktop table layout
  return (
    <div
      ref={parentRef}
      role="region"
      aria-label="Tabela de leads"
      className="rounded-lg border border-gray-200 dark:border-zinc-800 overflow-auto"
      style={{
        maxHeight: shouldVirtualize ? '600px' : 'none',
      }}
    >
      <Table role="table" aria-label="Lista de leads">
        {renderTableHeader}
        {renderTableBody()}
      </Table>
    </div>
  );
}
