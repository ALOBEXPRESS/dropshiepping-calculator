import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Avatar from 'react-avatar';
import { calcOrderProfit } from '@/utils/calcOrderProfit';
import { getSettledOrderProfit } from './revenueCalculations';

interface TransactionsListProps {
  organizationId: string;
  refreshTrigger?: number;
}

interface Transaction {
  id: string;
  order_number?: string;
  virtual_order_number?: string | null;
  order_date: string;
  total_amount: number;
  total_profit: number;
  product_cost: number;
  marketplace_cost: number;
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
        const now = new Date();
        let startDate = new Date();
        let filterDate = true;
        
        switch (period) {
          case 'all':
            filterDate = false;
            break;
          case 'this_week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'this_quarter':
            startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            break;
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        let query = supabase
          .from('orders')
          .select(`
            id,
            order_number,
            order_date,
            created_at,
            total_amount,
            total_cost,
            total_profit,
            status,
            marketplace_commission,
            discount_value,
            shipping_cost,
            other_expenses,
            is_free_sample,
            is_personal_purchase,
            affiliate_id,
            marketplace_id,
            marketplaces!marketplace_id (
              id,
              name,
              commission_rate,
              fixed_fee,
              affiliate_commission_rate
            ),
            leads!lead_id (
              name
            ),
            bling_orders!bling_order_id (
              marketplace_order_number,
              purchase_order_number,
              contact_name,
              total_products,
              base_value,
              tiktok_reembolso_disabled,
              tiktok_retorno_liquido
            ),
            order_items (
              quantity,
              unit_cost,
              unit_price,
              products (
                cost_price,
                supplier_fee_value,
                supplier_fee_type,
                supplier_gateway_fee_value,
                supplier_gateway_fee_type
              )
            )
          `)
          .eq('organization_id', organizationId);

        if (filterDate) {
          query = query.gte('order_date', startDate.toISOString().split('T')[0]);
        }

        const { data: ordersData, error: fetchError } = await query
          .order('order_date', { ascending: false })
          .limit(20);

        if (fetchError) throw fetchError;

        const formattedTransactions: Transaction[] = (ordersData || []).map((order: any) => {
          const bo = Array.isArray(order.bling_orders) ? order.bling_orders[0] : order.bling_orders;
          const mkt = Array.isArray(order.marketplaces) ? order.marketplaces[0] : order.marketplaces;
          const lead = Array.isArray(order.leads) ? order.leads[0] : order.leads;

          const customerName = lead?.name || bo?.contact_name || 'Cliente';
          const marketplaceName = mkt?.name || 'N/A';
          const rawVirtual = bo?.marketplace_order_number || bo?.purchase_order_number || (order.order_number ? String(order.order_number) : null);

          const prods = (order.order_items ?? []).map((it: any) => ({
            quantity: it.quantity,
            unit_cost: it.products?.cost_price ?? it.unit_cost,
            unit_price: it.unit_price,
            supplier_fee_value: it.products?.supplier_fee_value,
            supplier_fee_type: it.products?.supplier_fee_type,
            supplier_gateway_fee_value: it.products?.supplier_gateway_fee_value,
            supplier_gateway_fee_type: it.products?.supplier_gateway_fee_type,
          }));

          const profitInput = {
            order_id: order.id,
            total_amount: order.total_amount,
            total_products: bo?.total_products ?? order.total_amount,
            base_value: bo?.base_value ?? (Number(order.total_amount) - Number(order.discount_value ?? 0)),
            discount_value: order.discount_value,
            shipping_cost: order.shipping_cost,
            other_expenses: order.other_expenses,
            marketplace_commission: order.marketplace_commission,
            commission_rate: mkt?.commission_rate,
            marketplace_fixed_fee: mkt?.fixed_fee,
            fixed_fee: mkt?.fixed_fee,
            affiliate_id: order.affiliate_id,
            affiliate_commission_rate: mkt?.affiliate_commission_rate,
            tiktok_sfp_enabled: mkt?.name?.toLowerCase().includes('tiktok'),
            tiktok_reembolso_disabled: bo?.tiktok_reembolso_disabled === true,
            tiktok_retorno_liquido: bo?.tiktok_retorno_liquido != null ? Number(bo.tiktok_retorno_liquido) : undefined,
            products: prods,
            marketplace: mkt?.name,
          };

          const hasAffiliate = Boolean(order.affiliate_id);
          const profitRes = calcOrderProfit(profitInput, mkt, hasAffiliate);
          const settledOv = getSettledOrderProfit(order.order_number);
          const finalProfit = settledOv !== null 
            ? settledOv 
            : (order.total_profit != null ? Number(order.total_profit) : profitRes.realProfit);

          const productCost = profitRes.effectiveProductCost > 0 
            ? profitRes.effectiveProductCost 
            : (order.total_cost != null && Number(order.total_cost) > 0 ? Number(order.total_cost) : profitRes.totalProductCost);

          const marketplaceCost = profitRes.subtotalMarketplace > 0
            ? profitRes.subtotalMarketplace
            : Math.max(0, Math.round((Number(order.total_amount ?? 0) - productCost - finalProfit) * 100) / 100);

          return {
            id: order.id,
            order_number: order.order_number ? String(order.order_number) : undefined,
            virtual_order_number: rawVirtual ? String(rawVirtual).trim() : null,
            order_date: order.created_at || order.order_date,
            total_amount: Number(order.total_amount ?? 0),
            total_profit: finalProfit,
            product_cost: productCost,
            marketplace_cost: marketplaceCost,
            marketplace_name: marketplaceName,
            customer_name: customerName,
            status: order.status,
          };
        });

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

  const formatVirtualOrderNumber = (num?: string | null) => {
    if (!num) return null;
    const s = String(num).trim();
    if (s.startsWith('NF-chave-')) {
      return `Chave: ${s.replace('NF-chave-', '').slice(0, 14)}...`;
    }
    if (s.startsWith('NF-')) {
      return `NF: #${s.replace('NF-', '')}`;
    }
    if (s.startsWith('Loja:')) {
      return s;
    }
    if (s.startsWith('#')) {
      return `Loja: ${s}`;
    }
    return `Loja: #${s}`;
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
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Avatar
                    name={transaction.customer_name}
                    size="48"
                    round={true}
                    color={getAvatarColor(transaction.customer_name)}
                    maxInitials={2}
                    textSizeRatio={2}
                    className="flex-shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">
                        {transaction.marketplace_name}
                      </p>
                      {transaction.virtual_order_number && (
                        <span
                          className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-medium"
                          title={`Pedido na Loja Virtual: ${transaction.virtual_order_number}`}
                        >
                          {formatVirtualOrderNumber(transaction.virtual_order_number)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {transaction.customer_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80">
                      {formatDate(transaction.order_date)}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right flex-shrink-0 pl-14 sm:pl-0">
                  <div className="flex items-center sm:justify-end gap-2">
                    <p className={`text-base font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositive ? '+' : '-'}{formatCurrency(Math.abs(profit))}
                    </p>
                    <span className="text-[10px] text-muted-foreground bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700/40">
                      {getStatusLabel(transaction.status)}
                    </span>
                  </div>

                  <div className="mt-1 space-y-0.5 text-xs">
                    <p className="text-muted-foreground">
                      Custo Produto(inclui taxas):{' '}
                      <span className="text-foreground font-semibold tabular-nums">
                        {formatCurrency(transaction.product_cost)}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Custo Marketplace:{' '}
                      <span className="text-foreground font-semibold tabular-nums">
                        {formatCurrency(transaction.marketplace_cost)}
                      </span>
                    </p>
                  </div>
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
