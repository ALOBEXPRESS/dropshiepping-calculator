/**
 * Unit tests for Gender Classification Service
 * 
 * Tests for the classifySingle function (Task 3.10)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifySingle, type GenderClassifierConfig } from './genderClassificationService';

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('genderClassificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('classifySingle', () => {
    it('should extract first name and return classification result', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([
          ['X-Rate-Limit-Limit', '1000'],
          ['X-Rate-Limit-Remaining', '999'],
          ['X-Rate-Limit-Reset', '3600']
        ]),
        json: async () => [{
          name: 'João',
          gender: 'male',
          probability: 0.98,
          count: 4521
        }]
      });

      const config: GenderClassifierConfig = {
        apiKey: 'test-key',
        threshold: 0.80
      };

      const result = await classifySingle('lead-123', 'João Silva', config, 'BR');

      expect(result).toEqual({
        recordId: 'lead-123',
        gender: 'male',
        gender_probability: 0.98
      });

      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCall = mockFetch.mock.calls[0][0] as string;
      expect(fetchCall).toContain('name%5B%5D=Jo%C3%A3o'); // URL encoded: name[]=João
      expect(fetchCall).toContain('apikey=test-key');
      expect(fetchCall).toContain('country_id=BR');
    });

    it('should return null gender when probability is below threshold', async () => {
      // Mock API response with low probability
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => [{
          name: 'Alex',
          gender: 'male',
          probability: 0.72,
          count: 1203
        }]
      });

      const config: GenderClassifierConfig = {
        threshold: 0.80
      };

      const result = await classifySingle('lead-456', 'Alex Santos', config);

      expect(result).toEqual({
        recordId: 'lead-456',
        gender: null,
        gender_probability: 0.72
      });
    });

    it('should return null for empty name', async () => {
      const config: GenderClassifierConfig = {
        threshold: 0.80
      };

      const result = await classifySingle('lead-789', '', config);

      expect(result).toEqual({
        recordId: 'lead-789',
        gender: null,
        gender_probability: null
      });

      // Verify fetch was not called for empty name
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should extract only first name from full name', async () => {
      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        json: async () => [{
          name: 'Maria',
          gender: 'female',
          probability: 0.99,
          count: 8832
        }]
      });

      const config: GenderClassifierConfig = {
        threshold: 0.80
      };

      const result = await classifySingle('lead-999', 'Maria da Silva Santos', config);

      expect(result.recordId).toBe('lead-999');
      expect(result.gender).toBe('female');
      expect(result.gender_probability).toBe(0.99);

      // Verify only first name was sent to API
      const fetchCall = mockFetch.mock.calls[0][0] as string;
      expect(fetchCall).toContain('name%5B%5D=Maria'); // URL encoded: name[]=Maria
      expect(fetchCall).not.toContain('Silva');
      expect(fetchCall).not.toContain('Santos');
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const config: GenderClassifierConfig = {
        threshold: 0.80
      };

      // Should throw after retries
      await expect(
        classifySingle('lead-error', 'Test Name', config)
      ).rejects.toThrow();
    });
  });
});
