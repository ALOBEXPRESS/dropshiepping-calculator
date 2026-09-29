import React, { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Compass,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Copy,
  Check,
  Shield,
  User,
  AlertTriangle,
  Archive,
  RotateCcw,
} from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { toast } from 'sonner';
import { useSearchParams, Link } from 'react-router-dom';
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
import { useBrowserProfiles } from '@/hooks/useBrowserProfiles';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import { useProxies } from '@/hooks/useProxies';
import type {
  BrowserProfile,
  BrowserProfileFormData,
  BrowserProfileTool,
  BrowserProfileStatus,
} from '@/types/browserProfiles';
import {
  browserProfileSchema,
  BROWSER_PROFILE_TOOL_LABELS,
  BROWSER_PROFILE_STATUS_LABELS,
  BROWSER_PROFILE_STATUS_COLORS,
} from '@/types/browserProfiles';
import type { PlatformAccount } from '@/types/platformAccounts';

// ── BrowserProfileFormDialog ──────────────────────────────────────────────────

interface BrowserProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: BrowserProfile | null;
  organizationId: string;
  platformAccounts: PlatformAccount[];
  defaultAccountId?: string | null;
}

export const BrowserProfileFormDialog: React.FC<BrowserProfileFormDialogProps> = ({
  open,
  onOpenChange,
  profile,
  organizationId,
  platformAccounts,
  defaultAccountId,
}) => {
  const { createProfile, updateProfile, isCreating, isUpdating } =
    useBrowserProfiles(organizationId);
  const { proxies } = useProxies(organizationId);
  const isEditing = !!profile;
  const isBusy = isCreating || isUpdating;

  const proxyMap = useMemo(() => new Map(proxies.map((p) => [p.id, p])), [proxies]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<BrowserProfileFormData>({
    resolver: zodResolver(browserProfileSchema),
    defaultValues: profile
      ? {
          platform_account_id: profile.platform_account_id,
          tool: 'adspower',
          external_profile_id: profile.external_profile_id ?? '',
          name: profile.name ?? '',
          notes: profile.notes ?? '',
          status: profile.status as BrowserProfileStatus,
        }
      : {
          platform_account_id: defaultAccountId || (platformAccounts[0]?.id ?? ''),
          tool: 'adspower',
          external_profile_id: '',
          name: '',
          notes: '',
          status: 'active',
        },
  });

  const selectedAccountId = watch('platform_account_id');
  const selectedAccount = useMemo(
    () => platformAccounts.find((a) => a.id === selectedAccountId),
    [platformAccounts, selectedAccountId]
  );
  const derivedProxy = selectedAccount?.proxy_id
    ? proxyMap.get(selectedAccount.proxy_id)
    : null;

  useEffect(() => {
    if (open) {
      reset(
        profile
          ? {
              platform_account_id: profile.platform_account_id,
              tool: 'adspower',
              external_profile_id: profile.external_profile_id ?? '',
              name: profile.name ?? '',
              notes: profile.notes ?? '',
              status: profile.status as BrowserProfileStatus,
            }
          : {
              platform_account_id: defaultAccountId || (platformAccounts[0]?.id ?? ''),
              tool: 'adspower',
              external_profile_id: '',
              name: '',
              notes: '',
              status: 'active',
            }
      );
    }
  }, [open, profile, defaultAccountId, platformAccounts, reset]);

  const onSubmit = async (data: BrowserProfileFormData) => {
    try {
      if (isEditing && profile) {
        await updateProfile(profile.id, data);
        toast.success('Perfil de navegador atualizado com sucesso!');
      } else {
        await createProfile(data);
        toast.success('Perfil de navegador criado com sucesso!');
      }
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao salvar perfil de navegador.'
      );
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            {isEditing ? 'Editar Perfil de Navegador' : 'Novo Perfil de Navegador'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Tool (AdsPower) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Ferramenta Anti-detect <span className="text-red-400">*</span>
            </Label>
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-300">AdsPower</span>
              </div>
              <span className="text-[10px] text-muted-foreground bg-background/50 px-2 py-0.5 rounded">
                Ativo no frontend
              </span>
            </div>
            <input type="hidden" {...register('tool')} value="adspower" />
          </div>

          {/* Platform Account Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Conta de Plataforma Vinculada <span className="text-red-400">*</span>
            </Label>
            <Controller
              name="platform_account_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-background border-input text-xs">
                    <SelectValue placeholder="Selecione uma conta de plataforma..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-input max-h-56">
                    {platformAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        <span className="flex items-center gap-2">
                          {acc.country && (
                            <ReactCountryFlag countryCode={acc.country} svg style={{ width: '1em', height: '1em' }} />
                          )}
                          <span>{acc.name}</span>
                          <span className="text-[10px] text-muted-foreground">({acc.platform})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.platform_account_id && (
              <p className="text-xs text-red-400">{errors.platform_account_id.message}</p>
            )}
          </div>

          {/* Derived Proxy Info Box */}
          <div className="p-3 rounded-lg border border-border/80 bg-accent/20 space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-orange-400" />
              Proxy Derivado da Conta (Regra de Negócio)
            </p>
            {derivedProxy ? (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-medium text-foreground truncate">
                  {derivedProxy.label} ({derivedProxy.host}:{derivedProxy.port})
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  Herança ativa
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs pt-1 text-amber-400">
                <span className="flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  A conta selecionada ainda não possui proxy configurado.
                </span>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              O perfil não armazena proxy próprio — ele sempre utiliza o proxy configurado na conta.
            </p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-name" className="text-xs font-semibold text-foreground">
              Nome do Perfil
            </Label>
            <Input
              id="profile-name"
              {...register('name')}
              placeholder="Ex: Perfil Principal AdsPower #01"
              className="bg-background border-input text-xs"
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* External Profile ID (AdsPower Serial) */}
          <div className="space-y-1.5">
            <Label htmlFor="external_profile_id" className="text-xs font-semibold text-foreground">
              ID / Serial no AdsPower (Opcional)
            </Label>
            <Input
              id="external_profile_id"
              {...register('external_profile_id')}
              placeholder="Ex: k7y2m10 ou serial numérico"
              className="bg-background border-input font-mono text-xs"
            />
            {errors.external_profile_id && (
              <p className="text-xs text-red-400">
                {errors.external_profile_id.message}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Identificador do perfil no painel do AdsPower para cópia rápida.
            </p>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-background border-input text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-input">
                    {Object.entries(BROWSER_PROFILE_STATUS_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold text-foreground">
              Observações
            </Label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={2}
              placeholder="Anotações internas, máquina, cookies..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isBusy}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isBusy}
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs gap-1.5"
            >
              {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Perfil'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── BrowserProfileCard ────────────────────────────────────────────────────────

interface BrowserProfileCardProps {
  profile: BrowserProfile;
  account?: PlatformAccount | null;
  proxyLabel?: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

const BrowserProfileCard: React.FC<BrowserProfileCardProps> = ({
  profile,
  account,
  proxyLabel,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [copied, setCopied] = useState(false);
  const statusColor = BROWSER_PROFILE_STATUS_COLORS[profile.status as BrowserProfileStatus] || '';
  const isArchived = profile.status === 'archived';

  const handleCopySerial = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile.external_profile_id) return;
    navigator.clipboard.writeText(profile.external_profile_id);
    setCopied(true);
    toast.success('ID do AdsPower copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-b from-card/80 to-card/40 p-5 space-y-4 transition-all shadow-sm ${
        isArchived
          ? 'border-border/50 opacity-75'
          : 'border-border/80 hover:border-cyan-500/40'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Compass className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {profile.name || profile.external_profile_id || 'Perfil sem nome'}
            </h3>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="font-semibold text-cyan-400">
                {BROWSER_PROFILE_TOOL_LABELS[profile.tool as BrowserProfileTool] || profile.tool}
              </span>
              <span>·</span>
              <span className={`px-1.5 py-0.2 rounded-full border text-[10px] font-semibold ${statusColor}`}>
                {BROWSER_PROFILE_STATUS_LABELS[profile.status as BrowserProfileStatus] || profile.status}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggleStatus}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title={isArchived ? 'Reativar perfil' : 'Arquivar perfil'}
          >
            {isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Editar perfil"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
            title="Excluir perfil"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* External ID Badge */}
      {profile.external_profile_id && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-accent/30 border border-border/60">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">
              ID / Serial AdsPower
            </p>
            <p className="font-mono text-xs font-semibold text-foreground truncate select-all">
              {profile.external_profile_id}
            </p>
          </div>
          <button
            onClick={handleCopySerial}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Copiar ID"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Linked Account info */}
      <div className="space-y-1.5 pt-1 border-t border-border/60 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <User className="w-3 h-3 text-brand" /> Conta Vinculada:
          </span>
          {account ? (
            <Link
              to="/contas"
              className="font-medium text-foreground hover:underline flex items-center gap-1.5 max-w-[170px] truncate"
            >
              {account.country && (
                <ReactCountryFlag countryCode={account.country} svg style={{ width: '1em', height: '1em' }} />
              )}
              <span className="truncate">{account.name}</span>
            </Link>
          ) : (
            <span className="text-muted-foreground italic">Não encontrada</span>
          )}
        </div>

        {/* Derived Proxy */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-orange-400" /> Proxy Derivado:
          </span>
          {proxyLabel ? (
            <span className="font-mono text-[11px] font-medium text-orange-400 truncate max-w-[170px]">
              {proxyLabel}
            </span>
          ) : (
            <span className="text-zinc-500 italic text-[11px]">Nenhum (na conta)</span>
          )}
        </div>
      </div>

      {/* Notes if any */}
      {profile.notes && (
        <p className="text-xs text-muted-foreground line-clamp-2 italic pt-1">
          "{profile.notes}"
        </p>
      )}
    </div>
  );
};

// ── BrowserProfilesManager ────────────────────────────────────────────────────

interface BrowserProfilesManagerProps {
  organizationId: string;
}

export const BrowserProfilesManager: React.FC<BrowserProfilesManagerProps> = ({
  organizationId,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const accountFilterParam = searchParams.get('account') || 'all';
  const newForParam = searchParams.get('newFor');

  const {
    profiles,
    isLoading,
    deleteProfile,
    updateProfile,
    isDeleting,
  } = useBrowserProfiles(organizationId);

  const { data: platformAccounts = [] } = usePlatformAccounts();
  const { proxies } = useProxies(organizationId);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [accountFilter, setAccountFilter] = useState<string>(accountFilterParam);
  const [formOpen, setFormOpen] = useState(!!newForParam);
  const [editingProfile, setEditingProfile] = useState<BrowserProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrowserProfile | null>(null);

  const accountMap = useMemo(
    () => new Map(platformAccounts.map((a) => [a.id, a])),
    [platformAccounts]
  );
  const proxyMap = useMemo(
    () => new Map(proxies.map((p) => [p.id, p])),
    [proxies]
  );

  // Sincroniza filtro se URL mudar
  useEffect(() => {
    if (accountFilterParam) {
      setAccountFilter(accountFilterParam);
    }
    if (newForParam) {
      setFormOpen(true);
    }
  }, [accountFilterParam, newForParam]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (accountFilter !== 'all' && p.platform_account_id !== accountFilter) return false;
      if (search.trim()) {
        const term = search.toLowerCase().trim();
        const matchesName = p.name && p.name.toLowerCase().includes(term);
        const matchesSerial =
          p.external_profile_id && p.external_profile_id.toLowerCase().includes(term);
        const matchesNotes = p.notes && p.notes.toLowerCase().includes(term);
        if (!matchesName && !matchesSerial && !matchesNotes) return false;
      }
      return true;
    });
  }, [profiles, statusFilter, accountFilter, search]);

  const activeCount = useMemo(
    () => profiles.filter((p) => p.status === 'active').length,
    [profiles]
  );

  const withProxyCount = useMemo(() => {
    return profiles.filter((p) => {
      const acc = accountMap.get(p.platform_account_id);
      return !!acc?.proxy_id;
    }).length;
  }, [profiles, accountMap]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProfile(deleteTarget.id);
      toast.success('Perfil de navegador excluído com sucesso.');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao excluir perfil.'
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggleStatus = async (profile: BrowserProfile) => {
    const newStatus: BrowserProfileStatus =
      profile.status === 'active' ? 'archived' : 'active';
    try {
      await updateProfile(profile.id, { status: newStatus });
      toast.success(
        newStatus === 'active' ? 'Perfil reativado!' : 'Perfil arquivado!'
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao alterar status.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-cyan-400" />
            Perfis de Navegador
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie perfis anti-detect (AdsPower) com isolamento de sessão e proxies derivados das contas
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProfile(null);
            setFormOpen(true);
          }}
          className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2 h-10 text-xs shadow-md"
        >
          <Plus className="w-4 h-4" />
          Novo Perfil AdsPower
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Total de Perfis</p>
          <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Perfis Ativos</p>
          <p className="text-2xl font-bold text-cyan-400">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Com Proxy Derivado</p>
          <p className="text-2xl font-bold text-orange-400">{withProxyCount}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Ferramenta Suportada</p>
          <p className="text-2xl font-bold text-foreground">AdsPower</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, serial ou notas..."
            className="pl-9 bg-background border-input text-xs h-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v: 'all' | 'active' | 'archived') => setStatusFilter(v)}
        >
          <SelectTrigger className="w-[140px] bg-background border-input text-xs h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-input">
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="archived">Arquivados</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={accountFilter}
          onValueChange={(v) => {
            setAccountFilter(v);
            if (v === 'all') {
              searchParams.delete('account');
            } else {
              searchParams.set('account', v);
            }
            setSearchParams(searchParams);
          }}
        >
          <SelectTrigger className="w-[180px] bg-background border-input text-xs h-9">
            <SelectValue placeholder="Conta vinculada" />
          </SelectTrigger>
          <SelectContent className="bg-card border-input max-h-56">
            <SelectItem value="all">Todas as Contas</SelectItem>
            {platformAccounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name} ({acc.country})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/20 py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
            <Compass className="w-7 h-7 text-cyan-400/60" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {search || accountFilter !== 'all' || statusFilter !== 'all'
                ? 'Nenhum perfil corresponde aos filtros'
                : 'Nenhum perfil de navegador cadastrado'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {search || accountFilter !== 'all' || statusFilter !== 'all'
                ? 'Tente alterar os filtros ou limpar a pesquisa.'
                : 'Cadastre seus perfis do AdsPower associando-os às contas de plataforma para manter as sessões e proxies organizados.'}
            </p>
          </div>
          {!search && accountFilter === 'all' && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingProfile(null);
                setFormOpen(true);
              }}
              className="gap-2 mt-1 text-xs"
            >
              <Plus className="w-4 h-4" />
              Criar primeiro perfil
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProfiles.map((p) => {
            const acc = accountMap.get(p.platform_account_id);
            const proxy = acc?.proxy_id ? proxyMap.get(acc.proxy_id) : null;
            const proxyLabel = proxy ? `${proxy.label} (${proxy.host}:${proxy.port})` : null;

            return (
              <BrowserProfileCard
                key={p.id}
                profile={p}
                account={acc ?? null}
                proxyLabel={proxyLabel}
                onEdit={() => {
                  setEditingProfile(p);
                  setFormOpen(true);
                }}
                onDelete={() => setDeleteTarget(p)}
                onToggleStatus={() => handleToggleStatus(p)}
              />
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <BrowserProfileFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o && newForParam) {
            searchParams.delete('newFor');
            setSearchParams(searchParams);
          }
        }}
        profile={editingProfile}
        organizationId={organizationId}
        platformAccounts={platformAccounts}
        defaultAccountId={newForParam || (accountFilter !== 'all' ? accountFilter : null)}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Excluir Perfil de Navegador?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs">
              Tem certeza que deseja excluir o perfil{' '}
              <strong className="text-foreground">
                {deleteTarget?.name || deleteTarget?.external_profile_id || 'selecionado'}
              </strong>
              ? O registro do perfil será removido, mas a conta de plataforma e o proxy permanecerão intactos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-input text-foreground hover:bg-accent text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BrowserProfilesManager;
