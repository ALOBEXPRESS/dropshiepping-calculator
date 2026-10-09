import { supabase } from '@/lib/supabase';
import type {
  Testador,
  TestadorFormData,
  Titular,
  TitularFormData,
  Influenciador,
  InfluenciadorFormData,
  TitularSubscription,
  TitularSubscriptionFormData,
} from '@/types/responsaveis';

// ── Helper Cleaners ──────────────────────────────────────────────────────────

function cleanTestadorPayload(payload: Partial<TestadorFormData>) {
  return {
    ...payload,
    document_number: payload.document_number?.trim() || null,
    rg: payload.rg?.trim() || null,
    birth_date: payload.birth_date && payload.birth_date.trim() ? payload.birth_date : null,
    phone: payload.phone?.trim() || null,
    email: payload.email?.trim() || null,
    notes: payload.notes?.trim() || null,
  };
}

function cleanTitularPayload(payload: Partial<TitularFormData>) {
  return {
    ...payload,
    document_type: payload.document_type || 'cpf',
    account_type: payload.account_type || (payload.document_type === 'cnpj' ? 'cnpj' : 'cpf'),
    document_number: payload.document_number?.trim() || null,
    rg: payload.rg?.trim() || null,
    birth_date: payload.birth_date && payload.birth_date.trim() ? payload.birth_date : null,
    phone: payload.phone?.trim() || null,
    email: payload.email?.trim() || null,
    notes: payload.notes?.trim() || null,
    marketplaces: Array.isArray(payload.marketplaces) ? payload.marketplaces : [],
    marketing_capital: typeof payload.marketing_capital === 'number' ? payload.marketing_capital : Number(payload.marketing_capital) || 0,
    marketing_total_cost: typeof payload.marketing_total_cost === 'number' ? payload.marketing_total_cost : Number(payload.marketing_total_cost) || 0,
    bank: payload.bank?.trim() || null,
    gateway_fee: typeof payload.gateway_fee === 'number' ? payload.gateway_fee : Number(payload.gateway_fee) || 0,
    preferred_payment_method: payload.preferred_payment_method || 'pix',
    credit_cards: Array.isArray(payload.credit_cards) ? payload.credit_cards : [],
    is_influencer: Boolean(payload.is_influencer),
    influencer_id: payload.influencer_id || null,
  };
}

function cleanSubscriptionPayload(payload: Partial<TitularSubscriptionFormData>) {
  return {
    ...payload,
    name: payload.name?.trim() || '',
    amount: typeof payload.amount === 'number' ? payload.amount : Number(payload.amount) || 0,
    currency: payload.currency || 'BRL',
    billing_cycle: payload.billing_cycle || 'mensal',
    business_center_id: payload.business_center_id || null,
    platform_account_id: payload.platform_account_id || null,
    notes: payload.notes?.trim() || null,
    is_active: payload.is_active !== undefined ? payload.is_active : true,
  };
}

function cleanInfluenciadorPayload(payload: Partial<InfluenciadorFormData>) {
  return {
    ...payload,
    instagram: payload.instagram?.trim() || null,
    tiktok: payload.tiktok?.trim() || null,
    twitter: payload.twitter?.trim() || null,
    percentage: typeof payload.percentage === 'number' ? payload.percentage : Number(payload.percentage) || 0,
  };
}

// ── Testadores ───────────────────────────────────────────────────────────────

export class TestadoresService {
  static async list(organizationId: string): Promise<Testador[]> {
    if (!organizationId) return [];

    const { data, error } = await supabase
      .from('testadores')
      .select('*')
      .eq('organization_id', organizationId)
      .order('full_name', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as Testador[];
  }

  static async create(
    organizationId: string,
    payload: TestadorFormData,
    userId?: string,
  ): Promise<Testador> {
    const cleaned = cleanTestadorPayload(payload);
    const { data, error } = await supabase
      .from('testadores')
      .insert({
        ...cleaned,
        organization_id: organizationId,
        created_by: userId ?? null,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data as Testador;
  }

  static async update(
    organizationId: string,
    id: string,
    payload: Partial<TestadorFormData>,
  ): Promise<Testador> {
    const cleaned = cleanTestadorPayload(payload);
    const { data, error } = await supabase
      .from('testadores')
      .update(cleaned)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data as Testador;
  }

  static async delete(organizationId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('testadores')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);
  }
}

// ── Titulares ────────────────────────────────────────────────────────────────

export class TitularesService {
  static async list(organizationId: string): Promise<Titular[]> {
    if (!organizationId) return [];

    try {
      const { data, error } = await supabase
        .from('titulares')
        .select(`
          *,
          influencer:influencers(id, name, instagram),
          subscriptions:titular_subscriptions(
            *,
            business_centers(id, name, platform),
            platform_accounts(id, name, platform)
          )
        `)
        .eq('organization_id', organizationId)
        .order('full_name', { ascending: true });

      if (error) {
        // Fallback to simple select if relations need re-indexing
        const fallback = await supabase
          .from('titulares')
          .select('*')
          .eq('organization_id', organizationId)
          .order('full_name', { ascending: true });

        if (fallback.error) throw new Error(fallback.error.message);
        return (fallback.data ?? []) as Titular[];
      }
      return (data ?? []) as Titular[];
    } catch {
      const fallback = await supabase
        .from('titulares')
        .select('*')
        .eq('organization_id', organizationId)
        .order('full_name', { ascending: true });

      if (fallback.error) throw new Error(fallback.error.message);
      return (fallback.data ?? []) as Titular[];
    }
  }

  static async create(
    organizationId: string,
    payload: TitularFormData,
    userId?: string,
  ): Promise<Titular> {
    const cleaned = cleanTitularPayload(payload);

    // Se o usuário marcou como influenciador e não escolheu um ID existente, cria perfil de influenciador automaticamente
    if (cleaned.is_influencer && !cleaned.influencer_id && cleaned.full_name) {
      try {
        const { data: existingInf } = await supabase
          .from('influencers')
          .select('id')
          .eq('organization_id', organizationId)
          .ilike('name', cleaned.full_name)
          .maybeSingle();

        if (existingInf?.id) {
          cleaned.influencer_id = existingInf.id;
        } else {
          const { data: newInf } = await supabase
            .from('influencers')
            .insert({
              organization_id: organizationId,
              name: cleaned.full_name,
              is_active: true,
              percentage: 0,
            })
            .select('id')
            .single();

          if (newInf?.id) {
            cleaned.influencer_id = newInf.id;
          }
        }
      } catch (e) {
        console.warn('Não foi possível autovincular influenciador no cadastro:', e);
      }
    }

    const { data, error } = await supabase
      .from('titulares')
      .insert({
        ...cleaned,
        organization_id: organizationId,
        created_by: userId ?? null,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data as Titular;
  }

  static async update(
    organizationId: string,
    id: string,
    payload: Partial<TitularFormData>,
  ): Promise<Titular> {
    const cleaned = cleanTitularPayload(payload);

    // Se o usuário marcou como influenciador e não escolheu um ID existente, cria perfil de influenciador automaticamente
    if (cleaned.is_influencer && !cleaned.influencer_id && cleaned.full_name) {
      try {
        const { data: existingInf } = await supabase
          .from('influencers')
          .select('id')
          .eq('organization_id', organizationId)
          .ilike('name', cleaned.full_name)
          .maybeSingle();

        if (existingInf?.id) {
          cleaned.influencer_id = existingInf.id;
        } else {
          const { data: newInf } = await supabase
            .from('influencers')
            .insert({
              organization_id: organizationId,
              name: cleaned.full_name,
              is_active: true,
              percentage: 0,
            })
            .select('id')
            .single();

          if (newInf?.id) {
            cleaned.influencer_id = newInf.id;
          }
        }
      } catch (e) {
        console.warn('Não foi possível autovincular influenciador na atualização:', e);
      }
    }

    const { data, error } = await supabase
      .from('titulares')
      .update(cleaned)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data as Titular;
  }

  static async delete(organizationId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('titulares')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);
  }
}

// ── Titular Subscriptions ────────────────────────────────────────────────────

export class TitularSubscriptionsService {
  static async list(organizationId: string, titularId?: string): Promise<TitularSubscription[]> {
    if (!organizationId) return [];

    let query = supabase
      .from('titular_subscriptions')
      .select(`
        *,
        business_centers(id, name, platform),
        platform_accounts(id, name, platform)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (titularId) {
      query = query.eq('titular_id', titularId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as TitularSubscription[];
  }

  static async create(
    organizationId: string,
    titularId: string,
    payload: TitularSubscriptionFormData,
    userId?: string,
  ): Promise<TitularSubscription> {
    const cleaned = cleanSubscriptionPayload(payload);
    const { data, error } = await supabase
      .from('titular_subscriptions')
      .insert({
        ...cleaned,
        organization_id: organizationId,
        titular_id: titularId,
        created_by: userId ?? null,
      })
      .select(`
        *,
        business_centers(id, name, platform),
        platform_accounts(id, name, platform)
      `)
      .single();

    if (error) throw new Error(error.message);
    return data as TitularSubscription;
  }

  static async update(
    organizationId: string,
    id: string,
    payload: Partial<TitularSubscriptionFormData>,
  ): Promise<TitularSubscription> {
    const cleaned = cleanSubscriptionPayload(payload);
    const { data, error } = await supabase
      .from('titular_subscriptions')
      .update(cleaned)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        business_centers(id, name, platform),
        platform_accounts(id, name, platform)
      `)
      .single();

    if (error) throw new Error(error.message);
    return data as TitularSubscription;
  }

  static async delete(organizationId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('titular_subscriptions')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);
  }
}

// ── Influenciadores ──────────────────────────────────────────────────────────

export class InfluenciadoresService {
  static async list(organizationId: string): Promise<Influenciador[]> {
    if (!organizationId) return [];

    const { data, error } = await supabase
      .from('influencers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as Influenciador[];
  }

  static async create(
    organizationId: string,
    payload: InfluenciadorFormData,
  ): Promise<Influenciador> {
    const cleaned = cleanInfluenciadorPayload(payload);
    const { data, error } = await supabase
      .from('influencers')
      .insert({ ...cleaned, organization_id: organizationId })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data as Influenciador;
  }

  static async update(
    organizationId: string,
    id: string,
    payload: Partial<InfluenciadorFormData>,
  ): Promise<Influenciador> {
    const cleaned = cleanInfluenciadorPayload(payload);
    const { data, error } = await supabase
      .from('influencers')
      .update(cleaned)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return data as Influenciador;
  }

  static async delete(organizationId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from('influencers')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);
  }
}
