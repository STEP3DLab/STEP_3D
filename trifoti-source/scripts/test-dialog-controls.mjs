import test from 'node:test';
import assert from 'node:assert/strict';
import {keepDialogFocus, galleryArrow} from '../dist/dialog-controls.js';

function fixture() {
  const document = {activeElement: null};
  globalThis.document = document;
  globalThis.getComputedStyle = element => ({visibility: element.visibility || 'visible'});
  const controls = Array.from({length: 4}, (_, index) => ({
    index, tabIndex: 0, disabled: false, hidden: false, rendered: true,
    matches() { return this.disabled; }, closest() { return this.hidden; },
    getClientRects() { return this.rendered ? [{}] : []; },
    focus() { document.activeElement = this; }
  }));
  const dialog = {
    open: true, listener: null,
    addEventListener(type, listener) { assert.equal(type, 'keydown'); this.listener = listener; },
    querySelectorAll() { return controls; },
    contains(element) { return element === this || controls.includes(element); }
  };
  keepDialogFocus(dialog);
  const press = (active, props = {}) => {
    document.activeElement = active;
    const event = {key: 'Tab', defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...props};
    dialog.listener(event);
    return event;
  };
  return {dialog, controls, document, press};
}

test('Tab from the last control wraps to the first visible control', () => {
  const {controls, document, press} = fixture();
  assert.equal(press(controls.at(-1)).defaultPrevented, true);
  assert.equal(document.activeElement, controls[0]);
});
test('Shift+Tab from the first control wraps to the last', () => {
  const {controls, document, press} = fixture();
  assert.equal(press(controls[0], {shiftKey: true}).defaultPrevented, true);
  assert.equal(document.activeElement, controls.at(-1));
});
test('Intermediate Tab and native media-control navigation stay native', () => {
  const {controls, document, press} = fixture();
  assert.equal(press(controls[1]).defaultPrevented, false);
  assert.equal(document.activeElement, controls[1]);
});
test('Hidden, inert, disabled, negative-tabindex and invisible controls are skipped', () => {
  for (const state of [{hidden: true}, {disabled: true}, {tabIndex: -1}, {rendered: false}, {visibility: 'hidden'}]) {
    const {controls, document, press} = fixture();
    Object.assign(controls[0], state); Object.assign(controls.at(-1), state);
    press(controls[2]); assert.equal(document.activeElement, controls[1]);
    press(controls[1], {shiftKey: true}); assert.equal(document.activeElement, controls[2]);
  }
});
test('A single control retains focus; an empty set does not invent a focus target', () => {
  const {controls, document, press} = fixture();
  controls.slice(1).forEach(control => control.hidden = true);
  assert.equal(press(controls[0]).defaultPrevented, true);
  assert.equal(document.activeElement, controls[0]);
  controls[0].hidden = true;
  assert.equal(press(controls[0]).defaultPrevented, false);
});
test('Focus on the dialog container enters its visible controls in either direction', () => {
  const {dialog, controls, document, press} = fixture();
  press(dialog); assert.equal(document.activeElement, controls[0]);
  press(dialog, {shiftKey: true}); assert.equal(document.activeElement, controls.at(-1));
});
test('Closed dialogs, handled events and modified Tab remain untouched', () => {
  const {dialog, controls, press} = fixture();
  dialog.open = false; assert.equal(press(controls.at(-1)).defaultPrevented, false);
  dialog.open = true;
  for (const props of [{ctrlKey: true}, {altKey: true}, {metaKey: true}, {key: 'Escape'}, {key: 'Enter'}]) {
    assert.equal(press(controls.at(-1), props).defaultPrevented, false);
  }
  let prevented = false;
  press(controls.at(-1), {defaultPrevented: true, preventDefault() { prevented = true; }});
  assert.equal(prevented, false);
});

const arrow = (props = {}) => galleryArrow({key: 'ArrowRight', target: {closest() { return null; }}, ...props});
test('Only plain left and right arrows request gallery movement', () => {
  assert.equal(arrow(), 1); assert.equal(arrow({key: 'ArrowLeft'}), -1);
  for (const key of ['Tab', 'Escape', 'Enter', ' ', 'ArrowUp']) assert.equal(arrow({key}), 0);
});
test('Browser, assistive and composition shortcuts never advance the gallery', () => {
  for (const flag of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey', 'defaultPrevented', 'isComposing']) assert.equal(arrow({[flag]: true}), 0);
});
test('Editable fields and native video/audio controls keep their arrow keys', () => {
  assert.equal(arrow({target: {isContentEditable: true}}), 0);
  for (const tag of ['video', 'audio', 'input', 'textarea', 'select', 'contenteditable', 'textbox']) {
    assert.equal(arrow({target: {closest(selector) { assert(selector.includes(tag)); return {}; }}}), 0);
  }
});
