-- ============================================
-- ONSITE SHOP - DATABASE MIGRATIONS
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Mens', 'mens', 'Roupas e acessórios masculinos', 1),
  ('Womens', 'womens', 'Roupas e acessórios femininos', 2),
  ('Members', 'members', 'Exclusivo para membros OnSite', 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  images JSONB DEFAULT '[]', -- Array of image URLs
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- ============================================
-- 3. PRODUCT VARIANTS (Size/Color combinations)
-- ============================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(50) UNIQUE,
  size VARCHAR(20),
  color VARCHAR(50),
  price_override DECIMAL(10,2), -- NULL = use base_price
  stock_quantity INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique combination of product + size + color
  UNIQUE(product_id, size, color)
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

-- ============================================
-- 4. ADDRESSES
-- ============================================
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label VARCHAR(50) DEFAULT 'Home', -- Home, Work, etc.
  full_name VARCHAR(255) NOT NULL,
  street_address VARCHAR(255) NOT NULL,
  apartment VARCHAR(100),
  city VARCHAR(100) NOT NULL,
  province VARCHAR(50) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(50) DEFAULT 'Canada',
  phone VARCHAR(20),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- Ensure only one default address per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_default 
  ON addresses(user_id) 
  WHERE is_default = true;

-- ============================================
-- 5. TEMP CARTS (for checkout handoff)
-- ============================================
CREATE TABLE IF NOT EXISTS temp_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_temp_carts_user ON temp_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_carts_expires ON temp_carts(expires_at);

-- ============================================
-- 6. ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  order_number VARCHAR(20) UNIQUE, -- Human readable: OSC-2024-0001
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, processing, shipped, delivered, cancelled
  subtotal DECIMAL(10,2) NOT NULL,
  shipping DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  shipping_address_id UUID REFERENCES addresses(id),
  shipping_address JSONB, -- Snapshot of address at time of order
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  notes TEXT,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- ============================================
-- 7. ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL, -- Snapshot
  product_image TEXT,
  size VARCHAR(20),
  color VARCHAR(50),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ============================================
-- 8. FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(order_number, '-', 3) AS INT)
  ), 0) + 1
  INTO seq_num
  FROM orders
  WHERE order_number LIKE 'OSC-' || year_part || '-%';
  
  NEW.order_number := 'OSC-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Decrement stock on order
CREATE OR REPLACE FUNCTION decrement_variant_stock(
  p_variant_id UUID,
  p_quantity INT
)
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_variant_id
    AND stock_quantity >= p_quantity;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for variant %', p_variant_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. RLS POLICIES
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE temp_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Categories: Public read
CREATE POLICY "Categories are viewable by everyone" 
  ON categories FOR SELECT 
  USING (is_active = true);

-- Products: Public read
CREATE POLICY "Products are viewable by everyone" 
  ON products FOR SELECT 
  USING (is_active = true);

-- Variants: Public read
CREATE POLICY "Variants are viewable by everyone" 
  ON product_variants FOR SELECT 
  USING (is_active = true);

-- Addresses: Users can CRUD their own
CREATE POLICY "Users can view their own addresses" 
  ON addresses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own addresses" 
  ON addresses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" 
  ON addresses FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" 
  ON addresses FOR DELETE 
  USING (auth.uid() = user_id);

-- Temp carts: Anyone can create, users can read their own
CREATE POLICY "Anyone can create temp cart" 
  ON temp_carts FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view their own temp carts" 
  ON temp_carts FOR SELECT 
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Service role can do everything on temp_carts
CREATE POLICY "Service role full access to temp_carts" 
  ON temp_carts FOR ALL 
  USING (auth.role() = 'service_role');

-- Orders: Users can view their own
CREATE POLICY "Users can view their own orders" 
  ON orders FOR SELECT 
  USING (auth.uid() = user_id);

-- Order items: Users can view their order items
CREATE POLICY "Users can view their order items" 
  ON order_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- 10. CLEANUP CRON (optional - run daily)
-- ============================================

-- Delete expired temp_carts (run via pg_cron or external scheduler)
-- DELETE FROM temp_carts WHERE expires_at < NOW();

-- ============================================
-- 11. SAMPLE DATA (for testing)
-- ============================================

-- Get category IDs
DO $$
DECLARE
  mens_id UUID;
  womens_id UUID;
  members_id UUID;
BEGIN
  SELECT id INTO mens_id FROM categories WHERE slug = 'mens';
  SELECT id INTO womens_id FROM categories WHERE slug = 'womens';
  SELECT id INTO members_id FROM categories WHERE slug = 'members';

  -- Products
  INSERT INTO products (category_id, name, slug, description, base_price, images, is_featured) VALUES
    (mens_id, 'Camiseta OnSite Amber', 'camiseta-amber', 
     'Camiseta 100% algodão ringspun, pré-encolhida. Estampa em silk de alta durabilidade. Feita pra aguentar o trabalho pesado.', 
     29.99, '["camiseta-amber-1.webp", "camiseta-amber-2.webp", "camiseta-amber-3.webp"]', true),
    
    (mens_id, 'Camiseta OnSite Black', 'camiseta-black', 
     'Camiseta 100% algodão ringspun. Estampa em silk de alta durabilidade.', 
     29.99, '["camiseta-black-1.webp", "camiseta-black-2.webp", "camiseta-black-3.webp"]', true),
    
    (mens_id, 'Boné OnSite Classic', 'bone-classic', 
     'Boné estruturado com aba curva. Ajuste snapback. Logo bordado em alta definição.', 
     24.99, '["bone-1.webp", "bone-2.webp", "bone-3.webp"]', true),
    
    (mens_id, 'Moletom OnSite Heavy', 'moletom-heavy', 
     'Moletom pesado 400g/m². Capuz forrado. Bolso canguru. Punhos e barra em ribana.', 
     59.99, '["moletom-1.webp", "moletom-2.webp", "moletom-3.webp"]', false),
    
    (womens_id, 'Camiseta OnSite Feminina', 'camiseta-feminina', 
     'Camiseta 100% algodão ringspun. Corte feminino. Estampa em silk de alta durabilidade.', 
     29.99, '["camiseta-fem-1.webp", "camiseta-fem-2.webp", "camiseta-fem-3.webp"]', true),
    
    (members_id, 'Kit Adesivos OnSite', 'kit-adesivos', 
     'Kit com 5 adesivos vinil premium. Resistente a água e sol. Perfeito pro capacete ou caixa de ferramentas.', 
     12.99, '["adesivos-1.webp", "adesivos-2.webp", "adesivos-3.webp"]', true),
    
    (members_id, 'Caneca OnSite Builder', 'caneca-builder', 
     'Caneca cerâmica 350ml. Impressão de alta qualidade. Vai bem no microondas e lava-louças.', 
     19.99, '["caneca-1.webp", "caneca-2.webp", "caneca-3.webp"]', false)
  ON CONFLICT (slug) DO NOTHING;

END $$;

-- Add variants to products
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT 
  p.id,
  UPPER(LEFT(p.slug, 3)) || '-' || s.size || '-' || LEFT(c.color, 3),
  s.size,
  c.color,
  FLOOR(RANDOM() * 50 + 10)::INT
FROM products p
CROSS JOIN (VALUES ('S'), ('M'), ('L'), ('XL'), ('XXL')) AS s(size)
CROSS JOIN (VALUES ('Amber'), ('Black'), ('White')) AS c(color)
WHERE p.slug LIKE 'camiseta%'
ON CONFLICT (product_id, size, color) DO NOTHING;

-- Bonés e moletom
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT 
  p.id,
  UPPER(LEFT(p.slug, 3)) || '-' || 'UN' || '-' || LEFT(c.color, 3),
  'Único',
  c.color,
  FLOOR(RANDOM() * 30 + 5)::INT
FROM products p
CROSS JOIN (VALUES ('Black'), ('Navy'), ('Amber')) AS c(color)
WHERE p.slug = 'bone-classic'
ON CONFLICT (product_id, size, color) DO NOTHING;

-- Adesivos e canecas
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity)
SELECT 
  p.id,
  UPPER(LEFT(p.slug, 3)) || '-UN-MIX',
  'Único',
  'Mix',
  FLOOR(RANDOM() * 100 + 20)::INT
FROM products p
WHERE p.slug IN ('kit-adesivos', 'caneca-builder')
ON CONFLICT (product_id, size, color) DO NOTHING;
