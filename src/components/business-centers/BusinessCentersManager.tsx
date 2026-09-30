import React, { useState, useMemo } from 'react';
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
  User,
  FileText,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
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
import type { BusinessCenterWithStats } from '@/types/businessCenters';
import { BC_PLATFORM_CONFIG } from '@/types/businessCenters';
import {
  InstagramLogo,
  FacebookLogo,
  getPlatformLogo,
  getPlatformColor,
} from '@/components/ui/PlatformLogos';
import { formatCpf, formatCnpj } from '@/utils/inputMasks';
import { BusinessCenterFormDialog } from './BusinessCenterFormDialog';

function getIdBoxTheme(platform: string) {
  switch (platform) {
    case 'tiktok':
      return {
        container:
          'bg-gradient-to-r from-cyan-950/45 via-zinc-900/90 to-cyan-950/25 border-cyan-500/40 hover:border-cyan-400/70 shadow-[0_0_15px_rgba(37,244,238,0.08)]',
        label: 'text-cyan-400',
        idText: 'text-cyan-100 group-hover/id:text-white',
        copyBtn:
          'bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border-cyan-500/30 shadow-sm',
      };
    case 'meta':
      return {
        container:
          'bg-gradient-to-r from-blue-950/45 via-zinc-900/90 to-blue-950/25 border-blue-500/40 hover:border-blue-400/70 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
        label: 'text-blue-400',
        idText: 'text-blue-100 group-hover/id:text-white',
        copyBtn:
          'bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 hover:text-white border-blue-500/30 shadow-sm',
      };
    case 'google':
      return {
        container:
          'bg-gradient-to-r from-amber-950/45 via-zinc-900/90 to-amber-950/25 border-amber-500/40 hover:border-amber-400/70 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
        label: 'text-amber-400',
        idText: 'text-amber-100 group-hover/id:text-white',
        copyBtn:
          'bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-white border-amber-500/30 shadow-sm',
      };
    default:
      return {
        container:
          'bg-gradient-to-r from-purple-950/45 via-zinc-900/90 to-purple-950/25 border-purple-500/40 hover:border-purple-400/70 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
        label: 'text-purple-400',
        idText: 'text-purple-100 group-hover/id:text-white',
        copyBtn:
          'bg-purple-500/15 hover:bg-purple-500/30 text-purple-300 hover:text-white border-purple-500/30 shadow-sm',
      };
  }
}

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

  const Logo = getPlatformLogo(center.platform);
  const platformColor = getPlatformColor(center.platform);
  const platformConfig = BC_PLATFORM_CONFIG[center.platform] || BC_PLATFORM_CONFIG.tiktok;

  return (
    <div className="group rounded-2xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 p-5 space-y-4 hover:border-purple-500/40 transition-all shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl ${platformConfig.bgColor} border ${platformConfig.borderColor} flex items-center justify-center flex-shrink-0`}>
            <Logo className={`w-5 h-5 ${platformColor}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {center.name || `BC ${center.bc_id}`}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={`inline-flex items-center text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${platformConfig.bgColor} ${platformColor} border ${platformConfig.borderColor}`}>
                {center.platform}
              </span>
              <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {center.business_type === 'agency' ? 'Agência' : 'Anunciante'}
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

      {/* ── Box 1: Empresa & Titular & Metadados (Legal & Compliance) ── */}
      <div className="text-xs space-y-2.5 p-3.5 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/25 via-zinc-900/85 to-zinc-950/95 shadow-sm hover:border-emerald-500/50 transition-colors">
        {/* Dados da Empresa */}
        {(center.company_legal_name || center.company_cnpj) && (
          <div className="space-y-1.5 pb-2.5 border-b border-emerald-500/15">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                Empresa
              </span>
              {center.company_status && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                    center.company_status === 'Ativa'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {center.company_status}
                </span>
              )}
            </div>
            {center.company_legal_name && (
              <p className="text-white font-bold truncate text-xs tracking-tight">
                {center.company_legal_name}
              </p>
            )}
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono flex-wrap">
              {center.company_cnpj && (
                <span className="bg-zinc-900/90 px-1.5 py-0.5 rounded border border-emerald-500/20 text-zinc-200">
                  CNPJ: <span className="text-emerald-300 font-semibold">{formatCnpj(center.company_cnpj)}</span>
                </span>
              )}
              {center.company_state_registration && (
                <span className="bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-300">
                  IE: {center.company_state_registration}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Dados do Titular */}
        {(center.holder_name || center.holder_cpf) && (
          <div className="space-y-1 pb-2 border-b border-emerald-500/15 text-[11px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              Titular Responsável
            </span>
            <p className="text-zinc-200 font-semibold truncate">
              {center.holder_name || '—'}
              {center.holder_cpf && (
                <span className="text-cyan-300/90 font-mono text-[10px] ml-1.5 font-normal">
                  ({formatCpf(center.holder_cpf)})
                </span>
              )}
            </p>
          </div>
        )}

        {/* Metadados geográficos / moeda */}
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 flex-wrap pt-0.5">
          <span className="bg-zinc-900/90 px-2 py-0.5 rounded text-zinc-200 border border-zinc-700/80 font-bold">
            {center.country || 'BR'}
          </span>
          <span className="bg-amber-500/10 px-2 py-0.5 rounded text-amber-300 border border-amber-500/30 font-mono font-bold">
            {center.currency || 'BRL'}
          </span>
          <span className="bg-zinc-900/90 px-2 py-0.5 rounded text-zinc-400 border border-zinc-800 font-mono">
            {center.timezone || 'America/Sao_Paulo'}
          </span>
        </div>
      </div>

      {/* ── Box 2: ID Badge with copy (Identificador Destacado) ── */}
      {(() => {
        const idTheme = getIdBoxTheme(center.platform);
        return (
          <div
            className={`group/id flex items-center justify-between p-3 rounded-xl border transition-all ${idTheme.container}`}
          >
            <div className="min-w-0 pr-2">
              <p className={`text-[10px] uppercase tracking-wider font-bold flex items-center gap-1.5 ${idTheme.label}`}>
                <Hash className="w-3 h-3 flex-shrink-0" />
                {platformConfig.idLabel}
              </p>
              <p
                className={`font-mono text-xs sm:text-sm font-bold truncate select-all tracking-wide mt-0.5 transition-colors ${idTheme.idText}`}
              >
                {center.bc_id}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className={`p-2 rounded-lg border transition-all flex-shrink-0 ${idTheme.copyBtn}`}
              title="Copiar ID"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        );
      })()}

      {/* Meta linked account info */}
      {center.platform === 'meta' && center.meta_linked_network && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
          {center.meta_linked_network === 'instagram' ? (
            <InstagramLogo className="w-4 h-4 flex-shrink-0" />
          ) : (
            <FacebookLogo className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="text-blue-300 font-medium capitalize">
            {center.meta_linked_network} vinculado
          </span>
        </div>
      )}

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
        (c.company_legal_name && c.company_legal_name.toLowerCase().includes(term)) ||
        (c.company_cnpj && c.company_cnpj.includes(term)) ||
        (c.holder_name && c.holder_name.toLowerCase().includes(term)) ||
        (c.holder_cpf && c.holder_cpf.includes(term)) ||
        (c.notes && c.notes.toLowerCase().includes(term)) ||
        c.platform.toLowerCase().includes(term)
    );
  }, [centers, search]);

  const totalLinkedAccounts = useMemo(() => {
    return centers.reduce((sum, c) => sum + (c.ad_account_count ?? 0), 0);
  }, [centers]);

  // Contagem por plataforma
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    centers.forEach((c) => {
      counts[c.platform] = (counts[c.platform] || 0) + 1;
    });
    return counts;
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
            Gerencie seus Business Centers para centralizar e vincular suas contas de anúncios em múltiplas plataformas
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
          <p className="text-xs text-muted-foreground">Plataformas Ativas</p>
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {Object.entries(platformCounts).map(([platform, count]) => {
              const Logo = getPlatformLogo(platform);
              const color = getPlatformColor(platform);
              return (
                <div key={platform} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent/40 border border-border/60">
                  <Logo className={`w-4 h-4 ${color}`} />
                  <span className="text-xs font-semibold text-foreground capitalize">{platform}</span>
                  <span className="text-[10px] text-muted-foreground">({count})</span>
                </div>
              );
            })}
            {Object.keys(platformCounts).length === 0 && (
              <span className="text-sm text-muted-foreground">Nenhuma</span>
            )}
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por ID, nome, empresa, titular, CNPJ ou plataforma..."
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

      {/* Create / Edit Dialog com o novo fluxo de 2 etapas */}
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
