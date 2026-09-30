import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  Megaphone,
  Clock,
  Building2,
  PauseCircle,
  PlayCircle,
  Archive,
  Wallet,
  User,
  Unlink,
} from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { AdAccountStatusBadge } from './AdAccountStatusBadge';
import type { AdAccountWithStats, AdAccountStatus } from '@/types/adAccounts';
import { getPlatformLogo, getPlatformColor } from '@/components/ui/PlatformLogos';

interface AdAccountCardProps {
  account: AdAccountWithStats;
  onEdit: (account: AdAccountWithStats) => void;
  onStatusChange: (id: string, status: AdAccountStatus) => void;
  onDelete: (account: AdAccountWithStats) => void;
  onUnlinkPlatformAccount?: (accountId: string) => void | Promise<void>;
}

export const AdAccountCard: React.FC<AdAccountCardProps> = ({
  account,
  onEdit,
  onStatusChange,
  onDelete,
  onUnlinkPlatformAccount,
}) => {
  const navigate = useNavigate();

  const PlatformIcon = getPlatformLogo(account.platform);
  const platformColor = getPlatformColor(account.platform);

  const formatBRL = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: account.currency || 'BRL' }).format(val);
  };

  const formattedSyncDate = account.last_synced_at
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(account.last_synced_at))
    : '—';

  return (
    <Card className="bg-card/70 backdrop-blur-sm border-border hover:border-orange-500/40 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm group">
      <div>
        {/* Header */}
        <CardHeader className="p-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center p-2 flex-shrink-0 shadow-inner">
                <PlatformIcon className={`w-5 h-5 ${platformColor}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold text-foreground truncate group-hover:text-orange-400 transition-colors">
                    {account.name}
                  </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground truncate font-mono mt-0.5">
                  ID: {account.advertiser_id || 'Não configurado'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <AdAccountStatusBadge status={account.status} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Opções da conta"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                  <DropdownMenuItem
                    onClick={() => onEdit(account)}
                    className="gap-2 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                    Editar Conta
                  </DropdownMenuItem>

                  {account.status !== 'active' && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange(account.id, 'active')}
                      className="gap-2 text-emerald-400 cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Ativar Conta
                    </DropdownMenuItem>
                  )}

                  {account.status === 'active' && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange(account.id, 'paused')}
                      className="gap-2 text-amber-400 cursor-pointer"
                    >
                      <PauseCircle className="w-4 h-4" />
                      Pausar Conta
                    </DropdownMenuItem>
                  )}

                  {account.status !== 'archived' && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange(account.id, 'archived')}
                      className="gap-2 text-zinc-400 cursor-pointer"
                    >
                      <Archive className="w-4 h-4" />
                      Arquivar Conta
                    </DropdownMenuItem>
                  )}

                  {account.platform_account_id && onUnlinkPlatformAccount && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onUnlinkPlatformAccount(account.id)}
                        className="gap-2 text-zinc-300 hover:text-white cursor-pointer"
                      >
                        <Unlink className="w-4 h-4 text-zinc-400" />
                        Desvincular Perfil TikTok
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(account)}
                    className="gap-2 text-rose-400 focus:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir Conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {/* Content Details */}
        <CardContent className="px-5 py-3 space-y-3.5 text-xs">
          {/* Perfil TikTok Vinculado */}
          {account.platform_account ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-300">
              {account.platform_account.profile_photo_url ? (
                <img
                  src={account.platform_account.profile_photo_url}
                  alt={account.platform_account.name}
                  className="w-4 h-4 rounded-full object-cover border border-zinc-700 flex-shrink-0"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <User className="w-2.5 h-2.5 text-zinc-400" />
                </div>
              )}
              <span className="font-semibold text-white truncate max-w-[130px]">
                {account.platform_account.name}
              </span>
              <ReactCountryFlag
                countryCode={account.platform_account.country}
                svg
                style={{ width: '0.9em', height: '0.9em' }}
              />
              {account.platform_account.nickname && (
                <span className="text-[10px] text-zinc-500 font-mono truncate">
                  @{account.platform_account.nickname}
                </span>
              )}
              {onUnlinkPlatformAccount && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnlinkPlatformAccount(account.id);
                  }}
                  title="Desvincular perfil TikTok desta conta de anúncios"
                  className="ml-auto text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                >
                  <Unlink className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-md bg-zinc-900/40 border border-zinc-800/60 text-[10px] text-zinc-500 flex items-center justify-between">
              <span>Perfil TikTok: Não vinculado</span>
              <span className="text-[9px] text-zinc-600">Opcional</span>
            </div>
          )}

          {/* Business Center & Fuso */}
          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/70" />
              <span
                className="truncate"
                title={
                  account.business_center?.name
                    ? `${account.business_center.name} (${account.business_center.bc_id})`
                    : account.business_center_id ?? 'Sem BC'
                }
              >
                BC: {account.business_center?.name || account.business_center_id || '—'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0 justify-end">
              <Clock className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/70" />
              <span className="truncate">{account.timezone.replace('America/', '')}</span>
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* Métricas e Finanças */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                Gasto Registrado
              </span>
              <p className="text-sm font-semibold text-foreground">
                {formatBRL(account.total_spend)}
              </p>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                Limite de Gasto
              </span>
              <p className="text-sm font-semibold text-foreground">
                {account.spending_limit ? formatBRL(account.spending_limit) : 'Sem limite'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-medium flex items-center gap-1">
                <Wallet className="w-3 h-3" /> Saldo
              </span>
              <p className="text-xs font-medium text-muted-foreground/70">—</p>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">
                Último Sync
              </span>
              <p className="text-xs font-medium text-muted-foreground/70">
                {formattedSyncDate}
              </p>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Footer */}
      <CardFooter className="px-5 py-3 bg-muted/20 border-t border-border/80 flex items-center justify-between gap-2">
        <Link
          to={`/campanhas?conta=${account.id}`}
          className="text-xs font-medium text-muted-foreground hover:text-orange-400 transition-colors inline-flex items-center gap-1.5"
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>{account.campaign_count} {account.campaign_count === 1 ? 'campanha' : 'campanhas'}</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/contas-anuncios/${account.id}`)}
          className="h-8 text-xs gap-1.5 border-border hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-400 transition-colors"
        >
          <span>Gerenciar</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
};
