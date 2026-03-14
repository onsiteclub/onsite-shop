-- Add discount_type column to promo_codes
-- Values: 'item_050' (item for $0.50), 'percent_10', 'percent_15', 'percent_20', 'percent_25', 'percent_50'
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'item_050';
