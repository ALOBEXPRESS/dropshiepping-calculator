import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, DollarSign, Info } from 'lucide-react';
import { useProfitAnalysis } from '@/hooks/sales/useProfitAnalysis';

interface ProfitAnalysisCardProps {
  organizationId: string;
  refreshTrigger?: number;
}

export const ProfitAnalysisCard: React.FC<ProfitAnalysisCardProps> = ({
  organizationId,
  refreshTrigger,
}) => {
  const { data, loading } = useProfitAnalysis(organizationId, refreshTrigger);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  const isPositiveMargin = data.profitMargin > 20;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Análise de Lucro
          </h3>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">Análise detalhada da estrutura de custos e lucro</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-4">
        {/* Lucro Total */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Lucro Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(data.totalProfit)}
            </p>
          </div>
          <Badge
            variant={isPositiveMargin ? 'default' : 'secondary'}
            className={`gap-1 ${
              isPositiveMargin
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            } hover:bg-green-100 dark:hover:bg-green-900/30`}
          >
            {isPositiveMargin ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {formatPercentage(data.profitMargin)}
          </Badge>
        </div>

        {/* Breakdown de Custos */}
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Breakdown de Custos:
          </p>

          {/* Custo de Produto */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Custo de Produto</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(data.totalCost)} ({formatPercentage(data.costPercentage)})
              </span>
            </div>
            <Progress value={data.costPercentage} className="h-2 bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                style={{ width: `${data.costPercentage}%` }}
              />
            </Progress>
          </div>

          {/* Comissões */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Comissões</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(data.totalCommissions)} ({formatPercentage(data.commissionPercentage)})
              </span>
            </div>
            <Progress value={data.commissionPercentage} className="h-2 bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all"
                style={{ width: `${data.commissionPercentage}%` }}
              />
            </Progress>
          </div>

          {/* Lucro */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Lucro Líquido</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatCurrency(data.totalProfit)} ({formatPercentage(data.profitPercentage)})
              </span>
            </div>
            <Progress value={data.profitPercentage} className="h-2 bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                style={{ width: `${data.profitPercentage}%` }}
              />
            </Progress>
          </div>
        </div>

        {/* Métricas Adicionais */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Frete Total</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatCurrency(data.totalShipping)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Outras Despesas</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatCurrency(data.totalExpenses)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
