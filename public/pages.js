(function(){'use strict';
var D=document,$=function(s,r){return (r||D).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function I(n){return '<svg class="icon" aria-hidden="true"><use href="#i-'+n+'"/></svg>'}
/* photo framing saved in admin (drag + zoom): {x,y,z} -> same CSS the admin preview uses */
function cropSt(c){if(!c)return '';if(typeof c==='string'){try{c=JSON.parse(c)}catch(e){return ''}}var cl=function(v,a,b,d){v=Number(v);return isFinite(v)?Math.min(b,Math.max(a,v)):d};var x=cl(c.x,0,100,50),y=cl(c.y,0,100,50),z=cl(c.z,1,4,1);if(x===50&&y===50&&z===1)return '';return ' style="object-position:'+x+'% '+y+'%;transform:scale('+z+');transform-origin:'+x+'% '+y+'%"'}
function slug(s){return String(s||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function md(t){var out=[],list=false;String(t||'').split(/\n/).forEach(function(l){var s=l.trim();if(/^[-•]\s+/.test(s)){if(!list){out.push('<ul>');list=true}out.push('<li>'+esc(s.replace(/^[-•]\s+/,''))+'</li>')}else{if(list){out.push('</ul>');list=false}if(s)out.push('<p>'+esc(s)+'</p>')}});if(list)out.push('</ul>');return out.join('')}
var S,C,CATS,PF,app;
function back(href,label){return '<a class="back" href="'+esc(href)+'">'+I('left')+' '+esc(label)+'</a>'}
function cat(id){return CATS.find(function(c){return c.id===id})}
function rootOf(p){var c=cat(p.category_id);while(c&&c.parent_id)c=cat(c.parent_id);return c}
function roots(kind){return CATS.filter(function(c){return c.section==='portfolio_'+kind&&!c.parent_id})}
function under(p,cid){var c=cat(p.subcategory_id)||cat(p.category_id);while(c){if(c.id===cid)return true;c=cat(c.parent_id)}return false}
function itemsOf(kind,cid){return PF.filter(function(p){return p.kind===kind&&(!cid||under(p,cid)||p.category_id===cid)})}
function catBySlug(s,kind){return CATS.find(function(c){return c.section==='portfolio_'+kind&&!c.parent_id&&slug(c.name)===s})||CATS.find(function(c){return c.section.indexOf('portfolio_')===0&&!c.parent_id&&slug(c.name)===s})}
function kindQ(){return new URLSearchParams(location.search).get('k')==='thumb'?'thumb':'video'}
function hasVideo(p){return !!(p.video||p.url||p.has_src)}
function card(p,from){var c=rootOf(p),v=p.kind==='video'&&p.orient==='v';
 return '<a class="mc'+(v?' v':'')+'" '+(p.kind==='video'?'href="/watch/'+p.id+(from?'?from='+encodeURIComponent(from):'')+'"':'href="#" data-img="'+p.id+'"')+'><img src="'+esc(p.image||'/img/t1.jpg')+'" alt="" loading="lazy">'+(p.kind==='video'?'<span class="pl">'+I('play')+'</span>':'')+'<span class="mt"><b>'+esc(p.title)+'</b><span>'+esc(c?c.name:'')+'</span></span></a>'}
function bindImgs(root){$$('[data-img]',root).forEach(function(a){a.onclick=function(e){e.preventDefault();var p=PF.find(function(x){return x.id===+a.dataset.img});if(!p)return;var lb=$('#lightbox');$('#lbMedia').innerHTML='<img src="'+esc(p.image)+'" alt="'+esc(p.title)+'">';$('#lbTitle').textContent=p.title;var c=rootOf(p);$('#lbCat')&&($('#lbCat').textContent=c?c.name:'');$('#lbDesc').textContent=p.description||'';JC_UI.open(lb)}})}
function adSlot(name){var a=C.ads||{};return a.enabled&&(a.slots||{})[name]?'<div class="ad-wrap" data-ad="'+name+'" hidden></div>':''}
function title(t){D.title=t+' | Jangid Cuts'}

/* ----- /portfolio ----- */
function vPortfolio(){var k=kindQ();var P=C.portfolio_page||{};title('Portfolio');
 var rs=roots(k).filter(function(c){return itemsOf(k,c.id).length});
 app.innerHTML='<div class="wrap pg-top">'+back('/','Back to home')+'<div class="pg-h"><span class="eyebrow">Jangid Cuts</span><h1 class="h-xl" style="margin-top:8px"><span class="shine">'+esc(P.title||'Portfolio')+'</span></h1><p class="lead">'+esc(P.lead||P.intro||'Edits and thumbnails, sorted by category.')+'</p><a class="pf-mail" href="mailto:'+esc(P.email||'jangidcuts@gmail.com')+'">'+I('mail')+'<span>'+esc(P.email||'jangidcuts@gmail.com')+'</span></a></div>'+
 '<div class="tabs" role="tablist"><a class="tab" role="tab" href="/portfolio" aria-selected="'+(k==='video')+'">'+I('play')+' Video Portfolio</a><a class="tab" role="tab" href="/portfolio?k=thumb" aria-selected="'+(k==='thumb')+'">Thumbnail Portfolio</a></div>'+
 '<div class="cat-tiles">'+rs.map(function(c){var it=itemsOf(k,c.id);return '<a class="ctile" href="/portfolio/'+slug(c.name)+(k==='thumb'?'?k=thumb':'')+'"><img src="'+esc(c.thumb||it[0].image)+'" alt="" loading="lazy"><b>'+esc(c.name)+'</b><span>'+it.length+'</span></a>'}).join('')+'</div>'+
 rs.map(function(c,i){var it=itemsOf(k,c.id);return (i===2?adSlot('portfolio'):'')+'<section class="sec-row"><div class="sec-row-h"><h2>'+esc(c.name)+'</h2><a href="/portfolio/'+slug(c.name)+(k==='thumb'?'?k=thumb':'')+'">See all '+it.length+' →</a></div><div class="mrow">'+it.slice(0,10).map(function(p){return card(p,'cat')}).join('')+'</div></section>'}).join('')+
 (rs.length?'':'<div class="st-empty">New work is coming soon.</div>')+'<div class="pf-contact"><div><b>Like this work? Let’s make yours.</b><span>Projects, collaborations &amp; business enquiries</span></div><div class="pf-cta"><a class="btn btn-primary" href="mailto:'+esc(P.email||'jangidcuts@gmail.com')+'">'+I('mail')+' '+esc(P.email||'jangidcuts@gmail.com')+'</a><a class="btn btn-ghost" href="/?hire=1">Hire me</a></div></div><div style="height:60px"></div></div>';bindImgs(app)}

/* ----- /portfolio/<cat> ----- */
function vCat(s){var k=kindQ();var c=catBySlug(s,k);if(!c){app.innerHTML='<div class="wrap pg-top">'+back('/portfolio','Back to portfolio')+'<div class="st-empty">This category does not exist.</div></div>';return}
 k=c.section==='portfolio_thumb'?'thumb':'video';title(c.name+' · Portfolio');var subs=CATS.filter(function(x){return x.parent_id===c.id});var sub=+(new URLSearchParams(location.search).get('s')||0);
 function draw(){var it=itemsOf(k,sub||c.id);
  app.innerHTML='<div class="wrap pg-top">'+back('/portfolio'+(k==='thumb'?'?k=thumb':''),'Back to portfolio')+'<div class="pg-h"><span class="eyebrow">'+(k==='thumb'?'Thumbnails':'Video edits')+'</span><h1 class="h-xl" style="margin-top:8px"><span class="shine">'+esc(c.name)+'</span></h1></div>'+
  (subs.length?'<div class="chips" style="margin-top:16px"><button class="chip" data-s="0" aria-pressed="'+(!sub)+'">All</button>'+subs.map(function(x){return '<button class="chip" data-s="'+x.id+'" aria-pressed="'+(sub===x.id)+'">'+esc(x.name)+'</button>'}).join('')+'</div>':'')+
  (it.length?'<div class="mgrid'+(k==='thumb'?' thumbs':'')+'">'+it.map(function(p){return card(p,'cat')}).join('')+'</div>':'<div class="st-empty">Nothing here yet.</div>')+'</div>';
  $$('[data-s]',app).forEach(function(b){b.onclick=function(){sub=+b.dataset.s;history.replaceState(null,'',location.pathname+(k==='thumb'?'?k=thumb':'?')+(sub?'&s='+sub:''));draw()}});bindImgs(app)}
 draw()}

/* ----- /watch/<id> ----- */
function ytId(u){var m=String(u||'').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/))([\w-]{11})/);return m?m[1]:''}
function isDrive(u){return /drive\.google\.com/.test(u||'')}
function fmt(t){t=Math.max(0,Math.floor(t||0));var m=Math.floor(t/60),s=t%60;return m+':'+(s<10?'0':'')+s}
function SK(d){return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="'+(d<0?'M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z':'M12 5V2l5 4-5 4V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z')+'" fill="currentColor"/><text x="12" y="16.2" text-anchor="middle" font-size="6.6" font-weight="800" font-family="Inter,Arial" fill="currentColor">10</text></svg>'}
function embed(p){return ''}
/* Nov 1: the player itself lives in /player.js (shared with the store's product pages) */
function mountPlayer(p){var host=$('#player');if(!host||!window.JCPlayer)return;var yid=ytId(p.url)||ytId(p.video);
 JCPlayer.mount(host,{yt:yid||'',src:!yid&&(p.url||p.video||p.has_src)?'/v/'+p.id:'',q:p.vq||null,fb:p.fb||'',poster:p.image||'',title:p.title||'',link:!yid&&!(p.url||p.video||p.has_src)?'':''})}
function vWatch(id){var p=null;
 if(id==='reel'){var hr=C.hero||{};if(hr.showreel)p={id:'reel',kind:'video',title:hr.showreel_title||'Showreel',url:hr.showreel,video:'',image:hr.showreel_poster||'/og.jpg',orient:'h',services:[],_x:'reel'}}
 else if(id[0]==='p'){var pr=(S.products||[]).find(function(x){return 'p'+x.id===id});if(pr&&pr.has_video)p={id:id,kind:'video',title:pr.title,url:pr.video_yt||'',video:pr.video_yt?'':'1',image:pr.image||'',orient:'h',services:[],vq:pr.vq||null,_x:'product'}}
 if(p&&p._x){title(p.title);var bk=p._x==='product'?back('/store','Back to store'):back('/','Back to home');
  app.innerHTML='<div class="watch"><div class="wrap w-bar">'+bk+'</div><div class="player" id="player">'+embed(p)+'</div></div><div class="wrap w-info"><h1>'+esc(p.title)+'</h1></div>';mountPlayer(p);return}
 p=PF.find(function(x){return x.id===+id});if(!p){app.innerHTML='<div class="wrap pg-top">'+back('/portfolio','Back to portfolio')+'<div class="st-empty">This video is not available.</div></div>';return}
 title(p.title);var c=rootOf(p),from=new URLSearchParams(location.search).get('from')||'cat',b;
 if(from==='home')b=back('/','Back to home');else if(from.indexOf('svc:')===0){var sv=(C.services||[]).find(function(x){return x.slug===from.slice(4)});b=back('/services/'+from.slice(4),'Back to '+(sv?sv.title:'service'))}else b=c?back('/portfolio/'+slug(c.name),'Back to '+c.name):back('/portfolio','Back to portfolio');
 var vert=p.orient==='v';var more=c?itemsOf('video',c.id).filter(function(x){return x.id!==p.id}).slice(0,8):[];
 var svcs=(p.services||[]).map(function(sl){return (C.services||[]).find(function(x){return x.slug===sl})}).filter(Boolean);
 app.innerHTML='<div class="watch"><div class="wrap w-bar">'+b+'</div><div class="player'+(vert?' v':'')+'" id="player">'+embed(p)+'</div></div>'+
  '<div class="wrap w-info"><h1>'+esc(p.title)+'</h1><div class="w-meta">'+(c?'<a href="/portfolio/'+slug(c.name)+'">'+esc(c.name)+'</a>':'')+svcs.map(function(s){return '<a href="/services/'+esc(s.slug)+'">'+esc(s.title)+'</a>'}).join('')+'</div>'+(p.description?'<p class="w-desc">'+esc(p.description)+'</p>':'')+
  '<div class="w-acts">'+(c?'<a class="btn btn-primary" href="/portfolio/'+slug(c.name)+'">See more from '+esc(c.name)+' '+I('arrow')+'</a>':'')+'<a class="btn btn-ghost" href="/?hire=1">Hire for a project like this</a></div>'+
  (more.length?'<section class="sec-row"><div class="sec-row-h"><h2>More from '+esc(c.name)+'</h2><a href="/portfolio/'+slug(c.name)+'">See all →</a></div><div class="mrow">'+more.map(function(x){return card(x,from==='home'?'home':from)}).join('')+'</div></section>':'')+'<div style="height:60px"></div></div>';
 mountPlayer(p)}

/* service -> portfolio category (first candidate that has items wins; else all work) */
var SVC_CAT={'colour-grading':[['video','Colour Grading'],['thumb','Before / After']],'youtube-videos':[['video','YouTube'],['thumb','YouTube']],'ads-promos':[['video','Ads & Promos'],['thumb','Ads & Brands']],'wedding-films':[['video','Wedding Films'],['video','Events'],['thumb','Events']],'reels-shorts':[['video','Reels & Shorts'],['video','Reels']],'motion-graphics':[['video','Motion Graphics']],'podcast-editing':[['video','Podcast'],['video','Podcast Editing']],'thumbnails-graphics':[['thumb','*']]};
function svcWork(s){var L=SVC_CAT[s]||[];for(var i=0;i<L.length;i++){var k=L[i][0],n=L[i][1];
  if(n==='*'){if(PF.some(function(p){return p.kind===k}))return {href:'/portfolio'+(k==='thumb'?'?k=thumb':'')};continue}
  var c=CATS.find(function(c){return c.section==='portfolio_'+k&&c.name.toLowerCase()===n.toLowerCase()});if(!c||!itemsOf(k,c.id).length)continue;
  var r=c;while(r.parent_id)r=cat(r.parent_id)||{};if(!r.name)continue;
  var q=[];if(k==='thumb')q.push('k=thumb');if(r!==c)q.push('s='+c.id);return {href:'/portfolio/'+slug(r.name)+(q.length?'?'+q.join('&'):'')}}
 return {href:'/portfolio',all:true}}
/* ----- /services ----- */
function svcCard(x){return '<a class="svc" href="/services/'+esc(x.slug)+'"><div class="svc-thumb"><img src="'+esc(x.image)+'" alt="" loading="lazy">'+(x.tag?'<span class="tag">'+esc(x.tag)+'</span>':'')+'</div><div class="svc-body"><h3>'+esc(x.title)+'</h3><p>'+esc(x.desc)+'</p><span class="more">View details '+I('arrow')+'</span></div></a>'}
function vServices(){title('Services');var h=C.home||{};
 app.innerHTML='<div class="wrap pg-top">'+back('/','Back to home')+'<div class="pg-h"><span class="eyebrow">'+esc(h.svc_eyebrow||'Services')+'</span><h1 class="h-xl" style="margin-top:8px"><span class="shine">'+esc(h.svc_title||'What I Do')+'</span></h1><p class="lead">Tap a service to see details and related work.</p></div><div class="svc-cards">'+(C.services||[]).map(svcCard).join('')+'</div>'+adSlot('services')+'</div>'}
function vService(s){var x=(C.services||[]).find(function(v){return v.slug===s});if(!x){app.innerHTML='<div class="wrap pg-top">'+back('/services','All services')+'<div class="st-empty">Service not found.</div></div>';return}
 title(x.title);var vids=PF.filter(function(p){return (p.services||[]).indexOf(s)>=0});var rel=(C.services||[]).filter(function(v){return v.slug!==s}).slice(0,3);
 app.innerHTML='<div class="wrap pg-top">'+back('/services','Back to services')+'<div class="svc-hero"><img src="'+esc(x.image)+'" alt=""><h1>'+esc(x.title)+'</h1></div><div class="svc-full">'+md(x.full||x.desc)+'</div>'+
  '<div class="w-acts">'+(function(){var w=svcWork(s);return '<a class="btn btn-ghost" style="width:100%;border-color:var(--mint);color:var(--mint)" href="'+esc(w.href)+'">'+(w.all?'View all work':'View '+esc(x.title)+' work')+' →</a>'})()+'<a class="btn btn-primary" href="/?hire=1">Hire for '+esc(x.title)+'</a><a class="btn btn-ghost" href="/services">More services</a></div>'+
  (vids.length?'<section class="sec-row"><div class="sec-row-h"><h2>Related work</h2></div><div class="mgrid">'+vids.map(function(p){return card(p,'svc:'+s)}).join('')+'</div></section>':'')+
  '<section class="sec-row"><div class="sec-row-h"><h2>Related services</h2><a href="/services">All services →</a></div><div class="svc-cards" style="margin-top:6px">'+rel.map(svcCard).join('')+'</div></section></div>';bindImgs(app)}

/* ----- /about ----- */
function vAbout(){var a=C.about||{};title('About');
 app.innerHTML='<div class="wrap pg-top">'+back('/','Back to home')+'<section class="ab-sec"><div class="ab-ph"><img src="'+esc(a.editor_photo||'/img/hero.webp')+'" alt=""'+cropSt(a.editor_photo_crop)+'></div><div class="ab-tx"><span class="eyebrow">'+esc(a.editor_eyebrow||'About')+'</span><h2 class="grad-text">'+esc(a.editor_title)+'</h2><div class="svc-full">'+md(a.editor_body)+'</div><div class="ab-acts"><a class="btn btn-primary" id="aboutResume" href="/resume?from=about">'+I('doc')+' View Resume</a><a class="btn btn-primary" id="aboutPortfolio" href="/portfolio">'+I('film')+' Portfolio</a></div></div></section>'+
  '<section class="ab-sec flip"><div class="ab-ph"><img src="'+esc(a.brand_photo||'/img/f2_0.jpg')+'" alt=""'+cropSt(a.brand_photo_crop)+'></div><div class="ab-tx"><span class="eyebrow">'+esc(a.brand_eyebrow||'The brand')+'</span><h2 class="grad-text">'+esc(a.brand_title)+'</h2><div class="svc-full">'+md(a.brand_body)+'</div><div class="w-acts"><a class="btn btn-primary" href="/services">Services</a><a class="btn btn-ghost" href="/store">Store</a></div></div></section></div>'}

window.JC_AFTER=function(site){S=site;C=site.content;CATS=site.categories;PF=site.portfolio;app=$('#app');if(!app)return;
 var p=location.pathname.replace(/\/$/,'')||'/',m;
 if(p==='/portfolio')vPortfolio();else if((m=p.match(/^\/portfolio\/([\w-]+)$/)))vCat(m[1]);else if((m=p.match(/^\/watch\/(\d+|p\d+|reel)$/)))vWatch(m[1]);
 else if(p==='/services')vServices();else if((m=p.match(/^\/services\/([\w-]+)$/)))vService(m[1]);else if(p==='/about')vAbout();else vPortfolio();
 window.scrollTo(0,0)};
})();
