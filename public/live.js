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
  var list=s.reviews.filter(function(r){return !r.product_id}).sort(function(a,b){return b.featured-a.featured}).slice(0,6);
  var star=function(n){var o='';for(var i=0;i<5;i++)o+='<svg class="'+(i<n?'':'off')+'" aria-hidden="true"'+(i<n?'':' style="opacity:.25"')+'><use href="#i-star"/></svg>';return o};
  var ini=function(n){return String(n||'?').split(/\s+/).map(function(w){return w[0]}).join('').slice(0,2).toUpperCase()};
  var avg=s.reviewStats.avg||5;$('.rev-score .big').textContent=avg.toFixed?avg.toFixed(1):avg;$('.rev-score .stars').innerHTML=star(Math.round(avg));$('.rev-score .lead').textContent=(home.rev_note||'Average from client reviews')+' ('+s.reviewStats.count+')';
  $('.rev-list').innerHTML=list.map(function(r){return '<article class="rev rv"><div class="stars" aria-label="'+r.rating+' out of 5 stars">'+star(r.rating)+'</div><p>“'+esc(r.text)+'”</p><div class="rev-who"><i>'+(r.photo?'<img src="'+esc(r.photo)+'" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">':esc(ini(r.name)))+'</i><div><b>'+esc(r.name)+'</b><span>'+esc(r.role||'')+'</span></div></div></article>'}).join('')}
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
function tkTimeline(t){return '<div class="tk-card"><div class="tk-head"><div><small>'+(t.items?'Order':/HIRE/.test(t.number)?'Request':'Ticket')+'</small><b>'+esc(t.number)+'</b></div><span class="tk-pill tk-'+esc(t.status)+'">'+esc(t.items?t.label:(TK_LABEL[t.status]||t.label||t.status))+'</span></div>'+
 '<ol class="tk-steps">'+(t.steps||[]).map(function(s){return '<li class="'+(s.done?'done':'')+(s.current?' cur':'')+'"><span class="tk-dot">'+(s.done?ICON('check'):'')+'</span><div><b>'+esc(s.label||TK_LABEL[s.s])+'</b><small>'+(s.at?esc(fdt(s.at)):(s.done?'':'Waiting'))+'</small></div></li>'}).join('')+'</ol>'+
 '<div class="tk-meta"><span><small>'+(t.items?'Items':'Category')+'</small>'+esc(t.items?t.items.join(', '):(t.topic||'General'))+'</span><span><small>'+(t.items?'Placed':'Raised')+'</small>'+esc(fdt(t.created))+'</span>'+(t.email?'<span><small>Email</small>'+esc(t.email)+'</span>':'')+'</div>'+
 (t.message?'<details class="tk-msg"><summary>Your message</summary><p>'+esc(t.message)+'</p></details>':'')+
 (t.solution?'<div class="tk-sol"><b>Solution</b><p>'+esc(t.solution)+'</p></div>':'')+'</div>'}
JCL.tkTimeline=tkTimeline;
function normRef(type,s){var t=String(s||'').toUpperCase().replace(/\s+/g,'').replace(/_/g,'-');if(/^\d{4,9}$/.test(t))return 'JC-'+type+'-'+t;var m=t.match(/^(?:JC-?)?([A-Z]{2,4})-?([A-Z0-9]{4,9})$/);return m?'JC-'+m[1]+'-'+m[2]:t}
JCL.normRef=normRef;
function helpView(){var p=location.pathname.replace(/\/$/,'');if(p==='/support')return 'support';if(p==='/track')return 'track';if(p==='/track-order')return 'order';if(/^\/help(\.html)?$/.test(p)&&location.hash==='#issue')return 'support';return 'faq'}
function applyHelp(c){var page=$('.help-page');if(!page)return;var view=helpView();
 if(view==='support'&&location.pathname.indexOf('/support')!==0){history.replaceState(null,'','/support')}
 $$('.hp-view',page).forEach(function(v){v.hidden=v.getAttribute('data-view')!==view});
 D.title=({faq:'FAQ',support:'Support',track:'Track request',order:'Track order'})[view]+' | Jangid Cuts';
 var h=c.help||{};
 var fq=$('#faq');if(fq&&c.faq)fq.innerHTML=(c.faq||[]).map(function(x,i){return '<details'+(i===0?' open':'')+'><summary>'+esc(x.q)+'</summary><p>'+esc(x.a)+'</p></details>'}).join('');
 var t=$('#helpTitle');if(t&&h.title)t.textContent=h.title;
 var sp=(c.pages||{}).support;if(sp&&$('#supTitle')){$('#supTitle').textContent=sp.title||'Support';if(sp.body)$('#supIntro').textContent=sp.body}
 var it=$('#issue h3');if(it&&h.issue_title)it.textContent=h.issue_title;var inote=$('#issue .is-note');if(inote&&h.issue_note)inote.textContent=h.issue_note;
 var mb=$('#supMailBox');if(mb&&!mb.innerHTML)mb.innerHTML=supMail(c);
 var f=$('#issueForm');if(f&&!f._b){f._b=1;if(JCL.user&&$('#isEmail'))$('#isEmail').value=JCL.user.email;
  f.addEventListener('submit',function(e){e.preventDefault();var em=$('#isEmail'),ms=$('#isMsg'),tc=$('#isTc');$$('.fld-err',f).forEach(function(x){x.remove()});$$('.is-err',f).forEach(function(x){x.classList.remove('is-err')});
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())){fieldErr(em,'Please enter a valid email');return}
   if(ms.value.trim().length<5){fieldErr(ms,'Please describe the problem');return}
   if(!tc.checked){toast('Please accept the Terms & Conditions');return}
   var b=f.querySelector('button[type=submit]');b.disabled=true;
   api('/api/tickets',{email:em.value.trim(),topic:$('#isTopic').value,message:(($('#isOrd')&&$('#isOrd').value.trim())?'Order: '+normRef('ORD',$('#isOrd').value)+'\n\n':'')+ms.value,tc:true,website:''}).then(function(r){b.disabled=false;
    if(!r.ok){toast(r.error||'Could not send');return}
    var dn=$('#isDone');f.hidden=true;dn.hidden=false;dn.innerHTML='<div class="ok-ic">'+ICON('check')+'</div><h3>Ticket created</h3><p>Your ticket number is</p><div class="tk-num">'+esc(r.number)+'</div><p class="small">A confirmation is on its way to <b>'+esc(em.value.trim())+'</b> from supportjangidcuts@gmail.com. Keep this number to track your request.</p><div class="row-btns"><a class="btn btn-primary" href="/track?n='+encodeURIComponent(r.number)+'&e='+encodeURIComponent(em.value.trim())+'">Track request</a><button class="btn btn-ghost" type="button" id="isAgain">Raise another ticket</button></div>';
    $('#isAgain').onclick=function(){f.reset();if(JCL.user)em.value=JCL.user.email;dn.hidden=true;f.hidden=false};
    try{dn.scrollIntoView({block:'center',behavior:'smooth'})}catch(e){}})})}
 var tf=$('#trkForm');if(tf&&!tf._b){tf._b=1;var q=new URLSearchParams(location.search);if(q.get('n'))$('#trkNum').value=q.get('n');if(q.get('e'))$('#trkEmail').value=q.get('e').replace(/ /g,'+');else if(JCL.user)$('#trkEmail').value=JCL.user.email;
  var run=function(){var n=normRef('TKT',$('#trkNum').value),em=$('#trkEmail').value.trim(),er=$('#trkErr');er.hidden=true;$('#trkNum').classList.remove('is-err');$('#trkEmail').classList.remove('is-err');
   if(!/^JC-(TKT|HIRE)-[A-Z0-9]{4,9}$/.test(n)){$('#trkNum').classList.add('is-err');er.textContent='Enter your ticket number, like JC-TKT-100001 (or just 100001)';er.hidden=false;return}
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){$('#trkEmail').classList.add('is-err');er.textContent='Enter the email you used for the ticket';er.hidden=false;return}
   var b=tf.querySelector('button');b.disabled=true;
   api('/api/tickets/track',{number:n,email:em}).then(function(r){b.disabled=false;if(!r.ok){er.textContent=r.error||'Could not find it';er.hidden=false;$('#trkOut').innerHTML='';return}
    $('#trkOut').innerHTML=tkTimeline(r.ticket);try{history.replaceState(null,'','/track?n='+encodeURIComponent(n))}catch(e){}})};
  tf.addEventListener('submit',function(e){e.preventDefault();run()});if(q.get('n')&&$('#trkEmail').value)run()}

 var of=$('#trkOForm');if(of&&!of._b){of._b=1;var q2=new URLSearchParams(location.search);if(q2.get('n'))$('#trkONum').value=q2.get('n');if(q2.get('e'))$('#trkOEmail').value=q2.get('e').replace(/ /g,'+');else if(JCL.user)$('#trkOEmail').value=JCL.user.email;
  var runO=function(){var raw=$('#trkONum').value.trim(),n=/^\d+$/.test(raw)?raw:normRef('ORD',raw),em=$('#trkOEmail').value.trim(),er=$('#trkOErr');er.hidden=true;$('#trkONum').classList.remove('is-err');$('#trkOEmail').classList.remove('is-err');
   if(!/^(\d{4,9}|JC-(ORD|DL)-[A-Z0-9]{4,9})$/.test(n)){$('#trkONum').classList.add('is-err');er.textContent='Enter your order number, like JC-ORD-100001 (or just 100001)';er.hidden=false;return}
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){$('#trkOEmail').classList.add('is-err');er.textContent='Enter the email used for the order';er.hidden=false;return}
   var b=of.querySelector('button');b.disabled=true;
   api('/api/orders/track',{number:n,email:em}).then(function(r){b.disabled=false;if(!r.ok){er.textContent=r.error||'Could not find it';er.hidden=false;$('#trkOOut').innerHTML='';return}
    $('#trkOOut').innerHTML=tkTimeline(r.order);try{history.replaceState(null,'','/track-order?n='+encodeURIComponent(r.order.number))}catch(e){}})};
  of.addEventListener('submit',function(e){e.preventDefault();runO()});if(q2.get('n')&&$('#trkOEmail').value)runO()}
 var mine=$('#trkMine');if(mine&&JCL.me&&JCL.me.tickets&&JCL.me.tickets.length){mine.innerHTML='<h3 class="h-md grad-text" style="margin:28px 0 12px">Your tickets</h3>'+JCL.me.tickets.map(tkTimeline).join('')}
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

function applyHireForm(c){var cl=$('#catList');if(!cl)return;cl.innerHTML=(c.hire_form.categories||[]).map(function(x){return '<button type="button" class="chip" aria-pressed="false">'+esc(x)+'</button>'}).join('')}
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
 try{ads(s.content);welcome(s.content);if(new URLSearchParams(location.search).get('hire')==='1'){var hb=$('#hireBtn');hb&&setTimeout(function(){hb.click()},800)}}catch(e){console.error(e)}
 var err=new URLSearchParams(location.search).get('error');if(err)setTimeout(function(){toast({google:'Google sign-in failed, please try again',cancelled:'Sign-in cancelled',google_not_ready:'Google sign-in is not ready yet. Please use email for now.'}[err]||'Sign-in problem: '+err)},2300);
 
 if('serviceWorker' in navigator){var swReg=function(){setTimeout(function(){navigator.serviceWorker.register('/sw.js').catch(function(){})},3500)};if(D.readyState==='complete')swReg();else addEventListener('load',swReg,{once:true})}/* offline cache warms up after the page has painted, so it never competes with the first load on slow networks */
 api('/api/t',{p:location.pathname+(location.pathname.indexOf('soon')>-1?location.hash:'')})});
})();
