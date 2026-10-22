// Uses only the existing local draft key and fields. Nothing is transmitted.
export const BRIEF_KEY = 'trifoti-brief-v1';
const fields = ['reference', 'name', 'direction', 'idea', 'budget', 'deadline'];
const onlyFields = values => Object.fromEntries(fields.filter(key => typeof values[key] === 'string').map(key => [key, values[key]]));
const previousDirections = new Map([
  ['Скульптуры и арт-объекты', 'Скульптура'],
  ['Предметы и интерьер', 'Бытовой дизайн'],
  ['Бренды в объёме', 'Сувениры, призы, награды']
]);

export function readBriefDraft(getStorage = () => localStorage) {
  let raw;
  try { raw = getStorage().getItem(BRIEF_KEY); } catch { return {draft: {}, state: 'unavailable'}; }
  if (raw === null) return {draft: {}, state: 'empty'};
  let value;
  try { value = JSON.parse(raw); } catch { return {draft: {}, state: 'invalid'}; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {draft: {}, state: 'invalid'};
  const partial = fields.some(key => Object.hasOwn(value, key) && typeof value[key] !== 'string');
  const draft = onlyFields(value);
  if (previousDirections.has(draft.direction)) draft.direction = previousDirections.get(draft.direction);
  return {draft, state: partial ? 'partial' : 'restored'};
}

export function saveBriefDraft(values, getStorage = () => localStorage) {
  try { getStorage().setItem(BRIEF_KEY, JSON.stringify(onlyFields(values))); return true; } catch { return false; }
}

export function briefErrors(values) {
  return {
    name: values.name?.trim() ? '' : 'Укажите, как к вам обращаться.',
    idea: values.idea?.trim() ? '' : 'Добавьте несколько слов об идее.'
  };
}

export function formatBrief(d) {
  return `ТРИФОТИ — бриф проекта\n\nИмя: ${d.name || ''}\nНаправление: ${d.direction || ''}${d.reference ? '\nОтправная точка: ' + d.reference : ''}\n\nИдея:\n${d.idea || ''}\n\nБюджет: ${d.budget || 'Обсудим'}\nСроки: ${d.deadline || 'Обсудим'}\n\nЭтот бриф подготовлен на сайте ТРИФОТИ. Передайте его объединению удобным способом.`;
}

export function requestBriefDownload(text, env = globalThis) {
  let anchor, url;
  try {
    anchor = env.document.createElement('a');
    if (!('download' in anchor) || typeof env.URL?.createObjectURL !== 'function') return 'unsupported';
    url = env.URL.createObjectURL(new env.Blob(['\ufeff' + text], {type: 'text/plain;charset=utf-8'}));
    anchor.href = url; anchor.download = 'TRIFOTI-brief.txt';
    env.document.body.append(anchor); anchor.click();
    // A click starts a browser request; it cannot confirm a file was saved.
    return 'started';
  } catch { return 'failed'; }
  finally {
    anchor?.remove();
    if (url) env.setTimeout(() => env.URL.revokeObjectURL(url), 1000);
  }
}
