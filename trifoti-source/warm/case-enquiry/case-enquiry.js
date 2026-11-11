import {projects} from './project-data.js?v=20261104-red7';
import {appendSelectionReference} from './reference-manager.js?v=20261111-sales';

// These three cases show standalone sculptural objects rather than park installations.
const objectCases = new Set(['mascot', 'pink', 'gesture']);
const briefDirections = new Map([
  ['Скульптура', 'Парковая и монументальная скульптура'],
  ['Сувениры и призы', 'Награды'],
  ['Арт-объекты', 'Арт-объекты']
]);

// Both the full gallery and standalone case pages suggest the same service.
// An explicitly chosen service always takes precedence.
export function fillCaseDirection(key, direction) {
  if (!Object.hasOwn(projects, key) || direction.selectedIndex !== 0) return false;
  const proposed = objectCases.has(key) ? 'Арт-объекты' : briefDirections.get(projects[key].direction);
  if (![...direction.options].some(option => option.value === proposed)) return false;
  direction.value = proposed;
  return true;
}

export function addCaseReference({form, selectReference, status, location = window.location, history = window.history}) {
  const url = new URL(location.href);
  const key = url.searchParams.get('case');
  if (!key || url.hash !== '#brief-form') return;
  if (!Object.hasOwn(projects, key)) {
    status.textContent = 'Не удалось найти этот проект в каталоге.';
    return;
  }

  const project = projects[key];
  const reference = form.elements.namedItem('reference');
  const selection = appendSelectionReference(reference.value, [key]);
  if (selection.tooLong) {
    status.textContent = 'В поле примеров достигнут лимит. Уберите один пример и откройте ссылку снова.';
    return;
  }

  const direction = form.elements.namedItem('direction');
  const fillDirection = fillCaseDirection(key, direction);
  if (selection.added || fillDirection) selectReference(selection.value);
  status.textContent = 'В брифе выбран проект «' + project.title + '».';

  url.searchParams.delete('case');
  history.replaceState(history.state, '', url.href);
}
