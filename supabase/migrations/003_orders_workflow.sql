-- ============================================
-- ONSITE SHOP — ORDER WORKFLOW MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================
-- This migration ensures app_shop_orders has ALL required columns,
-- proper indexes, RLS policies, and triggers for the fulfillment workflow.
--
-- SAFE TO RUN MULTIPLE TIMES (uses IF NOT EXISTS / IF EXISTS checks).
-- ============================================

-- ============================================
-- 1. TABLE: app_shop_orders
-- ============================================
CREATE TABLE IF NOT EXISTS app_shop_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    VARCHAR(50) UNIQUE NOT NULL,
  status          VARCHAR(50) NOT NULL DEFAULT 'paid',
  email           VARCHAR(255),
  items           JSONB NOT NULL DEFAULT '[]',
  total           BIGINT NOT NULL DEFAULT 0,           -- cents
  shipping_cost   BIGINT NOT NULL DEFAULT 0,           -- cents
  shipping_address JSONB,                               -- {name, street, apartment, city, province, postal_code, country}
  customer_notes  TEXT,                                  -- customer instructions at checkout
  staff_notes     TEXT,                                  -- internal admin/fulfillment notes
  tracking_code   VARCHAR(100),                          -- Canada Post tracking number
  stripe_session_id VARCHAR(255),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  processing_at   TIMESTAMPTZ,
  ready_at        TIMESTAMPTZ,
  shipped_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  archived_at     TIMESTAMPTZ
);

-- If the table already exists, ensure all columns are present.
-- ALTER TABLE ... ADD COLUMN IF NOT EXISTS is safe to run repeatedly.
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS order_number    VARCHAR(50);
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS status          VARCHAR(50) DEFAULT 'paid';
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS email           VARCHAR(255);
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS items           JSONB DEFAULT '[]';
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS total           BIGINT DEFAULT 0;
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS shipping_cost   BIGINT DEFAULT 0;
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS customer_notes  TEXT;
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS staff_notes     TEXT;
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS tracking_code   VARCHAR(100);
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS processing_at   TIMESTAMPTZ;
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS ready_at        TIMESTAMPTZ;
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS shipped_at      TIMESTAMPTZ;
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS delivered_at    TIMESTAMPTZ;
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS cancelled_at    TIMESTAMPTZ;
ALTER TABLE app_shop_orders ADD COLUMN IF NOT EXISTS archived_at     TIMESTAMPTZ;

-- ============================================
-- 2. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_shop_orders_status     ON app_shop_orders(status);
CREATE INDEX IF NOT EXISTS idx_shop_orders_email      ON app_shop_orders(email);
CREATE INDEX IF NOT EXISTS idx_shop_orders_created    ON app_shop_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_orders_number     ON app_shop_orders(order_number);

-- ============================================
-- 3. TRIGGER: auto-update updated_at
-- ============================================
-- (Function may already exist from earlier migrations — safe to replace)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shop_orders_updated ON app_shop_orders;
CREATE TRIGGER shop_orders_updated
  BEFORE UPDATE ON app_shop_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE app_shop_orders ENABLE ROW LEVEL SECURITY;

-- Webhook inserts use service_role key (bypasses RLS automatically).
-- Admin browser client uses anon key — needs explicit policies.

-- Allow admins to SELECT all orders
DROP POLICY IF EXISTS "shop_orders_admin_select" ON app_shop_orders;
CREATE POLICY "shop_orders_admin_select" ON app_shop_orders
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- Allow admins to UPDATE orders (status changes, notes, tracking)
DROP POLICY IF EXISTS "shop_orders_admin_update" ON app_shop_orders;
CREATE POLICY "shop_orders_admin_update" ON app_shop_orders
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- Allow admins to DELETE orders
DROP POLICY IF EXISTS "shop_orders_admin_delete" ON app_shop_orders;
CREATE POLICY "shop_orders_admin_delete" ON app_shop_orders
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- Allow service_role full access (webhook, API routes)
DROP POLICY IF EXISTS "shop_orders_service_role" ON app_shop_orders;
CREATE POLICY "shop_orders_service_role" ON app_shop_orders
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 5. FIX LEGACY CONSTRAINTS
-- ============================================
-- The table may have been created from the old `orders` schema which has
-- NOT NULL constraints on columns the webhook doesn't populate (subtotal,
-- user_id, etc.). Drop those constraints so the webhook INSERT works.

ALTER TABLE app_shop_orders ALTER COLUMN subtotal DROP NOT NULL;
ALTER TABLE app_shop_orders ALTER COLUMN subtotal SET DEFAULT 0;
ALTER TABLE app_shop_orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE app_shop_orders ALTER COLUMN shipping DROP NOT NULL;
ALTER TABLE app_shop_orders ALTER COLUMN shipping SET DEFAULT 0;
ALTER TABLE app_shop_orders ALTER COLUMN tax DROP NOT NULL;
ALTER TABLE app_shop_orders ALTER COLUMN tax SET DEFAULT 0;
ALTER TABLE app_shop_orders ALTER COLUMN total DROP NOT NULL;
ALTER TABLE app_shop_orders ALTER COLUMN total SET DEFAULT 0;

-- ============================================
-- 6. MIGRATE LEGACY DATA
-- ============================================
-- Fix old orders stuck on 'pending' (legacy default from orders table).
UPDATE app_shop_orders SET status = 'paid' WHERE status = 'pending';

-- Migrate legacy statuses that no longer exist in the simplified workflow
UPDATE app_shop_orders SET status = 'processing' WHERE status = 'ready_to_ship';
UPDATE app_shop_orders SET status = 'processing' WHERE status = 'out_of_stock';
UPDATE app_shop_orders SET status = 'archived', archived_at = cancelled_at WHERE status = 'cancelled';

-- Ensure items is never null
UPDATE app_shop_orders SET items = '[]' WHERE items IS NULL;

-- Ensure total/shipping_cost are never null
UPDATE app_shop_orders SET total = 0 WHERE total IS NULL;
UPDATE app_shop_orders SET shipping_cost = 0 WHERE shipping_cost IS NULL;
