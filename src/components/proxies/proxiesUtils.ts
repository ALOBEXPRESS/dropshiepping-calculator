import { PLATFORM_COUNTRIES } from '@/constants/niches';
import type { Proxy } from '@/types/proxies';
import type { PlatformAccount } from '@/types/platformAccounts';

let regionNamesFormatter: Intl.DisplayNames | null = null;

/**
 * Converte um código ISO-2 de país em nome legível em português.
 * Utiliza o mapa curado de PLATFORM_COUNTRIES e Intl.DisplayNames como fallback.
 */
export function getCountryName(code: string | null | undefined): string {
  if (!code) return 'Sem país definido';
  const upper = code.trim().toUpperCase();
  const found = PLATFORM_COUNTRIES.find((c) => c.code === upper);
  if (found) return found.name;
  try {
    if (!regionNamesFormatter && typeof Intl !== 'undefined' && Intl.DisplayNames) {
      regionNamesFormatter = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
    }
    return regionNamesFormatter?.of(upper) || upper;
  } catch {
    return upper;
  }
}

export interface ProviderGroup {
  id: string;
  name: string;
  proxies: Proxy[];
}

export interface CountryGroup {
  code: string;
  name: string;
  proxies: Proxy[];
}

/**
 * Agrupa uma lista de proxies por provedor.
 * Provedores são ordenados alfabeticamente, colocando 'Sem Provedor' no final.
 */
export function groupProxiesByProvider(
  proxies: Proxy[],
  providerMap: Map<string, string>
): ProviderGroup[] {
  const groupsMap = new Map<string, ProviderGroup>();

  for (const proxy of proxies) {
    const pName =
      (proxy.provider_id ? providerMap.get(proxy.provider_id) : null) ||
      proxy.provider ||
      'Sem Provedor';
    const key = pName.trim().toLowerCase();

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        id: proxy.provider_id || key,
        name: pName,
        proxies: [],
      });
    }
    groupsMap.get(key)!.proxies.push(proxy);
  }

  return Array.from(groupsMap.values()).sort((a, b) => {
    if (a.name === 'Sem Provedor') return 1;
    if (b.name === 'Sem Provedor') return -1;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

/**
 * Agrupa uma lista de proxies por país (código ISO-2).
 * Países são ordenados alfabeticamente, colocando 'OTHER' (sem país) no final.
 */
export function groupProxiesByCountry(proxies: Proxy[]): CountryGroup[] {
  const groupsMap = new Map<string, CountryGroup>();

  for (const proxy of proxies) {
    const code = proxy.country ? proxy.country.trim().toUpperCase() : 'OTHER';
    const name = proxy.country ? getCountryName(proxy.country) : 'Sem país definido';

    if (!groupsMap.has(code)) {
      groupsMap.set(code, { code, name, proxies: [] });
    }
    groupsMap.get(code)!.proxies.push(proxy);
  }

  return Array.from(groupsMap.values()).sort((a, b) => {
    if (a.code === 'OTHER') return 1;
    if (b.code === 'OTHER') return -1;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

/**
 * Filtra proxies por termo de busca (label, host, porta, username, provedor, país, conta vinculada).
 */
export function filterProxies(
  proxies: Proxy[],
  searchTerm: string,
  providerMap: Map<string, string>,
  proxyToAccount?: Map<string, PlatformAccount>
): Proxy[] {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return proxies;

  return proxies.filter((p) => {
    if (p.label.toLowerCase().includes(query)) return true;
    if (p.host.toLowerCase().includes(query)) return true;
    if (String(p.port).includes(query)) return true;
    if (p.username && p.username.toLowerCase().includes(query)) return true;
    if (p.country && p.country.toLowerCase().includes(query)) return true;
    if (p.notes && p.notes.toLowerCase().includes(query)) return true;

    const providerName =
      (p.provider_id ? providerMap.get(p.provider_id) : null) || p.provider || '';
    if (providerName.toLowerCase().includes(query)) return true;

    if (proxyToAccount) {
      const linked = proxyToAccount.get(p.id);
      if (linked && linked.name.toLowerCase().includes(query)) return true;
    }

    return false;
  });
}
