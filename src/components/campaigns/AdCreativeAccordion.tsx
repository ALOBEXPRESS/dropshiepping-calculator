import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { calculateDerivedMetrics, formatBRL } from './campaignsUtils';

interface AdCreativeAccordionProps {
  mediaUrl: string;
  mediaType?: string | null;
  adText?: string | null;
  adTitle?: string | null;
  adCta?: string | null;
  organizationId?: string;
  productIds?: string[];
  marketingCost?: number;
}

interface Metrics {
  views: number;
  sales: number;
  impressions: number;
  clicks: number;
}

const RETURNS_METRICS = [
  { key: 'views' as const, label: 'Visualizações', icon: '👁' },
  { key: 'sales' as const, label: 'Vendas', icon: '🛒' },
  { key: 'impressions' as const, label: 'Impressões', icon: '📊' },
  { key: 'clicks' as const, label: 'Clicks', icon: '🖱' },
];

export const AdCreativeAccordion: React.FC<AdCreativeAccordionProps> = ({
  mediaUrl,
  mediaType,
  adText,
  adTitle,
  adCta,
  organizationId,
  productIds,
  marketingCost = 0,
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<keyof Metrics, string>>({
    views: '',
    sales: '',
    impressions: '',
    clicks: '',
  });
  const [saved, setSaved] = useState<Metrics>({
    views: 0,
    sales: 0,
    impressions: 0,
    clicks: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !organizationId || !productIds?.length) return;

    let isMounted = true;
    supabase
      .from('campaign_returns')
      .select('views, sales, impressions, clicks')
      .eq('organization_id', organizationId)
      .in('product_id', productIds)
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error('[AdCreativeAccordion] Error fetching returns:', error);
          return;
        }
        if (!data?.length) return;

        const agg = (data as Metrics[]).reduce(
          (acc, r) => ({
            views: acc.views + (r.views || 0),
            sales: acc.sales + (r.sales || 0),
            impressions: acc.impressions + (r.impressions || 0),
            clicks: acc.clicks + (r.clicks || 0),
          }),
          { views: 0, sales: 0, impressions: 0, clicks: 0 }
        );

        setSaved(agg);
        setForm({
          views: agg.views ? String(agg.views) : '',
          sales: agg.sales ? String(agg.sales) : '',
          impressions: agg.impressions ? String(agg.impressions) : '',
          clicks: agg.clicks ? String(agg.clicks) : '',
        });
      });

    return () => {
      isMounted = false;
    };
  }, [open, organizationId, productIds]);

  const handleSave = async () => {
    if (!organizationId || !productIds?.length) return;
    setSaving(true);
    const payload = {
      organization_id: organizationId,
      product_id: productIds[0],
      views: parseInt(form.views, 10) || 0,
      sales: parseInt(form.sales, 10) || 0,
      impressions: parseInt(form.impressions, 10) || 0,
      clicks: parseInt(form.clicks, 10) || 0,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('campaign_returns')
      .upsert(payload, { onConflict: 'organization_id,product_id' });

    if (error) {
      toast.error('Erro ao salvar métricas de retorno');
    } else {
      setSaved({
        views: payload.views,
        sales: payload.sales,
        impressions: payload.impressions,
        clicks: payload.clicks,
      });
    }
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
    : iframeMatch
      ? iframeMatch[1]
      : mediaUrl;
  const isEmbed = Boolean(tiktokId || iframeMatch || mediaUrl.includes('<iframe') || mediaUrl.includes('streamable.com'));
  const isImage = mediaType === 'imagem';

  // Derived metrics preview
  const derived = calculateDerivedMetrics(marketingCost, saved);
  const hasReturnsData = saved.views > 0 || saved.clicks > 0 || saved.impressions > 0 || saved.sales > 0;

  return (
    <div className="mt-2 rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-card/60 hover:bg-background/60 transition-colors text-left"
        aria-expanded={open}
      >
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          Ad / Criativo
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="px-4 py-4 bg-background/40">
          <div className="flex gap-5 items-start flex-col sm:flex-row">
            {/* ── LEFT: video / image ── */}
            <div className="flex-shrink-0">
              <div
                style={{
                  width: '140px',
                  height: '248px',
                  borderRadius: 10,
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#000',
                }}
              >
                {isImage ? (
                  <img
                    src={resolvedUrl}
                    alt="Criativo"
                    className="w-full h-full object-contain bg-card"
                    loading="lazy"
                  />
                ) : isEmbed ? (
                  <iframe
                    src={resolvedUrl}
                    allow="encrypted-media;"
                    allowFullScreen
                    scrolling="no"
                    title="Criativo"
                    style={{
                      border: 'none',
                      width: '140px',
                      height: '248px',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      overflow: 'hidden',
                      borderRadius: 10,
                    }}
                  />
                ) : (
                  <video
                    src={resolvedUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Ad copy below video */}
              {(adTitle || adText || adCta) && (
                <div className="mt-2 space-y-1 max-w-[140px]">
                  {adTitle && (
                    <p className="text-[11px] font-semibold text-foreground truncate">
                      {adTitle}
                    </p>
                  )}
                  {adText && (
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                      {adText}
                    </p>
                  )}
                  {adCta && (
                    <span className="inline-block text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded">
                      {adCta}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT: editable returns metrics ── */}
            <div className="flex-1 min-w-0 w-full">
              <div
                className="rounded-xl p-3 h-full"
                style={{
                  background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.28)',
                }}
              >
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">
                  📈 Benefícios da Campanha
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {RETURNS_METRICS.map(({ key, label, icon }) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label htmlFor={`metric-${key}`} className="text-[9px] text-orange-300/60 uppercase font-medium">
                        {icon} {label}
                      </label>
                      <input
                        id={`metric-${key}`}
                        type="number"
                        min="0"
                        value={form[key]}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        onBlur={handleSave}
                        placeholder={saved[key] ? String(saved[key]) : '0'}
                        className="w-full rounded-lg px-2 py-1.5 text-[12px] font-bold bg-card/80 border border-orange-500/25 text-orange-200 focus:outline-none focus:border-orange-500 placeholder:text-muted-foreground transition-colors"
                      />
                    </div>
                  ))}
                </div>

                {/* Derived metrics stats */}
                {hasReturnsData && (
                  <div className="mt-3 pt-3 border-t border-orange-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-1 rounded bg-black/20">
                      <p className="text-[9px] text-zinc-400">CTR</p>
                      <p className="text-xs font-semibold text-orange-300">{derived.ctr}%</p>
                    </div>
                    <div className="p-1 rounded bg-black/20">
                      <p className="text-[9px] text-zinc-400">Conv.</p>
                      <p className="text-xs font-semibold text-orange-300">{derived.conversionRate}%</p>
                    </div>
                    <div className="p-1 rounded bg-black/20">
                      <p className="text-[9px] text-zinc-400">CPC</p>
                      <p className="text-xs font-semibold text-orange-300">R$ {formatBRL(derived.cpc)}</p>
                    </div>
                    <div className="p-1 rounded bg-black/20">
                      <p className="text-[9px] text-zinc-400">CPA</p>
                      <p className="text-xs font-semibold text-orange-300">R$ {formatBRL(derived.cpa)}</p>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[9px] text-muted-foreground">
                    Salva automaticamente ao sair do campo
                  </p>
                  {saving && (
                    <span className="text-[9px] text-orange-400 animate-pulse">
                      Salvando…
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
