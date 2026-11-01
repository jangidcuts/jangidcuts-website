/* Jangid Cuts — in-site bundle player (Nov 1 2026). My Downloads -> Open -> categories -> tracks.
   Play streams through /api/lf/<token>/... (Range, seekable). Every download opens a size card first.
   Category / Download All run one file after another (no zip), with progress + Stop. */
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
 check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'};
function size(b){b=+b||0;if(b>=1e9)return (b/1e9).toFixed(1)+' GB';if(b>=1e6)return Math.round(b/1e6)+' MB';if(b>=1e3)return Math.round(b/1e3)+' KB';return b+' B'}
function tm(s){if(!isFinite(s)||s<0)s=0;s=Math.floor(s);var m=Math.floor(s/60),x=s%60;return m+':'+(x<10?'0':'')+x}
function toast(m){window.JC_UI?JC_UI.toast(m):alert(m)}
function api(p){return fetch(p,{credentials:'same-origin',headers:{'x-jc':'1'}}).then(function(r){return r.json().catch(function(){return{ok:false,error:'Something went wrong'}})}).catch(function(){return{ok:false,error:'You seem to be offline. Please try again.'}})}
var IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

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
 app.innerHTML='<div class="lb wrap" id="lb"><div class="lb-load"><span class="lb-spin"></span>Loading your music\u2026</div></div>';
 root=$('#lb',app);D.body.classList.add('lb-on');
 if(!ctx.user){root.innerHTML='<a class="lb-back" href="/orders">'+SV.back+'<span>My Downloads</span></a><div class="lb-empty">'+I('lock')+'<p>Sign in to open your pack.</p><button class="btn btn-primary" id="lbSi">Sign in</button></div>';$('#lbSi').onclick=function(){var m=$('#loginModal');m&&JC_UI.open(m)};return}
 if(!PID){location.replace('/orders');return}
 api('/api/lib/'+PID).then(function(r){
  if(!r||r.ok===false){root.innerHTML='<a class="lb-back" href="/orders">'+SV.back+'<span>My Downloads</span></a><div class="lb-empty">'+I('lock')+'<p>'+esc((r&&r.error)||'Could not open this pack.')+'</p><a class="btn btn-ghost" href="/store">Go to Store</a></div>';return}
  L=r;loadedAt=Date.now();D.title=r.product.title+' | Jangid Cuts';
  window.addEventListener('popstate',route);route();
 });
}
function route(){var h=/[#&]c=([\w-]+)/.exec(location.hash);var c=h&&catById(h[1]);if(c)showCat(c);else showHome()}
function goCat(c){history.pushState({lb:1},'','#c='+c.id);showCat(c);window.scrollTo(0,0)}

function showHome(){curCat=null;
 var p=L.product;
 root.innerHTML='<section class="lb-hero"><div class="lb-cover">'+(p.image?'<img src="'+esc(p.image)+'" alt="">':SV.note)+'</div><div class="lb-hi"><span class="eyebrow">Your pack</span><h1>'+esc(p.title)+'</h1><p>'+L.cats.length+' categories \u00b7 '+L.n+' tracks \u00b7 '+size(L.bytes)+'</p></div></section>'+
 '<button class="btn btn-primary lb-all" id="lbAll">'+SV.dl+' Download All</button>'+
 '<p class="lb-tip">Tap a category to play any track. Every '+'<b class="lb-dlm">'+SV.dl+'</b> shows the size before it downloads.</p>'+
 '<div class="lb-cats">'+L.cats.map(function(c,i){return '<div class="lb-cat" data-c="'+esc(c.id)+'" role="button" tabindex="0"><span class="lb-ci">'+(i<9?'0':'')+(i+1)+'</span><span class="lb-ct"><b>'+esc(c.name)+'</b><small>'+c.n+' tracks \u00b7 '+size(c.bytes)+'</small></span><button class="lb-dl" data-cd="'+esc(c.id)+'" aria-label="Download '+esc(c.name)+'">'+SV.dl+'</button><span class="lb-chev">'+SV.chev+'</span></div>'}).join('')+'</div>';
 $('#lbAll').onclick=function(){cardAll()};
 $$('.lb-cat',root).forEach(function(el){el.onclick=function(e){if(e.target.closest('.lb-dl'))return;goCat(catById(el.dataset.c))};el.onkeydown=function(e){if(e.key==='Enter')el.click()}});
 $$('[data-cd]',root).forEach(function(b){b.onclick=function(e){e.stopPropagation();cardCat(catById(b.dataset.cd))}});
 bars();
}
function showCat(c){curCat=c;
 var done=doneSet();
 root.innerHTML='<section class="lb-chead"><div><button class="lb-crumb" id="lbUp">All categories</button><h1>'+esc(c.name)+'</h1><p>'+c.n+' tracks \u00b7 '+size(c.bytes)+'</p></div><button class="btn btn-ghost btn-s lb-cdl" id="lbCdl">'+SV.dl+' Download</button></section>'+
 '<div class="lb-tracks">'+c.tracks.map(function(t,i){return '<div class="lb-tr'+(cur&&cur.i===t.i?' on':'')+'" data-t="'+esc(t.i)+'"><button class="lb-pl" aria-label="Play '+esc(t.n)+'">'+(cur&&cur.i===t.i&&au&&!au.paused?SV.pause:SV.play)+'</button><span class="lb-tt"><b>'+esc(t.n)+'</b><small>'+(t.b?t.b+' BPM \u00b7 ':'')+size(t.s)+(done.has(t.i)?' \u00b7 <em>'+SV.check+'saved</em>':'')+'</small></span><span class="lb-eq" aria-hidden="true"><i></i><i></i><i></i></span><button class="lb-dl" data-td="'+esc(t.i)+'" aria-label="Download '+esc(t.n)+'">'+SV.dl+'</button></div>'}).join('')+'</div>';
 $('#lbUp').onclick=function(){if(history.state&&history.state.lb)history.back();else{history.replaceState(null,'',location.pathname+location.search);showHome()}};
 $('#lbCdl').onclick=function(){cardCat(c)};
 $$('.lb-tr',root).forEach(function(el){el.onclick=function(e){if(e.target.closest('.lb-dl'))return;var x=trackById(el.dataset.t);if(cur&&cur.i===x.t.i){toggle()}else play(x.t,x.c)}});
 $$('[data-td]',root).forEach(function(b){b.onclick=function(e){e.stopPropagation();var x=trackById(b.dataset.td);cardTrack(x.t,x.c)}});
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
function step(d){if(!cur)return;var c=catById(cur.c);if(!c)return;var i=c.tracks.findIndex(function(x){return x.i===cur.i});var n=c.tracks[i+d];if(n)play(n,c);else if(d>0){au.pause();bars()}}
function bars(){
 var playing=au&&cur&&!au.paused;
 $$('.lb-tr').forEach(function(el){var on=cur&&el.dataset.t===cur.i;el.classList.toggle('on',!!on);el.classList.toggle('playing',!!(on&&playing));var b=$('.lb-pl',el);if(b)b.innerHTML=on&&playing?SV.pause:SV.play});
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
function cardTrack(t,c){
 var ext=((/\.([a-z0-9]{2,5})$/i.exec(t.f)||[])[1]||'').toUpperCase();
 sheet('<span class="lb-ico">'+SV.note+'</span><h3>'+esc(t.n)+'</h3><p class="lb-sub">'+esc(c.name)+'</p>'+
  '<div class="lb-facts"><div><small>Size</small><b>'+size(t.s)+'</b></div><div><small>Duration</small><b id="lbDur">\u2026</b></div>'+(t.b?'<div><small>BPM</small><b>'+t.b+'</b></div>':'')+(ext?'<div><small>Format</small><b>'+esc(ext)+'</b></div>':'')+'</div>'+
  '<p class="lb-fn">'+esc(t.f)+'</p><button class="btn btn-primary lb-go" id="lbGo">'+SV.dl+' Download \u00b7 '+size(t.s)+'</button>',
 function(w,close){
  var a=new Audio();a.preload='metadata';a.onloadedmetadata=function(){var d=$('#lbDur',w);if(d)d.textContent=tm(a.duration);a.onerror=null;a.removeAttribute('src');try{a.load()}catch(e){}};a.onerror=function(){var d=$('#lbDur',w);if(d)d.textContent='\u2014'};
  if(cur&&cur.i===t.i&&au&&au.duration){$('#lbDur',w).textContent=tm(au.duration)}else fresh().then(function(){a.src=url(t)});
  $('#lbGo',w).onclick=function(){fresh().then(function(){var x=D.createElement('a');x.href=url(t,true);x.download=t.f;x.rel='noopener';D.body.appendChild(x);x.click();x.remove();markDone(t.i);toast('Download started \u2014 check your Downloads folder.');close();if(curCat)setTimeout(function(){showCat(curCat)},300)})};
 });
}
function cardCat(c){cardMany(c.name,c.tracks,c.n+' tracks \u00b7 <b>'+size(c.bytes)+'</b>',c.bytes,false)}
function cardAll(){var all=[];L.cats.forEach(function(c){all=all.concat(c.tracks)});cardMany('Download All',all,L.n+' tracks \u00b7 <b>'+size(L.bytes)+'</b>',L.bytes,true)}
function cardMany(title,tracks,line,bytes,isAll){
 if(job){toast('A download is already running. Stop it first.');return}
 var done=doneSet(),have=tracks.filter(function(t){return done.has(t.i)}),haveB=have.reduce(function(x,t){return x+t.s},0);
 sheet('<span class="lb-ico">'+SV.dl+'</span><h3>'+esc(title)+'</h3><p class="lb-big">'+line+'</p>'+
  '<p class="lb-warn">Make sure your phone has at least <b>'+size(bytes)+'</b> of free space.</p>'+
  (have.length?'<label class="lb-skip"><input type="checkbox" id="lbSkip" checked> Skip '+have.length+' track'+(have.length>1?'s':'')+' already downloaded on this phone ('+size(haveB)+')</label>':'')+
  '<ul class="lb-how"><li>Files download one after another (no zip).</li><li>Keep this page open until it finishes. You can stop any time.</li>'+(IOS?'<li>iPhone: tap <b>Download</b> when Safari asks for each file. Files go to the Files app \u2192 Downloads.</li>':'<li>If your phone asks <b>\u201cAllow multiple downloads?\u201d</b>, tap Allow.</li>')+'</ul>'+
  '<button class="btn btn-primary lb-go" id="lbGo">'+SV.dl+' Download '+(isAll?'all ':'')+tracks.length+' tracks</button>',
 function(w,close){var sk0=$('#lbSkip',w),lab=function(){var n=sk0&&sk0.checked?tracks.length-have.length:tracks.length;$('#lbGo',w).innerHTML=SV.dl+' Download '+(isAll&&!(sk0&&sk0.checked)?'all ':'')+n+' track'+(n===1?'':'s')};if(sk0){sk0.onchange=lab;lab()}
  $('#lbGo',w).onclick=function(){var sk=$('#lbSkip',w);var list=sk&&sk.checked?tracks.filter(function(t){return !done.has(t.i)}):tracks.slice();close();if(!list.length){toast('Everything here is already downloaded.');return}run(title,list)}});
}

/* ---------- sequential downloads ---------- */
function prog(){var p=$('#lbJob');if(!p){p=D.createElement('div');p.className='lb-job';p.id='lbJob';D.body.appendChild(p)}return p}
function drawJob(){if(!job)return;var p=prog(),n=job.list.length,k=job.k;
 var pct=job.cur&&job.cur.s?Math.min(100,Math.round(job.got/job.cur.s*100)):0;
 p.className='lb-job'+(job.end?' end':'');
 p.innerHTML=job.end?'<div class="lb-jr"><span class="lb-jt">'+(job.stopped?'Stopped \u00b7 <b>'+k+' / '+n+'</b> downloaded':SV.check+' <b>'+k+' / '+n+'</b> downloaded')+'</span><button class="lb-js" id="lbJx">OK</button></div>':
 '<div class="lb-jr"><span class="lb-jt"><b>'+esc(job.title)+'</b> \u00b7 '+k+' / '+n+' downloaded</span><button class="lb-js" id="lbJs">Stop</button></div><div class="lb-jb"><i style="width:'+((k+pct/100)/n*100).toFixed(1)+'%"></i></div><small class="lb-jf">'+(job.cur?esc(job.cur.n)+' \u00b7 '+pct+'% of '+size(job.cur.s):'')+(job.fail?' \u00b7 '+job.fail+' failed':'')+'</small>';
 var s=$('#lbJs',p);s&&(s.onclick=function(){job.stopped=true;job.ctl&&job.ctl.abort()});
 var x=$('#lbJx',p);x&&(x.onclick=function(){p.remove();job=null});
 D.body.classList.add('lb-has-job');
}
function save(blob,name){var u=URL.createObjectURL(blob),a=D.createElement('a');a.href=u;a.download=name;D.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},60e3)}
function getOne(t){
 // big files (> 300 MB) go straight to the phone's download manager; the rest via fetch for real progress
 if(t.s>300e6){var a=D.createElement('a');a.href=url(t,true);a.download=t.f;D.body.appendChild(a);a.click();a.remove();return new Promise(function(r){setTimeout(r,4000)})}
 job.ctl=new AbortController();job.got=0;
 return fetch(url(t,true),{credentials:'same-origin',signal:job.ctl.signal}).then(function(r){
  if(!r.ok)throw new Error('HTTP '+r.status);
  if(!r.body||!r.body.getReader)return r.blob();
  var rd=r.body.getReader(),parts=[],last=0;
  return (function pump(){return rd.read().then(function(x){if(x.done)return new Blob(parts,{type:r.headers.get('content-type')||'application/octet-stream'});parts.push(x.value);job.got+=x.value.length;var n=Date.now();if(n-last>250){last=n;drawJob()}return pump()})})();
 }).then(function(b){if(job.stopped)throw new Error('stopped');save(b,t.f)});
}
function run(title,list){
 job={title:title,list:list,k:0,got:0,cur:null,fail:0};drawJob();
 try{navigator.wakeLock&&navigator.wakeLock.request('screen').then(function(w){wake=w}).catch(function(){})}catch(e){}
 var i=0,retry=0;
 (function next(){
  if(job.stopped||i>=list.length){job.end=true;job.cur=null;try{wake&&wake.release()}catch(e){}wake=null;drawJob();if(curCat)showCat(curCat);if(!job.stopped)toast(job.k+' files downloaded.');return}
  var t=list[i];job.cur=t;drawJob();
  fresh().then(function(){return getOne(t)}).then(function(){job.k++;markDone(t.i);i++;retry=0;drawJob();setTimeout(next,IOS?900:350)})
  .catch(function(e){if(job.stopped){next();return}if(retry<2){retry++;setTimeout(next,2500*retry);return}job.fail++;i++;retry=0;setTimeout(next,600)});
 })();
}
window.addEventListener('beforeunload',function(e){if(job&&!job.end){e.preventDefault();e.returnValue='Downloads are still running.';return e.returnValue}});

window.JCLib={view:view};
})();
