(function(){try{var d=document.documentElement;var t=localStorage.getItem('jc-theme');if(t)d.setAttribute('data-theme',t);
var a=localStorage.getItem('jc-anim');if(!a){a=(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)?'low':'high';}
d.classList.remove('anim-high','anim-moderate','anim-low');d.classList.add('anim-'+a);}catch(e){}})();
/* every new visit (new tab/session), signed out — skipped once per tab session via sessionStorage: paint only loader -> welcome/login; the page underneath stays hidden until the visitor signs in or taps "Start without sign in" */
(function(){try{var d=document.documentElement;try{localStorage.removeItem('jc-welcomed')}catch(e){}if(sessionStorage.getItem('jc-welcomed')||/^\/(admin|v|u|api)\b/.test(location.pathname))return;
d.classList.add('jc-gate');window.JC_GATED=1;try{sessionStorage.setItem('jc-welcomed','1')}catch(e){}/* tab marked the moment the gate shows: a refresh of this tab goes straight to the site */
/* entry screen follows the device theme; inside the site the default stays dark (or the visitor's own choice) */
var dev=window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';d.setAttribute('data-entry',dev);d.setAttribute('data-theme',dev);
window.JC_ENDENTRY=function(){if(!d.hasAttribute('data-entry'))return;d.removeAttribute('data-entry');var t=null;try{t=localStorage.getItem('jc-theme')}catch(e){}d.setAttribute('data-theme',t||'dark');try{window.JC_UI&&JC_UI.syncTheme&&JC_UI.syncTheme()}catch(e){}};
var s=document.createElement('style');s.id='jcGate';
s.textContent='html.jc-gate body>*:not(#loginModal):not(#loader):not(#toast):not(#scrim){visibility:hidden!important}html.jc-gate,html.jc-gate body{background:#000101}html[data-theme="light"].jc-gate,html[data-theme="light"].jc-gate body{background:#EEF6F4}';
document.head.appendChild(s);window.JC_UNGATE=function(){var was=d.classList.contains('jc-gate');d.classList.remove('jc-gate');if(was&&window.JC_ENTER)setTimeout(window.JC_ENTER,60)};setTimeout(window.JC_UNGATE,15000)}catch(e){}})();

(function(){try{var l=localStorage.getItem('jc-lang');if(l&&l!=='en'&&l!=='0'){var d=document.documentElement;d.classList.add('i18n-wait');var s=document.createElement('style');s.textContent='html.i18n-wait body{visibility:hidden}';document.head.appendChild(s);setTimeout(function(){d.classList.remove('i18n-wait')},2500)}}catch(e){}})();
/* help page: pick the FAQ / Support / Track view before first paint (no flash) */
(function(){try{var p=location.pathname.replace(/\/$/,''),v='';if(p==='/support'||(/^\/help(\.html)?$/.test(p)&&location.hash==='#issue'))v='support';else if(/^\/track(-hire|-ticket|-order)?$/.test(p))v='track';else if(/^\/(faq|help(\.html)?)$/.test(p))v='faq';if(v){document.documentElement.setAttribute('data-hpv',v);document.title=({faq:'FAQ',support:'Support',track:'Track'})[v]+' | Jangid Cuts'}}catch(e){}})();

/* Oct 29 (Prashant 5:43 PM): ONE loading screen. The brand word JANGID CUTS covers the page from the first paint (tap on an in-site link,
   refresh, back/forward, direct open) and stays only until this page's own data has been drawn (live.js fires jc:ready), so no second
   "Loading..." ever shows; then it fades and the page content rises in (html.jc-enter). Not on the first-open welcome gate (that has its
   own intro), not on the home intro loader, not on admin. The site data request starts here in <head>, before the page scripts load. */
(function(){try{var d=document.documentElement,S=window.sessionStorage,K='jc-nav',MIN=220,CAP=5000;
var path=location.pathname;if(/^\/(admin|v|u|api)\b/.test(path))return;
/* start the two site requests right away (same shape as live.js api()) */
if(!/^\/(resume|soon)\b/.test(path)&&window.fetch&&window.Promise){var pre=function(u){return fetch(u,{credentials:'same-origin',headers:{'x-jc':'1'}}).then(function(r){return r.json().catch(function(){return{ok:false,error:'Something went wrong'}})}).catch(function(){return{ok:false,error:'You seem to be offline. Please try again.'}})};
 window.JC_PRE=[pre('/api/site'),pre('/api/me')]}
var low=function(){return d.classList.contains('anim-low')};
var st=document.createElement('style');st.id='jcNavCss';
var E='cubic-bezier(.2,.8,.2,1)',sel=['body>.topbar','body>.subnav'],items='#main>*:not(#app):not(.loader):not(.hero):not(script),#app>*>*,#app>*:not(.wrap):not(.watch)';
var stag='';for(var n=1;n<=8;n++){stag+='html.jc-enter #main>*:not(#app):nth-child('+n+'),html.jc-enter #app>*>*:nth-child('+n+'){animation-delay:'+(60+(n-1)*55)+'ms}'}
st.textContent='@view-transition{navigation:auto}::view-transition-old(root),::view-transition-new(root){animation-duration:.18s}'+
'#jcNav{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:var(--bg,#000101);opacity:0;visibility:hidden;transition:opacity .22s ease,visibility 0s linear .22s;pointer-events:none}'+
'html[data-theme="light"] #jcNav{background:var(--bg,#EEF6F4)}'+
'#jcNav.on{opacity:1;visibility:visible;transition:opacity .14s ease,visibility 0s;pointer-events:auto}'+
'#jcNav b{font-family:"Anton","Bebas Neue",Impact,sans-serif;font-weight:400;font-size:min(12vw,104px);line-height:.95;letter-spacing:.005em;white-space:nowrap;background:var(--bw-grad,linear-gradient(180deg,#2BF5C0 0%,#4DCBB0 30%,#0DBC94 62%,#196453 100%));-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 22px rgba(43,245,192,.3));transform:scale(.94);opacity:.4;transition:transform .32s '+E+',opacity .2s ease}'+
'#jcNav.on b{transform:none;opacity:1}#jcNav i{position:absolute;left:50%;top:calc(50% + min(7vw,62px));width:90px;height:3px;margin-left:-45px;border-radius:3px;background:rgba(43,245,192,.14);overflow:hidden}'+
'#jcNav i:after{content:"";position:absolute;inset:0;width:40%;background:linear-gradient(90deg,#2BF5C0,#0DBC94);border-radius:3px;animation:jcNavBar .7s ease-in-out infinite}'+
'@keyframes jcNavBar{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}'+
/* content entrance after the loader: soft fade + small rise, staggered */
'@keyframes jcRise{from{opacity:0;transform:translate3d(0,18px,0)}to{opacity:1;transform:none}}@keyframes jcFade{from{opacity:0}to{opacity:1}}'+
'html.jc-enter '+sel.join(',html.jc-enter ')+'{animation:jcFade .45s ease both}'+
'html.jc-enter '+items.split(',').join(',html.jc-enter ')+'{animation:jcRise .6s '+E+' both}'+stag+
'html.jc-enter body>.footer{animation:jcFade .6s .3s ease both}'+
'html.anim-low #jcNav b{transform:none;transition:none}html.anim-low #jcNav i:after{animation:none;width:100%}'+
'html.anim-low.jc-enter '+items.split(',').join(',html.anim-low.jc-enter ')+'{animation:jcFade .25s ease both!important;animation-delay:0s!important}';
(document.head||d).appendChild(st);
var el=document.createElement('div');el.id='jcNav';el.setAttribute('aria-hidden','true');el.innerHTML='<b>JANGID CUTS</b><i></i>';
d.appendChild(el);/* lives on <html>, outside <body>, so it can paint before the page does */
var gated=function(){return d.classList.contains('jc-gate')||d.hasAttribute('data-entry')};
var enterT=0;window.JC_ENTER=function(){clearTimeout(enterT);d.classList.remove('jc-enter');void d.offsetWidth;d.classList.add('jc-enter');enterT=setTimeout(function(){d.classList.remove('jc-enter')},1300)};
var on=false,show=function(){if(gated())return;on=true;d.classList.add('jc-busy');el.classList.add('on')};
var hideT=0,hide=function(){clearTimeout(hideT);on=false;el.classList.remove('on');d.classList.remove('jc-busy')};
/* the home intro loader (first open of home in this tab) is the loading screen there; this one stays out of its way */
var homeIntro=false;try{homeIntro=/^\/(index\.html)?$/.test(path)&&S.getItem('jc-seen')!=='1'&&!low()}catch(e){}
var t0=0;try{t0=+S.getItem(K)||0;S.removeItem(K)}catch(e){}
var age=Date.now()-t0;if(!(t0&&age>=0&&age<CAP))t0=0;
var ready=function(){return !!window.JC_PAGE_READY};
var revealed=false,reveal=function(){if(revealed)return;revealed=true;var from=t0||start,wait=Math.max(0,MIN-(Date.now()-from));
 setTimeout(function(){requestAnimationFrame(function(){el.style.transition='';hide();window.JC_ENTER()})},wait)};
var start=Date.now();
if(!gated()&&!homeIntro){el.style.transition='none';show();
 var onReady=function(){requestAnimationFrame(function(){requestAnimationFrame(reveal)})};
 if(ready())onReady();else document.addEventListener('jc:ready',onReady,{once:true});
 /* safety cap: never hold the page longer than CAP; if the data lands later, its content still rises in */
 setTimeout(function(){if(!revealed){revealed=true;el.style.transition='';hide();if(!ready())document.addEventListener('jc:ready',function(){window.JC_ENTER()},{once:true});else window.JC_ENTER()}},CAP)}
var mark=function(){try{S.setItem(K,String(Date.now()))}catch(e){}};
/* outgoing: in-site link taps (after the page's own handlers, so modals / in-page links that cancel the click are left alone) */
window.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 if(a.target&&a.target!=='_self'||a.hasAttribute('download')||a.dataset.noLoader!=null)return;
 var u;try{u=new URL(a.href,location.href)}catch(x){return}
 if(u.origin!==location.origin||!/^https?:/.test(u.protocol))return;
 if(/^\/(admin|v|u|api|media|files?)\b/.test(u.pathname)||/\.(pdf|zip|rar|mp4|mov|jpe?g|png|webp|gif|cube|vcf)$/i.test(u.pathname))return;
 if(u.pathname===location.pathname&&u.search===location.search)return;/* same page / #hash only */
 mark();el.style.transition='';show();hideT=setTimeout(hide,CAP*2)},false);
/* any other way out of the page (Back, a form, a script redirect): the next page still gets the loader */
window.addEventListener('pagehide',function(){mark()});
/* back/forward cache restore: never leave the loader stuck; replay the entrance */
window.addEventListener('pageshow',function(e){if(e.persisted){hide();try{S.removeItem(K)}catch(x){}window.JC_ENTER()}});
}catch(e){}})();
