import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { proxyProviderSchema, type ProxyProvider, type ProxyProviderFormData } from '@/types/proxyProviders';
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
import { Globe, FileText, Upload, X, Loader2 } from 'lucide-react';
import { ProviderLogo } from '@/components/ui/ProviderLogo';
import { useSettings } from '@/contexts/SettingsContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ProxyProviderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: ProxyProvider | null;
  onSubmit: (data: ProxyProviderFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const ProxyProviderFormDialog: React.FC<ProxyProviderFormDialogProps> = ({
  open,
  onOpenChange,
  provider,
  onSubmit,
  isSubmitting = false,
}) => {
  const { organizationId } = useSettings();
  const isEditing = !!provider;
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProxyProviderFormData>({
    resolver: zodResolver(proxyProviderSchema),
    defaultValues: {
      name: '',
      website: '',
      notes: '',
      logo_url: '',
    },
  });

  const currentLogoUrl = watch('logo_url');
  const currentName = watch('name');

  useEffect(() => {
    if (open) {
      if (provider) {
        reset({
          name: provider.name,
          website: provider.website || '',
          notes: provider.notes || '',
          logo_url: provider.logo_url || '',
        });
      } else {
        reset({
          name: '',
          website: '',
          notes: '',
          logo_url: '',
        });
      }
    }
  }, [open, provider, reset]);

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Formato inválido. Selecione uma imagem (PNG, JPG, WEBP ou SVG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploadingLogo(true);
    try {
      let finalUrl = '';
      if (organizationId) {
        try {
          const ext = file.name.split('.').pop() || 'png';
          const path = `proxy-providers/${organizationId}/logo_${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from('avatars')
            .upload(path, file, { upsert: true, contentType: file.type });

          if (!upErr) {
            const { data } = supabase.storage.from('avatars').getPublicUrl(path);
            if (data?.publicUrl) finalUrl = `${data.publicUrl}?t=${Date.now()}`;
          }
        } catch (storageErr) {
          console.warn('[ProxyProviderFormDialog] Storage upload fallback to DataURL:', storageErr);
        }
      }

      if (!finalUrl) {
        finalUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setValue('logo_url', finalUrl, { shouldValidate: true, shouldDirty: true });
      toast.success('Imagem de logo carregada com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao processar imagem de logo.');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (data: ProxyProviderFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-white rounded-2xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <ProviderLogo
              name={currentName || provider?.name || ''}
              logoUrl={currentLogoUrl}
              className="w-10 h-10"
            />
            <div>
              <DialogTitle className="text-base font-bold text-white">
                {isEditing ? 'Editar Provedor' : 'Novo Provedor de Proxy'}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                {isEditing
                  ? 'Atualize os dados, logo e links do provedor selecionado.'
                  : 'Cadastre um provedor reutilizável para vincular aos seus proxies.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          {/* Nome do Provedor */}
          <div className="space-y-1.5">
            <Label htmlFor="provider_name" className="text-xs font-semibold text-zinc-200">
              Nome do Provedor <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="provider_name"
              {...register('name')}
              placeholder="Ex: Bright Data, Oxylabs, IPRoyal..."
              className="bg-zinc-900 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600 focus:border-orange-500/60"
            />
            {errors.name && (
              <p className="text-xs text-rose-400">{errors.name.message}</p>
            )}
          </div>

          {/* Logo do Provedor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-zinc-200">
                Logo do Provedor <span className="text-zinc-500 font-normal">(Opcional)</span>
              </Label>
              {currentLogoUrl && (
                <button
                  type="button"
                  onClick={() => setValue('logo_url', '', { shouldDirty: true })}
                  className="text-[11px] text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" /> Remover logo
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/60">
              <ProviderLogo
                name={currentName || 'Provedor'}
                logoUrl={currentLogoUrl}
                className="w-12 h-12"
              />
              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleUploadLogo}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 text-xs bg-zinc-800/80 border-zinc-700 hover:bg-zinc-700 text-zinc-200 cursor-pointer gap-1.5"
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-orange-400" />
                      <span>{currentLogoUrl ? 'Alterar imagem de logo' : 'Subir imagem de logo'}</span>
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-zinc-500">
                  PNG, JPG, SVG ou WEBP até 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Website / Painel */}
          <div className="space-y-1.5">
            <Label htmlFor="provider_website" className="text-xs font-semibold text-zinc-200">
              Website / Link do Painel
            </Label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <Input
                id="provider_website"
                {...register('website')}
                placeholder="https://brightdata.com"
                className="pl-9 bg-zinc-900 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-600 focus:border-orange-500/60 font-mono"
              />
            </div>
            {errors.website && (
              <p className="text-xs text-rose-400">{errors.website.message}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="provider_notes" className="text-xs font-semibold text-zinc-200">
              Notas e Orientações
            </Label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <textarea
                id="provider_notes"
                {...register('notes')}
                placeholder="Ex: Provedor com melhor performance para contas dos EUA; recarga via cartão PJ."
                rows={3}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/60 resize-none"
              />
            </div>
            {errors.notes && (
              <p className="text-xs text-rose-400">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-zinc-800/80 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-transparent border-zinc-800 hover:bg-zinc-900 text-xs text-zinc-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || uploadingLogo}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs px-4"
            >
              {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Provedor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
