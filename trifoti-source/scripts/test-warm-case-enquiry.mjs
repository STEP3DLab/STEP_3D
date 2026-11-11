import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projects} from '../../trifoti/warm/project-data.js';
import {addCaseReference} from '../../trifoti/warm/case-enquiry.js';
import {referenceBlock} from '../../trifoti/warm/reference-manager.js';
import {BRIEF_KEY, createBriefDraftSession} from '../../trifoti/warm/brief-utils.js';

const root = new URL('../../trifoti/warm/', import.meta.url);
const choices = ['Пока не знаю — давайте обсудим', 'Награды', 'Арт-объекты', 'Парковая и монументальная скульптура'];
function visit(key, initial = {}) {
  const draft = {name: 'Мария', idea: 'Нужен объект для холла', budget: '200 000', deadline: 'Июнь', reference:'Ранее выбранный пример', direction:choices[0], ...initial};
  let stored = JSON.stringify(draft);
  const session = createBriefDraftSession(() => ({
    getItem(id) { assert.equal(id, BRIEF_KEY); return stored; },
    setItem(id, value) { assert.equal(id, BRIEF_KEY); stored = value; }
  }));
  const reference = {value:session.recovered.draft.reference};
  const direction = {value:session.recovered.draft.direction, options:choices.map(value => ({value})), get selectedIndex() { return choices.indexOf(this.value); }};
  const form = {elements:{namedItem(id) { return {reference, direction}[id]; }}};
  const url = new URL('https://example.org/site/index.html?view=compact#brief-form');
  url.searchParams.set('case', key);
  const status = {};
  addCaseReference({form, status, location:url, history:{state:{}, replaceState(state, title, href) {url.href=href;}},
    selectReference(value) {
      reference.value = value;
      assert.equal(session.save({...draft, reference:value, direction:direction.value}), 'saved');
    }
  });
  return {draft:JSON.parse(stored), url, status};
}

test('both CTAs in every published case preserve its ID and work as native links', () => {
  for (const key of Object.keys(projects)) {
    const page = readFileSync(new URL('cases/' + key + '.html', root), 'utf8');
    const link = 'href="../index.html?case=' + key + '#brief-form"';
    assert.equal(page.split(link).length - 1, 2, key);
  }
});
test('the transferred case uses recognized draft blocks and keeps filled fields and URL state', () => {
  const first = visit('stdAwards');
  assert.equal(first.draft.direction, 'Награды');
  assert.equal(first.draft.reference, 'Ранее выбранный пример\n\n' + referenceBlock('stdAwards'));
  assert.equal(first.draft.name,'Мария');
  assert.equal(first.draft.idea,'Нужен объект для холла');
  assert.equal(first.draft.budget,'200 000');
  assert.equal(first.draft.deadline,'Июнь');
  assert.equal(first.url.search, '?view=compact');
  assert.equal(first.url.hash, '#brief-form');
  assert.deepEqual(visit('stdAwards',first.draft).draft,first.draft);
  const second = visit('red7-panels', first.draft);
  assert.equal(second.draft.direction, 'Награды');
  assert.equal(second.draft.reference, first.draft.reference + '\n\n' + referenceBlock('red7-panels'));
  assert.equal(visit('mascot').draft.direction, 'Арт-объекты');
  assert.equal(visit('two-figure-composition').draft.direction, 'Парковая и монументальная скульптура');
});
test('unknown keys and full references do not overwrite drafts', () => {
  for (const key of ['missing', '__proto__']) {
    const result = visit(key);
    assert.equal(result.draft.reference,'Ранее выбранный пример');
    assert.equal(result.draft.direction,choices[0]);
    assert.match(result.status.textContent,/найти/);
  }
  const full = visit('mascot', {reference:'а'.repeat(5999)});
  assert.equal(full.draft.reference.length,5999);
  assert.equal(full.draft.direction,choices[0]);
  assert.match(full.status.textContent,/лимит/);
});
