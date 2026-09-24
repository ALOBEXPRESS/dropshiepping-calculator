/**
 * Dashboard Page
 *
 * KPIs, gráfico de Conversão e gráfico de Leads com dados reais do Supabase.
 */

import React, { useState, useRef } from 'react';
import gsap from 'gsap';
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

  const { marketplaces, isLoading: isLoadingMarketplaces } = useMarketplaces();

  const { data, isLoading, isError, error, refetch } = useDashboardData(
    organizationId,
    period,
    selectedMarketplace
  );

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
  const recentSignups = leadsData.reduce((s, l) => s + l.count, 0);

  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Header entrance
      gsap.fromTo(
        '.dashboard-header',
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );

      // KPI cards entrance with bounce
      const kpiCards = containerRef.current?.querySelectorAll('.dashboard-kpi-card');
      if (kpiCards && kpiCards.length > 0) {
        gsap.fromTo(
          kpiCards,
          { opacity: 0, y: 20, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.15)', clearProps: 'transform' }
        );
      }

      // Chart cards entrance
      const chartCards = containerRef.current?.querySelectorAll('.dashboard-chart-card');
      if (chartCards && chartCards.length > 0) {
        gsap.fromTo(
          chartCards,
          { opacity: 0, y: 24, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.55, delay: 0.15, stagger: 0.1, ease: 'power2.out', clearProps: 'transform' }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading, chartsLoading, period, selectedMarketplace]);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Page header */}
      <div className="dashboard-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visão geral do desempenho da sua operação
          </p>
        </div>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
      </div>

      {/* KPI Cards */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
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
            <div className="dashboard-kpi-card"><KPICard {...kpiProps!.revenue} /></div>
            <div className="dashboard-kpi-card"><KPICard {...kpiProps!.fees} /></div>
            <div className="dashboard-kpi-card"><KPICard {...kpiProps!.profit} /></div>
            <div className="dashboard-kpi-card"><KPICard {...kpiProps!.products} /></div>
            <div className="dashboard-kpi-card"><KPICard {...kpiProps!.customers} /></div>
          </>
        )}
      </section>

      {/* Charts */}
      <section
        className="grid grid-cols-1 lg:grid-cols-2 gap-3"
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
            <div className="dashboard-chart-card h-full">
              <WeeklyConversionChart
                data={conversionData}
                mostProfitableDay={mostProfitableDay}
              />
            </div>
            <div className="dashboard-chart-card h-full">
              <LeadStatusChart
                data={leadsData}
                recentSignups={recentSignups}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
