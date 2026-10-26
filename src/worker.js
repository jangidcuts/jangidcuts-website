import { J, err, HttpError, now, rand, clean, readJson, cookie, sessionOf, newSession, findOrCreateUser, hashPw, pwProblem, safeEq, logEvent, SEC_HEADERS, getKey } from './lib.js';
import { serveFile } from './storage.js';
import { handlePublic } from './public.js';
import { handleAdmin, handleGoogle } from './admin.js';
import { retryOutbox, alertOwner, setOrigin } from './mail.js';
import { SEED_CATEGORIES, SEED_PORTFOLIO, SEED_PRODUCTS, SEED_REVIEWS } from './defaults.js';

const CSP = "default-src 'self'; script-src 'self' https://www.youtube.com https://s.ytimg.com https://checkout.razorpay.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.googletagservices.com https://*.adtrafficquality.google; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; font-src 'self'; connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google; frame-src https://*.doubleclick.net https://*.googlesyndication.com https://*.google.com https://*.adtrafficquality.google https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com https://player.vimeo.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://accounts.google.com; object-src 'none'";

async function seed(env) {
  const have = await env.DB.prepare('SELECT COUNT(*) n FROM categories').first();
  if (have.n > 0) return { skipped: true };
  const catId = {};
  let sort = 0;
  for (const [section, cats] of Object.entries(SEED_CATEGORIES)) {
    for (const [name, subs] of Object.entries(cats)) {
      const r = await env.DB.prepare('INSERT INTO categories (section, name, sort) VALUES (?1, ?2, ?3) RETURNING id').bind(section, name, sort++).first();
      catId[section + '/' + name] = r.id;
      for (const sub of subs) { const r2 = await env.DB.prepare('INSERT INTO categories (section, name, parent_id, sort) VALUES (?1, ?2, ?3, ?4) RETURNING id').bind(section, sub, r.id, sort++).first(); catId[section + '/' + name + '/' + sub] = r2.id; }
    }
  }
  const stmts = []; let i = 0;
  for (const [t, c, sc, img, o, clip, feat] of SEED_PORTFOLIO.video) stmts.push(env.DB.prepare('INSERT INTO portfolio (kind, title, category_id, subcategory_id, image, video, orient, featured, home, sort, created) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)')
    .bind('video', t, catId['portfolio_video/' + c], catId['portfolio_video/' + c + '/' + sc] || null, '/img/' + img, clip ? '/media/' + clip : '', o, feat, feat, i++, now()));
  for (const [t, c, sc, img, feat] of SEED_PORTFOLIO.thumb) stmts.push(env.DB.prepare('INSERT INTO portfolio (kind, title, category_id, subcategory_id, image, orient, featured, home, sort, created) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)')
    .bind('thumb', t, catId['portfolio_thumb/' + c], catId['portfolio_thumb/' + c + '/' + sc] || null, '/img/' + img, 'h', feat, 0, i++, now()));
  i = 0;
  for (const p of SEED_PRODUCTS) stmts.push(env.DB.prepare('INSERT INTO products (slug, title, short, description, price, mrp, category_id, image, delivery, size_text, badge, visible, sort, created, updated) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,0,?12,?13,?13)')
    .bind(p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''), p.title, p.short, p.short, p.price, p.mrp || 0, catId[p.cat[0] + '/' + p.cat[1]], '/img/' + p.image, 'file', p.size_text, p.badge, i++, now()));
  for (const r of SEED_REVIEWS) stmts.push(env.DB.prepare("INSERT INTO reviews (name, role, rating, text, status, featured, source, created) VALUES (?1,?2,?3,?4,'visible',1,'admin',?5)").bind(r.name, r.role, r.rating, r.text, now()));
  await env.DB.batch(stmts);
  return { seeded: true };
}

async function setup(req, env, url) {
  if (!env.SETUP_TOKEN) return err('setup disabled', 404);
  const b = await readJson(req);
  if (!safeEq(b.token || '', env.SETUP_TOKEN)) { await logEvent(env, 'security', 'bad setup token'); return err('forbidden', 403); }
  if (b.action === 'seed') return J({ ok: true, ...(await seed(env)) });
  if (b.action === 'admin_password') {
    const email = String(env.ADMIN_EMAILS || '').split(/[,\s]+/)[0].toLowerCase();
    const prob = pwProblem(b.password); if (prob) return err(prob);
    const u = await findOrCreateUser(env, email, 'Prashant Jangid', { tc: true });
    const salt = rand(16);
    await env.DB.prepare("UPDATE users SET pass_hash = ?1, salt = ?2, role = 'admin' WHERE id = ?3").bind(await hashPw(env, b.password, salt), salt, u.id).run();
    return J({ ok: true, email });
  }
  return err('unknown action');
}

async function notFound(req, env, url) {
  const r = await env.ASSETS.fetch(new Request(url.origin + '/404', { headers: req.headers }));
  const out = new Response(r.ok ? r.body : 'Not found', { status: 404, headers: r.ok ? r.headers : { 'content-type': 'text/plain' } });
  const o2 = withSec(out); o2.headers.set('cache-control', 'no-store'); return o2;
}
function withSec(res, extra = {}) {
  const r = new Response(res.body, res);
  for (const [k, v] of Object.entries({ ...SEC_HEADERS, 'content-security-policy': CSP, 'strict-transport-security': 'max-age=31536000; includeSubDomains', ...extra })) if (!r.headers.has(k)) r.headers.set(k, v);
  return r;
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url); const p = url.pathname; setOrigin(url.origin);
    try {
      // CSRF: every state-changing API call must come from our own pages (custom header + same origin).
      if (p.startsWith('/api/') && req.method !== 'GET' && req.method !== 'HEAD' && p !== '/api/webhooks/razorpay') {
        const o = req.headers.get('origin');
        if (req.headers.get('x-jc') !== '1' || (o && o !== url.origin)) return err('Blocked', 403);
      }
      if (p === '/api/setup' && req.method === 'POST') return await setup(req, env, url);
      if (p === '/api/health') return J({ ok: true, at: now() });
      /* ----- resume (public, no sign-in): meta, the PDF itself (?v= cache-bust, ?dl=1 download), viewer page ----- */
      if (p === '/api/resume' && req.method === 'GET') {
        const r = await getKey(env, '_resume');
        const res = J(r && r.key ? { ok: true, resume: { name: r.name, size: r.size, updated: r.updated, url: '/resume.pdf?v=' + r.updated, download: '/resume.pdf?v=' + r.updated + '&dl=1' } } : { ok: true, resume: null });
        res.headers.set('cache-control', 'no-store'); return res;
      }
      if (p === '/resume.pdf' && (req.method === 'GET' || req.method === 'HEAD')) {
        const r = await getKey(env, '_resume');
        if (!r || !r.key) return new Response('Resume not uploaded yet.', { status: 404, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });
        const v = url.searchParams.get('v'), fresh = v && v === String(r.updated);
        const dl = url.searchParams.get('dl') === '1' ? (String(r.name || 'Prashant_Jangid_Resume.pdf').replace(/[^\w.\- ]+/g, '_').replace(/\.pdf$/i, '') + '.pdf') : null;
        const out = await serveFile(req, env, r.key, { download: dl, cache: !!fresh });
        if (!fresh) out.headers.set('cache-control', 'no-cache, max-age=0');
        if (!dl) out.headers.set('content-disposition', 'inline; filename="' + (String(r.name || 'resume.pdf').replace(/[^\w.\- ]+/g, '_')) + '"');
        out.headers.set('content-type', 'application/pdf'); out.headers.set('x-robots-tag', 'noindex');
        return out;
      }
      if (p === '/resume' || p === '/resume/') { const res = await env.ASSETS.fetch(new Request(url.origin + '/resume', { headers: req.headers })); return withSec(res); }
      const s = await sessionOf(req, env);
      if (p.startsWith('/api/admin/')) { const r = await handleAdmin(req, env, ctx, url, s); return r || err('Not found', 404); }
      if (p.startsWith('/api/') || p.startsWith('/u/') || p.startsWith('/v/')) { const r = await handlePublic(req, env, ctx, url, s); return r || err('Not found', 404); }
      if (p.startsWith('/auth/google/') || p === '/admin/mail/connect' || p === '/admin/mail/callback') { const r = await handleGoogle(req, env, url, s, { newSession, findOrCreateUser, cookie }); if (r) return r; }
      if (p === '/admin' || p.startsWith('/admin/')) {
        if (!s || !s.isAdmin) return notFound(req, env, url);
        const res = await env.ASSETS.fetch(new Request(url.origin + '/admin', { headers: req.headers }));
        const r2 = withSec(res); r2.headers.set('cache-control', 'no-store'); r2.headers.set('x-robots-tag', 'noindex'); return r2;
      }
      if (/^\/(help|faq|support|track|track-order)\/?$/.test(p)) { const res = await env.ASSETS.fetch(new Request(url.origin + '/help', { headers: req.headers })); return withSec(res); }
      const PAGES = ['/privacy', '/terms', '/contact', '/social', '/licence', '/shipping', '/how-i-work'];
      if (p === '/portfolio.html') return Response.redirect(url.origin + '/portfolio' + url.search, 301);
      if (/^\/(portfolio|services|about)(\/[\w-]+)?\/?$/.test(p) || /^\/watch\/\d+\/?$/.test(p)) { const res = await env.ASSETS.fetch(new Request(url.origin + '/page', { headers: req.headers })); return withSec(res); }
      const APPP = ['/store', '/cart', '/orders', '/wishlist', '/tickets', '/profile'];
      if (APPP.includes(p.replace(/\/$/, ''))) { const res = await env.ASSETS.fetch(new Request(url.origin + '/store', { headers: req.headers })); return withSec(res); }
      if (PAGES.includes(p.replace(/\/$/, ''))) { const res = await env.ASSETS.fetch(new Request(url.origin + '/soon', { headers: req.headers })); return withSec(res); }
      if (p === '/robots.txt') return new Response('User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ' + url.origin + '/sitemap.xml\n', { headers: { 'content-type': 'text/plain' } });
      if (p === '/sitemap.xml') {
        const pages = ['/', '/portfolio', '/services', '/store', '/about', '/resume', '/contact', '/social', '/faq', '/support', '/track', '/track-order', '/how-i-work', '/privacy', '/terms', '/licence', '/shipping'];
        const { results } = await env.DB.prepare('SELECT id FROM products WHERE visible = 1').all();
        const urls = pages.map(x => `<url><loc>${url.origin}${x}</loc></url>`).concat(results.map(r => `<url><loc>${url.origin}/store?p=${r.id}</loc></url>`));
        return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`, { headers: { 'content-type': 'application/xml' } });
      }
      const rg = req.headers.get('range');
      if (rg && /^\/media\/[\w.-]+\.(mp4|webm|mov)$/i.test(p)) {
        // Bundled sample clips: answer byte ranges so the player can seek (±10s, scrubbing).
        const full = await env.ASSETS.fetch(new Request(url.origin + p));
        if (full.ok) {
          const buf = await full.arrayBuffer(), total = buf.byteLength, mm = /bytes=(\d*)-(\d*)/.exec(rg);
          let start = mm && mm[1] !== '' ? +mm[1] : 0, end = mm && mm[2] !== '' ? +mm[2] : total - 1;
          if (mm && mm[1] === '' && mm[2] !== '') { start = Math.max(0, total - +mm[2]); end = total - 1; }
          end = Math.min(end, total - 1);
          if (start >= total || start > end) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${total}` } });
          return new Response(buf.slice(start, end + 1), { status: 206, headers: { 'content-type': full.headers.get('content-type') || 'video/mp4', 'content-range': `bytes ${start}-${end}/${total}`, 'content-length': String(end - start + 1), 'accept-ranges': 'bytes', 'cache-control': 'public, max-age=86400' } });
        }
      }
      const res = await env.ASSETS.fetch(req);
      return withSec(res);
    } catch (e) {
      if (e instanceof HttpError) return err(e.message, e.status);
      ctx.waitUntil((async () => { await logEvent(env, 'error', `${req.method} ${p}: ${e.stack || e.message}`); await alertOwner(env, 'error', `Site error on ${p}: ${e.message}`, { throttleMin: 30 }); })());
      return err('Something went wrong on our side. Please try again.', 500);
    }
  },
  async scheduled(event, env, ctx) {
    const t = now();
    ctx.waitUntil(Promise.all([
      retryOutbox(env).catch(() => { }),
      env.DB.batch([
        env.DB.prepare('DELETE FROM hits WHERE exp < ?1').bind(t),
        env.DB.prepare('DELETE FROM otps WHERE exp < ?1').bind(t - 864e5),
        env.DB.prepare('DELETE FROM sessions WHERE exp < ?1').bind(t),
        env.DB.prepare('DELETE FROM events WHERE at < ?1').bind(t - 60 * 864e5),
        env.DB.prepare("DELETE FROM orders WHERE status = 'created' AND created < ?1").bind(t - 30 * 864e5)
      ]).catch(() => { })
    ]));
  }
};
