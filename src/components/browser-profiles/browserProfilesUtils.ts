import type { BrowserProfile, BrowserProfileStatus } from '@/types/browserProfiles';

/**
 * Filtra perfis de navegador por termo de busca, status e conta de plataforma vinculada.
 */
export function filterBrowserProfiles(
  profiles: BrowserProfile[],
  searchTerm: string,
  statusFilter: 'all' | 'active' | 'archived',
  accountFilter: string
): BrowserProfile[] {
  const query = searchTerm.trim().toLowerCase();

  return profiles.filter((p) => {
    if (statusFilter !== 'all' && (p.status as BrowserProfileStatus) !== statusFilter) {
      return false;
    }
    if (accountFilter !== 'all' && p.platform_account_id !== accountFilter) {
      return false;
    }
    if (query) {
      const matchesName = p.name && p.name.toLowerCase().includes(query);
      const matchesSerial =
        p.external_profile_id && p.external_profile_id.toLowerCase().includes(query);
      const matchesNotes = p.notes && p.notes.toLowerCase().includes(query);
      if (!matchesName && !matchesSerial && !matchesNotes) return false;
    }
    return true;
  });
}
