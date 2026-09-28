import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ReactCountryFlag from 'react-country-flag';
import { useQueryClient } from '@tanstack/react-query';
import {
  User,
  AtSign,
  Phone,
  Calendar,
  FileText,
  Camera,
  Loader2,
  Search,
  Plus,
  Check,
  Info,
  ChevronDown,
  Mail,
  X,
  Coins,
} from 'lucide-react';
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
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/contexts/SettingsContext';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import {
  platformAccountSchema,
  type PlatformAccountFormData,
  type PlatformAccount,
} from '@/types/platformAccounts';
import { NICHES, PLATFORM_COUNTRIES } from '@/constants/niches';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import {
  formatCentsToCurrencyString,
  formatPhoneByCountry,
} from '@/utils/inputMasks';
import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';

// ── Moedas e Países ────────────────────────────────────────────────────────

export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
  isPrefix: boolean;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'BRL', symbol: 'R$', label: 'BRL (R$ - Real Brasileiro)', isPrefix: true },
  { code: 'USD', symbol: '$', label: 'USD ($ - Dólar Americano)', isPrefix: true },
  { code: 'EUR', symbol: '€', label: 'EUR (€ - Euro)', isPrefix: false },
  { code: 'GBP', symbol: '£', label: 'GBP (£ - Libra Esterlina)', isPrefix: true },
];

export const COUNTRY_DEFAULT_CURRENCY: Record<string, string> = {
  BR: 'BRL',
  US: 'USD',
  GB: 'GBP',
  DE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  PT: 'EUR',
};

function getCurrencyConfig(code: string): CurrencyConfig {
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === code) ??
    SUPPORTED_CURRENCIES[0]
  );
}

// ── Compressão de Imagem ───────────────────────────────────────────────────

export interface CompressedImageResult {
  file: File;
  dataUrl: string;
}

/**
 * Comprime e redimensiona a imagem usando Canvas para max 600px e JPEG 82%.
 * Retorna o arquivo binário otimizado (~25-50KB) e a string Base64 Data URL.
 */
export async function compressImage(
  file: File,
  maxPx = 600,
  qualityJpeg = 0.82
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas não disponível'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', qualityJpeg);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Falha na compressão'));
          resolve({
            file: new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
            }),
            dataUrl,
          });
        },
        'image/jpeg',
        qualityJpeg
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Erro ao carregar a imagem selecionada'));
    };
    img.src = url;
  });
}



// ── Sub-componente: seletor de conta existente ─────────────────────────────

interface PlatformAccountPickerProps {
  accounts: PlatformAccount[];
  selected: PlatformAccount | null;
  onSelect: (account: PlatformAccount) => void;
}

export const PlatformAccountPicker: React.FC<PlatformAccountPickerProps> = ({
  accounts,
  selected,
  onSelect,
}) => {
  const [search, setSearch] = useState('');

  const filtered = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.nickname ?? '').toLowerCase().includes(search.toLowerCase()) ||
      a.holder_name.toLowerCase().includes(search.toLowerCase()) ||
      (a.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Buscar conta por nome, apelido, titular ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-zinc-950 border-zinc-800 text-sm h-10 text-white placeholder:text-zinc-600 focus-visible:ring-brand"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-zinc-500 text-center py-5">
          Nenhuma conta de plataforma encontrada para a busca.
        </p>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {filtered.map((account) => {
          const isSelected = selected?.id === account.id;
          return (
            <button
              key={account.id}
              type="button"
              onClick={() => onSelect(account)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-brand bg-brand/10 shadow-sm shadow-brand/10'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
              }`}
            >
              {account.profile_photo_url ? (
                <img
                  src={account.profile_photo_url}
                  alt={account.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-zinc-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-zinc-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">
                    {account.name}
                  </span>
                  <ReactCountryFlag
                    countryCode={account.country}
                    svg
                    style={{ width: '1.1em', height: '1.1em' }}
                  />
                  {account.nickname && (
                    <span className="text-xs text-zinc-400 font-mono truncate">
                      @{account.nickname}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  <span className="text-zinc-300 font-medium">{account.holder_name}</span>
                  {account.email ? ` · ${account.email}` : ''}
                  {account.signup_method ? (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700/60 uppercase">
                      {account.signup_method}
                    </span>
                  ) : null}
                </p>
              </div>
              {isSelected ? (
                <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                </div>
              ) : (
                <span className="text-xs text-zinc-500 hover:text-zinc-300 font-medium">
                  Selecionar
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Sub-componente: formulário de nova conta de plataforma ─────────────────
// Observação técnica: NÃO utiliza tag <form> nativa para evitar form aninhado.
// Todas as ações de submissão são controladas diretamente via React Hook Form e Button type="button".

interface PlatformAccountFormFieldsProps {
  onCreated: (account: PlatformAccount) => void;
  organizationId?: string;
  userId?: string | null;
  platform: 'tiktok';
}

export const PlatformAccountFormFields: React.FC<PlatformAccountFormFieldsProps> = ({
  onCreated,
  organizationId: propOrgId,
  userId: propUserId,
  platform,
}) => {
  const queryClient = useQueryClient();
  const settings = useSettings();
  const user = useUser();
  const organizationId = propOrgId || settings.organizationId || '';
  const userId = propUserId !== undefined ? propUserId : user.userId;

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PlatformAccountFormData>({
    resolver: zodResolver(platformAccountSchema),
    defaultValues: {
      platform,
      country: 'BR',
      signup_method: 'google',
      google_ads_currency: 'BRL',
      email: '',
      google_account_age_years: undefined,
      google_ads_invested_brl: undefined,
    },
    mode: 'onChange',
  });

  const signupMethod = watch('signup_method');
  const countryValue = watch('country');
  const selectedCurrencyCode = watch('google_ads_currency') || 'BRL';
  const currencyConfig = getCurrencyConfig(selectedCurrencyCode);

  // Sincroniza automaticamente a moeda padrão e re-formata o telefone quando o País muda
  useEffect(() => {
    if (countryValue) {
      const defaultCur = COUNTRY_DEFAULT_CURRENCY[countryValue] ?? 'BRL';
      setValue('google_ads_currency', defaultCur);

      const currentPhone = watch('phone');
      if (currentPhone) {
        setValue('phone', formatPhoneByCountry(currentPhone, countryValue));
      }
    }
  }, [countryValue, setValue, watch]);

  // ── Upload e Otimização de Foto com Fallback Resiliente ───────────────────
  const processImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione um arquivo de imagem (JPG, PNG, WEBP).');
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        toast.error('A imagem excede 25 MB. Escolha uma foto menor.');
        return;
      }

      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      setUploadingPhoto(true);

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
            console.warn('[PlatformAccountStep] Storage upload fallback to DataURL:', storageErr);
          }
        }

        setValue('profile_photo_url', finalUrl, { shouldValidate: true, shouldDirty: true });
        setPreviewUrl(finalUrl);
        toast.success('Foto carregada e otimizada com sucesso!');
      } catch (err) {
        console.error('[PlatformAccountStep] Erro ao processar foto:', err);
        toast.error('Erro ao processar imagem. Tente outra foto.');
        setPreviewUrl(null);
        setValue('profile_photo_url', null);
      } finally {
        setUploadingPhoto(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    },
    [organizationId, setValue]
  );

  const handlePhotoInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processImageFile(file);
    },
    [processImageFile]
  );

  const handleRemovePhoto = useCallback(() => {
    setPreviewUrl(null);
    setValue('profile_photo_url', null, { shouldValidate: true, shouldDirty: true });
    if (fileRef.current) fileRef.current.value = '';
  }, [setValue]);

  // ── Submissão assíncrona ──────────────────────────────────────────────────
  const onSubmit = useCallback(
    async (data: PlatformAccountFormData) => {
      setIsCreating(true);
      try {
        const { PlatformAccountsService } = await import(
          '@/services/platformAccountsService'
        );
        const created = await PlatformAccountsService.create(
          organizationId,
          data,
          userId
        );
        // Invalida cache do React Query para atualizar dropdowns e listagens imediatamente
        await queryClient.invalidateQueries({ queryKey: ['platform_accounts'] });
        toast.success(`Conta "${created.name}" criada com sucesso!`);
        onCreated(created);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao criar conta';
        toast.error(msg);
      } finally {
        setIsCreating(false);
      }
    },
    [organizationId, userId, onCreated, queryClient]
  );

  const handleCreateClick = useCallback(
    (e?: React.MouseEvent | React.KeyboardEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      handleSubmit(onSubmit, (formErrors) => {
        const firstError = Object.values(formErrors)[0]?.message;
        toast.error(firstError || 'Verifique os campos obrigatórios em destaque.');
      })();
    },
    [handleSubmit, onSubmit]
  );

  return (
    <div
      className="space-y-5"
      onKeyDown={(e) => {
        // Intercepta tecla Enter nos inputs para não submeter o wizard principal
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          handleCreateClick(e);
        }
      }}
    >
      {/* ── 1. Foto de Perfil com Área Clicável e Drag & Drop ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 transition-colors hover:border-zinc-700"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const droppedFile = e.dataTransfer.files?.[0];
          if (droppedFile) processImageFile(droppedFile);
        }}
      >
        <div className="relative flex-shrink-0 self-center sm:self-auto group">
          {/* Avatar Clicável */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
            className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-zinc-700 hover:border-brand overflow-hidden flex items-center justify-center shadow-inner cursor-pointer relative transition-all duration-200 group-hover:shadow-[0_0_12px_rgba(254,44,85,0.3)]"
            title="Clique para escolher uma foto"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Foto da conta"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-7 h-7 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            )}

            {/* Overlay ao passar o mouse */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[9px] font-medium gap-0.5 pointer-events-none">
              <Camera className="w-4 h-4" />
              <span>{previewUrl ? 'Trocar' : 'Adicionar'}</span>
            </div>
          </div>

          {/* Botão Câmera no Canto */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileRef.current?.click();
            }}
            disabled={uploadingPhoto}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand border-2 border-zinc-950 flex items-center justify-center disabled:opacity-60 shadow hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            title="Escolher foto"
          >
            {uploadingPhoto ? (
              <Loader2 className="w-3 h-3 animate-spin text-white" />
            ) : (
              <Camera className="w-3 h-3 text-white" />
            )}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoInputChange}
          />
        </div>

        <div className="flex-1 space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-semibold text-white">Foto de Perfil</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
              (Opcional)
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 space-y-0.5">
            <p>• Clique no círculo ou arraste uma foto aqui</p>
            <p>• Formatos: JPG, PNG ou WEBP (até 25 MB) · Proporção recomendada: 1:1</p>
          </div>
          {uploadingPhoto && (
            <p className="text-[11px] text-brand font-medium flex items-center justify-center sm:justify-start gap-1 pt-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Otimizando e enviando imagem...
            </p>
          )}
          <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs font-semibold text-brand hover:text-brand/80 hover:underline cursor-pointer"
            >
              {previewUrl ? 'Alterar foto' : 'Escolher foto do dispositivo'}
            </button>
            {previewUrl && !uploadingPhoto && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
              >
                Remover foto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Grid de Campos Principais ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* País */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-200">
            País <span className="text-rose-400">*</span>
          </Label>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 text-xs text-white">
                  <SelectValue placeholder="Selecionar país">
                    {field.value && (
                      <span className="flex items-center gap-2">
                        <ReactCountryFlag
                          countryCode={field.value}
                          svg
                          style={{ width: '1.1em', height: '1.1em' }}
                        />
                        {PLATFORM_COUNTRIES.find((c) => c.code === field.value)?.name ??
                          field.value}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {PLATFORM_COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <ReactCountryFlag
                          countryCode={c.code}
                          svg
                          style={{ width: '1.1em', height: '1.1em' }}
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.country && (
            <p className="text-xs text-rose-400">{errors.country.message}</p>
          )}
        </div>

        {/* Nicho */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-200">
            Nicho <span className="text-rose-400">*</span>
          </Label>
          <Controller
            name="niche"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 text-xs text-white">
                  <SelectValue placeholder="Selecionar nicho" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-48">
                  {NICHES.map((n) => (
                    <SelectItem key={n.value} value={n.value}>
                      {n.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.niche && (
            <p className="text-xs text-rose-400">{errors.niche.message}</p>
          )}
        </div>

        {/* Nome da Conta */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-200">
            Nome da Conta <span className="text-rose-400">*</span>
          </Label>
          <div className="relative">
            <AtSign className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <Input
              {...register('name')}
              placeholder="Ex: TikTok Jonatan Principal"
              className="pl-9 bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600 focus-visible:ring-brand"
            />
          </div>
          {errors.name && (
            <p className="text-xs text-rose-400">{errors.name.message}</p>
          )}
        </div>

        {/* Nome do Titular */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-200">
            Nome do Titular <span className="text-rose-400">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <Input
              {...register('holder_name')}
              placeholder="Ex: Jonatan Renan"
              className="pl-9 bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600 focus-visible:ring-brand"
            />
          </div>
          {errors.holder_name && (
            <p className="text-xs text-rose-400">{errors.holder_name.message}</p>
          )}
        </div>

        {/* Apelido / Username */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>Apelido / Username</span>
            <span className="text-[10px] text-zinc-500">Opcional</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">
              @
            </span>
            <Input
              {...register('nickname')}
              placeholder="meuusuario"
              className="pl-7 bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600 focus-visible:ring-brand font-mono"
            />
          </div>
        </div>

        {/* Telefone */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>Telefone de Contato</span>
            <span className="text-[10px] text-zinc-500">Opcional</span>
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
                    const formatted = formatPhoneByCountry(e.target.value, countryValue);
                    field.onChange(formatted);
                  }}
                  placeholder={
                    countryValue === 'BR'
                      ? '(11) 98765-4321'
                      : countryValue === 'US'
                      ? '(555) 123-4567'
                      : countryValue === 'PT'
                      ? '912 345 678'
                      : '(11) 98765-4321'
                  }
                  className="pl-9 bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600 focus-visible:ring-brand font-mono"
                />
              </div>
            )}
          />
        </div>

        {/* Data de Nascimento */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
            <span>Data de Nascimento</span>
            <span className="text-[10px] text-zinc-500">Opcional</span>
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <Input
              {...register('birth_date')}
              type="date"
              className="pl-9 bg-zinc-950 border-zinc-800 text-xs h-10 text-white focus-visible:ring-brand"
            />
          </div>
        </div>

        {/* Método de Cadastro (Padrão: Google) */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-zinc-200">
            Método de Cadastro <span className="text-rose-400">*</span>
          </Label>
          <Controller
            name="signup_method"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 text-xs text-white">
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
          {errors.signup_method && (
            <p className="text-xs text-rose-400">{errors.signup_method.message}</p>
          )}
        </div>
      </div>

      {/* ── 3. Campo E-mail da Conta (Disponível e contextual para TODOS os métodos) ── */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-zinc-400" />
            {signupMethod === 'google'
              ? 'E-mail da Conta Google'
              : signupMethod === 'apple'
              ? 'E-mail / Apple ID'
              : 'E-mail de Cadastro'}
            <span className="text-rose-400">*</span>
          </span>
          <span className="text-[11px] text-zinc-500 font-normal">
            {signupMethod === 'google'
              ? 'E-mail Google utilizado no TikTok'
              : signupMethod === 'apple'
              ? 'Apple ID utilizado no TikTok'
              : 'E-mail de autenticação e notificações'}
          </span>
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
          <Input
            {...register('email')}
            type="email"
            placeholder={
              signupMethod === 'google'
                ? 'exemplo@gmail.com'
                : signupMethod === 'apple'
                ? 'exemplo@icloud.com'
                : 'seuemail@exemplo.com'
            }
            className="pl-9 bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600 focus-visible:ring-brand font-mono"
          />
        </div>
        {errors.email && (
          <p className="text-xs text-rose-400">{errors.email.message}</p>
        )}
      </div>

      {/* ── 4. Bio da Conta ── */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
            Bio / Descrição do Perfil
          </span>
          <span className="text-[10px] text-zinc-500">Opcional</span>
        </Label>
        <textarea
          {...register('bio')}
          placeholder="Descreva brevemente o nicho, objetivo ou finalidade desta conta TikTok..."
          rows={2}
          className="w-full bg-zinc-950 border border-zinc-800 text-white text-xs rounded-md px-3 py-2 resize-none placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand"
        />
        {errors.bio && (
          <p className="text-xs text-rose-400">{errors.bio.message}</p>
        )}
      </div>

      {/* ── 5. Metadados Condicionais para Cadastro via Google ── */}
      {signupMethod === 'google' && (
        <div className="p-4 rounded-2xl border border-blue-500/25 bg-blue-500/8 space-y-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-blue-300">
                Dados Adicionais da Conta Google
              </p>
              <p className="text-[11px] text-blue-400/80">
                Histórico de uso para rastreamento de maturidade e autoridade do perfil.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tempo de uso (anos) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-200">
                Tempo de uso da conta (anos)
              </Label>
              <Input
                type="number"
                min={0}
                max={30}
                step={0.5}
                placeholder="Ex: 3"
                {...register('google_account_age_years', { valueAsNumber: true })}
                className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white font-mono placeholder:text-zinc-600 focus-visible:ring-brand"
              />
            </div>

            {/* Seletor de Moeda do Investimento */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-200 flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" />
                Moeda do Investimento
              </Label>
              <Controller
                name="google_ads_currency"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || 'BRL'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 text-xs text-white">
                      <SelectValue placeholder="Moeda" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {SUPPORTED_CURRENCIES.map((cur) => (
                        <SelectItem key={cur.code} value={cur.code}>
                          <span className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400 text-xs">
                              {cur.symbol}
                            </span>
                            <span>{cur.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Investimento Google Ads com Máscara de Centavos Automática */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-200">
                Investido no Google Ads ({currencyConfig.code})
              </Label>
              <Controller
                name="google_ads_invested_brl"
                control={control}
                render={({ field }) => {
                  // Converte o valor float atual para centavos e depois para texto formatado
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
                        className="pl-10 bg-zinc-950 border-zinc-800 text-xs h-10 text-white font-mono placeholder:text-zinc-600 focus-visible:ring-brand"
                      />
                    </div>
                  );
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Metadados Condicionais para Cadastro via Apple ── */}
      {signupMethod === 'apple' && (
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex items-center gap-3">
          <Info className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <p className="text-xs text-zinc-400">
            Conta autenticada com Apple ID. O e-mail informado acima será utilizado para vínculo interno.
          </p>
        </div>
      )}

      {/* ── 7. Botão de Criação ── */}
      <Button
        type="button"
        disabled={isCreating || uploadingPhoto}
        onClick={handleCreateClick}
        className="w-full bg-brand hover:bg-brand/90 text-white text-xs h-11 font-semibold gap-2 shadow-lg shadow-brand/20 transition-all hover:scale-[1.005]"
      >
        {isCreating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Criando conta de plataforma...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Criar Conta de Plataforma
          </>
        )}
      </Button>
    </div>
  );
};

// ── Componente Principal do Passo: PlatformAccountStep ─────────────────────

interface PlatformAccountStepProps {
  platform: 'tiktok';
  selectedAccount: PlatformAccount | null;
  onAccountSelected: (account: PlatformAccount | null) => void;
  organizationId?: string;
  userId?: string | null;
  initialAccountId?: string | null;
  onDirectUnlink?: () => Promise<void> | void;
  defaultMode?: 'pick' | 'create';
}

export const PlatformAccountStep: React.FC<PlatformAccountStepProps> = ({
  platform,
  selectedAccount,
  onAccountSelected,
  organizationId: propOrgId,
  userId: propUserId,
  initialAccountId,
  onDirectUnlink,
  defaultMode = 'pick',
}) => {
  const settings = useSettings();
  const user = useUser();
  const organizationId = propOrgId || settings.organizationId || '';
  const userId = propUserId !== undefined ? propUserId : user.userId;

  const [mode, setMode] = useState<'pick' | 'create'>(defaultMode);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const { data: existingAccounts = [], isLoading } = usePlatformAccounts({
    platform,
  });

  // Auto-seleciona a conta apenas na inicialização (uma única vez), evitando desfazer a desvinculação
  const hasAutoSelectedRef = useRef(false);
  const prevInitialIdRef = useRef(initialAccountId);
  if (prevInitialIdRef.current !== initialAccountId) {
    prevInitialIdRef.current = initialAccountId;
    hasAutoSelectedRef.current = false;
  }

  useEffect(() => {
    if (!hasAutoSelectedRef.current && !selectedAccount && initialAccountId && existingAccounts.length > 0) {
      hasAutoSelectedRef.current = true;
      const found = existingAccounts.find((a) => a.id === initialAccountId);
      if (found) {
        onAccountSelected(found);
      }
    }
  }, [selectedAccount, initialAccountId, existingAccounts, onAccountSelected]);

  const platformLabel = platform === 'tiktok' ? 'TikTok' : platform;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <img src={tiktokImg} alt="TikTok" className="w-4 h-4 object-contain" />
          Conta de Plataforma {platformLabel}
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Vincule o perfil pessoal do TikTok que gerenciará esta conta de anúncios.
          Você pode selecionar uma conta existente ou cadastrar uma nova diretamente aqui.
        </p>
      </div>

      {/* Toggle de Navegação: Selecionar vs Criar */}
      <div className="flex gap-2 p-1 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
        <button
          type="button"
          onClick={() => setMode('pick')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
            mode === 'pick'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Selecionar existente ({existingAccounts.length})
        </button>
        <button
          type="button"
          onClick={() => setMode('create')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
            mode === 'create'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          + Criar nova conta
        </button>
      </div>

      {/* Modo 1: Selecionar Existente */}
      {mode === 'pick' && (
        <div className="space-y-3">
          {selectedAccount && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30">
              {selectedAccount.profile_photo_url ? (
                <img
                  src={selectedAccount.profile_photo_url}
                  alt={selectedAccount.name}
                  className="w-11 h-11 rounded-full object-cover border border-emerald-500/50 flex-shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Conta Vinculada
                  </span>
                  <ReactCountryFlag
                    countryCode={selectedAccount.country}
                    svg
                    style={{ width: '1em', height: '1em' }}
                  />
                </div>
                <p className="text-sm font-bold text-white truncate mt-0.5">
                  {selectedAccount.name}
                </p>
                <p className="text-xs text-zinc-300 truncate">
                  {selectedAccount.holder_name}
                  {selectedAccount.nickname ? ` · @${selectedAccount.nickname}` : ''}
                  {selectedAccount.email ? ` · ${selectedAccount.email}` : ''}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isUnlinking}
                onClick={async () => {
                  if (onDirectUnlink) {
                    setIsUnlinking(true);
                    try {
                      await onDirectUnlink();
                    } finally {
                      setIsUnlinking(false);
                    }
                  } else {
                    onAccountSelected(null);
                  }
                }}
                className="text-xs text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 h-8 px-2.5 gap-1.5"
              >
                {isUnlinking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Desvinculando...
                  </>
                ) : (
                  'Desvincular'
                )}
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : existingAccounts.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center space-y-3">
              <User className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm text-zinc-400 font-medium">
                Nenhuma conta {platformLabel} cadastrada ainda.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => setMode('create')}
                className="bg-brand hover:bg-brand/90 text-white text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar nova conta
              </Button>
            </div>
          ) : (
            <PlatformAccountPicker
              accounts={existingAccounts}
              selected={selectedAccount}
              onSelect={onAccountSelected}
            />
          )}
        </div>
      )}

      {/* Modo 2: Criar Nova Conta */}
      {mode === 'create' && (
        <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/50">
          <PlatformAccountFormFields
            platform={platform}
            organizationId={organizationId}
            userId={userId}
            onCreated={(account) => {
              onAccountSelected(account);
              setMode('pick');
            }}
          />
        </div>
      )}

      {/* Nota informativa */}
      <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
        <ChevronDown className="w-3 h-3 text-zinc-600" />
        Vincular uma conta de plataforma é opcional. Você pode avançar para os próximos passos normalmente.
      </p>
    </div>
  );
};

export default PlatformAccountStep;
