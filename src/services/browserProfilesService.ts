import { supabase } from '@/lib/supabase';
import type {
  BrowserProfile,
  BrowserProfileFormData,
  BrowserProfileFilters,
} from '@/types/browserProfiles';

export class BrowserProfilesService {
  /**
   * Lista todos os perfis de navegador da organização.
   */
  static async list(
    organizationId: string,
    filters?: BrowserProfileFilters
  ): Promise<BrowserProfile[]> {
    if (!organizationId) return [];

    let query = supabase
      .from('browser_profiles')
      .select('*')
      .eq('organization_id', organizationId);

    if (filters?.tool && filters.tool !== 'all') {
      query = query.eq('tool', filters.tool);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.platform_account_id) {
      query = query.eq('platform_account_id', filters.platform_account_id);
    }

    if (filters?.search && filters.search.trim() !== '') {
      const term = `%${filters.search.trim()}%`;
      query = query.or(
        `name.ilike.${term},external_profile_id.ilike.${term},notes.ilike.${term}`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as BrowserProfile[];
  }

  /**
   * Obtém um perfil de navegador por ID.
   */
  static async getById(
    organizationId: string,
    id: string
  ): Promise<BrowserProfile | null> {
    if (!organizationId || !id) return null;

    const { data, error } = await supabase
      .from('browser_profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as BrowserProfile | null;
  }

  /**
   * Cria um novo perfil de navegador.
   */
  static async create(
    organizationId: string,
    formData: BrowserProfileFormData,
    userId?: string | null
  ): Promise<BrowserProfile> {
    const payload = {
      organization_id: organizationId,
      platform_account_id: formData.platform_account_id,
      tool: formData.tool,
      external_profile_id: formData.external_profile_id?.trim() || null,
      name: formData.name?.trim() || null,
      notes: formData.notes?.trim() || null,
      status: formData.status,
      created_by: userId || null,
    };

    const { data, error } = await supabase
      .from('browser_profiles')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data as BrowserProfile;
  }

  /**
   * Atualiza um perfil de navegador existente.
   */
  static async update(
    organizationId: string,
    id: string,
    formData: Partial<BrowserProfileFormData>
  ): Promise<BrowserProfile> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (formData.platform_account_id !== undefined)
      payload.platform_account_id = formData.platform_account_id;
    if (formData.tool !== undefined) payload.tool = formData.tool;
    if (formData.external_profile_id !== undefined)
      payload.external_profile_id = formData.external_profile_id?.trim() || null;
    if (formData.name !== undefined) payload.name = formData.name?.trim() || null;
    if (formData.notes !== undefined) payload.notes = formData.notes?.trim() || null;
    if (formData.status !== undefined) payload.status = formData.status;

    const { data, error } = await supabase
      .from('browser_profiles')
      .update(payload)
      .eq('organization_id', organizationId)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data as BrowserProfile;
  }

  /**
   * Exclui um perfil de navegador.
   */
  static async delete(organizationId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('browser_profiles')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  /**
   * Lista todos os perfis vinculados a uma platform_account específica.
   */
  static async listByPlatformAccount(
    organizationId: string,
    platformAccountId: string
  ): Promise<BrowserProfile[]> {
    if (!organizationId || !platformAccountId) return [];

    const { data, error } = await supabase
      .from('browser_profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('platform_account_id', platformAccountId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as BrowserProfile[];
  }
}
