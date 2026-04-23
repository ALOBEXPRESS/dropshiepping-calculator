/**
 * Unit tests for KPICard component
 * 
 * Tests currency formatting, trend indicators, and responsive behavior
 * Requirements: 2.2, 2.3, 2.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from './KPICard';
import { DollarSign } from 'lucide-react';

describe('KPICard', () => {
  it('renders with currency format', () => {
    render(
      <KPICard
        title="Total Revenue"
        value={33846}
        trend={{ direction: 'up', percentage: 12.5 }}
        format="currency"
      />
    );

    expect(screen.getByText(/Total Revenue/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 33\.846,00/)).toBeInTheDocument();
  });

  it('renders with number format', () => {
    render(
      <KPICard
        title="Total Leads"
        value={245214}
        trend={{ direction: 'up', percentage: 8.7 }}
        format="number"
      />
    );

    expect(screen.getByText(/245\.214/)).toBeInTheDocument();
  });

  it('displays green trend indicator for up direction', () => {
    render(
      <KPICard
        title="Revenue"
        value={1000}
        trend={{ direction: 'up', percentage: 12.5 }}
      />
    );

    const trendElement = screen.getByText(/\+12\.5%/);
    expect(trendElement).toBeInTheDocument();
    expect(trendElement.parentElement).toHaveClass('text-[#10b981]');
  });

  it('displays red trend indicator for down direction', () => {
    render(
      <KPICard
        title="Fees"
        value={1000}
        trend={{ direction: 'down', percentage: 3.2 }}
      />
    );

    const trendElement = screen.getByText(/-3\.2%/);
    expect(trendElement).toBeInTheDocument();
    expect(trendElement.parentElement).toHaveClass('text-[#ef4444]');
  });

  it('displays gray trend indicator for neutral direction', () => {
    render(
      <KPICard
        title="Metric"
        value={1000}
        trend={{ direction: 'neutral', percentage: 0 }}
      />
    );

    const trendElement = screen.getByText(/0%/);
    expect(trendElement).toBeInTheDocument();
    expect(trendElement.parentElement).toHaveClass('text-[#a3a3a3]');
  });

  it('renders with optional icon', () => {
    render(
      <KPICard
        title="Revenue"
        value={1000}
        trend={{ direction: 'up', percentage: 5 }}
        icon={<DollarSign data-testid="dollar-icon" />}
      />
    );

    expect(screen.getByTestId('dollar-icon')).toBeInTheDocument();
  });

  it('has correct ARIA label', () => {
    render(
      <KPICard
        title="Total Revenue"
        value={33846}
        trend={{ direction: 'up', percentage: 12.5 }}
        format="currency"
      />
    );

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Total Revenue'));
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('+12.5%'));
  });
});
