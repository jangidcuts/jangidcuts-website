(function(){try{var d=document.documentElement;var t=localStorage.getItem('jc-theme');if(t)d.setAttribute('data-theme',t);
var a=localStorage.getItem('jc-anim');if(!a){a=(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)?'low':'high';}
d.classList.remove('anim-high','anim-moderate','anim-low');d.classList.add('anim-'+a);}catch(e){}})();