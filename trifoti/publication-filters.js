// Progressive enhancement only: every source link remains available without JS.
export function publicationMatches(category, filter) {
  return filter === 'all' || category === filter;
}

export function initializePublicationFilters({document}) {
  const root = document.querySelector('#publication-catalog');
  const controls = document.querySelector('#publication-filters');
  const status = document.querySelector('#publication-count');
  if (!root || !controls || !status) return false;
  if (root.dataset.enhanced === 'true') return true;
  const buttons = [...controls.querySelectorAll('[data-publication-filter]')];
  const entries = [...root.querySelectorAll('[data-publication-category]')];
  const allowed = new Set(buttons.map(button => button.dataset.publicationFilter));
  if (!allowed.has('all') || !entries.length) return false;
  function apply(requested) {
    const selected = allowed.has(requested) ? requested : 'all';
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.publicationFilter === selected)));
    let visible = 0;
    entries.forEach(entry => {
      entry.hidden = !publicationMatches(entry.dataset.publicationCategory, selected);
      if (!entry.hidden) visible++;
    });
    const message = `Показано: ${visible} из ${entries.length}.`;
    if (status.textContent !== message) status.textContent = message;
  }
  buttons.forEach(button => button.addEventListener('click', () => apply(button.dataset.publicationFilter)));
  apply('all');
  root.dataset.enhanced = 'true';
  controls.hidden = false;
  return true;
}
