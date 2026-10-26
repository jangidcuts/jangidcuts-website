import { J, err, fail, now, rand, clean, readJson, getContent, getKey, setKey, encrypt, decrypt, totpOk, b32enc, dayStr, logEvent, isEmail, setCookie, newRef } from './lib.js';
import { DEFAULTS } from './defaults.js';
import { sendMail, sendTemplate, fill, ACCOUNTS, expectedEmail, googleToken } from './mail.js';
import { putFile, deleteFile, storageInfo, driveId, driveMeta, streamDrivePublic } from './storage.js';
import { fulfil, money } from './shop.js';
import { handleAssistant } from './assistant.js';
import { setStatus, addThread, aiDraft, sendSolution, aiSettings, AI_DEFAULTS, timeline, threadOf, norm, LABELS } from './tickets.js';

const TABLES = {
  products: ['slug', 'title', 'short', 'description', 'price', 'mrp', 'category_id', 'image', 'gallery', 'delivery', 'file_key', 'file_name', 'file_size', 'drive_id', 'link_url', 'size_text', 'badge', 'visible', 'sort', 'video'],
  portfolio: ['kind', 'title', 'description', 'category_id', 'subcategory_id', 'image', 'video', 'url', 'orient', 'featured', 'home', 'sort', 'visible', 'services', 'source'],
  categories: ['section', 'name', 'parent_id', 'sort', 'thumb'],
  coupons: ['code', 'type', 'value', 'min_items', 'min_total', 'starts', 'expires', 'active', 'max_uses', 'note'],
  reviews: ['product_id', 'name', 'role', 'rating', 'text', 'status', 'featured', 'source', 'photo']
};
const NUM = new Set(['price', 'mrp', 'category_id', 'file_size', 'visible', 'sort', 'subcategory_id', 'featured', 'home', 'parent_id', 'value', 'min_items', 'min_total', 'starts', 'expires', 'active', 'max_uses', 'product_id', 'rating']);
const slugify = (s) => clean(s, 80).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';

function rowVals(table, b) {
  const cols = [], vals = [];
  for (const c of TABLES[table]) if (b[c] !== undefined) {
    let v = b[c];
    if (NUM.has(c)) v = (v === '' || v === null) ? null : Math.round(Number(v)) || 0;
    else if (typeof v === 'object' && v !== null) v = JSON.stringify(v);
    else v = clean(v, c === 'description' || c === 'text' ? 20000 : 1000);
    if (c === 'code') v = String(v).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if ((c === 'image' || c === 'photo' || c === 'thumb') && /drive\.google\.com|docs\.google\.com/.test(v) && driveId(v)) v = 'https://drive.google.com/thumbnail?id=' + driveId(v) + '&sz=w2000';
    cols.push(c); vals.push(v);
  }
  return { cols, vals };
}

export async function handleAdmin(req, env, ctx, url, s) {
  const p = url.pathname, m = req.method;
  if (!s || !s.isAdmin) fail('Admin only', 403);
  if (!s.adminReady && p !== '/api/admin/whoami') fail('Enter your 2-step code first', 403);
  const origin = url.origin;
  let mm;

  if (p === '/api/admin/assistant' || p.startsWith('/api/admin/assistant/')) return handleAssistant(req, env, url, s);
  if (p === '/api/admin/whoami') return J({ ok: true, email: s.user.email, mfa_needed: !s.adminReady, totp_on: !!s.user.totp_on });

  /* ----- overview / analytics ----- */
  if (p === '/api/admin/overview' && m === 'GET') {
    const d30 = dayStr(now() - 29 * 864e5), today = dayStr();
    const q = (sql, ...a) => env.DB.prepare(sql).bind(...a);
    const [pv, uv, top, rev, ordersBy, users, tix, hires, dls, revStats, recentOrders, mail, events, prodCount] = await env.DB.batch([
      q('SELECT day, SUM(n) n FROM pv WHERE day >= ?1 GROUP BY day ORDER BY day', d30),
      q('SELECT day, COUNT(*) n FROM visitors WHERE day >= ?1 GROUP BY day ORDER BY day', d30),
      q('SELECT path, SUM(n) n FROM pv WHERE day >= ?1 GROUP BY path ORDER BY n DESC LIMIT 10', d30),
      q("SELECT COALESCE(SUM(total),0) total, COUNT(*) n, COALESCE(SUM(CASE WHEN paid_at >= ?1 THEN total END),0) total30, COALESCE(SUM(CASE WHEN paid_at >= ?2 THEN total END),0) today FROM orders WHERE status = 'delivered'", now() - 30 * 864e5, new Date(today + 'T00:00:00+05:30').getTime()),
      q('SELECT status, COUNT(*) n FROM orders GROUP BY status'),
      q('SELECT COUNT(*) n, SUM(CASE WHEN created >= ?1 THEN 1 ELSE 0 END) new7, SUM(CASE WHEN last_login >= ?2 THEN 1 ELSE 0 END) today, SUM(CASE WHEN last_login >= ?1 THEN 1 ELSE 0 END) active7 FROM users', now() - 7 * 864e5, new Date(today + 'T00:00:00+05:30').getTime()),
      q("SELECT COUNT(*) n FROM tickets WHERE status = 'pending'"),
      q("SELECT COUNT(*) n FROM hire WHERE status = 'new'"),
      q('SELECT COALESCE(SUM(downloads),0) n FROM products'),
      q("SELECT COUNT(*) n, AVG(rating) avg FROM reviews WHERE status = 'visible'"),
      q('SELECT number, email, total, status, created FROM orders ORDER BY id DESC LIMIT 8'),
      q("SELECT SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) sent, SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) failed FROM outbox WHERE created >= ?1", now() - 864e5),
      q('SELECT at, kind, msg FROM events ORDER BY id DESC LIMIT 15'),
      q('SELECT COUNT(*) n, SUM(CASE WHEN price = 0 THEN 1 ELSE 0 END) free FROM products')
    ]);
    const mailMain = await getKey(env, '_mail_main'), mailSup = await getKey(env, '_mail_support');
    return J({ ok: true, pv: pv.results, uv: uv.results, top: top.results, revenue: rev.results[0], orders: ordersBy.results, users: users.results[0],
      pendingTickets: tix.results[0].n, newHires: hires.results[0].n, downloads: dls.results[0].n, reviews: { count: revStats.results[0].n, avg: Math.round((revStats.results[0].avg || 0) * 10) / 10 },
      recentOrders: recentOrders.results, mail24h: mail.results[0], events: events.results, products: prodCount.results[0],
      mail: { main: !!mailMain?.refresh_enc && mailMain.email, support: !!mailSup?.refresh_enc && mailSup.email, google: !!env.GOOGLE_CLIENT_ID },
      storage: storageInfo(env) });
  }

  /* ----- content ----- */
  if (p === '/api/admin/content' && m === 'GET') {
    const c = await getContent(env, { includePrivate: true });
    const a = c._alerts || {}; c._alerts = { email: a.email || '', telegram_chat_id: a.telegram_chat_id || '', telegram_set: !!a.telegram_bot_token_enc };
    const pay = c._payments || {}; c._payments = { provider: pay.provider || 'test', key_id: pay.key_id || '', secret_set: !!pay.key_secret_enc, webhook_set: !!pay.webhook_secret_enc };
    delete c._mail_main; delete c._mail_support;
    return J({ ok: true, content: c, defaults: Object.keys(DEFAULTS) });
  }
  if ((mm = p.match(/^\/api\/admin\/content\/([a-z_]+)$/)) && m === 'PUT') {
    const key = mm[1]; if (!(key in DEFAULTS) || key.startsWith('_')) fail('Unknown section');
    const b = await readJson(req, 500000); if (b.value === undefined) fail('Missing value');
    await setKey(env, key, b.value); await logEvent(env, 'admin', `${s.user.email} edited ${key}`);
    return J({ ok: true });
  }
  if ((mm = p.match(/^\/api\/admin\/content\/([a-z_]+)\/reset$/)) && m === 'POST') {
    const key = mm[1]; if (!(key in DEFAULTS) || key.startsWith('_')) fail('Unknown section');
    await env.DB.prepare('DELETE FROM kv WHERE k = ?1').bind(key).run(); return J({ ok: true });
  }
  if (p === '/api/admin/alerts' && m === 'PUT') {
    const b = await readJson(req); const a = await getKey(env, '_alerts');
    if (b.email !== undefined) { if (b.email && !isEmail(b.email)) fail('Bad email'); a.email = clean(b.email, 200); }
    if (b.telegram_chat_id !== undefined) a.telegram_chat_id = clean(b.telegram_chat_id, 40);
    if (b.telegram_bot_token) a.telegram_bot_token_enc = await encrypt(env, clean(b.telegram_bot_token, 200));
    if (b.telegram_clear) a.telegram_bot_token_enc = '';
    await setKey(env, '_alerts', a); return J({ ok: true });
  }
  if (p === '/api/admin/drive/check' && m === 'GET') {
    const id = driveId(url.searchParams.get('link') || ''); if (!id) fail('That does not look like a Google Drive file link');
    const tok = await googleToken(env, 'main');
    const meta = tok ? await driveMeta(env, tok, id) : null;
    if (!meta) { const pub = await streamDrivePublic(new Request(url.origin + '/v/check', { headers: { range: 'bytes=0-1023' } }), id);
      if (pub) { try { await pub.body?.cancel(); } catch {} return J({ ok: true, id, name: 'Public Drive video', mimeType: pub.headers.get('content-type'), sharing: 'public' }); }
      if (!tok) fail('Drive file is not accessible. Set sharing to Anyone with the link, or connect jangidcuts@gmail.com in Emails.');
      const rr = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=name&supportsAllDrives=true`, { headers: { authorization: 'Bearer ' + tok } }); const tx = (await rr.text()).slice(0, 300);
      await logEvent(env, 'drive', 'check failed ' + rr.status + ' ' + tx);
      fail(rr.status === 403 && /insufficient|scope/i.test(tx) ? 'Drive access is not allowed yet: reconnect jangidcuts@gmail.com in Emails and tick the Google Drive box.' : 'Drive file not found, or jangidcuts@gmail.com cannot open it. Make sure it is in that Drive or shared with it. (' + rr.status + ')'); }
    return J({ ok: true, id, ...meta });
  }
  if (p === '/api/admin/security' && m === 'PUT') {
    const b = await readJson(req); const sec = await getKey(env, '_security');
    sec.admin_2fa = b.admin_2fa !== false;
    await setKey(env, '_security', sec); await logEvent(env, 'security', 'admin 2-step ' + (sec.admin_2fa ? 'ON' : 'OFF') + ' by ' + s.user.email);
    return J({ ok: true, admin_2fa: sec.admin_2fa });
  }
  if (p === '/api/admin/payments' && m === 'PUT') {
    const b = await readJson(req); const pay = await getKey(env, '_payments');
    if (b.provider) pay.provider = b.provider === 'razorpay' ? 'razorpay' : 'test';
    if (b.key_id !== undefined) pay.key_id = clean(b.key_id, 80);
    if (b.key_secret) pay.key_secret_enc = await encrypt(env, clean(b.key_secret, 200));
    if (b.webhook_secret) pay.webhook_secret_enc = await encrypt(env, clean(b.webhook_secret, 200));
    await setKey(env, '_payments', pay); await logEvent(env, 'admin', `${s.user.email} changed payment settings`);
    return J({ ok: true });
  }

  /* ----- generic CRUD ----- */
  if ((mm = p.match(/^\/api\/admin\/(products|portfolio|categories|coupons|reviews)(?:\/(\d+))?$/))) {
    const table = mm[1], id = mm[2] ? +mm[2] : null;
    if (m === 'GET' && !id) {
      const order = table === 'reviews' || table === 'coupons' ? 'id DESC' : 'sort, id';
      const { results } = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY ${order} LIMIT 2000`).all();
      return J({ ok: true, items: results });
    }
    if (m === 'POST' && !id) {
      const b = await readJson(req, 300000);
      if (table === 'products') { if (!clean(b.title)) fail('Title is required'); b.slug = slugify(b.slug || b.title) + '-' + rand(2); b.price = Math.max(0, +b.price || 0); b.visible = +b.visible === 1 ? 1 : 0; }
      if (table === 'coupons' && !b.code) fail('Code is required');
      if (table === 'categories' && (!b.name || !b.section)) fail('Name and section are required');
      if (table === 'reviews') { b.source = 'admin'; if (!b.rating) b.rating = 5; }
      const { cols, vals } = rowVals(table, b);
      if (table === 'products' || table === 'portfolio' || table === 'coupons' || table === 'reviews') { cols.push('created'); vals.push(now()); }
      if (table === 'products') { cols.push('updated'); vals.push(now()); }
      const r = await env.DB.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')}) RETURNING id`).bind(...vals).first();
      return J({ ok: true, id: r.id });
    }
    if (m === 'PUT' && id) {
      const b = await readJson(req, 300000);
      if (table === 'products' && b.slug !== undefined) b.slug = slugify(b.slug);
      const { cols, vals } = rowVals(table, b); if (!cols.length) fail('Nothing to change');
      if (table === 'products') { cols.push('updated'); vals.push(now()); }
      await env.DB.prepare(`UPDATE ${table} SET ${cols.map(c => c + ' = ?').join(', ')} WHERE id = ?`).bind(...vals, id).run();
      return J({ ok: true });
    }
    if (m === 'DELETE' && id) {
      if (table === 'categories') await env.DB.prepare('UPDATE categories SET parent_id = NULL WHERE parent_id = ?1').bind(id).run();
      await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?1`).bind(id).run();
      return J({ ok: true });
    }
  }
  if (p === '/api/admin/reorder' && m === 'POST') {
    const b = await readJson(req); const table = b.table; if (!['products', 'portfolio', 'categories'].includes(table)) fail('Bad table');
    const ids = (b.ids || []).map(Number).slice(0, 2000);
    await env.DB.batch(ids.map((id, i) => env.DB.prepare(`UPDATE ${table} SET sort = ?1 WHERE id = ?2`).bind(i, id)));
    return J({ ok: true });
  }

  /* ----- media ----- */
  if (p === '/api/admin/upload' && m === 'POST') {
    const size = +(req.headers.get('content-length') || 0);
    const folder = ['media', 'portfolio', 'products', 'private', 'hero', 'services'].includes(url.searchParams.get('folder')) ? url.searchParams.get('folder') : 'media';
    const f = await putFile(env, { body: req.body, type: req.headers.get('content-type'), name: url.searchParams.get('name') || 'file', folder, size });
    return J({ ok: true, ...f });
  }
  /* ----- resume PDF (public at /resume + /resume.pdf; one current file, replaced on upload) ----- */
  if (p === '/api/admin/resume' && m === 'GET') { const r = await getKey(env, '_resume'); return J({ ok: true, resume: r && r.key ? { name: r.name, size: r.size, updated: r.updated, url: '/resume.pdf?v=' + r.updated } : null }); }
  if (p === '/api/admin/resume' && m === 'POST') {
    const len = +(req.headers.get('content-length') || 0);
    if (len > 10 * 1024 * 1024) fail('This PDF is bigger than 10 MB. Please upload a smaller file.', 413);
    const buf = await req.arrayBuffer();
    if (!buf.byteLength) fail('Empty file.');
    if (buf.byteLength > 10 * 1024 * 1024) fail('This PDF is bigger than 10 MB. Please upload a smaller file.', 413);
    const head = new TextDecoder().decode(new Uint8Array(buf, 0, Math.min(1024, buf.byteLength)));
    if (head.indexOf('%PDF-') === -1) fail('Only PDF files can be uploaded as the resume.');
    let name = clean(url.searchParams.get('name') || 'Prashant_Jangid_Resume.pdf', 120).replace(/[^\w.\- ]+/g, '_');
    if (!/\.pdf$/i.test(name)) name += '.pdf';
    const prev = await getKey(env, '_resume');
    const f = await putFile(env, { body: buf, type: 'application/pdf', name, folder: 'resume', size: buf.byteLength });
    const rec = { key: f.key, name, size: buf.byteLength, updated: now() };
    await setKey(env, '_resume', rec);
    if (prev && prev.key && prev.key !== f.key) { try { await deleteFile(env, prev.key); } catch { } }
    await logEvent(env, 'admin', 'resume PDF replaced by ' + s.user.email + ' (' + name + ', ' + buf.byteLength + ' bytes)');
    return J({ ok: true, resume: { name, size: rec.size, updated: rec.updated, url: '/resume.pdf?v=' + rec.updated } });
  }
  if (p === '/api/admin/media' && m === 'GET') {
    const { results } = await env.DB.prepare("SELECT * FROM media WHERE folder NOT IN ('avatars', 'resume') ORDER BY created DESC LIMIT 500").all();
    const tot = await env.DB.prepare('SELECT COALESCE(SUM(size),0) n FROM media').first();
    return J({ ok: true, items: results, used: tot.n, storage: storageInfo(env) });
  }
  if (p === '/api/admin/media' && m === 'DELETE') { const b = await readJson(req); await deleteFile(env, clean(b.key, 300)); return J({ ok: true }); }

  /* ----- orders ----- */
  if (p === '/api/admin/orders' && m === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 1000').all();
    return J({ ok: true, items: results.map(o => ({ ...o, items: JSON.parse(o.items || '[]'), events: JSON.parse(o.events || '[]') })) });
  }
  if ((mm = p.match(/^\/api\/admin\/orders\/(\d+)$/)) && m === 'POST') {
    const b = await readJson(req); const o = await env.DB.prepare('SELECT * FROM orders WHERE id = ?1').bind(+mm[1]).first(); if (!o) fail('Not found', 404);
    if (b.action === 'mark_paid') { await fulfil(env, o.id, { paymentId: 'MANUAL', origin }); return J({ ok: true }); }
    if (b.action === 'refund' || b.action === 'cancel') {
      const refundRef = b.action === 'refund' ? await newRef(env, 'REF') : null;
      const ev = JSON.parse(o.events || '[]'); ev.push(refundRef ? { s: 'Refunded', at: now(), ref: refundRef } : { s: 'Cancelled', at: now() });
      await env.DB.prepare('UPDATE orders SET status = ?1, events = ?2 WHERE id = ?3').bind(b.action === 'refund' ? 'refunded' : 'cancelled', JSON.stringify(ev), o.id).run();
      if (b.action === 'refund' && o.user_id) await env.DB.prepare('DELETE FROM owned WHERE order_id = ?1').bind(o.id).run();
      await sendTemplate(env, 'order_status', o.email, { name: 'there', number: o.number, status: b.action === 'refund' ? 'Refunded' : 'Cancelled', refund: refundRef ? '\nRefund reference: ' + refundRef : '', link: origin + '/orders' }, { ref: refundRef || o.number });
      if (refundRef) await env.DB.prepare('UPDATE orders SET note = trim(COALESCE(note, \'\') || ?1) WHERE id = ?2').bind(' Refund ' + refundRef, o.id).run();
      return J({ ok: true, refund: refundRef });
    }
    if (b.action === 'note') { await env.DB.prepare('UPDATE orders SET note = ?1 WHERE id = ?2').bind(clean(b.note, 1000), o.id).run(); return J({ ok: true }); }
    fail('Unknown action');
  }

  /* ----- users ----- */
  if (p === '/api/admin/users' && m === 'GET') {
    const { results } = await env.DB.prepare('SELECT u.id, u.email, u.name, u.role, u.disabled, u.created, u.last_login, u.email_notif, (u.pass_hash IS NOT NULL) has_pw, (u.google_sub IS NOT NULL) google, (SELECT COUNT(*) FROM owned o WHERE o.user_id = u.id) owned FROM users u ORDER BY u.id DESC LIMIT 2000').all();
    return J({ ok: true, items: results });
  }
  if ((mm = p.match(/^\/api\/admin\/users\/(\d+)$/)) && m === 'POST') {
    const b = await readJson(req); const id = +mm[1]; if (id === s.user.id) fail('You cannot change your own account here');
    if (b.action === 'disable' || b.action === 'enable') { await env.DB.prepare('UPDATE users SET disabled = ?1 WHERE id = ?2').bind(b.action === 'disable' ? 1 : 0, id).run(); if (b.action === 'disable') await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(id).run(); }
    else if (b.action === 'grant') { const pid = +b.product_id; await env.DB.prepare('INSERT OR IGNORE INTO owned (user_id, product_id, created) VALUES (?1, ?2, ?3)').bind(id, pid, now()).run(); }
    else fail('Unknown action');
    return J({ ok: true });
  }

  /* ----- client desk: hire + tickets ----- */
  if (p === '/api/admin/hire' && m === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM hire ORDER BY id DESC LIMIT 1000').all();
    return J({ ok: true, items: results.map(h => ({ ...h, data: JSON.parse(h.data || '{}') })) });
  }
  if ((mm = p.match(/^\/api\/admin\/hire\/(\d+)$/)) && m === 'POST') {
    const b = await readJson(req, 30000); const h = await env.DB.prepare('SELECT * FROM hire WHERE id = ?1').bind(+mm[1]).first(); if (!h) fail('Not found', 404);
    if (b.action === 'approve') {
      const r = await sendTemplate(env, 'hire_approved', h.email, { name: h.name, number: h.number }, { ref: h.number });
      await env.DB.prepare("UPDATE hire SET status = 'approved', approved_at = ?1 WHERE id = ?2").bind(now(), h.id).run();
      return J({ ok: true, mailed: r.ok, mailError: r.error || null });
    }
    if (b.action === 'reject' || b.action === 'done' || b.action === 'new') { await env.DB.prepare('UPDATE hire SET status = ?1 WHERE id = ?2').bind(b.action === 'new' ? 'new' : b.action === 'done' ? 'done' : 'rejected', h.id).run(); return J({ ok: true }); }
    if (b.action === 'note') { await env.DB.prepare('UPDATE hire SET note = ?1 WHERE id = ?2').bind(clean(b.note, 2000), h.id).run(); return J({ ok: true }); }
    if (b.action === 'email') { const r = await sendMail(env, { account: 'main', to: h.email, subject: clean(b.subject, 200) || 'Re: your project ' + h.number, body: clean(b.body, 10000), kind: 'hire_reply', ref: h.number }); return J({ ok: r.ok, error: r.error }); }
    if (b.action === 'delete') { await env.DB.prepare('DELETE FROM hire WHERE id = ?1').bind(h.id).run(); return J({ ok: true }); }
    fail('Unknown action');
  }
  if (p === '/api/admin/tickets' && m === 'GET') { const { results } = await env.DB.prepare("SELECT * FROM tickets ORDER BY (status IN ('pending','received','read','processing')) DESC, id DESC LIMIT 1000").all(); return J({ ok: true, items: results.map(t => ({ ...t, status: norm(t.status) })) }); }
  if (p === '/api/admin/ai' && m === 'GET') { const c = await aiSettings(env); return J({ ok: true, settings: { instructions: c.instructions, enabled: c.enabled !== false }, available: !!env.AI }); }
  if (p === '/api/admin/ai' && m === 'POST') { const b = await readJson(req, 20000); const cur = (await getKey(env, '_ai_support')) || {}; await setKey(env, '_ai_support', { ...cur, instructions: clean(b.instructions, 4000), enabled: b.enabled !== false }); return J({ ok: true }); }
  if ((mm = p.match(/^\/api\/admin\/tickets\/(\d+)$/)) && m === 'GET') {
    let t = await env.DB.prepare('SELECT * FROM tickets WHERE id = ?1').bind(+mm[1]).first(); if (!t) fail('Not found', 404);
    let autoRead = null;
    if (norm(t.status) === 'received') { autoRead = await setStatus(env, t, 'read', { origin: url.origin, by: 'auto' }); t = await env.DB.prepare('SELECT * FROM tickets WHERE id = ?1').bind(t.id).first(); }
    return J({ ok: true, ticket: { ...t, status: norm(t.status), steps: timeline(t), thread: threadOf(t) }, autoRead });
  }
  if ((mm = p.match(/^\/api\/admin\/tickets\/(\d+)$/)) && m === 'POST') {
    const b = await readJson(req, 30000); const t = await env.DB.prepare('SELECT * FROM tickets WHERE id = ?1').bind(+mm[1]).first(); if (!t) fail('Not found', 404);
    if (b.action === 'status') {
      const st = String(b.status || ''); if (!LABELS[st] || st === 'solved') fail(st === 'solved' ? 'Send a solution to mark it Solution delivered' : 'Unknown status');
      const r = await setStatus(env, t, st, { origin: url.origin, mail: b.mail !== false });
      return J({ ok: true, ...r });
    }
    if (b.action === 'solve') {
      const solution = clean(b.solution, 10000); if (!solution) fail('Write the solution first');
      try { await sendSolution(env, t, solution, { origin: url.origin, by: 'admin' }); return J({ ok: true, mailed: true }); }
      catch (e) { return J({ ok: false, mailed: false, mailError: e.message, error: e.message }); }
    }
    if (b.action === 'ai_draft') {
      try { const d = await aiDraft(env, t); return J({ ok: true, text: d.text, model: d.model }); }
      catch (e) { return J({ ok: false, error: e.message }); }
    }
    if (b.action === 'ai_send') {
      let text = clean(b.text, 10000), model = 'edited';
      try {
        if (!text) { const d = await aiDraft(env, t); text = d.text; model = d.model; }
        await sendSolution(env, t, text, { origin: url.origin, by: 'ai', model });
        return J({ ok: true, mailed: true, text });
      } catch (e) { return J({ ok: false, error: e.message }); }
    }
    if (b.action === 'reopen') { const r = await setStatus(env, t, 'processing', { origin: url.origin, mail: false }); await addThread(env, t, { by: 'admin', kind: 'reopened' }); return J({ ok: true, ...r }); }
    if (b.action === 'delete') { await env.DB.prepare('DELETE FROM tickets WHERE id = ?1').bind(t.id).run(); return J({ ok: true }); }
    fail('Unknown action');
  }

  /* ----- mail ----- */
  if (p === '/api/admin/mail' && m === 'GET') {
    const accts = {};
    for (const k of Object.keys(ACCOUNTS)) { const a = await getKey(env, ACCOUNTS[k].key) || {}; accts[k] = { expected: expectedEmail(env, k), email: a.email || '', connected: !!a.refresh_enc, connected_at: a.connected_at || null, last_error: a.last_error || null }; }
    const { results } = await env.DB.prepare('SELECT id, account, to_addr, subject, kind, status, error, created, sent_at FROM outbox ORDER BY id DESC LIMIT 100').all();
    return J({ ok: true, accounts: accts, outbox: results, google: !!env.GOOGLE_CLIENT_ID });
  }
  if (p === '/api/admin/mail/test' && m === 'POST') {
    const b = await readJson(req); const account = b.account === 'support' ? 'support' : 'main';
    const r = await sendMail(env, { account, to: clean(b.to, 200) || s.user.email, subject: 'Test email from your Jangid Cuts website', body: 'This is a test email from your website (' + account + ' account). If you can read this, site emails are working.', kind: 'test' });
    return J(r);
  }
  if (p === '/api/admin/mail/disconnect' && m === 'POST') { const b = await readJson(req); const k = b.account === 'support' ? 'support' : 'main'; await env.DB.prepare('DELETE FROM kv WHERE k = ?1').bind(ACCOUNTS[k].key).run(); if (env.CACHE) await env.CACHE.delete('gtok:' + k); return J({ ok: true }); }
  if (p === '/api/admin/mail/send' && m === 'POST') {
    const b = await readJson(req, 30000); if (!isEmail(b.to)) fail('Bad email');
    return J(await sendMail(env, { account: b.account === 'support' ? 'support' : 'main', to: b.to, subject: clean(b.subject, 200), body: clean(b.body, 10000), kind: 'manual' }));
  }
  if (p === '/api/admin/broadcast' && m === 'POST') {
    const b = await readJson(req, 30000); if (!b.subject || !b.body) fail('Subject and message are required');
    const { results } = await env.DB.prepare('SELECT email, name FROM users WHERE email_notif = 1 AND disabled = 0 LIMIT 400').all();
    if (b.dry) return J({ ok: true, count: results.length });
    let sent = 0; for (const u of results) { const r = await sendMail(env, { to: u.email, subject: clean(b.subject, 200), body: fill(clean(b.body, 10000), { name: u.name || 'there' }) + '\n\n—\nYou get this because email notifications are on in your Jangid Cuts settings. Turn them off any time in Settings.', kind: 'broadcast' }); if (r.ok) sent++; }
    return J({ ok: true, sent, total: results.length });
  }

  /* ----- security ----- */
  if (p === '/api/admin/totp/setup' && m === 'POST') {
    const secret = b32enc(crypto.getRandomValues(new Uint8Array(20)));
    await env.DB.prepare('UPDATE users SET totp_pending = ?1 WHERE id = ?2').bind(secret, s.user.id).run();
    return J({ ok: true, secret, uri: `otpauth://totp/Jangid%20Cuts:${encodeURIComponent(s.user.email)}?secret=${secret}&issuer=Jangid%20Cuts` });
  }
  if (p === '/api/admin/totp/enable' && m === 'POST') {
    const b = await readJson(req); const u = await env.DB.prepare('SELECT totp_pending FROM users WHERE id = ?1').bind(s.user.id).first();
    if (!u?.totp_pending || !(await totpOk(u.totp_pending, b.code))) fail('Wrong code. Check the time on your phone and try again.');
    await env.DB.prepare('UPDATE users SET totp_secret = totp_pending, totp_pending = NULL, totp_on = 1 WHERE id = ?1').bind(s.user.id).run();
    await env.DB.prepare('UPDATE sessions SET mfa = 1 WHERE token_hash = ?1').bind(s.th).run();
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?1 AND token_hash != ?2').bind(s.user.id, s.th).run();
    return J({ ok: true });
  }
  if (p === '/api/admin/totp/disable' && m === 'POST') {
    const b = await readJson(req); if (!(await totpOk(s.user.totp_secret, b.code))) fail('Wrong code');
    await env.DB.prepare('UPDATE users SET totp_on = 0, totp_secret = NULL WHERE id = ?1').bind(s.user.id).run(); return J({ ok: true });
  }
  if (p === '/api/admin/sessions' && m === 'GET') { const { results } = await env.DB.prepare('SELECT created, exp, ua, ip, (token_hash = ?2) current FROM sessions WHERE user_id = ?1 ORDER BY created DESC').bind(s.user.id, s.th).all(); return J({ ok: true, items: results }); }

  /* ----- backup ----- */
  if (p === '/api/admin/export' && m === 'GET') {
    const out = { exported_at: new Date().toISOString() };
    for (const t of ['kv', 'categories', 'portfolio', 'products', 'coupons', 'orders', 'owned', 'reviews', 'hire', 'tickets', 'media']) {
      const { results } = await env.DB.prepare(`SELECT * FROM ${t}`).all();
      out[t] = t === 'kv' ? results.filter(r => !r.k.startsWith('_')) : results;
    }
    const { results: users } = await env.DB.prepare('SELECT id, email, name, role, created, last_login, email_notif FROM users').all(); out.users = users;
    return J(out, 200, { 'content-disposition': `attachment; filename="jangidcuts-backup-${dayStr()}.json"` });
  }
  return null;
}

/* ----- Google OAuth (sign-in + Gmail connect) ----- */
export async function handleGoogle(req, env, url, s, deps) {
  const p = url.pathname, origin = url.origin;
  const { newSession, findOrCreateUser, cookie } = deps;
  const redirect = (to, h = {}) => new Response(null, { status: 302, headers: { location: to, ...h } });
  if (!env.GOOGLE_CLIENT_ID) return redirect('/login?error=google_not_ready');
  const safeNext = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//')) ? n.slice(0, 200) : '/';

  if (p === '/auth/google/start') {
    const state = rand(16); const next = safeNext(url.searchParams.get('next'));
    const q = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: origin + '/auth/google/callback', response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' });
    return redirect('https://accounts.google.com/o/oauth2/v2/auth?' + q, { 'set-cookie': setCookie('jc_gs', state + '|' + next + '|' + (url.searchParams.get('tc') ? 1 : 0), 600) });
  }
  if (p === '/admin/mail/connect') {
    const account = url.searchParams.get('account') === 'support' ? 'support' : 'main';
    const viaToken = env.SETUP_TOKEN && url.searchParams.get('setup') && url.searchParams.get('setup') === env.SETUP_TOKEN;
    if (!viaToken && !(s && s.adminReady)) return redirect('/admin?error=login_first');
    const state = rand(16);
    const scope = 'openid email https://www.googleapis.com/auth/gmail.send' + (account === 'main' ? ' https://www.googleapis.com/auth/drive' : '');
    const q = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: origin + '/admin/mail/callback', response_type: 'code', scope, state, access_type: 'offline', prompt: 'consent', login_hint: expectedEmail(env, account), include_granted_scopes: 'true' });
    return redirect('https://accounts.google.com/o/oauth2/v2/auth?' + q, { 'set-cookie': setCookie('jc_ms', state + '|' + account, 600) });
  }
  const exchange = async (code, redirect_uri) => {
    const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri, grant_type: 'authorization_code' }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error_description || j.error || 'token exchange failed');
    const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(j.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))));
    if (payload.aud !== env.GOOGLE_CLIENT_ID) throw new Error('bad audience');
    return { tokens: j, profile: payload };
  };
  if (p === '/auth/google/callback') {
    const [state, next, tc] = (cookie(req, 'jc_gs') || '').split('|');
    if (!state || state !== url.searchParams.get('state')) return redirect('/login?error=state');
    if (url.searchParams.get('error')) return redirect('/login?error=cancelled');
    try {
      const { profile } = await exchange(url.searchParams.get('code'), origin + '/auth/google/callback');
      if (!profile.email || !profile.email_verified) return redirect('/login?error=unverified');
      const u = await findOrCreateUser(env, profile.email, profile.name, { tc: tc === '1', google_sub: profile.sub, avatar: null });
      if (u.disabled) return redirect('/login?error=disabled');
      if (!u.google_sub) await env.DB.prepare('UPDATE users SET google_sub = ?1 WHERE id = ?2').bind(profile.sub, u.id).run();
      const ck = await newSession(env, req, u.id, 0);
      const h = new Headers({ location: safeNext(next) }); h.append('set-cookie', ck); h.append('set-cookie', setCookie('jc_gs', '', 0));
      return new Response(null, { status: 302, headers: h });
    } catch (e) { await logEvent(env, 'auth', 'google login failed: ' + e.message); return redirect('/login?error=google'); }
  }
  if (p === '/admin/mail/callback') {
    const [state, account] = (cookie(req, 'jc_ms') || '').split('|');
    if (!state || state !== url.searchParams.get('state')) return redirect('/admin#mail?error=state');
    if (url.searchParams.get('error')) return redirect('/admin#mail?error=' + encodeURIComponent(url.searchParams.get('error')));
    try {
      const { tokens, profile } = await exchange(url.searchParams.get('code'), origin + '/admin/mail/callback');
      const want = expectedEmail(env, account);
      if (String(profile.email).toLowerCase() !== want) return redirect('/admin#mail?error=' + encodeURIComponent('Please choose ' + want));
      if (!tokens.refresh_token) return redirect('/admin#mail?error=no_refresh_token');
      if (!String(tokens.scope || '').includes('gmail.send')) return redirect('/admin#mail?error=' + encodeURIComponent('Please tick the box that lets the site send email, then try again'));
      await setKey(env, ACCOUNTS[account].key, { email: want, refresh_enc: await encrypt(env, tokens.refresh_token), scopes: tokens.scope, connected_at: now() });
      if (env.CACHE) await env.CACHE.put('gtok:' + account, tokens.access_token, { expirationTtl: 3000 });
      await logEvent(env, 'mail', `${account} mail connected (${want})`);
      return redirect('/admin#mail?connected=' + account, { 'set-cookie': setCookie('jc_ms', '', 0) });
    } catch (e) { await logEvent(env, 'mail', 'connect failed: ' + e.message); return redirect('/admin#mail?error=' + encodeURIComponent(e.message)); }
  }
  return null;
}
