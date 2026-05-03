export interface PendingOrder {
  bling_order_id: string;
  order_number: number;
  order_date: string;
  order_created_at: string | null;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  marketplace_name: string;
  marketplace_id: string;
  commission_rate: number;
  items_count: number;
  first_product_image: string | null;
  first_product_name: string | null;
  estimated_profit: number;
  net_revenue: number;
  total_cost: number;
}
