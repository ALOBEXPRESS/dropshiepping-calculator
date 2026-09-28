import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone, Layers, DollarSign, Wallet } from 'lucide-react';
import type { AdAccountWithStats } from '@/types/adAccounts';

interface AdAccountSummaryCardsProps {
  accounts: AdAccountWithStats[];
}

export const AdAccountSummaryCards: React.FC<AdAccountSummaryCardsProps> = ({ accounts }) => {
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((a) => a.status === 'active').length;
  const totalCampaigns = accounts.reduce((acc, a) => acc + a.campaign_count, 0);
  const totalSpend = accounts.reduce((acc, a) => acc + a.total_spend, 0);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Contas */}
      <Card className="bg-card/70 backdrop-blur-sm border-border/80 shadow-sm hover:border-orange-500/30 transition-all duration-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Contas de Anúncios
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground">{totalAccounts}</span>
              <span className="text-xs text-emerald-400 font-medium">
                ({activeAccounts} ativas)
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Layers className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* Campanhas Vinculadas */}
      <Card className="bg-card/70 backdrop-blur-sm border-border/80 shadow-sm hover:border-blue-500/30 transition-all duration-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Campanhas Vinculadas
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground">{totalCampaigns}</span>
              <span className="text-xs text-muted-foreground">no total</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Megaphone className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* Gasto Derivado */}
      <Card className="bg-card/70 backdrop-blur-sm border-border/80 shadow-sm hover:border-amber-500/30 transition-all duration-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Investimento Registrado
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground">{formatBRL(totalSpend)}</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* Saldo na Plataforma */}
      <Card className="bg-card/70 backdrop-blur-sm border-border/80 shadow-sm hover:border-purple-500/30 transition-all duration-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Saldo em Conta
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-muted-foreground/80">—</span>
              <span className="text-[11px] text-muted-foreground/60">(via sync TikTok)</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Wallet className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
