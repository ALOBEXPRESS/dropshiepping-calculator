import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  deviceSchema,
  type Device,
  type DeviceFormData,
} from '@/types/devices';
import type { PlatformAccount } from '@/types/platformAccounts';
import {
  DEVICE_TYPES,
  CLOUD_PHONE_PLATFORMS,
  EMULATOR_PLATFORMS,
  DOUPLUS_DEVICE_PROFILES,
  type DeviceTypeValue,
} from '@/constants/deviceTypes';
import { useProxies } from '@/hooks/useProxies';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import { useSettings } from '@/contexts/SettingsContext';
import { DevicesService } from '@/services/devicesService';
import { Checkbox } from '@/components/ui/checkbox';
import { getPlatformLogo } from '@/components/ui/PlatformLogos';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Smartphone,
  Cloud,
  Monitor,
  Cpu,
  ArrowRight,
  ArrowLeft,
  Shield,
  CheckCircle2,
  AlertOctagon,
  Search,
} from 'lucide-react';
import { DeviceLogo } from '@/components/ui/DeviceLogo';

interface DeviceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device?: Device | null;
  onSubmit: (data: DeviceFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const DeviceFormDialog: React.FC<DeviceFormDialogProps> = ({
  open,
  onOpenChange,
  device,
  onSubmit,
  isSubmitting = false,
}) => {
  const isEditing = !!device;
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const { organizationId } = useSettings();
  const { proxies } = useProxies();
  const { data: platformAccounts = [] } = usePlatformAccounts();
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [accountSearch, setAccountSearch] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors },
  } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      label: '',
      device_type: 'cloud_phone',
      platform: 'douplus',
      device_profile: 'android_15_pro_sim_opt',
      proxy_id: '',
      notes: '',
    },
  });

  const selectedDeviceType = watch('device_type');
  const selectedPlatform = watch('platform');
  const labelWatch = watch('label');

  const isCloudPhone = selectedDeviceType === 'cloud_phone';
  const isEmulator = selectedDeviceType === 'emulator';
  const isDouplus = isCloudPhone && selectedPlatform === 'douplus';
  const isPhysical = selectedDeviceType === 'pc_windows' || selectedDeviceType === 'mobile';

  const deviceId = device?.id;

  useEffect(() => {
    if (open) {
      if (device) {
        const douplusProfile =
          device.platform_metadata && typeof device.platform_metadata === 'object'
            ? (device.platform_metadata as { device_profile?: string }).device_profile || ''
            : '';

        reset({
          label: device.label,
          device_type: device.device_type,
          platform: device.platform || '',
          device_profile: douplusProfile,
          proxy_id: device.proxy_id || '',
          notes: device.notes || '',
        });
        setCurrentStep(1);

        if (organizationId) {
          DevicesService.getDeviceAccounts(organizationId, device.id)
            .then((ids) => setSelectedAccountIds(ids))
            .catch((err) =>
              console.warn('[DeviceFormDialog] Erro ao carregar contas vinculadas:', err)
            );
        }
      } else {
        setSelectedAccountIds([]);
        reset({
          label: '',
          device_type: 'cloud_phone',
          platform: 'douplus',
          device_profile: 'android_15_pro_sim_opt',
          proxy_id: '',
          notes: '',
        });
        setCurrentStep(1);
      }
    }
  }, [open, deviceId, organizationId, reset]);

  const toggleAccount = (accId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accId) ? prev.filter((id) => id !== accId) : [...prev, accId]
    );
  };

  const filteredAccounts = useMemo(() => {
    if (!accountSearch.trim()) return platformAccounts;
    const q = accountSearch.toLowerCase().trim();
    return platformAccounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.nickname && a.nickname.toLowerCase().includes(q)) ||
        (a.holder_name && a.holder_name.toLowerCase().includes(q))
    );
  }, [platformAccounts, accountSearch]);

  const handleNext = async (e?: React.MouseEvent | React.KeyboardEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const valid = await trigger(['label', 'device_type']);
    if (valid) {
      setCurrentStep(2);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentStep(1);
  };

  const handleFormSubmit = async (data: DeviceFormData) => {
    // Se o submit for disparado no Passo 1 (ex: tecla Enter), apenas valida e avança para o Passo 2
    if (currentStep === 1) {
      const valid = await trigger(['label', 'device_type']);
      if (valid) {
        setCurrentStep(2);
      }
      return;
    }

    await onSubmit({
      ...data,
      account_ids: selectedAccountIds,
    });
    onOpenChange(false);
  };

  const getDeviceIcon = (type: DeviceTypeValue) => {
    switch (type) {
      case 'cloud_phone':
        return <Cloud className="w-5 h-5 text-cyan-400" />;
      case 'emulator':
        return <Cpu className="w-5 h-5 text-indigo-400" />;
      case 'pc_windows':
        return <Monitor className="w-5 h-5 text-emerald-400" />;
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-950 border-zinc-800 text-white rounded-2xl shadow-2xl p-0 overflow-hidden">
        {/* Header com Stepper Visual */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DeviceLogo
                platform={selectedPlatform}
                deviceType={selectedDeviceType}
                label={labelWatch}
                className="w-10 h-10"
              />
              <div>
                <DialogTitle className="text-base font-bold text-white">
                  {isEditing ? 'Editar Dispositivo' : 'Novo Dispositivo'}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                  {currentStep === 1
                    ? 'Passo 1 de 2: Identificador e Tipo de Ambiente'
                    : 'Passo 2 de 2: Plataforma, Perfil e Conexão'}
                </DialogDescription>
              </div>
            </div>

            {/* Stepper Indicator Interativo */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs font-mono">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1.5 ${
                  currentStep === 1
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Passo 1: Identificador e Tipo"
              >
                <span>1</span>
                <span className="hidden sm:inline font-sans text-[11px] font-normal">Identificador</span>
              </button>
              <span className="text-zinc-600">/</span>
              <button
                type="button"
                onClick={async () => {
                  const valid = await trigger(['label', 'device_type']);
                  if (valid) setCurrentStep(2);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1.5 ${
                  currentStep === 2
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Passo 2: Plataforma, Perfil e Conexão"
              >
                <span>2</span>
                <span className="hidden sm:inline font-sans text-[11px] font-normal">Configuração</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            if (currentStep === 1) {
              e.preventDefault();
              e.stopPropagation();
              handleNext(e);
              return;
            }
            handleSubmit(handleFormSubmit)(e);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && currentStep === 1) {
              e.preventDefault();
              e.stopPropagation();
              handleNext(e);
            }
          }}
          className="p-6 space-y-5"
        >
          {/* ── PASSO 1: TIPO DE DISPOSITIVO E LABEL ── */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Identificador / Nome */}
              <div className="space-y-1.5">
                <Label htmlFor="device_label" className="text-xs font-semibold text-zinc-200">
                  Nome / Identificador do Dispositivo <span className="text-rose-400">*</span>
                </Label>
                <Input
                  id="device_label"
                  {...register('label')}
                  placeholder="Ex: Douplus TikTok 01, LDPlayer Aquecimento #2, Celular Samsung A54..."
                  className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600 focus:border-cyan-500/60"
                />
                {errors.label && (
                  <p className="text-xs text-rose-400">{errors.label.message}</p>
                )}
              </div>

              {/* Seleção do Tipo de Dispositivo (Cards) */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-200">
                  Tipo de Ambiente Operacional <span className="text-rose-400">*</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DEVICE_TYPES.map((dt) => {
                    const isSelected = selectedDeviceType === dt.value;
                    return (
                      <div
                        key={dt.value}
                        onClick={() => {
                          setValue('device_type', dt.value, { shouldValidate: true });
                          if (dt.value === 'cloud_phone') {
                            setValue('platform', 'douplus');
                            setValue('device_profile', 'android_15_pro_sim_opt');
                          } else if (dt.value === 'emulator') {
                            setValue('platform', 'ldplayer');
                            setValue('device_profile', '');
                          } else {
                            setValue('platform', '');
                            setValue('device_profile', '');
                          }
                        }}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-500/60 shadow-lg shadow-cyan-500/5'
                            : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(dt.value)}
                            <span className="text-xs font-bold text-white">{dt.label}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          {dt.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── PASSO 2: PLATAFORMA, DOUPLUS PERFIL, PROXY E NOTAS ── */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Se Cloud Phone -> Seleção de Plataforma */}
              {isCloudPhone && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-200">
                    Provedor de Cloud Phone <span className="text-rose-400">*</span>
                  </Label>
                  <Controller
                    name="platform"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || 'douplus'}
                        onValueChange={(val) => {
                          field.onChange(val);
                          if (val === 'douplus') {
                            setValue('device_profile', 'android_15_pro_sim_opt');
                          } else {
                            setValue('device_profile', '');
                          }
                        }}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white">
                          <SelectValue placeholder="Selecione a plataforma em nuvem" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          {CLOUD_PHONE_PLATFORMS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              <div className="flex items-center gap-2">
                                <DeviceLogo
                                  platform={p.value}
                                  deviceType="cloud_phone"
                                  size="sm"
                                  className="w-5 h-5 rounded-md"
                                />
                                <span>{p.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.platform && (
                    <p className="text-xs text-rose-400">{errors.platform.message}</p>
                  )}
                </div>
              )}

              {/* Se Emulador -> Seleção de Emulador PC */}
              {isEmulator && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-200">
                    Software Emulador (Android PC) <span className="text-rose-400">*</span>
                  </Label>
                  <Controller
                    name="platform"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || 'ldplayer'} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white">
                          <SelectValue placeholder="Selecione o software emulador" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          {EMULATOR_PLATFORMS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.platform && (
                    <p className="text-xs text-rose-400">{errors.platform.message}</p>
                  )}
                </div>
              )}

              {/* Se Douplus -> Seletor de Perfil de Dispositivo Específico */}
              {isDouplus && (
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5" />
                      Perfil de Dispositivo Douplus <span className="text-rose-400">*</span>
                    </Label>
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                      Oficial Douplus
                    </span>
                  </div>
                  <Controller
                    name="device_profile"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || 'android_15_pro_sim_opt'} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white">
                          <SelectValue placeholder="Selecione a versão e perfil Douplus" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-56">
                          {DOUPLUS_DEVICE_PROFILES.map((dp) => (
                            <SelectItem key={dp.value} value={dp.value}>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{dp.label}</span>
                                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded font-mono">
                                  {dp.badge}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.device_profile && (
                    <p className="text-xs text-rose-400">{errors.device_profile.message}</p>
                  )}
                </div>
              )}

              {/* Dispositivos Físicos Aviso */}
              {isPhysical && (
                <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Dispositivo local/físico sem necessidade de software emulador ou cloud.
                  </span>
                </div>
              )}

              {/* Proxy Opcional Dedicado para o Dispositivo */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="device_proxy" className="text-xs font-semibold text-zinc-200">
                    Proxy de Conexão (Opcional)
                  </Label>
                  <span className="text-[10px] text-zinc-500">Configurado no aparelho</span>
                </div>
                <Controller
                  name="proxy_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'none'}
                      onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white">
                        <SelectValue placeholder="Nenhum proxy atribuído ao dispositivo" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-56">
                        <SelectItem value="none">Nenhum proxy (conexão padrão)</SelectItem>
                        {proxies.map((px) => (
                          <SelectItem key={px.id} value={px.id}>
                            <div className="flex items-center gap-2">
                              <Shield className="w-3 h-3 text-orange-400" />
                              <span>{px.label}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                ({px.host}:{px.port})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Contas de Plataforma Vinculadas (Bidirecional) */}
              <div className="space-y-2.5 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                      Contas de Plataforma Vinculadas
                    </Label>
                    {selectedAccountIds.length === 0 ? (
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                        0 vinculadas
                      </span>
                    ) : selectedAccountIds.length === 1 ? (
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 1:1 Ideal
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3 text-amber-400" /> {selectedAccountIds.length} Contas (Multi)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500">Opcional</span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-normal">
                  Selecione quais contas operam neste aparelho. O recomendado para TikTok é manter 1 conta por dispositivo.
                </p>

                {platformAccounts.length > 3 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                    <Input
                      placeholder="Buscar contas..."
                      value={accountSearch}
                      onChange={(e) => setAccountSearch(e.target.value)}
                      className="pl-8 bg-zinc-950 border-zinc-800 text-xs h-8 text-white placeholder:text-zinc-600 focus:border-cyan-500/60"
                    />
                  </div>
                )}

                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                  {filteredAccounts.length === 0 ? (
                    <div className="text-center py-3 text-zinc-500 text-xs">
                      {platformAccounts.length === 0
                        ? 'Nenhuma conta cadastrada no sistema.'
                        : 'Nenhuma conta encontrada para a busca.'}
                    </div>
                  ) : (
                    filteredAccounts.map((acc: PlatformAccount) => {
                      const isSelected = selectedAccountIds.includes(acc.id);
                      const Icon = getPlatformLogo(acc.platform);
                      return (
                        <label
                          key={acc.id}
                          htmlFor={`dev_acc_${acc.id}`}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-xs'
                              : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Checkbox
                              id={`dev_acc_${acc.id}`}
                              checked={isSelected}
                              onCheckedChange={() => toggleAccount(acc.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                            />
                            <Icon className="w-4 h-4 shrink-0" />
                            <div className="truncate">
                              <span className="font-semibold text-white truncate block">{acc.name}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {acc.nickname ? `@${acc.nickname}` : acc.email || acc.platform}
                              </span>
                            </div>
                          </div>
                          {acc.country && (
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase font-mono shrink-0 ml-2">
                              {acc.country}
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <Label htmlFor="device_notes" className="text-xs font-semibold text-zinc-200">
                  Observações e Informações Operacionais
                </Label>
                <textarea
                  id="device_notes"
                  {...register('notes')}
                  placeholder="Ex: Instância dedicada para tráfego pago dos EUA; operada via app Douplus."
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/60 resize-none"
                />
              </div>
            </div>
          )}

          {/* Footer com Navegação de Passos */}
          <DialogFooter className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
            <div>
              {currentStep === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  className="bg-transparent border-zinc-800 hover:bg-zinc-900 text-xs text-zinc-300 gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-transparent border-zinc-800 hover:bg-zinc-900 text-xs text-zinc-300"
              >
                Cancelar
              </Button>

              {currentStep === 1 ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNext(e);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-xs px-4 gap-1.5"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-medium text-xs px-4"
                >
                  {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Dispositivo'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
