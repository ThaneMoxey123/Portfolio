/* Guiding Analytics: tour interaction tracking for portfolio test page.
   Uses the existing GuidingAnalytics.track() to preserve visitor and session IDs.
   This script does NOT send page_view events. */
(()=>{'use strict';
if(window.GuidingAnalyticsEvents)return;
const validTour=t=>typeof t==='string'?t.trim().slice(0,255):'';
function send(type,tour){
  const id=validTour(tour);
  if(!id||typeof window.GuidingAnalytics?.track!=='function'){
    console.warn('Guiding Analytics: base tracker missing or tour ID invalid');return false;
  }
  window.GuidingAnalytics.track(type,{tour_id:id});return true;
}
const api=Object.freeze({tourView:t=>send('tour_view',t),bookingClick:t=>send('booking_click',t),enquiry:t=>send('enquiry',t)});
window.GuidingAnalyticsEvents=api;
let route=location.pathname+location.search,seen=new Set();
function scan(){const next=location.pathname+location.search;if(next!==route){route=next;seen=new Set();}
 document.querySelectorAll('[data-ga-tour-view]').forEach(el=>{const id=validTour(el.getAttribute('data-ga-tour-view'));if(id&&!seen.has(id)){seen.add(id);api.tourView(id);}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan,{once:true});else scan();
const observer=new MutationObserver(()=>queueMicrotask(scan));
function observe(){if(document.body)observer.observe(document.body,{childList:true,subtree:true});}
if(document.body)observe();else document.addEventListener('DOMContentLoaded',observe,{once:true});
window.addEventListener('popstate',scan);
for(const method of ['pushState','replaceState']){const old=history[method];if(typeof old==='function')history[method]=function(...args){const result=old.apply(this,args);scan();return result;};}
const last=new WeakMap();
document.addEventListener('click',e=>{const el=e.target?.closest?.('[data-ga-booking-click]');if(!el)return;
 const id=validTour(el.getAttribute('data-ga-booking-click'));if(!id)return;
 const now=Date.now();if(now-(last.get(el)||0)<800)return;last.set(el,now);api.bookingClick(id);
},true);
document.addEventListener('ga:enquiry-success',e=>{api.enquiry(e.detail?.tour_id||'');});
})();
