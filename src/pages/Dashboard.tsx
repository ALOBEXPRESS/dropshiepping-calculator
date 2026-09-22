/**
 * Dashboard Page
 *
 * KPIs, gráfico de Conversão e gráfico de Leads com dados reais do Supabase.
 */

import React, { useState } from 'react';
import KPICard from '@/components/KPICard';
import WeeklyConversionChart from '@/components/WeeklyConversionChart';
import LeadStatusChart from '@/components/LeadStatusChart';
import TimePeriodFilter from '@/components/TimePeriodFilter';
import MarketplaceFilter from '@/components/MarketplaceFilter';
import { KPICardSkeleton, WeeklyConversionChartSkeleton, LeadStatusChartSkeleton } from '@/components/skeletons';
import EmptyDashboardState from '@/components/EmptyDashboardState';
import DashboardErrorState from '@/components/DashboardErrorState';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDashboardCharts } from '@/hooks/useDashboardCharts';
import { useMarketplaces } from '@/hooks/useMarketplaces';
import { transformToKPICardProps } from '@/utils/transformDashboardData.tsx';
import { useSettings } from '@/contexts/SettingsContext';
import type { TimePeriod } from '@/types/dashboard';

const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState<TimePeriod>('total');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string | null>(null);

  const { organizationId } = useSettings();

  // Marketplace list for filter dropdown
  const { marketplaces, isLoading: isLoadingMarketplaces } = useMarketplaces();

  // KPI cards
  const { data, isLoading, isError, error, refetch } = useDashboardData(
    organizationId,
    period,
    selectedMarketplace
  );

  // Charts
  const {
    data: chartsData,
    isLoading: isLoadingCharts,
    isError: isErrorCharts,
  } = useDashboardCharts(organizationId, period, selectedMarketplace);

  const kpiProps = data ? transformToKPICardProps(data) : null;

  if (isError) {
    return (
      <DashboardErrorState
        error={error?.message || 'Falha ao carregar dados do dashboard'}
        onRetry={refetch}
      />
    );
  }

  if (!isLoading && !data) {
    return <EmptyDashboardState />;
  }

  const chartsLoading = isLoadingCharts || isLoading;
  const conversionData = chartsData?.conversions ?? [];
  const leadsData = chartsData?.leads ?? [];
  const mostProfitableDay = chartsData?.mostProfitableDay ?? '—';

  // Recent signups = total orders in the leads categories
  const recentSignups = leadsData.reduce((s, l) => s + l.count, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 sm:p-6">
      <main className="max-w-7xl mx-auto space-y-6">

        {/* Filters */}
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

        {/* KPI Cards */}
        <section
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6"
          role="region"
          aria-label="Métricas KPI"
        >
          {isLoading ? (
            <>
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
            </>
          ) : (
            <>
              <KPICard {...kpiProps!.revenue} />
              <KPICard {...kpiProps!.fees} />
              <KPICard {...kpiProps!.profit} />
              <KPICard {...kpiProps!.products} />
              <KPICard {...kpiProps!.customers} />
            </>
          )}
        </section>

        {/* Charts */}
        <section
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6"
          role="region"
          aria-label="Gráficos de Analytics"
        >
          {chartsLoading ? (
            <>
              <WeeklyConversionChartSkeleton />
              <LeadStatusChartSkeleton />
            </>
          ) : isErrorCharts ? (
            <>
              <WeeklyConversionChart data={[]} mostProfitableDay="—" />
              <LeadStatusChart data={[]} recentSignups={0} />
            </>
          ) : (
            <>
              <WeeklyConversionChart
                data={conversionData}
                mostProfitableDay={mostProfitableDay}
              />
              <LeadStatusChart
                data={leadsData}
                recentSignups={recentSignups}
              />
            </>
          )}
        </section>

      </main>
    </div>
  );
};

export default Dashboard;
