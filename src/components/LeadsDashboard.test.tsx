// @ts-nocheck
/**
 * Unit tests for LeadsDashboard component
 * 
 * Tests component rendering, data display, responsive layout,
 * loading states, error states, and empty states
 * Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 10.1, 10.9
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LeadsDashboard from './LeadsDashboard';
import { MOCK_DASHBOARD_DATA } from '../data/mockDashboardData';

describe('LeadsDashboard', () => {
  it('renders NavigationBar', () => {
    render(<LeadsDashboard />);
    expect(screen.getByText('Alob Express')).toBeInTheDocument();
  });

  it('renders all three KPI cards', () => {
    render(<LeadsDashboard />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Marketplace Fees')).toBeInTheDocument();
    expect(screen.getByText('Total Leads')).toBeInTheDocument();
  });

  it('displays correct KPI values from mocked data', () => {
    render(<LeadsDashboard />);

    // Total Revenue: R$ 33.846,00
    expect(screen.getByText(/R\$ 33\.846,00/)).toBeInTheDocument();
    
    // Marketplace Fees: R$ 12.582,00
    expect(screen.getByText(/R\$ 12\.582,00/)).toBeInTheDocument();
    
    // Total Leads: 245.214
    expect(screen.getByText(/245\.214/)).toBeInTheDocument();
  });

  it('displays correct trend indicators', () => {
    render(<LeadsDashboard />);

    // Total Revenue: +12.5%
    expect(screen.getByText(/\+12\.5%/)).toBeInTheDocument();
    
    // Marketplace Fees: -3.2%
    expect(screen.getByText(/-3\.2%/)).toBeInTheDocument();
    
    // Total Leads: +8.7%
    expect(screen.getByText(/\+8\.7%/)).toBeInTheDocument();
  });

  it('renders both chart components', () => {
    render(<LeadsDashboard />);

    expect(screen.getByText('Conversion')).toBeInTheDocument();
    // "Leads" appears in both nav and chart title, so use getAllByText
    expect(screen.getAllByText('Leads').length).toBeGreaterThan(0);
  });

  it('displays most profitable day message', () => {
    render(<LeadsDashboard />);

    expect(screen.getByText(/July 17 is the most profitable day/)).toBeInTheDocument();
  });

  it('displays recent signups message', () => {
    render(<LeadsDashboard />);

    expect(screen.getByText(/\+14 users signed in less than a minute/)).toBeInTheDocument();
  });

  it('has correct ARIA regions', () => {
    render(<LeadsDashboard />);

    expect(screen.getByRole('region', { name: 'KPI Metrics' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Analytics Charts' })).toBeInTheDocument();
  });

  it('applies dark theme background', () => {
    const { container } = render(<LeadsDashboard />);
    const mainDiv = container.firstChild;
    
    expect(mainDiv).toHaveClass('bg-[#0f0f0f]');
  });

  describe('Loading State', () => {
    it('should display skeleton components when loading', () => {
      render(<LeadsDashboard isLoading={true} />);
      
      // Should show loading status
      const loadingElements = screen.getAllByRole('status');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should show KPI card skeletons when loading', () => {
      render(<LeadsDashboard isLoading={true} />);
      
      // Should have 3 KPI card skeletons
      const kpiSkeletons = screen.getAllByLabelText('Loading KPI data');
      expect(kpiSkeletons).toHaveLength(3);
    });

    it('should show chart skeletons when loading', () => {
      render(<LeadsDashboard isLoading={true} />);
      
      // Should have conversion chart skeleton
      expect(screen.getByLabelText('Loading conversion chart')).toBeInTheDocument();
      
      // Should have lead status chart skeleton
      expect(screen.getByLabelText('Loading lead status chart')).toBeInTheDocument();
    });

    it('should not show actual data when loading', () => {
      render(<LeadsDashboard isLoading={true} />);
      
      // Should not show actual KPI values
      expect(screen.queryByText(/R\$ 33\.846,00/)).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error prop is provided', () => {
      render(<LeadsDashboard error="Failed to load data" />);
      
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('should show retry button when error and onRetry provided', () => {
      const onRetry = vi.fn();
      render(<LeadsDashboard error="Failed to load data" onRetry={onRetry} />);
      
      const retryButton = screen.getByLabelText('Retry loading dashboard');
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onRetry when retry button clicked', () => {
      const onRetry = vi.fn();
      render(<LeadsDashboard error="Failed to load data" onRetry={onRetry} />);
      
      const retryButton = screen.getByLabelText('Retry loading dashboard');
      fireEvent.click(retryButton);
      
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show dashboard content when error', () => {
      render(<LeadsDashboard error="Failed to load data" />);
      
      // Should not show KPI cards
      expect(screen.queryByText('Total Revenue')).not.toBeInTheDocument();
      
      // Should not show charts
      expect(screen.queryByText('Conversion')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when data is null', () => {
      render(<LeadsDashboard data={null} />);
      
      expect(screen.getByText('No Data Available')).toBeInTheDocument();
    });

    it('should show helpful message in empty state', () => {
      render(<LeadsDashboard data={null} />);
      
      expect(screen.getByText(/There is no dashboard data to display/)).toBeInTheDocument();
    });

    it('should not show dashboard content when empty', () => {
      render(<LeadsDashboard data={null} />);
      
      // Should not show KPI cards
      expect(screen.queryByText('Total Revenue')).not.toBeInTheDocument();
    });
  });

  describe('Success State with Data', () => {
    it('should display dashboard with provided data', () => {
      render(<LeadsDashboard data={MOCK_DASHBOARD_DATA} />);
      
      // Should show KPI cards
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      
      // Should show charts
      expect(screen.getByText('Conversion')).toBeInTheDocument();
    });

    it('should use default mocked data when no data prop provided', () => {
      render(<LeadsDashboard />);
      
      // Should show data from MOCK_DASHBOARD_DATA
      expect(screen.getByText(/R\$ 33\.846,00/)).toBeInTheDocument();
    });
  });

  describe('Partial Data Handling', () => {
    it('should handle missing optional fields gracefully', () => {
      const partialData = {
        ...MOCK_DASHBOARD_DATA,
        weeklyConversions: [
          {
            week: '12 Jul',
            date: new Date('2024-07-12'),
            fees: 2100,
            revenue: 6800,
            netProfit: 4700,
            conversionRate: 0.15
          }
        ]
      };
      
      render(<LeadsDashboard data={partialData} />);
      
      // Should still render without errors
      expect(screen.getByText('Conversion')).toBeInTheDocument();
    });

    it('should handle empty arrays gracefully', () => {
      const emptyData = {
        ...MOCK_DASHBOARD_DATA,
        weeklyConversions: [],
        leadStatus: []
      };
      
      render(<LeadsDashboard data={emptyData} />);
      
      // Should show empty state messages in charts
      expect(screen.getByText('No conversion data available')).toBeInTheDocument();
      expect(screen.getByText('No lead status data available')).toBeInTheDocument();
    });
  });
});
