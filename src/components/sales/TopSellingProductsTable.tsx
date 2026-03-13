import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTopProducts } from '@/hooks/sales/useTopProducts';
import { Loader2, Package, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

interface TopSellingProductsTableProps {
  organizationId: string;
  limit?: number;
  refreshTrigger?: number;
}

export const TopSellingProductsTable: React.FC<TopSellingProductsTableProps> = ({ 
  organizationId, 
  limit = 5,
  refreshTrigger
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { products, loading, error, refetch } = useTopProducts(organizationId, limit * 10); // Buscar mais produtos para paginação

  // Refetch quando refreshTrigger mudar (apenas se for > 0)
  React.useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('🔄 TopSellingProductsTable: refreshTrigger mudou, refazendo query...', refreshTrigger);
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Ordenar produtos por quantidade vendida (descendente)
  const sortedProducts = [...products].sort((a, b) => b.quantity_sold - a.quantity_sold);

  // Calcular total de vendas
  const totalSales = sortedProducts.reduce((sum, product) => sum + product.quantity_sold, 0);

  // Calcular paginação
  const totalPages = Math.ceil(sortedProducts.length / limit);
  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
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
    <Card className="p-6 border-gray-100 dark:border-zinc-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Produtos Mais Vendidos
            </h3>
            {sortedProducts.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalSales} unidades vendidas no total
              </p>
            )}
          </div>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
          Ver Todos
        </button>
      </div>

      {sortedProducts.length > 0 ? (
        <>
          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Ranking
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Vendidos
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Pedidos
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Receita
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map((product, index) => {
                  const globalIndex = startIndex + index;
                  const rankNumber = globalIndex + 1;
                  const isTop3 = globalIndex < 3;
                  
                  // Cores para o ranking baseadas na posição
                  const getRankingStyle = () => {
                    if (globalIndex === 0) return 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-lg shadow-yellow-500/30';
                    if (globalIndex === 1) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900 shadow-lg shadow-gray-400/30';
                    if (globalIndex === 2) return 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30';
                    return 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400';
                  };
                  
                  return (
                  <tr
                    key={product.product_id}
                    className={`border-b border-gray-100 dark:border-zinc-800 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors group ${
                      isTop3 ? 'bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent' : ''
                    }`}
                  >
                    <td className="py-4 px-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-110 ${getRankingStyle()}`}>
                        {rankNumber}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 flex-shrink-0 ring-2 ring-gray-200 dark:ring-zinc-700 group-hover:ring-blue-500 dark:group-hover:ring-blue-400 transition-all">
                          {product.product_image ? (
                            <img
                              src={product.product_image}
                              alt={product.product_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=Produto';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {product.product_name}
                          </p>
                          {product.category && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {product.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(product.price)}
                      </p>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className={`h-1.5 rounded-full transition-all ${
                          isTop3 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-300 dark:bg-zinc-700'
                        }`} style={{ width: `${Math.min((product.quantity_sold / (sortedProducts[0]?.quantity_sold || 1)) * 60, 60)}px` }} />
                        <p className={`text-sm font-bold min-w-[3ch] ${
                          isTop3 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {product.quantity_sold}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {product.total_orders}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(product.total_revenue)}
                      </p>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 transition-all hover:scale-105"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 transition-all hover:scale-105"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-full mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Nenhum produto vendido
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Os produtos aparecerão aqui após as primeiras vendas
          </p>
        </div>
      )}
    </Card>
  );
};
