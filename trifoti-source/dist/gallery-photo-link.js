// A native link opens the current local original, never a thumbnail or video.
export function updateGalleryPhotoLink({item,link,viewer,document}) {
 const source=item?.src;
 const available=item?.type!=='video'&&typeof source==='string'&&/^assets\/projects\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g)$/i.test(source);
 if(!available){
  // Arrow navigation can switch to video while this link owns focus.
  if(document.activeElement===link)viewer.focus({preventScroll:true});
  link.hidden=true;link.removeAttribute('href');link.removeAttribute('aria-label');return;
 }
 link.setAttribute('href',source);
 link.setAttribute('aria-label',`Открыть фото крупно в новой вкладке: ${item.caption}`);
 link.hidden=false;
}
