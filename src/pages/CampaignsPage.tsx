import React, { useState, useMemo } from 'react';
import { Megaphone, Plus, Pencil, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useSettings } from '@/contexts/SettingsContext';
import { useCampaigns } from '@/hooks/useCampaigns';
import { CampaignFormDialog } from '@/components/campaigns/CampaignFormDialog';
import { MarketplacePickerModal } from '@/components/campaigns/MarketplacePickerModal';
import { getObjectiveLabel } from '@/types/campaigns';
import type { CampaignWithRelations, CampaignStatus, CampaignMarketplace } from '@/types/campaigns';

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

const statusConfig: Record<CampaignStatus, { label: string; className: string }> = {
  active:  { label: 'Ativo',     className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  paused:  { label: 'Pausado',   className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  ended:   { label: 'Encerrado', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
};

const SkeletonCard = () => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 animate-pulse space-y-3">
    <div className="h-4 bg-zinc-800 rounded w-2/3" />
    <div className="h-3 bg-zinc-800 rounded w-1/2" />
    <div className="h-3 bg-zinc-800 rounded w-1/3" />
  </div>
);

interface CampaignCardProps {
  campaign: CampaignWithRelations;
  sc: { label: string; className: string };
  logo: string | undefined;
  adSets: CampaignWithRelations['campaign_ad_sets'];
  onEdit: () => void;
  onDelete: () => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign: c, sc, logo, adSets, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  const marketplaceLabel: Record<string, string> = {
    tiktok: 'TikTok Shop',
    mercadolivre: 'Mercado Livre',
    amazon: 'Amazon',
    shein: 'Shein',
  };

  const audienceModeLabel: Record<string, string> = {
    auto: 'Automático (Smart+)',
    manual: 'Manual',
    saved: 'Audiência Salva',
  };

  // Period from first adSet with dates
  const firstAdSetWithDates = adSets.find(a => a.start_date || a.end_date);
  const formatDate = (d: string | null | undefined) =>
    d ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(d)) : null;
  const periodStart = formatDate(firstAdSetWithDates?.start_date);
  const periodEnd = formatDate(firstAdSetWithDates?.end_date);
  const periodStr = periodStart && periodEnd
    ? `${periodStart} – ${periodEnd}`
    : periodStart
    ? `A partir de ${periodStart}`
    : periodEnd
    ? `Até ${periodEnd}`
    : null;

  // Total custo = sum marketing_cost_override across linked products
  const totalCusto = c.campaign_products.reduce(
    (sum, p) => sum + (p.marketing_cost_override != null ? Number(p.marketing_cost_override) : 0),
    0
  );
  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Marketplace logo */}
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden p-1 shadow-sm">
            {logo ? (
              <img src={logo} alt={c.marketplace} className="w-full h-full object-contain" />
            ) : (
              <Megaphone className="w-6 h-6 text-zinc-400" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-white truncate">{c.name}</h3>
              <Badge className="bg-pink-500/15 text-pink-400 border-pink-500/30 text-[10px]">
                {marketplaceLabel[c.marketplace] ?? c.marketplace}
              </Badge>
              <Badge className={`text-[10px] border ${sc.className}`}>
                {sc.label}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400">
              Objetivo: <span className="text-zinc-200">{getObjectiveLabel(c.objective)}</span>
              {' · '}
              Orçamento: <span className="text-zinc-200">
                {c.budget_type === 'daily' ? 'Diário' : 'Vitalício'}
                {c.budget_amount != null
                  ? ` · R$ ${formatBRL(Number(c.budget_amount))}`
                  : ''}
              </span>
              {totalCusto > 0 && (
                <>
                  {' · '}
                  Custo: <span className="text-orange-400 font-medium">R$ {formatBRL(totalCusto)}</span>
                </>
              )}
            </p>
            {periodStr && (
              <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                <svg className="w-3 h-3 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{periodStr}</span>
              </p>
            )}
            {c.campaign_products.length > 0 && (
              <p className="text-xs text-zinc-500">
                {c.campaign_products.length} produto(s) vinculado(s)
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0 items-center">
            <Button size="sm" variant="ghost" onClick={onEdit}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8 p-0">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete}
              className="text-zinc-400 hover:text-red-400 hover:bg-zinc-800 h-8 w-8 p-0">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Accordion trigger: Grupos de Anúncios */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors text-left"
      >
        <span className="text-xs font-medium text-zinc-400">
          Grupos de Anúncios
          {adSets.length > 0 && (
            <span className="ml-1.5 bg-zinc-700 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded-full">
              {adSets.length}
            </span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Accordion body */}
      {expanded && (
        <div className="border-t border-zinc-800 divide-y divide-zinc-800/60">
          {adSets.length === 0 ? (
            <div className="px-5 py-4 text-xs text-zinc-500 italic">
              Nenhum grupo de anúncios configurado.
            </div>
          ) : (
            adSets.map((adSet, i) => {
              const ext = adSet as typeof adSet & {
                traffic_destination?: string | null;
                optimization_goal?: string | null;
                target_cost_per_result?: number | null;
              };
              const destinationLabel: Record<string, string> = {
                site: 'Site', app: 'Aplicativo', tiktok_shop: 'Loja TikTok',
              };
              const goalLabel: Record<string, string> = {
                click: 'Clique', landing_page_view: 'Visualização pg inicial', engagement_session: 'Sessão de Engajamento',
              };
              return (
                <div key={adSet.id ?? i} className="px-5 py-4 space-y-2 bg-zinc-950/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-300">
                      {adSet.name ?? `Grupo ${i + 1}`}
                    </span>
                    {adSet.audience_mode && (
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                        {audienceModeLabel[adSet.audience_mode] ?? adSet.audience_mode}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {adSet.start_date && (
                      <p className="text-[11px] text-zinc-500">
                        Início: <span className="text-zinc-300">{new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(adSet.start_date))}</span>
                      </p>
                    )}
                    {adSet.end_date && (
                      <p className="text-[11px] text-zinc-500">
                        Fim: <span className="text-zinc-300">{new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(adSet.end_date))}</span>
                      </p>
                    )}
                    {c.budget_amount != null && (
                      <p className="text-[11px] text-zinc-500">
                        Orçamento: <span className="text-zinc-300">R$ {formatBRL(Number(c.budget_amount))}</span>
                      </p>
                    )}
                    {ext.traffic_destination && (
                      <p className="text-[11px] text-zinc-500">
                        Destino: <span className="text-zinc-300">{destinationLabel[ext.traffic_destination] ?? ext.traffic_destination}</span>
                      </p>
                    )}
                    {ext.optimization_goal && (
                      <p className="text-[11px] text-zinc-500">
                        Objetivo: <span className="text-zinc-300">{goalLabel[ext.optimization_goal] ?? ext.optimization_goal}</span>
                      </p>
                    )}
                    {adSet.audience_location && (
                      <p className="text-[11px] text-zinc-500">
                        Localização: <span className="text-zinc-300">{adSet.audience_location}</span>
                      </p>
                    )}
                    {adSet.audience_interests && (
                      <p className="text-[11px] text-zinc-500">
                        Interesses: <span className="text-zinc-300">{adSet.audience_interests}</span>
                      </p>
                    )}
                    {ext.target_cost_per_result != null && (
                      <p className="text-[11px] text-zinc-500">
                        CPA Alvo: <span className="text-zinc-300">
                          R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(ext.target_cost_per_result)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const CampaignsPage: React.FC = () => {
  const { organizationId } = useSettings();
  const { campaigns, isLoading, isError, deleteCampaign } = useCampaigns(organizationId ?? '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithRelations | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [marketplacePickerOpen, setMarketplacePickerOpen] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<CampaignMarketplace>('tiktok');

  const handleNew = () => { setMarketplacePickerOpen(true); };
  const handleMarketplaceSelect = (mp: CampaignMarketplace) => {
    setSelectedMarketplace(mp);
    setEditingCampaign(null);
    setDialogOpen(true);
  };
  const handleEdit = (c: CampaignWithRelations) => { setEditingCampaign(c); setDialogOpen(true); };
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

  type SortKey = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'budget_desc' | 'budget_asc' | 'status';
  const [sortKey, setSortKey] = useState<SortKey>('date_desc');

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      switch (sortKey) {
        case 'date_desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date_asc':  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name_asc':  return (a.name ?? '').localeCompare(b.name ?? '');
        case 'name_desc': return (b.name ?? '').localeCompare(a.name ?? '');
        case 'budget_desc': return (Number(b.budget_amount ?? 0)) - (Number(a.budget_amount ?? 0));
        case 'budget_asc':  return (Number(a.budget_amount ?? 0)) - (Number(b.budget_amount ?? 0));
        case 'status': {
          const order: Record<string, number> = { active: 0, paused: 1, ended: 2 };
          return (order[a.status] ?? 9) - (order[b.status] ?? 9);
        }
        default: return 0;
      }
    });
  }, [campaigns, sortKey]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Campanhas</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Gerencie suas campanhas de tráfego pago</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as typeof sortKey)}>
            <SelectTrigger className="w-48 bg-zinc-900 border-zinc-700 text-zinc-300 text-xs h-9">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
              <SelectItem value="date_desc">Data ↓ (mais recente)</SelectItem>
              <SelectItem value="date_asc">Data ↑ (mais antigo)</SelectItem>
              <SelectItem value="name_asc">Nome A → Z</SelectItem>
              <SelectItem value="name_desc">Nome Z → A</SelectItem>
              <SelectItem value="budget_desc">Orçamento ↓</SelectItem>
              <SelectItem value="budget_asc">Orçamento ↑</SelectItem>
              <SelectItem value="status">Status (ativo → encerrado)</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleNew} className="bg-orange-500 hover:bg-orange-600 text-white gap-2 h-9">
            <Plus className="w-4 h-4" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="text-center py-10 text-red-400 text-sm">
          Erro ao carregar campanhas. Tente recarregar a página.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-zinc-500" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Nenhuma campanha encontrada</p>
            <p className="text-zinc-400 text-sm mt-1">Crie sua primeira campanha de tráfego pago.</p>
          </div>
          <Button onClick={handleNew} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
            <Plus className="w-4 h-4" />
            Criar Campanha
          </Button>
        </div>
      )}

      {/* List */}
      {!isLoading && campaigns.length > 0 && (() => {
        // Total cost across all campaigns
        const totalCusto = campaigns.reduce((sum, c) =>
          sum + c.campaign_products.reduce((s, p) => s + (p.marketing_cost_override != null ? Number(p.marketing_cost_override) : 0), 0)
        , 0);
        const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v);

        // Group sortedCampaigns by status
        const groups: { status: 'active' | 'paused' | 'ended'; label: string; color: string; campaigns: typeof sortedCampaigns }[] = [
          { status: 'active' as const,  label: 'Ativas',     color: 'text-green-400',  campaigns: sortedCampaigns.filter(c => c.status === 'active') },
          { status: 'paused' as const,  label: 'Pausadas',   color: 'text-yellow-400', campaigns: sortedCampaigns.filter(c => c.status === 'paused') },
          { status: 'ended' as const,   label: 'Encerradas', color: 'text-zinc-400',   campaigns: sortedCampaigns.filter(c => c.status === 'ended') },
        ].filter(g => g.campaigns.length > 0);

        return (
          <div className="space-y-6">
            {/* Total cost summary */}
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex-1 flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Total de Campanhas</p>
                  <p className="text-sm font-semibold text-white">{campaigns.length}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Custo Total</p>
                  <p className="text-sm font-semibold text-orange-400">R$ {formatBRL(totalCusto)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Orçamento Total</p>
                  <p className="text-sm font-semibold text-zinc-200">
                    R$ {formatBRL(campaigns.reduce((s, c) => s + Number(c.budget_amount ?? 0), 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Grouped sections */}
            {groups.map(group => {
              const groupCusto = group.campaigns.reduce((sum, c) =>
                sum + c.campaign_products.reduce((s, p) => s + (p.marketing_cost_override != null ? Number(p.marketing_cost_override) : 0), 0)
              , 0);
              return (
                <div key={group.status} className="space-y-2">
                  {/* Group header */}
                  <div className="flex items-center gap-3 px-1">
                    <span className={`text-xs font-semibold uppercase tracking-widest ${group.color}`}>
                      {group.label}
                    </span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">
                      {group.campaigns.length}
                    </span>
                    {groupCusto > 0 && (
                      <span className="text-[10px] text-orange-400/70 ml-auto">
                        Custo: R$ {formatBRL(groupCusto)}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-3">
                    {group.campaigns.map((c) => {
                      const sc = statusConfig[c.status] ?? statusConfig.active;
                      const logo = MARKETPLACE_LOGOS[c.marketplace];
                      const adSets = c.campaign_ad_sets ?? [];
                      return (
                        <CampaignCard
                          key={c.id}
                          campaign={c}
                          sc={sc}
                          logo={logo}
                          adSets={adSets}
                          onEdit={() => handleEdit(c)}
                          onDelete={() => setDeleteId(c.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Marketplace picker */}
      <MarketplacePickerModal
        open={marketplacePickerOpen}
        onOpenChange={setMarketplacePickerOpen}
        onSelect={handleMarketplaceSelect}
      />

      {/* Form dialog */}
      {organizationId && (
        <CampaignFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          campaign={editingCampaign ?? undefined}
          organizationId={organizationId}
          marketplace={editingCampaign?.marketplace ?? selectedMarketplace}
          onSaved={() => {}}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Essa ação é irreversível. A campanha e todos os vínculos de produtos serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
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
