import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Sparkles,
  User,
  FileText,
  Loader2,
  ArrowLeft,
  Shield,
  Smartphone,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
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
import { useBusinessCenters } from '@/hooks/useBusinessCenters';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import { useProxies } from '@/hooks/useProxies';
import { useDevices } from '@/hooks/useDevices';
import { BusinessCentersService } from '@/services/businessCentersService';
import { BusinessCenterAccountLinksManager } from './BusinessCenterAccountLinksManager';
import type {
  BusinessCenterWithStats,
  BusinessCenterFormData,
  BusinessCenterAccountInput,
  CompanyStatus,
} from '@/types/businessCenters';
import {
  businessCenterSchema,
  BC_PLATFORM_CONFIG,
} from '@/types/businessCenters';
import { PLATFORM_COUNTRIES } from '@/constants/niches';
import {
  TikTokLogo,
  MetaLogo,
  GoogleLogo,
  getPlatformLogo,
  getPlatformColor,
} from '@/components/ui/PlatformLogos';
import {
  formatCpf,
  formatCnpj,
  formatDateBr,
} from '@/utils/inputMasks';

interface BusinessCenterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  center?: BusinessCenterWithStats | null;
  organizationId: string;
}

const DEFAULT_FORM_VALUES: BusinessCenterFormData = {
  platform: 'tiktok',
  business_type: 'advertiser',
  name: '',
  country: 'BR',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  bc_id: '',
  notes: '',
  holder_name: '',
  holder_cpf: '',
  holder_rg: '',
  holder_birth_date: '',
  company_legal_name: '',
  company_cnpj: '',
  company_state_registration: '',
  company_status: 'Ativa',
  meta_linked_network: null,
  meta_linked_account_id: null,
  meta_instagram_account_id: null,
  meta_facebook_account_id: null,
  device_id: null,
  proxy_id: null,
};

export const BusinessCenterFormDialog: React.FC<BusinessCenterFormDialogProps> = ({
  open,
  onOpenChange,
  center,
  organizationId,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const isEditing = !!center;

  const { createCenter, updateCenter, isCreating, isUpdating } =
    useBusinessCenters(organizationId);
  const { data: platformAccounts = [] } = usePlatformAccounts();
  const { proxies = [] } = useProxies(organizationId);
  const { devices = [] } = useDevices();
  const isBusy = isCreating || isUpdating;

  // Gerenciamento de vínculos N:N entre este Business Center e Contas de Plataforma
  const [linkedAccounts, setLinkedAccounts] = useState<BusinessCenterAccountInput[]>([]);
  // Gerenciamento de dispositivos operacionais associados (N:N)
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors },
  } = useForm<BusinessCenterFormData>({
    resolver: zodResolver(businessCenterSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onChange',
  });

  const selectedPlatform = watch('platform') || 'tiktok';
  const businessType = watch('business_type') || 'advertiser';
  const platformConfig = BC_PLATFORM_CONFIG[selectedPlatform] || BC_PLATFORM_CONFIG.tiktok;
  const PlatformIcon = getPlatformLogo(selectedPlatform);
  const platformColor = getPlatformColor(selectedPlatform);

  useEffect(() => {
    if (open) {
      if (center) {
        // Carrega vínculos N:N da junction table
        BusinessCentersService.getLinkedAccounts(organizationId, center.id)
          .then((relations) => {
            if (relations && relations.length > 0) {
              setLinkedAccounts(
                relations.map((r) => ({
                  platform_account_id: r.platform_account_id,
                  relationship_type: r.relationship_type,
                  permission_level: r.permission_level,
                  status: r.status,
                  notes: r.notes,
                  external_relation_id: r.external_relation_id,
                }))
              );
            } else {
              // Fallback para vínculos legados (caso ainda não migrados)
              const fallbackList: BusinessCenterAccountInput[] = [];
              const seen = new Set<string>();
              if (center.meta_instagram_account_id) {
                fallbackList.push({
                  platform_account_id: center.meta_instagram_account_id,
                  relationship_type: 'owner',
                  permission_level: 'admin',
                });
                seen.add(center.meta_instagram_account_id);
              }
              if (center.meta_facebook_account_id && !seen.has(center.meta_facebook_account_id)) {
                fallbackList.push({
                  platform_account_id: center.meta_facebook_account_id,
                  relationship_type: 'owner',
                  permission_level: 'admin',
                });
                seen.add(center.meta_facebook_account_id);
              }
              if (center.meta_linked_account_id && !seen.has(center.meta_linked_account_id)) {
                fallbackList.push({
                  platform_account_id: center.meta_linked_account_id,
                  relationship_type: 'owner',
                  permission_level: 'admin',
                });
              }
              setLinkedAccounts(fallbackList);
            }
          })
          .catch((err) => {
            console.warn('Erro ao carregar vínculos N:N do BC:', err);
          });

        reset({
          platform: center.platform ?? 'tiktok',
          business_type: center.business_type ?? 'advertiser',
          name: center.name ?? '',
          country: center.country ?? 'BR',
          timezone: center.timezone ?? 'America/Sao_Paulo',
          currency: center.currency ?? 'BRL',
          bc_id: center.bc_id ?? '',
          notes: center.notes ?? '',
          holder_name: center.holder_name ?? '',
          holder_cpf: center.holder_cpf ?? '',
          holder_rg: center.holder_rg ?? '',
          holder_birth_date: center.holder_birth_date ?? '',
          company_legal_name: center.company_legal_name ?? '',
          company_cnpj: center.company_cnpj ?? '',
          company_state_registration: center.company_state_registration ?? '',
          company_status: (center.company_status as CompanyStatus) ?? 'Ativa',
          meta_linked_network: center.meta_linked_network ?? null,
          meta_linked_account_id: center.meta_linked_account_id ?? null,
          meta_instagram_account_id: center.meta_instagram_account_id ?? null,
          meta_facebook_account_id: center.meta_facebook_account_id ?? null,
          device_id: center.device_id ?? null,
          proxy_id: center.proxy_id ?? null,
        });
        // Carrega dispositivos operacionais N:N
        let initialDevs = center.device_ids ?? [];
        if (initialDevs.length === 0 && center.device_id) {
          initialDevs = [center.device_id];
        }
        setSelectedDeviceIds(initialDevs);

        if (organizationId && center.id) {
          BusinessCentersService.getCenterDevices(organizationId, center.id)
            .then((devs) => {
              if (devs && devs.length > 0) {
                setSelectedDeviceIds(devs);
              }
            })
            .catch((err) => {
              console.warn('Erro ao carregar dispositivos do BC:', err);
            });
        }

        setCurrentStep(2);
      } else {
        setLinkedAccounts([]);
        setSelectedDeviceIds([]);
        reset(DEFAULT_FORM_VALUES);
        setCurrentStep(1);
      }
    }
  }, [open, center, organizationId, reset]);

  const handleNextStep = async () => {
    const valid = await trigger(['platform']);
    if (valid) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2 && !isEditing) {
      setCurrentStep(1);
    }
  };

  const onSubmit = async (data: BusinessCenterFormData) => {
    try {
      // Determina valores legados para compatibilidade com queries/views existentes
      let meta_instagram_account_id: string | null = null;
      let meta_facebook_account_id: string | null = null;
      let meta_linked_network: 'instagram' | 'facebook' | 'both' | null = null;
      let meta_linked_account_id: string | null = null;

      if (data.platform === 'meta') {
        const igLink = linkedAccounts.find((l) => {
          const acc = platformAccounts.find((a) => a.id === l.platform_account_id);
          return acc?.meta_account_type === 'instagram' || (!acc?.meta_account_type && acc?.platform === 'meta');
        });
        const fbLink = linkedAccounts.find((l) => {
          const acc = platformAccounts.find((a) => a.id === l.platform_account_id);
          return acc?.meta_account_type === 'facebook';
        });

        meta_instagram_account_id = igLink?.platform_account_id ?? null;
        meta_facebook_account_id = fbLink?.platform_account_id ?? null;
        if (meta_instagram_account_id && meta_facebook_account_id) {
          meta_linked_network = 'both';
        } else if (meta_instagram_account_id) {
          meta_linked_network = 'instagram';
        } else if (meta_facebook_account_id) {
          meta_linked_network = 'facebook';
        }
        meta_linked_account_id = meta_instagram_account_id || meta_facebook_account_id || null;
      }

      const payload: BusinessCenterFormData = {
        ...data,
        meta_instagram_account_id,
        meta_facebook_account_id,
        meta_linked_network,
        meta_linked_account_id,
        device_id: selectedDeviceIds[0] || null,
        device_ids: selectedDeviceIds,
        proxy_id: data.proxy_id || null,
        linked_accounts: linkedAccounts,
      };

      if (isEditing && center) {
        await updateCenter(center.id, payload);
        toast.success('Business Center atualizado com sucesso!');
      } else {
        await createCenter(payload);
        toast.success('Business Center criado com sucesso!');
      }
      reset();
      setLinkedAccounts([]);
      setSelectedDeviceIds([]);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao salvar Business Center.'
      );
    }
  };

  const handleClose = () => {
    reset();
    setLinkedAccounts([]);
    setSelectedDeviceIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-zinc-950 border-zinc-800/80 text-foreground shadow-2xl rounded-2xl">
        {/* Header com Stepper Conectado */}
        <DialogHeader className="px-7 pt-6 pb-4 border-b border-zinc-800/60 bg-gradient-to-b from-zinc-900/60 to-zinc-950/90 text-left space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center p-2.5 shadow-inner flex-shrink-0">
                <PlatformIcon className={`w-6 h-6 ${platformColor}`} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2.5">
                  <DialogTitle className="text-lg font-bold tracking-tight text-white">
                    {isEditing
                      ? `Editar ${platformConfig.label}`
                      : currentStep === 1
                      ? 'Novo Business Center'
                      : `Setup ${platformConfig.label}`}
                  </DialogTitle>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    Etapa {currentStep} de 2
                  </span>
                </div>
                <DialogDescription className="text-xs text-zinc-400">
                  {currentStep === 1
                    ? 'Selecione a plataforma do Business Center que deseja configurar.'
                    : 'Preencha os dados de identificação, titular e empresa de forma organizada.'}
                </DialogDescription>
              </div>
            </div>

            {/* Stepper Visual */}
            <div className="flex items-center gap-1.5 self-start sm:self-center">
              <button
                type="button"
                onClick={() => !isEditing && setCurrentStep(1)}
                disabled={isEditing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentStep === 1
                    ? 'bg-zinc-800 text-white border border-purple-500/40 shadow-sm'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStep > 1
                      ? 'bg-emerald-500 text-white'
                      : 'bg-purple-600 text-white'
                  }`}
                >
                  {currentStep > 1 ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
                </div>
                <span>Plataforma</span>
              </button>

              <div
                className={`w-3 h-0.5 rounded-full transition-colors ${
                  currentStep > 1 ? 'bg-emerald-500/70' : 'bg-zinc-800'
                }`}
              />

              <button
                type="button"
                disabled={currentStep === 1}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentStep === 2
                    ? 'bg-zinc-800 text-white border border-purple-500/40 shadow-sm'
                    : 'text-zinc-600 opacity-60 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStep === 2 ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  2
                </div>
                <span>Preenchimento</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Conteúdo com Animação */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          <form id="business-center-form" onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">

              {/* ── ETAPA 1: Seleção de Plataforma ── */}
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Selecione a Plataforma do Business Center
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Escolha onde esta central de negócios será administrada para vincular suas contas de anúncios e ativos.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      {
                        id: 'tiktok' as const,
                        name: 'TikTok Business Center',
                        badge: 'TikTok Ads Manager',
                        logo: TikTokLogo,
                        logoColor: 'text-cyan-400',
                        desc: 'Centralize anunciantes, membros da equipe, pixels TikTok, catálogo e controle financeiro.',
                        activeBorder: 'border-brand shadow-brand/15',
                        activeBadge: 'bg-brand text-white shadow-brand/30',
                        features: ['TikTok Ads Manager', 'Gestão de Pixels', 'Controle de Membros', 'Catálogo de Produtos'],
                      },
                      {
                        id: 'meta' as const,
                        name: 'Meta Business Portfolio',
                        badge: 'Instagram · Facebook',
                        logo: MetaLogo,
                        logoColor: 'text-blue-400',
                        desc: 'Gerencie contas de anúncios do Instagram, páginas do Facebook, WhatsApp Business e Catálogo Meta.',
                        activeBorder: 'border-blue-500 shadow-blue-500/15',
                        activeBadge: 'bg-blue-600 text-white shadow-blue-500/30',
                        features: ['Instagram & Facebook', 'Meta Pixel & CAPI', 'Gerenciador de Negócios', 'Portfólio de Ativos'],
                      },
                      {
                        id: 'google' as const,
                        name: 'Google Ads Manager (MCC)',
                        badge: 'Google Ads',
                        logo: GoogleLogo,
                        logoColor: '',
                        desc: 'Vincule e administre múltiplas contas Google Ads, Merchant Center e tags de conversão.',
                        activeBorder: 'border-emerald-500 shadow-emerald-500/15',
                        activeBadge: 'bg-emerald-600 text-white shadow-emerald-500/30',
                        features: ['Google Ads & Shopping', 'MCC Centralizada', 'Google Tag & GA4', 'Controle de Faturamento'],
                      },
                    ].map((plat) => {
                      const isSelected = selectedPlatform === plat.id;
                      const Icon = plat.logo;
                      return (
                        <div
                          key={plat.id}
                          onClick={() => {
                            setValue('platform', plat.id, { shouldValidate: true });
                            if (plat.id !== 'meta') {
                              setValue('meta_linked_network', null);
                              setValue('meta_linked_account_id', null);
                            }
                          }}
                          onDoubleClick={handleNextStep}
                          className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                            isSelected
                              ? `${plat.activeBorder} bg-gradient-to-br from-zinc-900/90 via-zinc-900 to-zinc-950 shadow-xl`
                              : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-zinc-800/80">
                            <div className="flex items-center gap-4">
                              <div className="w-13 h-13 rounded-2xl bg-zinc-950 border border-zinc-700/60 flex items-center justify-center p-3 shadow-inner flex-shrink-0">
                                <Icon className={`w-7 h-7 ${plat.logoColor}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2.5">
                                  <h4 className="text-base font-bold text-white">{plat.name}</h4>
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    {plat.badge}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                                  {plat.desc}
                                </p>
                              </div>
                            </div>
                            <div
                              className={`flex items-center gap-1.5 self-end sm:self-center px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
                                isSelected
                                  ? plat.activeBadge
                                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700/60'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Selecionado</span>
                                </>
                              ) : (
                                <span>Selecionar</span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {plat.features.map((feat) => (
                              <div
                                key={feat}
                                className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center gap-2"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                <span className="text-[11px] font-medium text-zinc-200">{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── ETAPA 2: Formulário Organizado ── */}
              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Banner da Plataforma Selecionada com opção de troca */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center p-2">
                        <PlatformIcon className={`w-5 h-5 ${platformColor}`} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white">{platformConfig.label}</span>
                        <p className="text-[11px] text-zinc-400">{platformConfig.description}</p>
                      </div>
                    </div>
                    {!isEditing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Trocar plataforma
                      </Button>
                    )}
                  </div>

                  {/* ── SEÇÃO 1: Identificação do Business Center ── */}
                  <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                        1. Identificação do Business Center
                      </h4>
                    </div>

                    {/* Nome do Business Center */}
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-medium text-zinc-300">
                        Nome do Business Center <span className="text-rose-400">*</span>
                      </Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder={
                          selectedPlatform === 'meta'
                            ? 'Ex.: Meta Portfolio — Alob Express Principal'
                            : selectedPlatform === 'google'
                            ? 'Ex.: MCC Google Ads — Alob Express'
                            : 'Ex.: TikTok Business Center — Marketing'
                        }
                        className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600 focus-visible:ring-purple-500"
                      />
                      {errors.name && <p className="text-xs text-rose-400 font-medium">{errors.name.message}</p>}
                    </div>

                    {/* Tipo de Negócio */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-zinc-300">Tipo de Negócio</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label
                          className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            businessType === 'advertiser'
                              ? 'border-purple-500 bg-purple-500/10 text-white shadow-sm shadow-purple-500/10'
                              : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
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
                              businessType === 'advertiser' ? 'border-purple-500' : 'border-zinc-600'
                            }`}
                          >
                            {businessType === 'advertiser' && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                          </div>
                          <div>
                            <span className="text-xs font-semibold block text-white">Anunciante (Advertiser)</span>
                            <span className="text-[11px] text-zinc-400">Opera com marcas e produtos próprios</span>
                          </div>
                        </label>

                        <label
                          className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            businessType === 'agency'
                              ? 'border-purple-500 bg-purple-500/10 text-white shadow-sm shadow-purple-500/10'
                              : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
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
                              businessType === 'agency' ? 'border-purple-500' : 'border-zinc-600'
                            }`}
                          >
                            {businessType === 'agency' && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                          </div>
                          <div>
                            <span className="text-xs font-semibold block text-white">Agência (Agency)</span>
                            <span className="text-[11px] text-zinc-400">Gerencia múltiplos clientes e anunciantes</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* ID do Business Center */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="bc_id" className="text-xs font-medium text-zinc-300">
                          {platformConfig.idLabel}
                        </Label>
                        <span className="text-[10px] text-zinc-500 uppercase">Opcional</span>
                      </div>
                      <Input
                        id="bc_id"
                        {...register('bc_id')}
                        placeholder={platformConfig.idPlaceholder}
                        className="bg-zinc-950 border-zinc-800 font-mono text-xs h-10 text-white placeholder:text-zinc-600"
                      />
                      <p className="text-[11px] text-zinc-500">
                        Se você já tem o ID da plataforma, insira acima. Se deixar vazio, geraremos um identificador interno automaticamente.
                      </p>
                    </div>

                    {/* País, Moeda e Fuso Horário */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="space-y-1.5">
                        <Label htmlFor="country" className="text-xs font-medium text-zinc-300">País ou Região</Label>
                        <Controller
                          name="country"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white">
                                <SelectValue placeholder="Selecione o país" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-56">
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

                      <div className="space-y-1.5">
                        <Label htmlFor="currency" className="text-xs font-medium text-zinc-300">Moeda Padrão</Label>
                        <Controller
                          name="currency"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white">
                                <SelectValue placeholder="Selecione a moeda" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                <SelectItem value="BRL">BRL (R$ - Real)</SelectItem>
                                <SelectItem value="USD">USD ($ - Dólar)</SelectItem>
                                <SelectItem value="EUR">EUR (€ - Euro)</SelectItem>
                                <SelectItem value="GBP">GBP (£ - Libra)</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="timezone" className="text-xs font-medium text-zinc-300">Fuso Horário</Label>
                        <Input
                          id="timezone"
                          {...register('timezone')}
                          placeholder="America/Sao_Paulo"
                          className="bg-zinc-950 border-zinc-800 font-mono text-xs h-10 text-white placeholder:text-zinc-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── SEÇÃO 2: Dados do Titular / Responsável ── */}
                  <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80">
                      <User className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                        2. Dados do Titular / Responsável
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Titular */}
                      <div className="space-y-1.5">
                        <Label htmlFor="holder_name" className="text-xs font-medium text-zinc-300">
                          Titular
                        </Label>
                        <Input
                          id="holder_name"
                          {...register('holder_name')}
                          placeholder="Nome completo do titular responsável"
                          className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600"
                        />
                      </div>

                      {/* CPF do titular */}
                      <div className="space-y-1.5">
                        <Label htmlFor="holder_cpf" className="text-xs font-medium text-zinc-300">
                          CPF do titular
                        </Label>
                        <Controller
                          name="holder_cpf"
                          control={control}
                          render={({ field }) => (
                            <Input
                              id="holder_cpf"
                              placeholder="000.000.000-00"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(formatCpf(e.target.value))}
                              className="bg-zinc-950 border-zinc-800 font-mono text-xs h-10 text-white placeholder:text-zinc-600"
                            />
                          )}
                        />
                      </div>

                      {/* RG do titular */}
                      <div className="space-y-1.5">
                        <Label htmlFor="holder_rg" className="text-xs font-medium text-zinc-300">
                          RG do titular
                        </Label>
                        <Input
                          id="holder_rg"
                          {...register('holder_rg')}
                          placeholder="Ex.: 12.345.678-9"
                          className="bg-zinc-950 border-zinc-800 font-mono text-xs h-10 text-white placeholder:text-zinc-600"
                        />
                      </div>

                      {/* Data de nascimento */}
                      <div className="space-y-1.5">
                        <Label htmlFor="holder_birth_date" className="text-xs font-medium text-zinc-300">
                          Data de nascimento
                        </Label>
                        <Controller
                          name="holder_birth_date"
                          control={control}
                          render={({ field }) => (
                            <Input
                              id="holder_birth_date"
                              placeholder="DD/MM/AAAA"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(formatDateBr(e.target.value))}
                              className="bg-zinc-950 border-zinc-800 font-mono text-xs h-10 text-white placeholder:text-zinc-600"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── SEÇÃO 3: Dados da Empresa ── */}
                  <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/80">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                        3. Dados da Empresa
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Nome legal da empresa */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="company_legal_name" className="text-xs font-medium text-zinc-300">
                          Nome legal da empresa / Razão Social
                        </Label>
                        <Input
                          id="company_legal_name"
                          {...register('company_legal_name')}
                          placeholder="Ex.: Alob Express Comércio Digital Ltda"
                          className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600"
                        />
                      </div>

                      {/* CNPJ */}
                      <div className="space-y-1.5">
                        <Label htmlFor="company_cnpj" className="text-xs font-medium text-zinc-300">
                          CNPJ
                        </Label>
                        <Controller
                          name="company_cnpj"
                          control={control}
                          render={({ field }) => (
                            <Input
                              id="company_cnpj"
                              placeholder="00.000.000/0000-00"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(formatCnpj(e.target.value))}
                              className="bg-zinc-950 border-zinc-800 font-mono text-xs h-10 text-white placeholder:text-zinc-600"
                            />
                          )}
                        />
                      </div>

                      {/* Inscrição Estadual */}
                      <div className="space-y-1.5">
                        <Label htmlFor="company_state_registration" className="text-xs font-medium text-zinc-300">
                          Inscrição Estadual
                        </Label>
                        <Input
                          id="company_state_registration"
                          {...register('company_state_registration')}
                          placeholder="Ex.: 123.456.789.000 ou Isento"
                          className="bg-zinc-950 border-zinc-800 font-mono text-xs h-10 text-white placeholder:text-zinc-600"
                        />
                      </div>

                      {/* Situação cadastral (dropdown) */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="company_status" className="text-xs font-medium text-zinc-300">
                          Situação cadastral
                        </Label>
                        <Controller
                          name="company_status"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value || 'Ativa'} onValueChange={field.onChange}>
                              <SelectTrigger id="company_status" className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white">
                                <SelectValue placeholder="Selecione a situação cadastral" />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                <SelectItem value="Ativa">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    Ativa (Regular)
                                  </span>
                                </SelectItem>
                                <SelectItem value="Suspensa">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    Suspensa
                                  </span>
                                </SelectItem>
                                <SelectItem value="Inapta">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                                    Inapta
                                  </span>
                                </SelectItem>
                                <SelectItem value="Baixada">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                                    Baixada
                                  </span>
                                </SelectItem>
                                <SelectItem value="Nula">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-zinc-400" />
                                    Nula
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── SEÇÃO 4: Vínculo de Contas de Plataforma (N:N TikTok e Meta) ── */}
                  {(selectedPlatform === 'tiktok' || selectedPlatform === 'meta') && (
                    <BusinessCenterAccountLinksManager
                      platform={selectedPlatform}
                      linkedAccounts={linkedAccounts}
                      onChange={setLinkedAccounts}
                      availableAccounts={platformAccounts}
                      disabled={isBusy}
                    />
                  )}

                  {/* ── SEÇÃO 4.5: Infraestrutura de Rede e Operação (Proxy & Dispositivo) ── */}
                  <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-white">Infraestrutura & Rede Dedicada</h4>
                          <p className="text-[11px] text-zinc-400">Vincule o proxy e dispositivo usados para operar este Business Manager</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/60">
                      {/* Proxy Seletor */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                            Proxy Dedicado (Opcional)
                          </Label>
                          <Link to="/provedores-proxy" target="_blank" className="text-[10px] text-amber-400 hover:underline">
                            + Gerenciar Proxies
                          </Link>
                        </div>
                        <Controller
                          name="proxy_id"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value || 'none'}
                              onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                            >
                              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white">
                                <SelectValue placeholder="Selecione um proxy..." />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-56">
                                <SelectItem value="none">
                                  <span className="text-zinc-500 italic">Nenhum proxy vinculado (Conexão direta)</span>
                                </SelectItem>
                                {proxies.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-white">{p.label}</span>
                                      <span className="text-zinc-400 text-[11px] font-mono">{p.host}:{p.port}</span>
                                      <span className="text-amber-400 text-[10px] font-medium uppercase px-1 py-0.5 rounded bg-amber-400/10">
                                        {p.proxy_type}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      {/* Dispositivos Operacionais (Multi-Seleção N:N) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Dispositivos Operacionais (Opcional)</span>
                          </Label>
                          <Link
                            to="/dispositivos"
                            target="_blank"
                            className="text-[10px] text-cyan-400 hover:underline"
                          >
                            + Gerenciar Dispositivos
                          </Link>
                        </div>

                        {/* Seletor para adicionar dispositivo */}
                        <Select
                          value="none"
                          onValueChange={(devId) => {
                            if (devId && devId !== 'none' && !selectedDeviceIds.includes(devId)) {
                              setSelectedDeviceIds([...selectedDeviceIds, devId]);
                            }
                          }}
                        >
                          <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white">
                            <SelectValue placeholder="+ Vincular dispositivo operacional..." />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-56">
                            <SelectItem value="none" disabled>
                              <span className="text-zinc-500 italic">
                                Selecione um dispositivo para associar...
                              </span>
                            </SelectItem>
                            {devices
                              .filter((d) => !selectedDeviceIds.includes(d.id))
                              .map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white">{d.label}</span>
                                    {d.platform && (
                                      <span className="text-zinc-400 text-[11px]">({d.platform})</span>
                                    )}
                                    <span className="text-cyan-400 text-[10px] font-medium uppercase px-1 py-0.5 rounded bg-cyan-400/10">
                                      {d.device_type}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                        {/* Lista de dispositivos vinculados */}
                        {selectedDeviceIds.length === 0 ? (
                          <p className="text-[11px] text-zinc-500 italic pt-0.5">
                            Nenhum dispositivo associado (Operação web/indireta)
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {selectedDeviceIds.map((devId) => {
                              const dev = devices.find((d) => d.id === devId);
                              return (
                                <div
                                  key={devId}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/80 text-xs text-white shadow-sm"
                                >
                                  <Smartphone className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                  <span className="font-medium truncate max-w-[140px]">
                                    {dev?.label || 'Dispositivo'}
                                  </span>
                                  {dev?.device_type && (
                                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-cyan-500/15 text-cyan-300 font-mono">
                                      {dev.device_type}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedDeviceIds(
                                        selectedDeviceIds.filter((id) => id !== devId)
                                      )
                                    }
                                    className="text-zinc-400 hover:text-rose-400 ml-0.5 p-0.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                                    title="Desvincular dispositivo"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── SEÇÃO 5: Observações ── */}
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs font-medium text-zinc-300">
                      Observações / Anotações Internas (Opcional)
                    </Label>
                    <textarea
                      id="notes"
                      {...register('notes')}
                      rows={2}
                      placeholder="Finalidade, restrições operacionais ou notas de equipe deste Business Center..."
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white resize-none placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    {errors.notes && <p className="text-xs text-rose-400">{errors.notes.message}</p>}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </form>
        </div>

        {/* Footer */}
        <DialogFooter className="px-7 py-4 border-t border-zinc-800/80 bg-zinc-950/90 flex items-center justify-between sm:justify-between w-full">
          <div>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isBusy}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
          </div>

          <div className="flex items-center gap-2.5">
            {currentStep === 2 && !isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={isBusy}
                className="text-xs border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white gap-1.5 h-10 px-4"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
            )}

            {currentStep === 1 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={isBusy}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs gap-1.5 h-10 px-6 font-semibold shadow-lg shadow-purple-600/25"
              >
                Avançar
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                form="business-center-form"
                disabled={isBusy}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs gap-1.5 h-10 px-6 font-semibold shadow-lg shadow-purple-600/25"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    {isEditing ? 'Salvar Alterações' : 'Criar Business Center'}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
