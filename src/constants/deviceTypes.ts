/**
 * FONTE ÚNICA DE VERDADE para dispositivos, emuladores e cloud phones.
 * Mapeia os CHECK constraints do banco de dados e perfis suportados.
 */

export const DEVICE_TYPES = [
  {
    value: 'cloud_phone',
    label: 'Cloud Phone (Celular em Nuvem)',
    description: 'Instância Android rodando em nuvem 24/7 com IP limpo e perfil de hardware isolado.',
  },
  {
    value: 'emulator',
    label: 'Emulador Android (PC)',
    description: 'Instância local virtualizada (MuMu, LDPlayer, etc.) executada no computador.',
  },
  {
    value: 'pc_windows',
    label: 'PC Físico (Windows)',
    description: 'Computador físico da operação para gerenciamento de contingência e perfis.',
  },
  {
    value: 'mobile',
    label: 'Celular Físico (Mobile)',
    description: 'Dispositivo móvel real (iPhone ou Android) dedicado à operação.',
  },
] as const;

export type DeviceTypeValue = (typeof DEVICE_TYPES)[number]['value'];
export const DEVICE_TYPE_VALUES = DEVICE_TYPES.map((d) => d.value) as [
  DeviceTypeValue,
  ...DeviceTypeValue[]
];

export const CLOUD_PHONE_PLATFORMS = [
  { value: 'douplus', label: 'Douplus' },
  { value: 'redfinger', label: 'Redfinger' },
  { value: 'vmscloud', label: 'VMSCloud' },
  { value: 'ldcloud', label: 'LDCloud' },
  { value: 'geelark', label: 'GeeLark' },
] as const;

export type CloudPhonePlatform = (typeof CLOUD_PHONE_PLATFORMS)[number]['value'];
export const CLOUD_PHONE_PLATFORM_VALUES = CLOUD_PHONE_PLATFORMS.map((p) => p.value) as [
  CloudPhonePlatform,
  ...CloudPhonePlatform[]
];

export const EMULATOR_PLATFORMS = [
  { value: 'mumu_player', label: 'MuMu Player' },
  { value: 'ldplayer', label: 'LDPlayer' },
  { value: 'bluestacks', label: 'BlueStacks' },
  { value: 'noxplayer', label: 'NoxPlayer' },
] as const;

export type EmulatorPlatform = (typeof EMULATOR_PLATFORMS)[number]['value'];
export const EMULATOR_PLATFORM_VALUES = EMULATOR_PLATFORMS.map((p) => p.value) as [
  EmulatorPlatform,
  ...EmulatorPlatform[]
];

export type DevicePlatform = CloudPhonePlatform | EmulatorPlatform;
export const ALL_DEVICE_PLATFORMS = [
  ...CLOUD_PHONE_PLATFORMS,
  ...EMULATOR_PLATFORMS,
] as const;

/** Perfis de dispositivo específicos do Douplus */
export const DOUPLUS_DEVICE_PROFILES = [
  {
    value: 'android_15_pro_sim_opt',
    label: 'Android 15 (Pro)',
    badge: 'Simulation Optimization',
    description: 'Ambiente com otimização de simulação para evitar detecção de emulador.',
  },
  {
    value: 'android_15_sms_adb',
    label: 'Android 15',
    badge: 'SMS / ADB Support',
    description: 'Android 15 nativo com recepção de SMS e comandos ADB liberados.',
  },
  {
    value: 'android_12_region_a_sms_adb',
    label: 'Android 12 (Region A)',
    badge: 'SMS / ADB Support',
    description: 'Cluster Região A com suporte a SMS internacional e ponte ADB.',
  },
  {
    value: 'android_12_region_b_adb',
    label: 'Android 12 (Region B)',
    badge: 'ADB Support',
    description: 'Cluster Região B otimizado para comandos em lote via ADB.',
  },
  {
    value: 'android_11_adb',
    label: 'Android 11',
    badge: 'ADB Support',
    description: 'Android 11 estável com suporte completo a automações ADB.',
  },
  {
    value: 'android_10_adb',
    label: 'Android 10',
    badge: 'ADB Support',
    description: 'Android 10 legado para compatibilidade com aplicativos mais antigos.',
  },
] as const;

export type DouplusDeviceProfile = (typeof DOUPLUS_DEVICE_PROFILES)[number]['value'];
export const DOUPLUS_DEVICE_PROFILE_VALUES = DOUPLUS_DEVICE_PROFILES.map((p) => p.value) as [
  DouplusDeviceProfile,
  ...DouplusDeviceProfile[]
];

export const DEVICE_TYPE_LABELS: Record<DeviceTypeValue, string> = Object.fromEntries(
  DEVICE_TYPES.map((d) => [d.value, d.label])
) as Record<DeviceTypeValue, string>;

export const DEVICE_PLATFORM_LABELS: Record<string, string> = Object.fromEntries(
  ALL_DEVICE_PLATFORMS.map((p) => [p.value, p.label])
);

export const DOUPLUS_PROFILE_LABELS: Record<DouplusDeviceProfile, string> = Object.fromEntries(
  DOUPLUS_DEVICE_PROFILES.map((p) => [p.value, `${p.label} - ${p.badge}`])
) as Record<DouplusDeviceProfile, string>;
