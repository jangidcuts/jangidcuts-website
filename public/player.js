/* JANGID CUTS video player (Nov 1, Prashant): one player for Portfolio + product previews.
   YouTube-style: big play/pause in the centre with 10 s back / forward beside it, bottom bar (seek, time, volume, fullscreen),
   settings gear (quality) top-right. Tap shows the controls, they hide after ~3 s while playing, a tap while shown hides them,
   double-tap left / right side = -10 s / +10 s. Keyboard: Space/K play, ←/→ or J/L 10 s, M mute, F fullscreen. */
(function(){'use strict';
var D=document;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function fmt(t){t=Math.max(0,Math.floor(t||0));var h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;return (h?h+':'+(m<10?'0':''):'')+m+':'+(s<10?'0':'')+s}
var SV=function(p,vb){return '<svg viewBox="'+(vb||'0 0 24 24')+'" aria-hidden="true" focusable="false">'+p+'</svg>'};
var IC={
 play:SV('<path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.9-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z" fill="currentColor"/>'),
 pause:SV('<rect x="6" y="4.5" width="4.2" height="15" rx="1.3" fill="currentColor"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.3" fill="currentColor"/>'),
 replay:SV('<path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" fill="currentColor"/>'),
 vol:SV('<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
 mute:SV('<path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4z" fill="currentColor"/><path d="M16 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
 fs:SV('<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
 fsx:SV('<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
 gear:SV('<path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/>'),
 tick:SV('<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'),
 ext:SV('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>')
};
function SK(d){return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="'+(d<0?'M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z':'M12 5V2l5 4-5 4V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z')+'" fill="currentColor"/><text x="12" y="16.3" text-anchor="middle" font-size="6.4" font-weight="800" font-family="Inter,Arial,sans-serif" fill="currentColor">10</text></svg>'}
var STD=[4320,2160,1440,1080,720,480,360,240,144];
function stdH(h){var b=STD[STD.length-1],bd=1e9;STD.forEach(function(s){var d=Math.abs(s-h);if(d<bd){bd=d;b=s}});return b}
function qName(h){return h+'p'}
function qTag(h){return h>=4320?'8K':h>=2160?'4K':h>=1440?'2K':h>=1080?'HD':''}
function ytId(u){var m=String(u||'').match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);return m?m[1]:''}
var ALL=[],ACTIVE=null;

/* opts: {src:'/v/p9' (file stream), yt:'<url or id>', poster:'', title:'', q:[1080,720,...] (real renditions, the first is the original), fb:'<drive id>'} */
function mount(host,opts){opts=opts||{};var yid=opts.yt?(ytId(opts.yt)||(/^[\w-]{11}$/.test(opts.yt)?opts.yt:'')):'';
 var root=D.createElement('div');root.className='jv';root.tabIndex=0;root.setAttribute('role','region');root.setAttribute('aria-label',(opts.title?opts.title+' · ':'')+'Video player');
 root.innerHTML='<div class="jv-media"></div><div class="jv-poster"'+(opts.poster?' style="background-image:url(\''+esc(opts.poster)+'\')"':'')+'></div><div class="jv-spin" aria-hidden="true"></div>'+
  '<div class="jv-flash l" aria-hidden="true">'+SK(-1)+'<span>10 seconds</span></div><div class="jv-flash r" aria-hidden="true">'+SK(1)+'<span>10 seconds</span></div>'+
  '<div class="jv-ui"><div class="jv-top">'+(opts.title?'<span class="jv-ttl">'+esc(opts.title)+'</span>':'<span></span>')+'<button type="button" class="jv-b jv-gear" aria-label="Settings (quality)" aria-haspopup="true">'+IC.gear+'<i class="jv-qb" hidden></i></button></div>'+
  '<div class="jv-mid"><button type="button" class="jv-b jv-bk" aria-label="Back 10 seconds">'+SK(-1)+'</button><button type="button" class="jv-b jv-pp" aria-label="Play">'+IC.play+'</button><button type="button" class="jv-b jv-fw" aria-label="Forward 10 seconds">'+SK(1)+'</button></div>'+
  '<div class="jv-bot"><div class="jv-prog"><div class="jv-rail"><i class="jv-ld"></i><i class="jv-pl"></i></div><input class="jv-seek" type="range" min="0" max="1000" step="1" value="0" aria-label="Seek"></div>'+
  '<div class="jv-row"><span class="jv-t"><b class="jv-cur">0:00</b> / <span class="jv-dur">0:00</span></span><span class="jv-sp"></span><span class="jv-volw"><button type="button" class="jv-b jv-mute" aria-label="Mute">'+IC.vol+'</button><input class="jv-vol" type="range" min="0" max="100" value="100" aria-label="Volume"></span><button type="button" class="jv-b jv-fs" aria-label="Full screen">'+IC.fs+'</button></div></div></div>'+
  '<div class="jv-menu" role="menu" hidden></div>';
 host.innerHTML='';host.appendChild(root);
 var q=function(s){return root.querySelector(s)};if(!opts.poster)q('.jv-poster').classList.add('nop');
 var media=q('.jv-media'),poster=q('.jv-poster'),seek=q('.jv-seek'),pl=q('.jv-pl'),ld=q('.jv-ld'),menu=q('.jv-menu'),ppB=q('.jv-pp'),muteB=q('.jv-mute'),vol=q('.jv-vol'),qb=q('.jv-qb');
 var api=null,dragging=false,started=false,uiT=0,quals=[],curQ=0,ytQ='';
 var touchy=!!(window.matchMedia&&matchMedia('(hover:none)').matches);if(touchy)root.classList.add('touch');
 function cls(c,on){root.classList.toggle(c,!!on)}
 function setPlaying(on){cls('playing',on);ppB.innerHTML=on?IC.pause:IC.play;ppB.setAttribute('aria-label',on?'Pause':'Play');if(on){cls('buf',false);cls('ended',false)}showUi()}
 function tick(){if(!api)return;var d=api.dur()||0,t=api.cur()||0;q('.jv-cur').textContent=fmt(t);q('.jv-dur').textContent=fmt(d);if(!dragging&&d){seek.value=Math.round(t/d*1000);pl.style.width=(t/d*100)+'%'}var b=api.buffered?api.buffered():0;if(d&&b)ld.style.width=Math.min(100,b/d*100)+'%'}
 /* ---- controls visibility ---- */
 function hideLater(){clearTimeout(uiT);uiT=setTimeout(function(){if(api&&!api.paused()&&!dragging&&menu.hidden&&!root.__hover)cls('ui',false)},3000)}
 function showUi(){cls('ui',true);hideLater()}
 function hideUi(){clearTimeout(uiT);if(api&&!api.paused()&&menu.hidden)cls('ui',false)}
 function flipUi(){if(root.classList.contains('ui')&&api&&!api.paused())hideUi();else showUi()}
 function start(){if(!api)return;started=true;cls('started',true);poster.hidden=true;api.play()}
 function toggle(){if(!api)return;if(!started){start();return}if(api.paused())api.play();else api.pause();showUi()}
 function skip(d){if(!api||!started)return;var dur=api.dur()||0,t=(api.cur()||0)+d;t=dur?Math.min(Math.max(0,t),Math.max(0,dur-0.25)):Math.max(0,t);api.seekTo(t);tick();var f=q(d<0?'.jv-flash.l':'.jv-flash.r');f.classList.remove('on');void f.offsetWidth;f.classList.add('on')}
 function setMuteIcon(){var m=api&&api.muted();muteB.innerHTML=m?IC.mute:IC.vol;muteB.setAttribute('aria-label',m?'Unmute':'Mute');vol.value=m?0:Math.round((api&&api.vol?api.vol():1)*100)}
 /* ---- sources ---- */
 if(yid){var y=null;api={ready:false,want:false,
   play:function(){if(y&&api.ready){cls('buf',true);y.playVideo();clearTimeout(api.chk);api.chk=setTimeout(function(){var s=y.getPlayerState?y.getPlayerState():-1;if(s!==1&&s!==3&&!api.userPaused){y.mute();y.playVideo();setMuteIcon()}},1500)}else api.want=true;api.userPaused=false},
   pause:function(){api.userPaused=true;clearTimeout(api.chk);y&&y.pauseVideo&&y.pauseVideo()},cur:function(){return y&&y.getCurrentTime?y.getCurrentTime():0},dur:function(){return y&&y.getDuration?y.getDuration():0},
   buffered:function(){return y&&y.getVideoLoadedFraction?y.getVideoLoadedFraction()*(y.getDuration()||0):0},seekTo:function(s){y&&y.seekTo&&y.seekTo(s,true)},
   muted:function(){return !!(y&&y.isMuted&&y.isMuted())},mute:function(on){y&&(on?y.mute():y.unMute())},vol:function(){return y&&y.getVolume?y.getVolume()/100:1},setVol:function(x){y&&y.setVolume&&y.setVolume(Math.round(x*100));if(x>0&&api.muted())api.mute(false)},
   paused:function(){return !y||!y.getPlayerState||[1,3].indexOf(y.getPlayerState())<0},destroy:function(){try{y&&y.destroy()}catch(e){}}};
  var hid='jvyt'+Math.random().toString(36).slice(2,8);media.innerHTML='<div id="'+hid+'"></div>';
  var mk=function(){y=new YT.Player(hid,{host:'https://www.youtube-nocookie.com',videoId:yid,playerVars:{controls:0,modestbranding:1,rel:0,iv_load_policy:3,disablekb:1,fs:0,playsinline:1,cc_load_policy:0,autoplay:0},
    events:{onReady:function(){api.ready=true;if(api.want){api.want=false;api.play()}},onStateChange:function(e){cls('buf',e.data===3);if(e.data===1||e.data===2)setPlaying(e.data===1);if(e.data===1){try{ytQ=y.getPlaybackQuality()}catch(x){}}if(e.data===0){setPlaying(false);cls('ended',true);ppB.innerHTML=IC.replay;ppB.setAttribute('aria-label','Replay')}},onPlaybackQualityChange:function(e){ytQ=e.data}}})};
  if(window.YT&&YT.Player)mk();else{var prev=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=function(){prev&&prev();mk()};if(!D.querySelector('script[src*="youtube.com/iframe_api"]')){var s=D.createElement('script');s.src='https://www.youtube.com/iframe_api';D.head.appendChild(s)}}
 }else if(opts.src){
  quals=(opts.q||[]).filter(function(h){return h>0});
  var pick=function(){var c=quals.filter(function(h){return h<=1080});return c.length?c[0]:(quals.length?quals[quals.length-1]:0)};
  curQ=pick();
  var urlFor=function(h){return opts.src+(h&&quals.length&&h!==quals[0]?'?q='+h:'')};
  media.innerHTML='<video preload="metadata" playsinline webkit-playsinline'+(opts.poster?' poster="'+esc(opts.poster)+'"':'')+' src="'+esc(urlFor(curQ))+(opts.poster?'':'#t=0.05')+'"></video>';var v=media.querySelector('video');
  ['waiting','stalled','seeking'].forEach(function(ev){v.addEventListener(ev,function(){if(!v.paused)cls('buf',true)})});['playing','canplay','seeked','pause','ended','error'].forEach(function(ev){v.addEventListener(ev,function(){cls('buf',false)})});
  api={play:function(){cls('buf',true);var pr=v.play();if(pr&&pr.catch)pr.catch(function(){cls('buf',false);setPlaying(false)})},pause:function(){v.pause()},cur:function(){return v.currentTime},dur:function(){return isFinite(v.duration)?v.duration:0},
   buffered:function(){try{var b=v.buffered;for(var i=0;i<b.length;i++)if(b.start(i)<=v.currentTime+0.5&&b.end(i)>=v.currentTime)return b.end(i);return b.length?b.end(b.length-1):0}catch(e){return 0}},
   seekTo:function(s){v.currentTime=s},muted:function(){return v.muted},mute:function(on){v.muted=on},vol:function(){return v.volume},setVol:function(x){v.volume=x;v.muted=x===0},paused:function(){return v.paused},destroy:function(){try{v.pause();v.removeAttribute('src');v.load()}catch(e){}},video:v};
  v.addEventListener('play',function(){setPlaying(true)});v.addEventListener('pause',function(){setPlaying(false)});v.addEventListener('ended',function(){setPlaying(false);cls('ended',true);ppB.innerHTML=IC.replay;ppB.setAttribute('aria-label','Replay')});
  v.addEventListener('timeupdate',tick);v.addEventListener('progress',tick);v.addEventListener('volumechange',setMuteIcon);
  v.addEventListener('loadedmetadata',function(){tick();if(!quals.length&&v.videoHeight){/* no extra renditions: the menu shows the one real quality of the file */quals=[stdH(Math.min(v.videoWidth,v.videoHeight))];curQ=quals[0]}if(!v.videoHeight&&v.videoWidth===0)return;cls('vert',v.videoHeight>v.videoWidth);drawQb()});
  v.addEventListener('error',function(){if(root.__swap)return;if(opts.fb&&!root.__fb){root.__fb=1;media.innerHTML='<iframe src="https://drive.google.com/file/d/'+esc(opts.fb)+'/preview" allow="autoplay; fullscreen" allowfullscreen></iframe>';cls('native',true);poster.hidden=true;return}poster.hidden=false;poster.innerHTML='<p class="jv-err">This video could not be loaded. Please try again later.</p>';cls('err',true)});
  api.setQ=function(h){if(h===curQ)return;var t=v.currentTime,was=!v.paused,rate=v.playbackRate;curQ=h;root.__swap=1;cls('buf',true);v.src=urlFor(h);v.load();
   var on=function(){v.removeEventListener('loadedmetadata',on);root.__swap=0;try{v.currentTime=t}catch(e){}v.playbackRate=rate;if(was){var pr=v.play();pr&&pr.catch&&pr.catch(function(){})}else cls('buf',false)};v.addEventListener('loadedmetadata',on);drawQb()};
 }else{cls('nosrc',true);poster.innerHTML=opts.link?'<a class="jv-ext" href="'+esc(opts.link)+'" target="_blank" rel="noopener">'+IC.play+' Watch video</a>':'';host.__jv={pause:function(){},destroy:function(){}};return host.__jv}
 function drawQb(){var h=yid?0:curQ;qb.hidden=!qTag(h);qb.textContent=qTag(h)}
 /* ---- quality menu ---- */
 function openMenu(){var h='<div class="jv-mh"><b>Quality</b><button type="button" class="jv-mx" aria-label="Close">✕</button></div>';
  if(yid){h+='<div class="jv-mi on" role="menuitemradio" aria-checked="true">'+IC.tick+'<span>Auto'+(ytQ&&/hd|large|medium|small|tiny|highres/.test(ytQ)?' <i>(now '+({highres:'4K',hd2160:'2160p',hd1440:'1440p',hd1080:'1080p',hd720:'720p',large:'480p',medium:'360p',small:'240p',tiny:'144p'}[ytQ]||ytQ)+')</i>':'')+'</span></div>'+
   '<p class="jv-mn">This video plays from YouTube. YouTube picks the quality by itself (it goes up to 1080p / 4K on a good connection) and does not let other websites choose it.</p>'+
   '<a class="jv-mi jv-yt" role="menuitem" href="https://www.youtube.com/watch?v='+esc(yid)+'" target="_blank" rel="noopener">'+IC.ext+'<span>Choose quality on YouTube</span></a>'}
  else{h+=quals.map(function(x,i){return '<button type="button" class="jv-mi'+(x===curQ?' on':'')+'" role="menuitemradio" aria-checked="'+(x===curQ)+'" data-q="'+x+'">'+(x===curQ?IC.tick:'<i class="jv-ph"></i>')+'<span>'+qName(x)+(qTag(x)?' <sup>'+qTag(x)+'</sup>':'')+(i===0&&quals.length>1?' <i>original</i>':'')+'</span></button>'}).join('');
   if(quals.length<2)h+='<p class="jv-mn">Only this quality is available for this video.</p>'}
  menu.innerHTML=h;menu.hidden=false;cls('menu',true);clearTimeout(uiT);cls('ui',true);
  [].forEach.call(menu.querySelectorAll('[data-q]'),function(b){b.onclick=function(e){e.stopPropagation();api.setQ&&api.setQ(+b.dataset.q);closeMenu()}});
  menu.querySelector('.jv-mx').onclick=function(e){e.stopPropagation();closeMenu()};var yl=menu.querySelector('.jv-yt');yl&&(yl.onclick=function(){var t=Math.floor(api.cur()||0);api.pause();yl.href='https://www.youtube.com/watch?v='+yid+(t?'&t='+t+'s':'');closeMenu()})}
 function closeMenu(){menu.hidden=true;cls('menu',false);showUi()}
 /* ---- input ---- */
 var lastPt='mouse',lastTap=0,lastZone='',preUi=false;
 root.addEventListener('pointerdown',function(e){lastPt=e.pointerType||'mouse';ACTIVE=ctl},true);
 root.addEventListener('click',function(e){var t=e.target;ACTIVE=ctl;
  if(t.closest('.jv-menu')){return}
  if(!menu.hidden){closeMenu();return}
  if(t.closest('.jv-b,.jv-bot,a,input'))return;/* buttons + bars: own handlers, controls stay as they are (timer restarts) */
  if(!started){toggle();return}
  if(lastPt==='mouse'){toggle();return}/* desktop: click on the picture = play / pause (like YouTube) */
  var r=root.getBoundingClientRect(),x=(e.clientX-r.left)/(r.width||1),zone=x<0.38?'l':x>0.62?'r':'m',now=Date.now();
  if(now-lastTap<320&&zone===lastZone&&zone!=='m'){/* double tap on a side: seek, and undo the show/hide of the first tap */lastTap=now;cls('ui',preUi);if(preUi)hideLater();skip(zone==='l'?-10:10);return}
  lastTap=now;lastZone=zone;preUi=root.classList.contains('ui');flipUi()});
 root.addEventListener('dblclick',function(e){if(lastPt!=='mouse'||e.target.closest('.jv-ui .jv-b,.jv-bot,.jv-menu'))return;fs()});
 ppB.onclick=function(e){e.stopPropagation();toggle()};
 q('.jv-bk').onclick=function(e){e.stopPropagation();skip(-10);showUi()};q('.jv-fw').onclick=function(e){e.stopPropagation();skip(10);showUi()};
 q('.jv-gear').onclick=function(e){e.stopPropagation();if(menu.hidden)openMenu();else closeMenu()};
 muteB.onclick=function(e){e.stopPropagation();if(!api)return;var m=!api.muted();api.mute(m);if(!m&&api.vol&&api.vol()===0&&api.setVol)api.setVol(1);setTimeout(setMuteIcon,60);showUi()};
 vol.addEventListener('input',function(){api&&api.setVol&&api.setVol(vol.value/100);setTimeout(setMuteIcon,60);showUi()});
 seek.addEventListener('pointerdown',function(){dragging=true;clearTimeout(uiT)});
 seek.addEventListener('input',function(){dragging=true;var d=api&&api.dur();pl.style.width=(seek.value/10)+'%';if(d)q('.jv-cur').textContent=fmt(seek.value/1000*d)});
 seek.addEventListener('change',function(){dragging=false;var d=api&&api.dur();if(d)api.seekTo(seek.value/1000*d);showUi()});
 ['pointerup','pointercancel'].forEach(function(ev){seek.addEventListener(ev,function(){setTimeout(function(){dragging=false;showUi()},50)})});
 root.addEventListener('mousemove',function(e){if(lastPt==='mouse'&&e.movementX|e.movementY){showUi()}});
 root.addEventListener('mouseleave',function(){root.__hover=0;if(api&&!api.paused()){clearTimeout(uiT);uiT=setTimeout(hideUi,800)}});
 [q('.jv-bot'),q('.jv-top'),q('.jv-mid')].forEach(function(el){el.addEventListener('mouseenter',function(){if(lastPt==='mouse')root.__hover=1});el.addEventListener('mouseleave',function(){root.__hover=0;hideLater()})});
 function isFs(){return D.fullscreenElement===root||D.webkitFullscreenElement===root}
 function fs(){if(D.fullscreenElement||D.webkitFullscreenElement){(D.exitFullscreen||D.webkitExitFullscreen).call(D)}else if(root.requestFullscreen||root.webkitRequestFullscreen){var pr=(root.requestFullscreen||root.webkitRequestFullscreen).call(root);var lock=function(){try{if(!root.classList.contains('vert')&&screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(function(){})}catch(e){}};if(pr&&pr.then)pr.then(lock).catch(function(){});else lock()}else if(api&&api.video&&api.video.webkitEnterFullscreen){api.video.webkitEnterFullscreen()}}
 q('.jv-fs').onclick=function(e){e.stopPropagation();fs();showUi()};
 var onFs=function(){var f=isFs();cls('fsm',f);q('.jv-fs').innerHTML=f?IC.fsx:IC.fs;q('.jv-fs').setAttribute('aria-label',f?'Exit full screen':'Full screen');if(!f){try{screen.orientation&&screen.orientation.unlock&&screen.orientation.unlock()}catch(e){}}};
 D.addEventListener('fullscreenchange',onFs);D.addEventListener('webkitfullscreenchange',onFs);
 var iv=setInterval(function(){if(!D.body.contains(root)){clearInterval(iv);return}if(api&&!api.paused())tick()},400);
 var ctl={root:root,pause:function(){api&&!api.paused()&&api.pause()},destroy:function(){clearInterval(iv);api&&api.destroy&&api.destroy();root.remove()},toggle:toggle,skip:skip,fs:fs,
  key:function(e){var k=e.key;if(k===' '||k==='k'||k==='K'){toggle();return true}if(!started)return false;if(k==='ArrowLeft'||k==='j'||k==='J'){skip(-10);showUi();return true}if(k==='ArrowRight'||k==='l'||k==='L'){skip(10);showUi();return true}
   if(k==='m'||k==='M'){muteB.click();return true}if(k==='f'||k==='F'){fs();return true}if(k==='Escape'&&!menu.hidden){closeMenu();return true}return false}};
 root.addEventListener('focus',function(){ACTIVE=ctl});
 cls('ui',true);ALL.push(ctl);if(!ACTIVE||!D.body.contains(ACTIVE.root))ACTIVE=ctl;host.__jv=ctl;return ctl}
D.addEventListener('keydown',function(e){var t=e.target,tg=t&&t.tagName;if(!ACTIVE||!D.body.contains(ACTIVE.root))return;if(e.altKey||e.ctrlKey||e.metaKey)return;
 if((tg==='INPUT'&&!(t.classList&&(t.classList.contains('jv-seek')||t.classList.contains('jv-vol'))))||tg==='TEXTAREA'||tg==='SELECT'||(t&&t.isContentEditable))return;
 if(tg==='BUTTON'&&(e.key===' '||e.key==='Enter')&&!ACTIVE.root.contains(t))return;
 if(tg==='BUTTON'&&(e.key===' '||e.key==='Enter')&&ACTIVE.root.contains(t))return;/* a focused control button: let the browser click it */
 var r=ACTIVE.root.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight||r.right<=0||r.left>=innerWidth)return;
 if(ACTIVE.key(e)){e.preventDefault();e.stopPropagation()}});
window.JCPlayer={mount:mount,ytId:ytId,pauseAll:function(){ALL.forEach(function(c){c.pause()})}};
})();
