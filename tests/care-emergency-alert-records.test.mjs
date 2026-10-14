// Flow contract: 1) validate an Appointment-to-Encounter transition, 2) validate resilient emergency intake without transport secrets, 3) freeze an authorized alert cohort, and 4) audit every delivery only after current eligibility, exclusion, Consent and channel checks.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  freezeGovernedAlertCohort,
  normalizeCareJourneyTransition,
  normalizeEmergencyIntake,
  normalizeGovernedAlertCampaign,
  recordGovernedAlertDelivery,
} from '../dist/care-emergency-alert-records.js'
import { REPOSITORY_SAFE_EXAMPLES } from '../dist/repository-privacy.js'

test('normalizes one idempotent fulfilled-Appointment to Encounter transition intent', () => {
  const careJourneyTransition = normalizeCareJourneyTransition({
    idempotencyKey: 'appointment-fulfilled-one', appointmentReference: 'Appointment/appointment-one',
    encounterEntryId: 'encounter-one', subjectReference: 'Patient/animal-one',
    serviceProviderReference: 'Organization/hospital-one', locationReference: 'Location/admission',
    occurredAt: '2026-09-26T08:00:00Z',
  })
  assert.equal(careJourneyTransition.appointmentReference, 'Appointment/appointment-one')
  assert.equal(careJourneyTransition.locationReference, 'Location/admission')
  assert.equal('recipientEndpoint' in careJourneyTransition, false)
})

test('normalizes emergency intake while keeping triage and callback transport separate', () => {
  const emergencyIntake = normalizeEmergencyIntake({
    idempotencyKey: 'emergency-request-one', serviceRequestEntryId: 'service-request-one',
    triageTaskEntryId: 'triage-task-one', subjectReference: 'Patient/animal-one',
    requesterReference: 'RelatedPerson/requester-one', targetServiceReference: 'HealthcareService/emergency-one',
    triageOwnerReference: 'Group/dispatch-one', jurisdiction: 'CA-BC', receivedAt: '2026-09-26T09:00:00Z',
    communicationThreadId: 'thread-one',
  })
  assert.equal(emergencyIntake.targetServiceReference, 'HealthcareService/emergency-one')
  assert.equal(emergencyIntake.triageOwnerReference, 'Group/dispatch-one')
  assert.equal('phone' in emergencyIntake, false)
  assert.equal('turnCredentials' in emergencyIntake, false)

  const organizationEmergencyIntake = normalizeEmergencyIntake({
    ...emergencyIntake,
    idempotencyKey: 'emergency-request-organization',
    targetServiceReference: 'Organization/emergency-hospital-one',
  })
  assert.equal(organizationEmergencyIntake.targetServiceReference, 'Organization/emergency-hospital-one')

  assert.throws(() => normalizeEmergencyIntake({
    ...emergencyIntake,
    triageOwnerReference: 'Organization/emergency-hospital-one',
  }), /emergency_intake_triage_group_reference_invalid/)

  assert.throws(() => normalizeEmergencyIntake({
    idempotencyKey: 'emergency-request-two', serviceRequestEntryId: 'service-request-two',
    triageTaskEntryId: 'triage-task-two', subjectReference: 'Patient/animal-one',
    requesterReference: 'RelatedPerson/requester-one', targetServiceReference: 'HealthcareService/emergency-one',
    triageOwnerReference: 'Group/dispatch-one', jurisdiction: 'CA-BC', receivedAt: '2026-09-26T09:00:00Z',
    communicationThreadId: 'thread-two', recipientEndpoint: `${REPOSITORY_SAFE_EXAMPLES.httpsBaseUrl}/private-route`,
  }), /emergency_intake_transport_state_forbidden/)
})

test('freezes a governed blood-donation cohort and requires all current checks before sent audit', () => {
  const alertCampaign = normalizeGovernedAlertCampaign({
    campaignId: 'campaign-one', campaignKind: 'blood-donation', groupDefinitionReference: 'Group/eligible-donors-definition',
    requesterReference: 'Organization/blood-service-one', requiredSubscriptionTopicReference: 'SubscriptionTopic/blood-donation-alerts',
    jurisdiction: 'CA-BC', bloodGroupCodes: ['http://loinc.org|882-1'], minimumDaysSinceLastDonation: 56,
    excludedSubjectReferences: ['Patient/excluded-one'], preferredLanguages: ['en-CA', 'fr-CA'],
  })
  const alertCohortSnapshot = freezeGovernedAlertCohort({
    campaign: alertCampaign, snapshotGroupReference: 'Group/campaign-one-snapshot',
    evaluatedAt: '2026-09-26T10:00:00Z', evaluationFingerprint: 'sha256:cohort-one',
    eligibleSubjectReferences: ['Patient/donor-one', 'Patient/donor-two', 'Patient/donor-one'],
  })
  assert.deepEqual(alertCohortSnapshot.eligibleSubjectReferences, ['Patient/donor-one', 'Patient/donor-two'])
  assert.throws(() => recordGovernedAlertDelivery({
    campaignId: alertCampaign.campaignId, snapshotGroupReference: alertCohortSnapshot.snapshotGroupReference,
    recipientReference: 'Patient/donor-one', communicationReference: 'Communication/delivery-one',
    evaluatedAt: '2026-09-26T10:01:00Z', eligibilityCurrent: true, exclusionCurrent: true,
    consentReference: undefined, channelAuthorizationReference: 'Consent/channel-one', outcome: 'sent',
  }), /alert_delivery_consent_required/)

  const alertDeliveryAudit = recordGovernedAlertDelivery({
    campaignId: alertCampaign.campaignId, snapshotGroupReference: alertCohortSnapshot.snapshotGroupReference,
    recipientReference: 'Patient/donor-one', communicationReference: 'Communication/delivery-one',
    evaluatedAt: '2026-09-26T10:01:00Z', eligibilityCurrent: true, exclusionCurrent: true,
    consentReference: 'Consent/campaign-one', channelAuthorizationReference: 'Consent/channel-one', outcome: 'sent',
  })
  assert.equal(alertDeliveryAudit.outcome, 'sent')
})

test('supports a public-risk campaign through governed FHIR SearchParameter criteria without donor-only fields', () => {
  const publicRiskCampaign = normalizeGovernedAlertCampaign({
    campaignId: 'campaign-risk-one', campaignKind: 'public-risk',
    groupDefinitionReference: 'Group/public-risk-definition', requesterReference: 'Organization/public-health-one',
    requiredSubscriptionTopicReference: 'SubscriptionTopic/public-risk-alerts', jurisdiction: 'CA-BC',
    eligibilityCriteria: [{ resourceType: 'Condition', searchParameter: 'code', value: 'http://snomed.info/sct|840539006' }],
    excludedSubjectReferences: [], preferredLanguages: ['en-CA'],
  })
  assert.equal(publicRiskCampaign.campaignKind, 'public-risk')
  assert.deepEqual(publicRiskCampaign.eligibilityCriteria, [{
    resourceType: 'Condition', searchParameter: 'code', value: 'http://snomed.info/sct|840539006',
  }])
  assert.equal(publicRiskCampaign.minimumDaysSinceLastDonation, undefined)

  assert.throws(() => normalizeGovernedAlertCampaign({
    campaignId: 'campaign-invalid', campaignKind: 'unknown',
    groupDefinitionReference: 'Group/public-risk-definition', requesterReference: 'Organization/public-health-one',
    requiredSubscriptionTopicReference: 'SubscriptionTopic/public-risk-alerts', jurisdiction: 'CA-BC',
    eligibilityCriteria: [{ resourceType: 'Condition', searchParameter: 'code', value: 'http://snomed.info/sct|840539006' }],
    excludedSubjectReferences: [], preferredLanguages: ['en-CA'],
  }), /alert_campaign_kind_invalid/)
})
