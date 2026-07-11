import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CampaignFormPayload, CampaignObjective } from '@/types/campaigns';

const CONSIDERATION_OBJECTIVES: CampaignObjective[] = ['traffic', 'video_views', 'community_interaction'];

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
  const adSetData = data as typeof data & {
    traffic_destination?: string | null;
    optimization_goal?: string | null;
    target_cost_per_result?: number | null;
  };

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
          <Label className="text-zinc-300 text-sm">Nome do Grupo</Label>
          <Input
            placeholder="Ex: Grupo Principal"
            value={data.name ?? ''}
            onChange={handle('name')}
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Tipo de Conversão</Label>
          <Input
            placeholder="Ex: Compra, Visualização de Página"
            value={data.conversion_type ?? ''}
            onChange={handle('conversion_type')}
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Data de Início</Label>
          <Input type="date" value={data.start_date ?? ''} onChange={handle('start_date')} className="bg-zinc-900 border-zinc-700 text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Data de Fim</Label>
          <Input type="date" value={data.end_date ?? ''} onChange={handle('end_date')} className="bg-zinc-900 border-zinc-700 text-white" />
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
      <div className="space-y-1.5">
        <Label className="text-zinc-300 text-sm">Local</Label>
        <Input
          placeholder="Ex: Feed do TikTok, TopView"
          value={data.placement ?? ''}
          onChange={handle('placement')}
          className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
        />
      </div>
    </div>
  );
};
