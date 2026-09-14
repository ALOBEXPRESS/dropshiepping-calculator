import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Loader2, ChevronLeft, ChevronRight, Handshake } from 'lucide-react';

// ── Icons ─────────────────────────────────────────────────────────────────────
const PixIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
    <rect width="24" height="24" rx="6" fill="#32BCAD" />
    <path d="M12 5.5l3.18 3.18-1.41 1.41L12 8.32l-1.77 1.77-1.41-1.41L12 5.5zm0 13l-3.18-3.18 1.41-1.41L12 15.68l1.77-1.77 1.41 1.41L12 18.5zm-6.5-6.5l3.18-3.18 1.41 1.41L8.32 12l1.77 1.77-1.41 1.41L5.5 12zm13 0l-3.18 3.18-1.41-1.41L15.68 12l-1.77-1.77 1.41-1.41L18.5 12z" fill="white" />
  </svg>
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
const OtherIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
    <rect width="24" height="24" rx="6" fill="#94A3B8" />
    <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.5" />
  </svg>
);

const PAYMENT_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  pix:         { label: 'Pix',            icon: <PixIcon /> },
  boleto:      { label: 'Boleto',         icon: <BoletoIcon /> },
  credit_card: { label: 'Cartão Crédito', icon: <CreditCardIcon /> },
  debit_card:  { label: 'Cartão Débito',  icon: <DebitCardIcon /> },
  other:       { label: 'Outro',          icon: <OtherIcon /> },
};

interface Transaction {
  id: string;
  order_number: string;
  customer_name: string | null;
  payment_method: string;
  total_amount: number;
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
}

const TX_PAGE_SIZE = 5;
const AFF_PAGE_SIZE = 3;

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const formatName = (name: string | null) => {
  if (!name) return 'Cliente';
  return name.replace(/\s*\(.*?\)\s*$/, '').split(' ').slice(0, 2).join(' ');
};

export const PaymentTransactions: React.FC<PaymentTransactionsProps> = ({ organizationId, refreshTrigger, onOrderClick }) => {
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
      if (period === 'this_week') startDate.setDate(startDate.getDate() - 7);
      else if (period === 'this_month') startDate.setMonth(startDate.getMonth() - 1);
      else startDate.setMonth(startDate.getMonth() - 3);
      const start = startDate.toISOString().split('T')[0];

      const [txRes, affRes] = await Promise.all([
        supabase
          .from('orders_with_payment')
          .select('id, order_number, customer_name, payment_method, total_amount, status, order_date')
          .eq('organization_id', organizationId)
          .gte('order_date', start)
          .order('order_date', { ascending: false })
          .limit(200),
        supabase
          .from('manual_entries')
          .select('id, name, value, order_reference, created_at')
          .eq('organization_id', organizationId)
          .eq('entry_type', 'pedido_afiliacao')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false }),
      ]);

      if (!txRes.error && txRes.data) setTransactions(txRes.data as Transaction[]);
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
                    const cfg = PAYMENT_CONFIG[tx.payment_method] ?? PAYMENT_CONFIG.other;
                    const positive = tx.status !== 'cancelled';
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
                            {positive ? '+' : '-'}{formatCurrency(tx.total_amount)}
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
                    <div key={aff.id} className="flex items-center gap-2.5 py-2 border-b border-emerald-900/20 last:border-0">
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
