// Flow contract: 1) one human or animal subject owns one stable controller/caregiver communication Group; 2) Personal and Professional derive the same FHIR reference without personal identifiers; 3) another subject receives another Group. Authorization invariant: the reference identifies a queue and never grants membership. Persistence invariant: the deterministic reference contains no DID or clear subject identifier.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildSubjectCommunicationGroupReference,
  buildSubjectCommunicationPurposeGroupReference,
  SubjectCommunicationAudiencePurpose,
} from '../dist/subject-communication-group.js'
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js'

test('builds one stable opaque FHIR Group reference per subject', () => {
  const first = buildSubjectCommunicationGroupReference('did:web:animal.example')
  assert.equal(first, buildSubjectCommunicationGroupReference('did:web:animal.example'))
  assert.match(first, /^Group\/subject-access-[0-9a-f]{32}$/u)
  assert.notEqual(first, buildSubjectCommunicationGroupReference('did:web:other-animal.example'))
  assert.doesNotMatch(first, /animal\.example/u)
  assert.throws(() => buildSubjectCommunicationGroupReference(''), /subject_group_subject_required/u)
})

test('builds distinct stable purpose-aware Groups without changing the legacy reference', () => {
  const subject = REPOSITORY_SAFE_EXAMPLES.didWeb
  const emergency = buildSubjectCommunicationPurposeGroupReference({
    subject,
    purpose: SubjectCommunicationAudiencePurpose.EmergencyUpdates,
  })
  const continuity = buildSubjectCommunicationPurposeGroupReference({
    subject,
    purpose: SubjectCommunicationAudiencePurpose.CareContinuity,
  })

  assert.match(emergency, /^Group\/subject-emergency-[0-9a-f]{32}$/u)
  assert.match(continuity, /^Group\/subject-care-continuity-[0-9a-f]{32}$/u)
  assert.notEqual(emergency, continuity)
  assert.equal(emergency, buildSubjectCommunicationPurposeGroupReference({
    subject,
    purpose: SubjectCommunicationAudiencePurpose.EmergencyUpdates,
  }))
  assert.equal(
    buildSubjectCommunicationGroupReference(subject),
    buildSubjectCommunicationGroupReference(subject),
  )
  assert.doesNotMatch(`${emergency}${continuity}`, /example\.invalid/u)
})

test('rejects missing subjects and unknown communication purposes', () => {
  assert.throws(() => buildSubjectCommunicationPurposeGroupReference({
    subject: '',
    purpose: SubjectCommunicationAudiencePurpose.EmergencyUpdates,
  }), /subject_group_subject_required/u)
  assert.throws(() => buildSubjectCommunicationPurposeGroupReference({
    subject: REPOSITORY_SAFE_EXAMPLES.didWeb,
    purpose: 'unknown-purpose',
  }), /subject_group_purpose_invalid/u)
})
