import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  Download, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  iconColor: string;
}

const KPICard: React.FC<KPICardProps> = ({ 
  label, 
  value, 
  trend, 
  trendLabel,
  icon, 
  iconColor 
}) => {
  const isPositive = trend !== undefined && trend >= 0;
  const trendText = trend !== undefined ? `${isPositive ? 'Aumento' : 'Diminuição'} de ${Math.abs(trend)}%` : '';
  
  return (
    <div 
      className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      role="article"
      aria-label={`${label}: ${value}${trend !== undefined ? `, ${trendText}` : ''}`}
      tabIndex={0}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${iconColor} group-hover:scale-110 transition-transform duration-200`} aria-hidden="true">
          {icon}
        </div>
        {trend !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={isPositive ? "default" : "destructive"}
                  className={`gap-1.5 text-sm font-bold shadow-lg cursor-help ${
                    isPositive 
                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20' 
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                  }`}
                  aria-label={trendText}
                >
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="w-4 h-4" aria-hidden="true" />
                  )}
                  {isPositive ? '+' : ''}{Math.abs(trend)}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Comparado com os últimos 30 dias</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {value}
      </p>
      
      {trendLabel && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {trendLabel}
        </p>
      )}
    </div>
  );
};

interface HeroSectionProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    revenueChange?: number;
    ordersChange?: number;
    customersChange?: number;
    productsChange?: number;
  };
  hasPendingOrders?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  compact?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  stats,
  hasPendingOrders = false,
  onRefresh,
  onExport,
  compact = false,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Header - só aparece quando não é compact */}
      {!compact && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard de Vendas
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Visão completa do desempenho
              </p>
              {!hasPendingOrders && (
                <Badge 
                  variant="default" 
                  className="gap-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                  aria-label="Status: Todos os pedidos foram processados"
                >
                  <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  Tudo processado
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2" role="toolbar" aria-label="Ações do dashboard">
            <DateRangePicker />
            {onExport && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onExport}
                aria-label="Exportar dados do dashboard"
              >
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                Exportar
              </Button>
            )}
            {onRefresh && (
              <Button 
                size="sm" 
                onClick={onRefresh} 
                variant="ghost"
                aria-label="Atualizar dados do dashboard"
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                Atualizar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="region" aria-label="Indicadores principais de desempenho">
        <KPICard
          label="Receita Total"
          value={formatCurrency(stats.totalRevenue)}
          trend={stats.revenueChange}
          trendLabel="vs. período anterior"
          icon={<DollarSign className="w-6 h-6 text-white" />}
          iconColor="from-green-500 to-green-600"
        />
        
        <KPICard
          label="Pedidos"
          value={stats.totalOrders}
          trend={stats.ordersChange}
          trendLabel="esta semana"
          icon={<ShoppingCart className="w-6 h-6 text-white" />}
          iconColor="from-blue-500 to-blue-600"
        />
        
        <KPICard
          label="Clientes"
          value={stats.totalCustomers}
          trend={stats.customersChange}
          trendLabel="esta semana"
          icon={<Users className="w-6 h-6 text-white" />}
          iconColor="from-purple-500 to-purple-600"
        />
        
        <KPICard
          label="Produtos"
          value={stats.totalProducts}
          trend={stats.productsChange}
          trendLabel="esta semana"
          icon={<Package className="w-6 h-6 text-white" />}
          iconColor="from-orange-500 to-orange-600"
        />
      </div>
    </div>
  );
};
