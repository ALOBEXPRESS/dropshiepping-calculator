import React, { useState, useMemo, useEffect } from 'react';
import {
  Compass,
  Plus,
  Loader2,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBrowserProfiles } from '@/hooks/useBrowserProfiles';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import { useProxies } from '@/hooks/useProxies';
import { useDebounce } from '@/hooks/useDebounce';
import type {
  BrowserProfile,
  BrowserProfileStatus,
} from '@/types/browserProfiles';
import { BrowserProfileCard } from './BrowserProfileCard';
import { BrowserProfileFormDialog } from './BrowserProfileFormDialog';
import { filterBrowserProfiles } from './browserProfilesUtils';

export interface BrowserProfilesManagerProps {
  organizationId: string;
}

export const BrowserProfilesManager: React.FC<BrowserProfilesManagerProps> = ({
  organizationId,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const accountFilterParam = searchParams.get('account') || 'all';
  const newForParam = searchParams.get('newFor');

  const {
    profiles,
    isLoading,
    deleteProfile,
    updateProfile,
    isDeleting,
  } = useBrowserProfiles(organizationId);

  const { data: platformAccounts = [] } = usePlatformAccounts();
  const { proxies } = useProxies(organizationId);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [accountFilter, setAccountFilter] = useState<string>(accountFilterParam);
  const [formOpen, setFormOpen] = useState(!!newForParam);
  const [editingProfile, setEditingProfile] = useState<BrowserProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BrowserProfile | null>(null);

  const accountMap = useMemo(
    () => new Map(platformAccounts.map((a) => [a.id, a])),
    [platformAccounts]
  );
  const proxyMap = useMemo(
    () => new Map(proxies.map((p) => [p.id, p])),
    [proxies]
  );

  // Sincroniza filtro se URL mudar
  useEffect(() => {
    if (accountFilterParam) {
      setAccountFilter(accountFilterParam);
    }
    if (newForParam) {
      setFormOpen(true);
    }
  }, [accountFilterParam, newForParam]);

  const filteredProfiles = useMemo(() => {
    return filterBrowserProfiles(profiles, debouncedSearch, statusFilter, accountFilter);
  }, [profiles, debouncedSearch, statusFilter, accountFilter]);

  const activeCount = useMemo(
    () => profiles.filter((p) => p.status === 'active').length,
    [profiles]
  );

  const withProxyCount = useMemo(() => {
    return profiles.filter((p) => {
      const acc = accountMap.get(p.platform_account_id);
      return !!acc?.proxy_id;
    }).length;
  }, [profiles, accountMap]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProfile(deleteTarget.id);
      toast.success('Perfil de navegador excluído com sucesso.');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao excluir perfil.'
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggleStatus = async (profile: BrowserProfile) => {
    const newStatus: BrowserProfileStatus =
      profile.status === 'active' ? 'archived' : 'active';
    try {
      await updateProfile(profile.id, { status: newStatus });
      toast.success(
        newStatus === 'active' ? 'Perfil reativado!' : 'Perfil arquivado!'
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao alterar status.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-cyan-400" />
            Perfis de Navegador
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie perfis anti-detect (AdsPower) com isolamento de sessão e proxies derivados das contas
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProfile(null);
            setFormOpen(true);
          }}
          className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2 h-10 text-xs shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Perfil AdsPower
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Total de Perfis</p>
          <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Perfis Ativos</p>
          <p className="text-2xl font-bold text-cyan-400">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Com Proxy Derivado</p>
          <p className="text-2xl font-bold text-orange-400">{withProxyCount}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Ferramenta Suportada</p>
          <p className="text-2xl font-bold text-foreground">AdsPower</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, serial ou notas..."
            className="pl-9 bg-background border-input text-xs h-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v: 'all' | 'active' | 'archived') => setStatusFilter(v)}
        >
          <SelectTrigger className="w-[140px] bg-background border-input text-xs h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-input">
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="archived">Arquivados</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={accountFilter}
          onValueChange={(v) => {
            setAccountFilter(v);
            if (v === 'all') {
              searchParams.delete('account');
            } else {
              searchParams.set('account', v);
            }
            setSearchParams(searchParams);
          }}
        >
          <SelectTrigger className="w-[180px] bg-background border-input text-xs h-9">
            <SelectValue placeholder="Conta vinculada" />
          </SelectTrigger>
          <SelectContent className="bg-card border-input max-h-56">
            <SelectItem value="all">Todas as Contas</SelectItem>
            {platformAccounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name} ({acc.country})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/20 py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
            <Compass className="w-7 h-7 text-cyan-400/60" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {search || accountFilter !== 'all' || statusFilter !== 'all'
                ? 'Nenhum perfil corresponde aos filtros'
                : 'Nenhum perfil de navegador cadastrado'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {search || accountFilter !== 'all' || statusFilter !== 'all'
                ? 'Tente alterar os filtros ou limpar a pesquisa.'
                : 'Cadastre seus perfis do AdsPower associando-os às contas de plataforma para manter as sessões e proxies organizados.'}
            </p>
          </div>
          {!search && accountFilter === 'all' && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingProfile(null);
                setFormOpen(true);
              }}
              className="gap-2 mt-1 text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Criar primeiro perfil
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProfiles.map((p) => {
            const acc = accountMap.get(p.platform_account_id);
            const proxy = acc?.proxy_id ? proxyMap.get(acc.proxy_id) : null;
            const proxyLabel = proxy ? `${proxy.label} (${proxy.host}:${proxy.port})` : null;

            return (
              <BrowserProfileCard
                key={p.id}
                profile={p}
                account={acc ?? null}
                proxyLabel={proxyLabel}
                onEdit={() => {
                  setEditingProfile(p);
                  setFormOpen(true);
                }}
                onDelete={() => setDeleteTarget(p)}
                onToggleStatus={() => handleToggleStatus(p)}
              />
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <BrowserProfileFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o && newForParam) {
            searchParams.delete('newFor');
            setSearchParams(searchParams);
          }
        }}
        profile={editingProfile}
        organizationId={organizationId}
        platformAccounts={platformAccounts}
        defaultAccountId={newForParam || (accountFilter !== 'all' ? accountFilter : null)}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Excluir Perfil de Navegador?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs">
              Tem certeza que deseja excluir o perfil{' '}
              <strong className="text-foreground">
                {deleteTarget?.name || deleteTarget?.external_profile_id || 'selecionado'}
              </strong>
              ? O registro do perfil será removido, mas a conta de plataforma e o proxy permanecerão intactos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-input text-foreground hover:bg-accent text-xs cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white text-xs cursor-pointer"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BrowserProfilesManager;
