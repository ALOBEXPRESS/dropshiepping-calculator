/**
 * Affiliate Commission Chart
 * 
 * Componente que exibe gráficos de afiliados:
 * - Modo "Por Produto": produtos cadastrados com comissão % de afiliado
 * - Modo "Por Pedido": afiliados no eixo X, número de pedidos no eixo Y,
 *   com tooltip mostrando produtos vendidos e lucro total do afiliado.
 * 
 * Design: Data-Dense Dashboard alinhado com o design system do app.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useAffiliateCommissionData } from '@/hooks/sales/useAffiliateCommissionData';
import { Loader2, ChevronLeft, ChevronRight, ChevronDown, BarChart3, Package, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AffiliateCommissionChartProps {
  organizationId: string;
  refreshTrigger?: number;
}

const formatCurrency = (val: number | string | null | undefined): string => {
  const n = Number(val ?? 0);
  return isNaN(n) ? 'R$ 0,00' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const AffiliateCommissionChart: React.FC<AffiliateCommissionChartProps> = ({
  organizationId,
  refreshTrigger,
}) => {
  const {
    data,
    allData,
    orderGroups,
    allOrderGroups,
    marketplaces,
    selectedMarketplace,
    setSelectedMarketplace,
    loading,
    error,
  } = useAffiliateCommissionData(organizationId, refreshTrigger);

  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'product' | 'order'>('product');
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>('all');
  const [chartOffset, setChartOffset] = useState(0);
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Obter lista única de afiliados de ambas as fontes (produtos e pedidos)
  const affiliates = Array.from(
    new Set([
      ...allData.map(item => item.affiliate_name),
      ...allOrderGroups.map(item => item.affiliate_name),
    ].filter(Boolean))
  ).sort() as string[];

  // Filtrar dados por afiliado
  const filteredProductData = selectedAffiliate === 'all' 
    ? data 
    : data.filter(item => item.affiliate_name === selectedAffiliate);

  const filteredOrderData = selectedAffiliate === 'all'
    ? orderGroups
    : orderGroups.filter(item => item.affiliate_name === selectedAffiliate);

  // Preparar dados do gráfico conforme o modo ativo
  const chartProductData = filteredProductData.slice(0, 50);
  const chartOrderData = filteredOrderData.slice(0, 50);

  // Estado para largura do container
  const [containerWidth, setContainerWidth] = useState(800);

  // Atualizar largura do container
  useEffect(() => {
    const updateWidth = () => {
      if (chartWrapperRef.current) {
        setContainerWidth(chartWrapperRef.current.clientWidth);
      }
    };
    if (isOpen) {
      const timer = setTimeout(updateWidth, 50);
      window.addEventListener('resize', updateWidth);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateWidth);
      };
    }
  }, [isOpen]);

  // Reset scroll offset when switching mode or filter
  useEffect(() => {
    setChartOffset(0);
  }, [viewMode, selectedAffiliate, selectedMarketplace]);

  const activeItemsCount = viewMode === 'product' ? chartProductData.length : chartOrderData.length;
  const itemColumnWidth = viewMode === 'product' ? 85 : 120;
  const chartWidth = Math.max(containerWidth, Math.max(900, activeItemsCount * itemColumnWidth));
  const hasScroll = chartWidth > containerWidth;
  const maxOffset = hasScroll ? chartWidth - containerWidth : 0;

  const handleScrollLeft = () => {
    setChartOffset(prev => Math.max(0, prev - 300));
  };

  const handleScrollRight = () => {
    setChartOffset(prev => Math.min(maxOffset, prev + 300));
  };

  // Opções do gráfico no modo "Por Produto"
  const productChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'inherit',
      animations: {
        enabled: typeof window === 'undefined'
          ? true
          : !(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false),
        speed: 350,
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
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
        colors: ['#a855f7'],
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
      categories: chartProductData.map((item) => {
        const productName = item.product_name.length > 20
          ? item.product_name.substring(0, 20) + '...'
          : item.product_name;
        return `${productName}\n(Estoque: ${item.stock_quantity})`;
      }),
      labels: {
        style: {
          colors: '#9ca3af',
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
          color: '#9ca3af',
          fontSize: '12px',
          fontWeight: 500,
        },
      },
      labels: {
        style: {
          colors: '#9ca3af',
          fontSize: '12px',
        },
        formatter: (value) => formatPercentage(value),
      },
      min: 0,
      max: Math.max(...chartProductData.map(d => d.max_affiliate_percentage), 15) + 2,
    },
    grid: {
      borderColor: '#27272a',
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      enabled: true,
      shared: false,
      intersect: true,
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        const product = chartProductData[dataPointIndex];
        if (!product) return '';

        const affiliateInfo = product.affiliate_name
          ? `
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);">
              <div style="font-size:10px;color:#a1a1aa;margin-bottom:2px;">Afiliado</div>
              <div style="font-size:12px;color:#f4f4f5;font-weight:600;">${product.affiliate_name}</div>
              ${product.affiliate_username ? `<div style="font-size:11px;color:#c084fc;font-family:monospace;">@${product.affiliate_username}</div>` : ''}
            </div>
          `
          : '';

        return `
          <div style="background:rgba(24,24,27,0.98);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:12px;box-shadow:0 18px 50px rgba(0,0,0,0.5);backdrop-filter:blur(10px);min-width:240px;color:#fff;">
            <div style="margin-bottom:8px;">
              <div style="font-weight:600;color:#f4f4f5;font-size:13px;margin-bottom:4px;">${product.product_name}</div>
              <div style="font-size:11px;color:#a1a1aa;font-family:monospace;">SKU: ${product.product_sku || 'N/A'}</div>
            </div>
            <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);">
              <div>
                <div style="font-size:10px;color:#a1a1aa;margin-bottom:2px;">Marketplace</div>
                <div style="font-size:12px;color:#f4f4f5;font-weight:600;">${product.marketplace_name}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:10px;color:#a1a1aa;margin-bottom:2px;">Estoque</div>
                <div style="font-size:12px;color:#f4f4f5;font-weight:600;">${product.stock_quantity}</div>
              </div>
            </div>
            ${affiliateInfo}
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:11px;color:#a1a1aa;font-weight:600;">Comissão Afiliado:</span>
                <span style="font-size:14px;font-weight:800;color:#c084fc;">${formatPercentage(product.max_affiliate_percentage)}</span>
              </div>
            </div>
          </div>
        `;
      },
    },
    legend: { show: false },
  };

  // Opções do gráfico no modo "Por Pedido"
  const orderChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'inherit',
      animations: {
        enabled: typeof window === 'undefined'
          ? true
          : !(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false),
        speed: 350,
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        borderRadius: 6,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val} ${val === 1 ? 'ped.' : 'ped.'}`,
      offsetY: -20,
      style: {
        fontSize: '11px',
        colors: ['#a855f7'],
        fontWeight: 600,
      },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    colors: ['#9333ea'],
    xaxis: {
      categories: chartOrderData.map((item) => {
        const name = item.affiliate_name.length > 22
          ? item.affiliate_name.substring(0, 22) + '...'
          : item.affiliate_name;
        return name;
      }),
      labels: {
        style: {
          colors: '#9ca3af',
          fontSize: '11px',
          fontWeight: 500,
        },
        rotate: -35,
        rotateAlways: true,
        hideOverlappingLabels: false,
        trim: false,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: {
        text: 'Número de Pedidos',
        style: {
          color: '#9ca3af',
          fontSize: '12px',
          fontWeight: 500,
        },
      },
      labels: {
        style: {
          colors: '#9ca3af',
          fontSize: '12px',
        },
        formatter: (value) => String(Math.round(value)),
      },
      min: 0,
      max: Math.max(...chartOrderData.map(d => d.orders_count), 4) + 1,
      forceNiceScale: true,
    },
    grid: {
      borderColor: '#27272a',
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      enabled: true,
      shared: false,
      intersect: true,
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        const item = chartOrderData[dataPointIndex];
        if (!item) return '';

        const profitColor = item.total_profit >= 0 ? '#34d399' : '#f87171';
        const productsHtml = item.products.length > 0
          ? item.products.map(p => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:11px;">
                <span style="color:#f4f4f5;max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${p.name}">${p.name}</span>
                <span style="color:#c084fc;font-weight:700;margin-left:8px;font-size:11px;">${p.quantity}x</span>
              </div>
            `).join('')
          : '<div style="font-size:11px;color:#71717a;">Nenhum produto listado</div>';

        return `
          <div style="background:rgba(24,24,27,0.98);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:12px 14px;box-shadow:0 18px 50px rgba(0,0,0,0.5);backdrop-filter:blur(10px);min-width:260px;max-width:320px;color:#fff;font-family:inherit;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.1);">
              <div style="font-weight:700;color:#c084fc;font-size:13px;">${item.affiliate_name}</div>
              <span style="background:rgba(139,92,246,0.2);color:#c084fc;border:1px solid rgba(139,92,246,0.3);border-radius:6px;padding:2px 7px;font-size:11px;font-weight:600;">
                ${item.orders_count} ${item.orders_count === 1 ? 'pedido' : 'pedidos'}
              </span>
            </div>

            <div style="margin-bottom:8px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:7px 10px;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:11px;color:#a1a1aa;font-weight:500;">Lucro Total Afiliado:</span>
              <span style="font-size:13px;font-weight:800;color:${profitColor};">
                ${formatCurrency(item.total_profit)}
              </span>
            </div>

            <div style="margin-top:6px;">
              <div style="font-size:10px;color:#a1a1aa;font-weight:600;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Produtos Vendidos:</div>
              <div style="max-height:120px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;">
                ${productsHtml}
              </div>
            </div>

            ${item.total_amount > 0 ? `
              <div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;font-size:10px;color:#71717a;">
                <span>Faturamento Bruto:</span>
                <span style="color:#d4d4d8;font-weight:600;">${formatCurrency(item.total_amount)}</span>
              </div>
            ` : ''}
          </div>
        `;
      },
    },
    legend: { show: false },
  };

  const chartSeries = viewMode === 'product'
    ? [
        {
          name: 'Comissão de Afiliado',
          data: chartProductData.map((item) => item.max_affiliate_percentage),
        },
      ]
    : [
        {
          name: 'Número de Pedidos',
          data: chartOrderData.map((item) => item.orders_count),
        },
      ];

  if (loading) {
    return (
      <Card className="p-6 border-border">
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-border">
        <div className="text-center text-red-500 py-4">{error}</div>
      </Card>
    );
  }

  if (marketplaces.length === 0) {
    return (
      <Card className="p-6 border-border">
        <div className="text-center text-muted-foreground py-6">
          <p className="text-base font-semibold mb-1">Nenhum marketplace com comissão de afiliado</p>
          <p className="text-xs">Configure a comissão de afiliado nos marketplaces para visualizar este relatório.</p>
        </div>
      </Card>
    );
  }

  // Estatísticas de cabeçalho
  const avgCommission = filteredProductData.length > 0
    ? formatPercentage(
        filteredProductData.reduce((sum, p) => sum + p.max_affiliate_percentage, 0) / filteredProductData.length
      )
    : '0.0%';

  const totalStock = filteredProductData.reduce((sum, p) => sum + p.stock_quantity, 0);

  const totalOrdersCount = filteredOrderData.reduce((sum, o) => sum + o.orders_count, 0);
  const totalAffiliateProfit = filteredOrderData.reduce((sum, o) => sum + o.total_profit, 0);

  const hasChartData = viewMode === 'product' ? chartProductData.length > 0 : chartOrderData.length > 0;

  return (
    <Card className="border-border overflow-hidden bg-card transition-all">
      {/* Accordion Trigger Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-full flex items-center justify-between p-4 sm:p-5',
          'hover:bg-zinc-900/60 transition-all cursor-pointer select-none text-left group'
        )}
        aria-expanded={isOpen}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 flex-wrap">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              Relatório de Comissão de Afiliado
            </h3>
          </div>

          {viewMode === 'product' ? (
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Total de Produtos</p>
                <p className="text-base sm:text-lg font-bold text-purple-500">{filteredProductData.length}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Comissão Média</p>
                <p className="text-base sm:text-lg font-bold text-purple-500">{avgCommission}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Estoque Total</p>
                <p className="text-base sm:text-lg font-bold text-purple-500">{totalStock}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Total de Pedidos</p>
                <p className="text-base sm:text-lg font-bold text-purple-500">{totalOrdersCount}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Afiliados com Vendas</p>
                <p className="text-base sm:text-lg font-bold text-purple-500">{filteredOrderData.length}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Lucro Total dos Afiliados</p>
                <p className={cn(
                  'text-base sm:text-lg font-bold',
                  totalAffiliateProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {formatCurrency(totalAffiliateProfit)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground shrink-0 ml-2">
          <span className="text-xs font-medium hidden sm:inline">
            {isOpen ? 'Ocultar' : 'Expandir'}
          </span>
          <ChevronDown
            className={cn(
              'w-5 h-5 transition-transform duration-200 text-muted-foreground group-hover:text-foreground',
              isOpen && 'rotate-180 text-purple-400'
            )}
          />
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 sm:p-6 pt-2 border-t border-border/60 animate-in fade-in-50 duration-200 space-y-6">
          {/* Filters Bar: Toggle Por Produto / Por Pedido + Dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            {/* Toggle de Modo: Por Produto vs Por Pedido */}
            <div className="flex items-center rounded-lg bg-zinc-900/90 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('product')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
                  viewMode === 'product'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <Package className="w-3.5 h-3.5" />
                Por Produto
              </button>
              <button
                type="button"
                onClick={() => setViewMode('order')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
                  viewMode === 'order'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Por Pedido
              </button>
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
                <SelectTrigger className="w-[180px] sm:w-[220px] border-border bg-background">
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
                <SelectTrigger className="w-[180px] sm:w-[220px] border-border bg-background">
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

          {/* Chart Content */}
          {hasChartData ? (
            <div className="relative overflow-hidden">
              {/* Botões de navegação - só aparecem se houver scroll */}
              {hasScroll && chartOffset > 0 && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleScrollLeft}
                    className="h-10 w-10 rounded-full bg-card/90 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-border cursor-pointer"
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
                    className="h-10 w-10 rounded-full bg-card/90 shadow-lg hover:shadow-xl transition-all hover:scale-110 border border-border cursor-pointer"
                    aria-label="Rolar para direita"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </div>
              )}

              {/* Container do gráfico */}
              <div ref={chartWrapperRef} className="w-full">
                <div
                  style={{
                    width: `${chartWidth}px`,
                    transform: `translateX(-${chartOffset}px)`,
                    transition: 'transform 0.3s ease-out',
                  }}
                >
                  <Chart
                    options={viewMode === 'product' ? productChartOptions : orderChartOptions}
                    series={chartSeries}
                    type="bar"
                    height={400}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <p className="text-base font-semibold mb-1">
                  {viewMode === 'product' ? 'Nenhum produto com afiliado' : 'Nenhum pedido com afiliado'}
                </p>
                <p className="text-xs">
                  {viewMode === 'product'
                    ? selectedMarketplace === 'all' && selectedAffiliate === 'all'
                      ? 'Não há produtos com afiliados cadastrados.'
                      : 'Não há produtos com afiliados para os filtros selecionados.'
                    : selectedMarketplace === 'all' && selectedAffiliate === 'all'
                      ? 'Nenhum pedido vinculado a afiliado encontrado. Associe um afiliado aos pedidos no modal de pedidos.'
                      : 'Não há pedidos para os filtros selecionados.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
