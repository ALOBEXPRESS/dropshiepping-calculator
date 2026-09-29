import { describe, it, expect, vi, beforeEach } from 'vitest';
import { proxySchema, PROXY_PROTOCOL_LABELS, PROXY_STATUS_LABELS } from '../types/proxies';
import { ProxiesService } from './proxiesService';
import { getCountryName } from '../components/proxies/ProxiesManager';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

type SupabaseFromReturn = ReturnType<typeof supabase.from>;

// ── Testes de Validação do Schema Zod ─────────────────────────────────────────

describe('proxySchema', () => {
  const baseValid = {
    label: 'Proxy Residencial BR #1',
    protocol: 'http' as const,
    host: '192.168.1.1',
    port: 8080,
    username: 'user123',
    password: 'secretpassword',
    country: 'BR',
    proxy_type: 'residential' as const,
    provider: 'Brightdata',
    status: 'active' as const,
  };

  it('validates a complete valid proxy', () => {
    const result = proxySchema.safeParse(baseValid);
    expect(result.success).toBe(true);
  });

  it('validates a proxy with domain hostname', () => {
    const result = proxySchema.safeParse({
      ...baseValid,
      host: 'proxy.brightdata.com',
    });
    expect(result.success).toBe(true);
  });

  it('fails if label is too short', () => {
    const result = proxySchema.safeParse({ ...baseValid, label: 'A' });
    expect(result.success).toBe(false);
  });

  it('fails if port is invalid', () => {
    expect(proxySchema.safeParse({ ...baseValid, port: 0 }).success).toBe(false);
    expect(proxySchema.safeParse({ ...baseValid, port: 70000 }).success).toBe(false);
    expect(proxySchema.safeParse({ ...baseValid, port: -5 }).success).toBe(false);
  });

  it('fails if country code is not 2 characters', () => {
    const result = proxySchema.safeParse({ ...baseValid, country: 'BRA' });
    expect(result.success).toBe(false);
  });

  it('fails if protocol is invalid', () => {
    const result = proxySchema.safeParse({ ...baseValid, protocol: 'ftp' });
    expect(result.success).toBe(false);
  });

  it('fails if status is invalid', () => {
    const result = proxySchema.safeParse({ ...baseValid, status: 'paused' });
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be empty', () => {
    const minimal = {
      label: 'Proxy Mínimo',
      protocol: 'socks5' as const,
      host: '10.0.0.1',
      port: 1080,
      proxy_type: 'datacenter' as const,
      status: 'active' as const,
    };
    const result = proxySchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });
});

// ── Testes do ProxiesService ──────────────────────────────────────────────────

describe('ProxiesService', () => {
  const mockOrgId = '00000000-0000-0000-0000-000000000001';
  const mockProxyId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('returns empty array if organizationId is empty', async () => {
      const result = await ProxiesService.list('');
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('queries proxies table and excludes password column from select', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: mockProxyId, label: 'Proxy 1' }],
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      const result = await ProxiesService.list(mockOrgId);

      expect(supabase.from).toHaveBeenCalledWith('proxies');
      expect(mockChain.select).toHaveBeenCalled();
      const selectArg = mockChain.select.mock.calls[0][0] as string;
      expect(selectArg).not.toContain('password');
      expect(mockChain.eq).toHaveBeenCalledWith('organization_id', mockOrgId);
      expect(result).toHaveLength(1);
    });

    it('throws error when supabase query fails', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database connection failed' } }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      await expect(ProxiesService.list(mockOrgId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('getById', () => {
    it('returns null if organizationId or id is empty', async () => {
      expect(await ProxiesService.getById('', mockProxyId)).toBeNull();
      expect(await ProxiesService.getById(mockOrgId, '')).toBeNull();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('fetches single proxy by id including password for editing', async () => {
      const mockProxy = { id: mockProxyId, label: 'Proxy 1', password: 'secret' };
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockProxy, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      const result = await ProxiesService.getById(mockOrgId, mockProxyId);

      expect(supabase.from).toHaveBeenCalledWith('proxies');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockProxy);
    });
  });

  describe('create', () => {
    it('inserts proxy payload and formats country uppercase', async () => {
      const formData = {
        label: ' Proxy SP ',
        protocol: 'http' as const,
        host: ' 192.168.0.1 ',
        port: 8080,
        username: ' admin ',
        password: ' pass ',
        country: 'br',
        proxy_type: 'residential' as const,
        status: 'active' as const,
      };

      const createdRecord = { id: mockProxyId, label: 'Proxy SP' };
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdRecord, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      const result = await ProxiesService.create(mockOrgId, formData, 'user-123');

      expect(supabase.from).toHaveBeenCalledWith('proxies');
      expect(mockChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: mockOrgId,
          label: 'Proxy SP',
          host: '192.168.0.1',
          username: 'admin',
          password: 'pass',
          country: 'BR',
          created_by: 'user-123',
        })
      );
      expect(result).toEqual(createdRecord);
    });
  });

  describe('update', () => {
    it('updates only provided fields and trims strings', async () => {
      const updatedRecord = { id: mockProxyId, label: 'Proxy Alterado' };
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedRecord, error: null }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      const result = await ProxiesService.update(mockOrgId, mockProxyId, {
        label: '  Proxy Alterado  ',
        status: 'inactive',
      });

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Proxy Alterado',
          status: 'inactive',
          updated_at: expect.any(String),
        })
      );
      expect(result).toEqual(updatedRecord);
    });
  });

  describe('delete', () => {
    it('prevents deletion if proxy is linked to platform accounts', async () => {
      const mockCountChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((col: string) => {
          if (col === 'proxy_id') {
            return Promise.resolve({ count: 1, error: null });
          }
          return mockCountChain;
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockCountChain as unknown as SupabaseFromReturn);

      await expect(ProxiesService.delete(mockOrgId, mockProxyId)).rejects.toThrow(
        /Não é possível excluir este proxy pois 1 conta/
      );
    });

    it('proceeds with deletion if no platform account is linked', async () => {
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // platform_accounts count check
          const countChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((col: string) => {
              if (col === 'proxy_id') {
                return Promise.resolve({ count: 0, error: null });
              }
              return countChain;
            }),
          };
          return countChain as unknown as SupabaseFromReturn;
        }
        // proxies delete
        const deleteChain = {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string) => {
            if (col === 'id') {
              return Promise.resolve({ error: null });
            }
            return deleteChain;
          }),
        };
        return deleteChain as unknown as SupabaseFromReturn;
      });

      await expect(ProxiesService.delete(mockOrgId, mockProxyId)).resolves.toBeUndefined();
    });
  });

  describe('linkToAccount', () => {
    it('updates platform_accounts.proxy_id', async () => {
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((col: string) => {
          if (col === 'id') {
            return Promise.resolve({ error: null });
          }
          return mockChain;
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      await ProxiesService.linkToAccount(mockOrgId, 'acc-1', mockProxyId);

      expect(supabase.from).toHaveBeenCalledWith('platform_accounts');
      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          proxy_id: mockProxyId,
          updated_at: expect.any(String),
        })
      );
    });

    it('throws friendly error if proxy is already linked (unique violation)', async () => {
      const mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((col: string) => {
          if (col === 'id') {
            return Promise.resolve({ error: { code: '23505', message: 'duplicate key' } });
          }
          return mockChain;
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as unknown as SupabaseFromReturn);

      await expect(ProxiesService.linkToAccount(mockOrgId, 'acc-1', mockProxyId)).rejects.toThrow(
        'Este proxy já está vinculado a outra conta de plataforma.'
      );
    });
  });
});

// ── Testes de Auxiliares de País ──────────────────────────────────────────────

describe('getCountryName', () => {
  it('returns "Brasil" for "BR"', () => {
    expect(getCountryName('BR')).toBe('Brasil');
    expect(getCountryName('br')).toBe('Brasil');
  });

  it('returns "Estados Unidos" for "US"', () => {
    expect(getCountryName('US')).toBe('Estados Unidos');
    expect(getCountryName('us')).toBe('Estados Unidos');
  });

  it('returns "Sem país definido" for null or empty', () => {
    expect(getCountryName(null)).toBe('Sem país definido');
    expect(getCountryName(undefined)).toBe('Sem país definido');
    expect(getCountryName('')).toBe('Sem país definido');
  });

  it('resolves other valid ISO-2 codes', () => {
    const result = getCountryName('CA');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
