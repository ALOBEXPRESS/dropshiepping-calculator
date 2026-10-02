import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ChevronDown } from 'lucide-react';
import type { CampaignWithRelations } from '@/types/campaigns';
import { AdCreativeAccordion } from './AdCreativeAccordion';

interface AdSetsSectionProps {
  adSets: CampaignWithRelations['campaign_ad_sets'];
  campaign: CampaignWithRelations;
  audienceModeLabel: Record<string, string>;
  formatBRL: (v: number) => string;
  organizationId?: string;
  marketingCost?: number;
}

const DESTINATION_LABELS: Record<string, string> = {
  site: 'Site',
  app: 'Aplicativo',
  tiktok_shop: 'Loja TikTok',
};

const GOAL_LABELS: Record<string, string> = {
  click: 'Clique',
  landing_page_view: 'Visualização pg inicial',
  engagement_session: 'Sessão de Engajamento',
  roi: 'Meta de ROI',
};

export const AdSetsSection: React.FC<AdSetsSectionProps> = ({
  adSets,
  campaign: c,
  audienceModeLabel,
  formatBRL,
  organizationId,
  marketingCost = 0,
}) => {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);

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
          duration: 0.32,
          ease: 'power2.out',
          onComplete: () => {
            el.style.height = 'auto';
          },
        }
      );
      gsap.to(chevronRef.current, { rotation: 180, duration: 0.28, ease: 'power2.out' });
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => setOpen(false),
      });
      gsap.to(chevronRef.current, { rotation: 0, duration: 0.25, ease: 'power2.in' });
    }
  };

  return (
    <div>
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
        className="w-full flex items-center justify-between px-4 py-2.5 bg-card/30 hover:bg-background/40 transition-colors text-left border-t border-border cursor-pointer select-none"
        aria-expanded={open}
      >
        <span className="text-xs font-medium text-muted-foreground flex items-center">
          Grupos de Anúncios
          {adSets.length > 0 && (
            <span className="ml-1.5 bg-background text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
              {adSets.length}
            </span>
          )}
        </span>
        <ChevronDown
          ref={chevronRef}
          className="w-3.5 h-3.5 text-muted-foreground"
          style={{ transform: 'rotate(0deg)' }}
        />
      </div>

      <div ref={bodyRef} style={{ overflow: 'hidden' }}>
        {open && (
          <div className="divide-y divide-zinc-800/60">
            {adSets.length === 0 ? (
              <p className="px-5 py-3 text-xs text-muted-foreground italic">
                Nenhum grupo configurado.
              </p>
            ) : (
              adSets.map((adSet, i) => {
                const ext = adSet as typeof adSet & {
                  traffic_destination?: string | null;
                  optimization_goal?: string | null;
                  target_cost_per_result?: number | null;
                  ad_media_url?: string | null;
                  ad_media_type?: string | null;
                  ad_text?: string | null;
                  ad_title?: string | null;
                  ad_cta?: string | null;
                };

                return (
                  <div key={adSet.id ?? i} className="px-4 py-3 space-y-1.5 bg-background/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {adSet.name ?? `Grupo ${i + 1}`}
                      </span>
                      {adSet.audience_mode && (
                        <span className="text-[10px] bg-background text-muted-foreground px-1.5 py-0.5 rounded">
                          {audienceModeLabel[adSet.audience_mode] ?? adSet.audience_mode}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {adSet.start_date && (
                        <p className="text-[11px] text-muted-foreground">
                          Início:{' '}
                          <span className="text-foreground">
                            {new Intl.DateTimeFormat('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(new Date(adSet.start_date))}
                          </span>
                        </p>
                      )}
                      {adSet.end_date && (
                        <p className="text-[11px] text-muted-foreground">
                          Fim:{' '}
                          <span className="text-foreground">
                            {new Intl.DateTimeFormat('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(new Date(adSet.end_date))}
                          </span>
                        </p>
                      )}
                      {c.budget_amount != null && (
                        <p className="text-[11px] text-muted-foreground">
                          Orçamento:{' '}
                          <span className="text-foreground">
                            R$ {formatBRL(Number(c.budget_amount))}
                          </span>
                        </p>
                      )}
                      {ext.traffic_destination && (
                        <p className="text-[11px] text-muted-foreground">
                          Destino:{' '}
                          <span className="text-foreground">
                            {DESTINATION_LABELS[ext.traffic_destination] ?? ext.traffic_destination}
                          </span>
                        </p>
                      )}
                      {ext.optimization_goal && (
                        <p className="text-[11px] text-muted-foreground">
                          Objetivo:{' '}
                          <span className="text-foreground">
                            {GOAL_LABELS[ext.optimization_goal] ?? ext.optimization_goal}
                          </span>
                        </p>
                      )}
                      {adSet.audience_location && (
                        <p className="text-[11px] text-muted-foreground">
                          Localização:{' '}
                          <span className="text-foreground">{adSet.audience_location}</span>
                        </p>
                      )}
                      {adSet.audience_interests && (
                        <p className="text-[11px] text-muted-foreground">
                          Interesses:{' '}
                          <span className="text-foreground">{adSet.audience_interests}</span>
                        </p>
                      )}
                      {ext.target_cost_per_result != null && (
                        <p className="text-[11px] text-muted-foreground">
                          CPA Alvo:{' '}
                          <span className="text-foreground">
                            R$ {formatBRL(ext.target_cost_per_result)}
                          </span>
                        </p>
                      )}
                    </div>

                    {ext.ad_media_url && (
                      <AdCreativeAccordion
                        mediaUrl={ext.ad_media_url}
                        mediaType={ext.ad_media_type}
                        adText={ext.ad_text}
                        adTitle={ext.ad_title}
                        adCta={ext.ad_cta}
                        organizationId={organizationId}
                        productIds={
                          c.campaign_products.map((p) => p.product_id).filter(Boolean) as string[]
                        }
                        marketingCost={marketingCost}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
