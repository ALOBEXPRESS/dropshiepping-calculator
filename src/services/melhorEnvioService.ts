/**
 * Serviço de integração com API Melhor Envio
 * 
 * Este serviço é responsável por calcular custos de frete através da API do Melhor Envio.
 * Utilizado para produtos do Mercado Livre com preço >= R$ 79,00 que possuem frete grátis obrigatório.
 * 
 * @see https://docs.melhorenvio.com.br/reference/shipment-calculate
 */

/**
 * Interface para dimensões do produto
 */
export interface ProductDimensions {
  /** Peso em kg */
  weight: number;
  /** Altura em cm */
  height: number;
  /** Largura em cm */
  width: number;
  /** Comprimento em cm */
  length: number;
}

/**
 * Interface para endereço do fornecedor
 */
export interface SupplierAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
}

/**
 * Interface para opção de envio retornada pela API
 */
export interface ShippingOption {
  /** Nome da modalidade (ex: "Correios PAC", "SEDEX") */
  name: string;
  /** Preço do frete em reais */
  price: number;
  /** Prazo de entrega em dias úteis */
  deliveryTime: number;
  /** ID da empresa transportadora */
  company?: {
    id: number;
    name: string;
    picture: string;
  };
}

/**
 * Interface para região de frete
 */
export interface ShippingRegion {
  /** Nome da região (ex: "Mais Distante", "Equilíbrio", "Curta Distância") */
  name: string;
  /** CEP representativo da região */
  postalCode: string;
}

/**
 * Erro customizado para problemas com a API Melhor Envio
 */
export class MelhorEnvioError extends Error {
  statusCode?: number;
  originalError?: unknown;

  constructor(
    message: string,
    statusCode?: number,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'MelhorEnvioError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Obtém o token da API Melhor Envio das variáveis de ambiente
 * 
 * @returns Token de autenticação
 * @throws {MelhorEnvioError} Se o token não estiver configurado
 */
// Função removida - agora usamos proxy via Supabase Edge Function
// function getApiToken(): string {
//   const token = import.meta.env.VITE_MELHOR_ENVIO_TOKEN;
//   
//   if (!token) {
//     throw new MelhorEnvioError(
//       'Token da API Melhor Envio não configurado. Verifique a variável de ambiente VITE_MELHOR_ENVIO_TOKEN.'
//     );
//   }
//   
//   return token;
// }

/**
 * Calcula o custo de frete entre dois CEPs usando a API Melhor Envio
 * 
 * @param fromPostalCode - CEP de origem (fornecedor) - formato: "04427000" ou "04427-000"
 * @param toPostalCode - CEP de destino - formato: "40010000" ou "40010-000"
 * @param dimensions - Dimensões do produto (peso em kg, altura/largura/comprimento em cm)
 * @returns Promise com array de opções de envio disponíveis
 * @throws {MelhorEnvioError} Em caso de erro na requisição ou resposta inválida
 * 
 * @example
 * ```typescript
 * const options = await calculateShipping(
 *   "04427000",
 *   "40010000",
 *   { weight: 0.5, height: 5, width: 15, length: 20 }
 * );
 * 
 * console.log(options);
 * // [
 * //   { name: "Correios PAC", price: 18.90, deliveryTime: 5 },
 * //   { name: "SEDEX", price: 32.50, deliveryTime: 2 }
 * // ]
 * ```
 */
export async function calculateShipping(
  fromPostalCode: string,
  toPostalCode: string,
  dimensions: ProductDimensions
): Promise<ShippingOption[]> {
  try {
    console.log('[Melhor Envio] Iniciando cálculo de frete:', {
      from: fromPostalCode,
      to: toPostalCode,
      dimensions
    });

    // Validar dimensões
    if (dimensions.weight <= 0 || dimensions.height <= 0 || dimensions.width <= 0 || dimensions.length <= 0) {
      throw new MelhorEnvioError('Dimensões do produto inválidas. Todos os valores devem ser maiores que zero.');
    }

    // Remover formatação dos CEPs (hífen)
    const cleanFromPostalCode = fromPostalCode.replace(/\D/g, '');
    const cleanToPostalCode = toPostalCode.replace(/\D/g, '');

    console.log('[Melhor Envio] CEPs limpos:', {
      from: cleanFromPostalCode,
      to: cleanToPostalCode
    });

    // Validar formato dos CEPs
    if (cleanFromPostalCode.length !== 8 || cleanToPostalCode.length !== 8) {
      throw new MelhorEnvioError('CEP inválido. Verifique a localização do fornecedor e destino.');
    }

    // Usar proxy do Supabase Edge Function para evitar CORS
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const endpoint = `${supabaseUrl}/functions/v1/melhor-envio-proxy`;

    const requestBody = {
      from: {
        postal_code: cleanFromPostalCode
      },
      to: {
        postal_code: cleanToPostalCode
      },
      products: [
        {
          id: '1',
          width: dimensions.width,
          height: dimensions.height,
          length: dimensions.length,
          weight: dimensions.weight,
          quantity: 1,
          insurance_value: 0
        }
      ]
    };

    console.log('[Melhor Envio] Request body:', JSON.stringify(requestBody, null, 2));
    console.log('[Melhor Envio] Endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[Melhor Envio] Response status:', response.status);

    // Tratar erros HTTP
    if (!response.ok) {
      const responseText = await response.text();
      console.error('[Melhor Envio] Error response:', responseText);

      let errorData: Record<string, string> = {};
      try {
        errorData = JSON.parse(responseText);
      } catch (_e) {
        // Ignore parse error
      }

      if (response.status === 401) {
        throw new MelhorEnvioError(
          'Erro ao calcular frete. Token de autenticação inválido ou expirado.',
          401
        );
      }

      if (response.status === 400) {
        const errorMessage = errorData.message || errorData.error || responseText || 'Dados inválidos na requisição';
        throw new MelhorEnvioError(
          `Erro ao calcular frete: ${errorMessage}`,
          400
        );
      }

      if (response.status === 422) {
        throw new MelhorEnvioError(
          `CEP inválido ou não encontrado: ${JSON.stringify(errorData)}`,
          422
        );
      }

      throw new MelhorEnvioError(
        `Erro ao calcular frete. Status: ${response.status} - ${responseText}`,
        response.status
      );
    }

    const data = await response.json();
    console.log('[Melhor Envio] Response data:', data);

    // Validar resposta
    if (!Array.isArray(data)) {
      throw new MelhorEnvioError('Resposta inválida da API Melhor Envio.');
    }

    // Mapear resposta para o formato esperado
    const shippingOptions: ShippingOption[] = data
      .filter((item: { error?: unknown }) => item.error === undefined || item.error === null)
      .map((item: { name?: string; price?: string; delivery_time?: string; company?: { id: number; name: string; picture: string } }) => ({
        name: item.name || 'Serviço desconhecido',
        price: parseFloat(item.price ?? '0') || 0,
        deliveryTime: parseInt(item.delivery_time ?? '0') || 0,
        company: item.company ? {
          id: item.company.id,
          name: item.company.name,
          picture: item.company.picture
        } : undefined
      }));

    console.log('[Melhor Envio] Shipping options:', shippingOptions);

    // Se não houver opções disponíveis, retornar erro
    if (shippingOptions.length === 0) {
      throw new MelhorEnvioError(
        'Nenhuma opção de frete disponível para esta rota. Verifique os CEPs e dimensões do produto.'
      );
    }

    return shippingOptions;

  } catch (error) {
    console.error('[Melhor Envio] Erro capturado:', error);
    
    // Se já é um MelhorEnvioError, apenas repassa
    if (error instanceof MelhorEnvioError) {
      throw error;
    }

    // Tratar erros de rede
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new MelhorEnvioError(
        'Erro ao conectar com o serviço de frete. Verifique sua conexão e tente novamente.',
        undefined,
        error
      );
    }

    // Erro genérico
    throw new MelhorEnvioError(
      'Erro inesperado ao calcular frete. Tente novamente.',
      undefined,
      error
    );
  }
}

/**
 * Formata o preço do frete para exibição
 * 
 * @param price - Preço em reais
 * @returns String formatada (ex: "R$ 18,90")
 */
export function formatShippingPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}

/**
 * Formata o prazo de entrega para exibição
 * 
 * @param days - Número de dias úteis
 * @returns String formatada (ex: "5 dias úteis")
 */
export function formatDeliveryTime(days: number): string {
  return days === 1 ? '1 dia útil' : `${days} dias úteis`;
}
