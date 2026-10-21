import assert from 'node:assert/strict';
import test from 'node:test';
import { csvCell } from '../app/csv.ts';
import { analyticsUrl, isPrivatePath } from '../app/analytics-privacy.ts';

test('CSV keeps customer input as literal text in a spreadsheet', () => {
  for (const input of ['=1+1', '+79959009141', '-1+2', '@SUM(A1:A2)', '  =1+1', '\t=1+1', '\n=1+1']) {
    assert.ok(csvCell(input).startsWith('"\''));
  }
  assert.equal(csvCell('ООО "Step3D", Москва'), '"ООО ""Step3D"", Москва"');
  assert.equal(csvCell(12500), '"12500"');
  assert.equal(csvCell(null), '""');
});

test('analytics omits private page paths and URL credentials', () => {
  assert.equal(analyticsUrl('https://example.com/status?id=S3D-test&token=private#details'), 'https://example.com');
  assert.equal(analyticsUrl('https://example.com/projects?token=private&utm_source=test#portfolio'), 'https://example.com/projects');
  assert.equal(analyticsUrl('https://example.com/leads'), 'https://example.com');
  assert.equal(analyticsUrl('not a URL'), '');
  assert.equal(analyticsUrl('javascript:alert(1)'), '');
  assert.equal(isPrivatePath('/status'), true);
  assert.equal(isPrivatePath('/leads/'), true);
  assert.equal(isPrivatePath('/services'), false);
});
