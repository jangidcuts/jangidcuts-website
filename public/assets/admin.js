(function(){'use strict';
var D=document,$=function(s,r){return (r||D).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function I(n){return '<svg aria-hidden="true"><use href="#i-'+n+'"/></svg>'}
var tT;function toast(m,bad){var t=$('#toast');t.textContent=m;t.className='toast on'+(bad?' err':'');clearTimeout(tT);tT=setTimeout(function(){t.className='toast'},3600)}
function api(path,opt){opt=opt||{};var h={'x-jc':'1'};var body=opt.body;
 if(body&&!(body instanceof Blob)&&!(body instanceof ArrayBuffer)&&typeof body!=='string'){h['content-type']='application/json';body=JSON.stringify(body)}
 if(opt.type)h['content-type']=opt.type;
 return fetch(path,{method:opt.method||(body?'POST':'GET'),headers:h,body:body,credentials:'same-origin'}).then(function(r){return r.json().catch(function(){return{ok:false,error:'Server error ('+r.status+')'}}).then(function(j){if(!r.ok&&j.ok!==false)j.ok=false;j._status=r.status;return j})})}
function req(path,opt){return api(path,opt).then(function(j){if(j.ok===false||j.error){toast(j.error||'Failed',true);throw j}return j})}
var fmtD=function(t){if(!t)return '—';var d=new Date(+t);return d.toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})};
var money=function(n){return '₹'+Number(n||0).toLocaleString('en-IN')};
var ST={me:null,content:null,cats:null,ov:null};

/* ---------- drawer dialog ---------- */
function openDlg(title,html,onReady){var d=$('#dlg');d.innerHTML='<div class="dh"><b>'+esc(title)+'</b><button class="ib" data-x aria-label="Close">'+I('x')+'</button></div><div class="db">'+html+'</div>';
 d.classList.add('on');d.setAttribute('aria-hidden','false');$('#ov').classList.add('on');$('[data-x]',d).onclick=closeDlg;onReady&&onReady($('.db',d))}
function closeDlg(){$('#dlg').classList.remove('on');$('#dlg').setAttribute('aria-hidden','true');$('#ov').classList.remove('on')}
$('#ov').onclick=closeDlg;D.addEventListener('keydown',function(e){if(e.key==='Escape')closeDlg()});

/* ---------- image compression in the browser ---------- */
function compressImage(file,maxW,q){return new Promise(function(res){if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size<120000&&file.type==='image/webp'){res(file);return}
 var img=new Image();img.onload=function(){var s=Math.min(1,(maxW||1800)/img.width);var c=D.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
  var x=c.getContext('2d');x.drawImage(img,0,0,c.width,c.height);c.toBlob(function(b){res(b&&b.size<file.size?new File([b],file.name.replace(/\.\w+$/,'')+'.webp',{type:'image/webp'}):file)},'image/webp',q||.84)};
 img.onerror=function(){res(file)};img.src=URL.createObjectURL(file)})}
function upload(file,folder,opts){opts=opts||{};var p=Promise.resolve(file);
 if(/^image\//.test(file.type)&&!opts.raw)p=compressImage(file,opts.maxW,opts.q);
 return p.then(function(f){if(f.size>25*1024*1024&&ST.ov&&ST.ov.storage&&ST.ov.storage.backend==='kv'){toast('File is over 25 MB. Cloud storage activation is pending — use a Google Drive / external link for now.',true);throw new Error('big')}
  toast('Uploading '+f.name+'…');return req('/api/admin/upload?folder='+encodeURIComponent(folder||'media')+'&name='+encodeURIComponent(f.name),{method:'POST',body:f,type:f.type||'application/octet-stream'})})}
function pickFile(accept,cb){var i=D.createElement('input');i.type='file';i.accept=accept||'*/*';i.onchange=function(){if(i.files[0])cb(i.files[0])};i.click()}

/* ---------- generic field renderer ---------- */
// field: {k,label,type:'text'|'textarea'|'number'|'image'|'video'|'select'|'bool'|'date'|'icon',options:[[v,l]],hint}
function fieldHTML(f,v,pre){var id=(pre||'f')+'_'+f.k,lab='<label for="'+id+'">'+esc(f.label||f.k)+(f.hint?' <span class="faint">· '+esc(f.hint)+'</span>':'')+'</label>';
 if(f.type==='bool')return '<label class="chk"><input type="checkbox" id="'+id+'" data-k="'+f.k+'"'+(v?' checked':'')+'> '+esc(f.label)+'</label>';
 if(f.type==='textarea')return '<div class="f">'+lab+'<textarea class="in" id="'+id+'" data-k="'+f.k+'" rows="'+(f.rows||5)+'">'+esc(v)+'</textarea></div>';
 if(f.type==='select')return '<div class="f">'+lab+'<select class="in" id="'+id+'" data-k="'+f.k+'">'+f.options.map(function(o){return '<option value="'+esc(o[0])+'"'+(String(o[0])===String(v==null?'':v)?' selected':'')+'>'+esc(o[1])+'</option>'}).join('')+'</select></div>';
 if(f.type==='image'||f.type==='video'||f.type==='file')return '<div class="f">'+lab+'<div class="img-up">'+(f.type==='image'?'<img src="'+esc(v||'')+'" alt="" data-prev="'+f.k+'"'+(v?'':' style="opacity:.2"')+'>':'')+'<input class="in grow" id="'+id+'" data-k="'+f.k+'" value="'+esc(v)+'" placeholder="'+(f.type==='image'?'Image URL or upload':f.type==='video'?'Video URL (upload ≤25 MB) or link':'File')+'"><button type="button" class="btn g s" data-up="'+f.k+'" data-ft="'+f.type+'" data-folder="'+(f.folder||'media')+'">'+I('download')+' Upload</button></div></div>';
 if(f.type==='date')return '<div class="f">'+lab+'<input class="in" type="datetime-local" id="'+id+'" data-k="'+f.k+'" data-date="1" value="'+(v?new Date(+v-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,16):'')+'"></div>';
 return '<div class="f">'+lab+'<input class="in" id="'+id+'" data-k="'+f.k+'" type="'+(f.type==='number'?'number':'text')+'" value="'+esc(v)+'"'+(f.ph?' placeholder="'+esc(f.ph)+'"':'')+'></div>'}
function bindUploads(root){$$('[data-up]',root).forEach(function(b){b.onclick=function(){var k=b.dataset.up,ft=b.dataset.ft;
 pickFile(ft==='image'?'image/*':ft==='video'?'video/mp4,video/webm,video/quicktime':'*/*',function(file){upload(file,b.dataset.folder,{raw:ft!=='image'}).then(function(r){var inp=b.parentNode.querySelector('[data-k="'+k+'"]');inp.value=r.url;
  var pv=b.parentNode.querySelector('[data-prev]');if(pv){pv.src=r.url;pv.style.opacity=1}toast('Uploaded ✓');inp.dispatchEvent(new Event('change',{bubbles:true}))})})}})}
function readFields(root,fields){var o={};fields.forEach(function(f){var el=root.querySelector('[data-k="'+f.k+'"]');if(!el)return;
 if(f.type==='bool')o[f.k]=el.checked;else if(f.type==='number')o[f.k]=el.value===''?null:Number(el.value);else if(f.type==='date')o[f.k]=el.value?new Date(el.value).getTime():null;else o[f.k]=el.value});return o}
function formHTML(fields,obj,pre){return fields.map(function(f){return fieldHTML(f,obj?obj[f.k]:'',pre)}).join('')}

/* ---------- list editor for arrays inside content ---------- */
function listEditor(root,items,fields,opts){opts=opts||{};items=(items||[]).slice();
 function draw(){root.innerHTML=items.map(function(it,i){return '<div class="item-ed" data-i="'+i+'"><div class="hdr"><b>'+esc(it[fields[0].k]||(opts.label||'Item')+' '+(i+1))+'</b><div class="acts row"><button class="ib" data-mv="-1" title="Move up">'+I('left')+'</button><button class="ib" data-mv="1" title="Move down">'+I('right')+'</button><button class="ib" data-del title="Delete">'+I('trash')+'</button></div></div>'+formHTML(fields,it,'l'+i+(opts.pre||''))+'</div>'}).join('')+'<button class="btn g s" data-add>'+I('plus')+' Add '+(opts.label||'item').toLowerCase()+'</button>';
  bindUploads(root);
  $$('.item-ed',root).forEach(function(el){var i=+el.dataset.i;
   el.addEventListener('input',function(){items[i]=Object.assign(items[i],readFields(el,fields))});el.addEventListener('change',function(){items[i]=Object.assign(items[i],readFields(el,fields))});
   $('[data-del]',el).onclick=function(){if(confirm('Delete this '+(opts.label||'item').toLowerCase()+'?')){items.splice(i,1);draw()}};
   $$('[data-mv]',el).forEach(function(b){b.onclick=function(){var j=i+(+b.dataset.mv);if(j<0||j>=items.length)return;var t=items[i];items[i]=items[j];items[j]=t;draw()}})});
  $('[data-add]',root).onclick=function(){var n={};fields.forEach(function(f){n[f.k]=f.type==='bool'?false:f.type==='number'?0:''});Object.assign(n,opts.blank||{});items.push(n);draw()}}
 draw();return{get:function(){return items}}}
function saveContent(key,value){return req('/api/admin/content/'+key,{method:'PUT',body:{value:value}}).then(function(){ST.content[key]=value;toast('Saved — live on the site now ✓')})}

/* ---------- login ---------- */
function loginView(msg){var root=$('#root');var step='main',email='';
 function draw(){var h='<div class="login-wrap"><div class="login-box"><div class="brand grad">JANGID CUTS</div><p>Admin panel · owner only</p>'+(msg?'<div class="note">'+esc(msg)+'</div>':'');
  if(step==='main')h+='<a class="gbtn" href="/auth/google/start?next=/admin">'+I('g')+' Continue with Google</a><div class="or">OR</div><form id="lf"><div class="f"><label>Email</label><input class="in" id="le" type="email" autocomplete="username" required value="'+esc(email)+'"></div><div class="f"><label>Password</label><input class="in" id="lp" type="password" autocomplete="current-password" required></div><button class="btn p" style="width:100%">'+I('lock')+' Sign in</button></form><p class="mt"><button class="linkbtn" id="lc">Email me a code instead</button> · <button class="linkbtn" id="lr">Forgot password?</button></p>';
  else if(step==='code'||step==='reset')h+='<form id="cf"><div class="f"><label>Email</label><input class="in" id="ce" type="email" required value="'+esc(email)+'"></div><button class="btn g" type="button" id="cs" style="width:100%">'+I('mail')+' Send code</button><div class="f mt"><label>6-digit code</label><input class="in" id="cc" inputmode="numeric" maxlength="6" autocomplete="one-time-code"></div>'+(step==='reset'?'<div class="f"><label>New password</label><input class="in" id="np" type="password" autocomplete="new-password"></div><div class="f"><label>Confirm new password</label><input class="in" id="np2" type="password" autocomplete="new-password"></div>':'')+'<button class="btn p" style="width:100%">'+(step==='reset'?'Set new password':'Sign in')+'</button></form><p class="mt"><button class="linkbtn" id="back">Back</button></p>';
  else if(step==='mfa')h+='<form id="mf"><div class="f"><label>2-step code from your authenticator app</label><input class="in" id="mc" inputmode="numeric" maxlength="6" autocomplete="one-time-code" autofocus></div><button class="btn p" style="width:100%">Verify</button></form><p class="mt"><button class="linkbtn" id="lo">Sign out</button></p>';
  root.innerHTML=h+'</div></div>';
  var lf=$('#lf');if(lf)lf.onsubmit=function(e){e.preventDefault();email=$('#le').value;req('/api/auth/login',{body:{email:email,password:$('#lp').value}}).then(boot)};
  $('#lc')&&($('#lc').onclick=function(){email=($('#le')||{}).value||email;step='code';draw()});$('#lr')&&($('#lr').onclick=function(){email=($('#le')||{}).value||email;step='reset';draw()});
  $('#back')&&($('#back').onclick=function(){step='main';draw()});
  $('#cs')&&($('#cs').onclick=function(){email=$('#ce').value;req('/api/auth/otp',{body:{email:email,purpose:step==='reset'?'reset':'login',tc:true}}).then(function(){toast('Code sent to '+email)})});
  var cf=$('#cf');if(cf)cf.onsubmit=function(e){e.preventDefault();email=$('#ce').value;if(step==='reset')req('/api/auth/reset',{body:{email:email,code:$('#cc').value,password:$('#np').value,confirm:$('#np2').value}}).then(boot);else req('/api/auth/verify',{body:{email:email,code:$('#cc').value,tc:true}}).then(boot)};
  var mf=$('#mf');if(mf)mf.onsubmit=function(e){e.preventDefault();req('/api/auth/mfa',{body:{code:$('#mc').value}}).then(boot)};
  $('#lo')&&($('#lo').onclick=function(){req('/api/auth/logout',{body:{}}).then(function(){step='main';draw()})})}
 loginView.mfa=function(){step='mfa';draw()};draw();return loginView}

/* ---------- layout + router ---------- */
var SECTIONS=[
 ['dashboard','Dashboard','home'],['desk','Client Desk','chat'],
 ['_h','Website'],['home','Home page','star'],['services','Services','film'],['portfolio','Portfolio','play'],['reviews','Reviews','star'],['pages','Pages & FAQ','doc'],['contact','Contact & Social','phone'],
 ['_h','Store'],['products','Products','bag'],['storeset','Store settings','tag'],['coupons','Coupons','tag'],['orders','Orders','box'],
 ['_h','People & mail'],['users','Users','users'],['mail','Emails','mail'],['media','Media library','download'],
 ['_h','System'],['settings','Settings & security','gear']];
function layout(){var root=$('#root');
 root.innerHTML='<div class="mobnav"><button class="ib" id="mb" aria-label="Menu">'+I('menu')+'</button><b class="grad">JANGID CUTS</b><a class="ib" href="/" target="_blank" aria-label="Open site">'+I('globe')+'</a></div><div class="app"><nav class="side" id="side"><div class="logo grad">JANGID CUTS</div><div class="sub">Admin panel</div><div class="nav">'+
 SECTIONS.map(function(s){return s[0]==='_h'?'<h5>'+s[1]+'</h5>':'<a href="#'+s[0]+'" data-s="'+s[0]+'">'+I(s[2])+'<span>'+s[1]+'</span>'+(s[0]==='desk'?'<i class="cnt hidden" id="deskCnt"></i>':'')+'</a>'}).join('')+
 '<h5>Account</h5><a href="/" target="_blank">'+I('globe')+'<span>View website</span></a><a href="#" id="logout">'+I('logout')+'<span>Sign out</span></a></div></nav><main class="main" id="view"></main></div>';
 $('#mb').onclick=function(){$('#side').classList.toggle('open')};
 $('#logout').onclick=function(e){e.preventDefault();req('/api/auth/logout',{body:{}}).then(function(){location.reload()})};
 window.addEventListener('hashchange',route);route()}
function setDeskCount(n){var c=$('#deskCnt');if(!c)return;c.textContent=n;c.classList.toggle('hidden',!n);c.style.display=n?'':'none'}
function route(){var h=(location.hash||'#dashboard').slice(1),name=h.split('?')[0]||'dashboard',q=new URLSearchParams(h.split('?')[1]||'');
 $$('.nav a[data-s]').forEach(function(a){a.classList.toggle('on',a.dataset.s===name)});$('#side').classList.remove('open');
 var v=$('#view');v.innerHTML='<p class="muted">Loading…</p>';window.scrollTo(0,0);
 (VIEWS[name]||VIEWS.dashboard)(v,q)}
function top(title,actions){return '<div class="top"><h1 class="grad">'+esc(title)+'</h1><div class="row">'+(actions||'')+'</div></div>'}

var VIEWS={};
/* ---------- dashboard ---------- */
VIEWS.dashboard=function(v){req('/api/admin/overview').then(function(o){ST.ov=o;setDeskCount(o.pendingTickets+o.newHires);
 var sum=function(a){return a.reduce(function(s,x){return s+(x.n||0)},0)};var pvMax=Math.max.apply(null,[1].concat(o.pv.map(function(x){return x.n})));
 var days=[];for(var i=29;i>=0;i--){var d=new Date(Date.now()+5.5*36e5-i*864e5).toISOString().slice(0,10);var f=o.pv.find(function(x){return x.day===d});days.push({d:d,n:f?f.n:0})}
 var ord={};o.orders.forEach(function(x){ord[x.status]=x.n});
 var warn='';if(!o.mail.google)warn+='<div class="note">Site emails are being connected (Google sign-in + Gmail). Until then OTP / thank-you mails wait in the queue.</div>';
 else if(!o.mail.main)warn+='<div class="note">Main Gmail (jangidcuts@gmail.com) is not connected — OTP and order emails cannot be sent. <a href="#mail">Connect it</a>.</div>';
 if(o.storage.backend==='kv')warn+='<div class="note">Cloud file storage (R2) activation is pending. Uploads up to 25 MB work now; big packs use Google Drive / links.</div>';
 v.innerHTML=top('Dashboard','<a class="btn g s" href="/" target="_blank">'+I('globe')+' View site</a>')+warn+
 '<div class="kpis"><div class="kpi"><b>'+money(o.revenue.total)+'</b><span>Total sales · '+o.revenue.n+' orders</span></div><div class="kpi"><b>'+money(o.revenue.total30)+'</b><span>Last 30 days</span></div><div class="kpi"><b>'+money(o.revenue.today)+'</b><span>Today</span></div>'+
 '<div class="kpi"><b>'+sum(o.pv)+'</b><span>Page views · 30 days</span></div><div class="kpi"><b>'+sum(o.uv)+'</b><span>Visitors · 30 days</span></div><div class="kpi"><b>'+(o.users.n||0)+'</b><span>Users (+'+(o.users.new7||0)+' this week)</span></div>'+
 '<div class="kpi"><b>'+o.pendingTickets+'</b><span>Pending tickets</span></div><div class="kpi"><b>'+o.newHires+'</b><span>New hire requests</span></div><div class="kpi"><b>'+o.downloads+'</b><span>Downloads</span></div><div class="kpi"><b>'+(o.reviews.avg||'–')+'★</b><span>'+o.reviews.count+' reviews</span></div></div>'+
 '<div class="card"><h2>Visits · last 30 days</h2><div class="bars">'+days.map(function(x){return '<i style="height:'+Math.round(100*x.n/pvMax)+'%" data-t="'+x.d.slice(5)+': '+x.n+'"></i>'}).join('')+'</div><div class="chart-lbl"><span>'+days[0].d.slice(5)+'</span><span>Today</span></div></div>'+
 '<div class="g2"><div class="card"><h2>Top pages</h2>'+(o.top.length?'<table class="tbl">'+o.top.map(function(x){return '<tr><td>'+esc(x.path)+'</td><td style="text-align:right">'+x.n+'</td></tr>'}).join('')+'</table>':'<p class="muted small">No visits yet.</p>')+'</div>'+
 '<div class="card"><h2>Recent orders <a class="btn g s" href="#orders">All</a></h2>'+(o.recentOrders.length?'<table class="tbl">'+o.recentOrders.map(function(x){return '<tr><td>'+esc(x.number)+'<div class="faint small">'+esc(x.email)+'</div></td><td>'+money(x.total)+'</td><td>'+pill(x.status)+'</td></tr>'}).join('')+'</table>':'<p class="muted small">No orders yet.</p>')+'</div></div>'+
 '<div class="g2"><div class="card"><h2>Site health</h2><dl class="kv"><dt>Main Gmail</dt><dd>'+(o.mail.main?'<span class="pill ok">connected</span> '+esc(o.mail.main):'<span class="pill warn">not connected</span>')+'</dd><dt>Support Gmail</dt><dd>'+(o.mail.support?'<span class="pill ok">connected</span> '+esc(o.mail.support):'<span class="pill warn">not connected</span>')+'</dd><dt>Emails (24 h)</dt><dd>'+(o.mail24h.sent||0)+' sent · '+(o.mail24h.failed||0)+' failed</dd><dt>File storage</dt><dd>'+(o.storage.backend==='r2'?'Cloud (R2)':'Temporary (25 MB per file) — activation pending')+'</dd><dt>Products</dt><dd>'+o.products.n+' ('+(o.products.free||0)+' free)</dd></dl></div>'+
 '<div class="card"><h2>Activity log</h2>'+(o.events.length?o.events.map(function(e){return '<div class="small" style="margin-bottom:6px"><span class="faint">'+fmtD(e.at)+'</span> · <b>'+esc(e.kind)+'</b> '+esc(e.msg).slice(0,160)+'</div>'}).join(''):'<p class="muted small">Nothing yet.</p>')+'</div></div>'})};
function pill(s){var c={delivered:'ok',approved:'ok',solved:'ok',sent:'ok',visible:'ok',paid:'ok',created:'warn',new:'warn',pending:'warn',failed:'bad',refunded:'bad',cancelled:'bad',rejected:'bad',hidden:'bad'}[s]||'';return '<span class="pill '+c+'">'+esc(s)+'</span>'}

/* ---------- client desk ---------- */
VIEWS.desk=function(v,q){var tab=q.get('t')||'hire';
 v.innerHTML=top('Client Desk')+'<div class="tabs"><button data-t="hire">Hire requests</button><button data-t="tickets">Support tickets</button></div><div id="dk"></div>';
 $$('.tabs button',v).forEach(function(b){b.classList.toggle('on',b.dataset.t===tab);b.onclick=function(){location.hash='desk?t='+b.dataset.t}});
 var box=$('#dk');
 if(tab==='hire')req('/api/admin/hire').then(function(r){var items=r.items;var f='all';
  function draw(){var list=items.filter(function(h){return f==='all'||h.status===f});
   box.innerHTML='<div class="row mb">'+['all','new','approved','done','rejected'].map(function(s){return '<button class="btn '+(s===f?'p':'g')+' s" data-f="'+s+'">'+s+' ('+(s==='all'?items.length:items.filter(function(h){return h.status===s}).length)+')</button>'}).join('')+'</div>'+
   (list.length?'<div class="card tw"><table class="tbl"><tr><th>#</th><th>Client</th><th>Work</th><th>Budget</th><th>Status</th><th>When</th></tr>'+list.map(function(h){return '<tr class="click" data-id="'+h.id+'"><td>'+esc(h.number)+'</td><td><b>'+esc(h.name)+'</b><div class="faint small">'+esc(h.email)+'</div></td><td class="small">'+esc((h.data.categories||[]).join(', ')+(h.data.category_other?' · '+h.data.category_other:''))+'</td><td class="small">'+esc(h.data.budget||'')+'</td><td>'+pill(h.status)+'</td><td class="small">'+fmtD(h.created)+'</td></tr>'}).join('')+'</table></div>':'<div class="card muted">No hire requests here yet. When someone fills the Hire Me form it shows up here and you get an email.</div>');
   $$('[data-f]',box).forEach(function(b){b.onclick=function(){f=b.dataset.f;draw()}});
   $$('tr[data-id]',box).forEach(function(tr){tr.onclick=function(){openHire(items.find(function(h){return h.id==tr.dataset.id}),function(){VIEWS.desk(v,q)})}})}
  draw()});
 else req('/api/admin/tickets').then(function(r){var items=r.items;
  box.innerHTML=(items.length?'<div class="card tw"><table class="tbl"><tr><th>Ticket</th><th>From</th><th>Problem</th><th>Status</th><th>When</th></tr>'+items.map(function(t){return '<tr class="click" data-id="'+t.id+'"><td><b>'+esc(t.number)+'</b></td><td class="small">'+esc(t.name)+'<div class="faint">'+esc(t.email)+'</div></td><td class="small">'+esc(t.message).slice(0,120)+'</td><td>'+pill(t.status)+'</td><td class="small">'+fmtD(t.created)+'</td></tr>'}).join('')+'</table></div>':'<div class="card muted">No tickets. Tickets are private — only you see them here.</div>');
  $$('tr[data-id]',box).forEach(function(tr){tr.onclick=function(){openTicket(items.find(function(t){return t.id==tr.dataset.id}),function(){VIEWS.desk(v,q)})}})})};
function openHire(h,refresh){var d=h.data,L=function(k,l){return d[k]&&(Array.isArray(d[k])?d[k].length:String(d[k]).trim())?'<dt>'+l+'</dt><dd>'+esc(Array.isArray(d[k])?d[k].join(', '):d[k])+'</dd>':''};
 openDlg('Hire request '+h.number,'<div class="row mb">'+pill(h.status)+'<span class="faint small">'+fmtD(h.created)+'</span></div><dl class="kv"><dt>Name</dt><dd>'+esc(h.name)+'</dd><dt>Email</dt><dd><a href="mailto:'+esc(h.email)+'">'+esc(h.email)+'</a></dd>'+L('whatsapp','WhatsApp')+L('country','Country / TZ')+L('agency','Agency?')+L('agency_name','Agency name')+L('agency_address','Agency address')+L('categories','Type of work')+L('category_other','Other')+L('perday','Videos per day')+L('format','Format')+L('plan','Work type')+L('budget','Budget')+L('deadline','Start / deadline')+L('raw_link','Raw footage')+L('reference','Reference')+'</dl>'+
 '<h3 class="muted small">Project</h3><div class="card small" style="white-space:pre-wrap">'+esc(d.project||'—')+'</div>'+
 '<div class="row mb"><button class="btn p" id="ap">'+I('check')+' Approve &amp; send “ready to work” email</button><button class="btn g s" id="dn">Mark done</button><button class="btn r s" id="rj">Reject</button></div>'+
 '<div class="card"><h2>Reply by email <span class="faint small">from jangidcuts@gmail.com</span></h2><div class="f"><input class="in" id="rs" value="Re: your project '+esc(h.number)+' — Jangid Cuts"></div><div class="f"><textarea class="in" id="rb" rows="6">Hi '+esc(h.name)+',\n\n</textarea></div><button class="btn g s" id="sd">'+I('mail')+' Send</button></div>'+
 '<div class="f"><label>Private note</label><textarea class="in" id="nt" rows="3">'+esc(h.note||'')+'</textarea></div><div class="row"><button class="btn g s" id="sn">Save note</button><button class="btn r s" id="del">'+I('trash')+' Delete</button></div>',function(b){
  var act=function(a,extra){return req('/api/admin/hire/'+h.id,{body:Object.assign({action:a},extra||{})})};
  $('#ap',b).onclick=function(){act('approve').then(function(r){toast(r.mailed?'Approved — email sent to client ✓':'Approved. Email could not be sent yet: '+(r.mailError||''),!r.mailed);closeDlg();refresh()})};
  $('#dn',b).onclick=function(){act('done').then(function(){toast('Marked done');closeDlg();refresh()})};
  $('#rj',b).onclick=function(){if(confirm('Reject this request? (no email is sent)'))act('reject').then(function(){closeDlg();refresh()})};
  $('#sd',b).onclick=function(){act('email',{subject:$('#rs',b).value,body:$('#rb',b).value}).then(function(r){toast(r.ok?'Email sent ✓':'Not sent: '+r.error,!r.ok)})};
  $('#sn',b).onclick=function(){act('note',{note:$('#nt',b).value}).then(function(){toast('Note saved')})};
  $('#del',b).onclick=function(){if(confirm('Delete this request permanently?'))act('delete').then(function(){closeDlg();refresh()})}})}
function openTicket(t,refresh){openDlg('Ticket '+t.number,'<div class="row mb">'+pill(t.status)+'<span class="faint small">'+fmtD(t.created)+'</span></div><dl class="kv"><dt>From</dt><dd>'+esc(t.name)+' · <a href="mailto:'+esc(t.email)+'">'+esc(t.email)+'</a></dd><dt>Topic</dt><dd>'+esc(t.topic)+'</dd></dl><div class="card small" style="white-space:pre-wrap">'+esc(t.message)+'</div>'+
 (t.status==='solved'?'<div class="okbox"><b>Solution sent '+fmtD(t.solved_at)+'</b><div style="white-space:pre-wrap" class="small mt">'+esc(t.solution)+'</div></div><button class="btn g s" id="ro">Reopen</button>':
 '<div class="f"><label>Solution (emailed from supportjangidcuts@gmail.com)</label><textarea class="in" id="so" rows="7"></textarea></div><button class="btn p" id="sv">'+I('check')+' Solve &amp; email the solution</button>')+'<div class="mt"><button class="btn r s" id="del">'+I('trash')+' Delete</button></div>',function(b){
  var act=function(a,extra){return req('/api/admin/tickets/'+t.id,{body:Object.assign({action:a},extra||{})})};
  $('#sv',b)&&($('#sv',b).onclick=function(){act('solve',{solution:$('#so',b).value}).then(function(r){toast(r.mailed?'Solved — solution emailed ✓':'Solved, but email failed: '+(r.mailError||''),!r.mailed);closeDlg();refresh()})});
  $('#ro',b)&&($('#ro',b).onclick=function(){act('reopen').then(function(){closeDlg();refresh()})});
  $('#del',b).onclick=function(){if(confirm('Delete this ticket?'))act('delete').then(function(){closeDlg();refresh()})}})}

/* ---------- content loader ---------- */
function withContent(cb){if(ST.content)return cb(ST.content);req('/api/admin/content').then(function(r){ST.content=r.content;cb(ST.content)})}
function withCats(cb,force){if(ST.cats&&!force)return cb(ST.cats);req('/api/admin/categories').then(function(r){ST.cats=r.items;cb(ST.cats)})}
function objCard(title,key,fields,note){return '<div class="card" data-obj="'+key+'"><h2>'+esc(title)+'<button class="btn p s" data-save="'+key+'">Save</button></h2>'+(note?'<p class="muted small mb">'+note+'</p>':'')+formHTML(fields,ST.content[key],key)+'</div>'}
function bindObjCards(v){bindUploads(v);$$('[data-save]',v).forEach(function(b){var key=b.dataset.save,card=b.closest('[data-obj]');if(!card)return;b.onclick=function(){var cur=ST.content[key]||{};var flds=card._fields;saveContent(key,Object.assign({},cur,readFields(card,flds)))}})}
function objCardBind(v,key,fields){var c=$('[data-obj="'+key+'"]',v);c._fields=fields}
var ICONS=[['users','People'],['clock','Clock'],['film','Film'],['bolt','Bolt'],['star','Star'],['play','Play'],['bag','Bag'],['chat','Chat'],['shield','Shield'],['globe','Globe'],['check','Check'],['heart','Heart']];

VIEWS.home=function(v){withContent(function(c){
 var F={hero:[{k:'hello',label:'Small line above name'},{k:'name',label:'Your name'},{k:'role',label:'Role line'},{k:'cta',label:'Hire button text'},{k:'photo',label:'Hero photo',type:'image',folder:'hero',hint:'shown in black & white automatically'},{k:'photo_alt',label:'Photo description (for blind users / Google)'},{k:'bw',label:'Black & white photo',type:'bool'},{k:'zoom',label:'Photo size %',type:'number'},{k:'shift_y',label:'Move photo up/down (px)',type:'number'}],
  brand:[{k:'bigword',label:'Big background word'},{k:'name',label:'Brand name (top-left)'},{k:'loader_role',label:'Loading screen line'}],
  home:[{k:'work_eyebrow',label:'Portfolio small title'},{k:'work_title',label:'Portfolio title'},{k:'work_btn',label:'View work button'},{k:'svc_eyebrow',label:'Services small title'},{k:'svc_title',label:'Services title'},{k:'svc_link',label:'Service card link text'},{k:'rev_eyebrow',label:'Reviews small title'},{k:'rev_title',label:'Reviews title'},{k:'rev_note',label:'Reviews score note'},{k:'show_stats',label:'Show stat cards',type:'bool'},{k:'show_work',label:'Show portfolio section',type:'bool'},{k:'show_services',label:'Show services',type:'bool'},{k:'show_reviews',label:'Show reviews',type:'bool'}],
  footer:[{k:'about',label:'Footer text',type:'textarea',rows:3},{k:'copyright',label:'Copyright ({year} = current year)'},{k:'made_in',label:'Made in line'}],
  seo:[{k:'title',label:'Google title'},{k:'description',label:'Google description',type:'textarea',rows:3}]};
 v.innerHTML=top('Home page','<a class="btn g s" href="/" target="_blank">'+I('globe')+' Preview</a>')+
 '<div class="card" data-obj="hero"><h2>Hero (top of home page)<button class="btn p s" data-save="hero">Save</button></h2><div class="row mb"><button class="btn g" id="chg">'+I('download')+' Change Photo</button><span class="faint small">JPG/PNG. A cut-out photo (no background) looks best. Your face is never changed — only shown in black &amp; white.</span></div>'+formHTML(F.hero,c.hero,'hero')+'</div>'+
 objCard('Brand & loading screen','brand',F.brand)+
 '<div class="card"><h2>Stat cards<button class="btn p s" id="svst">Save</button></h2><div id="stats"></div></div>'+
 objCard('Home section titles','home',F.home)+objCard('Footer','footer',F.footer)+objCard('Google / SEO','seo',F.seo);
 Object.keys(F).forEach(function(k){objCardBind(v,k,F[k])});bindObjCards(v);
 $('#chg').onclick=function(){pickFile('image/*',function(f){upload(f,'hero',{maxW:1400,q:.9}).then(function(r){var inp=$('[data-obj=hero] [data-k=photo]',v);inp.value=r.url;$('[data-obj=hero] [data-prev=photo]',v).src=r.url;
  saveContent('hero',Object.assign({},c.hero,readFields($('[data-obj=hero]',v),F.hero)))})})};
 var st=listEditor($('#stats'),c.stats,[{k:'label',label:'Label'},{k:'num',label:'Number',type:'number'},{k:'suffix',label:'After number (+, h, k…)'},{k:'icon',label:'Icon',type:'select',options:ICONS}],{label:'Stat card'});
 $('#svst').onclick=function(){saveContent('stats',st.get())}})};

VIEWS.services=function(v){withContent(function(c){
 v.innerHTML=top('Services','<button class="btn p" id="sv">Save all</button>')+'<p class="muted small mb">These show on the home page and in the search (“Search for a service”).</p><div id="le"></div>';
 var le=listEditor($('#le'),c.services,[{k:'title',label:'Title'},{k:'desc',label:'Description',type:'textarea',rows:3},{k:'image',label:'Thumbnail',type:'image',folder:'services'},{k:'tag',label:'Tag on thumbnail'},{k:'price_from',label:'Starting price (optional, e.g. ₹499)'}],{label:'Service'});
 $('#sv').onclick=function(){saveContent('services',le.get())}})};

VIEWS.pages=function(v,q){withContent(function(c){var tab=q.get('t')||'faq';
 var pages=[['faq','FAQ'],['about','About'],['how_i_work','How I Work'],['privacy','Privacy & Refund'],['terms','Terms & Conditions'],['licence','Licence'],['shipping','Shipping / Delivery'],['support','Support page'],['help','Help texts'],['hire_form','Hire Me form'],['mail_templates','Email templates'],['portfolio_page','Portfolio page texts']];
 v.innerHTML=top('Pages & FAQ')+'<div class="tabs">'+pages.map(function(p){return '<button data-t="'+p[0]+'" class="'+(p[0]===tab?'on':'')+'">'+esc(p[1])+'</button>'}).join('')+'</div><div id="pg"></div>';
 $$('.tabs button',v).forEach(function(b){b.onclick=function(){location.hash='pages?t='+b.dataset.t}});var box=$('#pg');
 var hint='<p class="faint small mb">Formatting: a blank line = new paragraph · a line starting with “## ” = heading · “- ” = bullet.</p>';
 if(tab==='faq'){box.innerHTML='<div class="card"><h2>Questions<button class="btn p s" id="sv">Save</button></h2><div id="le"></div></div>';var le=listEditor($('#le'),c.faq,[{k:'q',label:'Question'},{k:'a',label:'Answer',type:'textarea',rows:3}],{label:'Question'});$('#sv').onclick=function(){saveContent('faq',le.get())};return}
 if(tab==='terms'){var t=c.pages.terms;box.innerHTML='<div class="card"><h2>Terms &amp; Conditions<button class="btn p s" id="sv">Save</button></h2><div class="f"><label>Page title</label><input class="in" id="tt" value="'+esc(t.title)+'"></div><p class="muted small mb">Each section has its own link (e.g. the Hire Me form links to the “hire” section).</p><div id="le"></div></div>';
  var le2=listEditor($('#le'),t.sections,[{k:'title',label:'Section title'},{k:'id',label:'Link id (no spaces)'},{k:'body',label:'Text',type:'textarea',rows:5}],{label:'Section'});
  $('#sv').onclick=function(){var p=JSON.parse(JSON.stringify(c.pages));p.terms={title:$('#tt').value,sections:le2.get()};saveContent('pages',p)};return}
 if(tab==='help'){box.innerHTML=objCard('Help page','help',[{k:'title',label:'Title'},{k:'issue_title',label:'Issue box title'},{k:'issue_note',label:'Issue box note'},{k:'thanks',label:'Message after sending ({number} = ticket)'}]);objCardBind(box,'help',[{k:'title'},{k:'issue_title'},{k:'issue_note'},{k:'thanks'}]);bindObjCards(box);return}
 if(tab==='portfolio_page'){var pf=[{k:'eyebrow',label:'Small title'},{k:'title',label:'Title'},{k:'lead',label:'Intro',type:'textarea',rows:2},{k:'video_label',label:'Video tab'},{k:'thumb_label',label:'Thumbnail tab'}];box.innerHTML=objCard('Portfolio page','portfolio_page',pf);objCardBind(box,'portfolio_page',pf);bindObjCards(box);return}
 if(tab==='hire_form'){var hf=c.hire_form;box.innerHTML='<div class="card"><h2>Hire Me form<button class="btn p s" id="sv">Save</button></h2>'+formHTML([{k:'title',label:'Title'},{k:'intro',label:'Intro'},{k:'thanks',label:'Message after sending',type:'textarea',rows:2},{k:'word_limit',label:'Project description word limit',type:'number'}],hf,'hf')+
  ['categories','perday','formats','plans','budgets'].map(function(k){return '<div class="f"><label>'+({categories:'Type of work options',perday:'Videos per day options',formats:'Format options',plans:'Work type options',budgets:'Budget options'}[k])+' <span class="faint">· one per line</span></label><textarea class="in" data-arr="'+k+'" rows="'+(k==='categories'?10:4)+'">'+esc((hf[k]||[]).join('\n'))+'</textarea></div>'}).join('')+'</div>';
  $('#sv').onclick=function(){var o=Object.assign({},hf,readFields(box,[{k:'title'},{k:'intro'},{k:'thanks'},{k:'word_limit',type:'number'}]));$$('[data-arr]',box).forEach(function(t){o[t.dataset.arr]=t.value.split('\n').map(function(s){return s.trim()}).filter(Boolean)});saveContent('hire_form',o)};return}
 if(tab==='mail_templates'){var mt=c.mail_templates,names={otp:'Login / verification code',hire_received:'Hire request received (to client)',hire_approved:'Hire approved — ready to work',ticket_received:'Ticket received',ticket_solved:'Ticket solved',order_paid:'Thank you for your purchase',download_link:'Big file download link',order_status:'Order status update'};
  box.innerHTML='<p class="muted small mb">Words in {curly brackets} are filled in automatically (name, number, code, items, total, link, solution…).</p>'+Object.keys(names).map(function(k){var t=mt[k]||{};return '<div class="card" data-mt="'+k+'"><h2>'+esc(names[k])+'</h2><div class="f"><label>Subject</label><input class="in" data-k="subject" value="'+esc(t.subject)+'"></div><div class="f"><label>Message</label><textarea class="in" data-k="body" rows="7">'+esc(t.body)+'</textarea></div></div>'}).join('')+'<button class="btn p" id="sv">Save all templates</button>';
  $('#sv').onclick=function(){var o={};$$('[data-mt]',box).forEach(function(cd){o[cd.dataset.mt]={subject:$('[data-k=subject]',cd).value,body:$('[data-k=body]',cd).value}});saveContent('mail_templates',o)};return}
 var pg=c.pages[tab]||{title:'',body:''};box.innerHTML='<div class="card"><h2>'+esc(pg.title||tab)+'<button class="btn p s" id="sv">Save</button></h2>'+hint+'<div class="f"><label>Title</label><input class="in" id="pt" value="'+esc(pg.title)+'"></div><div class="f"><label>Text</label><textarea class="in" id="pb" rows="18">'+esc(pg.body)+'</textarea></div><a class="btn g s" target="_blank" href="/'+tab.replace(/_/g,'-')+'">'+I('globe')+' View page</a></div>';
 $('#sv').onclick=function(){var p=JSON.parse(JSON.stringify(c.pages));p[tab]={title:$('#pt').value,body:$('#pb').value};saveContent('pages',p)}})};

VIEWS.contact=function(v){withContent(function(c){
 var cf=[{k:'title',label:'Page title'},{k:'intro',label:'Intro',type:'textarea',rows:2},{k:'whatsapp',label:'WhatsApp number (with country code)'},{k:'call',label:'Call number'},{k:'email',label:'Email'},{k:'instagram_dm',label:'Instagram DM link'},{k:'telegram',label:'Telegram link'},{k:'hours',label:'Working hours'}];
 v.innerHTML=top('Contact & Social')+objCard('Contact page','contact',cf)+'<div class="card"><h2>Social platforms (Social page + footer icons)<button class="btn p s" id="svs">Save</button></h2><div id="le"></div></div>';
 objCardBind(v,'contact',cf);bindObjCards(v);
 var le=listEditor($('#le'),c.socials,[{k:'name',label:'Platform name'},{k:'url',label:'Link'},{k:'handle',label:'Handle shown'},{k:'icon',label:'Icon',type:'select',options:[['ig','Instagram'],['yt','YouTube'],['tg','Telegram'],['pin','Pinterest'],['wa','WhatsApp'],['fb','Facebook'],['globe','Website / other'],['mail','Email']]}],{label:'Platform'});
 $('#svs').onclick=function(){saveContent('socials',le.get())}})};

/* ---------- reviews ---------- */
VIEWS.reviews=function(v){req('/api/admin/reviews').then(function(r){var items=r.items;
 var cnt=items.filter(function(x){return x.status==='visible'}).length,avg=cnt?(items.filter(function(x){return x.status==='visible'}).reduce(function(s,x){return s+x.rating},0)/cnt).toFixed(1):'–';
 var stars=[5,4,3,2,1].map(function(n){return n+'★ '+items.filter(function(x){return x.rating===n}).length}).join(' · ');
 v.innerHTML=top('Reviews','<button class="btn p" id="add">'+I('plus')+' Add client review</button>')+'<div class="kpis"><div class="kpi"><b>'+avg+'★</b><span>Average (visible)</span></div><div class="kpi"><b>'+items.length+'</b><span>Total reviews</span></div></div><p class="muted small mb">Star analytics (only you see this): '+stars+'</p>'+
 (items.length?items.map(function(x){return '<div class="li"><div class="t"><b>'+'★'.repeat(x.rating)+' '+esc(x.name)+' <span class="faint small">'+esc(x.role||'')+(x.product_id?' · product #'+x.product_id:'')+'</span></b><span>'+esc(x.text)+'</span></div><div class="acts">'+pill(x.status)+(x.featured?' <span class="pill ok">home</span>':'')+'<button class="ib" data-ed="'+x.id+'" title="Edit">'+I('doc')+'</button><button class="ib" data-del="'+x.id+'" title="Delete">'+I('trash')+'</button></div></div>'}).join(''):'<p class="muted">No reviews yet.</p>');
 var F=[{k:'name',label:'Name'},{k:'role',label:'Who (e.g. YouTuber · India)'},{k:'rating',label:'Stars',type:'select',options:[[5,'5 ★'],[4,'4 ★'],[3,'3 ★'],[2,'2 ★'],[1,'1 ★']]},{k:'text',label:'Review',type:'textarea',rows:4},{k:'status',label:'Visibility',type:'select',options:[['visible','Visible'],['hidden','Hidden']]},{k:'featured',label:'Show on home page',type:'bool'}];
 function ed(x){openDlg(x?'Edit review':'Add review',formHTML(F,x||{rating:5,status:'visible',featured:1},'rv')+'<button class="btn p" id="ok">Save</button>',function(b){$('#ok',b).onclick=function(){var o=readFields(b,F);o.featured=o.featured?1:0;o.rating=+o.rating;req('/api/admin/reviews'+(x?'/'+x.id:''),{method:x?'PUT':'POST',body:o}).then(function(){closeDlg();toast('Saved ✓');VIEWS.reviews(v)})}})}
 $('#add').onclick=function(){ed(null)};$$('[data-ed]',v).forEach(function(b){b.onclick=function(){ed(items.find(function(x){return x.id==b.dataset.ed}))}});
 $$('[data-del]',v).forEach(function(b){b.onclick=function(){if(confirm('Delete this review?'))req('/api/admin/reviews/'+b.dataset.del,{method:'DELETE'}).then(function(){VIEWS.reviews(v)})}})})};

/* ---------- categories manager ---------- */
function catManager(box,sections,onChange){withCats(function(cats){var sec=sections[0][0];
 function draw(){var list=cats.filter(function(c){return c.section===sec});var tops=list.filter(function(c){return !c.parent_id});
  box.innerHTML='<div class="tabs">'+sections.map(function(s){return '<button data-sec="'+s[0]+'" class="'+(s[0]===sec?'on':'')+'">'+esc(s[1])+'</button>'}).join('')+'</div>'+
  tops.map(function(t){var subs=list.filter(function(c){return c.parent_id===t.id});return '<div class="item-ed"><div class="hdr"><b>'+esc(t.name)+'</b><div class="row"><button class="ib" data-mv="'+t.id+'" data-d="-1">'+I('left')+'</button><button class="ib" data-mv="'+t.id+'" data-d="1">'+I('right')+'</button><button class="ib" data-rn="'+t.id+'" title="Rename">'+I('doc')+'</button><button class="ib" data-dc="'+t.id+'" title="Delete">'+I('trash')+'</button></div></div><div class="row">'+subs.map(function(s){return '<span class="pill">'+esc(s.name)+' <button data-rn="'+s.id+'" title="Rename">✎</button> <button data-dc="'+s.id+'" title="Delete">✕</button></span>'}).join('')+'<button class="btn g s" data-addsub="'+t.id+'">'+I('plus')+' Sub-category</button></div></div>'}).join('')+
  '<div class="row"><input class="in grow" id="nc" placeholder="New category name"><button class="btn p s" id="ac">'+I('plus')+' Add category</button></div>';
  $$('[data-sec]',box).forEach(function(b){b.onclick=function(){sec=b.dataset.sec;draw()}});
  var reload=function(){withCats(function(c2){cats=c2;draw();onChange&&onChange(c2)},true)};
  $('#ac',box).onclick=function(){var n=$('#nc',box).value.trim();if(!n)return;req('/api/admin/categories',{body:{section:sec,name:n,sort:tops.length}}).then(reload)};
  $$('[data-addsub]',box).forEach(function(b){b.onclick=function(){var n=prompt('Sub-category name');if(n)req('/api/admin/categories',{body:{section:sec,name:n,parent_id:+b.dataset.addsub}}).then(reload)}});
  $$('[data-rn]',box).forEach(function(b){b.onclick=function(){var c=cats.find(function(x){return x.id==b.dataset.rn});var n=prompt('New name',c.name);if(n)req('/api/admin/categories/'+c.id,{method:'PUT',body:{name:n}}).then(reload)}});
  $$('[data-dc]',box).forEach(function(b){b.onclick=function(){if(confirm('Delete this category? Items in it stay but lose this category.'))req('/api/admin/categories/'+b.dataset.dc,{method:'DELETE'}).then(reload)}});
  $$('[data-mv]',box).forEach(function(b){b.onclick=function(){var ids=tops.map(function(t){return t.id});var i=ids.indexOf(+b.dataset.mv),j=i+(+b.dataset.d);if(j<0||j>=ids.length)return;var t=ids[i];ids[i]=ids[j];ids[j]=t;req('/api/admin/reorder',{body:{table:'categories',ids:ids}}).then(reload)}})}
 draw()})}
function catOptions(cats,section,parentOnly,parentId){var o=[['','— none —']];cats.filter(function(c){return c.section===section&&(parentOnly?!c.parent_id:(parentId?c.parent_id==parentId:true))}).forEach(function(c){o.push([c.id,c.name])});return o}

/* ---------- portfolio ---------- */
VIEWS.portfolio=function(v,q){var kind=q.get('k')||'video',sec='portfolio_'+kind;
 Promise.all([req('/api/admin/portfolio'),new Promise(function(r){withCats(r,true)}),new Promise(function(r){withContent(r)})]).then(function(a){var items=a[0].items.filter(function(x){return x.kind===kind}),cats=a[1],c=a[2];
  var cname=function(id){var x=cats.find(function(k){return k.id==id});return x?x.name:''};
  v.innerHTML=top('Portfolio','<button class="btn p" id="add">'+I('plus')+' Add '+(kind==='video'?'video':'thumbnail')+'</button>')+
  '<div class="tabs"><button data-k="video" class="'+(kind==='video'?'on':'')+'">Video portfolio</button><button data-k="thumb" class="'+(kind==='thumb'?'on':'')+'">Thumbnail portfolio</button></div>'+
  '<div class="card"><h2>Items ('+items.length+') <span class="faint small">order here = order on the site</span></h2><div id="list">'+(items.length?items.map(function(x,i){return '<div class="li" data-id="'+x.id+'"><img class="thumb" src="'+esc(x.image)+'" alt=""><div class="t"><b>'+esc(x.title)+'</b><span>'+esc(cname(x.category_id))+(x.subcategory_id?' · '+esc(cname(x.subcategory_id)):'')+(x.featured?' · ⭐ featured':'')+(x.home?' · on home':'')+(x.visible?'':' · hidden')+(x.video||x.url?' · ▶ video':'')+'</span></div><div class="acts"><button class="ib" data-mv="-1">'+I('left')+'</button><button class="ib" data-mv="1">'+I('right')+'</button><button class="ib" data-ed>'+I('doc')+'</button><button class="ib" data-del>'+I('trash')+'</button></div></div>'}).join(''):'<p class="muted">Nothing yet.</p>')+'</div></div>'+
  '<div class="card"><h2>Rows on the portfolio page (Netflix-style)<button class="btn p s" id="svr">Save rows</button></h2><p class="muted small mb">Source: “featured” = items marked featured, or pick a category.</p><div id="rows"></div></div>'+
  '<div class="card"><h2>Categories &amp; sub-categories</h2><div id="cm"></div></div>';
  $$('.tabs button[data-k]',v).forEach(function(b){b.onclick=function(){location.hash='portfolio?k='+b.dataset.k}});
  var catOpts=[['featured','⭐ Featured items']].concat(cats.filter(function(k){return k.section===sec&&!k.parent_id}).map(function(k){return ['cat:'+k.name,'Category: '+k.name]}));
  var rows=listEditor($('#rows'),(c.portfolio_rows||{})[kind],[{k:'title',label:'Row title'},{k:'source',label:'Show',type:'select',options:catOpts},{k:'auto',label:'Auto-scroll',type:'bool'}],{label:'Row',pre:'r'});
  $('#svr').onclick=function(){var pr=Object.assign({},c.portfolio_rows);pr[kind]=rows.get();saveContent('portfolio_rows',pr)};
  catManager($('#cm'),[[sec,kind==='video'?'Video categories':'Thumbnail categories']]);
  var F=function(catId){return [{k:'title',label:'Title'},{k:'image',label:kind==='video'?'Cover image / poster':'Thumbnail image',type:'image',folder:'portfolio'},
   kind==='video'?{k:'video',label:'Video file',type:'video',folder:'portfolio',hint:'MP4 up to 25 MB for now — compress before uploading'}:null,
   kind==='video'?{k:'url',label:'Or video link (Instagram / Drive / YouTube)'}:null,
   {k:'description',label:'Description',type:'textarea',rows:2},{k:'category_id',label:'Category',type:'select',options:catOptions(cats,sec,true)},{k:'subcategory_id',label:'Sub-category',type:'select',options:catOptions(cats,sec,false,catId)},
   {k:'orient',label:'Shape',type:'select',options:[['v','Vertical (reel)'],['h','Horizontal (16:9)']]},{k:'featured',label:'Featured (big slider + featured rows)',type:'bool'},{k:'home',label:'Show on home page row',type:'bool'},{k:'visible',label:'Visible on site',type:'bool'}].filter(Boolean)};
  function ed(x){var o=x||{kind:kind,visible:1,orient:kind==='video'?'v':'h'};var fl=F(o.category_id);
   openDlg(x?'Edit item':'Add item',formHTML(fl,o,'pf')+'<button class="btn p" id="ok">Save</button>',function(b){bindUploads(b);
    $('[data-k=category_id]',b).onchange=function(e){var s=$('[data-k=subcategory_id]',b);s.innerHTML=catOptions(cats,sec,false,e.target.value).map(function(o){return '<option value="'+o[0]+'">'+esc(o[1])+'</option>'}).join('')};
    $('#ok',b).onclick=function(){var d=readFields(b,fl);['featured','home','visible'].forEach(function(k){d[k]=d[k]?1:0});d.kind=kind;if(!d.image&&!d.video){toast('Add an image first',true);return}
     req('/api/admin/portfolio'+(x?'/'+x.id:''),{method:x?'PUT':'POST',body:d}).then(function(){closeDlg();toast('Saved — live now ✓');VIEWS.portfolio(v,q)})}})}
  $('#add').onclick=function(){ed(null)};
  $$('#list .li',v).forEach(function(li,i){var x=items[i];$('[data-ed]',li).onclick=function(){ed(x)};
   $('[data-del]',li).onclick=function(){if(confirm('Delete "'+x.title+'"?'))req('/api/admin/portfolio/'+x.id,{method:'DELETE'}).then(function(){VIEWS.portfolio(v,q)})};
   $$('[data-mv]',li).forEach(function(b){b.onclick=function(){var ids=items.map(function(y){return y.id}),j=i+(+b.dataset.mv);if(j<0||j>=ids.length)return;var t=ids[i];ids[i]=ids[j];ids[j]=t;req('/api/admin/reorder',{body:{table:'portfolio',ids:ids}}).then(function(){VIEWS.portfolio(v,q)})}})})})};

/* ---------- products ---------- */
VIEWS.products=function(v){Promise.all([req('/api/admin/products'),new Promise(function(r){withCats(r,true)})]).then(function(a){var items=a[0].items,cats=a[1];
 var cn=function(id){var x=cats.find(function(k){return k.id==id});if(!x)return '—';var p=x.parent_id&&cats.find(function(k){return k.id==x.parent_id});return (x.section==='store_free'?'Free › ':'Paid › ')+(p?p.name+' › ':'')+x.name};
 v.innerHTML=top('Products','<button class="btn p" id="add">'+I('plus')+' Add product</button>')+(ST.ov&&ST.ov.storage&&ST.ov.storage.backend==='kv'?'<div class="note">Storage activation pending: files up to 25 MB upload directly. For bigger packs (up to 20–30 GB) choose “Google Drive” or “Link” delivery — buyers get the link by email.</div>':'')+
 '<div class="card">'+(items.length?items.map(function(x,i){return '<div class="li" data-i="'+i+'"><img class="thumb sq" src="'+esc(x.image)+'" alt=""><div class="t"><b>'+esc(x.title)+'</b><span>'+(x.price?money(x.price):'Free')+' · '+esc(cn(x.category_id))+' · '+x.sales+' sold · '+x.downloads+' downloads'+(x.visible?'':' · hidden')+(x.delivery==='file'&&!x.file_key?' · ⚠ no file yet':'')+'</span></div><div class="acts"><button class="ib" data-mv="-1">'+I('left')+'</button><button class="ib" data-mv="1">'+I('right')+'</button><button class="ib" data-ed>'+I('doc')+'</button><button class="ib" data-del>'+I('trash')+'</button></div></div>'}).join(''):'<p class="muted">No products yet.</p>')+'</div>'+
 '<div class="card"><h2>Store categories (Free / Paid)</h2><div id="cm"></div></div>';
 catManager($('#cm'),[['store_free','Free'],['store_paid','Paid']],function(c2){cats=c2});
 function catOpts(){var o=[['','— choose —']];['store_free','store_paid'].forEach(function(s){cats.filter(function(c){return c.section===s&&!c.parent_id}).forEach(function(t){o.push([t.id,(s==='store_free'?'Free › ':'Paid › ')+t.name]);cats.filter(function(c){return c.parent_id===t.id}).forEach(function(sc){o.push([sc.id,(s==='store_free'?'Free › ':'Paid › ')+t.name+' › '+sc.name])})})});return o}
 function ed(x){var o=x||{visible:1,delivery:'file',price:0};var F=[{k:'title',label:'Title'},{k:'short',label:'Short line (on the card)'},{k:'description',label:'Full description',type:'textarea',rows:6},{k:'price',label:'Price ₹ (0 = free)',type:'number'},{k:'mrp',label:'Old price ₹ (crossed out, optional)',type:'number'},
  {k:'category_id',label:'Category',type:'select',options:catOpts()},{k:'image',label:'Product photo',type:'image',folder:'products'},{k:'badge',label:'Badge (New, Bestseller…)'},{k:'size_text',label:'File size text (e.g. 1.2 GB)'},
  {k:'delivery',label:'How the buyer gets it',type:'select',options:[['file','Download from site (upload file)'],['drive','Google Drive file (auto-shared to buyer email)'],['link','Private link sent by email']]},
  {k:'file_key',label:'File (stored privately)',hint:'ZIP/any file ≤ 25 MB for now'},{k:'file_name',label:'Download file name (e.g. Wedding-LUTs.zip)'},{k:'drive_id',label:'Google Drive file ID (for Drive delivery)'},{k:'link_url',label:'Private link (for link delivery)'},{k:'visible',label:'Visible in store',type:'bool'}];
  openDlg(x?'Edit product':'Add product',formHTML(F,o,'pr')+'<div class="row mb"><button class="btn g s" id="upf">'+I('download')+' Upload product file</button><span class="faint small" id="upn">'+(o.file_key?'File uploaded ✓':'')+'</span></div><button class="btn p" id="ok">Save</button>',function(b){bindUploads(b);
   $('#upf',b).onclick=function(){pickFile('*/*',function(f){upload(f,'private',{raw:true}).then(function(r){$('[data-k=file_key]',b).value=r.key;if(!$('[data-k=file_name]',b).value)$('[data-k=file_name]',b).value=f.name;var mb=(f.size/1048576);if(!$('[data-k=size_text]',b).value)$('[data-k=size_text]',b).value=mb<1?Math.ceil(f.size/1024)+' KB':mb.toFixed(1)+' MB';$('#upn',b).textContent='Uploaded ✓ '+f.name;toast('File uploaded ✓')})})};
   $('#ok',b).onclick=function(){var d=readFields(b,F);d.visible=d.visible?1:0;if(!d.title){toast('Title is required',true);return}if(d.drive_id&&/\/d\/([\w-]+)/.test(d.drive_id))d.drive_id=d.drive_id.match(/\/d\/([\w-]+)/)[1];
    req('/api/admin/products'+(x?'/'+x.id:''),{method:x?'PUT':'POST',body:d}).then(function(){closeDlg();toast('Saved — live in the store ✓');VIEWS.products(v)})}})}
 $('#add').onclick=function(){ed(null)};
 $$('.li[data-i]',v).forEach(function(li){var i=+li.dataset.i,x=items[i];$('[data-ed]',li).onclick=function(){ed(x)};
  $('[data-del]',li).onclick=function(){if(confirm('Delete "'+x.title+'"? Buyers keep access to what they bought only if you keep the product — consider hiding it instead.'))req('/api/admin/products/'+x.id,{method:'DELETE'}).then(function(){VIEWS.products(v)})};
  $$('[data-mv]',li).forEach(function(b){b.onclick=function(){var ids=items.map(function(y){return y.id}),j=i+(+b.dataset.mv);if(j<0||j>=ids.length)return;var t=ids[i];ids[i]=ids[j];ids[j]=t;req('/api/admin/reorder',{body:{table:'products',ids:ids}}).then(function(){VIEWS.products(v)})}})})})};

VIEWS.storeset=function(v){withContent(function(c){var s=c.store;
 var F=[{k:'title',label:'Store title'},{k:'intro',label:'Intro'},{k:'free_label',label:'Free tab'},{k:'paid_label',label:'Paid tab'},{k:'owned_label',label:'Owned filter'},{k:'empty_owned',label:'Owned empty message'},{k:'empty',label:'Empty store message'},{k:'big_file_msg',label:'Big file message'},{k:'first_download_msg',label:'First download message'},{k:'usd_rate',label:'₹ per $1 (for USD view)',type:'number'}];
 v.innerHTML=top('Store settings')+'<div class="card" data-obj="store"><h2>Texts<button class="btn p s" data-save="store">Save</button></h2>'+formHTML(F,s,'st')+'</div>'+
 '<div class="card"><h2>Price filter ranges<button class="btn p s" id="svp">Save</button></h2><p class="muted small mb">Max 0 = no upper limit.</p><div id="pf"></div></div>'+
 '<div class="card"><h2>Bundle discounts (2–3 items together)<button class="btn p s" id="svb">Save</button></h2><p class="muted small mb">Buying this many paid items together gets this % off automatically.</p><div id="bd"></div></div>';
 objCardBind(v,'store',F);bindObjCards(v);
 var pf=listEditor($('#pf'),s.price_filters,[{k:'label',label:'Label'},{k:'min',label:'Min ₹',type:'number'},{k:'max',label:'Max ₹',type:'number'}],{label:'Range'});
 var bd=listEditor($('#bd'),s.bundles,[{k:'min_items',label:'Items',type:'number'},{k:'pct',label:'% off',type:'number'}],{label:'Bundle rule'});
 $('#svp').onclick=function(){saveContent('store',Object.assign({},ST.content.store,{price_filters:pf.get()}))};$('#svb').onclick=function(){saveContent('store',Object.assign({},ST.content.store,{bundles:bd.get()}))}})};

VIEWS.coupons=function(v){req('/api/admin/coupons').then(function(r){var items=r.items,t=Date.now();
 v.innerHTML=top('Coupons','<button class="btn p" id="add">'+I('plus')+' New coupon</button>')+'<p class="muted small mb">A coupon works only while it is Active and inside its start/expiry time.</p>'+
 (items.length?'<div class="card tw"><table class="tbl"><tr><th>Code</th><th>Discount</th><th>Rules</th><th>Valid</th><th>Used</th><th></th></tr>'+items.map(function(x){var live=x.active&&(!x.starts||x.starts<=t)&&(!x.expires||x.expires>=t);return '<tr><td><b>'+esc(x.code)+'</b><div class="faint small">'+esc(x.note||'')+'</div></td><td>'+(x.type==='flat'?money(x.value):x.value+'%')+'</td><td class="small">min '+x.min_items+' items'+(x.min_total?' · min '+money(x.min_total):'')+'</td><td class="small">'+(x.starts?fmtD(x.starts):'now')+' → '+(x.expires?fmtD(x.expires):'no expiry')+'<br>'+(live?'<span class="pill ok">live</span>':'<span class="pill">off</span>')+'</td><td>'+x.used+(x.max_uses?'/'+x.max_uses:'')+'</td><td><button class="ib" data-ed="'+x.id+'">'+I('doc')+'</button> <button class="ib" data-del="'+x.id+'">'+I('trash')+'</button></td></tr>'}).join('')+'</table></div>':'<div class="card muted">No coupons yet. Create festival offers, % off or flat ₹ off codes.</div>');
 var F=[{k:'code',label:'Code (e.g. DIWALI20)'},{k:'type',label:'Type',type:'select',options:[['pct','% off'],['flat','₹ off']]},{k:'value',label:'Value',type:'number'},{k:'min_items',label:'Minimum paid items',type:'number'},{k:'min_total',label:'Minimum order ₹',type:'number'},{k:'starts',label:'Starts',type:'date'},{k:'expires',label:'Expires',type:'date'},{k:'max_uses',label:'Max uses (0 = unlimited)',type:'number'},{k:'note',label:'Note (e.g. Diwali offer)'},{k:'active',label:'Active',type:'bool'}];
 function ed(x){openDlg(x?'Edit coupon':'New coupon',formHTML(F,x||{type:'pct',value:10,min_items:1,active:1},'cp')+'<button class="btn p" id="ok">Save</button>',function(b){$('#ok',b).onclick=function(){var d=readFields(b,F);d.active=d.active?1:0;req('/api/admin/coupons'+(x?'/'+x.id:''),{method:x?'PUT':'POST',body:d}).then(function(){closeDlg();toast('Saved ✓');VIEWS.coupons(v)})}})}
 $('#add').onclick=function(){ed(null)};$$('[data-ed]',v).forEach(function(b){b.onclick=function(){ed(items.find(function(x){return x.id==b.dataset.ed}))}});
 $$('[data-del]',v).forEach(function(b){b.onclick=function(){if(confirm('Delete coupon?'))req('/api/admin/coupons/'+b.dataset.del,{method:'DELETE'}).then(function(){VIEWS.coupons(v)})}})})};

/* ---------- orders ---------- */
VIEWS.orders=function(v){req('/api/admin/orders').then(function(r){var items=r.items;
 v.innerHTML=top('Orders')+(items.length?'<div class="card tw"><table class="tbl"><tr><th>Order</th><th>Buyer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr>'+items.map(function(o){return '<tr class="click" data-id="'+o.id+'"><td><b>'+esc(o.number)+'</b><div class="faint small">'+esc(o.provider||'')+'</div></td><td class="small">'+esc(o.email)+'</td><td class="small">'+o.items.map(function(i){return esc(i.title)}).join('<br>')+'</td><td>'+money(o.total)+(o.discount?'<div class="faint small">−'+money(o.discount)+(o.coupon?' '+esc(o.coupon):'')+'</div>':'')+'</td><td>'+pill(o.status)+'</td><td class="small">'+fmtD(o.created)+'</td></tr>'}).join('')+'</table></div>':'<div class="card muted">No orders yet.</div>');
 $$('tr[data-id]',v).forEach(function(tr){tr.onclick=function(){var o=items.find(function(x){return x.id==tr.dataset.id});
  openDlg('Order '+o.number,'<div class="row mb">'+pill(o.status)+'</div><dl class="kv"><dt>Buyer</dt><dd>'+esc(o.email)+'</dd><dt>Items</dt><dd>'+o.items.map(function(i){return esc(i.title)+' — '+(i.price?money(i.price):'Free')}).join('<br>')+'</dd><dt>Subtotal</dt><dd>'+money(o.subtotal)+'</dd><dt>Discount</dt><dd>'+money(o.discount)+(o.coupon?' ('+esc(o.coupon)+')':'')+'</dd><dt>Total</dt><dd><b>'+money(o.total)+'</b></dd><dt>Payment</dt><dd>'+esc(o.provider||'')+' '+esc(o.payment_id||'')+'</dd></dl>'+
  '<h3 class="small muted">Tracking</h3>'+o.events.map(function(e){return '<div class="small">✓ '+esc(e.s)+' <span class="faint">'+fmtD(e.at)+'</span></div>'}).join('')+
  '<div class="f mt"><label>Private note</label><textarea class="in" id="nt" rows="2">'+esc(o.note||'')+'</textarea></div><div class="row"><button class="btn g s" id="sn">Save note</button>'+(o.status==='created'?'<button class="btn p s" id="mp">Mark as paid &amp; deliver</button>':'')+(o.status==='delivered'?'<button class="btn r s" id="rf">Mark refunded</button>':'')+(o.status==='created'?'<button class="btn r s" id="cn">Cancel</button>':'')+'</div>',function(b){
   var act=function(a,ex){return req('/api/admin/orders/'+o.id,{body:Object.assign({action:a},ex||{})}).then(function(){toast('Done ✓');closeDlg();VIEWS.orders(v)})};
   $('#sn',b).onclick=function(){act('note',{note:$('#nt',b).value})};$('#mp',b)&&($('#mp',b).onclick=function(){if(confirm('Mark paid and give the buyer access?'))act('mark_paid')});
   $('#rf',b)&&($('#rf',b).onclick=function(){if(confirm('Mark refunded? The buyer loses access. (Refund the money from your Razorpay dashboard.)'))act('refund')});$('#cn',b)&&($('#cn',b).onclick=function(){act('cancel')})})}})})};

/* ---------- users ---------- */
VIEWS.users=function(v){req('/api/admin/users').then(function(r){var items=r.items;
 v.innerHTML=top('Users')+'<div class="row mb"><input class="in grow" id="us" placeholder="Search email or name"></div><div class="card tw"><table class="tbl" id="ut"></table></div>';
 function draw(q){q=(q||'').toLowerCase();$('#ut').innerHTML='<tr><th>User</th><th>Login</th><th>Owned</th><th>Joined</th><th>Last login</th><th></th></tr>'+items.filter(function(u){return !q||(u.email+' '+(u.name||'')).toLowerCase().indexOf(q)>-1}).map(function(u){return '<tr><td><b>'+esc(u.name||'')+'</b><div class="faint small">'+esc(u.email)+'</div></td><td class="small">'+(u.google?'Google ':'')+(u.has_pw?'Password ':'')+'Email code</td><td>'+u.owned+'</td><td class="small">'+fmtD(u.created)+'</td><td class="small">'+fmtD(u.last_login)+'</td><td>'+(u.disabled?'<button class="btn g s" data-a="enable" data-id="'+u.id+'">Enable</button>':'<button class="btn r s" data-a="disable" data-id="'+u.id+'">Block</button>')+'</td></tr>'}).join('');
  $$('[data-a]',v).forEach(function(b){b.onclick=function(){req('/api/admin/users/'+b.dataset.id,{body:{action:b.dataset.a}}).then(function(){toast('Done ✓');VIEWS.users(v)})}})}
 draw('');$('#us').oninput=function(e){draw(e.target.value)}})};

/* ---------- mail ---------- */
VIEWS.mail=function(v){var hq=new URLSearchParams((location.hash.split('?')[1])||'');
 req('/api/admin/mail').then(function(r){var A=r.accounts;
 var acc=function(k,label){var a=A[k];return '<div class="li"><div class="t"><b>'+esc(label)+' — '+esc(a.expected)+'</b><span>'+(a.connected?'Connected '+fmtD(a.connected_at)+(a.last_error?' · last error: '+esc(a.last_error):''):'Not connected')+'</span></div><div class="acts">'+(a.connected?'<span class="pill ok">connected</span><button class="btn g s" data-test="'+k+'">Send test</button><button class="btn r s" data-dis="'+k+'">Disconnect</button>':(r.google?'<a class="btn p s" href="/admin/mail/connect?account='+k+'">Connect</a>':'<span class="pill warn">setup pending</span>'))+'</div></div>'};
 v.innerHTML=top('Emails')+(hq.get('error')?'<div class="note">Connect failed: '+esc(hq.get('error'))+'</div>':'')+(hq.get('connected')?'<div class="okbox">'+esc(hq.get('connected'))+' Gmail connected ✓</div>':'')+
 '<div class="card"><h2>Sending accounts</h2><p class="muted small mb">Main = login codes, order thank-yous, download links, hire replies. Support = ticket replies only.</p>'+acc('main','Main')+acc('support','Support')+'<p class="faint small">Gmail allows about 500 emails a day per account (shared with your normal Gmail use).</p></div>'+
 '<div class="card"><h2>Send an email</h2><div class="g2"><div class="f"><label>To</label><input class="in" id="mt"></div><div class="f"><label>From</label><select class="in" id="ma"><option value="main">jangidcuts@gmail.com</option><option value="support">supportjangidcuts@gmail.com</option></select></div></div><div class="f"><label>Subject</label><input class="in" id="ms"></div><div class="f"><label>Message</label><textarea class="in" id="mb2" rows="5"></textarea></div><button class="btn p s" id="msend">'+I('mail')+' Send</button></div>'+
 '<div class="card"><h2>Offer / new product email to subscribers</h2><p class="muted small mb">Goes only to users who kept “Email notifications” ON in Settings. {name} = their name.</p><div class="f"><label>Subject</label><input class="in" id="bs"></div><div class="f"><label>Message</label><textarea class="in" id="bb" rows="5"></textarea></div><div class="row"><button class="btn g s" id="bdry">Count recipients</button><button class="btn p s" id="bsend">Send to all</button></div></div>'+
 '<div class="card tw"><h2>Recent emails</h2>'+(r.outbox.length?'<table class="tbl">'+r.outbox.map(function(m){return '<tr><td class="small">'+fmtD(m.created)+'</td><td class="small">'+esc(m.to_addr)+'<div class="faint">'+esc(m.account)+' · '+esc(m.kind)+'</div></td><td class="small">'+esc(m.subject)+(m.error?'<div class="faint">'+esc(m.error).slice(0,140)+'</div>':'')+'</td><td>'+pill(m.status)+'</td></tr>'}).join('')+'</table>':'<p class="muted small">No emails yet.</p>')+'</div>';
 $$('[data-test]',v).forEach(function(b){b.onclick=function(){req('/api/admin/mail/test',{body:{account:b.dataset.test}}).then(function(x){toast(x.ok?'Test email sent to your inbox ✓':'Failed: '+x.error,!x.ok)})}});
 $$('[data-dis]',v).forEach(function(b){b.onclick=function(){if(confirm('Disconnect this Gmail? Site emails from it will stop.'))req('/api/admin/mail/disconnect',{body:{account:b.dataset.dis}}).then(function(){VIEWS.mail(v)})}});
 $('#msend').onclick=function(){req('/api/admin/mail/send',{body:{to:$('#mt').value,account:$('#ma').value,subject:$('#ms').value,body:$('#mb2').value}}).then(function(x){toast(x.ok?'Sent ✓':'Failed: '+x.error,!x.ok)})};
 $('#bdry').onclick=function(){req('/api/admin/broadcast',{body:{subject:$('#bs').value||'x',body:$('#bb').value||'x',dry:true}}).then(function(x){toast(x.count+' subscribers would get it')})};
 $('#bsend').onclick=function(){if(confirm('Send this email to all subscribers now?'))req('/api/admin/broadcast',{body:{subject:$('#bs').value,body:$('#bb').value}}).then(function(x){toast('Sent to '+x.sent+' of '+x.total)})}})};

/* ---------- media ---------- */
VIEWS.media=function(v){req('/api/admin/media').then(function(r){var mb=function(n){return (n/1048576).toFixed(1)+' MB'};
 v.innerHTML=top('Media library','<button class="btn p" id="up">'+I('download')+' Upload</button>')+(r.storage.backend==='kv'?'<div class="note">Storage activation pending — files up to 25 MB each for now (about 1 GB total). Once cloud storage (R2, 10 GB free) is turned on, bigger files work automatically.</div>':'')+
 '<p class="muted small mb">Used: '+mb(r.used)+'</p><div class="card">'+(r.items.length?r.items.map(function(m){var img=/^image\//.test(m.type);return '<div class="li">'+(img?'<img class="thumb" src="/u/'+esc(m.key)+'" alt="">':'<span class="ib">'+I(m.folder==='private'?'lock':'doc')+'</span>')+'<div class="t"><b>'+esc(m.name)+'</b><span>'+esc(m.folder)+' · '+mb(m.size)+' · '+fmtD(m.created)+'</span></div><div class="acts">'+(m.folder!=='private'?'<button class="btn g s" data-cp="/u/'+esc(m.key)+'">Copy link</button>':'<span class="pill">private</span>')+'<button class="ib" data-del="'+esc(m.key)+'">'+I('trash')+'</button></div></div>'}).join(''):'<p class="muted">No uploads yet.</p>')+'</div>';
 $('#up').onclick=function(){pickFile('*/*',function(f){upload(f,'media').then(function(){VIEWS.media(v)})})};
 $$('[data-cp]',v).forEach(function(b){b.onclick=function(){navigator.clipboard&&navigator.clipboard.writeText(location.origin+b.dataset.cp);toast('Link copied')}});
 $$('[data-del]',v).forEach(function(b){b.onclick=function(){if(confirm('Delete this file? Anything using it will break.'))req('/api/admin/media',{method:'DELETE',body:{key:b.dataset.del}}).then(function(){VIEWS.media(v)})}})})};

/* ---------- settings ---------- */
VIEWS.settings=function(v){withContent(function(c){var pay=c._payments,al=c._alerts;
 v.innerHTML=top('Settings & security')+
 '<div class="card"><h2>2-step login (admin)</h2>'+(ST.me.totp_on?'<div class="okbox">2-step login is ON. You need your authenticator code on every new device.</div><div class="row"><input class="in" id="tdc" placeholder="Current 6-digit code" style="max-width:220px"><button class="btn r s" id="tdis">Turn off</button></div>':'<p class="muted small mb">Strongly recommended: after your password / Google login, the panel also asks for a 6-digit code from Google Authenticator on your phone.</p><button class="btn p s" id="tset">Turn on 2-step login</button><div id="tbox"></div>')+'</div>'+
 '<div class="card"><h2>Payments</h2>'+(pay.provider==='razorpay'&&pay.secret_set?'<div class="okbox">Razorpay is live.</div>':'<div class="note">Test mode — customers cannot pay yet; you can place test orders. Add your Razorpay keys to go live.</div>')+
 '<div class="g2"><div class="f"><label>Mode</label><select class="in" id="pm"><option value="test"'+(pay.provider!=='razorpay'?' selected':'')+'>Test mode</option><option value="razorpay"'+(pay.provider==='razorpay'?' selected':'')+'>Razorpay (live)</option></select></div><div class="f"><label>Razorpay Key ID</label><input class="in" id="pk" value="'+esc(pay.key_id)+'" placeholder="rzp_live_…"></div></div>'+
 '<div class="g2"><div class="f"><label>Razorpay Key Secret '+(pay.secret_set?'<span class="pill ok">saved</span>':'')+'</label><input class="in" id="ps" type="password" placeholder="'+(pay.secret_set?'•••••• (leave empty to keep)':'')+'"></div><div class="f"><label>Webhook secret '+(pay.webhook_set?'<span class="pill ok">saved</span>':'')+'</label><input class="in" id="pw" type="password"></div></div>'+
 '<p class="faint small mb">Webhook URL for Razorpay: '+esc(location.origin)+'/api/webhooks/razorpay (events: payment.captured, order.paid)</p><button class="btn p s" id="psv">Save payments</button></div>'+
 '<div class="card"><h2>Site problem alerts</h2><p class="muted small mb">You get an email (and Telegram message, if set) when something breaks, plus new sales, hire requests and tickets.</p><div class="g2"><div class="f"><label>Alert email</label><input class="in" id="ae" value="'+esc(al.email)+'"></div><div class="f"><label>Telegram chat ID</label><input class="in" id="ac" value="'+esc(al.telegram_chat_id)+'"></div></div><div class="f"><label>Telegram bot token '+(al.telegram_set?'<span class="pill ok">saved</span>':'')+'</label><input class="in" id="at" type="password" placeholder="from @BotFather"></div><button class="btn p s" id="asv">Save alerts</button></div>'+
 '<div class="card"><h2>Login devices</h2><div id="sess" class="small muted">Loading…</div><button class="btn r s mt" id="lall">Sign out all devices</button></div>'+
 '<div class="card"><h2>Backup</h2><p class="muted small mb">Download everything (content, products, orders, users, tickets) as one file. Keep it safe.</p><a class="btn g s" href="/api/admin/export">'+I('download')+' Download backup</a></div>'+
 '<div class="card"><h2>Advanced: edit any section as JSON</h2><div class="row mb"><select class="in" id="jk" style="max-width:260px">'+Object.keys(c).filter(function(k){return k[0]!=='_'}).map(function(k){return '<option>'+k+'</option>'}).join('')+'</select><button class="btn g s" id="jl">Load</button><button class="btn r s" id="jr">Reset to default</button></div><textarea class="in" id="jv" rows="12" style="font-family:monospace;font-size:12.5px"></textarea><button class="btn p s mt" id="js">Save JSON</button></div>';
 $('#tset')&&($('#tset').onclick=function(){req('/api/admin/totp/setup',{body:{}}).then(function(r){$('#tbox').innerHTML='<div class="mt small">1. Open Google Authenticator → + → “Enter a setup key”.<br>2. Account: Jangid Cuts · Key: <b style="font-family:monospace;letter-spacing:.1em">'+esc(r.secret.replace(/(.{4})/g,'$1 '))+'</b><br>Or on this phone: <a href="'+esc(r.uri)+'">open in authenticator app</a></div><div class="row mt"><input class="in" id="tc" placeholder="6-digit code" style="max-width:200px" inputmode="numeric"><button class="btn p s" id="ten">Confirm &amp; turn on</button></div>';
  $('#ten').onclick=function(){req('/api/admin/totp/enable',{body:{code:$('#tc').value}}).then(function(){ST.me.totp_on=true;toast('2-step login is ON ✓');VIEWS.settings(v)})}})});
 $('#tdis')&&($('#tdis').onclick=function(){req('/api/admin/totp/disable',{body:{code:$('#tdc').value}}).then(function(){ST.me.totp_on=false;toast('2-step login turned off');VIEWS.settings(v)})});
 $('#psv').onclick=function(){req('/api/admin/payments',{method:'PUT',body:{provider:$('#pm').value,key_id:$('#pk').value.trim(),key_secret:$('#ps').value.trim()||undefined,webhook_secret:$('#pw').value.trim()||undefined}}).then(function(){ST.content=null;toast('Payment settings saved ✓');VIEWS.settings(v)})};
 $('#asv').onclick=function(){req('/api/admin/alerts',{method:'PUT',body:{email:$('#ae').value.trim(),telegram_chat_id:$('#ac').value.trim(),telegram_bot_token:$('#at').value.trim()||undefined}}).then(function(){ST.content=null;toast('Saved ✓')})};
 req('/api/admin/sessions').then(function(r){$('#sess').innerHTML=r.items.map(function(s){return '<div style="margin-bottom:6px">'+(s.current?'<span class="pill ok">this device</span> ':'')+esc((s.ua||'').slice(0,80))+' · '+esc(s.ip)+' · '+fmtD(s.created)+'</div>'}).join('')});
 $('#lall').onclick=function(){if(confirm('Sign out everywhere (including here)?'))req('/api/auth/logout-all',{body:{}}).then(function(){location.reload()})};
 $('#jl').onclick=function(){$('#jv').value=JSON.stringify(ST.content[$('#jk').value],null,2)};
 $('#js').onclick=function(){var val;try{val=JSON.parse($('#jv').value)}catch(e){toast('That is not valid JSON',true);return}saveContent($('#jk').value,val)};
 $('#jr').onclick=function(){if(confirm('Reset "'+$('#jk').value+'" to the original default?'))req('/api/admin/content/'+$('#jk').value+'/reset',{body:{}}).then(function(){ST.content=null;toast('Reset ✓');VIEWS.settings(v)})}})};

/* ---------- boot ---------- */
function boot(){api('/api/me').then(function(r){var err=new URLSearchParams(location.search).get('error');
 if(!r.user){loginView(err==='login_first'?'Please sign in first.':null);return}
 if(!r.user.isAdmin){loginView('This account ('+r.user.email+') is not the site owner. Sign out and use the owner account.');return}
 ST.me=r.user;if(r.needMfa){loginView().mfa();return}
 layout();api('/api/admin/overview').then(function(o){if(o.ok){ST.ov=o;setDeskCount(o.pendingTickets+o.newHires)}})})}
boot();
})();
