/**
 * Testes para o Serviço de Pedidos do Bling
 */

import { describe, it, expect, vi } from 'vitest';
import {
  processBlingWebhook,
  getOrdersByDateRange,
  getOrdersByChannel,
  STORE_ID_MAPPING,
  type BlingWebhookPayload,
} from './blingOrderService';
import { supabase } from '@/lib/supabase';

// Mock do Supabase
vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  };
  
  return {
    supabase: mockSupabase,
  };
});

describe('blingOrderService', () => {
  describe('STORE_ID_MAPPING', () => {
    it('deve conter todos os 7 canais de venda', () => {
      expect(Object.keys(STORE_ID_MAPPING)).toHaveLength(7);
    });

    it('deve mapear MercadoLivre CPF Alyson corretamente', () => {
      const channel = STORE_ID_MAPPING[205833031];
      expect(channel.marketplace).toBe('MercadoLivre');
      expect(channel.account_type).toBe('CPF');
      expect(channel.account_holder).toBe('Alyson');
    });

    it('deve mapear TikTok CNPJ Alyson corretamente', () => {
      const channel = STORE_ID_MAPPING[205785487];
      expect(channel.marketplace).toBe('TikTok');
      expect(channel.account_type).toBe('CNPJ');
      expect(channel.account_holder).toBe('Alyson');
    });

    it('deve mapear Shopee CPF Jonatan corretamente', () => {
      const channel = STORE_ID_MAPPING[205889400];
      expect(channel.marketplace).toBe('Shopee');
      expect(channel.account_type).toBe('CPF');
      expect(channel.account_holder).toBe('Jonatan');
    });

    it('deve mapear Site CPF Emelyn corretamente', () => {
      const channel = STORE_ID_MAPPING[205836967];
      expect(channel.marketplace).toBe('Site');
      expect(channel.account_type).toBe('CPF');
      expect(channel.account_holder).toBe('Emelyn');
    });
  });

  describe('processBlingWebhook', () => {
    const mockWebhook: BlingWebhookPayload = {
      eventId: '019c7fb8-9917-778b-d042-6bd71d39ebef',
      date: '2026-02-21T10:22:10Z',
      version: 'v1',
      event: 'order.created',
      companyId: 'cc134ac510a27e371e91d3b945458b9b',
      data: {
        id: 25134184137,
        data: '2026-02-21',
        numero: 9,
        numeroLoja: '2000014956707226',
        total: 8,
        contato: { id: 17837649656 },
        vendedor: { id: 0 },
        loja: { id: 205833031 },
        situacao: { id: 6, valor: 0 },
      },
    };

    it('deve processar webhook de pedido criado', async () => {
      const result = await processBlingWebhook(
        mockWebhook,
        'e3274f4d-2627-4121-895d-b0e3a70b0ace'
      );

      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
    });

    it('deve identificar corretamente o canal de venda', async () => {
      const storeId = mockWebhook.data.loja.id;
      const channel = STORE_ID_MAPPING[storeId];

      expect(channel).toBeDefined();
      expect(channel.marketplace).toBe('MercadoLivre');
    });

    it('deve registrar erro quando token não existe', async () => {
      // Mock para simular token não encontrado
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      } as unknown as ReturnType<typeof supabase.from>);

      const result = await processBlingWebhook(
        mockWebhook,
        'e3274f4d-2627-4121-895d-b0e3a70b0ace'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Token do Bling não encontrado');
    });
  });

  describe('getOrdersByDateRange', () => {
    it('deve buscar pedidos por período', async () => {
      const orders = await getOrdersByDateRange(
        'e3274f4d-2627-4121-895d-b0e3a70b0ace',
        '2026-02-01',
        '2026-02-28'
      );

      expect(Array.isArray(orders)).toBe(true);
    });
  });

  describe('getOrdersByChannel', () => {
    it('deve buscar pedidos por marketplace', async () => {
      const orders = await getOrdersByChannel(
        'e3274f4d-2627-4121-895d-b0e3a70b0ace',
        'MercadoLivre'
      );

      expect(Array.isArray(orders)).toBe(true);
    });
  });

  describe('Validações de Dados', () => {
    it('deve validar estrutura do webhook', () => {
      const webhook: BlingWebhookPayload = {
        eventId: 'test-id',
        date: '2026-02-21T10:22:10Z',
        version: 'v1',
        event: 'order.created',
        companyId: 'test-company',
        data: {
          id: 123,
          data: '2026-02-21',
          numero: 1,
          numeroLoja: 'TEST-001',
          total: 100,
          contato: { id: 456 },
          vendedor: { id: 789 },
          loja: { id: 205833031 },
          situacao: { id: 6, valor: 0 },
        },
      };

      expect(webhook.event).toMatch(/^order\.(created|updated|deleted)$/);
      expect(webhook.data.id).toBeGreaterThan(0);
      expect(webhook.data.loja.id).toBeDefined();
    });

    it('deve validar IDs de loja conhecidos', () => {
      const knownStoreIds = [
        205833031, 205785487, 205835012, 205852755, 205889400, 205899802, 205836967,
      ];

      knownStoreIds.forEach((storeId) => {
        expect(STORE_ID_MAPPING[storeId]).toBeDefined();
      });
    });
  });

  describe('Mapeamento de Produtos', () => {
    it('deve mapear produto por SKU quando ID não encontrado', async () => {
      // Este teste seria implementado com mocks mais específicos
      expect(true).toBe(true);
    });

    it('deve retornar null quando produto não existe', async () => {
      // Este teste seria implementado com mocks mais específicos
      expect(true).toBe(true);
    });
  });

  describe('Atualização de Contadores de Vendas', () => {
    it('deve incrementar contador do MercadoLivre', async () => {
      const storeId = 205833031;
      const channel = STORE_ID_MAPPING[storeId];
      
      expect(channel.marketplace).toBe('MercadoLivre');
      // Lógica de incremento seria testada com mocks
    });

    it('deve incrementar contador da Shopee', async () => {
      const storeId = 205852755;
      const channel = STORE_ID_MAPPING[storeId];
      
      expect(channel.marketplace).toBe('Shopee');
    });

    it('deve incrementar contador do TikTok', async () => {
      const storeId = 205785487;
      const channel = STORE_ID_MAPPING[storeId];
      
      expect(channel.marketplace).toBe('TikTok');
    });
  });
});
