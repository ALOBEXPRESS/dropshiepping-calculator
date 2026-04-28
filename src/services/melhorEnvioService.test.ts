/**
 * Testes unitários para o serviço de integração com API Melhor Envio
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateShipping,
  formatShippingPrice,
  formatDeliveryTime,
  MelhorEnvioError,
  type ProductDimensions
} from './melhorEnvioService';

// Mock do fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock das variáveis de ambiente
const originalEnv = import.meta.env;

describe('melhorEnvioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Configurar token mock
    import.meta.env.VITE_MELHOR_ENVIO_TOKEN = 'mock-token-123';
  });

  afterEach(() => {
    // Restaurar variáveis de ambiente
    Object.assign(import.meta.env, originalEnv);
  });

  describe('calculateShipping', () => {
    const validDimensions: ProductDimensions = {
      weight: 0.5,
      height: 5,
      width: 15,
      length: 20
    };

    it('deve calcular frete com sucesso para CEPs válidos', async () => {
      const mockResponse = [
        {
          name: 'Correios PAC',
          price: '18.90',
          delivery_time: '5',
          company: {
            id: 1,
            name: 'Correios',
            picture: 'correios.png'
          }
        },
        {
          name: 'SEDEX',
          price: '32.50',
          delivery_time: '2',
          company: {
            id: 1,
            name: 'Correios',
            picture: 'correios.png'
          }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await calculateShipping('04427000', '40010000', validDimensions);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'Correios PAC',
        price: 18.90,
        deliveryTime: 5,
        company: {
          id: 1,
          name: 'Correios',
          picture: 'correios.png'
        }
      });
      expect(result[1]).toEqual({
        name: 'SEDEX',
        price: 32.50,
        deliveryTime: 2,
        company: {
          id: 1,
          name: 'Correios',
          picture: 'correios.png'
        }
      });
    });

    it('deve remover formatação dos CEPs (hífen)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            name: 'PAC',
            price: '18.90',
            delivery_time: '5'
          }
        ]
      });

      await calculateShipping('04427-000', '40010-000', validDimensions);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.from.postal_code).toBe('04427000');
      expect(requestBody.to.postal_code).toBe('40010000');
    });

    it('deve enviar headers corretos na requisição', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            name: 'PAC',
            price: '18.90',
            delivery_time: '5'
          }
        ]
      });

      await calculateShipping('04427000', '40010000', validDimensions);

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers;

      expect(headers['Authorization']).toBe('Bearer mock-token-123');
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['Accept']).toBe('application/json');
    });

    it('deve enviar body correto na requisição', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            name: 'PAC',
            price: '18.90',
            delivery_time: '5'
          }
        ]
      });

      await calculateShipping('04427000', '40010000', validDimensions);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody).toEqual({
        from: {
          postal_code: '04427000'
        },
        to: {
          postal_code: '40010000'
        },
        products: [
          {
            id: '1',
            width: 15,
            height: 5,
            length: 20,
            weight: 0.5,
            quantity: 1,
            insurance_value: 0
          }
        ]
      });
    });

    it('deve lançar erro se token não estiver configurado', async () => {
      import.meta.env.VITE_MELHOR_ENVIO_TOKEN = '';

      await expect(
        calculateShipping('04427000', '40010000', validDimensions)
      ).rejects.toThrow(MelhorEnvioError);

      await expect(
        calculateShipping('04427000', '40010000', validDimensions)
      ).rejects.toThrow('Token da API Melhor Envio não configurado');
    });

    it('deve lançar erro para dimensões inválidas (peso zero)', async () => {
      const invalidDimensions = { ...validDimensions, weight: 0 };

      await expect(
        calculateShipping('04427000', '40010000', invalidDimensions)
      ).rejects.toThrow(MelhorEnvioError);

      await expect(
        calculateShipping('04427000', '40010000', invalidDimensions)
      ).rejects.toThrow('Dimensões do produto inválidas');
    });

    it('deve lançar erro para dimensões inválidas (altura negativa)', async () => {
      const invalidDimensions = { ...validDimensions, height: -5 };

      await expect(
        calculateShipping('04427000', '40010000', invalidDimensions)
      ).rejects.toThrow(MelhorEnvioError);

      await expect(
        calculateShipping('04427000', '40010000', invalidDimensions)
      ).rejects.toThrow('Dimensões do produto inválidas');
    });

    it('deve lançar erro para CEP inválido (menos de 8 dígitos)', async () => {
      await expect(
        calculateShipping('0442700', '40010000', validDimensions)
      ).rejects.toThrow(MelhorEnvioError);

      await expect(
        calculateShipping('0442700', '40010000', validDimensions)
      ).rejects.toThrow('CEP inválido');
    });

    it('deve lançar erro para CEP inválido (mais de 8 dígitos)', async () => {
      await expect(
        calculateShipping('044270000', '40010000', validDimensions)
      ).rejects.toThrow(MelhorEnvioError);

      await expect(
        calculateShipping('044270000', '40010000', validDimensions)
      ).rejects.toThrow('CEP inválido');
    });

    it('deve lançar erro para token inválido (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' })
      });

      try {
        await calculateShipping('04427000', '40010000', validDimensions);
        expect.fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(MelhorEnvioError);
        expect((error as MelhorEnvioError).message).toContain('Token de autenticação inválido');
      }
    });

    it('deve lançar erro para dados inválidos (400)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid data' })
      });

      try {
        await calculateShipping('04427000', '40010000', validDimensions);
        expect.fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(MelhorEnvioError);
        expect((error as MelhorEnvioError).message).toContain('Invalid data');
      }
    });

    it('deve lançar erro para CEP não encontrado (422)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ message: 'CEP not found' })
      });

      try {
        await calculateShipping('04427000', '99999999', validDimensions);
        expect.fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(MelhorEnvioError);
        expect((error as MelhorEnvioError).message).toContain('CEP inválido ou não encontrado');
      }
    });

    it('deve lançar erro para erro de rede', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      try {
        await calculateShipping('04427000', '40010000', validDimensions);
        expect.fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(MelhorEnvioError);
        expect((error as MelhorEnvioError).message).toContain('Erro ao conectar com o serviço de frete');
      }
    });

    it('deve lançar erro se resposta não for um array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ error: 'Invalid response' })
      });

      try {
        await calculateShipping('04427000', '40010000', validDimensions);
        expect.fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(MelhorEnvioError);
        expect((error as MelhorEnvioError).message).toContain('Resposta inválida da API Melhor Envio');
      }
    });

    it('deve lançar erro se não houver opções disponíveis', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => []
      });

      try {
        await calculateShipping('04427000', '40010000', validDimensions);
        expect.fail('Deveria ter lançado erro');
      } catch (error) {
        expect(error).toBeInstanceOf(MelhorEnvioError);
        expect((error as MelhorEnvioError).message).toContain('Nenhuma opção de frete disponível');
      }
    });

    it('deve filtrar opções com erro', async () => {
      const mockResponse = [
        {
          name: 'PAC',
          price: '18.90',
          delivery_time: '5'
        },
        {
          error: 'Service unavailable'
        },
        {
          name: 'SEDEX',
          price: '32.50',
          delivery_time: '2'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await calculateShipping('04427000', '40010000', validDimensions);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('PAC');
      expect(result[1].name).toBe('SEDEX');
    });

    it('deve lidar com valores ausentes na resposta', async () => {
      const mockResponse = [
        {
          price: '18.90',
          delivery_time: '5'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await calculateShipping('04427000', '40010000', validDimensions);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Serviço desconhecido');
      expect(result[0].price).toBe(18.90);
      expect(result[0].deliveryTime).toBe(5);
    });
  });

  describe('formatShippingPrice', () => {
    it('deve formatar preço corretamente', () => {
      const result1 = formatShippingPrice(18.90);
      const result2 = formatShippingPrice(32.50);
      const result3 = formatShippingPrice(100);
      const result4 = formatShippingPrice(0);
      
      expect(result1).toContain('18,90');
      expect(result2).toContain('32,50');
      expect(result3).toContain('100,00');
      expect(result4).toContain('0,00');
    });

    it('deve formatar preço com muitas casas decimais', () => {
      const result1 = formatShippingPrice(18.9999);
      const result2 = formatShippingPrice(18.1234);
      
      expect(result1).toContain('19,00');
      expect(result2).toContain('18,12');
    });
  });

  describe('formatDeliveryTime', () => {
    it('deve formatar prazo no singular', () => {
      expect(formatDeliveryTime(1)).toBe('1 dia útil');
    });

    it('deve formatar prazo no plural', () => {
      expect(formatDeliveryTime(2)).toBe('2 dias úteis');
      expect(formatDeliveryTime(5)).toBe('5 dias úteis');
      expect(formatDeliveryTime(10)).toBe('10 dias úteis');
    });

    it('deve formatar prazo zero', () => {
      expect(formatDeliveryTime(0)).toBe('0 dias úteis');
    });
  });
});
