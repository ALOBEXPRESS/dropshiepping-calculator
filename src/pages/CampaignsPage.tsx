import React, { useState, useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Megaphone, Plus, Pencil, Trash2, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useSettings } from '@/contexts/SettingsContext';
import { useCampaigns } from '@/hooks/useCampaigns';
import { CampaignFormDialog } from '@/components/campaigns/CampaignFormDialog';
import { MarketplacePickerModal } from '@/components/campaigns/MarketplacePickerModal';
import { getObjectiveLabel } from '@/types/campaigns';
import type { CampaignWithRelations, CampaignStatus, CampaignMarketplace } from '@/types/campaigns';

import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';
import mercadolivreImg from '@/imgs/mercadolivre.svg';
import amazonImg from '@/imgs/amazon.jpg';
import sheinImg from '@/imgs/shein.svg';

const MARKETPLACE_LOGOS: Record<string, string> = {
  tiktok: tiktokImg,
  mercadolivre: mercadolivreImg,
  amazon: amazonImg,
  shein: sheinImg,
};

const statusConfig: Record<CampaignStatus, { label: string; className: string }> = {
  active:  { label: 'Ativo',     className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  paused:  { label: 'Pausado',   className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  ended:   { label: 'Encerrado', className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
};

const SkeletonCard = () => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 animate-pulse space-y-3">
    <div className="h-4 bg-zinc-800 rounded w-2/3" />
    <div className="h-3 bg-zinc-800 rounded w-1/2" />
    <div className="h-3 bg-zinc-800 rounded w-1/3" />
  </div>
);

// Accordion group section
const GroupSection: React.FC<{
  groupKey: string;
  label: string;
  icon: string;
  color: string;
  borderColor: string;
  count: number;
  custo: number;
  formatBRL: (v: number) => string;
  children: React.ReactNode;
}> = ({ label, icon, color, borderColor, count, custo, formatBRL, children }) => {
  const [open, setOpen] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);

  // Init open (expanded by default)
  useEffect(() => {
    if (bodyRef.current) {
      gsap.set(bodyRef.current, { height: 'auto', opacity: 1, overflow: 'hidden' });
    }
  }, []);

  const toggle = () => {
    const el = bodyRef.current;
    if (!el) { setOpen(v => !v); return; }
    if (!open) {
      setOpen(true);
      gsap.fromTo(el,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out', onComplete: () => { el.style.height = 'auto'; } }
      );
      gsap.to(chevronRef.current, { rotation: 0, duration: 0.3, ease: 'power2.out' });
    } else {
      gsap.to(el, {
        height: 0, opacity: 0, duration: 0.3, ease: 'power2.in',
        onComplete: () => setOpen(false),
      });
      gsap.to(chevronRef.current, { rotation: -90, duration: 0.3, ease: 'power2.in' });
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={toggle}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-900/40 border ${borderColor} hover:bg-zinc-900/70 transition-colors cursor-pointer`}
      >
        <span className="text-base">{icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-widest ${color}`}>{label}</span>
        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">{count}</span>
        {custo > 0 && (
          <span className="text-[10px] text-orange-400/70 ml-auto mr-2">
            Custo: R$ {formatBRL(custo)}
          </span>
        )}
        <ChevronDown
          ref={chevronRef}
          className={`w-4 h-4 text-zinc-500 ${custo > 0 ? '' : 'ml-auto'}`}
          style={{ transform: 'rotate(0deg)' }}
        />
      </button>
      <div ref={bodyRef} style={{ overflow: 'hidden' }}>
        {open && <div className="grid gap-3">{children}</div>}
      </div>
    </div>
  );
};

interface CampaignCardProps {
  campaign: CampaignWithRelations;
  sc: { label: string; className: string };
  logo: string | undefined;
  adSets: CampaignWithRelations['campaign_ad_sets'];
  onEdit: () => void;
  onDelete: () => void;
  organizationId?: string;
}

// ── AdCreativeAccordion ───────────────────────────────────────────────────────
const RETURNS_METRICS = [
  { key: 'views'       as const, label: 'Visualizações', icon: '👁' },
  { key: 'sales'       as const, label: 'Vendas',        icon: '🛒' },
  { key: 'impressions' as const, label: 'Impressões',    icon: '📊' },
  { key: 'clicks'      as const, label: 'Clicks',        icon: '🖱' },
];

const AdCreativeAccordion: React.FC<{
  mediaUrl: string;
  mediaType?: string | null;
  adText?: string | null;
  adTitle?: string | null;
  adCta?: string | null;
  organizationId?: string;
  productIds?: string[];
}> = ({ mediaUrl, mediaType, adText, adTitle, adCta, organizationId, productIds }) => {
  const [open, setOpen] = React.useState(false);
  type Metrics = { views: number; sales: number; impressions: number; clicks: number };
  const [form, setForm] = React.useState<Record<keyof Metrics, string>>({ views: '', sales: '', impressions: '', clicks: '' });
  const [saved, setSaved] = React.useState<Metrics>({ views: 0, sales: 0, impressions: 0, clicks: 0 });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open || !organizationId || !productIds?.length) return;
    supabase
      .from('campaign_returns')
      .select('views, sales, impressions, clicks')
      .eq('organization_id', organizationId)
      .in('product_id', productIds)
      .then(({ data }) => {
        if (!data?.length) return;
        const agg = (data as Metrics[]).reduce(
          (acc, r) => ({ views: acc.views+(r.views||0), sales: acc.sales+(r.sales||0), impressions: acc.impressions+(r.impressions||0), clicks: acc.clicks+(r.clicks||0) }),
          { views: 0, sales: 0, impressions: 0, clicks: 0 }
        );
        setSaved(agg);
        setForm({ views: agg.views ? String(agg.views) : '', sales: agg.sales ? String(agg.sales) : '', impressions: agg.impressions ? String(agg.impressions) : '', clicks: agg.clicks ? String(agg.clicks) : '' });
      });
  }, [open, organizationId, productIds?.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!organizationId || !productIds?.length) return;
    setSaving(true);
    const payload = {
      organization_id: organizationId,
      product_id: productIds[0],
      views: parseInt(form.views) || 0,
      sales: parseInt(form.sales) || 0,
      impressions: parseInt(form.impressions) || 0,
      clicks: parseInt(form.clicks) || 0,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('campaign_returns').upsert(payload, { onConflict: 'organization_id,product_id' });
    setSaved({ views: payload.views, sales: payload.sales, impressions: payload.impressions, clicks: payload.clicks });
    setSaving(false);
  };

  const extractTikTokId = (input: string): string => {
    const dvid = input.match(/data-video-id=["'](\d+)["']/);
    if (dvid) return dvid[1];
    const cite = input.match(/cite=["'][^"']*\/video\/(\d+)/);
    if (cite) return cite[1];
    const urlMatch = input.match(/\/video\/(\d+)/);
    if (urlMatch) return urlMatch[1];
    return '';
  };

  const tiktokId = mediaUrl.includes('tiktok.com') ? extractTikTokId(mediaUrl) : '';
  const iframeMatch = mediaUrl.match(/src=["']([^"']+)["']/);
  const resolvedUrl = tiktokId
    ? `https://www.tiktok.com/embed/v2/${tiktokId}`
    : iframeMatch ? iframeMatch[1] : mediaUrl;
  const isEmbed = !!(tiktokId || iframeMatch || mediaUrl.includes('<iframe') || mediaUrl.includes('streamable.com'));
  const isImage = mediaType === 'imagem';

  return (
    <div className="mt-2 rounded-lg border border-zinc-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900/60 hover:bg-zinc-800/60 transition-colors text-left"
      >
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Ad / Criativo</span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 py-4 bg-zinc-950/40">
          <div className="flex gap-5 items-start">
            {/* ── LEFT: vídeo / imagem ── */}
            <div className="flex-shrink-0">
              <div style={{ width: '140px', height: '248px', borderRadius: 10, overflow: 'hidden', position: 'relative', background: '#000' }}>
                {isImage ? (
                  <img src={resolvedUrl} alt="Criativo" className="w-full h-full object-contain bg-white" loading="lazy" />
                ) : isEmbed ? (
                  <iframe
                    src={resolvedUrl}
                    allow="encrypted-media;"
                    allowFullScreen
                    scrolling="no"
                    title="Criativo"
                    style={{ border: 'none', width: '140px', height: '248px', position: 'absolute', top: 0, left: 0, overflow: 'hidden', borderRadius: 10 }}
                  />
                ) : (
                  <video src={resolvedUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                )}
              </div>
              {/* Ad copy below video */}
              {(adTitle || adText || adCta) && (
                <div className="mt-2 space-y-1 max-w-[140px]">
                  {adTitle && <p className="text-[11px] font-semibold text-zinc-200 truncate">{adTitle}</p>}
                  {adText && <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2">{adText}</p>}
                  {adCta && <span className="inline-block text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded">{adCta}</span>}
                </div>
              )}
            </div>

            {/* ── RIGHT: benefícios editáveis ── */}
            <div className="flex-1 min-w-0">
              <div className="rounded-xl p-3 h-full" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.28)' }}>
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">📈 Benefícios da Campanha</p>
                <div className="grid grid-cols-2 gap-2">
                  {RETURNS_METRICS.map(({ key, label, icon }) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-[9px] text-orange-300/60 uppercase font-medium">{icon} {label}</label>
                      <input
                        type="number"
                        min="0"
                        value={form[key]}
                        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                        onBlur={handleSave}
                        placeholder={saved[key] ? String(saved[key]) : '0'}
                        className="w-full rounded-lg px-2 py-1.5 text-[12px] font-bold bg-zinc-900/80 border border-orange-500/25 text-orange-200 focus:outline-none focus:border-orange-500 placeholder:text-zinc-600 transition-colors"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[9px] text-zinc-600">Salva automaticamente ao sair do campo</p>
                  {saving && <span className="text-[9px] text-orange-400 animate-pulse">Salvando…</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── AdSetsSection (extracted to keep CampaignCard clean) ────────────────────
const AdSetsSection: React.FC<{
  adSets: CampaignWithRelations['campaign_ad_sets'];
  campaign: CampaignWithRelations;
  audienceModeLabel: Record<string, string>;
  formatBRL: (v: number) => string;
  organizationId?: string;
}> = ({ adSets, campaign: c, audienceModeLabel, formatBRL, organizationId }) => {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (bodyRef.current) gsap.set(bodyRef.current, { height: 0, opacity: 0, overflow: 'hidden' });
  }, []);

  const toggle = () => {
    const el = bodyRef.current;
    if (!el) { setOpen(v => !v); return; }
    if (!open) {
      setOpen(true);
      gsap.fromTo(el, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.32, ease: 'power2.out', onComplete: () => { el.style.height = 'auto'; } });
      gsap.to(chevronRef.current, { rotation: 180, duration: 0.28, ease: 'power2.out' });
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: () => setOpen(false) });
      gsap.to(chevronRef.current, { rotation: 0, duration: 0.25, ease: 'power2.in' });
    }
  };

  const destinationLabel: Record<string, string> = { site: 'Site', app: 'Aplicativo', tiktok_shop: 'Loja TikTok' };
  const goalLabel: Record<string, string> = { click: 'Clique', landing_page_view: 'Visualização pg inicial', engagement_session: 'Sessão de Engajamento' };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors text-left border-t border-zinc-800"
      >
        <span className="text-xs font-medium text-zinc-500">
          Grupos de Anúncios
          {adSets.length > 0 && (
            <span className="ml-1.5 bg-zinc-800 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded-full">{adSets.length}</span>
          )}
        </span>
        <ChevronDown ref={chevronRef} className="w-3.5 h-3.5 text-zinc-600" style={{ transform: 'rotate(0deg)' }} />
      </button>

      <div ref={bodyRef} style={{ overflow: 'hidden' }}>
        {open && (
          <div className="divide-y divide-zinc-800/60">
            {adSets.length === 0 ? (
              <p className="px-5 py-3 text-xs text-zinc-600 italic">Nenhum grupo configurado.</p>
            ) : adSets.map((adSet, i) => {
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
                <div key={adSet.id ?? i} className="px-4 py-3 space-y-1.5 bg-zinc-950/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-300">{adSet.name ?? `Grupo ${i + 1}`}</span>
                    {adSet.audience_mode && (
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                        {audienceModeLabel[adSet.audience_mode] ?? adSet.audience_mode}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {adSet.start_date && <p className="text-[11px] text-zinc-500">Início: <span className="text-zinc-300">{new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(adSet.start_date))}</span></p>}
                    {adSet.end_date && <p className="text-[11px] text-zinc-500">Fim: <span className="text-zinc-300">{new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(adSet.end_date))}</span></p>}
                    {c.budget_amount != null && <p className="text-[11px] text-zinc-500">Orçamento: <span className="text-zinc-300">R$ {formatBRL(Number(c.budget_amount))}</span></p>}
                    {ext.traffic_destination && <p className="text-[11px] text-zinc-500">Destino: <span className="text-zinc-300">{destinationLabel[ext.traffic_destination] ?? ext.traffic_destination}</span></p>}
                    {ext.optimization_goal && <p className="text-[11px] text-zinc-500">Objetivo: <span className="text-zinc-300">{goalLabel[ext.optimization_goal] ?? ext.optimization_goal}</span></p>}
                    {adSet.audience_location && <p className="text-[11px] text-zinc-500">Localização: <span className="text-zinc-300">{adSet.audience_location}</span></p>}
                    {adSet.audience_interests && <p className="text-[11px] text-zinc-500">Interesses: <span className="text-zinc-300">{adSet.audience_interests}</span></p>}
                    {ext.target_cost_per_result != null && <p className="text-[11px] text-zinc-500">CPA Alvo: <span className="text-zinc-300">R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(ext.target_cost_per_result)}</span></p>}
                  </div>
                  {ext.ad_media_url && (
                    <AdCreativeAccordion
                      mediaUrl={ext.ad_media_url}
                      mediaType={ext.ad_media_type}
                      adText={ext.ad_text}
                      adTitle={ext.ad_title}
                      adCta={ext.ad_cta}
                      organizationId={organizationId}
                      productIds={c.campaign_products.map(p => p.product_id).filter(Boolean) as string[]}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign: c, sc, logo, adSets, onEdit, onDelete, organizationId }) => {
  const [expanded, setExpanded] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);

  const marketplaceLabel: Record<string, string> = {
    tiktok: 'TikTok Shop',
    mercadolivre: 'Mercado Livre',
    amazon: 'Amazon',
    shein: 'Shein',
  };

  const audienceModeLabel: Record<string, string> = {
    auto: 'Automático (Smart+)',
    manual: 'Manual',
    saved: 'Audiência Salva',
  };

  // Period from first adSet with dates
  const firstAdSetWithDates = adSets.find(a => a.start_date || a.end_date);
  const formatDate = (d: string | null | undefined) =>
    d ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(d)) : null;
  const periodStart = formatDate(firstAdSetWithDates?.start_date);
  const periodEnd = formatDate(firstAdSetWithDates?.end_date);
  const periodStr = periodStart && periodEnd
    ? `${periodStart} – ${periodEnd}`
    : periodStart ? `A partir de ${periodStart}`
    : periodEnd ? `Até ${periodEnd}`
    : null;

  const totalCusto = c.campaign_products.reduce(
    (sum, p) => sum + (p.marketing_cost_override != null ? Number(p.marketing_cost_override) : 0), 0
  );
  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v);

  // GSAP expand/collapse
  const toggle = () => {
    const el = bodyRef.current;
    if (!el) { setExpanded(v => !v); return; }
    if (!expanded) {
      // expand
      setExpanded(true);
      gsap.fromTo(el,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.38, ease: 'power2.out',
          onComplete: () => { el.style.height = 'auto'; } }
      );
      gsap.to(chevronRef.current, { rotation: 180, duration: 0.3, ease: 'power2.out' });
    } else {
      // collapse
      gsap.to(el, {
        height: 0, opacity: 0, duration: 0.3, ease: 'power2.in',
        onComplete: () => setExpanded(false),
      });
      gsap.to(chevronRef.current, { rotation: 0, duration: 0.3, ease: 'power2.in' });
    }
  };

  // Init: body hidden on mount
  useEffect(() => {
    if (bodyRef.current) {
      gsap.set(bodyRef.current, { height: 0, opacity: 0, overflow: 'hidden' });
    }
  }, []);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden transition-colors hover:border-zinc-700/70">
      {/* ── Collapsed header (always visible) ── */}
      <button
        type="button"
        onClick={toggle}
        className="w-full text-left cursor-pointer"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          {/* Marketplace logo */}
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 overflow-hidden p-1 shadow-sm">
            {logo
              ? <img src={logo} alt={c.marketplace} className="w-full h-full object-contain" />
              : <Megaphone className="w-4 h-4 text-zinc-400" />}
          </div>

          {/* Title + badges */}
          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white truncate max-w-[340px]">{c.name}</span>
            <span className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30">
              {marketplaceLabel[c.marketplace] ?? c.marketplace}
            </span>
            <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${sc.className}`}>
              {sc.label}
            </span>
          </div>

          {/* Actions + chevron */}
          <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Editar"
              onClick={onEdit}
              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Excluir"
              onClick={onDelete}
              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <ChevronDown
            ref={chevronRef}
            className="w-4 h-4 text-zinc-500 flex-shrink-0"
            style={{ transform: 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* ── Expanded body (GSAP-animated) ── */}
      <div ref={bodyRef} style={{ overflow: 'hidden' }}>
        {expanded && (
          <div className="border-t border-zinc-800">
            {/* Details row */}
            <div className="px-4 py-3 space-y-1.5">
              <p className="text-xs text-zinc-400">
                Objetivo: <span className="text-zinc-200">{getObjectiveLabel(c.objective)}</span>
                {' · '}
                Orçamento: <span className="text-zinc-200">
                  {c.budget_type === 'daily' ? 'Diário' : 'Vitalício'}
                  {c.budget_amount != null ? ` · R$ ${formatBRL(Number(c.budget_amount))}` : ''}
                </span>
                {totalCusto > 0 && (
                  <> · Custo: <span className="text-orange-400 font-medium">R$ {formatBRL(totalCusto)}</span></>
                )}
              </p>
              {periodStr && (
                <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {periodStr}
                </p>
              )}
              {c.campaign_products.length > 0 && (
                <p className="text-xs text-zinc-500">{c.campaign_products.length} produto(s) vinculado(s)</p>
              )}
            </div>

            {/* Ad Sets accordion */}
            <AdSetsSection
              adSets={adSets}
              campaign={c}
              audienceModeLabel={audienceModeLabel}
              formatBRL={formatBRL}
              organizationId={organizationId}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const CampaignsPage: React.FC = () => {
  const { organizationId } = useSettings();
  const { campaigns, isLoading, isError, deleteCampaign } = useCampaigns(organizationId ?? '');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithRelations | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [marketplacePickerOpen, setMarketplacePickerOpen] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<CampaignMarketplace>('tiktok');

  const handleNew = () => { setMarketplacePickerOpen(true); };
  const handleMarketplaceSelect = (mp: CampaignMarketplace) => {
    setSelectedMarketplace(mp);
    setEditingCampaign(null);
    setDialogOpen(true);
  };
  const handleEdit = (c: CampaignWithRelations) => { setEditingCampaign(c); setDialogOpen(true); };
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteCampaign(deleteId);
      toast.success('Campanha excluída com sucesso.');
    } catch {
      toast.error('Erro ao excluir campanha.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  type SortKey = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'budget_desc' | 'budget_asc' | 'status';
  const [sortKey, setSortKey] = useState<SortKey>('date_desc');

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      switch (sortKey) {
        case 'date_desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date_asc':  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name_asc':  return (a.name ?? '').localeCompare(b.name ?? '');
        case 'name_desc': return (b.name ?? '').localeCompare(a.name ?? '');
        case 'budget_desc': return (Number(b.budget_amount ?? 0)) - (Number(a.budget_amount ?? 0));
        case 'budget_asc':  return (Number(a.budget_amount ?? 0)) - (Number(b.budget_amount ?? 0));
        case 'status': {
          const order: Record<string, number> = { active: 0, paused: 1, ended: 2 };
          return (order[a.status] ?? 9) - (order[b.status] ?? 9);
        }
        default: return 0;
      }
    });
  }, [campaigns, sortKey]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Campanhas</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Gerencie suas campanhas de tráfego pago</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as typeof sortKey)}>
            <SelectTrigger className="w-48 bg-zinc-900 border-zinc-700 text-zinc-300 text-xs h-9">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
              <SelectItem value="date_desc">Data ↓ (mais recente)</SelectItem>
              <SelectItem value="date_asc">Data ↑ (mais antigo)</SelectItem>
              <SelectItem value="name_asc">Nome A → Z</SelectItem>
              <SelectItem value="name_desc">Nome Z → A</SelectItem>
              <SelectItem value="budget_desc">Orçamento ↓</SelectItem>
              <SelectItem value="budget_asc">Orçamento ↑</SelectItem>
              <SelectItem value="status">Status (ativo → encerrado)</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleNew} className="bg-orange-500 hover:bg-orange-600 text-white gap-2 h-9">
            <Plus className="w-4 h-4" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="text-center py-10 text-red-400 text-sm">
          Erro ao carregar campanhas. Tente recarregar a página.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-zinc-500" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Nenhuma campanha encontrada</p>
            <p className="text-zinc-400 text-sm mt-1">Crie sua primeira campanha de tráfego pago.</p>
          </div>
          <Button onClick={handleNew} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
            <Plus className="w-4 h-4" />
            Criar Campanha
          </Button>
        </div>
      )}

      {/* List */}
      {!isLoading && campaigns.length > 0 && (() => {
        // Total cost across all campaigns
        const totalCusto = campaigns.reduce((sum, c) =>
          sum + c.campaign_products.reduce((s, p) => s + (p.marketing_cost_override != null ? Number(p.marketing_cost_override) : 0), 0)
        , 0);
        const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v);

        // Group by objective category: Conversão vs Consideração/Conhecimento
        const CONVERSION_OBJECTIVES = new Set(['sales', 'app_promotion', 'lead_generation']);
        const objGroups: { key: string; label: string; icon: string; color: string; borderColor: string; campaigns: typeof sortedCampaigns }[] = [
          {
            key: 'conversao',
            label: 'Conversão',
            icon: '💰',
            color: 'text-orange-400',
            borderColor: 'border-orange-500/30',
            campaigns: sortedCampaigns.filter(c => CONVERSION_OBJECTIVES.has(c.objective)),
          },
          {
            key: 'consideracao',
            label: 'Consideração & Conhecimento',
            icon: '👁',
            color: 'text-blue-400',
            borderColor: 'border-blue-500/30',
            campaigns: sortedCampaigns.filter(c => !CONVERSION_OBJECTIVES.has(c.objective)),
          },
        ].filter(g => g.campaigns.length > 0);

        return (
          <div className="space-y-6">
            {/* Total cost summary */}
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex-1 flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Total de Campanhas</p>
                  <p className="text-sm font-semibold text-white">{campaigns.length}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Custo Total</p>
                  <p className="text-sm font-semibold text-orange-400">R$ {formatBRL(totalCusto)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Orçamento Total</p>
                  <p className="text-sm font-semibold text-zinc-200">
                    R$ {formatBRL(campaigns.reduce((s, c) => s + Number(c.budget_amount ?? 0), 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Grouped by objective category — each group is collapsible */}
            {objGroups.map(group => {
              const groupCusto = group.campaigns.reduce((sum, c) =>
                sum + c.campaign_products.reduce((s, p) => s + (p.marketing_cost_override != null ? Number(p.marketing_cost_override) : 0), 0)
              , 0);
              return (
                <GroupSection
                  key={group.key}
                  groupKey={group.key}
                  label={group.label}
                  icon={group.icon}
                  color={group.color}
                  borderColor={group.borderColor}
                  count={group.campaigns.length}
                  custo={groupCusto}
                  formatBRL={formatBRL}
                >
                  {group.campaigns.map((c) => {
                    const sc = statusConfig[c.status] ?? statusConfig.active;
                    const logo = MARKETPLACE_LOGOS[c.marketplace];
                    const adSets = c.campaign_ad_sets ?? [];
                    return (
                      <CampaignCard
                        key={c.id}
                        campaign={c}
                        sc={sc}
                        logo={logo}
                        adSets={adSets}
                        onEdit={() => handleEdit(c)}
                        onDelete={() => setDeleteId(c.id)}
                        organizationId={organizationId ?? undefined}
                      />
                    );
                  })}
                </GroupSection>
              );
            })}
          </div>
        );
      })()}

      {/* Marketplace picker */}
      <MarketplacePickerModal
        open={marketplacePickerOpen}
        onOpenChange={setMarketplacePickerOpen}
        onSelect={handleMarketplaceSelect}
      />

      {/* Form dialog */}
      {organizationId && (
        <CampaignFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          campaign={editingCampaign ?? undefined}
          organizationId={organizationId}
          marketplace={editingCampaign?.marketplace ?? selectedMarketplace}
          onSaved={() => {}}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Essa ação é irreversível. A campanha e todos os vínculos de produtos serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CampaignsPage;
