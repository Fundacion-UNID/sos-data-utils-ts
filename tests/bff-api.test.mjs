// Flow contract: shared BFF routes are capability-based and never expose a product name as the public API prefix.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SharedBffApiRoutes,
  assertSharedPublicBffRoute,
  isSharedInternalBffRoute,
} from '../dist/bff-api.js';

test('accepts the shared assistant surface and keeps internal routes distinct', () => {
  assert.equal(SharedBffApiRoutes.assistant, '/api/assistant');
  assert.equal(assertSharedPublicBffRoute('/api/assistant/intent'), '/api/assistant/intent');
  assert.equal(assertSharedPublicBffRoute('/api/assistant/clinic-callbacks'), '/api/assistant/clinic-callbacks');
  assert.equal(isSharedInternalBffRoute('/api/internal/voice-profile/index'), true);
});

test('rejects public product and malformed route prefixes', () => {
  for (const route of [
    '/api/unid/assistant',
    '/api/uhc/assistant',
    '/api/vetchain/assistant',
    '/api/petchain/assistant',
    '/api/assistantish/intent',
    '/webhooks/twilio/voice',
  ]) {
    assert.throws(() => assertSharedPublicBffRoute(route), /shared_public_bff_route_required/);
  }
});
