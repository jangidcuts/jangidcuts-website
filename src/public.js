import { J, err, fail, now, rand, clean, sha256, isEmail, ip, readJson, cookie, setCookie, getContent, getKey, nextNumber, newRef, limitOrFail, rateLimit,
  newSession, sessionOf, publicUser, findOrCreateUser, hashPw, pwProblem, totpOk, dayStr, logEvent, SESSION_COOKIE, decrypt, normRef, parseRef, refClosed } from './lib.js';
import { publicHire, hireKind, hireStatus } from './hire.js';
import { rankTop, homeSet, statsOf, reviewOpen } from './reviews.js';
import { sendTemplate, alertOwner, googleToken } from './mail.js';
import { publicTicket, norm, maskEmail } from './tickets.js';
import { storageInfo, serveFile, putFile, driveId, streamDrive, streamDrivePublic, streamVideoSource } from './storage.js';
import { upiDetails, upiSubmit } from './upi.js';
import { quote, createOrder, verifyRazorpay, fulfil, paymentsConfig, hmacHex, deliverBig, withPrice, firstOffer, isFirstBuyer } from './shop.js';

/* what the client sees of their own project review (never the private link token) */
const hireReviewView = (h) => ({ open: reviewOpen(h), name: h.rv_name || h.name || '', rating: h.rv_rating || 0, text: h.rv_text || '', hidden: h.rv_status === 'hidden' });
const needUser = (s) => { if (!s) fail('Please sign in first', 401); return s; };
const needTc = (b) => { if (!b.tc) fail('Please accept the Terms & Conditions'); };

/* ---------- public site data ---------- */
export async function siteData(env) {
  const [content, cats, pf, prods, revs] = await Promise.all([
    getContent(env),
    env.DB.prepare('SELECT id, section, name, parent_id, sort, thumb FROM categories ORDER BY sort, id').all(),
    env.DB.prepare('SELECT id, kind, title, description, category_id, subcategory_id, image, video, url, orient, featured, home, sort, services, source FROM portfolio WHERE visible = 1 ORDER BY sort, id').all(),
    env.DB.prepare('SELECT id, slug, title, short, description, price, mrp, price_mode, disc_type, disc_value, category_id, image, gallery, delivery, size_text, badge, sort, sales, created, CASE WHEN length(video) > 0 THEN 1 ELSE 0 END has_video, CASE WHEN instr(video, \'youtu\') > 0 THEN video ELSE NULL END video_yt FROM products WHERE visible = 1 ORDER BY sort, id DESC').all(),
    env.DB.prepare("SELECT r.id, r.product_id, r.name, r.role, r.rating, r.text, r.status, r.source, r.pick, r.reply, r.created, r.updated, COALESCE(NULLIF(r.photo, ''), NULLIF(u.avatar, '')) photo FROM reviews r LEFT JOIN users u ON u.id = r.user_id WHERE r.status = 'visible' ORDER BY r.id DESC LIMIT 1000").all()
  ]);
  /* Reviews v2: the server picks every "top" list (pinned first, then most stars, then latest) and every average */
  const pubRev = r => ({ id: r.id, product_id: r.product_id, name: r.name, role: r.role, rating: r.rating, text: r.text, reply: r.reply || '', created: r.updated || r.created, photo: r.photo, verified: r.source === 'client' ? 'client' : r.source === 'user' && r.product_id ? 'buyer' : '' });
  const allRev = revs.results || [], hs = homeSet(allRev), byProd = {};
  for (const r of allRev) if (r.product_id) (byProd[r.product_id] = byProd[r.product_id] || []).push(r);
  const prodRev = [];
  for (const k in byProd) for (const r of byProd[k]) prodRev.push(pubRev(r));
  const revStats = statsOf(hs.list);
  const pay = await paymentsConfig(env);
  return { content, categories: cats.results, portfolio: pf.results.map(x => { let sv = []; try { sv = JSON.parse(x.services || '[]'); } catch { } const yt = /youtu\.?be/i.test(x.url || ''); const did = !yt ? driveId(x.url) : '';
    // Drive / direct links stream through /v/<id>; the raw link is not sent to visitors (only YouTube ids are needed client-side)
    return { ...x, url: yt ? x.url : '', has_src: !!(x.url || x.video) ? 1 : 0, fb: did, services: Array.isArray(sv) ? sv : [] }; }), products: prods.results.map(x => { const { price_mode, disc_type, disc_value, ...r } = withPrice(x, content.store || {}); const pr = byProd[x.id] || []; const st = statsOf(pr); r.rating = st.count ? st : null; r.top = rankTop(pr).map(v => v.id); return r; }), firstOffer: firstOffer(content.store || {}),
    reviews: prodRev, homeReviews: rankTop(hs.list).map(pubRev), homeReal: hs.real,
    reviewStats: { count: revStats.count, avg: revStats.avg },
    cfg: { google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET), payments: pay.provider, storage: storageInfo(env).backend } };
}

async function meData(env, s) {
  const uid = s.user.id;
  const [cart, wish, owned, orders, tickets, hires, dld, myRev] = await Promise.all([
    env.DB.prepare('SELECT product_id FROM cart WHERE user_id = ?1 ORDER BY added').bind(uid).all(),
    env.DB.prepare('SELECT product_id FROM wishlist WHERE user_id = ?1 ORDER BY added').bind(uid).all(),
    env.DB.prepare('SELECT product_id, downloads, created FROM owned WHERE user_id = ?1').bind(uid).all(),
    env.DB.prepare('SELECT id, number, items, subtotal, discount, total, coupon, status, provider, payment_id, events, created, paid_at, delivered_at, meta FROM orders WHERE user_id = ?1 ORDER BY id DESC LIMIT 100').bind(uid).all(),
    env.DB.prepare('SELECT number, topic, message, status, created, solved_at, read_at, events, solution, type FROM tickets WHERE user_id = ?1 OR email = ?2 ORDER BY id DESC LIMIT 100').bind(uid, s.user.email).all(),
    env.DB.prepare('SELECT h.id, h.number, h.data, h.status, h.kind, h.events, h.created, h.approved_at, h.review_open, h.name, r.rating rv_rating, r.text rv_text, r.name rv_name, r.status rv_status FROM hire h LEFT JOIN reviews r ON r.hire_id = h.id WHERE h.user_id = ?1 OR h.email = ?2 ORDER BY h.id DESC LIMIT 100').bind(uid, s.user.email).all(),
    env.DB.prepare('SELECT DISTINCT order_id FROM owned WHERE user_id = ?1 AND downloads > 0').bind(uid).all(),
    env.DB.prepare('SELECT id, product_id, rating, text, status, created FROM reviews WHERE user_id = ?1 AND product_id IS NOT NULL').bind(uid).all()
  ]);
  const dl = new Set((dld.results || []).map(r => r.order_id));
  return { user: publicUser(s.user, s.isAdmin), needMfa: !!s.need2fa,
    cart: cart.results.map(r => r.product_id), wishlist: wish.results.map(r => r.product_id),
    owned: owned.results, reviews: myRev.results || [], orders: orders.results.map(o => { let meta = null; try { meta = o.meta ? JSON.parse(o.meta) : null; } catch { } const x = { ...o, meta, items: JSON.parse(o.items || '[]'), events: JSON.parse(o.events || '[]') }; x.track = orderView(x, dl.has(o.id), true); return x; }),
    firstBuyer: !orders.results.some(o => o.subtotal > 0 && ['paid', 'processing', 'delivered', 'completed', 'refunded'].includes(o.status)), tickets: tickets.results.map(t => ({ ...publicTicket(t, { full: true }), kind: t.type === 'question' ? 'question' : 'problem' })), hires: hires.results.map(h => ({ ...publicHire(h, { full: true }), review: hireReviewView(h) })) };
}

/* ---------- OTP ---------- */
async function issueOtp(env, email, purpose, name) {
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
  const h = await sha256(email + '|' + code);
  // Keep up to 3 recent unexpired codes valid, so a second "send code" tap (or a second tab/device)
  // never makes the code already sitting in the inbox fail as "Wrong code".
  const prev = await env.DB.prepare('SELECT code_hash, exp FROM otps WHERE email = ?1 AND purpose = ?2').bind(email, purpose).first();
  const keep = prev && prev.exp > now() ? String(prev.code_hash || '').split(',').filter(Boolean).slice(0, 2) : [];
  const hashes = [h, ...keep].join(',');
  await env.DB.prepare('INSERT INTO otps (email, purpose, code_hash, exp, tries, created) VALUES (?1, ?2, ?3, ?4, 0, ?5) ON CONFLICT(email, purpose) DO UPDATE SET code_hash = ?3, exp = ?4, tries = 0, created = ?5')
    .bind(email, purpose, hashes, now() + 10 * 60e3, now()).run();
  const r = await sendTemplate(env, 'otp', email, { code, name: name || 'there' }, { ref: purpose });
  if (!r.ok) { await logEvent(env, 'otp', 'OTP mail failed: ' + r.error); await alertOwner(env, 'otp-fail', 'Login code emails are failing: ' + r.error, { throttleMin: 30 }); fail('We could not send the email right now. Please try again in a few minutes or use Google sign-in.', 503); }
}
async function checkOtp(env, email, purpose, code) {
  const row = await env.DB.prepare('SELECT * FROM otps WHERE email = ?1 AND purpose = ?2').bind(email, purpose).first();
  if (!row) fail('No active code. Please request a new one.');
  if (row.exp < now()) fail('The code has expired. Please request a new one.');
  if (row.tries >= 5) fail('Too many wrong codes. Please request a new one.', 429);
  const digits = String(code ?? '').replace(/\D/g, '');
  const ok = digits.length === 6 && String(row.code_hash || '').split(',').includes(await sha256(email + '|' + digits));
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
    const b = await readJson(req); const email = clean(b.email, 200).toLowerCase(); const purpose = ['login', 'reset', 'change', 'delete', 'admin2fa'].includes(b.purpose) ? b.purpose : 'login';
    if (!isEmail(email)) fail('Please enter a valid email');
    if (purpose === 'login') needTc(b);
    if ((purpose === 'change' || purpose === 'delete' || purpose === 'admin2fa') && (!s || s.user.email !== email)) fail('Please sign in first', 401);
    if (purpose === 'admin2fa' && !s.isAdmin) fail('Not allowed', 403);
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
    const ck = await newSession(env, req, u.id, u.totp_on ? 0 : 1); // the email code itself is the 2nd step (unless an authenticator is set up)
    return J({ ok: true, isNew: !!u._new }, 200, { 'set-cookie': ck });
  }
  if (p === '/api/auth/login' && m === 'POST') {
    const b = await readJson(req); const email = clean(b.email, 200).toLowerCase();
    await limitOrFail(env, 'login:' + email, 8, 15 * 60e3); await limitOrFail(env, 'loginip:' + ip(req), 30, 15 * 60e3);
    const u = await env.DB.prepare('SELECT * FROM users WHERE email = ?1').bind(email).first();
    // No account yet / account without a password: the client switches to the email-code flow (which creates the account on verify)
    if (!u && isEmail(email)) return J({ ok: false, reason: 'no_account', error: 'No account with this email yet' }, 404);
    if (u && !u.disabled && !u.pass_hash) return J({ ok: false, reason: 'no_password', error: 'This account has no password yet' }, 409);
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
    // Accept whichever second factor matches: authenticator app code (if set up) or the emailed code.
    // (Before: the method came from the page's memory and defaulted to 'totp', so a correct emailed code was refused.)
    const totpPass = s.user.totp_on && b.method !== 'email' && await totpOk(s.user.totp_secret, b.code);
    if (!totpPass) await checkOtp(env, String(s.user.email || '').toLowerCase(), 'admin2fa', b.code);
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
    if (b.avatar !== undefined) { const a = clean(b.avatar, 300); if (a && !a.startsWith('/u/avatars/') && !/^\/img\/av\/(10|[1-9])\.svg$/.test(a)) fail('Bad avatar'); sets.push('avatar = ?'); vals.push(a); }
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
      env.DB.prepare('DELETE FROM tickets WHERE user_id = ?1 OR email = ?2').bind(uid, s.user.email),
      env.DB.prepare('DELETE FROM hire WHERE user_id = ?1 OR email = ?2').bind(uid, s.user.email),
      env.DB.prepare('DELETE FROM otps WHERE email = ?1').bind(s.user.email),
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
  /* manual UPI (Oct 30): show the pay details again for an unpaid order, and take the buyer's UTR */
  if (p === '/api/checkout/upi' && m === 'POST') {
    needUser(s); const b = await readJson(req);
    const o = await env.DB.prepare('SELECT * FROM orders WHERE number = ?1 AND user_id = ?2').bind(clean(b.order, 30), s.user.id).first(); if (!o) fail('Order not found', 404);
    if (o.provider !== 'upi' || !['created', 'failed'].includes(o.status)) fail('This order is not waiting for payment.');
    const pay = await paymentsConfig(env);
    return J({ ok: true, order: { number: o.number, total: o.total }, upi: upiDetails(pay.raw, o) });
  }
  if (p === '/api/checkout/upi-submit' && m === 'POST') {
    needUser(s); const b = await readJson(req);
    await limitOrFail(env, 'upiutr:' + s.user.id, 12, 3600e3, 'Too many attempts. Please wait a few minutes and try again.');
    return J({ ok: true, ...(await upiSubmit(env, s, b, origin)) });
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

  let mm0;
  /* ----- portfolio video stream: /v/<id> (Drive or uploaded file, same URL shape for both) ----- */
  if ((mm0 = p.match(/^\/v\/(\d+|p\d+|reel)$/)) && (m === 'GET' || m === 'HEAD')) {
    const key = mm0[1]; let srcRow = null;
    if (key === 'reel') { const hero = (await getContent(env)).hero || {}; if (hero.showreel) srcRow = { url: hero.showreel, video: hero.showreel }; }
    else if (key[0] === 'p') { const pr = await env.DB.prepare('SELECT video FROM products WHERE id = ?1 AND visible = 1').bind(+key.slice(1)).first(); if (pr && pr.video) srcRow = { url: pr.video, video: pr.video }; }
    else srcRow = await env.DB.prepare('SELECT id, video, url, source FROM portfolio WHERE id = ?1 AND visible = 1').bind(+key).first();
    if (!srcRow) return new Response('Not found', { status: 404 });
    return streamVideoSource(req, env, { url: srcRow.url || '', video: srcRow.video || '' }, googleToken);
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
    if (url.searchParams.get('check') === '1') return J({ ok: true, file: prod.delivery !== 'link', emailed: prod.delivery === 'link', first: !own.downloads });
    await env.DB.batch([
      env.DB.prepare('UPDATE owned SET downloads = downloads + 1, first_dl = COALESCE(first_dl, ?3), last_dl = ?3 WHERE user_id = ?1 AND product_id = ?2').bind(s.user.id, pid, now()),
      env.DB.prepare('UPDATE products SET downloads = downloads + 1 WHERE id = ?1').bind(pid)
    ]);
    if (prod.delivery === 'drive') {
      const id = driveId(prod.drive_id) || driveId(prod.link_url);
      const tok = id ? await googleToken(env, 'main') : null;
      if (id && tok) { const r = await streamDrive(env, req, tok, id, { download: prod.file_name || null, cache: false }); if (r.ok || r.status === 206) return r; }
      if (id) { const pub = await streamDrivePublic(req, id, { download: prod.file_name || true, cache: false }); if (pub) return pub; }
      await alertOwner(env, 'delivery', `Download failed for "${prod.title}": the Google Drive file could not be opened. Set its sharing to "Anyone with the link" (or keep it in jangidcuts@gmail.com Drive).`);
      fail('This download is temporarily unavailable. We have been notified and will fix it soon.', 503);
    }
    if (prod.delivery === 'link') {
      await limitOrFail(env, 'dlmail:' + s.user.id + ':' + pid, 3, 3600e3, 'The link was already sent. Please check your email (and spam folder).');
      await deliverBig(env, prod, s.user, origin);
      return J({ ok: true, emailed: true });
    }
    if (!prod.file_key) fail('The file for this item is not uploaded yet. Please raise a ticket.', 404);
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
      if (!own) fail('Only buyers of this pack can rate it', 403);
      /* one review per buyer per pack: editing keeps the admin's visibility and home-page choice */
      const ex = await env.DB.prepare('SELECT id, status FROM reviews WHERE user_id = ?1 AND product_id = ?2 ORDER BY id DESC').bind(s.user.id, pid).all();
      if (ex.results.length) {
        const keep = ex.results[0];
        await env.DB.batch([
          env.DB.prepare('UPDATE reviews SET rating = ?1, text = ?2, name = ?3, created = ?4 WHERE id = ?5').bind(rating, text, clean(s.user.name || 'Customer', 80), now(), keep.id),
          env.DB.prepare('DELETE FROM reviews WHERE user_id = ?1 AND product_id = ?2 AND id <> ?3').bind(s.user.id, pid, keep.id)
        ]);
        return J({ ok: true, updated: true, status: keep.status, message: keep.status === 'hidden' ? 'Review updated. It is not shown publicly right now.' : 'Your review is updated' });
      }
    } else {
      fail('To review your project, open the rating link in your email or rate it from Track hire request', 403);
    }
    await env.DB.prepare("INSERT INTO reviews (user_id, product_id, name, role, rating, text, status, source, created) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'visible', 'user', ?7)")
      .bind(s.user.id, pid, clean(s.user.name || 'Customer', 80), pid ? 'Verified buyer' : 'Client', rating, text, now()).run();
    return J({ ok: true, status: 'visible', message: 'Thanks for your review!' });
  }

  /* ----- client (hire) reviews: private email link (?r=token) or the hire tracker (number + email) or the signed-in owner ----- */
  if (p === '/api/hire-review') {
    const b = m === 'POST' ? await readJson(req) : Object.fromEntries(url.searchParams);
    await limitOrFail(env, 'hrev:' + ip(req), 30, 600e3, 'Too many tries. Please wait a few minutes and try again.');
    let h = null;
    if (b.t) { const t = String(b.t).replace(/[^a-f0-9]/gi, ''); if (t.length >= 20) h = await env.DB.prepare('SELECT * FROM hire WHERE review_token = ?1').bind(t).first(); }
    else {
      const pr = parseRef('HIRE', b.number || ''); const em = String(b.email || '').trim().toLowerCase();
      if (pr.ok && !pr.wrong) h = await env.DB.prepare('SELECT * FROM hire WHERE number = ?1').bind(pr.ref).first();
      const mine = h && s && (h.user_id === s.user.id || String(h.email || '').toLowerCase() === String(s.user.email || '').toLowerCase());
      if (h && !mine && String(h.email || '').toLowerCase() !== em) h = null;
    }
    if (!h) return J({ ok: false, notFound: true, error: b.t ? 'This rating link is not valid. Please use the latest email from Jangid Cuts, or Track hire request.' : 'No hire request found for this number and email.' }, 404);
    const cur = await env.DB.prepare('SELECT id, rating rv_rating, text rv_text, name rv_name, status rv_status FROM reviews WHERE hire_id = ?1 ORDER BY id DESC').bind(h.id).first();
    if (m === 'GET') return J({ ok: true, hire: { ...publicHire(h), email: maskEmail(h.email), review: hireReviewView({ ...h, ...(cur || {}) }) } });
    if (m !== 'POST') fail('Method not allowed', 405);
    if (!reviewOpen(h)) fail('Rating opens when your project is completed', 403);
    const rating = Math.max(0, Math.min(5, parseInt(b.rating) || 0)); if (!rating) fail('Tap the stars to rate');
    const text = clean(b.text, 1000), name = clean(b.name, 60) || clean(h.name, 60) || 'Client';
    let cats = []; try { cats = JSON.parse(h.data || '{}').categories || []; } catch { }
    const role = (cats[0] ? clean(cats[0], 40) + ' · ' : '') + (hireKind(h) === 'ongoing' ? 'Monthly client' : 'Client');
    await limitOrFail(env, 'hrevw:' + h.id, 10, 3600e3, 'Too many changes. Please try again in an hour.');
    if (cur) {
      await env.DB.prepare('UPDATE reviews SET rating = ?1, text = ?2, name = ?3, updated = ?4 WHERE id = ?5').bind(rating, text, name, now(), cur.id).run();
      await env.DB.prepare('DELETE FROM reviews WHERE hire_id = ?1 AND id <> ?2').bind(h.id, cur.id).run();
      return J({ ok: true, updated: true, message: cur.rv_status === 'hidden' ? 'Review updated. It is not shown publicly right now.' : 'Your review is updated. Thank you!' });
    }
    await env.DB.prepare("INSERT INTO reviews (user_id, product_id, hire_id, name, role, rating, text, status, source, created) VALUES (?1, NULL, ?2, ?3, ?4, ?5, ?6, 'visible', 'client', ?7)").bind(h.user_id || null, h.id, name, role, rating, text, now()).run();
    return J({ ok: true, message: 'Thank you for your review!' });
  }

  /* ----- hire / tickets ----- */
  if (p === '/api/hire' && m === 'POST') {
    const b = await readJson(req, 50000); needTc(b);
    if (b.website) return J({ ok: true }); // honeypot
    const name = clean(b.name, 100), email = clean(b.email, 200).toLowerCase();
    if (!name || !isEmail(email)) fail('Please enter your name and a valid email');
    const words = clean(b.project, 6000).split(/\s+/).filter(Boolean).length; if (words > 500) fail('Project description is over 500 words');
    await limitOrFail(env, 'hire:' + ip(req), 5, 3600e3);
    const number = await newRef(env, 'HIRE');
    const data = {}; for (const k of ['whatsapp', 'country', 'agency', 'agency_name', 'agency_address', 'categories', 'category_other', 'perday', 'format', 'plan', 'budget', 'deadline', 'raw_link', 'reference', 'project']) data[k] = Array.isArray(b[k]) ? b[k].map(x => clean(x, 80)).slice(0, 40) : clean(b[k], k === 'project' ? 6000 : 300);
    await env.DB.prepare('INSERT INTO hire (number, user_id, name, email, data, status, created, ip) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)').bind(number, s?.user.id || null, name, email, JSON.stringify(data), 'received', now(), ip(req)).run();
    try { await env.DB.prepare('UPDATE hire SET kind = ?1, events = ?2 WHERE number = ?3').bind(hireKind({ data: JSON.stringify(data) }), JSON.stringify([{ s: 'received', at: now() }]), number).run(); } catch { }
    ctx.waitUntil((async () => {
      await sendTemplate(env, 'hire_received', email, { name, number }, { ref: number });
      await alertOwner(env, 'hire', `New Hire Me request ${number} from ${name} <${email}>\nWork: ${(data.categories || []).join(', ')} ${data.category_other || ''}\nBudget: ${data.budget}\n\n${data.project}`);
    })());
    return J({ ok: true, number });
  }
  /* ----- tracking: one tracker per type (Oct 27c). A number only works in its own tracker. ----- */
  const trackPaths = { '/api/track': null, '/api/tickets/track': 'ticket', '/api/orders/track': 'order', '/api/hire/track': 'hire' };
  if (p in trackPaths && m === 'POST') {
    const b = await readJson(req, 2000);
    const type = trackPaths[p] || ({ hire: 'hire', ticket: 'ticket', order: 'order' })[b.type] || 'ticket';
    const T = { hire: 'HIRE', ticket: 'TKT', order: 'ORD' }[type];
    const word = { hire: 'hire request', ticket: 'ticket', order: 'order' }[type];
    const email = clean(b.email, 200).toLowerCase();
    const pr = parseRef(T, b.number);
    const prDl = type === 'order' ? parseRef('DL', b.number) : null; // free-download orders share the order tracker
    if (!pr.ok) fail(`Enter your ${word} number, like JC-${T}-12345 (or just 12345)`);
    if (!isEmail(email)) fail(`Enter the email you used for the ${word}`);
    await limitOrFail(env, 'track:' + ip(req), 10, 600e3, 'Too many lookups. Please wait 10 minutes and try again.'); await limitOrFail(env, 'trackref:' + pr.digits, 10, 600e3, 'Too many lookups. Please wait 10 minutes and try again.');
    const notFound = () => J({ ok: false, notFound: true, error: `No ${word} found for this number and email.` }, 404);
    const own = r => r && String(r.email || '').toLowerCase() === email;
    if (pr.wrong && !(prDl && prDl.ok && !prDl.wrong)) return notFound();
    if (type === 'hire') {
      const h = await env.DB.prepare('SELECT * FROM hire WHERE number = ?1').bind(pr.ref).first();
      if (!own(h)) return notFound();
      const rv = await env.DB.prepare('SELECT rating rv_rating, text rv_text, name rv_name, status rv_status FROM reviews WHERE hire_id = ?1 ORDER BY id DESC').bind(h.id).first();
      return J({ ok: true, type, hire: { ...publicHire(h), email: maskEmail(h.email), review: hireReviewView({ ...h, ...(rv || {}) }) } });
    }
    if (type === 'ticket') {
      const t = await env.DB.prepare('SELECT * FROM tickets WHERE number = ?1').bind(pr.ref).first();
      if (!own(t)) return notFound();
      const st6 = norm(t.status);
      // Oct 29: the tracker (number + matching email) also shows the support reply, so a solved ticket never shows "Solution delivered" without the solution.
      return J({ ok: true, type, ticket: { ...publicTicket(t, { full: false }), kind: t.type === 'question' ? 'question' : 'problem', solution: (st6 === 'solved' || st6 === 'closed') ? String(t.solution || '') : '' } });
    }
    const refs = [pr.wrong ? null : pr.ref, prDl && !prDl.wrong ? prDl.ref : null].filter(Boolean);
    const { results } = await env.DB.prepare('SELECT * FROM orders WHERE number IN (?1, ?2)').bind(refs[0], refs[1] || refs[0]).all();
    const o = results.find(own);
    if (!o) return notFound();
    return J({ ok: true, type, order: await publicOrder(env, o) });
  }
  if (p === '/api/tickets' && m === 'POST') {
    const b = await readJson(req, 20000); needTc(b);
    if (b.website) return J({ ok: true });
    const email = clean(b.email || s?.user.email, 200).toLowerCase(); const message = clean(b.message, 4000);
    const ttype = b.type === 'question' ? 'question' : 'problem';
    if (!isEmail(email)) fail('Please enter a valid email'); if (message.length < 5) fail(ttype === 'question' ? 'Please write your question' : 'Please describe the problem');
    await limitOrFail(env, 'ticket:' + ip(req), 6, 3600e3);
    const number = await newRef(env, 'TKT');
    const name = clean(b.name || s?.user.name || email.split('@')[0], 100);
    await env.DB.prepare('INSERT INTO tickets (number, user_id, email, name, topic, message, status, created, ip, events) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)').bind(number, s?.user.id || null, email, name, clean(b.topic, 80) || 'General', message, 'received', now(), ip(req), JSON.stringify([{ s: 'received', at: now() }])).run();
    try { await env.DB.prepare('UPDATE tickets SET type = ?1 WHERE number = ?2').bind(ttype, number).run(); } catch { }
    ctx.waitUntil((async () => {
      await sendTemplate(env, ttype === 'question' ? 'ticket_question' : 'ticket_received', email, { name, number, message }, { account: 'support', ref: number });
      await alertOwner(env, 'ticket', `New support ${ttype === 'question' ? 'question' : 'ticket'} ${number} from ${email}\n\n${message}`);
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

/* ---------- order status (automatic, admin can override) ---------- */
export const ORDER_LABELS = { verifying: 'Payment processing', created: 'Awaiting payment', paid: 'Payment received', processing: 'Processing', delivered: 'Download ready', completed: 'Completed', failed: 'Payment failed', refunded: 'Refunded', cancelled: 'Cancelled' };
export async function publicOrder(env, o, { full = false } = {}) {
  let downloaded = false;
  try { downloaded = !!(await env.DB.prepare('SELECT 1 FROM owned WHERE order_id = ?1 AND downloads > 0 LIMIT 1').bind(o.id).first()); } catch { }
  return orderView(o, downloaded, full);
}
export function orderView(o, downloaded, full = false) {
  let ev = []; try { ev = Array.isArray(o.events) ? o.events : JSON.parse(o.events || '[]'); } catch { }
  const at = (...names) => { for (const e of ev.slice().reverse()) if (names.includes(e.s)) return e.at; return null; };
  let items = []; try { items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]'); } catch { }
  const free = !(o.total > 0);
  let st = o.status || 'created';
  if (st === 'delivered' && downloaded) st = 'completed'; // first download completes the order automatically
  const byMail = items.some(x => x.delivery === 'drive' || x.delivery === 'email' || x.big);
  const dLabel = byMail ? 'Delivered via email' : 'Download ready';
  const rank = { created: 0, verifying: 0, failed: 0, paid: 1, processing: 2, delivered: 3, completed: 4, refunded: 3, cancelled: 0 }[st] ?? 0;
  const steps = [
    { s: 'paid', label: free ? 'Order confirmed' : 'Payment received', at: at('paid', 'Payment confirmed', 'Order confirmed') || o.paid_at, done: rank >= 1 },
    { s: 'processing', label: 'Processing', at: at('processing') || o.paid_at, done: rank >= 2 || (rank >= 1 && st !== 'paid') },
    { s: 'delivered', label: dLabel, at: at('delivered', 'Delivered') || o.delivered_at, done: rank >= 3 },
    { s: 'completed', label: 'Completed', at: at('completed') || (st === 'completed' ? (o.delivered_at || null) : null), done: rank >= 4 }];
  if (st === 'created') steps.unshift({ s: 'created', label: 'Awaiting payment', at: o.created, done: true });
  if (st === 'verifying') steps.unshift({ s: 'verifying', label: 'Payment processing', at: at('verifying') || o.created, done: true });
  if (st === 'failed') steps.unshift({ s: 'failed', label: 'Payment failed', at: at('failed') || o.created, done: true });
  if (st === 'refunded' || st === 'cancelled') steps.push({ s: st, label: ORDER_LABELS[st], at: at(st, st === 'refunded' ? 'Refunded' : 'Cancelled'), done: true });
  steps.forEach(x => { if (!x.done) x.at = null; });
  let cur = -1; steps.forEach((x, i) => { if (x.done) cur = i; }); steps.forEach((x, i) => x.current = i === cur);
  const label = st === 'delivered' ? dLabel : (ORDER_LABELS[st] || st);
  const out = { number: o.number, status: st, label, created: o.created, items: items.map(x => x.title), steps, download: st === 'delivered' || st === 'completed' };
  if (o.provider === 'upi') { out.upi = true; if (full) { out.utr = o.payment_id || ''; out.payable = st === 'created' || st === 'failed'; } }
  if (!full) out.email = maskEmail(o.email);
  return out;
}
