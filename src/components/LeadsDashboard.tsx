/**
 * LeadsDashboard Component
 * 
 * Main container component for the leads analytics dashboard.
 * Transforms the previous conversion funnel and gender distribution interface
 * into a modern KPI-focused layout following the Boostboard reference design.
 * 
 * ## Transformation from Old Design
 * 
 * ### Removed Features:
 * - ❌ Horizontal bar "Funil de Conversão" (Conversion Funnel)
 * - ❌ Donut chart "Distribuição de Gênero" (Gender Distribution)
 * - ❌ Right sidebar with "Top Clientes", "Top Leads", "Classificar Leads" button
 * - ❌ Gender filter tabs (Todos/Masculino/Feminino)
 * - ❌ "Todos os Leads" individual lead cards list
 * - ❌ Metrics: "Novos Leads", "Recorrentes", "Convertidos", "Qualificados"
 * 
 * ### New Features:
 * - ✅ NavigationBar with logo, tabs (Dashboard, Leads, Calculadora, Configurações), and user avatar
 * - ✅ Three KPI cards: Total Revenue, Marketplace Fees, Total Leads (replaces funnel metrics)
 * - ✅ WeeklyConversionChart: Recharts bar chart with stacked series (Fees, Revenue, Net Profit)
 * - ✅ LeadStatusChart: Bubble visualization with overlapping circles (Completed, Ongoing, Awaiting)
 * - ✅ Mobile-first responsive grid layout (replaces sidebar-based layout)
 * - ✅ Boostboard dark theme: #0f0f0f background, #1c1c1c cards, vibrant accents
 * 
 * ### Color Scheme Changes:
 * - **Old**: Blue (#3b82f6), Purple (#a855f7), Green/Teal (#14b8a6), Gray
 * - **New**: Orange (#FF4D00), Yellow (#FFB800), Purple (#7C3AED), Dark backgrounds
 * 
 * ## Features:
 * - NavigationBar with logo, tabs, and user avatar
 * - Three KPI cards: Total Revenue, Marketplace Fees, Total Leads
 * - Responsive grid layout (mobile-first approach)
 * - WeeklyConversionChart with stacked bars (Fees, Revenue, Net Profit)
 * - LeadStatusChart with overlapping bubbles (Completed, Ongoing, Awaiting)
 * - Dark theme styling (#0f0f0f background, #1c1c1c cards)
 * - Loading states with skeleton components
 * - Error handling with error boundary and error states
 * - Empty state when no data available
 * 
 * ## Responsive Breakpoints:
 * - Mobile (< 768px): Single column, stacked cards
 * - Tablet (768px - 1024px): 2-column KPI grid, stacked charts
 * - Desktop (> 1024px): 3-column KPI row, side-by-side charts
 * 
 * ## Performance Optimizations:
 * - React.memo on chart components to prevent unnecessary re-renders
 * - useMemo for expensive data transformations
 * - Debounced chart resize (300ms) and tooltip interactions (100ms)
 * - Limited data points (max 50) for optimal chart performance
 * 
 * ## Accessibility:
 * - WCAG AA compliant color contrast ratios
 * - Keyboard navigation support (Tab, Arrow keys, Enter, Space)
 * - ARIA labels and roles for screen readers
 * - Skip navigation link
 * - Focus management and visible focus indicators
 * 
 * Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 10.1, 10.9
 * 
 * @module components/LeadsDashboard
 * @see {@link ./NavigationBar.tsx} for navigation component
 * @see {@link ./KPICard.tsx} for KPI card component
 * @see {@link ./WeeklyConversionChart.tsx} for bar chart component
 * @see {@link ./LeadStatusChart.tsx} for bubble chart component
 * @see {@link ../types/dashboard.ts} for TypeScript interfaces
 */

import React, { useState, useEffect } from 'react';
import NavigationBar from './NavigationBar';
import KPICard from './KPICard';
import WeeklyConversionChart from './WeeklyConversionChart';
import LeadStatusChart from './LeadStatusChart';
import TimePeriodFilter from './TimePeriodFilter';
import MarketplaceFilter from './MarketplaceFilter';
import { KPICardSkeleton, WeeklyConversionChartSkeleton, LeadStatusChartSkeleton } from './skeletons';
import EmptyDashboardState from './EmptyDashboardState';
import DashboardErrorState from './DashboardErrorState';
import { MOCK_DASHBOARD_DATA } from '../data/mockDashboardData';
import { useDashboardData } from '../hooks/useDashboardData';
import { useMarketplaces } from '../hooks/useMarketplaces';
import { transformToKPICardProps } from '../utils/transformDashboardData.tsx';
import { runDashboardDiagnostic } from '../utils/diagnosticDashboard';
import type { TimePeriod } from '../types/dashboard';

/**
 * Props for LeadsDashboard component
 * 
 * Component now manages its own data fetching via useDashboardData hook.
 * No external props are required.
 */
export interface LeadsDashboardProps {
  // No props needed - component is self-contained
}

/**
 * LeadsDashboard Component
 * 
 * Main dashboard container that integrates:
 * - NavigationBar for internal page navigation
 * - TimePeriodFilter for selecting time periods
 * - KPI cards displaying key metrics with real data
 * - Charts with loading, error, and empty states
 * - Responsive grid layout with Tailwind utilities
 * 
 * Handles three states:
 * 1. Loading: Shows skeleton components
 * 2. Error: Shows error state with retry option
 * 3. Success: Shows dashboard with real data
 */
const LeadsDashboard: React.FC<LeadsDashboardProps> = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'calculator' | 'settings'>('dashboard');
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string | null>(null);

  // Fetch marketplaces list
  const { marketplaces, isLoading: isLoadingMarketplaces } = useMarketplaces();

  // Fetch dashboard data using React Query hook with marketplace filter
  const { data, isLoading, isError, error, refetch } = useDashboardData(period, selectedMarketplace);

  // Run diagnostic on mount in development mode
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 Running dashboard diagnostic...');
      runDashboardDiagnostic();
    }
  }, []);

  // Transform data to KPI card props
  const kpiProps = data ? transformToKPICardProps(data) : null;

  // Handle error state
  if (isError) {
    return <DashboardErrorState error={error?.message || 'Failed to load dashboard data'} onRetry={refetch} />;
  }

  // Handle empty state (no data available)
  if (!isLoading && !data) {
    return <EmptyDashboardState />;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Navigation Bar - Fixed at top */}
      <NavigationBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName="Admin User"
      />

      {/* Main Content - Offset by navbar height (64px) */}
      <main id="main-content" className="pt-20 px-4 md:px-6 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Filters Section */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <TimePeriodFilter
              selectedPeriod={period}
              onPeriodChange={setPeriod}
              disabled={isLoading}
            />
            <MarketplaceFilter
              marketplaces={marketplaces}
              selectedMarketplace={selectedMarketplace}
              onMarketplaceChange={setSelectedMarketplace}
              disabled={isLoading || isLoadingMarketplaces}
            />
          </div>

          {/* KPI Cards Section - Now 5 cards */}
          <section 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6"
            role="region"
            aria-label="Métricas KPI"
          >
            {isLoading ? (
              // Loading state: Show skeleton components
              <>
                <KPICardSkeleton />
                <KPICardSkeleton />
                <KPICardSkeleton />
                <KPICardSkeleton />
                <KPICardSkeleton />
              </>
            ) : (
              // Success state: Show actual KPI cards with real data
              <>
                {/* Revenue KPI */}
                <KPICard {...kpiProps!.revenue} />

                {/* Fees KPI */}
                <KPICard {...kpiProps!.fees} />

                {/* Profit KPI */}
                <KPICard {...kpiProps!.profit} />

                {/* Products KPI */}
                <KPICard {...kpiProps!.products} />

                {/* Customers KPI */}
                <KPICard {...kpiProps!.customers} />
              </>
            )}
          </section>

          {/* Charts Section - Side by side on desktop, stacked on mobile/tablet */}
          <section 
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6"
            role="region"
            aria-label="Analytics Charts"
          >
            {isLoading ? (
              // Loading state: Show skeleton components
              <>
                <WeeklyConversionChartSkeleton />
                <LeadStatusChartSkeleton />
              </>
            ) : (
              // Success state: Show actual charts (still using mock data for now)
              <>
                {/* Weekly Conversion Chart */}
                <WeeklyConversionChart
                  data={MOCK_DASHBOARD_DATA.weeklyConversions}
                  mostProfitableDay={MOCK_DASHBOARD_DATA.metadata.mostProfitableDay}
                />

                {/* Lead Status Chart */}
                <LeadStatusChart
                  data={MOCK_DASHBOARD_DATA.leadStatus}
                  recentSignups={MOCK_DASHBOARD_DATA.metadata.recentSignups}
                />
              </>
            )}
          </section>

        </div>
      </main>
    </div>
  );
};

export default LeadsDashboard;
