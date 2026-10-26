const V='jc-v43';
const CORE=['/','/portfolio','/services','/help','/soon','/styles.css?v=21','/script.js?v=9','/live.js?v=25','/brands.js?v=2','/store','/store.css?v=3','/store.js?v=6','/page','/pages.css?v=7','/pages.js?v=9','/prefs.js?v=6','/i18n.js?v=9','/pwmeter.js?v=1','/fonts/Anton-400.woff2','/fonts/BebasNeue-400.woff2','/fonts/Inter-400.woff2','/icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin)return;
 if(/^\/(api|admin|auth|u|media)(\/|$)/.test(u.pathname))return;
 if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('/'))));return}
 if(/\.(css|js|woff2|png|jpg|jpeg|webp|svg)$/.test(u.pathname)){e.respondWith(caches.match(r).then(m=>{const net=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res});return m||net}))}
});
