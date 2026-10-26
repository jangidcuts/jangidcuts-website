window.JC_RUN=function(){
"use strict";
var D=document, H=D.documentElement, JC=window.JC||{video:{items:[]},thumb:{items:[]},services:[]};
function $(s,r){return (r||D).querySelector(s)}
function $$(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))}
function anim(){return H.classList.contains('anim-low')?'low':H.classList.contains('anim-moderate')?'moderate':'high'}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var ICON=function(n){return '<svg class="icon" aria-hidden="true"><use href="#i-'+n+'"/></svg>'};

window.JC_UI={};
/* ---------- toast ---------- */
var toastT;function toast(msg){var t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},3200)}

/* ---------- overlays ---------- */
var scrim=$('#scrim'),openEl=null,lastFocus=null;
function openLayer(el){if(!el)return;closeLayer(true);lastFocus=D.activeElement;el.classList.add('on');el.setAttribute('aria-hidden','false');scrim.classList.add('on');openEl=el;D.body.style.overflow='hidden';
 var f=el.querySelector('input:not([type=checkbox]),button.x,select,textarea');setTimeout(function(){f&&f.focus()},60);
 if(el.id==='drawer')$('#openMenu').setAttribute('aria-expanded','true')}
function closeLayer(silent){if(!openEl)return;var el=openEl;el.classList.remove('on');el.setAttribute('aria-hidden','true');scrim.classList.remove('on');D.body.style.overflow='';openEl=null;
 if(el.id==='drawer')$('#openMenu').setAttribute('aria-expanded','false');
 var v=el.querySelector('video');if(v)v.pause();
 if(!silent&&lastFocus)lastFocus.focus()}
scrim&&scrim.addEventListener('click',function(){closeLayer()});
window.JC_UI.open=openLayer;window.JC_UI.close=closeLayer;window.JC_UI.toast=toast;
D.addEventListener('keydown',function(e){if(e.key==='Escape')closeLayer()});
$$('[data-close]').forEach(function(b){b.addEventListener('click',function(){closeLayer()})});
$('#openMenu')&&$('#openMenu').addEventListener('click',function(){openLayer($('#drawer'))});
$('#openLogin')&&$('#openLogin').addEventListener('click',function(){if(window.JCL&&JCL.user){JCL.account()}else openLayer($('#loginModal'))});
$$('[data-login]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();openLayer($('#loginModal'))})});
$('#openSearch')&&$('#openSearch').addEventListener('click',function(){openLayer($('#searchPop'));renderSearch('')});

/* ---------- settings ---------- */
var ts=$('#themeSwitch');
function syncTheme(){var dark=H.getAttribute('data-theme')!=='light';ts&&ts.setAttribute('aria-checked',dark?'true':'false');var m=$('meta[name=theme-color]');m&&m.setAttribute('content',dark?'#000101':'#EEF6F4')}
ts&&ts.addEventListener('click',function(){var dark=H.getAttribute('data-theme')!=='light';H.setAttribute('data-theme',dark?'light':'dark');try{localStorage.setItem('jc-theme',dark?'light':'dark')}catch(e){}syncTheme()});
syncTheme();window.JC_UI.syncTheme=syncTheme;
function syncAnim(){var a=anim();$$('#animSeg button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.anim===a?'true':'false')})}
$$('#animSeg button').forEach(function(b){b.addEventListener('click',function(){H.classList.remove('anim-high','anim-moderate','anim-low');H.classList.add('anim-'+b.dataset.anim);try{localStorage.setItem('jc-anim',b.dataset.anim)}catch(e){}syncAnim();toast('Animations: '+b.textContent)})});
syncAnim();
$('#langSel')&&$('#langSel').addEventListener('change',function(e){var v=e.target.value;window.JC_I18N&&JC_I18N.set(v);window.JCL&&JCL.setPref&&JCL.setPref('lang',v);var o=e.target.options[e.target.selectedIndex];setTimeout(function(){toast((o?o.text.split(' (')[0]:v)+' ✓')},150)});
$('#curSel')&&$('#curSel').addEventListener('change',function(e){window.JCL&&JCL.setPref('currency',e.target.selectedIndex?'USD':'INR');toast('Prices will show in '+e.target.value)});
var ns=$('#notifSwitch');ns&&ns.addEventListener('click',function(){var on=ns.getAttribute('aria-checked')!=='true';ns.setAttribute('aria-checked',on?'true':'false');window.JCL&&JCL.setPref('email_notif',on);toast(on?'Offer & new-product emails on':'Offer emails off. Order & security emails still arrive')});

/* ---------- demo forms ---------- */
$$('[data-demo-form]').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();if(!f.checkValidity()){f.reportValidity();return}toast(f.getAttribute('data-demo-form'));f.reset();if(openEl&&openEl.contains(f))setTimeout(function(){closeLayer()},700)})});
$$('[data-demo]').forEach(function(b){b.addEventListener('click',function(){toast(b.getAttribute('data-demo'))})});


/* back control (Prashant 7:58 PM): every inner page gets "← Back" (or "← Back to menu" when it was opened from the menu) */
(function(){var p=location.pathname.replace(/\/$/,'')||'/';
 D.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('#drawer a[href]');if(a){try{sessionStorage.setItem('jc-menu-to',(new URL(a.href,location.href).pathname.replace(/\/$/,'')||'/'))}catch(x){}}},true);
 function reopen(){try{if(sessionStorage.getItem('jc-open-menu')==='1'){sessionStorage.removeItem('jc-open-menu');setTimeout(function(){var b=D.getElementById('openMenu');b&&b.click()},380)}}catch(e){}}
 reopen();addEventListener('pageshow',function(e){if(e.persisted)reopen()});
 if(p==='/'||p==='/index.html'||/^\/(admin|portfolio|services|about|watch)(\/|$)/.test(p))return;
 var main=D.getElementById('main');if(!main||D.querySelector('.jc-back'))return;
 var st=history.state||{},fromMenu=!!st.jcMenu;try{if(sessionStorage.getItem('jc-menu-to')===p){fromMenu=true;sessionStorage.removeItem('jc-menu-to');history.replaceState(Object.assign({},st,{jcMenu:1}),'')}}catch(e){}
 var sameRef=false;try{sameRef=!!D.referrer&&new URL(D.referrer).origin===location.origin&&D.referrer!==location.href}catch(e){}
 var a=D.createElement('a');a.className='back jc-back';a.href='/';
 a.innerHTML='<svg class="icon" aria-hidden="true"><use href="#i-left"/></svg> <span>'+(fromMenu?'Back to menu':'Back')+'</span>';
 a.addEventListener('click',function(e){e.preventDefault();if(fromMenu){try{sessionStorage.setItem('jc-open-menu','1')}catch(x){}}if(sameRef&&history.length>1)history.back();else location.href='/'});
 var row=D.createElement('div');row.className='wrap back-row';row.appendChild(a);main.insertBefore(row,main.firstChild)})();
/* ---------- loader + entrance ---------- */
var loader=$('#loader');
function ready(){D.body.classList.add('ready')}
/* hero entrance v2: starts only when the page is really visible (loader done, no entry gate) and the photo is decoded, so nothing blinks */
(function(){var hero=D.querySelector('section.hero');if(!hero)return;var H=D.documentElement,ph=hero.querySelector('.hero-photo'),dec=!ph,fired=false;
 function go(){if(fired||!D.body.classList.contains('ready')||H.classList.contains('jc-gate')||H.classList.contains('i18n-wait')||!dec)return;fired=true;
  requestAnimationFrame(function(){requestAnimationFrame(function(){D.body.classList.add('hero-go');
   setTimeout(function(){hero.querySelectorAll('.hx').forEach(function(e){e.style.transition='none';e.classList.remove('hx')})},2400)})})}
 window.JC_HERO_GO=go;
 if(ph){var done=function(){dec=true;go()};if(ph.complete&&ph.naturalWidth){(ph.decode?ph.decode():Promise.resolve()).then(done,done)}else{ph.addEventListener('load',function(){(ph.decode?ph.decode():Promise.resolve()).then(done,done)},{once:true});ph.addEventListener('error',done,{once:true})}setTimeout(done,2500)}
 new MutationObserver(go).observe(H,{attributes:true,attributeFilter:['class']});new MutationObserver(go).observe(D.body,{attributes:true,attributeFilter:['class']});
 setTimeout(function(){dec=true;if(!H.classList.contains('jc-gate'))D.body.classList.add('ready');go()},5000)})();
if(loader){var lv=anim(),seen=false;try{seen=sessionStorage.getItem('jc-seen')==='1';sessionStorage.setItem('jc-seen','1')}catch(e){}
 if(lv==='low'||seen){loader.classList.add('done');ready()}
 else{loader.classList.add('go');setTimeout(function(){loader.classList.add('done');ready()},lv==='high'?750:600)}
}else ready();

/* ---------- reveal on scroll ---------- */
var rvs=$$('.rv');
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});rvs.forEach(function(el){io.observe(el)})}else rvs.forEach(function(el){el.classList.add('in')});

/* ---------- stat count-up ---------- */
$$('[data-count]').forEach(function(el){var n=+el.dataset.count,suf=el.textContent.replace(/[0-9]/g,'');
 var run=function(){if(anim()==='low')return;var t0=null,d=1400;function step(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/d);el.textContent=Math.round(n*(1-Math.pow(1-p,3)))+suf;if(p<1)requestAnimationFrame(step)}requestAnimationFrame(step)};
 if('IntersectionObserver' in window){var o=new IntersectionObserver(function(es){if(es[0].isIntersecting){o.disconnect();run()}},{threshold:.6});o.observe(el)}});

/* ---------- cards ---------- */
function card(it,kind,idx,dup){
 var b=D.createElement('button');b.type='button';b.className='card '+(it.o||'h');
 if(dup){b.setAttribute('aria-hidden','true');b.tabIndex=-1}
 b.innerHTML='<img src="'+it.img+'" alt="" loading="lazy">'+(kind==='video'?'<span class="play">'+ICON('play')+'</span>':'')+'<span class="meta"><b>'+esc(it.t)+'</b><span>'+esc(it.c)+'</span></span>';
 b.setAttribute('aria-label',(kind==='video'?'Play ':'View ')+it.t);
 b.addEventListener('click',function(){openItem(it,kind)});return b}
function openItem(it,kind){if(it.id&&kind==='video'&&window.JC_WATCH){location.href='/watch/'+it.id+'?from='+(window.JC_FROM||'home');return}var m=$('#lbMedia');
 if(kind==='video'&&it.clip){m.innerHTML='<video src="'+it.clip+'" poster="'+it.img+'" controls playsinline autoplay></video>'}
 else{m.innerHTML='<img src="'+it.img+'" alt="'+esc(it.t)+'">'}
 $('#lbTitle').textContent=it.t;$('#lbCat').textContent=it.c+(it.s?' · '+it.s:'');
 var ld=$('#lbDesc');ld.textContent=it.d||'';if(it.url){var a=D.createElement('a');a.href=it.url;a.target='_blank';a.rel='noopener';a.className='btn btn-primary';a.style.marginTop='10px';a.textContent='Watch full video';ld.appendChild(D.createElement('br'));ld.appendChild(a)}
 openLayer($('#lightbox'))}

/* ---------- OTT rows ---------- */
var autos=[];
function buildRow(container,title,note,items,kind,auto){
 var row=D.createElement('div');row.className='row rv in';
 row.innerHTML='<div class="row-head"><h2 class="row-title">'+esc(title)+(note?'<small>'+esc(note)+'</small>':'')+'</h2><div class="row-arrows"><button class="arr" aria-label="Scroll left">'+ICON('left')+'</button><button class="arr" aria-label="Scroll right">'+ICON('right')+'</button></div></div><div class="track'+(auto?' auto':'')+'"></div><div class="fade-l"></div><div class="fade-r"></div>';
 var tr=row.querySelector('.track');fillTrack(tr,items,kind,auto);
 var arr=row.querySelectorAll('.arr');
 arr[0].addEventListener('click',function(){tr.scrollBy({left:-tr.clientWidth*.8,behavior:anim()==='low'?'auto':'smooth'})});
 arr[1].addEventListener('click',function(){tr.scrollBy({left:tr.clientWidth*.8,behavior:anim()==='low'?'auto':'smooth'})});
 container.appendChild(row)}
function fillTrack(tr,items,kind,auto){
 items.forEach(function(it,i){tr.appendChild(card(it,kind,i))});
 if(auto){items.forEach(function(it,i){tr.appendChild(card(it,kind,i,true))});autos.push({el:tr,paused:false,half:0,pos:0});
  var a=autos[autos.length-1];
  ['mouseenter','touchstart','focusin','pointerdown'].forEach(function(ev){tr.addEventListener(ev,function(){a.paused=true;clearTimeout(a.t)},{passive:true})});
  ['mouseleave','touchend','focusout','pointerup'].forEach(function(ev){tr.addEventListener(ev,function(){clearTimeout(a.t);a.t=setTimeout(function(){a.pos=tr.scrollLeft;a.paused=false},1800)},{passive:true})});
 }}
var lastT=0;
function tick(t){var dt=lastT?Math.min(50,t-lastT):16;lastT=t;var lv=anim();var sp=lv==='high'?0.045:lv==='moderate'?0.022:0;
 if(sp&&!D.hidden)autos.forEach(function(a){if(a.paused||!a.el.isConnected)return;a.half=a.el.scrollWidth/2;a.pos+=sp*dt;if(a.pos>=a.half)a.pos-=a.half;a.el.scrollLeft=a.pos});
 requestAnimationFrame(tick)}
requestAnimationFrame(tick);
autos.forEach(function(a){a.el.addEventListener('scroll',function(){if(a.paused){a.pos=a.el.scrollLeft}},{passive:true})});

/* home row */
var homeRow=$('#homeRow');
if(homeRow&&JC.video){fillTrack(homeRow,(JC.homeItems&&JC.homeItems.length?JC.homeItems:JC.video.items.slice(0,9)),'video',true);
 var a=autos[autos.length-1];homeRow.addEventListener('scroll',function(){if(a.paused)a.pos=homeRow.scrollLeft},{passive:true})}

/* ---------- portfolio page ---------- */
var rowsEl=$('#rows');
if(rowsEl){
 var kind='video',cat='All',sub=null,slideT=null;
 function lib(){return JC[kind]}
 function rowItems(r){var L=lib();return r.pick?r.pick.map(function(i){return L.items[i]}):L.items.filter(function(x){return x.c===r.c})}
 function renderFeature(){var f=$('#feature'),L=lib();clearInterval(slideT);
  f.innerHTML=L.feature.map(function(s,i){return '<div class="slide'+(i===0?' on':'')+'" role="group" aria-roledescription="slide" aria-label="'+(i+1)+' of '+L.feature.length+'"><img src="'+s.img+'" alt=""><div class="shade"></div><div class="f-copy"><span class="eyebrow" style="color:#2BF5C0">Featured</span><h2 class="h-lg grad-text" style="background:linear-gradient(180deg,#2BF5C0,#0DBC94 60%,#196453);-webkit-background-clip:text;background-clip:text">'+esc(s.t)+'</h2><p>'+esc(s.d)+'</p><button class="btn btn-primary" data-i="'+s.i+'">'+ICON('play')+(kind==='video'?' Watch':' View')+'</button></div></div>'}).join('')+'<div class="dots">'+L.feature.map(function(s,i){return '<button aria-label="Slide '+(i+1)+'" class="'+(i===0?'on':'')+'"></button>'}).join('')+'</div>';
  var slides=$$('.slide',f),dots=$$('.dots button',f),cur=0;
  function go(n){slides[cur].classList.remove('on');dots[cur].classList.remove('on');cur=(n+slides.length)%slides.length;slides[cur].classList.add('on');dots[cur].classList.add('on')}
  dots.forEach(function(d,i){d.addEventListener('click',function(){go(i);restart()})});
  $$('[data-i]',f).forEach(function(b){b.addEventListener('click',function(){openItem(L.items[+b.dataset.i],kind)})});
  function restart(){clearInterval(slideT);if(anim()!=='low'&&slides.length>1)slideT=setInterval(function(){go(cur+1)},anim()==='high'?5000:7000)}
  restart()}
 function renderRows(){autos=autos.filter(function(a){return a.el===homeRow});rowsEl.innerHTML='';lib().rows.forEach(function(r){buildRow(rowsEl,r.title,r.note,rowItems(r),kind,!!r.auto)});
  autos.forEach(function(a){a.el.addEventListener('scroll',function(){if(a.paused)a.pos=a.el.scrollLeft},{passive:true})})}
 function renderChips(){var L=lib(),cc=$('#catChips');var names=['All'].concat(Object.keys(L.cats));
  cc.innerHTML=names.map(function(n){return '<button class="chip" aria-pressed="'+(n===cat)+'">'+esc(n)+'</button>'}).join('');
  $$('.chip',cc).forEach(function(b){b.addEventListener('click',function(){cat=b.textContent;sub=null;renderChips();renderGrid()})});
  var sc=$('#subChips');
  if(cat==='All'){sc.classList.add('hidden');sc.innerHTML=''}
  else{sc.classList.remove('hidden');var subs=['All '+cat].concat(L.cats[cat]||[]);
   sc.innerHTML=subs.map(function(n,i){var on=(i===0&&!sub)||n===sub;return '<button class="chip" aria-pressed="'+on+'">'+esc(n)+'</button>'}).join('');
   $$('.chip',sc).forEach(function(b,i){b.addEventListener('click',function(){sub=i===0?null:b.textContent;renderChips();renderGrid()})})}}
 function renderGrid(){var L=lib(),g=$('#grid');var items=L.items.filter(function(x){return cat==='All'||(x.c===cat&&(!sub||x.s===sub))});
  /* All = one flat grid, no folders. Video grid mixes vertical + horizontal, so use a uniform tile per kind */
  g.className='grid '+(kind==='video'?'v':'h');g.innerHTML='';
  items.forEach(function(it,i){var c=card(it,kind,i);if(kind==='video'){c.classList.remove('h');c.classList.add('v')}c.classList.add('pop');c.style.animationDelay=Math.min(i,12)*35+'ms';g.appendChild(c)});
  $('#gridTitle').textContent=cat==='All'?'All':(sub||cat);$('#gridCount').textContent=items.length+' '+(kind==='video'?'videos':'thumbnails')}
 function renderAll(){renderFeature();renderRows();renderChips();renderGrid()}
 $$('.tab').forEach(function(t){t.addEventListener('click',function(){kind=t.dataset.kind;cat='All';sub=null;$$('.tab').forEach(function(x){x.setAttribute('aria-selected',x===t?'true':'false')});$('#pfPanel').setAttribute('aria-labelledby',t.id);renderAll()})});
 renderAll()}

/* ---------- search ---------- */
var sIn=$('#searchInput'),sRes=$('#searchResults');
function renderSearch(q){if(!sRes)return;q=(q||'').trim().toLowerCase();var list=(JC.services||[]).filter(function(s){return !q||(s.t+' '+s.d).toLowerCase().indexOf(q)>-1});
 if(!list.length){sRes.innerHTML='<div class="s-empty">No service found for “'+esc(q)+'”. Try “reels”, “wedding” or “thumbnail”.</div>';return}
 var rel=q?(JC.services||[]).filter(function(s){return list.indexOf(s)<0}).slice(0,3):[];
 sRes.innerHTML=list.map(function(s){return '<a class="s-item" href="/services/'+esc(s.slug||'')+'"><img src="'+s.img+'" alt=""><div><b>'+esc(s.t)+'</b><span>'+esc(s.d)+'</span></div></a>'}).join('')+(rel.length?'<div class="s-empty" style="text-align:left;padding:10px 4px 4px">Related services</div>'+rel.map(function(s){return '<a class="s-item" href="/services/'+esc(s.slug||'')+'"><img src="'+s.img+'" alt=""><div><b>'+esc(s.t)+'</b><span>'+esc(s.d)+'</span></div></a>'}).join(''):'')+'<a class="s-item" href="/services" style="justify-content:center"><div><b>See all services →</b></div></a>';
 $$('.s-item',sRes).forEach(function(a){a.addEventListener('click',function(){closeLayer(true)})})}
sIn&&sIn.addEventListener('input',function(){renderSearch(sIn.value)});

/* ---------- hire form ---------- */
var hf=$('#hireForm');
function openHire(){if(window.JCL&&JCL.site&&!JCL.user){toast('Please sign in to send a hire request');openLayer($('#loginModal'));return}openLayer($('#hireModal'))}
$('#hireBtn')&&$('#hireBtn').addEventListener('click',openHire);
$$('[data-hire]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();if(hf)openHire();else location.href='/?hire=1'})});
if(hf){
 $$('[data-single]',hf).forEach(function(g){$$('.chip',g).forEach(function(c){c.addEventListener('click',function(){$$('.chip',g).forEach(function(x){x.setAttribute('aria-pressed',x===c?'true':'false')});
  if(g.dataset.single==='agency')$('#agencyFields').classList.toggle('hidden',c.dataset.v!=='yes');
  if(g.dataset.single==='perday')$('#perdayCustom').classList.toggle('hidden',c.dataset.v!=='custom')})})});
 $$('#catList .chip').forEach(function(c){c.addEventListener('click',function(){var on=c.getAttribute('aria-pressed')!=='true';c.setAttribute('aria-pressed',on?'true':'false');if(c.textContent==='Other')$('#catOther').classList.toggle('hidden',!on)})});
 $('#catSearch').addEventListener('input',function(e){var q=e.target.value.toLowerCase();$$('#catList .chip').forEach(function(c){c.classList.toggle('hidden',q&&c.textContent.toLowerCase().indexOf(q)<0&&c.textContent!=='Other')})});
 var desc=$('#hDesc'),wc=$('#wordCount');
 function words(){return (desc.value.trim().match(/\S+/g)||[]).length}
 desc.addEventListener('input',function(){var n=words();if(n>500){desc.value=desc.value.trim().split(/\s+/).slice(0,500).join(' ');n=500}wc.textContent=n+' / 500 words';wc.classList.toggle('over',n>=500)});
 hf.addEventListener('submit',function(e){e.preventDefault();
  var name=$('#hName'),em=$('#hEmail');
  if(!name.value.trim()){name.focus();toast('Please enter your name');return}
  if(!em.checkValidity()||!em.value){em.focus();toast('Please enter a valid email');return}
  if(!$$('#catList .chip[aria-pressed=true]').length){$('#catSearch').focus();toast('Pick at least one type of work');return}
  if(!$('#hTc').checked){$('#hTc').focus();toast('Please tick the Terms & Conditions box');return}
  var btn=hf.querySelector('[type=submit]');btn&&(btn.disabled=true);
  window.JCL.submitHire(hf).then(function(r){btn&&(btn.disabled=false);if(!r.ok){toast(r.error||'Could not send, please try again');return}
   toast((window.JCL.c.hire_form.thanks||'Request sent!')+' ('+r.number+')');hf.reset();$$('#catList .chip').forEach(function(c){c.setAttribute('aria-pressed','false')});wc.textContent='0 / 500 words';setTimeout(function(){closeLayer()},1200)})})}

/* ---------- soon page ---------- */
var st=$('#soonName');if(st){var h=(location.hash||'').replace('#','').replace(/-/g,' ');if(h){var nm=h.charAt(0).toUpperCase()+h.slice(1);$('#soonTitle').textContent=nm;st.textContent='The '+nm+' page'}}
};

/* ---------- drawer settings view ---------- */
(function(){var dr=document.getElementById('drawer'),o=document.getElementById('openSettings'),cl=document.getElementById('closeSettings'),sub=document.getElementById('dSettings');if(!dr||!o)return;
function show(on){dr.classList.toggle('settings-open',on);sub.setAttribute('aria-hidden',on?'false':'true');var f=on?cl:o;setTimeout(function(){f&&f.focus()},30)}
o.addEventListener('click',function(){show(true)});cl&&cl.addEventListener('click',function(){show(false)});
new MutationObserver(function(){if(!dr.classList.contains('on')&&dr.classList.contains('settings-open'))dr.classList.remove('settings-open')}).observe(dr,{attributes:true,attributeFilter:['class']});
if(location.hash==='#settings'){var b=document.getElementById('openMenu');b&&b.click();show(true)}})();
