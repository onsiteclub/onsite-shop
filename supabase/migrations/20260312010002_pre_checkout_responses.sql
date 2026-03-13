CREATE TABLE IF NOT EXISTS pre_checkout_responses (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz   DEFAULT now(),
  session_id    text,
  q1_satisfaction  integer,
  q2_design        integer,
  q3_recommend     integer,
  q4_comments      text,
  promo_used    boolean       DEFAULT false,
  cart_value    numeric,
  ip_hash       text
);

ALTER TABLE pre_checkout_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON pre_checkout_responses
  FOR ALL USING (auth.role() = 'service_role');
