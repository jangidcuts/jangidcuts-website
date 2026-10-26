/* Jangid Cuts i18n: UI translation from /i18n/<lang>.json (keys = English UI text, numbers/emails/refs as {#}).
   Translates text nodes + placeholder/aria-label/title across every page, also text added later by scripts. */
(function(){'use strict';
var D=document,H=D.documentElement;
var LANGS=[['en','English'],['hi','हिन्दी (Hindi)'],['es','Español (Spanish)'],['fr','Français (French)'],['de','Deutsch (German)'],['pt','Português (Portuguese)'],['ja','日本語 (Japanese)']];
var LOC={en:'en-IN',hi:'hi-IN',es:'es-ES',fr:'fr-FR',de:'de-DE',pt:'pt-BR',ja:'ja-JP'};
var TOK=/JC-[A-Z]+-[A-Z0-9]+|[A-Za-z0-9_.+-]+@[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+|[₹$]?[0-9][0-9,.:]*/g;
var ATTRS=['placeholder','aria-label','title'];
var dict=null,lang='en',busy=false,obs=null;
function valid(l){return LANGS.some(function(x){return x[0]===l})}
function stored(){var l=null;try{l=localStorage.getItem('jc-lang')}catch(e){}
 if(l&&/^\d+$/.test(l)){var old=['en','hi','es','fr','de','ar','pt','ja'][+l];l=old||'en'}
 return valid(l)?l:'en'}
function tr(s){if(!dict||!s)return null;var t=s.replace(/\s+/g,' ').trim();if(!t)return null;
 var toks=[],key=t.replace(TOK,function(m){toks.push(m);return '{#}'});var v=dict[key];if(v==null)return null;
 var i=0;v=v.replace(/\{#\}/g,function(){return toks[i++]||''});
 var lead=s.match(/^\s*/)[0],trail=s.match(/\s*$/)[0];return lead+v+trail}
function skip(el){return !el||el.closest('script,style,noscript,svg,textarea,code,[data-i18n-skip],.bigword,#loginTitle')}
function doText(n){var p=n.parentElement;if(skip(p))return;
 var cur=n.nodeValue;if(n.__jcT===undefined||cur!==n.__jcT)n.__jcE=cur;
 var en=n.__jcE;var out=lang==='en'?en:(tr(en)||en);n.__jcT=out;if(out!==cur)n.nodeValue=out}
function doAttrs(el){if(!el||el.closest('[data-i18n-skip],svg'))return;for(var i=0;i<ATTRS.length;i++){var a=ATTRS[i];if(!el.hasAttribute(a))continue;
 var k='__jcA_'+a,kt='__jcAT_'+a,cur=el.getAttribute(a);if(el[kt]===undefined||cur!==el[kt])el[k]=cur;
 var out=lang==='en'?el[k]:(tr(el[k])||el[k]);el[kt]=out;if(out!==cur)el.setAttribute(a,out)}}
function walk(root){if(!root)return;if(root.nodeType===3){doText(root);return}if(root.nodeType!==1)return;
 if(root.matches&&root.matches('[placeholder],[aria-label],[title]'))doAttrs(root);
 var w=D.createTreeWalker(root,NodeFilter.SHOW_TEXT,null),n;while(n=w.nextNode())doText(n);
 if(root.querySelectorAll)root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(doAttrs)}
function title(){if(!D.__jcTitleE||D.title!==D.__jcTitleT)D.__jcTitleE=D.title;var t=lang==='en'?D.__jcTitleE:(tr(D.__jcTitleE)||D.__jcTitleE);D.__jcTitleT=t;if(D.title!==t)D.title=t}
function all(){busy=true;try{walk(D.body);title()}finally{busy=false}}
function observe(){if(obs||!window.MutationObserver)return;obs=new MutationObserver(function(ms){if(busy)return;busy=true;try{
 for(var i=0;i<ms.length;i++){var m=ms[i];if(m.type==='childList'){for(var j=0;j<m.addedNodes.length;j++)walk(m.addedNodes[j])}
  else if(m.type==='characterData')doText(m.target);else if(m.type==='attributes')doAttrs(m.target)}
 title()}finally{busy=false}});
 obs.observe(D.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
 var te=D.querySelector('title');te&&new MutationObserver(function(){if(!busy){busy=true;try{title()}finally{busy=false}}}).observe(te,{childList:true,characterData:true,subtree:true})}
function done(){H.classList.remove('i18n-wait')}
function load(l,cb){if(l==='en'){dict=null;cb();return}
 fetch('/i18n/'+l+'.json?v=6',{credentials:'same-origin'}).then(function(r){return r.json()}).then(function(d){dict=d;cb()}).catch(function(){dict=null;cb()})}
function setSel(){var s=D.getElementById('langSel');if(!s)return;
 if(!s.__jcBuilt){s.__jcBuilt=1;s.innerHTML=LANGS.map(function(x){return '<option value="'+x[0]+'">'+x[1]+'</option>'}).join('');s.setAttribute('data-i18n-skip','')}
 s.value=lang}
function apply(l,save){lang=valid(l)?l:'en';H.setAttribute('lang',lang);window.JCL=window.JCL||{};JCL.locale=LOC[lang];JCL.lang=lang;
 if(save){try{localStorage.setItem('jc-lang',lang)}catch(e){}}
 load(lang,function(){all();observe();setSel();done()})}
window.JC_I18N={set:function(l){apply(l,true)},get:function(){return lang},t:function(s){return tr(s)||s},langs:LANGS};
function start(){setSel();apply(stored(),false)}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start);else start();
setTimeout(done,2500)})();
