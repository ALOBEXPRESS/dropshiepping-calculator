import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCampaigns } from '@/hooks/useCampaigns';
import { CampaignSettingsStep } from './CampaignSettingsStep';
import { AdSetSettingsStep } from './AdSetSettingsStep';
import { DirectioningStep } from './DirectioningStep';
import { ProductLinkingStep } from './ProductLinkingStep';
import type {
  CampaignWithRelations,
  CampaignFormPayload,
  CampaignObjective,
  CampaignMarketplace,
} from '@/types/campaigns';

interface CampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: CampaignWithRelations;
  organizationId: string;
  marketplace?: CampaignMarketplace;
  onSaved: () => void;
}

const STEPS = [
  'Configurações da Campanha',
  'Grupo de Anúncios',
  'Direcionamento',
  'Vincular Produtos',
];

const buildDefault = (organizationId: string, marketplace: CampaignMarketplace = 'tiktok'): CampaignFormPayload => {
  const defaultAdSet: CampaignFormPayload['adSet'] = {
    name: null,
    conversion_type: null,
    start_date: null,
    end_date: null,
    traffic_destination: null,
    optimization_goal: null,
    target_cost_per_result: null,
    audience_mode: 'auto' as const,
    saved_audience_id: null,
    saved_audience_name: null,
    audience_location: null,
    audience_age: null,
    audience_gender: 'all',
    audience_interests: null,
    audience_behavior: null,
    placement: null,
  } as CampaignFormPayload['adSet'];
  return {
    campaign: {
      organization_id: organizationId,
      marketplace,
      name: '',
      objective: 'sales' as CampaignObjective,
      budget_type: 'daily',
      budget_amount: null,
      status: 'active',
    },
    adSet: defaultAdSet,
    adSets: [defaultAdSet],
    products: [],
  };
};

const fromExisting = (c: CampaignWithRelations): CampaignFormPayload => {
  const adSet0 = c.campaign_ad_sets[0];
  const mapAdSet = (a: typeof adSet0) => {
    const ext = a as typeof a & {
      traffic_destination?: string | null;
      optimization_goal?: string | null;
      target_cost_per_result?: number | null;
    };
    return {
      name: a.name,
      conversion_type: a.conversion_type,
      start_date: a.start_date,
      end_date: a.end_date,
      traffic_destination: ext.traffic_destination ?? null,
      optimization_goal: ext.optimization_goal ?? null,
      target_cost_per_result: ext.target_cost_per_result ?? null,
      audience_mode: (a.audience_mode ?? 'auto') as 'auto' | 'manual' | 'saved',
      saved_audience_id: a.saved_audience_id,
      saved_audience_name: a.saved_audience_name,
      audience_location: a.audience_location,
      audience_age: a.audience_age,
      audience_gender: a.audience_gender,
      audience_interests: a.audience_interests,
      audience_behavior: a.audience_behavior,
      placement: a.placement,
    } as CampaignFormPayload['adSet'];
  };
  const def = buildDefault(c.organization_id).adSet;
  const mapped = adSet0 ? mapAdSet(adSet0) : def;
  const allMapped = c.campaign_ad_sets.length > 0 ? c.campaign_ad_sets.map(mapAdSet) : [def];
  return {
    campaign: {
      organization_id: c.organization_id,
      marketplace: c.marketplace,
      name: c.name,
      objective: c.objective,
      budget_type: c.budget_type,
      budget_amount: c.budget_amount,
      status: c.status,
    },
    adSet: mapped,
    adSets: allMapped,
    products: c.campaign_products.map((cp) => ({
      product_id: cp.product_id,
      marketing_cost_override: cp.marketing_cost_override,
      linked_order_id: cp.linked_order_id ?? null,
    })),
  };
};

export const CampaignFormDialog: React.FC<CampaignFormDialogProps> = ({
  open,
  onOpenChange,
  campaign,
  organizationId,
  marketplace = 'tiktok',
  onSaved,
}) => {
  const { createCampaign, updateCampaign } = useCampaigns(organizationId);
  const [step, setStep] = useState(1);
  const [payload, setPayload] = useState<CampaignFormPayload>(() =>
    campaign ? fromExisting(campaign) : buildDefault(organizationId, marketplace)
  );
  const [selectedAdSetIndex, setSelectedAdSetIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setErrors({});
      setSelectedAdSetIndex(0);
      setPayload(campaign ? fromExisting(campaign) : buildDefault(organizationId, marketplace));
    }
  }, [open, campaign, organizationId, marketplace]);

  const setCampaignField = (
    field: keyof CampaignFormPayload['campaign'],
    value: string | number | null
  ) => {
    setPayload((p) => ({ ...p, campaign: { ...p.campaign, [field]: value } }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  // Edit a specific adSet by index — also syncs payload.adSet to selected
  const setAdSetField = (
    field: keyof CampaignFormPayload['adSet'],
    value: string | number | null,
    index?: number
  ) => {
    const idx = index ?? selectedAdSetIndex;
    setPayload((p) => {
      const newAdSets = p.adSets.map((a, i) =>
        i === idx ? { ...a, [field]: value } : a
      );
      return {
        ...p,
        adSet: newAdSets[selectedAdSetIndex] ?? p.adSet,
        adSets: newAdSets,
      };
    });
  };

  // Keep payload.adSet in sync when switching selected tab
  const selectAdSet = (idx: number) => {
    setSelectedAdSetIndex(idx);
    setPayload((p) => ({ ...p, adSet: p.adSets[idx] ?? p.adSet }));
  };

  const addAdSet = () => {
    setPayload((p) => {
      const newAdSet = { ...buildDefault(organizationId).adSet, name: `Grupo ${p.adSets.length + 1}` };
      const newAdSets = [...p.adSets, newAdSet];
      const newIdx = newAdSets.length - 1;
      setSelectedAdSetIndex(newIdx);
      return { ...p, adSet: newAdSet, adSets: newAdSets };
    });
  };

  const removeAdSet = (idx: number) => {
    setPayload((p) => {
      if (p.adSets.length <= 1) return p;
      const newAdSets = p.adSets.filter((_, i) => i !== idx);
      const newIdx = Math.min(selectedAdSetIndex, newAdSets.length - 1);
      setSelectedAdSetIndex(newIdx);
      return { ...p, adSet: newAdSets[newIdx], adSets: newAdSets };
    });
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!payload.campaign.name.trim()) errs.name = 'Nome é obrigatório.';
    if (!payload.campaign.objective) errs.objective = 'Selecione um objetivo.';
    if (payload.campaign.budget_amount == null || payload.campaign.budget_amount <= 0)
      errs.budget_amount = 'Informe um valor de orçamento.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleStepClick = (n: number) => {
    if (n === step) return;
    // Ao avançar a partir da etapa 1, valida os campos obrigatórios antes de permitir o salto.
    if (n > step && step === 1 && !validateStep1()) return;
    setStep(n);
  };

  const handleSave = async () => {
    if (!validateStep1()) { setStep(1); return; }
    setSaving(true);
    try {
      if (campaign) {
        await updateCampaign(campaign.id, payload);
      } else {
        await createCampaign(payload);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error('Erro ao salvar campanha', {
        description: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-lg font-semibold text-white">
            {campaign ? 'Editar Campanha' : 'Nova Campanha'}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-0">
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const active = step === n;
              const done = step > n;
              return (
                <React.Fragment key={n}>
                  <button
                    type="button"
                    onClick={() => handleStepClick(n)}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                        active
                          ? 'bg-orange-500 text-white'
                          : done
                          ? 'bg-green-600 text-white'
                          : 'bg-zinc-700 text-zinc-400'
                      }`}
                    >
                      {done ? '✓' : n}
                    </span>
                    <span className={`text-xs hidden sm:block ${active ? 'text-white font-medium' : 'text-zinc-500'}`}>
                      {label}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px ${done ? 'bg-green-600' : 'bg-zinc-700'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <p className="text-xs text-zinc-500 mt-1.5">Etapa {step} de {STEPS.length}</p>
        </div>

        {/* Step content */}
        <div className="px-6 py-5 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <CampaignSettingsStep
              data={payload.campaign}
              onChange={setCampaignField}
              errors={errors}
            />
          )}
          {step === 2 && (
            <div className="space-y-4">
              {/* AdSet tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                {payload.adSets.map((a, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => selectAdSet(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedAdSetIndex === i
                          ? 'bg-orange-500 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {a.name || `Grupo ${i + 1}`}
                    </button>
                    {payload.adSets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAdSet(i)}
                        className="text-zinc-500 hover:text-red-400 transition-colors"
                        title="Remover grupo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAdSet}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors border border-dashed border-zinc-600"
                >
                  <Plus className="w-3 h-3" />
                  Novo Grupo
                </button>
              </div>
              <AdSetSettingsStep
                data={payload.adSets[selectedAdSetIndex] ?? payload.adSet}
                campaignObjective={payload.campaign.objective as CampaignObjective}
                onChange={(field, value) => setAdSetField(field, value)}
              />
            </div>
          )}
          {step === 3 && (
            <DirectioningStep
              data={payload.adSet}
              onChange={setAdSetField}
            />
          )}
          {step === 4 && (
            <ProductLinkingStep
              organizationId={organizationId}
              selectedProducts={payload.products}
              onChange={(products) => setPayload((p) => ({ ...p, products }))}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="text-zinc-400 hover:text-white"
          >
            Cancelar
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={saving}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Voltar
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="outline"
              className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 min-w-[80px]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </Button>
            {step < STEPS.length && (
              <Button
                onClick={handleNext}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Próximo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
