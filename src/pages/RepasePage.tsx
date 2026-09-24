import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Check, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

interface Member {
  user_id: string;
  role: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface RepasseConfig {
  user_id: string;
  percentage: number;
}

interface RepassePayment {
  id: string;
  recipient_user_id: string;
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

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function RepasePage() {
  const { organizationId } = useSettings();
  const [members, setMembers] = useState<Member[]>([]);
  const [configs, setConfigs] = useState<RepasseConfig[]>([]);
  const [payments, setPayments] = useState<RepassePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPct, setEditPct] = useState('');
  const [savingPct, setSavingPct] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [grossProfit, setGrossProfit] = useState(0);

  // Register modal form
  const [regForm, setRegForm] = useState({
    recipient_user_id: '',
    period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    period_end: new Date().toISOString().split('T')[0],
    gross_profit: '',
    notes: '',
  });
  const [registering, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      // Members
      const { data: memberRows } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', organizationId);

      // Profiles
      const userIds = (memberRows ?? []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      // Auth emails via members
      const enriched: Member[] = (memberRows ?? []).map(m => {
        const p = profiles?.find(pr => pr.id === m.user_id);
        return {
          user_id: m.user_id,
          role: m.role,
          first_name: p?.first_name ?? null,
          last_name: p?.last_name ?? null,
        };
      });
      setMembers(enriched);

      // Configs
      const { data: cfgRows } = await supabase
        .from('repasse_config')
        .select('user_id, percentage')
        .eq('organization_id', organizationId);
      setConfigs((cfgRows ?? []) as RepasseConfig[]);

      // Payments
      const { data: payRows } = await supabase
        .from('repasse_payments')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      setPayments((payRows ?? []) as RepassePayment[]);

      // Fetch lucro total from report
      const { data: rpt } = await supabase.rpc('get_revenue_report', {
        p_organization_id: organizationId,
        p_period: 'monthly',
      });
      if (rpt && rpt.length > 0) {
        const total = (rpt as Array<{ total_profit: number }>).reduce((s, r) => s + Number(r.total_profit ?? 0), 0);
        setGrossProfit(total);
      }
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { loadData(); }, [loadData]);

  const getPct = (userId: string) => configs.find(c => c.user_id === userId)?.percentage ?? 0;
  const getName = (m: Member) => `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.user_id.slice(0, 8);

  const totalPct = configs.reduce((s, c) => s + Number(c.percentage), 0);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);

  const savePct = async (userId: string) => {
    if (!organizationId) return;
    const pct = parseFloat(editPct.replace(',', '.'));
    if (isNaN(pct) || pct < 0 || pct > 100) { toast.error('Porcentagem inválida (0-100).'); return; }
    setSavingPct(true);
    try {
      await supabase.from('repasse_config').upsert({
        organization_id: organizationId,
        user_id: userId,
        percentage: pct,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id,user_id' });
      setConfigs(prev => {
        const exists = prev.find(c => c.user_id === userId);
        if (exists) return prev.map(c => c.user_id === userId ? { ...c, percentage: pct } : c);
        return [...prev, { user_id: userId, percentage: pct }];
      });
      setEditingUserId(null);
      toast.success('% atualizada!');
    } catch { toast.error('Erro ao salvar.'); }
    finally { setSavingPct(false); }
  };

  const markPaid = async (id: string) => {
    await supabase.from('repasse_payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id);
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'paid', paid_at: new Date().toISOString() } : p));
    toast.success('Repasse marcado como pago!');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !regForm.recipient_user_id) return;
    const gp = parseFloat(regForm.gross_profit.replace(',', '.')) || grossProfit;
    const pct = getPct(regForm.recipient_user_id);
    const amount = (gp * pct) / 100;
    setSaving(true);
    try {
      const { data: me } = await supabase.auth.getUser();
      await supabase.from('repasse_payments').insert({
        organization_id: organizationId,
        recipient_user_id: regForm.recipient_user_id,
        period_start: regForm.period_start,
        period_end: regForm.period_end,
        gross_profit: gp,
        percentage: pct,
        amount,
        notes: regForm.notes || null,
        status: 'pending',
        created_by: me.user?.id ?? null,
      });
      toast.success('Repasse registrado!');
      setRegisterOpen(false);
      loadData();
    } catch { toast.error('Erro ao registrar.'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-teal-400" />
            Repasses
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">Divisão de lucros entre os membros</p>
        </div>
        <Button onClick={() => setRegisterOpen(true)} className="bg-teal-500 hover:bg-teal-600 text-white gap-2">
          <Plus className="w-4 h-4" /> Registrar Repasse
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Lucro Total (acum.)', value: grossProfit, color: 'text-green-400' },
          { label: 'Pendente', value: totalPending, color: 'text-orange-400' },
          { label: 'Já Pago', value: totalPaid, color: 'text-teal-400' },
        ].map(c => (
          <div key={c.label} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Config table */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Configuração de Repasse</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${totalPct > 100 ? 'bg-red-500/20 text-red-400' : totalPct === 100 ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
            Total: {totalPct.toFixed(1)}%
          </span>
        </div>
        <div className="divide-y divide-zinc-800">
          {members.map(m => {
            const pct = getPct(m.user_id);
            const amount = (grossProfit * pct) / 100;
            const isEditing = editingUserId === m.user_id;
            return (
              <div key={m.user_id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{getName(m)}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${m.role === 'admin' ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-700 text-zinc-400'}`}>
                    {m.role === 'admin' ? 'Admin' : 'Membro'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Input
                        className="w-20 h-8 text-xs bg-zinc-800 border-zinc-600 text-white text-center"
                        value={editPct}
                        onChange={e => setEditPct(e.target.value.replace(/[^0-9,.]/g, ''))}
                        placeholder="0"
                        autoFocus
                      />
                      <span className="text-zinc-400 text-sm">%</span>
                      <Button size="sm" className="h-8 bg-teal-500 hover:bg-teal-600 text-white px-2" onClick={() => savePct(m.user_id)} disabled={savingPct}>
                        {savingPct ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-teal-400 w-14 text-right">{pct.toFixed(1)}%</span>
                      <span className="text-xs text-zinc-500 w-24 text-right">{fmt(amount)}</span>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-white"
                        onClick={() => { setEditingUserId(m.user_id); setEditPct(String(pct)); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment history */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Histórico de Repasses</h2>
        </div>
        {payments.length === 0 ? (
          <div className="px-5 py-10 text-center text-zinc-600 text-sm">Nenhum repasse registrado ainda.</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {payments.map(p => {
              const m = members.find(mm => mm.user_id === p.recipient_user_id);
              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3 flex-wrap">
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-white">{m ? getName(m) : p.recipient_user_id.slice(0, 8)}</p>
                    <p className="text-xs text-zinc-500">
                      {p.period_start} → {p.period_end}
                      {p.notes && <span className="ml-2 text-muted-foreground">· {p.notes}</span>}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-sm font-bold text-[hsl(var(--chart-6))]">{fmt(Number(p.amount))}</p>
                    <p className="text-[11px] text-muted-foreground">{p.percentage}% de {fmt(Number(p.gross_profit))}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={p.status === 'paid' ? 'bg-success-muted text-success border-success/30' : 'bg-warning-muted text-warning border-warning/30'}>
                      {p.status === 'paid' ? 'Pago' : 'Pendente'}
                    </Badge>
                    {p.status === 'pending' && (
                      <Button size="sm" className="h-7 text-xs bg-success hover:bg-success/90 text-success-foreground" onClick={() => markPaid(p.id)}>
                        Marcar pago
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Register modal */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Registrar Repasse</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Membro <span className="text-danger">*</span></Label>
              <Select value={regForm.recipient_user_id} onValueChange={v => setRegForm(f => ({ ...f, recipient_user_id: v }))}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="Selecione o membro" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {members.map(m => (
                    <SelectItem key={m.user_id} value={m.user_id}>{getName(m)} ({getPct(m.user_id)}%)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Período início</Label>
                <Input type="date" value={regForm.period_start} onChange={e => setRegForm(f => ({ ...f, period_start: e.target.value }))} className="bg-background border-input text-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Período fim</Label>
                <Input type="date" value={regForm.period_end} onChange={e => setRegForm(f => ({ ...f, period_end: e.target.value }))} className="bg-background border-input text-foreground" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Lucro de Referência (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input
                  className="pl-9 bg-background border-input text-foreground"
                  placeholder={grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  value={regForm.gross_profit}
                  onChange={e => setRegForm(f => ({ ...f, gross_profit: e.target.value.replace(/[^0-9,.]/g, '') }))}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Deixe vazio para usar o lucro acumulado atual ({fmt(grossProfit)})</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Observações</Label>
              <Input value={regForm.notes} onChange={e => setRegForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ex: Repasse referente a julho/2026" className="bg-background border-input text-foreground" />
            </div>
            {regForm.recipient_user_id && (
              <div className="rounded-lg bg-[hsl(var(--chart-6)/0.1)] border border-[hsl(var(--chart-6)/0.25)] p-3">
                <p className="text-xs text-muted-foreground">Valor calculado:</p>
                <p className="text-xl font-bold text-[hsl(var(--chart-6))] mt-0.5 tabular-nums">
                  {fmt(((parseFloat(regForm.gross_profit.replace(',', '.')) || grossProfit) * getPct(regForm.recipient_user_id)) / 100)}
                </p>
                <p className="text-[11px] text-muted-foreground">{getPct(regForm.recipient_user_id)}% do lucro</p>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRegisterOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={registering || !regForm.recipient_user_id} className="bg-[hsl(var(--chart-6))] hover:bg-[hsl(var(--chart-6)/0.85)] text-white">
                {registering ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
