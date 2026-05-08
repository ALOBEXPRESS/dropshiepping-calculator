/**
 * Dashboard Page
 * 
 * Página principal de dashboard com funis de leads e filtros.
 * Exibe estatísticas de conversão e classificação de gênero.
 */

import React, { useState, useCallback } from 'react';
import { GenderClassificationFunnel, GenderClassificationJobButton, CustomersStatistics } from '@/components/sales';
import TimePeriodFilter from '@/components/TimePeriodFilter';
import MarketplaceFilter from '@/components/MarketplaceFilter';
import { useMarketplaces } from '@/hooks/useMarketplaces';
import { useSettings } from '@/contexts/SettingsContext';
import type { TimePeriod } from '@/types/dashboard';

const Dashboard: React.FC = () => {
  const { organizationId } = useSettings();
  const [period, setPeriod] = useState<TimePeriod>('total');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch marketplaces list
  const { marketplaces, isLoading: isLoadingMarketplaces } = useMarketplaces();

  const handleRefresh = useCallback(() => {
    setRefreshKey(Date.now());
  }, []);

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
            disabled={false}
          />
          <MarketplaceFilter
            marketplaces={marketplaces}
            selectedMarketplace={selectedMarketplace}
            onMarketplaceChange={setSelectedMarketplace}
            disabled={isLoadingMarketplaces}
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

      </main>
    </div>
  );
};

export default Dashboard;
