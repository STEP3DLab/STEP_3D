// Independent of the portfolio and form modules: links remain available until
// this small disclosure controller has finished wiring its interactions.
const controllers = new WeakMap();

export function initializeHeaderNavigation({document, window}) {
  const header = document.querySelector('.header');
  const menu = header?.querySelector('.menu-button');
  const nav = header?.querySelector('#navigation');
  if (!header || !menu || !nav || typeof window.matchMedia !== 'function') return null;
  if (controllers.has(header)) return controllers.get(header);

  const desktopNavigation = window.matchMedia('(min-width: 801px)');
  function setMenuOpen(open) {
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('open', open);
  }
  menu.addEventListener('click', () => setMenuOpen(menu.getAttribute('aria-expanded') !== 'true'));
  header.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenuOpen(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      menu.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest?.('.header')) setMenuOpen(false);
  });
  // Native Tab follows the DOM; leaving the header never traps or steals focus.
  header.addEventListener('focusout', event => {
    if (event.relatedTarget && !header.contains(event.relatedTarget)) setMenuOpen(false);
  });
  desktopNavigation.addEventListener('change', () => {
    const active = document.activeElement;
    setMenuOpen(false);
    if (!desktopNavigation.matches && nav.contains(active)) menu.focus({preventScroll: true});
    else if (desktopNavigation.matches && active === menu) nav.querySelector('a[href]')?.focus({preventScroll: true});
  });

  // A visitor may already have focused a fallback link while this module loaded.
  // Keep that link visible instead of collapsing it beneath their keyboard focus.
  setMenuOpen(!desktopNavigation.matches && nav.contains(document.activeElement));
  menu.hidden = false;
  header.classList.add('nav-ready');
  const controller = {setMenuOpen};
  controllers.set(header, controller);
  return controller;
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  initializeHeaderNavigation({document, window});
}
