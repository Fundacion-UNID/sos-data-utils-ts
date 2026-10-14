// Flow contract: every product links a stable subject card to a Place or vehicle without merging either identity.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSoschainCanonicalTargetHash,
  buildSoschainPlaceCardAssociationClaims,
} from '../dist/place-card-association.js';

test('builds deterministic flat card-to-target claims across product channels', () => {
  const canonicalTargetHash = buildSoschainCanonicalTargetHash({
    targetType: 'Place',
    countryCode: 'ES',
    canonicalValue: 'Calle Mayor 1|28013|Madrid',
  });
  const claims = buildSoschainPlaceCardAssociationClaims({
    associationId: 'association-1',
    cardId: 'subject-1',
    canonicalTargetId: 'place-1',
    canonicalTargetHash,
    targetType: 'Place',
    role: 'occupant',
    createdAt: '2026-08-10T00:00:00.000Z',
  });

  assert.equal(claims['Basic.subject'], 'subject-1');
  assert.equal(claims['Basic.soschain-target'], 'place-1');
  assert.equal(claims['Basic.soschain-target-hash'], canonicalTargetHash);
  assert.equal(canonicalTargetHash, buildSoschainCanonicalTargetHash({
    targetType: 'Place',
    countryCode: 'es',
    canonicalValue: '  CALLE MAYOR 1|28013|Madrid  ',
  }));
});

test('rejects a target association without its stable subject card', () => {
  assert.throws(() => buildSoschainPlaceCardAssociationClaims({
    associationId: 'association-1',
    cardId: ' ',
    canonicalTargetId: 'place-1',
    canonicalTargetHash: 'opaque-hash',
    targetType: 'Place',
    role: 'occupant',
  }), /cardId is required/);
});
