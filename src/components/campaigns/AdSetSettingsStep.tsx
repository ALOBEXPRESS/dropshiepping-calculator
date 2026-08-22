import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import woocommerceImg from '@/imgs/free-woocommerce-icon-svg-download-png-226060.webp';
import tiktokShopImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';
import androidImg from '@/imgs/android.png';
import type { CampaignFormPayload, CampaignObjective } from '@/types/campaigns';

const CONSIDERATION_OBJECTIVES: CampaignObjective[] = ['traffic', 'video_views', 'community_interaction'];
const CONVERSION_OBJECTIVES: CampaignObjective[] = ['sales', 'app_promotion', 'lead_generation'];

interface AdSetSettingsStepProps {
  data: CampaignFormPayload['adSet'];
  campaignObjective: CampaignObjective;
  onChange: (field: keyof CampaignFormPayload['adSet'], value: string | number | null) => void;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pt-2">{children}</p>
);

export const AdSetSettingsStep: React.FC<AdSetSettingsStepProps> = ({
  data,
  campaignObjective,
  onChange,
}) => {
  const isConsideration = CONSIDERATION_OBJECTIVES.includes(campaignObjective);
  const isConversion = CONVERSION_OBJECTIVES.includes(campaignObjective);
  const adSetData = data as typeof data & {
    traffic_destination?: string | null;
    optimization_goal?: string | null;
    target_cost_per_result?: number | null;
  };

  // Raw local state for cost input — reset when adSet changes (track by identity)
  const costKey = adSetData.target_cost_per_result;
  const [rawCost, setRawCost] = React.useState<string>(
    costKey != null ? String(costKey).replace('.', ',') : ''
  );
  React.useEffect(() => {
    setRawCost(adSetData.target_cost_per_result != null
      ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(adSetData.target_cost_per_result)
      : '');
  }, [adSetData.target_cost_per_result]);

  const handle = (field: keyof CampaignFormPayload['adSet']) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(field, e.target.value || null);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Grupo de Anúncios</h3>
        <p className="text-sm text-zinc-400">Configure o período e opções do grupo de anúncios.</p>
      </div>

      <SectionLabel>CAMPANHA</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          {/* Conversão: "Nome do Produto (Permitir Anexar)" | Outros: "Nome do Grupo" */}
          <Label className="text-zinc-300 text-sm">
            {isConversion ? 'Nome do Produto' : 'Nome do Grupo'}
          </Label>
          <Input
            placeholder={isConversion ? 'Ex: Tênis Masculino Esportivo' : 'Ex: Grupo Principal'}
            value={data.name ?? ''}
            onChange={handle('name')}
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
          />
          {isConversion && (
            <p className="text-[11px] text-zinc-500">Nome do produto desta campanha de conversão.</p>
          )}
        </div>
        <div className="space-y-1.5">
          {/* Conversão: "Meta de Otimização" com default ROI | Outros: "Tipo de Conversão" */}
          <Label className="text-zinc-300 text-sm">
            {isConversion ? 'Meta de Otimização' : 'Tipo de Conversão'}
          </Label>
          {isConversion ? (
            <Select
              value={adSetData.optimization_goal ?? 'roi'}
              onValueChange={(v) => onChange('optimization_goal' as keyof CampaignFormPayload['adSet'], v || null)}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                <SelectValue placeholder="Selecione a meta" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="roi">Meta de ROI</SelectItem>
                <SelectItem value="click">Clique</SelectItem>
                <SelectItem value="landing_page_view">Visualização de Página</SelectItem>
                <SelectItem value="engagement_session">Sessão de Engajamento</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="Ex: Compra, Visualização de Página"
              value={data.conversion_type ?? ''}
              onChange={handle('conversion_type')}
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          )}
        </div>
      </div>

      {/* Conversão: Custo + ROI */}
      {isConversion && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">Custo (R$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">R$</span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={rawCost}
                onChange={(e) => {
                  // Only digits + comma — no dots (avoid BRL thousand-dot confusion)
                  setRawCost(e.target.value.replace(/[^0-9,]/g, ''));
                }}
                onBlur={() => {
                  const cleaned = rawCost.replace(',', '.');
                  const num = parseFloat(cleaned);
                  const val = isNaN(num) ? null : num;
                  onChange('target_cost_per_result' as keyof CampaignFormPayload['adSet'], val);
                  setRawCost(val != null
                    ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(val)
                    : '');
                }}
                className="pl-9 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">ROI Alvo</Label>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 2,0"
                value={data.audience_behavior != null ? data.audience_behavior : ''}
                onChange={(e) => {
                  // Allow digits, comma, dot — for values like 1,8 or 2.5
                  const v = e.target.value.replace(/[^0-9,.]/g, '');
                  onChange('audience_behavior', v || null);
                }}
                className="pr-8 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">×</span>
            </div>
            <p className="text-[11px] text-zinc-500">Ex: 1,8 = ROI de 180%</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Data de Início</Label>
          <Input type="datetime-local" value={data.start_date ? data.start_date.slice(0, 16) : ''} onChange={handle('start_date')} className="bg-zinc-900 border-zinc-700 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Data de Fim</Label>
          <Input type="datetime-local" value={data.end_date ? data.end_date.slice(0, 16) : ''} onChange={handle('end_date')} className="bg-zinc-900 border-zinc-700 text-white" />
        </div>
      </div>

      {/* Consideration-specific fields */}
      {isConsideration && (
        <>
          <SectionLabel>CONFIGURAÇÕES DE CONSIDERAÇÃO</SectionLabel>

          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">Destino</Label>
            <Select
              value={adSetData.traffic_destination ?? ''}
              onValueChange={(v) => onChange('traffic_destination' as keyof CampaignFormPayload['adSet'], v || null)}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                <SelectValue placeholder="Selecione o destino do tráfego" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="site">🌐 Site</SelectItem>
                <SelectItem value="app">📱 Aplicativo</SelectItem>
                <SelectItem value="tiktok_shop">🛍 Loja do TikTok</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-zinc-500">Para onde o tráfego será direcionado.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Objetivo de Otimização</Label>
              <Select
                value={adSetData.optimization_goal ?? ''}
                onValueChange={(v) => onChange('optimization_goal' as keyof CampaignFormPayload['adSet'], v || null)}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="click">Clique</SelectItem>
                  <SelectItem value="landing_page_view">Visualização da Página Inicial</SelectItem>
                  <SelectItem value="engagement_session">Sessão de Engajamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">
                Custo Alvo por Resultado (R$)
                <span className="text-zinc-500 font-normal ml-1">— opcional</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">R$</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={
                    adSetData.target_cost_per_result != null
                      ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(adSetData.target_cost_per_result)
                      : ''
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\./g, '').replace(',', '.');
                    const num = parseFloat(raw);
                    onChange('target_cost_per_result' as keyof CampaignFormPayload['adSet'], isNaN(num) ? null : num);
                  }}
                  className="pl-9 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500"
                />
              </div>
              <p className="text-[11px] text-zinc-500">Custo máximo desejado por resultado obtido.</p>
            </div>
          </div>
        </>
      )}

      <SectionLabel>POSICIONAMENTO</SectionLabel>
      <div className="space-y-2">
        <Label className="text-zinc-300 text-sm">Local de Exibição</Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'site', label: 'Site', img: woocommerceImg },
            { value: 'app', label: 'App', img: androidImg },
            { value: 'tiktok_shop', label: 'Loja TikTok', img: tiktokShopImg },
          ].map((opt) => {
            const currentPlacement = data.placement;
            const isSelected = currentPlacement === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange('placement', isSelected ? null : opt.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/50'
                    : 'border-zinc-700 bg-zinc-900/30 hover:border-zinc-500'
                }`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white p-1">
                  {opt.img ? (
                    <img src={opt.img} alt={opt.label} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-2xl">📱</span>
                  )}                </div>
                <span className={`text-xs font-medium ${isSelected ? 'text-orange-300' : 'text-zinc-300'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
