(function(){'use strict';
var D=document,$=function(s,r){return (r||D).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function I(n){return '<svg class="icon" aria-hidden="true"><use href="#i-'+n+'"/></svg>'}
function api(path,body,method){return fetch(path,{method:method||(body?'POST':'GET'),credentials:'same-origin',headers:body?{'content-type':'application/json','x-jc':'1'}:{'x-jc':'1'},body:body?JSON.stringify(body):undefined}).then(function(r){return r.json().catch(function(){return{ok:false,error:'Something went wrong'}})}).catch(function(){return{ok:false,error:'You seem to be offline. Please try again.'}})}
function toast(m){window.JC_UI?JC_UI.toast(m):alert(m)}
function fdt(t){if(!t)return '';var d=new Date(t);return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})+', '+d.toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'})}
var S,C,ME,U,app,PRODS,CATS;var GK='jc-guest-cart';
function cur(){return (U&&U.currency)||localStorage.getItem('jc-currency')||'INR'}
function money(n){if(!n)return C.store.free_label||'Free';if(cur()==='USD'){var r=+C.store.usd_rate||84;return '$'+(n/r).toFixed(2)}return '₹'+Number(n).toLocaleString('en-IN')}
function prod(id){return PRODS.find(function(p){return p.id===+id})}
function owned(id){return !!(ME&&ME.owned&&ME.owned.some(function(o){return o.product_id===+id}))}
function ownRow(id){return ME&&ME.owned&&ME.owned.find(function(o){return o.product_id===+id})}
function guestCart(){try{return JSON.parse(localStorage.getItem(GK)||'[]')}catch(e){return []}}
function cartIds(){return U?(ME.cart||[]):guestCart()}
function inWish(id){return !!(U&&ME.wishlist.indexOf(+id)>=0)}
function catOf(p){return CATS.find(function(c){return c.id===p.category_id})}
function sectionOf(p){var c=catOf(p);while(c&&c.parent_id)c=CATS.find(function(x){return x.id===c.parent_id});return c?c.section:(p.price>0?'store_paid':'store_free')}
function rootCat(p){var c=catOf(p);while(c&&c.parent_id)c=CATS.find(function(x){return x.id===c.parent_id});return c}
function needLogin(msg){toast(msg||'Please sign in first');var m=$('#loginModal');m&&JC_UI.open(m)}
function refreshMe(){return api('/api/me').then(function(r){ME=r;U=r.user;JCL.user=U;cartBadge()})}
function cartBadge(){var n=cartIds().length;$$('.st-cart i').forEach(function(i){i.textContent=n;i.hidden=!n})}
function head(title,intro,extra){return '<section class="st-head"><div class="wrap"><div class="st-top"><div><span class="eyebrow">Jangid Cuts</span><h1 class="h-xl" style="margin-top:8px"><span class="shine">'+esc(title)+'</span></h1>'+(intro?'<p class="lead" style="margin-top:10px">'+esc(intro)+'</p>':'')+'</div><a class="st-cart" href="/cart" aria-label="Cart">'+I('cart')+'<i hidden>0</i></a></div>'+(extra||'')+'</div></section>'}
function signInBox(what){return '<div class="wrap"><div class="st-empty">'+I('lock')+'<p style="margin:10px 0 16px">Sign in to see '+esc(what)+'.</p><button class="btn btn-primary" id="siBtn">Sign in</button></div></div>'}
function bindSignIn(){var b=$('#siBtn');b&&(b.onclick=function(){JC_UI.open($('#loginModal'))})}

/* ---------- product card ---------- */
function card(p){var o=owned(p.id);var price=p.price?'<span class="price">'+money(p.price)+(p.mrp>p.price?'<s>'+money(p.mrp)+'</s>':'')+'</span>':'<span class="price free">'+esc(C.store.free_label||'Free')+'</span>';
 return '<article class="pc" data-p="'+p.id+'" tabindex="0"><div class="pc-img"><img src="'+esc(p.image||'/img/t1.jpg')+'" alt="" loading="lazy">'+(p.badge?'<span class="tag">'+esc(p.badge)+'</span>':'')+'</div><div class="pc-body"><h3>'+esc(p.title)+'</h3><p>'+esc(p.short||'')+'</p><div class="pc-foot">'+(o?'<span class="own-b">'+I('check')+' Owned</span>':price)+'<button class="btn btn-ghost btn-s" data-q="'+p.id+'">'+(o||!p.price?I('download')+' Get':'View')+'</button></div></div></article>'}
function bindCards(root){$$('.pc',root).forEach(function(el){el.onclick=function(){openProd(+el.dataset.p)};el.onkeydown=function(e){if(e.key==='Enter')openProd(+el.dataset.p)}})}

/* ---------- product modal ---------- */
function openProd(id){var p=prod(id);if(!p)return;var o=owned(id),m=$('#prodModal'),b=$('#pmBody');var row=ownRow(id);
 var revs=(S.reviews||[]).filter(function(r){return r.product_id===id});var avg=revs.length?(revs.reduce(function(a,r){return a+r.rating},0)/revs.length).toFixed(1):null;
 var acts;if(o||!p.price){acts='<button class="btn btn-primary" id="pmDl">'+I('download')+' '+(row&&row.downloads?'Download again':'Download')+'</button>'}
 else{var inC=cartIds().indexOf(id)>=0;acts='<button class="btn btn-primary" id="pmBuy">Buy now · '+money(p.price)+'</button><button class="btn btn-ghost" id="pmCart">'+I('cart')+' '+(inC?'In cart':'Add to cart')+'</button>'}
 var c=catOf(p);$('#pmEyebrow').textContent=(sectionOf(p)==='store_paid'?C.store.paid_label:C.store.free_label)+(c?' · '+c.name:'');
 b.innerHTML='<div class="pm-img"><img src="'+esc(p.image||'/img/t1.jpg')+'" alt=""></div><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><h2 class="pm-title">'+esc(p.title)+'</h2><button class="heart'+(inWish(id)?' on':'')+'" id="pmWish" aria-label="Wishlist">'+I('heart')+'</button></div>'+
  '<div class="pm-meta">'+(p.price?'<span class="price">'+money(p.price)+(p.mrp>p.price?'<s>'+money(p.mrp)+'</s>':'')+'</span>':'<span class="price free">Free</span>')+(p.size_text?'<span>'+esc(p.size_text)+'</span>':'')+(avg?'<span>★ '+avg+' ('+revs.length+')</span>':'')+(o?'<span class="own-b">'+I('check')+' Owned · lifetime access</span>':'')+'</div>'+
  '<div class="pm-desc">'+esc(p.description||p.short||'')+'</div><div class="pm-acts">'+acts+'</div>'+
  (p.delivery&&p.delivery!=='file'?'<p class="pm-note">'+I('mail')+' Big file: the download link is sent to your registered email.</p>':'')+(p.price&&!o?'<p class="pm-note">Secure payment: UPI, PhonePe, GPay, cards, netbanking. No refund once the download is enabled.</p>':'')+
  '<div style="margin-top:18px"><h3 class="h-md" style="font-size:22px">Reviews</h3>'+(o?'<div id="rateBox" class="rvw"><b>Rate this pack</b><div class="stars-in">'+[1,2,3,4,5].map(function(n){return '<button type="button" data-r="'+n+'" aria-label="'+n+' stars"><svg><use href="#i-star"/></svg></button>'}).join('')+'</div><textarea class="input" id="rvText" style="min-height:70px" placeholder="Write a short review (optional)"></textarea><button class="btn btn-ghost btn-s" id="rvSend" style="margin-top:8px">Post review</button></div>':'')+
  (revs.length?revs.map(function(r){return '<div class="rvw"><b>'+esc(r.name)+'</b> <span style="color:#ffc94d">'+'★★★★★'.slice(0,r.rating)+'</span><p>'+esc(r.text)+'</p></div>'}).join(''):'<p class="pm-note">No reviews yet.</p>')+'</div>';
 var dl=$('#pmDl',b);dl&&(dl.onclick=function(){download(id,dl)});
 var buy=$('#pmBuy',b);buy&&(buy.onclick=function(){addCart(id,true)});
 var ac=$('#pmCart',b);ac&&(ac.onclick=function(){addCart(id,false);ac.innerHTML=I('cart')+' In cart'});
 $('#pmWish',b).onclick=function(){if(!U)return needLogin('Sign in to save to your wishlist');var on=!inWish(id);api('/api/wishlist',{product_id:id,op:on?'add':'remove'}).then(function(){if(on)ME.wishlist.push(id);else ME.wishlist=ME.wishlist.filter(function(x){return x!==id});$('#pmWish',b).classList.toggle('on',on);toast(on?'Saved to wishlist':'Removed from wishlist')})};
 var rating=0;$$('.stars-in button',b).forEach(function(x){x.onclick=function(){rating=+x.dataset.r;$$('.stars-in button',b).forEach(function(y){y.classList.toggle('on',+y.dataset.r<=rating)})}});
 var rs=$('#rvSend',b);rs&&(rs.onclick=function(){if(!rating){toast('Tap the stars to rate');return}api('/api/reviews',{product_id:id,rating:rating,text:$('#rvText',b).value}).then(function(r){toast(r.ok?(r.message||'Thanks for your review!'):r.error)})});
 JC_UI.open(m)}

function download(id,btn){if(!U)return needLogin('Sign in to download (free, takes 10 seconds)');
 api('/api/download/'+id+'?check=1').then(function(r){if(r.ok===false){toast(r.error);return}
  if(r.emailed){api('/api/download/'+id).then(function(x){if(x.ok===false){toast(x.error);return}toast(C.store.big_file_msg)})}
  else{var a=D.createElement('a');a.href='/api/download/'+id;a.download='';D.body.appendChild(a);a.click();a.remove();toast(r.first?C.store.first_download_msg:'Download started')}
  if(btn)btn.innerHTML=I('download')+' Download again';refreshMe()})}
function addCart(id,go){if(U){if(ME.cart.indexOf(id)<0)ME.cart.push(id);api('/api/cart',{product_id:id,op:'add'}).then(function(){cartBadge();if(go)location.href='/cart';else toast('Added to cart')})}
 else{var g=guestCart();if(g.indexOf(id)<0)g.push(id);localStorage.setItem(GK,JSON.stringify(g));cartBadge();if(go)location.href='/cart';else toast('Added to cart')}}

/* ---------- STORE ---------- */
var st={sec:'store_free',cat:0,sub:0,price:-1};
function viewStore(){var q=new URLSearchParams(location.search);if(q.get('tab')==='paid')st.sec='store_paid';if(q.get('tab')==='owned')st.sec='owned';
 app.innerHTML=head(C.store.title,C.store.intro,'<div class="st-bar"><div class="tabs" role="tablist" style="margin-top:6px"><button class="tab" data-s="store_free">'+esc(C.store.free_label)+'</button><button class="tab" data-s="store_paid">'+esc(C.store.paid_label)+'</button><button class="tab" data-s="owned">'+esc(C.store.owned_label)+'</button></div><div class="chips" id="cChips"></div><div class="chips subcats" id="sChips"></div><div class="chips" id="pChips"></div></div>')+'<div class="wrap"><div class="st-grid" id="grid"></div></div>';
 $$('.tab',app).forEach(function(t){t.onclick=function(){st.sec=t.dataset.s;st.cat=0;st.sub=0;st.price=-1;draw()}});draw();
 function draw(){$$('.tab',app).forEach(function(t){t.setAttribute('aria-selected',t.dataset.s===st.sec?'true':'false')});
  var chip=function(lbl,on,attr){return '<button class="chip" aria-pressed="'+(on?'true':'false')+'" '+attr+'>'+esc(lbl)+'</button>'};
  var roots=st.sec==='owned'?[]:CATS.filter(function(c){return c.section===st.sec&&!c.parent_id});
  $('#cChips').innerHTML=roots.length?chip('All',!st.cat,'data-c="0"')+roots.map(function(c){return chip(c.name,st.cat===c.id,'data-c="'+c.id+'"')}).join(''):'';
  var subs=st.cat?CATS.filter(function(c){return c.parent_id===st.cat}):[];$('#sChips').innerHTML=subs.length?chip('All',!st.sub,'data-sc="0"')+subs.map(function(c){return chip(c.name,st.sub===c.id,'data-sc="'+c.id+'"')}).join(''):'';$('#sChips').classList.toggle('hidden',!subs.length);
  var pf=C.store.price_filters||[];$('#pChips').innerHTML=st.sec==='store_paid'&&pf.length?chip('Any price',st.price<0,'data-pr="-1"')+pf.map(function(f,i){return chip(f.label,st.price===i,'data-pr="'+i+'"')}).join(''):'';
  $$('[data-c]',app).forEach(function(b){b.onclick=function(){st.cat=+b.dataset.c;st.sub=0;draw()}});$$('[data-sc]',app).forEach(function(b){b.onclick=function(){st.sub=+b.dataset.sc;draw()}});$$('[data-pr]',app).forEach(function(b){b.onclick=function(){st.price=+b.dataset.pr;draw()}});
  var under=function(p,cid){var c=catOf(p);while(c){if(c.id===cid)return true;c=CATS.find(function(x){return x.id===c.parent_id})}return false};
  var list=PRODS.filter(function(p){if(st.sec==='owned')return owned(p.id);if(sectionOf(p)!==st.sec)return false;if(st.cat&&!under(p,st.cat))return false;if(st.sub&&!under(p,st.sub))return false;
   if(st.price>=0){var f=pf[st.price];if(p.price<(+f.min||0))return false;if(+f.max&&p.price>+f.max)return false}return true});
  var g=$('#grid');if(st.sec==='owned'&&!U){g.outerHTML='<div id="grid">'+signInBox('your purchases').replace('<div class="wrap">','<div>')+'</div>';bindSignIn();return}
  if(g.tagName!=='DIV'||!g.classList.contains('st-grid')){g.outerHTML='<div class="st-grid" id="grid"></div>';g=$('#grid')}
  if(!list.length){g.className='';g.innerHTML='<div class="st-empty">'+esc(st.sec==='owned'?C.store.empty_owned:C.store.empty)+'</div>';return}
  g.className='st-grid';g.innerHTML=list.map(card).join('');bindCards(g)}}

/* ---------- CART ---------- */
function viewCart(){var ids=cartIds().filter(function(id){return prod(id)});
 app.innerHTML=head('Cart','')+'<div class="wrap" id="cw"></div>';var w=$('#cw');
 if(!ids.length){w.innerHTML='<div class="st-empty">Your cart is empty.<br><a class="btn btn-primary" style="margin-top:16px" href="/store?tab=paid">Browse the store</a></div>';return}
 var coupon='';
 w.innerHTML='<div class="st-list">'+ids.map(function(id){var p=prod(id);return '<div class="li2"><img src="'+esc(p.image)+'" alt=""><div class="t"><b>'+esc(p.title)+'</b><span>'+(owned(id)?'Already owned':money(p.price))+'</span></div><button class="heart" data-rm="'+id+'" aria-label="Remove">'+I('trash')+'</button></div>'}).join('')+'</div>'+
  '<div class="sum"><div class="field"><label for="cpIn">Coupon code</label><div class="row2b"><input class="input st-in" id="cpIn" placeholder="Have a coupon?" style="text-transform:uppercase"><button class="btn btn-ghost btn-s" id="cpGo" style="flex:0 0 auto">Apply</button></div></div><div id="qt">…</div>'+
  '<label class="check" style="margin:12px 0"><input type="checkbox" id="cTc"> <span>I have read the <a class="tc-link" href="/terms" target="_blank">Terms &amp; Conditions</a> (no refund once the download is enabled)</span></label><button class="btn btn-primary" style="width:100%" id="payBtn">Pay securely</button><p class="pm-note" style="text-align:center">UPI · PhonePe · GPay · Cards · Netbanking</p></div>';
 $$('[data-rm]',w).forEach(function(b){b.onclick=function(){var id=+b.dataset.rm;if(U){ME.cart=ME.cart.filter(function(x){return x!==id});api('/api/cart',{product_id:id,op:'remove'}).then(viewCart)}else{localStorage.setItem(GK,JSON.stringify(guestCart().filter(function(x){return x!==id})));viewCart()}cartBadge()}});
 function q(){api('/api/checkout/quote',{items:ids,coupon:coupon}).then(function(r){if(r.ok===false){$('#qt').textContent=r.error;return}
  $('#qt').innerHTML='<div class="r"><span>Subtotal</span><span>'+money(r.subtotal)+'</span></div>'+(r.bundle?'<div class="r disc"><span>Bundle discount ('+r.bundlePct+'%)</span><span>−'+money(r.bundle)+'</span></div>':'')+(r.couponOff?'<div class="r disc"><span>Coupon '+esc(coupon)+'</span><span>−'+money(r.couponOff)+'</span></div>':'')+(r.couponError?'<div class="r" style="color:#ff8a8a"><span>'+esc(r.couponError)+'</span></div>':'')+'<div class="r tot"><span>Total</span><span>'+(r.total?money(r.total):'Free')+'</span></div>'+(cur()==='USD'?'<p class="pm-note">Charged in INR (₹'+r.total+'). USD is an estimate.</p>':'');
  var nb=(C.store.bundles||[]).filter(function(b){return +b.min_items>r.items.filter(function(i){return i.price>0}).length}).sort(function(a,b){return a.min_items-b.min_items})[0];if(nb)$('#qt').innerHTML+='<p class="pm-note">Add '+(nb.min_items-r.items.filter(function(i){return i.price>0}).length)+' more paid item(s) to get '+nb.pct+'% off.</p>'})}
 q();$('#cpGo').onclick=function(){coupon=$('#cpIn').value.trim().toUpperCase();q()};
 $('#payBtn').onclick=function(){if(!U)return needLogin('Sign in to complete your purchase');if(!$('#cTc').checked){toast('Please tick the Terms & Conditions box');return}var b=this;b.disabled=true;
  api('/api/checkout/create',{items:ids,coupon:coupon,tc:true}).then(function(r){b.disabled=false;if(r.ok===false){toast(r.error);return}
   if(r.paid){done(r.order.number);return}
   if(r.razorpay){payRzp(r);return}
   if(r.test){if(r.canSimulate){if(confirm('Payments are in TEST mode. Simulate a successful payment for '+r.order.number+'? (owner only)'))api('/api/checkout/simulate',{order:r.order.number}).then(function(x){x.ok?done(r.order.number):toast(x.error)})}else toast('Online payment is being set up. Please try again soon or contact us.')}})}}
function done(num){api('/api/cart',{op:'clear'}).then(function(){toast('Payment confirmed ✓ Order '+num);location.href='/orders'})}
function payRzp(r){function go(){var o=r.razorpay;var rz=new window.Razorpay({key:o.key,order_id:o.order_id,amount:o.amount,currency:o.currency,name:o.name,description:o.description,prefill:o.prefill,theme:{color:'#14c79e'},
  handler:function(resp){api('/api/checkout/verify',{order:r.order.number,razorpay_order_id:resp.razorpay_order_id,razorpay_payment_id:resp.razorpay_payment_id,razorpay_signature:resp.razorpay_signature}).then(function(x){if(x.ok===false){toast(x.error);return}done(r.order.number)})},
  modal:{ondismiss:function(){toast('Payment cancelled. Your cart is saved.')}}});rz.open()}
 if(window.Razorpay)go();else{var s=D.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=go;s.onerror=function(){toast('Could not load the payment window. Check your connection.')};D.body.appendChild(s)}}

/* ---------- ORDERS ---------- */
function viewOrders(){app.innerHTML=head('My Orders','Your purchases, downloads and order tracking.');if(!U){app.innerHTML+=signInBox('your orders');bindSignIn();return}
 var w=D.createElement('div');w.className='wrap';w.style.paddingBottom='70px';app.appendChild(w);
 var own=(ME.owned||[]).map(function(o){return prod(o.product_id)}).filter(Boolean);
 w.innerHTML='<h3 class="h-md" style="margin:18px 0 6px">Downloads</h3>'+(own.length?'<div class="st-list">'+own.map(function(p){var r=ownRow(p.id);return '<div class="li2"><img src="'+esc(p.image)+'" alt=""><div class="t"><b>'+esc(p.title)+'</b><span>'+(p.size_text?esc(p.size_text)+' · ':'')+'lifetime access</span></div><button class="btn btn-primary btn-s" data-dl="'+p.id+'">'+I('download')+(r.downloads?' Again':' Get')+'</button></div>'}).join('')+'</div>':'<div class="st-empty">'+esc(C.store.empty_owned)+'</div>')+
 '<h3 class="h-md" style="margin:26px 0 10px">Orders</h3>'+((ME.orders||[]).length?ME.orders.map(function(o){var ev=o.events||[];var steps=['Order confirmed','Payment confirmed','Delivered'];
  return '<div class="ord"><div class="ord-h"><b>'+esc(o.number)+'</b><span class="pill2 '+(o.status==='delivered'?'ok':o.status==='created'?'warn':'')+'">'+esc(o.status==='created'?'awaiting payment':o.status)+'</span></div><p class="pm-note">'+o.items.map(function(i){return esc(i.title)}).join(', ')+' · '+(o.total?'₹'+o.total:'Free')+(o.discount?' (saved ₹'+o.discount+')':'')+'</p>'+
  '<div class="track">'+steps.map(function(sn){var e=ev.find(function(x){return x.s===sn});return '<div class="tr'+(e?' done':'')+'"><i></i><div><b>'+sn+'</b><span>'+(e?fdt(e.t):'—')+'</span></div></div>'}).join('')+'</div></div>'}).join(''):'<div class="st-empty">No orders yet.</div>');
 $$('[data-dl]',w).forEach(function(b){b.onclick=function(){download(+b.dataset.dl,null);b.innerHTML=I('download')+' Again'}})}

/* ---------- WISHLIST ---------- */
function viewWish(){app.innerHTML=head('Wishlist','');if(!U){app.innerHTML+=signInBox('your wishlist');bindSignIn();return}
 var list=ME.wishlist.map(prod).filter(Boolean);app.innerHTML+='<div class="wrap">'+(list.length?'<div class="st-grid">'+list.map(card).join('')+'</div>':'<div class="st-empty">Nothing saved yet. Tap ♡ on any pack to save it.</div>')+'</div>';bindCards(app)}

/* ---------- TICKETS ---------- */
function viewTickets(){app.innerHTML=head('My Tickets','Problems you reported and their status.');if(!U){app.innerHTML+=signInBox('your tickets');bindSignIn();return}
 var t=ME.tickets||[];app.innerHTML+='<div class="wrap" style="padding-bottom:70px">'+(t.length?t.map(function(x){var solved=x.status==='solved'||x.status==='closed';return '<div class="ord"><div class="ord-h"><b>'+esc(x.number)+'</b><span class="pill2 '+(solved?'ok':'warn')+'">'+(solved?'Solution sent to your email':esc(x.status==='open'?'Open':x.status))+'</span></div><p class="pm-note">'+fdt(x.created)+'</p><p style="color:var(--muted);font-size:14.5px;margin-top:6px;white-space:pre-line">'+esc(String(x.message).slice(0,400))+'</p></div>'}).join(''):'<div class="st-empty">No tickets. Facing an issue? <a class="tc-link" href="/help.html#issue">Let us know</a></div>')+'<p style="margin-top:14px"><a class="btn btn-ghost" href="/help.html#issue">'+I('help')+' Report a new issue</a></p></div>'}

/* ---------- PROFILE ---------- */
function viewProfile(){app.innerHTML=head('My Profile','');if(!U){app.innerHTML+=signInBox('your profile');bindSignIn();return}
 var w=D.createElement('div');w.className='wrap';w.style.paddingBottom='70px';app.appendChild(w);
 var ini=(U.name||U.email).trim()[0].toUpperCase();
 w.innerHTML='<div class="pf-card"><div class="pf-av"><div class="ph" id="avPh">'+(U.avatar?'<img src="'+esc(U.avatar)+'" alt="">':esc(ini))+'</div><div style="flex:1;min-width:0"><b style="font-size:17px">'+esc(U.name||'')+'</b><div style="color:var(--muted);font-size:14px;word-break:break-all">'+esc(U.email)+'</div><button class="tc-link" id="avBtn" style="margin-top:6px">Change photo</button></div></div>'+
  '<div class="field" style="margin-top:16px"><label for="pfName">Name</label><div class="row2b"><input class="input st-in" id="pfName" value="'+esc(U.name||'')+'"><button class="btn btn-ghost btn-s" id="pfSave" style="flex:0 0 auto">Save</button></div></div></div>'+
  '<div class="pf-links" style="margin-bottom:14px"><a href="/orders">'+I('bag')+' My orders</a><a href="/cart">'+I('cart')+' Cart</a><a href="/wishlist">'+I('heart')+' Wishlist</a><a href="/tickets">'+I('doc')+' My tickets</a>'+(U.isAdmin?'<a href="/admin">'+I('shield')+' Admin panel</a>':'')+'</div>'+
  '<div class="pf-card"><h3>Change password</h3><p class="pm-note" style="margin:-4px 0 10px">We email you a code to confirm it is you.</p><div id="cpw"><button class="btn btn-ghost btn-s" id="cpSend">Email me a code</button></div></div>'+
  '<div class="pf-card"><h3>Your data</h3><div class="row2b"><a class="btn btn-ghost btn-s" href="/api/me/export">'+I('download')+' Download my data</a><button class="btn btn-ghost btn-s" id="loAll">'+I('logout')+' Sign out everywhere</button><button class="btn btn-ghost btn-s" id="lo">'+I('logout')+' Sign out</button></div></div>'+
  '<div class="pf-card"><h3>Delete account</h3><p class="pm-note" style="margin:-4px 0 10px">Removes your account and lifetime access to purchases. This cannot be undone.</p><div id="del"><button class="btn btn-ghost btn-s danger" id="delSend">Delete my account</button></div></div>';
 $('#pfSave').onclick=function(){api('/api/me/profile',{name:$('#pfName').value}).then(function(r){toast(r.ok?'Saved ✓':r.error)})};
 $('#avBtn').onclick=function(){var i=D.createElement('input');i.type='file';i.accept='image/*';i.onchange=function(){var f=i.files[0];if(!f)return;shrink(f,512).then(function(bl){return fetch('/api/me/avatar',{method:'POST',headers:{'content-type':'image/jpeg','x-jc':'1'},body:bl}).then(function(r){return r.json()})}).then(function(r){if(r.ok===false){toast(r.error);return}$('#avPh').innerHTML='<img src="'+esc(r.url)+'" alt="">';toast('Photo updated ✓')})};i.click()};
 $('#cpSend').onclick=function(){api('/api/auth/otp',{email:U.email,purpose:'change'}).then(function(r){if(r.ok===false){toast(r.error);return}
  $('#cpw').innerHTML='<div class="field"><label>Code from your email</label><input class="input st-in" id="cpC" inputmode="numeric" maxlength="6"></div><div class="field"><label>New password</label><input class="input st-in" id="cp1" type="password" autocomplete="new-password"></div><div class="field"><label>Confirm new password</label><input class="input st-in" id="cp2" type="password" autocomplete="new-password"></div><button class="btn btn-primary btn-s" id="cpGo2">Change password</button>';
  $('#cpGo2').onclick=function(){api('/api/auth/reset',{email:U.email,purpose:'change',code:$('#cpC').value,password:$('#cp1').value,confirm:$('#cp2').value}).then(function(x){toast(x.ok===false?x.error:'Password changed ✓');if(x.ok!==false)viewProfile()})}})};
 $('#lo').onclick=function(){api('/api/auth/logout',{}).then(function(){location.href='/'})};
 $('#loAll').onclick=function(){if(confirm('Sign out on all devices?'))api('/api/auth/logout-all',{}).then(function(){location.href='/'})};
 $('#delSend').onclick=function(){if(!confirm('Really delete your account? You will lose access to everything you bought.'))return;api('/api/auth/otp',{email:U.email,purpose:'delete'}).then(function(r){if(r.ok===false){toast(r.error);return}
  $('#del').innerHTML='<div class="field"><label>Code from your email</label><input class="input st-in" id="dC" inputmode="numeric" maxlength="6"></div><button class="btn btn-ghost btn-s danger" id="dGo">Delete forever</button>';
  $('#dGo').onclick=function(){api('/api/me/delete',{code:$('#dC').value}).then(function(x){if(x.ok===false){toast(x.error);return}toast('Account deleted');setTimeout(function(){location.href='/'},900)})}})}}
function shrink(f,max){return new Promise(function(res,rej){var img=new Image();img.onload=function(){var s=Math.min(1,max/Math.max(img.width,img.height));var c=D.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);c.toBlob(function(b){b?res(b):rej()},'image/jpeg',.85)};img.onerror=rej;img.src=URL.createObjectURL(f)})}

window.JC_AFTER=function(site,me){S=site;C=site.content;ME=me&&me.user?me:{user:null,cart:[],wishlist:[],owned:[],orders:[],tickets:[]};U=ME.user;PRODS=site.products;CATS=site.categories;app=$('#app');if(!app)return;
 var go=function(){var p=location.pathname.replace(/\/$/,'');var V={'/store':viewStore,'/cart':viewCart,'/orders':viewOrders,'/wishlist':viewWish,'/tickets':viewTickets,'/profile':viewProfile}[p]||viewStore;V();cartBadge();
  var t={'/store':C.store.title,'/cart':'Cart','/orders':'My Orders','/wishlist':'Wishlist','/tickets':'My Tickets','/profile':'My Profile'}[p];if(t)D.title=t+' | Jangid Cuts';
  var pq=new URLSearchParams(location.search).get('p');if(pq&&prod(pq))setTimeout(function(){openProd(+pq)},400)};
 var g=guestCart();if(U&&g.length){api('/api/cart',{ids:g,op:'add'}).then(function(){localStorage.removeItem(GK);return refreshMe()}).then(go)}else go()};
})();
