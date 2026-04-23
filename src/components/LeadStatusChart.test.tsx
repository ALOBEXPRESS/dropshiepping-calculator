/**
 * Unit tests for LeadStatusChart component
 * 
 * Tests rendering, data display, and bubble radius calculations
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeadStatusChart } from './LeadStatusChart';
import type { LeadStatusData } from '../types/dashboard';

describe('LeadStatusChart', () => {
  const mockData: LeadStatusData[] = [
    {
      status: 'completed',
      count: 177,
      percentage: 67,
      color: '#FFB800',
      label: 'Completed'
    },
    {
      status: 'ongoing',
      count: 87,
      percentage: 21,
      color: '#FF4D00',
      label: 'Ongoing'
    },
    {
      status: 'awaiting',
      count: 23,
      percentage: 12,
      color: '#7C3AED',
      label: 'Awaiting'
    }
  ];

  it('should render the card with title "Leads"', () => {
    render(<LeadStatusChart data={mockData} recentSignups={14} />);
    expect(screen.getByText('Leads')).toBeInTheDocument();
  });

  it('should display all three lead status labels', () => {
    render(<LeadStatusChart data={mockData} recentSignups={14} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Ongoing')).toBeInTheDocument();
    expect(screen.getByText('Awaiting')).toBeInTheDocument();
  });

  it('should display lead counts and percentages', () => {
    render(<LeadStatusChart data={mockData} recentSignups={14} />);
    expect(screen.getByText('177 (67%)')).toBeInTheDocument();
    expect(screen.getByText('87 (21%)')).toBeInTheDocument();
    expect(screen.getByText('23 (12%)')).toBeInTheDocument();
  });

  it('should display recent signups message', () => {
    render(<LeadStatusChart data={mockData} recentSignups={14} />);
    expect(screen.getByText('+14 users signed in less than a minute!')).toBeInTheDocument();
  });

  it('should render progress bars for each status', () => {
    const { container } = render(<LeadStatusChart data={mockData} recentSignups={14} />);
    const progressBars = container.querySelectorAll('.bg-gray-700');
    expect(progressBars).toHaveLength(3);
  });

  it('should apply correct colors to progress bars', () => {
    const { container } = render(<LeadStatusChart data={mockData} recentSignups={14} />);
    const progressBars = container.querySelectorAll('.h-2.rounded-full.transition-all');
    
    expect(progressBars[0]).toHaveStyle({ backgroundColor: '#FFB800' });
    expect(progressBars[1]).toHaveStyle({ backgroundColor: '#FF4D00' });
    expect(progressBars[2]).toHaveStyle({ backgroundColor: '#7C3AED' });
  });

  it('should apply correct widths to progress bars based on percentage', () => {
    const { container } = render(<LeadStatusChart data={mockData} recentSignups={14} />);
    const progressBars = container.querySelectorAll('.h-2.rounded-full.transition-all');
    
    expect(progressBars[0]).toHaveStyle({ width: '67%' });
    expect(progressBars[1]).toHaveStyle({ width: '21%' });
    expect(progressBars[2]).toHaveStyle({ width: '12%' });
  });
});
