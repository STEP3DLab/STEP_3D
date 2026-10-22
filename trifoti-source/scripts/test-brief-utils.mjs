import test from 'node:test';
import assert from 'node:assert/strict';
import {BRIEF_KEY, readBriefDraft, saveBriefDraft, briefErrors, formatBrief, requestBriefDownload} from '../dist/brief-utils.js';
const values = {name: 'Проверка', idea: 'Пробный бриф', direction: 'Бренды в объёме', reference: 'Награды', budget: '', deadline: ''};
const storage = raw => ({getItem(key) { assert.equal(key, BRIEF_KEY); return raw; }});

test('An absent draft stays empty and does not create storage', () => {
  assert.deepEqual(readBriefDraft(() => storage(null)), {draft: {}, state: 'empty'});
});
test('The six existing draft fields restore without changing their text', () => {
  assert.deepEqual(readBriefDraft(() => storage(JSON.stringify(values))), {draft: values, state: 'restored'});
});
test('Blocked storage access is reported instead of claiming a saved draft', () => {
  for (const getStorage of [() => { throw new Error('SecurityError'); }, () => ({getItem() { throw new Error('Blocked'); }})]) {
    assert.deepEqual(readBriefDraft(getStorage), {draft: {}, state: 'unavailable'});
  }
});
test('Malformed JSON and invalid draft shapes are explicitly reported', () => {
  for (const raw of ['{broken', 'null', '[]', '42', '"text"']) assert.equal(readBriefDraft(() => storage(raw)).state, 'invalid');
});
test('Recoverable strings survive a partially malformed draft; unrelated data is ignored', () => {
  const result = readBriefDraft(() => storage(JSON.stringify({name: 'Проверка', idea: ['bad'], unknown: 'not retained'})));
  assert.deepEqual(result, {draft: {name: 'Проверка'}, state: 'partial'});
});
test('Saving retains only the existing key and six string fields', () => {
  let saved;
  assert.equal(saveBriefDraft({...values, newPersonalData: 'never saved'}, () => ({setItem(key, raw) { saved = {key, value: JSON.parse(raw)}; }})), true);
  assert.deepEqual(saved, {key: 'trifoti-brief-v1', value: values});
});
test('Quota and access failures are reported, and a later save can recover', () => {
  assert.equal(saveBriefDraft(values, () => { throw new Error('SecurityError'); }), false);
  assert.equal(saveBriefDraft(values, () => ({setItem() { throw new Error('QuotaExceededError'); }})), false);
  assert.equal(saveBriefDraft(values, () => ({setItem() {}})), true);
});
test('Required fields reject whitespace while valid names and ideas pass', () => {
  assert(briefErrors({name: '  ', idea: '\n\t'}).name);
  assert(briefErrors({name: '  ', idea: '\n\t'}).idea);
  assert.deepEqual(briefErrors(values), {name: '', idea: ''});
});
test('Plain-text export preserves Unicode, reference and optional-field defaults', () => {
  const text = formatBrief(values);
  assert(text.includes('Имя: Проверка')); assert(text.includes('Отправная точка: Награды'));
  assert(text.includes('Бюджет: Обсудим')); assert(text.includes('Сроки: Обсудим'));
  assert(!formatBrief({...values, reference: ''}).includes('Отправная точка:'));
});

function downloadEnv(failure) {
  const record = {clicks: 0, removed: 0, revoked: [], appended: 0};
  const anchor = {download: '', remove() { record.removed++; }, click() { if (failure === 'click') throw new Error('Blocked'); record.clicks++; }};
  const env = {
    Blob: class { constructor(parts, options) { if (failure === 'blob') throw new Error('No Blob'); record.parts = parts; record.mime = options.type; } },
    URL: {createObjectURL() { if (failure === 'url') throw new Error('No URL'); return 'blob:local-test'; }, revokeObjectURL(url) { record.revoked.push(url); }},
    document: {createElement() { return anchor; }, body: {append() { record.appended++; }}},
    setTimeout(callback) { record.cleanup = callback; }
  };
  return {env, record, anchor};
}
test('A supported download requests a local UTF-8 file without claiming save completion', () => {
  const {env, record, anchor} = downloadEnv();
  assert.equal(requestBriefDownload('Текст', env), 'started');
  assert.equal(anchor.download, 'TRIFOTI-brief.txt'); assert.equal(record.clicks, 1);
  assert.deepEqual(record.parts, ['\ufeffТекст']); assert.equal(record.mime, 'text/plain;charset=utf-8');
  assert.equal(record.removed, 1); record.cleanup(); assert.deepEqual(record.revoked, ['blob:local-test']);
});
test('Unsupported downloads report fallback without clicking or creating a Blob', () => {
  for (const feature of ['download', 'createObjectURL']) {
    const {env, anchor, record} = downloadEnv();
    if (feature === 'download') delete anchor.download; else delete env.URL.createObjectURL;
    assert.equal(requestBriefDownload('Текст', env), 'unsupported'); assert.equal(record.clicks, 0); assert.equal(record.parts, undefined);
  }
});
test('Blob, object-URL and click failures return an error and clean temporary resources', () => {
  for (const failure of ['blob', 'url', 'click']) {
    const {env, record} = downloadEnv(failure);
    assert.equal(requestBriefDownload('Текст', env), 'failed'); assert.equal(record.clicks, 0); assert.equal(record.removed, 1);
    if (failure === 'click') { record.cleanup(); assert.deepEqual(record.revoked, ['blob:local-test']); }
  }
});
