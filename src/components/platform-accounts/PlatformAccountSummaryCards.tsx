import React from 'react';

export interface PlatformAccountStats {
  total: number;
  googleAccounts: number;
  withEmail: number;
  countries: number;
}

interface PlatformAccountSummaryCardsProps {
  stats: PlatformAccountStats;
}

export const PlatformAccountSummaryCards: React.FC<PlatformAccountSummaryCardsProps> = React.memo(
  ({ stats }) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-1 transition-colors hover:border-zinc-700/80">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Total de Contas
          </p>
          <p className="text-2xl font-bold text-white tracking-tight">{stats.total}</p>
          <p className="text-[11px] text-zinc-500">Perfis cadastrados no sistema</p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-1 transition-colors hover:border-zinc-700/80">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Método Google
          </p>
          <p className="text-2xl font-bold text-blue-400 tracking-tight">
            {stats.googleAccounts}
          </p>
          <p className="text-[11px] text-zinc-500">Contas com histórico Google Ads</p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-1 transition-colors hover:border-zinc-700/80">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            E-mails Verificados
          </p>
          <p className="text-2xl font-bold text-emerald-400 tracking-tight">
            {stats.withEmail}
          </p>
          <p className="text-[11px] text-zinc-500">Com contato direto associado</p>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 space-y-1 transition-colors hover:border-zinc-700/80">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Países Ativos
          </p>
          <p className="text-2xl font-bold text-amber-400 tracking-tight">
            {stats.countries}
          </p>
          <p className="text-[11px] text-zinc-500">Territórios de operação</p>
        </div>
      </div>
    );
  }
);

PlatformAccountSummaryCards.displayName = 'PlatformAccountSummaryCards';
