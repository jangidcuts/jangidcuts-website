// Nov 1 2026 (Prashant, m:40c9a437 / m:a2d20eee): in-site bundle player.
// A Drive-delivered product may carry several Drive folder links (one per line in products.drive_id; the first line is the
// original single link). Buyers browse, stream and download every file through this Worker: they never see a Drive URL,
// a folder share list or anyone's email. Access = a signed, short-lived token minted only for a signed-in user who owns
// the product (owned row = paid order, free item or admin grant; a refund deletes it).
import { J, fail, now, enc, limitOrFail, rateLimit, logEvent } from './lib.js';
import { googleToken } from './mail.js';
import { driveId, DRIVE_FOLDER } from './storage.js';

const GA = 'application/vnd.google-apps.';
const SHORTCUT = GA + 'shortcut';
const HIDDEN = /^(jc[\s_-]*)?private\b|^[._]/i;        // JC_Private (and dot/underscore folders) never reach buyers
const LIST_TTL = 600;                                 // fresh listing cache (s)
const STALE_TTL = 30 * 86400;                         // stale copy served if Drive is down
const TOKEN_TTL = 12 * 3600e3;

export function driveLinks(p) {
  const raw = String((p && p.drive_id) || '') + '\n' + (p && p.delivery === 'drive' && !p.drive_id ? String(p.link_url || '') : '');
  const out = [];
  for (const line of raw.split(/[\n\r,]+/)) { const id = driveId(line.trim()); if (id && !out.includes(id)) out.push(id); }
  return out;
}
// Store form value: one https link per line, de-duplicated, max 10.
export function normDriveLinks(v) {
  const arr = Array.isArray(v) ? v : String(v || '').split(/[\n\r]+/);
  const seen = new Set(), out = [];
  for (let s of arr) {
    s = String(s || '').trim(); const id = driveId(s); if (!id || seen.has(id)) continue; seen.add(id);
    out.push(/^https:\/\//i.test(s) ? s.slice(0, 300) : (/folders/.test(s) ? 'https://drive.google.com/drive/folders/' + id : s.slice(0, 300)));
    if (out.length >= 10) break;
  }
  return out.join('\n');
}

async function listChildren(tok, id) {
  const out = []; let pt = '', pages = 0;
  do {
    const q = encodeURIComponent(`'${id}' in parents and trashed = false`);
    const r = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=nextPageToken,files(id,name,mimeType,size,shortcutDetails)&pageSize=1000&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true${pt ? '&pageToken=' + encodeURIComponent(pt) : ''}`, { headers: { authorization: 'Bearer ' + tok } });
    if (!r.ok) { const t = (await r.text()).slice(0, 200); const e = new Error('Drive list ' + r.status + ' ' + t); e.status = r.status; throw e; }
    const j = await r.json(); for (const f of j.files || []) out.push(f); pt = j.nextPageToken || '';
  } while (pt && ++pages < 20);
  const list = out.map(f => f.mimeType === SHORTCUT && f.shortcutDetails ? { id: f.shortcutDetails.targetId, name: f.name, mimeType: f.shortcutDetails.targetMimeType, size: f.size, sc: 1 } : f);
  // Nov 1: tier packs can be built from Drive SHORTCUTS to files of a bigger pack (no second copy); a shortcut has no size of its own -> read the target's
  const need = list.filter(f => f.sc && !(+f.size) && f.mimeType !== DRIVE_FOLDER);
  for (let i = 0; i < need.length; i += 10) await Promise.all(need.slice(i, i + 10).map(async f => { try { const m = await fileMeta(tok, f.id); f.size = m.size; } catch { } }));
  return list;
}
async function fileMeta(tok, id) {
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType,size&supportsAllDrives=true`, { headers: { authorization: 'Bearer ' + tok } });
  if (!r.ok) { const e = new Error('Drive meta ' + r.status); e.status = r.status; throw e; }
  return r.json();
}
const natural = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
const isFile = f => f && f.mimeType !== DRIVE_FOLDER && !String(f.mimeType || '').startsWith(GA);

// "JC_Cinematic_01_Rising Hope_120bpm.mp3" -> { title: "Rising Hope", no: 1, bpm: 120 }
export function trackInfo(name) {
  const base = String(name || '').replace(/\.[a-z0-9]{2,5}$/i, '');
  const bm = /[_\s-](\d{2,3})\s*bpm$/i.exec(base); const bpm = bm ? +bm[1] : 0;
  let rest = bm ? base.slice(0, bm.index) : base;
  let no = 0; const m = /^(?:JC[_\s-]+)?(?:.*?[_\s-])?(\d{1,3})[_\s-]+(.+)$/i.exec(rest);
  if (m && /^JC[_\s-]/i.test(rest)) { no = +m[1]; rest = m[2]; }
  const title = rest.replace(/[_]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Za-z])(\d)/g, '$1 $2').replace(/\s{2,}/g, ' ').trim() || base;
  return { title, no, bpm };
}
const cleanCat = s => String(s || '').replace(/^\d{1,3}[\s._-]+/, '').replace(/_/g, ' ').trim() || String(s || '');

// Walk one category folder (files in nested folders included, depth <= 3).
async function walk(tok, id, depth) {
  const kids = await listChildren(tok, id);
  const files = kids.filter(isFile);
  const subs = depth < 3 ? kids.filter(f => f.mimeType === DRIVE_FOLDER && !HIDDEN.test(f.name || '')) : [];
  const nested = await Promise.all(subs.map(s => walk(tok, s.id, depth + 1)));
  return files.concat(...nested);
}
const trackOf = f => { const t = trackInfo(f.name); return { i: f.id, n: t.title, f: f.name, s: +f.size || 0, m: f.mimeType || '', b: t.bpm }; };

export async function buildManifest(env, links) {
  const tok = await googleToken(env, 'main');
  if (!tok) { const e = new Error('Google Drive is not connected'); e.status = 503; throw e; }
  const cats = new Map(); const order = []; const roots = [];
  const add = (key, name, id, files) => {
    const k = key.toLowerCase();
    if (!cats.has(k)) { cats.set(k, { id, name, tracks: [] }); order.push(k); }
    const c = cats.get(k); const seen = new Set(c.tracks.map(t => t.i));
    for (const f of files) if (!seen.has(f.id)) { c.tracks.push(trackOf(f)); seen.add(f.id); }
  };
  await Promise.all(links.map(async (lid, li) => {
    const meta = await fileMeta(tok, lid);
    roots[li] = { name: meta.name };
    if (meta.mimeType !== DRIVE_FOLDER) { roots[li].files = [meta]; return; }
    const kids = await listChildren(tok, lid);
    const folders = kids.filter(f => f.mimeType === DRIVE_FOLDER && !HIDDEN.test(f.name || '')).sort((a, b) => natural(a.name, b.name));
    roots[li].loose = kids.filter(isFile);
    roots[li].folders = await Promise.all(folders.map(async f => ({ f, files: await walk(tok, f.id, 1) })));
  }));
  for (const r of roots) {
    if (!r) continue;
    if (r.files) { add('__files', 'Files', 'files', r.files); continue; }
    for (const { f, files } of r.folders) if (files.length) add(cleanCat(f.name), cleanCat(f.name), f.id, files);
    if (r.loose.length) add(cleanCat(r.name || 'More'), cleanCat(r.name || 'More'), 'root' + roots.indexOf(r), r.loose);
  }
  const list = order.map(k => cats.get(k));
  for (const c of list) { c.tracks.sort((a, b) => natural(a.f, b.f)); c.n = c.tracks.length; c.bytes = c.tracks.reduce((x, t) => x + t.s, 0); }
  list.sort((a, b) => natural(a.name, b.name));
  return { v: 1, at: now(), cats: list, n: list.reduce((x, c) => x + c.n, 0), bytes: list.reduce((x, c) => x + c.bytes, 0) };
}

const MEM = new Map(); // isolate-local cache: pid -> { at, key, man, ids }
async function linksKey(links) { const d = await crypto.subtle.digest('SHA-1', enc.encode(links.join('|'))); return [...new Uint8Array(d)].slice(0, 6).map(b => b.toString(16).padStart(2, '0')).join(''); }
export async function getManifest(env, p, { fresh = false } = {}) {
  const links = driveLinks(p); if (!links.length) { const e = new Error('No Drive link on this product'); e.status = 404; throw e; }
  const key = 'lib2:' + p.id + ':' + (await linksKey(links));
  const mem = MEM.get(p.id);
  if (!fresh && mem && mem.key === key && Date.now() - mem.at < 120e3) return mem.man;
  let man = null;
  if (!fresh && env.CACHE) { try { man = await env.CACHE.get(key, 'json'); } catch { } }
  if (!man) {
    try {
      man = await buildManifest(env, links);
      if (env.CACHE) { const s = JSON.stringify(man); await Promise.all([env.CACHE.put(key, s, { expirationTtl: LIST_TTL }), env.CACHE.put(key + ':stale', s, { expirationTtl: STALE_TTL })]).catch(() => { }); }
    } catch (e) {
      await logEvent(env, 'library', `listing failed for product ${p.id}: ${e.message}`);
      if (env.CACHE) { try { man = await env.CACHE.get(key + ':stale', 'json'); } catch { } }
      if (!man) throw e;
      man.stale = true;
    }
  }
  const ids = new Map(); for (const c of man.cats) for (const t of c.tracks) ids.set(t.i, t);
  MEM.set(p.id, { at: Date.now(), key, man, ids });
  return man;
}
async function trackOfProduct(env, p, fileId) {
  await getManifest(env, p);
  const mem = MEM.get(p.id);
  return (mem && mem.ids.get(fileId)) || null;
}

/* ---- signed tokens: <uid>.<pid>.<exp>.<sig> ---- */
let HKEY = null;
async function hkey(env) {
  if (HKEY) return HKEY;
  if (!env.ENC_KEY) fail('Server key missing', 500);
  const raw = await crypto.subtle.digest('SHA-256', enc.encode('jc-lib:' + env.ENC_KEY));
  HKEY = await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return HKEY;
}
async function sig(env, s) { const b = new Uint8Array(await crypto.subtle.sign('HMAC', await hkey(env), enc.encode(s))); return [...b.slice(0, 16)].map(x => x.toString(16).padStart(2, '0')).join(''); }
export async function libToken(env, uid, pid, ttl = TOKEN_TTL) { const exp = now() + ttl; const base = `${uid}.${pid}.${exp}`; return { token: base + '.' + (await sig(env, base)), exp }; }
async function checkToken(env, t) {
  const m = /^(\d+)\.(\d+)\.(\d+)\.([0-9a-f]{32})$/.exec(String(t || '')); if (!m) return null;
  if (+m[3] < now()) return null;
  const want = await sig(env, `${m[1]}.${m[2]}.${m[3]}`);
  let d = 0; for (let i = 0; i < 32; i++) d |= want.charCodeAt(i) ^ m[4].charCodeAt(i);
  return d ? null : { uid: +m[1], pid: +m[2], exp: +m[3] };
}

const OWN = new Map(); // isolate-local: "uid:pid" -> checked-at
async function owns(env, uid, pid, fresh = false) {
  const k = uid + ':' + pid, c = OWN.get(k); if (!fresh && c && Date.now() - c < 60e3) return true;
  const r = await env.DB.prepare('SELECT 1 FROM owned WHERE user_id = ?1 AND product_id = ?2').bind(uid, pid).first();
  if (r) OWN.set(k, Date.now()); else OWN.delete(k);
  return !!r;
}
export const isBundle = p => !!p && p.delivery === 'drive' && driveLinks(p).length > 0;

/* GET /api/lib/<pid>  (signed-in owner) -> categories + tracks + a 12 h token */
export async function libraryData(env, s, pid, { fresh = false } = {}) {
  if (!s) fail('Please sign in first', 401);
  const p = await env.DB.prepare('SELECT id, title, image, delivery, drive_id, link_url, size_text, price, tier, next_id, up_text FROM products WHERE id = ?1').bind(pid).first();
  if (!p || !isBundle(p)) fail('This item has no music library', 404);
  if (!(await owns(env, s.user.id, pid, true))) fail('Buy this pack first to open it', 403); // Nov 3: fresh check, so a revoked gift / refund closes the pack at once
  await limitOrFail(env, 'lib:' + s.user.id, 240, 3600e3);
  let man;
  try { man = await getManifest(env, p, { fresh: fresh && s.isAdmin }); }
  catch (e) { fail('Your files could not be loaded right now. Please try again in a minute.', 503); }
  const { token, exp } = await libToken(env, s.user.id, pid);
  await env.DB.prepare('UPDATE owned SET first_dl = COALESCE(first_dl, ?3), last_dl = ?3 WHERE user_id = ?1 AND product_id = ?2').bind(s.user.id, pid, now()).run().catch(() => { });
  // Nov 1: upgrade suggestion (each tier points only to the next one up)
  let next = null;
  if (p.next_id) { const n = await env.DB.prepare('SELECT id, title, short, size_text, price, tier, image FROM products WHERE id = ?1 AND visible = 1').bind(p.next_id).first(); if (n && n.id !== p.id) next = { ...n, up_text: p.up_text || '' }; }
  return J({ ok: true, product: { id: p.id, title: p.title, image: p.image, free: !(p.price > 0), tier: p.tier || '' }, next, token, exp, at: man.at, n: man.n, bytes: man.bytes, stale: !!man.stale,
    cats: man.cats.map(c => ({ id: c.id, name: c.name, n: c.n, bytes: c.bytes, tracks: c.tracks.map(t => ({ i: t.i, n: t.n, f: t.f, s: t.s, b: t.b, a: /^audio\//.test(t.m) || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(t.f) ? 1 : 0 })) })) });
}

/* GET|HEAD /api/lf/<token>/<fileId>/<name>[?dl=1]  -> the file, proxied from Drive with Range support */
export async function libraryFile(req, env, ctx, url) {
  const m = /^\/api\/lf\/([^/]+)\/([\w-]{20,})(?:\/[^/]*)?$/.exec(url.pathname);
  if (!m) return new Response('Not found', { status: 404 });
  const tk = await checkToken(env, decodeURIComponent(m[1]));
  if (!tk) return new Response('This link has expired. Please reopen the pack from My Downloads.', { status: 403, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
  if (!(await owns(env, tk.uid, tk.pid))) return new Response('Access removed.', { status: 403, headers: { 'cache-control': 'no-store' } });
  const p = await env.DB.prepare('SELECT id, delivery, drive_id, link_url FROM products WHERE id = ?1').bind(tk.pid).first();
  if (!p || !isBundle(p)) return new Response('Not found', { status: 404 });
  const t = await trackOfProduct(env, p, m[2]);
  if (!t) return new Response('Not found', { status: 404 });
  const dl = url.searchParams.get('dl') === '1';
  const range = req.headers.get('range');
  const first = !range || /^bytes=0-/.test(range);
  if (first && req.method === 'GET') {
    const ok = await rateLimit(env, (dl ? 'lfd:' : 'lfs:') + tk.uid, dl ? 1500 : 3000, 3600e3);
    if (!ok) return new Response('Too many downloads in a short time. Please wait a little and try again.', { status: 429, headers: { 'retry-after': '600' } });
  }
  const tok = await googleToken(env, 'main');
  if (!tok) return new Response('Temporarily unavailable. Please try again soon.', { status: 503 });
  const h = { authorization: 'Bearer ' + tok }; if (range) h.range = range;
  if (req.method === 'HEAD') h.range = 'bytes=0-0';
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(t.i)}?alt=media&supportsAllDrives=true&acknowledgeAbuse=true`, { headers: h });
  if (!r.ok && r.status !== 206) {
    const tx = (await r.text().catch(() => '')).slice(0, 200);
    ctx && ctx.waitUntil(logEvent(env, 'library', `file ${t.i} for product ${p.id}: ${r.status} ${tx}`));
    if (r.status === 416) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${t.s}` } });
    return new Response(/quota|rate/i.test(tx) ? 'Too many downloads of this file right now. Please try again in a few minutes.' : 'This file is not available right now.', { status: r.status === 404 ? 404 : 503, headers: { 'cache-control': 'no-store' } });
  }
  const out = new Headers();
  const ext = (/\.([a-z0-9]{2,5})$/i.exec(t.f) || [])[1] || '';
  const mime = { mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg', flac: 'audio/flac', mp4: 'video/mp4', zip: 'application/zip' }[ext.toLowerCase()];
  out.set('content-type', t.m && !/octet/.test(t.m) ? t.m : (mime || r.headers.get('content-type') || 'application/octet-stream'));
  for (const k of ['content-length', 'content-range']) { const v = r.headers.get(k); if (v) out.set(k, v); }
  if (req.method === 'HEAD') { out.delete('content-range'); out.set('content-length', String(t.s)); }
  out.set('accept-ranges', 'bytes');
  out.set('cache-control', 'private, no-store');
  out.set('x-content-type-options', 'nosniff');
  out.set('x-robots-tag', 'noindex');
  const fname = t.f.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_');
  const ascii = fname.replace(/[^\x20-\x7e]+/g, '_').replace(/"/g, '');
  out.set('content-disposition', `${dl ? 'attachment' : 'inline'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fname)}`);
  if (req.method === 'HEAD') { try { await r.body?.cancel(); } catch { } return new Response(null, { status: 200, headers: out }); }
  return new Response(r.body, { status: r.status, headers: out });
}

/* Admin: what the player will show for these links (no caching). */
export async function libraryPreview(env, links) {
  const ids = driveLinks({ drive_id: Array.isArray(links) ? links.join('\n') : String(links || '') });
  if (!ids.length) fail('Paste at least one Google Drive folder link');
  const res = [];
  for (const id of ids) {
    try { const man = await buildManifest(env, [id]); res.push({ id, ok: true, cats: man.cats.length, n: man.n, bytes: man.bytes }); }
    catch (e) { res.push({ id, ok: false, error: e.status === 404 || e.status === 403 ? 'jangidcuts@gmail.com cannot open this link. Share the folder with jangidcuts@gmail.com (Editor) and try again.' : (e.status === 503 ? 'Google Drive is not connected. Reconnect jangidcuts@gmail.com in Emails.' : 'Could not read this folder (' + (e.status || 'error') + ').') }); }
  }
  let all = null; try { all = await buildManifest(env, ids); } catch { }
  return J({ ok: true, links: res, total: all ? { cats: all.cats.length, n: all.n, bytes: all.bytes } : null });
}
