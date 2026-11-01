
/* V4.0 — display-density antialiased mask over the unchanged V3.8 fluid field. The field is ONLY an alpha mask;
   the underlying android and machine scene remain real, aligned layers. */
(()=>{'use strict';
const hero=document.getElementById('caseHero'),out=document.getElementById('inkCanvas');
const ctx=out.getContext('2d',{alpha:true});
const robot=document.getElementById('caseWire');
const mover=document.getElementById('stageMotion')||document.getElementById('caseStage');
if(!ctx||!robot||!mover)return;
// Paint exact same headline content in white onto the *underlying* scene,
// then apply the SAME fluid alpha mask to the entire scene. No separate cursor hover mask.
const field=document.createElement('canvas'),fc=field.getContext('2d',{willReadFrequently:true});
const scene=document.createElement('canvas'),sc=scene.getContext('2d');

const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let W=0,H=0,NX=0,NY=0,N=0,den,velX,velY,nextD,nextX,nextY,pixels;
let maskW=0,maskH=0,maskPixels,maskSampleX,maskSampleY,maskDpr=1;
let last=performance.now(),lastRendered=0,inside=false,previous=null,queued=[],visible=true;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function resize(){
 const r=hero.getBoundingClientRect();W=r.width;H=r.height;
 const dpr=Math.min(devicePixelRatio||1,1.5);
 out.width=Math.round(W*dpr);out.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 scene.width=out.width;scene.height=out.height;sc.setTransform(dpr,0,0,dpr,0,0);

 // Simulation grid: high enough for curved silhouettes, small enough for laptops.
 NX=Math.max(100,Math.min(370,Math.round(W/3.5)));
 NY=Math.max(75,Math.min(240,Math.round(H/3.5)));
 N=NX*NY;field.width=NX;field.height=NY;
 den=new Float32Array(N);velX=new Float32Array(N);velY=new Float32Array(N);
 nextD=new Float32Array(N);nextX=new Float32Array(N);nextY=new Float32Array(N);
 // Render the alpha mask at actual output pixel density. Fluid grid remains unchanged.
 // Direct pixel sampling avoids a second low-resolution canvas enlargement.
 maskDpr=dpr;
 maskW=out.width;maskH=out.height;
 field.width=maskW;field.height=maskH;
 maskPixels=fc.createImageData(maskW,maskH);
 maskSampleX=new Float32Array(maskW);maskSampleY=new Float32Array(maskH);
 for(let x=0;x<maskW;x++)maskSampleX[x]=(x+.5)*NX/maskW-.5;
 for(let y=0;y<maskH;y++)maskSampleY[y]=(y+.5)*NY/maskH-.5;
 queued=[];previous=null;
}
resize();addEventListener('resize',resize,{passive:true});
function sample(arr,x,y){
 x=clamp(x,0,NX-1.001);y=clamp(y,0,NY-1.001);
 const ix=x|0,iy=y|0,fx=x-ix,fy=y-iy,i=iy*NX+ix;
 return (arr[i]*(1-fx)+arr[i+1]*fx)*(1-fy)+(arr[i+NX]*(1-fx)+arr[i+NX+1]*fx)*fy;
}
function inject(x,y,dx,dy,force){
 const gx=x/W*NX,gy=y/H*NY;
 const speed=Math.hypot(dx,dy),ux=dx/(speed||1),uy=dy/(speed||1);
 const radius=.70*(27+Math.min(23,speed*.28))*NX/W;
 const extent=Math.ceil(radius*2.8),cx=Math.round(gx),cy=Math.round(gy);
 for(let j=Math.max(1,cy-extent);j<Math.min(NY-1,cy+extent);j++){
  for(let i=Math.max(1,cx-extent);i<Math.min(NX-1,cx+extent);i++){
   const rx=i-gx,ry=j-gy,rr=(rx*rx+ry*ry)/(radius*radius);
   if(rr>7.5)continue;
   const core=Math.exp(-rr*.86),edge=Math.exp(-rr*.34);
   const k=j*NX+i;
   den[k]=Math.min(2.4,den[k]+core*.54*force);
   // Push fluid sideways, creating curling wakes rather than a painted line.
   const spin=(rx*uy-ry*ux)>=0?1:-1;
   velX[k]+=((ux*.30)+(-ry/(radius+1))*.32*spin)*edge*force;
   velY[k]+=((uy*.30)+(rx/(radius+1))*.32*spin)*edge*force;
  }
 }
}
function pointer(e){if(reduce||e.pointerType==='touch')return;
 const r=hero.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,t=performance.now();
 if(x<0||y<0||x>W||y>H)return;
 if(!previous||t-previous.t>140||Math.hypot(x-previous.x,y-previous.y)>280){
  queued.push([x,y,0,0,.8]);
 }else{
  const dx=x-previous.x,dy=y-previous.y,dist=Math.hypot(dx,dy);
  const steps=Math.max(1,Math.min(35,Math.ceil(dist/15)));
  for(let i=1;i<=steps;i++)queued.push([previous.x+dx*i/steps,previous.y+dy*i/steps,dx/steps,dy/steps,1]);
 }
 previous={x,y,t};inside=true;
}
hero.addEventListener('pointermove',pointer,{passive:true});
hero.addEventListener('pointerdown',pointer,{passive:true});
hero.addEventListener('pointerleave',()=>{previous=null;inside=false});
addEventListener('blur',()=>{previous=null;queued=[]});
function simulate(dt,t){
 // Avoid joining disconnected cursor paths. Inject only sampled local moves.
 for(const q of queued)inject(...q);queued=[];
 const frame=clamp(dt/16.67,.45,2.2),decay=Math.pow(.963,frame),drag=Math.pow(.955,frame);
 for(let y=1;y<NY-1;y++)for(let x=1;x<NX-1;x++){
  const k=y*NX+x;
  // Smooth, low-frequency vortices transport the pigment after the cursor leaves.
  const flowX=(Math.sin(y*.049+t*.00041)+Math.cos((x+y)*.034-t*.00029))*.19;
  const flowY=(Math.cos(x*.053-t*.00037)-Math.sin((x-y)*.029+t*.00032))*.19;
  const vx=velX[k]+flowX,vy=velY[k]+flowY;
  const sx=x-vx*frame,sy=y-vy*frame;
  nextD[k]=sample(den,sx,sy)*decay;
  // A little diffusion, without blurring the final reveal edge.
  nextD[k]=nextD[k]*.986+(den[k-1]+den[k+1]+den[k-NX]+den[k+NX])*.0035;
  nextX[k]=sample(velX,sx,sy)*drag;
  nextY[k]=sample(velY,sx,sy)*drag;
 }
 [den,nextD]=[nextD,den];[velX,nextX]=[nextX,velX];[velY,nextY]=[nextY,velY];
 // Prevent recycled border data from causing stray lines.
 for(let x=0;x<NX;x++){den[x]=0;den[(NY-1)*NX+x]=0;velX[x]=velY[x]=0}
 for(let y=0;y<NY;y++){const a=y*NX,b=a+NX-1;den[a]=den[b]=0;velX[a]=velY[a]=velX[b]=velY[b]=0}
}
function makeMask(){
 // Bilinear interpolation of the actual fluid density BEFORE applying the ink
 // threshold. Thresholding the small simulation grid first caused the stairs.
 const data=maskPixels.data, low=.146, high=.190;
 let active=false;
 for(let y=0;y<maskH;y++){
  const gy=clamp(maskSampleY[y],0,NY-1.001), iy=gy|0, fy=gy-iy;
  const row=iy*NX, row2=(iy+1)*NX;
  for(let x=0;x<maskW;x++){
   const gx=clamp(maskSampleX[x],0,NX-1.001), ix=gx|0, fx=gx-ix;
   const a=den[row+ix],b=den[row+ix+1],c=den[row2+ix],e=den[row2+ix+1];
   const v=(a+(b-a)*fx)*(1-fy)+(c+(e-c)*fx)*fy;
   const u=clamp((v-low)/(high-low),0,1);
   const alpha=u*u*(3-2*u),j=(y*maskW+x)*4;
   data[j]=data[j+1]=data[j+2]=255;
   data[j+3]=Math.round(alpha*255);
   if(alpha>.01)active=true;
  }
 }
 if(active)fc.putImageData(maskPixels,0,0);
 return active;
}

const textSelectors=['.case-brand','.case-nav a','.case-headline span','.case-intro','.case-subtitle','.case-archive-link','.case-meta small','.case-meta strong','.case-hero-bottom span'];
function paintRevealText(heroRect){
 sc.fillStyle='#effbf3';sc.textAlign='left';sc.textBaseline='alphabetic';
 for(const el of hero.querySelectorAll(textSelectors.join(','))){
  const style=getComputedStyle(el);
  if(style.display==='none'||style.visibility==='hidden')continue;
  const size=parseFloat(style.fontSize)||14;
  sc.font=`${style.fontWeight} ${size}px ${style.fontFamily}`;
  // Text nodes are measured by DOM ranges, including wrapped description lines.
  // Keeping each word's actual browser position avoids any layout shift.
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
   const content=node.textContent;
   const pattern=/\S+/g;let m;
   while((m=pattern.exec(content))){
    const range=document.createRange();range.setStart(node,m.index);range.setEnd(node,m.index+m[0].length);
    const rect=range.getBoundingClientRect();
    if(!rect.width||!rect.height)continue;
    // Scale each word to its actual laid-out width, including CSS letter spacing.
    const natural=sc.measureText(m[0]).width;
    sc.save();sc.translate(rect.left-heroRect.left,rect.top-heroRect.top+size*.83);
    if(natural>0)sc.scale(rect.width/natural,1);
    sc.fillText(m[0],0,0);sc.restore();
   }
  }
 }
}
function draw(t){
 if(t-lastRendered<30){requestAnimationFrame(draw);return;}
 lastRendered=t;const dt=Math.min(42,t-last);last=t;
 if(!reduce&&visible){simulate(dt,t);ctx.clearRect(0,0,W,H);
  if(makeMask()&&robot.complete&&robot.naturalWidth){

   sc.clearRect(0,0,W,H);
   sc.fillStyle='#183c36';sc.fillRect(0,0,W,H);
   const hr=hero.getBoundingClientRect(),st=mover.getBoundingClientRect();
   // Match the finished screenshot's exact rendered rectangle. Never cover-crop
   // or scale the wireframe differently from the image underneath.
   sc.drawImage(robot,st.left-hr.left,st.top-hr.top,st.width,st.height);
   // Repaint all hero lettering in pale ivory on the revealed layer.
   // This uses the same fluid alpha mask as the evergreen background, so the
   // letters brighten only where the cursor's ink actually passes over them.
   paintRevealText(hr);
   sc.globalCompositeOperation='destination-in';sc.drawImage(field,0,0,W,H);
   sc.globalCompositeOperation='source-over';ctx.drawImage(scene,0,0,W,H);
  }
 }
 requestAnimationFrame(draw);
}
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting},{threshold:0}).observe(hero);
requestAnimationFrame(draw);
})();
