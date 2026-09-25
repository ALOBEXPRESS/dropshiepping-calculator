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

const Paginator: React.FC<{ page: number; total: number; onChange: (n: number) => void }> = ({ page, total, onChange }) =>
  total <= 1 ? null : (
    <div className="flex items-center justify-between pt-2 mt-auto flex-shrink-0">
      <button
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-white hover:bg-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
      ><ChevronLeft className="w-4 h-4" /></button>
      <span className="text-[10px] text-muted-foreground tabular-nums">{page + 1} / {total}</span>
      <button
        onClick={() => onChange(Math.min(total - 1, page + 1))}
        disabled={page >= total - 1}
        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-white hover:bg-zinc-700 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
      ><ChevronRight className="w-4 h-4" /></button>
    </div>
  );

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
          const [ordersRes, mktsRes, mktCostsRes, productsRes] = await Promise.all([
            supabase
              .from('orders')
              .select(`
                id,
                order_number,
                total_amount,
                total_profit,
                discount_value,
                shipping_cost,
                other_expenses,
                marketplace_commission,
                reembolso_value,
                reembolso_marketplace_enabled,
                reembolso_marketplace_value,
                reembolso_fornecedor_enabled,
                reembolso_fornecedor_value,
                is_free_sample,
                is_personal_purchase,
                marketplace_id,
                bling_order_id,
                bling_orders!bling_order_id (
                  id,
                  total_products,
                  base_value,
                  commission_tax,
                  shipping_cost,
                  tiktok_reembolso_disabled,
                  tiktok_retorno_liquido
                ),
                marketplaces!marketplace_id (
                  id,
                  name,
                  commission_rate,
                  fixed_fee
                ),
                order_items (
                  id,
                  product_id,
                  product_name,
                  sku,
                  quantity,
                  unit_cost,
                  unit_price,
                  products (
                    id,
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
              .select('id, name, commission_rate, fixed_fee'),
            supabase
              .from('campaign_order_costs')
              .select('order_id, marketing_cost')
              .in('order_id', orderIds),
            supabase
              .from('products')
              .select('id, sku, name, cost_price, supplier_fee_value, supplier_fee_type, supplier_gateway_fee_value, supplier_gateway_fee_type')
              .or(`organization_id.eq.${organizationId},organization_id.is.null`),
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
            id?: string;
            sku?: string;
            name?: string;
            cost_price?: number;
            supplier_fee_value?: string | number;
            supplier_fee_type?: string;
            supplier_gateway_fee_value?: string | number;
            supplier_gateway_fee_type?: string;
          }
          interface DbOrderItem {
            id?: string;
            product_id?: string | null;
            product_name?: string | null;
            sku?: string | null;
            quantity?: number;
            unit_cost?: number;
            unit_price?: number;
            products?: DbProduct | null;
          }
          interface DbBlingOrder {
            id?: string;
            total_products?: number | string | null;
            base_value?: number | string | null;
            commission_tax?: number | string | null;
            shipping_cost?: number | string | null;
            tiktok_reembolso_disabled?: boolean | null;
            tiktok_retorno_liquido?: number | null;
          }
          interface DbOrder {
            id: string;
            order_number?: string | number;
            total_amount?: number;
            total_profit?: number | null;
            discount_value?: number;
            shipping_cost?: number;
            other_expenses?: number;
            marketplace_commission?: number;
            reembolso_value?: number | null;
            reembolso_marketplace_enabled?: boolean | null;
            reembolso_marketplace_value?: number | null;
            reembolso_fornecedor_enabled?: boolean | null;
            reembolso_fornecedor_value?: number | null;
            is_free_sample?: boolean | string;
            is_personal_purchase?: boolean | string;
            marketplace_id?: string;
            bling_order_id?: string;
            bling_orders?: DbBlingOrder | DbBlingOrder[] | null;
            marketplaces?: DbMarketplace | null;
            order_items?: DbOrderItem[];
          }

          const mktMap = new Map<string, DbMarketplace>((mktsRes.data ?? []).map(m => [m.id, m as DbMarketplace]));
          const mktByName = new Map<string, DbMarketplace>(
            (mktsRes.data ?? []).map(m => [m.name.toLowerCase().replace(/\s+/g, ''), m as DbMarketplace])
          );
          const mktCostMap = new Map<string, number>((mktCostsRes.data ?? []).map(c => [c.order_id, Number(c.marketing_cost ?? 0)]));
          const dbOrderMap = new Map<string, DbOrder>((ordersRes.data ?? []).map(o => [o.id, o as unknown as DbOrder]));

          const normalizeKey = (raw: string) => {
            const v = raw.trim();
            if (!v) return [];
            const beforeCor = v.split(/\s+Cor:/i)[0]?.trim() ?? '';
            const beforeSemi = v.split(';')[0]?.trim() ?? '';
            const out = [v];
            if (beforeCor && beforeCor !== v) out.push(beforeCor);
            if (beforeSemi && beforeSemi !== v) out.push(beforeSemi);
            return Array.from(new Set(out.filter(Boolean)));
          };

          const productsById = new Map<string, DbProduct>();
          const productsBySku = new Map<string, DbProduct>();
          const productsByName = new Map<string, DbProduct>();

          for (const p of (productsRes.data ?? []) as DbProduct[]) {
            if (p.id) productsById.set(p.id, p);
            if (p.sku) productsBySku.set(p.sku.trim(), p);
            if (p.name) {
              productsByName.set(p.name.trim(), p);
              for (const k of normalizeKey(p.name)) {
                if (!productsByName.has(k)) productsByName.set(k, p);
              }
            }
          }

          finalTxList = (txRes.data as Transaction[]).map(tx => {
            const dbOrder = dbOrderMap.get(tx.id);
            if (!dbOrder) return tx;

            const joinedMp = dbOrder.marketplaces;
            const mappedMp = dbOrder.marketplace_id ? mktMap.get(dbOrder.marketplace_id) : undefined;
            const rawMpName = joinedMp?.name || (tx as unknown as { marketplaces?: { name?: string } }).marketplaces?.name || mappedMp?.name || '';
            const normalizedMp = rawMpName.toLowerCase().replace(/\s+/g, '');
            const namedMp = mktByName.get(normalizedMp);

            const isShopee = rawMpName.toLowerCase().includes('shopee');
            const isTikTok = rawMpName.toLowerCase().includes('tiktok');

            const mp = joinedMp || mappedMp || namedMp;
            const mpName = mp?.name || (isShopee ? 'Shopee' : isTikTok ? 'TikTok Shop' : rawMpName);

            const commissionRate = mp?.commission_rate ?? (isShopee ? 20 : isTikTok ? 10 : 0);
            const fixedFee = mp?.fixed_fee ?? (isShopee ? 4 : 0);

            const orderProducts = (dbOrder.order_items ?? []).map((it) => {
              const candidateKeys = [
                String(it.sku ?? '').trim(),
                ...normalizeKey(String(it.product_name ?? '')),
              ].filter(Boolean);

              const lookup = (it.product_id ? productsById.get(it.product_id) : undefined)
                || candidateKeys.map(k => productsBySku.get(k)).find(Boolean)
                || candidateKeys.map(k => productsByName.get(k)).find(Boolean)
                || it.products;

              const rawUnitCost = Number(it.unit_cost ?? 0);
              const resolvedUnitCost = rawUnitCost > 0 ? rawUnitCost : Number(lookup?.cost_price ?? 0);

              return {
                quantity: it.quantity ?? 1,
                unit_price: it.unit_price ?? 0,
                unit_cost: resolvedUnitCost,
                supplier_fee_value: lookup?.supplier_fee_value != null ? String(lookup.supplier_fee_value) : undefined,
                supplier_fee_type: lookup?.supplier_fee_type != null ? String(lookup.supplier_fee_type) : undefined,
                supplier_gateway_fee_value: lookup?.supplier_gateway_fee_value != null ? String(lookup.supplier_gateway_fee_value) : undefined,
                supplier_gateway_fee_type: lookup?.supplier_gateway_fee_type != null ? String(lookup.supplier_gateway_fee_type) : undefined,
              };
            });

            const calculatedTotalProducts = orderProducts.reduce((s, p) => s + (p.unit_price * p.quantity), 0);
            const bo = Array.isArray(dbOrder.bling_orders) ? dbOrder.bling_orders[0] : dbOrder.bling_orders;
            const boBaseValue = Number(bo?.base_value ?? 0);
            const boTotalProducts = Number(bo?.total_products ?? 0);

            const effectiveTotalProducts = boTotalProducts > 0
              ? boTotalProducts
              : calculatedTotalProducts > 0
              ? calculatedTotalProducts
              : Number(dbOrder.total_amount ?? 0);

            const effectiveBaseValue = boBaseValue > 0
              ? boBaseValue
              : calculatedTotalProducts > 0
              ? calculatedTotalProducts
              : Number(dbOrder.total_amount ?? 0) - Number(dbOrder.discount_value ?? 0);

            const profitInput: OrderProfitInput = {
              order_id: dbOrder.id,
              total_amount: dbOrder.total_amount,
              total_products: effectiveTotalProducts,
              base_value: effectiveBaseValue,
              discount_value: dbOrder.discount_value,
              shipping_cost: dbOrder.shipping_cost,
              other_expenses: dbOrder.other_expenses,
              marketplace_commission: dbOrder.marketplace_commission,
              commission_rate: commissionRate,
              marketplace_fixed_fee: fixedFee,
              fixed_fee: fixedFee,
              tiktok_sfp_enabled: isTikTok,
              tiktok_reembolso_disabled: bo?.tiktok_reembolso_disabled === true,
              tiktok_retorno_liquido: bo?.tiktok_retorno_liquido != null ? Number(bo.tiktok_retorno_liquido) : undefined,
              reembolso_value: dbOrder.reembolso_value,
              reembolso_marketplace_enabled: dbOrder.reembolso_marketplace_enabled != null ? Boolean(dbOrder.reembolso_marketplace_enabled) : undefined,
              reembolso_marketplace_value: dbOrder.reembolso_marketplace_value,
              reembolso_fornecedor_enabled: dbOrder.reembolso_fornecedor_enabled != null ? Boolean(dbOrder.reembolso_fornecedor_enabled) : undefined,
              reembolso_fornecedor_value: dbOrder.reembolso_fornecedor_value,
              is_free_sample: dbOrder.is_free_sample,
              is_personal_purchase: dbOrder.is_personal_purchase,
              marketplace: mpName,
              products: orderProducts,
            };

            const result = calcOrderProfit(profitInput, {
              commission_rate: commissionRate,
              fixed_fee: fixedFee,
            });

            const mktCost = mktCostMap.get(tx.id) ?? 0;
            const hasReembolsoSaved = dbOrder.reembolso_fornecedor_enabled === true || dbOrder.reembolso_marketplace_enabled === true || dbOrder.reembolso_value != null;
            const computedProfit = (hasReembolsoSaved && dbOrder.total_profit != null && !isNaN(Number(dbOrder.total_profit)))
              ? Number(dbOrder.total_profit)
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

  return (
    <Card className="p-5 border-border flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-base font-semibold text-foreground">Transações</h3>
        <Select value={period} onValueChange={v => { setPeriod(v); }}>
          <SelectTrigger className="w-[130px] h-8 text-xs border-gray-200 dark:border-border">
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
                <p className="text-sm text-muted-foreground">Nenhuma transação</p>
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
                        className={`flex items-center gap-2.5 py-2 border-b border-zinc-100 dark:border-border last:border-0 ${onOrderClick ? 'cursor-pointer hover:bg-muted rounded-lg px-1 -mx-1 transition-colors' : ''}`}
                      >
                        {cfg.icon}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate leading-tight">{cfg.label}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{formatName(tx.customer_name)}</p>
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
            <div className="flex-1 h-px bg-zinc-100 dark:bg-muted" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest whitespace-nowrap">Comissões Afiliação</span>
            </div>
            <div className="flex-1 h-px bg-zinc-100 dark:bg-muted" />
          </div>

          {/* ── Section 2: Afiliações ── */}
          <div className="flex flex-col" style={{ flex: '2 1 0', minHeight: 0 }}>
            {affEntries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Nenhuma comissão no período</p>
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
                        <p className="text-sm font-medium text-foreground truncate leading-tight">{aff.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{aff.order_reference || 'TikTok Shop'}</p>
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
