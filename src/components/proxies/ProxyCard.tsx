import React, { memo } from 'react';
import ReactCountryFlag from 'react-country-flag';
import {
  Pencil,
  Trash2,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Server,
  Link2,
  Unlink,
} from 'lucide-react';
import { ProviderLogo } from '@/components/ui/ProviderLogo';
import type { PlatformAccount } from '@/types/platformAccounts';
import type { Proxy } from '@/types/proxies';
import {
  PROXY_PROTOCOL_LABELS,
  PROXY_TYPE_LABELS,
  PROXY_STATUS_LABELS,
  PROXY_STATUS_COLORS,
} from '@/types/proxies';

export interface ProxyCardProps {
  proxy: Proxy;
  providerName?: string | null;
  linkedAccount?: PlatformAccount | null;
  onEdit: () => void;
  onDelete: () => void;
  onUnlink?: () => void;
}

export const ProxyCard: React.FC<ProxyCardProps> = memo(({
  proxy,
  providerName,
  linkedAccount,
  onEdit,
  onDelete,
  onUnlink,
}) => {
  const statusColor = PROXY_STATUS_COLORS[proxy.status];
  const displayProvider = providerName || proxy.provider;

  return (
    <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3 hover:border-input/60 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <ProviderLogo
            name={displayProvider || ''}
            className="w-10 h-10 rounded-xl"
            size="md"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{proxy.label}</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
              <span>
                {PROXY_PROTOCOL_LABELS[proxy.protocol]} ·{' '}
                {PROXY_TYPE_LABELS[proxy.proxy_type] || proxy.proxy_type}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono font-medium">
                {(proxy.ip_version || 'ipv4').toUpperCase()}
              </span>
              {proxy.country && (
                <span className="inline-flex items-center gap-1">
                  ·
                  <ReactCountryFlag countryCode={proxy.country} svg style={{ width: '1em', height: '1em' }} />
                  {proxy.country}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}
          >
            {PROXY_STATUS_LABELS[proxy.status]}
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Editar proxy"
            aria-label={`Editar proxy ${proxy.label}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
            title="Excluir proxy"
            aria-label={`Excluir proxy ${proxy.label}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Connection details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Server className="w-3 h-3 flex-shrink-0" />
          <span className="truncate font-mono">
            {proxy.host}:{proxy.port}
          </span>
        </div>
        {proxy.username && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Globe className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{proxy.username}</span>
          </div>
        )}
        {displayProvider && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ProviderLogo name={displayProvider} className="w-3.5 h-3.5 rounded" size="sm" />
            <span className="truncate">{displayProvider}</span>
          </div>
        )}
        {proxy.expires_at && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>
              {new Intl.DateTimeFormat('pt-BR').format(new Date(proxy.expires_at))}
            </span>
          </div>
        )}
      </div>

      {/* Linked account */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/60">
        {linkedAccount ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] text-emerald-400 flex-1 truncate flex items-center gap-1.5">
              <span>Vinculado a:</span>
              <span className="font-medium text-foreground">{linkedAccount.name}</span>
            </span>
            {onUnlink && (
              <button
                type="button"
                onClick={onUnlink}
                className="text-[10px] flex items-center gap-1 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                title="Desvincular conta deste proxy"
                aria-label={`Desvincular conta ${linkedAccount.name} do proxy ${proxy.label}`}
              >
                <Unlink className="w-3 h-3" />
                Desvincular
              </button>
            )}
          </>
        ) : (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground/60 flex-1">Sem conta vinculada</span>
            <button
              type="button"
              onClick={onEdit}
              className="text-[10px] flex items-center gap-1 text-orange-400/80 hover:text-orange-400 hover:underline transition-colors cursor-pointer"
              aria-label={`Vincular conta ao proxy ${proxy.label}`}
            >
              <Link2 className="w-3 h-3" />
              Vincular
            </button>
          </>
        )}
      </div>
    </div>
  );
});

ProxyCard.displayName = 'ProxyCard';
