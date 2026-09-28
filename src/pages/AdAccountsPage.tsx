import React, { useState } from 'react';
import { Plus, Search, Layers, RefreshCw } from 'lucide-react';
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useSettings } from '@/contexts/SettingsContext';
import { useAdAccounts } from '@/hooks/useAdAccounts';
import { AdAccountCard } from '@/components/ad-accounts/AdAccountCard';
import { AdAccountSummaryCards } from '@/components/ad-accounts/AdAccountSummaryCards';
import { AdAccountFormDialog } from '@/components/ad-accounts/AdAccountFormDialog';
import type {
  AdAccountWithStats,
  AdAccountStatus,
  AdAccountPlatform,
  AdAccountFormData,
} from '@/types/adAccounts';

const SkeletonCard = () => (
  <div className="rounded-xl border border-border bg-card/40 p-5 animate-pulse space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-background" />
        <div className="space-y-1.5">
          <div className="h-4 bg-background rounded w-32" />
          <div className="h-3 bg-background rounded w-20" />
        </div>
      </div>
      <div className="h-5 bg-background rounded w-16" />
    </div>
    <div className="h-px bg-border/40" />
    <div className="grid grid-cols-2 gap-3">
      <div className="h-4 bg-background rounded w-20" />
      <div className="h-4 bg-background rounded w-20 ml-auto" />
    </div>
  </div>
);

export const AdAccountsPage: React.FC = () => {
  const { organizationId } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdAccountStatus | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<AdAccountPlatform | 'all'>('all');

  const {
    accounts,
    isLoading,
    isError,
    refetch,
    createAccount,
    updateAccount,
    updateStatus,
    deleteAccount,
  } = useAdAccounts(organizationId, {
    search: searchTerm,
    status: statusFilter,
    platform: platformFilter,
  });

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdAccountWithStats | null>(null);

  const [deleteAccountTarget, setDeleteAccountTarget] = useState<AdAccountWithStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleNewAccount = () => {
    setEditingAccount(null);
    setFormDialogOpen(true);
  };

  const handleEditAccount = (acc: AdAccountWithStats) => {
    setEditingAccount(acc);
    setFormDialogOpen(true);
  };

  const handleFormSubmit = async (data: AdAccountFormData) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, data);
    } else {
      await createAccount(data);
    }
  };

  const handleStatusChange = async (id: string, newStatus: AdAccountStatus) => {
    try {
      await updateStatus(id, newStatus);
      toast.success('Status da conta atualizado com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar status';
      toast.error(msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAccountTarget) return;
    setIsDeleting(true);
    try {
      await deleteAccount(deleteAccountTarget.id);
      toast.success('Conta de anúncios excluída com sucesso.');
      setDeleteAccountTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir conta de anúncios';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-foreground">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span>Painel</span>
            <span>/</span>
            <span className="text-foreground font-medium">Contas de Anúncios</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Contas de Anúncios
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie suas contas TikTok Ads e vincule suas campanhas com total controle
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9 gap-1.5 border-border text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          <Button
            onClick={handleNewAccount}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2 h-9 text-xs shadow-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <AdAccountSummaryCards accounts={accounts} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/60 border border-border p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, ID do anunciante ou Business Center..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/60 border-input text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-36 bg-background/60 border-input text-xs h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-input">
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="paused">Pausada</SelectItem>
              <SelectItem value="disabled">Desativada</SelectItem>
              <SelectItem value="archived">Arquivada</SelectItem>
            </SelectContent>
          </Select>

          {/* Platform Filter */}
          <Select
            value={platformFilter}
            onValueChange={(v) => setPlatformFilter(v as typeof platformFilter)}
          >
            <SelectTrigger className="w-36 bg-background/60 border-input text-xs h-9">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent className="bg-card border-input">
              <SelectItem value="all">Todas Plataformas</SelectItem>
              <SelectItem value="tiktok">TikTok Ads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="text-center py-12 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm">
          Erro ao carregar contas de anúncios. Verifique sua conexão e tente recarregar.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && accounts.length === 0 && (
        <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-border bg-card/30 flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
            <Layers className="w-7 h-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Nenhuma conta de anúncios encontrada
            </h3>
            <p className="text-xs text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || platformFilter !== 'all'
                ? 'Nenhum resultado corresponde aos filtros aplicados.'
                : 'Cadastre sua primeira conta de anúncios do TikTok para organizar e mensurar seus investimentos.'}
            </p>
          </div>
          <Button
            onClick={handleNewAccount}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2 h-9 text-xs"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeira Conta
          </Button>
        </div>
      )}

      {/* Accounts Grid */}
      {!isLoading && !isError && accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <AdAccountCard
              key={acc.id}
              account={acc}
              onEdit={handleEditAccount}
              onStatusChange={handleStatusChange}
              onDelete={(target) => setDeleteAccountTarget(target)}
            />
          ))}
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <AdAccountFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        account={editingAccount}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!deleteAccountTarget}
        onOpenChange={(open) => !open && setDeleteAccountTarget(null)}
      >
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir conta de anúncios?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs leading-relaxed">
              Você está prestes a excluir a conta{' '}
              <strong className="text-foreground">{deleteAccountTarget?.name}</strong>. Esta ação é
              irreversível.
              {deleteAccountTarget && deleteAccountTarget.campaign_count > 0 && (
                <span className="block mt-2 text-rose-400 font-medium">
                  Atenção: Esta conta possui {deleteAccountTarget.campaign_count} campanha(s) vinculada(s).
                  A exclusão será bloqueada pelo sistema até que as campanhas sejam realocadas ou excluídas.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-border text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdAccountsPage;
