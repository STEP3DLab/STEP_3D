const stage=document.getElementById('bear-stage'),video=document.getElementById('bear-video'),image=document.getElementById('bear-gif'),toggle=document.getElementById('rotate-toggle');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let playing=!reduced,gifMode=false,dragging=false,lastX=0,resumeAfterDrag=false;
function update(){toggle.textContent=playing?'Ⅱ':'▷';toggle.setAttribute('aria-label',playing?'Приостановить вращение':'Включить вращение');toggle.setAttribute('aria-pressed',String(playing))}
async function play(){playing=true;update();if(gifMode){image.src='assets/animation/trifoti-bear-loop.gif';return}try{await video.play()}catch{playing=false;update()}}
function pause(){playing=false;video.pause();if(gifMode)image.src='assets/animation/bear-loop-poster.webp';update()}
video.muted=true;video.addEventListener('error',()=>{gifMode=true;video.hidden=true;image.hidden=false;image.src=playing?'assets/animation/trifoti-bear-loop.gif':'assets/animation/bear-loop-poster.webp';stage.dataset.renderer='gif';document.querySelector('.drag-hint').textContent='Скульптура · 360°'});
video.addEventListener('loadeddata',()=>stage.dataset.renderer='video');
toggle.addEventListener('click',()=>playing?pause():play());
document.getElementById('bear-reset').addEventListener('click',()=>{if(gifMode){image.src='assets/animation/bear-loop-poster.webp'}else video.currentTime=0;pause()});
stage.addEventListener('pointerdown',e=>{if(gifMode||!Number.isFinite(video.duration))return;dragging=true;lastX=e.clientX;resumeAfterDrag=playing;pause();stage.setPointerCapture(e.pointerId);stage.classList.add('dragging')});
stage.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX;lastX=e.clientX;const duration=video.duration;if(duration>0)video.currentTime=(video.currentTime+dx/stage.clientWidth*duration+duration)%duration});
for(const name of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(name,()=>{if(!dragging)return;dragging=false;stage.classList.remove('dragging');if(resumeAfterDrag)play()});
stage.tabIndex=0;stage.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight');stage.addEventListener('keydown',e=>{if(!gifMode&&Number.isFinite(video.duration)&&video.duration>0&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();pause();video.currentTime=(video.currentTime+(e.key==='ArrowLeft'?-.2:.2)+video.duration)%video.duration}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(playing&&!gifMode)video.play().catch(()=>{})});
update();if(playing)play();else pause();
