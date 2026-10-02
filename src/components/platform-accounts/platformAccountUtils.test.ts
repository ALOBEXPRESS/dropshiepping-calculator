import { describe, it, expect } from 'vitest';
import {
  getAccountSocialKey,
  matchesSocialFilter,
  getSocialProfileUrl,
  getAccountDisplayEmail,
  matchesSearchTerm,
} from './platformAccountUtils';
import type { PlatformAccount } from '@/types/platformAccounts';

const baseAccount: PlatformAccount = {
  id: 'acc-1',
  organization_id: 'org-1',
  platform: 'tiktok',
  country: 'BR',
  name: 'Loja Oficial TikTok',
  holder_name: 'Jonatan Renan',
  nickname: '@lojaoficial',
  profile_photo_url: null,
  bio: 'Minha loja no TikTok',
  niche: 'moda_acessorios',
  signup_method: 'email',
  phone: '(11) 98765-4321',
  birth_date: null,
  platform_metadata: null,
  email: 'contato@loja.com',
  created_by: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('platformAccountUtils', () => {
  describe('getAccountSocialKey', () => {
    it('returns tiktok for platform tiktok', () => {
      expect(getAccountSocialKey(baseAccount)).toBe('tiktok');
    });

    it('returns google for platform google', () => {
      const acc = { ...baseAccount, platform: 'google' as const };
      expect(getAccountSocialKey(acc)).toBe('google');
    });

    it('returns facebook for meta platform with facebook meta_account_type', () => {
      const acc = { ...baseAccount, platform: 'meta' as const, meta_account_type: 'facebook' as const };
      expect(getAccountSocialKey(acc)).toBe('facebook');
    });

    it('returns threads for meta platform with threads meta_account_type', () => {
      const acc = { ...baseAccount, platform: 'meta' as const, meta_account_type: 'threads' as const };
      expect(getAccountSocialKey(acc)).toBe('threads');
    });

    it('defaults to instagram for meta platform without explicit meta_account_type', () => {
      const acc = { ...baseAccount, platform: 'meta' as const, meta_account_type: null };
      expect(getAccountSocialKey(acc)).toBe('instagram');
    });
  });

  describe('matchesSocialFilter', () => {
    it('returns true for filter "all"', () => {
      expect(matchesSocialFilter(baseAccount, 'all')).toBe(true);
    });

    it('returns true when filter matches account social key', () => {
      expect(matchesSocialFilter(baseAccount, 'tiktok')).toBe(true);
      expect(matchesSocialFilter(baseAccount, 'instagram')).toBe(false);
    });
  });

  describe('getSocialProfileUrl', () => {
    it('generates tiktok url from nickname', () => {
      expect(getSocialProfileUrl(baseAccount)).toBe('https://www.tiktok.com/@lojaoficial');
    });

    it('generates instagram url for meta instagram', () => {
      const acc = {
        ...baseAccount,
        platform: 'meta' as const,
        meta_account_type: 'instagram' as const,
        nickname: 'alob_express',
      };
      expect(getSocialProfileUrl(acc)).toBe('https://instagram.com/alob_express');
    });

    it('generates facebook url for meta facebook', () => {
      const acc = {
        ...baseAccount,
        platform: 'meta' as const,
        meta_account_type: 'facebook' as const,
        nickname: 'profile.php?id=123',
      };
      expect(getSocialProfileUrl(acc)).toBe('https://facebook.com/profile.php%3Fid%3D123');
    });

    it('returns null for google account', () => {
      const acc = { ...baseAccount, platform: 'google' as const };
      expect(getSocialProfileUrl(acc)).toBeNull();
    });

    it('returns null if nickname is empty or null', () => {
      const acc = { ...baseAccount, nickname: null };
      expect(getSocialProfileUrl(acc)).toBeNull();
    });
  });

  describe('getAccountDisplayEmail', () => {
    it('prioritizes direct account.email', () => {
      expect(getAccountDisplayEmail(baseAccount)).toBe('contato@loja.com');
    });

    it('falls back to platform_metadata email if account.email is null', () => {
      const acc = {
        ...baseAccount,
        email: null,
        platform_metadata: { signup_method: 'google' as const, email: 'meta@loja.com' },
      };
      expect(getAccountDisplayEmail(acc)).toBe('meta@loja.com');
    });

    it('returns empty string if neither is available', () => {
      const acc = { ...baseAccount, email: null, platform_metadata: null };
      expect(getAccountDisplayEmail(acc)).toBe('');
    });
  });

  describe('matchesSearchTerm', () => {
    it('returns true for empty search term', () => {
      expect(matchesSearchTerm(baseAccount, '')).toBe(true);
      expect(matchesSearchTerm(baseAccount, '   ')).toBe(true);
    });

    it('matches by name (case-insensitive)', () => {
      expect(matchesSearchTerm(baseAccount, 'oficial')).toBe(true);
      expect(matchesSearchTerm(baseAccount, 'LOJA')).toBe(true);
      expect(matchesSearchTerm(baseAccount, 'inexistente')).toBe(false);
    });

    it('matches by holder name', () => {
      expect(matchesSearchTerm(baseAccount, 'jonatan')).toBe(true);
      expect(matchesSearchTerm(baseAccount, 'renan')).toBe(true);
    });

    it('matches by nickname with or without @', () => {
      expect(matchesSearchTerm(baseAccount, 'lojaoficial')).toBe(true);
      expect(matchesSearchTerm(baseAccount, '@lojaoficial')).toBe(true);
    });

    it('matches by email', () => {
      expect(matchesSearchTerm(baseAccount, 'contato@loja')).toBe(true);
    });

    it('matches by phone digits regardless of formatting in search query', () => {
      expect(matchesSearchTerm(baseAccount, '98765-4321')).toBe(true);
      expect(matchesSearchTerm(baseAccount, '987654321')).toBe(true);
      expect(matchesSearchTerm(baseAccount, '11987654321')).toBe(true);
    });
  });
});
