// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SubjectEncounterAccessViews,
  SubjectEncounterReadScopes,
  buildSubjectEncounterAccessConsent,
} from '../dist/subject-encounter-access.js'
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js'

const subjectReference = `Patient/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const memberReference = `RelatedPerson/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`
const grantedAt = REPOSITORY_SAFE_EXAMPLES.organizationScopedResources.slotStart

test('separates current location, open encounters and the complete encounter history', () => {
  const current = buildSubjectEncounterAccessConsent({
    consentId: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
    subjectReference,
    memberReference,
    memberRole: 'family-member',
    view: SubjectEncounterAccessViews.CurrentLocation,
    grantedAt,
  })
  const open = buildSubjectEncounterAccessConsent({
    consentId: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
    subjectReference,
    memberReference,
    memberRole: 'family-member',
    view: SubjectEncounterAccessViews.OpenEncounters,
    grantedAt,
  })
  const history = buildSubjectEncounterAccessConsent({
    consentId: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
    subjectReference,
    memberReference,
    memberRole: 'family-member',
    view: SubjectEncounterAccessViews.FullHistory,
    grantedAt,
  })

  assert.equal(current.projection, 'current-leaf')
  assert.deepEqual(current.scopes, [SubjectEncounterReadScopes.InProgressEncounter])
  assert.deepEqual(open.scopes, [
    SubjectEncounterReadScopes.InProgressEncounter,
    SubjectEncounterReadScopes.OnHoldEncounter,
  ])
  assert.deepEqual(history.scopes, [
    SubjectEncounterReadScopes.AllEncounters,
    SubjectEncounterReadScopes.AllEncounterHistory,
  ])
  assert.equal(history.authorization.resource.meta.claims['Consent.action'], history.scopes.join(','))
})

test('binds an active read grant to one exact subject and RelatedPerson without using Group membership as authority', () => {
  const result = buildSubjectEncounterAccessConsent({
    consentId: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
    subjectReference,
    memberReference,
    memberRole: 'family-member',
    view: SubjectEncounterAccessViews.FullHistory,
    grantedAt,
  })

  assert.equal(result.authorization.resource.meta.claims['Consent.subject'], subjectReference)
  assert.equal(result.authorization.resource.meta.claims['Consent.actor-identifier'], memberReference)
  assert.equal(result.authorization.resource.meta.claims['Consent.status'], 'active')
  assert.equal(JSON.stringify(result).includes('Group.member'), false)
})

test('rejects a professional, a non-Patient subject and an unsupported view', () => {
  const input = {
    consentId: REPOSITORY_SAFE_EXAMPLES.resourceUuid,
    subjectReference,
    memberReference,
    memberRole: 'family-member',
    view: SubjectEncounterAccessViews.OpenEncounters,
    grantedAt,
  }
  assert.throws(() => buildSubjectEncounterAccessConsent({
    ...input,
    memberReference: `PractitionerRole/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`,
  }), /subject_encounter_member_reference_invalid/)
  assert.throws(() => buildSubjectEncounterAccessConsent({
    ...input,
    subjectReference: `Group/${REPOSITORY_SAFE_EXAMPLES.resourceUuid}`,
  }), /subject_encounter_subject_reference_invalid/)
  assert.throws(() => buildSubjectEncounterAccessConsent({
    ...input,
    view: 'recent',
  }), /subject_encounter_access_view_invalid/)
})
