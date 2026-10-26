(function(){try{var d=document.documentElement;var t=localStorage.getItem('jc-theme');if(t)d.setAttribute('data-theme',t);
var a=localStorage.getItem('jc-anim');if(!a){a=(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)?'low':'high';}
d.classList.remove('anim-high','anim-moderate','anim-low');d.classList.add('anim-'+a);}catch(e){}})();
/* first visit, signed out: paint only loader -> welcome/login; the page underneath stays hidden until the visitor signs in or taps "Start without sign in" */
(function(){try{var d=document.documentElement;if(localStorage.getItem('jc-welcomed')||/^\/(admin|v|u|api)\b/.test(location.pathname))return;
d.classList.add('jc-gate');var s=document.createElement('style');s.id='jcGate';
s.textContent='html.jc-gate body>*:not(#loginModal):not(#loader):not(#toast):not(#scrim){visibility:hidden!important}html.jc-gate,html.jc-gate body{background:#000101}html[data-theme="light"].jc-gate,html[data-theme="light"].jc-gate body{background:#EEF6F4}';
document.head.appendChild(s);window.JC_UNGATE=function(){d.classList.remove('jc-gate')};setTimeout(window.JC_UNGATE,15000)}catch(e){}})();
