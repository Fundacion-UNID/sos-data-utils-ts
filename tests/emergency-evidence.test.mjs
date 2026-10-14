// Flow contract: SOS, Vet and UHC share one evidence vocabulary while each SDK owns its authorization decision.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EmergencyCapabilities,
  EvidenceDomains,
  EvidenceRelationships,
} from '../dist/emergency-evidence.js';

test('publishes one immutable cross-product emergency evidence vocabulary', () => {
  assert.deepEqual(EmergencyCapabilities, ['sos:call', 'sos:request']);
  assert.deepEqual(EvidenceDomains, ['SOS', 'Health', 'TrainingAndEducation']);
  assert.deepEqual(EvidenceRelationships, [
    'self',
    'guardian',
    'professional',
    'institution',
    'incident-reporter',
  ]);
  assert.equal(Object.isFrozen(EmergencyCapabilities), true);
});

test('does not publish product-prefixed evidence aliases', async () => {
  const contract = await import('../dist/emergency-evidence.js')
  assert.equal('SoschainEmergencyCapabilities' in contract, false)
  assert.equal('SoschainEvidenceDomains' in contract, false)
  assert.equal('SoschainEvidenceRelationships' in contract, false)
});
