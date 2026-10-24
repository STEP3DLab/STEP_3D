import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeHeaderNavigation} from '../dist/header-navigation.js';

function fixture({desktop = false, active = null, initialize = true} = {}) {
  const listeners = new Map(), elements = {};
  const document = {activeElement: null};
  const on = (id, type, fn) => {
    const key = `${id}:${type}`;
    listeners.set(key, [...(listeners.get(key) || []), fn]);
  };
  const emit = (id, type, fields = {}) => {
    const event = {type, target: elements[id], ...fields};
    for (const fn of listeners.get(`${id}:${type}`) || []) fn(event);
    return event;
  };
  function element(id, parent = null) {
    const result = {id, parent, hidden: false, attrs: {}, classes: new Set(),
      setAttribute(key, value) { this.attrs[key] = value; },
      getAttribute(key) { return this.attrs[key]; },
      addEventListener(type, fn) { on(id, type, fn); },
      contains(other) { while (other) { if (other === this) return true; other = other.parent; } return false; },
      closest(selector) { return selector === '.header' && elements.header.contains(this) ? elements.header : null; },
      focus(options) { document.activeElement = this; this.focusOptions = options; }
    };
    result.classList = {
      add(name) { result.classes.add(name); },
      toggle(name, enabled) { enabled ? result.classes.add(name) : result.classes.delete(name); }
    };
    elements[id] = result;
    return result;
  }
  const header = element('header'), menu = element('menu', header), nav = element('nav', header);
  const links = Array.from({length: 5}, (_, i) => element(`link${i}`, nav));
  const brand = element('brand', header), cta = element('cta', header), outside = element('outside');
  menu.hidden = true;
  menu.attrs = {'aria-expanded': 'false', 'aria-label': 'Открыть меню'};
  nav.querySelector = selector => selector === 'a[href]' ? links[0] : null;
  header.querySelector = selector => ({'.menu-button': menu, '#navigation': nav}[selector] || null);
  header.querySelectorAll = selector => { assert.equal(selector, 'a'); return [brand, ...links, cta]; };
  document.querySelector = selector => { assert.equal(selector, '.header'); return header; };
  document.addEventListener = (type, fn) => on('document', type, fn);
  const media = {matches: desktop, addEventListener(type, fn) { on('media', type, fn); }};
  const window = {matchMedia(query) { assert.equal(query, '(min-width: 801px)'); return media; }};
  if (active) elements[active].focus();
  const controller = initialize ? initializeHeaderNavigation({document, window}) : null;
  return {elements, links, document, window, media, listeners, controller, emit,
    open() { menu.focus(); emit('menu', 'click'); },
    expanded() { return menu.getAttribute('aria-expanded') === 'true'; },
    resize(matches) { media.matches = matches; emit('media', 'change'); }
  };
}

test('The independent module activates the disclosure only after wiring and initializes once', () => {
  const f = fixture({initialize: false});
  assert(f.elements.menu.hidden);
  assert(!f.elements.header.classes.has('nav-ready'));
  const controller = initializeHeaderNavigation(f);
  assert.equal(f.elements.menu.hidden, false);
  assert(f.elements.header.classes.has('nav-ready'));
  assert(!f.expanded());
  assert.equal(initializeHeaderNavigation(f), controller);
  assert.equal(f.listeners.get('menu:click').length, 1);
  assert.equal(f.listeners.get('media:change').length, 1);
  f.open();
  assert(f.expanded());
  assert.equal(f.elements.menu.getAttribute('aria-label'), 'Закрыть меню');
  assert.equal(f.document.activeElement, f.elements.menu);
});

test('Incomplete markup or unavailable matchMedia leaves the fallback untouched', () => {
  for (const missing of ['header', 'menu', 'nav', 'matchMedia']) {
    const f = fixture({initialize: false});
    if (missing === 'header') f.document.querySelector = () => null;
    else if (missing === 'matchMedia') f.window.matchMedia = undefined;
    else { const query = f.elements.header.querySelector; f.elements.header.querySelector = selector => selector === (missing === 'menu' ? '.menu-button' : '#navigation') ? null : query(selector); }
    assert.equal(initializeHeaderNavigation(f), null);
    assert(f.elements.menu.hidden);
    assert(!f.elements.header.classes.has('nav-ready'));
    assert.equal(f.listeners.size, 0);
  }
});

test('Late enhancement preserves a focused mobile link and does not open a desktop disclosure', () => {
  for (const desktop of [false, true]) {
    const f = fixture({desktop, active: 'link2'});
    assert.equal(f.expanded(), !desktop);
    assert.equal(f.document.activeElement, f.links[2]);
  }
});

