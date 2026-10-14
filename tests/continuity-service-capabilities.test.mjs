// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ContinuityServiceCapability,
  SERVICE_OFFERING_ROLES,
  getServiceOfferingRole,
  isContinuityProviderCapability,
} from '../dist/continuity-service-capabilities.js';

test('owns the cross-sector index, personal-backup, and digital-twin provider capabilities', () => {
  assert.deepEqual(ContinuityServiceCapability, {
    IndexProvider: 'organization/Composition.cruds',
    DocumentBackupProvider: 'organization/DocumentReference.cruds',
    ImagingStudyProvider: 'organization/ImagingStudy.cruds',
    BinaryObjectProvider: 'organization/Binary.cruds',
    DigitalTwinProvider: 'organization/ResearchSubject.cruds',
  });
  assert.deepEqual(SERVICE_OFFERING_ROLES, ['index', 'personal-backup', 'digital-twin']);
});

test('maps every provider capability to exactly one selectable service role', () => {
  assert.equal(getServiceOfferingRole(ContinuityServiceCapability.IndexProvider), 'index');
  assert.equal(getServiceOfferingRole(ContinuityServiceCapability.DocumentBackupProvider), 'personal-backup');
  assert.equal(getServiceOfferingRole(ContinuityServiceCapability.ImagingStudyProvider), 'personal-backup');
  assert.equal(getServiceOfferingRole(ContinuityServiceCapability.BinaryObjectProvider), 'personal-backup');
  assert.equal(getServiceOfferingRole(ContinuityServiceCapability.DigitalTwinProvider), 'digital-twin');
  assert.equal(getServiceOfferingRole('organization/Consent.cruds'), undefined);
});

test('recognizes only provider capabilities governed by the shared continuity catalog', () => {
  assert.equal(isContinuityProviderCapability(ContinuityServiceCapability.DocumentBackupProvider), true);
  assert.equal(isContinuityProviderCapability('organization/DocumentReference.rs'), false);
});
