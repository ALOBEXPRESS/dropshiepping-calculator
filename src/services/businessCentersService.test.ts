import { describe, it, expect, vi, beforeEach } from 'vitest';
import { businessCenterSchema } from '../types/businessCenters';
import { BusinessCentersService } from './businessCentersService';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

type SupabaseFromReturn = ReturnType<typeof supabase.from>;

// ── Testes de Validação do Schema Zod ─────────────────────────────────────────

describe('businessCenterSchema', () => {
  const baseValid = {
    platform: 'tiktok' as const,
    business_type: 'advertiser' as const,
    company_legal_name: 'Alob Express',
    name: 'Alob Express — Marketing',
    country: 'BR',
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    bc_id: '7123456789012345678',
    notes: '',
    company_status: 'Ativa' as const,
  };

  it('validates a complete valid business center', () => {
    const result = businessCenterSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
  });

  it('fails if name is less than 2 characters', () => {
    const result = businessCenterSchema.safeParse({ ...baseValid, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('allows bc_id to be empty (auto-generated in service)', () => {
    const result = businessCenterSchema.safeParse({ ...baseValid, bc_id: '' });
    expect(result.success).toBe(true);
  });

  it('validates allowed business_type values', () => {
    const invalidResult = businessCenterSchema.safeParse({
      ...baseValid,
      business_type: 'invalid' as unknown as typeof baseValid.business_type,
    });
    expect(invalidResult.success).toBe(false);
  });

  it('accepts agency as business_type', () => {
    const result = businessCenterSchema.safeParse({ ...baseValid, business_type: 'agency' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.business_type).toBe('agency');
    }
  });

  it('fails if notes exceed 500 characters', () => {
    const result = businessCenterSchema.safeParse({
      ...baseValid,
      notes: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('trims whitespace from bc_id and name', () => {
    const result = businessCenterSchema.safeParse({
      ...baseValid,
      bc_id: '  1234567890  ',
      name: '  Alob Marketing  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bc_id).toBe('1234567890');
      expect(result.data.name).toBe('Alob Marketing');
    }
  });
});

// ── Testes do BusinessCentersService ──────────────────────────────────────────

describe('BusinessCentersService', () => {
  const mockOrgId = '00000000-0000-0000-0000-000000000001';
  const mockBCId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('returns empty array if organizationId is empty', async () => {
      const result = await BusinessCentersService.list('');
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('queries business_centers table and returns data with stats', async () => {
      const mockCenters = [{ id: mockBCId, bc_id: '7123456789', name: 'BC 1' }];
      const mockAdAccounts = [{ id: 'acc-1', bc_entity_id: mockBCId }];

      // First call: business_centers list
      const bcChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockCenters, error: null }),
      };

      // Second call: ad_accounts count
      const adChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: mockAdAccounts, error: null }),
      };

      // Third call: business_center_platform_accounts count
      const linkedChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: [{ id: 'link-1', business_center_id: mockBCId }], error: null }),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return bcChain as unknown as SupabaseFromReturn;
        if (callCount === 2) return adChain as unknown as SupabaseFromReturn;
        return linkedChain as unknown as SupabaseFromReturn;
      });

      const result = await BusinessCentersService.list(mockOrgId);

      expect(supabase.from).toHaveBeenCalledWith('business_centers');
      expect(result).toHaveLength(1);
      expect(result[0].ad_account_count).toBe(1);
      expect(result[0].linked_account_count).toBe(1);
    });

    it('throws error when supabase query fails', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      await expect(BusinessCentersService.list(mockOrgId)).rejects.toThrow('Query failed');
    });
  });

  describe('getById', () => {
    it('returns null if organizationId or id is empty', async () => {
      expect(await BusinessCentersService.getById('', mockBCId)).toBeNull();
      expect(await BusinessCentersService.getById(mockOrgId, '')).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('inserts business center payload with trimmed fields', async () => {
      const formData = {
        platform: 'tiktok' as const,
        bc_id: ' 7123456789 ',
        name: ' BC Principal ',
        notes: '',
      };

      const createdRecord = { id: mockBCId, bc_id: '7123456789', name: 'BC Principal' };
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRecord, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      const result = await BusinessCentersService.create(mockOrgId, formData, 'user-123');

      expect(supabase.from).toHaveBeenCalledWith('business_centers');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: mockOrgId,
          bc_id: '7123456789',
          name: 'BC Principal',
          created_by: 'user-123',
        })
      );
      expect(result).toEqual({
        ...createdRecord,
        device_ids: [],
      });
    });

    it('throws user-friendly error on unique constraint violation', async () => {
      const formData = {
        platform: 'tiktok' as const,
        bc_id: '7123456789',
      };

      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'duplicate key' },
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      await expect(
        BusinessCentersService.create(mockOrgId, formData)
      ).rejects.toThrow('Já existe um Business Center com este ID nesta organização.');
    });
  });

  describe('update', () => {
    it('updates only provided fields and trims strings', async () => {
      const updatedRecord = { id: mockBCId, name: 'BC Atualizado' };
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedRecord, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      const result = await BusinessCentersService.update(mockOrgId, mockBCId, {
        name: '  BC Atualizado  ',
      });

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'BC Atualizado' })
      );
      expect(result).toEqual(updatedRecord);
    });
  });

  describe('delete', () => {
    it('throws error when ad_accounts are linked', async () => {
      // First call: count check
      const countChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      // Make the last .eq return the count
      let eqCallCount = 0;
      countChain.eq.mockImplementation(() => {
        eqCallCount++;
        if (eqCallCount >= 2) {
          return Promise.resolve({ count: 2, error: null });
        }
        return countChain;
      });

      vi.mocked(supabase.from).mockReturnValue(countChain as unknown as SupabaseFromReturn);

      await expect(
        BusinessCentersService.delete(mockOrgId, mockBCId)
      ).rejects.toThrow(/Não é possível excluir/);
    });

    it('deletes when no ad_accounts are linked', async () => {
      let callIdx = 0;
      // Count check returns 0
      const countChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation(function (this: typeof countChain) {
          callIdx++;
          if (callIdx === 2) {
            return Promise.resolve({ count: 0, error: null });
          }
          return countChain;
        }),
      };

      const deleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      // Last eq in delete chain resolves
      let deleteEqCount = 0;
      deleteChain.eq.mockImplementation(function (this: typeof deleteChain) {
        deleteEqCount++;
        if (deleteEqCount >= 2) {
          return Promise.resolve({ error: null });
        }
        return deleteChain;
      });

      let fromCallCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) return countChain as unknown as SupabaseFromReturn;
        return deleteChain as unknown as SupabaseFromReturn;
      });

      await expect(
        BusinessCentersService.delete(mockOrgId, mockBCId)
      ).resolves.not.toThrow();
    });
  });

  describe('getLinkedAdAccounts', () => {
    it('returns linked ad accounts', async () => {
      const mockAccounts = [{ id: 'acc-1', name: 'Conta 1' }];
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      let eqCount = 0;
      mockChain.eq.mockImplementation(function (this: typeof mockChain) {
        eqCount++;
        if (eqCount >= 2) {
          return Promise.resolve({ data: mockAccounts, error: null });
        }
        return mockChain;
      });

      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      const result = await BusinessCentersService.getLinkedAdAccounts(mockOrgId, mockBCId);
      expect(result).toEqual(mockAccounts);
    });
  });

  describe('N:N Platform Accounts Linking', () => {
    const mockAccountId = '22222222-2222-2222-2222-222222222222';

    it('getLinkedAccounts returns linked accounts with details', async () => {
      const mockRelations = [
        {
          id: 'rel-1',
          business_center_id: mockBCId,
          platform_account_id: mockAccountId,
          relationship_type: 'owner',
          permission_level: 'admin',
          status: 'active',
        },
      ];

      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockRelations, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(chain as unknown as SupabaseFromReturn);

      const result = await BusinessCentersService.getLinkedAccounts(mockOrgId, mockBCId);
      expect(supabase.from).toHaveBeenCalledWith('business_center_platform_accounts');
      expect(result).toEqual(mockRelations);
    });

    it('linkAccount throws error when attempting to add a second owner to the same account', async () => {
      // Mock existing owner in another BC
      const checkChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'other-rel',
            business_center_id: '99999999-9999-9999-9999-999999999999',
            business_centers: { name: 'Portfólio Antigo', bc_id: '123' },
          },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(checkChain as unknown as SupabaseFromReturn);

      await expect(
        BusinessCentersService.linkAccount(mockOrgId, {
          business_center_id: mockBCId,
          platform_account_id: mockAccountId,
          relationship_type: 'owner',
        })
      ).rejects.toThrow(/Esta conta já possui um proprietário registrado/);
    });

    it('linkAccount successfully links with partner_access or ad_authorization', async () => {
      const createdRel = {
        id: 'new-rel',
        business_center_id: mockBCId,
        platform_account_id: mockAccountId,
        relationship_type: 'ad_authorization',
        permission_level: 'ads_only',
        status: 'active',
      };

      const chain = {
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRel, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(chain as unknown as SupabaseFromReturn);

      const result = await BusinessCentersService.linkAccount(mockOrgId, {
        business_center_id: mockBCId,
        platform_account_id: mockAccountId,
        relationship_type: 'ad_authorization',
        permission_level: 'ads_only',
      });

      expect(supabase.from).toHaveBeenCalledWith('business_center_platform_accounts');
      expect(result).toEqual(createdRel);
    });

    it('unlinkAccount removes association', async () => {
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      let eqCalls = 0;
      chain.eq.mockImplementation(function (this: typeof chain) {
        eqCalls++;
        if (eqCalls >= 3) {
          return Promise.resolve({ error: null });
        }
        return chain;
      });

      vi.mocked(supabase.from).mockReturnValue(chain as unknown as SupabaseFromReturn);

      await expect(
        BusinessCentersService.unlinkAccount(mockOrgId, mockBCId, mockAccountId)
      ).resolves.not.toThrow();
      expect(supabase.from).toHaveBeenCalledWith('business_center_platform_accounts');
    });
  });
});
