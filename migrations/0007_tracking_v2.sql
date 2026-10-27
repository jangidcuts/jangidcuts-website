-- Oct 27c: separate trackers, hire statuses (one-time / ongoing), ticket type (question / problem), reusable 5-digit refs
ALTER TABLE hire ADD COLUMN kind TEXT DEFAULT 'once';
ALTER TABLE hire ADD COLUMN events TEXT;
ALTER TABLE hire ADD COLUMN updated INTEGER;
ALTER TABLE tickets ADD COLUMN type TEXT DEFAULT 'problem';
ALTER TABLE refs ADD COLUMN closed_at INTEGER;
ALTER TABLE refs ADD COLUMN num TEXT;
UPDATE hire SET status = 'received' WHERE status = 'new';
UPDATE hire SET status = 'completed' WHERE status = 'done';
UPDATE hire SET status = 'declined' WHERE status = 'rejected';
UPDATE refs SET num = substr(ref, instr(substr(ref, 4), '-') + 4);
CREATE UNIQUE INDEX IF NOT EXISTS refs_num_5_unique ON refs(num) WHERE length(num) = 5;
CREATE INDEX IF NOT EXISTS refs_num ON refs(num);
