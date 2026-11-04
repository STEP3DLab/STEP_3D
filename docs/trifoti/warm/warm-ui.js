// Follow the cover link straight into the original, unretouched sculpture video.
const originalBlock = document.querySelector('#original-bear details');
function revealOriginalBear() {
  if (originalBlock) originalBlock.open = true;
}
document.querySelector('.warm-original-link')?.addEventListener('click', revealOriginalBear);
if (location.hash === '#original-bear') revealOriginalBear();
window.addEventListener('hashchange', () => {
  if (location.hash === '#original-bear') revealOriginalBear();
});
