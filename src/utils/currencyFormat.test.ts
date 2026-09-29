import { describe, it, expect } from 'vitest';

const parseBRLFloat = (val: string | number | null | undefined): number => {
  if (val == null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const raw = String(val).trim();
  if (!raw || raw === '-') return 0;
  let normalized = raw;
  if (raw.includes(',') && raw.includes('.')) {
    normalized = raw.replace(/\./g, '').replace(',', '.');
  } else if (raw.includes(',')) {
    normalized = raw.replace(',', '.');
  }
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
};

const formatCurrencyInputOnChange = (valStr: string, allowNegative: boolean = false): string => {
  if (!valStr || !valStr.trim()) return '';
  const trimmed = valStr.trim();
  if (allowNegative && trimmed === '-') return '-';

  const isNegative = allowNegative && (valStr.match(/-/g) || []).length % 2 === 1;
  const digits = valStr.replace(/\D/g, '');
  if (!digits) return isNegative ? '-' : '';

  const intVal = parseInt(digits, 10);
  if (intVal === 0) return isNegative ? '-0,00' : '';

  const num = (isNegative ? -1 : 1) * (intVal / 100);
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatBRLInputOnBlur = (valStr: string, allowNegative: boolean = false): string => {
  if (!valStr || !valStr.trim()) return '';
  const trimmed = valStr.trim();
  if (allowNegative && (trimmed === '-' || trimmed === '-0' || trimmed === '-0,00' || trimmed === '0,00')) return '';
  return formatCurrencyInputOnChange(valStr, allowNegative);
};

const toggleSign = (val: string, setter: (v: string) => void) => {
  const trimmed = (val ?? '').trim();
  if (!trimmed || trimmed === '-') {
    setter(trimmed === '-' ? '' : '-');
    return;
  }
  if (trimmed.startsWith('-')) {
    setter(trimmed.slice(1));
  } else {
    setter('-' + trimmed);
  }
};

describe('parseBRLFloat', () => {
  it('handles null, undefined, empty, lone minus', () => {
    expect(parseBRLFloat(null)).toBe(0);
    expect(parseBRLFloat(undefined)).toBe(0);
    expect(parseBRLFloat('')).toBe(0);
    expect(parseBRLFloat('-')).toBe(0);
  });

  it('handles positive and negative numbers correctly', () => {
    expect(parseBRLFloat('10,00')).toBe(10);
    expect(parseBRLFloat('-10,00')).toBe(-10);
    expect(parseBRLFloat('-9,85')).toBe(-9.85);
    expect(parseBRLFloat('-1.234,56')).toBe(-1234.56);
    expect(parseBRLFloat(-15.5)).toBe(-15.5);
  });
});

describe('formatCurrencyInputOnChange with allowNegative', () => {
  it('preserves lone minus when typing starts with minus', () => {
    expect(formatCurrencyInputOnChange('-', true)).toBe('-');
  });

  it('formats negative number correctly while typing', () => {
    expect(formatCurrencyInputOnChange('-2', true)).toBe('-0,02');
    expect(formatCurrencyInputOnChange('-0,027', true)).toBe('-0,27');
    expect(formatCurrencyInputOnChange('-0,274', true)).toBe('-2,74');
  });

  it('toggles sign when minus is typed into an existing value', () => {
    expect(formatCurrencyInputOnChange('2,74-', true)).toBe('-2,74');
    expect(formatCurrencyInputOnChange('-2,74-', true)).toBe('2,74');
  });

  it('cleans up on blur if incomplete', () => {
    expect(formatBRLInputOnBlur('-', true)).toBe('');
    expect(formatBRLInputOnBlur('-0,00', true)).toBe('');
    expect(formatBRLInputOnBlur('-2,74', true)).toBe('-2,74');
  });

  it('toggleSign flips positive to negative and vice versa', () => {
    let state = '2,74';
    toggleSign(state, (v) => { state = v; });
    expect(state).toBe('-2,74');

    toggleSign(state, (v) => { state = v; });
    expect(state).toBe('2,74');

    state = '';
    toggleSign(state, (v) => { state = v; });
    expect(state).toBe('-');

    toggleSign(state, (v) => { state = v; });
    expect(state).toBe('');
  });
});
