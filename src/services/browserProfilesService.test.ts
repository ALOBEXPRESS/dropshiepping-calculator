import { describe, it, expect, vi, beforeEach } from 'vitest';
import { browserProfileSchema } from '../types/browserProfiles';
import { BrowserProfilesService } from './browserProfilesService';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

type SupabaseFromReturn = ReturnType<typeof supabase.from>;

// ── Testes de Validação do Schema Zod ─────────────────────────────────────────

describe('browserProfileSchema', () => {
  const baseValid = {
    platform_account_id: 'a0000000-0000-4000-8000-000000000001',
    tool: 'adspower' as const,
    external_profile_id: 'serial-123',
    name: 'Perfil AdsPower #1',
    notes: '',
    status: 'active' as const,
  };

  it('validates a complete valid browser profile', () => {
    const result = browserProfileSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
  });

  it('fails if platform_account_id is not a UUID', () => {
    const result = browserProfileSchema.safeParse({
      ...baseValid,
      platform_account_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('fails if tool is not adspower (frontend restriction)', () => {
    const result = browserProfileSchema.safeParse({
      ...baseValid,
      tool: 'multilogin',
    });
    expect(result.success).toBe(false);
  });

  it('fails if status is invalid', () => {
    const result = browserProfileSchema.safeParse({
      ...baseValid,
      status: 'paused',
    });
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be empty strings', () => {
    const minimal = {
      platform_account_id: 'a0000000-0000-4000-8000-000000000001',
      tool: 'adspower' as const,
      status: 'active' as const,
    };
    const result = browserProfileSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('fails if notes exceed 500 characters', () => {
    const result = browserProfileSchema.safeParse({
      ...baseValid,
      notes: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

// ── Testes do BrowserProfilesService ──────────────────────────────────────────

describe('BrowserProfilesService', () => {
  const mockOrgId = 'a0000000-0000-4000-8000-000000000001';
  const mockProfileId = 'a2222222-2222-4222-8222-222222222222';
  const mockPlatformAccountId = 'a3333333-3333-4333-8333-333333333333';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('returns empty array if organizationId is empty', async () => {
      const result = await BrowserProfilesService.list('');
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('queries browser_profiles table', async () => {
      const mockData = [{ id: mockProfileId, tool: 'adspower', name: 'Perfil 1' }];
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      const result = await BrowserProfilesService.list(mockOrgId);

      expect(supabase.from).toHaveBeenCalledWith('browser_profiles');
      expect(result).toHaveLength(1);
    });

    it('applies filters when provided', async () => {
      const mockChain: Record<string, ReturnType<typeof vi.fn>> = {
        select: vi.fn(),
        eq: vi.fn(),
        or: vi.fn(),
        order: vi.fn(),
      };
      // Every method returns the chain itself, except order which resolves
      mockChain.select.mockReturnValue(mockChain);
      mockChain.eq.mockReturnValue(mockChain);
      mockChain.or.mockReturnValue(mockChain);
      mockChain.order.mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      await BrowserProfilesService.list(mockOrgId, {
        tool: 'adspower',
        status: 'active',
        search: 'test',
      });

      // tool filter, status filter, org_id filter = 3 eq calls
      expect(mockChain.eq).toHaveBeenCalledWith('tool', 'adspower');
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockChain.or).toHaveBeenCalled();
    });

    it('throws error when supabase query fails', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      await expect(BrowserProfilesService.list(mockOrgId)).rejects.toThrow('Query failed');
    });
  });

  describe('getById', () => {
    it('returns null if organizationId or id is empty', async () => {
      expect(await BrowserProfilesService.getById('', mockProfileId)).toBeNull();
      expect(await BrowserProfilesService.getById(mockOrgId, '')).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('fetches single browser profile by id', async () => {
      const mockProfile = { id: mockProfileId, tool: 'adspower', name: 'Perfil 1' };
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      const result = await BrowserProfilesService.getById(mockOrgId, mockProfileId);
      expect(result).toEqual(mockProfile);
    });
  });

  describe('create', () => {
    it('inserts browser profile payload with trimmed fields', async () => {
      const formData = {
        platform_account_id: mockPlatformAccountId,
        tool: 'adspower' as const,
        external_profile_id: ' serial-123 ',
        name: ' Perfil AdsPower ',
        notes: ' notas ',
        status: 'active' as const,
      };

      const createdRecord = { id: mockProfileId, tool: 'adspower', name: 'Perfil AdsPower' };
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRecord, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      const result = await BrowserProfilesService.create(mockOrgId, formData, 'user-123');

      expect(supabase.from).toHaveBeenCalledWith('browser_profiles');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: mockOrgId,
          platform_account_id: mockPlatformAccountId,
          tool: 'adspower',
          external_profile_id: 'serial-123',
          name: 'Perfil AdsPower',
          notes: 'notas',
          created_by: 'user-123',
        })
      );
      expect(result).toEqual(createdRecord);
    });
  });

  describe('update', () => {
    it('updates only provided fields', async () => {
      const updatedRecord = { id: mockProfileId, name: 'Perfil Renomeado' };
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedRecord, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      const result = await BrowserProfilesService.update(mockOrgId, mockProfileId, {
        name: '  Perfil Renomeado  ',
      });

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Perfil Renomeado' })
      );
      expect(result).toEqual(updatedRecord);
    });
  });

  describe('delete', () => {
    it('deletes a browser profile', async () => {
      const mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      let eqCount = 0;
      mockChain.eq.mockImplementation(function (this: typeof mockChain) {
        eqCount++;
        if (eqCount >= 2) return Promise.resolve({ error: null });
        return mockChain;
      });
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      await expect(
        BrowserProfilesService.delete(mockOrgId, mockProfileId)
      ).resolves.not.toThrow();
    });
  });

  describe('listByPlatformAccount', () => {
    it('returns empty array if ids are empty', async () => {
      expect(await BrowserProfilesService.listByPlatformAccount('', mockPlatformAccountId)).toEqual([]);
      expect(await BrowserProfilesService.listByPlatformAccount(mockOrgId, '')).toEqual([]);
    });

    it('queries browser_profiles filtered by platform_account_id', async () => {
      const mockProfiles = [{ id: mockProfileId, tool: 'adspower' }];
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      const result = await BrowserProfilesService.listByPlatformAccount(
        mockOrgId,
        mockPlatformAccountId
      );

      expect(supabase.from).toHaveBeenCalledWith('browser_profiles');
      expect(mockChain.eq).toHaveBeenCalledWith('platform_account_id', mockPlatformAccountId);
      expect(result).toHaveLength(1);
    });
  });
});
