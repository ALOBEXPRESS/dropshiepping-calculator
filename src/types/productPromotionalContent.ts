/**
 * Product Promotional Content Types
 * Representa conteúdo promocional de produtos (vídeos, tráfego orgânico)
 * Normalizado em tabela separada para melhor performance
 */

export interface ProductPromotionalContent {
  id: string;
  productId: string;
  organizationId: string;
  
  // Vídeos promocionais
  promoVideoUrl?: string;
  promoVideoCopy?: string;
  promoVideoChannels?: string[];
  promoVideoChannelLinks?: Record<string, string>;
  promoVideoChannelNames?: Record<string, string>;
  
  // Tráfego orgânico
  organicChannels?: string[];
  organicChannelLinks?: Record<string, string>;
  organicChannelNames?: Record<string, string>;
  
  // Metadados
  createdAt: string;
  updatedAt: string;
}

export interface ProductPromotionalContentRow {
  id: string;
  product_id: string;
  organization_id: string;
  promo_video_url: string | null;
  promo_video_copy: string | null;
  promo_video_channels: string[] | null;
  promo_video_channel_links: Record<string, string> | null;
  promo_video_channel_names: Record<string, string> | null;
  organic_channels: string[] | null;
  organic_channel_links: Record<string, string> | null;
  organic_channel_names: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface ProductPromotionalContentPayload {
  product_id: string;
  organization_id: string;
  promo_video_url?: string | null;
  promo_video_copy?: string | null;
  promo_video_channels?: string[] | null;
  promo_video_channel_links?: Record<string, string> | null;
  promo_video_channel_names?: Record<string, string> | null;
  organic_channels?: string[] | null;
  organic_channel_links?: Record<string, string> | null;
  organic_channel_names?: Record<string, string> | null;
}
