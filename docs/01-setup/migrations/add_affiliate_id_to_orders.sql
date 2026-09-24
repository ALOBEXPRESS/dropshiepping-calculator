-- Migration: Add affiliate_id column to orders table
-- Description: Allows associating orders with influencers/affiliates for commission tracking
-- Date: 2026-04-25

-- Add affiliate_id column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES influencers(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);

-- Add comment to document the column
COMMENT ON COLUMN orders.affiliate_id IS 'Reference to the influencer/affiliate associated with this order';

-- Optional: Update existing free sample orders to link with their influencers
-- This query links orders that are marked as free samples with their corresponding influencer
UPDATE orders o
SET affiliate_id = ifs.influencer_id
FROM influencer_free_samples ifs
WHERE o.id = ifs.order_id
  AND o.is_free_sample = true
  AND o.affiliate_id IS NULL
  AND ifs.influencer_id IS NOT NULL;
