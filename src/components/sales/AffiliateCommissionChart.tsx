/**
 * Affiliate Commission Chart
 * 
 * Componente que exibe um gráfico de barras com produtos e suas comissões de afiliado.
 * Design: Data-Dense Dashboard alinhado com RevenueReportChart.
 * 
 * Features:
 * - Gráfico de barras horizontal com comissão % no eixo Y
 * - Nome do produto + estoque no eixo X
 * - Filtro por marketplace (apenas marketplaces com comissão > 0)
 * - Cores consistentes com o design system (roxo/azul)
 */

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useAffiliateCommissionData } from '@/hooks/sales/useAffiliateCommissionData';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface AffiliateCommissionChartProps {
  organizationId: string;
  refreshTrigger?: number;
}

export const AffiliateCommissionChart: React.FC<AffiliateCommissionChartProps> = ({
  organizationId,
  refreshTrigger,
}) => {
  const {
    data,
    allData, // Dados originais sem filtro
    marketplaces,
    selectedMarketplace,
    setSelectedMarketplace,
    loading,
    error,
  } = useAffiliateCommissionData(organizationId, refreshTrigger);

  const [selectedAffiliate, setSelectedAffiliate] = useState<string>('all');
  const [chartOffset, setChartOffset] = useState(0);
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Obter lista única de afiliados dos DADOS ORIGINAIS (todos, sem filtro de marketplace)
  const affiliates = Array.from(
    new Set(allData.map(item => item.affiliate_name).filter(Boolean))
  ).sort();

  // Filtrar dados por afiliado
  const filteredData = selectedAffiliate === 'all' 
    ? data 
    : data.filter(item => item.affiliate_name === selectedAffiliate);

  // Preparar dados para o gráfico
  const chartData = filteredData.slice(0, 20);

  // Estado para largura do container
  const [containerWidth, setContainerWidth] = React.useState(800);

  // Atualizar largura do container
  React.useEffect(() => {
    const updateWidth = () => {
      if (chartWrapperRef.current) {
        setContainerWidth(chartWrapperRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calcular largura do gráfico e se tem scroll
  const chartWidth = Math.max(800, chartData.length * 60);
  const hasScroll = chartWidth > containerWidth;
  const maxOffset = hasScroll ? chartWidth - containerWidth : 0;

  // Funções de navegação - movem apenas o gráfico
  const handleScrollLeft = () => {
    setChartOffset(prev => Math.max(0, prev - 300));
  };

  const handleScrollRight = () => {
    setChartOffset(prev => Math.min(maxOffset, prev + 300));
  };

  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'inherit',
      animations: {
        enabled: typeof window === 'undefined'
          ? true
          : !(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false),
        speed: 350,
        animateGradually: { enabled: false },
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '70%',
        borderRadius: 4,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => formatPercentage(val),
      offsetY: -20,
      style: {
        fontSize: '11px',
        colors: ['#8b5cf6'],
        fontWeight: 600,
      },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    colors: ['#8b5cf6'],
    xaxis: {
      categories: chartData.map((item) => {
        const productName = item.product_name.length > 20
          ? item.product_name.substring(0, 20) + '...'
          : item.product_name;
        return `${productName}\n(Estoque: ${item.stock_quantity})`;
      }),
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '10px',
        },
        rotate: -45,
        rotateAlways: true,
        hideOverlappingLabels: false,
        trim: false,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: {
        text: 'Comissão de Afiliado (%)',
        style: {
          color: '#6b7280',
          fontSize: '12px',
          fontWeight: 500,
        },
      },
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
        formatter: (value) => formatPercentage(value),
      },
      min: 0,
      max: Math.max(...chartData.map(d => d.max_affiliate_percentage), 15) + 2,
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
      yaxis: {
        lines: {
          show: true,
        },
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    tooltip: {
      enabled: true,
      shared: false,
      intersect: true,
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        const product = chartData[dataPointIndex];
        if (!product) return '';

        const affiliateInfo = product.affiliate_name
          ? `
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(2,6,23,0.08);">
              <div style="font-size:10px;color:#6b7280;margin-bottom:4px;">Afiliado</div>
              <div style="font-size:12px;color:#111827;font-weight:600;">${product.affiliate_name}</div>
              ${product.affiliate_username ? `<div style="font-size:11px;color:#8b5cf6;font-family:monospace;">@${product.affiliate_username}</div>` : ''}
            </div>
          `
          : '';

        return `
          <div style="background:rgba(255,255,255,0.98);border:1px solid rgba(2,6,23,0.08);border-radius:12px;padding:12px;box-shadow:0 18px 50px rgba(2,6,23,0.14);backdrop-filter:blur(10px);min-width:240px;">
            <div style="margin-bottom:8px;">
              <div style="font-weight:600;color:#111827;font-size:13px;margin-bottom:4px;">${product.product_name}</div>
              <div style="font-size:11px;color:#6b7280;font-family:monospace;">SKU: ${product.product_sku || 'N/A'}</div>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid rgba(2,6,23,0.08);">
              <div>
                <div style="font-size:10px;color:#6b7280;margin-bottom:2px;">Marketplace</div>
                <div style="font-size:12px;color:#111827;font-weight:600;">${product.marketplace_name}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:10px;color:#6b7280;margin-bottom:2px;">Estoque</div>
                <div style="font-size:12px;color:#111827;font-weight:600;">${product.stock_quantity}</div>
              </div>
            </div>
            ${affiliateInfo}
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(2,6,23,0.08);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:11px;color:#6b7280;font-weight:600;">Comissão Afiliado:</span>
                <span style="font-size:14px;font-weight:800;color:#8b5cf6;">${formatPercentage(product.max_affiliate_percentage)}</span>
              </div>
            </div>
          </div>
        `;
      },
    },
    legend: {
      show: false,
    },
  };

  const chartSeries = [
    {
      name: 'Comissão de Afiliado',
      data: chartData.map((item) => item.max_affiliate_percentage),
    },
  ];

  if (loading) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800">
        <div className="text-center text-red-500 py-8">{error}</div>
      </Card>
    );
  }

  if (marketplaces.length === 0) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p className="text-lg font-semibold mb-2">Nenhum marketplace com comissão de afiliado</p>
          <p className="text-sm">Configure a comissão de afiliado nos marketplaces para visualizar este relatório.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-gray-100 dark:border-zinc-800">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Relatório de Comissão de Afiliado
          </h3>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total de Produtos</p>
              <p className="text-xl font-bold text-purple-600">{filteredData.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Comissão Média</p>
              <p className="text-xl font-bold text-purple-600">
                {filteredData.length > 0
                  ? formatPercentage(
                      filteredData.reduce((sum, p) => sum + p.max_affiliate_percentage, 0) / filteredData.length
                    )
                  : '0.0%'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Estoque Total</p>
              <p className="text-xl font-bold text-purple-600">
                {filteredData.reduce((sum, p) => sum + p.stock_quantity, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
            <SelectTrigger className="w-[200px] border-gray-200 dark:border-zinc-800">
              <SelectValue placeholder="Selecione o marketplace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Marketplaces</SelectItem>
              {marketplaces.map((marketplace) => (
                <SelectItem key={marketplace.id} value={marketplace.id}>
                  {marketplace.name} ({formatPercentage(marketplace.affiliate_commission_rate)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedAffiliate} onValueChange={setSelectedAffiliate}>
            <SelectTrigger className="w-[200px] border-gray-200 dark:border-zinc-800">
              <SelectValue placeholder="Filtrar por afiliado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Afiliados</SelectItem>
              {affiliates.map((affiliate) => affiliate && (
                <SelectItem key={affiliate} value={affiliate}>
                  {affiliate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="relative overflow-hidden">
          {/* Botões de navegação - só aparecem se houver scroll */}
          {hasScroll && chartOffset > 0 && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleScrollLeft}
                className="h-10 w-10 rounded-full bg-white dark:bg-zinc-800 shadow-lg hover:shadow-xl transition-all hover:scale-110"
                aria-label="Rolar para esquerda"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </div>
          )}
          
          {hasScroll && chartOffset < maxOffset && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleScrollRight}
                className="h-10 w-10 rounded-full bg-white dark:bg-zinc-800 shadow-lg hover:shadow-xl transition-all hover:scale-110"
                aria-label="Rolar para direita"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          )}

          {/* Container do gráfico - sem scrollbar */}
          <div ref={chartWrapperRef} className="w-full">
            <div 
              style={{ 
                width: `${chartWidth}px`,
                transform: `translateX(-${chartOffset}px)`,
                transition: 'transform 0.3s ease-out'
              }}
            >
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height={400}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Nenhum produto com afiliado</p>
            <p className="text-sm">
              {selectedMarketplace === 'all' && selectedAffiliate === 'all'
                ? 'Não há produtos com afiliados cadastrados.'
                : 'Não há produtos com afiliados para os filtros selecionados.'}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
