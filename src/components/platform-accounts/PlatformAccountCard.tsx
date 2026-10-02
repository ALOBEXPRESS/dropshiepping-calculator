import React from 'react';
import { Link } from 'react-router-dom';
import ReactCountryFlag from 'react-country-flag';
import {
  User,
  Phone,
  Mail,
  MoreVertical,
  Edit2,
  Trash2,
  Shield,
  Compass,
  Building2,
  ExternalLink,
  Sparkles,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getSocialPlatformDetails } from '@/components/ui/PlatformLogos';
import {
  formatPhoneByCountry,
  formatCentsToCurrencyString,
} from '@/utils/inputMasks';
import {
  getSocialProfileUrl,
  getAccountDisplayEmail,
} from './platformAccountUtils';
import { useAccountLinkedBusinessCenters } from '@/hooks/useBusinessCenterAccounts';
import type { PlatformAccount } from '@/types/platformAccounts';

export interface LinkedBrowserProfile {
  id: string;
  name: string | null;
  external_profile_id: string | null;
}

interface PlatformAccountCardProps {
  account: PlatformAccount;
  proxyLabel?: string | null;
  browserProfiles?: LinkedBrowserProfile[];
  nicheLabel: string;
  onEdit: (account: PlatformAccount) => void;
  onDelete: (account: PlatformAccount) => void;
}

export const PlatformAccountCard: React.FC<PlatformAccountCardProps> = React.memo(
  ({
    account,
    proxyLabel,
    browserProfiles = [],
    nicheLabel,
    onEdit,
    onDelete,
  }) => {
    const social = getSocialPlatformDetails(account.platform, account.meta_account_type);
    const displayEmail = getAccountDisplayEmail(account);
    const profileUrl = getSocialProfileUrl(account);

    const isGoogle = account.platform === 'google';
    const { data: linkedBcs = [] } = useAccountLinkedBusinessCenters(account.id);
    const meta = account.platform_metadata;
    const googleMeta = isGoogle && meta?.signup_method === 'google' ? meta : null;

    const formattedCreationDate = account.created_at
      ? new Date(account.created_at).toLocaleDateString('pt-BR')
      : '—';

    const cleanNickname = account.nickname
      ? account.nickname.trim().replace(/^@/, '')
      : null;

    return (
      <div className="group relative rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/70 to-zinc-950 p-5 space-y-4 shadow-lg hover:border-zinc-700 transition-all hover:shadow-xl">
        {/* Header do Card: Avatar, Nomes e Dropdown */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              {/* Avatar da conta */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center p-0.5 shadow-inner">
                {account.profile_photo_url ? (
                  <img
                    src={account.profile_photo_url}
                    alt={account.name}
                    className="w-full h-full object-cover rounded-full"
                    loading="lazy"
                  />
                ) : (
                  <User className="w-6 h-6 text-zinc-400" />
                )}
              </div>

              {/* Mini Badge da Rede Social no topo esquerdo do avatar */}
              <div
                className={`absolute -top-1.5 -left-1.5 z-10 w-5 h-5 rounded-full bg-zinc-950 border ${social.avatarBadgeBorder} shadow-md flex items-center justify-center p-0.5`}
                title={`Rede Social: ${social.name}`}
              >
                <social.Logo className="w-3.5 h-3.5" />
              </div>

              {/* Bandeira do país no canto inferior direito */}
              <div className="absolute -bottom-1 -right-1 z-10 bg-zinc-950 rounded-full p-0.5 border border-zinc-700 shadow-md flex items-center justify-center leading-none">
                <ReactCountryFlag
                  countryCode={account.country}
                  svg
                  style={{
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm font-bold text-white truncate group-hover:text-brand transition-colors">
                  {account.name}
                </h4>
                {/* Badge da Rede Social */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${social.badgePill}`}
                  title={`Conta ${social.name}`}
                >
                  <social.Logo className="w-3 h-3 flex-shrink-0" />
                  <span>{social.name}</span>
                </span>
              </div>

              {/* Username / Apelido com link externo */}
              {cleanNickname ? (
                profileUrl ? (
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-zinc-400 hover:text-cyan-400 font-mono inline-flex items-center gap-1 hover:underline transition-colors group/link truncate max-w-full mt-0.5"
                    title={`Abrir perfil @${cleanNickname} no ${social.name} em nova aba`}
                  >
                    <span>@{cleanNickname}</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500 group-hover/link:text-cyan-400 opacity-80 group-hover/link:opacity-100 flex-shrink-0" />
                  </a>
                ) : (
                  <p className="text-xs text-zinc-400 truncate font-mono mt-0.5">
                    @{cleanNickname}
                  </p>
                )
              ) : (
                <p className="text-xs text-zinc-500 italic mt-0.5">Sem apelido</p>
              )}
            </div>
          </div>

          {/* Menu de Ações (Editar / Excluir) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Ações da conta ${account.name}`}
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg flex-shrink-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
              <DropdownMenuItem
                onClick={() => onEdit(account)}
                className="text-xs gap-2 cursor-pointer hover:bg-zinc-800"
              >
                <Edit2 className="w-3.5 h-3.5 text-zinc-300" />
                Editar Conta
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(account)}
                className="text-xs gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="h-px bg-zinc-800/60" />

        {/* Dados da Conta */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Rede Social:</span>
            <span className={`font-semibold flex items-center gap-1.5 ${social.badgeText}`}>
              <social.Logo className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{social.name}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Titular:</span>
            <span className="font-semibold text-zinc-200 truncate max-w-[170px]" title={account.holder_name}>
              {account.holder_name}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Nicho:</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
              {nicheLabel}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Método de Cadastro:</span>
            <span className="capitalize font-semibold text-zinc-300 flex items-center gap-1.5">
              {account.signup_method === 'google' && (
                <span className="w-2 h-2 rounded-full bg-blue-400" />
              )}
              {account.signup_method === 'apple' && (
                <span className="w-2 h-2 rounded-full bg-zinc-300" />
              )}
              {account.signup_method === 'email' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
              {account.signup_method}
            </span>
          </div>

          {displayEmail && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1">
                <Mail className="w-3 h-3 text-zinc-500" /> E-mail:
              </span>
              <span className="font-mono text-zinc-300 truncate max-w-[170px]" title={displayEmail}>
                {displayEmail}
              </span>
            </div>
          )}

          {account.phone && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-zinc-500" /> Telefone:
              </span>
              <span className="font-mono text-zinc-300">
                {formatPhoneByCountry(account.phone, account.country)}
              </span>
            </div>
          )}

          {/* Proxy vinculado */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-orange-400" /> Proxy:
            </span>
            {proxyLabel ? (
              <span
                className="font-medium text-orange-400 font-mono text-[11px] truncate max-w-[170px]"
                title={proxyLabel}
              >
                {proxyLabel}
              </span>
            ) : (
              <span className="text-zinc-500 italic text-[11px]">Nenhum</span>
            )}
          </div>

          {/* Perfil AdsPower vinculado */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" /> AdsPower:
            </span>
            {browserProfiles.length > 0 ? (
              <Link
                to={`/perfis-navegador?account=${account.id}`}
                className="font-medium text-cyan-400 font-mono text-[11px] truncate max-w-[170px] hover:underline flex items-center gap-1"
                title={browserProfiles.map((p) => p.name || p.external_profile_id).join(', ')}
              >
                <span className="truncate">
                  {browserProfiles[0].name || browserProfiles[0].external_profile_id || 'Perfil AdsPower'}
                </span>
                {browserProfiles.length > 1 && (
                  <span className="text-[10px] text-cyan-300">
                    (+{browserProfiles.length - 1})
                  </span>
                )}
              </Link>
            ) : (
              <Link
                to={`/perfis-navegador?newFor=${account.id}`}
                className="text-zinc-500 hover:text-cyan-400 italic text-[11px] hover:underline"
              >
                + Vincular perfil
              </Link>
            )}
          </div>

          {/* Business Centers Vinculados (N:N) */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-purple-400" /> Business Center:
            </span>
            {linkedBcs.length > 0 ? (
              <span
                className="font-medium text-purple-400 font-mono text-[11px] truncate max-w-[170px] flex items-center gap-1"
                title={linkedBcs
                  .map(
                    (b) =>
                      `${b.relationship_type === 'owner' ? '👑 ' : ''}${
                        b.business_centers?.name || b.business_centers?.bc_id
                      }`
                  )
                  .join(', ')}
              >
                {linkedBcs[0].relationship_type === 'owner' && '👑 '}
                <span className="truncate">
                  {linkedBcs[0].business_centers?.name ||
                    linkedBcs[0].business_centers?.bc_id ||
                    'Business Center'}
                </span>
                {linkedBcs.length > 1 && (
                  <span className="text-[10px] text-purple-300">
                    (+{linkedBcs.length - 1})
                  </span>
                )}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onEdit(account)}
                className="text-zinc-500 hover:text-purple-400 italic text-[11px] hover:underline"
              >
                + Vincular BC
              </button>
            )}
          </div>

          {/* Informações adicionais Google Ads */}
          {googleMeta && (
            <div className="mt-2.5 p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-blue-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Idade da Conta:
                </span>
                <span className="font-bold text-white">
                  {googleMeta.account_age_years != null
                    ? `${googleMeta.account_age_years} anos`
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-blue-300 flex items-center gap-1">
                  <Coins className="w-3 h-3" /> Investido Google Ads:
                </span>
                <span className="font-bold text-amber-400 font-mono">
                  {googleMeta.google_ads_invested_brl != null
                    ? `${googleMeta.google_ads_currency || 'BRL'} ${formatCentsToCurrencyString(
                        Math.round(googleMeta.google_ads_invested_brl * 100),
                        googleMeta.google_ads_currency || 'BRL'
                      )}`
                    : '—'}
                </span>
              </div>
            </div>
          )}

          {/* Bio descritiva */}
          {account.bio && (
            <p className="text-[11px] text-zinc-400 line-clamp-2 italic pt-1 border-t border-zinc-800/40">
              "{account.bio}"
            </p>
          )}
        </div>

        {/* Footer do Card com Botão de Ação Direta */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-zinc-800/60">
          <span className="text-[10px] text-zinc-500">
            Criado em {formattedCreationDate}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(account)}
            aria-label={`Editar conta ${account.name}`}
            className="h-7 text-xs border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:text-white hover:bg-zinc-800 px-3"
          >
            <Edit2 className="w-3 h-3 mr-1" />
            Editar
          </Button>
        </div>
      </div>
    );
  }
);

PlatformAccountCard.displayName = 'PlatformAccountCard';
