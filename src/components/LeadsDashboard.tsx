/**
 * LeadsDashboard Component
 * 
 * Main container component for the leads analytics dashboard.
 * Includes gender classification funnel and lead conversion statistics.
 */

import React, { useState, useEffect, useCallback } from 'react';
import KPICard from './KPICard';
import WeeklyConversionChart from './WeeklyConversionChart';
import LeadStatusChart from './LeadStatusChart';
import TimePeriodFilter from './TimePeriodFilter';
import MarketplaceFilter from './MarketplaceFilter';
import { KPICardSkeleton, WeeklyConversionChartSkeleton, LeadStatusChartSkeleton } from './skeletons';
import EmptyDashboardState from './EmptyDashboardState';
import DashboardErrorState from './DashboardErrorState';
import { GenderClassificationFunnel, GenderClassificationJobButton, CustomersStatistics } from './sales';
import { MOCK_DASHBOARD_DATA } from '../data/mockDashboardData';
import { useDashboardData } from '../hooks/useDashboardData';
import { useMarketplaces } from '../hooks/useMarketplaces';
import { useSettings } from '@/contexts/SettingsContext';
import { transformToKPICardProps } from '../utils/transformDashboardData.tsx';
import { runDashboardDiagnostic } from '../utils/diagnosticDashboard';
import type { TimePeriod } from '../types/dashboard';

/**
 * Props for LeadsDashboard component
 */
export interface LeadsDashboardProps {
  // No props needed - component is self-contained
}

/**
 * LeadsDashboard Component
 */
const LeadsDashboard: React.FC<LeadsDashboardProps> = () => {
  const { organizationId } = useSettings();
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch marketplaces list
  const { marketplaces, isLoading: isLoadingMarketplaces } = useMarketplaces();

  // Fetch dashboard data using React Query hook with marketplace filter
  const { data, isLoading, isError, error, refetch } = useDashboardData(period, selectedMarketplace);

  const handleRefresh = useCallback(() => {
    setRefreshKey(Date.now());
    refetch();
  }, [refetch]);

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

          {/* Funis de Leads Section */}
          {organizationId && (
            <section 
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              role="region"
              aria-label="Funis de Leads"
            >
              {/* Funil de Classificação de Gênero */}
              <GenderClassificationFunnel 
                organizationId={organizationId} 
                refreshTrigger={refreshKey}
                onClassifyClick={() => {
                  const button = document.querySelector('[data-gender-classify-button]') as HTMLButtonElement;
                  if (button) button.click();
                }}
              />
              
              {/* Funil de Conversão de Leads */}
              <CustomersStatistics 
                organizationId={organizationId} 
                refreshTrigger={refreshKey}
              />
            </section>
          )}

          {/* Botão escondido para classificação em lote */}
          {organizationId && (
            <div className="hidden">
              <GenderClassificationJobButton
                organizationId={organizationId}
                onComplete={(summary) => {
                  console.log('Classificação concluída:', summary);
                  handleRefresh();
                }}
                data-gender-classify-button
              />
            </div>
          )}
          
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

  export default LeadsDashboard;
