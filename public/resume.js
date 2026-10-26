/* Jangid Cuts resume viewer: pdf.js (self-hosted), crisp re-render on zoom, pinch / double-tap / ctrl+wheel / buttons. */
import * as pdfjsLib from '/vendor/pdfjs/pdf.min.mjs?v=4.10.38';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.mjs?v=4.10.38';

const D = document, $ = (s) => D.getElementById(s);
const stage = $('rvStage'), wrap = $('rvPages'), msg = $('rvMsg'), pct = $('rvPct'), hint = $('rvHint');
const T = (s) => (window.JC_I18N ? JC_I18N.t(s) : s);
const MIN = 0.5, MAX = 5;                 // relative to "fit width"
let pdf = null, pages = [], fit = 1, zoom = 1, renderTok = 0, pdfUrl = '/resume.pdf', dlUrl = '/resume.pdf?dl=1';

/* back: return where the visitor came from inside the site, else home */
$('rvBack').addEventListener('click', (e) => {
  let same = false; try { same = !!D.referrer && new URL(D.referrer).origin === location.origin && !/\/resume\/?$/.test(new URL(D.referrer).pathname); } catch (_) {}
  if (same && history.length > 1) { e.preventDefault(); history.back(); }
});

function showMsg(html) { msg.hidden = false; msg.innerHTML = html; }
function fail() {
  showMsg('<p>' + T('Could not show the resume here.') + '</p><a class="btn btn-ghost" href="' + pdfUrl + '" target="_self">' + T('Open PDF') + '</a>');
}
const maxPx = () => (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform)) ? 16e6 : 32e6);

function layout() {           // size every page box to the current zoom (CSS px)
  const s = fit * zoom;
  for (const p of pages) { p.el.style.width = Math.round(p.w * s) + 'px'; p.el.style.height = Math.round(p.h * s) + 'px'; }
  pct.textContent = Math.round(zoom * 100) + '%';
  $('rvOut').disabled = zoom <= MIN + 1e-3; $('rvIn').disabled = zoom >= MAX - 1e-3;
}
async function renderAll() {  // crisp redraw at the current zoom × devicePixelRatio
  const tok = ++renderTok, s = fit * zoom, dpr = window.devicePixelRatio || 1;
  for (const p of pages) {
    if (tok !== renderTok) return;
    const cssW = p.w * s, cssH = p.h * s;
    const out = Math.min(Math.max(dpr, 2), Math.sqrt(maxPx() / (cssW * cssH)));
    const vp = p.page.getViewport({ scale: s * out });
    const c = D.createElement('canvas'); c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
    try {
      p.task && p.task.cancel();
      p.task = p.page.render({ canvasContext: c.getContext('2d', { alpha: false }), viewport: vp, background: '#ffffff' });
      await p.task.promise;
    } catch (e) { if (e && e.name === 'RenderingCancelledException') return; throw e; }
    if (tok !== renderTok) return;
    const old = p.el.querySelector('canvas'); p.el.appendChild(c); if (old) old.remove();
  }
}
let rT; function rerender(now) { clearTimeout(rT); if (now) renderAll().catch(fail); else rT = setTimeout(() => renderAll().catch(fail), 140); }

function computeFit() {
  const p0 = pages[0]; if (!p0) return;
  const availW = stage.clientWidth - (innerWidth >= 1024 ? 64 : 24), availH = stage.clientHeight - 130;
  let f = availW / p0.w;
  if (innerWidth >= 1024) f = Math.min(f, Math.max(availH / p0.h, 900 / p0.w > f ? f : 900 / p0.w)); // desktop: whole page visible, ≤ ~900px wide
  fit = Math.max(0.2, f);
}
/* zoom to `z`, keeping the content point under (cx, cy) (stage-relative) still */
function setZoom(z, cx, cy, quick) {
  z = Math.min(MAX, Math.max(MIN, z)); if (Math.abs(z - zoom) < 1e-4) return;
  if (cx == null) { cx = stage.clientWidth / 2; cy = stage.clientHeight / 2; }
  const k = z / zoom, padL = wrap.offsetLeft;
  const ax = stage.scrollLeft + cx, ay = stage.scrollTop + cy;
  zoom = z; layout();
  stage.scrollLeft = (ax - padL) * k + padL - cx; stage.scrollTop = ay * k - cy;
  rerender(!quick);
}

/* buttons, keys, wheel */
$('rvIn').onclick = () => setZoom(zoom * 1.25);
$('rvOut').onclick = () => setZoom(zoom / 1.25);
$('rvFit').onclick = $('rvPct').onclick = () => { setZoom(1); stage.scrollTo({ left: 0, top: 0 }); };
D.addEventListener('keydown', (e) => {
  if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
  if ((e.key === '+' || e.key === '=') ) { e.preventDefault(); setZoom(zoom * 1.25); }
  else if (e.key === '-' || e.key === '_') { e.preventDefault(); setZoom(zoom / 1.25); }
  else if (e.key === '0') { e.preventDefault(); setZoom(1); }
  else if (e.key === 'Escape') $('rvBack').click();
});
stage.addEventListener('wheel', (e) => {
  if (!e.ctrlKey && !e.metaKey) return;          // trackpad pinch arrives as ctrl+wheel
  e.preventDefault(); const r = stage.getBoundingClientRect();
  setZoom(zoom * Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top, true); rerender(false);
}, { passive: false });

/* touch: pinch (CSS scale live, crisp redraw on release) + double-tap */
let pinch = null, lastTap = 0;
const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
stage.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    const r = stage.getBoundingClientRect();
    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left, cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
    pinch = { d0: dist(e.touches), cx, cy, ox: stage.scrollLeft + cx, oy: stage.scrollTop + cy, k: 1 };
    wrap.style.transformOrigin = pinch.ox + 'px ' + pinch.oy + 'px';
  } else if (e.touches.length === 1) {
    const t = Date.now();
    if (t - lastTap < 300) {
      e.preventDefault(); const r = stage.getBoundingClientRect(), x = e.touches[0].clientX - r.left, y = e.touches[0].clientY - r.top;
      setZoom(zoom > 1.05 ? 1 : 2.2, x, y); lastTap = 0;
    } else lastTap = t;
  }
}, { passive: false });
stage.addEventListener('touchmove', (e) => {
  if (!pinch || e.touches.length !== 2) return;
  e.preventDefault();
  let k = dist(e.touches) / pinch.d0; k = Math.min(MAX / zoom, Math.max(MIN / zoom, k)); pinch.k = k;
  wrap.style.transform = 'scale(' + k + ')';
}, { passive: false });
function endPinch() {
  if (!pinch) return; const p = pinch; pinch = null;
  wrap.style.transform = ''; wrap.style.transformOrigin = '';
  setZoom(zoom * p.k, p.cx, p.cy);
}
stage.addEventListener('touchend', (e) => { if (e.touches.length < 2) endPinch(); });
stage.addEventListener('touchcancel', endPinch);
D.addEventListener('gesturestart', (e) => e.preventDefault());   // iOS: no page zoom, our pinch instead
D.addEventListener('gesturechange', (e) => e.preventDefault());

let rzT; addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { if (!pages.length) return; computeFit(); layout(); rerender(true); }, 150); });

function flashHint() { hint.textContent = T(matchMedia('(pointer:coarse)').matches ? 'Pinch or double-tap to zoom' : 'Use + / − or Ctrl + scroll to zoom'); hint.classList.add('on'); setTimeout(() => hint.classList.remove('on'), 2600); }

async function start() {
  try {
    const r = await fetch('/api/resume', { credentials: 'same-origin', cache: 'no-store' }).then((x) => x.json());
    if (!r || !r.resume) { showMsg('<p>' + T('The resume will be available here soon.') + '</p>'); $('rvDl').hidden = true; $('rvZoom').hidden = true; return; }
    pdfUrl = r.resume.url; dlUrl = r.resume.download;
    const dl = $('rvDl'); dl.href = dlUrl; dl.setAttribute('download', r.resume.name || 'Prashant_Jangid_Resume.pdf');
    pdf = await pdfjsLib.getDocument({ url: pdfUrl, cMapUrl: '/vendor/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: '/vendor/pdfjs/standard_fonts/', isEvalSupported: false, withCredentials: false }).promise;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i), v = page.getViewport({ scale: 1 });
      const el = D.createElement('div'); el.className = 'rv-page'; el.setAttribute('aria-label', 'Page ' + i);
      wrap.appendChild(el); pages.push({ page, w: v.width, h: v.height, el, task: null });
    }
    computeFit(); layout(); msg.hidden = true;
    await renderAll(); flashHint();
  } catch (e) { console.error(e); fail(); }
}
window.JC_RESUME = { get zoom() { return zoom; }, setZoom, pages: () => pages.length };
start();
