import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useTopCustomers } from '@/hooks/sales/useTopCustomers';
import { useTopLeads } from '@/hooks/sales/useTopLeads';
import { Loader2, User, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PAGE_SIZE = 3;

interface TopCustomersListProps {
  organizationId: string;
  limit?: number;
  refreshTrigger?: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd/MM/yy', { locale: ptBR });
  } catch {
    return 'N/A';
  }
};

const avatarColors = [
  'from-blue-500 to-purple-600',
  'from-green-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-600',
  'from-indigo-500 to-blue-600',
  'from-emerald-500 to-green-600',
];

// ─── Pagination controls ───────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}
const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPrev, onNext }) => (
  <div className="flex items-center gap-1">
    <button
      onClick={onPrev}
      disabled={page === 0}
      className="p-1 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      aria-label="Página anterior"
    >
      <ChevronLeft className="w-4 h-4 text-gray-400" />
    </button>
    <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-center">
      {page + 1}/{totalPages || 1}
    </span>
    <button
      onClick={onNext}
      disabled={page >= totalPages - 1}
      className="p-1 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      aria-label="Próxima página"
    >
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </button>
  </div>
);

// ─── Single row ────────────────────────────────────────────────────────────
interface RowProps {
  initial: string;
  colorIndex: number;
  name: string;
  subtitle?: string | null;
  rightTop: string;
  rightMid: string;
  rightBottom?: string;
}
const Row: React.FC<RowProps> = ({ initial, colorIndex, name, subtitle, rightTop, rightMid, rightBottom }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-zinc-800 last:border-0">
    <div
      className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColors[colorIndex % avatarColors.length]} flex items-center justify-center flex-shrink-0`}
    >
      <span className="text-sm font-bold text-white">{initial}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
      )}
    </div>
    <div className="text-right flex-shrink-0">
      <p className="text-xs font-bold text-gray-900 dark:text-white">{rightTop}</p>
      <p className="text-xs text-green-600 dark:text-green-400 font-medium">{rightMid}</p>
      {rightBottom && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{rightBottom}</p>
      )}
    </div>
  </div>
);

// ─── Main component ────────────────────────────────────────────────────────
export const TopCustomersList: React.FC<TopCustomersListProps> = ({
  organizationId,
  refreshTrigger,
}) => {
  const { customers, loading: loadingC, error: errorC, refetch: refetchC } = useTopCustomers(organizationId);
  const { leads, loading: loadingL, error: errorL, refetch: refetchL } = useTopLeads(organizationId);

  const [customerPage, setCustomerPage] = useState(0);
  const [leadPage, setLeadPage] = useState(0);

  React.useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      refetchC();
      refetchL();
    }
  }, [refreshTrigger, refetchC, refetchL]);

  const customerPages = Math.ceil(customers.length / PAGE_SIZE);
  const leadPages = Math.ceil(leads.length / PAGE_SIZE);

  const visibleCustomers = customers.slice(customerPage * PAGE_SIZE, (customerPage + 1) * PAGE_SIZE);
  const visibleLeads = leads.slice(leadPage * PAGE_SIZE, (leadPage + 1) * PAGE_SIZE);

  const loading = loadingC || loadingL;

  if (loading) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  if (errorC || errorL) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800">
        <div className="text-center text-red-500 py-8">{errorC || errorL}</div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-gray-100 dark:border-zinc-800 space-y-6">

      {/* ── Top Clientes ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Top Clientes
          </h3>
          {customerPages > 1 && (
            <Pagination
              page={customerPage}
              totalPages={customerPages}
              onPrev={() => setCustomerPage((p) => Math.max(0, p - 1))}
              onNext={() => setCustomerPage((p) => Math.min(customerPages - 1, p + 1))}
            />
          )}
        </div>

        {visibleCustomers.length > 0 ? (
          <div>
            {visibleCustomers.map((c, i) => (
              <Row
                key={c.customer_id}
                initial={c.customer_name.charAt(0).toUpperCase()}
                colorIndex={customerPage * PAGE_SIZE + i}
                name={c.customer_name}
                subtitle={c.customer_email || c.customer_phone || undefined}
                rightTop={`${c.total_orders} ${Number(c.total_orders) === 1 ? 'pedido' : 'pedidos'}`}
                rightMid={formatCurrency(Number(c.total_spent))}
                rightBottom={c.last_order_date ? `Último: ${formatDate(c.last_order_date)}` : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <User className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Nenhum cliente com lucro processado
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-zinc-800" />

      {/* ── Top Leads ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Top Leads
          </h3>
          {leadPages > 1 && (
            <Pagination
              page={leadPage}
              totalPages={leadPages}
              onPrev={() => setLeadPage((p) => Math.max(0, p - 1))}
              onNext={() => setLeadPage((p) => Math.min(leadPages - 1, p + 1))}
            />
          )}
        </div>

        {visibleLeads.length > 0 ? (
          <div>
            {visibleLeads.map((l, i) => (
              <Row
                key={l.lead_id}
                initial={l.lead_name.charAt(0).toUpperCase()}
                colorIndex={leadPage * PAGE_SIZE + i + 3}
                name={l.lead_name}
                subtitle={l.lead_email || l.lead_phone || undefined}
                rightTop={`${l.bling_orders} ${Number(l.bling_orders) === 1 ? 'pedido' : 'pedidos'}`}
                rightMid={formatCurrency(Number(l.total_spent))}
                rightBottom={l.last_order_date ? `Último: ${formatDate(l.last_order_date)}` : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Users className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Nenhum lead sem processamento
            </p>
          </div>
        )}
      </div>

    </Card>
  );
};
