/**
 * Characterization tests for currency.ts
 * These tests lock the CURRENT behaviour of parseCurrency and formatCurrency.
 * They must pass with zero changes to the source file.
 * DO NOT change the expected values — if a value looks wrong, open a separate bug.
 */
import { describe, it, expect } from 'vitest';
import { parseCurrency, formatCurrency, formatCompactCurrency } from './currency';

// ─── parseCurrency ────────────────────────────────────────────────────────────

describe('parseCurrency', () => {
  // Numeric passthrough
  it('returns a number unchanged', () => {
    expect(parseCurrency(100)).toBe(100);
    expect(parseCurrency(0)).toBe(0);
    expect(parseCurrency(-50)).toBe(-50);
    expect(parseCurrency(1234.56)).toBe(1234.56);
  });

  // Empty / null / undefined
  it('returns 0 for empty string', () => expect(parseCurrency('')).toBe(0));
  it('returns 0 for null', () => expect(parseCurrency(null as unknown as string)).toBe(0));
  it('returns 0 for undefined', () =>
    expect(parseCurrency(undefined as unknown as string)).toBe(0));

  // Brazilian format (dot = thousands, comma = decimal)
  it('parses "1.000" (BR thousands) as 1000', () => expect(parseCurrency('1.000')).toBe(1000));
  it('parses "1.000,50" correctly', () => expect(parseCurrency('1.000,50')).toBe(1000.5));
  it('parses "1.234.567,89" correctly', () =>
    expect(parseCurrency('1.234.567,89')).toBe(1234567.89));
  it('parses "840,90" as 840.90', () => expect(parseCurrency('840,90')).toBe(840.9));
  it('parses "92,32" as 92.32', () => expect(parseCurrency('92,32')).toBe(92.32));
  it('parses "240,73" as 240.73', () => expect(parseCurrency('240,73')).toBe(240.73));

  // English / plain float format
  it('parses "1.5" (decimal dot, no comma) as 1.5', () =>
    expect(parseCurrency('1.5')).toBe(1.5));
  it('parses "35.90" as 35.90', () => expect(parseCurrency('35.90')).toBe(35.9));
  it('parses "0.00" as 0', () => expect(parseCurrency('0.00')).toBe(0));

  // Negative values
  it('parses negative BR format "-1.000,00"', () =>
    expect(parseCurrency('-1.000,00')).toBe(-1000));
  it('handles negative float "-50.5"', () => expect(parseCurrency('-50.5')).toBe(-50.5));

  // Zero / small values
  it('parses "0" as 0', () => expect(parseCurrency('0')).toBe(0));
  it('parses "0,50" as 0.50', () => expect(parseCurrency('0,50')).toBe(0.5));
  it('parses ",50" (no leading digit) as 0.50', () => expect(parseCurrency(',50')).toBe(0.5));

  // Rounding edge-cases (the source truncates to 2 dp via toLocaleString, NOT here)
  it('preserves full precision on input number 1.005', () =>
    expect(parseCurrency(1.005)).toBe(1.005));

  // Non-numeric strings
  it('returns 0 for a plain word', () => expect(parseCurrency('abc')).toBe(0));

  // Free-sample / reembolso — negative results expected
  it('parses "-240,73" as -240.73', () => expect(parseCurrency('-240,73')).toBe(-240.73));
});

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats 840.9 as "840,90"', () => expect(formatCurrency(840.9)).toBe('840,90'));
  it('formats 1000 as "1.000,00"', () => expect(formatCurrency(1000)).toBe('1.000,00'));
  it('formats 0 as "0,00"', () => expect(formatCurrency(0)).toBe('0,00'));
  it('formats -240.73 as "-240,73"', () => expect(formatCurrency(-240.73)).toBe('-240,73'));
  it('returns "" for empty string', () => expect(formatCurrency('')).toBe(''));
  it('returns "" for null', () => expect(formatCurrency(null as unknown as number)).toBe(''));
  it('formats string input "840,90"', () => expect(formatCurrency('840,90')).toBe('840,90'));
  it('formats 1234567.89 with proper thousands', () =>
    expect(formatCurrency(1234567.89)).toBe('1.234.567,89'));
});

// ─── formatCompactCurrency ────────────────────────────────────────────────────

describe('formatCompactCurrency', () => {
  it('formats 999 without K suffix', () =>
    expect(formatCompactCurrency(999)).toBe('999,00'));
  it('formats 1000 as "R$ 1K"', () =>
    expect(formatCompactCurrency(1000)).toBe('R$ 1K'));
  it('formats 1500 as "R$ 1,5K"', () =>
    expect(formatCompactCurrency(1500)).toBe('R$ 1,5K'));
  it('formats 10000 as "R$ 10K"', () =>
    expect(formatCompactCurrency(10000)).toBe('R$ 10K'));
});
