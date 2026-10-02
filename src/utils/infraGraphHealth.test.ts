import { describe, it, expect } from 'vitest';
import {
  findProxiesWithoutAccounts,
  findAccountsWithoutProxy,
  findBrowserProfilesWithoutAccount,
  findCountryMismatches,
  findSharedDedicatedProxies,
  findAdAccountsWithoutBC,
  findExpiredActiveProxies,
  findTikTokAccountDeviceBanRisk,
  findTikTokAccountMultipleDevices,
  findDeviceMultipleTikTokAccounts,
  findProxySharedMultipleDevices,
  findProxySharedMultipleBCs,
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

const makeAccount = (id: string, opts: { country?: string; platform?: string } = {}) => ({
  id: `pa_${id}`,
  type: 'platform_account' as const,
  label: `Account ${id}`,
  country: opts.country ?? 'BR',
  platform: opts.platform ?? 'tiktok',
  meta: {},
});

const makeDevice = (id: string) => ({
  id: `dev_${id}`,
  type: 'device' as const,
  label: `Device ${id}`,
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

const makeBc = (id: string, opts: { platform?: string } = {}) => ({
  id: `bc_${id}`,
  type: 'business_center' as const,
  label: `BC ${id}`,
  platform: opts.platform ?? 'tiktok',
  meta: {},
});

const usesProxyEdge = (proxyId: string, accountId: string) => ({
  source: `px_${proxyId}`,
  target: `pa_${accountId}`,
  relation: 'uses_proxy' as const,
});

const runsOnEdge = (devId: string, accId: string) => ({
  source: `dev_${devId}`,
  target: `pa_${accId}`,
  relation: 'runs_on' as const,
});

const deviceProxyEdge = (pxId: string, devId: string) => ({
  source: `px_${pxId}`,
  target: `dev_${devId}`,
  relation: 'device_proxy' as const,
});

const bcProxyEdge = (pxId: string, bcId: string) => ({
  source: `px_${pxId}`,
  target: `bc_${bcId}`,
  relation: 'bc_proxy' as const,
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

describe('findTikTokAccountDeviceBanRisk', () => {
  it('detects TikTok account connected to 6 or more devices with critical error severity', () => {
    const devices = [1, 2, 3, 4, 5, 6].map((i) => makeDevice(String(i)));
    const edges = [1, 2, 3, 4, 5, 6].map((i) => runsOnEdge(String(i), 'tk1'));
    const graph: InfraGraphResponse = {
      nodes: [makeAccount('tk1', { platform: 'tiktok' }), ...devices],
      edges,
    };

    const alert = findTikTokAccountDeviceBanRisk(graph);
    expect(alert.count).toBe(7); // account + 6 devices
    expect(alert.severity).toBe('error');
    expect(alert.nodeIds).toContain('pa_tk1');
    expect(alert.nodeIds).toContain('dev_6');
  });

  it('does NOT trigger ban risk for account with 5 devices', () => {
    const devices = [1, 2, 3, 4, 5].map((i) => makeDevice(String(i)));
    const edges = [1, 2, 3, 4, 5].map((i) => runsOnEdge(String(i), 'tk1'));
    const graph: InfraGraphResponse = {
      nodes: [makeAccount('tk1', { platform: 'tiktok' }), ...devices],
      edges,
    };

    expect(findTikTokAccountDeviceBanRisk(graph).count).toBe(0);
  });
});

describe('findTikTokAccountMultipleDevices', () => {
  it('detects TikTok account connected to 2 to 5 devices with warning severity', () => {
    const devices = [makeDevice('1'), makeDevice('2')];
    const graph: InfraGraphResponse = {
      nodes: [makeAccount('tk1', { platform: 'tiktok' }), ...devices],
      edges: [runsOnEdge('1', 'tk1'), runsOnEdge('2', 'tk1')],
    };

    const alert = findTikTokAccountMultipleDevices(graph);
    expect(alert.count).toBe(3); // account + 2 devices
    expect(alert.severity).toBe('warning');
    expect(alert.nodeIds).toContain('pa_tk1');
  });

  it('does NOT flag account with exactly 1 device (ideal 1:1)', () => {
    const graph: InfraGraphResponse = {
      nodes: [makeAccount('tk1', { platform: 'tiktok' }), makeDevice('1')],
      edges: [runsOnEdge('1', 'tk1')],
    };

    expect(findTikTokAccountMultipleDevices(graph).count).toBe(0);
  });
});

describe('findDeviceMultipleTikTokAccounts', () => {
  it('detects a single device hosting multiple TikTok accounts', () => {
    const graph: InfraGraphResponse = {
      nodes: [
        makeDevice('1'),
        makeAccount('tk1', { platform: 'tiktok' }),
        makeAccount('tk2', { platform: 'tiktok' }),
      ],
      edges: [runsOnEdge('1', 'tk1'), runsOnEdge('1', 'tk2')],
    };

    const alert = findDeviceMultipleTikTokAccounts(graph);
    expect(alert.count).toBe(3); // device + 2 accounts
    expect(alert.severity).toBe('warning');
    expect(alert.nodeIds).toContain('dev_1');
  });
});

describe('findProxySharedMultipleDevices', () => {
  it('detects a proxy shared across multiple devices', () => {
    const graph: InfraGraphResponse = {
      nodes: [makeProxy('1'), makeDevice('dev1'), makeDevice('dev2')],
      edges: [deviceProxyEdge('1', 'dev1'), deviceProxyEdge('1', 'dev2')],
    };

    const alert = findProxySharedMultipleDevices(graph);
    expect(alert.count).toBe(3);
    expect(alert.severity).toBe('warning');
    expect(alert.nodeIds).toContain('px_1');
  });
});

describe('findProxySharedMultipleBCs', () => {
  it('detects a proxy shared across multiple TikTok Business Centers', () => {
    const graph: InfraGraphResponse = {
      nodes: [
        makeProxy('1'),
        makeBc('bc1', { platform: 'tiktok' }),
        makeBc('bc2', { platform: 'tiktok' }),
      ],
      edges: [bcProxyEdge('1', 'bc1'), bcProxyEdge('1', 'bc2')],
    };

    const alert = findProxySharedMultipleBCs(graph);
    expect(alert.count).toBe(3);
    expect(alert.severity).toBe('warning');
    expect(alert.nodeIds).toContain('px_1');
  });
});

