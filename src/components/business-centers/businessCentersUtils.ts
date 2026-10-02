import type { BusinessCenterWithStats } from '@/types/businessCenters';

export interface IdBoxTheme {
  container: string;
  label: string;
  idText: string;
  copyBtn: string;
}

/**
 * Retorna as classes de tema para o container de destaque do ID do Business Center.
 */
export function getIdBoxTheme(platform: string): IdBoxTheme {
  switch (platform) {
    case 'tiktok':
      return {
        container:
          'bg-gradient-to-r from-cyan-950/45 via-zinc-900/90 to-cyan-950/25 border-cyan-500/40 hover:border-cyan-400/70 shadow-[0_0_15px_rgba(37,244,238,0.08)]',
        label: 'text-cyan-400',
        idText: 'text-cyan-100 group-hover/id:text-white',
        copyBtn:
          'bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border-cyan-500/30 shadow-sm',
      };
    case 'meta':
      return {
        container:
          'bg-gradient-to-r from-blue-950/45 via-zinc-900/90 to-blue-950/25 border-blue-500/40 hover:border-blue-400/70 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
        label: 'text-blue-400',
        idText: 'text-blue-100 group-hover/id:text-white',
        copyBtn:
          'bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 hover:text-white border-blue-500/30 shadow-sm',
      };
    case 'google':
      return {
        container:
          'bg-gradient-to-r from-amber-950/45 via-zinc-900/90 to-amber-950/25 border-amber-500/40 hover:border-amber-400/70 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
        label: 'text-amber-400',
        idText: 'text-amber-100 group-hover/id:text-white',
        copyBtn:
          'bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-white border-amber-500/30 shadow-sm',
      };
    default:
      return {
        container:
          'bg-gradient-to-r from-purple-950/45 via-zinc-900/90 to-purple-950/25 border-purple-500/40 hover:border-purple-400/70 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
        label: 'text-purple-400',
        idText: 'text-purple-100 group-hover/id:text-white',
        copyBtn:
          'bg-purple-500/15 hover:bg-purple-500/30 text-purple-300 hover:text-white border-purple-500/30 shadow-sm',
      };
  }
}

/**
 * Verifica se um Business Center atende ao critério de busca.
 * Suporta busca por: ID, Nome, Empresa, CNPJ (com/sem pontuação), Titular, CPF (com/sem pontuação), Notas e Plataforma.
 */
export function matchesBusinessCenterSearch(
  center: BusinessCenterWithStats,
  searchTerm: string
): boolean {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return true;

  const bcId = (center.bc_id || '').toLowerCase();
  const id = (center.id || '').toLowerCase();
  const name = (center.name || '').toLowerCase();
  const companyName = (center.company_legal_name || '').toLowerCase();
  const holderName = (center.holder_name || '').toLowerCase();
  const notes = (center.notes || '').toLowerCase();
  const platform = (center.platform || '').toLowerCase();

  // Busca textual padrão
  if (
    bcId.includes(term) ||
    id.includes(term) ||
    name.includes(term) ||
    companyName.includes(term) ||
    holderName.includes(term) ||
    notes.includes(term) ||
    platform.includes(term)
  ) {
    return true;
  }

  // Busca inteligente por CNPJ (com ou sem pontuação)
  if (center.company_cnpj) {
    const rawCnpj = center.company_cnpj.toLowerCase();
    if (rawCnpj.includes(term)) return true;

    const cnpjDigits = center.company_cnpj.replace(/\D/g, '');
    const termDigits = term.replace(/\D/g, '');
    if (termDigits && cnpjDigits.includes(termDigits)) {
      return true;
    }
  }

  // Busca inteligente por CPF (com ou sem pontuação)
  if (center.holder_cpf) {
    const rawCpf = center.holder_cpf.toLowerCase();
    if (rawCpf.includes(term)) return true;

    const cpfDigits = center.holder_cpf.replace(/\D/g, '');
    const termDigits = term.replace(/\D/g, '');
    if (termDigits && cpfDigits.includes(termDigits)) {
      return true;
    }
  }

  return false;
}
