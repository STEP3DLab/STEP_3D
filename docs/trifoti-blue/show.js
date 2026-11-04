const collection = document.querySelector('.collection');
const works = [...collection.querySelectorAll('.work')];
const projectLinks = [...collection.querySelectorAll('[data-project-link]')];
const navigation = collection.querySelector('.work-nav');
const statusLine = document.querySelector('#show-status');
let activeWork = works[0];

function workForHash() {
  return works.find(work => '#' + work.id === location.hash) || works[0];
}

function selectWork(work, moveFocus = false) {
  activeWork = work;
  works.forEach(item => { item.hidden = item !== work; });
  navigation.querySelectorAll('a').forEach(link => {
    if (link.dataset.projectLink === work.id) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const heading = work.querySelector('h2');
  document.title = heading.textContent + ' · Короткий показ ТРИФОТИ';
  if (moveFocus) {
    heading.focus({preventScroll: true});
    window.scrollTo(0, 0);
  }
}

function navigate(work) {
  if (!work || work === activeWork) return;
  history.pushState(null, '', '#' + work.id);
  selectWork(work, true);
}

projectLinks.forEach(link => {
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(works.find(work => work.id === link.dataset.projectLink));
  });
});

works.forEach(work => {
  const controls = work.querySelector('.shot-controls');
  const buttons = [...controls.querySelectorAll('button')];
  const shots = [...work.querySelectorAll('.exhibit')];
  controls.hidden = false;
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      shots.forEach((shot, i) => { shot.hidden = i !== index; });
      buttons.forEach((item, i) => item.setAttribute('aria-pressed', String(i === index)));
      statusLine.textContent = shots[index].querySelector('img').alt;
    });
  });
});

function step(direction) {
  navigate(works[works.indexOf(activeWork) + direction]);
}

document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    step(event.key === 'ArrowRight' ? 1 : -1);
  }
});

let touchStart = null;
collection.addEventListener('touchstart', event => {
  touchStart = null;
  if (event.touches.length !== 1 || !event.target.closest('.photo-mat')) return;
  const point = event.touches[0];
  touchStart = {x: point.clientX, y: point.clientY};
}, {passive: true});

collection.addEventListener('touchcancel', () => { touchStart = null; }, {passive: true});
collection.addEventListener('touchend', event => {
  if (!touchStart) return;
  const point = event.changedTouches[0];
  const dx = point.clientX - touchStart.x;
  const dy = point.clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.6) step(dx < 0 ? 1 : -1);
}, {passive: true});

window.addEventListener('hashchange', () => selectWork(workForHash()));
selectWork(workForHash());
