import type { PlatformAccount } from '@/types/platformAccounts';

/**
 * Retorna a chave unificada da rede social da conta ('tiktok', 'google', 'instagram', 'facebook', 'threads').
 */
export function getAccountSocialKey(
  account: PlatformAccount
): 'tiktok' | 'google' | 'instagram' | 'facebook' | 'threads' {
  if (account.platform === 'tiktok') return 'tiktok';
  if (account.platform === 'google') return 'google';
  if (account.platform === 'meta') {
    if (account.meta_account_type === 'facebook') return 'facebook';
    if (account.meta_account_type === 'threads') return 'threads';
    return 'instagram';
  }
  return 'tiktok';
}

/**
 * Verifica se a conta corresponde ao filtro de rede social selecionado.
 */
export function matchesSocialFilter(
  account: PlatformAccount,
  filter: string
): boolean {
  if (!filter || filter === 'all') return true;
  return getAccountSocialKey(account) === filter;
}

/**
 * Retorna a URL pública do perfil da rede social para abertura em nova aba.
 * Retorna null se não houver apelido ou se a plataforma não tiver URL direta (ex: Google).
 */
export function getSocialProfileUrl(account: PlatformAccount): string | null {
  const username = account.nickname?.trim().replace(/^@/, '');
  if (!username) return null;

  if (account.platform === 'tiktok') {
    return `https://www.tiktok.com/@${encodeURIComponent(username)}`;
  }

  if (account.platform === 'meta') {
    if (account.meta_account_type === 'facebook') {
      return `https://facebook.com/${encodeURIComponent(username)}`;
    }
    if (account.meta_account_type === 'threads') {
      return `https://threads.net/@${encodeURIComponent(username)}`;
    }
    return `https://instagram.com/${encodeURIComponent(username)}`;
  }

  // Google accounts do not have a standard public profile URL
  return null;
}

/**
 * Extrai o e-mail prioritário da conta (campo direto ou metadata).
 */
export function getAccountDisplayEmail(account: PlatformAccount): string {
  if (account.email && account.email.trim()) {
    return account.email.trim();
  }
  const meta = account.platform_metadata;
  if (meta && 'email' in meta && typeof meta.email === 'string' && meta.email.trim()) {
    return meta.email.trim();
  }
  return '';
}

/**
 * Verifica se a conta corresponde ao termo de busca textual.
 * Compara nome, titular, apelido, e-mail e telefone (com ou sem pontuação).
 */
export function matchesSearchTerm(
  account: PlatformAccount,
  searchTerm: string
): boolean {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return true;
  const termClean = term.replace(/^@/, '');

  const name = (account.name || '').toLowerCase();
  const holderName = (account.holder_name || '').toLowerCase();
  const rawNickname = (account.nickname || '').toLowerCase();
  const cleanNickname = rawNickname.replace(/^@/, '');
  const email = getAccountDisplayEmail(account).toLowerCase();
  const phone = (account.phone || '').trim();

  // Busca textual padrão
  if (
    name.includes(term) ||
    holderName.includes(term) ||
    rawNickname.includes(term) ||
    (termClean && cleanNickname.includes(termClean)) ||
    email.includes(term)
  ) {
    return true;
  }

  // Busca em telefone (permite buscar com ou sem formatação)
  if (phone) {
    if (phone.includes(term)) return true;
    const phoneDigits = phone.replace(/\D/g, '');
    const termDigits = term.replace(/\D/g, '');
    if (termDigits && phoneDigits.includes(termDigits)) {
      return true;
    }
  }

  return false;
}
