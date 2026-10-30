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
function offTag(p){return p.price&&p.mrp>p.price&&p.off?'<em class="off">'+p.off+'% OFF</em>':''}
function priceHTML(p){return p.price?'<span class="price">'+money(p.price)+(p.mrp>p.price?'<s>'+money(p.mrp)+'</s>':'')+'</span>':'<span class="price free">'+esc(C.store.free_label||'Free')+'</span>'}
function saleBar(){var s=C.store.sale||{},fo=+S.firstOffer||0,h='';
 /* banners are managed in Admin → Store settings → Store banners; without a saved list the two classic ones show */
 var list=Array.isArray(C.store.banners)?C.store.banners:[{title:'{label}',text:'Up to {pct}% off on packs',icon:'tag',when:'sale',show:true},{title:'First order?',text:'Get an extra {first}% off at checkout.',icon:'bag',when:'first',show:true}];
 var saleOn=!!(s.on&&+s.pct>0),firstOn=!!(fo&&(!U||ME.firstBuyer));
 function f(t){return String(t||'').replace(/\{pct\}/g,+s.pct||0).replace(/\{label\}/g,s.label||(window.JC_I18N&&JC_I18N.t?JC_I18N.t('Sale'):'Sale')).replace(/\{first\}/g,fo)}
 list.forEach(function(b){if(!b||!b.show)return;if(b.when==='sale'&&!saleOn)return;if(b.when==='first'&&!firstOn)return;var t=f(b.title).trim(),x=f(b.text).trim();if(!t&&!x)return;
  h+='<div class="sale-bar'+(b.when==='first'?' first':'')+'">'+I(b.icon||'tag')+(t?'<b>'+esc(t)+'</b>':'')+(t&&x?'<i class="sb-dot">·</i>':'')+(x?'<span>'+esc(x)+'</span>':'')+'</div>'});
 return h?'<div class="sale-bars">'+h+'</div>':''}
function card(p){var o=owned(p.id);var price=priceHTML(p);
 return '<article class="pc" data-p="'+p.id+'" tabindex="0"><div class="pc-img"><img src="'+esc(p.image||'/img/t1.jpg')+'" alt="" loading="lazy">'+(p.badge?'<span class="tag">'+esc(p.badge)+'</span>':'')+(o?'':offTag(p))+'</div><div class="pc-body"><h3>'+esc(p.title)+'</h3>'+rateTag(p)+'<p>'+esc(p.short||'')+'</p><div class="pc-foot">'+(o?'<span class="own-b">'+I('check')+' Owned</span>':price)+'<button class="btn btn-ghost btn-s" data-q="'+p.id+'">'+(o||!p.price?I('download')+' Get':'View')+'</button></div></div></article>'}
function bindCards(root){$$('.pc',root).forEach(function(el){el.onclick=function(){openProd(+el.dataset.p)};el.onkeydown=function(e){if(e.key==='Enter')openProd(+el.dataset.p)}})}

/* ---------- product modal ---------- */
function rvRow(r){return '<div class="rvw rv-row"><img class="rv-av" src="'+esc(r.photo||('/img/av/'+(1+((+r.id||0)%10))+'.svg'))+'" alt="" loading="lazy"><div class="rv-c"><b>'+esc(r.name)+'</b> <span class="rv-st" aria-label="'+r.rating+' out of 5 stars">'+'★★★★★'.slice(0,r.rating)+'<i>'+'★★★★★'.slice(r.rating)+'</i></span>'+(r.role?'<span class="rv-vb">'+esc(r.role)+'</span>':'')+(r.text?'<p>'+esc(r.text)+'</p>':'')+(r.reply?'<div class="rv-reply"><b>Reply from Prashant</b>'+esc(r.reply)+'</div>':'')+'</div></div>'}
function rateTag(p){var r=p.rating;return r&&r.count?'<span class="pc-rate" aria-label="Rated '+(+r.avg).toFixed(1)+' out of 5 from '+r.count+' reviews">'+I('star')+' '+(+r.avg).toFixed(1)+' <i>('+r.count+')</i></span>':''}
function openProd(id,opts){var p=prod(id);if(!p)return;var o=owned(id),m=$('#prodModal'),b=$('#pmBody');var row=ownRow(id);var mine=(ME.reviews||[]).find(function(r){return r.product_id===id});
 var revs=(S.reviews||[]).filter(function(r){return r.product_id===id});var rt=p.rating,avg=rt&&rt.count?(+rt.avg).toFixed(1):null;var topIds=p.top||[],topR=topIds.map(function(t){return revs.find(function(r){return r.id===t})}).filter(Boolean),moreR=revs.filter(function(r){return topIds.indexOf(r.id)<0}).sort(function(a,b){return b.created-a.created});
 var acts;if(o||!p.price){acts='<button class="btn btn-primary" id="pmDl">'+I('download')+' '+(row&&row.downloads?'Download again':'Download')+'</button>'}
 else{var inC=cartIds().indexOf(id)>=0;acts='<button class="btn btn-primary" id="pmBuy">Buy now · '+money(p.price)+'</button><button class="btn btn-ghost" id="pmCart">'+I('cart')+' '+(inC?'In cart':'Add to cart')+'</button>'}
 var c=catOf(p);$('#pmEyebrow').textContent=(sectionOf(p)==='store_paid'?C.store.paid_label:C.store.free_label)+(c?' · '+c.name:'');
 b.innerHTML='<div class="pm-img"><img src="'+esc(p.image||'/img/t1.jpg')+'" alt="">'+(p.has_video?'<a class="pm-play" href="/watch/p'+p.id+'?from=store" aria-label="Watch preview"><span>'+I('play')+'</span><b>Watch preview</b></a>':'')+'</div><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><h2 class="pm-title">'+esc(p.title)+'</h2><button class="heart'+(inWish(id)?' on':'')+'" id="pmWish" aria-label="Wishlist">'+I('heart')+'</button></div>'+
  '<div class="pm-meta">'+(p.price?'<span class="price">'+money(p.price)+(p.mrp>p.price?'<s>'+money(p.mrp)+'</s>':'')+'</span>'+(o?'':offTag(p)):'<span class="price free">Free</span>')+(p.size_text?'<span>'+esc(p.size_text)+'</span>':'')+(avg?'<span class="pm-rate">'+I('star')+' '+avg+' <i>('+rt.count+(rt.count===1?' review':' reviews')+')</i></span>':'')+(o?'<span class="own-b">'+I('check')+' Owned · lifetime access</span>':'')+'</div>'+
  '<div class="pm-desc">'+esc(p.description||p.short||'')+'</div><div class="pm-acts">'+acts+'</div>'+
  (p.delivery&&p.delivery!=='file'?'<p class="pm-note">'+I('mail')+' Big file: the download link is sent to your registered email.</p>':'')+(p.price&&!o?'<p class="pm-note">Secure payment: UPI, PhonePe, GPay, cards, netbanking. No refund once the download is enabled.</p>':'')+
  '<div style="margin-top:18px" id="pmRev"><h3 class="h-md" style="font-size:22px">Reviews</h3>'+(o?'<div id="rateBox" class="rvw rate-box"><b>'+(mine?'Your rating · edit any time':'Rate this pack')+'</b><div class="stars-in">'+[1,2,3,4,5].map(function(n){return '<button type="button" data-r="'+n+'" aria-label="'+n+' stars"'+(mine&&n<=mine.rating?' class="on"':'')+'><svg><use href="#i-star"/></svg></button>'}).join('')+'</div><textarea class="input" id="rvText" style="min-height:70px" maxlength="1000" placeholder="Write a short review (optional)">'+(mine?esc(mine.text||''):'')+'</textarea><button class="btn btn-primary btn-s" id="rvSend" style="margin-top:8px">'+(mine?'Update review':'Post review')+'</button>'+(mine&&mine.status==='hidden'?'<p class="pm-note">Your review is not shown publicly right now.</p>':'')+'</div>':'<p class="pm-note">Only buyers of this pack can rate it.</p>')+
  (revs.length?topR.map(rvRow).join('')+(moreR.length?'<div id="pmMore" hidden>'+moreR.map(rvRow).join('')+'</div><button type="button" class="btn btn-ghost btn-s pm-more" id="pmMoreBtn">See all '+revs.length+' reviews</button>':''):'<p class="pm-note">No reviews yet.</p>')+'</div>';
 var dl=$('#pmDl',b);dl&&(dl.onclick=function(){download(id,dl)});
 var mb=$('#pmMoreBtn',b);mb&&(mb.onclick=function(){$('#pmMore',b).hidden=false;mb.remove()});
 var buy=$('#pmBuy',b);buy&&(buy.onclick=function(){addCart(id,true)});
 var ac=$('#pmCart',b);ac&&(ac.onclick=function(){addCart(id,false);ac.innerHTML=I('cart')+' In cart'});
 $('#pmWish',b).onclick=function(){if(!U)return needLogin('Sign in to save to your wishlist');var on=!inWish(id);api('/api/wishlist',{product_id:id,op:on?'add':'remove'}).then(function(){if(on)ME.wishlist.push(id);else ME.wishlist=ME.wishlist.filter(function(x){return x!==id});$('#pmWish',b).classList.toggle('on',on);toast(on?'Saved to wishlist':'Removed from wishlist')})};
 var rating=mine?+mine.rating:0;$$('.stars-in button',b).forEach(function(x){x.onclick=function(){rating=+x.dataset.r;$$('.stars-in button',b).forEach(function(y){y.classList.toggle('on',+y.dataset.r<=rating)})}});
 var rs=$('#rvSend',b);rs&&(rs.onclick=function(){if(!rating){toast('Tap the stars to rate');return}rs.disabled=true;api('/api/reviews',{product_id:id,rating:rating,text:$('#rvText',b).value}).then(function(r){rs.disabled=false;if(!r.ok){toast(r.error||'Could not save your review');return}toast(r.message||'Thanks for your review!');Promise.all([refreshMe(),api('/api/site')]).then(function(a){if(a[1]&&a[1].reviews){S.reviews=a[1].reviews;if(a[1].products)PRODS=a[1].products}openProd(id,{rate:1})})})});
 JC_UI.open(m);if(opts&&opts.rate)setTimeout(function(){var box=$('#rateBox',b);if(box)box.scrollIntoView({behavior:'smooth',block:'center'})},80)}

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
 app.innerHTML=head(C.store.title,C.store.intro,saleBar()+'<div class="st-bar"><div class="tabs" role="tablist" style="margin-top:6px"><button class="tab" data-s="store_free">'+esc(C.store.free_label)+'</button><button class="tab" data-s="store_paid">'+esc(C.store.paid_label)+'</button><button class="tab" data-s="owned">'+esc(C.store.owned_label)+'</button></div><div class="chips" id="cChips"></div><div class="chips subcats" id="sChips"></div><div class="chips" id="pChips"></div></div>')+'<div class="wrap"><div class="st-grid" id="grid"></div>'+((C.ads||{}).enabled&&((C.ads||{}).slots||{}).store?'<div class="ad-wrap" data-ad="store" hidden></div>':'')+'</div>';
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
 w.innerHTML='<div class="st-list">'+ids.map(function(id){var p=prod(id);return '<div class="li2"><img src="'+esc(p.image)+'" alt=""><div class="t"><b>'+esc(p.title)+'</b><span>'+(owned(id)?'Already owned':money(p.price)+(p.mrp>p.price?' <s>'+money(p.mrp)+'</s>':'')+(p.off&&p.mrp>p.price?' '+offTag(p):''))+'</span></div><button class="heart" data-rm="'+id+'" aria-label="Remove">'+I('trash')+'</button></div>'}).join('')+'</div>'+
  '<div class="sum"><div class="field"><label for="cpIn">Coupon code</label><div class="row2b"><input class="input st-in" id="cpIn" placeholder="Have a coupon?" style="text-transform:uppercase"><button class="btn btn-ghost btn-s" id="cpGo" style="flex:0 0 auto">Apply</button></div></div><div id="qt">…</div>'+
  '<label class="check" style="margin:12px 0"><input type="checkbox" id="cTc"> <span>I have read the <a class="tc-link" href="/terms" target="_blank">Terms &amp; Conditions</a> (no refund once the download is enabled)</span></label><button class="btn btn-primary" style="width:100%" id="payBtn">Pay securely</button><p class="pm-note" style="text-align:center">UPI · PhonePe · GPay · Cards · Netbanking</p></div>';
 $$('[data-rm]',w).forEach(function(b){b.onclick=function(){var id=+b.dataset.rm;if(U){ME.cart=ME.cart.filter(function(x){return x!==id});api('/api/cart',{product_id:id,op:'remove'}).then(viewCart)}else{localStorage.setItem(GK,JSON.stringify(guestCart().filter(function(x){return x!==id})));viewCart()}cartBadge()}});
 function q(){api('/api/checkout/quote',{items:ids,coupon:coupon}).then(function(r){if(r.ok===false){$('#qt').textContent=r.error;return}
  var n=r.items.length,save=(r.packSave||0)+(r.discount||0);
  $('#qt').innerHTML='<div class="r"><span>Price ('+n+' '+(n===1?'item':'items')+')</span><span>'+money(r.mrpTotal||r.subtotal)+'</span></div>'+(r.packSave?'<div class="r disc"><span>Discount on packs</span><span>−'+money(r.packSave)+'</span></div>':'')+(r.bundle?'<div class="r disc"><span>Bundle discount ('+r.bundlePct+'%)</span><span>−'+money(r.bundle)+'</span></div>':'')+(r.firstOff?'<div class="r disc"><span>First order discount ('+r.firstPct+'%)</span><span>−'+money(r.firstOff)+'</span></div>':'')+(r.couponOff?'<div class="r disc"><span>Coupon '+esc(coupon)+'</span><span>−'+money(r.couponOff)+'</span></div>':'')+(r.couponError?'<div class="r" style="color:#ff8a8a"><span>'+esc(r.couponError)+'</span></div>':'')+'<div class="r tot"><span>Total</span><span>'+(r.total?money(r.total):'Free')+'</span></div>'+(save>0&&r.total?'<p class="save-note">You save '+money(save)+' on this order</p>':'')+(!U&&r.firstOffer&&r.firstEligible?'<p class="pm-note">'+I('bag')+' Sign in and get an extra '+r.firstOffer+'% off — first order discount.</p>':'')+(cur()==='USD'?'<p class="pm-note">Charged in INR (₹'+r.total+'). USD is an estimate.</p>':'');
  var nb=(C.store.bundles||[]).filter(function(b){return +b.min_items>r.items.filter(function(i){return i.price>0}).length}).sort(function(a,b){return a.min_items-b.min_items})[0];if(nb)$('#qt').innerHTML+='<p class="pm-note">Add '+(nb.min_items-r.items.filter(function(i){return i.price>0}).length)+' more paid item(s) to get '+nb.pct+'% off.</p>'})}
 q();$('#cpGo').onclick=function(){coupon=$('#cpIn').value.trim().toUpperCase();q()};
 $('#payBtn').onclick=function(){if(!U)return needLogin('Sign in to complete your purchase');if(!$('#cTc').checked){toast('Please tick the Terms & Conditions box');return}var b=this;b.disabled=true;
  api('/api/checkout/create',{items:ids,coupon:coupon,tc:true}).then(function(r){b.disabled=false;if(r.ok===false){toast(r.error);return}
   if(r.paid){done(r.order.number);return}
   if(r.upi){payUpi(r);return}
   if(r.razorpay){payRzp(r);return}
   if(r.test){if(r.canSimulate){if(confirm('Payments are in TEST mode. Simulate a successful payment for '+r.order.number+'? (owner only)'))api('/api/checkout/simulate',{order:r.order.number}).then(function(x){x.ok?done(r.order.number):toast(x.error)})}else toast('Online payment is being set up. Please try again soon or contact us.')}})}}
function done(num){api('/api/cart',{op:'clear'}).then(function(){location.href='/orders?thanks='+encodeURIComponent(num)})}
/* ---------- manual UPI payment (Oct 30) — swap for Razorpay later: the server stops sending r.upi ---------- */
function loadQr(cb){if(window.qrcode)return cb();var s=D.createElement('script');s.src='/vendor/qrcode.js?v=1';s.onload=cb;s.onerror=cb;D.body.appendChild(s)}
function payUpi(r){var u=r.upi,num=(r.order&&r.order.number)||u.number;
 var m=D.createElement('div');m.className='crop-m upi-m';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label','Pay with UPI');
 m.innerHTML='<div class="crop-card upi-card"><button type="button" class="upi-x" aria-label="Close">×</button><h3>Pay with UPI</h3>'+
  '<div class="upi-amt">'+esc(u.amountText)+'</div><p class="crop-hint">Order '+esc(num)+'</p>'+
  '<div class="upi-qr" aria-label="UPI QR code"></div><p class="crop-hint">Scan with any UPI app (GPay, PhonePe, Paytm, BHIM). The amount fills in by itself.</p>'+
  '<div class="upi-id"><span><small>UPI ID</small><b>'+esc(u.id)+'</b></span><button type="button" class="btn btn-ghost btn-s" data-copy>Copy</button></div>'+
  '<a class="btn btn-primary upi-app" href="'+esc(u.link)+'">Pay with UPI app</a>'+
  '<div class="upi-step"><label for="upiUtr">After paying, enter the UTR / transaction ID</label><input id="upiUtr" class="input st-in" inputmode="numeric" autocomplete="off" maxlength="14" placeholder="12-digit UTR number"><small>Find it in your UPI app under payment details (also called UPI Ref No. or UPI transaction ID).</small></div>'+
  '<div class="crop-acts"><button type="button" class="btn btn-ghost" data-later>Pay later</button><button type="button" class="btn btn-primary" data-sub>Submit</button></div></div>';
 D.body.appendChild(m);D.documentElement.classList.add('crop-lock');requestAnimationFrame(function(){m.classList.add('on')});
 var box=$('.upi-qr',m);
 loadQr(function(){try{var q=window.qrcode(0,'M');q.addData(u.link);q.make();box.innerHTML=q.createSvgTag({cellSize:6,margin:3,scalable:true})}catch(e){box.innerHTML=u.qr?'<img src="'+esc(u.qr)+'" alt="UPI QR code">':''}});
 function close(){m.remove();D.documentElement.classList.remove('crop-lock')}
 $('.upi-x',m).onclick=close;$('[data-later]',m).onclick=function(){close();toast('Your order '+num+' is saved. You can pay any time from My Orders.')};
 $('[data-copy]',m).onclick=function(){var b=this;function ok(){b.textContent='Copied ✓';setTimeout(function(){b.textContent='Copy'},1800)}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u.id).then(ok,function(){prompt('Copy the UPI ID',u.id)});else prompt('Copy the UPI ID',u.id)};
 var inp=$('#upiUtr',m);inp.oninput=function(){var v=inp.value.replace(/\D/g,'').slice(0,12);if(v!==inp.value)inp.value=v};
 $('[data-sub]',m).onclick=function(){var b=this,v=inp.value.replace(/\D/g,'');if(v.length!==12){toast('Please enter the 12-digit UTR / transaction ID from your UPI app.');inp.focus();return}
  b.disabled=true;b.textContent='Submitting…';
  api('/api/checkout/upi-submit',{order:num,utr:v}).then(function(x){b.disabled=false;b.textContent='Submit';if(x.ok===false){toast(x.error);return}
   try{localStorage.removeItem(GK)}catch(e){}if(ME)ME.cart=[];
   $('.upi-card',m).innerHTML='<div class="upi-ok">'+I('check')+'</div><h3>Payment processing</h3><p class="upi-msg">Your payment is being verified (Payment processing). You\u2019ll get access once confirmed.</p><p class="crop-hint">Order '+esc(num)+' · UTR '+esc(v)+'<br>We\u2019ve emailed you too. You can track this order in My Orders.</p><div class="crop-acts"><a class="btn btn-ghost" href="/store">Keep browsing</a><a class="btn btn-primary" href="/orders">Track order</a></div>'})}}
function upiReopen(num){api('/api/checkout/upi',{order:num}).then(function(r){if(r.ok===false){toast(r.error);return}payUpi(r)})}
function payRzp(r){function go(){var o=r.razorpay;var rz=new window.Razorpay({key:o.key,order_id:o.order_id,amount:o.amount,currency:o.currency,name:o.name,description:o.description,prefill:o.prefill,theme:{color:'#14c79e'},
  handler:function(resp){api('/api/checkout/verify',{order:r.order.number,razorpay_order_id:resp.razorpay_order_id,razorpay_payment_id:resp.razorpay_payment_id,razorpay_signature:resp.razorpay_signature}).then(function(x){if(x.ok===false){toast(x.error);return}done(r.order.number)})},
  modal:{ondismiss:function(){toast('Payment cancelled. Your cart is saved.')}}});rz.open()}
 if(window.Razorpay)go();else{var s=D.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.onload=go;s.onerror=function(){toast('Could not load the payment window. Check your connection.')};D.body.appendChild(s)}}

/* ---------- ORDERS ---------- */
function viewOrders(){app.innerHTML=head('My Orders','Your purchases, downloads and order tracking.');if(!U){app.innerHTML+=signInBox('your orders');bindSignIn();return}
 var w=D.createElement('div');w.className='wrap';w.style.paddingBottom='70px';app.appendChild(w);
 var own=(ME.owned||[]).map(function(o){return prod(o.product_id)}).filter(Boolean);
 w.innerHTML='<p class="tk-actions" style="margin-top:14px"><a class="btn btn-ghost" href="/track-order">'+I('bag')+' Track order</a></p><h3 class="h-md" id="dlList" style="margin:18px 0 6px">Downloads</h3>'+(own.length?'<div class="st-list">'+own.map(function(p){var r=ownRow(p.id);return '<div class="li2"><img src="'+esc(p.image)+'" alt=""><div class="t"><b>'+esc(p.title)+'</b><span>'+(p.size_text?esc(p.size_text)+' · ':'')+'lifetime access</span>'+rateTag(p)+'</div><button class="btn btn-primary btn-s" data-dl="'+p.id+'">'+I('download')+(r.downloads?' Again':' Get')+'</button><button class="btn btn-ghost btn-s" data-rate="'+p.id+'">Rate this pack</button></div>'}).join('')+'</div>':'<div class="st-empty">'+esc(C.store.empty_owned)+'</div>')+
 '<h3 class="h-md" style="margin:26px 0 10px">Orders</h3>'+((ME.orders||[]).length?ME.orders.map(function(o){var rateActions=(o.items||[]).filter(function(i){return owned(i.id||i.product_id)}).map(function(i){return '<button class="btn btn-ghost btn-s" data-rate="'+(i.id||i.product_id)+'">Rate '+esc(i.title||'this pack')+'</button>'}).join('');if(o.track&&window.JCL&&JCL.tkTimeline)return JCL.tkTimeline(o.track).replace('<div class="tk-card','<div class="tk-card tk-in-orders')+(o.track.payable?'<div class="order-rate-actions"><button class="btn btn-primary btn-s" data-upipay="'+esc(o.number)+'">Pay with UPI</button></div>':'')+(o.track.utr&&o.status==='verifying'?'<p class="pm-note">UTR '+esc(o.track.utr)+' · your payment is being verified. You\u2019ll get access once confirmed.</p>':'')+(rateActions?'<div class="order-rate-actions">'+rateActions+'</div>':'');var ev=o.events||[];var steps=['Order confirmed','Payment confirmed','Delivered'];
  return '<div class="ord"><div class="ord-h"><b>'+esc(o.number)+'</b><span class="pill2 '+(o.status==='delivered'?'ok':o.status==='created'?'warn':'')+'">'+esc(o.status==='created'?'awaiting payment':o.status)+'</span></div><p class="pm-note">'+o.items.map(function(i){return esc(i.title)}).join(', ')+' · '+(o.total?'₹'+o.total:'Free')+((o.discount||0)+((o.meta&&o.meta.packSave)||0)?' (saved ₹'+((o.discount||0)+((o.meta&&o.meta.packSave)||0))+')':'')+(o.meta&&o.meta.firstOff?' · first order discount ₹'+o.meta.firstOff:'')+'</p>'+
  '<div class="track">'+steps.map(function(sn){var e=ev.find(function(x){return x.s===sn});return '<div class="tr'+(e?' done':'')+'"><i></i><div><b>'+sn+'</b><span>'+(e?fdt(e.t):'—')+'</span></div></div>'}).join('')+'</div></div>'+(rateActions?'<div class="order-rate-actions">'+rateActions+'</div>':'')}).join(''):'<div class="st-empty">No orders yet.</div>');
 $$('[data-rate]',w).forEach(function(b){b.onclick=function(){openProd(+b.dataset.rate,{rate:1})}});
 $$('[data-upipay]',w).forEach(function(b){b.onclick=function(){upiReopen(b.dataset.upipay)}});
 $$('[data-dl]',w).forEach(function(b){b.onclick=function(){download(+b.dataset.dl,null);b.innerHTML=I('download')+' Again'}})}

/* ---------- WISHLIST ---------- */
function viewWish(){app.innerHTML=head('Wishlist','');if(!U){app.innerHTML+=signInBox('your wishlist');bindSignIn();return}
 var list=ME.wishlist.map(prod).filter(Boolean);app.innerHTML+='<div class="wrap">'+(list.length?'<div class="st-grid">'+list.map(card).join('')+'</div>':'<div class="st-empty">Nothing saved yet. Tap ♡ on any pack to save it.</div>')+'</div>';bindCards(app)}

/* ---------- MY REQUESTS (hire requests, support tickets, orders) ---------- */
function viewTickets(){app.innerHTML=head('My Requests','Your hire requests, support tickets and orders, with their live status.');if(!U){app.innerHTML+=signInBox('your requests');bindSignIn();return}
 var TL=window.JCL&&JCL.tkTimeline,H=ME.hires||[],T=ME.tickets||[],O=(ME.orders||[]).filter(function(o){return o.track}).map(function(o){return o.track});
 var tabs=[['hire','Hire requests',H,'/track-hire','Track hire request'],['ticket','Support tickets',T,'/track-ticket','Track support ticket'],['order','Orders',O,'/track-order','Track order']];
 var q=new URLSearchParams(location.search).get('tab');var cur=tabs.some(function(t){return t[0]===q})?q:(T.length&&!H.length?'ticket':H.length?'hire':O.length?'order':'hire');
 var w=D.createElement('div');w.className='wrap';w.style.paddingBottom='70px';app.appendChild(w);
 var empty={hire:'No hire requests yet. <a class="tc-link" href="/?hire=1">Send a hire request</a>',ticket:'No tickets yet. Have a question or facing a problem? <a class="tc-link" href="/support">Contact support</a>',order:'No orders yet. <a class="tc-link" href="/store">Browse the store</a>'};
 var draw=function(){var t=tabs.filter(function(x){return x[0]===cur})[0];
  w.innerHTML='<div class="trk-tabs mr-tabs" role="tablist">'+tabs.map(function(x){return '<a class="trk-tab'+(x[0]===cur?' on':'')+'" role="tab" aria-selected="'+(x[0]===cur)+'" href="/tickets?tab='+x[0]+'" data-tab="'+x[0]+'"><span>'+esc(x[1])+'</span><b class="mr-n">'+x[2].length+'</b></a>'}).join('')+'</div>'+
   '<p class="tk-actions">'+(cur==='hire'?'<a class="btn btn-primary" href="/?hire=1">'+I('doc')+' New hire request</a>':cur==='ticket'?'<a class="btn btn-primary" href="/support?type=question">'+I('help')+' Ask a question</a><a class="btn btn-ghost" href="/support?type=problem">Report a problem</a>':'<a class="btn btn-primary" href="/orders">'+I('download')+' My downloads</a>')+'<a class="btn btn-ghost" href="'+t[3]+'">'+esc(t[4])+'</a></p>'+
   (t[2].length?t[2].map(function(x){return TL?TL(x):'<div class="ord"><b>'+esc(x.number)+'</b> '+esc(x.label||x.status)+'</div>'}).join(''):'<div class="st-empty">'+empty[cur]+'</div>');
  $$('[data-tab]',w).forEach(function(a){a.onclick=function(e){e.preventDefault();cur=a.dataset.tab;try{history.replaceState(null,'','/tickets?tab='+cur)}catch(x){}draw()}})};
 draw()}

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
 function avUpload(){var i=D.createElement('input');i.type='file';i.accept='image/*';i.onchange=function(){var f=i.files[0];if(!f)return;if(!/^image\//.test(f.type)&&!/\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(f.name)){toast('Please choose a photo');return}
  cropPhoto(f,function(bl,done){fetch('/api/me/avatar',{method:'POST',headers:{'content-type':bl.type||'image/jpeg','x-jc':'1'},body:bl}).then(function(r){return r.json()}).then(function(r){if(r.ok===false){toast(r.error);done(false);return}$('#avPh').innerHTML='<img src="'+esc(r.url)+'" alt="">';if(U)U.avatar=r.url;var dp=$('#dpAv');if(dp)dp.innerHTML='<img src="'+esc(r.url)+'" alt="">';toast('Photo updated ✓');done(true)}).catch(function(){toast('Upload failed. Check your connection and try again.');done(false)})})};i.click()};
 function avSet(url,msg){api('/api/me/profile',{avatar:url}).then(function(r){if(r.ok===false){toast(r.error);return}if(U)U.avatar=url;var ini2=esc((U.name||U.email).trim()[0].toUpperCase());var html=url?'<img src="'+esc(url)+'" alt="">':ini2;$('#avPh').innerHTML=html;var dp=$('#dpAv');if(dp)dp.innerHTML=html;try{window.JCL&&JCL.user&&(JCL.user.avatar=url)}catch(e){}toast(msg)})}
 /* one tidy photo sheet: Upload photo / ready-made avatars (no face, for privacy) / Remove photo */
 $('#avBtn').onclick=function(){var ov=D.createElement('div');ov.className='av-ov';var cur=U.avatar||'';
  var AV=[];for(var k=1;k<=10;k++)AV.push('/img/av/'+k+'.svg');
  ov.innerHTML='<div class="av-sheet" role="dialog" aria-modal="true" aria-labelledby="avT"><div class="av-hd"><b id="avT">Profile photo</b><button class="av-x" aria-label="Close">'+I('x')+'</button></div>'+
   '<button class="btn btn-primary av-up" type="button">'+I('download')+' Upload a photo</button>'+
   '<p class="av-lbl">Or pick a ready-made avatar <span>· no face, keeps you private</span></p><div class="av-grid">'+AV.map(function(u,n){return '<button type="button" class="av-pick'+(cur===u?' on':'')+'" data-u="'+u+'" aria-label="Avatar '+(n+1)+'"><img src="'+u+'" alt="" loading="lazy"></button>'}).join('')+'</div>'+
   '<p class="av-note">Your photo and name show on your reviews.</p>'+
   (cur?'<button class="btn btn-ghost btn-s danger av-rm" type="button">'+I('trash')+' Remove photo</button>':'')+'</div>';
  D.body.appendChild(ov);requestAnimationFrame(function(){ov.classList.add('on')});
  function close(){ov.classList.remove('on');D.removeEventListener('keydown',esc1);setTimeout(function(){ov.remove()},220)}
  function esc1(e){if(e.key==='Escape')close()}D.addEventListener('keydown',esc1);
  ov.addEventListener('click',function(e){if(e.target===ov)close()});$('.av-x',ov).onclick=close;
  $('.av-up',ov).onclick=function(){close();avUpload()};
  $$('.av-pick',ov).forEach(function(b){b.onclick=function(){avSet(b.dataset.u,'Avatar set ✓');close()}});
  var rm=$('.av-rm',ov);if(rm)rm.onclick=function(){avSet('','Photo removed');close()}};
 $('#cpSend').onclick=function(){api('/api/auth/otp',{email:U.email,purpose:'change'}).then(function(r){if(r.ok===false){toast(r.error);return}
  $('#cpw').innerHTML='<div class="field"><label>Code from your email</label><input class="input st-in" id="cpC" inputmode="numeric" maxlength="6"></div><div class="field"><label>New password</label><input class="input st-in" id="cp1" type="password" autocomplete="new-password"></div><div class="field"><label>Confirm new password</label><input class="input st-in" id="cp2" type="password" autocomplete="new-password"></div><button class="btn btn-primary btn-s" id="cpGo2">Change password</button>';
  $('#cpGo2').onclick=function(){api('/api/auth/reset',{email:U.email,purpose:'change',code:$('#cpC').value,password:$('#cp1').value,confirm:$('#cp2').value}).then(function(x){toast(x.ok===false?x.error:'Password changed ✓');if(x.ok!==false)viewProfile()})}})};
 $('#lo').onclick=function(){api('/api/auth/logout',{}).then(function(){location.href='/'})};
 $('#loAll').onclick=function(){if(confirm('Sign out on all devices?'))api('/api/auth/logout-all',{}).then(function(){location.href='/'})};
 $('#delSend').onclick=function(){if(!confirm('Really delete your account? You will lose access to everything you bought.'))return;api('/api/auth/otp',{email:U.email,purpose:'delete'}).then(function(r){if(r.ok===false){toast(r.error);return}
  $('#del').innerHTML='<div class="field"><label>Code from your email</label><input class="input st-in" id="dC" inputmode="numeric" maxlength="6"></div><button class="btn btn-ghost btn-s danger" id="dGo">Delete forever</button>';
  $('#dGo').onclick=function(){api('/api/me/delete',{code:$('#dC').value}).then(function(x){if(x.ok===false){toast(x.error);return}toast('Account deleted');setTimeout(function(){location.href='/'},900)})}})}}

/* ---------- profile photo crop (circle preview, zoom slider + pinch + wheel, drag to move) ---------- */
function cropPhoto(file,cb){var url=URL.createObjectURL(file),img=new Image();
 img.onerror=function(){URL.revokeObjectURL(url);toast('This image could not be opened. Try a JPG or PNG.')};
 img.onload=function(){var W=img.naturalWidth,H=img.naturalHeight;if(!W||!H){img.onerror();return}
  var m=D.createElement('div');m.className='crop-m';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-label','Adjust your photo');
  m.innerHTML='<div class="crop-card"><h3>Adjust your photo</h3><p class="crop-hint">Drag to move · pinch or use the slider to zoom</p><div class="crop-stage" tabindex="0" aria-label="Photo preview"><img alt="" draggable="false"><div class="crop-ring"></div></div>'+
   '<div class="crop-zoom"><button type="button" class="crop-zb" data-z="-1" aria-label="Zoom out">−</button><input type="range" min="1" max="4" step="0.01" value="1" aria-label="Zoom"><button type="button" class="crop-zb" data-z="1" aria-label="Zoom in">+</button></div>'+
   '<div class="crop-acts"><button type="button" class="btn btn-ghost" data-c="0">Cancel</button><button type="button" class="btn btn-primary" data-c="1">Save</button></div></div>';
  D.body.appendChild(m);D.documentElement.classList.add('crop-lock');
  var stage=$('.crop-stage',m),im=$('img',stage),rng=$('input[type=range]',m);im.src=url;im.style.width=W+'px';im.style.height=H+'px';
  var Sz=0,base=1,z=1,x=0,y=0,ptr={},pinch=null;
  function size(){Sz=stage.clientWidth;base=Sz/Math.min(W,H)}
  function clamp(){var s=base*z,mx=Math.max(0,(W*s-Sz)/2),my=Math.max(0,(H*s-Sz)/2);x=Math.max(-mx,Math.min(mx,x));y=Math.max(-my,Math.min(my,y))}
  function draw(){clamp();im.style.transform='translate(-50%,-50%) translate('+x+'px,'+y+'px) scale('+(base*z)+')'}
  function setZ(nz,cx,cy){nz=Math.max(1,Math.min(4,nz));if(cx!=null){var k=nz/z;x=cx-(cx-x)*k;y=cy-(cy-y)*k}z=nz;rng.value=z;draw()}
  size();draw();requestAnimationFrame(function(){size();draw();m.classList.add('on')});
  var onR=function(){size();draw()};window.addEventListener('resize',onR);
  rng.oninput=function(){setZ(+rng.value,0,0)};
  $$('.crop-zb',m).forEach(function(b){b.onclick=function(){setZ(z+(+b.dataset.z)*0.25,0,0)}});
  function local(e){var r=stage.getBoundingClientRect();return{x:e.clientX-r.left-r.width/2,y:e.clientY-r.top-r.height/2}}
  stage.addEventListener('pointerdown',function(e){stage.setPointerCapture(e.pointerId);ptr[e.pointerId]={x:e.clientX,y:e.clientY};var ks=Object.keys(ptr);
   if(ks.length===2){var a=ptr[ks[0]],b=ptr[ks[1]];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:z}}e.preventDefault()});
  stage.addEventListener('pointermove',function(e){var p=ptr[e.pointerId];if(!p)return;var ks=Object.keys(ptr);
   if(ks.length>=2&&pinch){var o=ptr[ks[0]===String(e.pointerId)?ks[1]:ks[0]];var mid0={x:(p.x+o.x)/2,y:(p.y+o.y)/2};p.x=e.clientX;p.y=e.clientY;var mid1={x:(p.x+o.x)/2,y:(p.y+o.y)/2};
    x+=mid1.x-mid0.x;y+=mid1.y-mid0.y;var c=local({clientX:mid1.x,clientY:mid1.y});setZ(pinch.z*(Math.hypot(p.x-o.x,p.y-o.y)/pinch.d),c.x,c.y)}
   else{x+=e.clientX-p.x;y+=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;draw()}});
  function up(e){delete ptr[e.pointerId];if(Object.keys(ptr).length<2)pinch=null}
  stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);
  stage.addEventListener('wheel',function(e){e.preventDefault();var c=local(e);setZ(z*Math.exp(-e.deltaY*0.0015),c.x,c.y)},{passive:false});
  stage.addEventListener('keydown',function(e){var k=e.key,st=12;if(k==='ArrowLeft')x+=st;else if(k==='ArrowRight')x-=st;else if(k==='ArrowUp')y+=st;else if(k==='ArrowDown')y-=st;else if(k==='+'||k==='=')return setZ(z+0.1,0,0);else if(k==='-')return setZ(z-0.1,0,0);else return;e.preventDefault();draw()});
  function close(){window.removeEventListener('resize',onR);D.removeEventListener('keydown',esc1);D.documentElement.classList.remove('crop-lock');m.remove();URL.revokeObjectURL(url)}
  function esc1(e){if(e.key==='Escape')close()}D.addEventListener('keydown',esc1);
  m.addEventListener('click',function(e){if(e.target===m)close()});
  $('[data-c="0"]',m).onclick=close;
  $('[data-c="1"]',m).onclick=function(){var b=this;b.disabled=true;b.textContent='Saving…';var O=512,c=D.createElement('canvas');c.width=c.height=O;var g=c.getContext('2d'),k=O/Sz,s=base*z*k;
   g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.fillStyle='#000';g.fillRect(0,0,O,O);g.translate(O/2+x*k,O/2+y*k);g.scale(s,s);g.drawImage(img,-W/2,-H/2);
   var fin=function(bl){if(!bl){b.disabled=false;b.textContent='Save';toast('Could not prepare the photo. Try another image.');return}cb(bl,function(ok){if(ok)close();else{b.disabled=false;b.textContent='Save'}})};
   c.toBlob(function(bl){if(bl&&bl.type==='image/webp')fin(bl);else c.toBlob(fin,'image/jpeg',0.9)},'image/webp',0.9)};
  setTimeout(function(){stage.focus()},50)};
 img.src=url}
function shrink(f,max){return new Promise(function(res,rej){var img=new Image();img.onload=function(){var s=Math.min(1,max/Math.max(img.width,img.height));var c=D.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);c.toBlob(function(b){b?res(b):rej()},'image/jpeg',.85)};img.onerror=rej;img.src=URL.createObjectURL(f)})}

window.JC_AFTER=function(site,me){S=site;C=site.content;ME=me&&me.user?me:{user:null,cart:[],wishlist:[],owned:[],orders:[],tickets:[]};U=ME.user;PRODS=site.products;CATS=site.categories;app=$('#app');if(!app)return;
 var go=function(){var p=location.pathname.replace(/\/$/,'');var V={'/store':viewStore,'/cart':viewCart,'/orders':viewOrders,'/wishlist':viewWish,'/tickets':viewTickets,'/profile':viewProfile}[p]||viewStore;V();cartBadge();
  var t={'/store':C.store.title,'/cart':'Cart','/orders':'My Orders','/wishlist':'Wishlist','/tickets':'My Requests','/profile':'My Profile'}[p];if(t)D.title=t+' | Jangid Cuts';
  var pqs=new URLSearchParams(location.search),pq=pqs.get('p');if(pq){pqs.delete('p');try{history.replaceState(history.state,'',location.pathname+(pqs.toString()?'?'+pqs:'')+location.hash)}catch(e){}}if(pq&&prod(pq))setTimeout(function(){openProd(+pq)},400);else if(pq)setTimeout(function(){toast('This item is not available right now.')},400)};
 var g=guestCart();if(U&&g.length){api('/api/cart',{ids:g,op:'add'}).then(function(){localStorage.removeItem(GK);return refreshMe()}).then(go)}else go()};
})();
