/**
 * KPICardSkeleton Component Tests
 * 
 * Tests for the KPICard loading skeleton component.
 * 
 * Requirements: 10.1, 10.9
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICardSkeleton } from './KPICardSkeleton';

describe('KPICardSkeleton', () => {
  it('should render without crashing', () => {
    render(<KPICardSkeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should have accessible loading label', () => {
    render(<KPICardSkeleton />);
    expect(screen.getByLabelText('Loading KPI data')).toBeInTheDocument();
  });

  it('should match KPICard structure with skeleton elements', () => {
    const { container } = render(<KPICardSkeleton />);
    
    // Should have card container
    const card = container.querySelector('.bg-\\[\\#1c1c1c\\]');
    expect(card).toBeInTheDocument();
    
    // Should have skeleton elements
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should apply correct styling classes', () => {
    const { container } = render(<KPICardSkeleton />);
    const card = container.querySelector('.rounded-2xl');
    expect(card).toBeInTheDocument();
  });
});
