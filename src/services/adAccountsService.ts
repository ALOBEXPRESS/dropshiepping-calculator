import { supabase } from '@/lib/supabase';
import type {
  AdAccount,
  AdAccountWithStats,
  AdAccountFilters,
  AdAccountFormData,
  AdAccountStatus,
} from '@/types/adAccounts';

export class AdAccountsService {
  /**
   * Lista todas as contas de anúncios da organização com contadores e gastos derivados
   */
  static async list(
    organizationId: string,
    filters?: AdAccountFilters
  ): Promise<AdAccountWithStats[]> {
    if (!organizationId) return [];

    let query = supabase
      .from('ad_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.platform && filters.platform !== 'all') {
      query = query.eq('platform', filters.platform);
    }

    if (filters?.search && filters.search.trim() !== '') {
      const term = `%${filters.search.trim()}%`;
      query = query.or(
        `name.ilike.${term},platform_account_id.ilike.${term},business_center_id.ilike.${term}`
      );
    }

    const { data: accounts, error } = await query;
    if (error) throw new Error(error.message);
    if (!accounts || accounts.length === 0) return [];

    // Buscar campanhas vinculadas para derivar contagem e gasto
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, ad_account_id, budget_amount, campaign_products(marketing_cost_override)')
      .eq('organization_id', organizationId);

    // Mapear métricas por ad_account_id
    const statsMap = new Map<string, { count: number; spend: number }>();
    for (const c of campaigns ?? []) {
      if (!c.ad_account_id) continue;
      const existing = statsMap.get(c.ad_account_id) ?? { count: 0, spend: 0 };
      existing.count += 1;

      // Calcular custo de marketing derivado dos produtos da campanha
      const productsCost = (c.campaign_products ?? []).reduce(
        (acc: number, p: { marketing_cost_override: number | null }) =>
          acc + (p.marketing_cost_override != null ? Number(p.marketing_cost_override) : 0),
        0
      );
      existing.spend += productsCost;
      statsMap.set(c.ad_account_id, existing);
    }

    return (accounts as AdAccount[]).map((acc) => {
      const stats = statsMap.get(acc.id) ?? { count: 0, spend: 0 };
      return {
        ...acc,
        campaign_count: stats.count,
        total_spend: stats.spend,
      };
    });
  }

  /**
   * Obtém detalhes de uma conta de anúncios específica
   */
  static async getById(
    organizationId: string,
    id: string
  ): Promise<AdAccountWithStats | null> {
    if (!organizationId || !id) return null;

    const { data: account, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!account) return null;

    // Buscar campanhas desta conta
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, budget_amount, campaign_products(marketing_cost_override)')
      .eq('organization_id', organizationId)
      .eq('ad_account_id', id);

    let totalSpend = 0;
    for (const c of campaigns ?? []) {
      const productsCost = (c.campaign_products ?? []).reduce(
        (acc: number, p: { marketing_cost_override: number | null }) =>
          acc + (p.marketing_cost_override != null ? Number(p.marketing_cost_override) : 0),
        0
      );
      totalSpend += productsCost;
    }

    return {
      ...(account as AdAccount),
      campaign_count: (campaigns ?? []).length,
      total_spend: totalSpend,
    };
  }

  /**
   * Cria uma nova conta de anúncios
   */
  static async create(
    organizationId: string,
    data: AdAccountFormData,
    userId?: string | null
  ): Promise<AdAccount> {
    const {
      pixel_id,
      catalog_id,
      name,
      platform,
      status,
      timezone,
      currency,
      country,
      spending_limit,
      billing_type,
      payment_status,
      legal_name,
      tax_id,
      industry,
      email,
      phone,
      platform_account_id,
      business_center_id,
    } = data;

    const platform_config = {
      ...(pixel_id ? { pixel_id } : {}),
      ...(catalog_id ? { catalog_id } : {}),
    };

    const insertPayload = {
      organization_id: organizationId,
      name,
      platform,
      status,
      timezone,
      currency,
      country,
      spending_limit: spending_limit ?? null,
      billing_type,
      payment_status,
      legal_name: legal_name || null,
      tax_id: tax_id || null,
      industry: industry || null,
      email: email || null,
      phone: phone || null,
      platform_account_id: platform_account_id || null,
      business_center_id: business_center_id || null,
      platform_config,
      created_by: userId || null,
    };

    const { data: created, error } = await supabase
      .from('ad_accounts')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return created as AdAccount;
  }

  /**
   * Atualiza dados de uma conta de anúncios
   */
  static async update(
    organizationId: string,
    id: string,
    data: Partial<AdAccountFormData>
  ): Promise<AdAccount> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.timezone !== undefined) updatePayload.timezone = data.timezone;
    if (data.currency !== undefined) updatePayload.currency = data.currency;
    if (data.country !== undefined) updatePayload.country = data.country;
    if (data.spending_limit !== undefined) updatePayload.spending_limit = data.spending_limit;
    if (data.billing_type !== undefined) updatePayload.billing_type = data.billing_type;
    if (data.payment_status !== undefined) updatePayload.payment_status = data.payment_status;
    if (data.legal_name !== undefined) updatePayload.legal_name = data.legal_name || null;
    if (data.tax_id !== undefined) updatePayload.tax_id = data.tax_id || null;
    if (data.industry !== undefined) updatePayload.industry = data.industry || null;
    if (data.email !== undefined) updatePayload.email = data.email || null;
    if (data.phone !== undefined) updatePayload.phone = data.phone || null;
    if (data.platform_account_id !== undefined)
      updatePayload.platform_account_id = data.platform_account_id || null;
    if (data.business_center_id !== undefined)
      updatePayload.business_center_id = data.business_center_id || null;

    if (data.pixel_id !== undefined || data.catalog_id !== undefined) {
      // Buscar platform_config atual para mesclar
      const { data: current } = await supabase
        .from('ad_accounts')
        .select('platform_config')
        .eq('id', id)
        .eq('organization_id', organizationId)
        .single();

      const mergedConfig = {
        ...(current?.platform_config ?? {}),
        ...(data.pixel_id !== undefined ? { pixel_id: data.pixel_id || undefined } : {}),
        ...(data.catalog_id !== undefined ? { catalog_id: data.catalog_id || undefined } : {}),
      };
      updatePayload.platform_config = mergedConfig;
    }

    const { data: updated, error } = await supabase
      .from('ad_accounts')
      .update(updatePayload)
      .eq('organization_id', organizationId)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return updated as AdAccount;
  }

  /**
   * Altera status da conta (ex: ativar, pausar, arquivar)
   */
  static async updateStatus(
    organizationId: string,
    id: string,
    status: AdAccountStatus
  ): Promise<void> {
    const { error } = await supabase
      .from('ad_accounts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  /**
   * Exclui uma conta de anúncios.
   * A FK ON DELETE RESTRICT no Postgres protege contra exclusão se houver campanhas.
   */
  static async delete(organizationId: string, id: string): Promise<void> {
    // Verificação preventiva antes de tentar o delete
    const { count, error: countError } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('ad_account_id', id);

    if (countError) throw new Error(countError.message);
    if (count && count > 0) {
      throw new Error(
        `Não é possível excluir esta conta pois existem ${count} campanha(s) vinculada(s) a ela. Realoque ou exclua as campanhas primeiro.`
      );
    }

    const { error } = await supabase
      .from('ad_accounts')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new Error(
          'Não é possível excluir esta conta pois existem campanhas associadas a ela.'
        );
      }
      throw new Error(error.message);
    }
  }
}
