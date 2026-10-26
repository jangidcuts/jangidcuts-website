import { enc, now, b64url, b64std, clean, decrypt, encrypt, getKey, setKey, logEvent, isEmail } from './lib.js';

// Mail accounts: "main" = jangidcuts@gmail.com (OTP, orders, downloads, hire), "support" = supportjangidcuts@gmail.com (tickets only).
export const ACCOUNTS = { main: { label: 'Jangid Cuts', key: '_mail_main' }, support: { label: 'Jangid Cuts Support', key: '_mail_support' } };
// Which mailbox sends which template. Support/ticket mail -> support; everything else (OTP, orders, downloads, hire, business) -> main.
export const TEMPLATE_ACCOUNT = { ticket_received: 'support', ticket_solved: 'support', ticket_reply: 'support' };
export function accountFor(kind) { return TEMPLATE_ACCOUNT[kind] || (/^ticket/.test(kind || '') ? 'support' : 'main'); }
export function expectedEmail(env, account) { return account === 'support' ? (env.SUPPORT_EMAIL || 'supportjangidcuts@gmail.com') : (env.MAIN_EMAIL || 'jangidcuts@gmail.com'); }

export async function googleToken(env, account) {
  const cacheKey = 'gtok:' + account;
  if (env.CACHE) { const c = await env.CACHE.get(cacheKey); if (c) return c; }
  const acc = await getKey(env, ACCOUNTS[account].key);
  if (!acc || !acc.refresh_enc) return null;
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return null;
  const refresh = await decrypt(env, acc.refresh_enc);
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: refresh, grant_type: 'refresh_token' }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) {
    acc.last_error = (j.error || r.status) + ' ' + (j.error_description || ''); acc.last_error_at = now();
    await setKey(env, ACCOUNTS[account].key, acc);
    await logEvent(env, 'mail', `token refresh failed for ${account}: ${acc.last_error}`);
    return null;
  }
  if (env.CACHE) await env.CACHE.put(cacheKey, j.access_token, { expirationTtl: Math.max(60, (j.expires_in || 3600) - 300) });
  return j.access_token;
}

function encodeHeader(s) { return /^[\x20-\x7e]*$/.test(s) ? s : '=?UTF-8?B?' + b64std(enc.encode(s)) + '?='; }
function htmlEscape(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function linkify(s) { return s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#0DBC94">$1</a>'); }
export function htmlMail(text, brand) {
  const paras = htmlEscape(text).split(/\n{2,}/).map(p => '<p style="margin:0 0 14px;line-height:1.55">' + linkify(p).replace(/\n/g, '<br>') + '</p>').join('');
  return `<!doctype html><html><body style="margin:0;background:#000101;padding:24px 12px;font-family:Inter,Arial,sans-serif;color:#e8f2ef">
<div style="max-width:560px;margin:0 auto;background:#0b1414;border:1px solid #1d3a34;border-radius:16px;overflow:hidden">
<div style="padding:18px 24px;border-bottom:1px solid #1d3a34;font:700 22px/1 Impact,'Arial Narrow',sans-serif;letter-spacing:1px;color:#2BF5C0">${htmlEscape(brand || 'JANGID CUTS')}</div>
<div style="padding:22px 24px;font-size:15px">${paras}</div>
<div style="padding:14px 24px;border-top:1px solid #1d3a34;font-size:12px;color:#7d9690">Jangid Cuts · Video Editor & Graphic Designer · Jaipur, India</div>
</div></body></html>`;
}
function buildRaw({ from, fromName, to, subject, text, replyTo }) {
  const boundary = 'jc' + Math.random().toString(36).slice(2);
  const lines = [
    `From: ${encodeHeader(fromName)} <${from}>`, `To: ${to}`, `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0', `Content-Type: multipart/alternative; boundary="${boundary}"`
  ];
  if (replyTo) lines.push(`Reply-To: ${replyTo}`);
  const body = [
    '', `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64std(enc.encode(text)).replace(/.{76}/g, '$&\r\n'),
    `--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64std(enc.encode(htmlMail(text, fromName.toUpperCase()))).replace(/.{76}/g, '$&\r\n'),
    `--${boundary}--`, ''
  ];
  return lines.join('\r\n') + '\r\n' + body.join('\r\n');
}

async function deliver(env, row) {
  let account = row.account;
  let token = await googleToken(env, account);
  let replyTo = null, label = ACCOUNTS[account].label;
  if (!token && account === 'support') {
    // Support mailbox not connected: still reach the client, but replies go to the support address.
    await logEvent(env, 'mail', 'support mailbox unavailable, sent ' + (row.kind || 'mail') + ' via main with Reply-To support');
    account = 'main'; token = await googleToken(env, 'main'); replyTo = expectedEmail(env, 'support');
  }
  if (!token) throw new Error('Mail account not connected yet');
  const acc = await getKey(env, ACCOUNTS[account].key);
  const raw = buildRaw({ from: acc.email, fromName: label, to: row.to_addr, subject: row.subject, text: row.body, replyTo });
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: JSON.stringify({ raw: b64url(enc.encode(raw)) }) });
  if (!r.ok) { const t = await r.text(); if (r.status === 401 && env.CACHE) await env.CACHE.delete('gtok:' + account); throw new Error('Gmail ' + r.status + ': ' + t.slice(0, 200)); }
  return true;
}

export function fill(tpl, vars) { return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => vars[k] !== undefined ? String(vars[k]) : m); }

// Queue + try to send now. Returns {ok, error}
export async function sendMail(env, { account = 'main', to, subject, body, kind = 'mail', ref = '' }) {
  if (!isEmail(to)) return { ok: false, error: 'bad address' };
  // Every client mail carries its reference number (JC-ORD-…, JC-TKT-…) in the subject and the body.
  if (/^JC-[A-Z]+-/.test(ref)) {
    if (!String(subject).includes(ref)) subject = subject + ' [' + ref + ']';
    if (!String(body).includes(ref)) body = body + '\n\nReference: ' + ref;
  }
  const ins = await env.DB.prepare('INSERT INTO outbox (account, to_addr, subject, body, kind, ref, status, created) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) RETURNING id')
    .bind(account, to, clean(subject, 300), clean(body, 20000), kind, String(ref), 'pending', now()).first();
  try {
    await deliver(env, { account, to_addr: to, subject, body, kind });
    await env.DB.prepare("UPDATE outbox SET status = 'sent', sent_at = ?1, tries = tries + 1 WHERE id = ?2").bind(now(), ins.id).run();
    return { ok: true };
  } catch (e) {
    await env.DB.prepare("UPDATE outbox SET status = 'failed', error = ?1, tries = tries + 1 WHERE id = ?2").bind(String(e.message).slice(0, 500), ins.id).run();
    return { ok: false, error: e.message };
  }
}
export async function sendTemplate(env, name, to, vars, opts = {}) {
  const tpls = await getKey(env, 'mail_templates');
  const t = tpls[name]; if (!t) return { ok: false, error: 'no template ' + name };
  return sendMail(env, { account: opts.account || accountFor(name), to, subject: fill(t.subject, vars), body: fill(t.body, vars), kind: name, ref: opts.ref || '' });
}
export async function retryOutbox(env) {
  const { results } = await env.DB.prepare("SELECT * FROM outbox WHERE status = 'failed' AND tries < 6 AND created > ?1 ORDER BY id LIMIT 20").bind(now() - 3 * 864e5).all();
  for (const row of results) {
    try { await deliver(env, row); await env.DB.prepare("UPDATE outbox SET status = 'sent', sent_at = ?1, tries = tries + 1, error = NULL WHERE id = ?2").bind(now(), row.id).run(); }
    catch (e) { await env.DB.prepare("UPDATE outbox SET error = ?1, tries = tries + 1 WHERE id = ?2").bind(String(e.message).slice(0, 500), row.id).run(); }
  }
}

// Owner alerts: email to the alerts address + Telegram bot (if configured). Throttled per kind.
export async function alertOwner(env, kind, text, { throttleMin = 0 } = {}) {
  try {
    if (throttleMin && env.CACHE) { const k = 'alert:' + kind; if (await env.CACHE.get(k)) return; await env.CACHE.put(k, '1', { expirationTtl: Math.max(60, throttleMin * 60) }); }
    const a = await getKey(env, '_alerts');
    const jobs = [];
    if (a.telegram_bot_token_enc && a.telegram_chat_id) {
      const tok = await decrypt(env, a.telegram_bot_token_enc);
      jobs.push(fetch(`https://api.telegram.org/bot${tok}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: a.telegram_chat_id, text: '[Jangid Cuts] ' + text }) }).catch(() => { }));
    }
    if (a.email) jobs.push(sendMail(env, { account: 'main', to: a.email, subject: '[Jangid Cuts site] ' + text.split('\n')[0].slice(0, 90), body: text + '\n\nOpen your admin panel to see details.', kind: 'alert:' + kind }));
    await Promise.all(jobs);
  } catch (e) { await logEvent(env, 'alert', 'alert failed: ' + e.message); }
}
