import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {handoffLink} from '../../trifoti/warm/brief-handoff.js';
import {formatBrief} from '../../trifoti/warm/brief-utils.js';

const full = formatBrief({name:'Иван', idea:'Награды A+B & C — 20 штук', direction:'Награды', deadline:'20 декабря'});

for (const [channel, key] of [['chat', 'text'], ['mail', 'body']]) {
  test(channel + ' addresses the manager and preserves a short brief and special characters', () => {
    const link = handoffLink(channel, full);
    assert.equal(link.full, true);
    const url = new URL(link.href);
    assert.equal(url.searchParams.get(key), full);
    if (channel === 'chat') assert.equal(url.origin + url.pathname, 'https://t.me/step_3d_mngr');
    else {
      assert.equal(url.protocol, 'mailto:');
      assert.equal(url.pathname, 'info@step3d.tech');
      assert.match(url.searchParams.get('subject'), /ТРИФОТИ/);
    }
  });

  test(channel + ' offers the clean destination for a long brief without leaking partial text', () => {
    const large = handoffLink(channel, 'Описание проекта '.repeat(500));
    assert.equal(large.full, false);
    assert.equal(new URL(large.href).searchParams.has(key), false);
  });
}
test('Static contacts work independently of the enhanced form', () => {
  const page = readFileSync(new URL('../../trifoti/warm/index.html', import.meta.url), 'utf8');
  const contact = page.slice(page.indexOf('<div class="contact-intro">'), page.indexOf('<form id="brief-form"'));
  assert.match(contact, /href="https:\/\/t\.me\/step_3d_mngr"/);
  assert.match(contact, /href="mailto:info@step3d.tech/);
  assert.doesNotMatch(page, /Отправка объединению пока недоступна|Публичные контакты пока не опубликованы/);
  assert.match(page, /id="enquiry-handoff" hidden/);
});

test('Public commercial pages are indexable and have their own canonical destinations', () => {
  for (const path of ['index.html', 'portfolio.html', 'catalog.html', 'cases/red7-panels.html']) {
    const html = readFileSync(new URL('../../trifoti/warm/' + path, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /<meta name="robots"[^>]*noindex/i);
    const base = 'https://step3dlab.github.io/STEP_3D/trifoti/warm/';
    assert.ok(html.includes('rel="canonical" href="' + base + (path === 'index.html' ? '' : path) + '"'));
  }
});
