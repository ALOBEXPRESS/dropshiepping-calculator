import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Megaphone,
  Plus,
  User,
  ArrowLeft,
  ArrowRight,
  Search,
  CheckCircle2,
  Building2,
  Wallet,
} from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { useAdAccounts } from '@/hooks/useAdAccounts';
import { AdAccountStatusBadge } from '@/components/ad-accounts/AdAccountStatusBadge';
import type { AdAccountWithStats } from '@/types/adAccounts';
import type { CampaignMarketplace } from '@/types/campaigns';
import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';

interface AdAccountPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketplace: CampaignMarketplace;
  organizationId: string;
  onSelect: (adAccountId: string | null) => void;
  onBack: () => void;
  onCreateNewAccount?: () => void;
}

export const AdAccountPickerModal: React.FC<AdAccountPickerModalProps> = ({
  open,
  onOpenChange,
  marketplace,
  organizationId,
  onSelect,
  onBack,
  onCreateNewAccount,
}) => {
  const { adAccounts, isLoading } = useAdAccounts(organizationId);
  const [searchTerm, setSearchTerm] = useState('');

  const formatBRL = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '0,00';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(val);
  };

  const filteredAccounts = adAccounts.filter((acc) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchName = acc.name.toLowerCase().includes(term);
    const matchId = (acc.advertiser_id || '').toLowerCase().includes(term);
    const matchProfile = (acc.platform_account?.name || '').toLowerCase().includes(term) ||
      (acc.platform_account?.nickname || '').toLowerCase().includes(term);
    return matchName || matchId || matchProfile;
  });

  const handleSelectAccount = (id: string | null) => {
    onSelect(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white p-6 max-h-[88vh] flex flex-col">
        <DialogHeader className="pb-2 border-b border-zinc-800/80">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center p-2 flex-shrink-0">
                <img
                  src={tiktokImg}
                  alt={marketplace}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
                  Selecione a Conta de Anúncios
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-xs mt-0.5">
                  Vincule sua nova campanha à conta com perfil associado para sincronizar métricas e saldo.
                </DialogDescription>
              </div>
            </div>
            {onCreateNewAccount && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onCreateNewAccount();
                }}
                className="bg-zinc-900/80 border-zinc-700 hover:border-orange-500/50 hover:bg-orange-500/10 text-xs text-zinc-200 h-8 gap-1.5 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-orange-400" />
                Nova Conta
              </Button>
            )}
          </div>

          {/* Search bar */}
          {adAccounts.length > 3 && (
            <div className="relative mt-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input
                type="text"
                placeholder="Buscar por nome, advertiser ID ou perfil TikTok..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 bg-zinc-900/60 border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:border-orange-500/60"
              />
            </div>
          )}
        </DialogHeader>

        {/* List of Accounts */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {isLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 animate-pulse space-y-2"
                >
                  <div className="h-4 bg-zinc-800 rounded w-1/3" />
                  <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredAccounts.length === 0 && searchTerm ? (
            <div className="text-center py-8 text-zinc-400 text-xs">
              Nenhuma conta de anúncios encontrada para "{searchTerm}".
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAccounts.map((acc: AdAccountWithStats) => (
                <div
                  key={acc.id}
                  onClick={() => handleSelectAccount(acc.id)}
                  className="group relative flex flex-col gap-2.5 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900 hover:border-orange-500/50 transition-all duration-150 cursor-pointer shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center p-1.5 flex-shrink-0 group-hover:border-orange-500/30 transition-colors">
                        <img
                          src={tiktokImg}
                          alt="TikTok"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors truncate">
                            {acc.name}
                          </span>
                          <AdAccountStatusBadge status={acc.status} />
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                          ID: {acc.advertiser_id || 'Não configurado'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[11px] font-medium text-orange-400">
                        R$ {formatBRL(acc.total_spend)}
                      </span>
                      <p className="text-[10px] text-zinc-500">Gasto registrado</p>
                    </div>
                  </div>

                  {/* Linked Platform Account Profile */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/60 text-xs">
                    {acc.platform_account ? (
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-950/70 border border-zinc-800 text-[11px] text-zinc-300 min-w-0">
                        {acc.platform_account.profile_photo_url ? (
                          <img
                            src={acc.platform_account.profile_photo_url}
                            alt={acc.platform_account.name}
                            className="w-4 h-4 rounded-full object-cover border border-zinc-700 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            <User className="w-2.5 h-2.5 text-zinc-400" />
                          </div>
                        )}
                        <span className="font-medium text-white truncate max-w-[120px]">
                          {acc.platform_account.name}
                        </span>
                        {acc.platform_account.country && (
                          <ReactCountryFlag
                            countryCode={acc.platform_account.country}
                            svg
                            style={{ width: '0.85em', height: '0.85em' }}
                          />
                        )}
                        {acc.platform_account.nickname && (
                          <span className="text-[10px] text-zinc-400 font-mono truncate">
                            @{acc.platform_account.nickname}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic">
                        Perfil TikTok: Não vinculado
                      </span>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span>{acc.campaign_count} {acc.campaign_count === 1 ? 'campanha' : 'campanhas'}</span>
                      <span className="text-zinc-600">•</span>
                      <span>
                        {acc.spending_limit
                          ? `Limite: R$ ${formatBRL(acc.spending_limit)}`
                          : 'Sem limite'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all ml-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Option: Avulsa (Sem Conta Vinculada) */}
          <div
            onClick={() => handleSelectAccount(null)}
            className="group relative flex items-center justify-between p-3.5 rounded-xl border border-dashed border-zinc-700/80 bg-zinc-900/30 hover:border-zinc-500 hover:bg-zinc-900/60 transition-all cursor-pointer mt-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-400 group-hover:text-zinc-200">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                  Criar Campanha Avulsa (Sem Conta Vinculada)
                </p>
                <p className="text-[11px] text-zinc-500">
                  Configure a campanha sem vincular a nenhuma conta de anúncios agora.
                </p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 gap-1.5 h-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Marketplace
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 h-8"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
