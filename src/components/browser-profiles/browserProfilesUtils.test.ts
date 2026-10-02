import { describe, it, expect } from 'vitest';
import { filterBrowserProfiles } from './browserProfilesUtils';
import type { BrowserProfile } from '@/types/browserProfiles';

const mockProfiles: BrowserProfile[] = [
  {
    id: 'prof-1',
    organization_id: 'org-1',
    platform_account_id: 'acc-1',
    tool: 'adspower',
    external_profile_id: 'k7y2m10',
    name: 'Perfil Principal AdsPower #01',
    notes: 'Aquecimento finalizado',
    status: 'active',
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prof-2',
    organization_id: 'org-1',
    platform_account_id: 'acc-2',
    tool: 'adspower',
    external_profile_id: 'k8z9x22',
    name: 'Perfil Backup AdsPower #02',
    notes: 'Contingência Europa',
    status: 'archived',
    created_by: 'user-1',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
  {
    id: 'prof-3',
    organization_id: 'org-1',
    platform_account_id: 'acc-1',
    tool: 'adspower',
    external_profile_id: 'serial-999',
    name: 'Perfil TikTok Ads',
    notes: 'Campanha de escala',
    status: 'active',
    created_by: 'user-1',
    created_at: '2026-01-03T00:00:00Z',
    updated_at: '2026-01-03T00:00:00Z',
  },
];

describe('browserProfilesUtils', () => {
  describe('filterBrowserProfiles', () => {
    it('returns all profiles when no filter is applied', () => {
      const res = filterBrowserProfiles(mockProfiles, '', 'all', 'all');
      expect(res).toHaveLength(3);
    });

    it('filters by status', () => {
      const active = filterBrowserProfiles(mockProfiles, '', 'active', 'all');
      expect(active).toHaveLength(2);
      expect(active.map((p) => p.id)).toEqual(['prof-1', 'prof-3']);

      const archived = filterBrowserProfiles(mockProfiles, '', 'archived', 'all');
      expect(archived).toHaveLength(1);
      expect(archived[0].id).toBe('prof-2');
    });

    it('filters by platform_account_id', () => {
      const res = filterBrowserProfiles(mockProfiles, '', 'all', 'acc-1');
      expect(res).toHaveLength(2);
      expect(res.map((p) => p.id)).toEqual(['prof-1', 'prof-3']);
    });

    it('filters by search term in name', () => {
      const res = filterBrowserProfiles(mockProfiles, 'Backup', 'all', 'all');
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe('prof-2');
    });

    it('filters by search term in AdsPower serial (external_profile_id)', () => {
      const res = filterBrowserProfiles(mockProfiles, 'k7y2m10', 'all', 'all');
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe('prof-1');
    });

    it('filters by search term in notes', () => {
      const res = filterBrowserProfiles(mockProfiles, 'escala', 'all', 'all');
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe('prof-3');
    });
  });
});
