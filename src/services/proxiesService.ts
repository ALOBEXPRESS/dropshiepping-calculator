import { supabase } from '@/lib/supabase';
import type { Proxy, ProxyFormData } from '@/types/proxies';

export class ProxiesService {
  /**
   * Lista todos os proxies da organização.
   * NUNCA inclui o campo `password` na listagem — apenas `id` e campos de exibição.
   */
  static async list(organizationId: string): Promise<Proxy[]> {
    if (!organizationId) return [];

    const { data, error } = await supabase
      .from('proxies')
      .select('id, organization_id, label, protocol, host, port, username, country, proxy_type, provider, status, expires_at, notes, created_by, created_at, updated_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Proxy[];
  }

  /**
   * Retorna um proxy por ID — inclui `password` apenas neste contexto (edição).
   */
  static async getById(organizationId: string, id: string): Promise<Proxy | null> {
    if (!organizationId || !id) return null;

    const { data, error } = await supabase
      .from('proxies')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Proxy | null;
  }

  /**
   * Cria um novo proxy.
   */
  static async create(
    organizationId: string,
    formData: ProxyFormData,
    userId?: string | null
  ): Promise<Proxy> {
    const payload = {
      organization_id: organizationId,
      label: formData.label.trim(),
      protocol: formData.protocol,
      host: formData.host.trim(),
      port: formData.port,
      username: formData.username?.trim() || null,
      password: formData.password?.trim() || null,
      country: formData.country?.trim().toUpperCase() || null,
      proxy_type: formData.proxy_type,
      provider: formData.provider?.trim() || null,
      status: formData.status,
      expires_at: formData.expires_at || null,
      notes: formData.notes?.trim() || null,
      created_by: userId || null,
    };

    const { data, error } = await supabase
      .from('proxies')
      .insert(payload)
      .select('id, organization_id, label, protocol, host, port, username, country, proxy_type, provider, status, expires_at, notes, created_by, created_at, updated_at')
      .single();

    if (error) throw new Error(error.message);
    return data as Proxy;
  }

  /**
   * Atualiza um proxy existente.
   */
  static async update(
    organizationId: string,
    id: string,
    formData: Partial<ProxyFormData>
  ): Promise<Proxy> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (formData.label !== undefined) payload.label = formData.label.trim();
    if (formData.protocol !== undefined) payload.protocol = formData.protocol;
    if (formData.host !== undefined) payload.host = formData.host.trim();
    if (formData.port !== undefined) payload.port = formData.port;
    if (formData.username !== undefined) payload.username = formData.username?.trim() || null;
    if (formData.password !== undefined && formData.password !== '')
      payload.password = formData.password.trim();
    if (formData.country !== undefined) payload.country = formData.country?.trim().toUpperCase() || null;
    if (formData.proxy_type !== undefined) payload.proxy_type = formData.proxy_type;
    if (formData.provider !== undefined) payload.provider = formData.provider?.trim() || null;
    if (formData.status !== undefined) payload.status = formData.status;
    if (formData.expires_at !== undefined) payload.expires_at = formData.expires_at || null;
    if (formData.notes !== undefined) payload.notes = formData.notes?.trim() || null;

    const { data, error } = await supabase
      .from('proxies')
      .update(payload)
      .eq('organization_id', organizationId)
      .eq('id', id)
      .select('id, organization_id, label, protocol, host, port, username, country, proxy_type, provider, status, expires_at, notes, created_by, created_at, updated_at')
      .single();

    if (error) throw new Error(error.message);
    return data as Proxy;
  }

  /**
   * Exclui um proxy.
   * FK ON DELETE RESTRICT em platform_accounts — falha se estiver em uso.
   */
  static async delete(organizationId: string, id: string): Promise<void> {
    // Verificação preventiva
    const { count, error: countError } = await supabase
      .from('platform_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('proxy_id', id);

    if (countError) throw new Error(countError.message);
    if (count && count > 0) {
      throw new Error(
        `Não é possível excluir este proxy pois ${count} conta(s) de plataforma está vinculada a ele. Desvincule-a primeiro.`
      );
    }

    const { error } = await supabase
      .from('proxies')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new Error('Este proxy está vinculado a uma conta de plataforma. Desvincule-o primeiro.');
      }
      throw new Error(error.message);
    }
  }

  /**
   * Vincula um proxy a uma platform_account.
   * Respeita UNIQUE index — falha se o proxy já está vinculado a outra conta.
   */
  static async linkToAccount(
    organizationId: string,
    platformAccountId: string,
    proxyId: string | null
  ): Promise<void> {
    const { error } = await supabase
      .from('platform_accounts')
      .update({ proxy_id: proxyId, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('id', platformAccountId);

    if (error) {
      if (error.code === '23505') {
        throw new Error('Este proxy já está vinculado a outra conta de plataforma.');
      }
      throw new Error(error.message);
    }
  }
}
