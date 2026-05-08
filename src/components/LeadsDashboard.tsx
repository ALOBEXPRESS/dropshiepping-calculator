/**
 * LeadsDashboard Component
 * 
 * Main container component for the leads analytics dashboard.
 * Includes gender classification funnel, lead conversion statistics, and leads table.
 */

import React, { useState, useCallback, useMemo } from 'react';
import TimePeriodFilter from './TimePeriodFilter';
import MarketplaceFilter from './MarketplaceFilter';
import { GenderClassificationFunnel, GenderClassificationJobButton, CustomersStatistics } from './sales';
import LeadsTable from './leads/LeadsTable';
import { LeadsTableErrorBoundary } from './leads/LeadsTableErrorBoundary';
import { useMarketplaces } from '../hooks/useMarketplaces';
import { useSettings } from '@/contexts/SettingsContext';
import { calculatePeriodRanges } from '@/utils/dateRangeCalculator';
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
  const [period, setPeriod] = useState<TimePeriod>('total');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch marketplaces list
  const { marketplaces, isLoading: isLoadingMarketplaces } = useMarketplaces();

  const handleRefresh = useCallback(() => {
    setRefreshKey(Date.now());
  }, []);

  // Convert TimePeriod to date range for LeadsTable
  // Requirements: 10.1, 10.2, 10.3
  const dateRangeForLeadsTable = useMemo(() => {
    if (period === 'total') {
      // For 'total', don't apply date filter
      return null;
    }
    
    const periodData = calculatePeriodRanges(period);
    return {
      from: periodData.current.start,
      to: periodData.current.end,
    };
  }, [period]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 sm:p-6">
      <main className="max-w-7xl mx-auto space-y-6">
          
          {/* Filters Section - Para os Funis de Leads */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <TimePeriodFilter
              selectedPeriod={period}
              onPeriodChange={setPeriod}
              disabled={false}
            />
            <MarketplaceFilter
              marketplaces={marketplaces}
              selectedMarketplace={selectedMarketplace}
              onMarketplaceChange={setSelectedMarketplace}
              disabled={isLoadingMarketplaces}
            />
          </div>

          {/* Funis de Leads Section - Refletem o filtro de período */}
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
                period={period}
                marketplaceId={selectedMarketplace}
                onClassifyClick={() => {
                  const button = document.querySelector('[data-gender-classify-button]') as HTMLButtonElement;
                  if (button) button.click();
                }}
              />
              
              {/* Funil de Conversão de Leads */}
              <CustomersStatistics 
                organizationId={organizationId} 
                refreshTrigger={refreshKey}
                period={period}
                marketplaceId={selectedMarketplace}
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

          {/* Leads Table Section - Integrates with dashboard filters */}
          {/* Requirements: 10.1, 10.2, 10.3, 10.4, 10.5 */}
          {/* Error Boundary: Requirements 1.7, 6.9, 7.7, 8.6 */}
          {organizationId && (
            <section 
              className="mt-8"
              role="region"
              aria-label="Tabela de Leads"
            >
              <LeadsTableErrorBoundary onReset={handleRefresh}>
                <LeadsTable
                  organizationId={organizationId}
                  period={dateRangeForLeadsTable}
                  marketplaceId={selectedMarketplace}
                />
              </LeadsTableErrorBoundary>
            </section>
          )}

        </main>
      </div>
    );
  };

  export default LeadsDashboard;
