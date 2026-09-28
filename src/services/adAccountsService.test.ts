import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adAccountSchema } from '../types/adAccounts';
import { AdAccountsService } from './adAccountsService';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

type SupabaseFromReturn = ReturnType<typeof supabase.from>;

describe('adAccountSchema', () => {
  const baseValidInput = {
    name: 'TikTok Ads Brasil',
    platform: 'tiktok' as const,
    status: 'active' as const,
    timezone: 'America/Sao_Paulo',
    currency: 'BRL' as const,
    country: 'BR',
    spending_limit: 5000,
    billing_type: 'prepaid' as const,
    payment_status: 'normal' as const,
    legal_name: 'Minha Empresa Ltda',
    tax_id: '12.345.678/0001-90',
    industry: 'E-commerce',
    email: 'financeiro@empresa.com',
    phone: '+55 11 99999-8888',
    advertiser_id: '7123456789012345678',
    business_center_id: '8123456789012345678',
    pixel_id: 'C9ABC123XYZ',
    catalog_id: 'CAT-456',
  };

  it('validates a complete valid TikTok ad account payload', () => {
    const result = adAccountSchema.safeParse(baseValidInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('TikTok Ads Brasil');
      expect(result.data.platform).toBe('tiktok');
      expect(result.data.advertiser_id).toBe('7123456789012345678');
      expect(result.data.currency).toBe('BRL');
    }
  });

  it('fails if name is too short', () => {
    const input = {
      ...baseValidInput,
      name: 'A',
    };
    const result = adAccountSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('fails if platform is not tiktok', () => {
    const input = {
      ...baseValidInput,
      platform: 'meta',
    };
    const result = adAccountSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('fails if email format is invalid', () => {
    const input = {
      ...baseValidInput,
      email: 'not-an-email',
    };
    const result = adAccountSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be empty strings or omitted', () => {
    const input = {
      ...baseValidInput,
      spending_limit: null,
      email: '',
      legal_name: '',
      tax_id: '',
    };
    const result = adAccountSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.spending_limit).toBeNull();
      expect(result.data.email).toBe('');
      expect(result.data.legal_name).toBe('');
    }
  });
});

describe('AdAccountsService', () => {
  const orgId = 'org-test-uuid-123';
  const accountId = 'acc-test-uuid-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('queries ad_accounts with campaigns and maps stats', async () => {
      const mockAccounts = [
        {
          id: accountId,
          organization_id: orgId,
          name: 'Conta TikTok Principal',
          platform: 'tiktok',
          status: 'active',
          timezone: 'America/Sao_Paulo',
          currency: 'BRL',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      const mockCampaigns = [
        {
          id: 'camp-1',
          ad_account_id: accountId,
          budget_amount: 1000,
          campaign_products: [{ marketing_cost_override: 150 }],
        },
        {
          id: 'camp-2',
          ad_account_id: accountId,
          budget_amount: 500,
          campaign_products: [{ marketing_cost_override: 50 }],
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ad_accounts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockAccounts, error: null }),
              }),
            }),
          } as unknown as SupabaseFromReturn;
        }
        if (table === 'campaigns') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockCampaigns, error: null }),
            }),
          } as unknown as SupabaseFromReturn;
        }
        return {} as unknown as SupabaseFromReturn;
      });

      const accounts = await AdAccountsService.list(orgId);

      expect(supabase.from).toHaveBeenCalledWith('ad_accounts');
      expect(supabase.from).toHaveBeenCalledWith('campaigns');
      expect(accounts).toHaveLength(1);
      expect(accounts[0].campaign_count).toBe(2);
      expect(accounts[0].total_spend).toBe(200);
    });

    it('returns empty array if organizationId is empty', async () => {
      const accounts = await AdAccountsService.list('');
      expect(accounts).toEqual([]);
    });

    it('throws when supabase returns an error', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database query failed' } }),
          }),
        }),
      } as unknown as SupabaseFromReturn);

      await expect(AdAccountsService.list(orgId)).rejects.toThrow('Database query failed');
    });
  });

  describe('delete', () => {
    it('prevents deletion if account has associated campaigns', async () => {
      const mockCountEq2 = vi.fn().mockResolvedValue({ count: 3, error: null });
      const mockCountEq1 = vi.fn().mockReturnValue({ eq: mockCountEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockCountEq1 });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'campaigns') {
          return { select: mockSelect } as unknown as SupabaseFromReturn;
        }
        return {} as unknown as SupabaseFromReturn;
      });

      await expect(AdAccountsService.delete(orgId, accountId)).rejects.toThrow(
        /Não é possível excluir esta conta pois existem 3 campanha\(s\) vinculada\(s\)/
      );
    });

    it('deletes successfully when account has 0 associated campaigns', async () => {
      // Step 1: count check returns 0
      const mockCountEq2 = vi.fn().mockResolvedValue({ count: 0, error: null });
      const mockCountEq1 = vi.fn().mockReturnValue({ eq: mockCountEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockCountEq1 });

      // Step 2: delete query
      const mockDeleteEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteEq1 = vi.fn().mockReturnValue({ eq: mockDeleteEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq1 });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'campaigns') {
          return { select: mockSelect } as unknown as SupabaseFromReturn;
        }
        if (table === 'ad_accounts') {
          return { delete: mockDelete } as unknown as SupabaseFromReturn;
        }
        return {} as unknown as SupabaseFromReturn;
      });

      await expect(AdAccountsService.delete(orgId, accountId)).resolves.not.toThrow();
      expect(mockDeleteEq1).toHaveBeenCalledWith('organization_id', orgId);
      expect(mockDeleteEq2).toHaveBeenCalledWith('id', accountId);
    });
  });
});
