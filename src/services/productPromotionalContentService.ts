/**
 * Product Promotional Content Service
 * Gerencia conteúdo promocional de produtos (vídeos, tráfego orgânico)
 * Usa lazy loading para melhor performance
 */

import { supabase } from '../lib/supabase';
import type {
  ProductPromotionalContent,
  ProductPromotionalContentRow,
  ProductPromotionalContentPayload
} from '../types/productPromotionalContent';

class ProductPromotionalContentService {
  private readonly tableName = 'product_promotional_content';

  /**
   * Mapeia row do banco para objeto do domínio
   */
  private mapRow(row: ProductPromotionalContentRow): ProductPromotionalContent {
    return {
      id: row.id,
      productId: row.product_id,
      organizationId: row.organization_id,
      promoVideoUrl: row.promo_video_url ?? undefined,
      promoVideoCopy: row.promo_video_copy ?? undefined,
      promoVideoChannels: row.promo_video_channels ?? undefined,
      promoVideoChannelLinks: row.promo_video_channel_links ?? undefined,
      promoVideoChannelNames: row.promo_video_channel_names ?? undefined,
      organicChannels: row.organic_channels ?? undefined,
      organicChannelLinks: row.organic_channel_links ?? undefined,
      organicChannelNames: row.organic_channel_names ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Busca conteúdo promocional por ID do produto
   */
  async getByProductId(productId: string): Promise<ProductPromotionalContent | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('product_id', productId)
      .single();

    if (error) {
      // Se não encontrar, retorna null (não é erro)
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching promotional content:', error);
      throw error;
    }

    return data ? this.mapRow(data as ProductPromotionalContentRow) : null;
  }

  /**
   * Busca conteúdo promocional de múltiplos produtos
   */
  async getByProductIds(productIds: string[]): Promise<Map<string, ProductPromotionalContent>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .in('product_id', productIds);

    if (error) {
      console.error('Error fetching promotional content:', error);
      throw error;
    }

    const map = new Map<string, ProductPromotionalContent>();
    if (data) {
      data.forEach((row) => {
        const content = this.mapRow(row as ProductPromotionalContentRow);
        map.set(content.productId, content);
      });
    }

    return map;
  }

  /**
   * Cria ou atualiza conteúdo promocional (upsert)
   */
  async upsert(
    productId: string,
    organizationId: string,
    data: Partial<ProductPromotionalContent>
  ): Promise<ProductPromotionalContent> {
    const payload: ProductPromotionalContentPayload = {
      product_id: productId,
      organization_id: organizationId,
      promo_video_url: data.promoVideoUrl ?? null,
      promo_video_copy: data.promoVideoCopy ?? null,
      promo_video_channels: data.promoVideoChannels ?? null,
      promo_video_channel_links: data.promoVideoChannelLinks ?? null,
      promo_video_channel_names: data.promoVideoChannelNames ?? null,
      organic_channels: data.organicChannels ?? null,
      organic_channel_links: data.organicChannelLinks ?? null,
      organic_channel_names: data.organicChannelNames ?? null
    };

    const { data: result, error } = await supabase
      .from(this.tableName)
      .upsert(payload, {
        onConflict: 'product_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting promotional content:', error);
      throw error;
    }

    return this.mapRow(result as ProductPromotionalContentRow);
  }

  /**
   * Deleta conteúdo promocional de um produto
   */
  async delete(productId: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('product_id', productId);

    if (error) {
      console.error('Error deleting promotional content:', error);
      throw error;
    }
  }

  /**
   * Verifica se produto tem conteúdo promocional
   */
  async hasContent(productId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId);

    if (error) {
      console.error('Error checking promotional content:', error);
      return false;
    }

    return (count ?? 0) > 0;
  }
}

export const productPromotionalContentService = new ProductPromotionalContentService();
