import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Loader2, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentOrdersChartProps {
  organizationId: string;
  refreshTrigger?: number;
}

interface OrderData {
  id: string;
  order_number: string;
  order_date: string;
  total_amount: number;
  product_image?: string;
  product_name?: string;
  marketplace?: string;
}

export const RecentOrdersChart: React.FC<RecentOrdersChartProps> = ({ organizationId, refreshTrigger }) => {
  const [data, setData] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return;

      setLoading(true);
      setError(null);

      try {
        // Buscar últimos 5 pedidos com informações de produtos
        const { data: ordersData, error: fetchError } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            order_date,
            total_amount,
            order_items (
              product_id,
              products (
                name,
                image_url
              )
            ),
            sales_channels (
              marketplace
            )
          `)
          .eq('organization_id', organizationId)
          .order('order_date', { ascending: false })
          .limit(5);

        if (fetchError) throw fetchError;

        // Formatar dados
        const formattedData: OrderData[] = (ordersData || []).map((order: { order_items?: Array<{ products?: { image_url?: string; name?: string } }>; id: string; order_number: string; order_date: string; total_amount: number; marketplace?: string }) => {
          const firstItem = order.order_items?.[0];
          const product = firstItem?.products;
          
          return {
            id: order.id,
            order_number: order.order_number,
            order_date: order.order_date,
            total_amount: Number(order.total_amount),
            product_image: product?.image_url,
            product_name: product?.name,
            marketplace: order.sales_channels?.marketplace || 'Mercado Livre',
          };
        });

        setData(formattedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        console.error('Error fetching recent orders:', err);
      } finally {
        setLoading(false);
      }
    };

    // Só refetch se refreshTrigger for > 0 (ou seja, após processar pedido)
    if (!refreshTrigger || refreshTrigger === 0) {
      fetchData();
    } else if (refreshTrigger > 0) {
      console.log('🔄 RecentOrdersChart: refreshTrigger mudou, refazendo query...', refreshTrigger);
      fetchData();
    }
  }, [organizationId, refreshTrigger]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMM, HH:mm", { locale: ptBR });
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.total_amount, 0);

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
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Últimos {data.length} pedidos</p>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="space-y-3">
          {data.map((order) => (
            <div
              key={order.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {/* Imagem do Produto */}
              <div className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200 dark:border-zinc-700">
                {order.product_image ? (
                  <img
                    src={order.product_image}
                    alt={order.product_name || 'Produto'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>';
                    }}
                  />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>

              {/* Informações do Pedido */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Pedido #{order.order_number}
                  </p>
                  <p className="text-sm font-bold text-green-600">
                    {formatCurrency(order.total_amount)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {order.product_name || 'Produto sem nome'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {formatDate(order.order_date)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          <Package className="w-12 h-12 mb-2 opacity-50" />
          <p>Nenhum pedido recente</p>
        </div>
      )}
    </Card>
  );
};
