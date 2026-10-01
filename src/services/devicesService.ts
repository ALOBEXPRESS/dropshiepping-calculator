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

    // Busca contas associadas
    const { data: accounts } = await supabase
      .from('platform_accounts')
      .select('id, device_id')
      .eq('organization_id', organizationId)
      .not('device_id', 'is', null);

    const accountCountMap = new Map<string, number>();
    for (const acc of accounts ?? []) {
      if (acc.device_id) {
        accountCountMap.set(acc.device_id, (accountCountMap.get(acc.device_id) ?? 0) + 1);
      }
    }

    return devices.map((d) => ({
      ...d,
      proxy_label: d.proxy_id ? proxyMap.get(d.proxy_id) ?? null : null,
      account_count: accountCountMap.get(d.id) ?? 0,
    }));
  }

  /**
   * Cria um novo dispositivo.
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
    return data as Device;
  }

  /**
   * Atualiza um dispositivo existente.
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
    return data as Device;
  }

  /**
   * Exclui um dispositivo.
   */
  static async delete(organizationId: string, id: string): Promise<void> {
    // Verificação preventiva de contas vinculadas
    const { count, error: countError } = await supabase
      .from('platform_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('device_id', id);

    if (countError) throw new Error(countError.message);
    if (count && count > 0) {
      throw new Error(
        `Não é possível excluir este dispositivo pois ${count} conta(s) de plataforma está(ão) associada(s) a ele.`
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
