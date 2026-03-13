import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import { useCustomerLifetimeValue } from '@/hooks/sales/useCustomerLifetimeValue';

interface CustomerLTVDashboardProps {
  organizationId: string;
  refreshTrigger?: number;
}

export const CustomerLTVDashboard: React.FC<CustomerLTVDashboardProps> = ({
  organizationId,
  refreshTrigger,
}) => {
  const { data, loading } = useCustomerLifetimeValue(organizationId, refreshTrigger);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Customer Lifetime Value
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Análise de valor dos clientes
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-gray-600 dark:text-gray-400">LTV Médio</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(data.avgLifetimeValue)}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-900/10">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-green-600 dark:text-green-400" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Ticket Médio</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(data.avgOrderValue)}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-900/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Pedidos/Cliente</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {data.avgOrdersPerCustomer.toFixed(1)}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-900/10">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <p className="text-xs text-gray-600 dark:text-gray-400">Taxa Recompra</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatPercentage(data.repeatCustomerRate)}
          </p>
        </div>
      </div>

      {/* Top Customers */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Top 10 Clientes VIP
        </h4>
        <div className="space-y-3">
          {data.topCustomers.slice(0, 5).map((customer) => (
            <div
              key={customer.id}
              className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex-shrink-0">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold">
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {customer.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {customer.email}
                </p>
              </div>

              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(customer.totalSpent)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {customer.totalOrders} pedidos
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(customer.lastOrderDate)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
