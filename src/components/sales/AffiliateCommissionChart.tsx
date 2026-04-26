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

import React from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useAffiliateCommissionData } from '@/hooks/sales/useAffiliateCommissionData';
import { Loader2 } from 'lucide-react';

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
    marketplaces,
    selectedMarketplace,
    setSelectedMarketplace,
    loading,
    error,
  } = useAffiliateCommissionData(organizationId, refreshTrigger);

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Preparar dados para o gráfico
  const chartData = data.slice(0, 15); // Limitar a 15 produtos para melhor visualização

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Relatório de Comissão de Afiliado
          </h3>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total de Produtos</p>
              <p className="text-xl font-bold text-purple-600">{data.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Comissão Média</p>
              <p className="text-xl font-bold text-purple-600">
                {data.length > 0
                  ? formatPercentage(
                      data.reduce((sum, p) => sum + p.max_affiliate_percentage, 0) / data.length
                    )
                  : '0.0%'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Estoque Total</p>
              <p className="text-xl font-bold text-purple-600">
                {data.reduce((sum, p) => sum + p.stock_quantity, 0)}
              </p>
            </div>
          </div>
        </div>
        <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
          <SelectTrigger className="w-[180px] border-gray-200 dark:border-zinc-800">
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
      </div>

      {chartData.length > 0 ? (
        <div className="relative">
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="bar"
            height={400}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Nenhum produto com afiliado</p>
            <p className="text-sm">
              {selectedMarketplace === 'all'
                ? 'Não há produtos com afiliados cadastrados.'
                : 'Não há produtos com afiliados para o marketplace selecionado.'}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
