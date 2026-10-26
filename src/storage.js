import { now, rand, clean, fail } from './lib.js';

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
