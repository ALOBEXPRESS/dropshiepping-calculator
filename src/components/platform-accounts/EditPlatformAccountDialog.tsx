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
  Camera,
  Loader2,
  Mail,
  X,
  Coins,
  Check,
  Sparkles,
  Shield,
  Smartphone,
  AlertOctagon,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/contexts/SettingsContext';
import { useProxies } from '@/hooks/useProxies';
import { useDevices } from '@/hooks/useDevices';
import type { DeviceWithStats } from '@/types/devices';
import { PlatformAccountsService } from '@/services/platformAccountsService';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  getSocialPlatformDetails,
  TikTokLogo,
  InstagramLogo,
  FacebookLogo,
  ThreadsLogo,
  GoogleLogo,
} from '@/components/ui/PlatformLogos';
import { getAccountSocialKey } from '@/components/platform-accounts/platformAccountUtils';

interface EditPlatformAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: PlatformAccount | null;
  onSave: (id: string, data: Partial<PlatformAccountFormData>) => Promise<void>;
}

type SocialKey = 'tiktok' | 'instagram' | 'facebook' | 'threads' | 'google';

export const EditPlatformAccountDialog: React.FC<EditPlatformAccountDialogProps> = ({
  open,
  onOpenChange,
  account,
  onSave,
}) => {
  const { organizationId } = useSettings();
  const { proxies = [] } = useProxies(organizationId ?? '');
  const { devicesWithStats = [] } = useDevices();

  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [deviceAccordionOpen, setDeviceAccordionOpen] = useState(true);
  const [currentSocialKey, setCurrentSocialKey] = useState<SocialKey>('tiktok');
  const fileRef = useRef<HTMLInputElement>(null);

  const isTikTok = currentSocialKey === 'tiktok';
  const isGoogle = currentSocialKey === 'google';
  const isMeta = currentSocialKey === 'instagram' || currentSocialKey === 'facebook' || currentSocialKey === 'threads';

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
      proxy_id: null,
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
      const socialKey = getAccountSocialKey(account);
      setCurrentSocialKey(socialKey);

      const resolvedPlatform =
        account.platform ||
        (socialKey === 'instagram' || socialKey === 'facebook' || socialKey === 'threads'
          ? 'meta'
          : socialKey);

      const resolvedMetaType =
        account.meta_account_type ||
        (socialKey === 'instagram'
          ? 'instagram'
          : socialKey === 'facebook'
          ? 'facebook'
          : socialKey === 'threads'
          ? 'threads'
          : null);

      const meta = account.platform_metadata;
      const initialEmail =
        account.email ??
        (meta && 'email' in meta ? (meta.email as string | null) : null) ??
        '';

      const googleMeta = meta?.signup_method === 'google' ? meta : null;

      let initialDeviceIds = account.device_ids ?? [];
      if (initialDeviceIds.length === 0 && account.device_id) {
        initialDeviceIds = [account.device_id];
      }
      setSelectedDeviceIds(initialDeviceIds);

      if (organizationId && account.id) {
        PlatformAccountsService.getAccountDevices(organizationId, account.id)
          .then((ids) => {
            if (ids && ids.length > 0) {
              setSelectedDeviceIds(ids);
            }
          })
          .catch((err) => {
            console.warn('[EditPlatformAccountDialog] Erro ao buscar dispositivos:', err);
          });
      }

      reset({
        platform: resolvedPlatform as 'tiktok' | 'google' | 'meta',
        meta_account_type: resolvedMetaType,
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
        proxy_id: account.proxy_id ?? null,
        google_account_age_years: googleMeta?.account_age_years ?? null,
        google_ads_invested_brl: googleMeta?.google_ads_invested_brl ?? null,
        google_ads_currency: googleMeta?.google_ads_currency ?? 'BRL',
      });
      setPreviewUrl(account.profile_photo_url || null);
    }
  }, [account, open, organizationId, reset]);

  const handlePlatformChange = (key: SocialKey) => {
    setCurrentSocialKey(key);
    if (key === 'tiktok') {
      setValue('platform', 'tiktok');
      setValue('meta_account_type', null);
    } else if (key === 'google') {
      setValue('platform', 'google');
      setValue('meta_account_type', null);
    } else {
      setValue('platform', 'meta');
      setValue('meta_account_type', key);
    }
  };

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

  const handleToggleDevice = (deviceId: string) => {
    const isSelected = selectedDeviceIds.includes(deviceId);
    if (isSelected) {
      setSelectedDeviceIds((prev) => prev.filter((id) => id !== deviceId));
    } else {
      const nextLength = selectedDeviceIds.length + 1;
      if (nextLength >= 6 && isTikTok) {
        toast.error(
          '🚨 LIMITE CRÍTICO TIKTOK: Conectar 6 ou mais dispositivos gera alto risco de banimento permanente!',
          { duration: 5500 }
        );
      } else if (nextLength > 1 && isTikTok) {
        toast.warning(
          '⚠️ Atenção: Para TikTok, associar múltiplos dispositivos a uma mesma conta não é o ideal (o recomendado é 1:1).'
        );
      }
      setSelectedDeviceIds((prev) => (prev.includes(deviceId) ? prev : [...prev, deviceId]));
    }
  };

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

    if (isTikTok && selectedDeviceIds.length >= 6) {
      const confirmed = window.confirm(
        '⚠️ RISCO IMINENTE DE BANIMENTO NO TIKTOK:\n\n' +
        `Você vinculou ${selectedDeviceIds.length} dispositivos a esta conta TikTok.\n` +
        'O TikTok NÃO permite que mais de 6 dispositivos diferentes se conectem a uma conta. ' +
        'Se você continuar, sua conta estará sob risco altíssimo de suspensão e banimento definitivo pela plataforma.\n\n' +
        'Deseja realmente continuar com esta configuração de alto risco?'
      );
      if (!confirmed) return;
    }

    const finalPlatform = currentSocialKey === 'tiktok' ? 'tiktok' : currentSocialKey === 'google' ? 'google' : 'meta';
    const finalMetaType = isMeta ? currentSocialKey : null;

    setIsSaving(true);
    try {
      await onSave(account.id, {
        ...data,
        platform: finalPlatform,
        meta_account_type: finalMetaType,
        device_ids: selectedDeviceIds,
        device_id: selectedDeviceIds[0] || null,
      });
      toast.success('Conta atualizada com sucesso!');
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar conta';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const social = getSocialPlatformDetails(
    currentSocialKey === 'tiktok' ? 'tiktok' : currentSocialKey === 'google' ? 'google' : 'meta',
    isMeta ? currentSocialKey : null
  );
  const SocialLogo = social?.Logo;
  const socialName = social?.name || 'Plataforma';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-zinc-950 border-zinc-800 text-foreground shadow-2xl rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center p-2 shadow-inner">
              {SocialLogo ? (
                <SocialLogo className="w-6 h-6" />
              ) : (
                <User className="w-5 h-5 text-zinc-400" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                Editar Conta {socialName}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Altere a plataforma, dados cadastrais, titularidade e vínculos do perfil.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {/* ── SELETOR DE PLATAFORMA (TIKTOK, INSTAGRAM, FACEBOOK, THREADS, GOOGLE) ── */}
          <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Plataforma da Conta
              </Label>
              <span className="text-[10px] text-zinc-400">
                Alterne a plataforma para reconfigurar os campos
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { key: 'tiktok' as const, name: 'TikTok', Logo: TikTokLogo, activeClass: 'border-cyan-500 bg-cyan-500/15 text-cyan-300' },
                { key: 'instagram' as const, name: 'Instagram', Logo: InstagramLogo, activeClass: 'border-pink-500 bg-pink-500/15 text-pink-300' },
                { key: 'facebook' as const, name: 'Facebook', Logo: FacebookLogo, activeClass: 'border-blue-500 bg-blue-500/15 text-blue-300' },
                { key: 'threads' as const, name: 'Threads', Logo: ThreadsLogo, activeClass: 'border-zinc-400 bg-zinc-800 text-white' },
                { key: 'google' as const, name: 'Google', Logo: GoogleLogo, activeClass: 'border-amber-500 bg-amber-500/15 text-amber-300' },
              ].map((item) => {
                const isSelected = currentSocialKey === item.key;
                const ItemLogo = item.Logo;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handlePlatformChange(item.key)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? `${item.activeClass} shadow-xs ring-1 ring-white/10`
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <ItemLogo className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

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
                {isTikTok
                  ? 'Nome do Perfil TikTok'
                  : currentSocialKey === 'instagram'
                  ? 'Nome do Perfil Instagram'
                  : currentSocialKey === 'facebook'
                  ? 'Nome da Página / Perfil Facebook'
                  : currentSocialKey === 'threads'
                  ? 'Nome do Perfil Threads'
                  : 'Nome da Conta Google Ads'}{' '}
                <span className="text-rose-400">*</span>
              </Label>
              <Input
                {...register('name')}
                placeholder={
                  isTikTok
                    ? 'Ex: Minha Loja TikTok'
                    : currentSocialKey === 'instagram'
                    ? 'Ex: Loja Instagram Oficial'
                    : currentSocialKey === 'facebook'
                    ? 'Ex: Página Facebook Loja'
                    : currentSocialKey === 'threads'
                    ? 'Ex: Threads Loja'
                    : 'Ex: Google Ads Jonatan Principal'
                }
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
                {isGoogle ? 'Identificador MCC / Apelido' : 'Apelido / @Username'}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold select-none">
                  @
                </span>
                <Input
                  {...register('nickname')}
                  placeholder={
                    isTikTok
                      ? 'usuario_tiktok'
                      : currentSocialKey === 'instagram'
                      ? 'minhaloja'
                      : currentSocialKey === 'facebook'
                      ? 'pagina.loja'
                      : currentSocialKey === 'threads'
                      ? 'usuario_threads'
                      : 'mcc_principal'
                  }
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

            {/* Biografia / Descrição (TikTok e Meta) */}
            {!isGoogle && (
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="account_bio" className="text-xs font-semibold text-zinc-200">
                    Biografia / Descrição do Perfil
                  </Label>
                  <span className="text-[10px] text-zinc-500">Opcional</span>
                </div>
                <textarea
                  id="account_bio"
                  {...register('bio')}
                  rows={2}
                  placeholder={
                    isTikTok
                      ? 'Ex: Conteúdo diário e ofertas exclusivas. Link na bio!'
                      : 'Ex: Loja oficial de acessórios. Entregas em todo o Brasil.'
                  }
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/60 resize-none"
                />
              </div>
            )}
          </div>

          {/* E-mail da Conta */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                {isGoogle || signupMethod === 'google'
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
                placeholder={isGoogle ? 'usuario@gmail.com' : 'exemplo@gmail.com'}
                className="pl-9 bg-zinc-900 border-zinc-800 text-xs h-10 text-white font-mono"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-400">{errors.email.message}</p>
            )}
          </div>

          {/* Dados Condicionais Google */}
          {(isGoogle || signupMethod === 'google') && (
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
                    {...register('google_account_age_years', {
                      setValueAs: (v) => (v === '' || Number.isNaN(Number(v)) ? null : Number(v)),
                    })}
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

          {/* Proxy de Conexão */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-orange-400" />
                Proxy de Conexão
              </span>
              <span className="text-[10px] text-zinc-500 font-normal">Opcional · Para isolamento de rede</span>
            </Label>
            <Controller
              name="proxy_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || 'none'}
                  onValueChange={(val) => field.onChange(val === 'none' ? null : val)}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 h-10 text-xs text-white">
                    <SelectValue placeholder="Selecione um proxy..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="none">
                      <span className="text-zinc-400">Nenhum proxy vinculado</span>
                    </SelectItem>
                    {proxies.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-medium text-white">{p.label}</span>
                        <span className="text-zinc-400 font-mono text-[11px] ml-2">
                          ({p.protocol.toUpperCase()} · {p.host}:{p.port})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* ── ACORDEON EM VERMELHO: DISPOSITIVOS & REGRAS ANTI-BAN TIKTOK ── */}
          <div className="rounded-xl border border-red-500/40 bg-gradient-to-b from-red-950/30 via-zinc-950/70 to-zinc-950 overflow-hidden shadow-lg shadow-red-950/20">
            {/* Header / Accordion Trigger */}
            <button
              type="button"
              onClick={() => setDeviceAccordionOpen(!deviceAccordionOpen)}
              className="w-full text-left flex items-center justify-between p-3.5 bg-red-950/40 hover:bg-red-950/60 transition-colors cursor-pointer select-none border-b border-red-500/25"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/35 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-300 uppercase tracking-wide">
                      Dispositivos Vinculados
                    </span>
                    {isTikTok && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 border border-red-500/40 text-red-300">
                        Regras TikTok
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-red-400/80">
                    Controle de hardware fingerprinting e limites anti-banimento
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedDeviceIds.length === 0 && (
                  <Badge variant="outline" className="text-[10px] bg-zinc-900/80 text-zinc-400 border-zinc-700">
                    Nenhum aparelho
                  </Badge>
                )}
                {selectedDeviceIds.length === 1 && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-950/60 text-emerald-300 border-emerald-500/40 font-semibold">
                    1 aparelho · Ideal (1:1)
                  </Badge>
                )}
                {selectedDeviceIds.length > 1 && selectedDeviceIds.length < 6 && (
                  <Badge variant="outline" className="text-[10px] bg-amber-950/60 text-amber-300 border-amber-500/40 font-semibold">
                    {selectedDeviceIds.length} aparelhos · Não ideal
                  </Badge>
                )}
                {selectedDeviceIds.length >= 6 && (
                  <Badge variant="outline" className="text-[10px] bg-red-600/30 text-red-200 border-red-500 animate-pulse font-bold">
                    🚨 {selectedDeviceIds.length} aparelhos · Risco de Ban!
                  </Badge>
                )}

                <div className="p-1 rounded text-red-400 hover:text-white transition-transform duration-200">
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      deviceAccordionOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>
            </button>

            {/* Accordion Content */}
            {deviceAccordionOpen && (
              <div className="p-4 space-y-4 text-xs">
                {/* 1. Explicação Didática e Destaque TikTok */}
                <div className="rounded-lg p-3 bg-red-950/40 border border-red-500/30 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-red-200 text-xs">
                        {isTikTok
                          ? 'Regras Estritas de Segurança e Isolamento para TikTok'
                          : 'Atenção às Políticas de Isolamento de Hardware'}
                      </p>
                      <p className="text-[11px] text-red-300/90 leading-relaxed">
                        {isTikTok ? (
                          <>
                            No <strong className="text-white">TikTok</strong>, uma conta pode estar associada a um ou vários dispositivos (
                            <span className="text-amber-300 font-medium">não é o ideal</span>), assim como um dispositivo pode conter várias contas (
                            <span className="text-amber-300 font-medium">não é o ideal</span>). O padrão recomendado e mais seguro é{' '}
                            <strong className="text-emerald-300 font-bold">1 dispositivo para cada conta (1:1)</strong>.
                          </>
                        ) : (
                          <>
                            A vinculação multi-dispositivo deve ser gerenciada com cautela para evitar cruzamento de hardware fingerprint.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Alerta Fatal de 6 dispositivos */}
                  <div className="pt-2 border-t border-red-500/20 flex items-start gap-2">
                    <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="text-[11px] text-red-300/95 leading-relaxed">
                      <strong className="text-red-200 uppercase font-bold">Risco de Banimento Imediato:</strong>{' '}
                      O TikTok <strong className="text-white">NÃO permite mais de 6 dispositivos diferentes conectados</strong> à mesma conta. Ultrapassar essa marca dispara o filtro anti-fraude de login da ByteDance e causa{' '}
                      <strong className="text-red-300 underline underline-offset-2">risco imediato de suspensão permanente</strong>.
                    </div>
                  </div>
                </div>

                {/* 2. Medidor Visual de Dispositivos Conectados */}
                <div className="space-y-1.5 bg-zinc-900/60 p-3 rounded-lg border border-red-500/20">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                      Medidor de Dispositivos Vinculados:
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        selectedDeviceIds.length >= 6
                          ? 'text-red-400'
                          : selectedDeviceIds.length > 1
                          ? 'text-amber-400'
                          : selectedDeviceIds.length === 1
                          ? 'text-emerald-400'
                          : 'text-zinc-500'
                      }`}
                    >
                      {selectedDeviceIds.length} / 5 dispositivos seguros
                    </span>
                  </div>

                  {/* Barra de 6 slots */}
                  <div className="grid grid-cols-6 gap-1 h-2">
                    {[1, 2, 3, 4, 5, 6].map((slot) => {
                      const isFilled = selectedDeviceIds.length >= slot;
                      let slotColor = 'bg-zinc-800';
                      if (isFilled) {
                        if (slot === 1) slotColor = 'bg-emerald-500';
                        else if (slot <= 5) slotColor = 'bg-amber-500';
                        else slotColor = 'bg-red-500 animate-pulse';
                      }
                      return (
                        <div
                          key={slot}
                          title={
                            slot === 1
                              ? 'Slot 1: Ideal (1:1)'
                              : slot <= 5
                              ? `Slot ${slot}: Múltiplos aparelhos (Atenção)`
                              : 'Slot 6+: LIMITE CRÍTICO - BANIMENTO'
                          }
                          className={`rounded-sm transition-all duration-300 ${slotColor}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                    <span className="text-emerald-400/80">1: Ideal</span>
                    <span className="text-amber-400/80">2 a 5: Não ideal</span>
                    <span className="text-red-400 font-bold">6+: Banimento</span>
                  </div>
                </div>

                {/* 3. Seleção de Dispositivos */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
                    <span>Selecione os Dispositivos Físicos ou Virtuais:</span>
                    <span className="text-[10px] text-zinc-400">
                      {devicesWithStats.length} cadastrados no workspace
                    </span>
                  </Label>

                  {devicesWithStats.length === 0 ? (
                    <div className="p-4 rounded-lg bg-zinc-900/60 border border-dashed border-zinc-800 text-center text-zinc-400 space-y-1">
                      <p>Nenhum dispositivo cadastrado na organização.</p>
                      <p className="text-[11px] text-zinc-500">
                        Cadastre computadores ou celulares na seção Dispositivos para vinculá-los aqui.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                      {devicesWithStats.map((dev: DeviceWithStats) => {
                        const isSelected = selectedDeviceIds.includes(dev.id);
                        return (
                          <label
                            key={dev.id}
                            htmlFor={`device-checkbox-${dev.id}`}
                            className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all select-none ${
                              isSelected
                                ? 'bg-red-950/50 border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
                                : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Checkbox
                                id={`device-checkbox-${dev.id}`}
                                checked={isSelected}
                                onCheckedChange={() => handleToggleDevice(dev.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 border-zinc-700"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-white truncate text-xs">
                                    {dev.label}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                    {dev.device_type}
                                  </span>
                                </div>
                                {dev.proxy_label && (
                                  <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                                    🌐 Proxy: {dev.proxy_label}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isSelected && (
                              <span className="text-[10px] font-semibold text-red-300 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                                Vinculado
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Banner de Risco Ativo se >= 6 selecionados */}
                {selectedDeviceIds.length >= 6 && isTikTok && (
                  <div className="p-3 rounded-lg bg-red-600/20 border-2 border-red-500 flex items-center gap-3 animate-pulse">
                    <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-red-200">
                        ALERTA MÁXIMO: Risco Iminente de Banimento da Conta TikTok!
                      </p>
                      <p className="text-[11px] text-red-300">
                        Você selecionou {selectedDeviceIds.length} dispositivos. O algoritmo do TikTok detectará login simultâneo anormal e suspenderá a conta. Desmarque até ficar com menos de 6 aparelhos (ideal: 1).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
