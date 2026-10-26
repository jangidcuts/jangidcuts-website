(function(){'use strict';
var D=document,$=function(s,r){return (r||D).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ICON(n){return '<svg class="icon" aria-hidden="true"><use href="#i-'+n+'"/></svg>'}
function api(path,body,method){return fetch(path,{method:method||(body?'POST':'GET'),credentials:'same-origin',headers:body?{'content-type':'application/json','x-jc':'1'}:{'x-jc':'1'},body:body?JSON.stringify(body):undefined})
 .then(function(r){return r.json().catch(function(){return{ok:false,error:'Network error'}})}).catch(function(){return{ok:false,error:'You seem to be offline. Please try again.'}})}
function md(t){var out=[],list=false;String(t||'').split(/\n/).forEach(function(l){var s=l.trim();
 if(/^##\s+/.test(s)){if(list){out.push('</ul>');list=false}out.push('<h3 class="h-md grad-text" style="margin:26px 0 10px">'+esc(s.replace(/^##\s+/,''))+'</h3>')}
 else if(/^[-•]\s+/.test(s)){if(!list){out.push('<ul style="margin:0 0 14px 20px">');list=true}out.push('<li>'+esc(s.replace(/^[-•]\s+/,''))+'</li>')}
 else if(!s){if(list){out.push('</ul>');list=false}out.push('')}
 else{if(list){out.push('</ul>');list=false}out.push('<p style="margin:0 0 14px">'+esc(s)+'</p>')}});if(list)out.push('</ul>');
 return out.join('\n').replace(/<\/p>\n<p style="margin:0 0 14px">/g,'</p>\n<p style="margin:0 0 14px">')}
var JCL=window.JCL={c:null,user:null,site:null};
function toast(m){window.JC_UI&&JC_UI.toast?JC_UI.toast(m):alert(m)}

/* ---------- data → v3 page format ---------- */
function buildJC(s){var cats=s.categories,cn=function(id){var x=cats.find(function(c){return c.id===id});return x?x.name:''};
 function lib(kind){var sec='portfolio_'+kind,items=s.portfolio.filter(function(p){return p.kind===kind});var catMap={};
  cats.filter(function(c){return c.section===sec&&!c.parent_id}).forEach(function(c){catMap[c.name]=cats.filter(function(x){return x.parent_id===c.id}).map(function(x){return x.name})});
  var L=items.map(function(p){return{t:p.title,c:cn(p.category_id),s:cn(p.subcategory_id),img:p.image,o:p.orient||'h',clip:p.video||'',url:p.url||'',d:p.description||'',featured:!!p.featured,home:!!p.home}});
  var rows=((s.content.portfolio_rows||{})[kind]||[]).map(function(r){if(r.source==='featured')return{title:r.title,auto:!!r.auto,note:r.auto?'auto-scrolls':'',pick:L.map(function(x,i){return x.featured?i:-1}).filter(function(i){return i>=0})};
   return{title:r.title,auto:!!r.auto,note:r.auto?'auto-scrolls':'',c:String(r.source||'').replace(/^cat:/,'')}}).filter(function(r){return r.pick?r.pick.length:L.some(function(x){return x.c===r.c})});
  var feature=L.map(function(x,i){return x.featured?{t:x.t,d:x.d||x.c,img:x.img,i:i}:null}).filter(Boolean).slice(0,5);
  return{cats:catMap,items:L,rows:rows,feature:feature}}
 var v=lib('video');
 return{video:v,thumb:lib('thumb'),services:(s.content.services||[]).map(function(x){return{t:x.title,d:x.desc,img:x.image}}),homeItems:v.items.filter(function(x){return x.home})}}

function applyHome(c,s){var h=c.hero;
 var bw=$('.bigword');if(bw&&!$('.pf-hero')){var w=(c.brand.bigword||'JANGID CUTS').split(' ');bw.innerHTML=w.map(function(x){return '<span class="bw-line">'+esc(x)+'</span>'}).join(' ')}
 var hl=$('.hello-line');if(hl)hl.textContent=h.hello;var hn=$('#heroName .shine');if(hn)hn.textContent=h.name;
 var hr=$('.hero-role');if(hr)hr.innerHTML=esc(h.role).replace(/&amp;/,'<i>&amp;</i>');
 var hb=$('#hireBtn');if(hb)hb.firstChild.nodeValue=h.cta+' ';
 var ph=$('.hero-photo');if(ph){if(h.photo&&ph.getAttribute('src')!==h.photo)ph.src=h.photo;ph.alt=h.photo_alt||'';ph.style.filter=h.bw?'grayscale(1) contrast(1.12)':'none';if(h.zoom&&+h.zoom!==100)ph.style.transform='scale('+(+h.zoom/100)+')';if(+h.shift_y)ph.style.marginTop=(+h.shift_y)+'px'}
 var home=c.home;
 var st=$('.stats');if(st){st.closest('section').hidden=!home.show_stats;st.innerHTML=(c.stats||[]).map(function(x){return '<div class="stat rv"><div class="stat-ic">'+ICON(x.icon||'star')+'</div><div><div class="stat-num grad-text" data-count="'+(+x.num||0)+'">'+(+x.num||0)+esc(x.suffix||'')+'</div><div class="stat-lbl">'+esc(x.label)+'</div></div></div>'}).join('')}
 var work=$('#work');if(work){work.hidden=!home.show_work;$('#work .eyebrow').textContent=home.work_eyebrow;$('#workTitle').textContent=home.work_title;var wb=$('#work .sec-head .btn');if(wb)wb.firstChild.nodeValue=home.work_btn+' '}
 var sv=$('#services');if(sv){sv.hidden=!home.show_services;$('#services .eyebrow').textContent=home.svc_eyebrow;$('#svcTitle').textContent=home.svc_title;
  $('.svc-grid').innerHTML=(c.services||[]).map(function(x){return '<article class="svc rv"><div class="svc-thumb"><img src="'+esc(x.image)+'" alt="" loading="lazy">'+(x.tag?'<span class="tag">'+esc(x.tag)+'</span>':'')+'</div><div class="svc-body"><h3>'+esc(x.title)+'</h3><p>'+esc(x.desc)+'</p>'+(x.price_from?'<p style="color:var(--mint);font-weight:700;margin-top:-4px">From '+esc(x.price_from)+'</p>':'')+'<a class="more" href="#" data-hire>'+esc(home.svc_link||'Get a quote')+' '+ICON('arrow')+'</a></div></article>'}).join('')}
 var rv=$('#reviews');if(rv){rv.hidden=!home.show_reviews;$('#reviews .eyebrow').textContent=home.rev_eyebrow;$('#revTitle').textContent=home.rev_title;
  var list=s.reviews.filter(function(r){return !r.product_id}).sort(function(a,b){return b.featured-a.featured}).slice(0,6);
  var star=function(n){var o='';for(var i=0;i<5;i++)o+='<svg class="'+(i<n?'':'off')+'" aria-hidden="true"'+(i<n?'':' style="opacity:.25"')+'><use href="#i-star"/></svg>';return o};
  var ini=function(n){return String(n||'?').split(/\s+/).map(function(w){return w[0]}).join('').slice(0,2).toUpperCase()};
  var avg=s.reviewStats.avg||5;$('.rev-score .big').textContent=avg.toFixed?avg.toFixed(1):avg;$('.rev-score .stars').innerHTML=star(Math.round(avg));$('.rev-score .lead').textContent=(home.rev_note||'Average from client reviews')+' ('+s.reviewStats.count+')';
  $('.rev-list').innerHTML=list.map(function(r){return '<article class="rev rv"><div class="stars" aria-label="'+r.rating+' out of 5 stars">'+star(r.rating)+'</div><p>“'+esc(r.text)+'”</p><div class="rev-who"><i>'+esc(ini(r.name))+'</i><div><b>'+esc(r.name)+'</b><span>'+esc(r.role||'')+'</span></div></div></article>'}).join('')}
 var lb=$('.l-brand');if(lb){var t=(c.brand.bigword||'JANGID CUTS');lb.innerHTML=t.split('').map(function(ch,i){return '<span style="animation-delay:'+(i*55)+'ms">'+(ch===' '?'&nbsp;':esc(ch))+'</span>'}).join('')}
 var lr=$('.l-role');if(lr)lr.textContent=c.brand.loader_role||h.role;
 var br=$('.brand');if(br)br.textContent=c.brand.name||'Jangid Cuts';
 if(c.seo&&c.seo.title&&/index|^\/$/.test(location.pathname+'')){D.title=c.seo.title}}

function applyFooter(c){var f=$('.footer');if(!f)return;var p=$('.foot-grid > div:first-child p',f);if(p)p.textContent=c.footer.about;
 var so=$('.socials',f);if(so)so.innerHTML=(c.socials||[]).map(function(x){return '<a href="'+esc(x.url)+'" aria-label="'+esc(x.name)+'" rel="noopener" target="_blank">'+ICON(x.icon||'globe')+'</a>'}).join('');
 var cp=$('.copy span',f);if(cp)cp.textContent=String(c.footer.copyright||'').replace('{year}',new Date().getFullYear());var mi=$$('.copy span',f)[1];if(mi)mi.textContent=c.footer.made_in;
 }

function applyHelp(c){var fq=$('#faq');if(fq)fq.innerHTML=(c.faq||[]).map(function(x,i){return '<details'+(i===0?' open':'')+'><summary>'+esc(x.q)+'</summary><p>'+esc(x.a)+'</p></details>'}).join('');
 var t=$('#helpTitle');if(t)t.textContent=c.help.title;var it=$('#issue h3');if(it)it.textContent=c.help.issue_title;var inote=$('#issue p');if(inote)inote.textContent=c.help.issue_note;
 var f=$('#issue form');if(f){f.removeAttribute('data-demo-form');
  f.addEventListener('submit',function(e){e.preventDefault();if(!f.checkValidity()){f.reportValidity();return}var b=f.querySelector('button');b.disabled=true;
   api('/api/tickets',{email:$('#isEmail').value,message:$('#isMsg').value,tc:f.querySelector('input[type=checkbox]').checked,website:''}).then(function(r){b.disabled=false;
    if(!r.ok){toast(r.error||'Could not send');return}toast(String(c.help.thanks||'Ticket {number} created').replace('{number}',r.number));f.reset()})})}}

function applySoon(c,s){var t=$('#soonTitle');if(!t)return;var key=((location.pathname.replace(/^\/|\/$/g,'')!=='soon'&&location.pathname.replace(/^\/|\/$/g,'').indexOf('.html')<0&&location.pathname.replace(/^\/|\/$/g,''))||(location.hash||'').slice(1)).replace(/-/g,'_');var sec=t.closest('section'),lead=$('.lead',sec),eb=$('.eyebrow',sec);
 var pages=c.pages||{};eb.textContent='Jangid Cuts';
 function prose(html){lead.outerHTML='<div class="prose" style="text-align:left;max-width:72ch;margin:22px auto 26px;color:var(--muted);font-size:16px;line-height:1.7">'+html+'</div>'}
 if(key==='terms'){var tt=pages.terms;t.textContent=tt.title;prose(tt.sections.map(function(x){return '<h3 class="h-md grad-text" id="'+esc(x.id)+'" style="margin:26px 0 10px">'+esc(x.title)+'</h3>'+md(x.body)}).join(''));return}
 if(pages[key]){t.textContent=pages[key].title;prose(md(pages[key].body)+(key==='support'?'<p><a class="btn btn-primary" href="help.html#issue">'+esc(c.help.issue_title)+'</a></p>':''));return}
 if(key==='contact'){var k=c.contact;t.textContent=k.title;var wa=String(k.whatsapp||'').replace(/\D/g,'');
  var cards=[[k.whatsapp,'wa','WhatsApp','https://wa.me/'+wa],[k.call,'phone','Call','tel:'+String(k.call).replace(/\s/g,'')],[k.instagram_dm,'ig','Instagram DM',k.instagram_dm],[k.email,'mail','Email','mailto:'+k.email],[k.telegram,'tg','Telegram',k.telegram]].filter(function(x){return x[0]});
  prose(md(k.intro)+'<div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));margin-top:18px">'+cards.map(function(x){return '<a class="panel" style="display:flex;gap:12px;align-items:center;padding:16px" href="'+esc(x[3])+'" target="_blank" rel="noopener">'+ICON(x[1])+'<span><b style="color:var(--text)">'+esc(x[2])+'</b><br><small>'+esc(x[1]==='wa'||x[1]==='phone'?x[0]:x[2]==='Email'?x[0]:'Open')+'</small></span></a>'}).join('')+'</div><p style="margin-top:14px"><small>'+esc(k.hours||'')+'</small></p>');return}
 if(key==='social'){t.textContent='Social';prose('<p>Follow us on other social media platforms:</p><div style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));margin-top:14px">'+(c.socials||[]).map(function(x){return '<a class="panel" style="display:flex;gap:12px;align-items:center;padding:16px" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+ICON(x.icon||'globe')+'<span><b style="color:var(--text)">'+esc(x.name)+'</b><br><small>'+esc(x.handle||'')+'</small></span></a>'}).join('')+'</div>');return}
 var nm={store:'Store',orders:'My Orders',tickets:'My Tickets',profile:'My Profile'}[key]||'This page';t.textContent=nm;lead.textContent=nm+' opens very soon.';}

function applyHireForm(c){var cl=$('#catList');if(!cl)return;cl.innerHTML=(c.hire_form.categories||[]).map(function(x){return '<button type="button" class="chip" aria-pressed="false">'+esc(x)+'</button>'}).join('')}
JCL.submitHire=function(f){var q=function(s){var el=$(s,f);return el?el.value:''};var single=function(n){var b=$('[data-single="'+n+'"] .chip[aria-pressed=true]',f);return b?(b.dataset.v==='custom'?q('#perdayCustom'):b.textContent):''};
 var agency=$('[data-single=agency] .chip[aria-pressed=true]',f);
 var body={name:q('#hName'),email:q('#hEmail'),whatsapp:q('#hWa'),country:q('#hCountry'),agency:agency&&agency.dataset.v==='yes'?'Yes':'No',agency_name:q('#hAg'),agency_address:q('#hAgAddr'),
  categories:$$('#catList .chip[aria-pressed=true]',f).map(function(b){return b.textContent}),category_other:q('#catOther'),perday:single('perday'),format:single('format'),plan:single('plan'),
  budget:q('#hBudget'),deadline:q('#hDate'),raw_link:q('#hRaw'),reference:q('#hRef'),project:q('#hDesc'),tc:!!($('#hTc',f)||{}).checked,website:''};
 return api('/api/hire',body)};

/* ---------- login modal ---------- */
function buildLogin(s){var m=$('#loginModal');if(!m)return;var body=$('.modal-body',m);var email='',stage='email';
 function draw(){var h='<div class="lg-brand grad-text shine" id="loginTitle">JANGID CUTS</div><p class="lead" style="margin:0 auto;font-size:14.5px">Sign in to buy packs, download your purchases and track your tickets.</p>';
  if(stage==='email'){h+=(s.cfg.google?'<button class="g-btn" type="button" id="gBtn">'+ICON('g')+' Continue with Google</button><div class="or">OR</div>':'<div style="height:16px"></div>')+
   '<form id="lgForm" novalidate><div class="field" style="text-align:left"><label for="lgEmail">Email</label><input class="input" id="lgEmail" type="email" placeholder="you@example.com" autocomplete="email" required value="'+esc(email)+'"></div>'+
   '<div class="field hidden" id="pwWrap" style="text-align:left"><label for="lgPw">Password</label><input class="input" id="lgPw" type="password" autocomplete="current-password"></div>'+
   '<label class="check" style="text-align:left"><input type="checkbox" id="lgTc"> <span>I have read the <a class="tc-link" href="/terms" target="_blank">Terms &amp; Conditions</a></span></label>'+
   '<button class="btn btn-primary" style="width:100%" type="submit" id="lgGo">Send login code</button></form><p style="margin-top:12px;font-size:13.5px"><button class="tc-link" type="button" id="usePw">Use password instead</button> · <button class="tc-link" type="button" id="forgot">Forgot password?</button></p>'}
  else if(stage==='code'||stage==='reset'){h+='<form id="codeForm" novalidate style="margin-top:16px"><p style="font-size:14px;color:var(--muted)">We sent a 6-digit code to <b>'+esc(email)+'</b></p><div class="field" style="text-align:left"><label for="lgCode">Code</label><input class="input" id="lgCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required></div>'+
   (stage==='code'?'<div class="field" style="text-align:left"><label for="lgName">Your name <span class="opt">(new accounts)</span></label><input class="input" id="lgName" autocomplete="name"></div>':'<div class="field" style="text-align:left"><label for="np1">New password</label><input class="input" id="np1" type="password" autocomplete="new-password"></div><div class="field" style="text-align:left"><label for="np2">Confirm new password</label><input class="input" id="np2" type="password" autocomplete="new-password"></div>')+
   '<button class="btn btn-primary" style="width:100%" type="submit">'+(stage==='code'?'Sign in':'Set password &amp; sign in')+'</button></form><p style="margin-top:12px;font-size:13.5px"><button class="tc-link" type="button" id="back">Use a different email</button></p>'}
  body.innerHTML=h;
  var gb=$('#gBtn',body);if(gb)gb.onclick=function(){if(!$('#lgTc',body).checked){toast('Please tick the Terms & Conditions box');return}location.href='/auth/google/start?tc=1&next='+encodeURIComponent(location.pathname+location.hash)};
  var usePw=$('#usePw',body);if(usePw)usePw.onclick=function(){var w=$('#pwWrap',body);w.classList.toggle('hidden');$('#lgGo',body).textContent=w.classList.contains('hidden')?'Send login code':'Sign in';usePw.textContent=w.classList.contains('hidden')?'Use password instead':'Email me a code instead'};
  var fg=$('#forgot',body);if(fg)fg.onclick=function(){email=$('#lgEmail',body).value.trim();if(!email){toast('Enter your email first');return}api('/api/auth/otp',{email:email,purpose:'reset'}).then(function(r){if(r.ok===false){toast(r.error);return}stage='reset';draw()})};
  var lf=$('#lgForm',body);if(lf)lf.onsubmit=function(e){e.preventDefault();email=$('#lgEmail',body).value.trim();if(!/^\S+@\S+\.\S+$/.test(email)){toast('Please enter a valid email');return}
   if(!$('#lgTc',body).checked){toast('Please tick the Terms & Conditions box');return}var pw=$('#lgPw',body).value;var usingPw=!$('#pwWrap',body).classList.contains('hidden');
   if(usingPw){api('/api/auth/login',{email:email,password:pw}).then(function(r){if(r.ok===false){toast(r.error);return}location.reload()});return}
   $('#lgGo',body).disabled=true;api('/api/auth/otp',{email:email,purpose:'login',tc:true}).then(function(r){$('#lgGo',body)&&($('#lgGo',body).disabled=false);if(r.ok===false){toast(r.error);return}stage='code';draw();toast('Code sent — check your email')})};
  var cf=$('#codeForm',body);if(cf)cf.onsubmit=function(e){e.preventDefault();var code=$('#lgCode',body).value;
   if(stage==='code')api('/api/auth/verify',{email:email,code:code,name:$('#lgName',body).value,tc:true}).then(function(r){if(r.ok===false){toast(r.error);return}location.reload()});
   else api('/api/auth/reset',{email:email,code:code,password:$('#np1',body).value,confirm:$('#np2',body).value}).then(function(r){if(r.ok===false){toast(r.error);return}toast('Password changed ✓');setTimeout(function(){location.reload()},800)})};
  var bk=$('#back',body);if(bk)bk.onclick=function(){stage='email';draw()}}
 draw()}
JCL.account=function(){var u=JCL.user,m=$('#loginModal'),body=$('.modal-body',m);
 body.innerHTML='<div class="lg-brand grad-text shine">JANGID CUTS</div><p style="margin:10px 0 4px;font-weight:700">'+esc(u.name||'')+'</p><p style="color:var(--muted);font-size:14px">'+esc(u.email)+'</p><div style="display:grid;gap:10px;margin-top:18px">'+
 (u.isAdmin?'<a class="btn btn-primary" href="/admin">'+ICON('shield')+' Admin panel</a>':'')+'<a class="btn btn-ghost" href="/soon.html#orders">'+ICON('bag')+' My orders &amp; downloads</a><a class="btn btn-ghost" href="/soon.html#tickets">'+ICON('doc')+' My tickets</a><button class="btn btn-ghost" id="lo">'+ICON('logout')+' Sign out</button></div>';
 $('#lo',body).onclick=function(){api('/api/auth/logout',{}).then(function(){location.reload()})};JC_UI.open(m)};
JCL.setPref=function(k,v){try{localStorage.setItem('jc-'+k,String(v))}catch(e){}if(JCL.user){var o={};o[k]=k==='lang'?(JCL.c.languages||[])[v]||'en':v;api('/api/me/profile',o)}};

function syncSettings(){try{var l=localStorage.getItem('jc-lang'),cu=localStorage.getItem('jc-currency'),n=localStorage.getItem('jc-email_notif');var u=JCL.user;
 if(u){cu=u.currency;n=String(u.email_notif);var li=(JCL.c.languages||[]).indexOf(u.lang);if(li>=0)l=li}
 if(l!=null&&$('#langSel'))$('#langSel').selectedIndex=+l;if(cu&&$('#curSel'))$('#curSel').selectedIndex=cu==='USD'?1:0;if(n!=null&&$('#notifSwitch'))$('#notifSwitch').setAttribute('aria-checked',n==='false'?'false':'true')}catch(e){}}

function avatar(){var u=JCL.user,a=$('#openLogin .avatar');if(!u||!a)return;a.innerHTML=u.avatar?'<img src="'+esc(u.avatar)+'" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">':esc((u.name||u.email).trim()[0].toUpperCase());$('#openLogin').setAttribute('aria-label','Your account')}

Promise.all([api('/api/site'),api('/api/me')]).then(function(r){var s=r[0],me=r[1];
 if(!s||!s.content){var sc=D.createElement('script');sc.src='data.js';sc.onload=function(){window.JC_RUN()};D.body.appendChild(sc);return}
 JCL.site=s;JCL.c=s.content;JCL.user=me&&me.user;window.JC=buildJC(s);
 try{applyHome(s.content,s);applyFooter(s.content);applyHelp(s.content);applySoon(s.content,s);applyHireForm(s.content);buildLogin(s)}catch(e){console.error(e)}
 window.JC_RUN();avatar();syncSettings();
 try{window.JC_AFTER&&window.JC_AFTER(s,me)}catch(e){console.error(e)}
 var err=new URLSearchParams(location.search).get('error');if(err)setTimeout(function(){toast({google:'Google sign-in failed, please try again',cancelled:'Sign-in cancelled',google_not_ready:'Google sign-in is being set up — use email for now'}[err]||'Sign-in problem: '+err)},2300);
 if(location.hash==='#issue'||location.hash==='#faq'){var el=$(location.hash);el&&setTimeout(function(){el.scrollIntoView()},2200)}
 if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(function(){});
 api('/api/t',{p:location.pathname+(location.pathname.indexOf('soon')>-1?location.hash:'')})});
})();
