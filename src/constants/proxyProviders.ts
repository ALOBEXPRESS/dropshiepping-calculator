/**
 * Constantes e utilitários para Provedores de Proxy
 */

export const PROTECTED_PROXY_PROVIDERS = [
  'bright data',
  'decodo',
  'iproyal',
  'netnut',
  'oxylabs',
  'proxy-cheap',
  'rayobyte',
  'soax',
  'webshare',
] as const;

/**
 * Verifica se um determinado nome de provedor é um dos provedores padrão protegidos do sistema.
 */
export function isSystemProvider(name?: string | null): boolean {
  if (!name) return false;
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return [
    'brightdata',
    'decodo',
    'iproyal',
    'netnut',
    'oxylabs',
    'proxycheap',
    'rayobyte',
    'soax',
    'webshare',
  ].includes(normalized);
}
