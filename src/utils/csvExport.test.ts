/**
 * CSV Export Utility Tests
 * 
 * Tests for CSV export functionality including:
 * - CSV generation with proper formatting
 * - Field escaping and special character handling
 * - Date and currency formatting
 * - Filename generation
 * - Empty data handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  leadsToCSV,
  generateCSVFilename,
  exportLeadsToCSV,
} from './csvExport';
import type { Lead } from '@/types/leads';

describe('csvExport', () => {
  describe('leadsToCSV', () => {
    it('should generate CSV with headers', () => {
      const leads: Lead[] = [
        {
          id: '1',
          organization_id: 'org-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '(11) 98765-4321',
          mobile_phone: null,
          document_type: 'cpf',
          document_number: '123.456.789-00',
          company_name: 'Acme Corp',
          trade_name: null,
          marketplace_id: 'mp-1',
          marketplace_name: 'Mercado Livre',
          lead_status: 'qualified',
          lead_source: 'website',
          gender: 'male',
          gender_probability: 0.95,
          total_orders: 5,
          total_spent: 1500.50,
          first_order_date: '2024-01-15T10:00:00Z',
          last_order_date: '2024-03-20T15:30:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-03-20T15:30:00Z',
          address_street: null,
          address_number: null,
          address_complement: null,
          address_neighborhood: null,
          address_city: null,
          address_state: null,
          address_zip: null,
          address_country: null,
        },
      ];

      const csv = leadsToCSV(leads);

      // Check for BOM
      expect(csv.charCodeAt(0)).toBe(0xFEFF);

      // Check for headers
      expect(csv).toContain('Nome;Email;Telefone');
      expect(csv).toContain('John Doe');
      expect(csv).toContain('john@example.com');
      expect(csv).toContain('Qualificado'); // Status translated
      expect(csv).toContain('Masculino'); // Gender translated
    });

    it('should escape fields with semicolons', () => {
      const leads: Lead[] = [
        {
          id: '1',
          organization_id: 'org-1',
          name: 'Company; Inc',
          email: 'test@example.com',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as Lead,
      ];

      const csv = leadsToCSV(leads);

      // Field with semicolon should be wrapped in quotes
      expect(csv).toContain('"Company; Inc"');
    });

    it('should escape fields with quotes', () => {
      const leads: Lead[] = [
        {
          id: '1',
          organization_id: 'org-1',
          name: 'John "The Boss" Doe',
          email: 'test@example.com',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as Lead,
      ];

      const csv = leadsToCSV(leads);

      // Quotes should be escaped as double quotes
      expect(csv).toContain('"John ""The Boss"" Doe"');
    });

    it('should format dates correctly', () => {
      const leads: Lead[] = [
        {
          id: '1',
          organization_id: 'org-1',
          name: 'John Doe',
          email: 'test@example.com',
          created_at: '2024-01-15T10:30:45Z',
          updated_at: '2024-01-15T10:30:45Z',
        } as Lead,
      ];

      const csv = leadsToCSV(leads);

      // Date should be formatted as dd/MM/yyyy HH:mm:ss
      expect(csv).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/);
    });

    it('should format currency with comma decimal separator', () => {
      const leads: Lead[] = [
        {
          id: '1',
          organization_id: 'org-1',
          name: 'John Doe',
          email: 'test@example.com',
          total_spent: 1234.56,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as Lead,
      ];

      const csv = leadsToCSV(leads);

      // Currency should use comma as decimal separator
      expect(csv).toContain('1234,56');
    });

    it('should handle null and undefined values', () => {
      const leads: Lead[] = [
        {
          id: '1',
          organization_id: 'org-1',
          name: 'John Doe',
          email: null,
          phone: undefined,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as Lead,
      ];

      const csv = leadsToCSV(leads);

      // Should not throw and should handle nulls gracefully
      expect(csv).toBeTruthy();
      expect(csv).toContain('John Doe');
    });

    it('should translate status values to Portuguese', () => {
      const statuses: Array<Lead['lead_status']> = [
        'new',
        'contacted',
        'qualified',
        'lost',
        'converted',
      ];

      const expectedTranslations = [
        'Novo',
        'Contatado',
        'Qualificado',
        'Perdido',
        'Convertido',
      ];

      statuses.forEach((status, index) => {
        const leads: Lead[] = [
          {
            id: '1',
            organization_id: 'org-1',
            name: 'Test',
            lead_status: status,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          } as Lead,
        ];

        const csv = leadsToCSV(leads);
        expect(csv).toContain(expectedTranslations[index]);
      });
    });

    it('should format complete address', () => {
      const leads: Lead[] = [
        {
          id: '1',
          organization_id: 'org-1',
          name: 'John Doe',
          address_street: 'Rua das Flores',
          address_number: '123',
          address_complement: 'Apto 45',
          address_neighborhood: 'Centro',
          address_city: 'São Paulo',
          address_state: 'SP',
          address_zip: '01234-567',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as Lead,
      ];

      const csv = leadsToCSV(leads);

      // Address should be formatted as comma-separated string
      expect(csv).toContain('Rua das Flores, 123, Apto 45, Centro, São Paulo, SP, 01234-567');
    });

    it('should use semicolon as delimiter', () => {
      const leads: Lead[] = [
        {
          id: '1',
          organization_id: 'org-1',
          name: 'John Doe',
          email: 'test@example.com',
          phone: '123456789',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as Lead,
      ];

      const csv = leadsToCSV(leads);

      // Count semicolons in header row (should be number of columns - 1)
      const lines = csv.split('\n');
      const headerLine = lines[1]; // Skip BOM line
      const semicolonCount = (headerLine.match(/;/g) || []).length;

      expect(semicolonCount).toBeGreaterThan(0);
    });
  });

  describe('generateCSVFilename', () => {
    it('should generate filename with organization name', () => {
      const filename = generateCSVFilename('Acme Corp');

      expect(filename).toMatch(/^leads-acme-corp-\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('should sanitize organization name', () => {
      const filename = generateCSVFilename('Acme Corp & Co.!');

      // Should remove special characters and replace spaces with hyphens
      expect(filename).toMatch(/^leads-acme-corp-co-\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('should generate filename without organization name', () => {
      const filename = generateCSVFilename();

      expect(filename).toMatch(/^leads-\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('should include current date', () => {
      const filename = generateCSVFilename('Test Org');
      const today = new Date();
      const year = today.getFullYear();

      expect(filename).toContain(String(year));
    });
  });

  describe('exportLeadsToCSV', () => {
    beforeEach(() => {
      // Mock DOM methods
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      // Mock document methods
      const mockLink = {
        setAttribute: vi.fn(),
        click: vi.fn(),
        style: {},
      };
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    });

    it('should throw error for empty leads array', async () => {
      await expect(exportLeadsToCSV([])).rejects.toThrow('Não há dados para exportar');
    });

    it('should create and trigger download', async () => {
      const leads: Lead[] = [
        {
          id: '1',
          organization_id: 'org-1',
          name: 'John Doe',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as Lead,
      ];

      await exportLeadsToCSV(leads, 'Test Org');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
