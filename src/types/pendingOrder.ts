export interface PendingOrder {
  bling_order_id: string;
  order_number: number;
  marketplace_order_number?: string | null;
  purchase_order_number?: string | null;
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
  first_product_id: string | null;
  estimated_profit: number;
  net_revenue: number;
  total_cost: number;
  marketplace_fee?: number;
  marketplace_fixed_fee?: number;
  commission_value?: number;
  valor_bruto: number;
  expected_price: number;
}
