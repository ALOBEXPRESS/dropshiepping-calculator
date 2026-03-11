import React, { useState } from 'react';
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
}

interface CustomTooltipData {
  dataPointIndex: number;
  x: number;
  y: number;
}

export const RevenueReportChart: React.FC<RevenueReportChartProps> = ({ organizationId }) => {
  const [period, setPeriod] = useState<PeriodFilter>('monthly');
  const { data, loading, error, refetch } = useRevenueReport(organizationId, period);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; number: string; store: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [customTooltip, setCustomTooltip] = useState<CustomTooltipData | null>(null);

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
      setCustomTooltip(null);
      
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

  // Adicionar event listeners na linha do gráfico após renderização
  React.useEffect(() => {
    // Adicionar CSS para tornar a linha interativa
    const style = document.createElement('style');
    style.textContent = `
      .apexcharts-series path {
        cursor: pointer !important;
        pointer-events: auto !important;
      }
      .apexcharts-series-markers {
        pointer-events: none !important;
      }
      .apexcharts-marker {
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    const addLineListeners = () => {
      // Adicionar listener na área do gráfico inteiro para capturar hover
      const chartElement = document.querySelector('.apexcharts-canvas');
      if (!chartElement || chartElement.hasAttribute('data-listener-added')) return;
      
      chartElement.setAttribute('data-listener-added', 'true');
      
      // Listener para mousemove na área do gráfico
      chartElement.addEventListener('mousemove', (e) => {
        const mouseEvent = e as MouseEvent;
        
        const rect = chartElement.getBoundingClientRect();
        const x = mouseEvent.clientX - rect.left;
        const y = mouseEvent.clientY - rect.top;
        
        // Calcular qual ponto está mais próximo baseado na posição X
        // Considerar padding do gráfico (aproximadamente 30px de cada lado)
        const padding = 30;
        const chartWidth = rect.width - (padding * 2);
        const chartHeight = rect.height - 60; // 30px top + 30px bottom
        const adjustedX = x - padding;
        const adjustedY = y - 30;
        
        // Verificar se está dentro da área do gráfico
        if (adjustedX < 0 || adjustedX > chartWidth || adjustedY < 0 || adjustedY > chartHeight) return;
        
        const pointWidth = chartWidth / data.length;
        const dataPointIndex = Math.floor(adjustedX / pointWidth);
        
        if (dataPointIndex >= 0 && dataPointIndex < data.length) {
          // Calcular a posição X do centro do ponto no gráfico
          const pointCenterX = padding + (dataPointIndex * pointWidth) + (pointWidth / 2);
          
          // Converter para coordenadas da tela
          const screenX = rect.left + pointCenterX;
          const screenY = rect.top + chartHeight / 2 + 30; // Centro vertical do gráfico
          
          setCustomTooltip({
            dataPointIndex,
            x: screenX, // Posição X fixa no centro do ponto
            y: screenY, // Posição Y fixa no centro do gráfico
          });
        }
      });
      
      // Listener para mouseleave - fechar tooltip quando sair do gráfico
      chartElement.addEventListener('mouseleave', () => {
        // Pequeno delay para permitir mover para o tooltip
        setTimeout(() => {
          const tooltipElement = document.querySelector('[data-custom-tooltip]');
          if (tooltipElement && !tooltipElement.matches(':hover')) {
            setCustomTooltip(null);
          }
        }, 100);
      });
    };

    // Executar após um pequeno delay para garantir que o gráfico foi renderizado
    const timer = setTimeout(addLineListeners, 500);
    
    // Também observar mudanças no DOM para adicionar listeners quando o gráfico for recriado
    const observer = new MutationObserver(addLineListeners);
    const chartContainer = document.querySelector('.apexcharts-canvas');
    if (chartContainer?.parentElement) {
      observer.observe(chartContainer.parentElement, { childList: true, subtree: true });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.head.removeChild(style);
    };
  }, [data]);

  // Fechar tooltip customizado ao rolar a página
  React.useEffect(() => {
    const handleScroll = () => {
      setCustomTooltip(null);
    };
    
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const handleDeleteClick = (orderId: string, orderNumber: string, orderStore: string) => {
    setOrderToDelete({ id: orderId, number: orderNumber, store: orderStore });
    setDeleteDialogOpen(true);
    setCustomTooltip(null);
  };

  const truncateProduct = (name: string, maxLength = 35) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const renderCustomTooltip = () => {
    if (!customTooltip || !data[customTooltip.dataPointIndex]) return null;

    const periodData = data[customTooltip.dataPointIndex];
    const revenue = Number(periodData.total_revenue);
    const cost = Number(periodData.total_cost);
    const profit = revenue - cost;

    // Pegar produtos únicos
    const allProducts = periodData.orders_data?.flatMap(order => 
      order.products?.map(p => p.name) || []
    ) || [];
    const uniqueProducts = [...new Set(allProducts)];

    // Pegar primeiro pedido para o botão de excluir
    const firstOrder = periodData.orders_data?.[0];

    // Ajustar posição para não sair da tela
    const tooltipWidth = 280;
    const tooltipHeight = 300; // altura aproximada
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const offset = 20; // distância do cursor
    const padding = 10; // padding das bordas da tela
    
    // Posicionar à direita do cursor por padrão
    let left = customTooltip.x + offset;
    let top = customTooltip.y - tooltipHeight / 2;
    
    // Se o tooltip sair pela direita, posicionar à esquerda do cursor
    if (left + tooltipWidth > windowWidth - padding) {
      left = customTooltip.x - tooltipWidth - offset;
    }
    
    // Se ainda sair pela esquerda, centralizar horizontalmente
    if (left < padding) {
      left = Math.max(padding, (windowWidth - tooltipWidth) / 2);
    }
    
    // Se o tooltip sair por baixo, ajustar para cima
    if (top + tooltipHeight > windowHeight - padding) {
      top = windowHeight - tooltipHeight - padding;
    }
    
    // Se o tooltip sair por cima, ajustar para baixo
    if (top < padding) {
      top = padding;
    }

    return (
      <div
        data-custom-tooltip
        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 px-3 py-2.5 z-[9999]"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          maxWidth: '280px',
          pointerEvents: 'auto',
        }}
        onMouseLeave={() => {
          // Fechar tooltip quando o mouse sair dele
          setCustomTooltip(null);
        }}
      >
        <div className="font-semibold text-gray-900 mb-2 text-sm">{periodData.period_label}</div>
        <div className="mb-2.5 space-y-0.5">
          {uniqueProducts.length > 0 ? (
            <>
              {uniqueProducts.slice(0, 2).map((product, idx) => (
                <div key={idx} className="text-xs text-gray-600 truncate" title={product}>
                  {truncateProduct(product)}
                </div>
              ))}
              {uniqueProducts.length > 2 && (
                <div className="text-xs text-gray-400">...</div>
              )}
            </>
          ) : (
            <div className="text-xs text-gray-500">Sem produtos</div>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Receita:</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(revenue)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm text-gray-600">Custo:</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(cost)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Lucro:</span>
            <span className={`text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profit)}
            </span>
          </div>
        </div>
        {firstOrder && (
          <button
            onClick={() => {
              // Garantir que sempre temos um nome de loja válido
              let storeName = 'Mercado Livre'; // Default
              
              if (firstOrder.marketplace_name) {
                const trimmed = firstOrder.marketplace_name.trim();
                if (trimmed !== '' && trimmed !== 'Sem loja') {
                  storeName = trimmed;
                }
              }
              
              handleDeleteClick(
                firstOrder.order_id,
                firstOrder.order_number,
                storeName
              );
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Métrica
          </button>
        )}
      </div>
    );
  };

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
      enabled: false, // Desabilitar tooltip padrão do ApexCharts
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza de que você quer excluir essa métrica?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é irreversível. O pedido {orderToDelete?.number} da loja {orderToDelete?.store} será permanentemente excluído do sistema.
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
        <div className="relative">
          <Chart options={chartOptions} series={chartSeries} type="area" height={300} />
          {renderCustomTooltip()}
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
