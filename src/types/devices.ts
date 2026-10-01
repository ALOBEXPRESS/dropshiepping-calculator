import { z } from 'zod';
import {
  DEVICE_TYPE_VALUES,
  CLOUD_PHONE_PLATFORM_VALUES,
  EMULATOR_PLATFORM_VALUES,
  DOUPLUS_DEVICE_PROFILE_VALUES,
  type DeviceTypeValue,
  type CloudPhonePlatform,
  type EmulatorPlatform,
  type DouplusDeviceProfile,
} from '@/constants/deviceTypes';

// ── Tipos Base ───────────────────────────────────────────────────────────────

export type DevicePlatform = CloudPhonePlatform | EmulatorPlatform;

export interface DouplusPlatformMetadata {
  device_profile: DouplusDeviceProfile;
}

export type DevicePlatformMetadata = DouplusPlatformMetadata | Record<string, unknown>;

// ── Interface Principal (Espelho do Banco) ───────────────────────────────────

export interface Device {
  id: string;
  organization_id: string;
  device_type: DeviceTypeValue;
  platform: DevicePlatform | null;
  platform_metadata: DevicePlatformMetadata | null;
  label: string;
  notes: string | null;
  proxy_id?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Dispositivo enriquecido com contagem de contas e proxy vinculado */
export interface DeviceWithStats extends Device {
  account_count?: number;
  proxy_label?: string | null;
}

// ── Schemas Zod ─────────────────────────────────────────────────────────────

export const douplusMetadataSchema = z.object({
  device_profile: z.enum(DOUPLUS_DEVICE_PROFILE_VALUES, {
    message: 'Selecione um perfil de dispositivo Douplus válido',
  }),
});

export const deviceSchema = z
  .object({
    label: z.string().trim().min(2, 'O identificador do dispositivo deve ter no mínimo 2 caracteres'),
    device_type: z.enum(DEVICE_TYPE_VALUES, {
      message: 'Selecione um tipo de dispositivo válido',
    }),
    platform: z.string().trim().nullable().optional().or(z.literal('')),
    proxy_id: z.string().uuid('ID de proxy inválido').nullable().optional().or(z.literal('')),
    notes: z.string().trim().max(500, 'Notas devem ter no máximo 500 caracteres').optional().or(z.literal('')),
    device_profile: z.string().trim().nullable().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    // 1. Emulador exige plataforma específica
    if (data.device_type === 'emulator') {
      if (!data.platform || !(EMULATOR_PLATFORM_VALUES as readonly string[]).includes(data.platform)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['platform'],
          message: 'Selecione um emulador válido (MuMu Player, LDPlayer, BlueStacks, NoxPlayer)',
        });
      }
    }

    // 2. Cloud Phone exige plataforma específica
    if (data.device_type === 'cloud_phone') {
      if (!data.platform || !(CLOUD_PHONE_PLATFORM_VALUES as readonly string[]).includes(data.platform)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['platform'],
          message: 'Selecione uma plataforma de Cloud Phone (Douplus, Redfinger, VMSCloud, LDCloud, GeeLark)',
        });
      }

      // Se for Douplus, exige device_profile fechado
      if (data.platform === 'douplus') {
        if (!data.device_profile || !(DOUPLUS_DEVICE_PROFILE_VALUES as readonly string[]).includes(data.device_profile)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['device_profile'],
            message: 'O perfil de dispositivo do Douplus é obrigatório',
          });
        }
      }
    }

    // 3. PC Windows e Celular Físico não possuem plataforma externa de catálogo
    if (data.device_type === 'pc_windows' || data.device_type === 'mobile') {
      if (data.platform && data.platform.trim() !== '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['platform'],
          message: 'Dispositivos físicos não devem ter plataforma de catálogo associada',
        });
      }
    }
  });

export type DeviceFormData = z.infer<typeof deviceSchema>;
