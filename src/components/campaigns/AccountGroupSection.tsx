import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Megaphone, ChevronDown, User } from 'lucide-react';
import ReactCountryFlag from 'react-country-flag';
import { AdAccountStatusBadge } from '@/components/ad-accounts/AdAccountStatusBadge';
import type { AdAccountWithStats } from '@/types/adAccounts';
import type { CampaignWithRelations } from '@/types/campaigns';
import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';

interface AccountGroupSectionProps {
  groupKey: string;
  account?: AdAccountWithStats | CampaignWithRelations['ad_account'];
  count: number;
  marketingCost: number;
  budget: number;
  formatBRL: (v: number) => string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const AccountGroupSection: React.FC<AccountGroupSectionProps> = ({
  account,
  count,
  marketingCost,
  budget,
  formatBRL,
  defaultOpen = true,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const bodyRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const bodyEl = bodyRef.current;
    const chevronEl = chevronRef.current;

    if (bodyEl) {
      if (!defaultOpen) {
        gsap.set(bodyEl, { height: 0, opacity: 0, overflow: 'hidden' });
      } else {
        gsap.set(bodyEl, { height: 'auto', opacity: 1, overflow: 'visible' });
      }
    }
    if (chevronEl) {
      gsap.set(chevronEl, { rotation: defaultOpen ? 0 : -90 });
    }
    return () => {
      if (bodyEl) gsap.killTweensOf(bodyEl);
      if (chevronEl) gsap.killTweensOf(chevronEl);
    };
  }, [defaultOpen]);

  const toggle = () => {
    const el = bodyRef.current;
    if (!el) {
      setOpen((v) => !v);
      return;
    }
    if (!open) {
      setOpen(true);
      gsap.fromTo(
        el,
        { height: 0, opacity: 0 },
        {
          height: 'auto',
          opacity: 1,
          duration: 0.35,
          ease: 'power2.out',
          onComplete: () => {
            el.style.height = 'auto';
          },
        }
      );
      gsap.to(chevronRef.current, { rotation: 0, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.28,
        ease: 'power2.in',
        onComplete: () => setOpen(false),
      });
      gsap.to(chevronRef.current, { rotation: -90, duration: 0.28, ease: 'power2.in' });
    }
  };

  const isUnassigned = !account;

  return (
    <div className="space-y-2.5">
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card/60 border border-border hover:border-zinc-700 hover:bg-card/90 transition-all cursor-pointer text-left shadow-sm group select-none"
        aria-expanded={open}
      >
        {/* Left: Account Icon, Name, Profile Badge, Advertiser ID */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center p-1.5 flex-shrink-0 group-hover:border-orange-500/40 transition-colors">
            {isUnassigned ? (
              <Megaphone className="w-4 h-4 text-zinc-400" />
            ) : (
              <img src={tiktokImg} alt="TikTok Ads" className="w-full h-full object-contain" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors truncate">
                {isUnassigned ? 'Campanhas Avulsas (Sem Conta Vinculada)' : account.name}
              </span>
              {!isUnassigned && account.status && (
                <AdAccountStatusBadge status={account.status} />
              )}
              <span className="text-[10px] bg-background text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                {count} {count === 1 ? 'campanha' : 'campanhas'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {/* Profile badge if linked */}
              {!isUnassigned && account.platform_account ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-300">
                  {account.platform_account.profile_photo_url ? (
                    <img
                      src={account.platform_account.profile_photo_url}
                      alt={account.platform_account.name}
                      className="w-3.5 h-3.5 rounded-full object-cover border border-zinc-700 flex-shrink-0"
                    />
                  ) : (
                    <User className="w-3 h-3 text-zinc-400" />
                  )}
                  <span className="font-medium text-white truncate max-w-[120px]">
                    {account.platform_account.name}
                  </span>
                  {account.platform_account.country && (
                    <ReactCountryFlag
                      countryCode={account.platform_account.country}
                      svg
                      style={{ width: '0.8em', height: '0.8em' }}
                    />
                  )}
                  {account.platform_account.nickname && (
                    <span className="text-[10px] text-zinc-400 font-mono truncate">
                      @{account.platform_account.nickname}
                    </span>
                  )}
                </div>
              ) : !isUnassigned ? (
                <span className="text-[10px] text-zinc-500 font-mono">
                  ID: {account.advertiser_id || 'Não configurado'}
                </span>
              ) : (
                <span className="text-[10px] text-zinc-500">
                  Campanhas não associadas a nenhuma conta de anúncios
                </span>
              )}

              {!isUnassigned && account.platform_account && account.advertiser_id && (
                <span className="text-[10px] text-zinc-500 font-mono hidden md:inline">
                  • ID: {account.advertiser_id}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Marketing Cost of Account + Budget + Chevron */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
              Custo de Marketing
            </p>
            <p className="text-xs font-bold text-orange-400">
              R$ {formatBRL(marketingCost)}
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
              Orçamento
            </p>
            <p className="text-xs font-medium text-zinc-300">
              R$ {formatBRL(budget)}
            </p>
          </div>

          <ChevronDown
            ref={chevronRef}
            className="w-4 h-4 text-muted-foreground transition-transform"
            style={{ transform: 'rotate(0deg)' }}
          />
        </div>
      </div>

      <div ref={bodyRef} style={{ overflow: 'hidden' }}>
        {open && <div className="grid gap-3 pt-1">{children}</div>}
      </div>
    </div>
  );
};
