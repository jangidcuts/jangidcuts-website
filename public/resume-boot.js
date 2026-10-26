/* resume page boot: theme (site default dark / remembered), animation pref, hide until translated */
(function(){try{var d=document.documentElement;var t=localStorage.getItem('jc-theme');d.setAttribute('data-theme',t==='light'?'light':'dark');
var l=localStorage.getItem('jc-lang');if(l&&l!=='en'&&l!=='0'){d.classList.add('i18n-wait');var s=document.createElement('style');s.textContent='html.i18n-wait body{visibility:hidden}';document.head.appendChild(s);setTimeout(function(){d.classList.remove('i18n-wait')},2500)}}catch(e){}})();
