import { J, err, fail, now, rand, clean, sha256, isEmail, ip, readJson, cookie, setCookie, getContent, getKey, nextNumber, limitOrFail, rateLimit,
  newSession, sessionOf, publicUser, findOrCreateUser, hashPw, pwProblem, totpOk, dayStr, logEvent, SESSION_COOKIE, decrypt } from './lib.js';
import { sendTemplate, alertOwner } from './mail.js';
import { storageInfo, serveFile, putFile } from './storage.js';
import { quote, createOrder, verifyRazorpay, fulfil, paymentsConfig, hmacHex, deliverBig } from './shop.js';

const needUser = (s) => { if (!s) fail('Please sign in first', 401); return s; };
const needTc = (b) => { if (!b.tc) fail('Please accept the Terms & Conditions'); };

/* ---------- public site data ---------- */
export async function siteData(env) {
  const [content, cats, pf, prods, revs, revStats] = await Promise.all([
    getContent(env),
    env.DB.prepare('SELECT id, section, name, parent_id, sort, thumb FROM categories ORDER BY sort, id').all(),
    env.DB.prepare('SELECT id, kind, title, description, category_id, subcategory_id, image, video, url, orient, featured, home, sort FROM portfolio WHERE visible = 1 ORDER BY sort, id').all(),
    env.DB.prepare('SELECT id, slug, title, short, description, price, mrp, category_id, image, gallery, delivery, size_text, badge, sort, sales, created FROM products WHERE visible = 1 ORDER BY sort, id DESC').all(),
    env.DB.prepare("SELECT r.id, r.product_id, r.name, r.role, r.rating, r.text, r.featured, r.created FROM reviews r WHERE r.status = 'visible' ORDER BY r.featured DESC, r.id DESC LIMIT 200").all(),
    env.DB.prepare("SELECT COUNT(*) n, AVG(rating) avg FROM reviews WHERE status = 'visible' AND product_id IS NULL").first()
  ]);
  const pay = await paymentsConfig(env);
  return { content, categories: cats.results, portfolio: pf.results, products: prods.results, reviews: revs.results,
    reviewStats: { count: revStats?.n || 0, avg: revStats?.avg ? Math.round(revStats.avg * 10) / 10 : 0 },
    cfg: { google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET), payments: pay.provider, storage: storageInfo(env).backend } };
}

async function meData(env, s) {
  const uid = s.user.id;
  const [cart, wish, owned, orders, tickets] = await Promise.all([
    env.DB.prepare('SELECT product_id FROM cart WHERE user_id = ?1 ORDER BY added').bind(uid).all(),
    env.DB.prepare('SELECT product_id FROM wishlist WHERE user_id = ?1 ORDER BY added').bind(uid).all(),
    env.DB.prepare('SELECT product_id, downloads, created FROM owned WHERE user_id = ?1').bind(uid).all(),
    env.DB.prepare('SELECT id, number, items, subtotal, discount, total, coupon, status, events, created, paid_at, delivered_at FROM orders WHERE user_id = ?1 ORDER BY id DESC LIMIT 100').bind(uid).all(),
    env.DB.prepare('SELECT number, topic, message, status, created, solved_at FROM tickets WHERE user_id = ?1 OR email = ?2 ORDER BY id DESC LIMIT 100').bind(uid, s.user.email).all()
  ]);
  return { user: publicUser(s.user, s.isAdmin), needMfa: s.isAdmin && s.user.totp_on && !s.mfa,
    cart: cart.results.map(r => r.product_id), wishlist: wish.results.map(r => r.product_id),
    owned: owned.results, orders: orders.results.map(o => ({ ...o, items: JSON.parse(o.items || '[]'), events: JSON.parse(o.events || '[]') })), tickets: tickets.results };
}

/* ---------- OTP ---------- */
async function issueOtp(env, email, purpose, name) {
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
  await env.DB.prepare('INSERT INTO otps (email, purpose, code_hash, exp, tries, created) VALUES (?1, ?2, ?3, ?4, 0, ?5) ON CONFLICT(email, purpose) DO UPDATE SET code_hash = ?3, exp = ?4, tries = 0, created = ?5')
    .bind(email, purpose, await sha256(email + '|' + code), now() + 10 * 60e3, now()).run();
  const r = await sendTemplate(env, 'otp', email, { code, name: name || 'there' }, { ref: purpose });
  if (!r.ok) { await logEvent(env, 'otp', 'OTP mail failed: ' + r.error); await alertOwner(env, 'otp-fail', 'Login code emails are failing: ' + r.error, { throttleMin: 30 }); fail('We could not send the email right now. Please try again in a few minutes or use Google sign-in.', 503); }
}
async function checkOtp(env, email, purpose, code) {
  const row = await env.DB.prepare('SELECT * FROM otps WHERE email = ?1 AND purpose = ?2').bind(email, purpose).first();
  if (!row || row.exp < now()) fail('The code has expired. Please request a new one.');
  if (row.tries >= 5) fail('Too many wrong codes. Please request a new one.', 429);
  const ok = row.code_hash === await sha256(email + '|' + String(code || '').replace(/\D/g, ''));
  if (!ok) { await env.DB.prepare('UPDATE otps SET tries = tries + 1 WHERE email = ?1 AND purpose = ?2').bind(email, purpose).run(); fail('Wrong code. Please check your email and try again.'); }
  await env.DB.prepare('DELETE FROM otps WHERE email = ?1 AND purpose = ?2').bind(email, purpose).run();
}

export async function handlePublic(req, env, ctx, url, s) {
  const p = url.pathname, m = req.method;
  const origin = url.origin;

  if (p === '/api/site' && m === 'GET') return J(await siteData(env), 200, { 'cache-control': 'no-cache' });
  if (p === '/api/me' && m === 'GET') return J(s ? await meData(env, s) : { user: null });

  if (p === '/api/t' && m === 'POST') {
    const b = await readJson(req, 2000); const path = clean(b.p, 120).split('?')[0] || '/';
    let vid = cookie(req, 'jc_v'); const h = {};
    if (!vid || vid.length > 40) { vid = rand(12); h['set-cookie'] = setCookie('jc_v', vid, 365 * 86400); }
    const d = dayStr();
    ctx.waitUntil(env.DB.batch([
      env.DB.prepare('INSERT INTO pv (day, path, n) VALUES (?1, ?2, 1) ON CONFLICT(day, path) DO UPDATE SET n = n + 1').bind(d, path),
      env.DB.prepare('INSERT OR IGNORE INTO visitors (day, vid) VALUES (?1, ?2)').bind(d, vid)
    ]).catch(() => { }));
    return J({ ok: true }, 200, h);
  }

  /* ----- auth ----- */
  if (p === '/api/auth/otp' && m === 'POST') {
    const b = await readJson(req); const email = clean(b.email, 200).toLowerCase(); const purpose = ['login', 'reset', 'change', 'delete'].includes(b.purpose) ? b.purpose : 'login';
    if (!isEmail(email)) fail('Please enter a valid email');
    if (purpose === 'login') needTc(b);
    if ((purpose === 'change' || purpose === 'delete') && (!s || s.user.email !== email)) fail('Please sign in first', 401);
    await limitOrFail(env, 'otp:' + email, 4, 15 * 60e3, 'Too many codes requested. Please wait 15 minutes.');
    await limitOrFail(env, 'otpip:' + ip(req), 12, 15 * 60e3);
    const u = await env.DB.prepare('SELECT name FROM users WHERE email = ?1').bind(email).first();
    if (purpose === 'reset' && !u) return J({ ok: true }); // don't reveal
    await issueOtp(env, email, purpose, u?.name);
    return J({ ok: true });
  }
  if (p === '/api/auth/verify' && m === 'POST') {
    const b = await readJson(req); const email = clean(b.email, 200).toLowerCase();
    await limitOrFail(env, 'verify:' + ip(req), 20, 15 * 60e3);
    await checkOtp(env, email, 'login', b.code);
    const u = await findOrCreateUser(env, email, b.name, { tc: !!b.tc });
    if (u.disabled) fail('This account is disabled', 403);
    const ck = await newSession(env, req, u.id, 0);
    return J({ ok: true, isNew: !!u._new }, 200, { 'set-cookie': ck });
  }
  if (p === '/api/auth/login' && m === 'POST') {
    const b = await readJson(req); const email = clean(b.email, 200).toLowerCase();
    await limitOrFail(env, 'login:' + email, 8, 15 * 60e3); await limitOrFail(env, 'loginip:' + ip(req), 30, 15 * 60e3);
    const u = await env.DB.prepare('SELECT * FROM users WHERE email = ?1').bind(email).first();
    if (!u || !u.pass_hash || u.disabled || (await hashPw(env, String(b.password || ''), u.salt)) !== u.pass_hash) fail('Wrong email or password', 401);
    const ck = await newSession(env, req, u.id, 0);
    return J({ ok: true }, 200, { 'set-cookie': ck });
  }
  if (p === '/api/auth/reset' && m === 'POST') {
    const b = await readJson(req); const email = clean(b.email, 200).toLowerCase();
    const prob = pwProblem(b.password); if (prob) fail(prob);
    if (b.password !== b.confirm) fail('Passwords do not match');
    await limitOrFail(env, 'reset:' + ip(req), 10, 15 * 60e3);
    const purpose = b.purpose === 'change' ? 'change' : 'reset';
    if (purpose === 'change' && (!s || s.user.email !== email)) fail('Please sign in first', 401);
    await checkOtp(env, email, purpose, b.code);
    const u = await env.DB.prepare('SELECT id FROM users WHERE email = ?1').bind(email).first(); if (!u) fail('Account not found', 404);
    const salt = rand(16);
    await env.DB.prepare('UPDATE users SET pass_hash = ?1, salt = ?2 WHERE id = ?3').bind(await hashPw(env, b.password, salt), salt, u.id).run();
    await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(u.id).run();
    const ck = await newSession(env, req, u.id, 0);
    return J({ ok: true }, 200, { 'set-cookie': ck });
  }
  if (p === '/api/auth/mfa' && m === 'POST') {
    needUser(s); const b = await readJson(req);
    await limitOrFail(env, 'mfa:' + s.user.id, 6, 10 * 60e3);
    if (!(await totpOk(s.user.totp_secret, b.code))) fail('Wrong code', 401);
    await env.DB.prepare('UPDATE sessions SET mfa = 1 WHERE token_hash = ?1').bind(s.th).run();
    return J({ ok: true });
  }
  if (p === '/api/auth/logout' && m === 'POST') {
    if (s) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(s.th).run();
    return J({ ok: true }, 200, { 'set-cookie': setCookie(SESSION_COOKIE, '', 0) });
  }
  if (p === '/api/auth/logout-all' && m === 'POST') {
    needUser(s); await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(s.user.id).run();
    return J({ ok: true }, 200, { 'set-cookie': setCookie(SESSION_COOKIE, '', 0) });
  }

  /* ----- profile & settings ----- */
  if (p === '/api/me/profile' && m === 'POST') {
    needUser(s); const b = await readJson(req, 300000);
    const sets = [], vals = [];
    if (b.name !== undefined) { sets.push('name = ?'); vals.push(clean(b.name, 80)); }
    if (b.email_notif !== undefined) { sets.push('email_notif = ?'); vals.push(b.email_notif ? 1 : 0); }
    if (b.lang !== undefined) { sets.push('lang = ?'); vals.push(clean(b.lang, 5)); }
    if (b.currency !== undefined) { sets.push('currency = ?'); vals.push(b.currency === 'USD' ? 'USD' : 'INR'); }
    if (b.avatar !== undefined) { const a = clean(b.avatar, 300); if (a && !a.startsWith('/u/avatars/')) fail('Bad avatar'); sets.push('avatar = ?'); vals.push(a); }
    if (sets.length) await env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...vals, s.user.id).run();
    return J({ ok: true });
  }
  if (p === '/api/me/avatar' && m === 'POST') {
    needUser(s); await limitOrFail(env, 'avatar:' + s.user.id, 10, 3600e3);
    const type = req.headers.get('content-type') || ''; if (!/^image\/(jpeg|png|webp)$/.test(type)) fail('Use a JPG, PNG or WEBP image');
    const size = +(req.headers.get('content-length') || 0); if (size > 1.5 * 1024 * 1024) fail('Image too big (max 1.5 MB)', 413);
    const f = await putFile(env, { body: await req.arrayBuffer(), type, name: 'avatar.' + type.split('/')[1], folder: 'avatars', size });
    await env.DB.prepare('UPDATE users SET avatar = ?1 WHERE id = ?2').bind(f.url, s.user.id).run();
    return J({ ok: true, url: f.url });
  }
  if (p === '/api/me/delete' && m === 'POST') {
    needUser(s); const b = await readJson(req);
    await checkOtp(env, s.user.email, 'delete', b.code);
    const uid = s.user.id;
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?1').bind(uid), env.DB.prepare('DELETE FROM cart WHERE user_id = ?1').bind(uid),
      env.DB.prepare('DELETE FROM wishlist WHERE user_id = ?1').bind(uid), env.DB.prepare('DELETE FROM owned WHERE user_id = ?1').bind(uid),
      env.DB.prepare("UPDATE orders SET email = 'deleted', user_id = NULL WHERE user_id = ?1").bind(uid),
      env.DB.prepare("UPDATE reviews SET user_id = NULL WHERE user_id = ?1").bind(uid),
      env.DB.prepare('DELETE FROM users WHERE id = ?1').bind(uid)
    ]);
    return J({ ok: true }, 200, { 'set-cookie': setCookie(SESSION_COOKIE, '', 0) });
  }
  if (p === '/api/me/export' && m === 'GET') {
    needUser(s); return J(await meData(env, s), 200, { 'content-disposition': 'attachment; filename="jangidcuts-my-data.json"' });
  }

  /* ----- cart / wishlist ----- */
  if ((p === '/api/cart' || p === '/api/wishlist') && m === 'POST') {
    needUser(s); const b = await readJson(req); const table = p === '/api/cart' ? 'cart' : 'wishlist';
    const ids = (Array.isArray(b.ids) ? b.ids : [b.product_id]).map(Number).filter(Boolean).slice(0, 50);
    if (b.op === 'remove') { for (const id of ids) await env.DB.prepare(`DELETE FROM ${table} WHERE user_id = ?1 AND product_id = ?2`).bind(s.user.id, id).run(); }
    else if (b.op === 'clear') await env.DB.prepare(`DELETE FROM ${table} WHERE user_id = ?1`).bind(s.user.id).run();
    else for (const id of ids) await env.DB.prepare(`INSERT OR IGNORE INTO ${table} (user_id, product_id, added) SELECT ?1, id, ?3 FROM products WHERE id = ?2 AND visible = 1`).bind(s.user.id, id, now()).run();
    const { results } = await env.DB.prepare(`SELECT product_id FROM ${table} WHERE user_id = ?1 ORDER BY added`).bind(s.user.id).all();
    return J({ ok: true, ids: results.map(r => r.product_id) });
  }

  /* ----- checkout ----- */
  if (p === '/api/checkout/quote' && m === 'POST') { const b = await readJson(req); return J({ ok: true, ...(await quote(env, { items: b.items, coupon: b.coupon, userId: s?.user.id })) }); }
  if (p === '/api/checkout/create' && m === 'POST') {
    needUser(s); const b = await readJson(req); needTc(b);
    await limitOrFail(env, 'order:' + s.user.id, 20, 3600e3);
    return J({ ok: true, ...(await createOrder(env, req, s, b)) });
  }
  if (p === '/api/checkout/verify' && m === 'POST') {
    needUser(s); const b = await readJson(req);
    const o = await env.DB.prepare('SELECT * FROM orders WHERE number = ?1 AND user_id = ?2').bind(clean(b.order, 30), s.user.id).first(); if (!o) fail('Order not found', 404);
    if (o.provider_order !== b.razorpay_order_id || !(await verifyRazorpay(env, { order_id: b.razorpay_order_id, payment_id: b.razorpay_payment_id, signature: b.razorpay_signature }))) {
      await logEvent(env, 'payment', 'signature mismatch ' + o.number); fail('Payment could not be verified. If money was deducted, raise a ticket and we will fix it.');
    }
    await fulfil(env, o.id, { paymentId: clean(b.razorpay_payment_id, 60), origin });
    return J({ ok: true });
  }
  if (p === '/api/checkout/simulate' && m === 'POST') {
    needUser(s); if (!s.adminReady) fail('Payments are in test mode. Only the site owner can complete test orders.', 403);
    const b = await readJson(req);
    const o = await env.DB.prepare('SELECT * FROM orders WHERE number = ?1').bind(clean(b.order, 30)).first(); if (!o) fail('Order not found', 404);
    await fulfil(env, o.id, { paymentId: 'TEST-' + rand(4), origin });
    return J({ ok: true });
  }
  if (p === '/api/webhooks/razorpay' && m === 'POST') {
    const body = await req.text(); const pay = await paymentsConfig(env);
    const secret = pay.raw.webhook_secret_enc ? await decrypt(env, pay.raw.webhook_secret_enc) : '';
    if (!secret || (await hmacHex(secret, body)) !== req.headers.get('x-razorpay-signature')) return err('bad signature', 401);
    const evt = JSON.parse(body);
    const pe = evt.payload?.payment?.entity; const orderId = pe?.order_id || evt.payload?.order?.entity?.id;
    if ((evt.event === 'payment.captured' || evt.event === 'order.paid') && orderId) {
      const o = await env.DB.prepare('SELECT id FROM orders WHERE provider_order = ?1').bind(orderId).first();
      if (o) await fulfil(env, o.id, { paymentId: pe?.id || '', origin });
    }
    return J({ ok: true });
  }

  /* ----- downloads ----- */
  let mm;
  if ((mm = p.match(/^\/api\/download\/(\d+)$/)) && m === 'GET') {
    needUser(s); const pid = +mm[1];
    await limitOrFail(env, 'dl:' + s.user.id, 60, 3600e3);
    const prod = await env.DB.prepare('SELECT * FROM products WHERE id = ?1').bind(pid).first(); if (!prod) fail('Not found', 404);
    let own = await env.DB.prepare('SELECT * FROM owned WHERE user_id = ?1 AND product_id = ?2').bind(s.user.id, pid).first();
    if (!own) {
      if (prod.price > 0 || !prod.visible) fail('Buy this item first to download it', 403);
      await env.DB.prepare('INSERT OR IGNORE INTO owned (user_id, product_id, created) VALUES (?1, ?2, ?3)').bind(s.user.id, pid, now()).run();
      own = { downloads: 0 };
    }
    await env.DB.batch([
      env.DB.prepare('UPDATE owned SET downloads = downloads + 1, first_dl = COALESCE(first_dl, ?3), last_dl = ?3 WHERE user_id = ?1 AND product_id = ?2').bind(s.user.id, pid, now()),
      env.DB.prepare('UPDATE products SET downloads = downloads + 1 WHERE id = ?1').bind(pid)
    ]);
    if (prod.delivery === 'drive' || prod.delivery === 'link') {
      await limitOrFail(env, 'dlmail:' + s.user.id + ':' + pid, 3, 3600e3, 'The link was already sent. Please check your email (and spam folder).');
      await deliverBig(env, prod, s.user, origin);
      return J({ ok: true, emailed: true });
    }
    if (!prod.file_key) fail('The file for this item is not uploaded yet. Please raise a ticket.', 404);
    if (url.searchParams.get('check') === '1') return J({ ok: true, file: true, first: !own.downloads });
    return serveFile(req, env, prod.file_key, { download: prod.file_name || (prod.slug + '.zip'), cache: false });
  }

  /* ----- reviews ----- */
  if (p === '/api/reviews' && m === 'POST') {
    needUser(s); const b = await readJson(req);
    const rating = Math.max(1, Math.min(5, parseInt(b.rating) || 0)); const text = clean(b.text, 1000);
    if (!rating) fail('Pick a star rating');
    await limitOrFail(env, 'review:' + s.user.id, 5, 3600e3);
    const pid = b.product_id ? +b.product_id : null;
    if (pid) {
      const own = await env.DB.prepare('SELECT 1 FROM owned WHERE user_id = ?1 AND product_id = ?2').bind(s.user.id, pid).first();
      if (!own) fail('Only buyers can review this item', 403);
      await env.DB.prepare('DELETE FROM reviews WHERE user_id = ?1 AND product_id = ?2').bind(s.user.id, pid).run();
    } else {
      const ok = await env.DB.prepare("SELECT 1 FROM orders WHERE user_id = ?1 AND status = 'delivered' UNION SELECT 1 FROM hire WHERE email = ?2 AND status = 'approved' LIMIT 1").bind(s.user.id, s.user.email).first();
      if (!ok) fail('Reviews are open to clients and buyers', 403);
      await env.DB.prepare('DELETE FROM reviews WHERE user_id = ?1 AND product_id IS NULL').bind(s.user.id).run();
    }
    await env.DB.prepare("INSERT INTO reviews (user_id, product_id, name, role, rating, text, status, source, created) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'visible', 'user', ?7)")
      .bind(s.user.id, pid, clean(s.user.name || 'Customer', 80), pid ? 'Verified buyer' : 'Client', rating, text, now()).run();
    return J({ ok: true });
  }

  /* ----- hire / tickets ----- */
  if (p === '/api/hire' && m === 'POST') {
    const b = await readJson(req, 50000); needTc(b);
    if (b.website) return J({ ok: true }); // honeypot
    const name = clean(b.name, 100), email = clean(b.email, 200).toLowerCase();
    if (!name || !isEmail(email)) fail('Please enter your name and a valid email');
    const words = clean(b.project, 6000).split(/\s+/).filter(Boolean).length; if (words > 500) fail('Project description is over 500 words');
    await limitOrFail(env, 'hire:' + ip(req), 5, 3600e3);
    const n = await nextNumber(env, 'hire', 1001); const number = 'H-' + n;
    const data = {}; for (const k of ['whatsapp', 'country', 'agency', 'agency_name', 'agency_address', 'categories', 'category_other', 'perday', 'format', 'plan', 'budget', 'deadline', 'raw_link', 'reference', 'project']) data[k] = Array.isArray(b[k]) ? b[k].map(x => clean(x, 80)).slice(0, 40) : clean(b[k], k === 'project' ? 6000 : 300);
    await env.DB.prepare('INSERT INTO hire (number, user_id, name, email, data, status, created, ip) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)').bind(number, s?.user.id || null, name, email, JSON.stringify(data), 'new', now(), ip(req)).run();
    ctx.waitUntil((async () => {
      await sendTemplate(env, 'hire_received', email, { name, number }, { ref: number });
      await alertOwner(env, 'hire', `New Hire Me request ${number} from ${name} <${email}>\nWork: ${(data.categories || []).join(', ')} ${data.category_other || ''}\nBudget: ${data.budget}\n\n${data.project}`);
    })());
    return J({ ok: true, number });
  }
  if (p === '/api/tickets' && m === 'POST') {
    const b = await readJson(req, 20000); needTc(b);
    if (b.website) return J({ ok: true });
    const email = clean(b.email || s?.user.email, 200).toLowerCase(); const message = clean(b.message, 4000);
    if (!isEmail(email)) fail('Please enter a valid email'); if (message.length < 5) fail('Please describe the problem');
    await limitOrFail(env, 'ticket:' + ip(req), 6, 3600e3);
    const n = await nextNumber(env, 'ticket', 1042); const number = 'JC-' + n;
    const name = clean(b.name || s?.user.name || email.split('@')[0], 100);
    await env.DB.prepare('INSERT INTO tickets (number, user_id, email, name, topic, message, status, created, ip) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)').bind(number, s?.user.id || null, email, name, clean(b.topic, 80) || 'General', message, 'pending', now(), ip(req)).run();
    ctx.waitUntil((async () => {
      await sendTemplate(env, 'ticket_received', email, { name, number, message }, { account: 'support', ref: number });
      await alertOwner(env, 'ticket', `New support ticket ${number} from ${email}\n\n${message}`);
    })());
    return J({ ok: true, number });
  }

  /* ----- media ----- */
  if (p.startsWith('/u/') && (m === 'GET' || m === 'HEAD')) {
    const key = decodeURIComponent(p.slice(3));
    if (key.startsWith('private/') || key.includes('..')) return new Response('Not found', { status: 404 });
    const cache = caches.default; const ck = new Request(url.origin + p);
    if (!req.headers.get('range')) { const hit = await cache.match(ck); if (hit) return hit; }
    const res = await serveFile(req, env, key);
    if (res.status === 200 && !req.headers.get('range')) ctx.waitUntil(cache.put(ck, res.clone()));
    return res;
  }
  return null;
}
