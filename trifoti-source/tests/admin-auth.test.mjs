import assert from 'node:assert/strict';
import test from 'node:test';
import { adminAuthorization } from '../app/admin-auth.ts';

const request = (headers = {}) => new Request('https://studio.example/api/leads', { headers });
const ownerEnvironment = { TRIFOTI_OWNER_EMAIL: 'owner@example.com' };

test('private data rejects anonymous visitors and an unconfigured owner', () => {
  assert.equal(adminAuthorization(request(), ownerEnvironment), null);
  assert.equal(adminAuthorization(request(), undefined), null);
  assert.equal(adminAuthorization(request({ 'oai-authenticated-user-email': 'owner@example.com' }), {}), null);
  assert.equal(adminAuthorization(request({ 'oai-authenticated-user-id': 'another-signed-in-user' }), ownerEnvironment), null);
});

test('a signed-in account is not permission to manage studio data', () => {
  for (const email of ['visitor@example.com', 'owner@example.com.attacker.invalid', 'owner@example.com, visitor@example.com']) {
    assert.equal(adminAuthorization(request({ 'oai-authenticated-user-email': email }), ownerEnvironment), null);
  }
  assert.equal(adminAuthorization(request({ 'x-user-email': 'owner@example.com' }), ownerEnvironment), null);
});

test('the configured owner uses the trusted dispatch identity without a key', () => {
  assert.equal(adminAuthorization(request({ 'oai-authenticated-user-email': 'owner@example.com' }), ownerEnvironment), 'owner');
  assert.equal(adminAuthorization(request({ 'oai-authenticated-user-email': ' OWNER@EXAMPLE.COM ' }), ownerEnvironment), 'owner');
});

test('an independent manager key remains available and rejects invalid fallbacks', () => {
  const key = 'synthetic-manager-key-for-local-tests';
  const environment = { ...ownerEnvironment, LEADS_ADMIN_KEY: key };
  assert.equal(adminAuthorization(request({ 'x-trifoti-admin-key': key }), environment), 'key');
  assert.equal(adminAuthorization(request({ 'oai-authenticated-user-email': 'manager@example.com', 'x-trifoti-admin-key': key }), environment), 'key');
  assert.equal(adminAuthorization(request({ 'x-trifoti-admin-key': `${key}-wrong` }), environment), null);
  assert.equal(adminAuthorization(request({ 'x-trifoti-admin-key': key.replace('synthetic', 'incorrect') }), environment), null);
  assert.equal(adminAuthorization(request({ 'x-step3d-admin-key': key }), environment), null);
  assert.equal(adminAuthorization(request({ 'x-trifoti-admin-key': 'short' }), { LEADS_ADMIN_KEY: 'short' }), null);
});
