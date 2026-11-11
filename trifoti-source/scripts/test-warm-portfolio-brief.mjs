import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import {referenceBlock, referenceParts, removeCaseReference, mountReferenceManager} from '../../trifoti/warm/reference-manager.js';

const root = new URL('../../trifoti/warm/', import.meta.url);
const html = readFileSync(new URL('portfolio.html', root), 'utf8');
const script = readFileSync(new URL('portfolio-brief.js', root), 'utf8').replace('export async', 'async');

const choices = ['Пока не знаю — давайте обсудим', 'Арт-объекты', 'Дизайн интерьеров', 'Макетирование', 'Награды', 'Парковая и монументальная скульптура', 'Промышленный дизайн'];

function browser(route, initialReference = '', initialDirection = choices[0]) {
  const location = new URL('https://example.org/STEP_3D/trifoti/warm/?portfolio=' + encodeURIComponent(route) + '#brief-form');
  const field = {value:initialReference};
  const status = {textContent:''};
  const direction = {
    options:choices.map(value => ({value})), value:initialDirection,
    get selectedIndex() { return choices.indexOf(this.value); }
  };
  const form = {elements:{namedItem(name) {return {reference:field, direction}[name];}}};
  const context = vm.createContext({
    URL, location, history:{state:null, replaceState(_, __, url) {location.href = url;}},
    fetch:async () => ({ok:true, text:async () => html}),
    options:{form, status, selectReference(value) {field.value = value;}}
  });
  return {field, direction, status, location, add:() => vm.runInContext(script + '\naddPortfolioReference(options)', context)};
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
    assert.equal(draft.direction.value, choices[0]);
  }
  const full = browser('work-09', 'А'.repeat(5999));
  await full.add();
  assert.equal(full.field.value.length, 5999);
  assert.equal(full.direction.value, choices[0]);
  assert.match(full.status.textContent, /лимит/);
});


test('each album suggests its form direction, including architectural models', async () => {
  const examples = [
    ['work-02', 'Арт-объекты'], ['work-09/2', 'Дизайн интерьеров'], ['work-24', 'Макетирование'],
    ['work-35', 'Награды'], ['work-46', 'Парковая и монументальная скульптура'], ['work-59', 'Промышленный дизайн']
  ];
  for (const [route, title] of examples) {
    const draft = browser(route);
    await draft.add();
    assert.equal(draft.direction.value, title);
  }
});

test('an existing choice or a choice made during loading wins over the album suggestion', async () => {
  const stored = browser('work-24', '', 'Награды');
  await stored.add();
  assert.equal(stored.direction.value, 'Награды');
  const live = browser('work-24');
  const pending = live.add();
  live.direction.value = 'Арт-объекты';
  await pending;
  assert.equal(live.direction.value, 'Арт-объекты');
});

test('each gallery angle remains individually linkable and removable alongside old references and free prose', async () => {
  const legacy = 'Свой текст <b>без разметки</b>\n\n  с отступом';
  const initial = legacy + '\n\n' + referenceBlock('mascot');
  const first = browser('work-09', initial);
  await first.add();
  const second = browser('work-09/2', first.field.value);
  await second.add();

  const parts = referenceParts(second.field.value);
  const frames = parts.filter(part => part.caption);
  assert.equal(frames.length, 2);
  assert.equal(frames[0].title, frames[1].title);
  assert.notEqual(frames[0].caption, frames[1].caption);
  assert.ok(frames[0].key.endsWith('#work-09'));
  assert.ok(frames[1].key.endsWith('#work-09/2'));
  assert.equal(removeCaseReference(second.field.value, frames[1].key), first.field.value);
  assert.equal(removeCaseReference(first.field.value, frames[0].key), initial);
  const lookalike = frames[0].text.replace('step3dlab.github.io', 'example.org');
  assert.equal(referenceParts(lookalike)[0].key, null);
  assert.equal(referenceParts(frames[0].text + '\nЗаметки')[0].key, null);
  assert.equal(referenceParts(legacy + '\n\n' + lookalike).filter(part => part.key).length, 0);
});

test('portfolio reference UI opens the precise frame and removes only that frame', async () => {
  const draft = browser('work-09/2', 'Заметки заказчика');
  await draft.add();
  const withModel = browser('work-24', draft.field.value);
  await withModel.add();
  function makeNode(tag) {
    return {
      tag, children:[], handlers:{},
      setAttribute(name, value) {this[name] = value;},
      addEventListener(name, callback) {this.handlers[name] = callback;},
      replaceChildren() {this.children = [];},
      append(...nodes) {this.children.push(...nodes);},
      querySelector() {return null;}
    };
  }
  const host = makeNode('div');
  let saves = 0;
  mountReferenceManager({host, field:withModel.field, document:{createElement:makeNode}, onChange() {saves++;}});
  const rows = host.children.filter(node => node.className === 'reference-item');
  assert.equal(rows.length, 2);
  const link = rows[0].children[0].children.find(node => node.tag === 'a');
  assert.equal(link.href, 'https://step3dlab.github.io/STEP_3D/trifoti/warm/portfolio.html#work-09/2');
  rows[1].children.find(node => node.tag === 'button').handlers.click();
  assert.equal(withModel.field.value, draft.field.value);
  assert.equal(saves, 1);
});
