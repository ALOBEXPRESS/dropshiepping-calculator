/**
 * Dashboard Page
 * 
 * Página principal de dashboard com KPIs, gráficos de conversão e leads.
 * Exibe estatísticas de vendas, conversões e análise de leads.
 */

import React, { useState, useEffect } from 'react';
import KPICard from '@/components/KPICard';
import WeeklyConversionChart from '@/components/WeeklyConversionChart';
import LeadStatusChart from '@/components/LeadStatusChart';
import TimePeriodFilter from '@/components/TimePeriodFilter';
import MarketplaceFilter from '@/components/MarketplaceFilter';
import { KPICardSkeleton, WeeklyConversionChartSkeleton, LeadStatusChartSkeleton } from '@/components/skeletons';
import EmptyDashboardState from '@/components/EmptyDashboardState';
import DashboardErrorState from '@/components/DashboardErrorState';
import { MOCK_DASHBOARD_DATA } from '@/data/mockDashboardData';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useMarketplaces } from '@/hooks/useMarketplaces';
import { transformToKPICardProps } from '@/utils/transformDashboardData.tsx';
import { runDashboardDiagnostic } from '@/utils/diagnosticDashboard';
import type { TimePeriod } from '@/types/dashboard';

const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState<TimePeriod>('total');
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
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 sm:p-6">
      <main className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Visão geral dos seus leads e conversões
            </p>
          </div>
        </div>

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

        {/* KPI Cards Section - 5 cards */}
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
            <>
              <WeeklyConversionChartSkeleton />
              <LeadStatusChartSkeleton />
            </>
          ) : (
            <>
              <WeeklyConversionChart
                data={MOCK_DASHBOARD_DATA.weeklyConversions}
                mostProfitableDay={MOCK_DASHBOARD_DATA.metadata.mostProfitableDay}
              />
              <LeadStatusChart
                data={MOCK_DASHBOARD_DATA.leadStatus}
                recentSignups={MOCK_DASHBOARD_DATA.metadata.recentSignups}
              />
            </>
          )}
        </section>

      </main>
    </div>
  );
};

export default Dashboard;
