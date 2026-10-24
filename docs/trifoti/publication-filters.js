import {publications, publicationCategories} from './publications-data.js';

export function publicationMatches(category, filter) {
  return filter === 'all' || category === filter;
}
export const normalizePublicationQuery = value => String(value || '').toLocaleLowerCase('ru').replace(/ё/g, 'е').trim().replace(/\s+/g, ' ');
export function publicationSearchMatches(entry, query) {
  const haystack = normalizePublicationQuery(`${entry.title} ${entry.publisher}`);
  return normalizePublicationQuery(query).split(' ').every(word => haystack.includes(word));
}
// Compare only known components. A partial date follows more precise dates in its
// year/month; this is a display convention, not an invented day of publication.
export function sortPublications(entries, order) {
  if (order !== 'newest') return [...entries];
  return entries.map((entry, index) => ({entry, index})).sort((a, b) => {
    const left = a.entry.date || '', right = b.entry.date || '';
    return (left < right ? 1 : left > right ? -1 : 0) || a.index - b.index;
  }).map(item => item.entry);
}
export function publicationCitation(entry) {
  return `${entry.title}\n${entry.publisher}\n${entry.date ? `Дата публикации: ${entry.date}` : 'Дата публикации не указана'}\n${entry.url}`;
}

// Progressive enhancement: every original source link remains available without JS.
export function initializePublicationFilters({document, clipboard = globalThis.navigator?.clipboard}) {
  const root = document.querySelector('#publication-catalog');
  const controls = document.querySelector('#publication-filters');
  const status = document.querySelector('#publication-count');
  if (!root || !controls || !status) return false;
  if (root.dataset.enhanced === 'true') return true;
  const buttons = [...controls.querySelectorAll('[data-publication-filter]')];
  const entries = [...root.querySelectorAll('[data-publication-category]')];
  const allowed = new Set(buttons.map(button => button.dataset.publicationFilter));
  if (!allowed.has('all') || !entries.length) return false;
  const get = id => document.querySelector(`#publication-${id}`);
  const search = get('search'), sort = get('sort'), reset = get('reset');
  const list = get('list'), active = get('active'), empty = get('empty');
  const panel = get('citation'), copyStatus = get('copy-status'), copyLabel = get('copy-label'), copyText = get('copy-text');
  const records = new Map(publications.map(entry => [entry.id, entry]));
  let selected = 'all', copyGeneration = 0, copyTrigger = null;
  function dismissCopy() {
    copyGeneration++;
    if (panel) panel.hidden = true;
    if (copyText) copyText.value = '';
  }
  function apply(requested = selected) {
    selected = allowed.has(requested) ? requested : 'all';
    dismissCopy();
    const query = search?.value || '';
    const order = sort?.value === 'newest' ? 'newest' : 'original';
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.publicationFilter === selected)));
    let visible = 0;
    entries.forEach(entry => {
      const record = records.get(entry.dataset.publicationId);
      entry.hidden = !publicationMatches(entry.dataset.publicationCategory, selected) || (!!query && (!record || !publicationSearchMatches(record, query)));
      if (!entry.hidden) visible++;
    });
    if (list) {
      const ordered = sortPublications(entries.map((element, index) => ({element, date: records.get(element.dataset.publicationId)?.date, index})), order);
      ordered.forEach(item => list.append(item.element));
    }
    const message = `Показано: ${visible} из ${entries.length}.`;
    if (status.textContent !== message) status.textContent = message;
    if (active) active.textContent = `${visible} из ${entries.length} · ${publicationCategories[selected]}${query.trim() ? ` · Поиск: «${query.trim()}»` : ''}${order === 'newest' ? ' · Сначала новые' : ''}`;
    if (empty) empty.hidden = visible !== 0;
    if (reset) reset.disabled = selected === 'all' && !query && order === 'original';
    if (get('sort-note')) get('sort-note').hidden = order !== 'newest';
  }
  buttons.forEach(button => button.addEventListener('click', () => apply(button.dataset.publicationFilter)));
  search?.addEventListener('input', () => apply());
  sort?.addEventListener('change', () => apply());
  reset?.addEventListener('click', () => {
    if (search) search.value = '';
    if (sort) sort.value = 'original';
    apply('all');
    search?.focus();
  });
  get('collapse')?.addEventListener('click', () => {
    root.open = false;
    const summary = root.querySelector('summary');
    summary?.focus({preventScroll: true});
    summary?.scrollIntoView({block: 'center', behavior: 'instant'});
  });
  root.addEventListener?.('toggle', () => { if (!root.open) dismissCopy(); });
  get('copy-close')?.addEventListener('click', () => {
    dismissCopy();
    copyTrigger?.focus();
  });
  root.addEventListener?.('click', async event => {
    const trigger = event.target.closest?.('[data-publication-copy]');
    if (!trigger || !root.contains(trigger) || !panel) return;
    const record = records.get(trigger.dataset.publicationCopy);
    if (!record) return;
    const generation = ++copyGeneration;
    copyTrigger = trigger;
    trigger.parentElement.append(panel);
    panel.hidden = false;
    copyLabel.hidden = true;
    copyText.value = publicationCitation(record);
    copyStatus.textContent = 'Копируем описание источника…';
    try {
      if (!clipboard?.writeText) throw new Error('Clipboard unavailable');
      await clipboard.writeText(copyText.value);
      if (generation !== copyGeneration) return;
      copyStatus.textContent = 'Описание и ссылка скопированы.';
    } catch {
      if (generation !== copyGeneration) return;
      copyStatus.textContent = 'Автоматическое копирование недоступно. Выделите и скопируйте текст ниже вручную.';
      copyLabel.hidden = false;
      copyText.focus();
      copyText.select();
    }
  });
  apply('all');
  root.dataset.enhanced = 'true';
  controls.hidden = false;
  if (get('tools')) get('tools').hidden = false;
  if (get('collapse')) get('collapse').hidden = false;
  root.querySelectorAll('[data-publication-copy]').forEach(button => {button.hidden = false;});
  return true;
}
