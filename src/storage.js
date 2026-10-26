import { now, rand, clean, fail, getContent } from './lib.js';

// Storage interface. R2 (env.MEDIA) is used automatically once it is bound; until then Workers KV (env.MEDIA_KV, 25 MB per file).
export function storageInfo(env) {
  if (env.MEDIA) return { backend: 'r2', maxBytes: 95 * 1024 * 1024, active: true };
  return { backend: 'kv', maxBytes: 25 * 1024 * 1024, active: false };
}
const safeName = (n) => clean(n, 120).replace(/[^\w.\-]+/g, '-').replace(/^-+|-+$/g, '') || 'file';

export async function putFile(env, { body, type, name, folder = 'media', size = 0 }) {
  const info = storageInfo(env);
  if (size > info.maxBytes) fail(info.backend === 'kv' ? 'This file is bigger than 25 MB. Cloud storage activation is pending — use a Google Drive / external link for big files for now.' : 'File too big for direct upload (95 MB max per file).', 413);
  const d = new Date(); const key = `${folder}/${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}/${rand(6)}-${safeName(name)}`;
  type = clean(type, 100) || 'application/octet-stream';
  if (info.backend === 'r2') {
    await env.MEDIA.put(key, body, { httpMetadata: { contentType: type } });
  } else {
    const buf = body instanceof ArrayBuffer ? body : await new Response(body).arrayBuffer();
    if (buf.byteLength > info.maxBytes) fail('File too big (25 MB max until cloud storage is on)', 413);
    size = buf.byteLength;
    await env.MEDIA_KV.put(key, buf, { metadata: { type, size } });
  }
  await env.DB.prepare('INSERT INTO media (key, name, type, size, store, folder, created) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)').bind(key, clean(name, 200), type, size, info.backend, folder, now()).run();
  return { key, url: '/u/' + key, size, type, store: info.backend };
}

export async function deleteFile(env, key) {
  const row = await env.DB.prepare('SELECT store FROM media WHERE key = ?1').bind(key).first();
  if (row?.store === 'r2' && env.MEDIA) await env.MEDIA.delete(key);
  else if (env.MEDIA_KV) await env.MEDIA_KV.delete(key);
  await env.DB.prepare('DELETE FROM media WHERE key = ?1').bind(key).run();
}

// Stream a stored file. Supports Range (video seeking on iPhone).
export async function serveFile(req, env, key, { download = null, cache = true } = {}) {
  const head = { 'accept-ranges': 'bytes', 'x-content-type-options': 'nosniff', 'cache-control': cache ? 'public, max-age=31536000, immutable' : 'private, no-store' };
  if (download) head['content-disposition'] = `attachment; filename="${download.replace(/["\\\r\n]/g, '')}"`;
  const range = req.headers.get('range');
  const row = await env.DB.prepare('SELECT store, type FROM media WHERE key = ?1').bind(key).first();
  if (row?.store === 'r2' && env.MEDIA) {
    const obj = await env.MEDIA.get(key, range ? { range: req.headers } : undefined);
    if (!obj) return new Response('Not found', { status: 404 });
    head['content-type'] = obj.httpMetadata?.contentType || row.type;
    if (range && obj.range) { const { offset, length } = obj.range; head['content-range'] = `bytes ${offset}-${offset + length - 1}/${obj.size}`; head['content-length'] = String(length); return new Response(obj.body, { status: 206, headers: head }); }
    head['content-length'] = String(obj.size);
    return new Response(obj.body, { headers: head });
  }
  if (!env.MEDIA_KV) return new Response('Not found', { status: 404 });
  const { value, metadata } = await env.MEDIA_KV.getWithMetadata(key, { type: 'arrayBuffer', cacheTtl: 3600 });
  if (!value) return new Response('Not found', { status: 404 });
  head['content-type'] = metadata?.type || row?.type || 'application/octet-stream';
  const total = value.byteLength;
  const m = range && /bytes=(\d*)-(\d*)/.exec(range);
  if (m) {
    let start = m[1] === '' ? Math.max(0, total - +m[2]) : +m[1];
    let end = m[1] !== '' && m[2] !== '' ? Math.min(+m[2], total - 1) : total - 1;
    if (start >= total || start > end) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${total}` } });
    head['content-range'] = `bytes ${start}-${end}/${total}`; head['content-length'] = String(end - start + 1);
    return new Response(value.slice(start, end + 1), { status: 206, headers: head });
  }
  head['content-length'] = String(total);
  return new Response(value, { headers: head });
}

// ---- Google Drive streaming (files stay in the owner's Drive; visitors only ever see our own URL) ----
export function driveId(s) {
  const m = String(s || '').match(/(?:\/file\/d\/|[?&]id=|\/folders\/)([\w-]{20,})/) || String(s || '').match(/^([\w-]{25,})$/);
  return m ? m[1] : '';
}
export async function driveMeta(env, token, id) {
  const ck = 'dmeta:' + id;
  if (env.CACHE) { const c = await env.CACHE.get(ck, 'json'); if (c) return c; }
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=name,mimeType,size&supportsAllDrives=true`, { headers: { authorization: 'Bearer ' + token } });
  if (!r.ok) return null;
  const j = await r.json();
  if (env.CACHE) await env.CACHE.put(ck, JSON.stringify(j), { expirationTtl: 3600 });
  return j;
}
export async function streamDrive(env, req, token, id, { download = null, cache = true } = {}) {
  const meta = await driveMeta(env, token, id);
  if (!meta) return new Response('This file is not available right now.', { status: 404 });
  const h = { authorization: 'Bearer ' + token };
  const range = req.headers.get('range'); if (range) h.range = range;
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true&acknowledgeAbuse=true`, { headers: h });
  if (!r.ok && r.status !== 206) return new Response('This file is not available right now.', { status: r.status === 403 ? 503 : 404 });
  const out = new Headers();
  out.set('content-type', meta.mimeType || r.headers.get('content-type') || 'application/octet-stream');
  for (const k of ['content-length', 'content-range']) { const v = r.headers.get(k); if (v) out.set(k, v); }
  out.set('accept-ranges', 'bytes');
  out.set('cache-control', cache ? 'public, max-age=3600' : 'private, no-store');
  out.set('x-content-type-options', 'nosniff');
  if (download) out.set('content-disposition', `attachment; filename="${String(download || meta.name || 'download').replace(/[^\w.\- ]+/g, '_')}"`);
  return new Response(r.body, { status: r.status, headers: out });
}

// Public Google Drive files ("Anyone with the link") stream without any Google login: drive.usercontent with confirm=t
// skips the big-file virus-scan page. Range is passed through so the native <video> can seek; nothing is buffered.
export async function streamDrivePublic(req, id, { download = null, cache = true } = {}) {
  const h = { 'user-agent': 'Mozilla/5.0 (JangidCuts)' }; const range = req.headers.get('range'); if (range) h.range = range;
  const r = await fetch(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`, { headers: h, redirect: 'follow' });
  const ct = r.headers.get('content-type') || '';
  if ((!r.ok && r.status !== 206) || /text\/html/i.test(ct)) { try { r.body?.cancel(); } catch { } return null; }
  return passThrough(r, { download, cache, type: ct });
}
export function passThrough(r, { download = null, cache = true, type = '' } = {}) {
  const out = new Headers();
  let ct = type || r.headers.get('content-type') || 'application/octet-stream';
  if (/octet-stream/i.test(ct) && !download) ct = 'video/mp4';
  out.set('content-type', ct);
  for (const k of ['content-length', 'content-range']) { const v = r.headers.get(k); if (v) out.set(k, v); }
  out.set('accept-ranges', 'bytes'); out.set('x-content-type-options', 'nosniff');
  out.set('cache-control', cache ? 'public, max-age=3600' : 'private, no-store');
  if (download) { const cd = r.headers.get('content-disposition'); const nm = typeof download === 'string' ? download : ((cd && /filename\*?=(?:UTF-8'')?"?([^";]+)/i.exec(cd)?.[1]) || 'download'); out.set('content-disposition', `attachment; filename="${decodeURIComponent(nm).replace(/[^\w.\- ]+/g, '_')}"`); }
  return new Response(r.body, { status: r.status, headers: out });
}
// One stream route for every video on the site (portfolio, product preview, hero showreel): uploaded file, Google Drive or any https link.
export async function streamVideoSource(req, env, { url = '', video = '' }, googleToken) {
  const did = driveId(url) || (/drive\.google\.com|docs\.google\.com/.test(video || '') ? driveId(video) : '');
  if (did) {
    const tok = googleToken ? await googleToken(env, 'main') : null;
    if (tok) { const r = await streamDrive(env, req, tok, did, { cache: true }); if (r.ok || r.status === 206) return r; }
    const pub = await streamDrivePublic(req, did, { cache: true }); if (pub) return pub;
    return new Response('This Drive video cannot be played. Set its sharing to "Anyone with the link".', { status: 404, headers: { 'x-jc-fallback': 'drive' } });
  }
  if (video && video.startsWith('/u/')) return serveFile(req, env, video.slice(3), { cache: true });
  const link = /^https:\/\//i.test(url) && !/youtu\.?be/i.test(url) ? url : (/^https:\/\//i.test(video) ? video : '');
  if (link) {
    const h = {}; const range = req.headers.get('range'); if (range) h.range = range;
    let r; try { r = await fetch(link, { headers: h, redirect: 'follow', cf: { cacheTtl: 3600 } }); } catch { r = null; }
    if (!r || (!r.ok && r.status !== 206) || /text\/html/i.test(r.headers.get('content-type') || '')) { try { r?.body?.cancel(); } catch { } return Response.redirect(link, 302); }
    return passThrough(r, { cache: true });
  }
  if (video) return Response.redirect(new URL(video, new URL(req.url).origin).toString(), 302);
  return new Response('Not found', { status: 404 });
}

// Storage meter for the admin (dashboard + Settings). Admin-only route, cached ~3 min in the CACHE kv.
const MB = 1024 * 1024, GB = 1024 * MB;
export const STORAGE_LIMITS = { kv: 1 * GB, r2: 10 * GB, d1: 500 * MB, d1Account: 5 * GB };
export async function storageMeter(env, fresh = false) {
  const ck = 'storage_meter_v1';
  if (!fresh && env.CACHE) { try { const c = await env.CACHE.get(ck, 'json'); if (c) return { ...c, cached: true }; } catch { } }
  const q = (sql) => env.DB.prepare(sql);
  const [byStore, pfLinked, prLinked, rows] = await env.DB.batch([
    q('SELECT store, COUNT(*) n, COALESCE(SUM(size),0) b FROM media GROUP BY store'),
    q("SELECT COUNT(*) n FROM portfolio WHERE source IN ('drive','youtube','link') OR (COALESCE(source,'') <> 'upload' AND (COALESCE(url,'') LIKE 'http%' OR COALESCE(video,'') LIKE 'http%'))"),
    q("SELECT COUNT(*) n FROM products WHERE delivery IN ('drive','link') OR COALESCE(video,'') LIKE 'http%'"),
    q('SELECT (SELECT COUNT(*) FROM users) users, (SELECT COUNT(*) FROM orders) orders, (SELECT COUNT(*) FROM tickets) tickets, (SELECT COUNT(*) FROM hire) hires, (SELECT COUNT(*) FROM ai_chat) chats, (SELECT COUNT(*) FROM reviews) reviews')
  ]);
  const st = {}; for (const r of byStore.results || []) st[r.store] = { n: r.n, b: r.b };
  let reel = 0; try { const c = await getContent(env); if (/^https?:/i.test(c.hero?.showreel || '')) reel = 1; } catch { }
  const linked = (pfLinked.results?.[0]?.n || 0) + (prLinked.results?.[0]?.n || 0) + reel;
  let dbBytes = byStore.meta?.size_after || rows.meta?.size_after || 0;
  if (!dbBytes) { try { const a = await q('PRAGMA page_count').first(); const b = await q('PRAGMA page_size').first(); dbBytes = (Object.values(a || {})[0] || 0) * (Object.values(b || {})[0] || 0); } catch { } }
  let r2 = { enabled: false, limit: STORAGE_LIMITS.r2 };
  if (env.MEDIA) {
    let used = 0, files = 0, cursor, pages = 0, exact = true;
    try { do { const l = await env.MEDIA.list({ cursor, limit: 1000 }); for (const o of l.objects) { used += o.size; files++; } cursor = l.truncated ? l.cursor : null; pages++; } while (cursor && pages < 30); if (cursor) exact = false; }
    catch { used = st.r2?.b || 0; files = st.r2?.n || 0; exact = false; }
    r2 = { enabled: true, used, files, limit: STORAGE_LIMITS.r2, exact };
  }
  const out = {
    at: Date.now(),
    files: { used: st.kv?.b || 0, files: st.kv?.n || 0, limit: STORAGE_LIMITS.kv, perFile: 25 * MB, linked, uploadsTo: env.MEDIA ? 'r2' : 'kv' },
    r2,
    db: { used: dbBytes, limit: STORAGE_LIMITS.d1, accountLimit: STORAGE_LIMITS.d1Account, rows: rows.results?.[0] || {} }
  };
  if (env.CACHE) { try { await env.CACHE.put(ck, JSON.stringify(out), { expirationTtl: 180 }); } catch { } }
  return out;
}
