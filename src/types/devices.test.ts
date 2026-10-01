import { describe, it, expect } from 'vitest';
import { deviceSchema } from './devices';

describe('deviceSchema (Zod Validation)', () => {
  it('validates a valid Douplus Cloud Phone with device profile', () => {
    const validDouplus = {
      label: 'Douplus Profile #01',
      device_type: 'cloud_phone' as const,
      platform: 'douplus',
      device_profile: 'android_15_pro_sim_opt',
      notes: 'Aquecimento de contas TikTok',
    };

    const result = deviceSchema.safeParse(validDouplus);
    expect(result.success).toBe(true);
  });

  it('fails Douplus Cloud Phone when device_profile is missing', () => {
    const invalidDouplus = {
      label: 'Douplus Invalido',
      device_type: 'cloud_phone' as const,
      platform: 'douplus',
      device_profile: '',
    };

    const result = deviceSchema.safeParse(invalidDouplus);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('device_profile'))).toBe(true);
    }
  });

  it('validates a valid emulator (LDPlayer)', () => {
    const validEmulator = {
      label: 'LDPlayer Instancia 01',
      device_type: 'emulator' as const,
      platform: 'ldplayer',
    };

    const result = deviceSchema.safeParse(validEmulator);
    expect(result.success).toBe(true);
  });

  it('fails emulator with invalid platform', () => {
    const invalidEmulator = {
      label: 'Emulador Desconhecido',
      device_type: 'emulator' as const,
      platform: 'unknown_emulator',
    };

    const result = deviceSchema.safeParse(invalidEmulator);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('platform'))).toBe(true);
    }
  });

  it('validates a physical PC Windows with null platform', () => {
    const validPc = {
      label: 'PC Operacao Principal',
      device_type: 'pc_windows' as const,
      platform: null,
    };

    const result = deviceSchema.safeParse(validPc);
    expect(result.success).toBe(true);
  });

  it('fails PC Windows when platform is filled', () => {
    const invalidPc = {
      label: 'PC Invalido',
      device_type: 'pc_windows' as const,
      platform: 'douplus',
    };

    const result = deviceSchema.safeParse(invalidPc);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('platform'))).toBe(true);
    }
  });

  it('validates physical mobile with null platform', () => {
    const validMobile = {
      label: 'iPhone 15 Operacional',
      device_type: 'mobile' as const,
      platform: null,
    };

    const result = deviceSchema.safeParse(validMobile);
    expect(result.success).toBe(true);
  });
});
