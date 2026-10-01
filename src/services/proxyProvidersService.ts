import { supabase } from '@/lib/supabase';
import type { ProxyProvider, ProxyProviderFormData, ProxyProviderWithStats } from '@/types/proxyProviders';

export class ProxyProvidersService {
  /**
   * Lista todos os provedores de proxy da organização.
   */
  static async list(organizationId: string): Promise<ProxyProvider[]> {
    if (!organizationId) return [];

    const { data, error } = await supabase
      .from('proxy_providers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as ProxyProvider[];
  }

  /**
   * Lista provedores com contagem de proxies vinculados.
   */
  static async listWithStats(organizationId: string): Promise<ProxyProviderWithStats[]> {
    if (!organizationId) return [];

    // Busca provedores
    const providers = await this.list(organizationId);

    // Busca contagem de proxies agrupada por provider_id
    const { data: proxies, error: proxyError } = await supabase
      .from('proxies')
      .select('provider_id')
      .eq('organization_id', organizationId)
      .not('provider_id', 'is', null);

    if (proxyError) {
      console.warn('[ProxyProvidersService] Falha ao contar proxies vinculados:', proxyError);
      return providers.map((p) => ({ ...p, proxy_count: 0 }));
    }

    const countMap = new Map<string, number>();
    for (const row of proxies ?? []) {
      if (row.provider_id) {
        countMap.set(row.provider_id, (countMap.get(row.provider_id) ?? 0) + 1);
      }
    }

    return providers.map((p) => ({
      ...p,
      proxy_count: countMap.get(p.id) ?? 0,
    }));
  }

  /**
   * Cria um novo provedor.
   */
  static async create(
    organizationId: string,
    formData: ProxyProviderFormData,
    userId?: string | null
  ): Promise<ProxyProvider> {
    const payload = {
      organization_id: organizationId,
      name: formData.name.trim(),
      website: formData.website?.trim() || null,
      notes: formData.notes?.trim() || null,
      created_by: userId || null,
    };

    const { data, error } = await supabase
      .from('proxy_providers')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Já existe um provedor chamado "${formData.name.trim()}" nesta organização.`);
      }
      throw new Error(error.message);
    }

    return data as ProxyProvider;
  }

  /**
   * Atualiza um provedor existente.
   */
  static async update(
    organizationId: string,
    id: string,
    formData: Partial<ProxyProviderFormData>
  ): Promise<ProxyProvider> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (formData.name !== undefined) payload.name = formData.name.trim();
    if (formData.website !== undefined) payload.website = formData.website?.trim() || null;
    if (formData.notes !== undefined) payload.notes = formData.notes?.trim() || null;

    const { data, error } = await supabase
      .from('proxy_providers')
      .update(payload)
      .eq('organization_id', organizationId)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Já existe outro provedor com este nome nesta organização.');
      }
      throw new Error(error.message);
    }

    return data as ProxyProvider;
  }

  /**
   * Exclui um provedor. Impede se houver proxies vinculados (FK RESTRICT).
   */
  static async delete(organizationId: string, id: string): Promise<void> {
    // Verificação preventiva
    const { count, error: countError } = await supabase
      .from('proxies')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('provider_id', id);

    if (countError) throw new Error(countError.message);
    if (count && count > 0) {
      throw new Error(
        `Não é possível excluir este provedor pois ${count} proxy(ies) está(ão) vinculado(s) a ele. Desvincule-os primeiro.`
      );
    }

    const { error } = await supabase
      .from('proxy_providers')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new Error('Este provedor possui proxies associados. Desvincule-os antes de excluir.');
      }
      throw new Error(error.message);
    }
  }
}
