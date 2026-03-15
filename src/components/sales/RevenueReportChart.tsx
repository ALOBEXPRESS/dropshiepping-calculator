import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useRevenueReport } from '@/hooks/sales/useRevenueReport';
import { supabase } from '@/lib/supabase';
import { Loader2, Trash2 } from 'lucide-react';
import type { PeriodFilter } from '@/types/sales';
import { toast } from 'sonner';

interface RevenueReportChartProps {
  organizationId: string;
  refreshTrigger?: number;
}


export const RevenueReportChart: React.FC<RevenueReportChartProps> = ({ organizationId, refreshTrigger }) => {
  const [period, setPeriod] = useState<PeriodFilter>('monthly');
  const { data, loading, error, refetch } = useRevenueReport(organizationId, period);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; number: string; store: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Adicionar CSS global para manter tooltip visível ao passar mouse sobre ele
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .apexcharts-tooltip-custom {
        pointer-events: auto !important;
      }
      .apexcharts-tooltip.apexcharts-active {
        pointer-events: auto !important;
      }
      .apexcharts-tooltip:hover {
        display: block !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Adicionar event listeners para os botões de excluir no tooltip
  useEffect(() => {
    const handleTooltipClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('[data-delete-order-btn]') as HTMLElement;
      
      if (button) {
        e.preventDefault();
        e.stopPropagation();
        
        const orderId = button.getAttribute('data-order-id');
        const orderNumber = button.getAttribute('data-order-number');
        const orderStore = button.getAttribute('data-order-store');
        
        if (orderId && orderNumber && orderStore) {
          setOrderToDelete({ id: orderId, number: orderNumber, store: orderStore });
          setDeleteDialogOpen(true);
        }
      }
    };

    // Adicionar listener no documento para capturar cliques nos botões do tooltip
    document.addEventListener('click', handleTooltipClick, true);
    document.addEventListener('mousedown', handleTooltipClick, true);

    return () => {
      document.removeEventListener('click', handleTooltipClick, true);
      document.removeEventListener('mousedown', handleTooltipClick, true);
    };
  }, []);

  // Refetch quando refreshTrigger mudar (apenas se for > 0)
  React.useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('🔄 RevenueReportChart: refreshTrigger mudou, refazendo query...', refreshTrigger);
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    setDeleting(true);
    try {
      // Deletar pedido da tabela orders
      // O trigger delete_order_cascade irá automaticamente:
      // 1. Excluir order_items (ON DELETE CASCADE)
      // 2. Excluir bling_orders (via trigger)
      // 3. Excluir bling_order_items (ON DELETE CASCADE de bling_orders)
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete.id);
      
      if (orderError) {
        throw new Error(`Erro ao excluir pedido: ${orderError.message}`);
      }
      
      // Fechar modal e tooltip
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      
      // Mostrar toast de sucesso
      toast.success('Métrica excluída com sucesso!', {
        description: `O pedido ${orderToDelete.number} foi removido do sistema.`,
      });
      
      // Recarregar dados
      await refetch();
    } catch (err) {
      console.error('Error deleting order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir métrica', {
        description: errorMessage,
      });
    } finally {
      setDeleting(false);
    }
  };

  const totalRevenue = data.reduce((sum, item) => sum + Number(item.total_revenue), 0);
  const totalCost = data.reduce((sum, item) => sum + Number(item.total_cost), 0);
  const totalProfit = totalRevenue - totalCost;


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
      width: 2,
    },
    markers: {
      size: 5,
      colors: ['#45B369', '#EF4A00'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 7,
      },
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
    colors: ['#45B369', '#EF4A00'],
    xaxis: {
      categories: data.map((item) => item.period_label),
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
      enabled: true,
      followCursor: false,
      intersect: false,
      shared: false,
      fixed: {
        enabled: false,
      },
      custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
        const currentData = dataRef.current;
        if (!currentData[dataPointIndex]) return '';
        const periodData = currentData[dataPointIndex];
        const revenue = Number(periodData.total_revenue);
        const cost = Number(periodData.total_cost);
        const profit = revenue - cost;

        const allProducts = periodData.orders_data?.flatMap((order: { products?: { name: string }[] }) =>
          order.products?.map((p: { name: string }) => p.name) || []
        ) || [];
        const uniqueProducts = [...new Set(allProducts)] as string[];

        const profitColor = profit >= 0 ? '#16a34a' : '#dc2626';

        const productLines = uniqueProducts.length > 0
          ? uniqueProducts.slice(0, 2).map(p =>
              `<div style="font-size:11px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px">${p.length > 35 ? p.substring(0, 35) + '...' : p}</div>`
            ).join('') + (uniqueProducts.length > 2 ? '<div style="font-size:11px;color:#9ca3af">...</div>' : '')
          : '<div style="font-size:11px;color:#9ca3af">Sem produtos</div>';

        // Criar lista de pedidos com botão excluir
        const ordersHtml = periodData.orders_data?.map((order: { order_id: string; order_number: string; marketplace_name: string }) => {
          const marketplaceName = order.marketplace_name && order.marketplace_name !== 'null' && order.marketplace_name !== 'undefined'
            ? order.marketplace_name 
            : 'Sem marketplace';
          const displayText = `${marketplaceName} - #${order.order_number || 'S/N'}`;
          const safeStore = order.marketplace_name && order.marketplace_name !== 'null' && order.marketplace_name !== 'undefined'
            ? order.marketplace_name
            : 'Sem marketplace';
          
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-top:1px solid #f3f4f6;gap:8px;">
              <span style="font-size:11px;color:#6b7280;flex:1;">${displayText}</span>
              <button 
                data-delete-order-btn
                data-order-id="${order.order_id}"
                data-order-number="${order.order_number}"
                data-order-store="${safeStore}"
                style="background:#ef4444;color:white;border:none;border-radius:4px;padding:4px 8px;font-size:10px;cursor:pointer;flex-shrink:0;font-weight:500;transition:background 0.2s;"
                onmouseover="this.style.background='#dc2626'"
                onmouseout="this.style.background='#ef4444'"
              >
                Excluir
              </button>
            </div>
          `;
        }).join('') || '';

        return `
          <div class="apexcharts-tooltip-custom" style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;box-shadow:0 4px 16px rgba(0,0,0,0.12);min-width:220px;max-width:320px;pointer-events:auto;">
            <div style="font-weight:600;color:#111827;margin-bottom:6px;font-size:13px">${periodData.period_label}</div>
            <div style="margin-bottom:8px">${productLines}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:10px;height:10px;border-radius:50%;background:#45B369"></div>
                <span style="font-size:12px;color:#6b7280">Receita:</span>
              </div>
              <span style="font-size:12px;font-weight:600;color:#111827">${formatCurrency(revenue)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:10px;height:10px;border-radius:50%;background:#EF4A00"></div>
                <span style="font-size:12px;color:#6b7280">Custo:</span>
              </div>
              <span style="font-size:12px;font-weight:600;color:#111827">${formatCurrency(cost)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid #e5e7eb;margin-bottom:6px">
              <span style="font-size:12px;font-weight:500;color:#374151">Lucro:</span>
              <span style="font-size:12px;font-weight:700;color:${profitColor}">${formatCurrency(profit)}</span>
            </div>
            ${ordersHtml}
          </div>`;
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: {
        colors: '#6b7280',
      },
    },
  };

  const chartSeries = [
    {
      name: 'Receita',
      data: data.map((item) => Number(item.total_revenue)),
    },
    {
      name: 'Custo',
      data: data.map((item) => Number(item.total_cost)),
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
    <>
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Você tem certeza que quer excluir o pedido #{orderToDelete?.number}
              {orderToDelete?.store && orderToDelete.store !== 'null' && orderToDelete.store !== 'Sem marketplace' ? ` do marketplace ${orderToDelete.store}` : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é irreversível. O pedido será permanentemente excluído do sistema, incluindo todos os itens relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="p-6 border-gray-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Relatório de Receita
          </h3>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Receita</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Custo</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalCost)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Lucro</p>
              <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalProfit)}</p>
            </div>
          </div>
        </div>
        <Select value={period} onValueChange={(value) => setPeriod(value as PeriodFilter)}>
          <SelectTrigger className="w-[140px] border-gray-200 dark:border-zinc-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Diário</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.length > 0 ? (
        <div ref={chartRef} className="relative">
          <Chart key={JSON.stringify(data.map(d => d.period_label + d.total_cost))} options={chartOptions} series={chartSeries} type="area" height={300} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          Sem dados disponíveis para o período selecionado
        </div>
      )}
    </Card>
    </>
  );
};
