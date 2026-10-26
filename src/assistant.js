// Admin "AI Assistant": a chat for the site owner on Cloudflare Workers AI (same binding/model as "Send AI solution").
// It answers how-to questions about the site and proposes SAFE admin actions. Nothing changes until the admin taps Confirm;
// the server re-validates the stored action (never the client's copy) and keeps the old value so Undo can restore it.
import { J, fail, now, clean, readJson, getContent, getKey, setKey, logEvent, limitOrFail } from './lib.js';
import { DEFAULTS } from './defaults.js';
import { aiDraft, AI_DEFAULTS, aiSettings } from './tickets.js';

const BLOCKED_KEYS = new Set(['app', 'ads', 'languages', 'portfolio_rows', 'portfolio_video', 'portfolio_thumb', 'store_free', 'store_paid', 'mail_templates', 'payments_public']);
const MAX_HISTORY = 200;

const SITE_GUIDE = `
WEBSITE (public): Home page (hero: big "JANGID CUTS" word, photo, name, role, "Hello, I am", Hire Me + View Resume buttons; stats; featured work; services; reviews; About the editor with View Resume), Portfolio (/portfolio, videos + thumbnails, /watch/<id> player), Services (/services and /services/<slug>), Store (/store: free + paid packs, cart, checkout by Razorpay, My Orders, downloads), Support (/support: ticket form, Track request), FAQ (/faq, "Facing any issue?" button -> Support), Track order (/track-order), Resume (/resume PDF viewer + download), Profile/Settings (sign-in, change password, language, theme), footer pages (About, How I Work, Terms, Privacy, Licence, Shipping, Contact, Social). Entry sign-in screen shows on every new visit for signed-out visitors. 7 languages (English, Hindi, Spanish, French, German, Portuguese, Japanese).
ADMIN PANEL (/admin, sidebar): Dashboard (sales, visits, health); Client Desk (Support tickets, Hire requests; open a ticket -> status, "Send AI solution", manual reply; search by JC no., name or email); Website: Home page (hero texts/photo, stats, sections), Services, Portfolio (add video/thumbnail: Upload file OR Paste link — Google Drive / direct link plays exactly like an upload, YouTube plays in a minimal look), Reviews (add/edit, Visible/Hidden, show on home), Pages & FAQ (About, How I Work, Terms, Privacy, FAQ list, help texts), Contact & Social (email, phone, social links); Store: Products (add pack: price, MRP, image, preview video, download file = Upload file OR Paste link (Google Drive link stays hidden until paid); Publish / Move to Draft button; new products start as Draft), Store settings, Coupons, Orders (JC-ORD numbers, status, refund); People & mail: Users, Emails (connect jangidcuts@gmail.com + supportjangidcuts@gmail.com, email templates), Media library (uploads up to 25 MB each until 10 GB storage is turned on with billing); System: Settings & security (admin 2-step code, password, AI support instructions, Resume PDF upload, Payments / Razorpay keys, site problem alerts, backup), AI Assistant (this chat).
REFERENCE NUMBERS: JC-TKT-100001 (tickets), JC-ORD- (orders), JC-HIRE- (hire requests), JC-DL- (free downloads), JC-REF- (refunds).`;

const TOOLS_DOC = `
ACTIONS you can PROPOSE (the admin must tap Confirm before anything happens). Put AT MOST ONE action at the very end of your reply as:
<action>{"tool":"<name>","args":{...}}</action>
Tools:
- set_text {"path":"<section.field>","value":"<new text>"}  change one site text/setting from EDITABLE FIELDS below (use the exact path shown, e.g. "hero.role", "faq.2.a", "footer.about"). Numbers/true/false fields take a number/true/false.
- product_update {"id":<product id>,"price":<rupees>,"mrp":<rupees>,"status":"published"|"draft","title":"..."}  any subset of price/mrp/status/title.
- review_visibility {"id":<review id>,"status":"visible"|"hidden"}
- portfolio_visibility {"id":<portfolio id>,"visible":true|false}
- ticket_draft {"number":"JC-TKT-100001"}  writes a reply draft for a support ticket (shown in chat only, nothing is emailed).
Rules for actions: ONLY add an action when the admin clearly asks you to change something; for questions just answer (no action). Only use ids/paths that appear in the data below; never invent them. If the admin's request is unclear, ask a short question instead of proposing. Never say a change is done before it is confirmed; say "Tap Confirm to apply."`;

function flatten(obj, pre, out, depth = 0) {
  if (depth > 4 || out.length > 400) return out;
  if (Array.isArray(obj)) obj.forEach((v, i) => flatten(v, pre + '.' + i, out, depth + 1));
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) flatten(v, pre ? pre + '.' + k : k, out, depth + 1);
  else if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') out.push([pre, obj]);
  return out;
}
function editable(content) {
  const out = [];
  for (const [k, v] of Object.entries(content)) { if (k.startsWith('_') || BLOCKED_KEYS.has(k) || !(k in DEFAULTS)) continue; flatten(v, k, out); }
  return out.filter(([p]) => !/(^|\.)(icon|photo|image|img|url|video|thumb|zoom|shift_y|bg|logo)$/.test(p) || /url$/.test(p) && p.startsWith('socials'));
}
function getPath(obj, parts) { let o = obj; for (const p of parts) { if (o == null) return undefined; o = o[p]; } return o; }
function setPath(obj, parts, val) { let o = obj; for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]]; o[parts[parts.length - 1]] = val; }
const short = (v, n = 90) => { const s = String(v ?? '').replace(/\s+/g, ' '); return s.length > n ? s.slice(0, n) + '…' : s; };
const rupees = (n) => '₹' + Number(n || 0).toLocaleString('en-IN'); // prices are stored in whole rupees

async function snapshot(env) {
  const content = await getContent(env);
  const [prods, revs, pf, tix] = await env.DB.batch([
    env.DB.prepare('SELECT id, title, price, mrp, visible FROM products ORDER BY sort, id LIMIT 60'),
    env.DB.prepare('SELECT id, name, rating, status, substr(text,1,60) t FROM reviews ORDER BY id DESC LIMIT 40'),
    env.DB.prepare('SELECT id, kind, title, visible FROM portfolio ORDER BY sort, id LIMIT 60'),
    env.DB.prepare("SELECT number, topic, status, substr(message,1,80) m FROM tickets ORDER BY id DESC LIMIT 15")
  ]);
  const fields = editable(content).map(([p, v]) => `${p} = ${JSON.stringify(short(v))}`).join('\n').slice(0, 7000);
  return {
    content,
    text: `EDITABLE FIELDS (path = current value):\n${fields}\n\nPRODUCTS (id | title | price | MRP | status):\n${prods.results.map(x => `${x.id} | ${x.title} | ${rupees(x.price)} | ${rupees(x.mrp)} | ${x.visible ? 'published' : 'draft'}`).join('\n') || '(none)'}\n\nREVIEWS (id | name | stars | status | text):\n${revs.results.map(x => `${x.id} | ${x.name} | ${x.rating} | ${x.status} | ${short(x.t, 50)}`).join('\n') || '(none)'}\n\nPORTFOLIO (id | kind | title | visible):\n${pf.results.map(x => `${x.id} | ${x.kind} | ${x.title} | ${x.visible ? 'yes' : 'no'}`).join('\n') || '(none)'}\n\nRECENT TICKETS (number | topic | status | message):\n${tix.results.map(x => `${x.number} | ${x.topic || ''} | ${x.status} | ${short(x.m, 60)}`).join('\n') || '(none)'}`
  };
}

// Validates a proposed action against live data and returns {ok, plan:{tool,args,summary,before}} or {ok:false, error}.
async function plan(env, a, content) {
  if (!a || typeof a !== 'object') return { ok: false, error: 'no action' };
  const tool = String(a.tool || ''), g = a.args && typeof a.args === 'object' ? a.args : {};
  if (tool === 'set_text') {
    const path = clean(g.path, 120); const parts = path.split('.').map(x => /^\d+$/.test(x) ? +x : x);
    const key = parts[0];
    if (!key || String(key).startsWith('_') || BLOCKED_KEYS.has(key) || !(key in DEFAULTS) || parts.length < 2) return { ok: false, error: `"${path}" is not an editable field` };
    const cur = getPath(content, parts);
    if (cur === undefined || (cur !== null && typeof cur === 'object')) return { ok: false, error: `"${path}" is not an editable text field` };
    let val = g.value;
    if (typeof cur === 'number') { val = Number(val); if (!isFinite(val)) return { ok: false, error: 'That field needs a number' }; }
    else if (typeof cur === 'boolean') val = val === true || val === 'true' || val === 1 || val === '1';
    else { val = String(val ?? ''); if (val.length > 5000) return { ok: false, error: 'Text too long' }; }
    if (val === cur) return { ok: false, error: 'That field already has this value' };
    return { ok: true, plan: { tool, args: { path, value: val }, before: cur, summary: `Change ${path}\nfrom: ${short(cur, 300)}\nto: ${short(val, 300)}` } };
  }
  if (tool === 'product_update') {
    const id = parseInt(g.id); const p = id && await env.DB.prepare('SELECT id, title, price, mrp, visible FROM products WHERE id = ?1').bind(id).first();
    if (!p) return { ok: false, error: 'Product not found' };
    const ch = {}, lines = [];
    const toPaise = (v) => Math.round(Math.max(0, Number(String(v).replace(/[₹,\s]/g, ''))));
    if (g.price !== undefined && g.price !== null && g.price !== '') { const v = toPaise(g.price); if (!isFinite(v)) return { ok: false, error: 'Bad price' }; if (v !== p.price) { ch.price = v; lines.push(`price ${rupees(p.price)} → ${rupees(v)}`); } }
    if (g.mrp !== undefined && g.mrp !== null && g.mrp !== '') { const v = toPaise(g.mrp); if (!isFinite(v)) return { ok: false, error: 'Bad MRP' }; if (v !== p.mrp) { ch.mrp = v; lines.push(`MRP ${rupees(p.mrp)} → ${rupees(v)}`); } }
    if (g.status) { const v = /^pub/i.test(g.status) ? 1 : /^draft/i.test(g.status) ? 0 : null; if (v === null) return { ok: false, error: 'Status must be published or draft' }; if (v !== p.visible) { ch.visible = v; lines.push(v ? 'Publish (clients can see and buy it)' : 'Move to Draft (hidden from clients)'); } }
    if (g.title) { const v = clean(g.title, 200); if (v && v !== p.title) { ch.title = v; lines.push(`title "${p.title}" → "${v}"`); } }
    if (!lines.length) return { ok: false, error: 'Nothing would change' };
    return { ok: true, plan: { tool, args: { id, ...ch }, before: { price: p.price, mrp: p.mrp, visible: p.visible, title: p.title }, summary: `Product #${id} "${p.title}":\n` + lines.join('\n') } };
  }
  if (tool === 'review_visibility') {
    const id = parseInt(g.id); const r = id && await env.DB.prepare('SELECT id, name, status FROM reviews WHERE id = ?1').bind(id).first();
    if (!r) return { ok: false, error: 'Review not found' };
    const st = g.status === 'hidden' || g.status === 'hide' ? 'hidden' : g.status === 'visible' || g.status === 'show' ? 'visible' : null;
    if (!st) return { ok: false, error: 'Status must be visible or hidden' };
    if (st === r.status) return { ok: false, error: `That review is already ${st}` };
    return { ok: true, plan: { tool, args: { id, status: st }, before: r.status, summary: `${st === 'hidden' ? 'Hide' : 'Show'} review #${id} by ${r.name}` } };
  }
  if (tool === 'portfolio_visibility') {
    const id = parseInt(g.id); const r = id && await env.DB.prepare('SELECT id, title, visible FROM portfolio WHERE id = ?1').bind(id).first();
    if (!r) return { ok: false, error: 'Portfolio item not found' };
    const v = g.visible === true || g.visible === 'true' || g.visible === 1 ? 1 : 0;
    if (v === r.visible) return { ok: false, error: 'Nothing would change' };
    return { ok: true, plan: { tool, args: { id, visible: v }, before: r.visible, summary: `${v ? 'Show' : 'Hide'} portfolio item #${id} "${r.title}"` } };
  }
  if (tool === 'ticket_draft') {
    const n = clean(g.number, 40).toUpperCase(); const num = /^\d+$/.test(n) ? 'JC-TKT-' + n : n;
    const t = await env.DB.prepare('SELECT * FROM tickets WHERE number = ?1').bind(num).first();
    if (!t) return { ok: false, error: `Ticket ${num} not found` };
    return { ok: true, readonly: true, ticket: t };
  }
  return { ok: false, error: `Unknown action "${tool}"` };
}

async function execute(env, pl, undo = false) {
  const a = pl.args;
  if (pl.tool === 'set_text') {
    const parts = a.path.split('.').map(x => /^\d+$/.test(x) ? +x : x); const key = parts[0];
    const section = await getKey(env, key); setPath({ [key]: section }, parts, undo ? pl.before : a.value); await setKey(env, key, section);
  } else if (pl.tool === 'product_update') {
    const src = undo ? pl.before : a; const cols = Object.keys(a).filter(k => k !== 'id');
    await env.DB.prepare(`UPDATE products SET ${cols.map(c => c + ' = ?').join(', ')}, updated = ? WHERE id = ?`).bind(...cols.map(c => src[c]), now(), a.id).run();
  } else if (pl.tool === 'review_visibility') {
    await env.DB.prepare('UPDATE reviews SET status = ?1 WHERE id = ?2').bind(undo ? pl.before : a.status, a.id).run();
  } else if (pl.tool === 'portfolio_visibility') {
    await env.DB.prepare('UPDATE portfolio SET visible = ?1 WHERE id = ?2').bind(undo ? pl.before : a.visible, a.id).run();
  } else throw new Error('unknown tool');
}

function parseReply(raw) {
  let text = String(raw || '').trim(), action = null, tab = '';
  const am = text.match(/<action>([\s\S]*?)<\/action>/i) || text.match(/<action>([\s\S]*)$/i);
  if (am) {
    let js = am[1].trim().replace(/^```(?:json)?|```$/g, '').trim();
    try { action = JSON.parse(js); } catch { try { action = JSON.parse(js.replace(/'/g, '"').replace(/,\s*}/g, '}')); } catch { action = { _bad: true }; } }
    text = text.replace(am[0], '').trim();
  }
  text = text.replace(/<\/?action>/gi, '');
  const tm = text.match(/<tab>([\s\S]*?)<\/tab>/i);
  if (tm) { tab = tm[1].trim(); text = text.replace(tm[0], '').trim(); }
  if (tab) text = text.replace(/:\s*[.。]?\s*$/, ':');
  return { text: text.slice(0, 4000), action, tab: tab.slice(0, 1500) };
}

async function history(env, uid) {
  const { results } = await env.DB.prepare('SELECT id, role, content, meta, created FROM ai_chat WHERE user_id = ?1 ORDER BY id DESC LIMIT ?2').bind(uid, MAX_HISTORY).all();
  return results.reverse().map(r => { let m = {}; try { m = JSON.parse(r.meta || '{}'); } catch { } return { id: r.id, role: r.role, text: r.content, created: r.created, tab: m.tab || '', draft: m.draft || '', action: m.plan ? { summary: m.plan.summary, state: m.state || 'pending', error: m.error || '' } : (m.error ? { summary: '', state: 'invalid', error: m.error } : null) }; });
}
async function add(env, uid, role, content, meta = {}) {
  const r = await env.DB.prepare('INSERT INTO ai_chat (user_id, role, content, meta, created) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id').bind(uid, role, content, JSON.stringify(meta), now()).first();
  return r.id;
}

export async function handleAssistant(req, env, url, s) {
  const p = url.pathname, m = req.method, uid = s.user.id;
  if (p === '/api/admin/assistant' && m === 'GET') return J({ ok: true, available: !!env.AI, messages: await history(env, uid) });
  if (p === '/api/admin/assistant' && m === 'DELETE') { await env.DB.prepare('DELETE FROM ai_chat WHERE user_id = ?1').bind(uid).run(); return J({ ok: true, messages: [] }); }
  if (p === '/api/admin/assistant' && m === 'POST') {
    if (!env.AI) fail('AI is not connected on this site yet.', 503);
    await limitOrFail(env, 'aichat:' + uid, 20, 10 * 60e3, 'Too many messages. Please wait a few minutes.');
    await limitOrFail(env, 'aichatday:' + uid, 200, 24 * 3600e3, 'Daily AI chat limit reached. It resets in 24 hours.');
    const b = await readJson(req); const msg = clean(b.message, 2000);
    if (!msg) fail('Type a message first');
    const prev = (await env.DB.prepare('SELECT role, content FROM ai_chat WHERE user_id = ?1 ORDER BY id DESC LIMIT 10').bind(uid).all()).results.reverse();
    await add(env, uid, 'user', msg);
    const snap = await snapshot(env); const cfg = await aiSettings(env);
    const sys = [
      'You are the AI Assistant inside the admin panel of the Jangid Cuts website (video editing + graphic design brand of Prashant Jangid, Jaipur). You talk only to the site owner (admin).',
      'Reply in the admin\'s language and style (Hinglish if they write Hinglish, Hindi if Hindi script, else English). Be short and practical: a few lines, simple steps like "Admin → Store → Products → Edit".',
      'You can: (1) explain how to do things on the site and admin panel, (2) propose one safe admin change with an <action> block (see ACTIONS).',
      'If the problem needs a code/design change or something you cannot do with the ACTIONS (a bug, layout/colour change, new feature, broken page, payments, domain, emails not sending), say exactly: "This needs a code change — message Tab on WhatsApp with this:" and then put a short ready-to-copy summary (what is wrong, where, what should happen) inside <tab>...</tab>. Do not propose an action in that case.',
      'Never reveal or ask for passwords, OTPs, API keys or payment secrets. Never make up facts about the site that are not in this prompt.',
      SITE_GUIDE, TOOLS_DOC, '', 'LIVE DATA (current values):', snap.text
    ].join('\n');
    const messages = [{ role: 'system', content: sys }, ...prev.map(x => ({ role: x.role === 'user' ? 'user' : 'assistant', content: x.content.slice(0, 1500) })), { role: 'user', content: msg }];
    const models = [...new Set([cfg.model || AI_DEFAULTS.model, '@cf/meta/llama-3.1-8b-instruct'])];
    let raw = '', lastErr = '';
    for (const mdl of models) {
      try { const r = await env.AI.run(mdl, { messages, max_tokens: 900, temperature: 0.2 }); raw = r && (r.response ?? r.result?.response); if (typeof raw !== 'string') raw = raw ? JSON.stringify(raw) : ''; if (raw.trim()) break; lastErr = 'empty reply'; }
      catch (e) { lastErr = e.message || String(e); await logEvent(env, 'ai', 'assistant ' + mdl + ' failed: ' + lastErr); }
    }
    if (!raw.trim()) { await add(env, uid, 'assistant', 'Sorry, the AI could not answer right now. Please try again in a minute.', { error: lastErr.slice(0, 200) }); return J({ ok: true, messages: await history(env, uid) }); }
    const out = parseReply(raw); const meta = {};
    if (out.tab) meta.tab = out.tab;
    let text = out.text;
    if (out.action && !out.action._bad) {
      const pl = await plan(env, out.action, snap.content);
      if (pl.ok && pl.readonly) {
        try { const d = await aiDraft(env, pl.ticket); meta.draft = d.text; text = (text ? text + '\n\n' : '') + `Reply draft for ${pl.ticket.number} (not sent — copy it or use "Send AI solution" in Client Desk):`; }
        catch (e) { text = (text ? text + '\n\n' : '') + 'Could not write the draft: ' + (e.message || e); }
      } else if (pl.ok) { meta.plan = pl.plan; meta.state = 'pending'; }
      else { await logEvent(env, 'ai', 'assistant action rejected: ' + pl.error); if (!text || /\b(change|update|kar|set|hide|show|publish|draft|price)\b/i.test(msg)) { meta.error = pl.error; text = (text ? text + '\n\n' : '') + `(I could not prepare that change: ${pl.error}.)`; } }
    } else if (out.action && out.action._bad) { text = (text ? text + '\n\n' : '') + '(I tried to prepare a change but it was not readable. Please ask again in simpler words.)'; }
    if (!text) text = meta.plan ? 'Here is the change. Tap Confirm to apply.' : '…';
    await add(env, uid, 'assistant', text, meta);
    return J({ ok: true, messages: await history(env, uid) });
  }
  let mm;
  if ((mm = p.match(/^\/api\/admin\/assistant\/(\d+)\/(confirm|cancel|undo)$/)) && m === 'POST') {
    const id = +mm[1], what = mm[2];
    await limitOrFail(env, 'aichatact:' + uid, 30, 10 * 60e3);
    const row = await env.DB.prepare('SELECT id, meta FROM ai_chat WHERE id = ?1 AND user_id = ?2').bind(id, uid).first(); if (!row) fail('Not found', 404);
    const meta = JSON.parse(row.meta || '{}'); if (!meta.plan) fail('Nothing to do here');
    if (what === 'cancel') { if (meta.state !== 'pending') fail('This change was already ' + meta.state); meta.state = 'cancelled'; }
    else if (what === 'confirm') {
      if (meta.state !== 'pending') fail('This change was already ' + meta.state);
      // re-validate against live data right now (values may have changed since the proposal)
      const content = await getContent(env); const again = await plan(env, { tool: meta.plan.tool, args: meta.plan.args }, content);
      if (!again.ok) { meta.state = 'failed'; meta.error = again.error; }
      else { meta.plan = again.plan; await execute(env, again.plan); meta.state = 'done'; meta.done_at = now(); await logEvent(env, 'admin', `${s.user.email} AI assistant: ${again.plan.summary.split('\n')[0]}`); }
    } else {
      if (meta.state !== 'done') fail('Only an applied change can be undone');
      await execute(env, meta.plan, true); meta.state = 'undone'; await logEvent(env, 'admin', `${s.user.email} AI assistant undo: ${meta.plan.summary.split('\n')[0]}`);
    }
    await env.DB.prepare('UPDATE ai_chat SET meta = ?1 WHERE id = ?2').bind(JSON.stringify(meta), id).run();
    return J({ ok: true, messages: await history(env, uid) });
  }
  fail('Not found', 404);
}
