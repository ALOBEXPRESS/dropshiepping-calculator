import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Sparkles,
  User,
  Phone,
  Mail,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  Globe,
  Coins,
  CheckCircle2,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type {
  PlatformAccount,
  PlatformAccountFormData,
} from '@/types/platformAccounts';
import { EditPlatformAccountDialog } from '@/components/platform-accounts/EditPlatformAccountDialog';
import { PlatformAccountStep } from '@/components/ad-accounts/PlatformAccountStep';
import { NICHES, PLATFORM_COUNTRIES } from '@/constants/niches';
import {
  formatPhoneByCountry,
  formatCentsToCurrencyString,
} from '@/utils/inputMasks';
import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';

const SkeletonCard = () => (
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
  const { data: accounts = [], isLoading, isError, refetch } = usePlatformAccounts();
  const { update, remove } = usePlatformAccountMutations();

  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [nicheFilter, setNicheFilter] = useState<string>('all');

  const [editingAccount, setEditingAccount] = useState<PlatformAccount | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlatformAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [linkedAdAccounts, setLinkedAdAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingLinked, setIsLoadingLinked] = useState(false);

  // Busca contas de anúncios vinculadas quando o modal de exclusão é aberto
  React.useEffect(() => {
    if (deleteTarget && organizationId) {
      setIsLoadingLinked(true);
      PlatformAccountsService.getLinkedAdAccounts(organizationId, deleteTarget.id)
        .then((linked) => {
          setLinkedAdAccounts(linked);
        })
        .catch((err) => {
          console.error('Erro ao verificar vínculos:', err);
          setLinkedAdAccounts([]);
        })
        .finally(() => {
          setIsLoadingLinked(false);
        });
    } else {
      setLinkedAdAccounts([]);
    }
  }, [deleteTarget, organizationId]);

  // Mapeamento de nicho label
  const nicheLabels = useMemo(() => {
    const map: Record<string, string> = {};
    NICHES.forEach((n) => {
      map[n.value] = n.label;
    });
    return map;
  }, []);

  // Filtragem
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const s = searchTerm.toLowerCase().trim();
      const meta = acc.platform_metadata;
      const email =
        acc.email ||
        (meta && 'email' in meta ? (meta.email as string | null) : null) ||
        '';

      const matchesSearch =
        !s ||
        acc.name.toLowerCase().includes(s) ||
        acc.holder_name.toLowerCase().includes(s) ||
        (acc.nickname && acc.nickname.toLowerCase().includes(s)) ||
        email.toLowerCase().includes(s) ||
        (acc.phone && acc.phone.includes(s));

      const matchesCountry = countryFilter === 'all' || acc.country === countryFilter;
      const matchesMethod =
        methodFilter === 'all' || acc.signup_method === methodFilter;
      const matchesNiche = nicheFilter === 'all' || acc.niche === nicheFilter;

      return matchesSearch && matchesCountry && matchesMethod && matchesNiche;
    });
  }, [accounts, searchTerm, countryFilter, methodFilter, nicheFilter]);

  // KPIs
  const stats = useMemo(() => {
    const total = accounts.length;
    const withEmail = accounts.filter(
      (a) => a.email || (a.platform_metadata && 'email' in a.platform_metadata)
    ).length;
    const countries = new Set(accounts.map((a) => a.country)).size;
    const googleAccounts = accounts.filter((a) => a.signup_method === 'google').length;

    return { total, withEmail, countries, googleAccounts };
  }, [accounts]);

  const handleEdit = (acc: PlatformAccount) => {
    setEditingAccount(acc);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (
    id: string,
    data: Partial<PlatformAccountFormData>
  ) => {
    await update.mutateAsync({ id, data });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await remove.mutateAsync(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: ['ad_accounts'] });
      queryClient.invalidateQueries({ queryKey: ['platform_accounts'] });
      toast.success(`Conta "${deleteTarget.name}" excluída com sucesso.`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao excluir conta de plataforma';
      if (msg.includes('foreign key') || msg.includes('ad_accounts')) {
        toast.error(
          'Esta conta está vinculada a uma Conta de Anúncios ativa. Desvincule-a antes de excluir.'
        );
      } else {
        toast.error(msg);
      }
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
      queryClient.invalidateQueries({ queryKey: ['ad_accounts'] });
      queryClient.invalidateQueries({ queryKey: ['platform_accounts'] });
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
            className="text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-brand hover:bg-brand/90 text-white text-xs font-semibold h-9 px-4 shadow-lg shadow-brand/25"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-1">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Total de Contas
          </p>
          <p className="text-2xl font-bold text-white tracking-tight">{stats.total}</p>
          <p className="text-[11px] text-zinc-500">Perfis cadastrados no sistema</p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-1">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Método Google
          </p>
          <p className="text-2xl font-bold text-blue-400 tracking-tight">
            {stats.googleAccounts}
          </p>
          <p className="text-[11px] text-zinc-500">Contas com histórico Google Ads</p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-1">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            E-mails Verificados
          </p>
          <p className="text-2xl font-bold text-emerald-400 tracking-tight">
            {stats.withEmail}
          </p>
          <p className="text-[11px] text-zinc-500">Com contato direto associado</p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-1">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Países Ativos
          </p>
          <p className="text-2xl font-bold text-amber-400 tracking-tight">
            {stats.countries}
          </p>
          <p className="text-[11px] text-zinc-500">Territórios de operação</p>
        </div>
      </div>

      {/* ── Filtros e Busca ── */}
      <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Buscar por nome, apelido, titular, e-mail ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-zinc-950 border-zinc-800 text-xs h-10 text-white placeholder:text-zinc-500 w-full"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 text-xs text-zinc-300 w-[130px]">
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
            <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 text-xs text-zinc-300 w-[140px]">
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
            <SelectTrigger className="bg-zinc-950 border-zinc-800 h-10 text-xs text-zinc-300 w-[160px]">
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
            {searchTerm || countryFilter !== 'all' || methodFilter !== 'all'
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
          {filteredAccounts.map((account) => {
            const meta = account.platform_metadata;
            const displayEmail =
              account.email ||
              (meta && 'email' in meta ? (meta.email as string | null) : null);

            const isGoogle = account.signup_method === 'google';
            const googleMeta = isGoogle && meta?.signup_method === 'google' ? meta : null;

            return (
              <div
                key={account.id}
                className="group relative rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/70 to-zinc-950 p-5 space-y-4 shadow-lg hover:border-zinc-700 transition-all hover:shadow-xl"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 flex-shrink-0 flex items-center justify-center">
                      {account.profile_photo_url ? (
                        <img
                          src={account.profile_photo_url}
                          alt={account.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-zinc-400" />
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-zinc-900 rounded-full p-0.5 border border-zinc-700 shadow-sm">
                        <ReactCountryFlag countryCode={account.country} svg className="text-xs" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-brand transition-colors">
                        {account.name}
                      </h4>
                      <p className="text-xs text-zinc-400 truncate font-mono">
                        {account.nickname ? `@${account.nickname}` : 'Sem apelido'}
                      </p>
                    </div>
                  </div>

                  {/* Dropdown de Ações */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg flex-shrink-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                      <DropdownMenuItem
                        onClick={() => handleEdit(account)}
                        className="text-xs gap-2 cursor-pointer hover:bg-zinc-800"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-zinc-300" />
                        Editar Conta
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(account)}
                        className="text-xs gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir Conta
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="h-px bg-zinc-800/60" />

                {/* Dados da Conta */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Titular:</span>
                    <span className="font-semibold text-zinc-200 truncate max-w-[170px]">
                      {account.holder_name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Nicho:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {nicheLabels[account.niche] || account.niche}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Método de Cadastro:</span>
                    <span className="capitalize font-semibold text-zinc-300 flex items-center gap-1.5">
                      {account.signup_method === 'google' && (
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                      )}
                      {account.signup_method === 'apple' && (
                        <span className="w-2 h-2 rounded-full bg-zinc-300" />
                      )}
                      {account.signup_method === 'email' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                      {account.signup_method}
                    </span>
                  </div>

                  {displayEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-zinc-500" /> E-mail:
                      </span>
                      <span className="font-mono text-zinc-300 truncate max-w-[170px]">
                        {displayEmail}
                      </span>
                    </div>
                  )}

                  {account.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-500" /> Telefone:
                      </span>
                      <span className="font-mono text-zinc-300">
                        {formatPhoneByCountry(account.phone, account.country)}
                      </span>
                    </div>
                  )}

                  {/* Informações adicionais Google Ads */}
                  {googleMeta && (
                    <div className="mt-2.5 p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-blue-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Idade da Conta:
                        </span>
                        <span className="font-bold text-white">
                          {googleMeta.account_age_years != null
                            ? `${googleMeta.account_age_years} anos`
                            : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-blue-300 flex items-center gap-1">
                          <Coins className="w-3 h-3" /> Investido Google Ads:
                        </span>
                        <span className="font-bold text-amber-400 font-mono">
                          {googleMeta.google_ads_invested_brl != null
                            ? `${googleMeta.google_ads_currency || 'BRL'} ${formatCentsToCurrencyString(
                                Math.round(googleMeta.google_ads_invested_brl * 100),
                                googleMeta.google_ads_currency || 'BRL'
                              )}`
                            : '—'}
                        </span>
                      </div>
                    </div>
                  )}

                  {account.bio && (
                    <p className="text-[11px] text-zinc-400 line-clamp-2 italic pt-1 border-t border-zinc-800/40">
                      "{account.bio}"
                    </p>
                  )}
                </div>

                {/* Footer do Card com Botão de Ação Direta */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500">
                    Criado em {new Date(account.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(account)}
                    className="h-7 text-xs border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:text-white hover:bg-zinc-800 px-3"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            );
          })}
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
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800/80 bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/25 flex items-center justify-center p-2">
                <img src={tiktokImg} alt="TikTok" className="w-full h-full object-contain" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  Cadastrar Conta de Plataforma
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Crie o perfil TikTok ou Google para associação às suas contas de anúncios.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <PlatformAccountStep
              platform="tiktok"
              selectedAccount={null}
              defaultMode="create"
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
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting || isLoadingLinked}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlatformAccountsPage;
