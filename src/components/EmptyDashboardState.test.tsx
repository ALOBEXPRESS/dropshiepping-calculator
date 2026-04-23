/**
 * EmptyDashboardState Component Tests
 * 
 * Tests for the empty state component.
 * 
 * Requirements: 10.1, 10.9
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyDashboardState } from './EmptyDashboardState';

describe('EmptyDashboardState', () => {
  it('should render default message when no props provided', () => {
    render(<EmptyDashboardState />);
    
    expect(screen.getByText('No Data Available')).toBeInTheDocument();
    expect(screen.getByText(/There is no dashboard data to display/)).toBeInTheDocument();
  });

  it('should render custom message when provided', () => {
    render(
      <EmptyDashboardState 
        message="Custom Empty Message"
        description="Custom description text"
      />
    );
    
    expect(screen.getByText('Custom Empty Message')).toBeInTheDocument();
    expect(screen.getByText('Custom description text')).toBeInTheDocument();
  });

  it('should display dashboard-related icons', () => {
    const { container } = render(<EmptyDashboardState />);
    
    // Should have icon containers
    const iconContainers = container.querySelectorAll('.rounded-full');
    expect(iconContainers.length).toBeGreaterThan(0);
  });

  it('should apply correct styling classes', () => {
    const { container } = render(<EmptyDashboardState />);
    
    // Should have dark theme background
    const darkBg = container.querySelector('.bg-\\[\\#0f0f0f\\]');
    expect(darkBg).toBeInTheDocument();
    
    // Should have card with dark theme
    const card = container.querySelector('.bg-\\[\\#1c1c1c\\]');
    expect(card).toBeInTheDocument();
  });
});
