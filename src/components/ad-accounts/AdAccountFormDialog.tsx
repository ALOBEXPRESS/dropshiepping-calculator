import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
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
  Loader2,
  Layers,
  Info,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Globe,
  ShieldCheck,
  Check,
  CreditCard,
  Wallet,
  Youtube,
  Instagram,
  ShoppingBag,
  User,
  Building2,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactCountryFlag from 'react-country-flag';
import { toast } from 'sonner';
import {
  adAccountSchema,
  type AdAccountFormData,
  type AdAccountWithStats,
} from '@/types/adAccounts';
import type { PlatformAccount } from '@/types/platformAccounts';
import { PlatformAccountStep } from '@/components/ad-accounts/PlatformAccountStep';
import { useSettings } from '@/contexts/SettingsContext';
import { useUser } from '@/contexts/UserContext';
import { useQueryClient } from '@tanstack/react-query';
import { useBusinessCenters } from '@/hooks/useBusinessCenters';
import { AdAccountsService } from '@/services/adAccountsService';
import {
  formatCentsToCurrencyString,
  formatCpfCnpj,
  formatPhoneByCountry,
} from '@/utils/inputMasks';
import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';
import { PLATFORM_COUNTRIES, TIKTOK_INDUSTRIES } from '@/constants/niches';

interface AdAccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AdAccountWithStats | null;
  onSubmit: (data: AdAccountFormData) => Promise<void>;
}

const STEPS = [
  { id: 1, title: 'Plataforma', label: '01. Rede de Anúncios', icon: Globe },
  { id: 2, title: 'Perfil TikTok', label: '02. Perfil da Plataforma', icon: Sparkles },
  { id: 3, title: 'Conta TikTok', label: '03. Dados da Conta TikTok', icon: Layers },
  { id: 4, title: 'Identificadores', label: '04. IDs & Rastreamento', icon: Info },
  { id: 5, title: 'Faturamento', label: '05. Faturamento & Titular', icon: CreditCard },
  { id: 6, title: 'Revisão', label: '06. Revisão & Ativação', icon: ShieldCheck },
] as const;

export const AdAccountFormDialog: React.FC<AdAccountFormDialogProps> = ({
  open,
  onOpenChange,
  account,
  onSubmit,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canSubmitReview, setCanSubmitReview] = useState(false);
  const [selectedPlatformAccount, setSelectedPlatformAccount] =
    useState<PlatformAccount | null>(null);
  const isEditing = !!account;

  const { organizationId } = useSettings();
  const { userId } = useUser();
  const queryClient = useQueryClient();
  const { centers: businessCenters = [] } = useBusinessCenters(organizationId);

  const defaultValues: AdAccountFormData = {
    name: '',
    platform: 'tiktok',
    status: 'active',
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    country: 'BR',
    spending_limit: null,
    billing_type: 'postpaid',
    payment_status: 'normal',
    legal_name: '',
    tax_id: '',
    industry: 'E-commerce & Varejo',
    website: '',
    contact_name: '',
    email: '',
    phone: '',
    advertiser_id: '',
    business_center_id: '',
    pixel_id: '',
    catalog_id: '',
    platform_account_id: null,
    bc_entity_id: null,
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    trigger,
    formState: { errors },
  } = useForm<AdAccountFormData>({
    resolver: zodResolver(adAccountSchema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (account) {
      reset({
        name: account.name ?? '',
        platform: account.platform ?? 'tiktok',
        status: account.status ?? 'active',
        timezone: account.timezone ?? 'America/Sao_Paulo',
        currency: account.currency ?? 'BRL',
        country: account.country ?? 'BR',
        spending_limit: account.spending_limit ?? null,
        billing_type: account.billing_type ?? 'postpaid',
        payment_status: account.payment_status ?? 'normal',
        legal_name: account.legal_name ?? '',
        tax_id: account.tax_id ?? '',
        industry: account.industry ?? 'E-commerce & Varejo',
        website: account.website ?? '',
        contact_name: account.contact_name ?? '',
        email: account.email ?? '',
        phone: account.phone ?? '',
        advertiser_id: account.advertiser_id ?? '',
        business_center_id: account.business_center_id ?? '',
        pixel_id: (account.platform_config?.pixel_id as string) ?? '',
        catalog_id: (account.platform_config?.catalog_id as string) ?? '',
        platform_account_id: account.platform_account_id ?? null,
        bc_entity_id: account.bc_entity_id ?? null,
      });
      setSelectedPlatformAccount(account.platform_account ?? null);
      setCurrentStep(isEditing ? 3 : 1);
    } else {
      reset(defaultValues);
      setCurrentStep(1);
      setSelectedPlatformAccount(null);
    }
  }, [account, open, reset, isEditing]);

  const formValues = watch();
  const status = watch('status');
  const currency = watch('currency');
  const billingType = watch('billing_type');

  const TOTAL_STEPS = 6;

  // Previne que cliques rápidos ou Enter na etapa 5 acionem instantaneamente a submissão da etapa 6
  useEffect(() => {
    if (currentStep === TOTAL_STEPS) {
      setCanSubmitReview(false);
      const timer = setTimeout(() => {
        setCanSubmitReview(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setCanSubmitReview(false);
    }
  }, [currentStep]);

  const handleNext = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = true;
    } else if (currentStep === 2) {
      // Passo opcional — sempre pode avançar
      isValid = true;
    } else if (currentStep === 3) {
      isValid = await trigger([
        'name',
        'country',
        'legal_name',
        'industry',
        'website',
        'contact_name',
        'email',
        'phone',
        'timezone',
        'currency',
        'status',
        'spending_limit',
      ]);
    } else if (currentStep === 4) {
      isValid = await trigger(['advertiser_id', 'business_center_id', 'pixel_id', 'catalog_id']);
    } else if (currentStep === 5) {
      isValid = await trigger(['legal_name', 'tax_id', 'industry', 'billing_type', 'payment_status', 'email', 'phone']);
    }

    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFormSubmit = async (data: AdAccountFormData) => {
    setIsSubmitting(true);
    try {
      // Propaga o platform_account_id selecionado no passo 2
      const finalData: AdAccountFormData = {
        ...data,
        platform_account_id: selectedPlatformAccount?.id ?? null,
      };
      await onSubmit(finalData);
      toast.success(
        isEditing
          ? 'Conta de anúncios atualizada com sucesso!'
          : 'Conta de anúncios cadastrada com sucesso!'
      );
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar conta de anúncios';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-zinc-950 border-zinc-800/80 text-foreground shadow-2xl rounded-2xl">
        {/* Header com Stepper Conectado e Espaçoso */}
        <DialogHeader className="px-8 pt-7 pb-5 border-b border-zinc-800/60 bg-gradient-to-b from-zinc-900/60 to-zinc-950/90 text-left space-y-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Título & Identidade */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand/10 border border-brand/25 flex items-center justify-center p-2.5 shadow-[0_0_15px_rgba(254,44,85,0.15)] flex-shrink-0">
                <img src={tiktokImg} alt="TikTok" className="w-full h-full object-contain" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2.5">
                  <DialogTitle className="text-xl font-bold tracking-tight text-white">
                    {isEditing ? 'Editar Conta de Anúncios' : 'Setup de Conta de Anúncios'}
                  </DialogTitle>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-brand/15 text-brand border border-brand/30">
                    Etapa {currentStep} de {TOTAL_STEPS}
                  </span>
                </div>
                <DialogDescription className="text-xs text-zinc-400">
                  {currentStep === 1 && 'Selecione a plataforma de anúncios para veiculação das campanhas.'}
                  {currentStep === 2 && 'Vincule ou crie o perfil TikTok associado a esta conta de anúncios.'}
                  {currentStep === 3 && 'Defina o nome de exibição, moeda e parâmetros da conta.'}
                  {currentStep === 4 && 'Conecte os identificadores do TikTok Ads Manager e Pixel.'}
                  {currentStep === 5 && 'Configure o modelo de cobrança e dados fiscais da empresa.'}
                  {currentStep === 6 && 'Revise as configurações antes de ativar a conta no sistema.'}
                </DialogDescription>
              </div>
            </div>

            {/* Stepper Visual */}
            <div className="flex items-center gap-1 self-start md:self-center flex-wrap">
              {STEPS.map((step, idx) => {
                const isPassed = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (step.id < currentStep || isEditing) {
                          setCurrentStep(step.id);
                        }
                      }}
                      disabled={step.id > currentStep && !isEditing}
                      title={step.label}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isCurrent
                          ? 'bg-zinc-800/90 text-white border border-brand/40 shadow-sm shadow-brand/10'
                          : isPassed
                          ? 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer border border-transparent'
                          : 'text-zinc-600 opacity-50 cursor-not-allowed border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          isPassed
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                            ? 'bg-brand text-white shadow-[0_0_10px_rgba(254,44,85,0.6)]'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : step.id}
                      </div>
                      <span className={`hidden 2xl:inline ${isCurrent ? 'font-semibold text-white' : ''}`}>
                        {step.title}
                      </span>
                    </button>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`w-2.5 h-0.5 rounded-full transition-colors ${
                          isPassed ? 'bg-emerald-500/70' : 'bg-zinc-800'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </DialogHeader>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto px-8 py-7">
          <form
            id="ad-account-setup-form"
            method="POST"
            onSubmit={(e) => {
              e.preventDefault();
              if (currentStep === TOTAL_STEPS && canSubmitReview && !isSubmitting) {
                handleSubmit(handleFormSubmit)(e);
              }
            }}
            onKeyDown={(e) => {
              // Impede submissão involuntária por Enter
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          >
            <AnimatePresence mode="wait">

              {/* ── ETAPA 1: Plataforma de Anúncios ── */}
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-brand" />
                      Rede de Anúncios
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Selecione onde suas campanhas de dropshipping serão veiculadas e sincronizadas.
                    </p>
                  </div>

                  {/* Card Principal TikTok Ads */}
                  <div
                    onClick={() => setValue('platform', 'tiktok')}
                    className="relative rounded-2xl border-2 border-brand bg-gradient-to-br from-brand/12 via-zinc-900/90 to-zinc-950 p-6 cursor-pointer shadow-xl shadow-brand/10 transition-all hover:border-brand"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center p-3 shadow-inner flex-shrink-0">
                          <img src={tiktokImg} alt="TikTok Ads" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h4 className="text-base font-bold text-white">TikTok Ads Manager</h4>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Disponível
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                            Integração nativa com campanhas de conversão, Pixel TikTok, Catálogo e controle de ROI.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center px-3.5 py-1.5 rounded-xl bg-brand text-white text-xs font-semibold shadow-md shadow-brand/30">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Selecionado</span>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['Pixel & Web Events', 'Business Center ID', 'Múltiplas Campanhas', 'Gestão de Orçamento'].map((feat) => (
                        <div key={feat} className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="text-xs font-medium text-zinc-200">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Próximas Integrações — conforme spec */}
                  <div className="space-y-2.5 pt-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Próximas Integrações de Tráfego
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { name: 'Youtube', sub: 'Em breve', icon: Youtube, color: 'text-red-400', badge: 'Em breve' },
                        { name: 'Instagram', sub: 'Em breve', icon: Instagram, color: 'text-pink-400', badge: 'Em breve' },
                        { name: 'Kwai', sub: 'Em breve', icon: Sparkles, color: 'text-yellow-400', badge: 'Em breve' },
                        { name: 'Marketplaces', sub: 'Planejado', icon: ShoppingBag, color: 'text-orange-400', badge: 'Planejado' },
                      ].map(({ name, icon: Icon, color, badge }) => (
                        <div
                          key={name}
                          className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-4 opacity-55 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center ${color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-semibold text-zinc-300">{name}</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60 whitespace-nowrap">
                            {badge}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── ETAPA 2: Conta TikTok (nova) ── */}
              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <PlatformAccountStep
                    platform="tiktok"
                    selectedAccount={selectedPlatformAccount}
                    initialAccountId={account?.platform_account_id ?? null}
                    onAccountSelected={(newAcc) => {
                      setSelectedPlatformAccount(newAcc);
                      setValue('platform_account_id', newAcc?.id ?? null);
                    }}
                    onDirectUnlink={
                      isEditing && account
                        ? async () => {
                            await AdAccountsService.update(organizationId!, account.id, {
                              platform_account_id: null,
                            });
                            queryClient.invalidateQueries({ queryKey: ['ad_accounts'] });
                            queryClient.invalidateQueries({ queryKey: ['platform_accounts'] });
                            setSelectedPlatformAccount(null);
                            setValue('platform_account_id', null);
                            toast.success('Perfil TikTok desvinculado desta conta de anúncios com sucesso!');
                          }
                        : undefined
                    }
                    organizationId={organizationId!}
                    userId={userId}
                  />
                </motion.div>
              )}

              {/* ── ETAPA 3: Dados da Conta de Anúncios TikTok ── */}
              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand" />
                      Conta de anúncios para TikTok
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Preencha os dados cadastrais da sua conta de anúncios conforme o padrão oficial do TikTok Ads.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-4">
                    {/* Campo 1: Nome da conta de anúncios */}
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-medium text-zinc-300">
                        Nome da conta de anúncios <span className="text-rose-400">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ex.: Alob Express — Brasil 01"
                        {...register('name')}
                        className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600 focus-visible:ring-brand"
                      />
                      {errors.name && <p className="text-xs text-rose-400 font-medium">{errors.name.message}</p>}
                    </div>

                    {/* Campo 2: País ou região */}
                    <div className="space-y-1.5">
                      <Label htmlFor="country" className="text-xs font-medium text-zinc-300">
                        País ou região <span className="text-rose-400">*</span>
                      </Label>
                      <Select
                        value={watch('country')}
                        onValueChange={(val) => setValue('country', val, { shouldValidate: true })}
                      >
                        <SelectTrigger id="country" className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white">
                          <SelectValue placeholder="Selecione o país ou região" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          {PLATFORM_COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              <div className="flex items-center gap-2">
                                <ReactCountryFlag
                                  countryCode={c.code}
                                  svg
                                  style={{ width: '1.2em', height: '1.2em' }}
                                />
                                <span>{c.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.country && <p className="text-xs text-rose-400 font-medium">{errors.country.message}</p>}
                    </div>

                    {/* Campo 3: Nome legal da empresa */}
                    <div className="space-y-1.5">
                      <Label htmlFor="legal_name" className="text-xs font-medium text-zinc-300">
                        Nome legal da empresa
                      </Label>
                      <Input
                        id="legal_name"
                        placeholder="Nome conforme registro empresarial"
                        {...register('legal_name')}
                        className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600 focus-visible:ring-brand"
                      />
                      {errors.legal_name && <p className="text-xs text-rose-400 font-medium">{errors.legal_name.message}</p>}
                    </div>

                    {/* Campo 4: Setor / indústria */}
                    <div className="space-y-1.5">
                      <Label htmlFor="industry" className="text-xs font-medium text-zinc-300">
                        Setor / indústria
                      </Label>
                      <Select
                        value={watch('industry') || 'E-commerce & Varejo'}
                        onValueChange={(val) => setValue('industry', val)}
                      >
                        <SelectTrigger id="industry" className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white">
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-56">
                          {TIKTOK_INDUSTRIES.map((ind) => (
                            <SelectItem key={ind} value={ind}>
                              {ind}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Campo 5: Site da empresa */}
                    <div className="space-y-1.5">
                      <Label htmlFor="website" className="text-xs font-medium text-zinc-300">
                        Site da empresa
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://www.alobexpress.com.br"
                        {...register('website')}
                        className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600 focus-visible:ring-brand"
                      />
                      {errors.website && <p className="text-xs text-rose-400 font-medium">{errors.website.message}</p>}
                    </div>

                    {/* Campo 6: Nome do contato */}
                    <div className="space-y-1.5">
                      <Label htmlFor="contact_name" className="text-xs font-medium text-zinc-300">
                        Nome do contato
                      </Label>
                      <Input
                        id="contact_name"
                        placeholder="Nome do responsável"
                        {...register('contact_name')}
                        className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600 focus-visible:ring-brand"
                      />
                      {errors.contact_name && <p className="text-xs text-rose-400 font-medium">{errors.contact_name.message}</p>}
                    </div>

                    {/* Campo 7: E-mail de contato */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-medium text-zinc-300">
                        E-mail de contato
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contato@empresa.com.br"
                        {...register('email')}
                        className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600 focus-visible:ring-brand"
                      />
                      {errors.email && <p className="text-xs text-rose-400 font-medium">{errors.email.message}</p>}
                    </div>

                    {/* Campo 8: Telefone */}
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-medium text-zinc-300">
                        Telefone
                      </Label>
                      <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="phone"
                            placeholder="+55 (DDD) número"
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const masked = formatPhoneByCountry(
                                e.target.value,
                                watch('country') || 'BR'
                              );
                              field.onChange(masked);
                            }}
                            className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white font-mono placeholder:text-zinc-600 focus-visible:ring-brand"
                          />
                        )}
                      />
                      {errors.phone && <p className="text-xs text-rose-400 font-medium">{errors.phone.message}</p>}
                    </div>

                    {/* Campo 9: Fuso horário */}
                    <div className="space-y-1.5">
                      <Label htmlFor="timezone" className="text-xs font-medium text-zinc-300">
                        Fuso horário <span className="text-rose-400">*</span>
                      </Label>
                      <Input
                        id="timezone"
                        placeholder="Ex.: America/Sao_Paulo"
                        {...register('timezone')}
                        className="bg-zinc-950 border-zinc-800 text-xs h-10 font-mono text-white placeholder:text-zinc-600 focus-visible:ring-brand"
                      />
                      {errors.timezone && <p className="text-xs text-rose-400 font-medium">{errors.timezone.message}</p>}
                    </div>

                    {/* Campo 10: Moeda de faturamento */}
                    <div className="space-y-1.5">
                      <Label htmlFor="currency" className="text-xs font-medium text-zinc-300">
                        Moeda de faturamento <span className="text-rose-400">*</span>
                      </Label>
                      <Select
                        value={currency}
                        onValueChange={(val: AdAccountFormData['currency']) => setValue('currency', val, { shouldValidate: true })}
                      >
                        <SelectTrigger id="currency" className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white">
                          <SelectValue placeholder="Selecione a moeda" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="BRL">BRL — Real Brasileiro (R$)</SelectItem>
                          <SelectItem value="USD">USD — Dólar Americano ($)</SelectItem>
                          <SelectItem value="EUR">EUR — Euro (€)</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.currency && <p className="text-xs text-rose-400 font-medium">{errors.currency.message}</p>}
                    </div>
                  </div>

                  {/* Configurações Operacionais Adicionais */}
                  <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 space-y-4">
                    <h4 className="text-xs font-semibold text-zinc-200">
                      Configurações Operacionais no Sistema
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="status" className="text-xs font-medium text-zinc-300">
                          Status Operacional
                        </Label>
                        <Select
                          value={status}
                          onValueChange={(val: AdAccountFormData['status']) => setValue('status', val)}
                        >
                          <SelectTrigger id="status" className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="active">Ativa (Permite novas campanhas)</SelectItem>
                            <SelectItem value="paused">Pausada</SelectItem>
                            <SelectItem value="disabled">Desativada</SelectItem>
                            <SelectItem value="archived">Arquivada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="spending_limit" className="text-xs font-medium text-zinc-300">
                          Limite de Gasto Mensal (Opcional)
                        </Label>
                        <Controller
                          name="spending_limit"
                          control={control}
                          render={({ field }) => {
                            const currentFloat = field.value ?? 0;
                            const displayStr =
                              field.value != null && field.value > 0
                                ? formatCentsToCurrencyString(
                                    Math.round(currentFloat * 100),
                                    currency
                                  )
                                : '';

                            return (
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-xs text-zinc-400 font-bold select-none">
                                  {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$'}
                                </span>
                                <Input
                                  id="spending_limit"
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="0,00 (sem limite definido)"
                                  value={displayStr}
                                  onChange={(e) => {
                                    const digits = e.target.value.replace(/\D/g, '');
                                    if (!digits) {
                                      field.onChange(null);
                                      return;
                                    }
                                    const cents = parseInt(digits, 10);
                                    field.onChange(cents / 100);
                                  }}
                                  className="bg-zinc-950 border-zinc-800 text-xs pl-10 h-10 text-white font-mono placeholder:text-zinc-600 focus-visible:ring-brand"
                                />
                              </div>
                            );
                          }}
                        />
                        {errors.spending_limit && (
                          <p className="text-xs text-rose-400 font-medium">{errors.spending_limit.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer Oficial idêntico à imagem */}
                  <p className="text-[11px] text-zinc-500 italic px-1">
                    Os campos ilustram o formulário para o seu sistema; não representam um cadastro real no TikTok.
                  </p>
                </motion.div>
              )}

              {/* ── ETAPA 4: Identificadores TikTok Ads ── */}
              {currentStep === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Identificadores TikTok Ads
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Vincule os códigos de rastreamento e eventos do TikTok Ads Manager.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-cyan-500/25 bg-cyan-500/8 flex items-start gap-3.5">
                    <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs text-zinc-300 leading-relaxed">
                      <p className="font-semibold text-white">Como encontrar os identificadores?</p>
                      <p>
                        No TikTok Ads Manager, o <strong>Advertiser ID</strong> fica no topo superior direito. O <strong>Pixel ID</strong> pode ser criado ou copiado em <em>Assets &gt; Events &gt; Web Events</em>.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="advertiser_id" className="text-xs font-semibold text-zinc-200">
                        ID do Anunciante (Advertiser ID)
                      </Label>
                      <Input
                        id="advertiser_id"
                        placeholder="Ex: 7381234567890123456"
                        {...register('advertiser_id')}
                        className="bg-zinc-950 border-zinc-800 text-xs font-mono h-10 text-white"
                      />
                      <p className="text-[11px] text-zinc-500">ID numérico da conta TikTok Ads.</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="business_center_select" className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-purple-400" />
                          Business Center (Opcional)
                        </Label>
                        <Link
                          to="/business-centers"
                          target="_blank"
                          className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 hover:underline"
                        >
                          <Plus className="w-3 h-3" />
                          Gerenciar BCs
                        </Link>
                      </div>

                      {businessCenters.length > 0 && (
                        <Select
                          value={
                            watch('bc_entity_id') ||
                            (watch('business_center_id') ? 'manual' : 'none')
                          }
                          onValueChange={(val) => {
                            if (val === 'none') {
                              setValue('bc_entity_id', null);
                              setValue('business_center_id', '');
                            } else if (val === 'manual') {
                              setValue('bc_entity_id', null);
                            } else {
                              const selectedBc = businessCenters.find((c) => c.id === val);
                              if (selectedBc) {
                                setValue('bc_entity_id', selectedBc.id);
                                setValue('business_center_id', selectedBc.bc_id);
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="bg-zinc-950 border-zinc-800 text-xs text-zinc-200 h-10">
                            <SelectValue placeholder="Selecione um Business Center..." />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-56">
                            <SelectItem value="none">
                              <span className="text-zinc-500 italic">Nenhum Business Center vinculado</span>
                            </SelectItem>
                            {businessCenters.map((bc) => (
                              <SelectItem key={bc.id} value={bc.id}>
                                {bc.name || `BC ${bc.bc_id}`} ({bc.bc_id})
                              </SelectItem>
                            ))}
                            <SelectItem value="manual">
                              <span className="text-purple-400">Digitar ID manualmente...</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {/* Campo de texto para ID se não houver BCs ou se modo manual */}
                      {(!businessCenters.length || !watch('bc_entity_id')) && (
                        <div className="space-y-1 mt-1">
                          <Input
                            id="business_center_id"
                            placeholder="Ex: 7123456789012345678"
                            {...register('business_center_id')}
                            className="bg-zinc-950 border-zinc-800 text-xs font-mono h-10 text-white"
                          />
                          <p className="text-[11px] text-zinc-500">
                            ID numérico da central de negócios organizadora no TikTok.
                          </p>
                        </div>
                      )}

                      {watch('bc_entity_id') && (
                        <p className="text-[11px] text-emerald-400">
                          ✓ Vinculado ao Business Center ({watch('business_center_id')})
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pixel_id" className="text-xs font-semibold text-zinc-200">
                        ID do Pixel TikTok (Web Events)
                      </Label>
                      <Input
                        id="pixel_id"
                        placeholder="Ex: C8XXXXXX9012"
                        {...register('pixel_id')}
                        className="bg-zinc-950 border-zinc-800 text-xs font-mono h-10 text-white"
                      />
                      <p className="text-[11px] text-zinc-500">Pixel para disparo de conversões e checkout.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="catalog_id" className="text-xs font-semibold text-zinc-200">
                        ID do Catálogo de Produtos (Opcional)
                      </Label>
                      <Input
                        id="catalog_id"
                        placeholder="Ex: 17234567890"
                        {...register('catalog_id')}
                        className="bg-zinc-950 border-zinc-800 text-xs font-mono h-10 text-white"
                      />
                      <p className="text-[11px] text-zinc-500">ID do feed conectado ao TikTok Shop.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── ETAPA 5: Faturamento & Titularidade ── */}
              {currentStep === 5 && (
                <motion.div
                  key="step-5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      Faturamento & Titularidade
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Configure o tipo de cobrança e dados fiscais do titular.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div
                      onClick={() => setValue('billing_type', 'postpaid')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                        billingType === 'postpaid'
                          ? 'border-brand bg-brand/10 text-white shadow-md shadow-brand/10'
                          : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-brand flex-shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-white">Pós-pago (Faturado / Cartão)</h5>
                          {billingType === 'postpaid' && <Check className="w-3.5 h-3.5 text-brand stroke-[3]" />}
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Cobrança automática por limite de gastos ou ciclo mensal no cartão de crédito.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setValue('billing_type', 'prepaid')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                        billingType === 'prepaid'
                          ? 'border-brand bg-brand/10 text-white shadow-md shadow-brand/10'
                          : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400 flex-shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-white">Pré-pago (Recarga de Saldo)</h5>
                          {billingType === 'prepaid' && <Check className="w-3.5 h-3.5 text-brand stroke-[3]" />}
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Créditos pré-carregados via Boleto, Pix ou Transferência no TikTok Ads.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="legal_name" className="text-xs font-semibold text-zinc-200">
                          Razão Social / Nome Legal
                        </Label>
                        <Input
                          id="legal_name"
                          placeholder="Ex: Alob Express Comércio Digital Ltda"
                          {...register('legal_name')}
                          className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white"
                        />
                        {errors.legal_name && (
                          <p className="text-xs text-rose-400 font-medium">{errors.legal_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax_id" className="text-xs font-semibold text-zinc-200">
                          CNPJ / CPF do Titular
                        </Label>
                        <Controller
                          name="tax_id"
                          control={control}
                          render={({ field }) => (
                            <Input
                              id="tax_id"
                              placeholder="00.000.000/0000-00"
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const masked = formatCpfCnpj(e.target.value);
                                field.onChange(masked);
                              }}
                              className="bg-zinc-950 border-zinc-800 text-xs font-mono h-10 text-white placeholder:text-zinc-600 focus-visible:ring-brand"
                            />
                          )}
                        />
                        {errors.tax_id && (
                          <p className="text-xs text-rose-400 font-medium">{errors.tax_id.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-semibold text-zinc-200">
                          E-mail de Notificação Financeira
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="financeiro@empresa.com"
                          {...register('email')}
                          className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white"
                        />
                        {errors.email && (
                          <p className="text-xs text-rose-400 font-medium">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-semibold text-zinc-200">
                          Telefone / WhatsApp de Contato
                        </Label>
                        <Controller
                          name="phone"
                          control={control}
                          render={({ field }) => (
                            <Input
                              id="phone"
                              placeholder={
                                watch('country') === 'BR'
                                  ? '(11) 98765-4321'
                                  : watch('country') === 'US'
                                  ? '(555) 123-4567'
                                  : watch('country') === 'PT'
                                  ? '912 345 678'
                                  : '(11) 98765-4321'
                              }
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const masked = formatPhoneByCountry(
                                  e.target.value,
                                  watch('country') || 'BR'
                                );
                                field.onChange(masked);
                              }}
                              className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white font-mono placeholder:text-zinc-600 focus-visible:ring-brand"
                            />
                          )}
                        />
                        {errors.phone && (
                          <p className="text-xs text-rose-400 font-medium">{errors.phone.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── ETAPA 6: Revisão & Conclusão ── */}
              {currentStep === 6 && (
                <motion.div
                  key="step-6"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Revisão do Setup
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Confirme os dados configurados para ativar a conta no sistema.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: Conta de Plataforma */}
                    <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2">
                          <img src={tiktokImg} alt="TikTok" className="w-4 h-4 object-contain" />
                          <span className="text-xs font-bold text-white">Conta TikTok Vinculada</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(2)} className="h-6 text-[11px] text-brand hover:text-brand px-2">
                          Editar
                        </Button>
                      </div>
                      <div className="space-y-2 text-xs">
                        {selectedPlatformAccount ? (
                          <>
                            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800/60">
                              {selectedPlatformAccount.profile_photo_url ? (
                                <img
                                  src={selectedPlatformAccount.profile_photo_url}
                                  alt={selectedPlatformAccount.name}
                                  className="w-8 h-8 rounded-full object-cover border border-zinc-700 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-zinc-400" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-white truncate">
                                    {selectedPlatformAccount.name}
                                  </span>
                                  <ReactCountryFlag
                                    countryCode={selectedPlatformAccount.country}
                                    svg
                                    style={{ width: '1em', height: '1em' }}
                                  />
                                </div>
                                {selectedPlatformAccount.nickname && (
                                  <p className="text-[11px] text-zinc-400 font-mono truncate">
                                    @{selectedPlatformAccount.nickname}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Titular:</span>
                              <span className="text-zinc-200">{selectedPlatformAccount.holder_name}</span>
                            </div>
                            {selectedPlatformAccount.email && (
                              <div className="flex justify-between">
                                <span className="text-zinc-400">E-mail:</span>
                                <span className="text-zinc-200 font-mono truncate max-w-[150px]">
                                  {selectedPlatformAccount.email}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-zinc-400">Método de Cadastro:</span>
                              <span className="uppercase text-[11px] text-zinc-300 font-medium">
                                {selectedPlatformAccount.signup_method}
                              </span>
                            </div>
                          </>
                        ) : (
                          <span className="text-zinc-500 italic text-[11px]">Nenhuma conta vinculada (opcional)</span>
                        )}
                      </div>
                    </div>

                    {/* Card 2: Geral & Identificação */}
                    <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-brand" />
                          <span className="text-xs font-bold text-white">Dados da Conta TikTok</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(3)} className="h-6 text-[11px] text-brand hover:text-brand px-2">
                          Editar
                        </Button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Nome da Conta:</span>
                          <span className="font-semibold text-white truncate max-w-[200px]">{formValues.name || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">País / Região:</span>
                          <span className="text-zinc-200">
                            {PLATFORM_COUNTRIES.find((c) => c.code === formValues.country)?.name || formValues.country}
                          </span>
                        </div>
                        {formValues.legal_name && (
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Nome Legal:</span>
                            <span className="text-zinc-200 truncate max-w-[200px]">{formValues.legal_name}</span>
                          </div>
                        )}
                        {formValues.industry && (
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Setor:</span>
                            <span className="text-zinc-200 truncate max-w-[200px]">{formValues.industry}</span>
                          </div>
                        )}
                        {formValues.website && (
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Site:</span>
                            <span className="text-cyan-400 truncate max-w-[200px]">{formValues.website}</span>
                          </div>
                        )}
                        {formValues.contact_name && (
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Responsável:</span>
                            <span className="text-zinc-200">{formValues.contact_name}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Moeda / Fuso:</span>
                          <span className="font-mono text-zinc-300">{formValues.currency} • {formValues.timezone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Status Inicial:</span>
                          <span className="capitalize font-medium text-emerald-400">{formValues.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Identificadores TikTok */}
                    <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-bold text-white">Rastreamento & IDs</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(4)} className="h-6 text-[11px] text-brand hover:text-brand px-2">
                          Editar
                        </Button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Advertiser ID:</span>
                          <span className="font-mono text-zinc-300">{formValues.advertiser_id || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Business Center:</span>
                          <span className="font-mono text-zinc-300">{formValues.business_center_id || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Pixel TikTok:</span>
                          <span className="font-mono text-zinc-300">{formValues.pixel_id || 'Não informado'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Faturamento */}
                    <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">Faturamento & Titular</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(5)} className="h-6 text-[11px] text-brand hover:text-brand px-2">
                          Editar
                        </Button>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Modelo:</span>
                          <span className="font-semibold text-white capitalize">
                            {formValues.billing_type === 'prepaid' ? 'Pré-pago (Recarga)' : 'Pós-pago (Cartão/Faturado)'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Empresa / CNPJ:</span>
                          <span className="font-semibold text-white">
                            {formValues.legal_name || '—'} {formValues.tax_id ? `(${formValues.tax_id})` : ''}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Notificações:</span>
                          <span className="font-semibold text-white truncate max-w-[140px]">
                            {formValues.email || formValues.phone || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banner de Conclusão */}
                  <div className="p-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 flex items-center gap-3.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-xs text-zinc-200">
                      Tudo pronto! Ao clicar no botão abaixo, a conta de anúncios será cadastrada e estará disponível para associação de campanhas.
                    </p>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </form>
        </div>

        {/* Footer */}
        <DialogFooter className="px-8 py-5 border-t border-zinc-800/80 bg-zinc-950/90 flex items-center justify-between sm:justify-between w-full">
          <div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs text-zinc-400 hover:text-white"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={isSubmitting}
                className="text-xs border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white gap-2 h-10 px-4"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
            )}

            {currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-brand hover:bg-brand/90 text-white text-xs gap-2 h-10 px-6 font-semibold shadow-lg shadow-brand/25"
              >
                Avançar
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                id="btn-concluir-setup-ad-account"
                disabled={isSubmitting || !canSubmitReview}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!canSubmitReview || isSubmitting) return;
                  handleSubmit(handleFormSubmit)();
                }}
                className={`text-white text-xs gap-2 h-10 px-6 font-semibold shadow-lg transition-all ${
                  canSubmitReview
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25 cursor-pointer'
                    : 'bg-emerald-800/60 opacity-70 cursor-wait'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    {isEditing ? 'Salvar Alterações' : 'Concluir Setup & Ativar'}
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
