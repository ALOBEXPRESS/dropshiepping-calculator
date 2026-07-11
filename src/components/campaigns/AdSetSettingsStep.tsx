import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CampaignFormPayload } from '@/types/campaigns';

interface AdSetSettingsStepProps {
  data: CampaignFormPayload['adSet'];
  onChange: (field: keyof CampaignFormPayload['adSet'], value: string | null) => void;
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pt-2">{children}</p>
);

export const AdSetSettingsStep: React.FC<AdSetSettingsStepProps> = ({ data, onChange }) => {
  const handle = (field: keyof CampaignFormPayload['adSet']) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(field, e.target.value || null);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Grupo de Anúncios</h3>
        <p className="text-sm text-zinc-400">Configure o público-alvo e período da sua campanha. Todos os campos são opcionais.</p>
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
          <Input
            type="date"
            value={data.start_date ?? ''}
            onChange={handle('start_date')}
            className="bg-zinc-900 border-zinc-700 text-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Data de Fim</Label>
          <Input
            type="date"
            value={data.end_date ?? ''}
            onChange={handle('end_date')}
            className="bg-zinc-900 border-zinc-700 text-white"
          />
        </div>
      </div>

      <SectionLabel>PÚBLICO</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Localização</Label>
          <Input
            placeholder="Ex: Brasil, São Paulo"
            value={data.audience_location ?? ''}
            onChange={handle('audience_location')}
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Faixa Etária</Label>
          <Input
            placeholder="Ex: 18-35"
            value={data.audience_age ?? ''}
            onChange={handle('audience_age')}
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Gênero</Label>
          <Select
            value={data.audience_gender ?? 'all'}
            onValueChange={(v) => onChange('audience_gender', v)}
          >
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Feminino</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-zinc-300 text-sm">Interesses</Label>
          <Input
            placeholder="Ex: Moda, Beleza, E-commerce"
            value={data.audience_interests ?? ''}
            onChange={handle('audience_interests')}
            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-300 text-sm">Comportamento</Label>
        <textarea
          placeholder="Descreva os comportamentos do público-alvo..."
          value={data.audience_behavior ?? ''}
          onChange={handle('audience_behavior')}
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
        />
      </div>

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
