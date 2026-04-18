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

import React, { useState } from 'react';
import NavigationBar from './NavigationBar';
import KPICard from './KPICard';
import WeeklyConversionChart from './WeeklyConversionChart';
import LeadStatusChart from './LeadStatusChart';
import { KPICardSkeleton, WeeklyConversionChartSkeleton, LeadStatusChartSkeleton } from './skeletons';
import EmptyDashboardState from './EmptyDashboardState';
import DashboardErrorState from './DashboardErrorState';
import { MOCK_DASHBOARD_DATA } from '../data/mockDashboardData';
import { DollarSign, CreditCard, Users } from 'lucide-react';
import type { DashboardData } from '../types/dashboard';

/**
 * Props for LeadsDashboard component
 */
export interface LeadsDashboardProps {
  /** Dashboard data to display */
  data?: DashboardData | null;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
  /** Callback to retry loading data */
  onRetry?: () => void;
}

/**
 * LeadsDashboard Component
 * 
 * Main dashboard container that integrates:
 * - NavigationBar for internal page navigation
 * - KPI cards displaying key metrics
 * - Charts with loading, error, and empty states
 * - Responsive grid layout with Tailwind utilities
 * 
 * Handles three states:
 * 1. Loading: Shows skeleton components
 * 2. Error: Shows error state with retry option
 * 3. Empty: Shows empty state when no data available
 * 4. Success: Shows dashboard with data
 */
const LeadsDashboard: React.FC<LeadsDashboardProps> = ({
  data = MOCK_DASHBOARD_DATA,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'calculator' | 'settings'>('dashboard');

  // Handle error state
  if (error) {
    return <DashboardErrorState error={error} onRetry={onRetry} />;
  }

  // Handle empty state (no data available)
  if (!isLoading && !data) {
    return <EmptyDashboardState />;
  }

  // Extract data from props or use mocked constants
  const dashboardData = data || MOCK_DASHBOARD_DATA;
  const { kpis, metadata } = dashboardData;

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
          
          {/* KPI Cards Section */}
          <section 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
            role="region"
            aria-label="Métricas KPI"
          >
            {isLoading ? (
              // Loading state: Show skeleton components
              <>
                <KPICardSkeleton />
                <KPICardSkeleton />
                <KPICardSkeleton />
              </>
            ) : (
              // Success state: Show actual KPI cards
              <>
                {/* Total Revenue KPI */}
                <KPICard
                  title="Receita Total"
                  value={kpis.totalRevenue.value}
                  trend={{
                    direction: kpis.totalRevenue.trend.direction,
                    percentage: kpis.totalRevenue.trend.percentage
                  }}
                  format="currency"
                  icon={<DollarSign className="w-5 h-5" aria-hidden="true" />}
                />

                {/* Marketplace Fees KPI */}
                <KPICard
                  title="Taxas de Marketplace"
                  value={kpis.marketplaceFees.value}
                  trend={{
                    direction: kpis.marketplaceFees.trend.direction,
                    percentage: kpis.marketplaceFees.trend.percentage
                  }}
                  format="currency"
                  icon={<CreditCard className="w-5 h-5" aria-hidden="true" />}
                />

                {/* Total Leads KPI */}
                <KPICard
                  title="Total de Leads"
                  value={kpis.totalLeads.value}
                  trend={{
                    direction: kpis.totalLeads.trend.direction,
                    percentage: kpis.totalLeads.trend.percentage
                  }}
                  format="number"
                  icon={<Users className="w-5 h-5" aria-hidden="true" />}
                />
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
              // Success state: Show actual charts
              <>
                {/* Weekly Conversion Chart */}
                <WeeklyConversionChart
                  data={dashboardData.weeklyConversions}
                  mostProfitableDay={metadata.mostProfitableDay}
                />

                {/* Lead Status Chart */}
                <LeadStatusChart
                  data={dashboardData.leadStatus}
                  recentSignups={metadata.recentSignups}
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
