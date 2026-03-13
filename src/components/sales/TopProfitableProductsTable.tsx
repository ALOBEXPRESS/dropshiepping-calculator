import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';
import { useTopProfitableProducts } from '@/hooks/sales/useTopProfitableProducts';

interface TopProfitableProductsTableProps {
  organizationId: string;
  limit?: number;
  refreshTrigger?: number;
}

export const TopProfitableProductsTable: React.FC<TopProfitableProductsTableProps> = ({
  organizationId,
  limit = 6,
  refreshTrigger,
}) => {
  const { products, loading } = useTopProfitableProducts(organizationId, limit, refreshTrigger);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 25) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (margin >= 15) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  const maxProfit = products.length > 0 ? Math.max(...products.map(p => p.totalProfit)) : 0;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Produtos Mais Lucrativos
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ranking por lucro total gerado
            </p>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum produto com lucro registrado ainda
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product, index) => {
            const profitPercentage = maxProfit > 0 ? (product.totalProfit / maxProfit) * 100 : 0;
            const isTopThree = index < 3;

            return (
              <div
                key={index}
                className={`group relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  isTopThree
                    ? 'border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-900/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Ranking Badge */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-110 ${
                      index === 0
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg'
                        : index === 1
                        ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md'
                        : index === 2
                        ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Product Image */}
                  {product.productImageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={product.productImageUrl}
                        alt={product.productName}
                        className="w-12 h-12 rounded-lg object-cover ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-purple-400 transition-all"
                      />
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {product.productName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {product.totalQuantity} vendidos
                      </Badge>
                      <Badge className={`text-xs ${getMarginColor(product.avgMargin)}`}>
                        Margem: {formatPercentage(product.avgMargin)}
                      </Badge>
                    </div>
                  </div>

                  {/* Profit Info */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(product.totalProfit)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Receita: {formatCurrency(product.totalRevenue)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <Progress value={profitPercentage} className="h-1.5 bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all"
                      style={{ width: `${profitPercentage}%` }}
                    />
                  </Progress>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
