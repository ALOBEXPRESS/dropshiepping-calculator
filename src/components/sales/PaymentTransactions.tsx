import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Loader2, ChevronLeft, ChevronRight, Handshake } from 'lucide-react';

const PixIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect width="24" height="24" rx="6" fill="#32BCAD" />
    <path d="M12 5.5l3.18 3.18-1.41 1.41L12 8.32l-1.77 1.77-1.41-1.41L12 5.5zm0 13l-3.18-3.18 1.41-1.41L12 15.68l1.77-1.77 1.41 1.41L12 18.5zm-6.5-6.5l3.18-3.18 1.41 1.41L8.32 12l1.77 1.77-1.41 1.41L5.5 12zm13 0l-3.18 3.18-1.41-1.41L15.68 12l-1.77-1.77 1.41-1.41L18.5 12z" fill="white" />
  </svg>
);
const BoletoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect width="24" height="24" rx="6" fill="#009EE3" />
    <rect x="4" y="7" width="2" height="10" fill="white" /><rect x="7" y="7" width="1" height="10" fill="white" />
    <rect x="9" y="7" width="2" height="10" fill="white" /><rect x="12" y="7" width="1" height="10" fill="white" />
    <rect x="14" y="7" width="2" height="10" fill="white" /><rect x="17" y="7" width="1" height="10" fill="white" />
    <rect x="19" y="7" width="1" height="10" fill="white" />
  </svg>
);
const CreditCardIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect width="24" height="24" rx="6" fill="#6C63FF" />
    <rect x="4" y="7" width="16" height="10" rx="2" stroke="white" strokeWidth="1.5" />
    <rect x="4" y="10" width="16" height="2.5" fill="white" />
    <rect x="6" y="14" width="4" height="1.5" rx="0.5" fill="white" />
  </svg>
);
const DebitCardIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect width="24" height="24" rx="6" fill="#00B1EA" />
    <rect x="4" y="7" width="16" height="10" rx="2" stroke="white" strokeWidth="1.5" />
    <circle cx="8" cy="12" r="2" fill="white" />
    <rect x="12" y="14" width="6" height="1.5" rx="0.5" fill="white" />
  </svg>
);
const OtherIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect width="24" height="24" rx="6" fill="#94A3B8" />
    <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.5" />
  </svg>
);

const PAYMENT_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pix:         { label: 'Pix',            icon: <PixIcon />,        color: 'text-emerald-500' },
  boleto:      { label: 'Boleto',         icon: <BoletoIcon />,     color: 'text-blue-500' },
  credit_card: { label: 'Cartão Crédito', icon: <CreditCardIcon />, color: 'text-violet-500' },
  debit_card:  { label: 'Cartão Débito',  icon: <DebitCardIcon />,  color: 'text-sky-500' },
  other:       { label: 'Outro',          icon: <OtherIcon />,      color: 'text-gray-400' },
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
}

const PAGE_SIZE = 6;

export const PaymentTransactions: React.FC<PaymentTransactionsProps> = ({ organizationId, refreshTrigger }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [affEntries, setAffEntries] = useState<AffEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('this_month');
  const [txPage, setTxPage] = useState(0);

  useEffect(() => {
    setTxPage(0);
    const fetch = async () => {
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
          .limit(100),
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
    fetch();
  }, [organizationId, period, refreshTrigger]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const formatName = (name: string | null) => {
    if (!name) return 'Cliente';
    return name.replace(/\s*\(.*?\)\s*$/, '').split(' ').slice(0, 2).join(' ');
  };

  // Pagination for transactions
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const visibleTx = transactions.slice(txPage * PAGE_SIZE, (txPage + 1) * PAGE_SIZE);

  return (
    <Card className="p-5 border-gray-100 dark:border-zinc-800 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Transações</h3>
        <Select value={period} onValueChange={setPeriod}>
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
        <div className="flex-1 flex gap-4 min-h-0">

          {/* ── Col 1: Transações com paginação ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {transactions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-gray-400 dark:text-zinc-500 text-center">Nenhuma transação</p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-0.5 overflow-hidden">
                  {visibleTx.map((tx) => {
                    const cfg = PAYMENT_CONFIG[tx.payment_method] ?? PAYMENT_CONFIG.other;
                    const isPositive = tx.status !== 'cancelled';
                    return (
                      <div key={tx.id} className="flex items-center gap-2.5 py-2 border-b border-gray-100 dark:border-zinc-800/60 last:border-0">
                        <div className="flex-shrink-0">{cfg.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{cfg.label}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{formatName(tx.customer_name)}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {isPositive ? '+' : '-'}{formatCurrency(tx.total_amount)}
                          </p>
                          <Badge variant="outline" className="text-[10px] mt-0.5 px-1.5 py-0">#{tx.order_number}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0">
                    <button
                      onClick={() => setTxPage(p => Math.max(0, p - 1))}
                      disabled={txPage === 0}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] text-zinc-500">{txPage + 1} / {totalPages}</span>
                    <button
                      onClick={() => setTxPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={txPage >= totalPages - 1}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Divider */}
          <div className="w-px bg-zinc-100 dark:bg-zinc-800 flex-shrink-0" />

          {/* ── Col 2: Comissões de Afiliação ── */}
          <div className="w-[44%] flex-shrink-0 flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Afiliações</p>
            </div>

            {affEntries.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-zinc-600 text-center">Nenhuma comissão</p>
              </div>
            ) : (
              <div className="flex-1 space-y-0.5 overflow-y-auto">
                {affEntries.map((aff) => (
                  <div
                    key={aff.id}
                    className="flex items-center gap-2 py-2 border-b border-emerald-900/20 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                      <Handshake className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{aff.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">
                        {aff.order_reference || 'TikTok Shop'}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 flex-shrink-0">
                      +{formatCurrency(Number(aff.value))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </Card>
  );
};
