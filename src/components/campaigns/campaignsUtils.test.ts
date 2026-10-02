import { describe, it, expect } from 'vitest';
import {
  formatBRL,
  safeAddMoney,
  calculateCampaignMarketingCost,
  calculateTotalMarketingCost,
  calculateTotalBudget,
  getUniqueAdAccountsCount,
  filterAndSortCampaigns,
  groupCampaignsByAccount,
  groupCampaignsByObjective,
  calculateDerivedMetrics,
} from './campaignsUtils';
import type { CampaignWithRelations } from '@/types/campaigns';
import type { AdAccountWithStats } from '@/types/adAccounts';

describe('campaignsUtils', () => {
  describe('formatBRL & safeAddMoney', () => {
    it('formats numbers to pt-BR with 2 decimal places', () => {
      expect(formatBRL(0)).toBe('0,00');
      expect(formatBRL(null)).toBe('0,00');
      expect(formatBRL(undefined)).toBe('0,00');
      expect(formatBRL(399.01)).toBe('399,01');
      expect(formatBRL(14055.4)).toBe('14.055,40');
    });

    it('avoids floating point arithmetic errors', () => {
      // 0.1 + 0.2 = 0.30000000000000004 in normal JS
      expect(0.1 + 0.2).not.toBe(0.3);
      expect(safeAddMoney(0.1, 0.2)).toBe(0.3);
      expect(safeAddMoney(399.01, 0.09)).toBe(399.1);
    });
  });

  describe('calculateCampaignMarketingCost', () => {
    it('sums marketing_cost_override from linked products', () => {
      const campaign: CampaignWithRelations = {
        id: 'c1',
        organization_id: 'org1',
        name: 'Campanha 1',
        marketplace: 'tiktok',
        objective: 'sales',
        budget_type: 'daily',
        budget_amount: 100,
        status: 'active',
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
        campaign_ad_sets: [],
        campaign_products: [
          { id: 'cp1', campaign_id: 'c1', product_id: 'p1', marketing_cost_override: 150.5, linked_order_id: null },
          { id: 'cp2', campaign_id: 'c1', product_id: 'p2', marketing_cost_override: 49.5, linked_order_id: null },
        ],
      };
      expect(calculateCampaignMarketingCost(campaign)).toBe(200);
    });

    it('falls back to ad sets target_cost_per_result when products have no override', () => {
      const campaign: CampaignWithRelations = {
        id: 'c2',
        organization_id: 'org1',
        name: 'Campanha 2',
        marketplace: 'tiktok',
        objective: 'sales',
        budget_type: 'daily',
        budget_amount: 50,
        status: 'active',
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
        campaign_ad_sets: [
          {
            id: 'as1',
            campaign_id: 'c2',
            name: 'Grupo 1',
            conversion_type: null,
            start_date: null,
            end_date: null,
            traffic_destination: null,
            optimization_goal: null,
            target_cost_per_result: 75.25,
            audience_mode: 'auto',
            saved_audience_id: null,
            saved_audience_name: null,
            audience_location: null,
            audience_age: null,
            audience_gender: 'all',
            audience_interests: null,
            audience_behavior: null,
            placement: null,
            created_at: '2026-09-01T00:00:00Z',
            ad_media_url: null,
            ad_redirect_url: null,
            ad_text: null,
            ad_title: null,
            ad_cta: null,
            ad_media_type: null,
          },
        ],
        campaign_products: [],
      };
      expect(calculateCampaignMarketingCost(campaign)).toBe(75.25);
    });
  });

  describe('calculateTotalMarketingCost and calculateTotalBudget', () => {
    const campaigns: CampaignWithRelations[] = [
      {
        id: 'c1',
        organization_id: 'org1',
        name: 'C1',
        marketplace: 'tiktok',
        objective: 'sales',
        budget_type: 'daily',
        budget_amount: 1000,
        status: 'active',
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
        campaign_ad_sets: [],
        campaign_products: [
          { id: 'p1', campaign_id: 'c1', product_id: 'p1', marketing_cost_override: 199.01, linked_order_id: null },
        ],
      },
      {
        id: 'c2',
        organization_id: 'org1',
        name: 'C2',
        marketplace: 'tiktok',
        objective: 'traffic',
        budget_type: 'lifetime',
        budget_amount: 2000,
        status: 'ended',
        created_at: '2026-09-02T00:00:00Z',
        updated_at: '2026-09-02T00:00:00Z',
        campaign_ad_sets: [],
        campaign_products: [
          { id: 'p2', campaign_id: 'c2', product_id: 'p2', marketing_cost_override: 200.0, linked_order_id: null },
        ],
      },
    ];

    it('correctly aggregates marketing costs and budget', () => {
      expect(calculateTotalMarketingCost(campaigns)).toBe(399.01);
      expect(calculateTotalBudget(campaigns)).toBe(3000);
    });

    it('counts unique ad accounts correctly', () => {
      const withAccounts: CampaignWithRelations[] = [
        { ...campaigns[0], ad_account_id: 'acc-1' },
        { ...campaigns[1], ad_account_id: 'acc-1' },
        { ...campaigns[0], id: 'c3', ad_account_id: 'acc-2' },
        { ...campaigns[1], id: 'c4', ad_account_id: null },
      ];
      expect(getUniqueAdAccountsCount(withAccounts)).toBe(2);
    });
  });

  describe('filterAndSortCampaigns', () => {
    const list: CampaignWithRelations[] = [
      {
        id: 'c1',
        organization_id: 'org1',
        name: 'GMV MAX | Camisas',
        marketplace: 'tiktok',
        objective: 'sales',
        budget_type: 'daily',
        budget_amount: 50,
        status: 'ended',
        created_at: '2026-09-01T10:00:00Z',
        updated_at: '2026-09-01T10:00:00Z',
        campaign_ad_sets: [],
        campaign_products: [],
      },
      {
        id: 'c2',
        organization_id: 'org1',
        name: 'Interação Comunitária 2026',
        marketplace: 'tiktok',
        objective: 'community_interaction',
        budget_type: 'daily',
        budget_amount: 150,
        status: 'active',
        created_at: '2026-09-03T10:00:00Z',
        updated_at: '2026-09-03T10:00:00Z',
        campaign_ad_sets: [],
        campaign_products: [],
      },
    ];

    it('filters by case-insensitive search term', () => {
      const res = filterAndSortCampaigns(list, { search: 'camisas', sortKey: 'date_desc' });
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe('c1');
    });

    it('filters by status', () => {
      const res = filterAndSortCampaigns(list, { statusFilter: 'active', sortKey: 'date_desc' });
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe('c2');
    });

    it('sorts by budget descending', () => {
      const res = filterAndSortCampaigns(list, { sortKey: 'budget_desc' });
      expect(res[0].id).toBe('c2'); // 150 > 50
      expect(res[1].id).toBe('c1');
    });

    it('sorts by status (active before ended)', () => {
      const res = filterAndSortCampaigns(list, { sortKey: 'status' });
      expect(res[0].status).toBe('active');
      expect(res[1].status).toBe('ended');
    });
  });

  describe('calculateDerivedMetrics', () => {
    it('handles zero impressions and zero clicks safely without dividing by zero', () => {
      const metrics = calculateDerivedMetrics(100, {
        impressions: 0,
        clicks: 0,
        sales: 0,
      });
      expect(metrics.ctr).toBe(0);
      expect(metrics.conversionRate).toBe(0);
      expect(metrics.cpc).toBe(0);
      expect(metrics.cpm).toBe(0);
      expect(metrics.cpa).toBe(0);
    });

    it('correctly calculates CTR, CPC, CPM, CPA, and conversionRate', () => {
      const metrics = calculateDerivedMetrics(200, {
        impressions: 10000,
        clicks: 500,
        sales: 25,
      });
      // CTR: 500 / 10000 * 100 = 5%
      expect(metrics.ctr).toBe(5);
      // conversionRate: 25 / 500 * 100 = 5%
      expect(metrics.conversionRate).toBe(5);
      // CPC: 200 / 500 = 0.40
      expect(metrics.cpc).toBe(0.4);
      // CPM: (200 / 10000) * 1000 = 20.00
      expect(metrics.cpm).toBe(20);
      // CPA: 200 / 25 = 8.00
      expect(metrics.cpa).toBe(8);
    });
  });

  describe('groupCampaignsByAccount & groupCampaignsByObjective', () => {
    const campaigns: CampaignWithRelations[] = [
      {
        id: 'c1',
        organization_id: 'org1',
        name: 'Campanha Vendas',
        marketplace: 'tiktok',
        objective: 'sales',
        budget_type: 'daily',
        budget_amount: 100,
        status: 'active',
        created_at: '2026-09-01T00:00:00Z',
        updated_at: '2026-09-01T00:00:00Z',
        ad_account_id: 'acc1',
        campaign_ad_sets: [],
        campaign_products: [
          { id: 'cp1', campaign_id: 'c1', product_id: 'p1', marketing_cost_override: 50, linked_order_id: null },
        ],
      },
      {
        id: 'c2',
        organization_id: 'org1',
        name: 'Campanha Tráfego',
        marketplace: 'tiktok',
        objective: 'traffic',
        budget_type: 'daily',
        budget_amount: 50,
        status: 'active',
        created_at: '2026-09-02T00:00:00Z',
        updated_at: '2026-09-02T00:00:00Z',
        ad_account_id: null,
        campaign_ad_sets: [],
        campaign_products: [
          { id: 'cp2', campaign_id: 'c2', product_id: 'p2', marketing_cost_override: 20, linked_order_id: null },
        ],
      },
    ];

    it('groups by account including unassigned group', () => {
      const accountMap = new Map<string, AdAccountWithStats>([
        ['acc1', { id: 'acc1', name: 'TikTok Main', status: 'active', organization_id: 'org1', marketplace: 'tiktok', created_at: '', updated_at: '', campaign_count: 1, total_spend: 50, average_roas: 2 }],
      ]);
      const groups = groupCampaignsByAccount(campaigns, accountMap);
      expect(groups).toHaveLength(2);
      expect(groups[0].key).toBe('acc1');
      expect(groups[0].marketingCost).toBe(50);
      expect(groups[1].key).toBe('unassigned');
      expect(groups[1].marketingCost).toBe(20);
    });

    it('groups by objective categories (Conversão vs Consideração)', () => {
      const objGroups = groupCampaignsByObjective(campaigns);
      expect(objGroups).toHaveLength(2);
      expect(objGroups[0].key).toBe('conversao');
      expect(objGroups[0].campaigns).toHaveLength(1);
      expect(objGroups[1].key).toBe('consideracao');
      expect(objGroups[1].campaigns).toHaveLength(1);
    });
  });
});
