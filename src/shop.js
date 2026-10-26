import { now, clean, fail, getKey, nextNumber, newRef, hex, enc, safeEq, decrypt, logEvent } from './lib.js';
import { sendTemplate, sendMail, alertOwner, googleToken } from './mail.js';

export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export async function loadProducts(env, ids) {
  ids = [...new Set((ids || []).map(Number).filter(Boolean))].slice(0, 50);
  if (!ids.length) return [];
  const { results } = await env.DB.prepare(`SELECT * FROM products WHERE visible = 1 AND id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all();
  return results;
}

// Price calculation: bundle discount (by number of paid items) then coupon.
export async function quote(env, { items, coupon, userId }) {
  let prods = await loadProducts(env, items);
  let ownedIds = new Set();
  if (userId && prods.length) {
    const { results } = await env.DB.prepare('SELECT product_id FROM owned WHERE user_id = ?1').bind(userId).all();
    ownedIds = new Set(results.map(r => r.product_id));
  }
  const skipped = prods.filter(p => ownedIds.has(p.id)).map(p => p.id);
  prods = prods.filter(p => !ownedIds.has(p.id));
  const subtotal = prods.reduce((s, p) => s + (p.price || 0), 0);
  const paidCount = prods.filter(p => p.price > 0).length;
  const store = await getKey(env, 'store');
  let bundlePct = 0;
  for (const b of (store.bundles || [])) if (paidCount >= +b.min_items && +b.pct > bundlePct) bundlePct = Math.min(90, +b.pct);
  const bundle = Math.floor(subtotal * bundlePct / 100);
  let couponOff = 0, couponInfo = null, couponError = null;
  const code = clean(coupon, 40).toUpperCase();
  if (code) {
    const c = await env.DB.prepare('SELECT * FROM coupons WHERE code = ?1').bind(code).first();
    const t = now();
    if (!c || !c.active) couponError = 'This coupon is not valid';
    else if (c.starts && t < c.starts) couponError = 'This coupon is not active yet';
    else if (c.expires && t > c.expires) couponError = 'This coupon has expired';
    else if (c.max_uses && c.used >= c.max_uses) couponError = 'This coupon has been fully used';
    else if (paidCount < (c.min_items || 1)) couponError = `Add at least ${c.min_items} paid items to use this coupon`;
    else if (c.min_total && subtotal < c.min_total) couponError = `Minimum order ${money(c.min_total)} for this coupon`;
    else {
      const base = subtotal - bundle;
      couponOff = c.type === 'flat' ? Math.min(base, c.value) : Math.floor(base * Math.min(100, c.value) / 100);
      couponInfo = { code: c.code, type: c.type, value: c.value };
    }
  }
  const discount = bundle + couponOff;
  const total = Math.max(0, subtotal - discount);
  return { items: prods.map(p => ({ id: p.id, title: p.title, price: p.price, image: p.image, delivery: p.delivery, slug: p.slug })), skipped, subtotal, bundlePct, bundle, coupon: couponInfo, couponOff, couponError, discount, total };
}

export async function paymentsConfig(env) {
  const p = await getKey(env, '_payments');
  const live = p.provider === 'razorpay' && p.key_id && p.key_secret_enc;
  return { provider: live ? 'razorpay' : 'test', key_id: live ? p.key_id : '', raw: p };
}

function ev(list, s) { list.push({ s, at: now() }); return list; }

export async function createOrder(env, req, sess, { items, coupon }) {
  const q = await quote(env, { items, coupon, userId: sess.user.id });
  if (!q.items.length) fail(q.skipped.length ? 'You already own these items' : 'Your cart is empty');
  if (coupon && q.couponError) fail(q.couponError);
  const number = await newRef(env, q.total === 0 ? 'DL' : 'ORD');
  const pay = await paymentsConfig(env);
  const events = ev([], 'Order confirmed');
  const row = await env.DB.prepare('INSERT INTO orders (number, user_id, email, items, subtotal, discount, total, coupon, status, provider, events, created) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12) RETURNING id')
    .bind(number, sess.user.id, sess.user.email, JSON.stringify(q.items), q.subtotal, q.discount, q.total, q.coupon?.code || null, 'created', q.total === 0 ? 'free' : pay.provider, JSON.stringify(events), now()).first();
  const order = { id: row.id, number, total: q.total };
  if (q.total === 0) { await fulfil(env, row.id, { paymentId: 'free', origin: new URL(req.url).origin }); return { order, paid: true }; }
  if (pay.provider === 'razorpay') {
    const secret = await decrypt(env, pay.raw.key_secret_enc);
    const r = await fetch('https://api.razorpay.com/v1/orders', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Basic ' + btoa(pay.key_id + ':' + secret) },
      body: JSON.stringify({ amount: q.total * 100, currency: 'INR', receipt: number, notes: { order: number, email: sess.user.email } }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.id) { await logEvent(env, 'payment', 'razorpay order failed ' + r.status + ' ' + JSON.stringify(j).slice(0, 300)); fail('Payment could not be started. Please try again in a minute.', 502); }
    await env.DB.prepare('UPDATE orders SET provider_order = ?1 WHERE id = ?2').bind(j.id, row.id).run();
    return { order, razorpay: { key: pay.key_id, order_id: j.id, amount: q.total * 100, currency: 'INR', name: 'Jangid Cuts', description: 'Order ' + number, prefill: { email: sess.user.email, name: sess.user.name || '' } } };
  }
  return { order, test: true, canSimulate: !!sess.adminReady };
}

export async function verifyRazorpay(env, { order_id, payment_id, signature }) {
  const pay = await paymentsConfig(env); if (pay.provider !== 'razorpay') fail('Payments not configured');
  const secret = await decrypt(env, pay.raw.key_secret_enc);
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = hex(await crypto.subtle.sign('HMAC', key, enc.encode(order_id + '|' + payment_id)));
  return safeEq(sig, String(signature || ''));
}

export async function hmacHex(secret, body) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(body)));
}

// Mark paid, grant lifetime ownership, deliver big files by email, send thank-you. Idempotent.
export async function fulfil(env, orderId, { paymentId, origin }) {
  const o = await env.DB.prepare('SELECT * FROM orders WHERE id = ?1').bind(orderId).first();
  if (!o || o.status === 'delivered' || o.status === 'refunded') return o;
  const events = JSON.parse(o.events || '[]');
  if (o.total > 0) ev(events, 'Payment confirmed');
  const items = JSON.parse(o.items || '[]');
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?1').bind(o.user_id).first();
  const stmts = [];
  for (const it of items) {
    stmts.push(env.DB.prepare('INSERT OR IGNORE INTO owned (user_id, product_id, order_id, created) VALUES (?1, ?2, ?3, ?4)').bind(o.user_id, it.id, o.id, now()));
    stmts.push(env.DB.prepare('UPDATE products SET sales = sales + 1 WHERE id = ?1').bind(it.id));
  }
  if (o.coupon) stmts.push(env.DB.prepare('UPDATE coupons SET used = used + 1 WHERE code = ?1').bind(o.coupon));
  stmts.push(env.DB.prepare('DELETE FROM cart WHERE user_id = ?1').bind(o.user_id));
  await env.DB.batch(stmts);
  // Big-file delivery (Drive share / private link by email)
  const prods = await loadProductsAny(env, items.map(i => i.id));
  for (const p of prods) {
    if (p.delivery === 'drive' || p.delivery === 'link') await deliverBig(env, p, user, origin, o.number);
  }
  ev(events, 'Delivered');
  await env.DB.prepare("UPDATE orders SET status = 'delivered', payment_id = ?1, paid_at = ?2, delivered_at = ?2, events = ?3 WHERE id = ?4").bind(paymentId || '', now(), JSON.stringify(events), o.id).run();
  const list = items.map(i => `• ${i.title} — ${i.price ? money(i.price) : 'Free'}`).join('\n');
  await sendTemplate(env, 'order_paid', o.email, { name: user?.name || 'there', number: o.number, items: list, total: money(o.total), link: origin + '/orders' }, { ref: o.number });
  if (o.total > 0) await alertOwner(env, 'sale', `New sale ${o.number}: ${money(o.total)} from ${o.email}\n${list}`);
  return o;
}
async function loadProductsAny(env, ids) {
  ids = ids.map(Number).filter(Boolean); if (!ids.length) return [];
  const { results } = await env.DB.prepare(`SELECT * FROM products WHERE id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all();
  return results;
}
export async function deliverBig(env, p, user, origin, number) {
  let link = p.link_url;
  if (!number) { const r = await env.DB.prepare('SELECT o.number FROM owned w JOIN orders o ON o.id = w.order_id WHERE w.user_id = ?1 AND w.product_id = ?2').bind(user.id, p.id).first(); number = r?.number || ''; }
  if (p.delivery === 'drive' && p.drive_id) {
    const tok = await googleToken(env, 'main');
    if (tok) {
      const r = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(p.drive_id)}/permissions?sendNotificationEmail=false&supportsAllDrives=true`, { method: 'POST', headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json' }, body: JSON.stringify({ role: 'reader', type: 'user', emailAddress: user.email }) });
      if (!r.ok) { await logEvent(env, 'delivery', `drive share failed ${p.id} ${user.email}: ${r.status}`); await alertOwner(env, 'delivery', `Drive share failed for "${p.title}" to ${user.email}. Please share it manually.`); }
    }
    link = `https://drive.google.com/file/d/${p.drive_id}/view`;
  }
  if (link) await sendTemplate(env, 'download_link', user.email, { name: user.name || 'there', product: p.title, link, number: number || '' }, { ref: number || '' });
}
