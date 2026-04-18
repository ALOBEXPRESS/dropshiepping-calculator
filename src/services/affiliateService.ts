import { supabase } from '../lib/supabase';

/**
 * Custom error for affiliate username conflicts
 */
export class AffiliateUsernameConflictError extends Error {
  constructor(message: string = 'Username já existe para esta organização') {
    super(message);
    this.name = 'AffiliateUsernameConflictError';
  }
}

export interface Affiliate {
  id: string;
  organization_id: string;
  name: string;
  username: string;
  marketplace: string;
  email: string | null;
  status: 'active' | 'pending' | 'inactive';
  total_earning: number;
  referrals: number;
  visits: number;
  created_at: string;
  updated_at: string;
  // Joined data from affiliate_marketplaces
  marketplace_name?: string | null;
}

export interface CreateAffiliateData {
  name: string;
  username: string;
  marketplace: string;
  email?: string | null;
  status?: 'active' | 'pending' | 'inactive';
}

export interface UpdateAffiliateData {
  name?: string;
  username?: string;
  marketplace?: string;
  email?: string | null;
  status?: 'active' | 'pending' | 'inactive';
  total_earning?: number;
  referrals?: number;
  visits?: number;
}

/**
 * Lista todos os afiliados de uma organização
 * Query com join em affiliate_marketplaces → marketplaces, ordenada por name ASC
 */
export async function listAffiliates(organizationId: string): Promise<Affiliate[]> {
  try {
    const { data, error } = await supabase
      .from('affiliates')
      .select(`
        *,
        affiliate_marketplaces(
          marketplace_id,
          marketplaces(name)
        )
      `)
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });

    if (error) throw error;

    // Flatten marketplace data into each affiliate
    const enriched = (data || []).map((aff) => {
      const typed = aff as { affiliate_marketplaces?: Array<{ marketplaces?: { name?: string } }> } & Affiliate;
      const firstMarketplace = typed.affiliate_marketplaces?.[0]?.marketplaces;
      return {
        ...typed,
        marketplace_name: firstMarketplace?.name ?? null,
      } as Affiliate;
    });

    return enriched;
  } catch (error) {
    console.error('Erro ao listar afiliados:', error);
    throw error;
  }
}

/**
 * Cria um novo afiliado
 * Lança AffiliateUsernameConflictError em caso de conflito de unique constraint
 */
export async function createAffiliate(
  organizationId: string,
  data: CreateAffiliateData
): Promise<Affiliate> {
  try {
    const { data: newAffiliate, error } = await supabase
      .from('affiliates')
      .insert({
        organization_id: organizationId,
        name: data.name,
        username: data.username,
        marketplace: data.marketplace,
        email: data.email ?? null,
        status: data.status ?? 'active',
        total_earning: 0,
        referrals: 0,
        visits: 0,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation (username conflict)
      if (error.code === '23505' && error.message.includes('username')) {
        throw new AffiliateUsernameConflictError(
          `Username "${data.username}" já existe para esta organização`
        );
      }
      throw error;
    }

    return newAffiliate as Affiliate;
  } catch (error) {
    if (error instanceof AffiliateUsernameConflictError) {
      throw error;
    }
    console.error('Erro ao criar afiliado:', error);
    throw error;
  }
}

/**
 * Atualiza um afiliado existente
 * Lança AffiliateUsernameConflictError em caso de conflito de unique constraint
 */
export async function updateAffiliate(
  id: string,
  data: UpdateAffiliateData
): Promise<Affiliate> {
  try {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.username !== undefined) updatePayload.username = data.username;
    if (data.marketplace !== undefined) updatePayload.marketplace = data.marketplace;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.total_earning !== undefined) updatePayload.total_earning = data.total_earning;
    if (data.referrals !== undefined) updatePayload.referrals = data.referrals;
    if (data.visits !== undefined) updatePayload.visits = data.visits;

    const { data: updatedAffiliate, error } = await supabase
      .from('affiliates')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation (username conflict)
      if (error.code === '23505' && error.message.includes('username')) {
        throw new AffiliateUsernameConflictError(
          `Username "${data.username}" já existe para esta organização`
        );
      }
      throw error;
    }

    return updatedAffiliate as Affiliate;
  } catch (error) {
    if (error instanceof AffiliateUsernameConflictError) {
      throw error;
    }
    console.error('Erro ao atualizar afiliado:', error);
    throw error;
  }
}

/**
 * Deleta um afiliado por ID
 */
export async function deleteAffiliate(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('affiliates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar afiliado:', error);
    throw error;
  }
}

/**
 * Deleta múltiplos afiliados por IDs
 * No-op para array vazio
 */
export async function bulkDeleteAffiliates(ids: string[]): Promise<void> {
  // No-op for empty array
  if (ids.length === 0) {
    return;
  }

  try {
    const { error } = await supabase
      .from('affiliates')
      .delete()
      .in('id', ids);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar afiliados em lote:', error);
    throw error;
  }
}
