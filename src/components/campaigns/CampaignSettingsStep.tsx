import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ObjectivePicker } from './ObjectivePicker';
import type { CampaignFormPayload, CampaignObjective } from '@/types/campaigns';

interface CampaignSettingsStepProps {
  data: CampaignFormPayload['campaign'];
  onChange: (field: keyof CampaignFormPayload['campaign'], value: string | number | null) => void;
  errors: Record<string, string>;
}

export const CampaignSettingsStep: React.FC<CampaignSettingsStepProps> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-white mb-1">Configurações da Campanha</h3>
        <p className="text-sm text-zinc-400">Defina o objetivo e orçamento da sua campanha TikTok.</p>
      </div>

      {/* Grid: Name + Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="campaign-name" className="text-zinc-300 text-sm">
            Nome da Campanha <span className="text-red-400">*</span>
          </Label>
          <Input
            id="campaign-name"
            type="text"
            placeholder="Ex: Campanha de Verão TikTok"
            value={data.name}
            onChange={(e) => onChange('name', e.target.value)}
            className={`bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 ${
              errors.name ? 'border-red-500' : ''
            }`}
            aria-required="true"
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="campaign-status" className="text-zinc-300 text-sm">Status</Label>
          <Select value={data.status} onValueChange={(v) => onChange('status', v)}>
            <SelectTrigger id="campaign-status" className="bg-zinc-900 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
              <SelectItem value="ended">Encerrado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid: Budget type + Amount */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="budget-type" className="text-zinc-300 text-sm">Tipo de Orçamento</Label>
          <Select value={data.budget_type} onValueChange={(v) => onChange('budget_type', v)}>
            <SelectTrigger id="budget-type" className="bg-zinc-900 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="daily">Diário</SelectItem>
              <SelectItem value="lifetime">Vitalício</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-zinc-500">
            {data.budget_type === 'daily'
              ? 'Gasto médio por dia. Ideal para campanhas contínuas. Mínimo: R$50/dia.'
              : 'Total para toda a campanha. Ideal para lançamentos e datas fixas.'}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="budget-amount" className="text-zinc-300 text-sm">
            Valor do Orçamento (R$) <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">R$</span>
            <Input
              id="budget-amount"
              type="text"
              inputMode="numeric"
              placeholder="1.000,00"
              value={
                data.budget_amount != null
                  ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(data.budget_amount)
                  : ''
              }
              onChange={(e) => {
                const raw = e.target.value.replace(/\./g, '').replace(',', '.');
                const num = parseFloat(raw);
                onChange('budget_amount', isNaN(num) ? null : num);
              }}
              className={`pl-9 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 ${
                errors.budget_amount ? 'border-red-500' : ''
              }`}
              aria-required="true"
              aria-invalid={!!errors.budget_amount}
            />
          </div>
          {errors.budget_amount && <p className="text-xs text-red-400">{errors.budget_amount}</p>}
        </div>
      </div>

      {/* Objective picker — full width */}
      <div className="space-y-1.5">
        <Label className="text-zinc-300 text-sm">
          Objetivo da Campanha <span className="text-red-400">*</span>
        </Label>
        <ObjectivePicker
          value={data.objective as CampaignObjective}
          onChange={(v) => onChange('objective', v)}
        />
        {errors.objective && <p className="text-xs text-red-400 mt-1">{errors.objective}</p>}
      </div>
    </div>
  );
};
