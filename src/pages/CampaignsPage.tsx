import React, { useState, useMemo, useEffect } from 'react';
import { Megaphone, Plus, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useSearchParams } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useAdAccounts } from '@/hooks/useAdAccounts';
import type { AdAccountWithStats, AdAccountFormData } from '@/types/adAccounts';
import { AdAccountFormDialog } from '@/components/ad-accounts/AdAccountFormDialog';
import { CampaignFormDialog } from '@/components/campaigns/CampaignFormDialog';
import { MarketplacePickerModal } from '@/components/campaigns/MarketplacePickerModal';
import { AdAccountPickerModal } from '@/components/campaigns/AdAccountPickerModal';
import { CampaignCard } from '@/components/campaigns/CampaignCard';
import { AccountGroupSection } from '@/components/campaigns/AccountGroupSection';
import { ObjectiveGroupSection } from '@/components/campaigns/ObjectiveGroupSection';
import {
  formatBRL,
  calculateTotalMarketingCost,
  calculateTotalBudget,
  getUniqueAdAccountsCount,
  filterAndSortCampaigns,
  groupCampaignsByAccount,
  groupCampaignsByObjective,
  type SortKey,
} from '@/components/campaigns/campaignsUtils';
import type {
  CampaignWithRelations,
  CampaignStatus,
  CampaignMarketplace,
} from '@/types/campaigns';

import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';
import mercadolivreImg from '@/imgs/mercadolivre.svg';
import amazonImg from '@/imgs/amazon.jpg';
import sheinImg from '@/imgs/shein.svg';

const MARKETPLACE_LOGOS: Record<string, string> = {
  tiktok: tiktokImg,
  mercadolivre: mercadolivreImg,
  amazon: amazonImg,
  shein: sheinImg,
};

const STATUS_CONFIG: Record<CampaignStatus, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  paused: { label: 'Pausado', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  ended: { label: 'Encerrado', className: 'bg-muted text-muted-foreground border-border' },
};

const SkeletonCard: React.FC = () => (
  <div className="rounded-xl border border-border bg-card/40 p-5 animate-pulse space-y-3">
    <div className="h-4 bg-background rounded w-2/3" />
    <div className="h-3 bg-background rounded w-1/2" />
    <div className="h-3 bg-background rounded w-1/3" />
  </div>
);

const CampaignsPage: React.FC = () => {
  const { organizationId } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAccountId = searchParams.get('conta') ?? 'all';
  const shouldOpenNew = searchParams.get('nova') === 'true';

  const { adAccounts, createAccount } = useAdAccounts(organizationId ?? '');
  const { campaigns, isLoading, isError, deleteCampaign, refetch } = useCampaigns(
    organizationId ?? '',
    selectedAccountId
  );

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date_desc');
  const [groupBy, setGroupBy] = useState<'ad_account' | 'objective'>('ad_account');

  // Modals & Actions
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithRelations | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Creation flow states
  const [marketplacePickerOpen, setMarketplacePickerOpen] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<CampaignMarketplace>('tiktok');
  const [adAccountPickerOpen, setAdAccountPickerOpen] = useState(false);
  const [selectedNewCampaignAdAccountId, setSelectedNewCampaignAdAccountId] = useState<string | undefined>(undefined);
  const [newAccountModalOpen, setNewAccountModalOpen] = useState(false);

  // Deep-link handling: ?nova=true
  useEffect(() => {
    if (shouldOpenNew) {
      setMarketplacePickerOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('nova');
      setSearchParams(next, { replace: true });
    }
  }, [shouldOpenNew, searchParams, setSearchParams]);

  const handleAccountChange = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val === 'all') {
      next.delete('conta');
    } else {
      next.set('conta', val);
    }
    setSearchParams(next);
  };

  const handleNew = () => {
    setSelectedNewCampaignAdAccountId(undefined);
    setMarketplacePickerOpen(true);
  };

  const handleMarketplaceSelect = (mp: CampaignMarketplace) => {
    setSelectedMarketplace(mp);
    setMarketplacePickerOpen(false);
    setAdAccountPickerOpen(true);
  };

  const handleAdAccountSelect = (adAccountId: string | null) => {
    setSelectedNewCampaignAdAccountId(adAccountId ?? undefined);
    setEditingCampaign(null);
    setDialogOpen(true);
  };

  const handleAdAccountPickerBack = () => {
    setAdAccountPickerOpen(false);
    setMarketplacePickerOpen(true);
  };

  const handleCreateAdAccount = async (data: AdAccountFormData) => {
    try {
      const created = await createAccount(data);
      toast.success('Conta de anúncios criada com sucesso!');
      setNewAccountModalOpen(false);
      setSelectedNewCampaignAdAccountId(created.id);
      setDialogOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta de anúncios.';
      toast.error(message);
    }
  };

  const handleEdit = (c: CampaignWithRelations) => {
    setEditingCampaign(c);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteCampaign(deleteId);
      toast.success('Campanha excluída com sucesso.');
    } catch {
      toast.error('Erro ao excluir campanha.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  // Map of ad accounts for rapid lookup
  const adAccountMap = useMemo(() => {
    const map = new Map<string, AdAccountWithStats>();
    for (const acc of adAccounts) {
      map.set(acc.id, acc);
    }
    return map;
  }, [adAccounts]);

  // Filtered and sorted campaigns
  const processedCampaigns = useMemo(() => {
    return filterAndSortCampaigns(campaigns, {
      search: searchQuery,
      sortKey,
    });
  }, [campaigns, searchQuery, sortKey]);

  // Overall KPIs
  const totalMarketingCost = useMemo(() => {
    return calculateTotalMarketingCost(campaigns);
  }, [campaigns]);

  const totalBudget = useMemo(() => {
    return calculateTotalBudget(campaigns);
  }, [campaigns]);

  const uniqueAccountsCount = useMemo(() => {
    return getUniqueAdAccountsCount(campaigns);
  }, [campaigns]);

  // Grouped by ad account
  const accountGroups = useMemo(() => {
    return groupCampaignsByAccount(processedCampaigns, adAccountMap);
  }, [processedCampaigns, adAccountMap]);

  // Grouped by objective
  const objectiveGroups = useMemo(() => {
    return groupCampaignsByObjective(processedCampaigns);
  }, [processedCampaigns]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Campanhas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie suas campanhas de tráfego pago
          </p>
        </div>

        {/* Action Buttons & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Account Filter */}
          {adAccounts.length > 0 && (
            <Select value={selectedAccountId} onValueChange={handleAccountChange}>
              <SelectTrigger className="w-44 bg-card border-input text-foreground text-xs h-9">
                <SelectValue placeholder="Todas as Contas" />
              </SelectTrigger>
              <SelectContent className="bg-card border-input text-foreground">
                <SelectItem value="all">Todas as Contas</SelectItem>
                {adAccounts.map((acc: AdAccountWithStats) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
                <SelectItem value="unassigned">Sem Conta Vinculada</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Sort Selector */}
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-48 bg-card border-input text-foreground text-xs h-9">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-card border-input text-foreground">
              <SelectItem value="date_desc">Data ↓ (mais recente)</SelectItem>
              <SelectItem value="date_asc">Data ↑ (mais antigo)</SelectItem>
              <SelectItem value="name_asc">Nome A → Z</SelectItem>
              <SelectItem value="name_desc">Nome Z → A</SelectItem>
              <SelectItem value="budget_desc">Orçamento ↓</SelectItem>
              <SelectItem value="budget_asc">Orçamento ↑</SelectItem>
              <SelectItem value="status">Status (ativo → encerrado)</SelectItem>
            </SelectContent>
          </Select>

          {/* New Campaign Button */}
          <Button
            type="button"
            onClick={handleNew}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2 h-9 font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div className="text-center py-10 px-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm space-y-2">
          <p>Erro ao carregar campanhas. Verifique sua conexão com o servidor.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-red-500/40 text-red-300 hover:bg-red-500/20"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Empty state (no campaigns registered at all) */}
      {!isLoading && !isError && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-dashed border-border/80 bg-card/20">
          <div className="w-16 h-16 rounded-full bg-background/80 border border-border flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Nenhuma campanha encontrada</p>
            <p className="text-muted-foreground text-sm mt-1">
              Crie sua primeira campanha de tráfego pago para começar a rastrear métricas.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleNew}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Criar Campanha
          </Button>
        </div>
      )}

      {/* Main Content when campaigns exist */}
      {!isLoading && campaigns.length > 0 && (
        <div className="space-y-5">
          {/* Top Cost & KPI summary bar */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-card/60 border border-border flex-wrap shadow-sm">
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                  Total de Campanhas
                </p>
                <p className="text-base font-bold text-white mt-0.5">{campaigns.length}</p>
              </div>

              <div className="h-8 w-px bg-border/60 hidden sm:block" />

              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                  Contas Vinculadas
                </p>
                <p className="text-base font-bold text-zinc-200 mt-0.5">
                  {uniqueAccountsCount} {uniqueAccountsCount === 1 ? 'conta' : 'contas'}
                </p>
              </div>

              <div className="h-8 w-px bg-border/60 hidden sm:block" />

              <div className="px-3.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <p className="text-[10px] text-orange-400 uppercase tracking-wide font-bold">
                  Custo Total de Marketing
                </p>
                <p className="text-base font-extrabold text-orange-400 mt-0.5">
                  R$ {formatBRL(totalMarketingCost)}
                </p>
              </div>

              <div className="h-8 w-px bg-border/60 hidden sm:block" />

              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                  Orçamento Total
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  R$ {formatBRL(totalBudget)}
                </p>
              </div>
            </div>

            {/* View toggle (Por Contas de Anúncios vs Por Objetivos) */}
            <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setGroupBy('ad_account')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  groupBy === 'ad_account'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Por Contas de Anúncios
              </button>
              <button
                type="button"
                onClick={() => setGroupBy('objective')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  groupBy === 'objective'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Por Objetivos
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar campanhas por nome, conta ou objetivo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 bg-card/60 border-input text-foreground placeholder:text-muted-foreground text-xs h-9 focus:border-orange-500"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search returned 0 results */}
          {processedCampaigns.length === 0 && searchQuery && (
            <div className="text-center py-12 px-4 rounded-xl border border-zinc-800 bg-card/20 space-y-2">
              <p className="text-white text-sm font-medium">
                Nenhuma campanha encontrada para &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-muted-foreground text-xs">
                Tente buscar com outro termo ou limpe o filtro.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 mt-1"
              >
                Limpar busca
              </Button>
            </div>
          )}

          {/* Grouped Lists */}
          {processedCampaigns.length > 0 && (
            <div>
              {groupBy === 'ad_account' ? (
                <div className="space-y-4">
                  {accountGroups.map((group) => (
                    <AccountGroupSection
                      key={group.key}
                      groupKey={group.key}
                      account={group.account}
                      count={group.campaigns.length}
                      marketingCost={group.marketingCost}
                      budget={group.budget}
                      formatBRL={formatBRL}
                      defaultOpen={accountGroups.length === 1}
                    >
                      {group.campaigns.map((c) => {
                        const sc = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.active;
                        const logo = MARKETPLACE_LOGOS[c.marketplace];
                        const adSets = c.campaign_ad_sets ?? [];
                        return (
                          <CampaignCard
                            key={c.id}
                            campaign={c}
                            statusConfig={sc}
                            logo={logo}
                            adSets={adSets}
                            onEdit={() => handleEdit(c)}
                            onDelete={() => setDeleteId(c.id)}
                            organizationId={organizationId ?? undefined}
                          />
                        );
                      })}
                    </AccountGroupSection>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {objectiveGroups.map((group) => (
                    <ObjectiveGroupSection
                      key={group.key}
                      groupKey={group.key}
                      label={group.label}
                      icon={group.icon}
                      color={group.color}
                      borderColor={group.borderColor}
                      count={group.campaigns.length}
                      custo={group.marketingCost}
                      formatBRL={formatBRL}
                    >
                      {group.campaigns.map((c) => {
                        const sc = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.active;
                        const logo = MARKETPLACE_LOGOS[c.marketplace];
                        const adSets = c.campaign_ad_sets ?? [];
                        return (
                          <CampaignCard
                            key={c.id}
                            campaign={c}
                            statusConfig={sc}
                            logo={logo}
                            adSets={adSets}
                            onEdit={() => handleEdit(c)}
                            onDelete={() => setDeleteId(c.id)}
                            organizationId={organizationId ?? undefined}
                          />
                        );
                      })}
                    </ObjectiveGroupSection>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Marketplace picker */}
      <MarketplacePickerModal
        open={marketplacePickerOpen}
        onOpenChange={setMarketplacePickerOpen}
        onSelect={handleMarketplaceSelect}
      />

      {/* Intermediate step: Ad Account picker with linked profiles */}
      {organizationId && (
        <AdAccountPickerModal
          open={adAccountPickerOpen}
          onOpenChange={setAdAccountPickerOpen}
          marketplace={selectedMarketplace}
          organizationId={organizationId}
          onSelect={handleAdAccountSelect}
          onBack={handleAdAccountPickerBack}
          onCreateNewAccount={() => setNewAccountModalOpen(true)}
        />
      )}

      {/* Ad Account creation dialog if user creates from picker */}
      {organizationId && (
        <AdAccountFormDialog
          open={newAccountModalOpen}
          onOpenChange={setNewAccountModalOpen}
          onSubmit={handleCreateAdAccount}
        />
      )}

      {/* Campaign Form dialog */}
      {organizationId && (
        <CampaignFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setSelectedNewCampaignAdAccountId(undefined);
          }}
          campaign={editingCampaign ?? undefined}
          organizationId={organizationId}
          marketplace={editingCampaign?.marketplace ?? selectedMarketplace}
          defaultAdAccountId={
            editingCampaign
              ? undefined
              : (selectedNewCampaignAdAccountId ??
                 (selectedAccountId !== 'all' && selectedAccountId !== 'unassigned'
                   ? selectedAccountId
                   : undefined))
          }
          onSaved={() => {}}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent className="bg-card border-border text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Essa ação é irreversível. A campanha e todos os vínculos de produtos serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-input text-foreground hover:bg-accent">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CampaignsPage;
