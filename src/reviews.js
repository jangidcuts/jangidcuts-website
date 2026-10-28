// Reviews v2 (Oct 28): automatic "top" pick + client (hire) reviews.
// Top pick = reviews the admin pinned first, then highest stars, then the latest. A review the admin
// kept out of the top (pick = -1) still shows in the full list and counts in the average.
import { now, rand } from './lib.js';
import { hireKind, hireStatus } from './hire.js';
import { sendTemplate } from './mail.js';

export const TOP_N = 4;
const when = r => +(r.updated || r.created || 0);
export function rankTop(list, n = TOP_N) {
  const vis = list.filter(r => r.status === 'visible' && +r.pick !== -1);
  const pinned = vis.filter(r => +r.pick === 1).sort((a, b) => b.rating - a.rating || when(b) - when(a));
  const rest = vis.filter(r => +r.pick !== 1).sort((a, b) => b.rating - a.rating || when(b) - when(a));
  return pinned.concat(rest).slice(0, n);
}
// Home page: real client reviews once any exist; the sample (demo) reviews only until then.
export function homeSet(all) {
  const home = all.filter(r => !r.product_id && r.status === 'visible');
  const real = home.filter(r => r.source !== 'demo');
  return { list: real.length ? real : home.filter(r => r.source === 'demo'), real: real.length > 0 };
}
export function statsOf(list) {
  const v = list.filter(r => r.status === 'visible');
  return { count: v.length, avg: v.length ? Math.round(v.reduce((s, r) => s + r.rating, 0) / v.length * 10) / 10 : 0 };
}
// Can this hire's client rate it right now? One-time: automatically once Completed. Ongoing: when the admin sent the review option.
export function reviewOpen(h) { return +h.review_open === 1 || (hireKind(h) === 'once' && hireStatus(h) === 'completed'); }

export async function reviewInvite(env, h, origin) {
  let token = h.review_token;
  if (!token || token.length < 20) token = rand(16);
  const base = origin || 'https://jangidcuts.jangidcuts.workers.dev';
  const link = `${base}/track-hire?n=${encodeURIComponent(h.number)}&r=${token}`;
  const first = String(h.name || '').trim().split(/\s+/)[0] || 'there';
  const r = await sendTemplate(env, 'hire_review', h.email, { name: first, number: h.number, link }, { ref: h.number });
  await env.DB.prepare('UPDATE hire SET review_token = ?1, review_open = 1, review_sent_at = ?2 WHERE id = ?3').bind(token, r.ok ? now() : (h.review_sent_at || null), h.id).run();
  return { ok: r.ok, error: r.error || null };
}
