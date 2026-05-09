/**
 * TikTok Shop Webhook Event Types
 * Reference: https://partner.tiktokshop.com/docv2/page/650a99f6715d622c03c1c0c7
 */

export interface TikTokShopWebhookEvent {
  timestamp?: number;
  type?: string;
  event_type?: string;
  shop_id?: string;
  data?: {
    shop_id?: string;
    order_id?: string;
    product_id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export type TikTokShopEventType =
  // Message Events
  | 'NEW_MESSAGE'
  | 'NEW_MESSAGE_LISTENER'
  // Order Events
  | 'CANCELLATION_STATUS_CHANGE'
  | 'ORDER_RETURN_STATUS_CHANGE'
  | 'PACKAGE_UPDATE'
  // Product Events
  | 'PRODUCT_INFORMATION_CHANGE'
  | 'PRODUCT_CREATION'
  | 'PRODUCT_STATUS_CHANGE'
  | 'PRODUCT_AUDIT_STATUS_CHANGE'
  // Inventory Events
  | 'INVENTORY_STATUS_CHANGE'
  // Aftersales Events
  | 'AFTERSALES_REQUEST'
  // Content Events
  | 'SHOPPABLE_CONTENT_POSTING'
  // Sample Events
  | 'SAMPLE_APPLICATION_STATUS_CHANGE';

export interface TikTokWebhookEventDB {
  id: string;
  event_type: string;
  shop_id: string;
  order_id: string | null;
  product_id: string | null;
  raw_payload: Record<string, unknown>;
  processed: boolean;
  created_at: string;
}
