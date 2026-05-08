/**
 * TablePagination Component Tests
 * 
 * Tests for pagination controls functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TablePagination } from './TablePagination';
import type { PaginationConfig } from '@/types/leads';

describe('TablePagination', () => {
  const mockOnPaginationChange = vi.fn();
  
  const defaultPagination: PaginationConfig = {
    page: 0,
    pageSize: 25,
    totalCount: 100,
  };
  
  beforeEach(() => {
    mockOnPaginationChange.mockClear();
  });
  
  it('should render result count correctly', () => {
    render(
      <TablePagination
        pagination={defaultPagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );
    
    expect(screen.getByText('Mostrando 1-25 de 100 leads')).toBeInTheDocument();
  });
  
  it('should render page size selector with correct value', () => {
    render(
      <TablePagination
        pagination={defaultPagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );
    
    expect(screen.getByText('Itens por página:')).toBeInTheDocument();
  });
  
  it('should disable first and previous buttons on first page', () => {
    render(
      <TablePagination
        pagination={defaultPagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );
    
    const firstButton = screen.getByLabelText('Ir para primeira página');
    const previousButton = screen.getByLabelText('Go to previous page');
    
    expect(firstButton).toBeDisabled();
    expect(previousButton).toHaveClass('pointer-events-none');
  });
  
  it('should disable last and next buttons on last page', () => {
    const lastPagePagination: PaginationConfig = {
      page: 3, // Last page (0-indexed)
      pageSize: 25,
      totalCount: 100,
    };
    
    render(
      <TablePagination
        pagination={lastPagePagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );
    
    const lastButton = screen.getByLabelText('Ir para última página');
    const nextButton = screen.getByLabelText('Go to next page');
    
    expect(lastButton).toBeDisabled();
    expect(nextButton).toHaveClass('pointer-events-none');
  });
  
  it('should call onPaginationChange when next button is clicked', () => {
    render(
      <TablePagination
        pagination={defaultPagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );
    
    const nextButton = screen.getByLabelText('Go to next page');
    fireEvent.click(nextButton);
    
    expect(mockOnPaginationChange).toHaveBeenCalledWith({ page: 1 });
  });
  
  it('should call onPaginationChange when previous button is clicked', () => {
    const secondPagePagination: PaginationConfig = {
      page: 1,
      pageSize: 25,
      totalCount: 100,
    };
    
    render(
      <TablePagination
        pagination={secondPagePagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );
    
    const previousButton = screen.getByLabelText('Go to previous page');
    fireEvent.click(previousButton);
    
    expect(mockOnPaginationChange).toHaveBeenCalledWith({ page: 0 });
  });
  
  it('should call onPaginationChange when first button is clicked', () => {
    const secondPagePagination: PaginationConfig = {
      page: 1,
      pageSize: 25,
      totalCount: 100,
    };
    
    render(
      <TablePagination
        pagination={secondPagePagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );
    
    const firstButton = screen.getByLabelText('Ir para primeira página');
    fireEvent.click(firstButton);
    
    expect(mockOnPaginationChange).toHaveBeenCalledWith({ page: 0 });
  });
  
  it('should call onPaginationChange when last button is clicked', () => {
    render(
      <TablePagination
        pagination={defaultPagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );
    
    const lastButton = screen.getByLabelText('Ir para última página');
    fireEvent.click(lastButton);
    
    expect(mockOnPaginationChange).toHaveBeenCalledWith({ page: 3 }); // Last page is 3 (0-indexed)
  });
  
  it('should display correct page numbers', () => {
    render(
      <TablePagination
        pagination={defaultPagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );
    
    // Should show pages 1, 2, 3, 4 (4 total pages for 100 items with 25 per page)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
  
  it('should highlight current page', () => {
    const secondPagePagination: PaginationConfig = {
      page: 1,
      pageSize: 25,
      totalCount: 100,
    };
    
    render(
      <TablePagination
        pagination={secondPagePagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );
    
    const page2Button = screen.getByLabelText('Ir para página 2');
    expect(page2Button).toHaveAttribute('aria-current', 'page');
  });
  
  it('should handle zero results correctly', () => {
    const emptyPagination: PaginationConfig = {
      page: 0,
      pageSize: 25,
      totalCount: 0,
    };
    
    render(
      <TablePagination
        pagination={emptyPagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );
    
    expect(screen.getByText('Mostrando 0-0 de 0 leads')).toBeInTheDocument();
  });
  
  it('should calculate end result correctly for last page', () => {
    const lastPagePagination: PaginationConfig = {
      page: 3,
      pageSize: 25,
      totalCount: 90, // Last page has only 15 items
    };
    
    render(
      <TablePagination
        pagination={lastPagePagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );
    
    expect(screen.getByText('Mostrando 76-90 de 90 leads')).toBeInTheDocument();
  });
  
  it('should show ellipsis for large page ranges', () => {
    const largePagination: PaginationConfig = {
      page: 5,
      pageSize: 10,
      totalCount: 200, // 20 pages total
    };
    
    render(
      <TablePagination
        pagination={largePagination}
        onPaginationChange={mockOnPaginationChange}
      />
    );
    
    // Should show ellipsis when there are many pages
    const ellipsisElements = screen.getAllByText('More pages');
    expect(ellipsisElements.length).toBeGreaterThan(0);
  });
});
