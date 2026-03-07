import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { supabase } from '@/lib/supabase';
import { Loader2, TrendingUp } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentOrdersChartProps {
  organizationId: string;
}

interface MonthlyData {
  month: string;
  total_amount: number;
  order_count: number;
}

export const RecentOrdersChart: React.FC<RecentOrdersChartProps> = ({ organizationId }) => {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return;

      setLoading(true);
      setError(null);

      try {
        // Buscar dados dos últimos 6 meses
        const sixMonthsAgo = subMonths(new Date(), 6);

        const { data: ordersData, error: fetchError } = await supabase
          .from('orders')
          .select('order_date, total_amount')
          .eq('organization_id', organizationId)
          .gte('order_date', sixMonthsAgo.toISOString())
          .order('order_date', { ascending: true });

        if (fetchError) throw fetchError;

        // Agrupar por mês
        const monthlyMap = new Map<string, { total: number; count: number }>();

        ordersData?.forEach((order) => {
          const date = new Date(order.order_date);
          const monthKey = format(date, 'MMM', { locale: ptBR });

          const existing = monthlyMap.get(monthKey) || { total: 0, count: 0 };
          monthlyMap.set(monthKey, {
            total: existing.total + Number(order.total_amount),
            count: existing.count + 1,
          });
        });

        // Converter para array
        const chartData: MonthlyData[] = Array.from(monthlyMap.entries()).map(
          ([month, values]) => ({
            month,
            total_amount: values.total,
            order_count: values.count,
          })
        );

        setData(chartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        console.error('Error fetching recent orders chart:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.total_amount, 0);
  const previousTotal = data.length > 1 ? data[data.length - 2].total_amount : 0;
  const currentTotal = data.length > 0 ? data[data.length - 1].total_amount : 0;
  const growthPercentage =
    previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    colors: ['#487FFF'],
    xaxis: {
      categories: data.map((item) => item.month),
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
        formatter: (value) => formatCurrency(value),
      },
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value) => formatCurrency(value),
      },
    },
  };

  const chartSeries = [
    {
      name: 'Receita',
      data: data.map((item) => item.total_amount),
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

  return (
    <Card className="p-6 border-gray-100 dark:border-zinc-800">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Pedidos Recentes
        </h3>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Últimos 6 meses</p>
          </div>
          {growthPercentage !== 0 && (
            <div className="flex items-center gap-1">
              <TrendingUp
                className={`w-4 h-4 ${
                  growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {growthPercentage >= 0 ? '+' : ''}
                {growthPercentage.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs mês anterior</span>
            </div>
          )}
        </div>
      </div>

      {data.length > 0 ? (
        <Chart options={chartOptions} series={chartSeries} type="area" height={200} />
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          Sem dados disponíveis
        </div>
      )}
    </Card>
  );
};
