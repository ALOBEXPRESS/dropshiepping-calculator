import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Loader2, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentOrdersTableProps {
  organizationId: string;
  limit?: number;
}

interface Order {
  id: string;
  order_number: string;
  order_date: string;
  total_amount: number;
  status: string;
  customer_name: string;
  customer_email: string;
  items_count: number;
}

export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({ 
  organizationId, 
  limit = 10 
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!organizationId) return;

      setLoading(true);
      setError(null);

      try {
        const { data: ordersData, error: fetchError } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            order_date,
            total_amount,
            status,
            lead_id,
            leads!lead_id (
              name,
              email
            ),
            order_items (
              id
            )
          `)
          .eq('organization_id', organizationId)
          .order('order_date', { ascending: false })
          .limit(limit);

        if (fetchError) throw fetchError;

        const formattedOrders: Order[] = (ordersData || []).map((order) => ({
          id: order.id,
          order_number: order.order_number,
          order_date: order.order_date,
          total_amount: Number(order.total_amount),
          status: order.status,
          customer_name: (order.leads as { name?: string } | null)?.name || 'Cliente',
          customer_email: (order.leads as { email?: string } | null)?.email || '',
          items_count: (order.order_items as Array<{ id: string }> | null)?.length || 0,
        }));

        setOrders(formattedOrders);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
        console.error('Error fetching recent orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [organizationId, limit]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'N/A';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Pago',
          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        };
      case 'pending':
        return {
          label: 'Pendente',
          color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        };
      case 'processing':
        return {
          label: 'Enviado',
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
        };
    }
  };

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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Pedidos Recentes
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver Todos
        </button>
      </div>

      {orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800">
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Cliente
                </th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Pedido
                </th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Itens
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Valor
                </th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusConfig = getStatusConfig(order.status);

                return (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 dark:border-zinc-800 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">
                            {order.customer_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {order.customer_name}
                          </p>
                          {order.customer_email && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {order.customer_email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        #{order.order_number}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(order.order_date)}
                      </p>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 text-sm font-medium text-gray-900 dark:text-white">
                        {order.items_count}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum pedido encontrado
          </p>
        </div>
      )}
    </Card>
  );
};
