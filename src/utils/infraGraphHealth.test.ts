import { describe, it, expect } from 'vitest';
import {
  findProxiesWithoutAccounts,
  findAccountsWithoutProxy,
  findBrowserProfilesWithoutAccount,
  findCountryMismatches,
  findSharedDedicatedProxies,
  findAdAccountsWithoutBC,
  findExpiredActiveProxies,
  computeAllAlerts,
} from './infraGraphHealth';
import type { InfraGraphResponse } from '@/types/infraGraph';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const emptyGraph: InfraGraphResponse = { nodes: [], edges: [] };

const makeProxy = (
  id: string,
  opts: { status?: string; expires_at?: string; proxy_type?: string; country?: string } = {}
) => ({
  id: `px_${id}`,
  type: 'proxy' as const,
  label: `Proxy ${id}`,
  country: opts.country ?? 'BR',
  status: opts.status ?? 'active',
  meta: {
    proxy_type: opts.proxy_type ?? 'static_residential_isp',
    expires_at: opts.expires_at ?? null,
  },
});

const makeAccount = (id: string, opts: { country?: string } = {}) => ({
  id: `pa_${id}`,
  type: 'platform_account' as const,
  label: `Account ${id}`,
  country: opts.country ?? 'BR',
  meta: {},
});

const makeProfile = (id: string) => ({
  id: `bp_${id}`,
  type: 'browser_profile' as const,
  label: `Profile ${id}`,
  meta: {},
});

const makeAdAccount = (id: string) => ({
  id: `aa_${id}`,
  type: 'ad_account' as const,
  label: `AdAccount ${id}`,
  meta: {},
});

const makeBc = (id: string) => ({
  id: `bc_${id}`,
  type: 'business_center' as const,
  label: `BC ${id}`,
  meta: {},
});

const usesProxyEdge = (proxyId: string, accountId: string) => ({
  source: `px_${proxyId}`,
  target: `pa_${accountId}`,
  relation: 'uses_proxy' as const,
});

const hasProfileEdge = (accountId: string, profileId: string) => ({
  source: `pa_${accountId}`,
  target: `bp_${profileId}`,
  relation: 'has_profile' as const,
});

const bcEdge = (bcId: string, aaId: string) => ({
  source: `bc_${bcId}`,
  target: `aa_${aaId}`,
  relation: 'contains_ad_account' as const,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('infraGraphHealth — empty graph', () => {
  it('returns zero alerts on empty graph', () => {
    const alerts = computeAllAlerts(emptyGraph);
    for (const alert of alerts) {
      expect(alert.count).toBe(0);
      expect(alert.severity).toBe('info');
    }
  });
});

describe('findProxiesWithoutAccounts', () => {
  it('detects orphaned proxy', () => {
    const graph: InfraGraphResponse = {
      nodes: [makeProxy('1'), makeProxy('2')],
      edges: [usesProxyEdge('1', 'acc1')],
    };
    const alert = findProxiesWithoutAccounts(graph);
    expect(alert.count).toBe(1);
    expect(alert.nodeIds).toContain('px_2');
    expect(alert.severity).toBe('warning');
  });

  it('returns info when all proxies have accounts', () => {
    const graph: InfraGraphResponse = {
      nodes: [makeProxy('1')],
      edges: [usesProxyEdge('1', 'acc1')],
    };
    expect(findProxiesWithoutAccounts(graph).count).toBe(0);
  });
});

describe('findAccountsWithoutProxy', () => {
  it('detects accounts without proxy', () => {
    const graph: InfraGraphResponse = {
      nodes: [makeAccount('1'), makeAccount('2')],
      edges: [usesProxyEdge('px1', '1')],
    };
    const alert = findAccountsWithoutProxy(graph);
    expect(alert.count).toBe(1);
    expect(alert.nodeIds).toContain('pa_2');
  });
});

describe('findBrowserProfilesWithoutAccount', () => {
  it('detects orphaned browser profiles', () => {
    const graph: InfraGraphResponse = {
      nodes: [makeProfile('1'), makeProfile('2'), makeAccount('a')],
      edges: [hasProfileEdge('a', '1')],
    };
    const alert = findBrowserProfilesWithoutAccount(graph);
    expect(alert.count).toBe(1);
    expect(alert.nodeIds).toContain('bp_2');
    expect(alert.severity).toBe('warning');
  });
});

describe('findCountryMismatches', () => {
  it('detects country mismatch between proxy and account', () => {
    const graph: InfraGraphResponse = {
      nodes: [
        makeProxy('1', { country: 'US' }),
        makeAccount('1', { country: 'BR' }),
      ],
      edges: [usesProxyEdge('1', '1')],
    };
    const alert = findCountryMismatches(graph);
    expect(alert.count).toBeGreaterThan(0);
    expect(alert.severity).toBe('error');
    expect(alert.edgeIds).toContain('px_1→pa_1');
  });

  it('no mismatch when countries match', () => {
    const graph: InfraGraphResponse = {
      nodes: [makeProxy('1', { country: 'BR' }), makeAccount('1', { country: 'BR' })],
      edges: [usesProxyEdge('1', '1')],
    };
    expect(findCountryMismatches(graph).count).toBe(0);
  });
});

describe('findSharedDedicatedProxies', () => {
  it('detects static proxy shared by 2+ accounts', () => {
    const graph: InfraGraphResponse = {
      nodes: [
        makeProxy('1', { proxy_type: 'static_residential_isp' }),
        makeAccount('1'),
        makeAccount('2'),
      ],
      edges: [usesProxyEdge('1', '1'), usesProxyEdge('1', '2')],
    };
    const alert = findSharedDedicatedProxies(graph);
    expect(alert.count).toBeGreaterThan(0);
    expect(alert.severity).toBe('error');
    expect(alert.nodeIds).toContain('px_1');
  });

  it('does NOT flag rotating proxy shared by 2 accounts', () => {
    const graph: InfraGraphResponse = {
      nodes: [
        makeProxy('1', { proxy_type: 'rotating_residential' }),
        makeAccount('1'),
        makeAccount('2'),
      ],
      edges: [usesProxyEdge('1', '1'), usesProxyEdge('1', '2')],
    };
    expect(findSharedDedicatedProxies(graph).count).toBe(0);
  });
});

describe('findAdAccountsWithoutBC', () => {
  it('detects ad accounts without business center', () => {
    const graph: InfraGraphResponse = {
      nodes: [makeAdAccount('1'), makeAdAccount('2'), makeBc('bc1')],
      edges: [bcEdge('bc1', '1')],
    };
    const alert = findAdAccountsWithoutBC(graph);
    expect(alert.count).toBe(1);
    expect(alert.nodeIds).toContain('aa_2');
  });
});

describe('findExpiredActiveProxies', () => {
  it('detects active proxy with past expiry', () => {
    const past = new Date('2020-01-01').toISOString();
    const graph: InfraGraphResponse = {
      nodes: [makeProxy('1', { status: 'active', expires_at: past })],
      edges: [],
    };
    const alert = findExpiredActiveProxies(graph, new Date('2025-01-01'));
    expect(alert.count).toBe(1);
    expect(alert.severity).toBe('error');
  });

  it('does NOT flag inactive proxy with past expiry', () => {
    const past = new Date('2020-01-01').toISOString();
    const graph: InfraGraphResponse = {
      nodes: [makeProxy('1', { status: 'expired', expires_at: past })],
      edges: [],
    };
    expect(findExpiredActiveProxies(graph, new Date('2025-01-01')).count).toBe(0);
  });

  it('does NOT flag active proxy with future expiry', () => {
    const future = new Date('2099-01-01').toISOString();
    const graph: InfraGraphResponse = {
      nodes: [makeProxy('1', { status: 'active', expires_at: future })],
      edges: [],
    };
    expect(findExpiredActiveProxies(graph).count).toBe(0);
  });
});
