import React, { useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Compass, Loader2, Shield, AlertTriangle } from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useProxies } from '@/hooks/useProxies';
import type {
  BrowserProfile,
  BrowserProfileFormData,
  BrowserProfileStatus,
} from '@/types/browserProfiles';
import {
  browserProfileSchema,
  BROWSER_PROFILE_STATUS_LABELS,
} from '@/types/browserProfiles';
import type { PlatformAccount } from '@/types/platformAccounts';

export interface BrowserProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: BrowserProfile | null;
  organizationId: string;
  platformAccounts: PlatformAccount[];
  defaultAccountId?: string | null;
  onSaved?: (profile: BrowserProfile) => void;
}

interface InnerProfileFormProps {
  profile?: BrowserProfile | null;
  organizationId: string;
  platformAccounts: PlatformAccount[];
  defaultAccountId?: string | null;
  onClose: () => void;
  onSaved?: (profile: BrowserProfile) => void;
}

const InnerProfileForm: React.FC<InnerProfileFormProps> = ({
  profile,
  organizationId,
  platformAccounts,
  defaultAccountId,
  onClose,
  onSaved,
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

  const selectedAccountId = useWatch({
    control,
    name: 'platform_account_id',
    defaultValue: profile?.platform_account_id || defaultAccountId || (platformAccounts[0]?.id ?? ''),
  });
  const selectedAccount = useMemo(
    () => platformAccounts.find((a) => a.id === selectedAccountId),
    [platformAccounts, selectedAccountId]
  );
  const derivedProxy = selectedAccount?.proxy_id
    ? proxyMap.get(selectedAccount.proxy_id)
    : null;

  const onSubmit = async (data: BrowserProfileFormData) => {
    try {
      let saved: BrowserProfile;
      if (isEditing && profile) {
        saved = await updateProfile(profile.id, data);
        toast.success('Perfil de navegador atualizado com sucesso!');
      } else {
        saved = await createProfile(data);
        toast.success('Perfil de navegador criado com sucesso!');
      }
      onSaved?.(saved);
      reset();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao salvar perfil de navegador.'
      );
    }
  };

  return (
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
          onClick={onClose}
          disabled={isBusy}
          className="text-xs cursor-pointer"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isBusy}
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs gap-1.5 cursor-pointer"
        >
          {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isEditing ? 'Salvar Alterações' : 'Criar Perfil'}
        </Button>
      </div>
    </form>
  );
};

export const BrowserProfileFormDialog: React.FC<BrowserProfileFormDialogProps> = ({
  open,
  onOpenChange,
  profile,
  organizationId,
  platformAccounts,
  defaultAccountId,
  onSaved,
}) => {
  const isEditing = !!profile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            {isEditing ? 'Editar Perfil de Navegador' : 'Novo Perfil de Navegador'}
          </DialogTitle>
        </DialogHeader>

        {open && (
          <InnerProfileForm
            key={profile?.id || 'new'}
            profile={profile}
            organizationId={organizationId}
            platformAccounts={platformAccounts}
            defaultAccountId={defaultAccountId}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
