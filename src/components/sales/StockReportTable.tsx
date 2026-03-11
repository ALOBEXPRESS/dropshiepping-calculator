import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStockReport } from '@/hooks/sales/useStockReport';
import { Loader2, AlertTriangle, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface StockReportTableProps {
  organizationId: string;
}

export const StockReportTable: React.FC<StockReportTableProps> = ({ organizationId }) => {
  const { stock, loading, error } = useStockReport(organizationId);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Ordenar por quantidade de estoque (maior primeiro)
  const sortedStock = [...stock].sort((a, b) => b.stock_quantity - a.stock_quantity);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Out of Stock':
        return {
          label: 'Esgotado',
          color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          icon: XCircle,
          barColor: 'bg-red-500',
        };
      case 'Low Stock':
        return {
          label: 'Estoque Baixo',
          color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
          icon: AlertTriangle,
          barColor: 'bg-yellow-500',
        };
      default:
        return {
          label: 'Disponível',
          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          icon: CheckCircle,
          barColor: 'bg-green-500',
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

  // Paginação
  const totalPages = Math.ceil(sortedStock.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedStock.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Card className="p-6 border-gray-100 dark:border-zinc-800 flex flex-col h-full w-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Relatório de Estoque
        </h3>
        {sortedStock.length > itemsPerPage && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Página {currentPage} de {totalPages}
          </span>
        )}
      </div>

      {sortedStock.length > 0 ? (
        <>
          <div className="space-y-6 flex-1">
            {currentItems.map((item, index) => {
              const statusConfig = getStatusConfig(item.stock_status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={index}
                  className="flex flex-col gap-4 p-5 rounded-lg bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                        {item.product_name}
                      </p>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {formatCurrency(item.price)}
                      </p>
                    </div>

                    <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap flex-shrink-0 ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {item.stock_quantity} un.
                      </span>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {item.stock_percentage}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusConfig.barColor} transition-all duration-300`}
                        style={{ width: `${item.stock_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {sortedStock.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800">
              <Button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {startIndex + 1}-{Math.min(endIndex, sortedStock.length)} de {sortedStock.length}
              </span>
              <Button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum produto cadastrado
          </p>
        </div>
      )}
    </Card>
  );
};
