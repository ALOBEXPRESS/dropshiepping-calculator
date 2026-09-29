import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Copy,
  Check,
  Megaphone,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { useBusinessCenters } from '@/hooks/useBusinessCenters';
import type {
  BusinessCenterWithStats,
  BusinessCenterFormData,
} from '@/types/businessCenters';
import { businessCenterSchema } from '@/types/businessCenters';

// ── BusinessCenterFormDialog ──────────────────────────────────────────────────

interface BusinessCenterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  center?: BusinessCenterWithStats | null;
  organizationId: string;
}

export const BusinessCenterFormDialog: React.FC<BusinessCenterFormDialogProps> = ({
  open,
  onOpenChange,
  center,
  organizationId,
}) => {
  const { createCenter, updateCenter, isCreating, isUpdating } =
    useBusinessCenters(organizationId);
  const isEditing = !!center;
  const isBusy = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusinessCenterFormData>({
    resolver: zodResolver(businessCenterSchema),
    defaultValues: center
      ? {
          platform: center.platform,
          bc_id: center.bc_id,
          name: center.name ?? '',
          notes: center.notes ?? '',
        }
      : {
          platform: 'tiktok',
          bc_id: '',
          name: '',
          notes: '',
        },
  });

  React.useEffect(() => {
    if (open) {
      reset(
        center
          ? {
              platform: center.platform,
              bc_id: center.bc_id,
              name: center.name ?? '',
              notes: center.notes ?? '',
            }
          : {
              platform: 'tiktok',
              bc_id: '',
              name: '',
              notes: '',
            }
      );
    }
  }, [open, center, reset]);

  const onSubmit = async (data: BusinessCenterFormData) => {
    try {
      if (isEditing && center) {
        await updateCenter(center.id, data);
        toast.success('Business Center atualizado com sucesso!');
      } else {
        await createCenter(data);
        toast.success('Business Center criado com sucesso!');
      }
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao salvar Business Center.'
      );
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            {isEditing ? 'Editar Business Center' : 'Novo Business Center'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Platform (fixed to TikTok) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Plataforma
            </Label>
            <div className="h-9 px-3 rounded-md bg-accent/40 border border-border flex items-center text-xs font-medium text-foreground">
              TikTok Ads Manager
            </div>
          </div>

          {/* External BC ID */}
          <div className="space-y-1.5">
            <Label htmlFor="bc_id" className="text-xs font-semibold text-foreground">
              ID do Business Center (TikTok) <span className="text-red-400">*</span>
            </Label>
            <Input
              id="bc_id"
              {...register('bc_id')}
              placeholder="Ex: 7123456789012345678"
              className="bg-background border-input font-mono text-xs"
            />
            {errors.bc_id && (
              <p className="text-xs text-red-400">{errors.bc_id.message}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              ID numérico fornecido na URL ou painel do TikTok Business Center.
            </p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-foreground">
              Nome de Identificação (Opcional)
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: BC Principal - Escala Brasil"
              className="bg-background border-input text-xs"
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Nome amigável para facilitar o reconhecimento no seletor das contas de anúncios.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold text-foreground">
              Observações
            </Label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={3}
              placeholder="Anotações internas, proprietário, finalidade ou limites deste BC..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.notes && (
              <p className="text-xs text-red-400">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isBusy}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isBusy}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
            >
              {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Business Center'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ── BusinessCenterCard ────────────────────────────────────────────────────────

interface BusinessCenterCardProps {
  center: BusinessCenterWithStats;
  onEdit: () => void;
  onDelete: () => void;
}

const BusinessCenterCard: React.FC<BusinessCenterCardProps> = ({
  center,
  onEdit,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(center.bc_id);
    setCopied(true);
    toast.success('ID copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group rounded-2xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 p-5 space-y-4 hover:border-purple-500/40 transition-all shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-purple-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {center.name || `BC ${center.bc_id}`}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {center.platform}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Editar Business Center"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
            title="Excluir Business Center"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ID Badge with copy */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-accent/30 border border-border/60">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            ID do Business Center
          </p>
          <p className="font-mono text-xs font-semibold text-foreground truncate select-all">
            {center.bc_id}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Copiar ID"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Notes if any */}
      {center.notes && (
        <p className="text-xs text-muted-foreground line-clamp-2 italic">
          "{center.notes}"
        </p>
      )}

      {/* Footer: Linked Ad Accounts counter */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Megaphone className="w-3.5 h-3.5 text-purple-400" />
          <span>Contas de Anúncio:</span>
        </div>
        <Link
          to="/contas-anuncios"
          className="inline-flex items-center gap-1 font-semibold text-purple-400 hover:text-purple-300 hover:underline"
        >
          <span>{center.ad_account_count} vinculada{center.ad_account_count !== 1 ? 's' : ''}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

// ── BusinessCentersManager ────────────────────────────────────────────────────

interface BusinessCentersManagerProps {
  organizationId: string;
}

export const BusinessCentersManager: React.FC<BusinessCentersManagerProps> = ({
  organizationId,
}) => {
  const { centers, isLoading, deleteCenter, isDeleting } =
    useBusinessCenters(organizationId);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<BusinessCenterWithStats | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BusinessCenterWithStats | null>(null);

  const filteredCenters = useMemo(() => {
    if (!search.trim()) return centers;
    const term = search.toLowerCase().trim();
    return centers.filter(
      (c) =>
        c.bc_id.toLowerCase().includes(term) ||
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.notes && c.notes.toLowerCase().includes(term))
    );
  }, [centers, search]);

  const totalLinkedAccounts = useMemo(() => {
    return centers.reduce((sum, c) => sum + (c.ad_account_count ?? 0), 0);
  }, [centers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCenter(deleteTarget.id);
      toast.success('Business Center excluído com sucesso.');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao excluir Business Center.'
      );
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-purple-400" />
            Business Centers
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Entidades reaproveitáveis de Business Center do TikTok para centralizar e vincular suas contas de anúncios
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCenter(null);
            setFormOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2 h-10 text-xs shadow-md"
        >
          <Plus className="w-4 h-4" />
          Novo Business Center
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Total de Business Centers</p>
          <p className="text-2xl font-bold text-foreground">{centers.length}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Contas de Anúncio Vinculadas</p>
          <p className="text-2xl font-bold text-purple-400">{totalLinkedAccounts}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Plataforma Padrão</p>
          <p className="text-2xl font-bold text-foreground">TikTok Ads</p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ID, nome ou notas..."
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
              onClick={() => {
                setEditingCenter(null);
                setFormOpen(true);
              }}
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
              onEdit={() => {
                setEditingCenter(center);
                setFormOpen(true);
              }}
              onDelete={() => setDeleteTarget(center)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
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
              {deleteTarget && deleteTarget.ad_account_count > 0 && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  Atenção: Este Business Center está vinculado a{' '}
                  <strong>{deleteTarget.ad_account_count}</strong> conta(s) de anúncios.
                  A exclusão só será permitida se as contas forem desvinculadas primeiro.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background border-input text-foreground hover:bg-accent text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
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
