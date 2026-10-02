import React, { useState, useCallback } from 'react';
import {
  Pencil,
  Trash2,
  Copy,
  Check,
  Megaphone,
  ExternalLink,
  User,
  FileText,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import type { BusinessCenterWithStats } from '@/types/businessCenters';
import { BC_PLATFORM_CONFIG } from '@/types/businessCenters';
import {
  InstagramLogo,
  FacebookLogo,
  getPlatformLogo,
  getPlatformColor,
} from '@/components/ui/PlatformLogos';
import { formatCpf, formatCnpj } from '@/utils/inputMasks';
import { getIdBoxTheme } from './businessCentersUtils';

interface BusinessCenterCardProps {
  center: BusinessCenterWithStats;
  onEdit: () => void;
  onDelete: () => void;
}

export const BusinessCenterCard: React.FC<BusinessCenterCardProps> = React.memo(
  ({ center, onEdit, onDelete }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(center.bc_id);
          setCopied(true);
          toast.success('ID copiado com sucesso!');
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Fallback se navigator.clipboard falhar
          const textArea = document.createElement('textarea');
          textArea.value = center.bc_id;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            setCopied(true);
            toast.success('ID copiado!');
            setTimeout(() => setCopied(false), 2000);
          } catch {
            toast.error('Não foi possível copiar o ID.');
          } finally {
            document.body.removeChild(textArea);
          }
        }
      },
      [center.bc_id]
    );

    const Logo = getPlatformLogo(center.platform);
    const platformColor = getPlatformColor(center.platform);
    const platformConfig =
      BC_PLATFORM_CONFIG[center.platform] || BC_PLATFORM_CONFIG.tiktok;
    const idTheme = getIdBoxTheme(center.platform);

    const displayName = center.name || `BC ${center.bc_id}`;

    return (
      <div className="group rounded-2xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 p-5 space-y-4 hover:border-purple-500/40 transition-all shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl ${platformConfig.bgColor} border ${platformConfig.borderColor} flex items-center justify-center flex-shrink-0`}
            >
              <Logo className={`w-5 h-5 ${platformColor}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate" title={displayName}>
                {displayName}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span
                  className={`inline-flex items-center text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${platformConfig.bgColor} ${platformColor} border ${platformConfig.borderColor}`}
                >
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
              aria-label={`Editar Business Center ${displayName}`}
              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400"
              title="Editar Business Center"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              aria-label={`Excluir Business Center ${displayName}`}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
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
                <p className="text-white font-bold truncate text-xs tracking-tight" title={center.company_legal_name}>
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
              <p className="text-zinc-200 font-semibold truncate" title={center.holder_name || undefined}>
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
            aria-label={`Copiar ${platformConfig.idLabel}`}
            className={`p-2 rounded-lg border transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400 ${idTheme.copyBtn}`}
            title="Copiar ID"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Meta linked account info */}
        {center.platform === 'meta' &&
          (center.meta_linked_network ||
            center.meta_instagram_account_id ||
            center.meta_facebook_account_id) && (
            <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs">
              {(center.meta_linked_network === 'instagram' ||
                center.meta_linked_network === 'both' ||
                center.meta_instagram_account_id) && (
                <span className="flex items-center gap-1.5 text-pink-300 font-medium">
                  <InstagramLogo className="w-3.5 h-3.5 flex-shrink-0" />
                  Instagram
                </span>
              )}
              {center.meta_linked_network === 'both' && (
                <span className="text-zinc-500">•</span>
              )}
              {(center.meta_linked_network === 'facebook' ||
                center.meta_linked_network === 'both' ||
                center.meta_facebook_account_id) && (
                <span className="flex items-center gap-1.5 text-blue-300 font-medium">
                  <FacebookLogo className="w-3.5 h-3.5 flex-shrink-0" />
                  Facebook
                </span>
              )}
              <span className="text-zinc-400 text-[11px]">vinculado(s)</span>
            </div>
          )}

        {/* Notes if any */}
        {center.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2 italic" title={center.notes}>
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
            title="Ver contas de anúncios vinculadas"
          >
            <span>
              {center.ad_account_count} vinculada{center.ad_account_count !== 1 ? 's' : ''}
            </span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }
);

BusinessCenterCard.displayName = 'BusinessCenterCard';
