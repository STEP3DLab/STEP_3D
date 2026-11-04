const viewer = document.querySelector('.photo-viewer');
const photos = [...document.querySelectorAll('a.enlarge')];
const previous = viewer.querySelector('[data-previous]');
const next = viewer.querySelector('[data-next]');
let current = 0;

function showPhoto(index) {
  if (index < 0 || index >= photos.length) return;
  current = index;
  const photo = photos[current];
  const image = viewer.querySelector('img');
  image.src = photo.href;
  image.alt = photo.querySelector('img').alt;
  viewer.querySelector('.viewer-foot p').textContent = image.alt;
  viewer.querySelector('.viewer-controls span').textContent = (current + 1) + ' / ' + photos.length;
  previous.disabled = current === 0;
  next.disabled = current === photos.length - 1;
  viewer.querySelector('.viewer-controls').hidden = photos.length < 2;
}

photos.forEach((photo, index) => photo.addEventListener('click', event => {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !viewer.showModal) return;
  event.preventDefault();
  showPhoto(index);
  viewer.showModal();
  document.body.classList.add('modal-open');
}));

viewer.querySelector('[data-dismiss]').addEventListener('click', () => viewer.close());
viewer.addEventListener('close', () => document.body.classList.remove('modal-open'));
previous.addEventListener('click', () => showPhoto(current - 1));
next.addEventListener('click', () => showPhoto(current + 1));
viewer.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  showPhoto(current + (event.key === 'ArrowLeft' ? -1 : 1));
});
