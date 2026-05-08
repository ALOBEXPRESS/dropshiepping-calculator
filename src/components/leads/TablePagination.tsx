/**
 * TablePagination Component
 * 
 * Provides pagination controls for the leads table including:
 * - Page navigation (first, previous, next, last)
 * - Current page and total pages display
 * - Result count display
 * - Page size selector
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronFirst, ChevronLast } from 'lucide-react';
import type { PaginationConfig } from '@/types/leads';
import { PAGE_SIZE_OPTIONS } from './constants';

interface TablePaginationProps {
  pagination: PaginationConfig;
  onPaginationChange: (newPagination: Partial<PaginationConfig>) => void;
  className?: string;
}

/**
 * TablePagination - Pagination controls component
 * 
 * Displays:
 * - Result count (e.g., "Showing 1-25 of 150 leads")
 * - Page navigation buttons (first, previous, next, last)
 * - Current page indicator with clickable page numbers
 * - Page size selector dropdown
 * 
 * Behavior:
 * - Scrolls to top when page changes (Requirement 5.6)
 * - Maintains filters and sort when paginating (Requirement 5.7)
 * - Disables navigation buttons at boundaries
 * - Shows ellipsis for large page ranges
 */
export function TablePagination({
  pagination,
  onPaginationChange,
  className,
}: TablePaginationProps) {
  const { page, pageSize, totalCount } = pagination;
  
  // Calculate pagination values
  const totalPages = Math.ceil(totalCount / pageSize);
  const startResult = totalCount === 0 ? 0 : page * pageSize + 1;
  const endResult = Math.min((page + 1) * pageSize, totalCount);
  
  // Check if navigation buttons should be disabled
  const isFirstPage = page === 0;
  const isLastPage = page >= totalPages - 1;
  
  /**
   * Scroll to top of table when page changes
   * Requirement 5.6: Scroll to top on page change
   */
  const scrollToTop = () => {
    // Find the leads table container and scroll to it
    const tableContainer = document.querySelector('[data-leads-table]');
    if (tableContainer) {
      tableContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Fallback: scroll to top of window
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  /**
   * Handle page change
   * Requirement 5.7: Maintain filters and sort when paginating
   */
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      onPaginationChange({ page: newPage });
      scrollToTop();
    }
  };
  
  /**
   * Handle page size change
   * Reset to first page when page size changes
   */
  const handlePageSizeChange = (newPageSize: string) => {
    onPaginationChange({
      pageSize: parseInt(newPageSize, 10),
      page: 0, // Reset to first page
    });
    scrollToTop();
  };
  
  /**
   * Generate page numbers to display
   * Shows current page, adjacent pages, and ellipsis for gaps
   */
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 7; // Show up to 7 page numbers
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);
      
      // Calculate range around current page
      const startPage = Math.max(1, page - 1);
      const endPage = Math.min(totalPages - 2, page + 1);
      
      // Add ellipsis after first page if needed
      if (startPage > 1) {
        pages.push('ellipsis');
      }
      
      // Add pages around current page
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      
      // Always show last page
      pages.push(totalPages - 1);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Result count - Requirement 5.1 */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando {startResult}-{endResult} de {totalCount} leads
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Page size selector - Requirement 5.4, 5.5 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Itens por página:
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-[70px]" aria-label="Selecionar tamanho da página">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Pagination controls - Requirement 5.2, 5.3 */}
          <Pagination>
            <PaginationContent>
              {/* First page button - Requirement 5.3 */}
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(0)}
                  disabled={isFirstPage}
                  aria-label="Ir para primeira página"
                  className="h-9 w-9"
                >
                  <ChevronFirst className="h-4 w-4" />
                </Button>
              </PaginationItem>
              
              {/* Previous page button - Requirement 5.3 */}
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(page - 1)}
                  aria-disabled={isFirstPage}
                  className={isFirstPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {/* Page numbers - Requirement 5.2 */}
              {pageNumbers.map((pageNum, index) => {
                if (pageNum === 'ellipsis') {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                const isActive = pageNum === page;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNum)}
                      isActive={isActive}
                      aria-label={`Ir para página ${pageNum + 1}`}
                      aria-current={isActive ? 'page' : undefined}
                      className="cursor-pointer"
                    >
                      {pageNum + 1}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {/* Next page button - Requirement 5.3 */}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(page + 1)}
                  aria-disabled={isLastPage}
                  className={isLastPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {/* Last page button - Requirement 5.3 */}
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={isLastPage}
                  aria-label="Ir para última página"
                  className="h-9 w-9"
                >
                  <ChevronLast className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
