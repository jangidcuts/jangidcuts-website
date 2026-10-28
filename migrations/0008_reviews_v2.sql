-- Oct 28: reviews v2 — client (hire) reviews by private link / tracker, automatic top 4 with admin pin / keep-out, admin replies
ALTER TABLE reviews ADD COLUMN hire_id INTEGER;
ALTER TABLE reviews ADD COLUMN pick INTEGER DEFAULT 0;
ALTER TABLE reviews ADD COLUMN reply TEXT;
ALTER TABLE reviews ADD COLUMN reply_at INTEGER;
ALTER TABLE reviews ADD COLUMN updated INTEGER;
ALTER TABLE hire ADD COLUMN review_token TEXT;
ALTER TABLE hire ADD COLUMN review_open INTEGER DEFAULT 0;
ALTER TABLE hire ADD COLUMN review_sent_at INTEGER;
CREATE INDEX IF NOT EXISTS reviews_hire ON reviews(hire_id);
CREATE INDEX IF NOT EXISTS hire_review_token ON hire(review_token);
UPDATE reviews SET source = 'demo' WHERE source = 'admin' AND product_id IS NULL AND id IN (1, 2, 3, 4);
