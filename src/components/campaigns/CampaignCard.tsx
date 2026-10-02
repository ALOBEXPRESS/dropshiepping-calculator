import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Megaphone, Pencil, Trash2, ChevronDown, Calendar } from 'lucide-react';
import type { CampaignWithRelations } from '@/types/campaigns';
import { getObjectiveLabel } from '@/types/campaigns';
import { AdSetsSection } from './AdSetsSection';
import { calculateCampaignMarketingCost, formatBRL } from './campaignsUtils';

interface CampaignCardProps {
  campaign: CampaignWithRelations;
  statusConfig: { label: string; className: string };
  logo: string | undefined;
  adSets: CampaignWithRelations['campaign_ad_sets'];
  onEdit: () => void;
  onDelete: () => void;
  organizationId?: string;
}

const MARKETPLACE_LABELS: Record<string, string> = {
  tiktok: 'TikTok Shop',
  mercadolivre: 'Mercado Livre',
  amazon: 'Amazon',
  shein: 'Shein',
};

const AUDIENCE_MODE_LABELS: Record<string, string> = {
  auto: 'Automático (Smart+)',
  manual: 'Manual',
  saved: 'Audiência Salva',
};

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign: c,
  statusConfig: sc,
  logo,
  adSets,
  onEdit,
  onDelete,
  organizationId,
}) => {
  const [expanded, setExpanded] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);

  // Period from first adSet with dates
  const firstAdSetWithDates = adSets.find((a) => a.start_date || a.end_date);
  const formatDate = (d: string | null | undefined) =>
    d
      ? new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        }).format(new Date(d))
      : null;

  const periodStart = formatDate(firstAdSetWithDates?.start_date);
  const periodEnd = formatDate(firstAdSetWithDates?.end_date);
  const periodStr =
    periodStart && periodEnd
      ? `${periodStart} – ${periodEnd}`
      : periodStart
        ? `A partir de ${periodStart}`
        : periodEnd
          ? `Até ${periodEnd}`
          : null;

  const totalCusto = calculateCampaignMarketingCost(c);

  // GSAP expand/collapse
  const toggle = () => {
    const el = bodyRef.current;
    if (!el) {
      setExpanded((v) => !v);
      return;
    }
    if (!expanded) {
      setExpanded(true);
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
      gsap.to(chevronRef.current, { rotation: 180, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.28,
        ease: 'power2.in',
        onComplete: () => setExpanded(false),
      });
      gsap.to(chevronRef.current, { rotation: 0, duration: 0.28, ease: 'power2.in' });
    }
  };

  useEffect(() => {
    const bodyEl = bodyRef.current;
    const chevronEl = chevronRef.current;

    if (bodyEl) {
      gsap.set(bodyEl, { height: 0, opacity: 0, overflow: 'hidden' });
    }
    return () => {
      if (bodyEl) gsap.killTweensOf(bodyEl);
      if (chevronEl) gsap.killTweensOf(chevronEl);
    };
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card/40 overflow-hidden transition-colors hover:border-input/70">
      {/* ── Collapsed header (always visible) ── */}
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
        className="w-full text-left cursor-pointer select-none"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          {/* Marketplace logo */}
          <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center flex-shrink-0 overflow-hidden p-1 shadow-sm border border-zinc-800/80">
            {logo ? (
              <img src={logo} alt={c.marketplace} className="w-full h-full object-contain" />
            ) : (
              <Megaphone className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          {/* Title + badges */}
          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white truncate max-w-[340px]">
              {c.name}
            </span>
            <span className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30">
              {MARKETPLACE_LABELS[c.marketplace] ?? c.marketplace}
            </span>
            {c.ad_account && (
              <span className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {c.ad_account.name}
              </span>
            )}
            <span
              className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${sc.className}`}
            >
              {sc.label}
            </span>
          </div>

          {/* Actions + chevron */}
          <div
            className="flex items-center gap-1 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Editar campanha"
              onClick={onEdit}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Excluir campanha"
              onClick={onDelete}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-400 hover:bg-background transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <ChevronDown
            ref={chevronRef}
            className="w-4 h-4 text-muted-foreground flex-shrink-0"
            style={{ transform: 'rotate(0deg)' }}
          />
        </div>
      </div>

      {/* ── Expanded body (GSAP-animated) ── */}
      <div ref={bodyRef} style={{ overflow: 'hidden' }}>
        {expanded && (
          <div className="border-t border-border">
            {/* Details row */}
            <div className="px-4 py-3 space-y-1.5 bg-background/20">
              <p className="text-xs text-muted-foreground">
                Objetivo: <span className="text-foreground">{getObjectiveLabel(c.objective)}</span>
                {' · '}
                Orçamento:{' '}
                <span className="text-foreground">
                  {c.budget_type === 'daily' ? 'Diário' : 'Vitalício'}
                  {c.budget_amount != null ? ` · R$ ${formatBRL(Number(c.budget_amount))}` : ''}
                </span>
                {totalCusto > 0 && (
                  <>
                    {' · '}Custo:{' '}
                    <span className="text-orange-400 font-medium">R$ {formatBRL(totalCusto)}</span>
                  </>
                )}
                {c.ad_account && (
                  <>
                    {' · '}Conta:{' '}
                    <span className="text-cyan-300 font-medium">{c.ad_account.name}</span>
                  </>
                )}
              </p>

              {periodStr && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                  {periodStr}
                </p>
              )}

              {c.campaign_products && c.campaign_products.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {c.campaign_products.length} produto(s) vinculado(s)
                </p>
              )}
            </div>

            {/* Ad Sets accordion */}
            <AdSetsSection
              adSets={adSets}
              campaign={c}
              audienceModeLabel={AUDIENCE_MODE_LABELS}
              formatBRL={formatBRL}
              organizationId={organizationId}
              marketingCost={totalCusto}
            />
          </div>
        )}
      </div>
    </div>
  );
};
