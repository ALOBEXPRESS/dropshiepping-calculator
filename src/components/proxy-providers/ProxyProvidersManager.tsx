import React, { useState, useMemo } from 'react';
import { useProxyProviders } from '@/hooks/useProxyProviders';
import { ProxyProviderFormDialog } from './ProxyProviderFormDialog';
import type { ProxyProvider, ProxyProviderFormData, ProxyProviderWithStats } from '@/types/proxyProviders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Server,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ProviderLogo } from '@/components/ui/ProviderLogo';

interface ProxyProvidersManagerProps {
  organizationId: string;
}

export const ProxyProvidersManager: React.FC<ProxyProvidersManagerProps> = ({ organizationId: _orgId }) => {
  const {
    providersWithStats,
    isLoading,
    createProvider,
    updateProvider,
    deleteProvider,
    isCreating,
    isUpdating,
  } = useProxyProviders();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProxyProvider | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<ProxyProviderWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredProviders = useMemo(() => {
    if (!search.trim()) return providersWithStats;
    const q = search.toLowerCase();
    return providersWithStats.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.website && p.website.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
    );
  }, [providersWithStats, search]);

  const handleOpenCreate = () => {
    setEditingProvider(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (p: ProxyProvider) => {
    setEditingProvider(p);
    setFormOpen(true);
  };

  const handleSave = async (data: ProxyProviderFormData) => {
    if (editingProvider) {
      await updateProvider({ id: editingProvider.id, data });
    } else {
      await createProvider(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProvider) return;
    setIsDeleting(true);
    try {
      await deleteProvider(deletingProvider.id);
      setDeletingProvider(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Busca e Botão Novo Provedor */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Provedores de Proxy
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {providersWithStats.length}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Cadastre e gerencie provedores de proxy reutilizáveis para atribuir aos seus proxies de rede.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, site ou notas..."
              className="pl-9 bg-zinc-900 border-zinc-800 text-xs h-9 text-white placeholder:text-zinc-500 focus:border-orange-500/60"
            />
          </div>
          <Button
            onClick={handleOpenCreate}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs h-9 px-4 gap-2 whitespace-nowrap cursor-pointer shadow-lg shadow-orange-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Provedor</span>
          </Button>
        </div>
      </div>

      {/* Grid de Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 animate-pulse"
            />
          ))}
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400">
            <Server className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">
            {search ? 'Nenhum provedor encontrado' : 'Nenhum provedor cadastrado'}
          </h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {search
              ? 'Tente ajustar os termos da sua busca para encontrar provedores cadastrados.'
              : 'Clique em "Novo Provedor" para adicionar Bright Data, Oxylabs ou outros serviços de proxy.'}
          </p>
          {!search && (
            <Button
              onClick={handleOpenCreate}
              variant="outline"
              className="mt-2 text-xs border-zinc-700 hover:bg-zinc-800 text-zinc-200"
            >
              Cadastrar Provedor
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProviders.map((provider) => (
            <div
              key={provider.id}
              className="p-5 rounded-2xl border border-zinc-800/90 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-3">
                {/* Top: Ícone, Nome e Ações */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ProviderLogo name={provider.name} className="w-10 h-10" />
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                        {provider.name}
                      </h4>
                      {provider.website ? (
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-zinc-400 hover:text-orange-400 flex items-center gap-1 mt-0.5 transition-colors font-mono"
                        >
                          <span>{provider.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-zinc-600 block mt-0.5">
                          Sem site cadastrado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(provider)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Editar provedor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProvider(provider)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Excluir provedor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notas se houver */}
                {provider.notes && (
                  <p className="text-[11px] text-zinc-400 line-clamp-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
                    {provider.notes}
                  </p>
                )}
              </div>

              {/* Rodapé do Card: Contagem de Proxies */}
              <div className="pt-3 mt-3 border-t border-zinc-800/60 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Shield className="w-3.5 h-3.5 text-orange-400/80" />
                  <span>Proxies Atribuídos</span>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                    provider.proxy_count > 0
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      : 'bg-zinc-800/60 text-zinc-500 border-zinc-800'
                  }`}
                >
                  {provider.proxy_count} {provider.proxy_count === 1 ? 'proxy' : 'proxies'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de Criação / Edição */}
      <ProxyProviderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        provider={editingProvider}
        onSubmit={handleSave}
        isSubmitting={isCreating || isUpdating}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={!!deletingProvider} onOpenChange={(open) => !open && setDeletingProvider(null)}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <DialogTitle className="text-base font-bold text-white">
              Excluir Provedor
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Tem certeza que deseja remover o provedor{' '}
              <strong className="text-white">"{deletingProvider?.name}"</strong>?
              {deletingProvider && deletingProvider.proxy_count > 0 && (
                <span className="block mt-2 text-rose-400 font-medium">
                  Atenção: Este provedor possui {deletingProvider.proxy_count} proxy(ies) associado(s).
                  Você precisará desvinculá-los antes de confirmar a exclusão.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingProvider(null)}
              className="bg-transparent border-zinc-800 hover:bg-zinc-900 text-xs text-zinc-300"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isDeleting || (deletingProvider?.proxy_count ?? 0) > 0}
              onClick={handleConfirmDelete}
              className="bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs px-4"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
