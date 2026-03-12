import React from 'react';
import { Card } from '@/components/ui/card';
import { useTopCustomers } from '@/hooks/sales/useTopCustomers';
import { Loader2, User, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TopCustomersListProps {
  organizationId: string;
  limit?: number;
  refreshTrigger?: number;
}

export const TopCustomersList: React.FC<TopCustomersListProps> = ({ 
  organizationId, 
  limit = 6,
  refreshTrigger
}) => {
  const { customers, loading, error, refetch } = useTopCustomers(organizationId, limit);

  // Refetch quando refreshTrigger mudar (apenas se for > 0)
  React.useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('🔄 TopCustomersList: refreshTrigger mudou, refazendo query...', refreshTrigger);
      refetch();
    }
  }, [refreshTrigger, refetch]);

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
          Top Clientes
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver Todos
        </button>
      </div>

      {customers.length > 0 ? (
        <div className="space-y-4">
          {customers.map((customer) => (
            <div
              key={customer.customer_id}
              className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors rounded-lg px-2"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-white">
                  {customer.customer_name.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {customer.customer_name}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {customer.customer_email && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{customer.customer_email}</span>
                    </div>
                  )}
                  {customer.customer_phone && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Phone className="w-3 h-3" />
                      <span>{customer.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {customer.total_orders} {customer.total_orders === 1 ? 'pedido' : 'pedidos'}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {formatCurrency(customer.total_spent)}
                </p>
                {customer.last_order_date && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Último: {formatDate(customer.last_order_date)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <User className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum cliente encontrado
          </p>
        </div>
      )}
    </Card>
  );
};
