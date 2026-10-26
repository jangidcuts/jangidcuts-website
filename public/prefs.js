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
