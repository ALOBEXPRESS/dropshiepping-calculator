import { supabase } from '@/lib/supabase';
import type {
  BusinessCenter,
  BusinessCenterWithStats,
  BusinessCenterFormData,
  BusinessCenterFilters,
  BusinessCenterAccountRelation,
  BusinessCenterAccountInput,
  RelationshipType,
  PermissionLevel,
  RelationshipStatus,
} from '@/types/businessCenters';

export class BusinessCentersService {
  /**
   * Lista todos os business centers da organização com contagem de ad_accounts e contas vinculadas.
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

    const centerIds = centers.map((c) => c.id);

    // Contar ad_accounts vinculadas a cada BC
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

    // Contar platform_accounts vinculadas (N:N)
    const { data: linkedAccs } = await supabase
      .from('business_center_platform_accounts')
      .select('id, business_center_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .in('business_center_id', centerIds);

    const linkedCountMap = new Map<string, number>();
    for (const link of linkedAccs ?? []) {
      if (!link.business_center_id) continue;
      linkedCountMap.set(
        link.business_center_id,
        (linkedCountMap.get(link.business_center_id) ?? 0) + 1
      );
    }

    // Buscar dispositivos vinculados aos BCs (N:N)
    const { data: centerDevices } = await supabase
      .from('business_center_devices')
      .select('business_center_id, device_id')
      .eq('organization_id', organizationId)
      .in('business_center_id', centerIds);

    const devicesMap = new Map<string, string[]>();
    for (const cd of centerDevices ?? []) {
      if (!cd.business_center_id) continue;
      const arr = devicesMap.get(cd.business_center_id) ?? [];
      arr.push(cd.device_id);
      devicesMap.set(cd.business_center_id, arr);
    }

    return (centers as BusinessCenter[]).map((bc) => {
      const dbDevices = devicesMap.get(bc.id);
      const resolvedDevices =
        dbDevices && dbDevices.length > 0
          ? dbDevices
          : bc.device_id
          ? [bc.device_id]
          : [];

      return {
        ...bc,
        device_ids: resolvedDevices,
        ad_account_count: countMap.get(bc.id) ?? 0,
        linked_account_count: linkedCountMap.get(bc.id) ?? 0,
      };
    });
  }

  /**
   * Obtém um business center por ID com contas e dispositivos vinculados.
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

    // Buscar contas vinculadas (N:N)
    const linkedAccounts = await BusinessCentersService.getLinkedAccounts(
      organizationId,
      id
    );

    // Buscar dispositivos vinculados (N:N)
    const deviceIds = await BusinessCentersService.getCenterDevices(
      organizationId,
      id
    );
    const resolvedDeviceIds =
      deviceIds.length > 0
        ? deviceIds
        : center.device_id
        ? [center.device_id]
        : [];

    return {
      ...(center as BusinessCenter),
      device_ids: resolvedDeviceIds,
      ad_account_count: count ?? 0,
      linked_account_count: linkedAccounts.length,
      linked_accounts: linkedAccounts,
    };
  }

  /**
   * Busca os IDs dos dispositivos vinculados a um Business Center (N:N).
   */
  static async getCenterDevices(
    organizationId: string,
    businessCenterId: string
  ): Promise<string[]> {
    if (!organizationId || !businessCenterId) return [];

    const { data, error } = await supabase
      .from('business_center_devices')
      .select('device_id')
      .eq('organization_id', organizationId)
      .eq('business_center_id', businessCenterId);

    if (error) {
      console.error('Erro ao buscar dispositivos vinculados ao BC:', error);
      return [];
    }

    return (data || []).map((row: { device_id: string }) => row.device_id);
  }

  /**
   * Busca contas de plataforma vinculadas a um Business Center (N:N).
   */
  static async getLinkedAccounts(
    organizationId: string,
    businessCenterId: string
  ): Promise<BusinessCenterAccountRelation[]> {
    if (!organizationId || !businessCenterId) return [];

    const { data, error } = await supabase
      .from('business_center_platform_accounts')
      .select(`
        id,
        organization_id,
        business_center_id,
        platform_account_id,
        relationship_type,
        permission_level,
        status,
        linked_at,
        external_relation_id,
        notes,
        created_at,
        updated_at,
        platform_accounts:platform_account_id (
          id,
          name,
          nickname,
          platform,
          meta_account_type,
          holder_name,
          profile_photo_url
        )
      `)
      .eq('organization_id', organizationId)
      .eq('business_center_id', businessCenterId)
      .order('linked_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar contas vinculadas ao BC:', error);
      return [];
    }
    return (data as unknown as BusinessCenterAccountRelation[]) || [];
  }

  /**
   * Busca Business Centers aos quais uma Conta de Plataforma está vinculada (N:N).
   */
  static async getLinkedBusinessCentersForAccount(
    organizationId: string,
    platformAccountId: string
  ): Promise<BusinessCenterAccountRelation[]> {
    if (!organizationId || !platformAccountId) return [];

    const { data, error } = await supabase
      .from('business_center_platform_accounts')
      .select(`
        id,
        organization_id,
        business_center_id,
        platform_account_id,
        relationship_type,
        permission_level,
        status,
        linked_at,
        external_relation_id,
        notes,
        created_at,
        updated_at,
        business_centers:business_center_id (
          id,
          name,
          bc_id,
          platform,
          business_type
        )
      `)
      .eq('organization_id', organizationId)
      .eq('platform_account_id', platformAccountId)
      .order('linked_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar Business Centers vinculados à conta:', error);
      return [];
    }
    return (data as unknown as BusinessCenterAccountRelation[]) || [];
  }

  /**
   * Vincula uma conta de plataforma a um Business Center com tipo de relação e nível de permissão.
   */
  static async linkAccount(
    organizationId: string,
    data: {
      business_center_id: string;
      platform_account_id: string;
      relationship_type: RelationshipType;
      permission_level?: PermissionLevel;
      status?: RelationshipStatus;
      notes?: string | null;
      external_relation_id?: string | null;
    }
  ): Promise<BusinessCenterAccountRelation> {
    if (!organizationId) throw new Error('Organização não identificada');

    // Se relationship_type for 'owner', verificar se já existe outro BC como owner
    if (data.relationship_type === 'owner') {
      const { data: existingOwner, error: checkError } = await supabase
        .from('business_center_platform_accounts')
        .select('id, business_center_id, business_centers(name, bc_id)')
        .eq('organization_id', organizationId)
        .eq('platform_account_id', data.platform_account_id)
        .eq('relationship_type', 'owner')
        .maybeSingle();

      if (checkError) console.warn('Erro ao checar proprietário existente:', checkError);
      if (existingOwner && existingOwner.business_center_id !== data.business_center_id) {
        const ownerBc = existingOwner.business_centers as unknown as {
          name?: string;
          bc_id?: string;
        };
        const bcName = ownerBc?.name || ownerBc?.bc_id || 'outro Business Center';
        throw new Error(
          `Esta conta já possui um proprietário registrado (${bcName}). De acordo com as regras da Meta e TikTok, um ativo só pode ter 1 Business Center proprietário. Vincule como "Acesso Compartilhado (Parceiro)" ou "Autorização para Anúncios".`
        );
      }
    }

    const payload = {
      organization_id: organizationId,
      business_center_id: data.business_center_id,
      platform_account_id: data.platform_account_id,
      relationship_type: data.relationship_type,
      permission_level: data.permission_level || 'standard',
      status: data.status || 'active',
      notes: data.notes?.trim() || null,
      external_relation_id: data.external_relation_id?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from('business_center_platform_accounts')
      .upsert(payload, { onConflict: 'business_center_id,platform_account_id' })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(
          'Esta conta já está vinculada a outro Business Center como proprietário ou o vínculo já existe.'
        );
      }
      throw new Error(error.message);
    }

    return result as BusinessCenterAccountRelation;
  }

  /**
   * Desvincula uma conta de plataforma de um Business Center.
   */
  static async unlinkAccount(
    organizationId: string,
    businessCenterId: string,
    platformAccountId: string
  ): Promise<void> {
    if (!organizationId || !businessCenterId || !platformAccountId) return;

    const { error } = await supabase
      .from('business_center_platform_accounts')
      .delete()
      .eq('organization_id', organizationId)
      .eq('business_center_id', businessCenterId)
      .eq('platform_account_id', platformAccountId);

    if (error) throw new Error(error.message);
  }

  /**
   * Atualiza os metadados de uma relação existente.
   */
  static async updateAccountRelation(
    organizationId: string,
    relationId: string,
    data: Partial<{
      relationship_type: RelationshipType;
      permission_level: PermissionLevel;
      status: RelationshipStatus;
      notes: string | null;
      external_relation_id: string | null;
    }>
  ): Promise<BusinessCenterAccountRelation> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (data.relationship_type !== undefined)
      updatePayload.relationship_type = data.relationship_type;
    if (data.permission_level !== undefined)
      updatePayload.permission_level = data.permission_level;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.notes !== undefined) updatePayload.notes = data.notes?.trim() || null;
    if (data.external_relation_id !== undefined)
      updatePayload.external_relation_id = data.external_relation_id?.trim() || null;

    const { data: updated, error } = await supabase
      .from('business_center_platform_accounts')
      .update(updatePayload)
      .eq('organization_id', organizationId)
      .eq('id', relationId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return updated as BusinessCenterAccountRelation;
  }

  /**
   * Sincroniza a lista completa de contas vinculadas a um Business Center.
   */
  static async syncLinkedAccounts(
    organizationId: string,
    businessCenterId: string,
    accounts: BusinessCenterAccountInput[]
  ): Promise<void> {
    if (!organizationId || !businessCenterId) return;

    // Buscar vínculos existentes
    const { data: currentLinks } = await supabase
      .from('business_center_platform_accounts')
      .select('id, platform_account_id')
      .eq('organization_id', organizationId)
      .eq('business_center_id', businessCenterId);

    const targetAccountIds = new Set(accounts.map((a) => a.platform_account_id));

    // Desvincular contas que não estão na lista alvo
    const toDeleteIds = (currentLinks ?? [])
      .filter((l) => !targetAccountIds.has(l.platform_account_id))
      .map((l) => l.id);

    if (toDeleteIds.length > 0) {
      await supabase
        .from('business_center_platform_accounts')
        .delete()
        .eq('organization_id', organizationId)
        .in('id', toDeleteIds);
    }

    // Vincular / atualizar contas na lista alvo
    for (const acc of accounts) {
      await BusinessCentersService.linkAccount(organizationId, {
        business_center_id: businessCenterId,
        platform_account_id: acc.platform_account_id,
        relationship_type: acc.relationship_type,
        permission_level: acc.permission_level || 'standard',
        status: acc.status || 'active',
        notes: acc.notes,
        external_relation_id: acc.external_relation_id,
      });
    }
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
    const finalBcId =
      data.bc_id && data.bc_id.trim() !== ''
        ? data.bc_id.trim()
        : `7${Date.now()}${Math.floor(10000 + Math.random() * 90000)}`;

    const initialDevices =
      data.device_ids !== undefined
        ? data.device_ids
        : data.device_id
        ? [data.device_id]
        : [];

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
      holder_name: data.holder_name?.trim() || null,
      holder_cpf: data.holder_cpf?.trim() || null,
      holder_rg: data.holder_rg?.trim() || null,
      holder_birth_date: data.holder_birth_date?.trim() || null,
      company_cnpj: data.company_cnpj?.trim() || null,
      company_state_registration: data.company_state_registration?.trim() || null,
      company_status: data.company_status || 'Ativa',
      meta_linked_network: data.platform === 'meta' ? data.meta_linked_network || null : null,
      meta_linked_account_id:
        data.platform === 'meta'
          ? data.meta_linked_account_id ||
            data.meta_instagram_account_id ||
            data.meta_facebook_account_id ||
            null
          : null,
      meta_instagram_account_id:
        data.platform === 'meta' ? data.meta_instagram_account_id || null : null,
      meta_facebook_account_id:
        data.platform === 'meta' ? data.meta_facebook_account_id || null : null,
      device_id: initialDevices[0] || null,
      proxy_id: data.proxy_id || null,
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

    const bc = created as BusinessCenter;

    // Salva dispositivos vinculados (N:N)
    if (initialDevices.length > 0) {
      const devRows = initialDevices.map((dId) => ({
        organization_id: organizationId,
        business_center_id: bc.id,
        device_id: dId,
      }));
      await supabase.from('business_center_devices').insert(devRows);
    }

    // Sincroniza contas N:N se informadas
    if (data.linked_accounts && data.linked_accounts.length > 0) {
      await BusinessCentersService.syncLinkedAccounts(
        organizationId,
        bc.id,
        data.linked_accounts
      );
    }

    return {
      ...bc,
      device_ids: initialDevices,
    };
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

    if (data.platform !== undefined) payload.platform = data.platform;
    if (data.business_type !== undefined) payload.business_type = data.business_type;
    if (data.company_legal_name !== undefined)
      payload.company_legal_name = data.company_legal_name?.trim() || null;
    if (data.country !== undefined) payload.country = data.country;
    if (data.timezone !== undefined) payload.timezone = data.timezone;
    if (data.currency !== undefined) payload.currency = data.currency;
    if (data.bc_id !== undefined && data.bc_id.trim() !== '')
      payload.bc_id = data.bc_id.trim();
    if (data.name !== undefined) payload.name = data.name?.trim() || null;
    if (data.notes !== undefined) payload.notes = data.notes?.trim() || null;
    if (data.holder_name !== undefined)
      payload.holder_name = data.holder_name?.trim() || null;
    if (data.holder_cpf !== undefined)
      payload.holder_cpf = data.holder_cpf?.trim() || null;
    if (data.holder_rg !== undefined) payload.holder_rg = data.holder_rg?.trim() || null;
    if (data.holder_birth_date !== undefined)
      payload.holder_birth_date = data.holder_birth_date?.trim() || null;
    if (data.company_cnpj !== undefined)
      payload.company_cnpj = data.company_cnpj?.trim() || null;
    if (data.company_state_registration !== undefined)
      payload.company_state_registration =
        data.company_state_registration?.trim() || null;
    if (data.company_status !== undefined)
      payload.company_status = data.company_status || 'Ativa';
    if (data.meta_linked_network !== undefined)
      payload.meta_linked_network = data.meta_linked_network || null;
    if (data.meta_linked_account_id !== undefined)
      payload.meta_linked_account_id = data.meta_linked_account_id || null;
    if (data.meta_instagram_account_id !== undefined)
      payload.meta_instagram_account_id = data.meta_instagram_account_id || null;
    if (data.meta_facebook_account_id !== undefined)
      payload.meta_facebook_account_id = data.meta_facebook_account_id || null;
    if (data.device_ids !== undefined) {
      payload.device_id = data.device_ids[0] || null;
    } else if (data.device_id !== undefined) {
      payload.device_id = data.device_id || null;
    }
    if (data.proxy_id !== undefined) payload.proxy_id = data.proxy_id || null;

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

    // Sincroniza dispositivos vinculados (N:N)
    let updatedDeviceIds: string[] | undefined = undefined;
    if (data.device_ids !== undefined) {
      await supabase
        .from('business_center_devices')
        .delete()
        .eq('organization_id', organizationId)
        .eq('business_center_id', id);

      if (data.device_ids.length > 0) {
        const devRows = data.device_ids.map((devId) => ({
          organization_id: organizationId,
          business_center_id: id,
          device_id: devId,
        }));
        await supabase.from('business_center_devices').insert(devRows);
      }
      updatedDeviceIds = data.device_ids;
    }

    // Sincroniza contas N:N se informadas
    if (data.linked_accounts !== undefined) {
      await BusinessCentersService.syncLinkedAccounts(
        organizationId,
        id,
        data.linked_accounts
      );
    }

    return {
      ...(updated as BusinessCenter),
      ...(updatedDeviceIds !== undefined ? { device_ids: updatedDeviceIds } : {}),
    };
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

