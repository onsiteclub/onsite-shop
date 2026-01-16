-- ============================================
-- ONSITE SHOP - DATABASE SCHEMA
-- Execute no Supabase SQL Editor
-- ============================================

-- 1. CATEGORIAS
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUTOS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VARIANTES DE PRODUTO (tamanho/cor específicos)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100),
  size VARCHAR(50),
  color VARCHAR(50),
  price_override DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PEDIDOS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  shipping DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  shipping_address JSONB,
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  notes TEXT,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ITENS DO PEDIDO
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  size VARCHAR(50),
  color VARCHAR(50),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CARRINHOS TEMPORÁRIOS (para checkout)
CREATE TABLE IF NOT EXISTS temp_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 7. ADMINS (emails autorizados)
CREATE TABLE IF NOT EXISTS shop_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE temp_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_admins ENABLE ROW LEVEL SECURITY;

-- Categorias: leitura pública
CREATE POLICY "categories_read" ON categories FOR SELECT USING (true);

-- Produtos: leitura pública (apenas ativos)
CREATE POLICY "products_read" ON products FOR SELECT USING (is_active = true);

-- Variantes: leitura pública
CREATE POLICY "variants_read" ON product_variants FOR SELECT USING (true);

-- Pedidos: usuário vê apenas seus pedidos
CREATE POLICY "orders_user_read" ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "orders_user_insert" ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Itens do pedido: usuário vê apenas seus itens
CREATE POLICY "order_items_user_read" ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

-- Carrinhos temporários: usuário ou anônimo
CREATE POLICY "temp_carts_read" ON temp_carts FOR SELECT USING (true);
CREATE POLICY "temp_carts_insert" ON temp_carts FOR INSERT WITH CHECK (true);
CREATE POLICY "temp_carts_delete" ON temp_carts FOR DELETE USING (true);

-- Admins: apenas service role pode gerenciar
CREATE POLICY "admins_read" ON shop_admins FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS ADMIN (usando service_role para bypass)
-- ============================================

-- Admin pode fazer tudo em produtos
CREATE POLICY "products_admin_all" ON products FOR ALL
  USING (
    EXISTS (SELECT 1 FROM shop_admins WHERE user_id = auth.uid())
  );

-- Admin pode fazer tudo em categorias
CREATE POLICY "categories_admin_all" ON categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM shop_admins WHERE user_id = auth.uid())
  );

-- Admin pode ver todos os pedidos
CREATE POLICY "orders_admin_read" ON orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM shop_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "orders_admin_update" ON orders FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM shop_admins WHERE user_id = auth.uid())
  );

-- ============================================
-- FUNÇÃO: Atualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS categories_updated ON categories;
CREATE TRIGGER categories_updated BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS products_updated ON products;
CREATE TRIGGER products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS product_variants_updated ON product_variants;
CREATE TRIGGER product_variants_updated BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS orders_updated ON orders;
CREATE TRIGGER orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Categorias
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Mens', 'mens', 1),
  ('Womens', 'womens', 2),
  ('Members', 'members', 3)
ON CONFLICT (slug) DO NOTHING;

-- Produtos de exemplo
INSERT INTO products (name, slug, description, base_price, images, sizes, colors, category_id, is_active)
SELECT
  'Camiseta OnSite Amber',
  'camiseta-onsite-amber',
  'Camiseta 100% algodão ringspun, pré-encolhida. Estampa em silk de alta durabilidade.',
  29.99,
  ARRAY['/products/camiseta-amber.webp'],
  ARRAY['P', 'M', 'G', 'GG', 'XGG'],
  ARRAY['Amber', 'Preto', 'Branco'],
  id,
  true
FROM categories WHERE slug = 'mens'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, base_price, images, sizes, colors, category_id, is_active)
SELECT
  'Boné Trucker OnSite',
  'bone-trucker-onsite',
  'Boné trucker com ajuste snapback. Logo bordado.',
  24.99,
  ARRAY['/products/bone-trucker.webp'],
  ARRAY['Único'],
  ARRAY['Preto/Amarelo', 'Verde/Branco'],
  id,
  true
FROM categories WHERE slug = 'mens'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, base_price, images, sizes, colors, category_id, is_active)
SELECT
  'Moletom Heavyweight',
  'moletom-heavyweight',
  'Moletom 400gsm, capuz forrado. Bolso canguru.',
  59.99,
  ARRAY['/products/moletom-heavy.webp'],
  ARRAY['P', 'M', 'G', 'GG', 'XGG'],
  ARRAY['Preto', 'Cinza'],
  id,
  true
FROM categories WHERE slug = 'mens'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, base_price, images, sizes, colors, category_id, is_active)
SELECT
  'Camiseta Feminina OnSite',
  'camiseta-feminina-onsite',
  'Camiseta feminina corte ajustado. 100% algodão.',
  27.99,
  ARRAY['/products/camiseta-fem.webp'],
  ARRAY['PP', 'P', 'M', 'G'],
  ARRAY['Amber', 'Rosa', 'Branco'],
  id,
  true
FROM categories WHERE slug = 'womens'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, base_price, images, sizes, colors, category_id, is_active)
SELECT
  'Kit Member Exclusivo',
  'kit-member-exclusivo',
  'Kit exclusivo para membros OnSite Club.',
  89.99,
  ARRAY['/products/kit-member.webp'],
  ARRAY['P', 'M', 'G', 'GG'],
  ARRAY['Edição Limitada'],
  id,
  true
FROM categories WHERE slug = 'members'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- STORAGE BUCKET PARA IMAGENS
-- Execute separadamente no Storage do Supabase
-- ============================================

-- No painel do Supabase > Storage > New Bucket:
-- Nome: products
-- Public: SIM
--
-- Depois em Policies, adicione:
-- SELECT (read): true (público)
-- INSERT (upload): apenas admins autenticados
-- DELETE: apenas admins autenticados
