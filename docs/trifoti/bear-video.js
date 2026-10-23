const stage=document.getElementById('bear-stage');
const video=document.getElementById('bear-video');
const image=document.getElementById('bear-gif');
const toggle=document.getElementById('rotate-toggle');
const keyboardHelp=document.getElementById('bear-keyboard-help');
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const connection=typeof navigator==='undefined'?null:navigator.connection;
const sources=[...video.querySelectorAll('source')];
const failedSources=new Set();
let wantsPlayback=!motionPreference.matches&&!connection?.saveData;
let inViewport=typeof IntersectionObserver!=='function';
let gifMode=false,dragging=false,lastX=0,resumeAfterDrag=false,playRequest=0,exhaustionCheck=null;

function update(){
 toggle.textContent=wantsPlayback?'Ⅱ':'▷';
 toggle.setAttribute('aria-label',wantsPlayback?'Приостановить вращение':'Включить вращение');
 toggle.setAttribute('aria-pressed',String(wantsPlayback));
}
async function syncPlayback(){
 const request=++playRequest;
 const canPlay=wantsPlayback&&inViewport&&!document.hidden&&!dragging;
 update();
 if(gifMode){
  video.pause();
  const source=canPlay?'assets/animation/trifoti-bear-loop.gif':'assets/animation/bear-loop-poster.webp';
  if(image.getAttribute('src')!==source)image.setAttribute('src',source);
  return;
 }
 if(!canPlay){video.pause();return}
 try{await video.play()}
 catch{if(request===playRequest){wantsPlayback=false;update()}}
}
function play(){wantsPlayback=true;syncPlayback()}
function pause(){wantsPlayback=false;syncPlayback()}
function togglePlayback(){wantsPlayback?pause():play()}

function useFallback(){
 if(gifMode)return;
 if(exhaustionCheck!==null){clearTimeout(exhaustionCheck);exhaustionCheck=null}
 gifMode=true;video.hidden=true;image.hidden=false;stage.dataset.renderer='gif';
 document.querySelector('.drag-hint').textContent='Скульптура · 360°';
 keyboardHelp.textContent='Пробел или Enter — включить или приостановить анимацию.';
 stage.setAttribute('aria-keyshortcuts','Space Enter');
 syncPlayback();
}
function checkExhaustionSoon(){
 if(gifMode||exhaustionCheck!==null)return;
 // NETWORK_NO_SOURCE can be transient while the browser selects a source.
 // Recheck once in the next task, never poll or restart a network request.
 exhaustionCheck=setTimeout(()=>{
  exhaustionCheck=null;
  if(video.networkState===3&&video.readyState===0)useFallback();
 },0);
}
video.muted=true;
video.addEventListener('error',useFallback);
video.addEventListener('loadstart',()=>failedSources.clear());
for(const source of sources)source.addEventListener('error',()=>{
 if(gifMode)return;
 failedSources.add(source);
 // Child source errors do not bubble to video. One failed format must not
 // hide another usable format; stale source events cannot replace ready media.
 if(video.readyState===0&&sources.every(item=>failedSources.has(item)))useFallback();
 else checkExhaustionSoon();
});
video.addEventListener('loadeddata',()=>{if(!gifMode)stage.dataset.renderer='video'});
toggle.addEventListener('click',togglePlayback);
document.getElementById('bear-reset').addEventListener('click',()=>{
 resumeAfterDrag=false;
 if(!gifMode)video.currentTime=0;
 pause();
});
stage.addEventListener('pointerdown',e=>{
 if(e.button!==0||e.isPrimary===false||gifMode||!Number.isFinite(video.duration)||video.duration<=0)return;
 dragging=true;lastX=e.clientX;resumeAfterDrag=wantsPlayback;pause();
 stage.setPointerCapture(e.pointerId);stage.classList.add('dragging');
});
stage.addEventListener('pointermove',e=>{
 if(!dragging||stage.clientWidth<=0)return;
 const dx=e.clientX-lastX;lastX=e.clientX;const duration=video.duration;
 if(duration>0)video.currentTime=(video.currentTime+dx/stage.clientWidth*duration+duration)%duration;
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(name,()=>{
 if(!dragging)return;
 dragging=false;stage.classList.remove('dragging');
 if(resumeAfterDrag)play();
 resumeAfterDrag=false;
});
stage.tabIndex=0;
stage.setAttribute('aria-keyshortcuts','Space Enter ArrowLeft ArrowRight');
stage.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key===' '||e.key==='Enter'){
  e.preventDefault();if(!e.repeat)togglePlayback();return;
 }
 if(!gifMode&&Number.isFinite(video.duration)&&video.duration>0&&['ArrowLeft','ArrowRight'].includes(e.key)){
  e.preventDefault();pause();
  video.currentTime=(video.currentTime+(e.key==='ArrowLeft'?-.2:.2)+video.duration)%video.duration;
 }
});
motionPreference.addEventListener('change',e=>{
 // Respect a newly enabled OS preference immediately. Turning it off does not
 // override a visitor's pause; the play control remains available explicitly.
 if(e.matches){resumeAfterDrag=false;pause()}
});
document.addEventListener('visibilitychange',syncPlayback);
connection?.addEventListener?.('change',()=>{
 // Like reduced motion, Save-Data disables automatic intent, not the explicit control.
 if(connection.saveData){resumeAfterDrag=false;pause()}
});
// The stage persists for this document's lifetime. Observe it once rather than
// polling scroll; with no observer support, retain the existing visibility guard.
if(typeof IntersectionObserver==='function'){
 try{
  const observer=new IntersectionObserver(entries=>{
   const entry=entries.filter(item=>item.target===stage).at(-1);
   if(!entry||inViewport===entry.isIntersecting)return;
   inViewport=entry.isIntersecting;syncPlayback();
  },{threshold:0});
  observer.observe(stage);
 }catch{inViewport=true}
}
// The dynamic module may arrive after the browser has already exhausted both
// sources. Keep empty/loading/ready media, and an explicit user abort, intact.
if(video.readyState>=2)stage.dataset.renderer='video';
if([2,3,4].includes(video.error?.code))useFallback();
else if(video.networkState===3&&video.readyState===0)checkExhaustionSoon();
syncPlayback();
