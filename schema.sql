-- Jangid Cuts D1 schema (v1)
CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL, updated INTEGER);
CREATE TABLE IF NOT EXISTS hits (k TEXT PRIMARY KEY, n INTEGER NOT NULL, exp INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, name TEXT, avatar TEXT,
  pass_hash TEXT, salt TEXT, google_sub TEXT, role TEXT DEFAULT 'user',
  email_notif INTEGER DEFAULT 1, lang TEXT DEFAULT 'en', currency TEXT DEFAULT 'INR',
  totp_secret TEXT, totp_pending TEXT, totp_on INTEGER DEFAULT 0, disabled INTEGER DEFAULT 0,
  created INTEGER, last_login INTEGER, tc_at INTEGER);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, exp INTEGER NOT NULL, created INTEGER, ua TEXT, ip TEXT, mfa INTEGER DEFAULT 0);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS otps (email TEXT NOT NULL, purpose TEXT NOT NULL, code_hash TEXT NOT NULL, exp INTEGER NOT NULL, tries INTEGER DEFAULT 0, created INTEGER, PRIMARY KEY (email, purpose));
CREATE TABLE IF NOT EXISTS media (key TEXT PRIMARY KEY, name TEXT, type TEXT, size INTEGER, store TEXT, folder TEXT, created INTEGER);
CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, section TEXT NOT NULL, name TEXT NOT NULL, parent_id INTEGER, sort INTEGER DEFAULT 0, thumb TEXT);
CREATE INDEX IF NOT EXISTS cat_section ON categories(section, sort);
CREATE TABLE IF NOT EXISTS portfolio (
  id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, title TEXT, description TEXT,
  category_id INTEGER, subcategory_id INTEGER, image TEXT, video TEXT, url TEXT, orient TEXT DEFAULT 'v',
  featured INTEGER DEFAULT 0, home INTEGER DEFAULT 0, row_name TEXT, sort INTEGER DEFAULT 0, visible INTEGER DEFAULT 1, created INTEGER, services TEXT DEFAULT '[]', source TEXT DEFAULT '');
CREATE INDEX IF NOT EXISTS pf_kind ON portfolio(kind, sort);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE, title TEXT NOT NULL, short TEXT, description TEXT,
  price INTEGER DEFAULT 0, mrp INTEGER DEFAULT 0, category_id INTEGER, image TEXT, gallery TEXT,
  delivery TEXT DEFAULT 'file', file_key TEXT, file_name TEXT, file_size INTEGER, drive_id TEXT, link_url TEXT, size_text TEXT,
  badge TEXT, visible INTEGER DEFAULT 1, sort INTEGER DEFAULT 0, downloads INTEGER DEFAULT 0, sales INTEGER DEFAULT 0, created INTEGER, updated INTEGER);
CREATE INDEX IF NOT EXISTS prod_cat ON products(category_id, sort);
CREATE TABLE IF NOT EXISTS cart (user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, added INTEGER, PRIMARY KEY (user_id, product_id));
CREATE TABLE IF NOT EXISTS wishlist (user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, added INTEGER, PRIMARY KEY (user_id, product_id));
CREATE TABLE IF NOT EXISTS coupons (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL, type TEXT DEFAULT 'pct', value INTEGER NOT NULL, min_items INTEGER DEFAULT 1, min_total INTEGER DEFAULT 0, starts INTEGER, expires INTEGER, active INTEGER DEFAULT 1, max_uses INTEGER DEFAULT 0, used INTEGER DEFAULT 0, note TEXT, created INTEGER);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT UNIQUE, user_id INTEGER, email TEXT, items TEXT,
  subtotal INTEGER, discount INTEGER DEFAULT 0, total INTEGER, coupon TEXT, status TEXT DEFAULT 'created',
  provider TEXT, provider_order TEXT, payment_id TEXT, events TEXT, created INTEGER, paid_at INTEGER, delivered_at INTEGER, note TEXT);
CREATE INDEX IF NOT EXISTS orders_user ON orders(user_id, created);
CREATE INDEX IF NOT EXISTS orders_status ON orders(status, created);
CREATE TABLE IF NOT EXISTS owned (user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, order_id INTEGER, created INTEGER, downloads INTEGER DEFAULT 0, first_dl INTEGER, last_dl INTEGER, PRIMARY KEY (user_id, product_id));
CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, product_id INTEGER, name TEXT, role TEXT, rating INTEGER NOT NULL, text TEXT, status TEXT DEFAULT 'visible', featured INTEGER DEFAULT 0, source TEXT DEFAULT 'user', created INTEGER, photo TEXT);
CREATE INDEX IF NOT EXISTS reviews_prod ON reviews(product_id, status);
CREATE TABLE IF NOT EXISTS hire (id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT, user_id INTEGER, name TEXT, email TEXT, data TEXT, status TEXT DEFAULT 'new', note TEXT, created INTEGER, approved_at INTEGER, ip TEXT);
CREATE INDEX IF NOT EXISTS hire_status ON hire(status, created);
CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT, user_id INTEGER, email TEXT, name TEXT, topic TEXT, message TEXT, status TEXT DEFAULT 'pending', solution TEXT, created INTEGER, solved_at INTEGER, ip TEXT);
CREATE INDEX IF NOT EXISTS tickets_status ON tickets(status, created);
CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, account TEXT, to_addr TEXT, subject TEXT, body TEXT, kind TEXT, ref TEXT, status TEXT DEFAULT 'pending', error TEXT, tries INTEGER DEFAULT 0, created INTEGER, sent_at INTEGER);
CREATE INDEX IF NOT EXISTS outbox_status ON outbox(status, created);
CREATE TABLE IF NOT EXISTS pv (day TEXT NOT NULL, path TEXT NOT NULL, n INTEGER DEFAULT 0, PRIMARY KEY (day, path));
CREATE TABLE IF NOT EXISTS visitors (day TEXT NOT NULL, vid TEXT NOT NULL, PRIMARY KEY (day, vid));
CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER, kind TEXT, msg TEXT);
CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, n INTEGER NOT NULL);
