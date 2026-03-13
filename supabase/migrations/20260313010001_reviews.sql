CREATE TABLE IF NOT EXISTS app_shop_reviews (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number    text        NOT NULL,
  customer_name   text,
  email           text,
  rating          integer     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title           text,
  comment         text,
  product_names   text[]      DEFAULT '{}',
  status          text        DEFAULT 'pending',
  created_at      timestamptz DEFAULT now(),
  approved_at     timestamptz,
  moderator_notes text
);

CREATE INDEX IF NOT EXISTS idx_reviews_status ON app_shop_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON app_shop_reviews(order_number);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON app_shop_reviews(created_at DESC);

ALTER TABLE app_shop_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON app_shop_reviews
  FOR ALL USING (auth.role() = 'service_role');
