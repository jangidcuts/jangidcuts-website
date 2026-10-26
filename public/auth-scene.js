
/* JC watchers: tiny SVG characters whose eyes/heads follow the pointer. No deps. */
(function(){
var NS='http://www.w3.org/2000/svg';
function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);p&&p.appendChild(e);return e}
var FLOOR=430;
function body(g,c,defs,id){var x=c.x,w=c.w,h=c.h,top=FLOOR-h,fill=c.color;
 if(c.grad){var lg=el('linearGradient',{id:id,x1:0,y1:0,x2:0,y2:1,'class':c.tag?'jwg-'+c.tag:''},defs);c.grad.forEach(function(s,i){el('stop',{offset:(i/(c.grad.length-1)),'stop-color':s},lg)});fill='url(#'+id+')'}
 var a={fill:fill};if(c.stroke){a.stroke=c.stroke;a['stroke-width']=c.sw||3}
 var r=c.r!=null?c.r:Math.min(w/2,28);
 if(c.shape==='rect'){a.d='M'+x+','+FLOOR+'V'+(top+r)+'Q'+x+','+top+' '+(x+r)+','+top+'H'+(x+w-r)+'Q'+(x+w)+','+top+' '+(x+w)+','+(top+r)+'V'+FLOOR+'Z'}
 else if(c.shape==='semi'){var R=w/2;a.d='M'+x+','+FLOOR+'A'+R+','+Math.min(R,h)+' 0 0 1 '+(x+w)+','+FLOOR+'Z'}
 else if(c.shape==='egg'){var cx=x+w/2;a.d='M'+x+','+(FLOOR-h*0.32)+'C'+x+','+(top+h*0.1)+' '+(cx-w*0.32)+','+top+' '+cx+','+top+'C'+(cx+w*0.32)+','+top+' '+(x+w)+','+(top+h*0.1)+' '+(x+w)+','+(FLOOR-h*0.32)+'C'+(x+w)+','+(FLOOR-h*0.02)+' '+(cx+w*0.3)+','+FLOOR+' '+cx+','+FLOOR+'C'+(cx-w*0.3)+','+FLOOR+' '+x+','+(FLOOR-h*0.02)+' '+x+','+(FLOOR-h*0.32)+'Z'}
 else if(c.shape==='circle'){var R2=w/2;a.d='M'+(x)+','+(FLOOR-R2)+'a'+R2+','+R2+' 0 1 1 '+w+',0a'+R2+','+R2+' 0 1 1 '+(-w)+',0Z'}
 else if(c.shape==='tri'){var cx2=x+w/2;a.d='M'+(x+6)+','+FLOOR+'L'+(cx2-10)+','+(top+14)+'Q'+cx2+','+(top-4)+' '+(cx2+10)+','+(top+14)+'L'+(x+w-6)+','+FLOOR+'Z';a['stroke-linejoin']='round'}
 else if(c.shape==='hex'){var cx3=x+w/2,q=w/4;a.d='M'+(x+q)+','+FLOOR+'L'+x+','+(FLOOR-h/2)+'L'+(x+q)+','+top+'H'+(x+w-q)+'L'+(x+w)+','+(FLOOR-h/2)+'L'+(x+w-q)+','+FLOOR+'Z';a['stroke-linejoin']='round'}
 el('path',a,g)}
function face(g,c){var f=el('g',{'class':'jw-face'},g);var cx=c.x+c.w/2+(c.fx||0),fy=FLOOR-c.h+(c.fy!=null?c.fy:Math.min(60,c.h*0.3));c._f={x:cx,y:fy};
 var e=c.eyes||{},gap=e.gap||26,sz=e.size||11,pup=[];
 [-1,1].forEach(function(s){var ex=cx+s*gap/2;var eg=el('g',{'class':'jw-eye'},f);
  if(e.type==='dot'){var p=el('circle',{cx:ex,cy:fy,r:sz*0.55,fill:e.pupil||'#0b0f0f'},eg);pup.push({n:p,x:ex,y:fy,m:sz*0.45})}
  else{el('ellipse',{cx:ex,cy:fy,rx:sz,ry:sz*(e.tall||1),fill:e.white||'#fff'},eg);var p2=el('circle',{cx:ex,cy:fy,r:sz*(e.pr||0.5),fill:e.pupil||'#0b0f0f'},eg);pup.push({n:p2,x:ex,y:fy,m:sz*(1-(e.pr||0.5))*0.9});
   el('circle',{cx:ex+sz*0.18,cy:fy-sz*0.25,r:Math.max(1.4,sz*0.14),fill:'#fff',opacity:.9,'class':'jw-glint'},eg)}
  eg._lid=null});
 c._p=pup;
 var n=c.nose;if(n){var ny=fy+(n.dy||sz+8);
  if(n.type==='tri')el('path',{d:'M'+(cx-5)+','+(ny-3)+'L'+(cx+5)+','+(ny-3)+'L'+cx+','+(ny+5)+'Z',fill:n.color,'stroke':n.color,'stroke-width':3,'stroke-linejoin':'round'},f);
  else if(n.type==='round')el('ellipse',{cx:cx,cy:ny,rx:n.w||6,ry:n.h||4.5,fill:n.color},f);
  else if(n.type==='beak')el('path',{d:'M'+(cx-6)+','+(ny-2)+'Q'+cx+','+(ny-6)+' '+(cx+6)+','+(ny-2)+'Q'+(cx+2)+','+(ny+8)+' '+cx+','+(ny+8)+'Q'+(cx-2)+','+(ny+8)+' '+(cx-6)+','+(ny-2)+'Z',fill:n.color},f)}
 if(c.mouth){var my=fy+(c.mouth.dy||sz+22);el('path',{d:'M'+(cx-(c.mouth.w||8))+','+my+'Q'+cx+','+(my+(c.mouth.c||6))+' '+(cx+(c.mouth.w||8))+','+my,fill:'none',stroke:c.mouth.color||'#0b0f0f','stroke-width':3,'stroke-linecap':'round'},f)}
 if(c.cheeks){[-1,1].forEach(function(s){el('ellipse',{cx:cx+s*(gap/2+sz+4),cy:fy+sz+6,rx:6,ry:3.5,fill:c.cheeks,opacity:.7},f)})}
 var ink=(c.eyes&&c.eyes.type==='dot')?(c.eyes.pupil||'#0b0f0f'):'#0b0f0f',hw=Math.max(7,sz*0.8);
 var hp=el('g',{'class':'jw-happy'},f);[-1,1].forEach(function(s){var ex=cx+s*gap/2;
  if(c.eyes&&c.eyes.type!=='dot')el('ellipse',{cx:ex,cy:fy,rx:sz,ry:sz,fill:'#fff'},hp);
  el('path',{d:'M'+(ex-hw*0.75)+','+(fy+hw*0.25)+'Q'+ex+','+(fy-hw*0.85)+' '+(ex+hw*0.75)+','+(fy+hw*0.25),fill:'none',stroke:ink,'stroke-width':4,'stroke-linecap':'round'},hp)});
 var cl=el('g',{'class':'jw-closed'},f);[-1,1].forEach(function(s){var ex=cx+s*gap/2;
  el('path',{d:'M'+(ex-hw*0.8)+','+(fy-hw*0.1)+'Q'+ex+','+(fy+hw*0.75)+' '+(ex+hw*0.8)+','+(fy-hw*0.1),fill:'none',stroke:ink,'stroke-width':4,'stroke-linecap':'round'},cl);
  el('path',{d:'M'+(ex-s*hw*0.15)+','+(fy+hw*0.32)+'l'+(-s*0)+','+(hw*0.38),fill:'none',stroke:ink,'stroke-width':2.5,'stroke-linecap':'round'},cl)});
 var my=fy+(n?(n.dy||sz+8):sz+8)+14,mw=Math.max(10,gap*0.32);
 var sd=el('g',{'class':'jw-sad'},f);[-1,1].forEach(function(s){var ex=cx+s*gap/2,by=fy-sz*1.05-6;
  el('path',{d:'M'+(ex-s*hw*0.95)+','+(by+hw*0.05)+'L'+(ex+s*hw*0.75)+','+(by-hw*0.55),fill:'none',stroke:ink,'stroke-width':3.5,'stroke-linecap':'round'},sd)});
 el('ellipse',{cx:cx,cy:my+4,rx:Math.max(5,mw*0.42),ry:Math.max(6,mw*0.55),fill:'#2a0d12',stroke:ink,'stroke-width':2},sd);
 if(c.sweat!==false)el('path',{'class':'jw-drop',d:'M'+(cx+gap/2+sz+8)+','+(fy-sz-8)+'q6,9 0,13q-6,-4 0,-13z',fill:'#7fd3ff',stroke:'#3a9fd8','stroke-width':1.2},sd);
 el('path',{'class':'jw-smile',d:'M'+(cx-mw)+','+my+'Q'+cx+','+(my+mw*0.9)+' '+(cx+mw)+','+my,fill:'none',stroke:ink,'stroke-width':4,'stroke-linecap':'round'},f);
 var gr=el('g',{'class':'jw-grin'},f);var gw=mw*1.25;el('path',{d:'M'+(cx-gw)+','+(my-2)+'Q'+cx+','+(my+gw*1.5)+' '+(cx+gw)+','+(my-2)+'Z',fill:'#2a0d12',stroke:ink,'stroke-width':2.5,'stroke-linejoin':'round'},gr);
 el('ellipse',{cx:cx,cy:my+gw*0.55,rx:gw*0.45,ry:gw*0.25,fill:'#ff6f8e'},gr);
 return f}
function build(svg,set){svg.setAttribute('viewBox','0 0 600 440');var defs=el('defs',{},svg);var list=[];
 set.forEach(function(c,i){var g=el('g',{'class':'jw-ch'+(c.tag?' jw-'+c.tag:'')},svg);var hop=el('g',{'class':'jw-hop'},g);var b=el('g',{'class':'jw-body'},hop);c._ch=g;body(b,c,defs,'jwg'+Math.random().toString(36).slice(2,7)+i);var f=face(b,c);c._g=b;c._face=f;c._cur={fx:0,fy:0,lean:0,px:0,py:0};list.push(c)});
 return list}
function aim(list,tx,ty,k){list.forEach(function(c){var dx=tx-c._f.x,dy=ty-c._f.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,near=Math.min(1,d/220);
  var tfx=ux*(c.turn||9)*near,tfy=uy*(c.turn||9)*0.7*near,tl=Math.max(-1,Math.min(1,dx/500))*(c.lean!=null?c.lean:6),tp=near;
  var s=c._cur;s.fx+=(tfx-s.fx)*k;s.fy+=(tfy-s.fy)*k;s.lean+=(tl-s.lean)*k;s.ux=(s.ux||0)+(ux*tp-(s.ux||0))*Math.min(1,k*1.6);s.uy=(s.uy||0)+(uy*tp-(s.uy||0))*Math.min(1,k*1.6);
  var bx=c.x+c.w/2;c._g.setAttribute('transform','translate('+bx+','+FLOOR+') skewX('+(-s.lean).toFixed(2)+') translate('+(-bx)+','+(-FLOOR)+')');
  c._face.setAttribute('transform','translate('+s.fx.toFixed(2)+','+s.fy.toFixed(2)+')');
  c._p.forEach(function(p){p.n.setAttribute('transform','translate('+(s.ux*p.m).toFixed(2)+','+(s.uy*p.m).toFixed(2)+')')})})}
window.JCWatch={build:build,aim:aim,FLOOR:FLOOR};
})();

var INK='#0b0f0f';
var SETS={
 blocks:[
  {shape:'rect',x:150,w:130,h:330,color:'#7C5CFF',r:18,eyes:{size:11,gap:34},nose:{type:'round',color:'#5a3fe0',w:5,h:4},fy:56,lean:7},
  {shape:'rect',x:290,w:104,h:250,tag:'mint',grad:['#2BF5C0','#0DBC94','#196453'],r:16,eyes:{size:10,gap:30},nose:{type:'tri',color:'#0a6e57'},fy:50,lean:6},
  {shape:'semi',x:40,w:250,h:125,color:'#FF8A4C',eyes:{type:'dot',size:12,gap:46},nose:{type:'tri',color:'#c4521a'},fy:60,lean:3},
  {shape:'rect',x:380,w:118,h:180,color:'#FFD23F',r:59,eyes:{type:'dot',size:11,gap:34},nose:{type:'beak',color:'#e09a00'},fy:58,lean:4},
  {shape:'circle',x:492,w:92,h:92,tag:'white',color:'#F4FFFB',eyes:{type:'dot',size:8.5,gap:24},nose:{type:'round',color:'#0DBC94',w:4,h:3},fy:36,lean:2}],
 blobs:[
  {shape:'egg',x:90,w:170,h:250,grad:['#4DCBB0','#0DBC94'],eyes:{size:17,gap:52,pr:.55},nose:{type:'round',color:'#087a60',w:7,h:5,dy:24},cheeks:'#ff7aa8',fy:90,lean:5},
  {shape:'circle',x:250,w:150,h:150,color:'#FF6FAE',eyes:{size:15,gap:46,pr:.55},nose:{type:'round',color:'#d03c7d',w:6,h:4.5,dy:22},mouth:{dy:36,w:9,c:7,color:'#7a1f48'},fy:60,lean:4},
  {shape:'egg',x:390,w:120,h:200,color:'#4DA8FF',eyes:{size:14,gap:40,pr:.55},nose:{type:'round',color:'#2b78c9',w:6,h:4.5,dy:20},cheeks:'#ff9ec4',fy:70,lean:5},
  {shape:'circle',x:30,w:96,h:96,color:'#FFD23F',eyes:{size:11,gap:30,pr:.55},nose:{type:'round',color:'#d69a00',w:5,h:4,dy:16},fy:40,lean:2}],
 geo:[
  {shape:'tri',x:40,w:200,h:270,color:'#FF8A4C',eyes:{type:'dot',size:11,gap:30},nose:{type:'tri',color:INK},fy:150,lean:5},
  {shape:'rect',x:210,w:150,h:200,color:'#2BF5C0',r:10,eyes:{type:'dot',size:12,gap:44},nose:{type:'round',color:'#0a7a60',w:6,h:4},fy:60,lean:5},
  {shape:'circle',x:350,w:140,h:140,color:'#7C5CFF',eyes:{type:'dot',size:12,gap:40},nose:{type:'tri',color:'#2a1680'},fy:58,lean:3},
  {shape:'hex',x:470,w:110,h:96,color:'#FFD23F',eyes:{type:'dot',size:9,gap:28},nose:{type:'round',color:'#b37f00',w:4,h:3},fy:40,lean:2}],
 mint:[
  {shape:'rect',x:120,w:120,h:320,grad:['#2BF5C0','#0DBC94'],r:60,eyes:{size:12,gap:36},nose:{type:'round',color:'#077a5f'},fy:70,lean:6},
  {shape:'rect',x:250,w:110,h:240,grad:['#196453','#0d3d33'],stroke:'#2BF5C0',sw:2,r:55,eyes:{size:11,gap:32,white:'#e8fff8'},nose:{type:'round',color:'#2BF5C0',w:5,h:4},fy:62,lean:6},
  {shape:'semi',x:20,w:220,h:110,grad:['#4DCBB0','#196453'],eyes:{size:11,gap:40},nose:{type:'round',color:'#0a3d33'},fy:52,lean:3},
  {shape:'rect',x:370,w:96,h:150,color:'#FF8A4C',r:48,eyes:{size:10,gap:28},nose:{type:'round',color:'#b84a12',w:5,h:4},fy:52,lean:4},
  {shape:'circle',x:470,w:84,h:84,color:'#E8FFF8',eyes:{type:'dot',size:10,gap:26},nose:{type:'round',color:'#0DBC94',w:4,h:3},fy:36,lean:2}]
};

window.JCAuthScene=function(sc,m){var svg=sc.querySelector('.as-svg');if(!svg||svg._built)return;svg._built=1;
 var key=(window.JCL&&JCL.c&&JCL.c.login_chars)||'blocks';var set=JSON.parse(JSON.stringify(SETS[key]||SETS.blocks));
 if(key!=='blobs')set.forEach(function(c){c.eyes.size*=1.4;c.eyes.gap*=1.25;if(c.nose)c.nose.dy=c.eyes.size+9});
 var list=JCWatch.build(svg,set);var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 var tx=900,ty=60,last=Date.now(),shy=false,raf=0;
 function toLocal(cx,cy){var r=svg.getBoundingClientRect();var k=600/r.width;return [(cx-r.left)*k,(cy-r.top)*k]}
 function cardPt(){var c=m.querySelector('.auth-card');if(!c)return [900,60];var r=c.getBoundingClientRect();return toLocal(r.left+r.width*0.3,r.top+r.height*0.35)}
 D.addEventListener('pointermove',function(e){if(!m.classList.contains('on'))return;var p=toLocal(e.clientX,e.clientY);tx=p[0];ty=p[1];last=Date.now();kick()},{passive:true});
 function setShy(v){if(shy===v)return;shy=v;svg.classList.toggle('shy',v);kick()}
 m.addEventListener('focusin',function(e){setShy(!!(e.target&&e.target.type==='password'))});m.addEventListener('focusout',function(){setTimeout(function(){var a=D.activeElement;setShy(!!(a&&a.type==='password'&&m.contains(a)))},0)});
 var still=0;
 function frame(){raf=0;if(!m.classList.contains('on')||!m.classList.contains('auth'))return;var x=tx,y=ty;
  if(shy){x=-400;y=-200}else if(Date.now()-last>7000){var c=cardPt();x=c[0];y=c[1]}
  JCWatch.aim(list,x,y,RM?1:0.14);
  var moving=list.some(function(c){var s=c._cur;return Math.abs(s._lx-s.fx)>0.02||Math.abs(s._ll-s.lean)>0.02});list.forEach(function(c){c._cur._lx=c._cur.fx;c._cur._ll=c._cur.lean});
  if(moving||!RM&&Date.now()-last<8000)raf=requestAnimationFrame(frame)}
 function kick(){if(!raf)raf=requestAnimationFrame(frame)}
 if(!RM)(function blink(){setTimeout(function(){if(m.classList.contains('on')){var c=list[Math.floor(Math.random()*list.length)];var es=c._face.querySelectorAll('.jw-eye');es.forEach(function(e){e.classList.add('bl')});setTimeout(function(){es.forEach(function(e){e.classList.remove('bl')})},130)}blink()},1800+Math.random()*2600)})();
 new MutationObserver(function(){if(m.classList.contains('on')){var c=cardPt();tx=c[0];ty=c[1];last=Date.now()-6000;kick()}}).observe(m,{attributes:true,attributeFilter:['class']});
 var c0=cardPt();tx=c0[0];ty=c0[1];JCWatch.aim(list,tx,ty,1);
 list.forEach(function(c){c._ch.addEventListener('pointerdown',function(e){e.preventDefault();var g=c._ch;if(g.classList.contains('party'))return;g.classList.remove('happy');void g.getBoundingClientRect();g.classList.add('happy');clearTimeout(c._ht);c._ht=setTimeout(function(){g.classList.remove('happy')},1300)})});
 var panel=sc.querySelector('.as-panel');
 var sadT=null;
 window.JCAuthSad=function(){if(RM){return}svg.classList.remove('sad');void svg.getBoundingClientRect();svg.classList.add('sad');list.forEach(function(c){c._ch.classList.remove('happy')});
  var keep=[tx,ty];tx=300;ty=900;last=Date.now();kick();clearTimeout(sadT);sadT=setTimeout(function(){svg.classList.remove('sad');tx=keep[0];ty=keep[1];last=Date.now();kick()},1250)};
 window.JCAuthCelebrate=function(){return new Promise(function(done){if(RM||!m.classList.contains('on')||innerWidth<1024){confetti(m.querySelector('.auth-card'),40);setTimeout(done,RM?300:700);return}
  list.forEach(function(c,i){var g=c._ch;g.classList.remove('happy');g.style.setProperty('--d',(i*70)+'ms');g.classList.add('party')});
  svg.classList.remove('shy');shy=false;var cp=cardPt();tx=cp[0];ty=cp[1];last=Date.now();kick();confetti(panel,140);setTimeout(done,1350)})};
};
function confetti(host,n){if(!host)return;var cv=document.createElement('canvas');cv.className='jw-confetti';host.appendChild(cv);var r=host.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);cv.width=r.width*dpr;cv.height=r.height*dpr;var x=cv.getContext('2d');x.scale(dpr,dpr);
 var C=['#2BF5C0','#0DBC94','#4DCBB0','#7C5CFF','#FF8A4C','#FFD23F','#ffffff'],P=[];for(var i=0;i<n;i++){var a=-Math.PI/2+(Math.random()-.5)*1.9,v=7+Math.random()*9;P.push({x:r.width*(0.2+Math.random()*0.6),y:r.height*0.82,vx:Math.cos(a)*v,vy:Math.sin(a)*v,s:4+Math.random()*6,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:C[i%C.length],sh:i%3})}
 var t0=performance.now();(function f(t){var k=(t-t0)/1400;x.clearRect(0,0,r.width,r.height);P.forEach(function(p){p.vy+=0.32;p.vx*=0.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.globalAlpha=Math.max(0,1-k*k);x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;if(p.sh===0)x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);else if(p.sh===1){x.beginPath();x.arc(0,0,p.s/2.4,0,7);x.fill()}else{x.beginPath();x.moveTo(0,-p.s/2);x.lineTo(p.s/2,p.s/2);x.lineTo(-p.s/2,p.s/2);x.fill()}x.restore()});
  if(k<1)requestAnimationFrame(f);else cv.remove()})(t0)}
var D=document;
