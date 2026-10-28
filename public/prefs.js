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
document.head.appendChild(s);window.JC_UNGATE=function(){d.classList.remove('jc-gate')};setTimeout(window.JC_UNGATE,15000)}catch(e){}})();

(function(){try{var l=localStorage.getItem('jc-lang');if(l&&l!=='en'&&l!=='0'){var d=document.documentElement;d.classList.add('i18n-wait');var s=document.createElement('style');s.textContent='html.i18n-wait body{visibility:hidden}';document.head.appendChild(s);setTimeout(function(){d.classList.remove('i18n-wait')},2500)}}catch(e){}})();
/* help page: pick the FAQ / Support / Track view before first paint (no flash) */
(function(){try{var p=location.pathname.replace(/\/$/,''),v='';if(p==='/support'||(/^\/help(\.html)?$/.test(p)&&location.hash==='#issue'))v='support';else if(/^\/track(-hire|-ticket|-order)?$/.test(p))v='track';else if(/^\/(faq|help(\.html)?)$/.test(p))v='faq';if(v){document.documentElement.setAttribute('data-hpv',v);document.title=({faq:'FAQ',support:'Support',track:'Track'})[v]+' | Jangid Cuts'}}catch(e){}})();

/* Oct 28 (Prashant 8:06 AM): page-switch loader. Tap an in-site link -> the brand word JANGID CUTS fades in at once; the next page keeps
   it on screen only until it is ready (min ~250 ms counted from the tap, never extra waiting), then fades away. Not on the first-open
   intro / welcome gate, not on admin. Back / forward / bfcache covered. */
(function(){try{var d=document.documentElement,S=window.sessionStorage,K='jc-nav',MIN=250,MAX=2500;
if(/^\/(admin|v|u|api)\b/.test(location.pathname))return;
var st=document.createElement('style');st.id='jcNavCss';
st.textContent='@view-transition{navigation:auto}::view-transition-old(root),::view-transition-new(root){animation-duration:.18s}'+
'#jcNav{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:var(--bg,#000101);opacity:0;visibility:hidden;transition:opacity .16s ease,visibility 0s linear .16s;pointer-events:none}'+
'html[data-theme="light"] #jcNav{background:var(--bg,#EEF6F4)}'+
'#jcNav.on{opacity:1;visibility:visible;transition:opacity .14s ease,visibility 0s;pointer-events:auto}'+
'#jcNav b{font-family:"Anton","Bebas Neue",Impact,sans-serif;font-weight:400;font-size:min(12vw,104px);line-height:.95;letter-spacing:.005em;white-space:nowrap;background:var(--bw-grad,linear-gradient(180deg,#2BF5C0 0%,#4DCBB0 30%,#0DBC94 62%,#196453 100%));-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 22px rgba(43,245,192,.3));transform:scale(.94);opacity:.4;transition:transform .32s cubic-bezier(.2,.8,.2,1),opacity .2s ease}'+
'#jcNav.on b{transform:none;opacity:1}#jcNav i{position:absolute;left:50%;top:calc(50% + min(7vw,62px));width:90px;height:3px;margin-left:-45px;border-radius:3px;background:rgba(43,245,192,.14);overflow:hidden}'+
'#jcNav i:after{content:"";position:absolute;inset:0;width:40%;background:linear-gradient(90deg,#2BF5C0,#0DBC94);border-radius:3px;animation:jcNavBar .7s ease-in-out infinite}'+
'@keyframes jcNavBar{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}'+
'html.jc-nav-in body{animation:jcNavIn .26s ease both}@keyframes jcNavIn{from{opacity:.0}to{opacity:1}}'+
'html.anim-low #jcNav b{transform:none;transition:none}html.anim-low #jcNav i:after{animation:none;width:100%}html.anim-low.jc-nav-in body{animation:none}';
(document.head||d).appendChild(st);
var el=document.createElement('div');el.id='jcNav';el.setAttribute('aria-hidden','true');el.innerHTML='<b>JANGID CUTS</b><i></i>';
d.appendChild(el);/* lives on <html>, outside <body>, so it can paint before the page does */
var gated=function(){return d.classList.contains('jc-gate')||d.hasAttribute('data-entry')};
var show=function(){if(gated())return;el.classList.add('on')};
var hideT=0,hide=function(){clearTimeout(hideT);el.classList.remove('on')};
/* incoming page: a tap / back on this tab happened a moment ago -> start with the loader up, drop it as soon as the page is ready */
var t0=0;try{t0=+S.getItem(K)||0;S.removeItem(K)}catch(e){}
var age=Date.now()-t0;
if(t0&&age>=0&&age<MAX&&!gated()){el.classList.add('on');el.style.transition='none';
 var done=false,fin=function(){if(done)return;done=true;var wait=Math.max(0,MIN-(Date.now()-t0));setTimeout(function(){el.style.transition='';d.classList.add('jc-nav-in');requestAnimationFrame(hide);setTimeout(function(){d.classList.remove('jc-nav-in')},420)},wait)};
 var rdy=function(){requestAnimationFrame(function(){requestAnimationFrame(fin)})};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',rdy,{once:true});else rdy();
 setTimeout(fin,MAX)}
var mark=function(){try{S.setItem(K,String(Date.now()))}catch(e){}};
/* outgoing: in-site link taps (after the page's own handlers, so modals / in-page links that cancel the click are left alone) */
window.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 if(a.target&&a.target!=='_self'||a.hasAttribute('download')||a.dataset.noLoader!=null)return;
 var u;try{u=new URL(a.href,location.href)}catch(x){return}
 if(u.origin!==location.origin||!/^https?:/.test(u.protocol))return;
 if(/^\/(admin|v|u|api|media|files?)\b/.test(u.pathname)||/\.(pdf|zip|rar|mp4|mov|jpe?g|png|webp|gif|cube|vcf)$/i.test(u.pathname))return;
 if(u.pathname===location.pathname&&u.search===location.search)return;/* same page / #hash only */
 mark();show();hideT=setTimeout(hide,MAX*2)},false);
/* any other way out of the page (Back, a form, a script redirect): the next page still gets the loader */
window.addEventListener('pagehide',function(){mark()});
/* back/forward cache restore: never leave the loader stuck */
window.addEventListener('pageshow',function(e){if(e.persisted){hide();try{S.removeItem(K)}catch(x){}}});
}catch(e){}})();
