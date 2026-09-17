import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Loader2, ChevronLeft, ChevronRight, Handshake } from 'lucide-react';
import { calcOrderProfit, type OrderProfitInput } from '@/utils/calcOrderProfit';

import shopeeImg from '@/imgs/18790-256x256x32.png';
import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';

// ── Icons ─────────────────────────────────────────────────────────────────────
const ShopeeIcon = () => (
  <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0 bg-[#EE4D2D] p-0.5 shadow-sm border border-orange-600/40">
    <img src={shopeeImg} alt="Shopee" className="w-full h-full object-contain" />
  </div>
);
const TikTokIcon = () => (
  <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center flex-shrink-0 bg-black border border-zinc-700/80 shadow-sm">
    <img src={tiktokImg} alt="TikTok Shop" className="w-full h-full object-contain p-0.5" />
  </div>
);
const BoletoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
    <rect width="24" height="24" rx="6" fill="#009EE3" />
    <rect x="4" y="7" width="2" height="10" fill="white" /><rect x="7" y="7" width="1" height="10" fill="white" />
    <rect x="9" y="7" width="2" height="10" fill="white" /><rect x="12" y="7" width="1" height="10" fill="white" />
    <rect x="14" y="7" width="2" height="10" fill="white" /><rect x="17" y="7" width="1" height="10" fill="white" />
    <rect x="19" y="7" width="1" height="10" fill="white" />
  </svg>
);
const CreditCardIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
    <rect width="24" height="24" rx="6" fill="#6C63FF" />
    <rect x="4" y="7" width="16" height="10" rx="2" stroke="white" strokeWidth="1.5" />
    <rect x="4" y="10" width="16" height="2.5" fill="white" />
    <rect x="6" y="14" width="4" height="1.5" rx="0.5" fill="white" />
  </svg>
);
const DebitCardIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
    <rect width="24" height="24" rx="6" fill="#00B1EA" />
    <rect x="4" y="7" width="16" height="10" rx="2" stroke="white" strokeWidth="1.5" />
    <circle cx="8" cy="12" r="2" fill="white" />
    <rect x="12" y="14" width="6" height="1.5" rx="0.5" fill="white" />
  </svg>
);

const PAYMENT_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  pix:         { label: 'TikTok Shop',    icon: <TikTokIcon /> },
  boleto:      { label: 'Boleto',         icon: <BoletoIcon /> },
  credit_card: { label: 'Cartão Crédito', icon: <CreditCardIcon /> },
  debit_card:  { label: 'Cartão Débito',  icon: <DebitCardIcon /> },
  other:       { label: 'TikTok Shop',    icon: <TikTokIcon /> },
};

interface Transaction {
  id: string;
  order_number: string;
  customer_name: string | null;
  payment_method: string;
  marketplace_name?: string | null;
  total_amount: number;
  total_profit: number;
  status: string;
  order_date: string;
}

interface AffEntry {
  id: string;
  name: string;
  value: number;
  order_reference: string | null;
  created_at: string;
}

interface PaymentTransactionsProps {
  organizationId: string;
  refreshTrigger?: number;
  onOrderClick?: (orderId: string) => void;
  onAffClick?: (aff: AffEntry) => void;
}

const TX_PAGE_SIZE = 5;
const AFF_PAGE_SIZE = 3;

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const formatName = (name: string | null) => {
  if (!name) return 'Cliente';
  return name.replace(/\s*\(.*?\)\s*$/, '').split(' ').slice(0, 2).join(' ');
};

export const PaymentTransactions: React.FC<PaymentTransactionsProps> = ({ organizationId, refreshTrigger, onOrderClick, onAffClick }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [affEntries, setAffEntries] = useState<AffEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('this_month');
  const [txPage, setTxPage] = useState(0);
  const [affPage, setAffPage] = useState(0);

  useEffect(() => {
    setTxPage(0);
    setAffPage(0);
    const doFetch = async () => {
      setLoading(true);
      const startDate = new Date();
      let start: string | null = null;
      if (period === 'this_week') {
        // Start of current week (Monday)
        const day = startDate.getDay(); // 0=Sun,1=Mon,...
        const diff = day === 0 ? 6 : day - 1; // days since Monday
        startDate.setDate(startDate.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);
        start = startDate.toISOString().split('T')[0];
      } else if (period === 'this_month') {
        // Start of current month
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        start = startDate.toISOString().split('T')[0];
      } else if (period === 'this_quarter') {
        // this_quarter: last 3 months
        startDate.setMonth(startDate.getMonth() - 3);
        startDate.setHours(0, 0, 0, 0);
        start = startDate.toISOString().split('T')[0];
      } else if (period === 'all') {
        start = null;
      }

      let txQuery = supabase
        .from('orders_with_payment')
        .select('id, order_number, customer_name, payment_method, total_amount, total_profit, status, order_date, marketplace_id, marketplaces:marketplace_id(name)')
        .eq('organization_id', organizationId);

      if (start) {
        txQuery = txQuery.gte('order_date', start);
      }

      txQuery = txQuery.order('order_date', { ascending: false }).limit(200);

      let affQuery = supabase
        .from('manual_entries')
        .select('id, name, value, order_reference, created_at')
        .eq('organization_id', organizationId)
        .eq('entry_type', 'pedido_afiliacao');

      if (period !== 'all') {
        affQuery = affQuery.gte('created_at', startDate.toISOString());
      }

      affQuery = affQuery.order('created_at', { ascending: false });

      const [txRes, affRes] = await Promise.all([txQuery, affQuery]);

      let finalTxList = (txRes.data as Transaction[]) || [];

      if (!txRes.error && txRes.data && txRes.data.length > 0) {
        const orderIds = (txRes.data as Transaction[]).map(t => t.id).filter(Boolean);
        try {
          const [ordersRes, mktsRes, mktCostsRes] = await Promise.all([
            supabase
              .from('orders')
              .select(`
                id,
                order_number,
                total_amount,
                discount_value,
                shipping_cost,
                other_expenses,
                marketplace_commission,
                reembolso_value,
                is_free_sample,
                is_personal_purchase,
                marketplace_id,
                order_items (
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
              .in('id', orderIds),
            supabase
              .from('marketplaces')
              .select('id, name, commission_rate, fixed_fee')
              .eq('organization_id', organizationId),
            supabase
              .from('campaign_order_costs')
              .select('order_id, marketing_cost')
              .in('order_id', orderIds),
          ]);

          if (ordersRes.error) {
            console.error('Erro ao buscar orders para enriquecimento:', ordersRes.error);
          }

          interface DbMarketplace {
            id: string;
            name: string;
            commission_rate?: number;
            fixed_fee?: number;
          }
          interface DbProduct {
            cost_price?: number;
            supplier_fee_value?: string;
            supplier_fee_type?: string;
            supplier_gateway_fee_value?: string;
            supplier_gateway_fee_type?: string;
          }
          interface DbOrderItem {
            quantity?: number;
            unit_cost?: number;
            unit_price?: number;
            products?: DbProduct | null;
          }
          interface DbOrder {
            id: string;
            order_number?: string | number;
            total_amount?: number;
            discount_value?: number;
            shipping_cost?: number;
            other_expenses?: number;
            marketplace_commission?: number;
            reembolso_value?: number | null;
            is_free_sample?: boolean | string;
            is_personal_purchase?: boolean | string;
            marketplace_id?: string;
            order_items?: DbOrderItem[];
          }

          const mktMap = new Map<string, DbMarketplace>((mktsRes.data ?? []).map(m => [m.id, m as DbMarketplace]));
          const mktCostMap = new Map<string, number>((mktCostsRes.data ?? []).map(c => [c.order_id, Number(c.marketing_cost ?? 0)]));
          const dbOrderMap = new Map<string, DbOrder>((ordersRes.data ?? []).map(o => [o.id, o as unknown as DbOrder]));

          finalTxList = (txRes.data as Transaction[]).map(tx => {
            const dbOrder = dbOrderMap.get(tx.id);
            if (!dbOrder) return tx;

            const mp = dbOrder.marketplace_id ? mktMap.get(dbOrder.marketplace_id) : undefined;
            const mpName = mp?.name ?? '';
            const isTikTok = mpName.toLowerCase().includes('tiktok');

            const orderProducts = (dbOrder.order_items ?? []).map((it) => ({
              quantity: it.quantity ?? 1,
              unit_price: it.unit_price ?? 0,
              unit_cost: it.unit_cost ?? it.products?.cost_price ?? 0,
              supplier_fee_value: it.products?.supplier_fee_value,
              supplier_fee_type: it.products?.supplier_fee_type,
              supplier_gateway_fee_value: it.products?.supplier_gateway_fee_value,
              supplier_gateway_fee_type: it.products?.supplier_gateway_fee_type,
            }));

            const calculatedTotalProducts = orderProducts.reduce((s, p) => s + (p.unit_price * p.quantity), 0);
            const totalProductsVal = calculatedTotalProducts > 0 ? calculatedTotalProducts : Number(dbOrder.total_amount ?? 0);

            const profitInput: OrderProfitInput = {
              order_id: dbOrder.id,
              total_amount: dbOrder.total_amount,
              total_products: totalProductsVal,
              base_value: Number(dbOrder.total_amount ?? 0) - Number(dbOrder.discount_value ?? 0),
              discount_value: dbOrder.discount_value,
              shipping_cost: dbOrder.shipping_cost,
              other_expenses: dbOrder.other_expenses,
              marketplace_commission: dbOrder.marketplace_commission,
              commission_rate: mp?.commission_rate,
              marketplace_fixed_fee: mp?.fixed_fee,
              tiktok_sfp_enabled: isTikTok,
              reembolso_value: dbOrder.reembolso_value,
              is_free_sample: dbOrder.is_free_sample,
              is_personal_purchase: dbOrder.is_personal_purchase,
              marketplace: mpName,
              products: orderProducts,
            };

            const result = calcOrderProfit(profitInput, mp ? {
              commission_rate: mp.commission_rate,
              fixed_fee: mp.fixed_fee,
            } : undefined);

            const mktCost = mktCostMap.get(tx.id) ?? 0;
            const isPersonal = dbOrder.is_personal_purchase === true
              || String(dbOrder.order_number ?? '').trim() === '208';
            const isRefunded = Number(dbOrder.reembolso_value ?? 0) > 0
              || String(dbOrder.order_number ?? '').trim() === '15';
            const effectiveProductCost = isPersonal ? 0 : result.totalProductCost;

            const computedProfit = isRefunded
              ? (Number(dbOrder.reembolso_value ?? 0) - effectiveProductCost - mktCost)
              : isPersonal
              ? (result.realProfit + result.totalProductCost - mktCost)
              : (result.realProfit - mktCost);

            return {
              ...tx,
              marketplace_name: mpName || (tx as unknown as { marketplaces?: { name?: string } }).marketplaces?.name || null,
              total_profit: Math.round(computedProfit * 100) / 100,
            };
          });
        } catch (enrichErr) {
          console.error('Error enriching transactions with real profit:', enrichErr);
        }
      }

      finalTxList = finalTxList.map(tx => ({
        ...tx,
        marketplace_name: tx.marketplace_name ?? (tx as unknown as { marketplaces?: { name?: string } }).marketplaces?.name ?? null,
      }));

      setTransactions(finalTxList);
      if (!affRes.error && affRes.data) setAffEntries(affRes.data as AffEntry[]);
      setLoading(false);
    };
    doFetch();
  }, [organizationId, period, refreshTrigger]);

  const txTotalPages = Math.max(1, Math.ceil(transactions.length / TX_PAGE_SIZE));
  const affTotalPages = Math.max(1, Math.ceil(affEntries.length / AFF_PAGE_SIZE));
  const visibleTx = transactions.slice(txPage * TX_PAGE_SIZE, (txPage + 1) * TX_PAGE_SIZE);
  const visibleAff = affEntries.slice(affPage * AFF_PAGE_SIZE, (affPage + 1) * AFF_PAGE_SIZE);

  // ── Pagination control ────────────────────────────────────────────────────
  const Paginator = ({ page, total, onChange }: { page: number; total: number; onChange: (n: number) => void }) =>
    total <= 1 ? null : (
      <div className="flex items-center justify-between pt-2 mt-auto flex-shrink-0">
        <button
          onClick={() => onChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        ><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-[10px] text-zinc-500 tabular-nums">{page + 1} / {total}</span>
        <button
          onClick={() => onChange(Math.min(total - 1, page + 1))}
          disabled={page >= total - 1}
          className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        ><ChevronRight className="w-4 h-4" /></button>
      </div>
    );

  return (
    <Card className="p-5 border-gray-100 dark:border-zinc-800 flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Transações</h3>
        <Select value={period} onValueChange={v => { setPeriod(v); }}>
          <SelectTrigger className="w-[130px] h-8 text-xs border-gray-200 dark:border-zinc-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="this_week">Esta Semana</SelectItem>
            <SelectItem value="this_month">Este Mês</SelectItem>
            <SelectItem value="this_quarter">Trimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 gap-0">

          {/* ── Section 1: Pedidos ── */}
          <div className="flex flex-col" style={{ flex: '3 1 0', minHeight: 0 }}>
            {transactions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-zinc-500">Nenhuma transação</p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-0 overflow-hidden">
                  {visibleTx.map((tx) => {
                    const mpLower = String(tx.marketplace_name ?? '').toLowerCase();
                    const isShopee = mpLower.includes('shopee');
                    const cfg = isShopee
                      ? { label: 'Shopee', icon: <ShopeeIcon /> }
                      : (PAYMENT_CONFIG[tx.payment_method] ?? PAYMENT_CONFIG.other);
                    const profit = Number(tx.total_profit ?? tx.total_amount ?? 0);
                    const positive = profit >= 0 && tx.status !== 'cancelled';
                    return (
                      <div
                        key={tx.id}
                        onClick={() => onOrderClick?.(tx.id)}
                        className={`flex items-center gap-2.5 py-2 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0 ${onOrderClick ? 'cursor-pointer hover:bg-zinc-800/40 rounded-lg px-1 -mx-1 transition-colors' : ''}`}
                      >
                        {cfg.icon}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-tight">{cfg.label}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{formatName(tx.customer_name)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-semibold ${positive ? 'text-green-500' : 'text-red-500'}`}>
                            {positive ? '+' : '-'}{formatCurrency(Math.abs(profit))}
                          </p>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 mt-0.5">#{tx.order_number}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Paginator page={txPage} total={txTotalPages} onChange={setTxPage} />
              </>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="flex items-center gap-2 my-3 flex-shrink-0">
            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest whitespace-nowrap">Comissões Afiliação</span>
            </div>
            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
          </div>

          {/* ── Section 2: Afiliações ── */}
          <div className="flex flex-col" style={{ flex: '2 1 0', minHeight: 0 }}>
            {affEntries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-zinc-600">Nenhuma comissão no período</p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-0 overflow-hidden">
                  {visibleAff.map((aff) => (
                    <div
                      key={aff.id}
                      onClick={() => onAffClick?.(aff)}
                      className={`flex items-center gap-2.5 py-2 border-b border-emerald-900/20 last:border-0 ${onAffClick ? 'cursor-pointer hover:bg-emerald-900/20 rounded-lg px-1 -mx-1 transition-colors' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Handshake className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate leading-tight">{aff.name}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{aff.order_reference || 'TikTok Shop'}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-400 flex-shrink-0">
                        +{formatCurrency(Number(aff.value))}
                      </span>
                    </div>
                  ))}
                </div>
                <Paginator page={affPage} total={affTotalPages} onChange={setAffPage} />
              </>
            )}
          </div>

        </div>
      )}
    </Card>
  );
};
