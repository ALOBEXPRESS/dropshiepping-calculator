import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTopProducts } from '@/hooks/sales/useTopProducts';
import { Loader2, Package, ChevronLeft, ChevronRight } from 'lucide-react';

interface TopSellingProductsTableProps {
  organizationId: string;
  limit?: number;
}

export const TopSellingProductsTable: React.FC<TopSellingProductsTableProps> = ({ 
  organizationId, 
  limit = 5 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { products, loading, error } = useTopProducts(organizationId, limit * 10); // Buscar mais produtos para paginação

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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Produtos Mais Vendidos
        </h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver Todos
        </button>
      </div>

      {sortedProducts.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total de Vendas: <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{totalSales}</span> unidades
          </p>
        </div>
      )}

      {sortedProducts.length > 0 ? (
        <>
          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800">
                  <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Produto
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Preço
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Vendidos
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Pedidos
                  </th>
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Receita
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map((product, index) => {
                  const globalIndex = startIndex + index;
                  const isTop3 = globalIndex < 3;
                  const badges = ['🥇', '🥈', '🥉'];
                  
                  return (
                  <tr
                    key={product.product_id}
                    className={`border-b border-gray-100 dark:border-zinc-800 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors ${
                      isTop3 ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''
                    }`}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        {isTop3 && (
                          <span className="text-2xl flex-shrink-0">{badges[globalIndex]}</span>
                        )}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 flex-shrink-0">
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
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
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
                    <td className="py-3 px-2 text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(product.price)}
                      </p>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <p className={`text-sm font-bold ${isTop3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}`}>
                        {product.quantity_sold}
                      </p>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {product.total_orders}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
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
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8"
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
          <Package className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum produto vendido ainda
          </p>
        </div>
      )}
    </Card>
  );
};
