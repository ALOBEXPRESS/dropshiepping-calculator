import React, { useState, useEffect, useMemo } from 'react';
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
  Link2,
  AlertTriangle,
  User,
  FileText,
  Loader2,
  ArrowLeft,
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
import type {
  BusinessCenterWithStats,
  BusinessCenterFormData,
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
  InstagramLogo,
  FacebookLogo,
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
  const isBusy = isCreating || isUpdating;

  const defaultValues: BusinessCenterFormData = {
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
  };

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
    defaultValues,
    mode: 'onChange',
  });

  const selectedPlatform = watch('platform') || 'tiktok';
  const businessType = watch('business_type') || 'advertiser';
  const metaLinkedNetwork = watch('meta_linked_network');
  const metaLinkedAccountId = watch('meta_linked_account_id');
  const platformConfig = BC_PLATFORM_CONFIG[selectedPlatform] || BC_PLATFORM_CONFIG.tiktok;
  const PlatformIcon = getPlatformLogo(selectedPlatform);
  const platformColor = getPlatformColor(selectedPlatform);

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

  useEffect(() => {
    if (open) {
      if (center) {
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
        });
        setCurrentStep(2);
      } else {
        reset(defaultValues);
        setCurrentStep(1);
      }
    }
  }, [open, center, reset]);

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

                  {/* ── SEÇÃO 4: Vínculo com Conta de Plataforma (Meta) ── */}
                  {selectedPlatform === 'meta' && (
                    <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-blue-500/20">
                        <Link2 className="w-4 h-4 text-blue-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">
                          4. Vínculo de Rede Social (Meta)
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setValue('meta_linked_network', 'instagram');
                            setValue('meta_linked_account_id', null);
                          }}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${
                            metaLinkedNetwork === 'instagram'
                              ? 'border-pink-500/60 bg-pink-500/15 text-white'
                              : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <InstagramLogo className="w-5 h-5 flex-shrink-0" />
                          <div className="text-left">
                            <span className="text-xs font-semibold block">Instagram</span>
                            <span className="text-[10px] text-zinc-400">Vincular perfil IG</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setValue('meta_linked_network', 'facebook');
                            setValue('meta_linked_account_id', null);
                          }}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${
                            metaLinkedNetwork === 'facebook'
                              ? 'border-blue-500/60 bg-blue-500/15 text-white'
                              : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <FacebookLogo className="w-5 h-5 flex-shrink-0" />
                          <div className="text-left">
                            <span className="text-xs font-semibold block">Facebook</span>
                            <span className="text-[10px] text-zinc-400">Vincular página FB</span>
                          </div>
                        </button>
                      </div>

                      {metaLinkedNetwork && (
                        <div className="space-y-2 pt-2">
                          <Label className="text-xs text-zinc-300">
                            Conta de {metaLinkedNetwork === 'instagram' ? 'Instagram' : 'Facebook'} cadastrada em Contas:
                          </Label>
                          <Controller
                            name="meta_linked_account_id"
                            control={control}
                            render={({ field }) => (
                              <Select value={field.value || 'none'} onValueChange={(v) => field.onChange(v === 'none' ? null : v)}>
                                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white">
                                  <SelectValue placeholder="Selecione uma conta cadastrada..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                                  <SelectItem value="none">
                                    <span className="text-zinc-500 italic">Nenhuma conta vinculada</span>
                                  </SelectItem>
                                  {metaCompatibleAccounts.map((acc) => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-white">{acc.name}</span>
                                        {acc.nickname && <span className="text-zinc-400 text-[11px]">@{acc.nickname}</span>}
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
                            <div className="p-3 rounded-xl bg-zinc-950/80 border border-blue-500/30 text-xs space-y-1">
                              <div className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                                <span className="font-bold text-white">{selectedMetaAccount.name}</span>
                                {selectedMetaAccount.nickname && (
                                  <span className="text-zinc-400 font-mono">@{selectedMetaAccount.nickname}</span>
                                )}
                              </div>
                              <p className="text-zinc-400 text-[11px]">
                                Titular: <strong className="text-zinc-200">{selectedMetaAccount.holder_name}</strong>
                                {selectedMetaAccount.email ? ` · ${selectedMetaAccount.email}` : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

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
