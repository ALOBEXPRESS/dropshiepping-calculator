import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield, Plus, Loader2, Eye, EyeOff, Link2, Building2 } from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
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
import { useProxies } from '@/hooks/useProxies';
import { useProxyProviders } from '@/hooks/useProxyProviders';
import { useBusinessCenters } from '@/hooks/useBusinessCenters';
import { ProxyProviderFormDialog } from '@/components/proxy-providers/ProxyProviderFormDialog';
import { ProviderLogo } from '@/components/ui/ProviderLogo';
import type { PlatformAccount } from '@/types/platformAccounts';
import type { Proxy, ProxyFormData } from '@/types/proxies';
import type { ProxyProviderFormData } from '@/types/proxyProviders';
import {
  proxySchema,
  PROXY_PROTOCOL_LABELS,
  PROXY_TYPE_LABELS,
  IP_VERSION_LABELS,
  PROXY_STATUS_LABELS,
} from '@/types/proxies';

export interface ProxyFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proxy?: Proxy | null;
  organizationId: string;
  platformAccounts?: PlatformAccount[];
  currentLinkedAccount?: PlatformAccount | null;
  onSaved?: (proxy: Proxy) => void;
}

interface InnerProxyFormProps {
  proxy?: Proxy | null;
  organizationId: string;
  platformAccounts: PlatformAccount[];
  currentLinkedAccount?: PlatformAccount | null;
  onClose: () => void;
  onSaved?: (proxy: Proxy) => void;
}

const InnerProxyForm: React.FC<InnerProxyFormProps> = ({
  proxy,
  organizationId,
  platformAccounts,
  currentLinkedAccount,
  onClose,
  onSaved,
}) => {
  const { createProxy, updateProxy, linkProxy, isCreating, isUpdating, isLinking } =
    useProxies(organizationId);
  const { providers, createProvider, isCreating: isCreatingProvider } = useProxyProviders();
  const { centers: businessCenters = [] } = useBusinessCenters(organizationId);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    () => currentLinkedAccount?.id ?? 'none'
  );
  const [selectedBcId, setSelectedBcId] = useState<string>('none');
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const isEditing = !!proxy;
  const isBusy = isCreating || isUpdating || isLinking;

  useEffect(() => {
    if (proxy && businessCenters.length > 0) {
      const linked = businessCenters.find((bc) => bc.proxy_id === proxy.id);
      if (linked) setSelectedBcId(linked.id);
    }
  }, [proxy, businessCenters]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProxyFormData>({
    resolver: zodResolver(proxySchema) as never,
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
          ip_version: proxy.ip_version || 'ipv4',
          provider_id: proxy.provider_id ?? '',
          provider: proxy.provider ?? '',
          status: proxy.status,
          expires_at: proxy.expires_at ? proxy.expires_at.slice(0, 10) : '',
          notes: proxy.notes ?? '',
        }
      : {
          protocol: 'http',
          proxy_type: 'static_residential_isp',
          ip_version: 'ipv4',
          status: 'active',
          port: 8080,
          provider_id: '',
          provider: '',
        },
  });

  const handleCreateProvider = async (providerData: ProxyProviderFormData) => {
    const created = await createProvider(providerData);
    setValue('provider_id', created.id);
    setValue('provider', created.name);
  };

  const onSubmit = async (data: ProxyFormData) => {
    try {
      const payload: ProxyFormData = {
        ...data,
        provider_id: data.provider_id && data.provider_id !== 'none' ? data.provider_id : null,
        provider:
          data.provider ||
          (data.provider_id && data.provider_id !== 'none'
            ? providers.find((p) => p.id === data.provider_id)?.name || ''
            : ''),
      };

      let saved: Proxy;
      if (isEditing && proxy) {
        saved = await updateProxy(proxy.id, payload);
      } else {
        saved = await createProxy(payload);
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

      // Trata vínculo ou desvínculo de Business Manager (BM)
      const previousBc = businessCenters.find((bc) => bc.proxy_id === (proxy?.id ?? saved.id));
      const previousBcId = previousBc?.id ?? 'none';

      if (selectedBcId !== previousBcId) {
        if (previousBcId !== 'none') {
          await supabase
            .from('business_centers')
            .update({ proxy_id: null, updated_at: new Date().toISOString() })
            .eq('organization_id', organizationId)
            .eq('id', previousBcId);
        }
        if (selectedBcId !== 'none') {
          await supabase
            .from('business_centers')
            .update({ proxy_id: saved.id, updated_at: new Date().toISOString() })
            .eq('organization_id', organizationId)
            .eq('id', selectedBcId);
        }
      }

      toast.success(
        isEditing
          ? 'Proxy e vínculos atualizados com sucesso!'
          : 'Proxy criado com sucesso!'
      );
      onSaved?.(saved);
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar proxy.');
    }
  };

  return (
    <>
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

        {/* Protocol + ProxyType + IP Version */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Protocolo <span className="text-red-400">*</span>
            </Label>
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
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.protocol && <p className="text-xs text-red-400">{errors.protocol.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Tipo <span className="text-red-400">*</span>
            </Label>
            <Controller
              name="proxy_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-background border-input truncate text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-input max-h-56">
                    {Object.entries(PROXY_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.proxy_type && <p className="text-xs text-red-400">{errors.proxy_type.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Versão IP <span className="text-red-400">*</span>
            </Label>
            <Controller
              name="ip_version"
              control={control}
              render={({ field }) => (
                <Select value={field.value || 'ipv4'} onValueChange={field.onChange}>
                  <SelectTrigger className="bg-background border-input text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-input">
                    {Object.entries(IP_VERSION_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.ip_version && <p className="text-xs text-red-400">{errors.ip_version.message}</p>}
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
            <Label htmlFor="proxy-user" className="text-sm font-medium">
              Usuário
            </Label>
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
              Senha{' '}
              {isEditing && (
                <span className="text-muted-foreground text-[10px]">
                  (deixe em branco para manter)
                </span>
              )}
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
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Country + Provider */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="proxy-country" className="text-sm font-medium">
              País (ISO-2)
            </Label>
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
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Provedor</Label>
              <button
                type="button"
                onClick={() => setProviderModalOpen(true)}
                className="text-[11px] text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Novo Provedor
              </button>
            </div>
            <Controller
              name="provider_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || 'none'}
                  onValueChange={(val) => {
                    if (val === 'none') {
                      field.onChange(null);
                      setValue('provider', '');
                    } else {
                      field.onChange(val);
                      const foundProvider = providers.find((pr) => pr.id === val);
                      if (foundProvider) setValue('provider', foundProvider.name);
                    }
                  }}
                >
                  <SelectTrigger className="bg-background border-input text-xs">
                    <SelectValue placeholder="Selecione um provedor..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-input max-h-56">
                    <SelectItem value="none">
                      <span className="text-muted-foreground italic">Sem provedor associado</span>
                    </SelectItem>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <ProviderLogo name={p.name} className="w-4 h-4 rounded" size="sm" />
                          <span className="font-medium">{p.name}</span>
                          {p.website && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({p.website.replace(/^https?:\/\//, '')})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Status + Expires */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Status <span className="text-red-400">*</span>
            </Label>
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
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proxy-expires" className="text-sm font-medium">
              Validade
            </Label>
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

        {/* Business Manager (BM) Vinculado */}
        <div className="space-y-2 p-3.5 rounded-lg border border-purple-500/30 bg-purple-500/5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Business Manager (BM / Business Center) Vinculado
            </Label>
            <span className="text-[10px] text-muted-foreground">Opcional</span>
          </div>
          <Select value={selectedBcId} onValueChange={setSelectedBcId}>
            <SelectTrigger className="w-full bg-background border-border text-xs h-10">
              <SelectValue placeholder="Nenhum Business Center vinculado" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-56">
              <SelectItem value="none">
                <span className="text-muted-foreground italic">Nenhum BM vinculado (Desvinculado)</span>
              </SelectItem>
              {businessCenters.map((bc) => {
                const isCurrent = bc.proxy_id === proxy?.id;
                const isOther = bc.proxy_id && bc.proxy_id !== proxy?.id;
                return (
                  <SelectItem key={bc.id} value={bc.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{bc.name || 'Sem nome'}</span>
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono uppercase text-muted-foreground">
                        {bc.platform}
                      </span>
                      {bc.bc_id && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          (ID: {bc.bc_id})
                        </span>
                      )}
                      {isCurrent && <span className="text-emerald-400 font-semibold text-[10px]">✓ Atual</span>}
                      {isOther && !isCurrent && <span className="text-amber-400 text-[10px]">(tem outro proxy)</span>}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Vincula o tráfego operacional e API deste Business Manager diretamente através deste proxy.
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="proxy-notes" className="text-sm font-medium">
            Observações
          </Label>
          <textarea
            id="proxy-notes"
            {...register('notes')}
            rows={2}
            placeholder="Notas internas sobre este proxy..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isBusy}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isBusy}
            className="bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? 'Salvar' : 'Criar Proxy'}
          </Button>
        </div>
      </form>

      {/* Dialog inline de criação de provedor */}
      <ProxyProviderFormDialog
        open={providerModalOpen}
        onOpenChange={setProviderModalOpen}
        onSubmit={handleCreateProvider}
        isSubmitting={isCreatingProvider}
      />
    </>
  );
};

export const ProxyFormDialog: React.FC<ProxyFormDialogProps> = ({
  open,
  onOpenChange,
  proxy,
  organizationId,
  platformAccounts = [],
  currentLinkedAccount,
  onSaved,
}) => {
  const isEditing = !!proxy;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            {isEditing ? 'Editar Proxy' : 'Novo Proxy'}
          </DialogTitle>
        </DialogHeader>

        {open && (
          <InnerProxyForm
            key={proxy?.id || 'new'}
            proxy={proxy}
            organizationId={organizationId}
            platformAccounts={platformAccounts}
            currentLinkedAccount={currentLinkedAccount}
            onClose={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
