ALTER TABLE tickets ADD COLUMN events TEXT;
ALTER TABLE tickets ADD COLUMN thread TEXT;
ALTER TABLE tickets ADD COLUMN read_at INTEGER;
UPDATE tickets SET status = 'received' WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS tickets_number ON tickets(number);
