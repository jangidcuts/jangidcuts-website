import { DEFAULTS } from './defaults.js';

export const enc = new TextEncoder();
export const now = () => Date.now();
export const hex = (buf) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
export const rand = (n = 32) => hex(crypto.getRandomValues(new Uint8Array(n)));
export const clean = (v, n = 2000) => String(v ?? '').replace(/\u0000/g, '').trim().slice(0, n);
export const SEC_HEADERS = {
  'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY', 'permissions-policy': 'camera=(), microphone=(), geolocation=()'
};
export const J = (o, s = 200, h = {}) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...SEC_HEADERS, ...h } });
export const err = (m, s = 400, extra = {}) => J({ ok: false, error: m, ...extra }, s);
export class HttpError extends Error { constructor(msg, status = 400) { super(msg); this.status = status; } }
export const fail = (m, s = 400) => { throw new HttpError(m, s); };
export async function sha256(s) { return hex(await crypto.subtle.digest('SHA-256', typeof s === 'string' ? enc.encode(s) : s)); }
export function b64url(bytes) { let s = ''; const a = new Uint8Array(bytes); for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode(...a.subarray(i, i + 8192)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
export function b64urlDecode(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
export function b64std(bytes) { let s = ''; const a = new Uint8Array(bytes); for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode(...a.subarray(i, i + 8192)); return btoa(s); }
export function safeEq(a, b) { a = String(a); b = String(b); if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
export const isEmail = (e) => /^[^\s@<>()",;:]{1,64}@[A-Za-z0-9.-]{1,180}\.[A-Za-z]{2,24}$/.test(e || '');
export const ip = (req) => req.headers.get('cf-connecting-ip') || '0.0.0.0';
export const dayStr = (t = now()) => new Date(t + 5.5 * 3600e3).toISOString().slice(0, 10); // IST day
export async function readJson(req, max = 200000) {
  const len = +(req.headers.get('content-length') || 0); if (len > max) fail('Request too large', 413);
  const t = await req.text(); if (t.length > max) fail('Request too large', 413);
  try { return t ? JSON.parse(t) : {}; } catch { fail('Bad JSON'); }
}
export function cookie(req, name) { const c = req.headers.get('cookie') || ''; const m = c.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)')); return m ? decodeURIComponent(m[1]) : null; }
export function setCookie(name, val, maxAge, opts = '') { return `${name}=${encodeURIComponent(val)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}${opts}`; }

/* ---------- AES-GCM for secrets at rest ---------- */
async function aesKey(env) {
  if (!env.ENC_KEY) fail('Server key missing', 500);
  const raw = await crypto.subtle.digest('SHA-256', enc.encode('jc-enc:' + env.ENC_KEY));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
export async function encrypt(env, text) {
  if (!text) return '';
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(env), enc.encode(text));
  return b64url(iv) + '.' + b64url(ct);
}
export async function decrypt(env, blob) {
  if (!blob) return '';
  const [iv, ct] = blob.split('.');
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64urlDecode(iv) }, await aesKey(env), b64urlDecode(ct));
  return new TextDecoder().decode(pt);
}

/* ---------- passwords + TOTP ---------- */
const PBKDF2_ITER = 20000;
export async function hashPw(env, pw, saltHex) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw + '|' + (env.PEPPER || '')), 'PBKDF2', false, ['deriveBits']);
  const salt = new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16)));
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITER }, key, 256));
}
export function pwProblem(pw) {
  pw = String(pw || '');
  // Any characters are allowed (letters only, numbers only, symbols, spaces...). Only the length is checked (Prashant, Oct 26 11:58 PM).
  if (pw.length < 6) return 'Password must be at least 6 characters';
  if (pw.length > 128) return 'Password is too long (128 characters max)';
  return null;
}
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32dec(s) { s = s.replace(/=+$/, '').replace(/\s/g, '').toUpperCase(); let bits = 0, val = 0; const out = []; for (const c of s) { const i = B32.indexOf(c); if (i < 0) continue; val = (val << 5) | i; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } } return new Uint8Array(out); }
export function b32enc(bytes) { let bits = 0, val = 0, out = ''; for (const b of bytes) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } } if (bits > 0) out += B32[(val << (5 - bits)) & 31]; return out; }
async function totpAt(secret, step) {
  const key = await crypto.subtle.importKey('raw', b32dec(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const msg = new ArrayBuffer(8); new DataView(msg).setUint32(4, step);
  const h = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg)); const o = h[19] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, '0');
}
export async function totpOk(secret, code) { code = String(code || '').replace(/\D/g, ''); if (code.length !== 6 || !secret) return false; const s = Math.floor(now() / 30000); for (const d of [-1, 0, 1]) if (await totpAt(secret, s + d) === code) return true; return false; }

/* ---------- content store ---------- */
export async function getContent(env, { includePrivate = false } = {}) {
  const { results } = await env.DB.prepare('SELECT k, v FROM kv').all();
  const out = {};
  for (const [k, v] of Object.entries(DEFAULTS)) out[k] = structuredClone(v);
  for (const r of results) { try { out[r.k] = JSON.parse(r.v); } catch { } }
  if (!includePrivate) for (const k of Object.keys(out)) if (k.startsWith('_')) delete out[k];
  return out;
}
export async function getKey(env, k) {
  const r = await env.DB.prepare('SELECT v FROM kv WHERE k = ?1').bind(k).first();
  if (r) { try { return JSON.parse(r.v); } catch { } }
  return DEFAULTS[k] !== undefined ? structuredClone(DEFAULTS[k]) : null;
}
export async function setKey(env, k, v) { await env.DB.prepare('INSERT INTO kv (k, v, updated) VALUES (?1, ?2, ?3) ON CONFLICT(k) DO UPDATE SET v = ?2, updated = ?3').bind(k, JSON.stringify(v), now()).run(); }
// Reference numbers: JC-<TYPE>-<number>, e.g. JC-ORD-100001. Types: ORD (paid order), DL (free download / licence),
// TKT (support ticket), HIRE (project request), REF (refund). Numeric + sequential per type from 100001 (Prashant 8:29 PM Oct 26).
export const REF_TYPES = { ORD: 'order', DL: 'free download', TKT: 'support ticket', HIRE: 'project request', REF: 'refund' };
const REF_ABC = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export async function newRef(env, type) {
  // Purely numeric, sequential per type: JC-TKT-100001, JC-TKT-100002 … (atomic counter row per type in D1).
  if (!REF_TYPES[type]) throw new Error('bad ref type ' + type);
  for (let i = 0; i < 5; i++) {
    const n = await nextNumber(env, 'ref_' + type, 100001);
    const ref = `JC-${type}-${n}`;
    const r = await env.DB.prepare('INSERT OR IGNORE INTO refs (ref, kind, created) VALUES (?1, ?2, ?3)').bind(ref, type, Date.now()).run();
    if (r.meta?.changes) return ref;
  }
  throw new Error('could not allocate reference');
}
// "100001", "jc tkt 100001", "JC-TKT-100001" -> "JC-TKT-100001"
export function normRef(type, s) {
  const t = String(s || '').toUpperCase().replace(/\s+/g, '').replace(/_/g, '-');
  if (/^\d{4,9}$/.test(t)) return `JC-${type}-${t}`;
  const m = t.match(/^(?:JC-?)?([A-Z]{2,4})-?([A-Z0-9]{4,9})$/);
  return m ? `JC-${m[1]}-${m[2]}` : t;
}
export async function nextNumber(env, name, start) {
  const r = await env.DB.prepare('INSERT INTO counters (name, n) VALUES (?1, ?2) ON CONFLICT(name) DO UPDATE SET n = n + 1 RETURNING n').bind(name, start).first();
  return r.n;
}

/* ---------- rate limiting ---------- */
export async function rateLimit(env, bucket, limit, windowMs) {
  const t = now(); const key = bucket + ':' + Math.floor(t / windowMs);
  const r = await env.DB.prepare('INSERT INTO hits (k, n, exp) VALUES (?1, 1, ?2) ON CONFLICT(k) DO UPDATE SET n = n + 1 RETURNING n').bind(key, t + windowMs * 2).first();
  return (r?.n || 0) <= limit;
}
export async function limitOrFail(env, bucket, limit, windowMs, msg = 'Too many attempts. Please wait a few minutes and try again.') {
  if (!(await rateLimit(env, bucket, limit, windowMs))) fail(msg, 429);
}

/* ---------- sessions ---------- */
export const SESSION_COOKIE = 'jc_s';
export async function newSession(env, req, userId, mfa = 0) {
  const t = rand(32); const th = await sha256(t);
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, exp, created, ua, ip, mfa) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)')
    .bind(th, userId, now() + 30 * 864e5, now(), clean(req.headers.get('user-agent'), 200), ip(req), mfa).run();
  await env.DB.prepare('UPDATE users SET last_login = ?1 WHERE id = ?2').bind(now(), userId).run();
  return setCookie(SESSION_COOKIE, t, 30 * 86400);
}
export async function sessionOf(req, env) {
  const t = cookie(req, SESSION_COOKIE); if (!t || t.length > 100) return null;
  const th = await sha256(t);
  const r = await env.DB.prepare('SELECT s.token_hash, s.exp, s.mfa, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?1').bind(th).first();
  if (!r || r.exp < now() || r.disabled) return null;
  const admins = String(env.ADMIN_EMAILS || '').toLowerCase().split(/[,\s]+/).filter(Boolean);
  const isAdmin = admins.includes(String(r.email).toLowerCase());
  let need2fa = false;
  if (isAdmin && !r.mfa) { const sec = await getKey(env, '_security'); need2fa = sec?.admin_2fa !== false; }
  return { th, mfa: !!r.mfa, user: r, isAdmin, need2fa, adminReady: isAdmin && !need2fa };
}
export function publicUser(u, isAdmin) {
  return { id: u.id, email: u.email, name: u.name || '', avatar: u.avatar || '', hasPassword: !!u.pass_hash, google: !!u.google_sub, email_notif: !!u.email_notif, lang: u.lang || 'en', currency: u.currency || 'INR', isAdmin: !!isAdmin, totp_on: !!u.totp_on, created: u.created };
}
export async function findOrCreateUser(env, email, name, extra = {}) {
  email = email.toLowerCase();
  let u = await env.DB.prepare('SELECT * FROM users WHERE email = ?1').bind(email).first();
  if (!u) {
    await env.DB.prepare('INSERT INTO users (email, name, created, tc_at, google_sub, avatar) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
      .bind(email, clean(name, 80) || email.split('@')[0], now(), extra.tc ? now() : null, extra.google_sub || null, extra.avatar || null).run();
    u = await env.DB.prepare('SELECT * FROM users WHERE email = ?1').bind(email).first();
    u._new = true;
  }
  return u;
}

/* ---------- events / alerts ---------- */
export async function logEvent(env, kind, msg) {
  try { await env.DB.prepare('INSERT INTO events (at, kind, msg) VALUES (?1, ?2, ?3)').bind(now(), kind, clean(msg, 1000)).run(); } catch { }
}
