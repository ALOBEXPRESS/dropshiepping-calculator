import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCampaigns } from '@/hooks/useCampaigns';
import { CampaignSettingsStep } from './CampaignSettingsStep';
import { AdSetSettingsStep } from './AdSetSettingsStep';
import { ProductLinkingStep } from './ProductLinkingStep';
import type {
  CampaignWithRelations,
  CampaignFormPayload,
  CampaignObjective,
} from '@/types/campaigns';

interface CampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: CampaignWithRelations;
  organizationId: string;
  onSaved: () => void;
}

const STEPS = [
  'Configurações da Campanha',
  'Grupo de Anúncios',
  'Vincular Produtos',
];

const buildDefault = (organizationId: string): CampaignFormPayload => ({
  campaign: {
    organization_id: organizationId,
    marketplace: 'tiktok',
    name: '',
    objective: 'sales' as CampaignObjective,
    budget_type: 'daily',
    budget_amount: null,
    status: 'active',
  },
  adSet: {
    name: null,
    conversion_type: null,
    start_date: null,
    end_date: null,
    audience_location: null,
    audience_age: null,
    audience_gender: 'all',
    audience_interests: null,
    audience_behavior: null,
    placement: null,
  },
  products: [],
});

const fromExisting = (c: CampaignWithRelations): CampaignFormPayload => ({
  campaign: {
    organization_id: c.organization_id,
    marketplace: c.marketplace,
    name: c.name,
    objective: c.objective,
    budget_type: c.budget_type,
    budget_amount: c.budget_amount,
    status: c.status,
  },
  adSet: c.campaign_ad_sets[0]
    ? {
        name: c.campaign_ad_sets[0].name,
        conversion_type: c.campaign_ad_sets[0].conversion_type,
        start_date: c.campaign_ad_sets[0].start_date,
        end_date: c.campaign_ad_sets[0].end_date,
        audience_location: c.campaign_ad_sets[0].audience_location,
        audience_age: c.campaign_ad_sets[0].audience_age,
        audience_gender: c.campaign_ad_sets[0].audience_gender,
        audience_interests: c.campaign_ad_sets[0].audience_interests,
        audience_behavior: c.campaign_ad_sets[0].audience_behavior,
        placement: c.campaign_ad_sets[0].placement,
      }
    : buildDefault(c.organization_id).adSet,
  products: c.campaign_products.map((cp) => ({
    product_id: cp.product_id,
    marketing_cost_override: cp.marketing_cost_override,
  })),
});

export const CampaignFormDialog: React.FC<CampaignFormDialogProps> = ({
  open,
  onOpenChange,
  campaign,
  organizationId,
  onSaved,
}) => {
  const { createCampaign, updateCampaign } = useCampaigns(organizationId);
  const [step, setStep] = useState(1);
  const [payload, setPayload] = useState<CampaignFormPayload>(() =>
    campaign ? fromExisting(campaign) : buildDefault(organizationId)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reset on open/campaign change
  useEffect(() => {
    if (open) {
      setStep(1);
      setErrors({});
      setPayload(campaign ? fromExisting(campaign) : buildDefault(organizationId));
    }
  }, [open, campaign, organizationId]);

  const setCampaignField = (
    field: keyof CampaignFormPayload['campaign'],
    value: string | number | null
  ) => {
    setPayload((p) => ({ ...p, campaign: { ...p.campaign, [field]: value } }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };

  const setAdSetField = (
    field: keyof CampaignFormPayload['adSet'],
    value: string | null
  ) => {
    setPayload((p) => ({ ...p, adSet: { ...p.adSet, [field]: value } }));
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
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

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
                  <div className="flex items-center gap-1.5">
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
                  </div>
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
            <AdSetSettingsStep
              data={payload.adSet}
              onChange={setAdSetField}
            />
          )}
          {step === 3 && (
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
            {step < 3 ? (
              <Button
                onClick={handleNext}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Próximo
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 text-white min-w-[80px]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
