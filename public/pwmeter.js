/* Jangid Cuts password strength ring: attaches under every "set a password" field (autocomplete=new-password, not the confirm box).
   Only an indicator: any characters are allowed; the only rule is 6+ characters (checked on the server too). */
(function(){'use strict';
var D=document;
var COMMON=('123456 1234567 12345678 123456789 1234567890 password password1 password123 passw0rd qwerty qwerty123 qwertyuiop 111111 000000 123123 abc123 abcdef '+
 'iloveyou admin admin123 welcome welcome1 letmein monkey dragon sunshine princess football baseball master shadow superman batman 654321 666666 '+
 '121212 112233 987654321 asdfgh asdfghjkl zxcvbnm 1q2w3e4r 1qaz2wsx qazwsx trustno1 hello123 freedom whatever starwars pokemon india123 india@123 '+
 'jaipur jaipur123 bharat hindustan krishna ganesh sairam omsairam 786786 hanuman jaishreeram jangidcuts prashant prashant123 iloveu loveyou '+
 'secret secret123 test123 test1234 changeme computer internet login user1234 google samsung iphone mobile 123qwe qwe123 zaq12wsx 7777777 aaaaaa').split(' ');
var SEQ='abcdefghijklmnopqrstuvwxyz01234567890 qwertyuiop asdfghjkl zxcvbnm';
function T(s){return (window.JC_I18N&&JC_I18N.t)?JC_I18N.t(s):s}
function score(pw){
 var n=pw.length;if(!n)return {pct:0,lvl:'none'};
 var low=pw.toLowerCase();
 var pool=0;if(/[a-z]/.test(pw))pool+=26;if(/[A-Z]/.test(pw))pool+=26;if(/[0-9]/.test(pw))pool+=10;if(/[^A-Za-z0-9]/.test(pw))pool+=33;
 /* effective length: repeated chars and runs (abc, 123, qwerty) count less */
 var eff=0;for(var i=0;i<n;i++){var c=low[i],p=low[i-1],q=low[i-2];var w=1;
  if(i>0&&c===p)w=(i>1&&c===q)?0.15:0.4;
  else if(i>0){var k=SEQ.indexOf(p+c),k2=SEQ.indexOf(c+p);if(k>=0||k2>=0)w=0.35}
  eff+=w}
 /* repeated chunks like abcabc / 1212 */
 if(/^(.{1,4})\1+$/.test(low))eff=Math.min(eff,4);
 var bits=eff*Math.log(Math.max(pool,10))/Math.LN2;
 var base=low.replace(/[^a-z0-9]/g,'').replace(/[0-9]+$/,'').replace(/^[0-9]+/,'');
 if(COMMON.indexOf(low)>=0||COMMON.indexOf(low.replace(/[^a-z0-9]/g,''))>=0)bits=Math.min(bits,8);
 else if(base.length>=4&&COMMON.indexOf(base)>=0)bits=Math.min(bits,24);
 var pct,lvl;
 if(n<6){pct=Math.max(4,Math.min(12,Math.round(bits/3)));lvl='short'}
 else if(bits<30){pct=Math.round(7+Math.max(0,bits)/30*18);lvl='weak'}
 else if(bits<55){pct=Math.round(45+(bits-30)/25*25);lvl='avg'}
 else{pct=Math.round(80+Math.min(1,(bits-55)/20)*20);lvl='strong'}
 return {pct:Math.max(0,Math.min(100,pct)),lvl:lvl}}
var LBL={none:'Password strength',short:'Too short',weak:'Weak',avg:'Average',strong:'Strong'};
var HINT={none:'Any characters are fine. Minimum 6.',short:'Use at least 6 characters',weak:'Easy to guess. Make it longer.',avg:'Okay. Longer or mixed is stronger.',strong:'Great password'};
var CSS='.jc-pwm{display:flex;align-items:center;gap:12px;margin:8px 0 14px;font-family:inherit}'+
 '.jc-pwm-r{position:relative;width:52px;height:52px;flex:0 0 52px}'+
 '.jc-pwm-r svg{width:52px;height:52px;transform:rotate(-90deg);display:block}'+
 '.jc-pwm-t{fill:none;stroke:rgba(127,140,140,.22);stroke-width:5}'+
 '.jc-pwm-a{fill:none;stroke-width:5;stroke-linecap:round;transition:stroke-dashoffset .5s cubic-bezier(.2,.8,.2,1),stroke .35s ease}'+
 '.jc-pwm-p{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}'+
 '.jc-pwm-x{display:flex;flex-direction:column;gap:2px;min-width:0;line-height:1.25}'+
 '.jc-pwm-l{font-weight:800;font-size:13px;letter-spacing:.04em;text-transform:uppercase;transition:color .35s ease}'+
 '.jc-pwm-h{font-size:12px;opacity:.68}'+
 '.jc-pwm[data-l=none] .jc-pwm-l{opacity:.6}'+
 '.jc-pwm[data-l=short] .jc-pwm-a,.jc-pwm[data-l=weak] .jc-pwm-a{stroke:#ff4d4f}.jc-pwm[data-l=short] .jc-pwm-l,.jc-pwm[data-l=weak] .jc-pwm-l,.jc-pwm[data-l=short] .jc-pwm-p,.jc-pwm[data-l=weak] .jc-pwm-p{color:#ff4d4f}'+
 '.jc-pwm[data-l=avg] .jc-pwm-a{stroke:#ff9f1a}.jc-pwm[data-l=avg] .jc-pwm-l,.jc-pwm[data-l=avg] .jc-pwm-p{color:#ff9f1a}'+
 '.jc-pwm[data-l=strong] .jc-pwm-a{stroke:#16d39a}.jc-pwm[data-l=strong] .jc-pwm-l,.jc-pwm[data-l=strong] .jc-pwm-p{color:#16d39a}'+
 '[data-theme=light] .jc-pwm[data-l=strong] .jc-pwm-a{stroke:#0a9e6f}[data-theme=light] .jc-pwm[data-l=strong] .jc-pwm-l,[data-theme=light] .jc-pwm[data-l=strong] .jc-pwm-p{color:#0a9e6f}'+
 '[data-theme=light] .jc-pwm[data-l=avg] .jc-pwm-a{stroke:#e8860c}[data-theme=light] .jc-pwm[data-l=avg] .jc-pwm-l,[data-theme=light] .jc-pwm[data-l=avg] .jc-pwm-p{color:#d97a06}'+
 '[data-theme=light] .jc-pwm[data-l=short] .jc-pwm-a,[data-theme=light] .jc-pwm[data-l=weak] .jc-pwm-a{stroke:#e5383b}'+
 '@media (prefers-reduced-motion:reduce){.jc-pwm-a{transition:none}}';
var C=2*Math.PI*21;
function css(){if(D.getElementById('jcPwmCss'))return;var s=D.createElement('style');s.id='jcPwmCss';s.textContent=CSS;D.head.appendChild(s)}
function isConfirm(el){var id=(el.id||'')+' '+(el.name||'')+' '+(el.getAttribute('aria-label')||'');if(/2$|confirm/i.test(el.id||'')||/confirm/i.test(id))return true;
 var lb=el.id&&D.querySelector('label[for="'+el.id+'"]');if(!lb){var f=el.closest('.field,.f');lb=f&&f.querySelector('label')}return !!(lb&&/confirm/i.test(lb.textContent))}
function attach(el){if(el.__jcPwm||isConfirm(el))return;el.__jcPwm=1;css();
 var box=D.createElement('div');box.className='jc-pwm';box.setAttribute('data-l','none');box.setAttribute('aria-live','polite');
 box.innerHTML='<div class="jc-pwm-r"><svg viewBox="0 0 52 52" aria-hidden="true"><circle class="jc-pwm-t" cx="26" cy="26" r="21"/><circle class="jc-pwm-a" cx="26" cy="26" r="21" stroke-dasharray="'+C.toFixed(2)+'" stroke-dashoffset="'+C.toFixed(2)+'"/></svg><span class="jc-pwm-p">0%</span></div><div class="jc-pwm-x"><span class="jc-pwm-l"></span><span class="jc-pwm-h"></span></div>';
 var host=el.closest('.field,.f')||el.parentNode;host.parentNode.insertBefore(box,host.nextSibling);
 var arc=box.querySelector('.jc-pwm-a'),pt=box.querySelector('.jc-pwm-p'),lb=box.querySelector('.jc-pwm-l'),hn=box.querySelector('.jc-pwm-h'),shown=0,raf=0;
 function anim(to){cancelAnimationFrame(raf);var from=shown,t0=performance.now();(function st(t){var k=Math.min(1,(t-t0)/450);k=1-Math.pow(1-k,3);shown=Math.round(from+(to-from)*k);pt.textContent=shown+'%';if(k<1)raf=requestAnimationFrame(st)})(t0)}
 function up(){var r=score(el.value||'');box.setAttribute('data-l',r.lvl);arc.style.strokeDashoffset=(C*(1-r.pct/100)).toFixed(2);anim(r.pct);lb.textContent=T(LBL[r.lvl]);hn.textContent=T(HINT[r.lvl]);el.setAttribute('aria-describedby',(el.id||'')+'Pwm')}
 box.id=(el.id||'pw')+'Pwm';el.addEventListener('input',up);el.addEventListener('change',up);up()}

/* show/hide eye on EVERY password box (site + admin): sign in, sign up, reset, change password, admin login */
var EYE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
var EYE_OFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7c1.6 0 3-.4 4.3-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
function eyeCss(){if(D.getElementById('jcEyeCss'))return;var s=D.createElement('style');s.id='jcEyeCss';
 s.textContent='.jc-pw-wrap{position:relative;display:block;width:100%}.jc-pw-wrap>input{padding-right:48px!important;width:100%;box-sizing:border-box}'+
 '.jc-pw-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:38px;height:38px;padding:0;margin:0;border:0;border-radius:10px;background:transparent;color:inherit;opacity:.62;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;z-index:2}'+
 '.jc-pw-eye:hover,.jc-pw-eye:focus-visible{opacity:1}.jc-pw-eye:focus-visible{outline:2px solid #2BF5C0;outline-offset:1px}.jc-pw-eye svg{width:20px;height:20px;display:block}'+
 '.jc-pw-wrap>input::-ms-reveal,.jc-pw-wrap>input::-ms-clear{display:none}';
 D.head.appendChild(s)}
function eye(el){if(!el||el.__jcEye||el.closest('.jc-pw-wrap'))return;el.__jcEye=1;eyeCss();
 var w=D.createElement('span');w.className='jc-pw-wrap';el.parentNode.insertBefore(w,el);w.appendChild(el);
 var b=D.createElement('button');b.type='button';b.className='jc-pw-eye';b.tabIndex=0;
 function set(show){el.type=show?'text':'password';b.innerHTML=show?EYE_OFF:EYE;var l=T(show?'Hide password':'Show password');b.setAttribute('aria-label',l);b.title=l;b.setAttribute('aria-pressed',show?'true':'false')}
 set(false);
 b.addEventListener('mousedown',function(e){e.preventDefault()});/* keep the keyboard/focus on the field */
 b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var s=el.selectionStart,en=el.selectionEnd;set(el.type==='password');try{el.focus({preventScroll:true});if(s!=null)el.setSelectionRange(s,en)}catch(x){}});
 /* a form submit always sends it hidden again next time */
 var f=el.form;if(f&&!f.__jcEyeR){f.__jcEyeR=1;f.addEventListener('submit',function(){f.querySelectorAll('.jc-pw-wrap>input').forEach(function(i){if(i.type==='text'&&i.__jcEye){i.type='password';var bb=i.parentNode.querySelector('.jc-pw-eye');if(bb){bb.innerHTML=EYE;bb.setAttribute('aria-pressed','false')}}})},true)}
 w.appendChild(b)}
function eyes(root){(root.querySelectorAll?root:D).querySelectorAll('input[type=password]').forEach(eye)}
function scan(root){eyes(root);(root.querySelectorAll?root:D).querySelectorAll('input[type=password][autocomplete="new-password"]').forEach(attach)}
window.JC_PWM={score:score,attach:attach,scan:function(){scan(D)}};
function start(){scan(D);if(window.MutationObserver)new MutationObserver(function(ms){for(var i=0;i<ms.length;i++)for(var j=0;j<ms[i].addedNodes.length;j++){var n=ms[i].addedNodes[j];if(n.nodeType===1){if(n.matches&&n.matches('input[type=password]')){eye(n);if(n.matches('[autocomplete="new-password"]'))attach(n)}else if(n.querySelector&&n.querySelector('input[type=password]'))scan(n)}}}).observe(D.body,{childList:true,subtree:true})}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start);else start()})();
