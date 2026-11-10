import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root = new URL('../../', import.meta.url);
const html = readFileSync(new URL('trifoti/warm/portfolio.html', root), 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const catalog = JSON.parse(html.match(/<script id="images" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const loader = script.slice(script.indexOf('function stopImage()'), script.indexOf('function showFrame('));

function setup() {
  const timers = new Map();
  const requests = [];
  const images = [];
  const attributes = new Map();
  const doc = {activeElement: null};
  const viewer = {open: true, dataset: {}};
  const retry = {hidden: true};
  const feedback = {hidden: true};
  const status = {textContent: ''};
  const close = {focus() {doc.activeElement = close;}};
  class FakeImage {
    constructor() {this.hidden = false; this.naturalWidth = 0; images.push(this);}
    set src(value) {this.source = value; requests.push(value);}
    get src() {return this.source;}
    removeAttribute(name) {if (name === 'src') this.source = undefined;}
    replaceWith() {}
  }
  const context = {
    initial: new FakeImage(), Image: FakeImage, document: doc, viewer,
    retry, feedback, loadStatus: status, closeButton: close,
    mediaFrame: {setAttribute(name, value) {attributes.set(name, value);}},
    URL, Date, location: {href: 'https://example.test/trifoti/warm/portfolio.html'},
    setTimeout(fn, ms) {const key = Symbol(); timers.set(key, {fn, ms}); return key;},
    clearTimeout(key) {timers.delete(key);}
  };
  vm.runInNewContext(`let stage = initial; let requestId = 0; let cancelImage = () => {}; const imageTimeout = 20000; ${loader}; this.api = {loadImage, stopImage, stage: () => stage};`, context);
  const frame = {src: 'photos/portfolio/view-02.webp', caption: 'A caption'};
  return {...context, timers, requests, images, attributes, frame, doc, status, close};
}

test('both published gallery copies are byte-identical', () => {
  assert.equal(html, readFileSync(new URL('docs/trifoti/warm/portfolio.html', root), 'utf8'));
});
test('inline gallery script compiles', () => {new vm.Script(script);});
test('all 49 cards and 64 original frames remain represented', () => {
  assert.equal(Object.keys(catalog).length, 49);
  const frames = Object.values(catalog).flatMap(work => work.images);
  assert.equal(frames.length, 64);
  assert.equal(new Set(frames.map(image => image.src)).size, 64);
  const cards = [...html.matchAll(/data-work="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(cards.sort(), Object.keys(catalog).sort());
  assert.ok(frames.every(image => /^photos\/portfolio\/view-\d{2}\.webp$/.test(image.src) && image.caption));
});
test('feedback is live, retry is initially hidden, touch controls retain 44px minimum', () => {
  assert.match(html, /data-load-status role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(html, /data-retry hidden>Повторить загрузку/);
  assert.match(html, /button\{min-width:44px;min-height:44px/);
  assert.match(html, /\[hidden\]\{display:none!important\}/);
});
test('loader starts one image request and retains a visible loading message', () => {
  const s = setup(); s.api.loadImage(s.frame, false);
  assert.equal(s.requests.length, 1);
  assert.equal(s.viewer.dataset.imageState, 'loading');
  assert.equal(s.attributes.get('aria-busy'), 'true');
  assert.equal(s.api.stage().hidden, true);
  assert.equal(s.feedback.hidden, false);
  assert.equal(s.retry.hidden, true);
  assert.match(s.status.textContent, /Загрузка/);
  assert.equal([...s.timers.values()][0].ms, 20000);
});
test('successful image reveals only the current image and clears timer/handlers', () => {
  const s = setup(); s.api.loadImage(s.frame, false);
  const image = s.api.stage(); image.naturalWidth = 800; image.onload();
  assert.equal(image.hidden, false);
  assert.equal(s.viewer.dataset.imageState, 'ready');
  assert.equal(s.feedback.hidden, true);
  assert.equal(s.attributes.get('aria-busy'), 'false');
  assert.equal(s.timers.size, 0);
  assert.equal(image.onload, null);
  assert.equal(image.onerror, null);
});
test('error and invalid successful decode expose retry without automatic requests', () => {
  for (const kind of ['error','empty']) {
    const s = setup(); s.api.loadImage(s.frame, false);
    if (kind === 'error') s.api.stage().onerror(); else s.api.stage().onload();
    assert.equal(s.viewer.dataset.imageState, 'error');
    assert.equal(s.api.stage().hidden, true);
    assert.equal(s.api.stage().src, undefined);
    assert.equal(s.retry.hidden, false);
    assert.equal(s.requests.length, 1);
    assert.equal(s.timers.size, 0);
  }
});
test('retry preserves source path, bypasses failure cache and restores focus before hiding button', () => {
  const s = setup(); s.api.loadImage(s.frame, false); s.api.stage().onerror();
  s.doc.activeElement = s.retry; s.api.loadImage(s.frame, true);
  const source = new URL(s.api.stage().src);
  assert.equal(source.pathname, '/trifoti/warm/photos/portfolio/view-02.webp');
  assert.ok(source.searchParams.get('retry'));
  assert.equal(s.requests.length, 2);
  assert.equal(s.doc.activeElement, s.close);
  assert.equal(s.retry.hidden, true);
});
test('late load/error/timer from earlier frame cannot change a newer request', () => {
  const s = setup(); s.api.loadImage(s.frame, false);
  const previous = s.api.stage(); const load = previous.onload; const error = previous.onerror;
  const timeout = [...s.timers.values()][0].fn;
  s.api.loadImage({src:'photos/portfolio/view-03.webp',caption:'New'}, false);
  const current = s.api.stage();
  previous.naturalWidth = 800; load(); error(); timeout();
  assert.equal(s.api.stage(), current);
  assert.equal(s.viewer.dataset.imageState, 'loading');
  assert.equal(current.hidden, true);
  current.naturalWidth = 800; current.onload(); load(); error();
  assert.equal(s.viewer.dataset.imageState, 'ready');
  assert.equal(current.alt, 'New');
});
test('20-second timeout cancels pending resource and ignores late success', () => {
  const s = setup(); s.api.loadImage(s.frame, false);
  const image = s.api.stage(); const load = image.onload;
  [...s.timers.values()][0].fn();
  assert.equal(s.viewer.dataset.imageState, 'error');
  assert.match(s.status.textContent, /слишком много времени/);
  assert.equal(image.src, undefined);
  assert.equal(s.timers.size, 0);
  image.naturalWidth = 800; load();
  assert.equal(s.viewer.dataset.imageState, 'error');
});
test('closing blocks updates even before asynchronous close cleanup', () => {
  const s = setup(); s.api.loadImage(s.frame, false);
  const image = s.api.stage(); const load = image.onload;
  s.viewer.open = false; image.naturalWidth = 800; load();
  assert.equal(image.hidden, true);
  s.api.stopImage(); load();
  assert.equal(s.timers.size, 0);
  assert.equal(image.src, undefined);
});
test('reopening receives a fresh request unaffected by an earlier callback', () => {
  const s = setup(); s.api.loadImage(s.frame, false);
  const error = s.api.stage().onerror;
  s.viewer.open = false; s.api.stopImage(); s.viewer.open = true;
  s.api.loadImage(s.frame, false); const current = s.api.stage();
  current.naturalWidth = 800; current.onload(); error();
  assert.equal(s.viewer.dataset.imageState, 'ready');
  assert.equal(current.hidden, false);
});
test('production adds no fetch, storage, analytics or automatic retry', () => {
  assert.doesNotMatch(script, /\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage|sendBeacon|setInterval)\b/);
  assert.match(script, /if \(viewer\.open\) return;\s*stopImage\(\);/);
  assert.match(script, /viewer\.dataset\.imageState === 'error'\) showFrame\(true\)/);
});

function renderFrame({position, count = 3, focused = 'next'}) {
  const doc = {activeElement: null, body: {}};
  const makeControl = () => ({
    set disabled(value) {this.unavailable = value; if (value && doc.activeElement === this) doc.activeElement = doc.body;},
    get disabled() {return this.unavailable;},
    focus() {doc.activeElement = this;}
  });
  const previous = makeControl(); const next = makeControl(); const closeButton = makeControl();
  doc.activeElement = {previous, next, close: closeButton}[focused];
  const text = {textContent: ''};
  const context = {document: doc, previous, next, closeButton, position,
    sequence: Array.from({length:count}, () => ({work:'test',frame:0})),
    catalog:{test:{title:'Work',images:[{src:'image.webp',caption:'Caption'}]}},
    viewer:{querySelector() {return text;}},loadImage() {}}
  const showFrame = script.slice(script.indexOf('function showFrame('), script.indexOf('function move('));
  vm.runInNewContext(showFrame + '\nshowFrame();', context);
  return {...context, doc};
}
test('last frame transfers focus from disabled next to previous', () => {
  const s = renderFrame({position:2});
  assert.equal(s.next.disabled, true);
  assert.equal(s.previous.disabled, false);
  assert.equal(s.doc.activeElement, s.previous);
});
test('first frame transfers focus from disabled previous to next', () => {
  const s = renderFrame({position:0,focused:'previous'});
  assert.equal(s.previous.disabled, true);
  assert.equal(s.next.disabled, false);
  assert.equal(s.doc.activeElement, s.next);
});
test('interior frames and unrelated focus are not moved', () => {
  const middle = renderFrame({position:1});
  assert.equal(middle.doc.activeElement, middle.next);
  const close = renderFrame({position:2,focused:'close'});
  assert.equal(close.doc.activeElement, close.closeButton);
});
test('a single-frame sequence falls back to close instead of a disabled button', () => {
  const s = renderFrame({position:0,count:1});
  assert.equal(s.previous.disabled, true); assert.equal(s.next.disabled, true);
  assert.equal(s.doc.activeElement, s.closeButton);
});

function keyboardAndCopy({clipboardFails = true} = {}) {
  const handlers = {};
  const doc = {activeElement: null};
  const control = {isContentEditable: false, closest: () => null};
  const addressField = {
    hidden: true, value: '', selected: false, isContentEditable: false,
    closest: selector => selector.includes('input') ? addressField : null,
    focus() {doc.activeElement = this;},
    select() {this.selected = true;}
  };
  const location = {href: 'https://example.test/trifoti/warm/portfolio.html#work-02'};
  const viewer = {open: true, addEventListener(type, handler) {handlers[type] = handler;}};
  const copyStatus = {textContent: ''};
  const steps = [];
  const copied = [];
  const context = {viewer, addressField, copyStatus, location,
    copyButton: {addEventListener(type, handler) {handlers.copy = handler;}},
    navigator: {clipboard: {async writeText(value) {
      if (clipboardFails) throw new Error('Clipboard unavailable');
      copied.push(value);
    }}},
    move(delta) {steps.push(delta); addressField.hidden = true;}
  };
  const start = script.indexOf("viewer.addEventListener('keydown'");
  const end = script.indexOf("import('./gallery-interactions.js", start);
  vm.runInNewContext(script.slice(start, end), context);
  function key(key, overrides = {}) {
    const event = {key, target: control, defaultPrevented: false,
      preventDefault() {this.defaultPrevented = true;}, ...overrides};
    handlers.keydown(event);
    return event;
  }
  return {...context, handlers, doc, control, steps, copied, key};
}

test('clipboard fallback keeps its address and focus when either arrow is pressed', async () => {
  const s = keyboardAndCopy();
  await s.handlers.copy();
  assert.equal(s.addressField.hidden, false);
  assert.equal(s.addressField.value, s.location.href);
  assert.equal(s.doc.activeElement, s.addressField);
  assert.equal(s.addressField.selected, true);
  for (const key of ['ArrowLeft', 'ArrowRight']) {
    const event = s.key(key, {target: s.addressField});
    assert.equal(event.defaultPrevented, false, 'native caret movement remains available');
    assert.equal(s.addressField.hidden, false);
    assert.equal(s.doc.activeElement, s.addressField);
  }
  assert.deepEqual(s.steps, []);
});

test('ordinary left and right arrows on gallery controls still navigate once', () => {
  const s = keyboardAndCopy();
  assert.equal(s.key('ArrowLeft').defaultPrevented, true);
  assert.equal(s.key('ArrowRight').defaultPrevented, true);
  assert.deepEqual(s.steps, [-1, 1]);
});

test('modified arrows, composition and handled keys retain their native behavior', () => {
  const s = keyboardAndCopy();
  for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey', 'isComposing', 'defaultPrevented']) {
    for (const key of ['ArrowLeft', 'ArrowRight']) {
      const event = s.key(key, {[modifier]: true});
      assert.equal(event.defaultPrevented, modifier === 'defaultPrevented');
    }
  }
  assert.deepEqual(s.steps, []);
});

test('editable and native media controls do not trigger gallery navigation', () => {
  const s = keyboardAndCopy();
  for (const selector of ['input', 'textarea', 'select', 'video', 'audio', '[role="textbox"]', '[contenteditable]']) {
    const target = {closest: selectors => selectors.includes(selector.replace(']', '')) ? target : null};
    assert.equal(s.key('ArrowRight', {target}).defaultPrevented, false, selector);
  }
  assert.equal(s.key('ArrowLeft', {target: {isContentEditable: true, closest: () => null}}).defaultPrevented, false);
  assert.deepEqual(s.steps, []);
});

test('Escape, Tab and copy shortcuts are left to the browser', () => {
  const s = keyboardAndCopy();
  for (const key of ['Escape', 'Tab', 'Home', 'End', 'c']) {
    assert.equal(s.key(key).defaultPrevented, false);
  }
  assert.deepEqual(s.steps, []);
});

test('successful copying still reports success without revealing the fallback', async () => {
  const s = keyboardAndCopy({clipboardFails: false});
  await s.handlers.copy();
  assert.deepEqual(s.copied, [s.location.href]);
  assert.equal(s.copyStatus.textContent, 'Ссылка скопирована');
  assert.equal(s.addressField.hidden, true);
});


test('short-screen gallery shrinks the media container rather than only its image', () => {
  const rules = html.match(/@media\(max-height:580px\)\s*\{[^\n]+/)[0];
  assert.match(rules, /\.viewport\s*\{\s*height:49dvh;\s*\}/);
  assert.doesNotMatch(rules, /\.stage\s*\{|max-height:49dvh/);
  assert.match(rules, /dialog\[open\]\s*\{\s*overflow:auto;/);
  assert.match(html, /\.viewport\{[^}]*height:min\(68dvh,750px\)/);
  assert.match(html, /@media\(max-width:540px\)[^\n]*\.viewport\{height:59dvh\}/);
  assert.match(html, /\.stage\{object-fit:contain;display:block\}/);
});
