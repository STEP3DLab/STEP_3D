const stage=document.getElementById('bear-stage');
const video=document.getElementById('bear-video');
const image=document.getElementById('bear-gif');
const toggle=document.getElementById('rotate-toggle');
const keyboardHelp=document.getElementById('bear-keyboard-help');
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
let wantsPlayback=!motionPreference.matches;
let gifMode=false,dragging=false,lastX=0,resumeAfterDrag=false,playRequest=0;

function update(){
 toggle.textContent=wantsPlayback?'Ⅱ':'▷';
 toggle.setAttribute('aria-label',wantsPlayback?'Приостановить вращение':'Включить вращение');
 toggle.setAttribute('aria-pressed',String(wantsPlayback));
}
async function syncPlayback(){
 const request=++playRequest;
 const canPlay=wantsPlayback&&!document.hidden&&!dragging;
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

video.muted=true;
video.addEventListener('error',()=>{
 if(gifMode)return;
 gifMode=true;video.hidden=true;image.hidden=false;stage.dataset.renderer='gif';
 document.querySelector('.drag-hint').textContent='Скульптура · 360°';
 keyboardHelp.textContent='Пробел или Enter — включить или приостановить анимацию.';
 stage.setAttribute('aria-keyshortcuts','Space Enter');
 syncPlayback();
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
syncPlayback();
