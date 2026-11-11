import {projects} from './project-data.js?v=20261104-red7';
import {caseKeys, exactLink, PUBLIC_SITE} from './exploration-data.js?v=20261104-red7';

export const referenceBlock = key => [projects[key].title, projects[key].attribution || projects[key].type, exactLink(key)].join('\n');
const portfolioPrefix = PUBLIC_SITE + 'portfolio.html#';

function readPart(text) {
  const caseKey = caseKeys.find(key => text === referenceBlock(key));
  if (caseKey) return {text, key:caseKey};

  // A generated portfolio block contains exactly a title, a caption and a canonical frame URL.
  const lines = text.split('\n');
  if (lines.length === 3) {
    const [title, caption, href] = lines;
    if (title.trim() && caption.trim() && href.startsWith(portfolioPrefix) &&
        /^work-\d{2}(?:\/[1-9]\d?)?$/.test(href.slice(portfolioPrefix.length))) {
      return {text, key:href, title, caption};
    }
  }
  return {text, key:null};
}

export function referenceParts(value = '') {
  const parts = value.split('\n\n').map(readPart);
  // Early drafts stored the first case by title alone.
  if (!parts[0].key && parts.slice(1).every(part => part.key)) {
    parts[0].key = caseKeys.find(key => parts[0].text === projects[key].title) || null;
  }
  return parts;
}

export function appendSelectionReference(current, ids) {
  const valid = [...new Set(Array.isArray(ids) ? ids : [])].filter(key => caseKeys.includes(key)).slice(0, 3);
  const recognized = new Set(referenceParts(current).map(part => part.key));
  const blocks = valid.filter(key => !recognized.has(key) && !current.includes(exactLink(key))).map(referenceBlock);
  if (!blocks.length) return {value:current, added:0};
  const value = [current, ...blocks].filter(Boolean).join('\n\n');
  return value.length > 6000 ? {value:current, added:0, tooLong:true} : {value, added:blocks.length};
}

export function removeCaseReference(current, key) {
  if (!key) return current;
  return referenceParts(current).filter(part => part.key !== key).map(part => part.text).join('\n\n');
}

export function mountReferenceManager({host, field, document, onChange, focusFallback}) {
  function element(tag, text) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    return node;
  }
  function saveAndRefresh(value) {
    field.value = value;
    refresh();
    onChange();
    const next = host.hidden ? focusFallback : host.querySelector('button') || host.querySelector('h4');
    next?.focus({preventScroll:true});
  }
  function appendReference(part) {
    const row = element('div');
    row.className = 'reference-item';
    const label = part.title ? part.title + ' — ' + part.caption : projects[part.key].title;
    const content = element('span', label);
    const link = element('a', 'Посмотреть ↗');
    link.href = part.title ? part.key : exactLink(part.key);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', 'Посмотреть в новой вкладке: ' + label);
    content.append(element('br'), link);
    const remove = element('button', 'Убрать');
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Убрать из брифа: ' + label);
    remove.addEventListener('click', () => saveAndRefresh(removeCaseReference(field.value, part.key)));
    row.append(content, remove);
    host.append(row);
  }
  function appendLegacy(value) {
    const details = element('details');
    const text = element('p', value);
    text.className = 'reference-legacy';
    const remove = element('button', 'Убрать сохранённый текст');
    const cancel = element('button', 'Отмена');
    remove.type = cancel.type = 'button';
    cancel.hidden = true;
    remove.addEventListener('click', () => {
      if (cancel.hidden) {
        remove.textContent = 'Подтвердить удаление текста';
        cancel.hidden = false;
        return;
      }
      saveAndRefresh(referenceParts(field.value).filter(part => part.key).map(part => part.text).join('\n\n'));
    });
    cancel.addEventListener('click', () => {
      cancel.hidden = true;
      remove.textContent = 'Убрать сохранённый текст';
      remove.focus({preventScroll:true});
    });
    details.append(element('summary', 'Сохранённый текст референса'), text, remove, cancel);
    host.append(details);
  }
  function refresh() {
    host.hidden = !field.value;
    host.replaceChildren();
    if (host.hidden) return;
    const title = element('h4', 'Примеры в брифе');
    title.tabIndex = -1;
    host.append(title);
    const parts = referenceParts(field.value);
    const recognized = new Map(parts.filter(part => part.key).map(part => [part.key, part]));
    for (const part of recognized.values()) appendReference(part);
    const legacy = parts.filter(part => !part.key).map(part => part.text).join('\n\n');
    if (legacy) appendLegacy(legacy);
  }
  refresh();
  return {refresh};
}
