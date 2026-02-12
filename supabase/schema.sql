-- ToyBox Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CATEGORIES
-- ============================================
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- ============================================
-- 2. PRODUCTS
-- ============================================
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  compare_at_price DECIMAL(10,2),
  sku TEXT,
  stock_quantity INT NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand TEXT,
  age_range TEXT,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(price);

-- ============================================
-- 3. PRODUCT IMAGES
-- ============================================
CREATE TABLE product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ============================================
-- 4. WHATSAPP ORDERS
-- ============================================
CREATE TABLE whatsapp_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'clicked' CHECK (status IN ('clicked','confirmed','fulfilled','cancelled')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_orders_status ON whatsapp_orders(status);
CREATE INDEX idx_whatsapp_orders_created ON whatsapp_orders(created_at DESC);

-- ============================================
-- 5. PRODUCT VIEWS (Analytics)
-- ============================================
CREATE TABLE product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_views_product ON product_views(product_id);
CREATE INDEX idx_product_views_date ON product_views(viewed_at DESC);

-- ============================================
-- 6. STORE SETTINGS
-- ============================================
CREATE TABLE store_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIGGERS: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_categories_updated
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_products_updated
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_whatsapp_orders_updated
  BEFORE UPDATE ON whatsapp_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_store_settings_updated
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FULL-TEXT SEARCH FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION search_products(search_query TEXT)
RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM products
  WHERE is_active = TRUE
    AND (
      name ILIKE '%' || search_query || '%'
      OR description ILIKE '%' || search_query || '%'
      OR brand ILIKE '%' || search_query || '%'
      OR search_query = ANY(tags)
    )
  ORDER BY
    CASE WHEN name ILIKE search_query || '%' THEN 0 ELSE 1 END,
    name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TOP VIEWED PRODUCTS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION get_top_viewed_products(days_back INT DEFAULT 30, result_limit INT DEFAULT 10)
RETURNS TABLE(product_id UUID, product_name TEXT, view_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.product_id,
    p.name AS product_name,
    COUNT(*) AS view_count
  FROM product_views pv
  JOIN products p ON p.id = pv.product_id
  WHERE pv.viewed_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY pv.product_id, p.name
  ORDER BY view_count DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Categories: public read, admin write
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read categories" ON categories FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage categories" ON categories FOR ALL USING (auth.role() = 'authenticated');

-- Products: public read active, admin all
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active products" ON products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admin can manage products" ON products FOR ALL USING (auth.role() = 'authenticated');

-- Product Images: public read, admin write
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read images" ON product_images FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage images" ON product_images FOR ALL USING (auth.role() = 'authenticated');

-- WhatsApp Orders: public insert (for logging clicks), admin all
ALTER TABLE whatsapp_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create orders" ON whatsapp_orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admin can manage orders" ON whatsapp_orders FOR ALL USING (auth.role() = 'authenticated');

-- Product Views: public insert, admin read
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log views" ON product_views FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admin can read views" ON product_views FOR SELECT USING (auth.role() = 'authenticated');

-- Store Settings: public read, admin write
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read settings" ON store_settings FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage settings" ON store_settings FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Run this separately in Supabase Dashboard > Storage, or via SQL:
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', TRUE);

CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admin can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admin can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admin can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ============================================
-- SEED DATA
-- ============================================

-- Default categories
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Baby & Toddler', 'baby-toddler', 1),
  ('Preschool', 'preschool', 2),
  ('Action Figures', 'action-figures', 3),
  ('Dolls & Accessories', 'dolls-accessories', 4),
  ('Board Games', 'board-games', 5),
  ('Puzzles', 'puzzles', 6),
  ('Building & Construction', 'building-construction', 7),
  ('Outdoor Play', 'outdoor-play', 8),
  ('Arts & Crafts', 'arts-crafts', 9),
  ('Educational', 'educational', 10);

-- Default store settings
INSERT INTO store_settings (key, value) VALUES
  ('store_name', 'ToyBox'),
  ('whatsapp_number', '1234567890'),
  ('hero_title', 'Welcome to ToyBox'),
  ('hero_subtitle', 'Your favorite local toy store - browse online, order via WhatsApp!'),
  ('currency', 'USD'),
  ('store_address', ''),
  ('store_email', ''),
  ('footer_text', '© 2026 ToyBox. All rights reserved.');
