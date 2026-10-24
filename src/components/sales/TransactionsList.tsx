import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Loader2, ChevronLeft, ChevronRight, Search, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Avatar from 'react-avatar';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { calcOrderProfit } from '@/utils/calcOrderProfit';
import { getSettledOrderProfit } from './revenueCalculations';
import { cn } from '@/lib/utils';

interface TransactionsListProps {
  organizationId: string;
  refreshTrigger?: number;
  onOrderClick?: (orderId: string) => void;
  onOrderDeleted?: () => void;
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
  product_names: string[];
  is_repasse_bloqueado?: boolean;
}

const PAGE_SIZE = 6;

export const TransactionsList: React.FC<TransactionsListProps> = ({
  organizationId,
  refreshTrigger,
  onOrderClick,
  onOrderDeleted,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('this_month');
  const [selectedMarketplace, setSelectedMarketplace] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; number: string; store?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      const orderId = orderToDelete.id;
      const { data: ord } = await supabase
        .from('orders')
        .select('bling_order_id')
        .eq('id', orderId)
        .maybeSingle();

      await supabase.from('order_items').delete().eq('order_id', orderId);
      await supabase.from('campaign_order_costs').delete().eq('order_id', orderId);
      await supabase.from('influencer_free_samples').delete().eq('order_id', orderId);
      await supabase.from('campaign_products').update({ linked_order_id: null }).eq('linked_order_id', orderId);

      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      if (ord?.bling_order_id) {
        await supabase.from('bling_order_items').delete().eq('bling_order_id', ord.bling_order_id);
        await supabase.from('bling_orders').delete().eq('id', ord.bling_order_id);
      }

      setTransactions((prev) => prev.filter((t) => t.id !== orderId));
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      onOrderDeleted?.();
      toast.success('Pedido excluído com sucesso!', {
        description: `O pedido #${orderToDelete.number} foi removido do sistema.`,
      });
    } catch (err) {
      console.error('Erro ao excluir pedido:', err);
      toast.error('Erro ao excluir pedido');
    } finally {
      setDeleting(false);
    }
  };

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

        // 1. Carregar mapeamento de marketplaces da organização
        const { data: mktsData } = await supabase
          .from('marketplaces')
          .select('id, name, commission_rate, fixed_fee, affiliate_commission_rate')
          .eq('organization_id', organizationId);

        const mktMap = new Map<
          string,
          { id: string; name: string; commission_rate?: number; fixed_fee?: number; affiliate_commission_rate?: number }
        >();
        (mktsData || []).forEach((m) => {
          mktMap.set(m.id, m);
        });

        // 2. Buscar pedidos da organização sem limite fixo
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
            is_repasse_bloqueado,
            affiliate_id,
            marketplace_id,
            sales_channel_id,
            bling_order_id,
            sales_channels!sales_channel_id (
              id,
              name,
              marketplace,
              marketplace_id
            ),
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
              id,
              marketplace_order_number,
              purchase_order_number,
              contact_name,
              total_products,
              base_value,
              tiktok_reembolso_disabled,
              tiktok_retorno_liquido
            ),
            order_items (
              product_name,
              quantity,
              unit_cost,
              unit_price,
              products (
                name,
                sku,
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
          .order('order_date', { ascending: false });

        if (fetchError) throw fetchError;

        // 3. Buscar descrições dos produtos de bling_order_items para enriquecer busca
        const blingIds = (ordersData || [])
          .map((o: any) => {
            const bo = Array.isArray(o.bling_orders) ? o.bling_orders[0] : o.bling_orders;
            return bo?.id || o.bling_order_id;
          })
          .filter(Boolean);

        let blingDescMap: Record<string, string[]> = {};
        if (blingIds.length > 0) {
          const { data: blingItems } = await supabase
            .from('bling_order_items')
            .select('order_id, description')
            .in('order_id', blingIds);

          if (blingItems) {
            blingDescMap = blingItems.reduce((acc: Record<string, string[]>, item: { order_id?: string | null; description?: string | null }) => {
              if (item.order_id && item.description) {
                if (!acc[item.order_id]) acc[item.order_id] = [];
                acc[item.order_id].push(item.description);
              }
              return acc;
            }, {});
          }
        }

        const formattedTransactions: Transaction[] = (ordersData || []).map((order: any) => {
          const bo = Array.isArray(order.bling_orders) ? order.bling_orders[0] : order.bling_orders;
          const mkt = Array.isArray(order.marketplaces) ? order.marketplaces[0] : order.marketplaces;
          const sc = Array.isArray(order.sales_channels) ? order.sales_channels[0] : order.sales_channels;
          const lead = Array.isArray(order.leads) ? order.leads[0] : order.leads;

          const customerName = lead?.name || bo?.contact_name || 'Cliente';

          // Resolução robusta do Marketplace
          const mappedFromId = order.marketplace_id ? mktMap.get(order.marketplace_id)?.name : null;
          const scMktMapped = sc?.marketplace_id ? mktMap.get(sc.marketplace_id)?.name : null;
          const marketplaceName =
            mkt?.name ||
            mappedFromId ||
            scMktMapped ||
            sc?.marketplace ||
            sc?.name ||
            order.marketplace_name ||
            'N/A';

          const rawVirtual =
            bo?.marketplace_order_number ||
            bo?.purchase_order_number ||
            (order.order_number ? String(order.order_number) : null);

          // Coleta de nomes de produtos para pesquisa e exibição
          const productNamesList: string[] = [];
          (order.order_items ?? []).forEach((it: any) => {
            if (it.products?.name && !productNamesList.includes(it.products.name)) {
              productNamesList.push(it.products.name);
            }
            if (it.product_name && !productNamesList.includes(it.product_name)) {
              productNamesList.push(it.product_name);
            }
            if (it.products?.sku && !productNamesList.includes(it.products.sku)) {
              productNamesList.push(it.products.sku);
            }
          });

          const blingKey = bo?.id || order.bling_order_id;
          if (blingKey && blingDescMap[blingKey]) {
            blingDescMap[blingKey].forEach((desc) => {
              if (desc && !productNamesList.includes(desc)) {
                productNamesList.push(desc);
              }
            });
          }

          const prods = (order.order_items ?? []).map((it: any) => ({
            quantity: it.quantity,
            unit_cost: it.products?.cost_price ?? it.unit_cost,
            unit_price: it.unit_price,
            supplier_fee_value: it.products?.supplier_fee_value,
            supplier_fee_type: it.products?.supplier_fee_type,
            supplier_gateway_fee_value: it.products?.supplier_gateway_fee_value,
            supplier_gateway_fee_type: it.products?.supplier_gateway_fee_type,
          }));

          const resolvedMkt =
            mkt ||
            (order.marketplace_id ? mktMap.get(order.marketplace_id) : null) ||
            (sc?.marketplace_id ? mktMap.get(sc.marketplace_id) : null);

          const profitInput = {
            order_id: order.id,
            total_amount: order.total_amount,
            total_products: bo?.total_products ?? order.total_amount,
            base_value: bo?.base_value ?? (Number(order.total_amount) - Number(order.discount_value ?? 0)),
            discount_value: order.discount_value,
            shipping_cost: order.shipping_cost,
            other_expenses: order.other_expenses,
            marketplace_commission: order.marketplace_commission,
            commission_rate: resolvedMkt?.commission_rate,
            marketplace_fixed_fee: resolvedMkt?.fixed_fee,
            fixed_fee: resolvedMkt?.fixed_fee,
            affiliate_id: order.affiliate_id,
            affiliate_commission_rate: resolvedMkt?.affiliate_commission_rate,
            tiktok_sfp_enabled: marketplaceName.toLowerCase().includes('tiktok'),
            tiktok_reembolso_disabled: bo?.tiktok_reembolso_disabled === true,
            tiktok_retorno_liquido: bo?.tiktok_retorno_liquido != null ? Number(bo.tiktok_retorno_liquido) : undefined,
            total_cost: order.total_cost,
            total_profit: order.total_profit,
            manual_product_cost: (prods.length === 0 && order.total_cost != null && Number(order.total_cost) > 0) ? Number(order.total_cost) : undefined,
            products: prods,
            marketplace: marketplaceName,
          };

          const hasAffiliate = Boolean(order.affiliate_id);
          const profitRes = calcOrderProfit(profitInput, resolvedMkt, hasAffiliate);
          const hasRetornoLiquido = bo?.tiktok_retorno_liquido != null || (order as { tiktok_retorno_liquido?: number | null }).tiktok_retorno_liquido != null;
          const canonicalSettled = getSettledOrderProfit(order.order_number);
          const savedProfit = order.total_profit != null ? Number(order.total_profit) : null;
          const isCustomized = hasRetornoLiquido || (savedProfit !== null && canonicalSettled !== null && Math.abs(savedProfit - canonicalSettled) > 0.01);
          const settledOv = !isCustomized ? canonicalSettled : null;
          const finalProfit =
            settledOv !== null
              ? settledOv
              : savedProfit !== null
              ? savedProfit
              : profitRes.realProfit;

          const productCost =
            profitRes.effectiveProductCost > 0
              ? profitRes.effectiveProductCost
              : order.total_cost != null && Number(order.total_cost) > 0
              ? Number(order.total_cost)
              : profitRes.totalProductCost;

          const marketplaceCost =
            profitRes.subtotalMarketplace > 0
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
            product_names: productNamesList,
            is_repasse_bloqueado: Boolean((order as { is_repasse_bloqueado?: boolean }).is_repasse_bloqueado),
          };
        });

        setTransactions(formattedTransactions);
        setCurrentPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar transações');
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [organizationId, period, refreshTrigger]);

  const availableMarketplaces = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.marketplace_name && t.marketplace_name !== 'N/A') {
        set.add(t.marketplace_name);
      }
    });
    return Array.from(set).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // Filtro por Marketplace
    if (selectedMarketplace !== 'all') {
      result = result.filter(
        (t) => t.marketplace_name?.toLowerCase().trim() === selectedMarketplace.toLowerCase().trim()
      );
    }

    // Busca por Número do Pedido, Pedido na Loja Virtual, Nome do Cliente ou Produto
    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter((t) => {
        const orderNum = (t.order_number || '').toLowerCase();
        const virtualNum = (t.virtual_order_number || '').toLowerCase();
        const customer = (t.customer_name || '').toLowerCase();
        const mktName = (t.marketplace_name || '').toLowerCase();
        const productMatch = (t.product_names || []).some((p) => p.toLowerCase().includes(term));

        return (
          orderNum.includes(term) ||
          virtualNum.includes(term) ||
          customer.includes(term) ||
          mktName.includes(term) ||
          productMatch
        );
      });
    }

    return result;
  }, [transactions, selectedMarketplace, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return filteredTransactions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredTransactions, safePage]);

  const getPageNumbers = (current: number, total: number) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const pageNumbers = getPageNumbers(safePage, totalPages);

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Transações</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Campo de Pesquisa por Pedido, Cliente ou Produto */}
          <div className="relative w-full sm:w-72 md:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nº do pedido, cliente ou produto..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 pl-8 pr-7 text-xs bg-background/60 border-border"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Limpar pesquisa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Marketplace Filter */}
          {availableMarketplaces.length > 1 && (
            <Select
              value={selectedMarketplace}
              onValueChange={(val) => {
                setSelectedMarketplace(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] h-9 text-xs border-border bg-background/60">
                <SelectValue placeholder="Marketplace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Marketplaces</SelectItem>
                {availableMarketplaces.map((mkt) => (
                  <SelectItem key={mkt} value={mkt}>
                    {mkt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Period Filter */}
          <Select
            value={period}
            onValueChange={(val) => {
              setPeriod(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs border-border bg-background/60">
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
      </div>

      {paginatedTransactions.length > 0 ? (
        <div className="space-y-3">
          {paginatedTransactions.map((transaction) => {
            const profit = Number(transaction.total_profit ?? transaction.total_amount ?? 0);
            const isPositive = profit >= 0 && transaction.status !== 'cancelled';

            return (
              <div
                key={transaction.id}
                onClick={() => onOrderClick?.(transaction.id)}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-border/80 last:border-0 transition-colors',
                  onOrderClick && 'cursor-pointer hover:bg-accent/40 rounded-lg px-2.5 -mx-2.5'
                )}
                title={onOrderClick ? 'Clique para abrir os detalhes deste pedido' : undefined}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Avatar
                    name={transaction.customer_name}
                    size="44"
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
                    {transaction.product_names && transaction.product_names.length > 0 && (
                      <p className="text-xs text-zinc-300 truncate mt-0.5 font-medium max-w-[280px] sm:max-w-md" title={transaction.product_names.join(', ')}>
                        📦 {transaction.product_names.slice(0, 2).join(', ')}
                        {transaction.product_names.length > 2 && ` (+${transaction.product_names.length - 2})`}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                      {formatDate(transaction.order_date)}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right flex-shrink-0 pl-14 sm:pl-0">
                  <div className="flex items-center sm:justify-end gap-2">
                    <p
                      className={`text-base font-bold tabular-nums ${
                        transaction.is_repasse_bloqueado
                          ? 'line-through text-red-500 decoration-red-500 decoration-2'
                          : isPositive
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                      title={transaction.is_repasse_bloqueado ? 'A plataforma não irá efetuar o repasse até que a conta seja reativada novamente' : undefined}
                    >
                      {isPositive ? '+' : '-'}{formatCurrency(Math.abs(profit))}
                    </p>
                    <span className="text-[10px] text-muted-foreground bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700/40">
                      {getStatusLabel(transaction.status)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrderToDelete({
                          id: transaction.id,
                          number: transaction.order_number || transaction.virtual_order_number || 'S/N',
                          store: transaction.marketplace_name,
                        });
                        setDeleteDialogOpen(true);
                      }}
                      className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                      title="Excluir este pedido permanentemente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

          {/* Paginação de 6 pedidos por página */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border mt-4">
              <div className="text-xs text-muted-foreground">
                Mostrando{' '}
                <span className="font-semibold text-foreground">
                  {(safePage - 1) * PAGE_SIZE + 1}
                </span>{' '}
                a{' '}
                <span className="font-semibold text-foreground">
                  {Math.min(safePage * PAGE_SIZE, filteredTransactions.length)}
                </span>{' '}
                de <span className="font-semibold text-foreground">{filteredTransactions.length}</span> pedidos
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="h-8 px-2.5 text-xs border-border bg-background/50 hover:bg-accent disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1">
                  {pageNumbers.map((page, idx) =>
                    page === '...' ? (
                      <span key={`dots-${idx}`} className="px-1.5 text-xs text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={`page-${page}`}
                        type="button"
                        variant={safePage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page as number)}
                        className={cn(
                          'h-8 w-8 p-0 text-xs cursor-pointer',
                          safePage === page
                            ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                            : 'border-border bg-background/50 hover:bg-accent text-foreground'
                        )}
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="h-8 px-2.5 text-xs border-border bg-background/50 hover:bg-accent disabled:opacity-40 cursor-pointer"
                >
                  Próxima
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-muted flex items-center justify-center mb-3">
            <span className="text-2xl text-gray-400">💳</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? 'Nenhum pedido encontrado para esta busca' : 'Nenhuma transação encontrada'}
          </p>
        </div>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Você tem certeza que quer excluir o pedido #{orderToDelete?.number}
              {orderToDelete?.store ? ` do marketplace ${orderToDelete.store}` : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é irreversível. O pedido será permanentemente excluído do sistema, incluindo todos os itens relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
