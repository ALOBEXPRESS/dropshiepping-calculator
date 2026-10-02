import React, { memo, useState } from 'react';
import { Compass, Pencil, Trash2, Copy, Check, Shield, User, Archive, RotateCcw } from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import type { BrowserProfile, BrowserProfileStatus, BrowserProfileTool } from '@/types/browserProfiles';
import {
  BROWSER_PROFILE_TOOL_LABELS,
  BROWSER_PROFILE_STATUS_LABELS,
  BROWSER_PROFILE_STATUS_COLORS,
} from '@/types/browserProfiles';
import type { PlatformAccount } from '@/types/platformAccounts';

export interface BrowserProfileCardProps {
  profile: BrowserProfile;
  account?: PlatformAccount | null;
  proxyLabel?: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

export const BrowserProfileCard: React.FC<BrowserProfileCardProps> = memo(({
  profile,
  account,
  proxyLabel,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [copied, setCopied] = useState(false);
  const statusColor = BROWSER_PROFILE_STATUS_COLORS[profile.status as BrowserProfileStatus] || '';
  const isArchived = profile.status === 'archived';

  const handleCopySerial = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile.external_profile_id) return;
    navigator.clipboard.writeText(profile.external_profile_id);
    setCopied(true);
    toast.success('ID do AdsPower copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-b from-card/80 to-card/40 p-5 space-y-4 transition-all shadow-sm ${
        isArchived
          ? 'border-border/50 opacity-75'
          : 'border-border/80 hover:border-cyan-500/40'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Compass className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {profile.name || profile.external_profile_id || 'Perfil sem nome'}
            </h3>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="font-semibold text-cyan-400">
                {BROWSER_PROFILE_TOOL_LABELS[profile.tool as BrowserProfileTool] || profile.tool}
              </span>
              <span>·</span>
              <span className={`px-1.5 py-0.2 rounded-full border text-[10px] font-semibold ${statusColor}`}>
                {BROWSER_PROFILE_STATUS_LABELS[profile.status as BrowserProfileStatus] || profile.status}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onToggleStatus}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={isArchived ? 'Reativar perfil' : 'Arquivar perfil'}
            aria-label={isArchived ? 'Reativar perfil' : 'Arquivar perfil'}
          >
            {isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Editar perfil"
            aria-label={`Editar perfil ${profile.name || profile.external_profile_id}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
            title="Excluir perfil"
            aria-label={`Excluir perfil ${profile.name || profile.external_profile_id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* External ID Badge */}
      {profile.external_profile_id && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-accent/30 border border-border/60">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">
              ID / Serial AdsPower
            </p>
            <p className="font-mono text-xs font-semibold text-foreground truncate select-all">
              {profile.external_profile_id}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopySerial}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Copiar ID"
            aria-label="Copiar ID do AdsPower"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* Linked Account info */}
      <div className="space-y-1.5 pt-1 border-t border-border/60 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <User className="w-3 h-3 text-brand" /> Conta Vinculada:
          </span>
          {account ? (
            <Link
              to="/contas"
              className="font-medium text-foreground hover:underline flex items-center gap-1.5 max-w-[170px] truncate"
            >
              {account.country && (
                <ReactCountryFlag countryCode={account.country} svg style={{ width: '1em', height: '1em' }} />
              )}
              <span className="truncate">{account.name}</span>
            </Link>
          ) : (
            <span className="text-muted-foreground italic">Não encontrada</span>
          )}
        </div>

        {/* Derived Proxy */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-orange-400" /> Proxy Derivado:
          </span>
          {proxyLabel ? (
            <span className="font-mono text-[11px] font-medium text-orange-400 truncate max-w-[170px]">
              {proxyLabel}
            </span>
          ) : (
            <span className="text-zinc-500 italic text-[11px]">Nenhum (na conta)</span>
          )}
        </div>
      </div>

      {/* Notes if any */}
      {profile.notes && (
        <p className="text-xs text-muted-foreground line-clamp-2 italic pt-1">
          "{profile.notes}"
        </p>
      )}
    </div>
  );
});

BrowserProfileCard.displayName = 'BrowserProfileCard';
