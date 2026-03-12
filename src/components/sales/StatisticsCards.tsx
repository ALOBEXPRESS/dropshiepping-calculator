import React from 'react';
import { Card } from '@/components/ui/card';
import { useStatisticsCards } from '@/hooks/sales/useStatisticsCards';
import { Package, Users, ShoppingCart, DollarSign, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';

interface StatisticsCardsProps {
  organizationId: string;
  refreshTrigger?: number;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ organizationId, refreshTrigger }) => {
  const { stats, loading, error, refetch } = useStatisticsCards(organizationId);

  // Refetch quando refreshTrigger mudar (apenas se for > 0)
  React.useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('🔄 StatisticsCards: refreshTrigger mudou, refazendo query...', refreshTrigger);
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-center h-24">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center text-red-500 py-8">
        {error || 'Erro ao carregar estatísticas'}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Produtos',
      value: formatNumber(stats.total_products),
      change: stats.products_change,
      icon: Package,
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      changeLabel: 'esta semana',
    },
    {
      title: 'Total de Clientes',
      value: formatNumber(stats.total_customers),
      change: stats.customers_change,
      icon: Users,
      iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      changeLabel: 'esta semana',
    },
    {
      title: 'Total de Pedidos',
      value: formatNumber(stats.total_orders),
      change: stats.orders_change,
      icon: ShoppingCart,
      iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600',
      changeLabel: 'esta semana',
    },
    {
      title: 'Total de Vendas',
      value: formatCurrency(stats.total_sales),
      change: stats.sales_change,
      icon: DollarSign,
      iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
      changeLabel: 'esta semana',
      isCurrency: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.change >= 0;
        const changeValue = card.isCurrency ? formatCurrency(Math.abs(card.change)) : formatNumber(Math.abs(card.change));

        return (
          <Card
            key={index}
            className="p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer border-gray-100 dark:border-zinc-800"
          >
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 flex flex-col justify-between h-full">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {card.title}
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {card.value}
                  </h3>
                </div>
                <div className="flex items-center gap-1 mt-auto">
                  {isPositive ? (
                    <>
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-500">
                        +{changeValue}
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-500">
                        {changeValue}
                      </span>
                    </>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    {card.changeLabel}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${card.iconBg} self-start`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
