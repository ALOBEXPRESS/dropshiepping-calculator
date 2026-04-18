export interface FreeSampleRecord {
  id: string;
  organization_id: string;
  influencer_id: string | null;
  order_id: string;
  bling_order_id: string;
  product_name: string;
  product_image_url: string | null;
  processed_at: string;
  created_at: string;
}

export interface FreeSampleInsert {
  organization_id: string;
  influencer_id: string | null;
  order_id: string;
  bling_order_id: string;
  product_name: string;
  product_image_url: string | null;
  processed_at: string;
}
