import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { AdAccountStatus } from '@/types/adAccounts';

interface AdAccountStatusBadgeProps {
  status: AdAccountStatus;
  className?: string;
}

export const AdAccountStatusBadge: React.FC<AdAccountStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const config: Record<AdAccountStatus, { label: string; className: string }> = {
    active: {
      label: 'Ativa',
      className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
    },
    paused: {
      label: 'Pausada',
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20',
    },
    disabled: {
      label: 'Desativada',
      className: 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/20',
    },
    archived: {
      label: 'Arquivada',
      className: 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-800',
    },
  };

  const current = config[status] ?? config.active;

  return (
    <Badge
      variant="outline"
      className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors ${current.className} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 inline-block" />
      {current.label}
    </Badge>
  );
};
