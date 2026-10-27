/* Jangid Cuts i18n: UI translation from /i18n/<lang>.json (keys = English UI text, numbers/emails/refs as {#}).
   Translates text nodes + placeholder/aria-label/title across every page, also text added later by scripts. */
(function(){'use strict';
var D=document,H=D.documentElement;
var LANGS=[
['en','English','English','g'],
['hi','हिन्दी','Hindi','i'],['bn','বাংলা','Bengali','i'],['mr','मराठी','Marathi','i'],['te','తెలుగు','Telugu','i'],['ta','தமிழ்','Tamil','i'],['gu','ગુજરાતી','Gujarati','i'],['kn','ಕನ್ನಡ','Kannada','i'],['ml','മലയാളം','Malayalam','i'],['pa','ਪੰਜਾਬੀ','Punjabi','i'],['or','ଓଡ଼ିଆ','Odia','i'],['as','অসমীয়া','Assamese','i'],['ur','اردو','Urdu','i'],['sa','संस्कृतम्','Sanskrit','i'],['kok','कोंकणी','Konkani','i'],['mai','मैथिली','Maithili','i'],['ne','नेपाली','Nepali','i'],['sd','سنڌي','Sindhi','i'],['doi','डोगरी','Dogri','i'],['bho','भोजपुरी','Bhojpuri','i'],
['es','Español','Spanish','g'],['fr','Français','French','g'],['de','Deutsch','German','g'],['pt','Português','Portuguese','g'],['it','Italiano','Italian','g'],['ru','Русский','Russian','g'],['ar','العربية','Arabic','g'],['zh-CN','简体中文','Chinese (Simplified)','g'],['zh-TW','繁體中文','Chinese (Traditional)','g'],['ja','日本語','Japanese','g'],['ko','한국어','Korean','g'],['tr','Türkçe','Turkish','g'],['id','Bahasa Indonesia','Indonesian','g'],['ms','Bahasa Melayu','Malay','g'],['vi','Tiếng Việt','Vietnamese','g'],['th','ไทย','Thai','g'],['fil','Filipino','Filipino','g'],['nl','Nederlands','Dutch','g'],['pl','Polski','Polish','g'],['uk','Українська','Ukrainian','g'],['sv','Svenska','Swedish','g'],['no','Norsk','Norwegian','g'],['da','Dansk','Danish','g'],['fi','Suomi','Finnish','g'],['el','Ελληνικά','Greek','g'],['he','עברית','Hebrew','g'],['fa','فارسی','Persian','g'],['cs','Čeština','Czech','g'],['ro','Română','Romanian','g'],['hu','Magyar','Hungarian','g'],['sw','Kiswahili','Swahili','g']];
var LOC={en:'en-IN',hi:'hi-IN',bn:'bn-IN',mr:'mr-IN',te:'te-IN',ta:'ta-IN',gu:'gu-IN',kn:'kn-IN',ml:'ml-IN',pa:'pa-IN',or:'or-IN',as:'as-IN',ur:'ur-IN',sa:'sa-IN',kok:'kok-IN',mai:'mai-IN',ne:'ne-NP',sd:'sd-IN',doi:'doi-IN',bho:'hi-IN',
 es:'es-ES',fr:'fr-FR',de:'de-DE',pt:'pt-BR',it:'it-IT',ru:'ru-RU',ar:'ar',  'zh-CN':'zh-CN','zh-TW':'zh-TW',ja:'ja-JP',ko:'ko-KR',tr:'tr-TR',id:'id-ID',ms:'ms-MY',vi:'vi-VN',th:'th-TH',fil:'fil-PH',nl:'nl-NL',pl:'pl-PL',uk:'uk-UA',sv:'sv-SE',no:'nb-NO',da:'da-DK',fi:'fi-FI',el:'el-GR',he:'he-IL',fa:'fa-IR',cs:'cs-CZ',ro:'ro-RO',hu:'hu-HU',sw:'sw-KE'};
var RTL={ar:1,he:1,fa:1,ur:1,sd:1};
var TOK=/JC-[A-Z]+-[A-Z0-9]+|[A-Za-z0-9_.+-]+@[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)+|[₹$]?[0-9][0-9,.:]*/g;
var ATTRS=['placeholder','aria-label','title'];
var dict=null,lang='en',busy=false,obs=null;
function lbl(x){return x[1]===x[2]?x[1]:x[1]+' ('+x[2]+')'}
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
var DICTS={},SEQ=0,DV=9;
function fetchDict(l){if(DICTS[l])return DICTS[l];DICTS[l]=fetch('/i18n/'+l+'.json?v='+DV,{credentials:'same-origin'}).then(function(r){if(!r.ok)throw 0;return r.json()}).catch(function(){delete DICTS[l];return null});return DICTS[l]}
function load(l,cb){var my=++SEQ;if(l==='en'){dict=null;cb();return}
 fetchDict(l).then(function(d){if(my!==SEQ)return;dict=d;cb()})}
function setSel(){var s=D.getElementById('langSel');if(!s)return;
 if(!s.__jcBuilt){s.__jcBuilt=1;s.innerHTML=LANGS.map(function(x){return '<option value="'+x[0]+'">'+lbl(x)+'</option>'}).join('');s.setAttribute('data-i18n-skip','')}
 s.value=lang}
function apply(l,save){lang=valid(l)?l:'en';H.setAttribute('lang',lang);H.classList.toggle('lang-rtl',!!RTL[lang]);window.JCL=window.JCL||{};JCL.locale=LOC[lang];JCL.lang=lang;
 if(save){try{localStorage.setItem('jc-lang',lang)}catch(e){}}
 load(lang,function(){all();observe();setSel();done();try{D.dispatchEvent(new CustomEvent('jc:lang',{detail:lang}))}catch(e){}})}

/* ---------- language picker: our own sheet with Indian / Global tabs; search shows only inside the open picker ---------- */
var PK=null,pkTab=null;
function curL(){return LANGS.find(function(x){return x[0]===lang})||LANGS[0]}
function guessTab(){var c=curL();if(c[0]!=='en')return c[3]==='i'?'i':'g';var n=(navigator.languages||[navigator.language||'']).join(',');return /(^|,)(hi|bn|mr|te|ta|gu|kn|ml|pa|or|as|ur|sa|kok|mai|ne|sd|doi|bho)\b|-IN\b/i.test(n)?'i':'g'}
function T(s){return tr(s)||s}
function pickBtn(){var s=D.getElementById('langSel');if(!s)return;var b=D.getElementById('langBtn');
 if(!b){b=D.createElement('button');b.type='button';b.id='langBtn';b.className='lang-btn';b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-label','Language');s.style.display='none';s.setAttribute('aria-hidden','true');s.tabIndex=-1;s.parentNode.insertBefore(b,s.nextSibling);b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openPicker()})}
 var c=curL();b.innerHTML='<span data-i18n-skip>'+c[1]+'</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'}
function rowsHTML(list,q){if(!list.length)return '<p class="lp-none">'+T('No language found')+'</p>';
 return list.map(function(x){var on=x[0]===lang;return '<button type="button" class="lp-row'+(on?' on':'')+'" data-l="'+x[0]+'" role="option" aria-selected="'+on+'"><span class="lp-n" lang="'+x[0]+'" dir="auto">'+x[1]+'</span>'+(x[1]!==x[2]?'<span class="lp-e" lang="en" dir="ltr">'+x[2]+'</span>':'')+(on?'<svg class="lp-ok" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>':'')+'</button>'}).join('')}
function fold(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function drawList(){if(!PK)return;var q=fold(PK.q.value.trim()),list;
 if(q){list=LANGS.filter(function(x){return fold(x[1]).indexOf(q)>=0||fold(x[2]).indexOf(q)>=0||x[0].toLowerCase().indexOf(q)===0})}
 else{list=LANGS.filter(function(x){return x[3]===pkTab});if(pkTab==='i')list=[LANGS[0]].concat(list)}
 PK.tabs.forEach(function(t){t.setAttribute('aria-selected',!q&&t.dataset.t===pkTab?'true':'false')});PK.el.classList.toggle('searching',!!q);
 PK.list.innerHTML=rowsHTML(list,q);PK.list.scrollTop=0}
function openPicker(){if(!PK){var el=D.createElement('div');el.className='lp-ov';el.id='langPicker';
  el.innerHTML='<div class="lp" role="dialog" aria-modal="true" aria-labelledby="lpT"><div class="lp-grab" aria-hidden="true"></div><div class="lp-h"><b id="lpT">Language</b><button type="button" class="lp-x" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>'+
   '<div class="lp-s"><svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></g></svg><input type="search" placeholder="Search language" aria-label="Search language" autocomplete="off" spellcheck="false" enterkeyhint="search"></div>'+
   '<div class="lp-tabs" role="tablist"><button type="button" role="tab" data-t="i">Indian</button><button type="button" role="tab" data-t="g">Global</button></div><div class="lp-list" role="listbox" data-i18n-skip></div></div>';
  D.body.appendChild(el);PK={el:el,q:el.querySelector('input'),list:el.querySelector('.lp-list'),tabs:[].slice.call(el.querySelectorAll('.lp-tabs button'))};
  PK.tabs.forEach(function(t){t.addEventListener('click',function(){pkTab=t.dataset.t;PK.q.value='';drawList()})});
  PK.q.addEventListener('input',drawList);
  PK.q.addEventListener('keydown',function(e){if(e.key==='Enter'){var f=PK.list.querySelector('.lp-row');f&&f.click()}});
  PK.list.addEventListener('click',function(e){var r=e.target.closest('.lp-row');if(!r)return;choose(r.dataset.l)});
  PK.list.addEventListener('pointerover',function(e){var r=e.target.closest('.lp-row');r&&r.dataset.l!=='en'&&fetchDict(r.dataset.l)});
  el.addEventListener('click',function(e){if(e.target===el)closePicker()});
  el.querySelector('.lp-x').addEventListener('click',closePicker);
  D.addEventListener('keydown',function(e){if(e.key==='Escape'&&PK&&PK.el.classList.contains('on')){e.stopPropagation();closePicker()}},true)}
 pkTab=guessTab();PK.q.value='';drawList();PK.el.classList.add('on');H.classList.add('lp-lock');
 var on=PK.list.querySelector('.lp-row.on');if(on)on.scrollIntoView({block:'center'});
 if(window.matchMedia&&matchMedia('(hover:hover) and (pointer:fine)').matches)setTimeout(function(){PK.q.focus()},60)}
function closePicker(){if(!PK)return;PK.el.classList.remove('on');H.classList.remove('lp-lock');var b=D.getElementById('langBtn');b&&b.focus({preventScroll:true})}
function choose(l){closePicker();if(l===lang)return;var s=D.getElementById('langSel');
 if(s){s.value=l;try{s.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){apply(l,true)}}else apply(l,true);pickBtn()}
D.addEventListener('jc:lang',function(){pickBtn();if(PK&&PK.el.classList.contains('on'))drawList()});
window.JC_LANGPICK=openPicker;
window.JC_I18N={set:function(l){apply(l,true)},get:function(){return lang},t:function(s){return tr(s)||s},langs:LANGS};
function start(){setSel();pickBtn();apply(stored(),false)}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start);else start();
setTimeout(done,2500)})();
