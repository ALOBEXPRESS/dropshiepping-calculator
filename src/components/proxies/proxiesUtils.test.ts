import { describe, it, expect } from 'vitest';
import {
  getCountryName,
  groupProxiesByProvider,
  groupProxiesByCountry,
  filterProxies,
} from './proxiesUtils';
import type { Proxy } from '@/types/proxies';
import type { PlatformAccount } from '@/types/platformAccounts';

const mockProxies: Proxy[] = [
  {
    id: 'proxy-1',
    organization_id: 'org-1',
    label: 'Proxy Evelyn Hart (UK)',
    protocol: 'socks5',
    host: '198.51.100.42',
    port: 8080,
    username: null,
    country: 'US',
    proxy_type: 'static_residential_isp',
    ip_version: 'ipv4',
    provider_id: 'p-1',
    provider: 'proxy-cheap',
    status: 'active',
    expires_at: '2026-11-01',
    notes: 'Proxy principal',
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'proxy-2',
    organization_id: 'org-1',
    label: 'Proxy AlobExpress (BR)',
    protocol: 'socks5',
    host: '192.168.1.100',
    port: 8080,
    username: 'alob_proxy',
    country: 'BR',
    proxy_type: 'static_residential_isp',
    ip_version: 'ipv4',
    provider_id: 'p-1',
    provider: 'proxy-cheap',
    status: 'active',
    expires_at: '2026-11-01',
    notes: 'Conta Brasil',
    created_by: 'user-1',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
  {
    id: 'proxy-3',
    organization_id: 'org-1',
    label: 'Proxy Bright Data (Alemanha)',
    protocol: 'http',
    host: '10.0.0.1',
    port: 3128,
    username: null,
    country: 'DE',
    proxy_type: 'datacenter',
    ip_version: 'ipv4',
    provider_id: null,
    provider: 'Bright Data',
    status: 'inactive',
    expires_at: null,
    notes: null,
    created_by: null,
    created_at: '2026-01-03T00:00:00Z',
    updated_at: '2026-01-03T00:00:00Z',
  },
  {
    id: 'proxy-4',
    organization_id: 'org-1',
    label: 'Proxy Sem Provedor e Sem País',
    protocol: 'https',
    host: '172.16.0.5',
    port: 443,
    username: 'custom_user',
    country: null,
    proxy_type: 'residential_rotating',
    ip_version: 'ipv4',
    provider_id: null,
    provider: null,
    status: 'active',
    expires_at: null,
    notes: null,
    created_by: null,
    created_at: '2026-01-04T00:00:00Z',
    updated_at: '2026-01-04T00:00:00Z',
  },
];

describe('proxiesUtils', () => {
  describe('getCountryName', () => {
    it('returns "Sem país definido" for null or undefined', () => {
      expect(getCountryName(null)).toBe('Sem país definido');
      expect(getCountryName(undefined)).toBe('Sem país definido');
      expect(getCountryName('')).toBe('Sem país definido');
    });

    it('returns friendly name for known country codes', () => {
      expect(getCountryName('BR')).toBe('Brasil');
      expect(getCountryName('US')).toBe('Estados Unidos');
    });

    it('handles lowercase codes properly', () => {
      expect(getCountryName('br')).toBe('Brasil');
    });
  });

  describe('groupProxiesByProvider', () => {
    const providerMap = new Map([['p-1', 'proxy-cheap']]);

    it('groups proxies by provider correctly and puts "Sem Provedor" at the end', () => {
      const groups = groupProxiesByProvider(mockProxies, providerMap);
      expect(groups).toHaveLength(3);

      expect(groups[0].name).toBe('Bright Data');
      expect(groups[0].proxies).toHaveLength(1);

      expect(groups[1].name).toBe('proxy-cheap');
      expect(groups[1].proxies).toHaveLength(2);

      expect(groups[2].name).toBe('Sem Provedor');
      expect(groups[2].proxies).toHaveLength(1);
    });
  });

  describe('groupProxiesByCountry', () => {
    it('groups proxies by country and puts "OTHER" at the end', () => {
      const groups = groupProxiesByCountry(mockProxies);
      expect(groups).toHaveLength(4);

      // BR, DE, US, OTHER
      const codes = groups.map((g) => g.code);
      expect(codes).toContain('BR');
      expect(codes).toContain('DE');
      expect(codes).toContain('US');
      expect(codes[codes.length - 1]).toBe('OTHER');
    });
  });

  describe('filterProxies', () => {
    const providerMap = new Map([['p-1', 'proxy-cheap']]);
    const accountMap = new Map<string, PlatformAccount>([
      [
        'proxy-1',
        {
          id: 'acc-1',
          organization_id: 'org-1',
          name: 'Evelyn Hart Daily',
          platform: 'tiktok',
          country: 'US',
          status: 'active',
          proxy_id: 'proxy-1',
          device_id: null,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        } as PlatformAccount,
      ],
    ]);

    it('returns all proxies when searchTerm is empty', () => {
      expect(filterProxies(mockProxies, '', providerMap)).toEqual(mockProxies);
    });

    it('filters by IP host', () => {
      const filtered = filterProxies(mockProxies, '198.51', providerMap);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('proxy-1');
    });

    it('filters by port', () => {
      const filtered = filterProxies(mockProxies, '3128', providerMap);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('proxy-3');
    });

    it('filters by provider name', () => {
      const filtered = filterProxies(mockProxies, 'Bright Data', providerMap);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('proxy-3');
    });

    it('filters by linked platform account name', () => {
      const filtered = filterProxies(mockProxies, 'Evelyn', providerMap, accountMap);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('proxy-1');
    });
  });
});
