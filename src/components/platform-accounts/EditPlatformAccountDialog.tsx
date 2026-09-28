import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ReactCountryFlag from 'react-country-flag';
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
  User,
  Phone,
  Calendar,
  FileText,
  Camera,
  Loader2,
  Mail,
  X,
  Coins,
  Check,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/contexts/SettingsContext';
import {
  platformAccountSchema,
  type PlatformAccountFormData,
  type PlatformAccount,
} from '@/types/platformAccounts';
import { NICHES, PLATFORM_COUNTRIES } from '@/constants/niches';
import {
  SUPPORTED_CURRENCIES,
  COUNTRY_DEFAULT_CURRENCY,
  type CurrencyConfig,
  compressImage,
} from '@/components/ad-accounts/PlatformAccountStep';
import {
  formatCentsToCurrencyString,
  formatPhoneByCountry,
} from '@/utils/inputMasks';
import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';

interface EditPlatformAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: PlatformAccount | null;
  onSave: (id: string, data: Partial<PlatformAccountFormData>) => Promise<void>;
}

export const EditPlatformAccountDialog: React.FC<EditPlatformAccountDialogProps> = ({
  open,
  onOpenChange,
  account,
  onSave,
}) => {
  const { organizationId } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PlatformAccountFormData>({
    resolver: zodResolver(platformAccountSchema),
    defaultValues: {
      platform: 'tiktok',
      country: 'BR',
      name: '',
      holder_name: '',
      nickname: '',
      profile_photo_url: null,
      bio: '',
      niche: 'moda_acessorios',
      signup_method: 'google',
      phone: '',
      birth_date: '',
      email: '',
      google_account_age_years: null,
      google_ads_invested_brl: null,
      google_ads_currency: 'BRL',
    },
  });

  const countryValue = watch('country');
  const signupMethod = watch('signup_method');
  const selectedCurrencyCode = watch('google_ads_currency') || 'BRL';

  const currencyConfig: CurrencyConfig =
    SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrencyCode) ??
    SUPPORTED_CURRENCIES[0];

  useEffect(() => {
    if (account && open) {
      const meta = account.platform_metadata;
      const initialEmail =
        account.email ??
        (meta && 'email' in meta ? (meta.email as string | null) : null) ??
        '';

      const googleMeta = meta?.signup_method === 'google' ? meta : null;

      reset({
        platform: 'tiktok',
        country: account.country || 'BR',
        name: account.name || '',
        holder_name: account.holder_name || '',
        nickname: account.nickname || '',
        profile_photo_url: account.profile_photo_url || null,
        bio: account.bio || '',
        niche: account.niche || 'moda_acessorios',
        signup_method: account.signup_method || 'google',
        phone: account.phone ? formatPhoneByCountry(account.phone, account.country) : '',
        birth_date: account.birth_date || '',
        email: initialEmail,
        google_account_age_years: googleMeta?.account_age_years ?? null,
        google_ads_invested_brl: googleMeta?.google_ads_invested_brl ?? null,
        google_ads_currency: googleMeta?.google_ads_currency ?? 'BRL',
      });
      setPreviewUrl(account.profile_photo_url || null);
    }
  }, [account, open, reset]);

  // Ao mudar país, re-formata o telefone e atualiza a moeda padrão caso necessário
  useEffect(() => {
    if (countryValue) {
      const defaultCur = COUNTRY_DEFAULT_CURRENCY[countryValue] ?? 'BRL';
      if (!watch('google_ads_currency')) {
        setValue('google_ads_currency', defaultCur);
      }
      const currentPhone = watch('phone');
      if (currentPhone) {
        setValue('phone', formatPhoneByCountry(currentPhone, countryValue));
      }
    }
  }, [countryValue, setValue, watch]);

  // Upload e compressão de foto de perfil
  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Por favor utilize um formato de imagem (JPG, PNG ou WEBP).');
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast.error('Arquivo excede o limite de 25MB.');
        return;
      }

      setUploadingPhoto(true);
      const instantPreview = URL.createObjectURL(file);
      setPreviewUrl(instantPreview);

      try {
        const { file: compressedFile, dataUrl } = await compressImage(file, 600, 0.82);
        let finalUrl = dataUrl;

        if (organizationId) {
          try {
            const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
            const path = `platform-accounts/${organizationId}/photo_${Date.now()}.${ext}`;
            const { error: upErr } = await supabase.storage
              .from('avatars')
              .upload(path, compressedFile, { upsert: true, contentType: compressedFile.type });

            if (!upErr) {
              const { data } = supabase.storage.from('avatars').getPublicUrl(path);
              if (data?.publicUrl) {
                finalUrl = `${data.publicUrl}?t=${Date.now()}`;
              }
            }
          } catch (storageErr) {
            console.warn('[EditPlatformAccountDialog] Storage upload fallback to DataURL:', storageErr);
          }
        }

        setValue('profile_photo_url', finalUrl, { shouldValidate: true, shouldDirty: true });
        setPreviewUrl(finalUrl);
        toast.success('Foto atualizada com sucesso!');
      } catch (err) {
        console.error('[EditPlatformAccountDialog] Erro ao processar foto:', err);
        toast.error('Erro ao processar imagem.');
      } finally {
        setUploadingPhoto(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    },
    [organizationId, setValue]
  );

  const handleFormSubmit = async (data: PlatformAccountFormData) => {
    if (!account) return;
    setIsSaving(true);
    try {
      await onSave(account.id, data);
      toast.success('Conta atualizada com sucesso!');
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar conta';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-zinc-950 border-zinc-800 text-foreground shadow-2xl rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/25 flex items-center justify-center p-2">
              <img src={tiktokImg} alt="TikTok" className="w-full h-full object-contain" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                Editar Conta de Plataforma
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Altere os dados cadastrais, titularidade e vínculos do perfil TikTok.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* Avatar Upload */}
          <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40">
            <div className="relative group w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 flex-shrink-0 flex items-center justify-center">
              {uploadingPhoto ? (
                <Loader2 className="w-6 h-6 text-brand animate-spin" />
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-zinc-500" />
              )}
              <label
                htmlFor="edit-account-photo"
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-[10px]"
              >
                <Camera className="w-4 h-4" />
                <span>Trocar</span>
              </label>
              <input
                id="edit-account-photo"
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-xs font-semibold text-white">Foto do Perfil</p>
              <p className="text-[11px] text-zinc-400">
                Otimizada automaticamente (máx 10MB, JPG/PNG/WEBP).
              </p>
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setValue('profile_photo_url', null);
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 mt-1"
                >
                  <X className="w-3 h-3" /> Remover foto
                </button>
              )}
            </div>
          </div>

          {/* Dados Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-200">
                Nome da Conta <span className="text-rose-400">*</span>
              </Label>
              <Input
                {...register('name')}
                placeholder="Ex: Minha Loja TikTok"
                className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white"
              />
              {errors.name && (
                <p className="text-xs text-rose-400">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-200">
                Nome do Titular <span className="text-rose-400">*</span>
              </Label>
              <Input
                {...register('holder_name')}
                placeholder="Ex: Jonatan Renan"
                className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white"
              />
              {errors.holder_name && (
                <p className="text-xs text-rose-400">{errors.holder_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-200">
                Apelido / @Username
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold select-none">
                  @
                </span>
                <Input
                  {...register('nickname')}
                  placeholder="usuario_tiktok"
                  className="pl-7 bg-zinc-900 border-zinc-800 text-xs h-10 text-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-200">
                País <span className="text-rose-400">*</span>
              </Label>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 h-10 text-xs text-white">
                      <div className="flex items-center gap-2">
                        <ReactCountryFlag countryCode={field.value} svg className="text-base" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {PLATFORM_COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <div className="flex items-center gap-2">
                            <ReactCountryFlag countryCode={c.code} svg className="text-sm" />
                            <span>{c.name} ({c.code})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-200">
                Nicho de Mercado <span className="text-rose-400">*</span>
              </Label>
              <Controller
                name="niche"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 h-10 text-xs text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-56">
                      {NICHES.map((n) => (
                        <SelectItem key={n.value} value={n.value}>
                          {n.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-200">
                Telefone de Contato
              </Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <Input
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const masked = formatPhoneByCountry(e.target.value, countryValue);
                        field.onChange(masked);
                      }}
                      placeholder="(11) 98765-4321"
                      className="pl-9 bg-zinc-900 border-zinc-800 text-xs h-10 text-white font-mono"
                    />
                  </div>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-200">
                Data de Nascimento
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <Input
                  {...register('birth_date')}
                  type="date"
                  className="pl-9 bg-zinc-900 border-zinc-800 text-xs h-10 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-200">
                Método de Cadastro <span className="text-rose-400">*</span>
              </Label>
              <Controller
                name="signup_method"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 h-10 text-xs text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="google">Google</SelectItem>
                      <SelectItem value="apple">Apple</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* E-mail da Conta */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                {signupMethod === 'google'
                  ? 'E-mail da Conta Google'
                  : signupMethod === 'apple'
                  ? 'Apple ID / E-mail'
                  : 'E-mail de Cadastro'}
              </span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <Input
                {...register('email')}
                type="email"
                placeholder="exemplo@gmail.com"
                className="pl-9 bg-zinc-900 border-zinc-800 text-xs h-10 text-white font-mono"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-400">{errors.email.message}</p>
            )}
          </div>

          {/* Dados Condicionais Google */}
          {signupMethod === 'google' && (
            <div className="p-4 rounded-xl border border-blue-500/25 bg-blue-500/8 space-y-3">
              <p className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Histórico & Maturidade da Conta Google
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-200">Tempo de Uso (anos)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    step={0.5}
                    placeholder="Ex: 3"
                    {...register('google_account_age_years', { valueAsNumber: true })}
                    className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-200 flex items-center gap-1">
                    <Coins className="w-3 h-3 text-amber-400" />
                    Moeda
                  </Label>
                  <Controller
                    name="google_ads_currency"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || 'BRL'} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 h-10 text-xs text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          {SUPPORTED_CURRENCIES.map((cur) => (
                            <SelectItem key={cur.code} value={cur.code}>
                              <span className="font-mono font-bold text-amber-400 mr-1.5">{cur.symbol}</span>
                              {cur.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-200">
                    Investido Google Ads ({currencyConfig.code})
                  </Label>
                  <Controller
                    name="google_ads_invested_brl"
                    control={control}
                    render={({ field }) => {
                      const currentFloat = field.value ?? 0;
                      const displayStr =
                        field.value != null && field.value > 0
                          ? formatCentsToCurrencyString(
                              Math.round(currentFloat * 100),
                              selectedCurrencyCode
                            )
                          : '';

                      return (
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-zinc-400 font-bold select-none">
                            {currencyConfig.symbol}
                          </span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0,00"
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
                            className="pl-9 bg-zinc-900 border-zinc-800 text-xs h-10 text-white font-mono placeholder:text-zinc-600 focus-visible:ring-brand"
                          />
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bio */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-200">Bio / Descrição</Label>
            <textarea
              {...register('bio')}
              placeholder="Descreva a finalidade ou nicho desta conta..."
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs rounded-md px-3 py-2 resize-none placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-zinc-800/80 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-brand hover:bg-brand/90 text-white text-xs gap-2 h-10 px-6 font-semibold shadow-lg shadow-brand/25"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
