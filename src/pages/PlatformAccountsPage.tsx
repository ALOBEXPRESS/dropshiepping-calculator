import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  User,
  Trash2,
  AlertTriangle,
  Unlink,
  Loader2,
} from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { useQueryClient } from '@tanstack/react-query';
import { useSettings } from '@/contexts/SettingsContext';
import { useUser } from '@/contexts/UserContext';
import { PlatformAccountsService } from '@/services/platformAccountsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  usePlatformAccounts,
  usePlatformAccountMutations,
} from '@/hooks/usePlatformAccounts';
import { useProxies } from '@/hooks/useProxies';
import { useBrowserProfiles } from '@/hooks/useBrowserProfiles';
import { useDebounce } from '@/hooks/useDebounce';
import type {
  PlatformAccount,
  PlatformAccountFormData,
} from '@/types/platformAccounts';
import { EditPlatformAccountDialog } from '@/components/platform-accounts/EditPlatformAccountDialog';
import { PlatformAccountStep } from '@/components/ad-accounts/PlatformAccountStep';
import { NICHES, PLATFORM_COUNTRIES } from '@/constants/niches';
import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';
import {
  TikTokLogo,
  GoogleLogo,
  InstagramLogo,
  FacebookLogo,
  ThreadsLogo,
} from '@/components/ui/PlatformLogos';
import {
  PlatformAccountCard,
  type LinkedBrowserProfile,
} from '@/components/platform-accounts/PlatformAccountCard';
import {
  PlatformAccountSummaryCards,
  type PlatformAccountStats,
} from '@/components/platform-accounts/PlatformAccountSummaryCards';
import {
  PlatformAccountSocialTabs,
  type SocialCounts,
} from '@/components/platform-accounts/PlatformAccountSocialTabs';
import {
  getAccountSocialKey,
  matchesSocialFilter,
  matchesSearchTerm,
  getAccountDisplayEmail,
} from '@/components/platform-accounts/platformAccountUtils';

const SkeletonCard: React.FC = () => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 animate-pulse space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-zinc-800" />
      <div className="space-y-1.5 flex-1">
        <div className="h-4 bg-zinc-800 rounded w-28" />
        <div className="h-3 bg-zinc-800 rounded w-20" />
      </div>
    </div>
    <div className="h-px bg-zinc-800/60" />
    <div className="space-y-2">
      <div className="h-3 bg-zinc-800 rounded w-3/4" />
      <div className="h-3 bg-zinc-800 rounded w-1/2" />
    </div>
  </div>
);

export const PlatformAccountsPage: React.FC = () => {
  const { organizationId } = useSettings();
  const { userId } = useUser();
  const queryClient = useQueryClient();

  // Queries & Mutations
  const { data: accounts = [], isLoading, isError, refetch } = usePlatformAccounts();
  const { update, remove } = usePlatformAccountMutations();
  const { proxies = [] } = useProxies(organizationId ?? '');
  const { profiles: browserProfiles = [] } = useBrowserProfiles(organizationId ?? '');

  // Estado de busca & filtros
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [socialFilter, setSocialFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [nicheFilter, setNicheFilter] = useState<string>('all');

  // Modais
  const [editingAccount, setEditingAccount] = useState<PlatformAccount | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createPlatformKey, setCreatePlatformKey] = useState<
    'tiktok' | 'instagram' | 'facebook' | 'threads' | 'google'
  >('tiktok');

  // Exclusão com verificação de vínculos
  const [deleteTarget, setDeleteTarget] = useState<PlatformAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkedAdAccounts, setLinkedAdAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingLinked, setIsLoadingLinked] = useState(false);

  // Mapeamentos indexados (Map) para alta performance de lookup
  const proxyMap = useMemo(() => {
    return new Map(proxies.map((p) => [p.id, p.label]));
  }, [proxies]);

  const profilesByAccount = useMemo(() => {
    const map = new Map<string, LinkedBrowserProfile[]>();
    for (const p of browserProfiles) {
      if (!p.platform_account_id) continue;
      if (!map.has(p.platform_account_id)) {
        map.set(p.platform_account_id, []);
      }
      map.get(p.platform_account_id)!.push({
        id: p.id,
        name: p.name,
        external_profile_id: p.external_profile_id,
      });
    }
    return map;
  }, [browserProfiles]);

  const nicheLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const n of NICHES) {
      map[n.value] = n.label;
    }
    return map;
  }, []);

  // Contagem por rede social
  const socialCounts: SocialCounts = useMemo(() => {
    const counts: SocialCounts = {
      all: accounts.length,
      tiktok: 0,
      instagram: 0,
      facebook: 0,
      threads: 0,
      google: 0,
    };
    for (const a of accounts) {
      const key = getAccountSocialKey(a);
      counts[key]++;
    }
    return counts;
  }, [accounts]);

  // Estatísticas / KPIs (calculados sobre o repositório total da organização)
  const stats: PlatformAccountStats = useMemo(() => {
    const total = accounts.length;
    const withEmail = accounts.filter((a) => Boolean(getAccountDisplayEmail(a))).length;
    const countries = new Set(accounts.map((a) => a.country)).size;
    const googleAccounts = accounts.filter((a) => a.signup_method === 'google').length;

    return { total, withEmail, countries, googleAccounts };
  }, [accounts]);

  // Lista filtrada
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (!matchesSearchTerm(acc, debouncedSearchTerm)) return false;
      if (!matchesSocialFilter(acc, socialFilter)) return false;
      if (countryFilter !== 'all' && acc.country !== countryFilter) return false;
      if (methodFilter !== 'all' && acc.signup_method !== methodFilter) return false;
      if (nicheFilter !== 'all' && acc.niche !== nicheFilter) return false;

      return true;
    });
  }, [accounts, debouncedSearchTerm, socialFilter, countryFilter, methodFilter, nicheFilter]);

  // Busca contas de anúncios vinculadas ao selecionar alvo de exclusão
  useEffect(() => {
    if (deleteTarget && organizationId) {
      setIsLoadingLinked(true);
      PlatformAccountsService.getLinkedAdAccounts(organizationId, deleteTarget.id)
        .then((linked) => {
          setLinkedAdAccounts(linked);
        })
        .catch((err) => {
          console.error('[PlatformAccountsPage] Erro ao verificar vínculos:', err);
          setLinkedAdAccounts([]);
        })
        .finally(() => {
          setIsLoadingLinked(false);
        });
    } else {
      setLinkedAdAccounts([]);
      setIsLoadingLinked(false);
    }
  }, [deleteTarget, organizationId]);

  // Handlers
  const handleEdit = useCallback((acc: PlatformAccount) => {
    setEditingAccount(acc);
    setIsEditOpen(true);
  }, []);

  const handleOpenDelete = useCallback((acc: PlatformAccount) => {
    setDeleteTarget(acc);
  }, []);

  const handleSaveEdit = async (
    id: string,
    data: Partial<PlatformAccountFormData>
  ) => {
    await update.mutateAsync({ id, data });
  };

  const invalidateAssociatedQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['ad_accounts'] });
    queryClient.invalidateQueries({ queryKey: ['platform_accounts'] });
    queryClient.invalidateQueries({ queryKey: ['browser_profiles'] });
  }, [queryClient]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await remove.mutateAsync(deleteTarget.id);
      invalidateAssociatedQueries();
      toast.success(`Conta "${deleteTarget.name}" excluída com sucesso.`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao excluir conta de plataforma';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAndUnlink = async () => {
    if (!deleteTarget || !organizationId) return;
    setIsDeleting(true);
    try {
      const { unlinkedCount } = await PlatformAccountsService.deleteAndUnlink(
        organizationId,
        deleteTarget.id
      );
      invalidateAssociatedQueries();
      toast.success(
        `Conta "${deleteTarget.name}" desvinculada de ${unlinkedCount} conta(s) e excluída com sucesso!`
      );
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao desvincular e excluir conta';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-7 p-6 max-w-7xl mx-auto">
      {/* ── Top Bar / Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <span>Painel</span>
            <span>/</span>
            <span className="text-zinc-200">Contas</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center p-1.5 shadow-[0_0_12px_rgba(254,44,85,0.2)]">
              <img src={tiktokImg} alt="TikTok" className="w-full h-full object-contain" />
            </span>
            Contas de Plataforma
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Gerencie os perfis de plataforma (TikTok, Google) e seus dados de titularidade para associação às contas de anúncios.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            aria-label="Atualizar lista de contas"
            className="text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            aria-label="Cadastrar nova conta"
            className="bg-brand hover:bg-brand/90 text-white text-xs font-semibold h-9 px-4 shadow-lg shadow-brand/25"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <PlatformAccountSummaryCards stats={stats} />

      {/* ── Categorização por Rede Social ── */}
      <PlatformAccountSocialTabs
        selectedTab={socialFilter}
        onSelectTab={setSocialFilter}
        counts={socialCounts}
      />

      {/* ── Filtros e Busca ── */}
      <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Buscar por nome, apelido, titular, e-mail ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar por nome, apelido, titular, e-mail ou telefone"
            className="pl-9 bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-500 w-full"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <Select value={socialFilter} onValueChange={setSocialFilter}>
            <SelectTrigger
              aria-label="Filtrar por rede social"
              className="bg-zinc-950 border-zinc-800 h-10 text-xs text-zinc-300 w-[140px]"
            >
              <SelectValue placeholder="Rede Social" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              <SelectItem value="all">Todas as Redes</SelectItem>
              <SelectItem value="tiktok">
                <div className="flex items-center gap-1.5">
                  <TikTokLogo className="w-3.5 h-3.5" />
                  <span>TikTok ({socialCounts.tiktok})</span>
                </div>
              </SelectItem>
              <SelectItem value="instagram">
                <div className="flex items-center gap-1.5">
                  <InstagramLogo className="w-3.5 h-3.5" />
                  <span>Instagram ({socialCounts.instagram})</span>
                </div>
              </SelectItem>
              <SelectItem value="facebook">
                <div className="flex items-center gap-1.5">
                  <FacebookLogo className="w-3.5 h-3.5" />
                  <span>Facebook ({socialCounts.facebook})</span>
                </div>
              </SelectItem>
              <SelectItem value="threads">
                <div className="flex items-center gap-1.5">
                  <ThreadsLogo className="w-3.5 h-3.5" />
                  <span>Threads ({socialCounts.threads})</span>
                </div>
              </SelectItem>
              <SelectItem value="google">
                <div className="flex items-center gap-1.5">
                  <GoogleLogo className="w-3.5 h-3.5" />
                  <span>Google ({socialCounts.google})</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger
              aria-label="Filtrar por país"
              className="bg-zinc-950 border-zinc-800 h-10 text-xs text-zinc-300 w-[130px]"
            >
              <SelectValue placeholder="País" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              <SelectItem value="all">Todos os Países</SelectItem>
              {PLATFORM_COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <div className="flex items-center gap-1.5">
                    <ReactCountryFlag countryCode={c.code} svg className="text-xs" />
                    <span>{c.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger
              aria-label="Filtrar por método de cadastro"
              className="bg-zinc-950 border-zinc-800 h-10 text-xs text-zinc-300 w-[135px]"
            >
              <SelectValue placeholder="Método" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              <SelectItem value="all">Todos os Métodos</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
            </SelectContent>
          </Select>

          <Select value={nicheFilter} onValueChange={setNicheFilter}>
            <SelectTrigger
              aria-label="Filtrar por nicho"
              className="bg-zinc-950 border-zinc-800 h-10 text-xs text-zinc-300 w-[155px]"
            >
              <SelectValue placeholder="Nicho" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-56">
              <SelectItem value="all">Todos os Nichos</SelectItem>
              {NICHES.map((n) => (
                <SelectItem key={n.value} value={n.value}>
                  {n.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Grid de Cards de Contas ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        <div className="p-8 text-center rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-300">
          <p className="text-sm font-semibold">Erro ao carregar contas de plataforma.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-3 text-xs border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
          >
            Tentar novamente
          </Button>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-zinc-800/80 bg-zinc-900/30 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-400">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Nenhuma conta encontrada</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {searchTerm || socialFilter !== 'all' || countryFilter !== 'all' || methodFilter !== 'all' || nicheFilter !== 'all'
              ? 'Nenhum resultado corresponde aos filtros aplicados.'
              : 'Você ainda não cadastrou nenhuma conta de plataforma. Crie a primeira para vinculá-la aos anúncios.'}
          </p>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-brand hover:bg-brand/90 text-white text-xs mt-2"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Cadastrar Conta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((account) => (
            <PlatformAccountCard
              key={account.id}
              account={account}
              proxyLabel={account.proxy_id ? proxyMap.get(account.proxy_id) : null}
              browserProfiles={profilesByAccount.get(account.id) ?? []}
              nicheLabel={nicheLabels[account.niche] || account.niche}
              onEdit={handleEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* ── Modal de Edição ── */}
      <EditPlatformAccountDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        account={editingAccount}
        onSave={handleSaveEdit}
      />

      {/* ── Modal de Criação de Nova Conta ── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-zinc-950 border-zinc-800 text-foreground shadow-2xl rounded-2xl">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-zinc-800/80 bg-zinc-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center p-2 shadow-inner">
                  {createPlatformKey === 'tiktok' && (
                    <img src={tiktokImg} alt="TikTok" className="w-full h-full object-contain" />
                  )}
                  {createPlatformKey === 'instagram' && <InstagramLogo className="w-6 h-6" />}
                  {createPlatformKey === 'facebook' && <FacebookLogo className="w-6 h-6" />}
                  {createPlatformKey === 'threads' && <ThreadsLogo className="w-6 h-6" />}
                  {createPlatformKey === 'google' && <GoogleLogo className="w-6 h-6" />}
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">
                    Cadastrar Perfil {createPlatformKey === 'tiktok'
                      ? 'TikTok'
                      : createPlatformKey === 'instagram'
                      ? 'Instagram'
                      : createPlatformKey === 'facebook'
                      ? 'Facebook'
                      : createPlatformKey === 'threads'
                      ? 'Threads'
                      : 'Google Ads'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-400">
                    Crie a conta de plataforma para associação às suas operações de tráfego.
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Seletor de Plataforma no Wizard de Criação */}
            <div className="grid grid-cols-5 gap-2 pt-1">
              {[
                { key: 'tiktok' as const, name: 'TikTok', Logo: TikTokLogo, activeClass: 'border-cyan-500 bg-cyan-500/15 text-cyan-300' },
                { key: 'instagram' as const, name: 'Instagram', Logo: InstagramLogo, activeClass: 'border-pink-500 bg-pink-500/15 text-pink-300' },
                { key: 'facebook' as const, name: 'Facebook', Logo: FacebookLogo, activeClass: 'border-blue-500 bg-blue-500/15 text-blue-300' },
                { key: 'threads' as const, name: 'Threads', Logo: ThreadsLogo, activeClass: 'border-zinc-400 bg-zinc-800 text-white' },
                { key: 'google' as const, name: 'Google', Logo: GoogleLogo, activeClass: 'border-amber-500 bg-amber-500/15 text-amber-300' },
              ].map((item) => {
                const isSelected = createPlatformKey === item.key;
                const ItemLogo = item.Logo;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCreatePlatformKey(item.key)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? `${item.activeClass} shadow-xs ring-1 ring-white/10`
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <ItemLogo className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <PlatformAccountStep
              key={createPlatformKey}
              platform={
                createPlatformKey === 'tiktok'
                  ? 'tiktok'
                  : createPlatformKey === 'google'
                  ? 'google'
                  : 'meta'
              }
              metaAccountType={
                createPlatformKey === 'instagram'
                  ? 'instagram'
                  : createPlatformKey === 'facebook'
                  ? 'facebook'
                  : createPlatformKey === 'threads'
                  ? 'threads'
                  : null
              }
              selectedAccount={null}
              defaultMode="create"
              hideSelectExisting
              organizationId={organizationId!}
              userId={userId}
              onAccountSelected={(newAccount) => {
                if (newAccount) {
                  setCreateDialogOpen(false);
                  refetch();
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Confirmação de Exclusão ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => !isDeleting && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              Excluir conta "{deleteTarget?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-400">
              Esta ação removerá o perfil da plataforma do seu sistema de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {isLoadingLinked ? (
            <div className="flex items-center justify-center py-4 gap-2 text-xs text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
              <span>Verificando contas de anúncios vinculadas...</span>
            </div>
          ) : linkedAdAccounts.length > 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-amber-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Vinculada a {linkedAdAccounts.length} conta(s) de anúncios:
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-zinc-200 pl-1 font-mono text-[11px] max-h-28 overflow-y-auto">
                {linkedAdAccounts.map((acc) => (
                  <li key={acc.id} className="truncate">
                    {acc.name}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Você pode desvincular automaticamente todas essas contas de anúncios e concluir a exclusão com um clique abaixo.
              </p>
            </div>
          ) : null}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Cancelar
            </AlertDialogCancel>

            {linkedAdAccounts.length > 0 ? (
              <Button
                type="button"
                onClick={handleDeleteAndUnlink}
                disabled={isDeleting || isLoadingLinked}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold gap-1.5 h-9"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Desvinculando e excluindo...
                  </>
                ) : (
                  <>
                    <Unlink className="w-3.5 h-3.5" />
                    Desvincular e Excluir
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isLoadingLinked}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold h-9"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Excluindo...
                  </>
                ) : (
                  'Confirmar Exclusão'
                )}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlatformAccountsPage;
