import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Loader2, Building, Layers, Info, DollarSign, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { adAccountSchema, type AdAccountFormData, type AdAccountWithStats } from '@/types/adAccounts';
import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';

interface AdAccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AdAccountWithStats | null;
  onSubmit: (data: AdAccountFormData) => Promise<void>;
}

export const AdAccountFormDialog: React.FC<AdAccountFormDialogProps> = ({
  open,
  onOpenChange,
  account,
  onSubmit,
}) => {
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
    formState: { errors },
  } = useForm<AdAccountFormData>({
    resolver: zodResolver(adAccountSchema),
    defaultValues,
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
    } else {
      reset(defaultValues);
    }
  }, [account, open, reset]);

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

  const status = watch('status');
  const currency = watch('currency');
  const billingType = watch('billing_type');
  const paymentStatus = watch('payment_status');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border p-6 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center p-1.5 shadow-inner">
              <img src={tiktokImg} alt="TikTok" className="w-full h-full object-contain" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {isEditing ? 'Editar Conta de Anúncios' : 'Nova Conta de Anúncios'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Configure os parâmetros da sua conta de anúncios TikTok Ads
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 pt-2">
          {/* ── SEÇÃO 1: Informações Básicas ── */}
          <div className="space-y-4 rounded-xl border border-border/70 bg-background/50 p-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <Layers className="w-4 h-4 text-orange-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                1. Informações Básicas
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="name" className="text-xs font-medium">
                  Nome da Conta <span className="text-rose-400">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: TikTok Ads - Principal (Loja Brasil)"
                  {...register('name')}
                  className="bg-card border-input text-sm"
                />
                {errors.name && (
                  <p className="text-[11px] text-rose-400 font-medium">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-medium">
                  Status Inicial
                </Label>
                <Select
                  value={status}
                  onValueChange={(val: AdAccountFormData['status']) => setValue('status', val)}
                >
                  <SelectTrigger id="status" className="bg-card border-input text-xs h-9">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-input">
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="paused">Pausada</SelectItem>
                    <SelectItem value="disabled">Desativada</SelectItem>
                    <SelectItem value="archived">Arquivada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="currency" className="text-xs font-medium">
                  Moeda
                </Label>
                <Select
                  value={currency}
                  onValueChange={(val: AdAccountFormData['currency']) => setValue('currency', val)}
                >
                  <SelectTrigger id="currency" className="bg-card border-input text-xs h-9">
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-input">
                    <SelectItem value="BRL">Real Brasileiro (BRL - R$)</SelectItem>
                    <SelectItem value="USD">Dólar Americano (USD - $)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR - €)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timezone" className="text-xs font-medium">
                  Fuso Horário
                </Label>
                <Input
                  id="timezone"
                  placeholder="America/Sao_Paulo"
                  {...register('timezone')}
                  className="bg-card border-input text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="spending_limit" className="text-xs font-medium">
                  Limite de Gasto (Opcional)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-muted-foreground">R$</span>
                  <Input
                    id="spending_limit"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Sem limite"
                    {...register('spending_limit')}
                    className="bg-card border-input text-xs pl-9 h-9"
                  />
                </div>
                {errors.spending_limit && (
                  <p className="text-[11px] text-rose-400 font-medium">
                    {errors.spending_limit.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── SEÇÃO 2: Identificadores TikTok Ads ── */}
          <div className="space-y-4 rounded-xl border border-border/70 bg-background/50 p-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                2. Identificadores TikTok Ads
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="platform_account_id" className="text-xs font-medium flex items-center gap-1.5">
                  ID do Anunciante (Advertiser ID)
                  <span title="Encontrado no painel do TikTok Ads Manager">
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </span>
                </Label>
                <Input
                  id="platform_account_id"
                  placeholder="Ex: 7381234567890123456"
                  {...register('platform_account_id')}
                  className="bg-card border-input text-xs font-mono h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="business_center_id" className="text-xs font-medium flex items-center gap-1.5">
                  ID do Business Center
                  <span title="ID do TikTok Business Center organizador">
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </span>
                </Label>
                <Input
                  id="business_center_id"
                  placeholder="Ex: 7123456789012345678"
                  {...register('business_center_id')}
                  className="bg-card border-input text-xs font-mono h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pixel_id" className="text-xs font-medium">
                  ID do Pixel TikTok
                </Label>
                <Input
                  id="pixel_id"
                  placeholder="Ex: C8XXXXXX9012"
                  {...register('pixel_id')}
                  className="bg-card border-input text-xs font-mono h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catalog_id" className="text-xs font-medium">
                  ID do Catálogo de Produtos
                </Label>
                <Input
                  id="catalog_id"
                  placeholder="Ex: 17234567890"
                  {...register('catalog_id')}
                  className="bg-card border-input text-xs font-mono h-9"
                />
              </div>
            </div>
          </div>

          {/* ── SEÇÃO 3: Empresa / Titular ── */}
          <div className="space-y-4 rounded-xl border border-border/70 bg-background/50 p-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <Building className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                3. Dados da Empresa / Titular
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="legal_name" className="text-xs font-medium">
                  Razão Social / Nome Legal
                </Label>
                <Input
                  id="legal_name"
                  placeholder="Ex: Alob Express Comércio Digital Ltda"
                  {...register('legal_name')}
                  className="bg-card border-input text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tax_id" className="text-xs font-medium">
                  CNPJ / CPF
                </Label>
                <Input
                  id="tax_id"
                  placeholder="00.000.000/0000-00"
                  {...register('tax_id')}
                  className="bg-card border-input text-xs font-mono h-9"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="industry" className="text-xs font-medium">
                  Setor / Categoria de Mercado
                </Label>
                <Input
                  id="industry"
                  placeholder="Ex: E-commerce de Moda / Varejo Digital"
                  {...register('industry')}
                  className="bg-card border-input text-xs h-9"
                />
              </div>
            </div>
          </div>

          {/* ── SEÇÃO 4: Faturamento e Contato ── */}
          <div className="space-y-4 rounded-xl border border-border/70 bg-background/50 p-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <DollarSign className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                4. Faturamento e Contato
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="billing_type" className="text-xs font-medium">
                  Tipo de Cobrança
                </Label>
                <Select
                  value={billingType}
                  onValueChange={(val: AdAccountFormData['billing_type']) =>
                    setValue('billing_type', val)
                  }
                >
                  <SelectTrigger id="billing_type" className="bg-card border-input text-xs h-9">
                    <SelectValue placeholder="Tipo de cobrança" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-input">
                    <SelectItem value="postpaid">Pós-pago (Cartão / Faturamento)</SelectItem>
                    <SelectItem value="prepaid">Pré-pago (Recarga de Saldo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payment_status" className="text-xs font-medium">
                  Status de Pagamento
                </Label>
                <Select
                  value={paymentStatus}
                  onValueChange={(val: AdAccountFormData['payment_status']) =>
                    setValue('payment_status', val)
                  }
                >
                  <SelectTrigger id="payment_status" className="bg-card border-input text-xs h-9">
                    <SelectValue placeholder="Status do pagamento" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-input">
                    <SelectItem value="normal">Normal (Regular)</SelectItem>
                    <SelectItem value="overdue">Pagamento Pendente</SelectItem>
                    <SelectItem value="restricted">Restrito / Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  E-mail de Notificação / Faturamento
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="financeiro@empresa.com"
                  {...register('email')}
                  className="bg-card border-input text-xs h-9"
                />
                {errors.email && (
                  <p className="text-[11px] text-rose-400 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium">
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="phone"
                  placeholder="(11) 98765-4321"
                  {...register('phone')}
                  className="bg-card border-input text-xs h-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs border-border"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-white text-xs gap-2"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Conta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
