// Manual UPI checkout (Oct 30). Self-contained so Razorpay can replace it later:
// remove the 'upi' provider in Admin -> Settings -> Payments (or switch to Razorpay) and nothing here runs.
import { now, clean, fail } from './lib.js';
import { sendTemplate, alertOwner } from './mail.js';
import { fulfil, money } from './shop.js';

export const UPI_DEFAULT_ID = '9351664400@ibl';
export const UPI_DEFAULT_NAME = 'PRASHANT JANGIR';

export function upiOn(pay) { return pay && pay.provider === 'upi' && !!String(pay.upi_id || '').trim(); }

// what the buyer's checkout needs for one order (QR is drawn in the browser from `link`)
export function upiDetails(pay, order) {
  const pa = String(pay.upi_id || UPI_DEFAULT_ID).trim(), pn = String(pay.upi_name || UPI_DEFAULT_NAME).trim();
  const link = 'upi://pay?pa=' + encodeURIComponent(pa).replace(/%40/g, '@') + '&pn=' + encodeURIComponent(pn) + '&am=' + Number(order.total).toFixed(2) + '&cu=INR&tn=' + encodeURIComponent(order.number);
  return { id: pa, name: pn, amount: order.total, amountText: money(order.total), number: order.number, link, qr: pay.upi_qr || '' };
}

const evp = (o, s, extra) => { const e = JSON.parse(o.events || '[]'); e.push({ s, at: now(), ...(extra || {}) }); return JSON.stringify(e.slice(-60)); };

// buyer submits the UTR -> status 'verifying' (shown as "Payment processing")
export async function upiSubmit(env, s, b, origin) {
  const utr = String(b.utr || '').replace(/\s+/g, '');
  if (!/^\d{12}$/.test(utr)) fail('Please enter the 12-digit UTR / transaction ID from your UPI app.');
  const o = await env.DB.prepare('SELECT * FROM orders WHERE number = ?1 AND user_id = ?2').bind(clean(b.order, 30), s.user.id).first();
  if (!o) fail('Order not found', 404);
  if (o.provider !== 'upi') fail('This order does not use UPI payment.');
  if (o.status === 'verifying') return { status: 'verifying', number: o.number, already: true };
  if (o.status !== 'created' && o.status !== 'failed') fail('This order is already ' + (o.status === 'delivered' || o.status === 'completed' ? 'paid' : o.status) + '.');
  const dup = await env.DB.prepare("SELECT number FROM orders WHERE provider = 'upi' AND payment_id = ?1 AND id != ?2 AND status NOT IN ('failed','cancelled')").bind(utr, o.id).first();
  if (dup) fail('This UTR has already been used for another order. Please check the number in your UPI app.');
  await env.DB.prepare("UPDATE orders SET status = 'verifying', payment_id = ?1, events = ?2 WHERE id = ?3").bind(utr, evp(o, 'verifying', { utr }), o.id).run();
  await env.DB.prepare('DELETE FROM cart WHERE user_id = ?1').bind(s.user.id).run();
  const items = JSON.parse(o.items || '[]').map(i => '• ' + i.title + ' — ' + money(i.price)).join('\n');
  await sendTemplate(env, 'order_processing', o.email, { name: s.user.name || 'there', number: o.number, utr, total: money(o.total), items, link: origin + '/orders' }, { ref: o.number });
  await alertOwner(env, 'sale', `UPI payment to verify: ${o.number} ${money(o.total)} from ${o.email}\nUTR ${utr}\n${items}\nConfirm or reject in Admin -> UPI payments.`);
  return { status: 'verifying', number: o.number };
}

// admin: Confirm -> existing fulfil() (access + downloads + "order confirmed" mail); Reject -> 'failed' + mail
export async function upiDecide(env, o, action, origin, reason) {
  if (o.status !== 'verifying') fail('This order is not waiting for UPI verification (status: ' + o.status + ').');
  if (action === 'upi_confirm') {
    await fulfil(env, o.id, { paymentId: o.payment_id || 'UPI', origin });
    return { status: 'delivered' };
  }
  const why = clean(reason, 300);
  await env.DB.prepare("UPDATE orders SET status = 'failed', events = ?1 WHERE id = ?2").bind(evp(o, 'failed', { by: 'admin' }), o.id).run();
  await sendTemplate(env, 'order_status', o.email, { name: 'there', number: o.number, status: 'Payment failed', refund: '\n\nWe could not confirm your UPI payment (UTR ' + (o.payment_id || '-') + ')' + (why ? ': ' + why : '') + '. If money was deducted from your account, reply to this email with a payment screenshot and we will sort it out.', link: origin + '/orders' }, { ref: o.number });
  return { status: 'failed' };
}
