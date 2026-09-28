/**
 * FONTE ÚNICA DE VERDADE para o enum de nichos.
 * Os valores devem ser idênticos (char a char) ao CHECK constraint em platform_accounts.niche.
 * Importar daqui em: schemas Zod, dropdowns, filtros.
 */

export const NICHES = [
  { value: 'moda_acessorios', label: 'Moda & Acessórios' },
  { value: 'beleza_cuidados_pessoais', label: 'Beleza & Cuidados Pessoais' },
  { value: 'eletronicos_tecnologia', label: 'Eletrônicos & Tecnologia' },
  { value: 'casa_decoracao', label: 'Casa & Decoração' },
  { value: 'saude_bem_estar', label: 'Saúde & Bem-estar' },
  { value: 'esportes_fitness', label: 'Esportes & Fitness' },
  { value: 'pet', label: 'Pet' },
  { value: 'brinquedos_infantil', label: 'Brinquedos & Infantil' },
  { value: 'alimentos_bebidas', label: 'Alimentos & Bebidas' },
  { value: 'automotivo', label: 'Automotivo' },
  { value: 'papelaria_escritorio', label: 'Papelaria & Escritório' },
  { value: 'games_entretenimento', label: 'Games & Entretenimento' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'educacao', label: 'Educação' },
  { value: 'financas_negocios', label: 'Finanças & Negócios' },
  { value: 'viagens_turismo', label: 'Viagens & Turismo' },
  { value: 'multiplos_nichos', label: 'Múltiplos Nichos' },
  { value: 'outro', label: 'Outro' },
] as const;

export type NicheValue = (typeof NICHES)[number]['value'];

/** Array de valores para z.enum — use NICHE_VALUES[0], NICHE_VALUES para construir o enum. */
export const NICHE_VALUES = NICHES.map((n) => n.value) as [NicheValue, ...NicheValue[]];

/** Países disponíveis para seleção (armazenados como ISO 3166-1 alpha-2). */
export const PLATFORM_COUNTRIES = [
  { code: 'BR', name: 'Brasil' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'FR', name: 'França' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'ES', name: 'Espanha' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'PT', name: 'Portugal' },
] as const;

export type PlatformCountryCode = (typeof PLATFORM_COUNTRIES)[number]['code'];
