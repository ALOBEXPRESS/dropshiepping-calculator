/**
 * DashboardErrorState Component Tests
 * 
 * Tests for the error state component.
 * 
 * Requirements: 10.1, 10.9
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardErrorState } from './DashboardErrorState';

describe('DashboardErrorState', () => {
  it('should render default error message when no props provided', () => {
    render(<DashboardErrorState />);
    
    expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Unable to load dashboard data/)).toBeInTheDocument();
  });

  it('should render custom error message when provided', () => {
    render(
      <DashboardErrorState 
        title="Custom Error Title"
        error="Custom error message"
      />
    );
    
    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('should show retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    
    render(<DashboardErrorState onRetry={onRetry} />);
    
    expect(screen.getByLabelText('Retry loading dashboard')).toBeInTheDocument();
  });

  it('should not show retry button when onRetry is not provided', () => {
    render(<DashboardErrorState />);
    
    expect(screen.queryByLabelText('Retry loading dashboard')).not.toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    
    render(<DashboardErrorState onRetry={onRetry} />);
    
    const retryButton = screen.getByLabelText('Retry loading dashboard');
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should display error icon', () => {
    const { container } = render(<DashboardErrorState />);
    
    // Should have icon container with orange theme
    const iconContainer = container.querySelector('.bg-\\[\\#FF4D00\\]\\/10');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should apply correct styling classes', () => {
    const { container } = render(<DashboardErrorState />);
    
    // Should have dark theme background
    const darkBg = container.querySelector('.bg-\\[\\#0f0f0f\\]');
    expect(darkBg).toBeInTheDocument();
    
    // Should have card with dark theme
    const card = container.querySelector('.bg-\\[\\#1c1c1c\\]');
    expect(card).toBeInTheDocument();
  });
});
