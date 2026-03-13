CREATE TABLE IF NOT EXISTS promo_codes (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  code          text          UNIQUE NOT NULL,
  email         text,
  phone         text,
  notes         text,
  created_at    timestamptz   DEFAULT now(),
  expires_at    timestamptz,
  used_at       timestamptz,
  used_by_ip    text,
  order_id      text,
  created_by    text          DEFAULT 'admin'
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON promo_codes
  FOR ALL USING (auth.role() = 'service_role');
