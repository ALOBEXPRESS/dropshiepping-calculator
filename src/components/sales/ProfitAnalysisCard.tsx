import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, DollarSign, Info, AlertTriangle } from 'lucide-react';
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
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200" role="article" aria-label="Análise de Lucro">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600" aria-hidden="true">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Análise de Lucro
          </h3>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger aria-label="Informações sobre análise de lucro">
              <Info className="w-4 h-4 text-gray-400" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">Análise detalhada da estrutura de custos e lucro</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-4">
        {/* Lucro Total */}
        <div className="flex items-center justify-between" role="region" aria-label="Lucro total e margem">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Lucro Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white" aria-label={`Lucro total: ${formatCurrency(data.totalProfit)}`}>
              {formatCurrency(data.totalProfit)}
            </p>
          </div>
          <Badge
            variant={isPositiveMargin ? 'default' : 'destructive'}
            className={`gap-1.5 text-sm font-bold shadow-lg ${
              isPositiveMargin
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20'
                : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
            }`}
            aria-label={`Margem de lucro: ${formatPercentage(data.profitMargin)}, ${isPositiveMargin ? 'positiva' : 'negativa'}`}
          >
            {isPositiveMargin ? (
              <TrendingUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <TrendingDown className="w-4 h-4" aria-hidden="true" />
            )}
            {formatPercentage(data.profitMargin)}
          </Badge>
        </div>

        {/* Breakdown de Custos */}
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Breakdown de Custos:
          </p>

          {/* Stacked Progress Bar */}
          <div 
            className="relative h-10 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"
            role="img"
            aria-label={`Distribuição de custos: ${data.costPercentage.toFixed(1)}% custo, ${data.commissionPercentage.toFixed(1)}% comissão, ${data.profitPercentage.toFixed(1)}% lucro`}
          >
            {/* Custo */}
            <div 
              className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out flex items-center justify-center"
              style={{ width: `${data.costPercentage}%` }}
            >
              {data.costPercentage > 15 && (
                <span className="text-white text-xs font-semibold">
                  {data.costPercentage.toFixed(1)}%
                </span>
              )}
            </div>
            
            {/* Comissão */}
            <div 
              className="absolute h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-700 ease-out flex items-center justify-center"
              style={{ 
                left: `${data.costPercentage}%`, 
                width: `${data.commissionPercentage}%` 
              }}
            >
              {data.commissionPercentage > 8 && (
                <span className="text-white text-xs font-semibold">
                  {data.commissionPercentage.toFixed(1)}%
                </span>
              )}
            </div>
            
            {/* Lucro */}
            <div 
              className="absolute h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-700 ease-out flex items-center justify-center"
              style={{ 
                left: `${data.costPercentage + data.commissionPercentage}%`, 
                width: `${data.profitPercentage}%` 
              }}
            >
              {data.profitPercentage > 10 && (
                <span className="text-white text-xs font-semibold">
                  {data.profitPercentage.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Custo ({formatPercentage(data.costPercentage)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Comissão ({formatPercentage(data.commissionPercentage)})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Lucro ({formatPercentage(data.profitPercentage)})</span>
            </div>
          </div>

          {/* Detalhes em texto */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
            <div className="text-center p-2 rounded bg-blue-50 dark:bg-blue-900/10">
              <p className="text-gray-600 dark:text-gray-400">Custo</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data.totalCost)}</p>
            </div>
            <div className="text-center p-2 rounded bg-orange-50 dark:bg-orange-900/10">
              <p className="text-gray-600 dark:text-gray-400">Comissão</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(data.totalCommissions)}</p>
            </div>
            <div className="text-center p-2 rounded bg-green-50 dark:bg-green-900/10">
              <p className="text-gray-600 dark:text-gray-400">Lucro</p>
              <p className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(data.totalProfit)}</p>
            </div>
          </div>
        </div>

        {/* Alertas de Margem */}
        {data.profitMargin < 15 && (
          <Alert variant="destructive" className="mt-4 border-2 border-red-500">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">Margem Crítica!</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                Sua margem está em {data.profitMargin.toFixed(1)}%, abaixo do mínimo recomendado (15%).
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="justify-start"
                  aria-label="Ver produtos com pior margem de lucro"
                >
                  <TrendingUp className="w-4 h-4 mr-2" aria-hidden="true" />
                  Ver produtos com pior margem
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="justify-start"
                  aria-label="Ver sugestões para aumentar lucro"
                >
                  <DollarSign className="w-4 h-4 mr-2" aria-hidden="true" />
                  Sugestões para aumentar lucro
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {data.profitMargin >= 15 && data.profitMargin < 20 && (
          <Alert className="mt-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-400">Margem Abaixo do Ideal</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              Margem de {data.profitMargin.toFixed(1)}%. Ideal seria acima de 20% para maior sustentabilidade.
            </AlertDescription>
          </Alert>
        )}

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
