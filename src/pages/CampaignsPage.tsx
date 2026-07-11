import React, { useState } from 'react';
import { Megaphone, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Campanhas</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Gerencie suas campanhas de tráfego pago</p>
        </div>
        <Button onClick={handleNew} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" />
          Nova Campanha
        </Button>
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
      {!isLoading && campaigns.length > 0 && (
        <div className="grid gap-3">
          {campaigns.map((c) => {
            const sc = statusConfig[c.status] ?? statusConfig.active;
            return (
              <div
                key={c.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 transition-colors p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white truncate">{c.name}</h3>
                      <Badge className="bg-pink-500/15 text-pink-400 border-pink-500/30 text-[10px]">
                        TikTok
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
                        {c.budget_amount != null ? ` · R$ ${Number(c.budget_amount).toFixed(2).replace('.', ',')}` : ''}
                      </span>
                    </p>
                    {c.campaign_products.length > 0 && (
                      <p className="text-xs text-zinc-500">
                        {c.campaign_products.length} produto(s) vinculado(s)
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(c)}
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8 p-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(c.id)}
                      className="text-zinc-400 hover:text-red-400 hover:bg-zinc-800 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
