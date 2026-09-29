import { supabase } from '@/lib/supabase';
import type {
  BusinessCenter,
  BusinessCenterWithStats,
  BusinessCenterFormData,
  BusinessCenterFilters,
} from '@/types/businessCenters';

export class BusinessCentersService {
  /**
   * Lista todos os business centers da organização com contagem de ad_accounts vinculadas.
   */
  static async list(
    organizationId: string,
    filters?: BusinessCenterFilters
  ): Promise<BusinessCenterWithStats[]> {
    if (!organizationId) return [];

    let query = supabase
      .from('business_centers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (filters?.search && filters.search.trim() !== '') {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`bc_id.ilike.${term},name.ilike.${term}`);
    }

    const { data: centers, error } = await query;
    if (error) throw new Error(error.message);
    if (!centers || centers.length === 0) return [];

    // Contar ad_accounts vinculadas a cada BC
    const centerIds = centers.map((c) => c.id);
    const { data: adAccounts } = await supabase
      .from('ad_accounts')
      .select('id, bc_entity_id')
      .eq('organization_id', organizationId)
      .in('bc_entity_id', centerIds);

    const countMap = new Map<string, number>();
    for (const acc of adAccounts ?? []) {
      if (!acc.bc_entity_id) continue;
      countMap.set(acc.bc_entity_id, (countMap.get(acc.bc_entity_id) ?? 0) + 1);
    }

    return (centers as BusinessCenter[]).map((bc) => ({
      ...bc,
      ad_account_count: countMap.get(bc.id) ?? 0,
    }));
  }

  /**
   * Obtém um business center por ID.
   */
  static async getById(
    organizationId: string,
    id: string
  ): Promise<BusinessCenterWithStats | null> {
    if (!organizationId || !id) return null;

    const { data: center, error } = await supabase
      .from('business_centers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!center) return null;

    // Contar ad_accounts vinculadas
    const { count } = await supabase
      .from('ad_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('bc_entity_id', id);

    return {
      ...(center as BusinessCenter),
      ad_account_count: count ?? 0,
    };
  }

  /**
   * Cria um novo business center.
   */
  static async create(
    organizationId: string,
    data: BusinessCenterFormData,
    userId?: string | null
  ): Promise<BusinessCenter> {
    // Se bc_id não for informado, gera um ID de 19 dígitos no padrão do TikTok
    const finalBcId = data.bc_id && data.bc_id.trim() !== ''
      ? data.bc_id.trim()
      : `7${Date.now()}${Math.floor(10000 + Math.random() * 90000)}`;

    const payload = {
      organization_id: organizationId,
      platform: data.platform || 'tiktok',
      business_type: data.business_type || 'advertiser',
      company_legal_name: data.company_legal_name?.trim() || null,
      name: data.name?.trim() || null,
      country: data.country || 'BR',
      timezone: data.timezone || 'America/Sao_Paulo',
      currency: data.currency || 'BRL',
      bc_id: finalBcId,
      notes: data.notes?.trim() || null,
      created_by: userId || null,
    };

    const { data: created, error } = await supabase
      .from('business_centers')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Já existe um Business Center com este ID nesta organização.');
      }
      throw new Error(error.message);
    }
    return created as BusinessCenter;
  }

  /**
   * Atualiza um business center existente.
   */
  static async update(
    organizationId: string,
    id: string,
    data: Partial<BusinessCenterFormData>
  ): Promise<BusinessCenter> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.business_type !== undefined) payload.business_type = data.business_type;
    if (data.company_legal_name !== undefined) payload.company_legal_name = data.company_legal_name?.trim() || null;
    if (data.country !== undefined) payload.country = data.country;
    if (data.timezone !== undefined) payload.timezone = data.timezone;
    if (data.currency !== undefined) payload.currency = data.currency;
    if (data.bc_id !== undefined && data.bc_id.trim() !== '') payload.bc_id = data.bc_id.trim();
    if (data.name !== undefined) payload.name = data.name?.trim() || null;
    if (data.notes !== undefined) payload.notes = data.notes?.trim() || null;

    const { data: updated, error } = await supabase
      .from('business_centers')
      .update(payload)
      .eq('organization_id', organizationId)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Já existe um Business Center com este ID nesta organização.');
      }
      throw new Error(error.message);
    }
    return updated as BusinessCenter;
  }

  /**
   * Exclui um business center.
   * FK ON DELETE RESTRICT em ad_accounts — falha se houver contas vinculadas.
   */
  static async delete(organizationId: string, id: string): Promise<void> {
    // Verificação preventiva
    const { count, error: countError } = await supabase
      .from('ad_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('bc_entity_id', id);

    if (countError) throw new Error(countError.message);
    if (count && count > 0) {
      throw new Error(
        `Não é possível excluir este Business Center pois ${count} conta(s) de anúncios estão vinculadas a ele. Desvincule-as primeiro.`
      );
    }

    const { error } = await supabase
      .from('business_centers')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new Error(
          'Não é possível excluir: existem contas de anúncios vinculadas a este Business Center.'
        );
      }
      throw new Error(error.message);
    }
  }

  /**
   * Lista IDs e nomes das ad_accounts vinculadas a este BC.
   */
  static async getLinkedAdAccounts(
    organizationId: string,
    businessCenterId: string
  ): Promise<Array<{ id: string; name: string }>> {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select('id, name')
      .eq('organization_id', organizationId)
      .eq('bc_entity_id', businessCenterId);

    if (error) throw new Error(error.message);
    return data || [];
  }
}
