import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CampaignFormPayload } from '@/types/campaigns';

interface DirectioningStepProps {
  data: CampaignFormPayload['adSet'];
  onChange: (field: keyof CampaignFormPayload['adSet'], value: string | null) => void;
}

// Tag chip input for interests
const TagInput: React.FC<{
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  const tags = value ? value.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const addTag = (raw: string) => {
    const newTags = raw.split(',').map((t) => t.trim()).filter(Boolean);
    const merged = [...new Set([...tags, ...newTags])];
    onChange(merged.length ? merged.join(', ') : null);
    setInput('');
  };

  const removeTag = (idx: number) => {
    const updated = tags.filter((_, i) => i !== idx);
    onChange(updated.length ? updated.join(', ') : null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div
      className="min-h-10 flex flex-wrap gap-1.5 items-center bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 focus-within:border-orange-500 transition-colors cursor-text"
      onClick={() => document.getElementById('dir-tag-input')?.focus()}
    >
      {tags.map((tag, i) => (
        <span key={i} className="flex items-center gap-1 bg-orange-500/20 text-orange-300 text-xs px-2 py-0.5 rounded-full">
          {tag}
          <button type="button" onClick={() => removeTag(i)} className="hover:text-orange-100">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        id="dir-tag-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[100px] bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
      />
    </div>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest pt-2">{children}</p>
);

export const DirectioningStep: React.FC<DirectioningStepProps> = ({ data, onChange }) => {
  const audienceMode = (data as { audience_mode?: string }).audience_mode ?? 'auto';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Direcionamento</h3>
        <p className="text-sm text-zinc-400">
          Configure quem vai ver seus anúncios. Use automático para deixar o TikTok otimizar.
        </p>
      </div>

      {/* Audience mode */}
      <div className="space-y-3">
        <Label className="text-zinc-300 text-sm">Modo de Audiência</Label>
        <div className="flex gap-2">
          {(['auto', 'manual', 'saved'] as const).map((mode) => {
            const labels = { auto: 'Automático (Smart+)', manual: 'Manual', saved: 'Audiência Salva' };
            const active = audienceMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onChange('audience_mode' as keyof CampaignFormPayload['adSet'], mode)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  active
                    ? 'bg-orange-500/15 border-orange-500 text-orange-300'
                    : 'bg-zinc-900/30 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>

        {audienceMode === 'auto' && (
          <div className="rounded-lg bg-zinc-800/40 border border-zinc-700/50 px-4 py-3">
            <p className="text-xs text-zinc-300 font-medium">🤖 Smart+ — Audiência Automática</p>
            <p className="text-xs text-zinc-500 mt-1">
              O algoritmo do TikTok define automaticamente a melhor audiência para seus objetivos. Nenhuma configuração manual necessária.
            </p>
          </div>
        )}

        {audienceMode === 'saved' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">ID da Audiência Salva</Label>
              <Input
                placeholder="Ex: 7123456789012345678"
                value={(data as { saved_audience_id?: string | null }).saved_audience_id ?? ''}
                onChange={(e) => onChange('saved_audience_id' as keyof CampaignFormPayload['adSet'], e.target.value || null)}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Nome da Audiência (opcional)</Label>
              <Input
                placeholder="Ex: Mulheres 25-35 Moda"
                value={(data as { saved_audience_name?: string | null }).saved_audience_name ?? ''}
                onChange={(e) => onChange('saved_audience_name' as keyof CampaignFormPayload['adSet'], e.target.value || null)}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              Insira o ID da audiência criada em TikTok Ads Manager → Ferramentas → Audiências.
            </p>
          </div>
        )}

        {audienceMode === 'manual' && (
          <div className="space-y-4">
            <SectionLabel>DADOS DEMOGRÁFICOS</SectionLabel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Localização</Label>
                <Input
                  placeholder="Ex: Brasil, São Paulo"
                  value={data.audience_location ?? ''}
                  onChange={(e) => onChange('audience_location', e.target.value || null)}
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Faixa Etária</Label>
                <Input
                  placeholder="Ex: 18-35 ou 13-17, 18-24"
                  value={data.audience_age ?? ''}
                  onChange={(e) => onChange('audience_age', e.target.value || null)}
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Gênero</Label>
              <Select
                value={data.audience_gender ?? 'all'}
                onValueChange={(v) => onChange('audience_gender', v)}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <SectionLabel>SEGMENTAÇÃO DETALHADA</SectionLabel>

            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Interesses e Comportamentos</Label>
              <TagInput
                value={data.audience_interests}
                onChange={(v) => onChange('audience_interests', v)}
                placeholder="Digite e pressione Enter ou vírgula"
              />
              <p className="text-[11px] text-zinc-500">Pressione Enter ou vírgula para adicionar.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Comportamento do Público</Label>
              <textarea
                placeholder="Descreva comportamentos adicionais..."
                value={data.audience_behavior ?? ''}
                onChange={(e) => onChange('audience_behavior', e.target.value || null)}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
