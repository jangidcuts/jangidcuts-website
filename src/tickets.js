// Support tickets: status timeline, client tracking, status emails, AI solution replies (Workers AI).
import { now, clean, getKey, logEvent } from './lib.js';
import { sendMail, sendTemplate } from './mail.js';

export const STEPS = ['received', 'read', 'processing', 'solved'];
export const LABELS = { received: 'Received', read: 'Read', processing: 'Processing', solved: 'Solution delivered', closed: 'Closed' };
export const STATUS_NOTES = {
  read: 'Our support team has read your ticket and will start working on it shortly.',
  processing: 'We are working on a solution for you. You will get it by email as soon as it is ready.',
  solved: 'A solution has been sent to you by email.',
  closed: 'This ticket is now closed. If you still need help, just reply to this email or raise a new ticket.'
};
export function norm(s) { return s === 'pending' || !s ? 'received' : s; }
export function eventsOf(t) {
  let ev = []; try { ev = JSON.parse(t.events || '[]'); } catch { }
  if (!Array.isArray(ev) || !ev.length) { ev = [{ s: 'received', at: t.created }]; if (t.read_at) ev.push({ s: 'read', at: t.read_at }); if (t.solved_at) ev.push({ s: 'solved', at: t.solved_at }); }
  return ev;
}
export function threadOf(t) { try { const x = JSON.parse(t.thread || '[]'); return Array.isArray(x) ? x : []; } catch { return []; } }
export function timeline(t) {
  const ev = eventsOf(t), st = norm(t.status), last = {};
  for (const e of ev) last[e.s] = e.at;
  const idx = st === 'closed' ? STEPS.length : STEPS.indexOf(st);
  const steps = STEPS.map((s, i) => ({ s, label: LABELS[s], at: last[s] || null, done: i <= idx, current: i === idx }));
  if (st === 'closed') steps.push({ s: 'closed', label: LABELS.closed, at: last.closed || null, done: true, current: true });
  return steps;
}
export function maskEmail(e) { const [u, d] = String(e || '').split('@'); if (!d) return ''; return (u[0] || '') + '***@' + d; }
// full=false (public Track page): status timeline, dates and category only. full=true (owner's own account list): also message + solution.
export function publicTicket(t, { full = false } = {}) {
  const st = norm(t.status);
  const o = { number: t.number, topic: t.topic, status: st, label: LABELS[st] || st, created: t.created, steps: timeline(t) };
  if (full) { o.message = String(t.message || '').slice(0, 600); o.solution = (st === 'solved' || st === 'closed') ? (t.solution || '') : ''; }
  else o.email = maskEmail(t.email);
  return o;
}
export function trackUrl(origin, number) { return (origin || '') + '/track?n=' + encodeURIComponent(number); }

// Moves a ticket to a new status, records the time of every step reached, and emails the client (support mailbox).
export async function setStatus(env, t, status, { origin = '', mail = true, solution = null, by = 'admin' } = {}) {
  if (!LABELS[status]) throw new Error('Unknown status');
  const cur = norm(t.status), ev = eventsOf(t), at = now();
  const have = new Set(ev.map(e => e.s));
  const ti = STEPS.indexOf(status);
  if (ti > 0) for (let i = 0; i < ti; i++) if (!have.has(STEPS[i])) ev.push({ s: STEPS[i], at });
  if (cur !== status || !have.has(status)) ev.push({ s: status, at, by });
  const sets = ['status = ?1', 'events = ?2'], vals = [status, JSON.stringify(ev.slice(-40))];
  if (status === 'read' && !t.read_at) { sets.push('read_at = ?' + (vals.length + 1)); vals.push(at); }
  if (solution !== null) { sets.push('solution = ?' + (vals.length + 1)); vals.push(solution); sets.push('solved_at = ?' + (vals.length + 1)); vals.push(at); }
  vals.push(t.id);
  await env.DB.prepare(`UPDATE tickets SET ${sets.join(', ')} WHERE id = ?${vals.length}`).bind(...vals).run();
  let mailed = null, mailError = null;
  if (mail && cur !== status && status !== 'received') {
    const r = await sendTemplate(env, 'ticket_status', t.email, { name: t.name || 'there', number: t.number, status: LABELS[status], note: STATUS_NOTES[status] || '', track: trackUrl(origin, t.number) }, { account: 'support', ref: t.number });
    mailed = r.ok; mailError = r.error || null;
  }
  return { status, events: ev, mailed, mailError };
}
export async function addThread(env, t, entry) {
  const th = threadOf(t); th.push({ at: now(), ...entry });
  await env.DB.prepare('UPDATE tickets SET thread = ?1 WHERE id = ?2').bind(JSON.stringify(th.slice(-50)), t.id).run();
  return th;
}

/* ---------- AI solution (Workers AI, free tier) ---------- */
export const AI_DEFAULTS = {
  enabled: true,
  model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  instructions: [
    'Bought packs are in My Orders & Downloads on the account email, with lifetime access. They can be downloaded again any time.',
    'Big files: the download link is emailed from jangidcuts@gmail.com after purchase. Ask them to check Spam/Promotions too.',
    'Refunds: only if the pack was not delivered. No refund once the download is enabled.',
    'Payments are secure (UPI, cards, net banking). If money was deducted but the order is not showing, ask for the payment reference and say we will fix it within 24 hours.',
    'Business or project enquiries go to jangidcuts@gmail.com or the Hire Me form.',
    'Never share personal phone numbers. Never ask for passwords, OTPs or card details.'
  ].join('\n')
};
export async function aiSettings(env) { return { ...AI_DEFAULTS, ...((await getKey(env, '_ai_support')) || {}) }; }
const SIGN = 'Regards,\nTeam Jangid Cuts';
export function cleanReply(txt, name) {
  let s = String(txt || '').replace(/\r/g, '').replace(/\*\*|__|^#+\s*/gm, '').replace(/^\s*subject:.*$/gim, '').trim();
  // strip any sign-off the model wrote; ours is added below
  const lines = s.split('\n'); let cut = lines.length;
  for (let i = Math.max(0, lines.length - 8); i < lines.length; i++) if (/^\s*(best\s+)?(warm\s+|kind\s+)?(regards|sincerely|thanks and regards|thank you|best|cheers|yours\s+\w+)\s*,?\s*$/i.test(lines[i])) { cut = i; break; }
  s = lines.slice(0, cut).join('\n').replace(/\n*(team jangid cuts|jangid cuts support|jangid cuts team)\s*$/i, '').trim();
  s = s.split('\n').map(l => l.trim()).filter(Boolean).join('\n\n');
  if (s.length < 40) return '';
  return s + '\n\n' + SIGN;
}
export async function aiDraft(env, t) {
  if (!env.AI) throw new Error('AI is not connected on this site yet.');
  const cfg = await aiSettings(env);
  const faq = ((await getKey(env, 'faq')) || []).map(x => `Q: ${x.q}\nA: ${x.a}`).join('\n').slice(0, 3000);
  const sys = [
    'You write email replies for Jangid Cuts Support. Jangid Cuts is the video editing and graphic design brand of Prashant Jangid (Jaipur, India). The website sells editing packs (free and paid), takes Hire Me project requests and handles support tickets.',
    'Write ONE reply to the customer ticket below. Style: polite, formal, warm and helpful.',
    '- Start with "Dear <first name>," then thank them for reaching out to Jangid Cuts Support.',
    '- Then solve the problem directly with clear, practical steps that fit THIS problem.',
    '- Use only facts from the owner instructions and the FAQ. Never invent prices, policies, refund promises, deadlines, links or phone numbers.',
    '- If the information is not enough to solve it, say the team is looking into it and will follow up by email shortly, and ask for any detail you need (for example an order number).',
    '- Never ask for passwords, OTP codes or card details.',
    '- Plain text only (no markdown, no subject line), 80 to 180 words.',
    '- Reply in the language the customer wrote in (Hindi/Hinglish customers can get a polite English reply unless they wrote in Hindi script).',
    '- Do NOT write any closing or sign-off (no "Regards", no name). It is added automatically.',
    '', 'OWNER INSTRUCTIONS (always follow these):', clean(cfg.instructions, 4000) || '(none)', '', 'FAQ:', faq || '(none)'
  ].join('\n');
  const pre = String(t.email || '').split('@')[0];
  let nm = String(t.name || '').trim(); if (!nm || nm === pre || /[0-9+_@.]/.test(nm)) nm = ''; else nm = nm.split(/\s+/)[0].replace(/^./, c => c.toUpperCase());
  const user = `Ticket ${t.number}\nCustomer first name: ${nm || 'unknown (greet them as "Dear Customer,")'}\nTopic: ${t.topic || 'General'}\nProblem:\n${String(t.message || '').slice(0, 3500)}`;
  const models = [cfg.model || AI_DEFAULTS.model, '@cf/meta/llama-3.1-8b-instruct'];
  let lastErr = '';
  for (const m of [...new Set(models)]) {
    try {
      const r = await env.AI.run(m, { messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], max_tokens: 600, temperature: 0.4 });
      const out = cleanReply(r && (r.response ?? r.result?.response), t.name);
      if (out) return { text: out, model: m };
      lastErr = 'The AI returned an empty reply';
    } catch (e) { lastErr = e.message || String(e); await logEvent(env, 'ai', `ai ${m} failed on ${t.number}: ${lastErr}`); }
  }
  throw new Error('AI could not write a reply (' + lastErr.slice(0, 160) + '). Please try again or write the solution yourself.');
}
// Sends a solution email (AI or manual text) from the support mailbox, logs it in the thread, sets "Solution delivered".
export async function sendSolution(env, t, text, { origin = '', by = 'admin', model = '' } = {}) {
  const body0 = String(text || '').trim();
  if (body0.length < 20) throw new Error('The reply is empty. Nothing was sent.');
  let body = body0;
  if (!body.includes(t.number)) {
    const tail = `\n\nTicket: ${t.number} (status: Solution delivered)`;
    const k = body.lastIndexOf('\n\nRegards,');
    body = k > 0 ? body.slice(0, k) + tail + body.slice(k) : body + tail;
  }
  const r = await sendMail(env, { account: 'support', to: t.email, subject: `Solution for your ticket ${t.number} — Jangid Cuts Support`, body, kind: 'ticket_solved', ref: t.number });
  if (!r.ok) { await addThread(env, t, { by, kind: 'solution_failed', body, error: r.error || 'mail failed', model }); throw new Error('Email could not be sent: ' + (r.error || 'unknown error') + '. The ticket status was not changed.'); }
  const fresh = await env.DB.prepare('SELECT * FROM tickets WHERE id = ?1').bind(t.id).first();
  await addThread(env, fresh, { by, kind: 'solution', body, model, to: t.email, from: 'supportjangidcuts@gmail.com' });
  const f2 = await env.DB.prepare('SELECT * FROM tickets WHERE id = ?1').bind(t.id).first();
  await setStatus(env, f2, 'solved', { origin, mail: false, solution: body, by });
  return { ok: true, body };
}
