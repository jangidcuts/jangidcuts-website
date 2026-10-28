/* Admin "Preview" opens the site in the same tab: show a "Back to Admin" pill for the rest of this tab session */
(function(){try{var q=new URLSearchParams(location.search);if(q.get('from')==='admin'){var b=(q.get('back')||'dashboard').replace(/[^\w?=&.-]/g,'');sessionStorage.setItem('jc-admin-back','/admin#'+b);q.delete('from');q.delete('back');history.replaceState(history.state,'',location.pathname+(q.toString()?'?'+q:'')+location.hash)}
 var to=sessionStorage.getItem('jc-admin-back');if(!to)return;var mk=function(){if(document.getElementById('jcAdmBack'))return;var a=document.createElement('a');a.id='jcAdmBack';a.href=to;a.setAttribute('data-i18n-skip','');a.innerHTML='&larr; Back to Admin';
  a.style.cssText='position:fixed;left:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:2147483000;padding:10px 16px;border-radius:999px;background:linear-gradient(90deg,#2BF5C0,#0DBC94);color:#021a14;font:700 14px/1 Inter,system-ui,sans-serif;text-decoration:none;box-shadow:0 6px 24px rgba(0,0,0,.35)';
  a.onclick=function(){try{sessionStorage.removeItem('jc-admin-back')}catch(e){}};document.body.appendChild(a)};if(document.body)mk();else document.addEventListener('DOMContentLoaded',mk)}catch(e){}})();
(function(){'use strict';
var D=document,$=function(s,r){return (r||D).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ICON(n){return '<svg class="icon" aria-hidden="true"><use href="#i-'+n+'"/></svg>'}
function socList(c){var l=(c&&c.socials)||[];return window.JCB?JCB.visible(l):l.filter(function(x){return x&&x.show!==false&&x.url})}
function api(path,body,method){return fetch(path,{method:method||(body?'POST':'GET'),credentials:'same-origin',headers:body?{'content-type':'application/json','x-jc':'1'}:{'x-jc':'1'},body:body?JSON.stringify(body):undefined})
 .then(function(r){return r.json().catch(function(){return{ok:false,error:'Network error'}})}).catch(function(){return{ok:false,error:'You seem to be offline. Please try again.'}})}
function md(t){var out=[],list=false;String(t||'').split(/\n/).forEach(function(l){var s=l.trim();
 if(/^##\s+/.test(s)){if(list){out.push('</ul>');list=false}out.push('<h3 class="h-md grad-text" style="margin:26px 0 10px">'+esc(s.replace(/^##\s+/,''))+'</h3>')}
 else if(/^[-•]\s+/.test(s)){if(!list){out.push('<ul style="margin:0 0 14px 20px">');list=true}out.push('<li>'+esc(s.replace(/^[-•]\s+/,''))+'</li>')}
 else if(!s){if(list){out.push('</ul>');list=false}out.push('')}
 else{if(list){out.push('</ul>');list=false}out.push('<p style="margin:0 0 14px">'+esc(s)+'</p>')}});if(list)out.push('</ul>');
 return out.join('\n').replace(/<\/p>\n<p style="margin:0 0 14px">/g,'</p>\n<p style="margin:0 0 14px">')}
/* jc-early loader */
(function(){var ld=D.getElementById('loader');if(!ld)return;var seen=false,low=D.documentElement.classList.contains('anim-low');try{seen=sessionStorage.getItem('jc-seen')==='1';sessionStorage.setItem('jc-seen','1')}catch(e){}
 if(seen||low){ld.classList.add('done');D.body.classList.add('ready');return}ld.classList.add('go');setTimeout(function(){ld.classList.add('done');D.body.classList.add('ready')},700)})();
var JCL=window.JCL={c:null,user:null,site:null};
function toast(m){window.JC_UI&&JC_UI.toast?JC_UI.toast(m):alert(m)}

/* ---------- data → v3 page format ---------- */
function buildJC(s){var cats=s.categories,cn=function(id){var x=cats.find(function(c){return c.id===id});return x?x.name:''};
 function lib(kind){var sec='portfolio_'+kind,items=s.portfolio.filter(function(p){return p.kind===kind});var catMap={};
  cats.filter(function(c){return c.section===sec&&!c.parent_id}).forEach(function(c){catMap[c.name]=cats.filter(function(x){return x.parent_id===c.id}).map(function(x){return x.name})});
  var L=items.map(function(p){return{id:p.id,t:p.title,c:cn(p.category_id),s:cn(p.subcategory_id),img:p.image,o:p.orient||'h',clip:p.video||'',url:p.url||'',d:p.description||'',featured:!!p.featured,home:!!p.home}});
  var rows=((s.content.portfolio_rows||{})[kind]||[]).map(function(r){if(r.source==='featured')return{title:r.title,auto:!!r.auto,note:r.auto?'auto-scrolls':'',pick:L.map(function(x,i){return x.featured?i:-1}).filter(function(i){return i>=0})};
   return{title:r.title,auto:!!r.auto,note:r.auto?'auto-scrolls':'',c:String(r.source||'').replace(/^cat:/,'')}}).filter(function(r){return r.pick?r.pick.length:L.some(function(x){return x.c===r.c})});
  var feature=L.map(function(x,i){return x.featured?{t:x.t,d:x.d||x.c,img:x.img,i:i}:null}).filter(Boolean).slice(0,5);
  return{cats:catMap,items:L,rows:rows,feature:feature}}
 var v=lib('video');
 return{video:v,thumb:lib('thumb'),services:(s.content.services||[]).map(function(x){return{t:x.title,d:x.desc,img:x.image,slug:x.slug}}),homeItems:v.items.filter(function(x){return x.featured})}}

function applyHome(c,s){var h=c.hero;
 var bw=$('.bigword');if(bw&&!$('.pf-hero')){var w=(c.brand.bigword||'JANGID CUTS').split(' ');bw.innerHTML=w.map(function(x){return '<span class="bw-line">'+esc(x)+'</span>'}).join(' ')}
 var hl=$('.hello-line');if(hl)hl.textContent=h.hello;var hn=$('#heroName .shine');if(hn)hn.textContent=h.name;
 var hr=$('.hero-role');if(hr)hr.innerHTML=esc(h.role).replace(/&amp;/,'<i>&amp;</i>');
 var hb=$('#hireBtn');if(hb)hb.firstChild.nodeValue=h.cta+' ';var rb=$('#reelBtn');if(h.showreel){if(!rb){var cv=$('#resumeBtn');if(cv){rb=document.createElement('a');rb.className='btn btn-ghost hx hero-cv';rb.style.setProperty('--i','4');rb.id='reelBtn';rb.href='/watch/reel';rb.innerHTML='<svg class="icon" aria-hidden="true"><use href="#i-play"/></svg>Showreel';cv.after(rb)}}}else if(rb)rb.remove();
 var ph=$('.hero-photo');if(ph){if(/^\/img\/hero-n\d+\.webp$/.test(h.photo||'')){var SS='/img/hero-n354.webp 354w, /img/hero-n708.webp 708w, /img/hero-n963.webp 963w';if(ph.getAttribute('srcset')!==SS){ph.srcset=SS;ph.sizes='(min-width:1024px) 520px, 90vw';ph.src='/img/hero-n708.webp'}}else{ph.removeAttribute('srcset');if(h.photo&&ph.getAttribute('src')!==h.photo)ph.src=h.photo}ph.alt=h.photo_alt||'';ph.style.filter=h.bw?'grayscale(1) contrast(1.12)':'none';if(h.zoom&&+h.zoom!==100)ph.style.transform='scale('+(+h.zoom/100)+')';if(+h.shift_y)ph.style.marginTop=(+h.shift_y)+'px'}
 var home=c.home;
 var st=$('.stats');if(st){st.closest('section').hidden=!home.show_stats;st.innerHTML=(c.stats||[]).map(function(x){return '<div class="stat rv"><div class="stat-ic">'+ICON(x.icon||'star')+'</div><div><div class="stat-num grad-text" data-count="'+(+x.num||0)+'">'+(+x.num||0)+esc(x.suffix||'')+'</div><div class="stat-lbl">'+esc(x.label)+'</div></div></div>'}).join('')}
 var work=$('#work');if(work){work.hidden=!home.show_work;$('#work .eyebrow').textContent=home.work_eyebrow;$('#workTitle').textContent=home.work_title;var wb=$('#work .sec-head .btn');if(wb)wb.firstChild.nodeValue=home.work_btn+' '}
 var sv=$('#services');if(sv){sv.hidden=!home.show_services;$('#services .eyebrow').textContent=home.svc_eyebrow;$('#svcTitle').textContent=home.svc_title;
  var mains=(c.services||[]).filter(function(x){return x.main});if(!mains.length)mains=(c.services||[]);mains=mains.slice(0,+home.svc_count||6);
  $('.svc-grid').innerHTML=mains.map(function(x){return '<a class="svc rv" href="/services/'+esc(x.slug||'')+'"><div class="svc-thumb"><img src="'+esc(x.image)+'" alt="" loading="lazy">'+(x.tag?'<span class="tag">'+esc(x.tag)+'</span>':'')+'</div><div class="svc-body"><h3>'+esc(x.title)+'</h3><p>'+esc(x.desc)+'</p>'+(x.price_from?'<p style="color:var(--mint);font-weight:700;margin-top:-4px">From '+esc(x.price_from)+'</p>':'')+'<span class="more">'+esc(home.svc_link||'View details')+' '+ICON('arrow')+'</span></div></a>'}).join('');
  if(!$('#svcMore')){var mb=D.createElement('div');mb.id='svcMore';mb.style.cssText='text-align:center;margin-top:26px';mb.innerHTML='<a class="btn btn-ghost" href="/services">'+esc(home.svc_more||'More services')+' '+ICON('arrow')+'</a>';$('.svc-grid').after(mb)}}
 var pb=$('#pfBanner'),bn=home.pf_banner||{};if(pb){pb.hidden=!bn.show;pb.innerHTML='<div class="wrap"><a class="pf-banner rv" href="/portfolio"><img src="'+esc(bn.image||'/img/f2_0.jpg')+'" alt="" loading="lazy"><div class="pfb-shade"></div><div class="pfb-tx"><span class="eyebrow">'+esc(bn.eyebrow||'Portfolio')+'</span><h2 class="h-lg">'+esc(bn.title||'')+'</h2><p>'+esc(bn.sub||'')+'</p><span class="btn btn-primary">'+esc(bn.btn||'Open Portfolio')+' '+ICON('arrow')+'</span></div></a></div>'}
 var wb2=$('#work .sec-head .btn');if(wb2)wb2.setAttribute('href','/portfolio');window.JC_WATCH=true;
 var rv=$('#reviews');if(rv){rv.hidden=!home.show_reviews;$('#reviews .eyebrow').textContent=home.rev_eyebrow;$('#revTitle').textContent=home.rev_title;
  var list=(s.homeReviews||[]).slice(0,4);
  var star=function(n){var o='';for(var i=0;i<5;i++)o+='<svg class="'+(i<n?'':'off')+'" aria-hidden="true"'+(i<n?'':' style="opacity:.25"')+'><use href="#i-star"/></svg>';return o};
  var ini=function(n){return String(n||'?').split(/\s+/).map(function(w){return w[0]}).join('').slice(0,2).toUpperCase()};
  var avg=s.reviewStats.avg||5;$('.rev-score .big').textContent=avg.toFixed?avg.toFixed(1):avg;$('.rev-score .stars').innerHTML=star(Math.round(avg));$('.rev-score .lead').textContent=(home.rev_note||'Average from client reviews')+' ('+s.reviewStats.count+')';
  $('.rev-list').innerHTML=list.map(function(r){return '<article class="rev rv"><div class="stars" aria-label="'+r.rating+' out of 5 stars">'+star(r.rating)+'</div>'+(r.text?'<p>“'+esc(r.text)+'”</p>':'')+'<div class="rev-who"><i>'+(r.photo?'<img src="'+esc(r.photo)+'" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">':esc(ini(r.name)))+'</i><div><b>'+esc(r.name)+'</b><span>'+esc(r.role||'')+'</span>'+(r.verified==='client'?'<em class="rev-vc">'+ICON('check')+' Verified client</em>':'')+'</div></div>'+(r.reply?'<div class="rev-reply"><b>Reply from Prashant</b>'+esc(r.reply)+'</div>':'')+'</article>'}).join('')}
 var lb=$('.l-brand');if(lb){var t=(c.brand.bigword||'JANGID CUTS');lb.innerHTML=t.split('').map(function(ch,i){return '<span style="animation-delay:'+(i*30)+'ms">'+(ch===' '?'&nbsp;':esc(ch))+'</span>'}).join('')}
 
 var br=$('.brand');if(br)br.textContent=c.brand.name||'Jangid Cuts';
 if(c.seo&&c.seo.title&&/index|^\/$/.test(location.pathname+'')){D.title=c.seo.title}}

function applyFooter(c){var f=$('.footer');if(!f)return;var p=$('.foot-grid > div:first-child p',f);if(p)p.textContent=c.footer.about;
 var so=$('.socials',f);if(so)so.innerHTML=socList(c).map(function(x){return '<a class="so-b" href="'+esc(x.url)+'" aria-label="'+esc(x.name)+'" title="'+esc(x.name)+'" rel="noopener noreferrer" target="_blank">'+(window.JCB?JCB.tile(x.icon,x.url):ICON(x.icon||'globe'))+'</a>'}).join('');
 var cp=$('.copy span',f);if(cp)cp.textContent=String(c.footer.copyright||'').replace('{year}',new Date().getFullYear());var mi=$$('.copy span',f)[1];if(mi){mi.textContent=c.footer.made_in;mi.hidden=!c.footer.show_location}
 }

function supMail(c){var h=c.help||{},se=h.support_email||'supportjangidcuts@gmail.com',be=h.business_email||'jangidcuts@gmail.com';
 return '<div class="sup-mail"><span class="sup-ic">'+ICON('mail')+'</span><div class="sup-tx"><small>Email support</small><a href="mailto:'+esc(se)+'">'+esc(se)+'</a><p>'+esc(h.support_note||'Only support-related emails here (orders, downloads, account, tickets).')+'</p><a class="sup-biz" href="mailto:'+esc(be)+'">For business →</a></div></div>'}
var TK_LABEL={received:'Received',read:'Read',processing:'Processing',solved:'Solution delivered',closed:'Closed'};
function fdt(t){if(!t)return '';var d=new Date(t);try{return d.toLocaleDateString(JCL.locale||'en-IN',{day:'numeric',month:'short',year:'numeric'})+', '+d.toLocaleTimeString(JCL.locale||'en-IN',{hour:'numeric',minute:'2-digit'})}catch(e){return d.toLocaleString()}}
function tkType(t){return t.items?'order':/HIRE/.test(t.number||'')?'hire':'ticket'}
/* Rate us (Oct 28): client review of the project, inside the hire tracker. Opens automatically for a completed one-time project,
   or when Prashant sends the review option for ongoing work. One review per project, editable. */
function hrBox(t){var rv=t.review||{},n=+rv.rating||0;
 return '<div class="hr-rate" data-n="'+esc(t.number)+'" data-r="'+n+'"><b class="hr-h">'+(n?'Your review':'Rate us')+'</b><p class="hr-sub">'+(n?'Thank you for rating your project. You can change it any time.':'How was working with Jangid Cuts? Your rating and a few words help other creators decide.')+'</p>'+
  '<div class="hr-stars" role="group" aria-label="Your rating">'+[1,2,3,4,5].map(function(k){return '<button type="button" data-v="'+k+'" aria-label="'+k+' star'+(k>1?'s':'')+'" aria-pressed="'+(k<=n?'true':'false')+'"'+(k<=n?' class="on"':'')+'><svg aria-hidden="true"><use href="#i-star"/></svg></button>'}).join('')+'</div>'+
  '<label class="hr-lbl">Your name <small>(shown with your review)</small><input class="input hr-name" maxlength="60" value="'+esc(rv.name||'')+'" autocomplete="name"></label>'+
  '<label class="hr-lbl">Your review <small>(optional)</small><textarea class="input hr-text" maxlength="1000" placeholder="What did you like about the edit?">'+esc(rv.text||'')+'</textarea></label>'+
  '<button class="btn btn-primary hr-send" type="button">'+(n?'Update review':'Post review')+'</button>'+(rv.hidden?'<p class="hr-note">Your review is not shown publicly right now.</p>':'')+'</div>'}
JCL._hrAuth={};
document.addEventListener('click',function(e){var sb=e.target.closest&&e.target.closest('.hr-stars button');
 if(sb){var box=sb.closest('.hr-rate'),v=+sb.getAttribute('data-v');box.setAttribute('data-r',v);$$('.hr-stars button',box).forEach(function(x){var on=+x.getAttribute('data-v')<=v;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on?'true':'false')});return}
 var bt=e.target.closest&&e.target.closest('.hr-send');if(!bt)return;var b=bt.closest('.hr-rate'),r=+b.getAttribute('data-r'),num=b.getAttribute('data-n');
 if(!r){toast('Tap the stars to rate');return}
 var body=Object.assign({number:num},JCL._hrAuth[num]||{},{rating:r,name:$('.hr-name',b).value,text:$('.hr-text',b).value});bt.disabled=true;
 api('/api/hire-review',body).then(function(x){bt.disabled=false;if(!x.ok){toast(x.error||'Could not save your review');return}
  toast(x.message||'Thank you for your review!');$('.hr-h',b).textContent='Your review';$('.hr-sub',b).textContent='Thank you for rating your project. You can change it any time.';bt.textContent='Update review'})});
/* Final state (Oct 28): the last step of a finished timeline gets a filled mint dot with a drawn check, and one line under the
   timeline says when it finished. No emoji anywhere in the tracker. */
var TK_FIN={hire:{completed:'Project completed',active:'Collaboration active',delivered:'Project delivered'},order:{completed:'Order completed'},ticket:{closed:'Ticket closed',solved:'Solution delivered'}};
var TK_CHK='<svg class="tk-chk" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 12.6l3.6 3.6 7.4-8.2"/></svg>';
function fdd(t){if(!t)return '';var d=new Date(t);try{return d.toLocaleDateString(JCL.locale||'en-IN',{day:'numeric',month:'short',year:'numeric'})}catch(e){return d.toDateString()}}
function tkTimeline(t){var ty=tkType(t),ong=ty==='hire'&&t.kind==='ongoing';
 var kind=ty==='order'?'Order':ty==='hire'?(ong?'Ongoing collaboration':'Hire request'):(t.kind==='question'?'Question':'Support ticket');
 var lbl=ty==='ticket'?(TK_LABEL[t.status]||t.label||t.status):(t.label||t.status);
 var steps=t.steps||[],cs=null;steps.forEach(function(s){if(s.current)cs=s});
 var finTxt=cs&&cs.done&&(TK_FIN[ty]||{})[cs.s],last=steps.length?steps[steps.length-1]:null,finStep=!!(finTxt&&last===cs&&cs.s!=='delivered'&&cs.s!=='solved');
 var final=finTxt?'<div class="tk-final'+(finStep?' is-end':'')+'"><span class="tk-final-ic">'+TK_CHK+'</span><p>'+esc(finTxt)+(cs.at?' <span>'+(cs.s==='active'?'since ':'on ')+esc(fdd(cs.at))+'</span>':'')+'</p></div>':'';
 return '<div class="tk-card tk-'+ty+(ong?' tk-ongoing':'')+'"><div class="tk-head"><div><small>'+esc(kind)+'</small><b class="tk-ref">'+esc(t.number)+'</b></div><span class="tk-pill tk-'+esc(t.status)+(finStep?' fin':'')+'">'+(finStep?'<i aria-hidden="true"></i>':'')+esc(lbl)+'</span></div>'+
  '<ol class="tk-steps" style="--n:'+Math.max(steps.length,1)+'">'+steps.map(function(s){var isFin=finStep&&s===cs,alt=/^(paused|ended|declined)$/.test(s.s);
   return '<li class="'+(s.done?'done':'')+(s.current?' cur':'')+(isFin?' fin':'')+(alt?' alt':'')+' st-'+esc(s.s)+'"><span class="tk-dot">'+(isFin?TK_CHK:s.done?ICON('check'):'')+'</span><div><b>'+esc(s.label||TK_LABEL[s.s])+'</b><small>'+(s.at?esc(fdt(s.at)):(s.done?'':'Waiting'))+'</small></div></li>'}).join('')+'</ol>'+final+
  '<div class="tk-meta"><span><small>'+(ty==='order'?'Items':ty==='hire'?'Type':'Category')+'</small>'+esc(ty==='order'?t.items.join(', '):ty==='hire'?(ong?'Ongoing / monthly work':'One-time project'):(t.topic||'General'))+'</span><span><small>'+(ty==='order'?'Placed':ty==='hire'?'Sent':'Raised')+'</small>'+esc(fdt(t.created))+'</span>'+(t.email?'<span><small>Email</small>'+esc(t.email)+'</span>':'')+'</div>'+
  (ty==='hire'?'<p class="tk-note">Replies about your project come by email from jangidcuts@gmail.com.</p>':'')+
  (ty==='hire'&&t.review&&t.review.open?hrBox(t):'')+
  (ty==='order'&&t.download?'<div class="tk-actions"><a class="btn btn-primary" href="/orders">'+ICON('download')+' Go to downloads</a></div>':'')+
  (t.message?'<details class="tk-msg"><summary>'+(ty==='hire'?'Your brief':'Your message')+'</summary><p>'+esc(t.message)+'</p></details>':'')+
  (ty==='ticket'&&t.solution?'<div class="tk-sol"><b>'+(t.kind==='question'?'Our answer':'Solution')+'</b><p>'+esc(t.solution)+'</p></div>':'')+'</div>'}
/* Thank-you card after a hire request, support ticket or order (Oct 27c) */
var TY={hire:{t:'Thank you! We\u2019ve received your hire request.',s:'Prashant will review your project and contact you soon by email.',n:'hire request number',trk:'Track hire request',where:'You can track your hire request any time from the Track section.',path:'/track-hire'},
 question:{t:'Thank you! We\u2019ve received your question.',s:'We\u2019ll reply to you by email soon.',n:'ticket number',trk:'Track support ticket',where:'You can track your ticket any time from the Track section.',path:'/track-ticket'},
 problem:{t:'Thank you! We\u2019ve received your report.',s:'Our support team will look into it and reply to you by email.',n:'ticket number',trk:'Track support ticket',where:'You can track your ticket any time from the Track section.',path:'/track-ticket'},
 order:{t:'Thank you for your order!',s:'Your order is confirmed. Your downloads are in My orders.',n:'order number',trk:'Track order',where:'You can track your order any time from the Track section.',path:'/track-order'}};
JCL.thanks=function(o){var k=TY[o.kind]||TY.hire,em=o.email||'';
 return '<div class="ty-card" role="status"><div class="ok-ic">'+ICON('check')+'</div><h3 class="ty-h">'+esc(k.t)+'</h3><p class="ty-s">'+esc(k.s)+'</p>'+
  '<div class="ty-ref"><small>Your '+esc(k.n)+'</small><div class="ty-code"><span class="tk-num" data-i18n-skip>'+esc(o.number)+'</span><button type="button" class="ty-copy" data-copy="'+esc(o.number)+'">'+ICON('doc')+'<span>Copy</span></button></div></div>'+
  '<p class="ty-keep"><b>Keep this number safe</b> \u2014 you\u2019ll need it to track your request.'+(em?' We\u2019ve also emailed it to <b>'+esc(em)+'</b>.':'')+'</p>'+
  '<p class="ty-where">'+esc(k.where)+'</p>'+
  '<div class="row-btns"><a class="btn btn-primary" href="'+k.path+'?n='+encodeURIComponent(o.number)+(em?'&e='+encodeURIComponent(em):'')+'">'+esc(k.trk)+' '+ICON('arrow')+'</a>'+(o.extra||'')+'</div></div>'};
function copyTxt(t){if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(t);return new Promise(function(res){var a=D.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;opacity:0';D.body.appendChild(a);a.select();try{D.execCommand('copy')}catch(e){}a.remove();res()})}
D.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.ty-copy');if(!b)return;e.preventDefault();copyTxt(b.getAttribute('data-copy')).then(function(){b.classList.add('ok');var sp=b.querySelector('span');if(sp)sp.textContent='Copied';setTimeout(function(){b.classList.remove('ok');if(sp)sp.textContent='Copy'},1800)})});
JCL.tkTimeline=tkTimeline;
function normRef(type,s){var t=String(s||'').toUpperCase().replace(/\s+/g,'').replace(/_/g,'-');if(/^\d{4,9}$/.test(t))return 'JC-'+type+'-'+t;var m=t.match(/^(?:JC-?)?([A-Z]{2,4})-?([A-Z0-9]{4,9})$/);return m?'JC-'+m[1]+'-'+m[2]:t}
JCL.normRef=normRef;
function helpView(){var p=location.pathname.replace(/\/$/,'');if(p==='/support')return 'support';if(/^\/track(-hire|-ticket|-order)?$/.test(p))return 'track';if(/^\/help(\.html)?$/.test(p)&&location.hash==='#issue')return 'support';return 'faq'}
var TRK={hire:{T:'HIRE',title:'Track hire request',lead:'Enter your hire request number and the email you used in the Hire Me form. For your privacy, both must match.',lbl:'Hire request number',ph:'Enter your JC-HIRE number',word:'hire request'},
 ticket:{T:'TKT',title:'Track support ticket',lead:'Enter your ticket number and the email you used. For your privacy, both must match.',lbl:'Ticket number',ph:'Enter your JC-TKT number',word:'support ticket'},
 order:{T:'ORD',title:'Track order',lead:'Enter your order number and the email used for the order. For your privacy, both must match.',lbl:'Order number',ph:'Enter your JC-ORD number',word:'order'}};
function trkTypeOf(){var p=location.pathname.replace(/\/$/,'');if(p==='/track-hire')return 'hire';if(p==='/track-ticket')return 'ticket';if(p==='/track-order')return 'order';
 var n=String(new URLSearchParams(location.search).get('n')||'').toUpperCase().replace(/\s+/g,'');if(!n)return 'hire';if(/HIRE/.test(n))return 'hire';if(/ORD|DL/.test(n))return 'order';return 'ticket'}
/* "12345", "JC-HIRE-12345", "jc hire 12345" -> {ok, ref, wrong} for ONE tracker type */
function parseRef(T,s){var t=String(s||'').toUpperCase().replace(/[\s_#:.]+/g,'').replace(/[\u2010-\u2015]/g,'-');if(/^\d{4,9}$/.test(t))return{ok:true,ref:'JC-'+T+'-'+t,digits:t};
 var m=t.match(/^(?:JC)?-?([A-Z]{2,4})-?(\d{4,9})$/);if(!m)return{ok:false};return{ok:true,ref:'JC-'+m[1]+'-'+m[2],digits:m[2],wrong:m[1]!==T&&!(T==='ORD'&&m[1]==='DL')}}
JCL.parseRef=parseRef;
function applyHelp(c){var page=$('.help-page');if(!page)return;var view=helpView();
 if(view==='support'&&location.pathname.indexOf('/support')!==0){history.replaceState(null,'','/support'+location.search)}
 D.documentElement.setAttribute('data-hpv',view);$$('.hp-view',page).forEach(function(v){v.hidden=v.getAttribute('data-view')!==view});
 D.title=({faq:'FAQ',support:'Support',track:'Track'})[view]+' | Jangid Cuts';
 var h=c.help||{};
 var fq=$('#faq');if(fq&&c.faq)fq.innerHTML=(c.faq||[]).map(function(x,i){return '<details'+(i===0?' open':'')+'><summary>'+esc(x.q)+'</summary><p>'+esc(x.a)+'</p></details>'}).join('');
 var t=$('#helpTitle');if(t&&h.title)t.textContent=h.title;
 var sp=(c.pages||{}).support;if(sp&&$('#supTitle')){$('#supTitle').textContent=sp.title||'Support';if(sp.body)$('#supIntro').textContent=sp.body}
 var mb=$('#supMailBox');if(mb&&!mb.innerHTML)mb.innerHTML=supMail(c);
 /* support form: Ask a question / Report a problem -> same JC-TKT ticket */
 var f=$('#issueForm');if(f&&!f._b){f._b=1;if(JCL.user&&$('#isEmail'))$('#isEmail').value=JCL.user.email;
  var qt=new URLSearchParams(location.search).get('type');if(qt==='problem'||qt==='question'){var rb=f.querySelector('input[name=isType][value='+qt+']');if(rb)rb.checked=true}
  var REFT={'Order / payment':['ORD','Order number (JC-ORD-…)','e.g. JC-ORD-12345 or 12345'],'Download':['ORD','Order number of the pack','e.g. JC-ORD-12345 or 12345'],'Hire Me / project':['HIRE','Hire request number (JC-HIRE-…)','e.g. JC-HIRE-12345 or 12345'],'Account / sign in':['EMAIL','Email on your account','you@example.com']};var typ=function(){var r=f.querySelector('input[name=isType]:checked');return r?r.value:'question'};
  var sync=function(){var q=typ()==='question';$('#isMsgLbl').textContent=q?'Your question':'What\u2019s the problem?';$('#isMsg').placeholder=q?'Type your question':'Describe the issue';var rt=REFT[($('#isTopic')||{}).value],ob=$('#isOrd');if(ob){ob.closest('.field').hidden=!rt;if(rt){$('#isOrdLbl').textContent=rt[1];ob.placeholder=rt[2];ob.type=rt[0]==='EMAIL'?'email':'text';ob.setAttribute('autocapitalize',rt[0]==='EMAIL'?'off':'characters');ob.setAttribute('autocomplete',rt[0]==='EMAIL'?'email':'off')}}var bt=f.querySelector('button[type=submit]');if(bt)bt.textContent=q?'Send question':'Report problem'};
  $$('input[name=isType]',f).forEach(function(r){r.addEventListener('change',sync)});var tp=$('#isTopic');tp&&tp.addEventListener('change',sync);sync();
  f.addEventListener('submit',function(e){e.preventDefault();var em=$('#isEmail'),ms=$('#isMsg'),tc=$('#isTc'),ty=typ();$$('.fld-err',f).forEach(function(x){x.remove()});$$('.is-err',f).forEach(function(x){x.classList.remove('is-err')});
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())){fieldErr(em,'Please enter a valid email');return}
   if(ms.value.trim().length<5){fieldErr(ms,ty==='question'?'Please write your question':'Please describe the problem');return}
   if(!tc.checked){toast('Please accept the Terms & Conditions');return}
   var b=f.querySelector('button[type=submit]');b.disabled=true;var rt2=REFT[$('#isTopic').value],rv=$('#isOrd')&&$('#isOrd').value.trim(),ord=(rt2&&rv)?rt2[1].replace(/ \(.*\)$/,'')+': '+(rt2[0]==='EMAIL'?rv:normRef(rt2[0],rv))+'\n\n':'';
   api('/api/tickets',{type:ty,email:em.value.trim(),topic:$('#isTopic').value,message:ord+ms.value,tc:true,website:''}).then(function(r){b.disabled=false;
    if(!r.ok){toast(r.error||'Could not send');return}
    var dn=$('#isDone');f.hidden=true;dn.hidden=false;var head=$('#issue h3'),note=$('#issue .is-note');if(head)head.hidden=true;if(note)note.hidden=true;
    dn.innerHTML=JCL.thanks({kind:ty,number:r.number,email:em.value.trim(),extra:'<button class="btn btn-ghost" type="button" id="isAgain">'+(ty==='question'?'Ask another question':'Report another problem')+'</button>'});
    $('#isAgain').onclick=function(){f.reset();if(JCL.user)em.value=JCL.user.email;dn.hidden=true;f.hidden=false;if(head)head.hidden=false;if(note)note.hidden=false;sync()};
    try{dn.scrollIntoView({block:'center',behavior:'smooth'})}catch(e){}})})}
 /* trackers: one per type; a number only works in its own tracker */
 var tf=$('#trkForm');if(tf&&!tf._b){tf._b=1;var q=new URLSearchParams(location.search),cur=trkTypeOf();
  if(q.get('e'))$('#trkEmail').value=q.get('e').replace(/ /g,'+');else if(JCL.user)$('#trkEmail').value=JCL.user.email;
  var setT=function(ty,keep){cur=ty;var k=TRK[ty];$('#trkTitle').textContent=k.title;$('#trkLead').textContent=k.lead;$('#trkNumLbl').textContent=k.lbl;$('#trkNum').placeholder=k.ph;
   $('#trkHint').textContent='You can enter the full number (JC-'+k.T+'-12345) or just the digits (12345).';
   $$('.trk-tab',page).forEach(function(a){var on=a.getAttribute('data-t')===ty;a.setAttribute('aria-selected',on?'true':'false');a.classList.toggle('on',on)});
   if(!keep){$('#trkOut').innerHTML='';$('#trkErr').hidden=true;$('#trkHelp').hidden=true;$('#trkNum').classList.remove('is-err')}
   if(helpView()==='track')D.title=k.title+' | Jangid Cuts';mine()};
  var mine=function(){var el=$('#trkMine');if(!el)return;var me=JCL.me||{},L=cur==='hire'?(me.hires||[]):cur==='ticket'?(me.tickets||[]):(me.orders||[]).map(function(o){return null}).filter(Boolean);
   el.innerHTML=L.length?'<h3 class="h-md grad-text" style="margin:28px 0 12px">'+(cur==='hire'?'Your hire requests':'Your tickets')+'</h3>'+L.map(tkTimeline).join(''):''};
  var helper=function(){var o=['hire','ticket','order'].filter(function(x){return x!==cur});
   $('#trkHelp').innerHTML=o.map(function(x){return '<p>Tracking '+(x==='hire'?'a hire request':x==='ticket'?'a support ticket':'an order')+'? <a href="/track-'+x+'" data-sw="'+x+'">Track it here \u2192</a></p>'}).join('');$('#trkHelp').hidden=false};
  $$('.trk-tab',page).forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var ty=a.getAttribute('data-t');if(ty===cur)return;try{history.replaceState(null,'','/track-'+ty)}catch(x){}setT(ty);$('#trkNum').value=''})});
  $('#trkHelp').addEventListener('click',function(e){var a=e.target.closest('a[data-sw]');if(!a)return;e.preventDefault();var ty=a.getAttribute('data-sw'),pr=parseRef(TRK[cur].T,$('#trkNum').value);try{history.replaceState(null,'','/track-'+ty)}catch(x){}setT(ty);if(pr.ok)$('#trkNum').value=pr.digits;$('#trkNum').focus()});
  var run=function(){var k=TRK[cur],raw=$('#trkNum').value,pr=parseRef(k.T,raw),em=$('#trkEmail').value.trim(),er=$('#trkErr');er.hidden=true;$('#trkHelp').hidden=true;$('#trkNum').classList.remove('is-err');$('#trkEmail').classList.remove('is-err');
   if(!pr.ok){$('#trkNum').classList.add('is-err');er.textContent='Enter your '+k.word+' number, like JC-'+k.T+'-12345 (or just 12345)';er.hidden=false;return}
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){$('#trkEmail').classList.add('is-err');er.textContent='Enter the email you used for the '+k.word;er.hidden=false;return}
   var b=tf.querySelector('button[type=submit]');b.disabled=true;
   api('/api/track',{type:cur,number:raw.trim(),email:em}).then(function(r){b.disabled=false;
    if(!r.ok){er.textContent=r.notFound?('No '+k.word+' found for this number and email.'):(r.error||'Could not find it');er.hidden=false;$('#trkOut').innerHTML='';if(r.notFound)helper();return}
    var d=r.hire||r.ticket||r.order;if(r.hire)JCL._hrAuth[d.number]={email:em};$('#trkOut').innerHTML=tkTimeline(d);try{history.replaceState(null,'','/track-'+cur+'?n='+encodeURIComponent(d.number))}catch(e){}
    try{$('#trkOut').scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){}})};
  setT(cur,true);if(q.get('n'))$('#trkNum').value=q.get('n');
  tf.addEventListener('submit',function(e){e.preventDefault();run()});
  var rtok=cur==='hire'&&String(q.get('r')||'').replace(/[^a-f0-9]/gi,'');
  if(rtok){api('/api/hire-review?t='+encodeURIComponent(rtok)).then(function(r){var er=$('#trkErr');
    if(!r.ok){er.textContent=r.error||'This rating link is not valid.';er.hidden=false;return}
    var d=r.hire;JCL._hrAuth[d.number]={t:rtok};$('#trkNum').value=d.number;$('#trkOut').innerHTML=tkTimeline(d);try{history.replaceState(null,'','/track-hire?n='+encodeURIComponent(d.number))}catch(e){}
    if(!d.review||!d.review.open){er.textContent='Rating for this project is not open yet.';er.hidden=false}
    setTimeout(function(){var x=$('#trkOut .hr-rate')||$('#trkOut');try{x.scrollIntoView({block:'center',behavior:'smooth'})}catch(e){}},120)})}
  else if(q.get('n')&&$('#trkEmail').value)run();
  JCL._trkMine=mine}
 else if(JCL._trkMine)JCL._trkMine();
}
function applySoon(c,s){var t=$('#soonTitle');if(!t)return;var key=((location.pathname.replace(/^\/|\/$/g,'')!=='soon'&&location.pathname.replace(/^\/|\/$/g,'').indexOf('.html')<0&&location.pathname.replace(/^\/|\/$/g,''))||(location.hash||'').slice(1)).replace(/-/g,'_');var sec=t.closest('section'),lead=$('.lead',sec),eb=$('.eyebrow',sec);
 var pages=c.pages||{};eb.textContent='Jangid Cuts';
 function prose(html){lead.outerHTML='<div class="prose" style="text-align:left;max-width:72ch;margin:22px auto 26px;color:var(--muted);font-size:16px;line-height:1.7">'+html+'</div>'}
 if(key==='terms'){var tt=pages.terms;t.textContent=tt.title;prose(tt.sections.map(function(x){return '<h3 class="h-md grad-text" id="'+esc(x.id)+'" style="margin:26px 0 10px">'+esc(x.title)+'</h3>'+md(x.body)}).join(''));return}
 if(pages[key]){t.textContent=pages[key].title;prose(md(pages[key].body));return}
 if(key==='contact'){var k=c.contact;t.textContent=k.title;var wa=String(k.whatsapp||'').replace(/\D/g,'');
  var cards=[[k.whatsapp,'wa','WhatsApp','https://wa.me/'+wa],[k.call,'phone','Call','tel:'+String(k.call).replace(/\s/g,'')],[k.instagram_dm,'ig','Instagram DM',k.instagram_dm],[k.email,'mail','Email','mailto:'+k.email],[k.telegram,'tg','Telegram',k.telegram]].filter(function(x){return x[0]});
  prose(md(k.intro)+'<div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));margin-top:18px">'+cards.map(function(x){return '<a class="panel" style="display:flex;gap:12px;align-items:center;padding:16px" href="'+esc(x[3])+'" target="_blank" rel="noopener">'+ICON(x[1])+'<span><b style="color:var(--text)">'+esc(x[2])+'</b><br><small>'+esc(x[1]==='wa'||x[1]==='phone'?String(x[0]).replace(/^\+?91\s*(\d{5})\s*(\d{5})$/,'+91 $1 $2'):x[2]==='Email'?x[0]:'Open')+'</small></span></a>'}).join('')+'</div><p style="margin-top:14px"><small>'+esc(k.hours||'')+'</small></p>');return}
 if(key==='social'){t.textContent='Social';prose('<p>Follow us on other social media platforms:</p><div class="so-grid">'+socList(c).map(function(x){var b=window.JCB?JCB.get(x.icon,x.url):{c:'var(--mint)'};return '<a class="so-card" style="--bc:'+esc(b.c)+'" href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">'+(window.JCB?JCB.tile(x.icon,x.url):ICON(x.icon||'globe'))+'<span class="so-tx"><b>'+esc(x.name)+'</b><small>'+esc(x.handle||'')+'</small></span><span class="so-go" aria-hidden="true">&#8599;</span></a>'}).join('')+'</div>');return}
 var nm={store:'Store',orders:'My Orders',tickets:'My Tickets',profile:'My Profile'}[key]||'Information';t.textContent=nm;lead.textContent='Please return to the home page to continue.';}

/* Hire Me categories: clean groups (auto from the names Prashant keeps in Admin -> Hire form), search with "Other" fallback */
var CAT_GROUPS=[['Social media & YouTube',/reel|short|youtube|vlog|podcast|interview|gaming|tech|unbox|educat|coach|faceless|talking|course/i],
 ['Weddings & events',/wedding|engage|birthday|event|haldi|mehendi|sangeet|party|anniversar/i],
 ['Brands & business',/corporate|product|brand|real estate|ad\b|ads\b|commercial|fashion|food|fitness|travel|restaurant|business|promo/i],
 ['Films & music',/music|song|beat|documentar|short film|trailer|teaser|anime|amv|sports|film|cinematic|movie/i],
 ['Colour, motion & design',/colou?r|grading|motion|logo|thumbnail|poster|graphic|vfx|animation|subtitle|caption/i]];
function catGroups(list){var out=CAT_GROUPS.map(function(g){return{n:g[0],items:[]}}),more={n:'More',items:[]},other=null;
 list.forEach(function(x){if(/^other$/i.test(x)){other=x;return}for(var i=0;i<CAT_GROUPS.length;i++)if(CAT_GROUPS[i][1].test(x)){out[i].items.push(x);return}more.items.push(x)});
 if(more.items.length)out.push(more);return{groups:out.filter(function(g){return g.items.length}),other:other||'Other'}}
function chip(x){return '<button type="button" class="chip" aria-pressed="false">'+esc(x)+'</button>'}
function applyHireForm(c){var cl=$('#catList');if(!cl)return;var G=catGroups((c.hire_form&&c.hire_form.categories)||[]);
 cl.innerHTML=G.groups.map(function(g){return '<div class="cat-grp"><p class="cat-gh">'+esc(g.n)+'</p><div class="cat-chips">'+g.items.map(chip).join('')+'</div></div>'}).join('')+
  '<div class="cat-grp cat-other"><p class="cat-gh">Something else</p><div class="cat-chips">'+chip(G.other)+'</div></div><p class="cat-none" id="catNone" hidden></p>';
 if(cl._b)return;cl._b=1;var srch=$('#catSearch'),oth=$('#catOther');
 var otherChip=function(){return $$('.cat-other .chip',cl)[0]};
 var setOther=function(on){var o=otherChip();if(!o)return;o.setAttribute('aria-pressed',on?'true':'false');if(oth)oth.classList.toggle('hidden',!on)};
 cl.addEventListener('click',function(e){var b=e.target.closest('.chip');if(b){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on?'true':'false');if(b.closest('.cat-other')&&oth){oth.classList.toggle('hidden',!on);if(on)oth.focus()}return}
  var a=e.target.closest('[data-pick-other]');if(a){setOther(true);if(oth&&srch&&!oth.value)oth.value=srch.value.trim();srch.value='';filter('');if(oth)oth.focus()}});
 var filter=function(q){q=String(q||'').toLowerCase().trim();var any=false;
  $$('.cat-grp',cl).forEach(function(g){var vis=0;$$('.chip',g).forEach(function(c){var m=!q||c.textContent.toLowerCase().indexOf(q)>=0||g.classList.contains('cat-other');c.classList.toggle('hidden',!m);if(m){vis++;if(!g.classList.contains('cat-other'))any=true}});g.hidden=!vis});
  var nn=$('#catNone');if(q&&!any){nn.innerHTML='No category matches \u201c'+esc(q)+'\u201d. <button type="button" class="cat-pick" data-pick-other>Choose \u201cOther\u201d and describe it</button>';nn.hidden=false;var o=otherChip();if(o)o.classList.add('pulse')}else{nn.hidden=true;var o2=otherChip();if(o2)o2.classList.remove('pulse')}};
 if(srch)srch.addEventListener('input',function(){filter(srch.value)})}
JCL.submitHire=function(f){var q=function(s){var el=$(s,f);return el?el.value:''};var single=function(n){var b=$('[data-single="'+n+'"] .chip[aria-pressed=true]',f);return b?(b.dataset.v==='custom'?q('#perdayCustom'):b.textContent):''};
 var agency=$('[data-single=agency] .chip[aria-pressed=true]',f);
 var body={name:q('#hName'),email:q('#hEmail'),whatsapp:q('#hWa'),country:q('#hCountry'),agency:agency&&agency.dataset.v==='yes'?'Yes':'No',agency_name:q('#hAg'),agency_address:q('#hAgAddr'),
  categories:$$('#catList .chip[aria-pressed=true]',f).map(function(b){return b.textContent}),category_other:q('#catOther'),perday:single('perday'),format:single('format'),plan:single('plan'),
  budget:q('#hBudget'),deadline:q('#hDate'),raw_link:q('#hRaw'),reference:q('#hRef'),project:q('#hDesc'),tc:!!($('#hTc',f)||{}).checked,website:''};
 return api('/api/hire',body)};


function ads(c){var a=c.ads||{};if(!a.enabled||!a.publisher_id)return;var slots=a.slots||{};var any=false;
 $$('[data-ad]').forEach(function(el){var id=slots[el.dataset.ad];if(!id)return;any=true;el.hidden=false;el.innerHTML='<ins class="adsbygoogle" style="display:block" data-ad-client="'+esc(a.publisher_id)+'" data-ad-slot="'+esc(id)+'" data-ad-format="auto" data-full-width-responsive="true"></ins>'});
 if(!any)return;var s=D.createElement('script');s.async=true;s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(a.publisher_id);s.crossOrigin='anonymous';
 s.onload=function(){$$('ins.adsbygoogle').forEach(function(){try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}})};D.head.appendChild(s)}
function ungate(){try{window.JC_UNGATE&&JC_UNGATE()}catch(e){}}
function endEntry(){ungate();try{sessionStorage.setItem('jc-welcomed','1')}catch(e){}try{window.JC_ENDENTRY&&JC_ENDENTRY()}catch(e){}}
function welcome(c){var w=c.welcome||{};if(!w.show||JCL.user){endEntry();return}try{if(sessionStorage.getItem('jc-welcomed')&&!window.JC_GATED){endEntry();return}}catch(e){endEntry();return}
 var ldr=D.getElementById('loader'),wait=ldr&&!ldr.classList.contains('done')?650:0;
 setTimeout(function(){var m=$('#loginModal');if(!m)return;var b=$('.modal-body',m);b.dataset.stage='welcome';authify(m,'Jangid Cuts');
  b.innerHTML=authTop(noEmoji(w.title).replace(/!+$/,'')||'Welcome')+'<p class="lg-sub" data-rv>'+esc(w.sub)+'</p><div class="lg-rest" data-rv style="display:grid;gap:10px"><button class="btn btn-primary" id="wIn">'+esc(w.signin)+'</button><button class="btn btn-ghost" id="wSkip">'+esc(w.skip)+'</button></div>';
  $('#wIn',b).onclick=function(){JCL.openLogin?JCL.openLogin('signin',true):buildLogin(JCL.site)};$('#wSkip',b).onclick=function(){endEntry();JC_UI.close();setTimeout(function(){buildLogin(JCL.site)},400)};JC_UI.open(m)},wait)}

/* ---------- auth screens (full-screen, own background, staggered reveal) ---------- */
function noEmoji(t){return String(t||'').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu,'').replace(/\s+([!.,])/g,'$1').trim()}
function heroThumb(){var h=(JCL.c&&JCL.c.hero)||{};var p=h.photo||'/img/hero-n354.webp';if(/^\/img\/hero-n\d+\.webp$/.test(p))p='/img/hero-n354.webp';return {src:p,bw:h.bw!==false,name:h.name||'Prashant Jangid',role:h.role||'Video Editor & Graphic Designer'}}
function authTop(title){return '<div class="lg-brand grad-text shine" id="loginTitle" data-rv>JANGID CUTS</div><h2 class="au-h" data-rv>'+esc(title)+'</h2>'}
var REDUCED=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function authify(m,eyebrow,still){if(!m.classList.contains('auth')){m.classList.add('auth');
  if(!$('.auth-card',m)){var card=D.createElement('div');card.className='auth-card';while(m.firstChild)card.appendChild(m.firstChild);
   var bg=D.createElement('div');bg.className='auth-bg';bg.setAttribute('aria-hidden','true');var sc=D.createElement('div');sc.className='auth-scene';sc.setAttribute('aria-hidden','true');sc.innerHTML='<div class="as-panel"><div class="auth-mark am-d">JANGID CUTS</div><svg class="as-svg"></svg></div>';bg.innerHTML='<div class="auth-mark am-m">JANGID CUTS</div>';
   var col=D.createElement('div');col.className='auth-col';col.appendChild(card);m.appendChild(bg);m.appendChild(sc);m.appendChild(col);
   var ld=function(){if(sc._ld||!(window.matchMedia&&matchMedia('(orientation:landscape) and (min-width:900px) and (min-height:500px)').matches))return;sc._ld=1;var x=D.createElement('script');x.src='/auth-scene.js?v=5';x.onload=function(){try{JCAuthScene(sc,m)}catch(e){console.error(e)}};D.head.appendChild(x)};ld();addEventListener('resize',ld);addEventListener('orientationchange',function(){setTimeout(ld,250)});
   var wasOn=false;new MutationObserver(function(){if(!m.classList.contains('on')){if(wasOn){wasOn=false;endEntry()}return}if(wasOn)return;wasOn=true;if(m.classList.contains('auth'))reveal($('.modal-body',m),false)}).observe(m,{attributes:true,attributeFilter:['class']})}}
 var eb=$('.modal-head .eyebrow',m);if(eb&&eyebrow)eb.textContent=eyebrow;
 var b=$('.modal-body',m);if(b&&m.classList.contains('on'))setTimeout(function(){if(still)$$('[data-rv]',b).forEach(function(x){x.classList.add('rv-still')});else reveal(b,true)},0)}
function authDone(){var go=function(){location.reload()};try{if(window.JCAuthCelebrate){JCAuthCelebrate().then(go);return}}catch(e){}setTimeout(go,500)}
function authFail(){try{window.JCAuthSad&&JCAuthSad()}catch(e){}}
function unauth(m){m.classList.remove('auth')}
function reveal(b,quick){if(!b)return;var it=$$('[data-rv]',b),mk=$$('#loginModal .auth-mark');it.forEach(function(x){x.classList.remove('rv-still')});if(REDUCED){it.concat(mk).forEach(function(x){x.classList.add('rv-on')});return}
 var step=quick?40:60,off=0;if(!quick){off=170;mk.forEach(function(x){x.classList.remove('rv-on');void x.offsetWidth;x.classList.add('rv-on')})}
 it.forEach(function(x,i){x.classList.remove('rv-on');x.style.animationDelay=(off+i*step)+'ms';void x.offsetWidth;x.classList.add('rv-on')})}

/* ---------- login modal ---------- */
function fieldErr(inp,msg){if(!inp)return;var box=inp.closest('.field')||inp;var p=box.parentNode.querySelector('.fld-err[data-for="'+inp.id+'"]');
 if(!p){p=D.createElement('p');p.className='fld-err';p.setAttribute('role','alert');p.dataset.for=inp.id;box.insertAdjacentElement('afterend',p)}
 p.textContent=msg;inp.classList.remove('is-err');void inp.offsetWidth;inp.classList.add('is-err');inp.setAttribute('aria-invalid','true');
 if(!inp._errClr){inp._errClr=1;inp.addEventListener('input',function(){inp.classList.remove('is-err');inp.removeAttribute('aria-invalid');var q=box.parentNode.querySelector('.fld-err[data-for="'+inp.id+'"]');q&&q.remove()})}
 try{inp.focus({preventScroll:true})}catch(e){}}
function codeMsg(e){e=String(e||'');return /expired/i.test(e)?'This code has expired. Tap “Resend code” for a new one.':/too many/i.test(e)?'Too many wrong codes. Tap “Resend code” for a new one.':/wrong code/i.test(e)?'Wrong code. Check your email and try again.':e}
function buildLogin(s){var m=$('#loginModal');if(!m)return;var body=$('.modal-body',m);var email='',name='',stage='signin',from='signin',usePw=false,cd=0,timer=null,codeNote='';
 var head=$('.modal-head .eyebrow',m);
 function tabs(){return '<div class="lg-tabs" role="tablist"><button type="button" role="tab" data-tab="signin" aria-selected="'+(stage==='signin')+'">Sign in</button><button type="button" role="tab" data-tab="signup" aria-selected="'+(stage==='signup')+'">Sign up</button></div>'}
 function gbtn(t){return s.cfg.google?'<button class="g-btn" type="button" id="gBtn">'+ICON('g')+' '+t+'</button><div class="or">OR</div>':''}
 function tc(){return '<label class="check lg-tc"><input type="checkbox" id="lgTc"> <span>I agree to the <a class="tc-link" href="/terms" target="_blank">Terms &amp; Conditions</a></span></label>'}
 function draw(){var still=body.dataset.stage===stage&&m.classList.contains('on');body.dataset.stage=stage;authify(m,stage==='signup'||stage==='newname'?'Sign up':stage==='code'?'Check your email':stage==='reset'?'Reset password':'Sign in',still);var h='';
  if(stage==='signin'){h+=authTop('Welcome back')+'<div data-rv>'+tabs()+'</div><div class="lg-rest" data-rv><p class="lg-sub">Sign in to buy packs, download your purchases and track your tickets.</p>'+gbtn('Continue with Google')+
   '<form id="lgForm" novalidate><div class="field"><label for="lgEmail">Email</label><input class="input" id="lgEmail" type="email" placeholder="you@example.com" autocomplete="email" required value="'+esc(email)+'"></div>'+
   '<div class="field'+(usePw?'':' hidden')+'" id="pwWrap"><label for="lgPw">Password</label><input class="input" id="lgPw" type="password" autocomplete="current-password"></div>'+tc()+
   '<button class="btn btn-primary lg-go" type="submit" id="lgGo">'+(usePw?'Sign in':'Email me a sign-in code')+'</button></form><p class="lg-links"><button class="tc-link" type="button" id="usePw">'+(usePw?'Email me a code instead':'Use password instead')+'</button> · <button class="tc-link" type="button" id="forgot">Forgot password?</button></p>'+
   '<p class="lg-alt">New here? <button class="tc-link" type="button" data-tab="signup">Create a free account</button></p></div>'}
  else if(stage==='signup'){h+=authTop('Welcome to Jangid Cuts')+'<div data-rv>'+tabs()+'</div><div class="lg-rest" data-rv><p class="lg-sub">Free account. Lifetime access to everything you buy, on your email.</p>'+gbtn('Sign up with Google')+
   '<form id="suForm" novalidate><div class="field"><label for="suName">Your name</label><input class="input" id="suName" autocomplete="name" required value="'+esc(name)+'"></div><div class="field"><label for="suEmail">Email</label><input class="input" id="suEmail" type="email" placeholder="you@example.com" autocomplete="email" required value="'+esc(email)+'"></div>'+tc()+
   '<button class="btn btn-primary lg-go" type="submit" id="suGo">Create account</button></form><p class="lg-note">We email you a 6-digit code to confirm it’s you. No password needed.</p>'+
   '<p class="lg-alt">Already have an account? <button class="tc-link" type="button" data-tab="signin">Sign in</button></p></div>'}
  else if(stage==='code'||stage==='reset'){h+='<div class="lg-brand grad-text shine" id="loginTitle" data-rv>JANGID CUTS</div><div class="lg-mail" data-rv>'+ICON('mail')+'</div><div class="lg-rest" data-rv>'+(codeNote&&stage==='code'?'<p class="lg-notice" role="status">'+esc(codeNote)+'</p>':'')+'<p class="lg-sub" style="margin-top:6px">We sent a 6-digit code to<br><b>'+esc(email)+'</b></p><form id="codeForm" novalidate><input class="input lg-code" id="lgCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="••••••" required aria-label="6-digit code">'+
   (stage==='reset'?'<div class="field"><label for="np1">New password</label><input class="input" id="np1" type="password" autocomplete="new-password"></div><div class="field"><label for="np2">Confirm new password</label><input class="input" id="np2" type="password" autocomplete="new-password"></div>':'')+
   '<button class="btn btn-primary lg-go" type="submit">'+(stage==='reset'?'Set password &amp; sign in':'Verify &amp; continue')+'</button></form><p class="lg-links"><button class="tc-link" type="button" id="resend"'+(cd>0?' disabled':'')+'>'+(cd>0?'Resend code in '+cd+'s':'Resend code')+'</button> · <button class="tc-link" type="button" id="back">Change email</button></p><p class="lg-note">Can’t find it? Check Spam or Promotions.</p></div>'}
  else if(stage==='newname'){h+=authTop('Welcome to Jangid Cuts')+'<div class="lg-rest" data-rv><p class="lg-done">'+ICON('check')+' Account created</p><p class="lg-sub">What should we call you?</p><form id="nmForm" novalidate><div class="field"><label for="nmName">Your name</label><input class="input" id="nmName" autocomplete="name" maxlength="80" value=""></div><button class="btn btn-primary lg-go" type="submit" id="nmGo">Continue</button></form><p class="lg-links"><button class="tc-link" type="button" id="nmSkip">Skip for now</button></p></div>'}
  body.innerHTML=h;bind()}
 function startCd(){cd=30;clearInterval(timer);timer=setInterval(function(){cd--;var r=$('#resend',body);if(r){r.disabled=cd>0;r.textContent=cd>0?'Resend code in '+cd+'s':'Resend code'}if(cd<=0)clearInterval(timer)},1000)}
 function sendCode(purpose,goStage,btn,note){btn&&(btn.disabled=true);return api('/api/auth/otp',{email:email,purpose:purpose,tc:true,name:name}).then(function(r){btn&&(btn.disabled=false);if(r.ok===false){toast(r.error);authFail();return}var same=stage===goStage;codeNote=note||(same?codeNote:'');stage=goStage;startCd();draw();if(!note)toast('Code sent. Check your email.');setTimeout(function(){var c=$('#lgCode',body);c&&c.focus()},100)})}
 function bind(){$$('[data-tab]',body).forEach(function(b){b.onclick=function(){stage=b.dataset.tab;draw()}});
  var gb=$('#gBtn',body);if(gb)gb.onclick=function(){if(!$('#lgTc',body).checked){toast('Please tick the Terms & Conditions box');return}location.href='/auth/google/start?tc=1&next='+encodeURIComponent(location.pathname+location.search)};
  var up=$('#usePw',body);if(up)up.onclick=function(){email=$('#lgEmail',body).value.trim();usePw=!usePw;draw()};
  var fg=$('#forgot',body);if(fg)fg.onclick=function(){email=$('#lgEmail',body).value.trim();if(!email){fieldErr($('#lgEmail',body),'Enter your email first');authFail();return}from='signin';sendCode('reset','reset')};
  var lf=$('#lgForm',body);if(lf)lf.onsubmit=function(e){e.preventDefault();email=$('#lgEmail',body).value.trim();if(!/^\S+@\S+\.\S+$/.test(email)){fieldErr($('#lgEmail',body),'Please enter a valid email');authFail();return}if(!$('#lgTc',body).checked){toast('Please tick the Terms & Conditions box');return}
   if(usePw){var gob=$('#lgGo',body);gob&&(gob.disabled=true);api('/api/auth/login',{email:email,password:$('#lgPw',body).value}).then(function(r){gob&&(gob.disabled=false);if(r.ok===false){if(r.reason==='no_account'||r.reason==='no_password'){usePw=false;from='signin';sendCode('login','code',gob,r.reason==='no_account'?'No account with this email yet — we’ve sent a code to create one':'This account has no password yet — we’ve emailed you a sign-in code');return}if(/wrong email or password/i.test(r.error||'')){fieldErr($('#lgPw',body),'Wrong email or password')}else toast(r.error);authFail();return}toast('Signed in ✓');authDone()});return}from='signin';sendCode('login','code',$('#lgGo',body))};
  var sf=$('#suForm',body);if(sf)sf.onsubmit=function(e){e.preventDefault();name=$('#suName',body).value.trim();email=$('#suEmail',body).value.trim();if(!name){fieldErr($('#suName',body),'Please enter your name');authFail();return}if(!/^\S+@\S+\.\S+$/.test(email)){fieldErr($('#suEmail',body),'Please enter a valid email');authFail();return}if(!$('#lgTc',body).checked){toast('Please tick the Terms & Conditions box');return}from='signup';sendCode('login','code',$('#suGo',body))};
  var cf=$('#codeForm',body);if(cf)cf.onsubmit=function(e){e.preventDefault();if(cf.dataset.busy==='1')return;var code=$('#lgCode',body).value.replace(/\D/g,'');if(code.length!==6){fieldErr($('#lgCode',body),'Enter the 6-digit code');authFail();return}
   cf.dataset.busy='1';var verifyStage=stage;if(stage==='code')api('/api/auth/verify',{email:email,code:code,name:name,tc:true}).then(function(r){if(r.ok===false){cf.dataset.busy='0';if(stage!==verifyStage)return;fieldErr($('#lgCode',body),codeMsg(r.error));authFail();return}if(stage!==verifyStage)return;if(r.isNew&&!name){toast('Account created ✓');stage='newname';codeNote='';draw();setTimeout(function(){var n=$('#nmName',body);n&&n.focus()},120);return}toast(r.isNew?'Account created ✓':'Signed in ✓');authDone()});
   else api('/api/auth/reset',{email:email,code:code,password:$('#np1',body).value,confirm:$('#np2',body).value}).then(function(r){if(r.ok===false){cf.dataset.busy='0';if(stage!==verifyStage)return;var er=r.error||'';if(/code/i.test(er))fieldErr($('#lgCode',body),codeMsg(er));else if(/match/i.test(er))fieldErr($('#np2',body),er);else fieldErr($('#np1',body),er);authFail();return}if(stage!==verifyStage)return;toast('Password changed ✓');authDone()})};
  var lc=$('#lgCode',body);if(lc)lc.addEventListener('input',function(){lc.value=lc.value.replace(/\D/g,'').slice(0,6);if(lc.value.length===6&&stage==='code')cf.requestSubmit&&cf.requestSubmit()});
  var rs=$('#resend',body);if(rs)rs.onclick=function(){sendCode(stage==='reset'?'reset':'login',stage)};
  var bk=$('#back',body);if(bk)bk.onclick=function(){codeNote='';stage=from;draw()};
  var nf=$('#nmForm',body);if(nf)nf.onsubmit=function(e){e.preventDefault();var v=$('#nmName',body).value.trim();if(!v){fieldErr($('#nmName',body),'Please enter your name, or tap Skip');return}var g=$('#nmGo',body);g.disabled=true;api('/api/me/profile',{name:v}).then(function(r){g.disabled=false;if(r.ok===false){toast(r.error);return}name=v;authDone()})};
  var ns=$('#nmSkip',body);if(ns)ns.onclick=function(){authDone()}}
 JCL.openLogin=function(tab,keep){stage=tab||'signin';draw();if(!m.classList.contains('on'))JC_UI.open(m)};
 draw()}
JCL.account=function(){var u=JCL.user,m=$('#loginModal'),body=$('.modal-body',m);unauth(m);body.dataset.stage='account';
 body.innerHTML='<div class="lg-brand grad-text shine">JANGID CUTS</div><p style="margin:10px 0 4px;font-weight:700">'+esc(u.name||'')+'</p><p style="color:var(--muted);font-size:14px">'+esc(u.email)+'</p><div style="display:grid;gap:10px;margin-top:18px">'+
 (u.isAdmin?'<a class="btn btn-primary" href="/admin">'+ICON('shield')+' Admin panel</a>':'')+'<a class="btn btn-ghost" href="/soon.html#orders">'+ICON('bag')+' My orders &amp; downloads</a><a class="btn btn-ghost" href="/soon.html#tickets">'+ICON('doc')+' My tickets</a><button class="btn btn-ghost" id="lo">'+ICON('logout')+' Sign out</button></div>';
 $('#lo',body).onclick=function(){try{sessionStorage.removeItem('jc-welcomed')}catch(e){}api('/api/auth/logout',{}).then(function(){location.reload()})};JC_UI.open(m)};
JCL.setPref=function(k,v){try{localStorage.setItem('jc-'+k,String(v))}catch(e){}if(JCL.user){var o={};o[k]=v;api('/api/me/profile',o)}};

function syncSettings(){try{var l=localStorage.getItem('jc-lang'),cu=localStorage.getItem('jc-currency'),n=localStorage.getItem('jc-email_notif');var u=JCL.user;
 if(u){cu=u.currency;n=String(u.email_notif);if(!l&&u.lang&&u.lang!=='en'&&window.JC_I18N)JC_I18N.set(u.lang)}
 if(cu&&$('#curSel'))$('#curSel').selectedIndex=cu==='USD'?1:0;if(n!=null&&$('#notifSwitch'))$('#notifSwitch').setAttribute('aria-checked',n==='false'?'false':'true')}catch(e){}}

function avatar(){var u=JCL.user,av=$('#dpAv'),dp=$('#dProfile');var p=location.pathname.replace(/\/$/,'')||'/';$$('.mainnav a,.subnav a').forEach(function(a){var h=a.getAttribute('href');var on=h==='/'?p==='/'||p==='/index.html':p.indexOf(h)===0;if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 if(!dp)return;if(!u){dp.onclick=function(e){e.preventDefault();JC_UI.close&&JC_UI.close();setTimeout(function(){JC_UI.open($('#loginModal'))},250)};return}
 av.innerHTML=u.avatar?'<img src="'+esc(u.avatar)+'" alt="">':esc((u.name||u.email).trim()[0].toUpperCase());$('#dpName').textContent=u.name||'My profile';$('#dpSub').textContent=u.email;
 if(u.isAdmin){$('#dAdmin').innerHTML='<a class="d-link d-admin" href="/admin"><span class="d-ic">'+ICON('shield')+'</span><span class="d-tx">Admin Panel<small>Client Desk, edits, orders</small></span>'+ICON('right').replace('class="icon"','class="icon d-chev"')+'</a>'}}

var dataReady=function(){if(window.JC_DATA_READY)return;window.JC_DATA_READY=1;try{D.dispatchEvent(new Event('jc:data'))}catch(e){}};setTimeout(dataReady,6000);
 Promise.all([api('/api/site'),api('/api/me')]).then(function(r){dataReady();var s=r[0],me=r[1];
 if(!s||!s.content){endEntry();var sc=D.createElement('script');sc.src='data.js';sc.onload=function(){window.JC_RUN()};D.body.appendChild(sc);return}
 JCL.site=s;JCL.c=s.content;JCL.user=me&&me.user;JCL.me=me&&me.user?me:null;window.JC=buildJC(s);
 try{applyHome(s.content,s);applyFooter(s.content);applyHelp(s.content);applySoon(s.content,s);applyHireForm(s.content);buildLogin(s)}catch(e){console.error(e)}
 window.JC_RUN();avatar();syncSettings();
 try{window.JC_AFTER&&window.JC_AFTER(s,me)}catch(e){console.error(e)}
 try{ads(s.content);welcome(s.content);var hq=new URLSearchParams(location.search);if(hq.get('hire')==='1'){hq.delete('hire');try{history.replaceState(history.state,'',location.pathname+(hq.toString()?'?'+hq:'')+location.hash)}catch(e){}var hb=$('#hireBtn');hb&&setTimeout(function(){hb.click()},800)}}catch(e){console.error(e)}
 var eq=new URLSearchParams(location.search),err=eq.get('error');if(err){eq.delete('error');try{history.replaceState(history.state,'',location.pathname+(eq.toString()?'?'+eq:'')+location.hash)}catch(e){}}if(err)setTimeout(function(){toast({google:'Google sign-in failed, please try again',cancelled:'Sign-in cancelled',google_not_ready:'Google sign-in is not ready yet. Please use email for now.'}[err]||'Sign-in problem: '+err)},2300);
 
 if('serviceWorker' in navigator){var swReg=function(){setTimeout(function(){navigator.serviceWorker.register('/sw.js').catch(function(){})},3500)};if(D.readyState==='complete')swReg();else addEventListener('load',swReg,{once:true})}/* offline cache warms up after the page has painted, so it never competes with the first load on slow networks */
 api('/api/t',{p:location.pathname+(location.pathname.indexOf('soon')>-1?location.hash:'')})});
})();
