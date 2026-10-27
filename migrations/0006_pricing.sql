-- Per-pack pricing mode + discount; order price breakdown
ALTER TABLE products ADD COLUMN price_mode TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN disc_type TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN disc_value INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN meta TEXT;
