import React from 'react';
import { getPlatformLogo, getPlatformColor } from '@/components/ui/PlatformLogos';

interface BusinessCenterSummaryCardsProps {
  totalCenters: number;
  totalLinkedAccounts: number;
  platformCounts: Record<string, number>;
}

export const BusinessCenterSummaryCards: React.FC<BusinessCenterSummaryCardsProps> = React.memo(
  ({ totalCenters, totalLinkedAccounts, platformCounts }) => {
    const activePlatforms = Object.entries(platformCounts);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total de Business Centers */}
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1 transition-colors hover:border-border">
          <p className="text-xs text-muted-foreground">Total de Business Centers</p>
          <p className="text-2xl font-bold text-foreground">{totalCenters}</p>
        </div>

        {/* Card 2: Contas de Anúncio Vinculadas */}
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1 transition-colors hover:border-border">
          <p className="text-xs text-muted-foreground">Contas de Anúncio Vinculadas</p>
          <p className="text-2xl font-bold text-purple-400">{totalLinkedAccounts}</p>
        </div>

        {/* Card 3: Plataformas Ativas */}
        <div className="rounded-xl border border-border/80 bg-card/40 p-4 space-y-1 transition-colors hover:border-border">
          <p className="text-xs text-muted-foreground">Plataformas Ativas</p>
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {activePlatforms.map(([platform, count]) => {
              const Logo = getPlatformLogo(platform);
              const color = getPlatformColor(platform);
              return (
                <div
                  key={platform}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent/40 border border-border/60"
                >
                  <Logo className={`w-4 h-4 ${color}`} />
                  <span className="text-xs font-semibold text-foreground capitalize">
                    {platform}
                  </span>
                  <span className="text-[10px] text-muted-foreground">({count})</span>
                </div>
              );
            })}
            {activePlatforms.length === 0 && (
              <span className="text-sm text-muted-foreground">Nenhuma</span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

BusinessCenterSummaryCards.displayName = 'BusinessCenterSummaryCards';
