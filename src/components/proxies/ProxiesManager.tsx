import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Shield, Plus, Pencil, Trash2, Loader2, Eye, EyeOff,
  Globe, Wifi, Clock, AlertTriangle, CheckCircle2, Server,
  Link2, Unlink,
} from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProxies } from '@/hooks/useProxies';
import { PLATFORM_COUNTRIES } from '@/constants/niches';
import type { PlatformAccount } from '@/types/platformAccounts';
import type { Proxy, ProxyFormData } from '@/types/proxies';
import {
  proxySchema,
  PROXY_PROTOCOL_LABELS,
  PROXY_TYPE_LABELS,
  PROXY_STATUS_LABELS,
  PROXY_STATUS_COLORS,
} from '@/types/proxies';

export function getCountryName(code: string | null | undefined): string {
  if (!code) return 'Sem país definido';
  const upper = code.trim().toUpperCase();
  const found = PLATFORM_COUNTRIES.find((c) => c.code === upper);
  if (found) return found.name;
  try {
    const displayNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
    return displayNames.of(upper) || upper;
  } catch {
    return upper;
  }
}

// ── ProxyFormDialog ───────────────────────────────────────────────────────────

interface ProxyFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proxy?: Proxy | null;
  organizationId: string;
  platformAccounts?: PlatformAccount[];
  currentLinkedAccount?: PlatformAccount | null;
  onSaved: (proxy: Proxy) => void;
}

export const ProxyFormDialog: React.FC<ProxyFormDialogProps> = ({
  open,
  onOpenChange,
  proxy,
  organizationId,
  platformAccounts = [],
  currentLinkedAccount,
  onSaved,
}) => {
  const { createProxy, updateProxy, linkProxy, isCreating, isUpdating, isLinking } =
    useProxies(organizationId);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('none');
  const isEditing = !!proxy;
  const isBusy = isCreating || isUpdating || isLinking;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProxyFormData>({
    resolver: zodResolver(proxySchema),
    defaultValues: proxy
      ? {
          label: proxy.label,
          protocol: proxy.protocol,
          host: proxy.host,
          port: proxy.port,
          username: proxy.username ?? '',
          password: '',
          country: proxy.country ?? '',
          proxy_type: proxy.proxy_type,
          provider: proxy.provider ?? '',
          status: proxy.status,
          expires_at: proxy.expires_at ? proxy.expires_at.slice(0, 10) : '',
          notes: proxy.notes ?? '',
        }
      : {
          protocol: 'http',
          proxy_type: 'residential',
          status: 'active',
          port: 8080,
        },
  });

  // Atualiza o estado da conta vinculada quando abre para edição ou criação
  useEffect(() => {
    if (open) {
      setSelectedAccountId(currentLinkedAccount?.id ?? 'none');
      setShowPassword(false);
      reset(
        proxy
          ? {
              label: proxy.label,
              protocol: proxy.protocol,
              host: proxy.host,
              port: proxy.port,
              username: proxy.username ?? '',
              password: '',
              country: proxy.country ?? '',
              proxy_type: proxy.proxy_type,
              provider: proxy.provider ?? '',
              status: proxy.status,
              expires_at: proxy.expires_at ? proxy.expires_at.slice(0, 10) : '',
              notes: proxy.notes ?? '',
            }
          : {
              protocol: 'http',
              proxy_type: 'residential',
              status: 'active',
              port: 8080,
            }
      );
    }
  }, [open, proxy, currentLinkedAccount, reset]);

  const onSubmit = async (data: ProxyFormData) => {
    try {
      let saved: Proxy;
      if (isEditing && proxy) {
        saved = await updateProxy(proxy.id, data);
      } else {
        saved = await createProxy(data);
      }

      // Trata vínculo ou desvínculo da conta
      const previousAccountId = currentLinkedAccount?.id ?? null;
      const targetAccountId = selectedAccountId !== 'none' ? selectedAccountId : null;

      if (targetAccountId !== previousAccountId) {
        if (previousAccountId) {
          await linkProxy(previousAccountId, null);
        }
        if (targetAccountId) {
          await linkProxy(targetAccountId, saved.id);
        }
      }

      toast.success(
        isEditing
          ? 'Proxy e vínculo atualizados com sucesso!'
          : 'Proxy criado com sucesso!'
      );
      onSaved(saved);
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar proxy.');
    }
  };

  const handleClose = () => {
    reset();
    setShowPassword(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            {isEditing ? 'Editar Proxy' : 'Novo Proxy'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          {/* Label */}
          <div className="space-y-1.5">
            <Label htmlFor="proxy-label" className="text-sm font-medium">
              Nome / Identificador <span className="text-red-400">*</span>
            </Label>
            <Input
              id="proxy-label"
              {...register('label')}
              placeholder="Ex: Proxy BR Residencial #1"
              className="bg-background border-input"
            />
            {errors.label && <p className="text-xs text-red-400">{errors.label.message}</p>}
          </div>

          {/* Protocol + ProxyType */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Protocolo <span className="text-red-400">*</span></Label>
              <Controller
                name="protocol"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-background border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-input">
                      {Object.entries(PROXY_PROTOCOL_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.protocol && <p className="text-xs text-red-400">{errors.protocol.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tipo <span className="text-red-400">*</span></Label>
              <Controller
                name="proxy_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-background border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-input">
                      {Object.entries(PROXY_TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.proxy_type && <p className="text-xs text-red-400">{errors.proxy_type.message}</p>}
            </div>
          </div>

          {/* Host + Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="proxy-host" className="text-sm font-medium">
                Host <span className="text-red-400">*</span>
              </Label>
              <Input
                id="proxy-host"
                {...register('host')}
                placeholder="Ex: 192.168.1.1 ou proxy.provider.com"
                className="bg-background border-input"
              />
              {errors.host && <p className="text-xs text-red-400">{errors.host.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proxy-port" className="text-sm font-medium">
                Porta <span className="text-red-400">*</span>
              </Label>
              <Input
                id="proxy-port"
                type="number"
                {...register('port', { valueAsNumber: true })}
                placeholder="8080"
                className="bg-background border-input"
              />
              {errors.port && <p className="text-xs text-red-400">{errors.port.message}</p>}
            </div>
          </div>

          {/* Username + Password */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="proxy-user" className="text-sm font-medium">Usuário</Label>
              <Input
                id="proxy-user"
                {...register('username')}
                placeholder="username"
                autoComplete="new-password"
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proxy-pass" className="text-sm font-medium">
                Senha {isEditing && <span className="text-muted-foreground text-[10px]">(deixe em branco para manter)</span>}
              </Label>
              <div className="relative">
                <Input
                  id="proxy-pass"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="bg-background border-input pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Country + Provider */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="proxy-country" className="text-sm font-medium">País (ISO-2)</Label>
              <Input
                id="proxy-country"
                {...register('country')}
                placeholder="BR"
                maxLength={2}
                className="bg-background border-input uppercase"
              />
              {errors.country && <p className="text-xs text-red-400">{errors.country.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proxy-provider" className="text-sm font-medium">Provedor</Label>
              <Input
                id="proxy-provider"
                {...register('provider')}
                placeholder="Ex: Brightdata, Oxylabs..."
                className="bg-background border-input"
              />
            </div>
          </div>

          {/* Status + Expires */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Status <span className="text-red-400">*</span></Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-background border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-input">
                      {Object.entries(PROXY_STATUS_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proxy-expires" className="text-sm font-medium">Validade</Label>
              <Input
                id="proxy-expires"
                type="date"
                {...register('expires_at')}
                className="bg-background border-input"
              />
            </div>
          </div>

          {/* Vínculo de Conta de Plataforma (Link / Unlink) */}
          <div className="space-y-1.5 rounded-lg border border-border/80 bg-accent/20 p-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-orange-400" />
                Conta de Plataforma Vinculada
              </Label>
              {selectedAccountId !== 'none' && (
                <span className="text-[11px] text-emerald-400 font-medium">Vinculada</span>
              )}
            </div>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="bg-background border-input text-xs">
                <SelectValue placeholder="Selecione uma conta para vincular..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-input max-h-56">
                <SelectItem value="none">
                  <span className="text-muted-foreground italic">Nenhuma conta vinculada (Desvinculado)</span>
                </SelectItem>
                {platformAccounts.map((acc) => {
                  const isCurrent = acc.id === currentLinkedAccount?.id;
                  const isOther = acc.proxy_id && acc.proxy_id !== proxy?.id;
                  return (
                    <SelectItem key={acc.id} value={acc.id}>
                      <span className="flex items-center gap-2">
                        {acc.country && (
                          <ReactCountryFlag countryCode={acc.country} svg style={{ width: '1em', height: '1em' }} />
                        )}
                        <span>{acc.name}</span>
                        <span className="text-[10px] text-muted-foreground">({acc.platform})</span>
                        {isCurrent && <span className="text-emerald-400 font-semibold text-[10px]">✓ Atual</span>}
                        {isOther && !isCurrent && <span className="text-amber-400 text-[10px]">(tem outro proxy)</span>}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Vincular ou desvincular a conta aqui atualiza imediatamente o isolamento de rede da conta.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="proxy-notes" className="text-sm font-medium">Observações</Label>
            <textarea
              id="proxy-notes"
              {...register('notes')}
              rows={2}
              placeholder="Notas internas sobre este proxy..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isBusy}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isBusy} className="bg-orange-600 hover:bg-orange-700 text-white">
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? 'Salvar' : 'Criar Proxy'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── ProxyCard ─────────────────────────────────────────────────────────────────

interface ProxyCardProps {
  proxy: Proxy;
  linkedAccount?: PlatformAccount | null;
  onEdit: () => void;
  onDelete: () => void;
  onUnlink?: () => void;
}

const ProxyCard: React.FC<ProxyCardProps> = ({ proxy, linkedAccount, onEdit, onDelete, onUnlink }) => {
  const statusColor = PROXY_STATUS_COLORS[proxy.status];

  return (
    <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3 hover:border-input/60 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{proxy.label}</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span>{PROXY_PROTOCOL_LABELS[proxy.protocol]} · {PROXY_TYPE_LABELS[proxy.proxy_type]}</span>
              {proxy.country && (
                <span className="inline-flex items-center gap-1">
                  ·
                  <ReactCountryFlag countryCode={proxy.country} svg style={{ width: '1em', height: '1em' }} />
                  {proxy.country}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
            {PROXY_STATUS_LABELS[proxy.status]}
          </span>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Connection details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Server className="w-3 h-3 flex-shrink-0" />
          <span className="truncate font-mono">{proxy.host}:{proxy.port}</span>
        </div>
        {proxy.username && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Globe className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{proxy.username}</span>
          </div>
        )}
        {proxy.provider && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Wifi className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{proxy.provider}</span>
          </div>
        )}
        {proxy.expires_at && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>
              {new Intl.DateTimeFormat('pt-BR').format(new Date(proxy.expires_at))}
            </span>
          </div>
        )}
      </div>

      {/* Linked account */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/60">
        {linkedAccount ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] text-emerald-400 flex-1 truncate flex items-center gap-1.5">
              <span>Vinculado a:</span>
              <span className="font-medium text-foreground">{linkedAccount.name}</span>
            </span>
            {onUnlink && (
              <button
                onClick={onUnlink}
                className="text-[10px] flex items-center gap-1 text-muted-foreground hover:text-red-400 transition-colors"
                title="Desvincular conta deste proxy"
              >
                <Unlink className="w-3 h-3" />
                Desvincular
              </button>
            )}
          </>
        ) : (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground/60 flex-1">Sem conta vinculada</span>
            <button
              onClick={onEdit}
              className="text-[10px] flex items-center gap-1 text-orange-400/80 hover:text-orange-400 hover:underline transition-colors"
            >
              <Link2 className="w-3 h-3" />
              Vincular
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ── ProxiesManager (main export) ─────────────────────────────────────────────

interface ProxiesManagerProps {
  organizationId: string;
  platformAccounts: PlatformAccount[];
  /** Se fornecido, mostra apenas o proxy vinculado a esta conta */
  filterByAccountId?: string;
}

export const ProxiesManager: React.FC<ProxiesManagerProps> = ({
  organizationId,
  platformAccounts,
  filterByAccountId,
}) => {
  const { proxies, isLoading, deleteProxy, linkProxy, isDeleting, isLinking } =
    useProxies(organizationId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('all');

  // Mapeia proxy_id → platform_account para exibir vinculação
  const proxyToAccount = useMemo(() => {
    const map = new Map<string, PlatformAccount>();
    for (const acc of platformAccounts) {
      if ((acc as PlatformAccount & { proxy_id?: string | null }).proxy_id) {
        map.set((acc as PlatformAccount & { proxy_id?: string | null }).proxy_id!, acc);
      }
    }
    return map;
  }, [platformAccounts]);

  const visibleProxies = useMemo(() => {
    if (filterByAccountId) {
      return proxies.filter((p) => {
        const acc = proxyToAccount.get(p.id);
        return acc?.id === filterByAccountId;
      });
    }
    return proxies;
  }, [proxies, filterByAccountId, proxyToAccount]);

  // Agrupa proxies por país
  const groupedByCountry = useMemo(() => {
    const groupsMap = new Map<string, { code: string; name: string; proxies: Proxy[] }>();

    for (const proxy of visibleProxies) {
      const code = proxy.country ? proxy.country.trim().toUpperCase() : 'OTHER';
      const name = proxy.country ? getCountryName(proxy.country) : 'Sem país definido';

      if (!groupsMap.has(code)) {
        groupsMap.set(code, { code, name, proxies: [] });
      }
      groupsMap.get(code)!.proxies.push(proxy);
    }

    return Array.from(groupsMap.values()).sort((a, b) => {
      if (a.code === 'OTHER') return 1;
      if (b.code === 'OTHER') return -1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [visibleProxies]);

  // Grupos filtrados para exibição
  const displayedGroups = useMemo(() => {
    if (selectedCountryFilter === 'all') return groupedByCountry;
    return groupedByCountry.filter((g) => g.code === selectedCountryFilter);
  }, [groupedByCountry, selectedCountryFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProxy(deleteId);
      toast.success('Proxy excluído.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir proxy.');
    } finally {
      setDeleteId(null);
    }
  };

  const handleUnlink = async (proxy: Proxy) => {
    const linkedAcc = proxyToAccount.get(proxy.id);
    if (!linkedAcc) return;
    try {
      await linkProxy(linkedAcc.id, null);
      toast.success('Proxy desvinculado com sucesso.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao desvincular proxy.');
    }
  };

  const currentEditingLinkedAccount = editingProxy ? proxyToAccount.get(editingProxy.id) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            Proxies
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie e organize os proxies por país vinculados às contas de plataforma
          </p>
        </div>
        <Button
          onClick={() => { setEditingProxy(null); setFormOpen(true); }}
          className="bg-orange-600 hover:bg-orange-700 text-white gap-2 h-9 text-sm shadow-md shadow-orange-600/20"
        >
          <Plus className="w-4 h-4" />
          Novo Proxy
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : visibleProxies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/20 py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Shield className="w-7 h-7 text-orange-400/60" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Nenhum proxy cadastrado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastre proxies organizados por país para proteger e isolar as sessões das contas.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => { setEditingProxy(null); setFormOpen(true); }}
            className="gap-2 mt-1"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro proxy
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filtros de país (pills) */}
          {groupedByCountry.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-border/40">
              <button
                type="button"
                onClick={() => setSelectedCountryFilter('all')}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                  selectedCountryFilter === 'all'
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-semibold'
                    : 'bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground border border-border/50'
                }`}
              >
                <span>Todos os países</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/60 font-mono">
                  {visibleProxies.length}
                </span>
              </button>
              {groupedByCountry.map((group) => {
                const isSelected = selectedCountryFilter === group.code;
                return (
                  <button
                    key={group.code}
                    type="button"
                    onClick={() => setSelectedCountryFilter(group.code)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-semibold'
                        : 'bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground border border-border/50'
                    }`}
                  >
                    {group.code !== 'OTHER' ? (
                      <ReactCountryFlag countryCode={group.code} svg style={{ width: '1.2em', height: '1.2em' }} />
                    ) : (
                      <Globe className="w-3.5 h-3.5" />
                    )}
                    <span>{group.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/60 font-mono">
                      {group.proxies.length}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Seções por País */}
          <div className="space-y-8">
            {displayedGroups.map((group) => (
              <section key={group.code} className="space-y-3">
                {/* Cabeçalho da Seção do País */}
                <div className="flex items-center justify-between pb-2 border-b border-border/70">
                  <div className="flex items-center gap-2.5">
                    {group.code !== 'OTHER' ? (
                      <div className="w-6 h-4.5 rounded overflow-hidden shadow-xs flex items-center justify-center bg-muted/40">
                        <ReactCountryFlag
                          countryCode={group.code}
                          svg
                          style={{ width: '1.25em', height: '1.25em' }}
                          title={group.name}
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-4.5 rounded flex items-center justify-center bg-muted/40 text-muted-foreground">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground tracking-tight">
                        {group.name}
                      </h3>
                      {group.code !== 'OTHER' && (
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {group.code}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/40">
                    {group.proxies.length} {group.proxies.length === 1 ? 'proxy' : 'proxies'}
                  </span>
                </div>

                {/* Grid de Cards de Proxies deste país */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.proxies.map((proxy) => (
                    <ProxyCard
                      key={proxy.id}
                      proxy={proxy}
                      linkedAccount={proxyToAccount.get(proxy.id) ?? null}
                      onEdit={() => { setEditingProxy(proxy); setFormOpen(true); }}
                      onDelete={() => setDeleteId(proxy.id)}
                      onUnlink={() => handleUnlink(proxy)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {/* Form dialog with account linking */}
      <ProxyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        proxy={editingProxy}
        organizationId={organizationId}
        platformAccounts={platformAccounts}
        currentLinkedAccount={currentEditingLinkedAccount}
        onSaved={() => {}}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent className="bg-card border-border text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proxy?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Essa ação é irreversível. Verifique se o proxy não está vinculado a nenhuma conta antes de excluir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-input text-foreground hover:bg-accent">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || isLinking}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProxiesManager;
