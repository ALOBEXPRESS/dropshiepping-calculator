import { supabase } from '@/lib/supabase';
import type {
  BusinessModelCanvasSection,
  BusinessModelCanvas,
  BmcSectionUpsertData,
  BmcSectionKey,
} from '@/types/businessModelCanvas';
import { BMC_SECTION_KEYS } from '@/types/businessModelCanvas';

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
        canvas[key] = row as BusinessModelCanvasSection;
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
    return data as BusinessModelCanvasSection | null;
  }

  /**
   * Cria ou atualiza uma seção do BMC (upsert por business_center_id + section).
   */
  static async upsertSection(
    organizationId: string,
    data: BmcSectionUpsertData
  ): Promise<BusinessModelCanvasSection> {
    if (!organizationId) throw new Error('organizationId é obrigatório');

    const payload = {
      organization_id: organizationId,
      business_center_id: data.business_center_id,
      section: data.section,
      items: data.items ?? [],
      notes: data.notes ?? null,
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
    return result as BusinessModelCanvasSection;
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
