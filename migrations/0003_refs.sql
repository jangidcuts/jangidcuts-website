-- typed reference numbers (JC-ORD-…, JC-TKT-…, JC-HIRE-…, JC-DL-…, JC-REF-…)
CREATE TABLE IF NOT EXISTS refs (ref TEXT PRIMARY KEY, kind TEXT NOT NULL, created INTEGER);
