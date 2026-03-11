import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Avatar from 'react-avatar';

interface TransactionsListProps {
  organizationId: string;
}

interface Transaction {
  id: string;
  order_date: string;
  total_amount: number;
  marketplace_name: string;
  customer_name: string;
  status: string;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({ organizationId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('this_month');

  // Cores aleatórias para avatares
  const avatarColors = [
    '#4F46E5', // Indigo
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
  ];

  const getAvatarColor = (name: string) => {
    // Gerar cor baseada no nome para consistência
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!organizationId) return;

      setLoading(true);
      setError(null);

      try {
        const startDate = new Date();
        
        switch (period) {
          case 'this_week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'this_month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'this_quarter':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
          default:
            startDate.setMonth(startDate.getMonth() - 1);
        }

        const { data: ordersData, error: fetchError } = await supabase
          .from('orders')
          .select(`
            id,
            order_date,
            total_amount,
            status,
            lead_id,
            marketplace_id,
            leads!lead_id (
              name
            ),
            marketplaces!marketplace_id (
              name
            )
          `)
          .eq('organization_id', organizationId)
          .gte('order_date', startDate.toISOString())
          .order('order_date', { ascending: false })
          .limit(10);

        if (fetchError) throw fetchError;

        const formattedTransactions: Transaction[] = (ordersData || []).map((order) => ({
          id: order.id,
          order_date: order.order_date,
          total_amount: Number(order.total_amount),
          marketplace_name: (order.marketplaces as { name?: string })?.name || 'N/A',
          customer_name: (order.leads as { name?: string })?.name || 'Cliente',
          status: order.status,
        }));

        setTransactions(formattedTransactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar transações');
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [organizationId, period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMM, HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'cancelled':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Concluído',
      pending: 'Pendente',
      cancelled: 'Cancelado',
      processing: 'Processando',
    };
    return labels[status] || status;
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
    <Card className="p-6 border-gray-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transações</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px] border-gray-200 dark:border-zinc-800">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_week">Esta Semana</SelectItem>
            <SelectItem value="this_month">Este Mês</SelectItem>
            <SelectItem value="this_quarter">Este Trimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const isPositive = transaction.status === 'completed';

            return (
              <div
                key={transaction.id}
                className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0"
              >
                <Avatar
                  name={transaction.customer_name}
                  size="48"
                  round={true}
                  color={getAvatarColor(transaction.customer_name)}
                  maxInitials={2}
                  textSizeRatio={2}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {transaction.marketplace_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {transaction.customer_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(transaction.order_date)}
                  </p>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-bold ${getStatusColor(transaction.status)}`}>
                    {isPositive ? '+' : ''}{formatCurrency(transaction.total_amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getStatusLabel(transaction.status)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center mb-3">
            <span className="text-2xl text-gray-400">💳</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhuma transação encontrada
          </p>
        </div>
      )}
    </Card>
  );
};
