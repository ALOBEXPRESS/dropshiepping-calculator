// Types para o sistema de vendas

export interface OrderProduct {
  id?: string;
  product_id?: string;
  is_replica?: boolean;
  name: string;
  sku?: string;
  image_url?: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
}

export interface OrderData {
  order_id: string;
  bling_order_id?: string | null;
  order_number: string;
  order_date: string;
  delivery_date?: string | null;
  is_logistics_delayed?: boolean;
  is_manually_settled?: boolean;
  is_replica?: boolean;
  is_replica_unblocked?: boolean;
  is_repasse_bloqueado?: boolean;
  aguardando_reembolso?: boolean;
  marketplace_name: string;
  marketplace?: string;
  total_amount: number;
  total_cost: number;
  total_profit: number;
  shipping_cost?: number;
  marketplace_commission?: number;
  other_expenses?: number;
  commission_rate?: number;
  // Campos do produto vinculado
  product_id?: string;
  product_name?: string;
  product_sku?: string;
  product_cost_price?: number;
  supplier_fee_type?: string;
  supplier_fee_value?: string;
  supplier_gateway_fee_type?: string;
  supplier_gateway_fee_value?: string;
  gateway_fee_type?: string;
  gateway_fee_value?: string;
  shipping_option?: string;
  tiktok_sfp_enabled?: boolean;
  products: OrderProduct[];
}

export interface RevenueData {
  period_label: string;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  total_waiting_profit?: number;
  total_settled_profit?: number;
  total_blocked_profit?: number;
  orders_count: number;
  orders_data: OrderData[];
}

export interface StatisticsData {
  total_products: number;
  products_change: number;
  total_customers: number;
  customers_change: number;
  total_orders: number;
  orders_change: number;
  total_sales: number;
  sales_change: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  product_image: string;
  category: string;
  price: number;
  discount: number;
  quantity_sold: number;
  total_orders: number;
  total_revenue: number;
  total_profit: number;
}

export interface TopCustomer {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

export interface StockReport {
  product_name: string;
  product_image: string;
  price: number;
  stock_quantity: number;
  stock_status: 'Out of Stock' | 'Low Stock' | 'High Stock';
  stock_percentage: number;
}

export interface CountryDistribution {
  country: string;
  country_code: string;
  total_customers: number;
  percentage: number;
}

export type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'yearly';
