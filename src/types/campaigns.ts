// Campaign types — extensible for multiple ad platforms

export type CampaignMarketplace = 'tiktok' | 'facebook' | 'google' | (string & {});

export type CampaignObjective =
  | 'reach'
  | 'traffic'
  | 'video_views'
  | 'community_interaction'
  | 'app_promotion'      // TikTok Conversion: App Promotion
  | 'lead_generation'
  | 'sales';

export type CampaignBudgetType = 'daily' | 'lifetime'; // TikTok: "Daily Budget" | "Lifetime Budget"

export type CampaignStatus = 'active' | 'paused' | 'ended';

export type AudienceGender = 'all' | 'male' | 'female';

export interface Campaign {
  id: string;
  organization_id: string;
  marketplace: CampaignMarketplace;
  name: string;
  objective: CampaignObjective;
  budget_type: CampaignBudgetType;
  budget_amount: number | null;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
}

export interface CampaignAdSet {
  id: string;
  campaign_id: string;
  name: string | null;
  conversion_type: string | null;
  start_date: string | null;  // 'YYYY-MM-DD'
  end_date: string | null;    // 'YYYY-MM-DD'
  audience_location: string | null;
  audience_age: string | null;
  audience_gender: AudienceGender;
  audience_interests: string | null;
  audience_behavior: string | null;
  placement: string | null;
  created_at: string;
}

export interface CampaignProduct {
  id: string;
  campaign_id: string;
  product_id: string;
  marketing_cost_override: number | null;
}

export interface CampaignWithRelations extends Campaign {
  campaign_ad_sets: CampaignAdSet[];
  campaign_products: CampaignProduct[];
}

/** Payload used by the create/edit form */
export interface CampaignFormPayload {
  campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>;
  adSet: Omit<CampaignAdSet, 'id' | 'campaign_id' | 'created_at'>;
  products: Array<{
    product_id: string;
    marketing_cost_override: number | null;
  }>;
}

// ── Static objective metadata ─────────────────────────────────────────────────

export interface ObjectiveOption {
  value: CampaignObjective;
  label: string;
  description: string;
}

export interface ObjectiveCategory {
  key: string;
  label: string;
  options: ObjectiveOption[];
}

export const CAMPAIGN_OBJECTIVE_CATEGORIES: ObjectiveCategory[] = [
  {
    key: 'conhecimento',
    label: 'Conhecimento',
    options: [
      {
        value: 'reach',
        label: 'Alcançar',
        description: 'Mostre seu anúncio para o maior número de pessoas possível.',
      },
    ],
  },
  {
    key: 'consideracao',
    label: 'Consideração',
    options: [
      {
        value: 'traffic',
        label: 'Tráfego',
        description: 'Direcione tráfego de alta qualidade para seu site, app ou Loja do TikTok.',
      },
      {
        value: 'video_views',
        label: 'Visualizações de Vídeo',
        description: 'Maximize as visualizações do seu vídeo e o engajamento.',
      },
      {
        value: 'community_interaction',
        label: 'Interação Comunitária',
        description: 'Aumente seguidores e interações na sua comunidade.',
      },
    ],
  },
  {
    key: 'conversao',
    label: 'Conversão',
    options: [
      {
        value: 'app_promotion',
        label: 'Promoção do Aplicativo',
        description: 'Aumente instalações e engajamento no seu aplicativo.',
      },
      {
        value: 'lead_generation',
        label: 'Geração de Leads',
        description: 'Colete dados de clientes usando formulários instantâneos do TikTok.',
      },
      {
        value: 'sales',
        label: 'Vendas',
        description: 'Impulsione compras no seu site, app ou Loja do TikTok.',
      },
    ],
  },
];

export function getObjectiveLabel(objective: CampaignObjective): string {
  for (const cat of CAMPAIGN_OBJECTIVE_CATEGORIES) {
    const opt = cat.options.find((o) => o.value === objective);
    if (opt) return opt.label;
  }
  return objective;
}
