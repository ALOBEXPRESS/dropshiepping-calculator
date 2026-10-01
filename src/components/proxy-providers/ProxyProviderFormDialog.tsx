import React, { useEffect } from 'react';
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
import { Globe, Server, FileText } from 'lucide-react';

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
  const isEditing = !!provider;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProxyProviderFormData>({
    resolver: zodResolver(proxyProviderSchema),
    defaultValues: {
      name: '',
      website: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (provider) {
        reset({
          name: provider.name,
          website: provider.website || '',
          notes: provider.notes || '',
        });
      } else {
        reset({
          name: '',
          website: '',
          notes: '',
        });
      }
    }
  }, [open, provider, reset]);

  const handleFormSubmit = async (data: ProxyProviderFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-white rounded-2xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
              <Server className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white">
                {isEditing ? 'Editar Provedor' : 'Novo Provedor de Proxy'}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                {isEditing
                  ? 'Atualize os dados e links do provedor selecionado.'
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
              disabled={isSubmitting}
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
