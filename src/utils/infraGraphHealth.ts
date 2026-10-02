import type {
  InfraGraphResponse,
  InfraGraphNode,
  InfraGraphEdge,
  HealthAlert,
  HealthAlertType,
} from '@/types/infraGraph';

// ── Helpers ───────────────────────────────────────────────────────────────────

function nodesByType(
  nodes: InfraGraphNode[],
  type: InfraGraphNode['type']
): InfraGraphNode[] {
  return nodes.filter((n) => n.type === type);
}

function edgesByRelation(
  edges: InfraGraphEdge[],
  relation: string
): InfraGraphEdge[] {
  return edges.filter((e) => e.relation === relation);
}

function makeAlert(
  type: HealthAlertType,
  severity: HealthAlert['severity'],
  label: string,
  message: string,
  nodeIds: string[],
  edgeIds?: string[]
): HealthAlert {
  return { type, severity, label, message, count: nodeIds.length, nodeIds, edgeIds };
}

// ── Pure alert functions ──────────────────────────────────────────────────────

/** Proxies with no platform_account pointing to them. */
export function findProxiesWithoutAccounts(graph: InfraGraphResponse): HealthAlert {
  const proxies = nodesByType(graph.nodes, 'proxy');
  const usedProxyIds = new Set(
    edgesByRelation(graph.edges, 'uses_proxy').map((e) => e.source)
  );
  const orphaned = proxies.filter((p) => !usedProxyIds.has(p.id));
  return makeAlert(
    'proxy_without_account',
    orphaned.length > 0 ? 'warning' : 'info',
    'Proxies sem conta',
    orphaned.length > 0
      ? `${orphaned.length} proxy(ies) sem nenhuma conta vinculada`
      : 'Todos os proxies têm conta vinculada',
    orphaned.map((n) => n.id)
  );
}

/** Platform accounts with no proxy (proxy_id IS NULL). */
export function findAccountsWithoutProxy(graph: InfraGraphResponse): HealthAlert {
  const accounts = nodesByType(graph.nodes, 'platform_account');
  const accountsWithProxy = new Set(
    edgesByRelation(graph.edges, 'uses_proxy').map((e) => e.target)
  );
  const noProxy = accounts.filter((a) => !accountsWithProxy.has(a.id));
  return makeAlert(
    'account_without_proxy',
    noProxy.length > 0 ? 'warning' : 'info',
    'Contas sem proxy',
    noProxy.length > 0
      ? `${noProxy.length} conta(s) sem proxy configurado`
      : 'Todas as contas têm proxy',
    noProxy.map((n) => n.id)
  );
}

/** Browser profiles with no linked platform_account. */
export function findBrowserProfilesWithoutAccount(
  graph: InfraGraphResponse
): HealthAlert {
  const profiles = nodesByType(graph.nodes, 'browser_profile');
  const linkedProfileIds = new Set(
    edgesByRelation(graph.edges, 'has_profile').map((e) => e.target)
  );
  const orphaned = profiles.filter((p) => !linkedProfileIds.has(p.id));
  return makeAlert(
    'browser_profile_without_account',
    orphaned.length > 0 ? 'warning' : 'info',
    'Perfis sem conta',
    orphaned.length > 0
      ? `${orphaned.length} perfil(is) de navegador sem conta vinculada`
      : 'Todos os perfis têm conta vinculada',
    orphaned.map((n) => n.id)
  );
}

/** Edges where proxy.country ≠ platform_account.country. */
export function findCountryMismatches(graph: InfraGraphResponse): HealthAlert {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const mismatchEdgeIds: string[] = [];
  const mismatchNodeIds = new Set<string>();

  for (const edge of edgesByRelation(graph.edges, 'uses_proxy')) {
    const proxy = nodeMap.get(edge.source);
    const account = nodeMap.get(edge.target);
    if (!proxy || !account) continue;
    const proxyCountry = proxy.country?.trim().toUpperCase();
    const accountCountry = account.country?.trim().toUpperCase();
    if (proxyCountry && accountCountry && proxyCountry !== accountCountry) {
      mismatchEdgeIds.push(`${edge.source}→${edge.target}`);
      mismatchNodeIds.add(edge.source);
      mismatchNodeIds.add(edge.target);
    }
  }

  const nodeIds = Array.from(mismatchNodeIds);
  return makeAlert(
    'country_mismatch',
    nodeIds.length > 0 ? 'error' : 'info',
    'Divergência de país',
    nodeIds.length > 0
      ? `${mismatchEdgeIds.length} conexão(ões) com país do proxy ≠ país da conta`
      : 'Nenhuma divergência de país',
    nodeIds,
    mismatchEdgeIds
  );
}

/** Same proxy_id used by 2+ platform_accounts AND proxy_type is dedicated (static_*). */
export function findSharedDedicatedProxies(graph: InfraGraphResponse): HealthAlert {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const proxyToAccounts = new Map<string, string[]>();

  for (const edge of edgesByRelation(graph.edges, 'uses_proxy')) {
    const list = proxyToAccounts.get(edge.source) ?? [];
    list.push(edge.target);
    proxyToAccounts.set(edge.source, list);
  }

  const sharedNodeIds: string[] = [];
  for (const [proxyId, accountIds] of proxyToAccounts) {
    if (accountIds.length < 2) continue;
    const proxy = nodeMap.get(proxyId);
    const proxyType = proxy?.meta?.proxy_type as string | undefined;
    if (proxyType?.startsWith('static_')) {
      sharedNodeIds.push(proxyId, ...accountIds);
    }
  }

  const unique = Array.from(new Set(sharedNodeIds));
  return makeAlert(
    'shared_proxy',
    unique.length > 0 ? 'error' : 'info',
    'Proxy dedicado compartilhado',
    unique.length > 0
      ? `Proxy(ies) do tipo dedicado usado por múltiplas contas`
      : 'Nenhum proxy dedicado compartilhado',
    unique
  );
}

/** Ad accounts with no business center (bc_entity_id IS NULL → no edge contains_ad_account). */
export function findAdAccountsWithoutBC(graph: InfraGraphResponse): HealthAlert {
  const adAccounts = nodesByType(graph.nodes, 'ad_account');
  const linkedAdAccountIds = new Set(
    edgesByRelation(graph.edges, 'contains_ad_account').map((e) => e.target)
  );
  const noBc = adAccounts.filter((a) => !linkedAdAccountIds.has(a.id));
  return makeAlert(
    'ad_account_without_bc',
    noBc.length > 0 ? 'warning' : 'info',
    'Ad Accounts sem BC',
    noBc.length > 0
      ? `${noBc.length} conta(s) de anúncio sem Business Center`
      : 'Todas as contas têm Business Center',
    noBc.map((n) => n.id)
  );
}

/** Proxies with status='active' AND expires_at < now(). */
export function findExpiredActiveProxies(
  graph: InfraGraphResponse,
  now: Date = new Date()
): HealthAlert {
  const proxies = nodesByType(graph.nodes, 'proxy');
  const expired = proxies.filter((p) => {
    if (p.status !== 'active') return false;
    const expiresAt = p.meta?.expires_at as string | null | undefined;
    if (!expiresAt) return false;
    return new Date(expiresAt) < now;
  });
  return makeAlert(
    'expired_proxy_active',
    expired.length > 0 ? 'error' : 'info',
    'Proxies expirados ativos',
    expired.length > 0
      ? `${expired.length} proxy(ies) marcado(s) como ativo mas com data de expiração no passado`
      : 'Nenhum proxy expirado ativo',
    expired.map((n) => n.id)
  );
}

// ── TikTok & Infra Isolation Rules ──────────────────────────────────────────

/**
 * TikTok account connected to 6 or more devices.
 * CRITICAL BAN RISK: TikTok strictly flags and bans accounts shared on 6+ devices.
 */
export function findTikTokAccountDeviceBanRisk(graph: InfraGraphResponse): HealthAlert {
  const runsOnEdges = edgesByRelation(graph.edges, 'runs_on');
  const flaggedAccountIds = new Set<string>();
  const allNodeIds = new Set<string>();
  const banEdgeIds: string[] = [];

  const accounts = nodesByType(graph.nodes, 'platform_account');
  for (const account of accounts) {
    const isTikTok = !account.platform || account.platform === 'tiktok';
    if (!isTikTok) continue;

    // Devices connected via runs_on edges (source: device, target: account)
    const connectedDevEdges = runsOnEdges.filter((e) => e.target === account.id);
    const connectedDevIds = new Set<string>(connectedDevEdges.map((e) => e.source));

    // Also include any device IDs in meta
    if (Array.isArray(account.meta?.device_ids)) {
      for (const dId of account.meta.device_ids as string[]) {
        connectedDevIds.add(dId.startsWith('dev_') ? dId : `dev_${dId}`);
      }
    }

    if (connectedDevIds.size >= 6) {
      flaggedAccountIds.add(account.id);
      allNodeIds.add(account.id);
      for (const devId of connectedDevIds) {
        allNodeIds.add(devId);
      }
      for (const e of connectedDevEdges) {
        banEdgeIds.push(`${e.source}→${e.target}`);
      }
    }
  }

  const nodeIds = Array.from(allNodeIds);
  return makeAlert(
    'tiktok_account_device_ban_risk',
    flaggedAccountIds.size > 0 ? 'error' : 'info',
    'Risco de Ban TikTok (6+ Dispositivos)',
    flaggedAccountIds.size > 0
      ? `${flaggedAccountIds.size} conta(s) TikTok conectada(s) a 6 ou mais dispositivos (RISCO IMINENTE DE BANIMENTO)`
      : 'Nenhuma conta TikTok com limite excessivo de dispositivos',
    nodeIds,
    banEdgeIds
  );
}

/**
 * TikTok account connected to multiple devices (2 to 5 devices).
 * Not ideal for TikTok: 1 account per 1 device is recommended.
 */
export function findTikTokAccountMultipleDevices(graph: InfraGraphResponse): HealthAlert {
  const runsOnEdges = edgesByRelation(graph.edges, 'runs_on');
  const flaggedAccountIds = new Set<string>();
  const allNodeIds = new Set<string>();
  const edgeIds: string[] = [];

  const accounts = nodesByType(graph.nodes, 'platform_account');
  for (const account of accounts) {
    const isTikTok = !account.platform || account.platform === 'tiktok';
    if (!isTikTok) continue;

    const connectedDevEdges = runsOnEdges.filter((e) => e.target === account.id);
    const connectedDevIds = new Set<string>(connectedDevEdges.map((e) => e.source));

    if (Array.isArray(account.meta?.device_ids)) {
      for (const dId of account.meta.device_ids as string[]) {
        connectedDevIds.add(dId.startsWith('dev_') ? dId : `dev_${dId}`);
      }
    }

    if (connectedDevIds.size >= 2 && connectedDevIds.size < 6) {
      flaggedAccountIds.add(account.id);
      allNodeIds.add(account.id);
      for (const devId of connectedDevIds) {
        allNodeIds.add(devId);
      }
      for (const e of connectedDevEdges) {
        edgeIds.push(`${e.source}→${e.target}`);
      }
    }
  }

  const nodeIds = Array.from(allNodeIds);
  return makeAlert(
    'tiktok_account_multiple_devices',
    flaggedAccountIds.size > 0 ? 'warning' : 'info',
    'Conta TikTok em Múltiplos Dispositivos',
    flaggedAccountIds.size > 0
      ? `${flaggedAccountIds.size} conta(s) TikTok vinculada(s) a múltiplos dispositivos (não ideal para TikTok, recomendado 1:1)`
      : 'Todas as contas TikTok em no máximo 1 dispositivo',
    nodeIds,
    edgeIds
  );
}

/**
 * Single device hosting multiple TikTok accounts.
 * Not ideal for TikTok: 1 device should host 1 account.
 */
export function findDeviceMultipleTikTokAccounts(graph: InfraGraphResponse): HealthAlert {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const runsOnEdges = edgesByRelation(graph.edges, 'runs_on');
  const deviceToTikTokAccounts = new Map<string, string[]>();

  for (const edge of runsOnEdges) {
    const targetAccount = nodeMap.get(edge.target);
    const isTikTok = !targetAccount?.platform || targetAccount?.platform === 'tiktok';
    if (isTikTok) {
      const list = deviceToTikTokAccounts.get(edge.source) ?? [];
      list.push(edge.target);
      deviceToTikTokAccounts.set(edge.source, list);
    }
  }

  const flaggedDeviceIds = new Set<string>();
  const allNodeIds = new Set<string>();
  const edgeIds: string[] = [];

  for (const [deviceId, accountIds] of deviceToTikTokAccounts) {
    const uniqueAccounts = Array.from(new Set(accountIds));
    if (uniqueAccounts.length > 1) {
      flaggedDeviceIds.add(deviceId);
      allNodeIds.add(deviceId);
      for (const accId of uniqueAccounts) {
        allNodeIds.add(accId);
        edgeIds.push(`${deviceId}→${accId}`);
      }
    }
  }

  const nodeIds = Array.from(allNodeIds);
  return makeAlert(
    'device_multiple_tiktok_accounts',
    flaggedDeviceIds.size > 0 ? 'warning' : 'info',
    'Dispositivo com Várias Contas TikTok',
    flaggedDeviceIds.size > 0
      ? `${flaggedDeviceIds.size} dispositivo(s) operando múltiplas contas TikTok (não ideal para TikTok, recomendado 1:1)`
      : 'Nenhum dispositivo compartilhado entre contas TikTok',
    nodeIds,
    edgeIds
  );
}

/**
 * Single proxy distributed to multiple devices.
 * 1 device should only have 1 proxy. A proxy can have multiple devices, but not ideal for TikTok.
 */
export function findProxySharedMultipleDevices(graph: InfraGraphResponse): HealthAlert {
  const deviceProxyEdges = edgesByRelation(graph.edges, 'device_proxy');
  const proxyToDevices = new Map<string, string[]>();

  for (const edge of deviceProxyEdges) {
    const list = proxyToDevices.get(edge.source) ?? [];
    list.push(edge.target);
    proxyToDevices.set(edge.source, list);
  }

  const flaggedProxyIds = new Set<string>();
  const allNodeIds = new Set<string>();
  const edgeIds: string[] = [];

  for (const [proxyId, deviceIds] of proxyToDevices) {
    const uniqueDevices = Array.from(new Set(deviceIds));
    if (uniqueDevices.length > 1) {
      flaggedProxyIds.add(proxyId);
      allNodeIds.add(proxyId);
      for (const devId of uniqueDevices) {
        allNodeIds.add(devId);
        edgeIds.push(`${proxyId}→${devId}`);
      }
    }
  }

  const nodeIds = Array.from(allNodeIds);
  return makeAlert(
    'proxy_shared_multiple_devices',
    flaggedProxyIds.size > 0 ? 'warning' : 'info',
    'Proxy em Múltiplos Dispositivos',
    flaggedProxyIds.size > 0
      ? `${flaggedProxyIds.size} proxy(ies) compartilhado(s) entre múltiplos dispositivos (não ideal para TikTok)`
      : 'Nenhum proxy compartilhado entre vários dispositivos',
    nodeIds,
    edgeIds
  );
}

/**
 * Single proxy associated with multiple Business Centers.
 * 1 Proxy can have multiple BCs, but not ideal for TikTok.
 */
export function findProxySharedMultipleBCs(graph: InfraGraphResponse): HealthAlert {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const bcProxyEdges = edgesByRelation(graph.edges, 'bc_proxy');
  const proxyToBcs = new Map<string, string[]>();

  for (const edge of bcProxyEdges) {
    const targetBc = nodeMap.get(edge.target);
    const isTikTok = !targetBc?.platform || targetBc?.platform === 'tiktok';
    if (isTikTok) {
      const list = proxyToBcs.get(edge.source) ?? [];
      list.push(edge.target);
      proxyToBcs.set(edge.source, list);
    }
  }

  const flaggedProxyIds = new Set<string>();
  const allNodeIds = new Set<string>();
  const edgeIds: string[] = [];

  for (const [proxyId, bcIds] of proxyToBcs) {
    const uniqueBcs = Array.from(new Set(bcIds));
    if (uniqueBcs.length > 1) {
      flaggedProxyIds.add(proxyId);
      allNodeIds.add(proxyId);
      for (const bcId of uniqueBcs) {
        allNodeIds.add(bcId);
        edgeIds.push(`${proxyId}→${bcId}`);
      }
    }
  }

  const nodeIds = Array.from(allNodeIds);
  return makeAlert(
    'proxy_shared_multiple_bcs',
    flaggedProxyIds.size > 0 ? 'warning' : 'info',
    'Proxy em Múltiplos Business Centers',
    flaggedProxyIds.size > 0
      ? `${flaggedProxyIds.size} proxy(ies) compartilhado(s) entre múltiplos Business Centers do TikTok (não ideal)`
      : 'Nenhum proxy compartilhado entre múltiplos Business Centers TikTok',
    nodeIds,
    edgeIds
  );
}

/** Computes all alerts for a graph. */
export function computeAllAlerts(
  graph: InfraGraphResponse,
  now?: Date
): HealthAlert[] {
  return [
    findTikTokAccountDeviceBanRisk(graph),
    findTikTokAccountMultipleDevices(graph),
    findDeviceMultipleTikTokAccounts(graph),
    findProxySharedMultipleDevices(graph),
    findProxySharedMultipleBCs(graph),
    findProxiesWithoutAccounts(graph),
    findAccountsWithoutProxy(graph),
    findBrowserProfilesWithoutAccount(graph),
    findCountryMismatches(graph),
    findSharedDedicatedProxies(graph),
    findAdAccountsWithoutBC(graph),
    findExpiredActiveProxies(graph, now),
  ];
}

/** Returns set of edge IDs (source→target) that have country mismatch. */
export function getMismatchEdgeIds(graph: InfraGraphResponse): Set<string> {
  const alert = findCountryMismatches(graph);
  return new Set(alert.edgeIds ?? []);
}

/** Returns set of proxy node IDs that are expired-but-active. */
export function getExpiredProxyIds(graph: InfraGraphResponse, now?: Date): Set<string> {
  const alert = findExpiredActiveProxies(graph, now);
  return new Set(alert.nodeIds);
}
