import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
  Radio,
  ShieldCheck,
  Check,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  adAccountSchema,
  type AdAccountFormData,
  type AdAccountWithStats,
} from '@/types/adAccounts';
import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';

interface AdAccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AdAccountWithStats | null;
  onSubmit: (data: AdAccountFormData) => Promise<void>;
}

const STEPS = [
  { id: 1, title: 'Plataforma', label: '01. Rede de Anúncios', icon: Globe },
  { id: 2, title: 'Identificação', label: '02. Dados da Conta', icon: Layers },
  { id: 3, title: 'Identificadores', label: '03. IDs & Rastreamento', icon: Sparkles },
  { id: 4, title: 'Faturamento', label: '04. Faturamento & Titular', icon: CreditCard },
  { id: 5, title: 'Revisão', label: '05. Revisão & Ativação', icon: ShieldCheck },
] as const;

export const AdAccountFormDialog: React.FC<AdAccountFormDialogProps> = ({
  open,
  onOpenChange,
  account,
  onSubmit,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!account;

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
    industry: 'E-commerce',
    email: '',
    phone: '',
    platform_account_id: '',
    business_center_id: '',
    pixel_id: '',
    catalog_id: '',
  };

  const {
    register,
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
        industry: account.industry ?? 'E-commerce',
        email: account.email ?? '',
        phone: account.phone ?? '',
        platform_account_id: account.platform_account_id ?? '',
        business_center_id: account.business_center_id ?? '',
        pixel_id: (account.platform_config?.pixel_id as string) ?? '',
        catalog_id: (account.platform_config?.catalog_id as string) ?? '',
      });
      setCurrentStep(isEditing ? 2 : 1);
    } else {
      reset(defaultValues);
      setCurrentStep(1);
    }
  }, [account, open, reset, isEditing]);

  const formValues = watch();
  const status = watch('status');
  const currency = watch('currency');
  const billingType = watch('billing_type');

  const handleNext = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = true;
    } else if (currentStep === 2) {
      isValid = await trigger(['name', 'status', 'currency', 'timezone', 'spending_limit', 'country']);
    } else if (currentStep === 3) {
      isValid = await trigger(['platform_account_id', 'business_center_id', 'pixel_id', 'catalog_id']);
    } else if (currentStep === 4) {
      isValid = await trigger(['legal_name', 'tax_id', 'industry', 'billing_type', 'payment_status', 'email', 'phone']);
    }

    if (isValid && currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFormSubmit = async (data: AdAccountFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
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
                    Etapa {currentStep} de 5
                  </span>
                </div>
                <DialogDescription className="text-xs text-zinc-400">
                  {currentStep === 1 && 'Selecione a plataforma de anúncios para veiculação das campanhas.'}
                  {currentStep === 2 && 'Defina o nome de exibição, moeda e parâmetros da conta.'}
                  {currentStep === 3 && 'Conecte os identificadores do TikTok Ads Manager e Pixel.'}
                  {currentStep === 4 && 'Configure o modelo de cobrança e dados fiscais da empresa.'}
                  {currentStep === 5 && 'Revise as configurações antes de ativar a conta no sistema.'}
                </DialogDescription>
              </div>
            </div>

            {/* Stepper Visual Elegante */}
            <div className="flex items-center gap-1.5 self-start md:self-center">
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
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
                      <span className={`hidden xl:inline ${isCurrent ? 'font-semibold text-white' : ''}`}>
                        {step.title}
                      </span>
                    </button>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`w-3 h-0.5 rounded-full transition-colors ${
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

        {/* Conteúdo Principal com Espaçamento Amplo */}
        <div className="flex-1 overflow-y-auto px-8 py-7">
          <form id="ad-account-setup-form" onSubmit={handleSubmit(handleFormSubmit)}>
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

                  {/* Card Principal TikTok Ads com Destaque e Espaço */}
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

                      {/* Badge de Selecionado */}
                      <div className="flex items-center gap-2 self-end sm:self-center px-3.5 py-1.5 rounded-xl bg-brand text-white text-xs font-semibold shadow-md shadow-brand/30">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Selecionado</span>
                      </div>
                    </div>

                    {/* Features Grid Espaçoso */}
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-zinc-200">Pixel & Web Events</span>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-zinc-200">Business Center ID</span>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-zinc-200">Múltiplas Campanhas</span>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800/80 flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs font-medium text-zinc-200">Gestão de Orçamento</span>
                      </div>
                    </div>
                  </div>

                  {/* Outras Redes de Anúncios (Futuro / Clean Grid) */}
                  <div className="space-y-2.5 pt-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Próximas Integrações de Tráfego
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-4 opacity-60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-blue-400">
                            <Radio className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold text-zinc-300">Meta Ads</h5>
                            <p className="text-[11px] text-zinc-500">Facebook & Instagram</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                          Em breve
                        </span>
                      </div>

                      <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-4 opacity-60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-amber-400">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold text-zinc-300">Google Ads</h5>
                            <p className="text-[11px] text-zinc-500">Search & PMax</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                          Em breve
                        </span>
                      </div>

                      <div className="rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-4 opacity-60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-orange-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold text-zinc-300">Shopee & Kwai</h5>
                            <p className="text-[11px] text-zinc-500">Marketplaces</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                          Planejado
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── ETAPA 2: Informações Básicas ── */}
              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-orange-400" />
                      Identificação da Conta
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Defina o nome da conta, moeda e limites operacionais.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-5">
                    {/* Nome da Conta */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                        <span>Nome da Conta de Anúncios <span className="text-rose-400">*</span></span>
                        <span className="text-[11px] text-zinc-500 font-normal">Ex: TikTok Ads - Principal (Loja Brasil)</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ex: TikTok Ads - Principal (Loja Brasil)"
                        {...register('name')}
                        className="bg-zinc-950 border-zinc-800 text-sm h-11 text-white placeholder:text-zinc-600 focus-visible:ring-brand"
                      />
                      {errors.name && (
                        <p className="text-xs text-rose-400 font-medium">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Grid 2x2 com Moeda, Status, Fuso e Limite */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-xs font-semibold text-zinc-200">
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

                      <div className="space-y-2">
                        <Label htmlFor="currency" className="text-xs font-semibold text-zinc-200">
                          Moeda da Conta
                        </Label>
                        <Select
                          value={currency}
                          onValueChange={(val: AdAccountFormData['currency']) => setValue('currency', val)}
                        >
                          <SelectTrigger id="currency" className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white">
                            <SelectValue placeholder="Selecione a moeda" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="BRL">Real Brasileiro (BRL - R$)</SelectItem>
                            <SelectItem value="USD">Dólar Americano (USD - $)</SelectItem>
                            <SelectItem value="EUR">Euro (EUR - €)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-xs font-semibold text-zinc-200">
                          Fuso Horário (Timezone)
                        </Label>
                        <Input
                          id="timezone"
                          placeholder="America/Sao_Paulo"
                          {...register('timezone')}
                          className="bg-zinc-950 border-zinc-800 text-xs h-10 font-mono text-white"
                        />
                        {errors.timezone && (
                          <p className="text-xs text-rose-400 font-medium">{errors.timezone.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="spending_limit" className="text-xs font-semibold text-zinc-200">
                          Limite de Gasto Mensal (Opcional)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-semibold">
                            {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : 'R$'}
                          </span>
                          <Input
                            id="spending_limit"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Sem limite definido"
                            {...register('spending_limit', {
                              setValueAs: (v) => (v === '' || v === null ? null : parseFloat(v)),
                            })}
                            className="bg-zinc-950 border-zinc-800 text-xs pl-9 h-10 text-white"
                          />
                        </div>
                        {errors.spending_limit && (
                          <p className="text-xs text-rose-400 font-medium">
                            {errors.spending_limit.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── ETAPA 3: Identificadores TikTok Ads ── */}
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
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Identificadores TikTok Ads
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Vincule os códigos de rastreamento e eventos do TikTok Ads Manager.
                    </p>
                  </div>

                  {/* Banner de Ajuda Rápida */}
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
                      <Label htmlFor="platform_account_id" className="text-xs font-semibold text-zinc-200">
                        ID do Anunciante (Advertiser ID)
                      </Label>
                      <Input
                        id="platform_account_id"
                        placeholder="Ex: 7381234567890123456"
                        {...register('platform_account_id')}
                        className="bg-zinc-950 border-zinc-800 text-xs font-mono h-10 text-white"
                      />
                      <p className="text-[11px] text-zinc-500">ID numérico da conta TikTok Ads.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business_center_id" className="text-xs font-semibold text-zinc-200">
                        ID do Business Center (Opcional)
                      </Label>
                      <Input
                        id="business_center_id"
                        placeholder="Ex: 7123456789012345678"
                        {...register('business_center_id')}
                        className="bg-zinc-950 border-zinc-800 text-xs font-mono h-10 text-white"
                      />
                      <p className="text-[11px] text-zinc-500">ID da central de negócios organizadora.</p>
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

              {/* ── ETAPA 4: Faturamento & Titularidade ── */}
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
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      Faturamento & Titularidade
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Configure o tipo de cobrança e dados fiscais do titular.
                    </p>
                  </div>

                  {/* Seleção Interativa de Modelo de Cobrança */}
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
                          {billingType === 'postpaid' && (
                            <Check className="w-3.5 h-3.5 text-brand stroke-[3]" />
                          )}
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
                          {billingType === 'prepaid' && (
                            <Check className="w-3.5 h-3.5 text-brand stroke-[3]" />
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Créditos pré-carregados via Boleto, Pix ou Transferência no TikTok Ads.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dados da Empresa / Titular */}
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
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax_id" className="text-xs font-semibold text-zinc-200">
                          CNPJ / CPF do Titular
                        </Label>
                        <Input
                          id="tax_id"
                          placeholder="00.000.000/0000-00"
                          {...register('tax_id')}
                          className="bg-zinc-950 border-zinc-800 text-xs font-mono h-10 text-white"
                        />
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
                        <Input
                          id="phone"
                          placeholder="(11) 98765-4321"
                          {...register('phone')}
                          className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── ETAPA 5: Revisão & Conclusão ── */}
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
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Revisão do Setup
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Confirme os dados configurados para ativar a conta no sistema.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: Geral & Identificação */}
                    <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2">
                          <img src={tiktokImg} alt="TikTok" className="w-4 h-4 object-contain" />
                          <span className="text-xs font-bold text-white">Identificação & Rede</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentStep(2)}
                          className="h-6 text-[11px] text-brand hover:text-brand px-2"
                        >
                          Editar
                        </Button>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Plataforma:</span>
                          <span className="font-semibold text-white">TikTok Ads</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Nome da Conta:</span>
                          <span className="font-semibold text-white">{formValues.name || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Status Inicial:</span>
                          <span className="capitalize font-medium text-emerald-400">{formValues.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Moeda / Fuso:</span>
                          <span className="font-mono text-zinc-300">
                            {formValues.currency} • {formValues.timezone}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Identificadores TikTok */}
                    <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-bold text-white">Rastreamento & IDs</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentStep(3)}
                          className="h-6 text-[11px] text-brand hover:text-brand px-2"
                        >
                          Editar
                        </Button>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Advertiser ID:</span>
                          <span className="font-mono text-zinc-300">{formValues.platform_account_id || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Business Center:</span>
                          <span className="font-mono text-zinc-300">{formValues.business_center_id || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Pixel TikTok:</span>
                          <span className="font-mono text-zinc-300">{formValues.pixel_id || 'Não informado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Catálogo:</span>
                          <span className="font-mono text-zinc-300">{formValues.catalog_id || 'Não informado'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Faturamento */}
                    <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 space-y-3 md:col-span-2">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">Faturamento & Titular</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentStep(4)}
                          className="h-6 text-[11px] text-brand hover:text-brand px-2"
                        >
                          Editar
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-zinc-400 block text-[11px]">Modelo de Cobrança</span>
                          <span className="font-semibold text-white capitalize mt-0.5 block">
                            {formValues.billing_type === 'prepaid' ? 'Pré-pago (Recarga)' : 'Pós-pago (Cartão/Faturado)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block text-[11px]">Empresa / CNPJ</span>
                          <span className="font-semibold text-white mt-0.5 block">
                            {formValues.legal_name || '—'} {formValues.tax_id ? `(${formValues.tax_id})` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block text-[11px]">Notificações</span>
                          <span className="font-semibold text-white mt-0.5 block truncate">
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

        {/* Footer Espaçoso com Navegação Clara */}
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

            {currentStep < 5 ? (
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
                type="submit"
                form="ad-account-setup-form"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-2 h-10 px-6 font-semibold shadow-lg shadow-emerald-600/25"
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
