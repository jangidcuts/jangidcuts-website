/* Jangid Cuts — in-site bundle player (Nov 1 2026). My Downloads -> Open -> categories -> tracks.
   Play streams through /api/lf/<token>/... (Range, seekable). Every download opens a size card first.
   Nov 3 (Prashant 8:32 PM): Download All / category / Mobile-PC download = one ZIP built right in the browser (files fetched
   through /api/lf, 3 at a time, stored uncompressed). Desktop Chrome/Edge stream one ZIP straight to disk; phones and other
   browsers get ZIP parts (iPhone 300 MB, Android 500 MB, desktop 1 GB) so memory never runs out. Exact item counts are never
   shown: the pack's marketed "N+" (from the title) on the header, size + format on categories.
   Mobile / PC switch when the pack has Mobile and PC folders (Mobile_33pt / PC_65pt, Mobile_DNG / PC_XMP ...). */
(function(){'use strict';
var D=document,$=function(s,r){return (r||D).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function I(n){return '<svg class="icon" aria-hidden="true"><use href="#i-'+n+'"/></svg>'}
var SV={play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>',
 pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>',
 dl:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 next:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6.5v11a.8.8 0 0 0 1.2.7l8.3-5.5a.8.8 0 0 0 0-1.4L7.2 5.8A.8.8 0 0 0 6 6.5z" fill="currentColor"/><rect x="16.5" y="6" width="2.5" height="12" rx="1" fill="currentColor"/></svg>',
 prev:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6.5v11a.8.8 0 0 1-1.2.7l-8.3-5.5a.8.8 0 0 1 0-1.4l8.3-5.5A.8.8 0 0 1 18 6.5z" fill="currentColor"/><rect x="5" y="6" width="2.5" height="12" rx="1" fill="currentColor"/></svg>',
 chev:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 note:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18.5V6.2l10-2.2v12.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="6.5" cy="18.5" r="2.6" fill="currentColor"/><circle cx="16.5" cy="16.3" r="2.6" fill="currentColor"/></svg>',
 x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
 file:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
 eye:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
 phone:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="2.5" width="11" height="19" rx="2.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10.5 18.2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
 pc:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4" width="19" height="12.5" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 20.5h7M12 16.5v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
 check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'};
/* Nov 2 (Prashant 6:03 PM): only files that can really be previewed get a preview button.
   Audio -> play in the mini player; jpg/png/webp -> image preview; LUT/CC/presets/txt/pdf/zip/video -> name + size + Download only. */
var AUD=/^(mp3|wav|m4a|ogg|oga|aac|flac)$/,IMG=/^(jpe?g|png|webp)$/;
function extOf(t){return ((/\.([a-z0-9]{2,5})$/i.exec(t.f||'')||[])[1]||'').toLowerCase()}
function kind(t){if(t.k!==undefined)return t.k;var e=extOf(t),m=String(t.m||'').toLowerCase(),k='';
 if(AUD.test(e)||(!e&&/^audio\//.test(m)))k='a';else if(IMG.test(e)&&(!m||/^image\/(jpeg|png|webp)$/.test(m)||/octet/.test(m)))k='i';else if(!e&&/^image\/(jpeg|png|webp)$/.test(m))k='i';
 t.k=k;return k}
function allAudio(list){return list.every(function(t){return kind(t)==='a'})}
function word(list,n){var a=allAudio(list);return n===1?(a?'track':'file'):(a?'tracks':'files')}
function allTracks(){var a=[];L.cats.forEach(function(c){a=a.concat(c.tracks)});return a}
function nR(n){n=+n||0;return n>=100?Math.floor(n/100)*100+'+':''+n}
/* ---- counts: never exact (Nov 3) ---- */
function itemWord(list){var t=String(L&&L.product&&L.product.title||'');
 if(/\bsfx\b|sound\s*effect/i.test(t))return 'sound effects';if(/\bluts?\b/i.test(t))return 'LUTs';if(/preset/i.test(t))return 'presets';
 if(/music|bgm|track|song/i.test(t))return 'tracks';return word(list,2)}
function countText(list){return L.nl?L.nl+' '+itemWord(list):''}
function fmts(list){var m={};list.forEach(function(t){var e=extOf(t);if(e)m[e.toUpperCase()]=(m[e.toUpperCase()]||0)+1});var k=Object.keys(m).sort(function(a,b){return m[b]-m[a]});return k.slice(0,2).join(' / ')}
function bytesOf(list){return list.reduce(function(x,t){return x+(+t.s||0)},0)}
function subLine(list){var f=fmts(list);return (f?esc(f)+' \u00b7 ':'')+size(bytesOf(list))}
/* ---- Mobile / PC (Nov 3) ---- */
var PL='';
function hasSplit(){if(L._sp!==undefined)return L._sp;var m=0,p=0;allTracks().forEach(function(t){if(t.p==='m')m=1;else if(t.p==='p')p=1});return L._sp=!!(m&&p)}
function plKey(){return 'jc-lib-pl-'+PID}
function initPL(){if(!hasSplit()){PL='';return}var s='';try{s=localStorage.getItem(plKey())||''}catch(e){}PL=s==='m'||s==='p'?s:(MOBILE?'m':'p')}
function setPL(v){PL=v;try{localStorage.setItem(plKey(),v)}catch(e){}}
function vis(list){return PL?list.filter(function(t){return !t.p||t.p===PL}):list}
function visCats(){return L.cats.map(function(c){return {c:c,t:vis(c.tracks)}}).filter(function(x){return x.t.length})}
var PLN={m:'Mobile',p:'PC'};
function plHelp(list){var e={};list.forEach(function(t){if(t.p===PL)e[extOf(t)]=1});
 if(e.cube)return PL==='m'?'<b>Mobile</b> \u00b7 33-point .cube LUTs for CapCut, VN, LumaFusion, InShot and Alight Motion.':'<b>PC</b> \u00b7 65-point .cube LUTs for Premiere Pro, DaVinci Resolve, Final Cut Pro and After Effects.';
 if(e.dng||e.xmp)return PL==='m'?'<b>Mobile</b> \u00b7 .dng presets for Lightroom Mobile (free app): open the DNG, tap \u22ef \u2192 Create Preset.':'<b>PC</b> \u00b7 .xmp presets for Lightroom Classic and Lightroom desktop: Presets \u2192 \u22ef \u2192 Import Presets.';
 return PL==='m'?'<b>Mobile</b> \u00b7 CapCut / VN / LumaFusion / Lightroom Mobile':'<b>PC</b> \u00b7 Premiere / Resolve / FCPX / Lightroom Classic'}
function plHTML(){if(!PL)return '';return '<div class="lb-pls" role="tablist" aria-label="Choose your device">'+['m','p'].map(function(k){return '<button role="tab" class="lb-plt'+(PL===k?' on':'')+'" data-pl="'+k+'" aria-selected="'+(PL===k)+'">'+(k==='m'?SV.phone:SV.pc)+'<span>'+PLN[k]+'</span></button>'}).join('')+'</div><p class="lb-plh">'+plHelp(allTracks())+'</p>'}
function bindPL(){$$('[data-pl]',root).forEach(function(b){b.onclick=function(){if(PL===b.dataset.pl)return;setPL(b.dataset.pl);if(curCat&&!vis(curCat.tracks).length){history.replaceState(null,'',location.pathname+location.search);showHome()}else redrawAll()}})}
function redrawAll(){if(curCat)showCat(curCat);else showHome()}
function sizeR(b){b=+b||0;return b>=1e9?'~'+Math.round(b/1e9)+' GB':size(b)}
function size(b){b=+b||0;if(b>=1e9)return (b/1e9).toFixed(1)+' GB';if(b>=1e6)return Math.round(b/1e6)+' MB';if(b>=1e3)return Math.round(b/1e3)+' KB';return b+' B'}
function tm(s){if(!isFinite(s)||s<0)s=0;s=Math.floor(s);var m=Math.floor(s/60),x=s%60;return m+':'+(x<10?'0':'')+x}
function toast(m){window.JC_UI?JC_UI.toast(m):alert(m)}
function api(p){return fetch(p,{credentials:'same-origin',headers:{'x-jc':'1'}}).then(function(r){return r.json().catch(function(){return{ok:false,error:'Something went wrong'}})}).catch(function(){return{ok:false,error:'You seem to be offline. Please try again.'}})}
var IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
var MOBILE=IOS||/Android|Mobile|iPhone|iPad/i.test(navigator.userAgent);

var L=null,PID=0,root=null,au=null,cur=null,curCat=null,job=null,wake=null,loadedAt=0;
function doneKey(){return 'jc-lib-done-'+PID}
function doneSet(){try{return new Set(JSON.parse(localStorage.getItem(doneKey())||'[]'))}catch(e){return new Set()}}
function markDone(id){try{var s=doneSet();s.add(id);localStorage.setItem(doneKey(),JSON.stringify(Array.from(s)))}catch(e){}}
function url(t,dl){return '/api/lf/'+encodeURIComponent(L.token)+'/'+t.i+'/'+encodeURIComponent(t.f)+(dl?'?dl=1':'')}
function fresh(){ // re-read the listing (new token) when the token is older than 6 h
 if(L&&Date.now()-loadedAt<6*36e5&&L.exp-Date.now()>36e5)return Promise.resolve(L);
 return api('/api/lib/'+PID).then(function(r){if(r&&r.ok){L=r;loadedAt=Date.now()}return L})}
function catById(id){return L.cats.find(function(c){return c.id===id})}
function trackById(id){for(var i=0;i<L.cats.length;i++){var t=L.cats[i].tracks.find(function(x){return x.i===id});if(t)return {t:t,c:L.cats[i]}}return null}

function view(app,ctx){
 var q=new URLSearchParams(location.search);PID=+q.get('p')||0;
 app.innerHTML='<div class="lb wrap" id="lb"><div class="lb-load"><span class="lb-spin"></span>Loading your files\u2026</div></div>';
 root=$('#lb',app);D.body.classList.add('lb-on');
 if(!ctx.user){root.innerHTML='<a class="lb-back" href="/orders">'+SV.back+'<span>My Downloads</span></a><div class="lb-empty">'+I('lock')+'<p>Sign in to open your pack.</p><button class="btn btn-primary" id="lbSi">Sign in</button></div>';$('#lbSi').onclick=function(){var m=$('#loginModal');m&&JC_UI.open(m)};return}
 if(!PID){location.replace('/orders');return}
 api('/api/lib/'+PID).then(function(r){
  if(!r||r.ok===false){root.innerHTML='<a class="lb-back" href="/orders">'+SV.back+'<span>My Downloads</span></a><div class="lb-empty">'+I('lock')+'<p>'+esc((r&&r.error)||'Could not open this pack.')+'</p><a class="btn btn-ghost" href="/store">Go to Store</a></div>';return}
  L=r;loadedAt=Date.now();D.title=r.product.title+' | Jangid Cuts';initPL();
  window.addEventListener('popstate',route);route();
 });
}
/* Nov 1: upgrade suggestion (free -> Starter -> Pro -> Ultimate; set in Admin -> Products -> Upgrade to) */
function upHTML(){var n=L&&L.next;if(!n)return '';var T={free:'Free',starter:'Starter',pro:'Pro',ultimate:'Ultimate'},t=n.tier&&n.tier!=='free'?T[n.tier]:'';var txt=n.up_text||(t?'Want more? Get the '+t+' pack':'Want more? Get '+n.title);
 return '<a class="lb-up" href="/store?p='+(+n.id)+'"><span class="lb-up-tx"><small>'+(t?'Upgrade \u00b7 '+esc(t):'Upgrade')+'</small><b>'+esc(txt)+'</b><i>'+esc(n.title)+(n.size_text?' \u00b7 '+esc(n.size_text):'')+'</i></span><span class="lb-up-go">'+(n.price>0?'\u20b9'+Number(n.price).toLocaleString('en-IN'):'Free')+' \u2192</span></a>'}
function route(){var h=/[#&]c=([\w-]+)/.exec(location.hash);var c=h&&catById(h[1]);if(c)showCat(c);else showHome()}
function goCat(c){history.pushState({lb:1},'','#c='+c.id);showCat(c);window.scrollTo(0,0)}

var FLAT_MAX=80; // small packs (free packs): every file listed right under Download All, no category step
function flat(){return L.n<=FLAT_MAX}
function rowHTML(t,done){var k=kind(t),on=cur&&cur.i===t.i,e=extOf(t);
 var lead=k==='a'?'<button class="lb-pl" aria-label="Preview '+esc(t.n)+'">'+(on&&au&&!au.paused?SV.pause:SV.play)+'</button>':k==='i'?'<button class="lb-pl lb-pv" aria-label="Preview '+esc(t.f)+'">'+SV.eye+'</button>':'<span class="lb-ft" aria-hidden="true">'+(e&&e.length<=4?esc(e.toUpperCase()):SV.file)+'</span>';
 return '<div class="lb-tr'+(k?'':' nopv')+(on?' on':'')+'" data-t="'+esc(t.i)+'">'+lead+'<span class="lb-tt"><b>'+esc(t.n||t.f)+'</b><small>'+(k==='a'&&t.b?t.b+' BPM \u00b7 ':'')+size(t.s)+(done.has(t.i)?' \u00b7 <em>'+SV.check+'saved</em>':'')+'</small></span>'+(k==='a'?'<span class="lb-eq" aria-hidden="true"><i></i><i></i><i></i></span>':'')+'<button class="lb-dl" data-td="'+esc(t.i)+'" aria-label="Download '+esc(t.f)+'">'+SV.dl+'</button></div>'}
function bindRows(){
 $$('.lb-tr',root).forEach(function(el){el.onclick=function(e){if(e.target.closest('.lb-dl'))return;var x=trackById(el.dataset.t),k=kind(x.t);if(k==='a'){if(cur&&cur.i===x.t.i)toggle();else play(x.t,x.c)}else if(k==='i')cardImg(x.t,x.c);else cardTrack(x.t,x.c)}});
 $$('[data-td]',root).forEach(function(b){b.onclick=function(e){e.stopPropagation();var x=trackById(b.dataset.td);cardTrack(x.t,x.c)}});
}
function showHome(){curCat=null;
 var p=L.product,all=allTracks(),fl=flat(),done=fl?doneSet():null,vc=visCats(),va=vis(all),pv=va.some(function(t){return kind(t)}),aud=va.some(function(t){return kind(t)==='a'});
 var allLbl=PL?'Download all for '+PLN[PL]:'Download All';
 root.innerHTML='<section class="lb-hero"><div class="lb-cover">'+(p.image?'<img src="'+esc(p.image)+'" alt="">':(aud||!va.length?SV.note:SV.file))+'</div><div class="lb-hi"><span class="eyebrow">'+(p.free?'Free pack':'Your pack')+'</span><h1>'+esc(p.title)+'</h1><p>'+[esc(countText(all)),fl&&L.cats.length===1?'':L.cats.length+(L.cats.length===1?' category':' categories'),size(L.bytes)].filter(Boolean).join(' \u00b7 ')+'</p></div></section>'+
 plHTML()+
 '<button class="btn btn-primary lb-all" id="lbAll">'+SV.dl+' '+allLbl+(PL?' \u00b7 '+size(bytesOf(va)):'')+'</button>'+
 '<p class="lb-tip">'+(fl?(pv?'Tap '+(aud?'<b class="lb-dlm">'+SV.play+'</b>':'<b class="lb-dlm">'+SV.eye+'</b>')+' to preview. ':''):(aud?'Tap a category to play any track. ':'Tap a category to see its files. '))+'Every <b class="lb-dlm">'+SV.dl+'</b> shows the size first; folders download as one ZIP.</p>'+
 (fl?vc.map(function(x){var c=x.c;return (vc.length>1?'<div class="lb-sec"><span class="lb-ct"><b>'+esc(c.name)+'</b><small>'+subLine(x.t)+'</small></span><button class="lb-dl" data-cd="'+esc(c.id)+'" aria-label="Download '+esc(c.name)+'">'+SV.dl+'</button></div>':'')+'<div class="lb-tracks">'+x.t.map(function(t){return rowHTML(t,done)}).join('')+'</div>'}).join(''):
 '<div class="lb-cats">'+vc.map(function(x,i){var c=x.c;return '<div class="lb-cat" data-c="'+esc(c.id)+'" role="button" tabindex="0"><span class="lb-ci">'+(i<9?'0':'')+(i+1)+'</span><span class="lb-ct"><b>'+esc(c.name)+'</b><small>'+subLine(x.t)+'</small></span><button class="lb-dl" data-cd="'+esc(c.id)+'" aria-label="Download '+esc(c.name)+'">'+SV.dl+'</button><span class="lb-chev">'+SV.chev+'</span></div>'}).join('')+'</div>')+upHTML();
 $('#lbAll').onclick=function(){cardAll()};
 $$('.lb-cat',root).forEach(function(el){el.onclick=function(e){if(e.target.closest('.lb-dl'))return;goCat(catById(el.dataset.c))};el.onkeydown=function(e){if(e.key==='Enter')el.click()}});
 $$('[data-cd]',root).forEach(function(b){b.onclick=function(e){e.stopPropagation();cardCat(catById(b.dataset.cd))}});
 bindPL();
 if(fl)bindRows();
 bars();
}
function redraw(){if(curCat)showCat(curCat);else if(L&&flat())showHome()}
function showCat(c){curCat=c;
 var done=doneSet(),list=vis(c.tracks);
 root.innerHTML='<section class="lb-chead"><div><button class="lb-crumb" id="lbUp">All categories</button><h1>'+esc(c.name)+'</h1><p>'+(PL?PLN[PL]+' \u00b7 ':'')+subLine(list)+'</p></div><button class="btn btn-ghost btn-s lb-cdl" id="lbCdl">'+SV.dl+' Download</button></section>'+
 (PL?plHTML():'')+
 '<div class="lb-tracks">'+list.map(function(t){return rowHTML(t,done)}).join('')+'</div>';
 $('#lbUp').onclick=function(){if(history.state&&history.state.lb)history.back();else{history.replaceState(null,'',location.pathname+location.search);showHome()}};
 $('#lbCdl').onclick=function(){cardCat(c)};
 bindPL();
 bindRows();
 bars();
}

/* ---------- player ---------- */
function player(){
 if(au)return;au=new Audio();au.preload='metadata';
 var bar=D.createElement('div');bar.className='lb-mini';bar.id='lbMini';bar.hidden=true;
 bar.innerHTML='<input type="range" class="lb-seek" id="lbSeek" min="0" max="1000" value="0" aria-label="Seek"><div class="lb-mrow"><div class="lb-mt"><b id="lbMt"></b><small id="lbMs"></small></div><span class="lb-time" id="lbTime">0:00 / 0:00</span><button class="lb-mb" id="lbPrev" aria-label="Previous">'+SV.prev+'</button><button class="lb-mb lb-mp" id="lbPlay" aria-label="Play or pause">'+SV.play+'</button><button class="lb-mb" id="lbNext" aria-label="Next">'+SV.next+'</button></div>';
 D.body.appendChild(bar);
 var seek=$('#lbSeek'),dragging=false;
 seek.oninput=function(){dragging=true;if(au.duration)$('#lbTime').textContent=tm(seek.value/1000*au.duration)+' / '+tm(au.duration)};
 seek.onchange=function(){if(au.duration)au.currentTime=seek.value/1000*au.duration;dragging=false};
 au.ontimeupdate=function(){if(!dragging&&au.duration){seek.value=Math.round(au.currentTime/au.duration*1000);seek.style.setProperty('--p',(au.currentTime/au.duration*100)+'%')}$('#lbTime').textContent=tm(au.currentTime)+' / '+tm(au.duration)};
 au.onplay=au.onpause=function(){bars()};
 au.onwaiting=function(){bar.classList.add('wait')};au.onplaying=au.oncanplay=function(){bar.classList.remove('wait')};
 au.onended=function(){step(1)};
 au.onerror=function(){if(cur){toast('This track could not play right now. Please try again.');bars()}};
 $('#lbPlay').onclick=toggle;$('#lbPrev').onclick=function(){if(au.currentTime>4)au.currentTime=0;else step(-1)};$('#lbNext').onclick=function(){step(1)};
}
function play(t,c){player();cur=t;cur.c=c.id;
 fresh().then(function(){au.src=url(t);au.play().catch(function(){});var m=$('#lbMini');m.hidden=false;D.body.classList.add('lb-has-mini');$('#lbMt').textContent=t.n;$('#lbMs').textContent=c.name+(t.b?' \u00b7 '+t.b+' BPM':'');bars();
  if('mediaSession' in navigator){try{navigator.mediaSession.metadata=new MediaMetadata({title:t.n,artist:'Jangid Cuts',album:c.name,artwork:L.product.image?[{src:L.product.image,sizes:'512x512'}]:[]});navigator.mediaSession.setActionHandler('nexttrack',function(){step(1)});navigator.mediaSession.setActionHandler('previoustrack',function(){step(-1)})}catch(e){}}});
}
function toggle(){if(!au||!cur)return;if(au.paused)au.play().catch(function(){});else au.pause()}
function step(d){if(!cur)return;var c=catById(cur.c);if(!c)return;var tl=vis(c.tracks),i=tl.findIndex(function(x){return x.i===cur.i});var n=tl[i+d];while(n&&kind(n)!=='a'){i+=d;n=tl[i+d]}if(n)play(n,c);else if(d>0){au.pause();bars()}}
function bars(){
 var playing=au&&cur&&!au.paused;
 $$('.lb-tr').forEach(function(el){var on=cur&&el.dataset.t===cur.i;el.classList.toggle('on',!!on);el.classList.toggle('playing',!!(on&&playing));var b=$('.lb-pl:not(.lb-pv)',el);if(b)b.innerHTML=on&&playing?SV.pause:SV.play});
 var pb=$('#lbPlay');if(pb)pb.innerHTML=playing?SV.pause:SV.play;
}

/* ---------- size cards ---------- */
function sheet(html,onReady){
 var old=$('#lbSheet');if(old)old.remove();
 var w=D.createElement('div');w.className='lb-sheet';w.id='lbSheet';w.innerHTML='<div class="lb-scrim" data-x></div><div class="lb-card" role="dialog" aria-modal="true"><button class="lb-x" data-x aria-label="Close">'+SV.x+'</button>'+html+'</div>';
 D.body.appendChild(w);requestAnimationFrame(function(){w.classList.add('on')});
 var close=function(){w.classList.remove('on');setTimeout(function(){w.remove()},250)};
 $$('[data-x]',w).forEach(function(b){b.onclick=close});
 onReady&&onReady(w,close);return close;
}
function dlOne(t,close){fresh().then(function(){var x=D.createElement('a');x.href=url(t,true);x.download=t.f;x.rel='noopener';D.body.appendChild(x);x.click();x.remove();markDone(t.i);toast('Download started \u2014 check your Downloads folder.');close();setTimeout(redraw,300)})}
function cardTrack(t,c){
 var ext=extOf(t).toUpperCase(),isA=kind(t)==='a';
 sheet('<span class="lb-ico">'+(isA?SV.note:SV.file)+'</span><h3>'+esc(t.n||t.f)+'</h3><p class="lb-sub">'+esc(c.name)+'</p>'+
  '<div class="lb-facts"><div><small>Size</small><b>'+size(t.s)+'</b></div>'+(isA?'<div><small>Duration</small><b id="lbDur">\u2026</b></div>':'')+(isA&&t.b?'<div><small>BPM</small><b>'+t.b+'</b></div>':'')+(ext?'<div><small>Format</small><b>'+esc(ext)+'</b></div>':'')+'</div>'+
  '<p class="lb-fn">'+esc(t.f)+'</p>'+'<button class="btn btn-primary lb-go" id="lbGo">'+SV.dl+' Download \u00b7 '+size(t.s)+'</button>',
 function(w,close){
  if(isA){var a=new Audio();a.preload='metadata';a.onloadedmetadata=function(){var d=$('#lbDur',w);if(d)d.textContent=tm(a.duration);a.onerror=null;a.removeAttribute('src');try{a.load()}catch(e){}};a.onerror=function(){var d=$('#lbDur',w);if(d)d.textContent='\u2014'};
  if(cur&&cur.i===t.i&&au&&au.duration){$('#lbDur',w).textContent=tm(au.duration)}else fresh().then(function(){a.src=url(t)});}
  $('#lbGo',w).onclick=function(){dlOne(t,close)};
 });
}
/* image preview (jpg/png/webp only) */
function cardImg(t,c){
 sheet('<h3>'+esc(t.n||t.f)+'</h3><p class="lb-sub">'+esc(t.f)+' \u00b7 '+size(t.s)+'</p><div class="lb-img"><span class="lb-spin"></span><img id="lbImg" alt=""></div><button class="btn btn-primary lb-go" id="lbGo">'+SV.dl+' Download \u00b7 '+size(t.s)+'</button>',
 function(w,close){var im=$('#lbImg',w);im.onload=function(){im.parentNode.classList.add('ok')};im.onerror=function(){im.parentNode.classList.add('bad')};fresh().then(function(){im.src=url(t)});$('#lbGo',w).onclick=function(){dlOne(t,close)}});
}
function safeName(s){return String(s||'').replace(/[\\\/:*?"<>|\u0000-\u001f]+/g,' ').replace(/\s{2,}/g,' ').trim().slice(0,80)||'Jangid Cuts'}
function catItems(c){return vis(c.tracks).map(function(t){return {t:t,c:c}})}
function cardCat(c){var it=catItems(c);cardMany(c.name+(PL?' \u00b7 '+PLN[PL]:''),it,safeName(L.product.title)+' - '+safeName(c.name)+(PL?' - '+PLN[PL]:''),false)}
function cardAll(){var it=[];visCats().forEach(function(x){x.t.forEach(function(t){it.push({t:t,c:x.c})})});cardMany(PL?'Download all for '+PLN[PL]:'Download All',it,safeName(L.product.title)+(PL?' - '+PLN[PL]:''),true)}
/* ZIP plan: desktop Chrome/Edge -> one ZIP streamed to disk; everyone else -> parts that fit in memory */
function canStream(){try{if(localStorage.getItem('jc-zip-stream')==='0')return false}catch(e){}return !MOBILE&&typeof window.showSaveFilePicker==='function'&&window.isSecureContext}
function partMax(){var o=0;try{o=+localStorage.getItem('jc-zip-part')||0}catch(e){}if(o>0)return o*1e6;return IOS?300e6:MOBILE?500e6:1e9}
function planParts(items,max){var parts=[],cur=[],b=0;items.forEach(function(x){var s=+x.t.s||0;if(cur.length&&b+s>max){parts.push(cur);cur=[];b=0}cur.push(x);b+=s});if(cur.length)parts.push(cur);return parts}
function cardMany(title,items,base,isAll){
 if(job){toast('A download is already running. Stop it first.');return}
 if(!items.length){toast('Nothing to download here.');return}
 var bytes=items.reduce(function(x,i){return x+(+i.t.s||0)},0),st=canStream(),parts=st?[items]:planParts(items,partMax()),np=parts.length;
 var how=st?'<li>Your browser asks where to save, then everything goes into <b>one ZIP</b> file.</li>':
  np>1?'<li>Saved as <b>'+np+' ZIP files</b> (up to '+size(partMax())+' each) so your '+(MOBILE?'phone':'browser')+' never runs out of memory. Unzip them all into one folder.</li>':'<li>Saved as <b>one ZIP</b> file.</li>';
 sheet('<span class="lb-ico">'+SV.dl+'</span><h3>'+esc(title)+'</h3><p class="lb-big"><b>'+size(bytes)+'</b>'+(PL?' \u00b7 for '+PLN[PL]:'')+'</p>'+
  '<p class="lb-warn">Make sure your device has at least <b>'+size(bytes*(st?1:1.1))+'</b> of free space.</p>'+
  '<ul class="lb-how">'+how+'<li>Keep this page open until it finishes. You can stop any time.</li>'+(IOS&&np>1?'<li>iPhone: tap <b>Save</b> when each part is ready. ZIPs go to the Files app \u2192 Downloads (tap a ZIP to unzip).</li>':IOS?'<li>iPhone: the ZIP goes to the Files app \u2192 Downloads. Tap it to unzip.</li>':'')+'</ul>'+
  '<button class="btn btn-primary lb-go" id="lbGo">'+SV.dl+' Download ZIP \u00b7 '+size(bytes)+'</button>'+
  '<button class="lb-alt" id="lbOne">or download files one by one</button>',
 function(w,close){
  $('#lbGo',w).onclick=function(){
   if(st){ // must ask for the file in the same tap
    window.showSaveFilePicker({suggestedName:base+'.zip',types:[{description:'ZIP file',accept:{'application/zip':['.zip']}}]}).then(function(h){return h.createWritable()}).then(function(wr){close();zipRun(title,parts,base,wr)}).catch(function(e){if(e&&e.name==='AbortError')return;close();zipRun(title,planParts(items,partMax()),base,null)});
   }else{close();zipRun(title,parts,base,null)}
  };
  $('#lbOne',w).onclick=function(){close();cardOneByOne(title,items.map(function(x){return x.t}),bytes)};
 });
}
function cardOneByOne(title,tracks,bytes){
 var done=doneSet(),have=tracks.filter(function(t){return done.has(t.i)}),haveB=bytesOf(have);
 sheet('<span class="lb-ico">'+SV.dl+'</span><h3>'+esc(title)+'</h3><p class="lb-big">One by one \u00b7 <b>'+size(bytes)+'</b></p>'+
  (have.length?'<label class="lb-skip"><input type="checkbox" id="lbSkip" checked> Skip files already downloaded on this device ('+size(haveB)+')</label>':'')+
  '<ul class="lb-how"><li>Files download one after another (no ZIP).</li><li>Keep this page open until it finishes. You can stop any time.</li>'+(IOS?'<li>iPhone: tap <b>Download</b> when Safari asks for each file. Files go to the Files app \u2192 Downloads.</li>':'<li>If your browser asks <b>\u201cAllow multiple downloads?\u201d</b>, tap Allow.</li>')+'</ul>'+
  '<button class="btn btn-primary lb-go" id="lbGo">'+SV.dl+' Start</button>',
 function(w,close){$('#lbGo',w).onclick=function(){var sk=$('#lbSkip',w);var list=sk&&sk.checked?tracks.filter(function(t){return !done.has(t.i)}):tracks.slice();close();if(!list.length){toast('Everything here is already downloaded.');return}run(title,list)}});
}

/* ---------- progress bar (bytes, never file counts) ---------- */
function prog(){var p=$('#lbJob');if(!p){p=D.createElement('div');p.className='lb-job';p.id='lbJob';D.body.appendChild(p)}return p}
function jobPct(){var t=job.total||1;return Math.min(100,Math.floor((job.doneB+job.flyB)/t*100))}
function drawJob(){if(!job)return;var p=prog();
 p.className='lb-job'+(job.end?' end':'');
 if(job.end){p.innerHTML='<div class="lb-jr"><span class="lb-jt">'+(job.stopped?'Stopped \u00b7 '+size(job.doneB)+' saved':SV.check+' Done \u00b7 '+(job.zip?(job.np>1?job.np+' ZIP files saved':'ZIP saved'):size(job.doneB)+' downloaded'))+(job.fail?' \u00b7 '+job.fail+' could not be added':'')+'</span><button class="lb-js" id="lbJx">OK</button></div>'+(job.zip&&!job.stopped?'<small class="lb-jf">'+(IOS?'Files app \u2192 Downloads. Tap a ZIP to unzip.':'Check your Downloads folder and unzip.')+'</small>':'')}
 else if(job.ready){p.innerHTML='<div class="lb-jr"><span class="lb-jt"><b>Part '+job.part+' of '+job.np+' ready</b> \u00b7 '+size(job.ready.size)+'</span><button class="lb-js lb-jsv" id="lbJsv">Save</button></div><small class="lb-jf">Tap Save, then the next part starts. <a href="#" id="lbJs">Stop</a></small>'}
 else{var pct=jobPct();p.innerHTML='<div class="lb-jr"><span class="lb-jt"><b>'+esc(job.title)+'</b> \u00b7 '+pct+'%'+(job.np>1?' \u00b7 part '+job.part+' of '+job.np:'')+'</span><button class="lb-js" id="lbJs">Stop</button></div><div class="lb-jb"><i style="width:'+pct+'%"></i></div><small class="lb-jf">'+size(job.doneB+job.flyB)+' of '+size(job.total)+(job.cur?' \u00b7 '+esc(job.cur):'')+(job.fail?' \u00b7 '+job.fail+' skipped':'')+'</small>'}
 var s=$('#lbJs',p);s&&(s.onclick=function(e){e.preventDefault();stopJob()});
 var sv=$('#lbJsv',p);sv&&(sv.onclick=function(){var r=job.ready;job.ready=null;save(r.blob,r.name);r.go();drawJob()});
 var x=$('#lbJx',p);x&&(x.onclick=function(){p.remove();job=null;D.body.classList.remove('lb-has-job')});
 D.body.classList.add('lb-has-job');
}
function stopJob(){if(!job)return;job.stopped=true;try{job.ctl&&job.ctl.abort()}catch(e){}if(job.ready){var r=job.ready;job.ready=null;r.go()}}
var drawT=0;function drawSoon(){var n=Date.now();if(n-drawT>250){drawT=n;drawJob()}}
function save(blob,name){var u=URL.createObjectURL(blob),a=D.createElement('a');a.href=u;a.download=name;D.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},IOS?45e3:90e3)}
function wakeOn(){try{navigator.wakeLock&&navigator.wakeLock.request('screen').then(function(w){wake=w}).catch(function(){})}catch(e){}}
function wakeOff(){try{wake&&wake.release()}catch(e){}wake=null}

/* ---------- ZIP writer (stored, CRC-32, ZIP64 when past 4 GB) ---------- */
var CRCT=(function(){var t=new Int32Array(256);for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c}return t})();
function crc32(c,u){c=~c;for(var i=0,l=u.length;i<l;i++)c=CRCT[(c^u[i])&255]^(c>>>8);return ~c}
function u16(v,o,x){v.setUint16(o,x,true)}function u32(v,o,x){v.setUint32(o,x>>>0,true)}function u64(v,o,x){v.setUint32(o,x%4294967296,true);v.setUint32(o+4,Math.floor(x/4294967296),true)}
var TE=new TextEncoder();
function dosTime(d){return {t:(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),d:((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()}}
function Zip(){this.off=0;this.cd=[];this.names={};this.dt=dosTime(new Date())}
Zip.prototype.uniq=function(n){var k=n.toLowerCase();if(!this.names[k]){this.names[k]=1;return n}var m=/^(.*?)(\.[^.\/]*)?$/.exec(n),i=2;while(this.names[(m[1]+' ('+i+')'+(m[2]||'')).toLowerCase()])i++;n=m[1]+' ('+i+')'+(m[2]||'');this.names[n.toLowerCase()]=1;return n};
Zip.prototype.head=function(name,sz,crc){var nb=TE.encode(this.uniq(name)),h=new Uint8Array(30+nb.length),v=new DataView(h.buffer);
 u32(v,0,0x04034b50);u16(v,4,20);u16(v,6,0x0800);u16(v,8,0);u16(v,10,this.dt.t);u16(v,12,this.dt.d);u32(v,14,crc);u32(v,18,sz);u32(v,22,sz);u16(v,26,nb.length);u16(v,28,0);h.set(nb,30);
 this.cd.push({nb:nb,sz:sz,crc:crc,off:this.off});this.off+=h.length+sz;return h};
Zip.prototype.end=function(){var parts=[],cdStart=this.off,cdLen=0,big=cdStart>=0xFFFFFFFF||this.cd.length>=0xFFFF,self=this;
 this.cd.forEach(function(e){var z=e.off>=0xFFFFFFFF,ex=z?12:0,h=new Uint8Array(46+e.nb.length+ex),v=new DataView(h.buffer);
  u32(v,0,0x02014b50);u16(v,4,z?45:20);u16(v,6,z?45:20);u16(v,8,0x0800);u16(v,10,0);u16(v,12,self.dt.t);u16(v,14,self.dt.d);u32(v,16,e.crc);u32(v,20,e.sz);u32(v,24,e.sz);u16(v,28,e.nb.length);u16(v,30,ex);u16(v,32,0);u16(v,34,0);u16(v,36,0);u32(v,38,0);u32(v,42,z?0xFFFFFFFF:e.off);h.set(e.nb,46);
  if(z){u16(v,46+e.nb.length,1);u16(v,48+e.nb.length,8);u64(v,50+e.nb.length,e.off)}
  parts.push(h);cdLen+=h.length});
 var n=this.cd.length,tail;
 if(big){tail=new Uint8Array(56+20+22);var v=new DataView(tail.buffer),z64=cdStart+cdLen;
  u32(v,0,0x06064b50);u64(v,4,44);u16(v,12,45);u16(v,14,45);u32(v,16,0);u32(v,20,0);u64(v,24,n);u64(v,32,n);u64(v,40,cdLen);u64(v,48,cdStart);
  u32(v,56,0x07064b50);u32(v,60,0);u64(v,64,z64);u32(v,72,1);
  var o=76;u32(v,o,0x06054b50);u16(v,o+4,0);u16(v,o+6,0);u16(v,o+8,Math.min(n,0xFFFF));u16(v,o+10,Math.min(n,0xFFFF));u32(v,o+12,cdLen>=0xFFFFFFFF?0xFFFFFFFF:cdLen);u32(v,o+16,0xFFFFFFFF);u16(v,o+20,0)}
 else{tail=new Uint8Array(22);var w=new DataView(tail.buffer);u32(w,0,0x06054b50);u16(w,4,0);u16(w,6,0);u16(w,8,n);u16(w,10,n);u32(w,12,cdLen);u32(w,16,cdStart);u16(w,20,0)}
 parts.push(tail);return parts};

/* one file into memory, CRC computed on the fly; 2 retries */
function fetchItem(x){var t=x.t,tries=0;
 return (function go(){var got=0;
  return fresh().then(function(){return fetch(url(t,true),{credentials:'same-origin',signal:job.ctl.signal})}).then(function(r){
   if(!r.ok)throw new Error('HTTP '+r.status);
   var rd=r.body.getReader(),chunks=[],crc=0;
   return (function pump(){return rd.read().then(function(s){if(s.done)return {blob:new Blob(chunks),crc:crc>>>0,size:got};chunks.push(s.value);crc=crc32(crc,s.value);got+=s.value.length;job.flyB+=s.value.length;drawSoon();return pump()})})();
  }).catch(function(e){job.flyB-=got;if(job.stopped)throw e;if(++tries<=2)return new Promise(function(r){setTimeout(r,1500*tries)}).then(go);return null});
 })();
}
function zipRun(title,parts,base,writer){
 job={title:title,zip:1,np:parts.length,part:0,total:parts.reduce(function(a,p){return a+p.reduce(function(x,i){return x+(+i.t.s||0)},0)},0),doneB:0,flyB:0,fail:0,cur:'',ctl:new AbortController()};
 drawJob();wakeOn();
 var pi=0;
 function finish(){job.end=true;job.cur='';wakeOff();drawJob();if(!job.stopped)toast(job.np>1?'All '+job.np+' ZIP files saved.':'ZIP saved.')}
 function nextPart(){
  if(job.stopped||pi>=parts.length){if(writer){(job.stopped?writer.abort():writer.close()).catch(function(){}).then(finish)}else finish();return}
  var items=parts[pi++];job.part=pi;drawJob();
  var zip=writer&&job.z?job.z:new Zip();if(writer)job.z=zip;
  var res=[],wait=[],usedR=[],used=[],k=0,out=[],LOOK=writer?6:1e9;
  items.forEach(function(_,i){wait[i]=new Promise(function(r){res[i]=r});used[i]=new Promise(function(r){usedR[i]=r})});
  function worker(){if(job.stopped||k>=items.length)return Promise.resolve();var i=k++,x=items[i];
   return (i>=LOOK?used[i-LOOK]:Promise.resolve()).then(function(){if(job.stopped)return null;job.cur=x.t.n||x.t.f;return fetchItem(x)}).then(function(f){res[i](f)},function(){res[i](null)}).then(worker)}
  var pool=[worker(),worker(),worker()];
  // consume in order; each file's memory is let go as soon as it is written (stream) or referenced by the part Blob
  var chain=Promise.resolve();
  items.forEach(function(x,i){chain=chain.then(function(){var w=wait[i];wait[i]=null;return w}).then(function(f){
   if(job.stopped||!f){if(!f&&!job.stopped)job.fail++;return}
   var h=zip.head((x.c&&x.c.name?safeName(x.c.name)+'/':'')+x.t.f,f.size,f.crc);
   job.flyB-=f.size;job.doneB+=f.size;
   if(writer)return writer.write(h).then(function(){return writer.write(f.blob)});
   out.push(h,f.blob);
  }).then(function(){usedR[i]();used[i]=null},function(e){job.stopped=true;try{job.ctl.abort()}catch(_){}usedR.forEach(function(r){r()});throw e})});
  Promise.all(pool).then(function(){return chain}).then(function(){
   if(job.stopped){nextPart();return}
   if(writer){if(pi>=parts.length){var e=zip.end();var q=Promise.resolve();e.forEach(function(b){q=q.then(function(){return writer.write(b)})});return q.then(nextPart)}return nextPart()}
   out=out.concat(zip.end());
   var blob=new Blob(out,{type:'application/zip'});out=null;
   var name=base+(job.np>1?' - Part '+pi+' of '+job.np:'')+'.zip';
   if(IOS&&job.np>1){job.ready={blob:blob,name:name,size:blob.size,go:function(){setTimeout(nextPart,400)}};drawJob();if(navigator.vibrate)try{navigator.vibrate(60)}catch(e){}}
   else{save(blob,name);setTimeout(nextPart,600)}
  }).catch(function(e){if(!job.stopped){toast('The download stopped: '+(e&&e.message||'error')+'. Please try again.');job.stopped=true}nextPart()});
 }
 nextPart();
}

/* ---------- one-by-one downloads (kept as an option) ---------- */
function getOne(t){
 if(t.s>300e6){var a=D.createElement('a');a.href=url(t,true);a.download=t.f;D.body.appendChild(a);a.click();a.remove();job.doneB+=t.s;return new Promise(function(r){setTimeout(r,4000)})}
 var got=0;
 return fetch(url(t,true),{credentials:'same-origin',signal:job.ctl.signal}).then(function(r){
  if(!r.ok)throw new Error('HTTP '+r.status);
  if(!r.body||!r.body.getReader)return r.blob();
  var rd=r.body.getReader(),parts=[];
  return (function pump(){return rd.read().then(function(x){if(x.done)return new Blob(parts,{type:r.headers.get('content-type')||'application/octet-stream'});parts.push(x.value);got+=x.value.length;job.flyB=got;drawSoon();return pump()})})();
 }).then(function(b){job.flyB=0;if(job.stopped)throw new Error('stopped');job.doneB+=b.size;save(b,t.f)},function(e){job.flyB=0;throw e});
}
function run(title,list){
 job={title:title,list:list,total:bytesOf(list),doneB:0,flyB:0,fail:0,cur:'',np:1,part:1,ctl:new AbortController()};drawJob();wakeOn();
 var i=0,retry=0;
 (function next(){
  if(job.stopped||i>=list.length){job.end=true;job.cur='';wakeOff();drawJob();redraw();if(!job.stopped)toast('Downloads finished.');return}
  var t=list[i];job.cur=t.n||t.f;drawJob();
  fresh().then(function(){return getOne(t)}).then(function(){markDone(t.i);i++;retry=0;drawJob();setTimeout(next,IOS?900:350)})
  .catch(function(e){if(job.stopped){next();return}if(retry<2){retry++;setTimeout(next,2500*retry);return}job.fail++;i++;retry=0;setTimeout(next,600)});
 })();
}
window.addEventListener('beforeunload',function(e){if(job&&!job.end){e.preventDefault();e.returnValue='Downloads are still running.';return e.returnValue}});

window.JCLib={view:view};
})();
