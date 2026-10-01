/**
 * FONTE ÚNICA DE VERDADE para os tipos e versões de proxy.
 * Os valores devem ser idênticos (char a char) aos CHECK constraints no banco de dados.
 * Importar daqui em: schemas Zod, dropdowns, seletores de formulário e filtros.
 */

export const PROXY_TYPES = [
  {
    value: 'static_residential_isp',
    label: 'Residencial Estático (ISP)',
    description: 'IP residencial dedicado fixo de provedor de internet. Ideal para contas sensíveis e anti-detect.',
    supportsIpv6: true,
  },
  {
    value: 'static_datacenter',
    label: 'Datacenter Estático',
    description: 'IP fixo de alta velocidade em data centers. Custo-benefício para automações gerais.',
    supportsIpv6: true,
  },
  {
    value: 'static_mobile',
    label: 'Móvel Estático (Mobile)',
    description: 'IP móvel dedicado 4G/5G com operador celular real. Alta confiança para perfis mobile.',
    supportsIpv6: false,
  },
  {
    value: 'rotating_mobile',
    label: 'Móvel Rotativo (Rotating Mobile)',
    description: 'IPs móveis 4G/5G rotativos em cada requisição ou intervalo. Ideal para scraping e aquecimento.',
    supportsIpv6: false,
  },
  {
    value: 'rotating_residential',
    label: 'Residencial Rotativo (Rotating Residential)',
    description: 'Pool global de IPs residenciais rotativos. Alta rotatividade de IPs reais.',
    supportsIpv6: false,
  },
] as const;

export type ProxyTypeValue = (typeof PROXY_TYPES)[number]['value'];

/** Array de valores para z.enum */
export const PROXY_TYPE_VALUES = PROXY_TYPES.map((t) => t.value) as [
  ProxyTypeValue,
  ...ProxyTypeValue[]
];

export const IP_VERSIONS = [
  { value: 'ipv4', label: 'IPv4' },
  { value: 'ipv6', label: 'IPv6' },
] as const;

export type IpVersionValue = (typeof IP_VERSIONS)[number]['value'];

/** Array de valores de versão IP para z.enum */
export const IP_VERSION_VALUES = IP_VERSIONS.map((v) => v.value) as [
  IpVersionValue,
  ...IpVersionValue[]
];

/** Labels para exibição rápida */
export const PROXY_TYPE_LABELS: Record<ProxyTypeValue, string> = Object.fromEntries(
  PROXY_TYPES.map((t) => [t.value, t.label])
) as Record<ProxyTypeValue, string>;

export const IP_VERSION_LABELS: Record<IpVersionValue, string> = {
  ipv4: 'IPv4',
  ipv6: 'IPv6',
};

/** Verifica se um tipo de proxy aceita variante IPv6 conforme a tabela de mercado */
export function isIpv6SupportedForProxyType(type: ProxyTypeValue): boolean {
  const found = PROXY_TYPES.find((t) => t.value === type);
  return found?.supportsIpv6 ?? false;
}
