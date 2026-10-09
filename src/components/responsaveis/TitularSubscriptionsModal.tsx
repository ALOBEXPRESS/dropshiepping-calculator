import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TitularSubscriptionSchema,
  type Titular,
  type TitularSubscription,
  type TitularSubscriptionFormData,
} from '@/types/responsaveis';
import { useTitularSubscriptions } from '@/hooks/useResponsaveis';
import { useBusinessCenters } from '@/hooks/useBusinessCenters';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import { useSettings } from '@/contexts/SettingsContext';
import {
  Sparkles,
  Plus,
  Trash2,
  Building2,
  Layers,
  DollarSign,
  CreditCard,
  X,
  ExternalLink,
} from 'lucide-react';

interface TitularSubscriptionsModalProps {
  titular: Titular | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TitularSubscriptionsModal: React.FC<TitularSubscriptionsModalProps> = ({
  titular,
  open,
  onOpenChange,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [targetType, setTargetType] = useState<'none' | 'business_center' | 'platform_account'>('none');
  const { organizationId } = useSettings();
  const orgId = titular?.organization_id || organizationId;

  const {
    subscriptions,
    isLoading,
    createSubscription,
    deleteSubscription,
    isCreating,
    isDeleting,
  } = useTitularSubscriptions(titular?.id);

  const { businessCenters = [] } = useBusinessCenters(orgId);
  const { data: platformAccounts = [] } = usePlatformAccounts();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TitularSubscriptionFormData>({
    resolver: zodResolver(TitularSubscriptionSchema),
    defaultValues: {
      name: '',
      amount: 0,
      currency: 'BRL',
      billing_cycle: 'mensal',
      business_center_id: null,
      platform_account_id: null,
      notes: '',
      is_active: true,
    },
  });

  const selectedCurrency = watch('currency');
  const selectedCycle = watch('billing_cycle');
  const selectedBcId = watch('business_center_id');
  const selectedAccId = watch('platform_account_id');

  const onSubmit = async (data: TitularSubscriptionFormData) => {
    if (!titular?.id) return;
    try {
      await createSubscription({
        titularId: titular.id,
        data: {
          ...data,
          business_center_id: targetType === 'business_center' ? data.business_center_id : null,
          platform_account_id: targetType === 'platform_account' ? data.platform_account_id : null,
        },
      });
      reset();
      setShowAddForm(false);
      setTargetType('none');
    } catch {
      // Error handled by hook toast
    }
  };

  // Calculations for summary banner
  const activeSubs = subscriptions.filter((s) => s.is_active);
  const totalMonthlyBRL = activeSubs
    .filter((s) => s.currency === 'BRL' && s.billing_cycle === 'mensal')
    .reduce((acc, s) => acc + Number(s.amount || 0), 0);
  const totalMonthlyUSD = activeSubs
    .filter((s) => s.currency === 'USD' && s.billing_cycle === 'mensal')
    .reduce((acc, s) => acc + Number(s.amount || 0), 0);

  const getCycleBadge = (cycle: string) => {
    switch (cycle) {
      case 'mensal':
        return (
          <Badge variant="outline" className="text-violet-400 border-violet-500/30 bg-violet-500/10 text-[11px] font-medium">
            Mensal
          </Badge>
        );
      case 'anual':
        return (
          <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 text-[11px] font-medium">
            Anual
          </Badge>
        );
      case 'vitalicia':
        return (
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium">
            Vitalícia
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Assinaturas do Titular</DialogTitle>
                <DialogDescription className="text-xs text-[hsl(var(--muted-foreground))]">
                  Gerenciamento de ferramentas, softwares e serviços vinculados a <strong className="text-[hsl(var(--foreground))]">{titular?.full_name}</strong>
                </DialogDescription>
              </div>
            </div>
            {!showAddForm && (
              <Button
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Nova Assinatura
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Resumo de Custos Recorrentes */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gradient-to-br from-violet-950/20 via-zinc-900/40 to-zinc-900/20 border border-violet-900/30 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-emerald-400">R$</span>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Total Recorrente (Real)</p>
              <p className="text-sm font-bold text-emerald-400">
                R$ {totalMonthlyBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-[10px] text-zinc-500 font-normal"> /mês</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">Total Recorrente (Dólar)</p>
              <p className="text-sm font-bold text-sky-400">
                $ {totalMonthlyUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-[10px] text-zinc-500 font-normal"> /mês</span>
              </p>
            </div>
          </div>
        </div>

        {/* Formulário de Adicionar Nova Assinatura */}
        {showAddForm && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-4 rounded-xl bg-zinc-900/80 border border-violet-500/30 space-y-3.5 transition-all shadow-md mt-1"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-violet-400" /> Cadastrar Nova Assinatura
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  reset();
                }}
                className="text-zinc-400 hover:text-zinc-200 p-0.5 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Nome da Ferramenta / Serviço <span className="text-red-400">*</span></Label>
                <Input
                  placeholder="Ex: Dolphin Anty, Canva Pro, Smartproxy, Chatbase..."
                  {...register('name')}
                  className="bg-zinc-850 border-zinc-700 h-9 text-xs"
                />
                {errors.name && <p className="text-[11px] text-red-400">{errors.name.message}</p>}
              </div>

              {/* Valor e Moeda */}
              <div className="space-y-1">
                <Label className="text-xs">Valor <span className="text-red-400">*</span></Label>
                <div className="flex items-center gap-1.5">
                  <div className="inline-flex rounded-lg bg-zinc-800 p-0.5 border border-zinc-700 shrink-0">
                    <button
                      type="button"
                      onClick={() => setValue('currency', 'BRL')}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                        selectedCurrency === 'BRL'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      R$ (Real)
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('currency', 'USD')}
                      className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                        selectedCurrency === 'USD'
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      $ (Dollar)
                    </button>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    {...register('amount', { valueAsNumber: true })}
                    className="bg-zinc-850 border-zinc-700 h-9 text-xs tabular-nums text-right font-medium"
                  />
                </div>
                {errors.amount && <p className="text-[11px] text-red-400">{errors.amount.message}</p>}
              </div>

              {/* Periodicidade */}
              <div className="space-y-1">
                <Label className="text-xs">Periodicidade de Cobrança</Label>
                <div className="grid grid-cols-3 gap-1 pt-0.5">
                  {(['mensal', 'anual', 'vitalicia'] as const).map((cycle) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setValue('billing_cycle', cycle)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border capitalize transition-all ${
                        selectedCycle === cycle
                          ? 'bg-violet-600 border-violet-500 text-white shadow-sm'
                          : 'bg-zinc-850 border-zinc-750 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      {cycle === 'vitalicia' ? 'Vitalícia' : cycle}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vínculo com Business Center ou Conta */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-2">
              <Label className="text-xs flex items-center gap-1 text-zinc-300">
                <ExternalLink className="w-3.5 h-3.5 text-violet-400" /> Associar a um Business Center ou Conta de Plataforma (Opcional)
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('none');
                    setValue('business_center_id', null);
                    setValue('platform_account_id', null);
                  }}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    targetType === 'none'
                      ? 'bg-zinc-700 text-white border-zinc-500 font-semibold'
                      : 'bg-zinc-850 text-zinc-400 border-zinc-750 hover:bg-zinc-800'
                  }`}
                >
                  Nenhum Vínculo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('business_center');
                    setValue('platform_account_id', null);
                  }}
                  className={`py-1.5 text-xs font-medium rounded-lg border flex items-center justify-center gap-1 transition-all ${
                    targetType === 'business_center'
                      ? 'bg-violet-600/30 text-violet-300 border-violet-500 font-semibold'
                      : 'bg-zinc-850 text-zinc-400 border-zinc-750 hover:bg-zinc-800'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" /> Business Center
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('platform_account');
                    setValue('business_center_id', null);
                  }}
                  className={`py-1.5 text-xs font-medium rounded-lg border flex items-center justify-center gap-1 transition-all ${
                    targetType === 'platform_account'
                      ? 'bg-sky-600/30 text-sky-300 border-sky-500 font-semibold'
                      : 'bg-zinc-850 text-zinc-400 border-zinc-750 hover:bg-zinc-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Conta
                </button>
              </div>

              {targetType === 'business_center' && (
                <div className="pt-1.5">
                  <Select
                    value={selectedBcId || ''}
                    onValueChange={(val) => setValue('business_center_id', val || null)}
                  >
                    <SelectTrigger className="bg-zinc-850 border-zinc-700 h-9 text-xs">
                      <SelectValue placeholder="Selecione o Business Center" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessCenters.map((bc) => (
                        <SelectItem key={bc.id} value={bc.id} className="text-xs">
                          {bc.name} {bc.platform ? `(${bc.platform})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {targetType === 'platform_account' && (
                <div className="pt-1.5">
                  <Select
                    value={selectedAccId || ''}
                    onValueChange={(val) => setValue('platform_account_id', val || null)}
                  >
                    <SelectTrigger className="bg-zinc-850 border-zinc-700 h-9 text-xs">
                      <SelectValue placeholder="Selecione a Conta de Plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      {platformAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id} className="text-xs">
                          {acc.name} {acc.platform ? `(${acc.platform})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Observações / Detalhes de Login ou Pagamento</Label>
              <Textarea
                placeholder="Ex: Renovação automática dia 15 no cartão virtual Nubank..."
                {...register('notes')}
                rows={2}
                className="bg-zinc-850 border-zinc-700 text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  reset();
                }}
                disabled={isCreating}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
              >
                {isCreating ? 'Vinculando...' : 'Salvar Assinatura'}
              </Button>
            </div>
          </form>
        )}

        {/* Lista de Assinaturas */}
        <div className="space-y-2.5 mt-2">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-zinc-500 animate-pulse">
              Carregando assinaturas do titular...
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="py-8 text-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-6 space-y-2">
              <CreditCard className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-medium text-zinc-400">Nenhuma assinatura vinculada a este titular.</p>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                Cadastre assinaturas como proxies, ferramentas de automação, suítes de design ou contas pagas.
              </p>
              {!showAddForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  className="mt-2 text-xs border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                >
                  <Plus className="w-3 h-3 mr-1" /> Adicionar Primeira Assinatura
                </Button>
              )}
            </div>
          ) : (
            subscriptions.map((sub: TitularSubscription) => {
              const formattedAmount =
                sub.currency === 'USD'
                  ? `$ ${Number(sub.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `R$ ${Number(sub.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-violet-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shrink-0">
                      {sub.currency === 'USD' ? (
                        <DollarSign className="w-4.5 h-4.5 text-sky-400" />
                      ) : (
                        <span className="text-xs font-bold text-emerald-400">R$</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-white truncate">{sub.name}</span>
                        {getCycleBadge(sub.billing_cycle)}
                        {!sub.is_active && (
                          <Badge variant="outline" className="text-zinc-500 border-zinc-700 text-[10px]">
                            Inativo
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 flex-wrap">
                        {sub.business_centers && (
                          <span className="inline-flex items-center gap-1 text-violet-300 bg-violet-950/40 px-1.5 py-0.5 rounded border border-violet-800/40 text-[10px]">
                            <Building2 className="w-3 h-3" /> BC: {sub.business_centers.name}
                          </span>
                        )}
                        {sub.platform_accounts && (
                          <span className="inline-flex items-center gap-1 text-sky-300 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/40 text-[10px]">
                            <Layers className="w-3 h-3" /> Conta: {sub.platform_accounts.name}
                          </span>
                        )}
                        {sub.notes && (
                          <span className="text-zinc-500 truncate max-w-xs">{sub.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-white tabular-nums">{formattedAmount}</span>
                      <p className="text-[10px] text-zinc-500 capitalize">{sub.billing_cycle}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteSubscription(sub.id)}
                      disabled={isDeleting}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-80 group-hover:opacity-100"
                      title="Excluir assinatura"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
