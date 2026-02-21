-- Migration: 004_product_video
-- Adds video_url column to products table for product video support

ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Comment for documentation
COMMENT ON COLUMN products.video_url IS 'Optional URL to a product video stored in Supabase storage (product-videos bucket)';
