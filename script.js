const rail = document.querySelector(".rail");
let scrollTimer;
window.addEventListener("scroll", () => {
  rail?.classList.add("reveal");
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => rail?.classList.remove("reveal"), 700);
}, {passive:true});

const sections = [...document.querySelectorAll(".section-observed")];
const links = [...document.querySelectorAll(".rail-link")];
const observer = new IntersectionObserver(entries => {
  const visible = entries.filter(e => e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
  if (!visible) return;
  links.forEach(l => l.classList.toggle("active", l.dataset.section === visible.target.id));
}, {rootMargin:"-25% 0px -45% 0px", threshold:[0,.2,.5,.8]});
sections.forEach(s => observer.observe(s));

const topbar = document.querySelector(".topbar");
const menu = document.querySelector(".menu-button");
menu?.addEventListener("click", () => {
  const open = topbar.classList.toggle("open");
  menu.setAttribute("aria-expanded", String(open));
});
document.querySelectorAll(".topnav a").forEach(a=>a.addEventListener("click",()=>topbar.classList.remove("open")));

const track = document.querySelector(".carousel-track");
const dots = [...document.querySelectorAll(".dot")];
let originals = [...document.querySelectorAll(".project-slide")];
const total = originals.length;
let current = 1; // first real slide after leading clone
let logicalIndex = 0;
let startX = 0, dragging = false, animating = false;

// Clone the last slide before the first and the first slide after the last.
// This creates the illusion that the row is a continuous revolving loop.
const firstClone = originals[0].cloneNode(true);
const lastClone = originals[total - 1].cloneNode(true);
firstClone.setAttribute("aria-hidden","true");
lastClone.setAttribute("aria-hidden","true");
track.insertBefore(lastClone, originals[0]);
track.appendChild(firstClone);

let slides = [...track.querySelectorAll(".project-slide")];

function centerCurrent(animate=true){
  const viewport = document.querySelector(".carousel-viewport");
  const active = slides[current];
  if(!viewport || !active) return;
  track.classList.toggle("no-animate", !animate);
  const desired = (viewport.clientWidth - active.offsetWidth)/2 - active.offsetLeft;
  track.style.setProperty("transform", `translateX(${desired}px)`, "important");

  slides.forEach((slide,n)=>{
    slide.classList.toggle("is-active", n===current);
    slide.classList.toggle("is-before", n===current-1);
    slide.classList.toggle("is-after", n===current+1);
  });
  dots.forEach((dot,n)=>dot.classList.toggle("active", n===logicalIndex));
}

function move(direction){
  if(animating) return;
  animating = true;
  current += direction;
  logicalIndex = (logicalIndex + direction + total) % total;
  centerCurrent(true);
}

track.addEventListener("transitionend", e=>{
  if(e.propertyName !== "transform") return;
  // If we've reached a clone, instantly jump to its matching real slide.
  if(current === 0){
    current = total;
    centerCurrent(false);
  } else if(current === total + 1){
    current = 1;
    centerCurrent(false);
  }
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    track.classList.remove("no-animate");
    animating = false;
  }));
});

document.querySelector(".next")?.addEventListener("click",()=>move(1));
document.querySelector(".prev")?.addEventListener("click",()=>move(-1));

dots.forEach((dot,target)=>dot.addEventListener("click",()=>{
  if(animating || target===logicalIndex) return;
  // With only three projects, choose the shortest circular direction.
  let diff = (target - logicalIndex + total) % total;
  move(diff === 1 ? 1 : -1);
}));

track.addEventListener("pointerdown",e=>{
  dragging=true; startX=e.clientX; track.setPointerCapture(e.pointerId);
});
track.addEventListener("pointerup",e=>{
  if(!dragging) return;
  const dx=e.clientX-startX; dragging=false;
  if(Math.abs(dx)>45) move(dx<0?1:-1);
});
track.addEventListener("pointercancel",()=>dragging=false);
window.addEventListener("resize",()=>centerCurrent(false));
requestAnimationFrame(()=>centerCurrent(false));

document.getElementById("year").textContent = new Date().getFullYear();

let v2LastY=window.scrollY,v2LastT=performance.now();const v2Header=document.querySelector(".topbar");
window.addEventListener("scroll",()=>{const now=performance.now(),y=window.scrollY,dy=y-v2LastY,dt=Math.max(1,now-v2LastT),speed=Math.abs(dy)/dt;if(y>140&&dy>8)v2Header?.classList.add("header-hidden");if(dy<-5||y<80)v2Header?.classList.remove("header-hidden");if(speed>.75||Math.abs(dy)>90){rail?.classList.add("reveal");clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>rail?.classList.remove("reveal"),850)}v2LastY=y;v2LastT=now},{passive:true});
document.addEventListener("mousemove",e=>{if(innerWidth-e.clientX<34){rail?.classList.add("reveal");clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>rail?.classList.remove("reveal"),1200)}},{passive:true});
