/**
 * LeadsTableErrorBoundary Component Tests
 * 
 * Tests for the LeadsTable error boundary component.
 * 
 * Requirements: 1.7, 6.9, 7.7, 8.6
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeadsTableErrorBoundary } from './LeadsTableErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error in LeadsTable');
  }
  return <div>No error</div>;
};

describe('LeadsTableErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('should render children when no error occurs', () => {
    render(
      <LeadsTableErrorBoundary>
        <div>Test content</div>
      </LeadsTableErrorBoundary>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should display error UI when error is caught', () => {
    render(
      <LeadsTableErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LeadsTableErrorBoundary>
    );
    
    expect(screen.getByText('Erro ao Carregar Tabela de Leads')).toBeInTheDocument();
    expect(screen.getByText(/Encontramos um erro ao carregar a tabela de leads/)).toBeInTheDocument();
  });

  it('should show retry button in error state', () => {
    render(
      <LeadsTableErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LeadsTableErrorBoundary>
    );
    
    expect(screen.getByLabelText('Tentar novamente')).toBeInTheDocument();
  });

  it('should show reload page button in error state', () => {
    render(
      <LeadsTableErrorBoundary>
        <ThrowError shouldThrow={true} />
      </LeadsTableErrorBoundary>
    );
    
    expect(screen.getByLabelText('Recarregar página')).toBeInTheDocument();
  });

  it('should call onReset when retry button is clicked', () => {
    const onReset = vi.fn();
    
    render(
      <LeadsTableErrorBoundary onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </LeadsTableErrorBoundary>
    );
    
    const retryButton = screen.getByLabelText('Tentar novamente');
    fireEvent.click(retryButton);
    
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message for leads table</div>;
    
    render(
      <LeadsTableErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </LeadsTableErrorBoundary>
    );
    
    expect(screen.getByText('Custom error message for leads table')).toBeInTheDocument();
  });
});
