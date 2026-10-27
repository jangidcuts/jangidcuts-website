import { DEFAULTS } from './defaults.js';
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
export function htmlMail(text, brand, opts = {}) {
  // Branded HTML email (real text, no images): table layout for Outlook, inline styles for Gmail,
  // dark theme by default with a light fallback for clients that prefer light mode.
  const kind = opts.kind || '';
  const code = /^otp/.test(kind) ? ((String(text).match(/\b(\d{6})\b/) || [])[1] || '') : '';
  let codeDone = false;
  const paras = htmlEscape(text).split(/\n{2,}/).map(p => {
    const rm = !code && p.match(/^Your ([a-z ]+) number: (JC-[A-Z]+-[A-Z0-9]+)\nYou can track your [a-z]+ here: (https?:\/\/\S+)$/);
    if (rm) {
      const digits = rm[2].replace(/^JC-[A-Z]+-/, '');
      return '<p class="jc-m" style="margin:4px 0 6px;font-size:13px;line-height:1.5;color:#7d9690">Your ' + rm[1] + ' number</p>' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px"><tr><td class="jc-code" bgcolor="#0f2621" style="background:#0f2621;border:1px solid #1f5a4a;border-radius:12px;padding:12px 20px">' +
        '<span style="font-family:\'Courier New\',Courier,monospace;font-size:24px;line-height:30px;font-weight:700;color:#2BF5C0;letter-spacing:0;-webkit-user-select:all;user-select:all">' + rm[2] + '</span></td></tr></table>' +
        '<p class="jc-m" style="margin:0 0 14px;font-size:12px;line-height:1.5;color:#7d9690">Keep this number safe. Tap and hold to copy it; the tracker accepts the full number or just the digits (' + digits + ').</p>' +
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px"><tr><td bgcolor="#0DBC94" style="background:#0DBC94;border-radius:10px"><a href="' + rm[3] + '" style="display:inline-block;padding:11px 20px;font-size:14px;font-weight:700;color:#04201a;text-decoration:none;border-radius:10px">Track your ' + (rm[1] === 'hire request' ? 'hire request' : rm[1]) + '</a></td></tr></table>';
    }
    let out = '<p class="jc-t" style="margin:0 0 14px;line-height:1.6;color:#e8f2ef">' + linkify(p).replace(/\n/g, '<br>') + '</p>';
    if (code && !codeDone && p.includes(code)) {
      codeDone = true;
      // The code sits alone as plain digits (no letter-spacing, no per-digit boxes) so a long-press / double-tap copies exactly the 6 digits.
      out += '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 8px"><tr><td class="jc-code" bgcolor="#0f2621" style="background:#0f2621;border:1px solid #1f5a4a;border-radius:12px;padding:14px 22px">' +
        '<span style="font-family:\'Courier New\',Courier,monospace;font-size:34px;line-height:40px;font-weight:700;color:#2BF5C0;letter-spacing:0;-webkit-user-select:all;user-select:all">' + code + '</span></td></tr></table>' +
        '<p class="jc-m" style="margin:0 0 16px;font-size:12px;line-height:1.5;color:#7d9690">Tap and hold (or double-tap) the code to copy it.</p>';
    }
    return out;
  }).join('');
  const pre = code ? code + ' is your Jangid Cuts code. It expires in 10 minutes.' : String(text).replace(/\s+/g, ' ').slice(0, 110);
  const b = htmlEscape(brand || 'JANGID CUTS');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"><title>${b}</title>
<style>
@media (prefers-color-scheme: light){
 .jc-bg{background:#eef4f2!important}.jc-card{background:#ffffff!important;border-color:#cfe3dd!important}
 .jc-t{color:#14201e!important}.jc-m{color:#4f6661!important}.jc-brand{color:#077A5C!important}
 .jc-code{background:#e6f5f0!important;border-color:#9fd8c6!important}.jc-code span{color:#066B51!important}
 .jc-line{border-color:#dcebe6!important}a{color:#077A5C!important}
}
@media only screen and (max-width:600px){.jc-pad{padding-left:18px!important;padding-right:18px!important}}
</style></head>
<body class="jc-bg" style="margin:0;padding:0;background:#000101">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all">${htmlEscape(pre)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" class="jc-bg" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000101" style="background:#000101"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" class="jc-card" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b1414" style="max-width:560px;background:#0b1414;border:1px solid #1d3a34;border-radius:16px;font-family:Inter,'Segoe UI',Arial,sans-serif">
<tr><td height="4" bgcolor="#0DBC94" style="height:4px;line-height:4px;font-size:0;border-radius:16px 16px 0 0;background:#0DBC94;background-image:linear-gradient(90deg,#2BF5C0,#4DCBB0 35%,#0DBC94 65%,#196453)">&nbsp;</td></tr>
<tr><td class="jc-pad jc-line jc-brand" style="padding:18px 24px;border-bottom:1px solid #1d3a34;font-family:Impact,'Arial Narrow Bold','Arial Narrow',Arial,sans-serif;font-size:24px;line-height:26px;font-weight:700;letter-spacing:1px;color:#2BF5C0;white-space:nowrap">${b}</td></tr>
<tr><td class="jc-pad" style="padding:22px 24px 8px;font-size:15px">${paras}</td></tr>
<tr><td class="jc-pad jc-line jc-m" style="padding:14px 24px 18px;border-top:1px solid #1d3a34;font-size:12px;line-height:1.5;color:#7d9690">Jangid Cuts · Video Editor &amp; Graphic Designer · Jaipur, India</td></tr>
</table></td></tr></table></body></html>`;
}
function buildRaw({ from, fromName, to, subject, text, replyTo, kind }) {
  const boundary = 'jc' + Math.random().toString(36).slice(2);
  const lines = [
    `From: ${encodeHeader(fromName)} <${from}>`, `To: ${to}`, `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0', `Content-Type: multipart/alternative; boundary="${boundary}"`
  ];
  if (replyTo) lines.push(`Reply-To: ${replyTo}`);
  const body = [
    '', `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64std(enc.encode(text)).replace(/.{76}/g, '$&\r\n'),
    `--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', b64std(enc.encode(htmlMail(text, fromName.toUpperCase(), { kind }))).replace(/.{76}/g, '$&\r\n'),
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
  const raw = buildRaw({ from: acc.email, fromName: label, to: row.to_addr, subject: row.subject, text: row.body, replyTo, kind: row.kind });
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: JSON.stringify({ raw: b64url(enc.encode(raw)) }) });
  if (!r.ok) { const t = await r.text(); if (r.status === 401 && env.CACHE) await env.CACHE.delete('gtok:' + account); throw new Error('Gmail ' + r.status + ': ' + t.slice(0, 200)); }
  return true;
}

export function fill(tpl, vars) { return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => vars[k] !== undefined ? String(vars[k]) : m); }

// Queue + try to send now. Returns {ok, error}

// Every client email that carries a reference gets the "track it" line (Prashant 8:29 PM Oct 26).
let ORIGIN = '';
export function setOrigin(o) { if (o) ORIGIN = o; }
export function trackLine(body, ref) {
  // Oct 27c: each type links to its OWN tracker, prefilled with the number; the number sits on its own line so it is easy to copy.
  body = String(body || ''); ref = String(ref || '');
  let num = ref, kind = (ref.match(/^JC-([A-Z]+)-/) || [])[1];
  if (kind === 'REF') { const o = body.match(/JC-(ORD|DL)-[A-Z0-9]+/); if (!o) return body; num = o[0]; kind = o[1]; }
  if (!kind || /\/track(-[a-z]+)?\?n=/.test(body)) return body;
  const base = ORIGIN || 'https://jangidcuts.jangidcuts.workers.dev';
  const T = { TKT: ['ticket', 'track-ticket', 'ticket'], HIRE: ['hire request', 'track-hire', 'request'], ORD: ['order', 'track-order', 'order'], DL: ['order', 'track-order', 'order'] }[kind];
  if (!T) return body;
  const line = `Your ${T[0]} number: ${num}\nYou can track your ${T[2]} here: ${base}/${T[1]}?n=${encodeURIComponent(num)}`;
  const sig = body.search(/\n\n(Regards,|Best regards|Warm regards|Thanks,|Team Jangid Cuts|Jangid Cuts Support\s*$|Jangid Cuts\s*$|Prashant Jangid)/i);
  return sig > 0 ? body.slice(0, sig) + '\n\n' + line + body.slice(sig) : body + '\n\n' + line;
}
export async function sendMail(env, { account = 'main', to, subject, body, kind = 'mail', ref = '' }) {
  if (!isEmail(to)) return { ok: false, error: 'bad address' };
  // Every client mail carries its reference number (JC-ORD-…, JC-TKT-…) in the subject and the body.
  if (/^JC-[A-Z]+-/.test(ref) && !/^alert/.test(kind)) body = trackLine(body, ref);
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
  const t = (tpls && tpls[name]) || DEFAULTS.mail_templates[name]; if (!t) return { ok: false, error: 'no template ' + name };
  let subject = fill(t.subject, vars);
  // Code mails: the code leads the subject so phones show/offer it straight from the notification.
  if (name === 'otp' && vars.code && !subject.startsWith(vars.code)) subject = vars.code + ' is your Jangid Cuts code';
  return sendMail(env, { account: opts.account || accountFor(name), to, subject, body: fill(t.body, vars), kind: name, ref: opts.ref || '' });
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
