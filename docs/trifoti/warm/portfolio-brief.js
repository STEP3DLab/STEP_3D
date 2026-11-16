// Resolve gallery references from the same published catalogue that visitors browse.
const albumDirections = Object.freeze({
  art: 'Арт-объекты',
  interiors: 'Дизайн интерьеров',
  models: 'Макетирование',
  awards: 'Награды',
  sculpture: 'Парковая и монументальная скульптура',
  industrial: 'Промышленный дизайн'
});

export async function addPortfolioReference({form, selectReference, status}) {
  const url = new URL(location.href);
  const route = url.searchParams.get('portfolio') || '';
  const match = /^(work-\d{2})(?:\/([1-9]\d?))?$/.exec(route);
  if (!match || url.hash !== '#brief-form') return;
  const frame = Number(match[2] || 1) - 1;
  const fragment = match[1] + (frame > 0 ? '/' + (frame + 1) : '');
  const canonical = 'https://step3dlab.github.io/STEP_3D/trifoti/warm/portfolio.html#' + fragment;
  const isCurrentRoute = () => {
    const current = new URL(location.href);
    return current.hash === '#brief-form' && current.searchParams.get('portfolio') === route;
  };
  const cleanUrl = () => {
    const current = new URL(location.href);
    if (current.searchParams.get('portfolio') !== route) return;
    current.searchParams.delete('portfolio');
    history.replaceState(history.state, '', current.href);
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  status.textContent = 'Загружаем выбранный пример… Текст брифа не меняется.';
  try {
    const response = await fetch(new URL('portfolio.html', url), {credentials:'same-origin', signal:controller.signal});
    if (!response.ok) throw new Error('catalogue unavailable');
    // Parse the inert JSON block without instantiating the gallery or loading photos.
    const html = await response.text();
    if (!isCurrentRoute()) return;
    const block = /<script id="images" type="application\/json">([\s\S]*?)<\/script>/.exec(html);
    if (!block) throw new Error('missing catalogue');
    const entry = JSON.parse(block[1])[match[1]];
    const image = entry?.images[frame];
    if (!image) { status.textContent = 'Такого кадра в галерее нет.'; return; }
    const field = form.elements.namedItem('reference');
    let updated = field.value;
    if (!field.value.split('\n').includes(canonical)) {
      const reference = [entry.title, image.caption, canonical].join('\n');
      updated = [field.value, reference].filter(Boolean).join('\n\n');
      if (updated.length > 6000) { status.textContent = 'В поле примеров достигнут лимит. Уберите один пример и откройте ссылку снова.'; return; }
    }
    // Resolve the selection after the fetch: the visitor may have edited the draft meanwhile.
    const direction = form.elements.namedItem('direction');
    const suggested = albumDirections[entry.album];
    const useSuggestion = direction?.selectedIndex === 0 && [...direction.options].some(option => option.value === suggested);
    if (useSuggestion) direction.value = suggested;
    if (updated !== field.value || useSuggestion) selectReference(updated);
    status.textContent = 'В брифе выбран пример «' + entry.title + '».';
    cleanUrl();
  } catch {
    if (!isCurrentRoute()) return;
    status.textContent = controller.signal.aborted
      ? 'Загрузка примера заняла слишком много времени. Ваш текст не изменён. Обновите страницу, чтобы повторить.'
      : 'Пример не удалось загрузить. Обновите страницу, чтобы повторить.';
  } finally {
    clearTimeout(timeout);
  }
}
