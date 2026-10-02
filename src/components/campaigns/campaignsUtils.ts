import { formatCurrency } from '@/utils/currency';
import type {
  CampaignWithRelations,
  CampaignStatus,
  CampaignObjective,
} from '@/types/campaigns';
import type { AdAccountWithStats } from '@/types/adAccounts';

export type SortKey =
  | 'date_desc'
  | 'date_asc'
  | 'name_asc'
  | 'name_desc'
  | 'budget_desc'
  | 'budget_asc'
  | 'status';

export interface AccountGroup {
  key: string;
  account?: AdAccountWithStats | CampaignWithRelations['ad_account'];
  campaigns: CampaignWithRelations[];
  marketingCost: number;
  budget: number;
}

export interface ObjectiveGroup {
  key: string;
  label: string;
  icon: string;
  color: string;
  borderColor: string;
  campaigns: CampaignWithRelations[];
  marketingCost: number;
}

/**
 * Formats a monetary number into Brazilian Real (pt-BR) format with 2 decimals.
 * Reuses the central formatCurrency utility with 0.00 fallback.
 */
export function formatBRL(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '0,00';
  const formatted = formatCurrency(value);
  return formatted || '0,00';
}

/**
 * Safely adds two monetary amounts avoiding IEEE-754 floating point artifacts.
 */
export function safeAddMoney(a: number, b: number): number {
  const centsA = Math.round((Number(a) || 0) * 100);
  const centsB = Math.round((Number(b) || 0) * 100);
  return (centsA + centsB) / 100;
}

/**
 * Calculates the total marketing cost for a single campaign.
 * Precedence:
 * 1. Sum of product marketing_cost_override (if set).
 * 2. If no products have override but adSets have target_cost_per_result, fallback to that.
 */
export function calculateCampaignMarketingCost(campaign: CampaignWithRelations): number {
  if (!campaign) return 0;

  const products = campaign.campaign_products ?? [];
  let productCostSum = 0;
  let hasProductOverride = false;

  for (const p of products) {
    if (p.marketing_cost_override != null && !isNaN(Number(p.marketing_cost_override))) {
      productCostSum = safeAddMoney(productCostSum, Number(p.marketing_cost_override));
      hasProductOverride = true;
    }
  }

  if (hasProductOverride && productCostSum > 0) {
    return productCostSum;
  }

  // Fallback: If no products or products had no cost override, check ad sets
  const adSets = campaign.campaign_ad_sets ?? [];
  let adSetsCostSum = 0;
  for (const adSet of adSets) {
    const cost = (adSet as { target_cost_per_result?: number | null }).target_cost_per_result;
    if (cost != null && !isNaN(Number(cost))) {
      adSetsCostSum = safeAddMoney(adSetsCostSum, Number(cost));
    }
  }

  return adSetsCostSum;
}

/**
 * Calculates the total marketing cost across an array of campaigns.
 */
export function calculateTotalMarketingCost(campaigns: CampaignWithRelations[]): number {
  let total = 0;
  for (const c of campaigns) {
    total = safeAddMoney(total, calculateCampaignMarketingCost(c));
  }
  return total;
}

/**
 * Calculates the total budget across an array of campaigns.
 */
export function calculateTotalBudget(campaigns: CampaignWithRelations[]): number {
  let total = 0;
  for (const c of campaigns) {
    if (c.budget_amount != null && !isNaN(Number(c.budget_amount))) {
      total = safeAddMoney(total, Number(c.budget_amount));
    }
  }
  return total;
}

/**
 * Counts unique ad account IDs linked to campaigns.
 */
export function getUniqueAdAccountsCount(campaigns: CampaignWithRelations[]): number {
  const ids = new Set<string>();
  for (const c of campaigns) {
    if (c.ad_account_id) {
      ids.add(c.ad_account_id);
    }
  }
  return ids.size;
}

/**
 * Filter and sort campaigns by search query, account, and sort key.
 */
export function filterAndSortCampaigns(
  campaigns: CampaignWithRelations[],
  options: {
    search?: string;
    statusFilter?: CampaignStatus | 'all';
    sortKey: SortKey;
  }
): CampaignWithRelations[] {
  const { search = '', statusFilter = 'all', sortKey } = options;
  const q = search.trim().toLowerCase();

  const filtered = campaigns.filter((c) => {
    // Status filter
    if (statusFilter !== 'all' && c.status !== statusFilter) {
      return false;
    }

    // Search query filter (matches name, marketplace, ad account name)
    if (q) {
      const matchName = (c.name ?? '').toLowerCase().includes(q);
      const matchMarketplace = (c.marketplace ?? '').toLowerCase().includes(q);
      const matchAdAccount = (c.ad_account?.name ?? '').toLowerCase().includes(q);
      const matchObjective = (c.objective ?? '').toLowerCase().includes(q);

      if (!matchName && !matchMarketplace && !matchAdAccount && !matchObjective) {
        return false;
      }
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'date_desc': {
        const timeB = new Date(b.created_at || 0).getTime();
        const timeA = new Date(a.created_at || 0).getTime();
        return timeB - timeA;
      }
      case 'date_asc': {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeA - timeB;
      }
      case 'name_asc':
        return (a.name ?? '').localeCompare(b.name ?? '');
      case 'name_desc':
        return (b.name ?? '').localeCompare(a.name ?? '');
      case 'budget_desc':
        return (Number(b.budget_amount) || 0) - (Number(a.budget_amount) || 0);
      case 'budget_asc':
        return (Number(a.budget_amount) || 0) - (Number(b.budget_amount) || 0);
      case 'status': {
        const order: Record<string, number> = { active: 0, paused: 1, ended: 2 };
        return (order[a.status] ?? 9) - (order[b.status] ?? 9);
      }
      default:
        return 0;
    }
  });
}

/**
 * Groups campaigns by linked ad account.
 */
export function groupCampaignsByAccount(
  campaigns: CampaignWithRelations[],
  adAccountMap: Map<string, AdAccountWithStats>
): AccountGroup[] {
  const map = new Map<string, CampaignWithRelations[]>();

  for (const c of campaigns) {
    const key = c.ad_account_id ?? 'unassigned';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }

  const sortedKeys = Array.from(map.keys()).sort((a, b) => {
    if (a === 'unassigned') return 1;
    if (b === 'unassigned') return -1;
    const accA = adAccountMap.get(a)?.name ?? '';
    const accB = adAccountMap.get(b)?.name ?? '';
    return accA.localeCompare(accB);
  });

  const groups: AccountGroup[] = [];

  for (const key of sortedKeys) {
    const groupCampaigns = map.get(key) ?? [];
    const account = key !== 'unassigned' ? (adAccountMap.get(key) ?? groupCampaigns[0]?.ad_account) : undefined;
    const marketingCost = calculateTotalMarketingCost(groupCampaigns);
    const budget = calculateTotalBudget(groupCampaigns);

    groups.push({
      key,
      account,
      campaigns: groupCampaigns,
      marketingCost,
      budget,
    });
  }

  return groups;
}

/**
 * Groups campaigns by objective (Conversion vs Consideration/Knowledge).
 */
export function groupCampaignsByObjective(
  campaigns: CampaignWithRelations[]
): ObjectiveGroup[] {
  const CONVERSION_OBJECTIVES = new Set<CampaignObjective>(['sales', 'app_promotion', 'lead_generation']);

  const conversionCampaigns = campaigns.filter((c) => CONVERSION_OBJECTIVES.has(c.objective));
  const considerationCampaigns = campaigns.filter((c) => !CONVERSION_OBJECTIVES.has(c.objective));

  const groups: ObjectiveGroup[] = [];

  if (conversionCampaigns.length > 0) {
    groups.push({
      key: 'conversao',
      label: 'Conversão',
      icon: '💰',
      color: 'text-orange-400',
      borderColor: 'border-orange-500/30',
      campaigns: conversionCampaigns,
      marketingCost: calculateTotalMarketingCost(conversionCampaigns),
    });
  }

  if (considerationCampaigns.length > 0) {
    groups.push({
      key: 'consideracao',
      label: 'Consideração & Conhecimento',
      icon: '👁',
      color: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      campaigns: considerationCampaigns,
      marketingCost: calculateTotalMarketingCost(considerationCampaigns),
    });
  }

  return groups;
}

/**
 * Calculates derived metrics safely (handling division by zero and nulls).
 */
export interface CalculatedMetrics {
  ctr: number; // Click-Through Rate (%)
  conversionRate: number; // (%)
  cpc: number; // Cost Per Click (R$)
  cpm: number; // Cost Per Mille impressions (R$)
  cpa: number; // Cost Per Acquisition / Sale (R$)
}

export function calculateDerivedMetrics(
  marketingCost: number,
  metrics: {
    views?: number;
    sales?: number;
    impressions?: number;
    clicks?: number;
  }
): CalculatedMetrics {
  const sales = Math.max(0, metrics.sales || 0);
  const impressions = Math.max(0, metrics.impressions || 0);
  const clicks = Math.max(0, metrics.clicks || 0);
  const cost = Math.max(0, marketingCost || 0);

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const conversionRate = clicks > 0 ? (sales / clicks) * 100 : 0;
  const cpc = clicks > 0 ? cost / clicks : 0;
  const cpm = impressions > 0 ? (cost / impressions) * 1000 : 0;
  const cpa = sales > 0 ? cost / sales : 0;

  return {
    ctr: Math.round(ctr * 100) / 100,
    conversionRate: Math.round(conversionRate * 100) / 100,
    cpc: Math.round(cpc * 100) / 100,
    cpm: Math.round(cpm * 100) / 100,
    cpa: Math.round(cpa * 100) / 100,
  };
}
