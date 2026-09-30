/**
 * Utilitários de máscara e auto-formatação em tempo real para inputs financeiros, fiscais e telefônicos.
 */

/**
 * Formata um valor numérico em centavos para a representação monetária correta.
 * - BRL / EUR: vírgula como separador decimal (ex: 25,00)
 * - USD / GBP: ponto como separador decimal (ex: 25.00)
 */
export function formatCentsToCurrencyString(
  cents: number,
  currencyCode: string = 'BRL'
): string {
  const value = cents / 100;
  const isEn = currencyCode === 'USD' || currencyCode === 'GBP';
  return new Intl.NumberFormat(isEn ? 'en-US' : 'pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Converte string digitada para número em float respeitando centavos.
 * Ex: "25" -> 0.25, "2500" -> 25.00
 */
export function parseCentsFromDigits(digitsOnly: string): number | null {
  if (!digitsOnly) return null;
  const parsed = parseInt(digitsOnly, 10);
  if (isNaN(parsed) || parsed === 0) return null;
  return parsed / 100;
}

/**
 * Máscara dinâmica CPF / CNPJ brasileira.
 * - Até 11 dígitos: formata como CPF (000.000.000-00)
 * - De 12 a 14 dígitos: formata como CNPJ (00.000.000/0000-00)
 */
export function formatCpfCnpj(value: string | null | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 14);

  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }

  // CNPJ: 00.000.000/0000-00
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Máscara de telefone internacional de acordo com as especificações do país selecionado.
 * Suporta:
 * - BR: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * - US: (XXX) XXX-XXXX
 * - PT: XXX XXX XXX
 * - ES: XXX XX XX XX
 * - FR: XX XX XX XX XX
 * - GB: XXXXX XXXXXX
 * - DE: XXXX XXXXXXXX
 */
export function formatPhoneByCountry(
  value: string | null | undefined,
  countryCode: string = 'BR'
): string {
  if (!value) return '';

  const country = (countryCode || 'BR').toUpperCase();
  const digits = value.replace(/\D/g, '');

  switch (country) {
    case 'BR': {
      const clean = digits.slice(0, 11);
      if (clean.length === 0) return '';
      if (clean.length <= 2) return `(${clean}`;
      if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
      if (clean.length <= 10) {
        // Fixo: (XX) XXXX-XXXX
        return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
      }
      // Celular: (XX) XXXXX-XXXX
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
    }

    case 'US': {
      const clean = digits.slice(0, 10);
      if (clean.length === 0) return '';
      if (clean.length <= 3) return `(${clean}`;
      if (clean.length <= 6) return `(${clean.slice(0, 3)}) ${clean.slice(3)}`;
      return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
    }

    case 'PT': {
      // 9 dígitos: 999 999 999
      const clean = digits.slice(0, 9);
      if (clean.length <= 3) return clean;
      if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
    }

    case 'ES': {
      // 9 dígitos: 612 34 56 78
      const clean = digits.slice(0, 9);
      if (clean.length <= 3) return clean;
      if (clean.length <= 5) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      if (clean.length <= 7)
        return `${clean.slice(0, 3)} ${clean.slice(3, 5)} ${clean.slice(5)}`;
      return `${clean.slice(0, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)}`;
    }

    case 'FR': {
      // 10 dígitos: 06 12 34 56 78
      const clean = digits.slice(0, 10);
      const parts: string[] = [];
      for (let i = 0; i < clean.length; i += 2) {
        parts.push(clean.slice(i, i + 2));
      }
      return parts.join(' ');
    }

    case 'GB': {
      // 11 dígitos: 07999 999999
      const clean = digits.slice(0, 11);
      if (clean.length <= 5) return clean;
      return `${clean.slice(0, 5)} ${clean.slice(5, 11)}`;
    }

    case 'DE': {
      // 11-12 dígitos: 0151 12345678
      const clean = digits.slice(0, 12);
      if (clean.length <= 4) return clean;
      return `${clean.slice(0, 4)} ${clean.slice(4, 12)}`;
    }

    default: {
      return digits.slice(0, 15);
    }
  }
}

/**
 * Máscara estrita para CPF: 000.000.000-00
 */
export function formatCpf(value: string | null | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Máscara estrita para CNPJ: 00.000.000/0000-00
 */
export function formatCnpj(value: string | null | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Máscara para Data Brasileira: DD/MM/AAAA
 */
export function formatDateBr(value: string | null | undefined): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}
