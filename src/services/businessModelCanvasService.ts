import { supabase } from '@/lib/supabase';
import type {
  BusinessModelCanvasSection,
  BusinessModelCanvas,
  BmcSectionUpsertData,
  BmcSectionKey,
} from '@/types/businessModelCanvas';
import { BMC_SECTION_KEYS } from '@/types/businessModelCanvas';

/**
 * Decodifica o valor financeiro serializado em notas caso não haja coluna dedicada.
 * Padrão: "[VALOR: 15000.00] Notas adicionais..."
 */
export function parseBmcNotes(rawNotes: string | null): { financialValue: number | null; notes: string | null } {
  if (!rawNotes) return { financialValue: null, notes: null };
  const match = rawNotes.match(/^\[VALOR:\s*([0-9.,]+)\]\s*(.*)$/s);
  if (match) {
    const num = parseFloat(match[1].replace(',', '.'));
    const cleanNotes = match[2]?.trim() || null;
    return {
      financialValue: isNaN(num) ? null : num,
      notes: cleanNotes,
    };
  }
  return { financialValue: null, notes: rawNotes };
}

/**
 * Codifica o valor financeiro no campo notes de forma segura e transparente.
 */
export function formatBmcNotes(financialValue: number | null | undefined, notes: string | null | undefined): string | null {
  const cleanNotes = notes?.trim() || '';
  if (financialValue !== null && financialValue !== undefined && !isNaN(financialValue)) {
    return `[VALOR: ${financialValue.toFixed(2)}] ${cleanNotes}`.trim();
  }
  return cleanNotes || null;
}

export class BusinessModelCanvasService {
  /**
   * Busca todas as seções do BMC de um Business Center.
   * Retorna um objeto com todas as 9 chaves — seções sem registro ficam null.
   */
  static async getByBusinessCenter(
    businessCenterId: string,
    organizationId: string
  ): Promise<BusinessModelCanvas> {
    if (!businessCenterId || !organizationId) {
      return BusinessModelCanvasService._emptyCanvas();
    }

    const { data, error } = await supabase
      .from('business_model_canvas')
      .select('*')
      .eq('business_center_id', businessCenterId)
      .eq('organization_id', organizationId)
      .order('section');

    if (error) throw new Error(error.message);

    const canvas = BusinessModelCanvasService._emptyCanvas();

    for (const row of data ?? []) {
      const key = row.section as BmcSectionKey;
      if (BMC_SECTION_KEYS.includes(key)) {
        const { financialValue, notes } = parseBmcNotes(row.notes);
        canvas[key] = {
          ...row,
          notes,
          financial_value: row.financial_value != null ? Number(row.financial_value) : financialValue,
        } as BusinessModelCanvasSection;
      }
    }

    return canvas;
  }

  /**
   * Busca uma seção específica do BMC.
   */
  static async getSection(
    businessCenterId: string,
    organizationId: string,
    section: BmcSectionKey
  ): Promise<BusinessModelCanvasSection | null> {
    if (!businessCenterId || !organizationId) return null;

    const { data, error } = await supabase
      .from('business_model_canvas')
      .select('*')
      .eq('business_center_id', businessCenterId)
      .eq('organization_id', organizationId)
      .eq('section', section)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const { financialValue, notes } = parseBmcNotes(data.notes);
    return {
      ...data,
      notes,
      financial_value: data.financial_value != null ? Number(data.financial_value) : financialValue,
    } as BusinessModelCanvasSection;
  }

  /**
   * Cria ou atualiza uma seção do BMC (upsert por business_center_id + section).
   */
  static async upsertSection(
    organizationId: string,
    data: BmcSectionUpsertData
  ): Promise<BusinessModelCanvasSection> {
    if (!organizationId) throw new Error('organizationId é obrigatório');

    const serializedNotes = formatBmcNotes(data.financial_value, data.notes);

    const payload = {
      organization_id: organizationId,
      business_center_id: data.business_center_id,
      section: data.section,
      items: data.items ?? [],
      notes: serializedNotes,
    };

    const { data: result, error } = await supabase
      .from('business_model_canvas')
      .upsert(payload, {
        onConflict: 'business_center_id,section',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const { financialValue, notes } = parseBmcNotes(result.notes);
    return {
      ...result,
      notes,
      financial_value: result.financial_value != null ? Number(result.financial_value) : financialValue,
    } as BusinessModelCanvasSection;
  }

  /**
   * Exclui uma seção específica do BMC.
   */
  static async deleteSection(
    businessCenterId: string,
    organizationId: string,
    section: BmcSectionKey
  ): Promise<void> {
    const { error } = await supabase
      .from('business_model_canvas')
      .delete()
      .eq('business_center_id', businessCenterId)
      .eq('organization_id', organizationId)
      .eq('section', section);

    if (error) throw new Error(error.message);
  }

  // ── helpers privados ──────────────────────────────────────────────────────

  private static _emptyCanvas(): BusinessModelCanvas {
    return BMC_SECTION_KEYS.reduce((acc, key) => {
      acc[key] = null;
      return acc;
    }, {} as BusinessModelCanvas);
  }
}
