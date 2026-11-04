// Ephemeral gallery state: never persists a visitor's viewing history.
export function createFrameMemory(){
 const frames=new Map();
 return {remember(key,index){if(Number.isInteger(index)&&index>=0)frames.set(key,index)},recall(key,count){const index=frames.get(key);return Number.isInteger(index)&&index>=0&&index<count?index:0}};
}
export function thumbnailKey(event,index,count){
 if(event.defaultPrevented||event.isComposing||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||count<2)return null;
 if(event.key==='Home')return 0;
 if(event.key==='End')return count-1;
 if(event.key==='ArrowLeft')return (index-1+count)%count;
 if(event.key==='ArrowRight')return (index+1)%count;
 return null;
}
// Passive touch listeners never prevent vertical scroll, pinch zoom or video controls.
export function mountPhotoSwipe({viewer,onStep,isEnabled=()=>true}){
 let start=null;
 viewer.addEventListener('touchstart',event=>{
  start=event.touches.length===1&&event.target.tagName==='IMG'&&isEnabled()?{x:event.touches[0].clientX,y:event.touches[0].clientY,time:event.timeStamp}:null;
 },{passive:true});
 viewer.addEventListener('touchmove',event=>{
  if(!start)return;
  if(event.touches.length!==1){start=null;return}
  const touch=event.touches[0];
  if(Math.abs(touch.clientY-start.y)>Math.abs(touch.clientX-start.x)&&Math.abs(touch.clientY-start.y)>12)start=null;
 },{passive:true});
 viewer.addEventListener('touchcancel',()=>{start=null},{passive:true});
 viewer.addEventListener('touchend',event=>{
  const first=start;start=null;
  if(!first||event.touches.length||event.changedTouches.length!==1||!isEnabled())return;
  const touch=event.changedTouches[0],dx=touch.clientX-first.x,dy=touch.clientY-first.y;
  if(event.timeStamp-first.time<=900&&Math.abs(dx)>=50&&Math.abs(dx)>Math.abs(dy)*2)onStep(dx<0?1:-1);
 },{passive:true});
}
