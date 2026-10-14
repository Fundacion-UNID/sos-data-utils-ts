// Flow contract: 1) freeze an enumerated subject Group, 2) create one canonical ServiceRequest for that Group, 3) keep members on Group only, and 4) never infer authorization from FHIR references.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ALERT_COHORT_IDENTIFIER_SYSTEM,
  buildEmergencyGroupClaims,
  buildEmergencyServiceRequestEntry,
  readAlertCohortIdentifierValue,
  readEmergencySubjectReferences,
} from '../dist/emergency-group.js'

test('builds an enumerated emergency Group and a canonical compact-coded ServiceRequest', () => {
  const groupClaims = buildEmergencyGroupClaims({
    identifier: 'urn:uuid:00000000-0000-4000-8000-000000000001',
    displayName: 'Emergency subjects', groupType: 'animal',
    memberSubjectReferences: ['Patient/animal-alpha', 'Patient/animal-beta', 'Patient/animal-alpha'],
  })
  const serviceRequestEntry = buildEmergencyServiceRequestEntry({
    entryId: 'request-one', identifier: 'urn:uuid:00000000-0000-4000-8000-000000000002',
    groupReference: 'Group/emergency-subjects', requesterReference: 'RelatedPerson/requester-one',
    performerReferences: ['HealthcareService/emergency-care'],
    assistanceCode: { system: 'https://example.invalid/fhir/CodeSystem/emergency-assistance', code: 'emergency-care', text: 'Emergency care' },
    authoredAt: '2026-09-26T12:00:00Z',
  })

  assert.equal(groupClaims['Group.membership'], 'enumerated')
  assert.equal(groupClaims['Group.type'], 'animal')
  assert.equal(
    groupClaims['Group.identifier'],
    `${ALERT_COHORT_IDENTIFIER_SYSTEM}|urn:uuid:00000000-0000-4000-8000-000000000001`,
  )
  assert.equal(readAlertCohortIdentifierValue(groupClaims['Group.identifier']), 'urn:uuid:00000000-0000-4000-8000-000000000001')
  assert.deepEqual(readEmergencySubjectReferences(groupClaims), ['Patient/animal-alpha', 'Patient/animal-beta'])
  assert.equal(serviceRequestEntry.claims['ServiceRequest.code'], 'https://example.invalid/fhir/CodeSystem/emergency-assistance|emergency-care')
  assert.equal(serviceRequestEntry.claims['ServiceRequest.code-text'], 'Emergency care')
  assert.equal(serviceRequestEntry.claims['ServiceRequest.subject'], 'Group/emergency-subjects')
  assert.equal(serviceRequestEntry.claims['ServiceRequest.performer'], 'HealthcareService/emergency-care')
  assert.equal(serviceRequestEntry.claims['ServiceRequest.code-system'], undefined)
  assert.equal(serviceRequestEntry.claims['ServiceRequest.code-display'], undefined)
  assert.equal(serviceRequestEntry.claims['ServiceRequest.soschain-member-subject'], undefined)
})

test('rejects an empty emergency Group instead of creating an unusable snapshot', () => {
  assert.throws(() => buildEmergencyGroupClaims({
    identifier: 'urn:uuid:00000000-0000-4000-8000-000000000001',
    displayName: 'Emergency subjects', groupType: 'animal', memberSubjectReferences: [],
  }), /emergency_group_member_required/)
})
