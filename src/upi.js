// Manual UPI checkout (Oct 30). Self-contained so Razorpay can replace it later:
// remove the 'upi' provider in Admin -> Settings -> Payments (or switch to Razorpay) and nothing here runs.
// Nov 1 (Prashant 10:32 PM, "every case needs a solution"): the order is saved BEFORE the UPI app opens (order id in the UPI note);
// the buyer can report payment any time later with a UTR, a screenshot, or "paid but can't find the UTR"; unpaid orders expire
// after N hours (Admin -> Settings -> Payments) but a payment report revives them; extra / double payments can be reported;
// the buyer can cancel an unpaid order. A plain UPI link cannot confirm a payment by itself - the owner confirms in Admin.
import { now, clean, fail } from './lib.js';
import { sendTemplate, alertOwner } from './mail.js';
import { fulfil, money } from './shop.js';
import { putFile } from './storage.js';

export const UPI_DEFAULT_ID = '9351664400@ibl';
export const UPI_DEFAULT_NAME = 'PRASHANT JANGIR';
export const UPI_EXPIRE_DEFAULT_H = 24;

export function upiOn(pay) { return pay && pay.provider === 'upi' && !!String(pay.upi_id || '').trim(); }
export function expireHours(pay) { const h = +(pay && pay.upi_expire_h); return h >= 1 && h <= 720 ? h : UPI_EXPIRE_DEFAULT_H; }
export function proofOf(o) { try { const p = JSON.parse(o.proof || '{}'); return p && typeof p === 'object' ? p : {}; } catch { return {}; } }
const evList = (o) => { try { return JSON.parse(o.events || '[]'); } catch { return []; } };
// cancelled by the buyer (not by the owner) -> the buyer can still report a payment for it
export function buyerCancelled(o) { if (o.status !== 'cancelled') return false; const c = evList(o).filter(e => e.s === 'Cancelled').pop(); return !!(c && c.by === 'buyer'); }
// statuses where the buyer can still pay / say "I paid"
export function upiOpen(o) { return o.provider === 'upi' && (['created', 'failed', 'expired'].includes(o.status) || buyerCancelled(o)); }

// what the buyer's checkout needs for one order (QR is drawn in the browser from `link`)
export function upiDetails(pay, order) {
  const pa = String(pay.upi_id || UPI_DEFAULT_ID).trim(), pn = String(pay.upi_name || UPI_DEFAULT_NAME).trim();
  const link = 'upi://pay?pa=' + encodeURIComponent(pa).replace(/%40/g, '@') + '&pn=' + encodeURIComponent(pn) + '&am=' + Number(order.total).toFixed(2) + '&cu=INR&tn=' + encodeURIComponent(order.number);
  return { id: pa, name: pn, amount: order.total, amountText: money(order.total), number: order.number, link, qr: pay.upi_qr || '', expireH: expireHours(pay) };
}

// the buyer's view of one UPI order (used to restore the payment screen after the UPI app / a reload / Back)
export function upiState(pay, o) {
  const pr = proofOf(o), h = expireHours(pay);
  const out = { number: o.number, status: o.status, total: o.total, amountText: money(o.total), created: o.created, expiresAt: o.created + h * 3600e3, expireH: h,
    utr: o.payment_id && /^\d{12}$/.test(o.payment_id) ? o.payment_id : '', shots: (pr.shots || []).length, noUtr: !!pr.noUtr, extra: (pr.extra || []).length,
    open: upiOpen(o), paid: ['paid', 'processing', 'delivered', 'completed'].includes(o.status) };
  if (out.open) out.upi = upiDetails(pay, o);
  return out;
}

const evp = (o, s, extra) => { const e = evList(o); e.push({ s, at: now(), ...(extra || {}) }); return JSON.stringify(e.slice(-60)); };
const mine = (env, s, num) => env.DB.prepare('SELECT * FROM orders WHERE number = ?1 AND user_id = ?2').bind(clean(num, 30), s.user.id).first();

// buyer reports the payment -> status 'verifying' (shown as "Payment processing").
// Any of: a 12-digit UTR, an uploaded screenshot, or "I paid but can't find the UTR" (owner matches by amount + time + order id).
export async function upiSubmit(env, s, b, origin) {
  const utr = String(b.utr || '').replace(/\s+/g, '');
  const noUtr = !utr && !!b.noUtr;
  if (utr && !/^\d{12}$/.test(utr)) fail('Please enter the 12-digit UTR / transaction ID from your UPI app.');
  const o = await mine(env, s, b.order);
  if (!o) fail('Order not found', 404);
  if (o.provider !== 'upi') fail('This order does not use UPI payment.');
  const pr = proofOf(o), hasShot = (pr.shots || []).length > 0;
  if (!utr && !noUtr && !hasShot) fail('Please enter the 12-digit UTR, or upload a payment screenshot.');
  if (utr) {
    const dup = await env.DB.prepare("SELECT number FROM orders WHERE provider = 'upi' AND payment_id = ?1 AND id != ?2 AND status NOT IN ('failed','cancelled','expired')").bind(utr, o.id).first();
    if (dup) fail('This UTR is already used for order ' + dup.number + '. Please check the number in your UPI app. If you paid twice, use "Paid twice? Report extra payment" on that order.');
  }
  if (o.status === 'verifying') {
    // already reported: allow adding the UTR later (it was missing), or adding a screenshot
    if (!utr || utr === o.payment_id) return { status: 'verifying', number: o.number, already: true };
    if (o.payment_id && /^\d{12}$/.test(o.payment_id)) fail('This order already has UTR ' + o.payment_id + '. If you paid twice, use "Report extra payment".');
    pr.noUtr = false;
    await env.DB.prepare('UPDATE orders SET payment_id = ?1, proof = ?2, events = ?3 WHERE id = ?4').bind(utr, JSON.stringify(pr), evp(o, 'UTR added', { utr }), o.id).run();
    await alertOwner(env, 'sale', `UTR added for ${o.number} ${money(o.total)}: ${utr}\nConfirm in Admin -> UPI payments.`);
    return { status: 'verifying', number: o.number, utr };
  }
  if (!upiOpen(o)) fail('This order is already ' + (['delivered', 'completed', 'paid', 'processing'].includes(o.status) ? 'paid' : o.status) + '.');
  const revived = o.status !== 'created';
  pr.noUtr = !utr; pr.reported = now(); if (revived) pr.revivedFrom = o.status;
  await env.DB.prepare("UPDATE orders SET status = 'verifying', payment_id = ?1, proof = ?2, events = ?3 WHERE id = ?4")
    .bind(utr || '', JSON.stringify(pr), evp(o, 'verifying', { utr: utr || null, shot: hasShot || undefined, noUtr: !utr || undefined, revived: revived ? o.status : undefined }), o.id).run();
  await env.DB.prepare('DELETE FROM cart WHERE user_id = ?1').bind(s.user.id).run();
  const items = JSON.parse(o.items || '[]').map(i => '• ' + i.title + ' — ' + money(i.price)).join('\n');
  const utrText = utr || (hasShot ? 'not given (payment screenshot uploaded)' : 'not given yet (we will match your payment by amount, time and order number)');
  await sendTemplate(env, 'order_processing', o.email, { name: s.user.name || 'there', number: o.number, utr: utrText, total: money(o.total), items, link: origin + '/orders' }, { ref: o.number });
  await alertOwner(env, 'sale', `UPI payment to verify: ${o.number} ${money(o.total)} from ${o.email}\nUTR ${utr || 'NOT GIVEN'}${hasShot ? ' · screenshot uploaded' : ''}${revived ? ' · (was ' + o.status + ')' : ''}\n${items}\nConfirm or reject in Admin -> UPI payments.`);
  return { status: 'verifying', number: o.number, utr: utr || '' };
}

// buyer uploads a payment screenshot (kept private: only the owner in Admin and the buyer can open it)
export async function upiProof(env, s, req, url) {
  const o = await mine(env, s, url.searchParams.get('order'));
  if (!o) fail('Order not found', 404);
  if (o.provider !== 'upi') fail('This order does not use UPI payment.');
  const type = (req.headers.get('content-type') || '').split(';')[0];
  if (!/^image\/(jpeg|png|webp)$/.test(type)) fail('Use a JPG, PNG or WEBP screenshot.');
  const size = +(req.headers.get('content-length') || 0); if (size > 3 * 1024 * 1024) fail('Screenshot too big (max 3 MB).', 413);
  const pr = proofOf(o); pr.shots = pr.shots || [];
  if (pr.shots.length >= 6) fail('You have already uploaded 6 screenshots for this order.');
  const f = await putFile(env, { body: await req.arrayBuffer(), type, name: o.number + '.' + type.split('/')[1], folder: 'private/upiproof', size });
  const extra = url.searchParams.get('extra') === '1';
  pr.shots.push({ key: f.key, at: now(), extra: extra || undefined });
  await env.DB.prepare('UPDATE orders SET proof = ?1, events = ?2 WHERE id = ?3').bind(JSON.stringify(pr), evp(o, 'Screenshot added'), o.id).run();
  if (o.status === 'verifying' || extra) await alertOwner(env, 'sale', `Payment screenshot added for ${o.number} ${money(o.total)} (${o.email}). See Admin -> UPI payments.`);
  return { shots: pr.shots.length };
}

// buyer: "I paid twice / paid extra" -> recorded on the order, owner sees a red warning and refunds by UPI
export async function upiExtra(env, s, b) {
  const o = await mine(env, s, b.order);
  if (!o) fail('Order not found', 404);
  if (o.provider !== 'upi') fail('This order does not use UPI payment.');
  const utr = String(b.utr || '').replace(/\s+/g, '');
  if (utr && !/^\d{12}$/.test(utr)) fail('Please enter the 12-digit UTR of the extra payment.');
  if (utr && utr === o.payment_id) fail('That is the UTR already saved for this order. Enter the UTR of the second (extra) payment.');
  const pr = proofOf(o);
  if (!utr && !(pr.shots || []).some(x => x.extra)) fail('Enter the UTR of the extra payment, or upload its screenshot.');
  pr.extra = pr.extra || [];
  if (utr && pr.extra.some(x => x.utr === utr)) return { extra: pr.extra.length, already: true };
  if (utr) { const other = await env.DB.prepare("SELECT number FROM orders WHERE provider = 'upi' AND payment_id = ?1 AND id != ?2").bind(utr, o.id).first(); if (other) fail('This UTR belongs to order ' + other.number + '.'); }
  pr.extra.push({ utr: utr || '', at: now(), note: clean(b.note, 300) }); pr.extraOpen = 1;
  await env.DB.prepare('UPDATE orders SET proof = ?1, events = ?2 WHERE id = ?3').bind(JSON.stringify(pr), evp(o, 'Extra payment reported', { utr: utr || null }), o.id).run();
  await alertOwner(env, 'sale', `EXTRA payment reported on ${o.number} (${money(o.total)}) by ${o.email}. UTR ${utr || 'screenshot only'}. Check your bank app and refund by UPI if it arrived. Admin -> UPI payments.`);
  return { extra: pr.extra.length };
}

// buyer cancels an unpaid order (it can still be revived by reporting a payment)
export async function upiCancel(env, s, b) {
  const o = await mine(env, s, b.order);
  if (!o) fail('Order not found', 404);
  if (o.provider !== 'upi' || !['created', 'failed', 'expired'].includes(o.status)) fail('This order cannot be cancelled now (status: ' + o.status + ').');
  await env.DB.prepare("UPDATE orders SET status = 'cancelled', events = ?1 WHERE id = ?2").bind(evp(o, 'Cancelled', { by: 'buyer' }), o.id).run();
  return { status: 'cancelled' };
}

// admin: Confirm -> existing fulfil() (access + downloads + "order confirmed" mail); Reject -> 'failed' + mail.
// Nov 1: Confirm also works for an order that never got a UTR (owner matched the money by amount / time / order id).
export async function upiDecide(env, o, action, origin, reason) {
  if (action === 'upi_confirm') {
    if (o.status !== 'verifying' && !upiOpen(o) && o.status !== 'cancelled') fail('This order is ' + o.status + ' — nothing to confirm.');
    await fulfil(env, o.id, { paymentId: o.payment_id || 'UPI (matched by owner)', origin });
    return { status: 'delivered' };
  }
  if (o.status !== 'verifying') fail('This order is not waiting for UPI verification (status: ' + o.status + ').');
  const why = clean(reason, 300);
  await env.DB.prepare("UPDATE orders SET status = 'failed', events = ?1 WHERE id = ?2").bind(evp(o, 'failed', { by: 'admin', why: why || undefined }), o.id).run();
  await sendTemplate(env, 'order_status', o.email, { name: 'there', number: o.number, status: 'Payment failed', refund: '\n\nWe could not confirm your UPI payment (UTR ' + (o.payment_id || '-') + ')' + (why ? ': ' + why : '') + '. If money was deducted from your account, open My Orders and add the correct UTR or a payment screenshot, or reply to this email.', link: origin + '/orders' }, { ref: o.number });
  return { status: 'failed' };
}
// admin: extra payment handled (refunded / not received)
export async function upiExtraDone(env, o, note) {
  const pr = proofOf(o); pr.extraOpen = 0; pr.extraNote = clean(note, 300); pr.extraDoneAt = now();
  await env.DB.prepare('UPDATE orders SET proof = ?1, events = ?2 WHERE id = ?3').bind(JSON.stringify(pr), evp(o, 'Extra payment handled', { note: pr.extraNote || undefined }), o.id).run();
  return { ok: true };
}

// cron (every 15 min): expire unpaid UPI orders after N hours; one reminder mail ~30 min after an unpaid order was started
export const UPI_REMIND_SINCE = Date.UTC(2026, 10, 1, 18, 0); // only orders started after this change (never old orders)
export async function upiSweep(env, pay, origin) {
  const t = now(), h = expireHours(pay);
  await env.DB.prepare("UPDATE orders SET status = 'expired', events = json_insert(COALESCE(events, '[]'), '$[#]', json_object('s', 'Expired', 'at', ?1)) WHERE provider = 'upi' AND status = 'created' AND created < ?2").bind(t, t - h * 3600e3).run();
  const { results } = await env.DB.prepare("SELECT o.*, u.name uname FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.provider = 'upi' AND o.status = 'created' AND o.created > ?1 AND o.created < ?2 AND COALESCE(o.proof, '') NOT LIKE '%\"reminded\"%' LIMIT 20")
    .bind(Math.max(UPI_REMIND_SINCE, t - h * 3600e3), t - 30 * 60e3).all();
  for (const o of results) {
    const pr = proofOf(o); pr.reminded = t;
    await env.DB.prepare('UPDATE orders SET proof = ?1 WHERE id = ?2').bind(JSON.stringify(pr), o.id).run();
    const hl = Math.max(1, Math.round((o.created + h * 3600e3 - t) / 3600e3));
    await sendTemplate(env, 'upi_reminder', o.email, { name: o.uname || 'there', number: o.number, total: money(o.total), hours: String(hl), link: origin + '/orders?pay=' + encodeURIComponent(o.number) }, { ref: o.number });
  }
}
