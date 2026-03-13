import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import {
  RevenueReportChart,
  CustomersStatistics,
  StockReportTable,
  TopCustomersList,
  HeroSection,
  AnalyticsTabs,
} from '@/components/sales';
import { PendingOrders } from '@/components/PendingOrders';
import { useHeroStats } from '@/hooks/sales/useHeroStats';
import gsap from 'gsap';

const Sales: React.FC = () => {
  const { organizationId } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { stats } = useHeroStats(organizationId || '', refreshKey);

  useEffect(() => {
    if (!containerRef.current) return;

    // Verificar se o usuário prefere movimento reduzido (acessibilidade)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Animar elementos ao carregar a página
    const elements = containerRef.current.querySelectorAll('.animate-on-load');
    
    gsap.fromTo(
      elements,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
      }
    );
  }, [organizationId]);

  // Função para atualizar todos os componentes após processar um pedido
  const handleOrderProcessed = useCallback(() => {
    console.log('🔄 Pedido processado! Atualizando todos os componentes...');
    // Usar timestamp para garantir que o key seja sempre diferente
    const newKey = Date.now();
    console.log('🔄 Novo refreshKey:', newKey);
    setRefreshKey(newKey);
  }, []);

  const handleRefresh = useCallback(() => {
    const newKey = Date.now();
    setRefreshKey(newKey);
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
      {/* Hero Section com KPIs */}
      <div className="mb-6 animate-on-load">
        <HeroSection 
          stats={stats}
          hasPendingOrders={false}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Vendas a Processar - Compacto */}
      <div className="mb-6 animate-on-load">
        <PendingOrders onOrderProcessed={handleOrderProcessed} />
      </div>

      {/* Métricas Primárias - Revenue + Customer Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="animate-on-load">
          <RevenueReportChart organizationId={organizationId} refreshTrigger={refreshKey} />
        </div>
        <div className="animate-on-load">
          <CustomersStatistics organizationId={organizationId} refreshTrigger={refreshKey} />
        </div>
      </div>

      {/* Análises Detalhadas - Tabs */}
      <div className="mb-6 animate-on-load">
        <AnalyticsTabs organizationId={organizationId} refreshTrigger={refreshKey} />
      </div>

      {/* Informações Secundárias - Stock + Customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 animate-on-load">
          <StockReportTable organizationId={organizationId} refreshTrigger={refreshKey} />
        </div>
        <div className="animate-on-load">
          <TopCustomersList organizationId={organizationId} limit={6} refreshTrigger={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default Sales;
