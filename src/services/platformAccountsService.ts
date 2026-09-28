import { supabase } from '@/lib/supabase';
import type {
  PlatformAccount,
  PlatformAccountFormData,
  PlatformAccountFilters,
} from '@/types/platformAccounts';
import { buildPlatformMetadata } from '@/types/platformAccounts';

export class PlatformAccountsService {
  /**
   * Lista todas as contas de plataforma da organização.
   * Uma platform_account pode existir sem nenhuma ad_account vinculada.
   */
  static async list(
    organizationId: string,
    filters?: PlatformAccountFilters
  ): Promise<PlatformAccount[]> {
    if (!organizationId) return [];

    let query = supabase
      .from('platform_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (filters?.platform && filters.platform !== 'all') {
      query = query.eq('platform', filters.platform);
    }

    if (filters?.search && filters.search.trim() !== '') {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`name.ilike.${term},holder_name.ilike.${term},nickname.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data ?? []) as PlatformAccount[]).map((a) => ({
      ...a,
      email: a.platform_metadata?.email ?? null,
    }));
  }

  /**
   * Obtém uma conta de plataforma por ID.
   */
  static async getById(
    organizationId: string,
    id: string
  ): Promise<PlatformAccount | null> {
    if (!organizationId || !id) return null;

    const { data, error } = await supabase
      .from('platform_accounts')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    const acc = data as PlatformAccount;
    return {
      ...acc,
      email: acc.platform_metadata?.email ?? null,
    };
  }

  /**
   * Cria uma nova conta de plataforma.
   */
  static async create(
    organizationId: string,
    formData: PlatformAccountFormData,
    userId?: string | null
  ): Promise<PlatformAccount> {
    const platform_metadata = buildPlatformMetadata(formData);

    const payload = {
      organization_id: organizationId,
      platform: formData.platform,
      country: formData.country,
      name: formData.name.trim(),
      holder_name: formData.holder_name.trim(),
      nickname: formData.nickname?.trim() || null,
      profile_photo_url: formData.profile_photo_url || null,
      bio: formData.bio?.trim() || null,
      niche: formData.niche,
      signup_method: formData.signup_method,
      phone: formData.phone?.trim() || null,
      birth_date: formData.birth_date || null,
      platform_metadata: platform_metadata ?? null,
      created_by: userId || null,
    };

    const { data, error } = await supabase
      .from('platform_accounts')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    const created = data as PlatformAccount;
    return {
      ...created,
      email: created.platform_metadata?.email ?? null,
    };
  }

  /**
   * Atualiza uma conta de plataforma existente.
   */
  static async update(
    organizationId: string,
    id: string,
    formData: Partial<PlatformAccountFormData>
  ): Promise<PlatformAccount> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (formData.country !== undefined) updatePayload.country = formData.country;
    if (formData.name !== undefined) updatePayload.name = formData.name.trim();
    if (formData.holder_name !== undefined) updatePayload.holder_name = formData.holder_name.trim();
    if (formData.nickname !== undefined) updatePayload.nickname = formData.nickname?.trim() || null;
    if (formData.profile_photo_url !== undefined) updatePayload.profile_photo_url = formData.profile_photo_url || null;
    if (formData.bio !== undefined) updatePayload.bio = formData.bio?.trim() || null;
    if (formData.niche !== undefined) updatePayload.niche = formData.niche;
    if (formData.signup_method !== undefined) updatePayload.signup_method = formData.signup_method;
    if (formData.phone !== undefined) updatePayload.phone = formData.phone?.trim() || null;
    if (formData.birth_date !== undefined) updatePayload.birth_date = formData.birth_date || null;

    // Reconstruir platform_metadata se signup_method ou campos condicionais mudaram
    if (
      formData.signup_method !== undefined ||
      formData.email !== undefined ||
      formData.google_account_age_years !== undefined ||
      formData.google_ads_invested_brl !== undefined ||
      formData.google_ads_currency !== undefined
    ) {
      // Busca valores atuais para merge
      const current = await PlatformAccountsService.getById(organizationId, id);
      const merged: PlatformAccountFormData = {
        platform: 'tiktok',
        country: formData.country ?? (current?.country ?? 'BR'),
        name: formData.name ?? (current?.name ?? ''),
        holder_name: formData.holder_name ?? (current?.holder_name ?? ''),
        niche: formData.niche ?? (current?.niche ?? 'outro'),
        signup_method: formData.signup_method ?? (current?.signup_method ?? 'google'),
        email: formData.email ?? (current?.email ?? ''),
        google_account_age_years: formData.google_account_age_years,
        google_ads_invested_brl: formData.google_ads_invested_brl,
        google_ads_currency: formData.google_ads_currency,
      };
      updatePayload.platform_metadata = buildPlatformMetadata(merged) ?? null;
    }

    const { data, error } = await supabase
      .from('platform_accounts')
      .update(updatePayload)
      .eq('organization_id', organizationId)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    const updated = data as PlatformAccount;
    return {
      ...updated,
      email: updated.platform_metadata?.email ?? null,
    };
  }

  /**
   * Exclui uma conta de plataforma.
   * FK ON DELETE RESTRICT: falhará com erro 23503 se houver ad_accounts vinculadas.
   */
  static async delete(organizationId: string, id: string): Promise<void> {
    // Verificação preventiva (melhor UX que depender só do erro de FK)
    const { count, error: countError } = await supabase
      .from('ad_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('platform_account_id', id);

    if (countError) throw new Error(countError.message);
    if (count && count > 0) {
      throw new Error(
        `Não é possível excluir esta conta pois ${count} conta(s) de anúncios estão vinculadas a ela. Desvincule-as primeiro.`
      );
    }

    const { error } = await supabase
      .from('platform_accounts')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new Error(
          'Não é possível excluir esta conta pois existem contas de anúncios associadas a ela.'
        );
      }
      throw new Error(error.message);
    }
  }

  /**
   * Retorna os nomes e IDs das contas de anúncios vinculadas a este perfil.
   */
  static async getLinkedAdAccounts(
    organizationId: string,
    platformAccountId: string
  ): Promise<Array<{ id: string; name: string }>> {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select('id, name')
      .eq('organization_id', organizationId)
      .eq('platform_account_id', platformAccountId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Desvincula todas as contas de anúncios e exclui a conta de plataforma em sequência.
   */
  static async deleteAndUnlink(
    organizationId: string,
    platformAccountId: string
  ): Promise<{ unlinkedCount: number }> {
    const { data: updated, error: unlinkErr } = await supabase
      .from('ad_accounts')
      .update({ platform_account_id: null })
      .eq('organization_id', organizationId)
      .eq('platform_account_id', platformAccountId)
      .select('id');

    if (unlinkErr) throw new Error(unlinkErr.message);

    const { error: delErr } = await supabase
      .from('platform_accounts')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', platformAccountId);

    if (delErr) throw new Error(delErr.message);

    return { unlinkedCount: updated?.length || 0 };
  }

  /**
   * Faz upload da foto de perfil no bucket 'avatars' (padrão do projeto).
   * Path: platform-accounts/{organizationId}/{platformAccountId}/photo.{ext}
   */
  static async uploadProfilePhoto(
    organizationId: string,
    platformAccountId: string,
    file: File
  ): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `platform-accounts/${organizationId}/${platformAccountId}/photo.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (upErr) throw new Error(upErr.message);

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  }
}
