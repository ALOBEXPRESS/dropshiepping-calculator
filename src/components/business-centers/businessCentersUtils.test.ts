import { describe, it, expect } from 'vitest';
import {
  getIdBoxTheme,
  matchesBusinessCenterSearch,
} from './businessCentersUtils';
import type { BusinessCenterWithStats } from '@/types/businessCenters';

const mockCenter: BusinessCenterWithStats = {
  id: 'bc-uuid-1234',
  organization_id: 'org-uuid-1',
  platform: 'tiktok',
  bc_id: '7123456789012345678',
  name: 'Alob Express — Marketing',
  business_type: 'advertiser',
  company_legal_name: 'Alob Express Ltda',
  country: 'BR',
  timezone: 'America/Sao_Paulo',
  currency: 'BRL',
  notes: 'Conta de anúncios principal para TikTok',
  holder_name: 'Jonatan Renan',
  holder_cpf: '123.456.789-00',
  company_cnpj: '12.345.678/0001-90',
  company_status: 'Ativa',
  ad_account_count: 3,
  created_by: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('businessCentersUtils', () => {
  describe('getIdBoxTheme', () => {
    it('returns cyan theme for tiktok', () => {
      const theme = getIdBoxTheme('tiktok');
      expect(theme.label).toContain('text-cyan-400');
    });

    it('returns blue theme for meta', () => {
      const theme = getIdBoxTheme('meta');
      expect(theme.label).toContain('text-blue-400');
    });

    it('returns amber theme for google', () => {
      const theme = getIdBoxTheme('google');
      expect(theme.label).toContain('text-amber-400');
    });

    it('returns purple theme as fallback for unknown platform', () => {
      const theme = getIdBoxTheme('other');
      expect(theme.label).toContain('text-purple-400');
    });
  });

  describe('matchesBusinessCenterSearch', () => {
    it('returns true for empty or whitespace-only search', () => {
      expect(matchesBusinessCenterSearch(mockCenter, '')).toBe(true);
      expect(matchesBusinessCenterSearch(mockCenter, '   ')).toBe(true);
    });

    it('matches by bc_id', () => {
      expect(matchesBusinessCenterSearch(mockCenter, '7123456')).toBe(true);
    });

    it('matches by name (case-insensitive)', () => {
      expect(matchesBusinessCenterSearch(mockCenter, 'alob express')).toBe(true);
      expect(matchesBusinessCenterSearch(mockCenter, 'MARKETING')).toBe(true);
      expect(matchesBusinessCenterSearch(mockCenter, 'inexistente')).toBe(false);
    });

    it('matches by company legal name', () => {
      expect(matchesBusinessCenterSearch(mockCenter, 'ltda')).toBe(true);
    });

    it('matches by holder name', () => {
      expect(matchesBusinessCenterSearch(mockCenter, 'jonatan')).toBe(true);
      expect(matchesBusinessCenterSearch(mockCenter, 'renan')).toBe(true);
    });

    it('matches by CNPJ with or without formatting', () => {
      // With formatting
      expect(matchesBusinessCenterSearch(mockCenter, '12.345.678')).toBe(true);
      // Plain digits
      expect(matchesBusinessCenterSearch(mockCenter, '12345678')).toBe(true);
      expect(matchesBusinessCenterSearch(mockCenter, '000190')).toBe(true);
    });

    it('matches by CPF with or without formatting', () => {
      // With formatting
      expect(matchesBusinessCenterSearch(mockCenter, '123.456.789')).toBe(true);
      // Plain digits
      expect(matchesBusinessCenterSearch(mockCenter, '123456789')).toBe(true);
    });

    it('matches by platform', () => {
      expect(matchesBusinessCenterSearch(mockCenter, 'tiktok')).toBe(true);
      expect(matchesBusinessCenterSearch(mockCenter, 'meta')).toBe(false);
    });

    it('matches by notes', () => {
      expect(matchesBusinessCenterSearch(mockCenter, 'principal')).toBe(true);
    });
  });
});
