/**
 * DashboardErrorBoundary Component Tests
 * 
 * Tests for the error boundary component.
 * 
 * Requirements: 10.1, 10.9
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardErrorBoundary } from './DashboardErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('DashboardErrorBoundary', () => {
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
      <DashboardErrorBoundary>
        <div>Test content</div>
      </DashboardErrorBoundary>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should display error UI when error is caught', () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardErrorBoundary>
    );
    
    expect(screen.getByText('Dashboard Error')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an error/)).toBeInTheDocument();
  });

  it('should show retry button in error state', () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardErrorBoundary>
    );
    
    expect(screen.getByLabelText('Retry loading dashboard')).toBeInTheDocument();
  });

  it('should show reload page button in error state', () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DashboardErrorBoundary>
    );
    
    expect(screen.getByLabelText('Reload page')).toBeInTheDocument();
  });

  it('should call onReset when retry button is clicked', () => {
    const onReset = vi.fn();
    
    render(
      <DashboardErrorBoundary onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </DashboardErrorBoundary>
    );
    
    const retryButton = screen.getByLabelText('Retry loading dashboard');
    fireEvent.click(retryButton);
    
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <DashboardErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </DashboardErrorBoundary>
    );
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });
});
