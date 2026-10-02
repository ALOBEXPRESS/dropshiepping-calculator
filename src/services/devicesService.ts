import { supabase } from '@/lib/supabase';
import type { Device, DeviceFormData, DeviceWithStats } from '@/types/devices';

export class DevicesService {
  /**
   * Lista todos os dispositivos da organização.
   */
  static async list(organizationId: string): Promise<Device[]> {
    if (!organizationId) return [];

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Device[];
  }

  /**
   * Lista dispositivos enriquecidos com proxy vinculado e contagem de contas associadas.
   */
  static async listWithStats(organizationId: string): Promise<DeviceWithStats[]> {
    if (!organizationId) return [];

    const devices = await this.list(organizationId);

    // Busca proxies para mapear label
    const { data: proxies } = await supabase
      .from('proxies')
      .select('id, label')
      .eq('organization_id', organizationId);

    const proxyMap = new Map<string, string>();
    for (const p of proxies ?? []) {
      proxyMap.set(p.id, p.label);
    }

    // Busca contas associadas via device_id direto e via junction table
    const [{ data: accountsDirect }, { data: junctionRows }] = await Promise.all([
      supabase
        .from('platform_accounts')
        .select('id, device_id')
        .eq('organization_id', organizationId)
        .not('device_id', 'is', null),
      supabase
        .from('platform_account_devices')
        .select('device_id, platform_account_id')
        .eq('organization_id', organizationId),
    ]);

    const deviceAccountsMap = new Map<string, Set<string>>();
    for (const acc of accountsDirect ?? []) {
      if (acc.device_id) {
        if (!deviceAccountsMap.has(acc.device_id)) {
          deviceAccountsMap.set(acc.device_id, new Set());
        }
        deviceAccountsMap.get(acc.device_id)!.add(acc.id);
      }
    }
    for (const row of junctionRows ?? []) {
      if (row.device_id) {
        if (!deviceAccountsMap.has(row.device_id)) {
          deviceAccountsMap.set(row.device_id, new Set());
        }
        deviceAccountsMap.get(row.device_id)!.add(row.platform_account_id);
      }
    }

    return devices.map((d) => ({
      ...d,
      proxy_label: d.proxy_id ? proxyMap.get(d.proxy_id) ?? null : null,
      account_count: deviceAccountsMap.get(d.id)?.size ?? 0,
    }));
  }

  /**
   * Obtém a lista de IDs de contas de plataforma vinculadas a um dispositivo.
   */
  static async getDeviceAccounts(
    organizationId: string,
    deviceId: string
  ): Promise<string[]> {
    if (!organizationId || !deviceId) return [];

    const [{ data: junctionRows }, { data: directAccounts }] = await Promise.all([
      supabase
        .from('platform_account_devices')
        .select('platform_account_id')
        .eq('organization_id', organizationId)
        .eq('device_id', deviceId),
      supabase
        .from('platform_accounts')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('device_id', deviceId),
    ]);

    const accountIdSet = new Set<string>();
    for (const r of junctionRows ?? []) {
      accountIdSet.add(r.platform_account_id);
    }
    for (const a of directAccounts ?? []) {
      accountIdSet.add(a.id);
    }
    return Array.from(accountIdSet);
  }

  /**
   * Cria um novo dispositivo e sincroniza eventuais contas vinculadas.
   */
  static async create(
    organizationId: string,
    formData: DeviceFormData,
    userId?: string | null
  ): Promise<Device> {
    const isCloudPhone = formData.device_type === 'cloud_phone';
    const isEmulator = formData.device_type === 'emulator';
    const isDouplus = isCloudPhone && formData.platform === 'douplus';

    const platform_metadata = isDouplus && formData.device_profile
      ? { device_profile: formData.device_profile }
      : null;

    const payload = {
      organization_id: organizationId,
      device_type: formData.device_type,
      platform: isCloudPhone || isEmulator ? formData.platform || null : null,
      platform_metadata,
      label: formData.label.trim(),
      notes: formData.notes?.trim() || null,
      proxy_id: formData.proxy_id || null,
      created_by: userId || null,
    };

    const { data, error } = await supabase
      .from('devices')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    const created = data as Device;

    // Sincronizar contas selecionadas
    if (formData.account_ids && formData.account_ids.length > 0) {
      const rows = formData.account_ids.map((accId) => ({
        organization_id: organizationId,
        platform_account_id: accId,
        device_id: created.id,
      }));
      await supabase.from('platform_account_devices').insert(rows);

      // Atualiza também device_id primário nas contas caso ainda não tenham
      for (const accId of formData.account_ids) {
        await supabase
          .from('platform_accounts')
          .update({ device_id: created.id, updated_at: new Date().toISOString() })
          .eq('organization_id', organizationId)
          .eq('id', accId)
          .is('device_id', null);
      }
    }

    return created;
  }

  /**
   * Atualiza um dispositivo existente e sincroniza eventuais contas vinculadas.
   */
  static async update(
    organizationId: string,
    id: string,
    formData: Partial<DeviceFormData>
  ): Promise<Device> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (formData.label !== undefined) payload.label = formData.label.trim();
    if (formData.notes !== undefined) payload.notes = formData.notes?.trim() || null;
    if (formData.proxy_id !== undefined) payload.proxy_id = formData.proxy_id || null;

    if (formData.device_type !== undefined) {
      payload.device_type = formData.device_type;
      const isCloudPhone = formData.device_type === 'cloud_phone';
      const isEmulator = formData.device_type === 'emulator';
      const isDouplus = isCloudPhone && formData.platform === 'douplus';

      payload.platform = isCloudPhone || isEmulator ? formData.platform || null : null;
      payload.platform_metadata = isDouplus && formData.device_profile
        ? { device_profile: formData.device_profile }
        : null;
    }

    const { data, error } = await supabase
      .from('devices')
      .update(payload)
      .eq('organization_id', organizationId)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Sincroniza tabela junction se account_ids foi fornecido
    if (formData.account_ids !== undefined) {
      // 1. Remove associações anteriores deste aparelho
      await supabase
        .from('platform_account_devices')
        .delete()
        .eq('organization_id', organizationId)
        .eq('device_id', id);

      // 2. Insere novas associações
      if (formData.account_ids.length > 0) {
        const rows = formData.account_ids.map((accId) => ({
          organization_id: organizationId,
          platform_account_id: accId,
          device_id: id,
        }));
        await supabase.from('platform_account_devices').insert(rows);

        // Atualiza device_id nas contas selecionadas
        for (const accId of formData.account_ids) {
          await supabase
            .from('platform_accounts')
            .update({ device_id: id, updated_at: new Date().toISOString() })
            .eq('organization_id', organizationId)
            .eq('id', accId);
        }
      }

      // 3. Limpa device_id de contas que foram desvinculadas deste aparelho
      const { data: oldDirect } = await supabase
        .from('platform_accounts')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('device_id', id);

      const keepSet = new Set(formData.account_ids);
      for (const oldAcc of oldDirect ?? []) {
        if (!keepSet.has(oldAcc.id)) {
          await supabase
            .from('platform_accounts')
            .update({ device_id: null, updated_at: new Date().toISOString() })
            .eq('organization_id', organizationId)
            .eq('id', oldAcc.id);
        }
      }
    }

    return data as Device;
  }

  /**
   * Exclui um dispositivo.
   */
  static async delete(organizationId: string, id: string): Promise<void> {
    // Verificação preventiva de contas vinculadas
    const accounts = await this.getDeviceAccounts(organizationId, id);
    if (accounts.length > 0) {
      throw new Error(
        `Não é possível excluir este dispositivo pois ${accounts.length} conta(s) de plataforma está(ão) associada(s) a ele.`
      );
    }

    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
