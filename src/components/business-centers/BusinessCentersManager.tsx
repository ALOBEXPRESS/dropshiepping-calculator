import React, { useState, useMemo, useCallback } from 'react';
import {
  Building2,
  Plus,
  Loader2,
  Search,
  AlertTriangle,
} from 'lucide-react';
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
import { useBusinessCenters } from '@/hooks/useBusinessCenters';
import { useDebounce } from '@/hooks/useDebounce';
import type { BusinessCenterWithStats } from '@/types/businessCenters';
import { BusinessCenterFormDialog } from './BusinessCenterFormDialog';
import { BusinessCenterCard } from './BusinessCenterCard';
import { BusinessCenterSummaryCards } from './BusinessCenterSummaryCards';
import { matchesBusinessCenterSearch } from './businessCentersUtils';

interface BusinessCentersManagerProps {
  organizationId: string;
}

export const BusinessCentersManager: React.FC<BusinessCentersManagerProps> = ({
  organizationId,
}) => {
  const { centers, isLoading, deleteCenter, isDeleting } =
    useBusinessCenters(organizationId);

  // Busca e debounce
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Estados dos modais
  const [formOpen, setFormOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<BusinessCenterWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BusinessCenterWithStats | null>(null);

  // Filtragem com busca inteligente
  const filteredCenters = useMemo(() => {
    if (!debouncedSearch.trim()) return centers;
    return centers.filter((c) => matchesBusinessCenterSearch(c, debouncedSearch));
  }, [centers, debouncedSearch]);

  // Contagem de contas de anúncio vinculadas no total da organização
  const totalLinkedAccounts = useMemo(() => {
    return centers.reduce((sum, c) => sum + (c.ad_account_count ?? 0), 0);
  }, [centers]);

  // Contagem de BCs por plataforma
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of centers) {
      counts[c.platform] = (counts[c.platform] || 0) + 1;
    }
    return counts;
  }, [centers]);

  const handleCreate = useCallback(() => {
    setEditingCenter(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((center: BusinessCenterWithStats) => {
    setEditingCenter(center);
    setFormOpen(true);
  }, []);

  const handleDeletePrompt = useCallback((center: BusinessCenterWithStats) => {
    setDeleteTarget(center);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCenter(deleteTarget.id);
      toast.success('Business Center excluído com sucesso.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao excluir Business Center.'
      );
    }
  };

  const hasLinkedAccounts = deleteTarget ? deleteTarget.ad_account_count > 0 : false;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <span>Painel</span>
            <span>/</span>
            <span className="text-zinc-200">Contas</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-purple-400" />
            Business Centers
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie seus Business Centers para centralizar e vincular suas contas de anúncios em múltiplas plataformas
          </p>
        </div>
        <Button
          onClick={handleCreate}
          aria-label="Cadastrar novo Business Center"
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2 h-10 text-xs shadow-md"
        >
          <Plus className="w-4 h-4" />
          Novo Business Center
        </Button>
      </div>

      {/* Metric Cards */}
      <BusinessCenterSummaryCards
        totalCenters={centers.length}
        totalLinkedAccounts={totalLinkedAccounts}
        platformCounts={platformCounts}
      />

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ID, nome, empresa, titular, CNPJ ou plataforma..."
            aria-label="Buscar por ID, nome, empresa, titular, CNPJ ou plataforma"
            className="pl-9 bg-background border-input text-xs h-9"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCenters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/20 py-16 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-purple-400/60" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {search ? 'Nenhum Business Center encontrado' : 'Nenhum Business Center cadastrado'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {search
                ? 'Tente ajustar os termos da sua busca.'
                : 'Cadastre os Business Centers da sua organização para associá-los às contas de anúncios de forma reutilizável.'}
            </p>
          </div>
          {!search && (
            <Button
              variant="outline"
              onClick={handleCreate}
              className="gap-2 mt-1 text-xs"
            >
              <Plus className="w-4 h-4" />
              Criar primeiro Business Center
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCenters.map((center) => (
            <BusinessCenterCard
              key={center.id}
              center={center}
              onEdit={() => handleEdit(center)}
              onDelete={() => handleDeletePrompt(center)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog com o fluxo de 2 etapas */}
      <BusinessCenterFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        center={editingCenter}
        organizationId={organizationId}
      />

      {/* Delete Confirmation Alert Dialog */}
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
              Excluir Business Center?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs space-y-2">
              <p>
                Tem certeza que deseja excluir o Business Center{' '}
                <strong className="text-foreground">
                  {deleteTarget?.name || deleteTarget?.bc_id}
                </strong>
                ?
              </p>
              {hasLinkedAccounts && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  Atenção: Este Business Center está vinculado a{' '}
                  <strong>{deleteTarget?.ad_account_count}</strong> conta(s) de anúncios.
                  A exclusão só será permitida se as contas forem desvinculadas primeiro na página de Contas de Anúncios.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="bg-background border-input text-foreground hover:bg-accent text-xs"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting || hasLinkedAccounts}
              className="bg-red-600 hover:bg-red-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BusinessCentersManager;
