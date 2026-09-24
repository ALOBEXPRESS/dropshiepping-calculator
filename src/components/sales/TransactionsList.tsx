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
  refreshTrigger?: number;
}

interface Transaction {
  id: string;
  order_date: string;
  total_amount: number;
  total_profit: number;
  marketplace_name: string;
  customer_name: string;
  status: string;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({ organizationId, refreshTrigger }) => {
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
        let filterDate = true;
        
        switch (period) {
          case 'all':
            filterDate = false;
            break;
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

        let query = supabase
          .from('orders')
          .select(`
            id,
            order_date,
            total_amount,
            total_profit,
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
          .eq('organization_id', organizationId);

        if (filterDate) {
          query = query.gte('order_date', startDate.toISOString());
        }

        const { data: ordersData, error: fetchError } = await query
          .order('order_date', { ascending: false })
          .limit(10);

        if (fetchError) throw fetchError;

        const formattedTransactions: Transaction[] = (ordersData || []).map((order) => ({
          id: order.id,
          order_date: order.order_date,
          total_amount: Number(order.total_amount),
          total_profit: Number(order.total_profit ?? order.total_amount),
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

    // Só refetch se refreshTrigger for > 0 (ou seja, após processar pedido)
    if (!refreshTrigger || refreshTrigger === 0) {
      fetchTransactions();
    } else if (refreshTrigger > 0) {
      console.log('🔄 TransactionsList: refreshTrigger mudou, refazendo query...', refreshTrigger);
      fetchTransactions();
    }
  }, [organizationId, period, refreshTrigger]);

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
      <Card className="p-6 border-border">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-border">
        <div className="text-center text-red-500 py-8">{error}</div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Transações</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px] border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="this_week">Esta Semana</SelectItem>
            <SelectItem value="this_month">Este Mês</SelectItem>
            <SelectItem value="this_quarter">Este Trimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const profit = Number(transaction.total_profit ?? transaction.total_amount ?? 0);
            const isPositive = profit >= 0 && transaction.status !== 'cancelled';

            return (
              <div
                key={transaction.id}
                className="flex items-center gap-4 py-3 border-b border-border last:border-0"
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
                  <p className="text-sm font-medium text-foreground truncate">
                    {transaction.marketplace_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {transaction.customer_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(transaction.order_date)}
                  </p>
                </div>

                <div className="text-right">
                  <p className={`text-sm font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : '-'}{formatCurrency(Math.abs(profit))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getStatusLabel(transaction.status)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-muted flex items-center justify-center mb-3">
            <span className="text-2xl text-gray-400">💳</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Nenhuma transação encontrada
          </p>
        </div>
      )}
    </Card>
  );
};
