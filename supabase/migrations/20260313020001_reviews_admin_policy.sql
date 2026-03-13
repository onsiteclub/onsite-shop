-- Allow admin users to read reviews
CREATE POLICY "admin_select_reviews" ON app_shop_reviews
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- Allow admin users to update reviews (approve/reject)
CREATE POLICY "admin_update_reviews" ON app_shop_reviews
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );
