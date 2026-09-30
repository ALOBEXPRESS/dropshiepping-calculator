import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Copy,
  Check,
  Megaphone,
  AlertTriangle,
  ExternalLink,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
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
import { useBusinessCenters } from '@/hooks/useBusinessCenters';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import type {
  BusinessCenterWithStats,
  BusinessCenterFormData,
  BusinessCenterPlatform,
} from '@/types/businessCenters';
import { businessCenterSchema, BC_PLATFORM_CONFIG } from '@/types/businessCenters';

import { Controller } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PLATFORM_COUNTRIES } from '@/constants/niches';
import {
  TikTokLogo,
  MetaLogo,
  GoogleLogo,
  InstagramLogo,
  FacebookLogo,
  getPlatformLogo,
  getPlatformColor,
} from '@/components/ui/PlatformLogos';

// ── PlatformSelector ─────────────────────────────────────────────────────────

interface PlatformSelectorProps {
  value: BusinessCenterPlatform;
  onChange: (platform: BusinessCenterPlatform) => void;
  disabled?: boolean;
}

const platformOptions: { value: BusinessCenterPlatform; logo: React.FC<{ className?: string }>; label: string; description: string; color: string; bgActive: string; borderActive: string }[] = [
  {
    value: 'tiktok',
    logo: TikTokLogo,
    label: 'TikTok Business Center',
    description: 'TikTok Ads Manager',
    color: 'text-cyan-400',
    bgActive: 'bg-cyan-500/10',
    borderActive: 'border-cyan-500/50',
  },
  {
    value: 'meta',
    logo: MetaLogo,
    label: 'Meta Business Portfolio',
    description: 'Instagram · Facebook',
    color: 'text-blue-400',
    bgActive: 'bg-blue-500/10',
    borderActive: 'border-blue-500/50',
  },
  {
    value: 'google',
    logo: GoogleLogo,
    label: 'Google Ads Manager',
    description: 'Google Ads',
    color: 'text-yellow-400',
    bgActive: 'bg-yellow-500/10',
    borderActive: 'border-yellow-500/50',
  },
];

const PlatformSelector: React.FC<PlatformSelectorProps> = ({ value, onChange, disabled }) => (
  <div className="grid grid-cols-3 gap-2">
    {platformOptions.map((opt) => {
      const isActive = value === opt.value;
      const Logo = opt.logo;
      return (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
            isActive
              ? `${opt.bgActive} ${opt.borderActive}`
              : 'border-border bg-background hover:border-border/80'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Logo className={`w-6 h-6 ${isActive ? opt.color : 'text-muted-foreground'}`} />
          <span className={`text-[11px] font-semibold leading-tight ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
            {opt.label}
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">{opt.description}</span>
        </button>
      );
    })}
  </div>
);

// ── BusinessCenterFormDialog ──────────────────────────────────────────────────

interface BusinessCenterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  center?: BusinessCenterWithStats | null;
  organizationId: string;
}

export const BusinessCenterFormDialog: React.FC<BusinessCenterFormDialogProps> = ({
  open,
  onOpenChange,
  center,
  organizationId,
}) => {
  const { createCenter, updateCenter, isCreating, isUpdating } =
    useBusinessCenters(organizationId);
  const { data: platformAccounts = [] } = usePlatformAccounts();
  const isEditing = !!center;
  const isBusy = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BusinessCenterFormData>({
    resolver: zodResolver(businessCenterSchema),
    defaultValues: center
      ? {
          platform: center.platform ?? 'tiktok',
          business_type: center.business_type ?? 'advertiser',
          company_legal_name: center.company_legal_name ?? '',
          name: center.name ?? '',
          country: center.country ?? 'BR',
          timezone: center.timezone ?? 'America/Sao_Paulo',
          currency: center.currency ?? 'BRL',
          bc_id: center.bc_id ?? '',
          notes: center.notes ?? '',
          meta_linked_network: center.meta_linked_network ?? null,
          meta_linked_account_id: center.meta_linked_account_id ?? null,
        }
      : {
          platform: 'tiktok',
          business_type: 'advertiser',
          company_legal_name: '',
          name: '',
          country: 'BR',
          timezone: 'America/Sao_Paulo',
          currency: 'BRL',
          bc_id: '',
          notes: '',
          meta_linked_network: null,
          meta_linked_account_id: null,
        },
  });

  const businessType = watch('business_type') || 'advertiser';
  const selectedPlatform = watch('platform') || 'tiktok';
  const metaLinkedNetwork = watch('meta_linked_network');
  const metaLinkedAccountId = watch('meta_linked_account_id');

  // Filtrar contas de plataforma por tipo de rede meta
  const metaCompatibleAccounts = useMemo(() => {
    if (!metaLinkedNetwork) return platformAccounts;
    const filtered = platformAccounts.filter((a) => {
      if (a.meta_account_type) {
        return a.meta_account_type === metaLinkedNetwork;
      }
      if (a.platform === 'meta') return true;
      return false;
    });
    return filtered.length > 0 ? filtered : platformAccounts;
  }, [platformAccounts, metaLinkedNetwork]);

  const selectedMetaAccount = useMemo(() => {
    if (!metaLinkedAccountId) return null;
    return metaCompatibleAccounts.find((a) => a.id === metaLinkedAccountId) ?? null;
  }, [metaLinkedAccountId, metaCompatibleAccounts]);

  const platformConfig = BC_PLATFORM_CONFIG[selectedPlatform];

  React.useEffect(() => {
    if (open) {
      reset(
        center
          ? {
              platform: center.platform ?? 'tiktok',
              business_type: center.business_type ?? 'advertiser',
              company_legal_name: center.company_legal_name ?? '',
              name: center.name ?? '',
              country: center.country ?? 'BR',
              timezone: center.timezone ?? 'America/Sao_Paulo',
              currency: center.currency ?? 'BRL',
              bc_id: center.bc_id ?? '',
              notes: center.notes ?? '',
              meta_linked_network: center.meta_linked_network ?? null,
              meta_linked_account_id: center.meta_linked_account_id ?? null,
            }
          : {
              platform: 'tiktok',
              business_type: 'advertiser',
              company_legal_name: '',
              name: '',
              country: 'BR',
              timezone: 'America/Sao_Paulo',
              currency: 'BRL',
              bc_id: '',
              notes: '',
              meta_linked_network: null,
              meta_linked_account_id: null,
            }
      );
    }
  }, [open, center, reset]);

  const onSubmit = async (data: BusinessCenterFormData) => {
    try {
      if (isEditing && center) {
        await updateCenter(center.id, data);
        toast.success('Business Center atualizado com sucesso!');
      } else {
        await createCenter(data);
        toast.success('Business Center criado com sucesso!');
      }
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao salvar Business Center.'
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
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Building2 className="w-5 h-5 text-purple-400" />
            {isEditing ? 'Editar Business Center' : 'Novo Business Center'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Seletor de Plataforma */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              Plataforma
            </Label>
            <Controller
              name="platform"
              control={control}
              render={({ field }) => (
                <PlatformSelector
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    // Reset meta fields when switching away from meta
                    if (v !== 'meta') {
                      setValue('meta_linked_network', null);
                      setValue('meta_linked_account_id', null);
                    }
                  }}
                  disabled={isEditing}
                />
              )}
            />
          </div>

          {/* Tipo de negócio */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              Tipo de negócio
            </Label>
            <div className="space-y-2">
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  businessType === 'advertiser'
                    ? 'border-purple-500 bg-purple-500/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-border/80'
                }`}
              >
                <input
                  type="radio"
                  value="advertiser"
                  checked={businessType === 'advertiser'}
                  onChange={() => setValue('business_type', 'advertiser')}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    businessType === 'advertiser'
                      ? 'border-purple-500'
                      : 'border-muted-foreground'
                  }`}
                >
                  {businessType === 'advertiser' && (
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  )}
                </div>
                <div className="text-xs font-medium">Anunciante (Advertiser)</div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  businessType === 'agency'
                    ? 'border-purple-500 bg-purple-500/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-border/80'
                }`}
              >
                <input
                  type="radio"
                  value="agency"
                  checked={businessType === 'agency'}
                  onChange={() => setValue('business_type', 'agency')}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    businessType === 'agency'
                      ? 'border-purple-500'
                      : 'border-muted-foreground'
                  }`}
                >
                  {businessType === 'agency' && (
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  )}
                </div>
                <div className="text-xs font-medium">Agência (Agency)</div>
              </label>
            </div>
          </div>

          {/* Nome legal da empresa */}
          <div className="space-y-1.5">
            <Label htmlFor="company_legal_name" className="text-xs font-semibold text-foreground">
              Nome legal da empresa
            </Label>
            <Input
              id="company_legal_name"
              {...register('company_legal_name')}
              placeholder="Ex.: Alob Express"
              className="bg-background border-input text-xs h-10"
            />
          </div>

          {/* Nome do Business Center */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-foreground">
              Nome do Business Center <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex.: Alob Express — Marketing"
              className="bg-background border-input text-xs h-10"
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* País ou região */}
          <div className="space-y-1.5">
            <Label htmlFor="country" className="text-xs font-semibold text-foreground">
              País ou região
            </Label>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-background border-input text-xs h-10">
                    <SelectValue placeholder="Selecione o país" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {PLATFORM_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Fuso horário */}
          <div className="space-y-1.5">
            <Label htmlFor="timezone" className="text-xs font-semibold text-foreground">
              Fuso horário
            </Label>
            <Input
              id="timezone"
              {...register('timezone')}
              placeholder="Ex.: America/Sao_Paulo (UTC−03:00)"
              className="bg-background border-input text-xs h-10"
            />
          </div>

          {/* Moeda */}
          <div className="space-y-1.5">
            <Label htmlFor="currency" className="text-xs font-semibold text-foreground">
              Moeda
            </Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-background border-input text-xs h-10">
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="BRL">BRL (R$ - Real Brasileiro)</SelectItem>
                    <SelectItem value="USD">USD ($ - Dólar Americano)</SelectItem>
                    <SelectItem value="EUR">EUR (€ - Euro)</SelectItem>
                    <SelectItem value="GBP">GBP (£ - Libra Esterlina)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* ID do Business Center — Plataforma-específico */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <Label htmlFor="bc_id" className="text-xs font-semibold text-foreground">
                {platformConfig.idLabel}
              </Label>
              <span className="text-[10px] text-muted-foreground uppercase">Opcional</span>
            </div>
            <Input
              id="bc_id"
              {...register('bc_id')}
              placeholder={platformConfig.idPlaceholder}
              className="bg-background border-input font-mono text-xs h-10"
            />
            {errors.bc_id && (
              <p className="text-xs text-red-400">{errors.bc_id.message}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Se você já tem o ID, informe aqui. Caso contrário, geraremos um identificador automático.
            </p>
          </div>

          {/* Meta: Vincular Conta (Instagram/Facebook) */}
          {selectedPlatform === 'meta' && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-blue-400" />
                  Vincular Conta
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Selecione a rede social e vincule a conta cadastrada em "Contas".
                </p>
              </div>

              {/* Seletor de rede */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValue('meta_linked_network', 'instagram');
                    setValue('meta_linked_account_id', null);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${
                    metaLinkedNetwork === 'instagram'
                      ? 'border-pink-500/50 bg-pink-500/10'
                      : 'border-border bg-background hover:border-border/80'
                  }`}
                >
                  <InstagramLogo className="w-5 h-5" />
                  <span className={`text-xs font-semibold ${metaLinkedNetwork === 'instagram' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Instagram
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('meta_linked_network', 'facebook');
                    setValue('meta_linked_account_id', null);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${
                    metaLinkedNetwork === 'facebook'
                      ? 'border-blue-500/50 bg-blue-500/10'
                      : 'border-border bg-background hover:border-border/80'
                  }`}
                >
                  <FacebookLogo className="w-5 h-5" />
                  <span className={`text-xs font-semibold ${metaLinkedNetwork === 'facebook' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Facebook
                  </span>
                </button>
              </div>

              {/* Seletor de conta vinculada */}
              {metaLinkedNetwork && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Conta de {metaLinkedNetwork === 'instagram' ? 'Instagram' : 'Facebook'} cadastrada
                  </Label>
                  <Controller
                    name="meta_linked_account_id"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || 'none'} onValueChange={(v) => field.onChange(v === 'none' ? null : v)}>
                        <SelectTrigger className="bg-background border-input text-xs h-10">
                          <SelectValue placeholder="Selecione uma conta cadastrada..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border max-h-60">
                          <SelectItem value="none">
                            <span className="text-muted-foreground italic">Nenhuma conta vinculada</span>
                          </SelectItem>
                          {metaCompatibleAccounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{acc.name}</span>
                                {acc.nickname && <span className="text-muted-foreground text-[11px]">@{acc.nickname}</span>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {metaCompatibleAccounts.length === 0 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        Nenhuma conta cadastrada.{' '}
                        <Link to="/contas" className="underline hover:text-amber-200">
                          Cadastre primeiro em Contas
                        </Link>
                        .
                      </span>
                    </div>
                  )}
                  {selectedMetaAccount && (
                    <div className="p-2.5 rounded-lg bg-accent/30 border border-border/60 text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold text-foreground">{selectedMetaAccount.name}</span>
                        {selectedMetaAccount.nickname && (
                          <span className="text-muted-foreground">@{selectedMetaAccount.nickname}</span>
                        )}
                      </div>
                      <p className="text-muted-foreground pl-5.5">
                        {selectedMetaAccount.holder_name}
                        {selectedMetaAccount.email ? ` · ${selectedMetaAccount.email}` : ''}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold text-foreground">
              Observações
            </Label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={2}
              placeholder="Anotações internas, proprietário, finalidade ou limites deste BC..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.notes && (
              <p className="text-xs text-red-400">{errors.notes.message}</p>
            )}
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
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
            >
              {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Business Center'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── BusinessCenterCard ────────────────────────────────────────────────────────

interface BusinessCenterCardProps {
  center: BusinessCenterWithStats;
  onEdit: () => void;
  onDelete: () => void;
}

const BusinessCenterCard: React.FC<BusinessCenterCardProps> = ({
  center,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(center.bc_id);
    setCopied(true);
    toast.success('ID copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const Logo = getPlatformLogo(center.platform);
  const platformColor = getPlatformColor(center.platform);
  const platformConfig = BC_PLATFORM_CONFIG[center.platform] || BC_PLATFORM_CONFIG.tiktok;

  return (
    <div className="group rounded-2xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 p-5 space-y-4 hover:border-purple-500/40 transition-all shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl ${platformConfig.bgColor} border ${platformConfig.borderColor} flex items-center justify-center flex-shrink-0`}>
            <Logo className={`w-5 h-5 ${platformColor}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {center.name || `BC ${center.bc_id}`}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={`inline-flex items-center text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${platformConfig.bgColor} ${platformColor} border ${platformConfig.borderColor}`}>
                {center.platform}
              </span>
              <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {center.business_type === 'agency' ? 'Agência' : 'Anunciante'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Editar Business Center"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
            title="Excluir Business Center"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Empresa & Metadados */}
      {(center.company_legal_name || center.country) && (
        <div className="text-xs space-y-1 bg-accent/20 p-2.5 rounded-xl border border-border/50">
          {center.company_legal_name && (
            <p className="text-foreground font-medium truncate">
              <span className="text-muted-foreground font-normal">Empresa: </span>
              {center.company_legal_name}
            </p>
          )}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
            <span>{center.country || 'BR'}</span>
            <span>·</span>
            <span>{center.currency || 'BRL'}</span>
            <span>·</span>
            <span className="font-mono">{center.timezone || 'America/Sao_Paulo'}</span>
          </div>
        </div>
      )}

      {/* ID Badge with copy */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-accent/30 border border-border/60">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            {platformConfig.idLabel}
          </p>
          <p className="font-mono text-xs font-semibold text-foreground truncate select-all">
            {center.bc_id}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Copiar ID"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Meta linked account info */}
      {center.platform === 'meta' && center.meta_linked_network && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
          {center.meta_linked_network === 'instagram' ? (
            <InstagramLogo className="w-4 h-4 flex-shrink-0" />
          ) : (
            <FacebookLogo className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="text-blue-300 font-medium capitalize">
            {center.meta_linked_network} vinculado
          </span>
        </div>
      )}

      {/* Notes if any */}
      {center.notes && (
        <p className="text-xs text-muted-foreground line-clamp-2 italic">
          "{center.notes}"
        </p>
      )}

      {/* Footer: Linked Ad Accounts counter */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Megaphone className="w-3.5 h-3.5 text-purple-400" />
          <span>Contas de Anúncio:</span>
        </div>
        <Link
          to="/contas-anuncios"
          className="inline-flex items-center gap-1 font-semibold text-purple-400 hover:text-purple-300 hover:underline"
        >
          <span>{center.ad_account_count} vinculada{center.ad_account_count !== 1 ? 's' : ''}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

// ── BusinessCentersManager ────────────────────────────────────────────────────

interface BusinessCentersManagerProps {
  organizationId: string;
}

export const BusinessCentersManager: React.FC<BusinessCentersManagerProps> = ({
  organizationId,
}) => {
  const { centers, isLoading, deleteCenter, isDeleting } =
    useBusinessCenters(organizationId);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<BusinessCenterWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BusinessCenterWithStats | null>(null);

  const filteredCenters = useMemo(() => {
    if (!search.trim()) return centers;
    const term = search.toLowerCase().trim();
    return centers.filter(
      (c) =>
        c.bc_id.toLowerCase().includes(term) ||
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.notes && c.notes.toLowerCase().includes(term)) ||
        c.platform.toLowerCase().includes(term)
    );
  }, [centers, search]);

  const totalLinkedAccounts = useMemo(() => {
    return centers.reduce((sum, c) => sum + (c.ad_account_count ?? 0), 0);
  }, [centers]);

  // Contagem por plataforma
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    centers.forEach((c) => {
      counts[c.platform] = (counts[c.platform] || 0) + 1;
    });
    return counts;
  }, [centers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCenter(deleteTarget.id);
      toast.success('Business Center excluído com sucesso.');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao excluir Business Center.'
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-purple-400" />
            Business Centers
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie seus Business Centers para centralizar e vincular suas contas de anúncios em múltiplas plataformas
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCenter(null);
            setFormOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2 h-10 text-xs shadow-md"
        >
          <Plus className="w-4 h-4" />
          Novo Business Center
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Total de Business Centers</p>
          <p className="text-2xl font-bold text-foreground">{centers.length}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Contas de Anúncio Vinculadas</p>
          <p className="text-2xl font-bold text-purple-400">{totalLinkedAccounts}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Plataformas Ativas</p>
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {Object.entries(platformCounts).map(([platform, count]) => {
              const Logo = getPlatformLogo(platform);
              const color = getPlatformColor(platform);
              return (
                <div key={platform} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent/40 border border-border/60">
                  <Logo className={`w-4 h-4 ${color}`} />
                  <span className="text-xs font-semibold text-foreground capitalize">{platform}</span>
                  <span className="text-[10px] text-muted-foreground">({count})</span>
                </div>
              );
            })}
            {Object.keys(platformCounts).length === 0 && (
              <span className="text-sm text-muted-foreground">Nenhuma</span>
            )}
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ID, nome, plataforma ou notas..."
            className="pl-9 bg-background border-input text-xs h-9"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCenters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/20 py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-purple-400/60" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {search ? 'Nenhum Business Center encontrado' : 'Nenhum Business Center cadastrado'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {search
                ? 'Tente ajustar os termos da sua busca.'
                : 'Cadastre os Business Centers da sua organização para associá-los às contas de anúncios de forma reutilizável.'}
            </p>
          </div>
          {!search && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingCenter(null);
                setFormOpen(true);
              }}
              className="gap-2 mt-1 text-xs"
            >
              <Plus className="w-4 h-4" />
              Criar primeiro Business Center
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCenters.map((center) => (
            <BusinessCenterCard
              key={center.id}
              center={center}
              onEdit={() => {
                setEditingCenter(center);
                setFormOpen(true);
              }}
              onDelete={() => setDeleteTarget(center)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <BusinessCenterFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        center={editingCenter}
        organizationId={organizationId}
      />

      {/* Delete Confirmation Alert Dialog */}
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
              Excluir Business Center?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs space-y-2">
              <p>
                Tem certeza que deseja excluir o Business Center{' '}
                <strong className="text-foreground">
                  {deleteTarget?.name || deleteTarget?.bc_id}
                </strong>
                ?
              </p>
              {deleteTarget && deleteTarget.ad_account_count > 0 && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  Atenção: Este Business Center está vinculado a{' '}
                  <strong>{deleteTarget.ad_account_count}</strong> conta(s) de anúncios.
                  A exclusão só será permitida se as contas forem desvinculadas primeiro.
                </div>
              )}
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

export default BusinessCentersManager;
