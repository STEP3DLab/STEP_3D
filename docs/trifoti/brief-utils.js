// Uses only the existing local draft key and fields. Nothing is transmitted.
export const BRIEF_KEY = 'trifoti-brief-v1';
const fields = ['reference', 'name', 'direction', 'idea', 'budget', 'deadline'];
const onlyFields = values => Object.fromEntries(fields.filter(key => typeof values[key] === 'string').map(key => [key, values[key]]));
const previousDirections = new Map([
  ['Скульптуры и арт-объекты', 'Скульптура'],
  ['Предметы и интерьер', 'Бытовой дизайн'],
  ['Бренды в объёме', 'Сувениры, призы, награды']
]);

function decodeBriefDraft(raw) {
  if (raw === null) return {draft: {}, state: 'empty'};
  let value;
  try { value = JSON.parse(raw); } catch { return {draft: {}, state: 'invalid'}; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {draft: {}, state: 'invalid'};
  const partial = fields.some(key => Object.hasOwn(value, key) && typeof value[key] !== 'string');
  const draft = onlyFields(value);
  if (previousDirections.has(draft.direction)) draft.direction = previousDirections.get(draft.direction);
  return {draft, state: partial ? 'partial' : 'restored'};
}

export function readBriefDraft(getStorage = () => localStorage) {
  try { return decodeBriefDraft(getStorage().getItem(BRIEF_KEY)); }
  catch { return {draft: {}, state: 'unavailable'}; }
}

export function saveBriefDraft(values, getStorage = () => localStorage) {
  try { getStorage().setItem(BRIEF_KEY, JSON.stringify(onlyFields(values))); return true; } catch { return false; }
}

// Keep the exact recovered snapshot in memory, never in another storage key.
// A conflict is latched until reload: neither version is silently replaced.
export function createBriefDraftSession(getStorage = () => localStorage) {
  let expected, conflicted = false;
  const recovered = readBriefDraft(() => ({getItem(key) {
    expected = getStorage().getItem(key); return expected;
  }}));
  function check() {
    if (conflicted) return 'conflict';
    if (expected === undefined) return 'unavailable';
    let current;
    try { current = getStorage().getItem(BRIEF_KEY); } catch { return 'unavailable'; }
    if (current !== expected) { conflicted = true; return 'conflict'; }
    return null;
  }
  return {
    recovered,
    check,
    save(values) {
      const state = check(); if (state) return state;
      if (!saveBriefDraft(values, getStorage)) return 'failed';
      expected = JSON.stringify(onlyFields(values));
      return 'saved';
    }
  };
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
