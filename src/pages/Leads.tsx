import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import {
  LeadConversionFunnel,
  EnhancedGeographicSales,
  TopCustomersList,
} from '@/components/sales';
import { GenderDistributionChart } from '@/components/sales/GenderDistributionChart';
import { GenderFilterBar, type GenderFilter } from '@/components/sales/GenderFilterBar';
import { useLeadsWithGender } from '@/hooks/sales/useLeadsWithGender';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import gsap from 'gsap';

const Leads: React.FC = () => {
  const { organizationId } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');

  // Fetch leads with gender filter to get the count
  const { count: filteredLeadsCount } = useLeadsWithGender(
    organizationId || '',
    genderFilter,
    refreshKey
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const elements = containerRef.current.querySelectorAll('.animate-on-load');
    gsap.fromTo(elements, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' });
  }, [organizationId]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(Date.now());
  }, []);

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-on-load">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Funil de conversão, clientes e distribuição geográfica
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={handleRefresh} aria-label="Atualizar dados">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Funil de Conversão + Top Clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 animate-on-load">
          <LeadConversionFunnel organizationId={organizationId} refreshTrigger={refreshKey} />
        </div>
        <div className="animate-on-load">
          <TopCustomersList organizationId={organizationId} refreshTrigger={refreshKey} />
        </div>
      </div>

      {/* Distribuição de Gênero + Filtro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 animate-on-load">
          <GenderDistributionChart organizationId={organizationId} refreshTrigger={refreshKey} />
        </div>
        <div className="animate-on-load">
          <GenderFilterBar
            value={genderFilter}
            count={filteredLeadsCount}
            onChange={setGenderFilter}
          />
        </div>
      </div>

      {/* Análise Geográfica */}
      <div className="mb-6 animate-on-load">
        <EnhancedGeographicSales organizationId={organizationId} />
      </div>
    </div>
  );
};

export default Leads;
