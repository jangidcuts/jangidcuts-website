-- Nov 1 (Prashant m:00203570): real visitor stats (raw hit log, filtered in the stats), product tiers + upgrade path, suggestion box
CREATE TABLE IF NOT EXISTS hitlog (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, day TEXT NOT NULL, path TEXT, vid TEXT, uid INTEGER, flag TEXT DEFAULT '', ua TEXT, ipx TEXT, asn TEXT, country TEXT, ref TEXT);
CREATE INDEX IF NOT EXISTS hitlog_day ON hitlog(day, flag);
CREATE INDEX IF NOT EXISTS hitlog_vid ON hitlog(vid);
ALTER TABLE products ADD COLUMN tier TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN next_id INTEGER;
ALTER TABLE products ADD COLUMN up_text TEXT DEFAULT '';
CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, name TEXT, email TEXT, message TEXT NOT NULL, created INTEGER, read_at INTEGER, ip TEXT);
CREATE INDEX IF NOT EXISTS feedback_read ON feedback(read_at, id);
