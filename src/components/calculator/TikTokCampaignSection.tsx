import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { handleCurrencyChange as hcc } from '@/utils/currency';

interface TikTokFormFields {
  tiktokDailyBudget: string;
  // promotion fields
  tiktokPromoProductValue: string;
  tiktokPromoProductType: 'fixed' | 'percent';
  tiktokPromoProductUntil: string;
  tiktokPromoNewCustomerValue: string;
  tiktokPromoNewCustomerType: 'fixed' | 'percent';
  tiktokPromoShippingValue: string;
  tiktokPromoShippingType: 'fixed' | 'percent';
  roiTarget: string;
  tiktokCampaignId: string;
}

interface TikTokCampaignSectionProps {
  formData: TikTokFormFields & Record<string, unknown>;
  handleChange: <K extends string>(field: K, value: unknown) => void;
  handleCurrencyChange: typeof hcc;
  organizationId: string | null | undefined;
}

interface CampaignOption { id: string; name: string; marketing_cost: number | null }

const TypeToggle: React.FC<{
  value: 'fixed' | 'percent';
  onChange: (v: 'fixed' | 'percent') => void;
}> = ({ value, onChange }) => (
  <div className="flex rounded-md overflow-hidden border border-zinc-700 flex-shrink-0">
    <button type="button" onClick={() => onChange('fixed')}
      className={`px-2 py-1 text-xs font-medium transition-colors ${value === 'fixed' ? 'bg-pink-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
      R$
    </button>
    <button type="button" onClick={() => onChange('percent')}
      className={`px-2 py-1 text-xs font-medium transition-colors ${value === 'percent' ? 'bg-pink-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
      %
    </button>
  </div>
);

export const TikTokCampaignSection: React.FC<TikTokCampaignSectionProps> = ({
  formData, handleChange, organizationId,
}) => {
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [campaignCost, setCampaignCost] = useState<number | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    setLoadingCampaigns(true);
    supabase
      .from('campaigns')
      .select('id, name, campaign_products(marketing_cost_override)')
      .eq('organization_id', organizationId)
      .eq('marketplace', 'tiktok')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const opts = (data ?? []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.name as string,
          marketing_cost: ((c.campaign_products as Array<{ marketing_cost_override: number | null }>)?.[0]?.marketing_cost_override ?? null),
        }));
        setCampaigns(opts);
        setLoadingCampaigns(false);
        // If campaign already selected, set cost
        if (formData.tiktokCampaignId) {
          const found = opts.find((o) => o.id === formData.tiktokCampaignId);
          setCampaignCost(found?.marketing_cost ?? null);
        }
      });
  }, [organizationId, formData.tiktokCampaignId]);

  const inputCls = 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-pink-500 h-8 text-sm';

  return (
    <div className="space-y-5">
      {/* CAMPANHA */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Campanha</p>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right text-xs dark:text-zinc-300">Campanha</Label>
          <div className="col-span-3 space-y-1">
            <select
              value={formData.tiktokCampaignId ?? ''}
              onChange={(e) => {
                handleChange('tiktokCampaignId', e.target.value);
                const found = campaigns.find((c) => c.id === e.target.value);
                setCampaignCost(found?.marketing_cost ?? null);
              }}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-pink-500"
              disabled={loadingCampaigns}
            >
              <option value="">— Nenhuma campanha —</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <Link to="/campanhas" className="flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 transition-colors">
                <ExternalLink className="w-3 h-3" />
                Gerenciar Campanhas
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Orçamento + ROI */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs dark:text-zinc-300">Orçamento Diário (R$)</Label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs pointer-events-none">R$</span>
            <Input
              type="text" inputMode="decimal" placeholder="0,00"
              value={formData.tiktokDailyBudget ?? ''}
              onChange={(e) => handleChange('tiktokDailyBudget', e.target.value.replace(/[^0-9,.]/g, ''))}
              className={`${inputCls} pl-7`}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs dark:text-zinc-300">ROI Alvo (%)</Label>
          <div className="relative">
            <Input
              type="text" inputMode="decimal" placeholder="0"
              value={formData.roiTarget ?? ''}
              onChange={(e) => handleChange('roiTarget', e.target.value.replace(/[^0-9,.]/g, ''))}
              className={`${inputCls} pr-6`}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs pointer-events-none">%</span>
          </div>
        </div>
      </div>

      {/* Custo de marketing vindo da campanha */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right text-xs dark:text-zinc-300">Custo/Resultado</Label>
        <div className="col-span-3 flex items-center gap-2">
          <span className={`text-sm font-semibold ${campaignCost != null ? 'text-purple-400' : 'text-zinc-500'}`}>
            {campaignCost != null
              ? `R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(campaignCost)}`
              : '—'}
          </span>
          {campaignCost != null && (
            <span className="text-[10px] text-zinc-500">(definido na campanha)</span>
          )}
        </div>
      </div>

      {/* PROMOÇÕES TIKTOK */}
      <div className="rounded-xl overflow-hidden border border-zinc-700/50">
        <button
          type="button"
          onClick={() => setPromoOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/60 hover:bg-zinc-800/60 transition-colors"
        >
          <span className="text-xs font-semibold text-pink-400 uppercase tracking-wide">🏷️ Promoções TikTok</span>
          {promoOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </button>

        {promoOpen && (
          <div className="px-4 py-4 space-y-5 bg-zinc-900/30 border-t border-zinc-700/50">

            {/* 1. Desconto do Produto */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Desconto do Produto</p>
              <div className="flex items-center gap-2">
                <TypeToggle
                  value={(formData.tiktokPromoProductType as 'fixed' | 'percent') || 'fixed'}
                  onChange={(v) => handleChange('tiktokPromoProductType', v)}
                />
                <Input
                  type="text" inputMode="decimal" placeholder="0,00"
                  value={formData.tiktokPromoProductValue ?? ''}
                  onChange={(e) => handleChange('tiktokPromoProductValue', e.target.value.replace(/[^0-9,.]/g, ''))}
                  className={`${inputCls} flex-1`}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-zinc-400 whitespace-nowrap">Válido até</Label>
                <Input
                  type="date"
                  value={formData.tiktokPromoProductUntil ?? ''}
                  onChange={(e) => handleChange('tiktokPromoProductUntil', e.target.value)}
                  className={`${inputCls} flex-1`}
                />
              </div>
            </div>

            {/* 2. Cupom Novos Clientes */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Cupom para Novos Clientes</p>
              <div className="flex items-center gap-2">
                <TypeToggle
                  value={(formData.tiktokPromoNewCustomerType as 'fixed' | 'percent') || 'fixed'}
                  onChange={(v) => handleChange('tiktokPromoNewCustomerType', v)}
                />
                <Input
                  type="text" inputMode="decimal" placeholder="0,00"
                  value={formData.tiktokPromoNewCustomerValue ?? ''}
                  onChange={(e) => handleChange('tiktokPromoNewCustomerValue', e.target.value.replace(/[^0-9,.]/g, ''))}
                  className={`${inputCls} flex-1`}
                />
              </div>
            </div>

            {/* 3. Desconto no Frete */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Desconto no Frete</p>
              <div className="flex items-center gap-2">
                <TypeToggle
                  value={(formData.tiktokPromoShippingType as 'fixed' | 'percent') || 'fixed'}
                  onChange={(v) => handleChange('tiktokPromoShippingType', v)}
                />
                <Input
                  type="text" inputMode="decimal" placeholder="0,00"
                  value={formData.tiktokPromoShippingValue ?? ''}
                  onChange={(e) => handleChange('tiktokPromoShippingValue', e.target.value.replace(/[^0-9,.]/g, ''))}
                  className={`${inputCls} flex-1`}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
