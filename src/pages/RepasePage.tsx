import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Plus,
  Pencil,
  Check,
  ArrowLeftRight,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  Trash2,
  PieChart,
  User,
  Building2,
  FileSpreadsheet,
  Hourglass,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { getSettledOrderProfit, isOrderSettled, round2 } from '@/components/sales/revenueCalculations';
import { calcOrderProfit } from '@/utils/calcOrderProfit';

export interface RepasseConfig {
  id?: string;
  user_id: string;
  recipient_name?: string | null;
  percentage: number;
}

export interface RepassePayment {
  id: string;
  recipient_user_id: string;
  recipient_name?: string | null;
  period_start: string;
  period_end: string;
  gross_profit: number;
  percentage: number;
  amount: number;
  status: 'pending' | 'paid';
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

interface MonthlyReportRow {
  period_label: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  total_settled_profit: number;
  total_waiting_profit: number;
  total_blocked_profit?: number;
  orders_count: number;
  orders_data?: Array<{
    order_id?: string;
    order_number?: string;
    order_date?: string;
    total_amount?: number;
    total_cost?: number;
    total_profit?: number;
  }>;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const MONTH_NAMES_PT: Record<string, string> = {
  Jan: 'Janeiro',
  Feb: 'Fevereiro',
  Mar: 'Março',
  Apr: 'Abril',
  May: 'Maio',
  Jun: 'Junho',
  Jul: 'Julho',
  Aug: 'Agosto',
  Sep: 'Setembro',
  Oct: 'Outubro',
  Nov: 'Novembro',
  Dec: 'Dezembro',
};

// Beneficiários padrão da Empresa Alob
const DEFAULT_BENEFICIARIES = [
  {
    key: 'alyson',
    user_id: '70be52a6-06c0-4987-99d9-09708cba4163',
    name: 'Titular Alyson (empresaalob)',
    shortName: 'Alyson',
    role: 'Titular',
    defaultPercentage: 40,
    colorText: 'text-emerald-400',
    colorBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  },
  {
    key: 'jonatan',
    user_id: 'f9cacf1e-85dc-4f7e-afe9-4c43a7925e98',
    name: 'Titular Jonatan',
    shortName: 'Jonatan',
    role: 'Titular',
    defaultPercentage: 40,
    colorText: 'text-blue-400',
    colorBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  },
  {
    key: 'alob',
    user_id: '28b4b443-03fd-4a2d-b596-9dcaf142b389',
    name: 'Alob (Sistema)',
    shortName: 'Alob (Sistema)',
    role: 'Usuário do Sistema',
    defaultPercentage: 20,
    colorText: 'text-purple-400',
    colorBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  },
];

export default function RepasePage() {
  const { organizationId } = useSettings();
  const [configs, setConfigs] = useState<RepasseConfig[]>([]);
  const [payments, setPayments] = useState<RepassePayment[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit percentage state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPct, setEditPct] = useState('');
  const [savingPct, setSavingPct] = useState(false);

  // Quick action state
  const [processingMonth, setProcessingMonth] = useState<string | null>(null);

  // Register modal form
  const [registerOpen, setRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    recipient_user_id: '',
    recipient_name: '',
    period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    gross_profit: '',
    notes: '',
  });
  const [registering, setRegistering] = useState(false);

  const loadData = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      // 1. Configs
      const { data: cfgRows } = await supabase
        .from('repasse_config')
        .select('*')
        .eq('organization_id', organizationId);

      let currentConfigs = (cfgRows ?? []) as RepasseConfig[];

      // If missing default beneficiaries in database, seed them
      if (currentConfigs.length === 0) {
        const toInsert = DEFAULT_BENEFICIARIES.map((b) => ({
          organization_id: organizationId,
          user_id: b.user_id,
          recipient_name: b.name,
          percentage: b.defaultPercentage,
        }));
        await supabase.from('repasse_config').insert(toInsert);
        const { data: reloadedCfgs } = await supabase
          .from('repasse_config')
          .select('*')
          .eq('organization_id', organizationId);
        currentConfigs = (reloadedCfgs ?? []) as RepasseConfig[];
      }
      setConfigs(currentConfigs);

      // 2. Payments history
      const { data: payRows } = await supabase
        .from('repasse_payments')
        .select('*')
        .eq('organization_id', organizationId)
        .order('period_start', { ascending: false });
      setPayments((payRows ?? []) as RepassePayment[]);

      // Fetch marketplaces for real commission and fee calculations
      const { data: mkts } = await supabase
        .from('marketplaces')
        .select('*');
      const mktById = new Map((mkts ?? []).map((m: any) => [m.id, m]));

      // 3. Monthly revenue & profit report (recalculated with settled canonical rules)
      const { data: rpt } = await supabase.rpc('get_revenue_report', {
        p_organization_id: organizationId,
        p_period: 'monthly',
      });

      if (rpt) {
        const processedRows: MonthlyReportRow[] = (rpt as Array<Record<string, unknown>>).map((row) => {
          const orders = ((row.orders_data as unknown[]) || []) as Array<any>;

          let totalRevenue = 0;
          let totalCost = 0;
          let totalProfit = 0;
          let totalSettledProfit = 0;
          let totalWaitingProfit = 0;
          let totalBlockedProfit = 0;

          if (orders.length > 0) {
            orders.forEach((o) => {
              const settledOverride = getSettledOrderProfit(o.order_number);
              const mkt = mktById.get(o.marketplace_id);
              const settlementDays = Number(mkt?.settlement_period_days ?? 7);
              const hasAffiliate = Boolean(o.affiliate_id);
              const profitResult = calcOrderProfit(o, mkt, hasAffiliate);
              const isWaitingRefund = Boolean(o.aguardando_reembolso);
              const effectiveProfit = isWaitingRefund ? 0 : (settledOverride !== null ? settledOverride : profitResult.realProfit);
              const rev = profitResult.precoVendaLiquidoFinal;
              const cost = profitResult.subtotalMarketplace;
              const settled = isOrderSettled(
                o.order_date,
                settlementDays,
                new Date(),
                (o as { delivery_date?: string | null }).delivery_date,
                (o as { is_logistics_delayed?: boolean }).is_logistics_delayed === true,
                Boolean(o.is_manually_settled)
              );

              const rawMkt = String(o.marketplace || o.marketplace_name || '').toLowerCase();
              const isTikTok = rawMkt.includes('tiktok') || Boolean(o.tiktok_sfp_enabled);
              const isOrderReplica = Boolean(
                o.is_replica ||
                (o.products && o.products.some((p: any) => p.is_replica))
              );
              const isRepasseBloqueado = Boolean(o.is_repasse_bloqueado);
              const isReplicaUnblocked = Boolean(o.is_replica_unblocked);
              const isReplicaWaitingBlocked = isOrderReplica && isTikTok && !settled && !isReplicaUnblocked;
              const isAnyRepasseBlocked = isRepasseBloqueado || isReplicaWaitingBlocked;

              if (settled) {
                if (!isRepasseBloqueado) {
                  totalSettledProfit += effectiveProfit;
                }
              } else if (!isReplicaWaitingBlocked && !isRepasseBloqueado) {
                totalWaitingProfit += effectiveProfit;
              }

              if (isAnyRepasseBlocked) {
                totalBlockedProfit += effectiveProfit;
              }

              const reportProfit = isAnyRepasseBlocked ? 0 : effectiveProfit;

              totalRevenue += rev;
              totalCost += cost;
              totalProfit += reportProfit;
            });
          } else {
            totalRevenue = Number(row.total_revenue ?? 0);
            totalCost = Number(row.total_cost ?? 0);
            totalProfit = Number(row.total_profit ?? 0);
            totalSettledProfit = totalProfit;
            totalWaitingProfit = 0;
            totalBlockedProfit = 0;
          }

          return {
            period_label: String(row.period_label ?? ''),
            period_start: String(row.period_start ?? ''),
            period_end: String(row.period_end ?? ''),
            total_revenue: round2(totalRevenue),
            total_cost: round2(totalCost),
            total_profit: round2(totalProfit),
            total_settled_profit: round2(totalSettledProfit),
            total_waiting_profit: round2(totalWaitingProfit),
            total_blocked_profit: round2(totalBlockedProfit),
            orders_count: orders.length || Number(row.orders_count ?? 0),
            orders_data: orders,
          };
        });

        setMonthlyReport(processedRows);
      }
    } catch (err) {
      console.error('Erro ao carregar dados de repasse:', err);
      toast.error('Erro ao carregar repasses');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Atualizar quando a janela ganha foco ou visibilidade muda
  useEffect(() => {
    const onFocus = () => {
      loadData();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [loadData]);

  // Realtime subscription no Supabase para orders e repasse
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel(`repase-page-realtime-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'repasse_payments',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, loadData]);

  // Map beneficiaries combined with database configs
  const beneficiaries = useMemo(() => {
    return DEFAULT_BENEFICIARIES.map((def) => {
      let cfg = configs.find((c) => c.user_id === def.user_id);
      if (!cfg) {
        if (def.key === 'alyson') {
          cfg = configs.find((c) => c.recipient_name?.toLowerCase().includes('alyson'));
        } else if (def.key === 'jonatan') {
          cfg = configs.find((c) => c.recipient_name?.toLowerCase().includes('jonatan'));
        } else if (def.key === 'alob') {
          cfg = configs.find(
            (c) =>
              c.recipient_name?.toLowerCase().includes('sistema') ||
              c.recipient_name?.trim().toLowerCase() === 'alob'
          );
        }
      }
      const percentage = cfg ? Number(cfg.percentage) : def.defaultPercentage;
      return {
        ...def,
        percentage,
        configId: cfg?.id,
      };
    });
  }, [configs]);

  const getPct = useCallback(
    (userId: string) => {
      const b = beneficiaries.find((item) => item.user_id === userId);
      if (b) return b.percentage;
      const cfg = configs.find((c) => c.user_id === userId);
      return cfg ? Number(cfg.percentage) : 0;
    },
    [beneficiaries, configs]
  );

  const getName = useCallback(
    (userId: string) => {
      const b = beneficiaries.find((item) => item.user_id === userId);
      if (b) return b.name;
      const cfg = configs.find((c) => c.user_id === userId);
      return cfg?.recipient_name || userId.slice(0, 8);
    },
    [beneficiaries, configs]
  );

  // Financial totals: Settled (Disponível), Waiting (Em liquidação), Gross (Total), Blocked (Retido)
  const totalSettledProfit = useMemo(() => {
    return round2(monthlyReport.reduce((acc, r) => acc + Number(r.total_settled_profit ?? 0), 0));
  }, [monthlyReport]);

  const totalWaitingProfit = useMemo(() => {
    return round2(monthlyReport.reduce((acc, r) => acc + Number(r.total_waiting_profit ?? 0), 0));
  }, [monthlyReport]);

  const totalBlockedProfit = useMemo(() => {
    return round2(monthlyReport.reduce((acc, r) => acc + Number(r.total_blocked_profit ?? 0), 0));
  }, [monthlyReport]);

  const totalGrossProfit = useMemo(() => {
    return round2(monthlyReport.reduce((acc, r) => acc + Number(r.total_profit ?? 0), 0));
  }, [monthlyReport]);

  const totalPaid = useMemo(() => {
    return payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  }, [payments]);

  const totalPending = useMemo(() => {
    return payments
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  }, [payments]);

  const totalPercentage = useMemo(() => {
    return beneficiaries.reduce((s, b) => s + Number(b.percentage), 0);
  }, [beneficiaries]);

  // Beneficiary totals (shares strictly on settled profit with remainder safety, plus waiting)
  const beneficiaryMetrics = useMemo(() => {
    let remainingSettled = totalSettledProfit > 0 ? totalSettledProfit : 0;
    let remainingWaiting = totalWaitingProfit > 0 ? totalWaitingProfit : 0;
    let remainingGross = totalGrossProfit > 0 ? totalGrossProfit : 0;

    return beneficiaries.map((b, idx) => {
      const isLast = idx === beneficiaries.length - 1;

      const settledShare = isLast
        ? Math.max(0, round2(remainingSettled))
        : Math.max(0, round2((totalSettledProfit * b.percentage) / 100));
      remainingSettled = round2(remainingSettled - settledShare);

      const waitingShare = isLast
        ? Math.max(0, round2(remainingWaiting))
        : Math.max(0, round2((totalWaitingProfit * b.percentage) / 100));
      remainingWaiting = round2(remainingWaiting - waitingShare);

      const grossShare = isLast
        ? Math.max(0, round2(remainingGross))
        : Math.max(0, round2((totalGrossProfit * b.percentage) / 100));
      remainingGross = round2(remainingGross - grossShare);

      const userPayments = payments.filter((p) => p.recipient_user_id === b.user_id);
      const paid = userPayments
        .filter((p) => p.status === 'paid')
        .reduce((s, p) => s + Number(p.amount ?? 0), 0);
      const pending = userPayments
        .filter((p) => p.status === 'pending')
        .reduce((s, p) => s + Number(p.amount ?? 0), 0);

      return {
        ...b,
        settledShare,
        waitingShare,
        grossShare,
        accumulatedShare: settledShare,
        paid: round2(paid),
        pending: round2(pending),
      };
    });
  }, [beneficiaries, payments, totalSettledProfit, totalWaitingProfit, totalGrossProfit]);

  // Monthly Statement (Extrato Mensal)
  const monthlyStatement = useMemo(() => {
    const sorted = [...monthlyReport].sort(
      (a, b) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime()
    );

    return sorted.map((row) => {
      const settledProfit = Number(row.total_settled_profit ?? 0);
      const waitingProfit = Number(row.total_waiting_profit ?? 0);
      const blockedProfit = Number(row.total_blocked_profit ?? 0);
      const grossProfit = Number(row.total_profit ?? 0);
      const revenue = Number(row.total_revenue ?? 0);
      const cost = Number(row.total_cost ?? 0);
      const orders = Number(row.orders_count ?? 0);

      const [year, monthNum] = row.period_start.split('-');
      const ptMonth =
        MONTH_NAMES_PT[row.period_label] ||
        new Date(Number(year), Number(monthNum) - 1).toLocaleDateString('pt-BR', { month: 'long' });
      const formattedLabel = `${ptMonth.charAt(0).toUpperCase() + ptMonth.slice(1)} de ${year}`;

      // Payments matching this period
      const periodPayments = payments.filter((p) => {
        return p.period_start === row.period_start || p.period_end === row.period_end;
      });

      // Distribute settled profit across beneficiaries with remainder safety
      let remainingMonthSettled = settledProfit;
      let remainingMonthWaiting = waitingProfit;

      const shares = beneficiaries.map((b, idx) => {
        const isLast = idx === beneficiaries.length - 1;
        const shareAmount = settledProfit < 0
          ? round2((settledProfit * b.percentage) / 100)
          : (isLast ? round2(remainingMonthSettled) : round2((settledProfit * b.percentage) / 100));
        remainingMonthSettled = round2(remainingMonthSettled - shareAmount);

        const waitingAmount = waitingProfit <= 0
          ? 0
          : (isLast ? round2(remainingMonthWaiting) : round2((waitingProfit * b.percentage) / 100));
        remainingMonthWaiting = round2(remainingMonthWaiting - waitingAmount);

        const existingPayment = periodPayments.find((p) => p.recipient_user_id === b.user_id);

        return {
          beneficiary: b,
          percentage: b.percentage,
          amount: shareAmount,
          waitingAmount,
          payment: existingPayment || null,
          status: existingPayment ? existingPayment.status : ('unregistered' as const),
        };
      });

      const allPaid = shares.every((s) => s.status === 'paid');
      const allRegistered = shares.every((s) => s.status !== 'unregistered');
      const hasPending = shares.some((s) => s.status === 'pending');

      const monthStatus = allPaid
        ? 'paid'
        : hasPending || allRegistered
        ? 'pending'
        : 'unregistered';

      return {
        ...row,
        monthKey: `${year}-${monthNum}`,
        formattedLabel,
        settledProfit,
        waitingProfit,
        blockedProfit,
        grossProfit,
        revenue,
        cost,
        orders,
        shares,
        monthStatus,
      };
    });
  }, [monthlyReport, payments, beneficiaries]);

  // Save percentage edit
  const savePct = async (userId: string) => {
    if (!organizationId) return;
    const pct = parseFloat(editPct.replace(',', '.'));
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('Porcentagem inválida (0 a 100).');
      return;
    }
    setSavingPct(true);
    try {
      const b = beneficiaries.find((item) => item.user_id === userId);
      await supabase
        .from('repasse_config')
        .upsert(
          {
            organization_id: organizationId,
            user_id: userId,
            recipient_name: b?.name || getName(userId),
            percentage: pct,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,user_id' }
        );

      setConfigs((prev) => {
        const exists = prev.find((c) => c.user_id === userId);
        if (exists) {
          return prev.map((c) => (c.user_id === userId ? { ...c, percentage: pct } : c));
        }
        return [
          ...prev,
          { user_id: userId, recipient_name: b?.name || getName(userId), percentage: pct },
        ];
      });
      setEditingUserId(null);
      toast.success('Porcentagem atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar cota:', err);
      toast.error('Erro ao salvar cota.');
    } finally {
      setSavingPct(false);
    }
  };

  // Mark single payment as paid
  const markPaid = async (id: string) => {
    try {
      const now = new Date().toISOString();
      await supabase
        .from('repasse_payments')
        .update({ status: 'paid', paid_at: now })
        .eq('id', id);

      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'paid', paid_at: now } : p))
      );
      toast.success('Repasse marcado como pago!');
    } catch (err) {
      console.error('Erro ao marcar como pago:', err);
      toast.error('Erro ao atualizar status.');
    }
  };

  // Delete payment
  const deletePayment = async (id: string) => {
    try {
      await supabase.from('repasse_payments').delete().eq('id', id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
      toast.success('Lançamento de repasse excluído.');
    } catch (err) {
      console.error('Erro ao excluir repasse:', err);
      toast.error('Erro ao excluir lançamento.');
    }
  };

  // Quick-generate all repasse payments for a specific month based on settled profit
  const handleGenerateMonthRepasses = async (statementItem: (typeof monthlyStatement)[0]) => {
    if (!organizationId) return;
    setProcessingMonth(statementItem.monthKey);
    try {
      const { data: me } = await supabase.auth.getUser();
      const newPaymentsToInsert = statementItem.shares
        .filter((s) => s.status === 'unregistered')
        .map((s) => ({
          organization_id: organizationId,
          recipient_user_id: s.beneficiary.user_id,
          recipient_name: s.beneficiary.name,
          period_start: statementItem.period_start,
          period_end: statementItem.period_end,
          gross_profit: statementItem.settledProfit,
          percentage: s.percentage,
          amount: Math.max(0, s.amount),
          notes: `Repasse referente a ${statementItem.formattedLabel}`,
          status: 'pending' as const,
          created_by: me?.user?.id ?? null,
        }));

      if (newPaymentsToInsert.length === 0) {
        toast.info('Todos os repasses deste mês já foram gerados.');
        return;
      }

      const { data: inserted, error } = await supabase
        .from('repasse_payments')
        .insert(newPaymentsToInsert)
        .select();

      if (error) throw error;

      setPayments((prev) => [...(inserted as RepassePayment[]), ...prev]);
      toast.success(`Repasses de ${statementItem.formattedLabel} gerados com sucesso!`);
    } catch (err) {
      console.error('Erro ao gerar repasses do mês:', err);
      toast.error('Erro ao gerar repasses do mês.');
    } finally {
      setProcessingMonth(null);
    }
  };

  // Mark all pending payments for a specific month as paid
  const handlePayMonthAll = async (statementItem: (typeof monthlyStatement)[0]) => {
    const pendingPayments = statementItem.shares
      .map((s) => s.payment)
      .filter((p): p is RepassePayment => p !== null && p.status === 'pending');

    if (pendingPayments.length === 0) return;

    setProcessingMonth(statementItem.monthKey);
    try {
      const now = new Date().toISOString();
      const ids = pendingPayments.map((p) => p.id);

      const { error } = await supabase
        .from('repasse_payments')
        .update({ status: 'paid', paid_at: now })
        .in('id', ids);

      if (error) throw error;

      setPayments((prev) =>
        prev.map((p) => (ids.includes(p.id) ? { ...p, status: 'paid', paid_at: now } : p))
      );
      toast.success(`Repasses de ${statementItem.formattedLabel} marcados como pagos!`);
    } catch (err) {
      console.error('Erro ao pagar mês:', err);
      toast.error('Erro ao atualizar repasses.');
    } finally {
      setProcessingMonth(null);
    }
  };

  // Modal custom register
  const openRegisterModalForMonth = (
    statementItem?: (typeof monthlyStatement)[0],
    defaultBeneficiaryId?: string
  ) => {
    const bId = defaultBeneficiaryId || beneficiaries[0].user_id;
    const b = beneficiaries.find((item) => item.user_id === bId);

    if (statementItem) {
      setRegForm({
        recipient_user_id: bId,
        recipient_name: b?.name || '',
        period_start: statementItem.period_start,
        period_end: statementItem.period_end,
        gross_profit: String(statementItem.settledProfit),
        notes: `Repasse referente a ${statementItem.formattedLabel}`,
      });
    } else {
      setRegForm({
        recipient_user_id: bId,
        recipient_name: b?.name || '',
        period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split('T')[0],
        period_end: new Date().toISOString().split('T')[0],
        gross_profit: totalSettledProfit > 0 ? String(totalSettledProfit) : '',
        notes: '',
      });
    }
    setRegisterOpen(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !regForm.recipient_user_id) return;
    const gp = parseFloat(regForm.gross_profit.replace(',', '.')) || totalSettledProfit;
    const pct = getPct(regForm.recipient_user_id);
    const amount = Math.max(0, Math.round(((gp * pct) / 100) * 100) / 100);
    const recipientName = getName(regForm.recipient_user_id);

    setRegistering(true);
    try {
      const { data: me } = await supabase.auth.getUser();
      const { data: inserted, error } = await supabase
        .from('repasse_payments')
        .insert({
          organization_id: organizationId,
          recipient_user_id: regForm.recipient_user_id,
          recipient_name: recipientName,
          period_start: regForm.period_start,
          period_end: regForm.period_end,
          gross_profit: gp,
          percentage: pct,
          amount,
          notes: regForm.notes || null,
          status: 'pending',
          created_by: me?.user?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      if (inserted) {
        setPayments((prev) => [inserted as RepassePayment, ...prev]);
      }
      toast.success('Repasse registrado com sucesso!');
      setRegisterOpen(false);
    } catch (err) {
      console.error('Erro ao registrar repasse:', err);
      toast.error('Erro ao registrar repasse.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
        <p className="text-sm text-zinc-400">Carregando demonstrativo de repasses...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Repasses de Lucro</h1>
              <p className="text-xs md:text-sm text-zinc-400">
                Divisão de lucros apurados para os titulares e sistema com extrato mensal
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData()}
            disabled={loading}
            className="border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs h-9 gap-1.5 cursor-pointer"
            title="Recarregar dados de repasse dinamicamente"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>Atualizar</span>
          </Button>

          <Button
            onClick={() => openRegisterModalForMonth()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Registrar Repasse
          </Button>
        </div>
      </div>

      {/* ── Summary Cards: Fatias dos Titulares e Lucro Total Liquidado ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Settled Profit (Disponível) */}
        <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Lucro Total Liquidado
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">
                Saldo geral acumulado
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              Disponível
            </Badge>
          </div>
          <div>
            <p className={`text-2xl font-bold ${totalSettledProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {fmt(totalSettledProfit)}
            </p>
            <div className="flex flex-col gap-0.5 mt-1.5 text-[11px]">
              {totalWaitingProfit > 0 && (
                <div className="flex items-center justify-between text-amber-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Hourglass className="w-3 h-3" />
                    Em espera:
                  </span>
                  <span>{fmt(totalWaitingProfit)}</span>
                </div>
              )}
              {totalBlockedProfit > 0 && (
                <div className="flex items-center justify-between text-red-400 font-medium" title="Repasse bloqueado por política ou ação manual">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Bloqueado:
                  </span>
                  <span>{fmt(totalBlockedProfit)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-zinc-400">
                <span>Total c/ espera:</span>
                <span className="text-zinc-200 font-medium">{fmt(totalGrossProfit)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/80 text-[11px]">
              <span className="text-zinc-500">Pago: {fmt(totalPaid)}</span>
              <span className="text-amber-400 font-medium">Pendente: {fmt(totalPending)}</span>
            </div>
          </div>
        </div>

        {/* Beneficiary Cards (Alyson 40%, Jonatan 40%, Alob 20%) */}
        {beneficiaryMetrics.map((b) => (
          <div
            key={b.key}
            className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-4 flex flex-col justify-between hover:border-zinc-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider truncate block">
                    {b.shortName}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    Saldo acumulado
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${b.colorBg}`}>
                  {b.percentage.toFixed(0)}%
                </span>
              </div>
              <p className={`text-2xl font-bold ${b.colorText}`}>
                {fmt(b.accumulatedShare)}
              </p>
              <div className="mt-1 space-y-0.5 text-[11px]">
                {b.waitingShare > 0 && (
                  <p className="text-amber-400 font-medium flex items-center gap-1">
                    <Hourglass className="w-3 h-3" />
                    + {fmt(b.waitingShare)} em espera
                  </p>
                )}
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Total c/ espera:</span>
                  <span className="text-zinc-200 font-medium">{fmt(b.grossShare)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400/90 font-medium">Pago: {fmt(b.paid)}</span>
              <span className="text-amber-400/90 font-medium">A Pagar: {fmt(b.pending)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Extrato Mensal dos Valores Repartidos ──────────────────────────── */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Extrato Mensal de Repasses</h2>
              <p className="text-xs text-zinc-400">
                Apuração e repasses mês a mês: 40% Alyson, 40% Jonatan e 20% Alob
              </p>
            </div>
          </div>

          <Badge variant="outline" className="text-xs text-zinc-300 border-zinc-700">
            {monthlyStatement.length} {monthlyStatement.length === 1 ? 'mês apurado' : 'meses apurados'}
          </Badge>
        </div>

        {monthlyStatement.length === 0 ? (
          <div className="px-5 py-12 text-center text-zinc-500 text-sm">
            Nenhum período de vendas registrado no sistema ainda.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {monthlyStatement.map((month) => {
              const isProcessing = processingMonth === month.monthKey;
              const isNegative = month.settledProfit < 0;

              return (
                <div key={month.monthKey} className="p-4 md:p-5 hover:bg-zinc-800/30 transition-colors">
                  {/* Month header row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 flex-shrink-0">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">{month.formattedLabel}</h3>
                          <Badge
                            className={
                              month.monthStatus === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]'
                                : month.monthStatus === 'pending'
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]'
                            }
                          >
                            {month.monthStatus === 'paid'
                              ? 'Liquidado / Pago'
                              : month.monthStatus === 'pending'
                              ? 'Pendente'
                              : 'Não Lançado'}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {month.orders} {month.orders === 1 ? 'pedido' : 'pedidos'} • Receita: {fmt(month.revenue)} • Custos: {fmt(month.cost)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-start md:self-auto">
                      <div className="text-right">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                            Lucro Liquidado
                          </span>
                          <span className={`text-base font-bold ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
                            {fmt(month.settledProfit)}
                          </span>
                        </div>
                        {month.waitingProfit > 0 && (
                          <span className="text-[11px] text-amber-400 font-medium block mt-0.5">
                            + {fmt(month.waitingProfit)} em espera
                          </span>
                        )}
                        {month.blockedProfit > 0 && (
                          <span className="text-[10px] text-red-400/90 font-medium block mt-0.5" title="Lucro de pedidos com repasse bloqueado ou réplica pausada">
                            ({fmt(month.blockedProfit)} bloqueado)
                          </span>
                        )}
                      </div>

                      {/* Month actions */}
                      <div className="flex items-center gap-2">
                        {month.monthStatus === 'unregistered' && !isNegative && (
                          <Button
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleGenerateMonthRepasses(month)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5 shadow-sm"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            Gerar Repasses
                          </Button>
                        )}

                        {month.monthStatus === 'pending' && (
                          <Button
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handlePayMonthAll(month)}
                            className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8 gap-1.5 shadow-sm"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Pagar Todos
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shares breakdown cards for the month */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {month.shares.map((share) => {
                      const b = share.beneficiary;
                      const hasPayment = Boolean(share.payment);
                      const isPaid = share.status === 'paid';

                      return (
                        <div
                          key={b.key}
                          className="rounded-lg bg-zinc-950/70 border border-zinc-800/90 p-3 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-zinc-200 truncate">
                              {b.shortName}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400">
                              {b.percentage}%
                            </span>
                          </div>

                          <div className="my-1">
                            <span className={`text-base font-bold ${isNegative ? 'text-zinc-500' : b.colorText}`}>
                              {isNegative ? `Prejuízo (${fmt(Math.abs(share.amount))})` : fmt(share.amount)}
                            </span>
                            {share.waitingAmount > 0 && (
                              <span className="text-[11px] text-amber-400 font-medium block mt-0.5">
                                + {fmt(share.waitingAmount)} em espera
                              </span>
                            )}
                          </div>

                          <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-xs">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                Pago
                              </span>
                            ) : hasPayment ? (
                              <div className="flex items-center justify-between w-full">
                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  Pendente
                                </span>
                                {share.payment && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                    onClick={() => markPaid(share.payment!.id)}
                                  >
                                    Marcar pago
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-zinc-500">
                                {isNegative ? 'Sem repasse no prejuízo' : 'Aguardando lançamento'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Configuração das Cotas / Regras de Repasse ──────────────────────── */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Configuração de Fatias / Cotas</h2>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
              totalPercentage === 100
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            Total: {totalPercentage.toFixed(1)}% {totalPercentage === 100 ? '✓' : '(precisa ser 100%)'}
          </span>
        </div>

        <div className="divide-y divide-zinc-800">
          {beneficiaries.map((b) => {
            const isEditing = editingUserId === b.user_id;
            const simulatedAmount = (totalSettledProfit * b.percentage) / 100;

            return (
              <div key={b.key} className="flex items-center justify-between px-5 py-3.5 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${b.colorBg}`}>
                    {b.key === 'alob' ? (
                      <Building2 className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{b.name}</p>
                    <span className="text-[11px] text-zinc-400">{b.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-20 h-8 text-xs bg-zinc-800 border-zinc-700 text-white text-center"
                        value={editPct}
                        onChange={(e) => setEditPct(e.target.value.replace(/[^0-9,.]/g, ''))}
                        placeholder="40"
                        autoFocus
                      />
                      <span className="text-zinc-400 text-sm">%</span>
                      <Button
                        size="sm"
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
                        onClick={() => savePct(b.user_id)}
                        disabled={savingPct}
                      >
                        {savingPct ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <span className={`text-base font-bold ${b.colorText} w-16 text-right`}>
                        {b.percentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-zinc-400 w-28 text-right hidden sm:inline">
                        {fmt(simulatedAmount)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                        title="Editar porcentagem"
                        onClick={() => {
                          setEditingUserId(b.user_id);
                          setEditPct(String(b.percentage));
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Histórico de Lançamentos de Pagamento ────────────────────────────── */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Histórico de Lançamentos de Repasse</h2>
          </div>
          <span className="text-xs text-zinc-400">
            {payments.length} {payments.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="px-5 py-10 text-center text-zinc-500 text-sm">
            Nenhum repasse registrado ainda. Utilize o botão acima ou gere a partir do extrato mensal.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {payments.map((p) => {
              const b = beneficiaries.find((item) => item.user_id === p.recipient_user_id);
              const displayName = p.recipient_name || b?.name || getName(p.recipient_user_id);

              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 flex-wrap justify-between hover:bg-zinc-800/30 transition-colors">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{displayName}</p>
                      <Badge variant="outline" className="text-[10px] bg-zinc-800 text-zinc-300 border-zinc-700">
                        {p.percentage}%
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Período: {p.period_start} → {p.period_end}
                      {p.notes && <span className="ml-2 text-zinc-500">· {p.notes}</span>}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-bold text-emerald-400">{fmt(Number(p.amount))}</p>
                    <p className="text-[11px] text-zinc-500">
                      de {fmt(Number(p.gross_profit))} apurado
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        p.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }
                    >
                      {p.status === 'paid' ? 'Pago' : 'Pendente'}
                    </Badge>

                    {p.status === 'pending' && (
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => markPaid(p.id)}
                      >
                        Marcar pago
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Excluir lançamento"
                      onClick={() => deletePayment(p.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal de Registrar Repasse ───────────────────────────────────────── */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Repasse</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Informe o beneficiário e o lucro de referência para apurar o repasse.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegister} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-300">Beneficiário *</Label>
              <Select
                value={regForm.recipient_user_id}
                onValueChange={(v) => {
                  const b = beneficiaries.find((item) => item.user_id === v);
                  setRegForm((f) => ({
                    ...f,
                    recipient_user_id: v,
                    recipient_name: b?.name || '',
                  }));
                }}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Selecione o titular ou sistema" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  {beneficiaries.map((b) => (
                    <SelectItem key={b.user_id} value={b.user_id}>
                      {b.name} ({b.percentage}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-zinc-300">Período Início</Label>
                <Input
                  type="date"
                  value={regForm.period_start}
                  onChange={(e) => setRegForm((f) => ({ ...f, period_start: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-zinc-300">Período Fim</Label>
                <Input
                  type="date"
                  value={regForm.period_end}
                  onChange={(e) => setRegForm((f) => ({ ...f, period_end: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-300">Lucro Liquidado de Referência (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">R$</span>
                <Input
                  className="pl-9 bg-zinc-800 border-zinc-700 text-white"
                  placeholder={totalSettledProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  value={regForm.gross_profit}
                  onChange={(e) =>
                    setRegForm((f) => ({ ...f, gross_profit: e.target.value.replace(/[^0-9,.]/g, '') }))
                  }
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Deixe vazio para usar o lucro liquidado disponível ({fmt(totalSettledProfit)})
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-zinc-300">Observações</Label>
              <Input
                value={regForm.notes}
                onChange={(e) => setRegForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Ex: Repasse referente a Outubro/2026"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {regForm.recipient_user_id && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-3.5">
                <p className="text-xs text-zinc-400">Valor calculado da fatia:</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">
                  {fmt(
                    Math.max(
                      0,
                      ((parseFloat(regForm.gross_profit.replace(',', '.')) || totalSettledProfit) *
                        getPct(regForm.recipient_user_id)) /
                        100
                    )
                  )}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {getPct(regForm.recipient_user_id)}% do lucro apurado
                </p>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                onClick={() => setRegisterOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={registering || !regForm.recipient_user_id}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {registering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                  </>
                ) : (
                  'Registrar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
