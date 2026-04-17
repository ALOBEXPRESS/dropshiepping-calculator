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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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


interface OrderDetail {
  order_id: string;
  order_number: string;
  marketplace: string;
  customer_name?: string;
  product_name?: string;
  product_sku?: string;
  products?: { name: string; sku?: string }[];
  total_amount: number;
  total_cost: number;
  product_cost_price?: number;
  marketplace_commission: number;
  commission_rate: number;
  shipping_cost: number;
  other_expenses: number;
  supplier_fee_value?: string;
  supplier_fee_type?: string;
  supplier_gateway_fee_value?: string;
  supplier_gateway_fee_type?: string;
  total_profit: number;
}

export const RevenueReportChart: React.FC<RevenueReportChartProps> = ({ organizationId, refreshTrigger }) => {
  const [period, setPeriod] = useState<PeriodFilter>('monthly');
  const { data, loading, error, refetch } = useRevenueReport(organizationId, period);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; number: string; store: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  
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

  // Adicionar event listeners para os botões de excluir e detalhar no tooltip
  useEffect(() => {
    const handleTooltipClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Botão de excluir
      const deleteButton = target.closest('[data-delete-order-btn]') as HTMLElement;
      if (deleteButton) {
        e.preventDefault();
        e.stopPropagation();
        
        const orderId = deleteButton.getAttribute('data-order-id');
        const orderNumber = deleteButton.getAttribute('data-order-number');
        const orderStore = deleteButton.getAttribute('data-order-store');
        
        if (orderId && orderNumber && orderStore) {
          setOrderToDelete({ id: orderId, number: orderNumber, store: orderStore });
          setDeleteDialogOpen(true);
        }
        return;
      }

      // Botão de detalhar
      const detailButton = target.closest('[data-detail-order-btn]') as HTMLElement;
      if (detailButton) {
        e.preventDefault();
        e.stopPropagation();
        
        const orderDataStr = detailButton.getAttribute('data-order-detail');
        if (orderDataStr) {
          try {
            const orderData = JSON.parse(orderDataStr);
            setSelectedOrder(orderData);
            setDetailDialogOpen(true);
          } catch (err) {
            console.error('Error parsing order data:', err);
          }
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

        const allProducts = periodData.orders_data?.flatMap((order: { products?: { name: string }[]; marketplace?: string }) =>
          order.products?.map((p: { name: string }) => p.name) || []
        ) || [];
        const uniqueProducts = [...new Set(allProducts)] as string[];

        const profitColor = profit >= 0 ? '#16a34a' : '#dc2626';

        const productLines = uniqueProducts.length > 0
          ? uniqueProducts.slice(0, 2).map(p =>
              `<div style="font-size:11px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px">${p.length > 35 ? p.substring(0, 35) + '...' : p}</div>`
            ).join('') + (uniqueProducts.length > 2 ? '<div style="font-size:11px;color:#9ca3af">...</div>' : '')
          : '<div style="font-size:11px;color:#9ca3af">Sem produtos</div>';

        // Criar lista de pedidos com botão detalhar e excluir
        const ordersHtml = periodData.orders_data?.map((order) => {
          const marketplaceName = order.marketplace && order.marketplace !== 'null' && order.marketplace !== 'undefined'
            ? order.marketplace 
            : 'Sem marketplace';
          const customerName = (order as { customer_name?: string }).customer_name || 'Cliente não identificado';
          const orderNumber = order.order_number || 'S/N';
          
          // Nome do produto: usa product_name da SQL (novo campo) ou products[]
          const productNamesFromItems = (order.products || [])
            .map((p: { name: string }) => p.name)
            .filter(Boolean) as string[];
          const mainProductName = (order as { product_name?: string }).product_name || productNamesFromItems[0] || 'Produto não vinculado';
          const productCount = productNamesFromItems.length;

          // SKU do produto
          const productSku = (order as { product_sku?: string }).product_sku || 
            ((order.products || [])[0] as { sku?: string })?.sku || 
            null;

          const safeStore = order.marketplace && order.marketplace !== 'null' && order.marketplace !== 'undefined'
            ? order.marketplace
            : 'Sem marketplace';

          // Dados financeiros do pedido
          const orderRevenue = Number(order.total_amount ?? 0);
          const orderProfit = Number(order.total_profit ?? 0);
          const profitColor = orderProfit >= 0 ? '#16a34a' : '#dc2626';

          // Preparar dados completos do pedido para o modal
          const orderDetailData: OrderDetail = {
            order_id: order.order_id,
            order_number: orderNumber,
            marketplace: marketplaceName,
            customer_name: customerName,
            product_name: mainProductName,
            product_sku: productSku || undefined,
            products: order.products,
            total_amount: orderRevenue,
            total_cost: Number(order.total_cost ?? 0),
            product_cost_price: Number((order as { product_cost_price?: number }).product_cost_price ?? 0),
            marketplace_commission: Number(order.marketplace_commission ?? 0),
            commission_rate: Number(order.commission_rate ?? 0),
            shipping_cost: Number(order.shipping_cost ?? 0),
            other_expenses: Number(order.other_expenses ?? 0),
            supplier_fee_value: (order as { supplier_fee_value?: string }).supplier_fee_value,
            supplier_fee_type: (order as { supplier_fee_type?: string }).supplier_fee_type,
            supplier_gateway_fee_value: (order as { supplier_gateway_fee_value?: string }).supplier_gateway_fee_value,
            supplier_gateway_fee_type: (order as { supplier_gateway_fee_type?: string }).supplier_gateway_fee_type,
            total_profit: orderProfit,
          };
          
          return `
            <div style="padding:8px 0;border-top:1px solid #f3f4f6;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">
                <div style="flex:1;min-width:0">
                  <div style="font-size:11px;color:#374151;font-weight:600;margin-bottom:2px">
                    ${customerName}
                  </div>
                  <div style="font-size:10px;color:#6b7280;margin-bottom:2px">
                    🏪 ${marketplaceName} • Pedido #${orderNumber}
                  </div>
                  <div style="font-size:10px;color:#374151;margin-bottom:2px">
                    📦 ${mainProductName.length > 30 ? mainProductName.substring(0, 30) + '...' : mainProductName}
                    ${productSku ? ` (SKU: ${productSku})` : ''}
                  </div>
                  ${productCount > 1 ? `<div style="font-size:10px;color:#9ca3af">+${productCount - 1} produto(s)</div>` : ''}
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
                  <button 
                    data-detail-order-btn
                    data-order-detail='${JSON.stringify(orderDetailData).replace(/'/g, "&apos;")}'
                    style="background:#3b82f6;color:white;border:none;border-radius:4px;padding:4px 8px;font-size:10px;cursor:pointer;font-weight:500;transition:background 0.2s;white-space:nowrap;"
                    onmouseover="this.style.background='#2563eb'"
                    onmouseout="this.style.background='#3b82f6'"
                  >
                    Detalhar
                  </button>
                  <button 
                    data-delete-order-btn
                    data-order-id="${order.order_id}"
                    data-order-number="${orderNumber}"
                    data-order-store="${safeStore}"
                    style="background:#ef4444;color:white;border:none;border-radius:4px;padding:4px 8px;font-size:10px;cursor:pointer;font-weight:500;transition:background 0.2s;white-space:nowrap;"
                    onmouseover="this.style.background='#dc2626'"
                    onmouseout="this.style.background='#ef4444'"
                  >
                    Excluir
                  </button>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:11px;padding-top:4px;border-top:1px dashed #e5e7eb">
                <span style="color:#6b7280">Lucro:</span>
                <span style="font-weight:700;color:${profitColor}">${formatCurrency(orderProfit)}</span>
              </div>
            </div>
          `;
        }).join('') || '';

        return `
          <div class="apexcharts-tooltip-custom" style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;box-shadow:0 4px 16px rgba(0,0,0,0.12);min-width:260px;max-width:360px;pointer-events:auto;">
            <div style="font-weight:600;color:#111827;margin-bottom:6px;font-size:13px">${periodData.period_label}</div>
            <div style="margin-bottom:8px">${productLines}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:10px;height:10px;border-radius:50%;background:#45B369"></div>
                <span style="font-size:12px;color:#6b7280">Receita total:</span>
              </div>
              <span style="font-size:12px;font-weight:600;color:#111827">${formatCurrency(revenue)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:10px;height:10px;border-radius:50%;background:#EF4A00"></div>
                <span style="font-size:12px;color:#6b7280">Custo total:</span>
              </div>
              <span style="font-size:12px;font-weight:600;color:#111827">${formatCurrency(cost)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid #e5e7eb;margin-bottom:6px">
              <span style="font-size:12px;font-weight:500;color:#374151">Lucro total:</span>
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
      {/* Dialog de detalhes do pedido */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Pedido #{selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Informações do pedido */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cliente</p>
                  <p className="text-sm font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Marketplace</p>
                  <p className="text-sm font-medium">{selectedOrder.marketplace}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Produto</p>
                  <p className="text-sm font-medium">{selectedOrder.product_name}</p>
                  {selectedOrder.product_sku && (
                    <p className="text-xs text-gray-500">SKU: {selectedOrder.product_sku}</p>
                  )}
                </div>
                {selectedOrder.products && selectedOrder.products.length > 1 && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Produtos adicionais</p>
                    <p className="text-sm font-medium">+{selectedOrder.products.length - 1} produto(s)</p>
                  </div>
                )}
              </div>

              {/* Resumo financeiro */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>💰 Preço de venda</span>
                  <span className="text-green-600">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {/* Custo do Produto */}
              <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                  📦 Custo do Produto
                </h3>
                
                <div className="space-y-2 pl-4">
                  {(selectedOrder.product_cost_price ?? 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Custo base do produto</span>
                      <span className="font-medium text-red-600">-{formatCurrency(selectedOrder.product_cost_price ?? 0)}</span>
                    </div>
                  )}
                  
                  {selectedOrder.supplier_fee_value && Number(selectedOrder.supplier_fee_value) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Taxa do fornecedor
                        {selectedOrder.supplier_fee_type === 'percent' && ` (${selectedOrder.supplier_fee_value}%)`}
                      </span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(
                          selectedOrder.supplier_fee_type === 'percent'
                            ? (selectedOrder.total_amount * Number(selectedOrder.supplier_fee_value)) / 100
                            : Number(selectedOrder.supplier_fee_value)
                        )}
                      </span>
                    </div>
                  )}
                  
                  {selectedOrder.supplier_gateway_fee_value && Number(selectedOrder.supplier_gateway_fee_value) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Gateway do fornecedor
                        {selectedOrder.supplier_gateway_fee_type === 'percent' && ` (${selectedOrder.supplier_gateway_fee_value}%)`}
                      </span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(
                          selectedOrder.supplier_gateway_fee_type === 'fixed'
                            ? Number(selectedOrder.supplier_gateway_fee_value)
                            : (selectedOrder.total_amount * Number(selectedOrder.supplier_gateway_fee_value)) / 100
                        )}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-red-300 dark:border-red-700">
                    <span>Subtotal Custo Produto</span>
                    <span className="text-red-600">
                      -{formatCurrency(
                        (selectedOrder.product_cost_price ?? 0) +
                        (selectedOrder.supplier_fee_value
                          ? selectedOrder.supplier_fee_type === 'percent'
                            ? (selectedOrder.total_amount * Number(selectedOrder.supplier_fee_value)) / 100
                            : Number(selectedOrder.supplier_fee_value)
                          : 0) +
                        (selectedOrder.supplier_gateway_fee_value
                          ? selectedOrder.supplier_gateway_fee_type === 'fixed'
                            ? Number(selectedOrder.supplier_gateway_fee_value)
                            : (selectedOrder.total_amount * Number(selectedOrder.supplier_gateway_fee_value)) / 100
                          : 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custo Marketplace */}
              <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                <h3 className="font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                  🏪 Custo Marketplace ({selectedOrder.marketplace})
                </h3>
                
                <div className="space-y-2 pl-4">
                  {selectedOrder.marketplace_commission > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Comissão
                        {selectedOrder.commission_rate > 0 && ` (${selectedOrder.commission_rate}%)`}
                      </span>
                      <span className="font-medium text-orange-600">-{formatCurrency(selectedOrder.marketplace_commission)}</span>
                    </div>
                  )}
                  
                  {selectedOrder.shipping_cost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Frete</span>
                      <span className="font-medium text-orange-600">-{formatCurrency(selectedOrder.shipping_cost)}</span>
                    </div>
                  )}
                  
                  {selectedOrder.other_expenses > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Outras despesas</span>
                      <span className="font-medium text-orange-600">-{formatCurrency(selectedOrder.other_expenses)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-orange-300 dark:border-orange-700">
                    <span>Subtotal Custo Marketplace</span>
                    <span className="text-orange-600">
                      -{formatCurrency(
                        selectedOrder.marketplace_commission +
                        selectedOrder.shipping_cost +
                        selectedOrder.other_expenses
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lucro Final */}
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Lucro Real</span>
                  <span className={selectedOrder.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(selectedOrder.total_profit)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Margem: {((selectedOrder.total_profit / selectedOrder.total_amount) * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
