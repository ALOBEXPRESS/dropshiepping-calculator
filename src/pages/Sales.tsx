import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import {
  RevenueReportChart,
  StockReportTable,
  HeroSection,
  AnalyticsTabs,
  LowMarginProductsAlert,
  PaymentTransactions,
  GenderClassificationFunnel,
  GenderClassificationJobButton,
} from '@/components/sales';
import { RealtimeStatusBadge } from '@/components/sales/RealtimeStatusBadge';
import { PendingOrders } from '@/components/PendingOrders';
import { FreeSampleLane } from '@/components/FreeSampleLane';
import { useHeroStats } from '@/hooks/sales/useHeroStats';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useFilterPersistence } from '@/hooks/useFilterPersistence';
import { SalesFiltersBar } from '@/components/sales/SalesFiltersBar';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { RefreshCw } from 'lucide-react';
import gsap from 'gsap';
import type { PendingOrder } from '@/types/pendingOrder';

const Sales: React.FC = () => {
  const { organizationId, loading, settingsError, retrySettings } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const { stats } = useHeroStats(organizationId || '', period, refreshKey);

  // Free sample lane state — rehydrated from sessionStorage
  const [freeSampleOrders, setFreeSampleOrders] = useState<PendingOrder[]>(() => {
    try {
      const stored = sessionStorage.getItem('freeSampleOrders');
      return stored ? (JSON.parse(stored) as PendingOrder[]) : [];
    } catch {
      return [];
    }
  });

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

  // Move a pending order to the free sample lane
  const handleMoveToFreeSample = useCallback((order: PendingOrder) => {
    setFreeSampleOrders((prev) => {
      // Deduplicate by bling_order_id
      if (prev.some((o) => o.bling_order_id === order.bling_order_id)) return prev;
      const next = [...prev, order];
      try {
        sessionStorage.setItem('freeSampleOrders', JSON.stringify(next));
      } catch {
        // sessionStorage unavailable (private mode) — state lives in memory only
      }
      return next;
    });
  }, []);

  // Called when a free sample order is processed — remove from lane and refresh dashboard
  const handleFreeSampleProcessed = useCallback(
    (blingOrderId: string) => {
      setFreeSampleOrders((prev) => {
        const next = prev.filter((o) => o.bling_order_id !== blingOrderId);
        try {
          sessionStorage.setItem('freeSampleOrders', JSON.stringify(next));
        } catch {
          // sessionStorage unavailable
        }
        return next;
      });
      handleOrderProcessed();
    },
    [handleOrderProcessed]
  );

  // Return a free sample order back to the pending lane
  const handleReturnToPending = useCallback((order: PendingOrder) => {
    setFreeSampleOrders((prev) => {
      const next = prev.filter((o) => o.bling_order_id !== order.bling_order_id);
      try {
        sessionStorage.setItem('freeSampleOrders', JSON.stringify(next));
      } catch {
        // sessionStorage unavailable
      }
      return next;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(Date.now());
  }, []);

  const { isConnected, lastUpdate } = useRealtimeSync({ onUpdate: handleRefresh });
  const { filters, setFilters, resetFilters } = useFilterPersistence('sales-filters');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (settingsError || !organizationId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-500 dark:text-red-400">
          {settingsError ?? 'Organização não encontrada.'}
        </p>
        <button
          onClick={retrySettings}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 sm:p-6">
      {/* Header do Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-on-load">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard de Vendas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Visão completa do desempenho
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RealtimeStatusBadge isConnected={isConnected} lastUpdate={lastUpdate} />
          <DateRangePicker />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            aria-label="Atualizar dados do dashboard"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 animate-on-load">
        <SalesFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
        />
      </div>

      {/* Vendas a Processar - Topo */}
      <div className="mb-4 animate-on-load">
        <PendingOrders
          onOrderProcessed={handleOrderProcessed}
          onMoveToFreeSample={handleMoveToFreeSample}
          onReturnFromFreeSample={handleReturnToPending}
        />
      </div>

      {/* Amostras Grátis — Influenciadores */}
      {organizationId && (
        <div className="mb-6 animate-on-load">
          <FreeSampleLane
            orders={freeSampleOrders}
            organizationId={organizationId}
            onOrderProcessed={handleFreeSampleProcessed}
            onDropOrder={handleMoveToFreeSample}
            onReturnOrder={handleReturnToPending}
          />
        </div>
      )}

      {/* Layout principal: Coluna 1 (KPIs + Gráfico) | Coluna 2 (Estatísticas de Clientes) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Coluna 1 - KPIs + Revenue Chart (ocupa 2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="animate-on-load">
            <HeroSection 
              stats={stats}
              period={period}
              hasPendingOrders={false}
              compact={true}
            />
          </div>
          <div className="animate-on-load">
            <RevenueReportChart 
              organizationId={organizationId} 
              refreshTrigger={refreshKey} 
              onOrderDeleted={handleRefresh}
              period={period}
              onPeriodChange={setPeriod}
            />
          </div>
        </div>

        {/* Coluna 2 - Funil de Classificação de Gênero (ocupa 1/3) */}
        <div className="animate-on-load h-full">
          <GenderClassificationFunnel 
            organizationId={organizationId} 
            refreshTrigger={refreshKey}
            onClassifyClick={() => {
              // Abrir modal ou executar classificação em lote
              const button = document.querySelector('[data-gender-classify-button]') as HTMLButtonElement;
              if (button) button.click();
            }}
          />
        </div>
      </div>

      {/* Análises Detalhadas (Tabs) + Transações — mesma grade 3 colunas do hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Coluna 1 - Tabs: Produtos / Pedidos / Distribuição (ocupa 2/3) */}
        <div className="lg:col-span-2 animate-on-load">
          <AnalyticsTabs organizationId={organizationId} refreshTrigger={refreshKey} />
        </div>
        {/* Coluna 2 - Transações com formas de pagamento (ocupa 1/3) */}
        <div className="animate-on-load">
          <PaymentTransactions organizationId={organizationId} refreshTrigger={refreshKey} />
        </div>
      </div>

      {/* Produtos Lucrativos removido — agora está no Resumo Financeiro Geral */}

      {/* Botão escondido para classificação em lote (acionado pelo funil) */}
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

      {/* Alertas de Margem Baixa + Relatório de Estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Coluna 1 - Alertas de Margem Baixa (ocupa 2/3) */}
        <div className="lg:col-span-2 animate-on-load">
          <LowMarginProductsAlert organizationId={organizationId} />
        </div>
        {/* Coluna 2 - Relatório de Estoque (ocupa 1/3) */}
        <div className="animate-on-load">
          <StockReportTable organizationId={organizationId} refreshTrigger={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default Sales;
