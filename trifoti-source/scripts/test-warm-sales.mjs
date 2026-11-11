import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import {formatBrief} from '../../trifoti/warm/brief-utils.js';

const root = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

for (const edition of ['trifoti/warm/', 'docs/trifoti/warm/']) {
  test(edition + ' keeps the brief local and removes the transmission UI and module', () => {
    const page = read(edition + 'index.html');
    const form = page.slice(page.indexOf('<form id="brief-form"'), page.indexOf('</form>') + 7);
    assert.doesNotMatch(form, /(?:action|formaction)\s*=|href="(?:https?:|mailto:|tg:)/i);
    assert.doesNotMatch(page, /enquiry-handoff|brief-to-chat|brief-to-mail|handoff-plain|handoff-notice/);
    assert.doesNotMatch(read(edition + 'app.js'), /brief-handoff|mountBriefHandoff|handoffLink/);
    assert.equal(existsSync(new URL(edition + 'brief-handoff.js', root)), false);
    assert.match(form, /type="submit" id="brief-save" disabled/);
    assert.match(form, /id="brief-copy"/);
    assert.match(form, /id="brief-print"/);
    assert.match(form, /Бриф скачивается файлом, а не отправляется объединению/);
    assert.match(page, /app\.js\?[^"\n]*local-brief=20261111/);
  });

  test(edition + ' preserves general contacts without attaching form text', () => {
    const page = read(edition + 'index.html');
    const contact = page.slice(page.indexOf('<div class="contact-intro">'), page.indexOf('<form id="brief-form"'));
    assert.match(contact, /href="https:\/\/t\.me\/step_3d_mngr"/);
    assert.match(contact, /href="mailto:info@step3d.tech/);
    for (const [, href] of contact.matchAll(/href="([^"]+)"/g)) {
      const url = new URL(href);
      assert.equal(url.searchParams.has('text'), false);
      assert.equal(url.searchParams.has('body'), false);
    }
  });
}

test('Local submission prevents navigation, validates and downloads the complete current brief', () => {
  const app = read('trifoti/warm/app.js');
  const start = app.indexOf("form.addEventListener('submit',");
  const end = app.indexOf("$('#brief-text-fallback').addEventListener", start);
  assert.ok(start > 0 && end > start);
  const downloads = [], status = {textContent:'', dataset:{}}, fallback = {hidden:true}, preview = {value:''}, values = {
    name:'Тест', idea:'Награды A+B & C — 20 штук', direction:'Награды', deadline:'20 декабря',
    budget:'По согласованию', reference:'Ракурс 2 https://step3dlab.github.io/STEP_3D/trifoti/warm/portfolio.html#work-09/2'
  };
  let submit, prevented = 0, valid = true;
  const context = {
    form:{addEventListener(type, listener) { assert.equal(type, 'submit'); submit = listener; }},
    briefTools:{validate:()=>valid},
    FormData:class { constructor() { return Object.entries(values); } },
    formatBrief, requestBriefDownload:text=>{downloads.push(text); return 'started';},
    $:selector=>({ '#brief-status':status, '#brief-text-fallback':fallback, '#brief-text':preview })[selector]
  };
  vm.runInNewContext(app.slice(start, end), context);
  valid = false; submit({preventDefault(){prevented++;}});
  assert.equal(downloads.length, 0);
  valid = true; submit({preventDefault(){prevented++;}});
  assert.equal(prevented, 2);
  assert.equal(downloads.length, 1);
  assert.equal(downloads[0], formatBrief(values));
  assert.match(status.textContent, /Скачивание брифа запрошено/);
  assert.equal(preview.value, formatBrief(values));
  assert.equal(fallback.hidden, false);
  values.idea = 'Изменённая идея'; submit({preventDefault(){prevented++;}});
  assert.equal(downloads[1], formatBrief(values));
});

test('Rebuild source cannot restore the retired text-transmission feature', () => {
  for (const filename of ['brief-handoff.js', 'handoff.html']) {
    assert.equal(existsSync(new URL('trifoti-source/warm/sales/' + filename, root)), false);
  }
  assert.doesNotMatch(read('trifoti-source/warm/sales/entry.js'), /brief-handoff|window\.open|location\.assign/);
  assert.match(read('trifoti-source/warm/sales/entry.js'), /addCaseReference/);
  assert.match(read('trifoti-source/warm/sales/apply.py'), /brief-handoff\.js'\)\.unlink/);
  for (const filename of ['index.html', 'app.js', 'sales.css']) {
    assert.equal(read('trifoti/warm/' + filename), read('docs/trifoti/warm/' + filename));
  }
});

test('Public commercial pages are indexable and have their own canonical destinations', () => {
  for (const path of ['index.html', 'portfolio.html', 'catalog.html', 'cases/red7-panels.html']) {
    const html = read('trifoti/warm/' + path);
    assert.doesNotMatch(html, /<meta name="robots"[^>]*noindex/i);
    const base = 'https://step3dlab.github.io/STEP_3D/trifoti/warm/';
    assert.ok(html.includes('rel="canonical" href="' + base + (path === 'index.html' ? '' : path) + '"'));
  }
});
