(function(){'use strict';
var D=document,$=function(s,r){return (r||D).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function I(n){return '<svg class="icon" aria-hidden="true"><use href="#i-'+n+'"/></svg>'}
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
function hasVideo(p){return !!(p.video||p.url)}
function card(p,from){var c=rootOf(p),v=p.kind==='video'&&p.orient==='v';
 return '<a class="mc'+(v?' v':'')+'" '+(p.kind==='video'?'href="/watch/'+p.id+(from?'?from='+encodeURIComponent(from):'')+'"':'href="#" data-img="'+p.id+'"')+'><img src="'+esc(p.image||'/img/t1.jpg')+'" alt="" loading="lazy">'+(p.kind==='video'?'<span class="pl">'+I('play')+'</span>':'')+'<span class="mt"><b>'+esc(p.title)+'</b><span>'+esc(c?c.name:'')+'</span></span></a>'}
function bindImgs(root){$$('[data-img]',root).forEach(function(a){a.onclick=function(e){e.preventDefault();var p=PF.find(function(x){return x.id===+a.dataset.img});if(!p)return;var lb=$('#lightbox');$('#lbMedia').innerHTML='<img src="'+esc(p.image)+'" alt="'+esc(p.title)+'">';$('#lbTitle').textContent=p.title;var c=rootOf(p);$('#lbCat')&&($('#lbCat').textContent=c?c.name:'');$('#lbDesc').textContent=p.description||'';JC_UI.open(lb)}})}
function adSlot(name){var a=C.ads||{};return a.enabled&&(a.slots||{})[name]?'<div class="ad-wrap" data-ad="'+name+'" hidden></div>':''}
function title(t){D.title=t+' | Jangid Cuts'}

/* ----- /portfolio ----- */
function vPortfolio(){var k=kindQ();var P=C.portfolio_page||{};title('Portfolio');
 var rs=roots(k).filter(function(c){return itemsOf(k,c.id).length});
 app.innerHTML='<div class="wrap pg-top">'+back('/','Back to home')+'<div class="pg-h"><span class="eyebrow">Jangid Cuts</span><h1 class="h-xl" style="margin-top:8px"><span class="shine">'+esc(P.title||'Portfolio')+'</span></h1><p class="lead">'+esc(P.intro||'Edits and thumbnails, sorted by category.')+'</p></div>'+
 '<div class="tabs" role="tablist"><a class="tab" role="tab" href="/portfolio" aria-selected="'+(k==='video')+'">'+I('play')+' Video Portfolio</a><a class="tab" role="tab" href="/portfolio?k=thumb" aria-selected="'+(k==='thumb')+'">Thumbnail Portfolio</a></div>'+
 '<div class="cat-tiles">'+rs.map(function(c){var it=itemsOf(k,c.id);return '<a class="ctile" href="/portfolio/'+slug(c.name)+(k==='thumb'?'?k=thumb':'')+'"><img src="'+esc(c.thumb||it[0].image)+'" alt="" loading="lazy"><b>'+esc(c.name)+'</b><span>'+it.length+'</span></a>'}).join('')+'</div>'+
 rs.map(function(c,i){var it=itemsOf(k,c.id);return (i===2?adSlot('portfolio'):'')+'<section class="sec-row"><div class="sec-row-h"><h2>'+esc(c.name)+'</h2><a href="/portfolio/'+slug(c.name)+(k==='thumb'?'?k=thumb':'')+'">See all '+it.length+' →</a></div><div class="mrow">'+it.slice(0,10).map(function(p){return card(p,'cat')}).join('')+'</div></section>'}).join('')+
 (rs.length?'':'<div class="st-empty">New work is coming soon.</div>')+'<div style="height:60px"></div></div>';bindImgs(app)}

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
function embed(p){var u=p.url||'',v=p.video||'';var m;
 if((m=u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/))([\w-]{11})/)))return '<iframe src="https://www.youtube-nocookie.com/embed/'+m[1]+'?autoplay=1&rel=0&modestbranding=1&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="'+esc(p.title)+'"></iframe>';
 if((m=u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]{20,})/)))return '<iframe src="https://drive.google.com/file/d/'+m[1]+'/preview" allow="autoplay; fullscreen" allowfullscreen title="'+esc(p.title)+'"></iframe>';
 if(v)return '<video src="'+esc(v)+'" poster="'+esc(p.image||'')+'" controls autoplay playsinline></video>';
 if(u)return '<img src="'+esc(p.image)+'" alt=""><a class="btn btn-primary" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)" href="'+esc(u)+'" target="_blank" rel="noopener">'+I('play')+' Watch video</a>';
 return '<img src="'+esc(p.image)+'" alt="'+esc(p.title)+'">'}
function vWatch(id){var p=PF.find(function(x){return x.id===+id});if(!p){app.innerHTML='<div class="wrap pg-top">'+back('/portfolio','Back to portfolio')+'<div class="st-empty">This video is not available.</div></div>';return}
 title(p.title);var c=rootOf(p),from=new URLSearchParams(location.search).get('from')||'cat',b;
 if(from==='home')b=back('/','Back to home');else if(from.indexOf('svc:')===0){var sv=(C.services||[]).find(function(x){return x.slug===from.slice(4)});b=back('/services/'+from.slice(4),'Back to '+(sv?sv.title:'service'))}else b=c?back('/portfolio/'+slug(c.name),'Back to '+c.name):back('/portfolio','Back to portfolio');
 var vert=p.orient==='v';var more=c?itemsOf('video',c.id).filter(function(x){return x.id!==p.id}).slice(0,8):[];
 var svcs=(p.services||[]).map(function(sl){return (C.services||[]).find(function(x){return x.slug===sl})}).filter(Boolean);
 app.innerHTML='<div class="watch"><div class="wrap w-bar">'+b+'<button class="back" id="fsBtn" type="button">Fullscreen</button></div><div class="player'+(vert?' v':'')+'" id="player">'+embed(p)+'</div></div>'+
  '<div class="wrap w-info"><h1>'+esc(p.title)+'</h1><div class="w-meta">'+(c?'<a href="/portfolio/'+slug(c.name)+'">'+esc(c.name)+'</a>':'')+svcs.map(function(s){return '<a href="/services/'+esc(s.slug)+'">'+esc(s.title)+'</a>'}).join('')+'</div>'+(p.description?'<p class="w-desc">'+esc(p.description)+'</p>':'')+
  '<div class="w-acts">'+(c?'<a class="btn btn-primary" href="/portfolio/'+slug(c.name)+'">See more from '+esc(c.name)+' '+I('arrow')+'</a>':'')+'<a class="btn btn-ghost" href="/?hire=1">Hire for a project like this</a></div>'+
  (more.length?'<section class="sec-row"><div class="sec-row-h"><h2>More from '+esc(c.name)+'</h2><a href="/portfolio/'+slug(c.name)+'">See all →</a></div><div class="mrow">'+more.map(function(x){return card(x,from==='home'?'home':from)}).join('')+'</div></section>':'')+'<div style="height:60px"></div></div>';
 $('#fsBtn').onclick=function(){var el=$('#player');(el.requestFullscreen||el.webkitRequestFullscreen||function(){}).call(el)}}

/* ----- /services ----- */
function svcCard(x){return '<a class="svc" href="/services/'+esc(x.slug)+'"><div class="svc-thumb"><img src="'+esc(x.image)+'" alt="" loading="lazy">'+(x.tag?'<span class="tag">'+esc(x.tag)+'</span>':'')+'</div><div class="svc-body"><h3>'+esc(x.title)+'</h3><p>'+esc(x.desc)+'</p><span class="more">View details '+I('arrow')+'</span></div></a>'}
function vServices(){title('Services');var h=C.home||{};
 app.innerHTML='<div class="wrap pg-top">'+back('/','Back to home')+'<div class="pg-h"><span class="eyebrow">'+esc(h.svc_eyebrow||'Services')+'</span><h1 class="h-xl" style="margin-top:8px"><span class="shine">'+esc(h.svc_title||'What We Do')+'</span></h1><p class="lead">Tap a service to see details and related work.</p></div><div class="svc-cards">'+(C.services||[]).map(svcCard).join('')+'</div>'+adSlot('services')+'</div>'}
function vService(s){var x=(C.services||[]).find(function(v){return v.slug===s});if(!x){app.innerHTML='<div class="wrap pg-top">'+back('/services','All services')+'<div class="st-empty">Service not found.</div></div>';return}
 title(x.title);var vids=PF.filter(function(p){return (p.services||[]).indexOf(s)>=0});var rel=(C.services||[]).filter(function(v){return v.slug!==s}).slice(0,3);
 app.innerHTML='<div class="wrap pg-top">'+back('/services','Back to services')+'<div class="svc-hero"><img src="'+esc(x.image)+'" alt=""><h1>'+esc(x.title)+'</h1></div><div class="svc-full">'+md(x.full||x.desc)+'</div>'+
  '<div class="w-acts"><a class="btn btn-primary" href="/?hire=1">Hire for '+esc(x.title)+'</a><a class="btn btn-ghost" href="/services">More services</a></div>'+
  (vids.length?'<section class="sec-row"><div class="sec-row-h"><h2>Related work</h2></div><div class="mgrid">'+vids.map(function(p){return card(p,'svc:'+s)}).join('')+'</div></section>':'')+
  '<section class="sec-row"><div class="sec-row-h"><h2>Related services</h2><a href="/services">All services →</a></div><div class="svc-cards" style="margin-top:6px">'+rel.map(svcCard).join('')+'</div></section></div>';bindImgs(app)}

/* ----- /about ----- */
function vAbout(){var a=C.about||{};title('About');
 app.innerHTML='<div class="wrap pg-top">'+back('/','Back to home')+'<section class="ab-sec"><div class="ab-ph"><img src="'+esc(a.editor_photo||'/img/hero.webp')+'" alt=""></div><div class="ab-tx"><span class="eyebrow">About</span><h2 class="grad-text">'+esc(a.editor_title)+'</h2><div class="svc-full">'+md(a.editor_body)+'</div></div></section>'+
  '<section class="ab-sec flip"><div class="ab-ph"><img src="'+esc(a.brand_photo||'/img/f2_0.jpg')+'" alt=""></div><div class="ab-tx"><span class="eyebrow">The studio</span><h2 class="grad-text">'+esc(a.brand_title)+'</h2><div class="svc-full">'+md(a.brand_body)+'</div><div class="w-acts"><a class="btn btn-primary" href="/portfolio">See the portfolio</a><a class="btn btn-ghost" href="/services">Services</a></div></div></section></div>'}

window.JC_AFTER=function(site){S=site;C=site.content;CATS=site.categories;PF=site.portfolio;app=$('#app');if(!app)return;
 var p=location.pathname.replace(/\/$/,'')||'/',m;
 if(p==='/portfolio')vPortfolio();else if((m=p.match(/^\/portfolio\/([\w-]+)$/)))vCat(m[1]);else if((m=p.match(/^\/watch\/(\d+)$/)))vWatch(m[1]);
 else if(p==='/services')vServices();else if((m=p.match(/^\/services\/([\w-]+)$/)))vService(m[1]);else if(p==='/about')vAbout();else vPortfolio();
 window.scrollTo(0,0)};
})();
