import React, { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ReactCountryFlag from 'react-country-flag';
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
import { toast } from 'sonner';
import {
  platformAccountSchema,
  type PlatformAccountFormData,
  type PlatformAccount,
} from '@/types/platformAccounts';
import { NICHES, PLATFORM_COUNTRIES } from '@/constants/niches';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';

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
      a.holder_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Buscar conta por nome, apelido ou titular..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-zinc-950 border-zinc-800 text-sm h-10 text-white placeholder:text-zinc-600"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-zinc-500 text-center py-4">
          Nenhuma conta encontrada.
        </p>
      )}

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {filtered.map((account) => {
          const isSelected = selected?.id === account.id;
          return (
            <button
              key={account.id}
              type="button"
              onClick={() => onSelect(account)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-brand bg-brand/10'
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
                    style={{ width: '1em', height: '1em' }}
                  />
                </div>
                <p className="text-xs text-zinc-400 truncate">
                  {account.holder_name}
                  {account.nickname ? ` · @${account.nickname}` : ''}
                </p>
              </div>
              {isSelected && <Check className="w-4 h-4 text-brand flex-shrink-0 stroke-[3]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Sub-componente: formulário de nova conta ───────────────────────────────

interface PlatformAccountFormFieldsProps {
  onCreated: (account: PlatformAccount) => void;
  organizationId: string;
  userId?: string | null;
  platform: 'tiktok';
}

export const PlatformAccountFormFields: React.FC<PlatformAccountFormFieldsProps> = ({
  onCreated,
  organizationId,
  userId,
  platform,
}) => {
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PlatformAccountFormData>({
    resolver: zodResolver(platformAccountSchema),
    defaultValues: {
      platform,
      country: 'BR',
      signup_method: 'email',
    },
    mode: 'onChange',
  });

  const signupMethod = watch('signup_method');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview imediato
    setPreviewUrl(URL.createObjectURL(file));
    setUploadingPhoto(true);

    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      // Usa um ID temporário para o path; será atualizado após create
      const tmpId = `tmp_${Date.now()}`;
      const path = `platform-accounts/${organizationId}/${tmpId}/photo.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setValue('profile_photo_url', `${data.publicUrl}?t=${Date.now()}`);
      toast.success('Foto carregada!');
    } catch {
      toast.error('Erro ao enviar foto.');
      setPreviewUrl(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSubmit = async (data: PlatformAccountFormData) => {
    const { PlatformAccountsService } = await import('@/services/platformAccountsService');
    const created = await PlatformAccountsService.create(organizationId, data, userId);
    toast.success('Conta de plataforma criada!');
    onCreated(created);
  };

  return (
    <form id="platform-account-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Foto de Perfil */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-zinc-700 overflow-hidden flex items-center justify-center">
            {previewUrl ? (
              <img src={previewUrl} alt="Foto" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-zinc-500" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand border-2 border-zinc-950 flex items-center justify-center"
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
            onChange={handlePhotoUpload}
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-white">Foto de Perfil</p>
          <p className="text-[11px] text-zinc-500">JPG, PNG ou WEBP. Opcional.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* País */}
        <div className="space-y-2">
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
                        <ReactCountryFlag countryCode={field.value} svg style={{ width: '1.1em', height: '1.1em' }} />
                        {PLATFORM_COUNTRIES.find((c) => c.code === field.value)?.name ?? field.value}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {PLATFORM_COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <ReactCountryFlag countryCode={c.code} svg style={{ width: '1.1em', height: '1.1em' }} />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.country && <p className="text-xs text-rose-400">{errors.country.message}</p>}
        </div>

        {/* Nicho */}
        <div className="space-y-2">
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
          {errors.niche && <p className="text-xs text-rose-400">{errors.niche.message}</p>}
        </div>

        {/* Nome da Conta */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-zinc-200">
            Nome da Conta <span className="text-rose-400">*</span>
          </Label>
          <div className="relative">
            <AtSign className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <Input
              {...register('name')}
              placeholder="Ex: TikTok Jonatan Principal"
              className="pl-9 bg-zinc-950 border-zinc-800 text-xs h-10 text-white"
            />
          </div>
          {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
        </div>

        {/* Nome do Titular */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-zinc-200">
            Nome do Titular <span className="text-rose-400">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <Input
              {...register('holder_name')}
              placeholder="Ex: Jonatan Renan"
              className="pl-9 bg-zinc-950 border-zinc-800 text-xs h-10 text-white"
            />
          </div>
          {errors.holder_name && <p className="text-xs text-rose-400">{errors.holder_name.message}</p>}
        </div>

        {/* Nickname */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-zinc-200">Apelido / Username</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-bold">@</span>
            <Input
              {...register('nickname')}
              placeholder="meunickname"
              className="pl-7 bg-zinc-950 border-zinc-800 text-xs h-10 text-white"
            />
          </div>
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-zinc-200">Telefone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <Input
              {...register('phone')}
              placeholder="(11) 98765-4321"
              className="pl-9 bg-zinc-950 border-zinc-800 text-xs h-10 text-white"
            />
          </div>
        </div>

        {/* Data de Nascimento */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-zinc-200">Data de Nascimento</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <Input
              {...register('birth_date')}
              type="date"
              className="pl-9 bg-zinc-950 border-zinc-800 text-xs h-10 text-white"
            />
          </div>
        </div>

        {/* Método de Cadastro */}
        <div className="space-y-2">
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
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="apple">Apple</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-zinc-500" />
          Bio
        </Label>
        <textarea
          {...register('bio')}
          placeholder="Descreva brevemente o perfil desta conta..."
          rows={2}
          className="w-full bg-zinc-950 border border-zinc-800 text-white text-xs rounded-md px-3 py-2 resize-none placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand"
        />
        {errors.bio && <p className="text-xs text-rose-400">{errors.bio.message}</p>}
      </div>

      {/* Campo condicional: Google */}
      {signupMethod === 'google' && (
        <div className="p-4 rounded-2xl border border-blue-500/25 bg-blue-500/8 space-y-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <p className="text-xs font-semibold text-blue-300">
              Conta cadastrada via Google — dados adicionais
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-zinc-200">
                Tempo de uso da conta (anos)
              </Label>
              <Input
                type="number"
                min={0}
                max={30}
                step={0.5}
                placeholder="Ex: 2.5"
                {...register('google_account_age_years', { valueAsNumber: true })}
                className="bg-zinc-950 border-zinc-800 text-xs h-10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-zinc-200">
                Investido no Google Ads (R$)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-semibold">R$</span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0,00"
                  {...register('google_ads_invested_brl', { valueAsNumber: true })}
                  className="pl-9 bg-zinc-950 border-zinc-800 text-xs h-10 text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <Button
        type="submit"
        form="platform-account-form"
        disabled={isSubmitting}
        className="w-full bg-brand hover:bg-brand/90 text-white text-xs h-10 font-semibold gap-2"
      >
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</>
        ) : (
          <><Plus className="w-4 h-4" /> Criar Conta de Plataforma</>
        )}
      </Button>
    </form>
  );
};

// ── Componente principal: PlatformAccountStep ──────────────────────────────

interface PlatformAccountStepProps {
  /** Plataforma selecionada no passo 1 */
  platform: 'tiktok';
  /** Conta de plataforma selecionada/criada (estado do wizard) */
  selectedAccount: PlatformAccount | null;
  onAccountSelected: (account: PlatformAccount | null) => void;
  organizationId: string;
  userId?: string | null;
}

export const PlatformAccountStep: React.FC<PlatformAccountStepProps> = ({
  platform,
  selectedAccount,
  onAccountSelected,
  organizationId,
  userId,
}) => {
  const [mode, setMode] = useState<'pick' | 'create'>('pick');
  const { data: existingAccounts = [], isLoading } = usePlatformAccounts({ platform });

  const platformLabel = platform === 'tiktok' ? 'TikTok' : platform;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <img src={tiktokImg} alt="TikTok" className="w-4 h-4 object-contain" />
          Conta {platformLabel}
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Selecione o perfil pessoal da plataforma que será vinculado a esta conta de anúncios.
          Uma conta de plataforma pode existir independentemente de qualquer conta de anúncios.
        </p>
      </div>

      {/* Toggle: Selecionar existente vs. Criar nova */}
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
          Selecionar existente
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
          + Criar nova
        </button>
      </div>

      {/* Modo: Selecionar existente */}
      {mode === 'pick' && (
        <div className="space-y-3">
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
            <>
              <PlatformAccountPicker
                accounts={existingAccounts}
                selected={selectedAccount}
                onSelect={onAccountSelected}
              />
              {selectedAccount && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 stroke-[2.5]" />
                  <span className="text-xs text-emerald-300">
                    Conta <strong>{selectedAccount.name}</strong> selecionada.
                  </span>
                  <button
                    type="button"
                    onClick={() => onAccountSelected(null)}
                    className="ml-auto text-[11px] text-zinc-500 hover:text-zinc-300"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modo: Criar nova */}
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

      {/* Nota: passo opcional */}
      <p className="text-[11px] text-zinc-600 flex items-center gap-1.5">
        <ChevronDown className="w-3 h-3" />
        Este passo é opcional. Você pode avançar sem vincular uma conta de plataforma agora.
      </p>
    </div>
  );
};

export default PlatformAccountStep;
