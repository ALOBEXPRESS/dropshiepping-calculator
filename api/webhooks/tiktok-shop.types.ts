/**
 * TikTok Shop Webhook Event Types
 * Reference: https://partner.tiktokshop.com/docv2/page/650a99f6715d622c03c1c0c7
 */

export interface TikTokShopWebhookEvent {
  timestamp: number;
  type: TikTokShopEventType;
  shop_id: string;
  data: unknown; // Varies by event type
}

export type TikTokShopEventType =
  // Order Events
  | 'ORDER_STATUS_CHANGE'
  | 'ORDER_CANCEL'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  // Product Events
  | 'PRODUCT_CHANGE'
  | 'PRODUCT_DELETE'
  // Inventory Events
  | 'INVENTORY_UPDATE'
  // Return Events
  | 'RETURN_REQUEST'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  // Other Events
  | 'SHOP_AUTHORIZED'
  | 'SHOP_DEAUTHORIZED';

export interface TikTokShopOrderEvent {
  order_id: string;
  order_status: string;
  update_time: number;
  // Add more fields as needed based on TikTok Shop API docs
}

export interface TikTokShopProductEvent {
  product_id: string;
  product_name: string;
  update_time: number;
  // Add more fields as needed
}

export interface TikTokShopWebhookResponse {
  success: boolean;
  received: boolean;
  timestamp: string;
  error?: string;
}
