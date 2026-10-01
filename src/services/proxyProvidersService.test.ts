import { describe, it, expect, vi, beforeEach } from 'vitest';
import { proxyProviderSchema } from '../types/proxyProviders';
import { ProxyProvidersService } from './proxyProvidersService';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

type SupabaseFromReturn = ReturnType<typeof supabase.from>;

describe('proxyProviderSchema', () => {
  it('validates a complete valid provider', () => {
    const valid = {
      name: 'Bright Data',
      website: 'https://brightdata.com',
      notes: 'Provedor residencial principal',
    };
    const result = proxyProviderSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('fails if name has less than 2 characters', () => {
    const invalid = {
      name: 'A',
    };
    const result = proxyProviderSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be empty', () => {
    const minimal = {
      name: 'Oxylabs',
    };
    const result = proxyProviderSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('fails if website is not a valid URL', () => {
    const invalid = {
      name: 'Oxylabs',
      website: 'not-a-url',
    };
    const result = proxyProviderSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('ProxyProvidersService', () => {
  const mockOrgId = 'org-123';
  const mockProviderId = 'prov-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('returns empty array if organizationId is empty', async () => {
      const result = await ProxyProvidersService.list('');
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('queries proxy_providers table ordered by name', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: mockProviderId, name: 'Bright Data' }],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      const result = await ProxyProvidersService.list(mockOrgId);

      expect(supabase.from).toHaveBeenCalledWith('proxy_providers');
      expect(mockChain.eq).toHaveBeenCalledWith('organization_id', mockOrgId);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bright Data');
    });
  });

  describe('create', () => {
    it('inserts provider payload with trimmed name', async () => {
      const createdRecord = { id: mockProviderId, name: 'Decodo' };
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRecord, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      const result = await ProxyProvidersService.create(
        mockOrgId,
        { name: '  Decodo  ', website: 'https://decodo.com' },
        'user-1'
      );

      expect(supabase.from).toHaveBeenCalledWith('proxy_providers');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: mockOrgId,
          name: 'Decodo',
          website: 'https://decodo.com',
          created_by: 'user-1',
        })
      );
      expect(result).toEqual(createdRecord);
    });
  });

  describe('delete', () => {
    it('prevents deletion if proxies are linked', async () => {
      const mockCountChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      // Simula contagem > 0
      mockCountChain.eq
        .mockReturnValueOnce(mockCountChain)
        .mockResolvedValueOnce({ count: 2, error: null });

      vi.mocked(supabase.from).mockReturnValue(mockCountChain as unknown as SupabaseFromReturn);

      await expect(ProxyProvidersService.delete(mockOrgId, mockProviderId)).rejects.toThrow(
        /Não é possível excluir este provedor pois 2 proxy\(ies\) está\(ão\) vinculado\(s\)/
      );
    });

    it('proceeds with deletion if no proxy is linked', async () => {
      const mockCountChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      mockCountChain.eq
        .mockReturnValueOnce(mockCountChain)
        .mockResolvedValueOnce({ count: 0, error: null });

      const mockDeleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      mockDeleteChain.eq
        .mockReturnValueOnce(mockDeleteChain)
        .mockResolvedValueOnce({ error: null });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockCountChain as unknown as SupabaseFromReturn)
        .mockReturnValueOnce(mockDeleteChain as unknown as SupabaseFromReturn);

      await expect(ProxyProvidersService.delete(mockOrgId, mockProviderId)).resolves.not.toThrow();
      expect(supabase.from).toHaveBeenCalledWith('proxy_providers');
    });
  });
});
