import { supabase } from '@/lib/supabase';
import type {
  Testador,
  TestadorFormData,
  Titular,
  TitularFormData,
  Influenciador,
  InfluenciadorFormData,
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
    document_number: payload.document_number?.trim() || null,
    rg: payload.rg?.trim() || null,
    birth_date: payload.birth_date && payload.birth_date.trim() ? payload.birth_date : null,
    phone: payload.phone?.trim() || null,
    email: payload.email?.trim() || null,
    notes: payload.notes?.trim() || null,
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

    const { data, error } = await supabase
      .from('titulares')
      .select('*')
      .eq('organization_id', organizationId)
      .order('full_name', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as Titular[];
  }

  static async create(
    organizationId: string,
    payload: TitularFormData,
    userId?: string,
  ): Promise<Titular> {
    const cleaned = cleanTitularPayload(payload);
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
