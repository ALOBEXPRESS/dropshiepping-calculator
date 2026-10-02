import { describe, it, expect, vi, beforeEach } from 'vitest';
import { platformAccountSchema, buildPlatformMetadata } from '../types/platformAccounts';
import { PlatformAccountsService } from './platformAccountsService';
import { supabase } from '../lib/supabase';
import { NICHE_VALUES } from '../constants/niches';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}));

type SupabaseFromReturn = ReturnType<typeof supabase.from>;

// ── Testes do schema Zod ────────────────────────────────────────────────────

describe('platformAccountSchema', () => {
  const baseValid = {
    platform: 'tiktok' as const,
    country: 'BR',
    name: 'Conta TikTok Principal',
    holder_name: 'Jonatan Renan',
    niche: 'moda_acessorios' as const,
    signup_method: 'email' as const,
  };

  it('validates a minimal valid platform account', () => {
    const result = platformAccountSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
  });

  it('fails if name is too short', () => {
    const result = platformAccountSchema.safeParse({ ...baseValid, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('fails if holder_name is too short', () => {
    const result = platformAccountSchema.safeParse({ ...baseValid, holder_name: 'J' });
    expect(result.success).toBe(false);
  });

  it('fails if niche is not in the allowed list', () => {
    const result = platformAccountSchema.safeParse({ ...baseValid, niche: 'nicho_inventado' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid niche values', () => {
    for (const niche of NICHE_VALUES) {
      const result = platformAccountSchema.safeParse({ ...baseValid, niche });
      expect(result.success, `niche "${niche}" should be valid`).toBe(true);
    }
  });

  it('fails if signup_method is invalid', () => {
    const result = platformAccountSchema.safeParse({ ...baseValid, signup_method: 'twitter' });
    expect(result.success).toBe(false);
  });

  it('accepts signup_method google with optional conditional fields', () => {
    const result = platformAccountSchema.safeParse({
      ...baseValid,
      signup_method: 'google',
      google_account_age_years: 3,
      google_ads_invested_brl: 1500,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.google_account_age_years).toBe(3);
      expect(result.data.google_ads_invested_brl).toBe(1500);
    }
  });

  it('bio must be max 500 chars', () => {
    const longBio = 'a'.repeat(501);
    const result = platformAccountSchema.safeParse({ ...baseValid, bio: longBio });
    expect(result.success).toBe(false);
  });
});

// ── Testes de buildPlatformMetadata ─────────────────────────────────────────

describe('buildPlatformMetadata', () => {
  const baseData = {
    platform: 'tiktok' as const,
    country: 'BR',
    name: 'Test',
    holder_name: 'Test',
    niche: 'pet' as const,
  };

  it('returns null for email signup_method', () => {
    const data = { ...baseData, signup_method: 'email' as const };
    expect(buildPlatformMetadata(data)).toBeNull();
  });

  it('returns null for apple signup_method', () => {
    const data = { ...baseData, signup_method: 'apple' as const };
    expect(buildPlatformMetadata(data)).toBeNull();
  });

  it('returns google metadata shape for google signup_method', () => {
    const data = {
      ...baseData,
      signup_method: 'google' as const,
      google_account_age_years: 2,
      google_ads_invested_brl: 500,
    };
    const result = buildPlatformMetadata(data);
    expect(result).not.toBeNull();
    expect(result?.signup_method).toBe('google');
    if (result?.signup_method === 'google') {
      expect(result.account_age_years).toBe(2);
      expect(result.google_ads_invested_brl).toBe(500);
    }
  });
});

// ── Testes do PlatformAccountsService ───────────────────────────────────────

describe('PlatformAccountsService', () => {
  const orgId = 'org-test-uuid-123';
  const platformAccountId = 'pa-test-uuid-456';
  const _adAccountId = 'aa-test-uuid-789';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('returns empty array if organizationId is empty', async () => {
      const result = await PlatformAccountsService.list('');
      expect(result).toEqual([]);
    });

    it('returns platform accounts from supabase', async () => {
      const mockAccounts = [
        {
          id: platformAccountId,
          organization_id: orgId,
          name: 'Conta TikTok',
          holder_name: 'Jonatan',
          platform: 'tiktok',
          country: 'BR',
          niche: 'moda_acessorios',
          signup_method: 'email',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockAccounts, error: null }),
          }),
        }),
      } as unknown as SupabaseFromReturn);

      const result = await PlatformAccountsService.list(orgId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Conta TikTok');
    });

    it('throws when supabase returns an error', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      } as unknown as SupabaseFromReturn);

      await expect(PlatformAccountsService.list(orgId)).rejects.toThrow('DB error');
    });
  });

  describe('delete', () => {
    it('prevents deletion if there are linked ad_accounts (FK RESTRICT simulation)', async () => {
      // Mock: count check returns 2 linked ad_accounts
      const mockCountEq2 = vi.fn().mockResolvedValue({ count: 2, error: null });
      const mockCountEq1 = vi.fn().mockReturnValue({ eq: mockCountEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockCountEq1 });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ad_accounts') {
          return { select: mockSelect } as unknown as SupabaseFromReturn;
        }
        return {} as unknown as SupabaseFromReturn;
      });

      await expect(PlatformAccountsService.delete(orgId, platformAccountId)).rejects.toThrow(
        /Não é possível excluir esta conta pois 2 conta\(s\) de anúncios estão vinculadas/
      );
    });

    it('deletes successfully when no ad_accounts are linked', async () => {
      // Step 1: count check returns 0
      const mockCountEq2 = vi.fn().mockResolvedValue({ count: 0, error: null });
      const mockCountEq1 = vi.fn().mockReturnValue({ eq: mockCountEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockCountEq1 });

      const createMockBrowserProfiles = () => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      // Step 2: delete
      const mockDeleteEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteEq1 = vi.fn().mockReturnValue({ eq: mockDeleteEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq1 });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ad_accounts') {
          return { select: mockSelect } as unknown as SupabaseFromReturn;
        }
        if (table === 'browser_profiles') {
          return createMockBrowserProfiles() as unknown as SupabaseFromReturn;
        }
        if (table === 'platform_accounts') {
          return { delete: mockDelete } as unknown as SupabaseFromReturn;
        }
        return {} as unknown as SupabaseFromReturn;
      });

      await expect(PlatformAccountsService.delete(orgId, platformAccountId)).resolves.not.toThrow();
    });

    it('does not expose ad_account_id from another org (isolation)', async () => {
      // The service always filters by organization_id — verify it uses orgId in count
      const mockCountEq2 = vi.fn().mockResolvedValue({ count: 0, error: null });
      const mockCountEq1 = vi.fn().mockReturnValue({ eq: mockCountEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockCountEq1 });

      const mockDeleteEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockDeleteEq1 = vi.fn().mockReturnValue({ eq: mockDeleteEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq1 });

      const createMockBrowserProfiles = () => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ad_accounts') return { select: mockSelect } as unknown as SupabaseFromReturn;
        if (table === 'browser_profiles') return createMockBrowserProfiles() as unknown as SupabaseFromReturn;
        if (table === 'platform_accounts') return { delete: mockDelete } as unknown as SupabaseFromReturn;
        return {} as unknown as SupabaseFromReturn;
      });

      await PlatformAccountsService.delete(orgId, platformAccountId);

      // Confirms first eq call on ad_accounts is by organization_id
      expect(mockCountEq1).toHaveBeenCalledWith('organization_id', orgId);
      // Confirms second eq on ad_accounts is by platform_account_id
      expect(mockCountEq2).toHaveBeenCalledWith('platform_account_id', platformAccountId);
    });

    it('getLinkedAdAccounts returns list of ad accounts matching org and platformAccountId', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ data: [{ id: 'ad-1', name: 'Conta 1' }], error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ad_accounts') return { select: mockSelect } as unknown as SupabaseFromReturn;
        return {} as unknown as SupabaseFromReturn;
      });

      const result = await PlatformAccountsService.getLinkedAdAccounts(orgId, platformAccountId);
      expect(result).toEqual([{ id: 'ad-1', name: 'Conta 1' }]);
      expect(mockSelect).toHaveBeenCalledWith('id, name');
      expect(mockEq1).toHaveBeenCalledWith('organization_id', orgId);
      expect(mockEq2).toHaveBeenCalledWith('platform_account_id', platformAccountId);
    });

    it('deleteAndUnlink sets platform_account_id to null and deletes the platform account', async () => {
      // Step 1: update ad_accounts
      const mockSelect = vi.fn().mockResolvedValue({ data: [{ id: 'ad-1' }, { id: 'ad-2' }], error: null });
      const mockUpdateEq2 = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdateEq1 = vi.fn().mockReturnValue({ eq: mockUpdateEq2 });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq1 });

      const createMockBrowserProfiles = () => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      // Step 2: delete platform_accounts
      const mockDelEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockDelEq1 = vi.fn().mockReturnValue({ eq: mockDelEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDelEq1 });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'ad_accounts') return { update: mockUpdate } as unknown as SupabaseFromReturn;
        if (table === 'browser_profiles') return createMockBrowserProfiles() as unknown as SupabaseFromReturn;
        if (table === 'platform_accounts') return { delete: mockDelete } as unknown as SupabaseFromReturn;
        return {} as unknown as SupabaseFromReturn;
      });

      const res = await PlatformAccountsService.deleteAndUnlink(orgId, platformAccountId);
      expect(res.unlinkedCount).toBe(2);
      expect(mockUpdate).toHaveBeenCalledWith({ platform_account_id: null });
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
