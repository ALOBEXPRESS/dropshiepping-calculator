import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Shield, Plus, Pencil, Trash2, Loader2, Eye, EyeOff,
  Globe, Wifi, Clock, AlertTriangle, CheckCircle2, Server,
  Link2, Unlink,
} from 'lucide-react';
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
import type { PlatformAccount } from '@/types/platformAccounts';
import type { Proxy, ProxyFormData } from '@/types/proxies';
import {
  proxySchema,
  PROXY_PROTOCOL_LABELS,
  PROXY_TYPE_LABELS,
  PROXY_STATUS_LABELS,
  PROXY_STATUS_COLORS,
} from '@/types/proxies';

// ── ProxyFormDialog ───────────────────────────────────────────────────────────

interface ProxyFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proxy?: Proxy | null;
  organizationId: string;
  onSaved: (proxy: Proxy) => void;
}

export const ProxyFormDialog: React.FC<ProxyFormDialogProps> = ({
  open,
  onOpenChange,
  proxy,
  organizationId,
  onSaved,
}) => {
  const { createProxy, updateProxy, isCreating, isUpdating } = useProxies(organizationId);
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = !!proxy;
  const isBusy = isCreating || isUpdating;

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

  const onSubmit = async (data: ProxyFormData) => {
    try {
      let saved: Proxy;
      if (isEditing && proxy) {
        saved = await updateProxy(proxy.id, data);
        toast.success('Proxy atualizado com sucesso!');
      } else {
        saved = await createProxy(data);
        toast.success('Proxy criado com sucesso!');
      }
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
            <p className="text-[11px] text-muted-foreground">
              {PROXY_PROTOCOL_LABELS[proxy.protocol]}·{PROXY_TYPE_LABELS[proxy.proxy_type]}
              {proxy.country ? ` · ${proxy.country}` : ''}
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
            <span className="text-[11px] text-emerald-400 flex-1 truncate">
              Vinculado a: <span className="font-medium">{linkedAccount.name}</span>
            </span>
            {onUnlink && (
              <button
                onClick={onUnlink}
                className="text-[10px] flex items-center gap-1 text-muted-foreground hover:text-red-400 transition-colors"
              >
                <Unlink className="w-3 h-3" />
                Desvincular
              </button>
            )}
          </>
        ) : (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground/60">Sem conta vinculada</span>
            <Link2 className="w-3 h-3 text-muted-foreground/40 ml-auto" />
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

  // Mapeia proxy_id → platform_account para exibir vinculação
  const proxyToAccount = React.useMemo(() => {
    const map = new Map<string, PlatformAccount>();
    for (const acc of platformAccounts) {
      if ((acc as PlatformAccount & { proxy_id?: string | null }).proxy_id) {
        map.set((acc as PlatformAccount & { proxy_id?: string | null }).proxy_id!, acc);
      }
    }
    return map;
  }, [platformAccounts]);

  const visibleProxies = filterByAccountId
    ? proxies.filter((p) => {
        const acc = proxyToAccount.get(p.id);
        return acc?.id === filterByAccountId;
      })
    : proxies;

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            Proxies
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie os proxies vinculados às contas de plataforma
          </p>
        </div>
        <Button
          onClick={() => { setEditingProxy(null); setFormOpen(true); }}
          className="bg-orange-600 hover:bg-orange-700 text-white gap-2 h-9 text-sm"
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
              Cadastre proxies para proteger e isolar as sessões das contas de plataforma.
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProxies.map((proxy) => (
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
      )}

      {/* Form dialog */}
      <ProxyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        proxy={editingProxy}
        organizationId={organizationId}
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
