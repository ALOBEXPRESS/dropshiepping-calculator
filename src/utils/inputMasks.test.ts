import { describe, it, expect } from 'vitest';
import {
  formatCpfCnpj,
  formatPhoneByCountry,
  formatCentsToCurrencyString,
  parseCentsFromDigits,
} from './inputMasks';

describe('inputMasks', () => {
  describe('formatCpfCnpj', () => {
    it('deve formatar CPF progressivamente até 11 dígitos', () => {
      expect(formatCpfCnpj('123')).toBe('123');
      expect(formatCpfCnpj('1234')).toBe('123.4');
      expect(formatCpfCnpj('12345678901')).toBe('123.456.789-01');
    });

    it('deve formatar CNPJ dinamicamente a partir de 12 dígitos', () => {
      expect(formatCpfCnpj('123456780001')).toBe('12.345.678/0001');
      expect(formatCpfCnpj('12345678000195')).toBe('12.345.678/0001-95');
    });

    it('deve retornar string vazia para nulo ou indefinido', () => {
      expect(formatCpfCnpj('')).toBe('');
      expect(formatCpfCnpj(null)).toBe('');
      expect(formatCpfCnpj(undefined)).toBe('');
    });
  });

  describe('formatPhoneByCountry', () => {
    it('deve formatar telefone celular brasileiro (11 dígitos)', () => {
      expect(formatPhoneByCountry('11987654321', 'BR')).toBe('(11) 98765-4321');
    });

    it('deve formatar telefone fixo brasileiro (10 dígitos)', () => {
      expect(formatPhoneByCountry('1133334444', 'BR')).toBe('(11) 3333-4444');
    });

    it('deve formatar telefone dos EUA (10 dígitos)', () => {
      expect(formatPhoneByCountry('5551234567', 'US')).toBe('(555) 123-4567');
    });

    it('deve formatar telefone de Portugal (9 dígitos)', () => {
      expect(formatPhoneByCountry('912345678', 'PT')).toBe('912 345 678');
    });
  });

  describe('formatCentsToCurrencyString', () => {
    it('deve formatar BRL com vírgula', () => {
      expect(formatCentsToCurrencyString(2500, 'BRL')).toBe('25,00');
      expect(formatCentsToCurrencyString(125050, 'BRL')).toBe('1.250,50');
    });

    it('deve formatar USD com ponto', () => {
      expect(formatCentsToCurrencyString(2500, 'USD')).toBe('25.00');
    });
  });

  describe('parseCentsFromDigits', () => {
    it('deve converter dígitos para float', () => {
      expect(parseCentsFromDigits('2500')).toBe(25);
      expect(parseCentsFromDigits('25')).toBe(0.25);
      expect(parseCentsFromDigits('')).toBeNull();
    });
  });
});
