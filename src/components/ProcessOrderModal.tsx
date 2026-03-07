import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, TrendingUp, DollarSign, Percent, X } from 'lucide-react';

interface ProcessOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    success: boolean;
    total_profit?: number;
    profit_margin?: number;
    order_number?: string;
  } | null;
}

export const ProcessOrderModal: React.FC<ProcessOrderModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  if (!result) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        {/* Header com gradiente */}
        <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-6 pb-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <DialogTitle className="text-2xl font-bold text-white mb-2">
              Pedido Processado!
            </DialogTitle>
            <DialogDescription className="text-green-50 text-sm">
              O lucro foi calculado e registrado com sucesso
            </DialogDescription>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          {/* Cards de métricas */}
          <div className="grid grid-cols-2 gap-4">
            {/* Lucro */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Lucro Líquido
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(result.total_profit || 0)}
              </p>
            </div>

            {/* Margem */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-gray-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Percent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Margem
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercent(result.profit_margin || 0)}
              </p>
            </div>
          </div>

          {/* Indicador de performance */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                  Excelente performance!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                  Este pedido foi adicionado aos seus relatórios de vendas
                </p>
              </div>
            </div>
          </div>

          {/* Botão de ação */}
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold h-11 shadow-lg shadow-green-500/20"
          >
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
