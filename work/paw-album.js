(()=>{'use strict';
const heroShell=document.getElementById('heroScrollShell'),hero=document.getElementById('caseHero'),stage=document.getElementById('stageMotion'),album=document.getElementById('albumShell'),track=document.getElementById('albumTrack'),viewport=document.getElementById('albumViewport'),progress=document.getElementById('albumProgressFill'),count=document.getElementById('albumCount'),label=document.getElementById('albumLabel');
if(!heroShell||!hero||!stage||!album||!track)return;
const panels=[...track.querySelectorAll('.album-panel')],reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,mobile=matchMedia('(max-width:767px)');
let mx=0,my=0,smx=0,smy=0,heroProgress=0,raf=0;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
hero.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduce)return;const r=hero.getBoundingClientRect();mx=clamp((e.clientX-r.left)/r.width,-1,2)*2-1;my=clamp((e.clientY-r.top)/r.height,-1,2)*2-1},{passive:true});
hero.addEventListener('pointerleave',()=>{mx=0;my=0},{passive:true});
function setChapter(p){const i=Math.min(4,Math.max(0,Math.round(p*4)));count.textContent=String(i+1).padStart(2,'0')+' / 05';label.textContent=panels[i].dataset.label;progress.style.width=(p*100).toFixed(2)+'%'}
function tick(){raf=0;const hh=heroShell.getBoundingClientRect(),vh=innerHeight;heroProgress=mobile.matches?0:clamp(-hh.top/Math.max(1,hh.height-vh));smx+=(mx-smx)*.065;smy+=(my-smy)*.065;hero.style.setProperty('--transition',heroProgress.toFixed(4));
 if(mobile.matches){stage.style.transform='';}else{const tilt=(1-heroProgress);const x=smx*12*tilt,y=smy*10*tilt;const sc=1+heroProgress*.14;stage.style.transform=`translate3d(${x-heroProgress*innerWidth*.11}px,${y+heroProgress*innerHeight*.08}px,0) rotateY(${smx*2.7*tilt}deg) rotateX(${-smy*2*tilt}deg) scale(${sc})`;}
 if(mobile.matches){const max=viewport.scrollWidth-viewport.clientWidth;setChapter(max>0?clamp(viewport.scrollLeft/max):0)}else{const r=album.getBoundingClientRect(),max=Math.max(1,r.height-vh),p=clamp(-r.top/max);const travel=Math.max(0,track.scrollWidth-viewport.clientWidth);track.style.transform=`translate3d(${-p*travel}px,0,0)`;setChapter(p)}
 raf=requestAnimationFrame(tick)}
function navTo(i){if(mobile.matches){viewport.scrollTo({left:panels[i].offsetLeft,behavior:reduce?'instant':'smooth'})}else{const h=album.offsetHeight-innerHeight;scrollTo({top:album.getBoundingClientRect().top+scrollY+(i/4)*h,behavior:reduce?'instant':'smooth'})}}
hero.querySelectorAll('.case-nav a').forEach((a,i)=>{a.addEventListener('click',e=>{e.preventDefault();navTo(i)})});
requestAnimationFrame(tick);
})();