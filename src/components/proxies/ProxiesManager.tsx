import React, { useState, useMemo } from 'react';
import { Shield, Plus, Loader2, Server, Globe, Search } from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProviderLogo } from '@/components/ui/ProviderLogo';
import { useProxies } from '@/hooks/useProxies';
import { useProxyProviders } from '@/hooks/useProxyProviders';
import { useDebounce } from '@/hooks/useDebounce';
import type { PlatformAccount } from '@/types/platformAccounts';
import type { Proxy } from '@/types/proxies';
import { ProxyCard } from './ProxyCard';
import { ProxyFormDialog } from './ProxyFormDialog';
import {
  groupProxiesByProvider,
  groupProxiesByCountry,
  filterProxies,
  getCountryName,
} from './proxiesUtils';

export { getCountryName };

export interface ProxiesManagerProps {
  organizationId: string;
  platformAccounts: PlatformAccount[];
  /** Se fornecido, mostra apenas o proxy vinculado a esta conta */
  filterByAccountId?: string;
}

export const ProxiesManager: React.FC<ProxiesManagerProps> = ({
  organizationId,
  platformAccounts,
  filterByAccountId,
}) => {
  const { proxies, isLoading, deleteProxy, linkProxy, isDeleting, isLinking } =
    useProxies(organizationId);
  const { providers } = useProxyProviders();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'provider' | 'country'>('provider');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>('all');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('all');

  const providerMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of providers) {
      map.set(p.id, p.name);
    }
    return map;
  }, [providers]);

  // Mapeia proxy_id → platform_account para exibir vinculação
  const proxyToAccount = useMemo(() => {
    const map = new Map<string, PlatformAccount>();
    for (const acc of platformAccounts) {
      if ((acc as PlatformAccount & { proxy_id?: string | null }).proxy_id) {
        map.set((acc as PlatformAccount & { proxy_id?: string | null }).proxy_id!, acc);
      }
    }
    return map;
  }, [platformAccounts]);

  const visibleProxies = useMemo(() => {
    let result = proxies;
    if (filterByAccountId) {
      result = result.filter((p) => {
        const acc = proxyToAccount.get(p.id);
        return acc?.id === filterByAccountId;
      });
    }
    if (debouncedSearch.trim()) {
      result = filterProxies(result, debouncedSearch, providerMap, proxyToAccount);
    }
    return result;
  }, [proxies, filterByAccountId, proxyToAccount, debouncedSearch, providerMap]);

  // Agrupa proxies por provedor
  const groupedByProvider = useMemo(() => {
    return groupProxiesByProvider(visibleProxies, providerMap);
  }, [visibleProxies, providerMap]);

  // Grupos filtrados por provedor selecionado
  const displayedProviderGroups = useMemo(() => {
    if (selectedProviderFilter === 'all') return groupedByProvider;
    return groupedByProvider.filter(
      (g) => g.name.toLowerCase() === selectedProviderFilter.toLowerCase()
    );
  }, [groupedByProvider, selectedProviderFilter]);

  // Agrupa proxies por país
  const groupedByCountry = useMemo(() => {
    return groupProxiesByCountry(visibleProxies);
  }, [visibleProxies]);

  // Grupos filtrados por país selecionado
  const displayedGroups = useMemo(() => {
    if (selectedCountryFilter === 'all') return groupedByCountry;
    return groupedByCountry.filter((g) => g.code === selectedCountryFilter);
  }, [groupedByCountry, selectedCountryFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProxy(deleteId);
      toast.success('Proxy excluído com sucesso.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir proxy.');
    } finally {
      setDeleteId(null);
    }
  };

  const handleUnlink = async (proxy: Proxy) => {
    const linkedAcc = proxyToAccount.get(proxy.id);
    if (!linkedAcc) return;
    try {
      await linkProxy(linkedAcc.id, null);
      toast.success('Proxy desvinculado com sucesso.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao desvincular proxy.');
    }
  };

  const currentEditingLinkedAccount = editingProxy ? proxyToAccount.get(editingProxy.id) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            Proxies
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie e organize os proxies por país vinculados às contas de plataforma
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProxy(null);
            setFormOpen(true);
          }}
          className="bg-orange-600 hover:bg-orange-700 text-white gap-2 h-9 text-sm shadow-md shadow-orange-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Proxy
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : proxies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/20 py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Shield className="w-7 h-7 text-orange-400/60" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Nenhum proxy cadastrado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastre proxies organizados por país para proteger e isolar as sessões das contas.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setEditingProxy(null);
              setFormOpen(true);
            }}
            className="gap-2 mt-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro proxy
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Barra de Controles: Agrupamento + Filtros + Busca */}
          <div className="space-y-3 pb-2 border-b border-border/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Toggle de Agrupamento */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Agrupar por:</span>
                <div className="flex items-center p-0.5 rounded-lg bg-card/60 border border-border/60">
                  <button
                    type="button"
                    onClick={() => setGroupBy('provider')}
                    className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      groupBy === 'provider'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>Provedor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupBy('country')}
                    className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      groupBy === 'country'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>País</span>
                  </button>
                </div>
              </div>

              {/* Busca e Informação de contagem */}
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar IP, host, conta..."
                    className="pl-9 bg-zinc-900 border-zinc-800 text-xs h-9 text-white placeholder:text-zinc-500 focus:border-orange-500/60"
                  />
                </div>
                <div className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                  Total de {visibleProxies.length} {visibleProxies.length === 1 ? 'proxy' : 'proxies'}
                </div>
              </div>
            </div>

            {/* Pills de Filtro conforme o agrupamento ativo */}
            {groupBy === 'provider' ? (
              groupedByProvider.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedProviderFilter('all')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                      selectedProviderFilter === 'all'
                        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-semibold'
                        : 'bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground border border-border/50'
                    }`}
                  >
                    <span>Todos os provedores</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/60 font-mono">
                      {visibleProxies.length}
                    </span>
                  </button>
                  {groupedByProvider.map((group) => {
                    const isSelected =
                      selectedProviderFilter.toLowerCase() === group.name.toLowerCase();
                    return (
                      <button
                        key={group.name}
                        type="button"
                        onClick={() => setSelectedProviderFilter(group.name)}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-semibold'
                            : 'bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground border border-border/50'
                        }`}
                      >
                        <ProviderLogo
                          name={group.name === 'Sem Provedor' ? '' : group.name}
                          className="w-4 h-4 rounded"
                          size="sm"
                        />
                        <span>{group.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/60 font-mono">
                          {group.proxies.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              groupedByCountry.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCountryFilter('all')}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                      selectedCountryFilter === 'all'
                        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-semibold'
                        : 'bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground border border-border/50'
                    }`}
                  >
                    <span>Todos os países</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/60 font-mono">
                      {visibleProxies.length}
                    </span>
                  </button>
                  {groupedByCountry.map((group) => {
                    const isSelected = selectedCountryFilter === group.code;
                    return (
                      <button
                        key={group.code}
                        type="button"
                        onClick={() => setSelectedCountryFilter(group.code)}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-semibold'
                            : 'bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground border border-border/50'
                        }`}
                      >
                        {group.code !== 'OTHER' ? (
                          <ReactCountryFlag countryCode={group.code} svg style={{ width: '1.2em', height: '1.2em' }} />
                        ) : (
                          <Globe className="w-3.5 h-3.5" />
                        )}
                        <span>{group.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background/60 font-mono">
                          {group.proxies.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* Se nenhum resultado na busca */}
          {visibleProxies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/20 py-12 flex flex-col items-center gap-2 text-center">
              <Search className="w-6 h-6 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">Nenhum proxy encontrado</p>
              <p className="text-xs text-muted-foreground">
                Tente ajustar o termo de pesquisa ou os filtros selecionados.
              </p>
            </div>
          ) : (
            /* Seções agrupadas (por Provedor ou por País) */
            <div className="space-y-8">
              {groupBy === 'provider'
                ? displayedProviderGroups.map((group) => (
                    <section key={group.name} className="space-y-3">
                      {/* Cabeçalho da Seção do Provedor */}
                      <div className="flex items-center justify-between pb-2 border-b border-border/70">
                        <div className="flex items-center gap-3">
                          <ProviderLogo
                            name={group.name === 'Sem Provedor' ? '' : group.name}
                            className="w-8 h-8 rounded-xl"
                            size="sm"
                          />
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white tracking-tight">
                              {group.name}
                            </h3>
                            {group.name !== 'Sem Provedor' && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                Provedor
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono font-medium px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/40">
                          {group.proxies.length} {group.proxies.length === 1 ? 'proxy' : 'proxies'}
                        </span>
                      </div>

                      {/* Grid de Cards de Proxies deste Provedor */}
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {group.proxies.map((proxy) => (
                          <ProxyCard
                            key={proxy.id}
                            proxy={proxy}
                            providerName={
                              proxy.provider_id
                                ? providerMap.get(proxy.provider_id) || proxy.provider
                                : proxy.provider
                            }
                            linkedAccount={proxyToAccount.get(proxy.id) ?? null}
                            onEdit={() => {
                              setEditingProxy(proxy);
                              setFormOpen(true);
                            }}
                            onDelete={() => setDeleteId(proxy.id)}
                            onUnlink={() => handleUnlink(proxy)}
                          />
                        ))}
                      </div>
                    </section>
                  ))
                : displayedGroups.map((group) => (
                    <section key={group.code} className="space-y-3">
                      {/* Cabeçalho da Seção do País */}
                      <div className="flex items-center justify-between pb-2 border-b border-border/70">
                        <div className="flex items-center gap-2.5">
                          {group.code !== 'OTHER' ? (
                            <div className="w-6 h-4.5 rounded overflow-hidden shadow-xs flex items-center justify-center bg-muted/40">
                              <ReactCountryFlag
                                countryCode={group.code}
                                svg
                                style={{ width: '1.25em', height: '1.25em' }}
                                title={group.name}
                              />
                            </div>
                          ) : (
                            <div className="w-6 h-4.5 rounded flex items-center justify-center bg-muted/40 text-muted-foreground">
                              <Globe className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground tracking-tight">
                              {group.name}
                            </h3>
                            {group.code !== 'OTHER' && (
                              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {group.code}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/40">
                          {group.proxies.length} {group.proxies.length === 1 ? 'proxy' : 'proxies'}
                        </span>
                      </div>

                      {/* Grid de Cards de Proxies deste país */}
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {group.proxies.map((proxy) => (
                          <ProxyCard
                            key={proxy.id}
                            proxy={proxy}
                            providerName={
                              proxy.provider_id
                                ? providerMap.get(proxy.provider_id) || proxy.provider
                                : proxy.provider
                            }
                            linkedAccount={proxyToAccount.get(proxy.id) ?? null}
                            onEdit={() => {
                              setEditingProxy(proxy);
                              setFormOpen(true);
                            }}
                            onDelete={() => setDeleteId(proxy.id)}
                            onUnlink={() => handleUnlink(proxy)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
            </div>
          )}
        </div>
      )}

      {/* Form dialog with account linking */}
      <ProxyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        proxy={editingProxy}
        organizationId={organizationId}
        platformAccounts={platformAccounts}
        currentLinkedAccount={currentEditingLinkedAccount}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
      >
        <AlertDialogContent className="bg-card border-border text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proxy?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Essa ação é irreversível. Verifique se o proxy não está vinculado a nenhuma conta antes de excluir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-input text-foreground hover:bg-accent cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || isLinking}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProxiesManager;
