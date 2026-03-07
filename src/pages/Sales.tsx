import React, { useEffect, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import {
  RevenueReportChart,
  StatisticsCards,
  TopSellingProductsTable,
  StockReportTable,
  TopCustomersList,
  RecentOrdersChart,
  TransactionsList,
  CustomersStatistics,
  BrazilStatesDistribution,
} from '@/components/sales';
import { PendingOrders } from '@/components/PendingOrders';
import gsap from 'gsap';

const Sales: React.FC = () => {
  const { organizationId } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);

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

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6">
      {/* Header */}
      <div className="mb-8 animate-on-load">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard de Vendas
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Visão completa do desempenho de vendas e produtos
        </p>
      </div>

      {/* Vendas a Processar */}
      <div className="mb-6 animate-on-load">
        <PendingOrders />
      </div>

      {/* Revenue Report + Customer Statistics - Duas Colunas no Topo */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="animate-on-load">
          <RevenueReportChart organizationId={organizationId} />
        </div>
        <div className="animate-on-load">
          <CustomersStatistics organizationId={organizationId} />
        </div>
      </div>

      {/* Statistics Cards - 4 columns */}
      <div className="mb-6 animate-on-load">
        <StatisticsCards organizationId={organizationId} />
      </div>

      {/* Recent Orders Chart + Transactions + Brazil States */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="animate-on-load">
          <RecentOrdersChart organizationId={organizationId} />
        </div>
        <div className="animate-on-load">
          <TransactionsList organizationId={organizationId} />
        </div>
        <div className="lg:col-span-1 animate-on-load">
          <BrazilStatesDistribution organizationId={organizationId} />
        </div>
      </div>

      {/* Top Products + Stock Report */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 lg:items-stretch">
        <div className="lg:col-span-2 animate-on-load flex">
          <TopSellingProductsTable organizationId={organizationId} limit={6} />
        </div>
        <div className="lg:col-span-1 animate-on-load flex">
          <StockReportTable organizationId={organizationId} />
        </div>
      </div>

      {/* Top Customers */}
      <div className="mb-6 animate-on-load">
        <TopCustomersList organizationId={organizationId} limit={6} />
      </div>
    </div>
  );
};

export default Sales;
