import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const root = new URL('../../trifoti/warm/', import.meta.url);
const html = readFileSync(new URL('portfolio.html', root), 'utf8');
const script = readFileSync(new URL('portfolio-brief.js', root), 'utf8').replace('export async', 'async');

function browser(route, initialReference = '') {
  const location = new URL('https://example.org/STEP_3D/trifoti/warm/?portfolio=' + encodeURIComponent(route) + '#brief-form');
  const field = {value:initialReference};
  const status = {textContent:''};
  const form = {elements:{namedItem(name) {assert.equal(name, 'reference'); return field;}}};
  const context = vm.createContext({
    URL, location, history:{state:null, replaceState(_, __, url) {location.href = url;}},
    fetch:async () => ({ok:true, text:async () => html}),
    options:{form, status, selectReference(value) {field.value = value;}}
  });
  return {field, status, location, add:() => vm.runInContext(script + '\naddPortfolioReference(options)', context)};
}

test('exact angle is appended to pre-existing prose and repeated addition is idempotent', async () => {
  const draft = browser('work-09/2', 'Мой собственный пример');
  await draft.add();
  assert.match(draft.field.value, /^Мой собственный пример\n\nГостиная и столовая/);
  assert.match(draft.field.value, /Столовая и кухня за ажурной перегородкой/);
  assert.ok(draft.field.value.endsWith('portfolio.html#work-09/2'));
  assert.equal(draft.location.search, '');
  const repeated = browser('work-09/2', draft.field.value);
  await repeated.add();
  assert.equal(repeated.field.value, draft.field.value);
});

test('invalid and overlong references leave draft text intact', async () => {
  for (const route of ['work-09/45','work-99','work-09/0','invalid']) {
    const draft = browser(route, 'Мой пример');
    await draft.add();
    assert.equal(draft.field.value, 'Мой пример');
  }
  const full = browser('work-09', 'А'.repeat(5999));
  await full.add();
  assert.equal(full.field.value.length, 5999);
  assert.match(full.status.textContent, /лимит/);
});
